## Story: Author and maintain workforce-to-initiative allocation assignments

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-reconciliation-engine.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Last revised:** 2026-05-27

**Data model correction applied:** Mode 1 (guided) updated — presents teams as the primary allocation unit (not squads); Mode 2 (file import) updated — `team-id` column added as the primary allocation field; `person-name` is now an optional override; Mode 3 (auto-derive) updated — assigns teams from `workforce/teams.json` instead of grouping by distinct squad values from roster; AC1, AC3, AC6 updated accordingly.

## User Story

As a **Head of Engineering**,
I want to create and maintain `workforce/allocation-input.json` using a guided conversational flow, a supplied xlsx or csv file, or an auto-derived draft from existing repo data,
So that I can bootstrap initiative-to-people assignments without hand-authoring JSON, and keep assignments current as initiatives and roster composition change.

## Benefit Linkage

**Metric moved:** M1 (Workforce + Initiative Reconciliation Time) and M2 (Pre-GM Initiative FTE Cross-Check Coverage)
**How:** `allocation-input.json` is the required operator input for `workforce-map` — without it, wfp.3 and wfp.4 cannot run and M1/M2 cannot be measured. Today this file does not exist and would need to be hand-authored in JSON. This story removes that friction, making the first `workforce-map` invocation achievable in a single planning session rather than requiring a separate JSON authoring exercise.

## Architecture Constraints

- Plain Node.js, CommonJS — consistent with all repo scripts (architecture-guardrails.md).
- No external npm dependencies not already in `package.json`. xlsx parsing uses the same library introduced in wfp.1.
- The skill writes only to `workforce/allocation-input.json`. It does not write to `roster.json`, `initiative-map.json`, or any `portfolio/` file.
- All three modes produce the same output format — a valid `workforce/allocation-input.json` — so `workforce-map` invocation is identical regardless of which authoring mode was used.
- Auto-derive mode reads `portfolio/[slug].json` files and `workforce/roster.json` at fixed paths. No dynamic path construction from user input.
- File import mode column schema is fixed: `initiative-slug`, `person-name`, `product-group`, `scope-label` (matching `allocation-input.json` fields directly). No schema-map config required — columns are identified by header name, case-insensitively.
- Existing `allocation-input.json` is never silently overwritten. All three modes check for an existing file and require explicit `--overwrite` flag or operator confirmation before replacing it.

## Dependencies

- **Upstream:** wfp.1 (workforce-intake) must be DoD-complete — auto-derive and guided modes read `workforce/roster.json` to present available people and squads.
- **Upstream:** `portfolio/[slug].json` files must exist in the repo (produced by `initiative-intake` in the enterprise fork) for auto-derive and guided modes to enumerate initiative slugs. The skill warns and continues if no portfolio files are found, falling back to file-import or manual entry only.
- **Downstream:** wfp.3 (workforce-map core) and wfp.4 (extended modes) consume `allocation-input.json` as their primary operator input.

## Three Authoring Modes

### Mode 1 — Guided conversational (`--mode guided`)

The skill reads all portfolio slugs from `portfolio/` and all teams from `workforce/teams.json`, then iterates through unmapped slugs one at a time in the terminal:

```
Initiative: platform-migration (claims 4.0 FTE, Platform Engineering)
  [1] Assign a team   [2] Assign named people (override)   [3] Skip   [4] Mark as net-new gap
```

For option 1 it lists teams in the matching `productGroup` from `teams.json` and asks which. Selecting a team assigns the team's `teamId` as the primary allocation unit; the full team membership is used for FTE unless the operator also supplies a `people` override via option 2. For option 2 it accepts comma-separated names, validating each against the roster, and records them as the `people` override array (the `teamId` field is set to null for purely individual assignments). For option 4 it prompts for `requiredRole` and `requiredTags`. Skipped slugs are omitted from the output. After all slugs are processed the complete `allocation-input.json` is written.

### Mode 2 — File import (`--mode file --file [path]`)

Reads a supplied `.xlsx` or `.csv` file. Expected columns (header names matched case-insensitively):

| Column | Required | Maps to |
|--------|----------|---------|
| `initiative-slug` | Yes | `allocations[].slug` |
| `team-id` | No* | `allocations[].teamId` |
| `person-name` | No* | `allocations[].people[]` |
| `product-group` | No | `allocations[].productGroup` |
| `scope-label` | No | `allocations[].scopeLabel` |

\* At least one of `team-id` or `person-name` must be present per row; if neither is present, the row is skipped with a warning. `team-id` is the primary allocation unit — when present, its value must match a `teamId` in `workforce/teams.json`. `person-name` is an optional override — when present alongside `team-id`, it names specific individuals from the team rather than the full membership. Multiple rows with the same `initiative-slug` are merged into a single allocation entry: `team-id` values deduplicate by `teamId`; `person-name` values accumulate into a `people` array under the associated team entry.

Rows with a `person-name` value that does not match any record in `roster.json` are included with a warning to stderr — not silently dropped. Rows with a `team-id` value that does not match any entry in `workforce/teams.json` are included with a warning to stderr — not silently dropped (the allocation is written but flagged for review).

Missing optional columns (`product-group`, `scope-label`) are omitted from the output entry rather than written as null.

### Mode 3 — Auto-derive (`--mode auto`)

The skill attempts to infer assignments without operator input:

1. Reads all `portfolio/[slug].json` files and extracts `productGroup` (or equivalent grouping field) from each.
2. Reads `workforce/teams.json` and groups team entries by `productGroup`.
3. For each portfolio slug, finds teams whose `productGroup` matches the initiative's `productGroup`. If exactly one team matches, writes an `allocationMode: "direct"` entry assigning that team (using its `teamId`). If multiple teams match, writes an `allocationMode: "profile-match"` entry with `requiredTags` inferred from the union of skill tags across all members of the matching teams (top 3 by frequency).
4. If no team in `teams.json` matches the initiative's `productGroup`, writes an `allocationMode: "net-new"` entry with `requiredRole: null` and `requiredTags: []` — flagged for operator review.
5. Writes `workforce/allocation-input.json` with a `_autoderived: true` flag at the root and a `_reviewRequired: true` flag on every entry, signalling that the output is a draft for operator confirmation before running `workforce-map`.

Auto-derive does not prompt for input. It prints a summary to stdout: number of direct matches, profile-match entries, and net-new gaps requiring review.

## Acceptance Criteria

**AC1 (guided mode — happy path):** Given `portfolio/` contains at least one slug file and `workforce/teams.json` exists, when I invoke `workforce-assign --mode guided`, then the skill presents each unmapped portfolio slug in turn with its claimed FTE and product group, accepts team or named-person assignments interactively (presenting teams from `teams.json` for option 1), and after all slugs are processed (or skipped) writes `workforce/allocation-input.json` containing one entry per non-skipped slug in valid `allocation-input.json` format. Each team-assigned entry includes `teamId` as the primary field; `people` is included only when the operator explicitly supplied named overrides.

**AC2 (guided mode — validation):** Given I enter a person name in guided mode that does not match any record in `roster.json`, then the skill prints "Person not found in roster: [name] — check spelling or run workforce-intake first" and re-prompts for that initiative without writing a partial entry.

**AC3 (file import — xlsx/csv):** Given I invoke `workforce-assign --mode file --file allocations.xlsx` and the file contains rows with `initiative-slug` and at least one of `team-id` or `person-name` columns, when the skill runs, then `workforce/allocation-input.json` is written with one entry per unique `initiative-slug` value. Entries with a `team-id` value have `teamId` set as the primary field; entries with `person-name` but no `team-id` have their names accumulated into a `people` array. Rows sharing the same slug are merged into a single entry.

**AC4 (file import — unmatched person warning):** Given the import file contains a `person-name` value that does not appear in `roster.json`, when the skill processes the file, then a warning is printed to stderr: "Person not in roster: [name] (initiative: [slug]) — included in output; verify roster is current." The entry is still written to `allocation-input.json` — unmatched names are not silently dropped.

**AC5 (file import — missing required column):** Given the import file has no `initiative-slug` column, when the skill runs, then it exits with a non-zero code and prints: "Required column 'initiative-slug' not found in file. Check column headers." No output file is written.

**AC6 (auto-derive — draft output):** Given I invoke `workforce-assign --mode auto` and both `portfolio/` slugs and `workforce/teams.json` exist, when the skill runs, then `workforce/allocation-input.json` is written with `_autoderived: true` at the root and `_reviewRequired: true` on every entry. Each auto-derived direct-mode entry uses `teamId` (not a `people` array) as its primary allocation field. The skill prints a summary: "Auto-derived [N] direct, [N] profile-match, [N] net-new entries. Review allocation-input.json before running workforce-map."

**AC7 (auto-derive — no portfolio files):** Given `portfolio/` is empty or contains no `.json` files, when I invoke `workforce-assign --mode auto`, then the skill exits with a non-zero code and prints: "No portfolio files found in portfolio/. Run initiative-intake (enterprise fork) first, or use --mode guided or --mode file."

**AC8 (overwrite protection — all modes):** Given `workforce/allocation-input.json` already exists, when I invoke `workforce-assign` in any mode without the `--overwrite` flag, then the skill exits with a non-zero code and prints: "allocation-input.json already exists. Use --overwrite to replace, or edit the existing file directly." No file is modified.

**AC9 (overwrite with flag):** Given `workforce/allocation-input.json` already exists and I invoke `workforce-assign` with `--overwrite`, then the existing file is replaced atomically (write to temp, rename) after the new content is fully generated. The old file is not modified until the new content is ready.

## Out of Scope

- Merging new assignments into an existing `allocation-input.json` without replacing it — Phase 1 is full-replace only; incremental merge is a Phase 2 consideration.
- A `--mode interactive` browser UI for authoring assignments — the dashboard is read-only per epic constraints; assignment authoring stays in the terminal.
- Validating that a person's skills match an initiative's requirements in guided or file-import modes — that validation is `workforce-map`'s responsibility (profile-match logic in wfp.4), not the assignment authoring step.
- Reading allocation assignments from Jira, Confluence, or any external system — file and conversational inputs only for Phase 1.
- Generating `parentSlug` and `scopeLabel` values in auto-derive mode — rollup decomposition (wfp.8) requires explicit operator intent; auto-derive produces flat standalone entries only.

## NFRs

- **Performance:** File import mode processes a 500-row xlsx in under 10 seconds. Auto-derive across 30 portfolio slugs and a 200-person roster completes in under 15 seconds.
- **Security:** No PII is written to stdout or logs beyond names already present in the input file or roster. `allocation-input.json` is committed to the private repo under the same PII posture established in discovery.
- **Integrity:** All three modes use atomic file write (write to temp, rename over target). A failed or interrupted write does not corrupt an existing `allocation-input.json`.
- **Usability (guided mode):** Each prompt displays the initiative slug, claimed FTE, and product group before asking for input. The operator is never asked to recall this context from memory.

## Complexity Rating

**Rating:** 3
**Rationale:** Three distinct input modes with separate validation paths, roster and portfolio file reads, xlsx parsing, and atomic write behaviour. Highest complexity in the feature set.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
