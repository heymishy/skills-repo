## Story: Add `skills init` command for atomic feature initialisation

**Epic reference:** `artefacts/2026-05-24-governance-platform-architecture/epics/gpa-epic-01-governance-foundation.md`
**Discovery reference:** `artefacts/2026-05-24-governance-platform-architecture/discovery.md`
**Benefit-metric reference:** `artefacts/2026-05-24-governance-platform-architecture/benefit-metric.md`

## User Story

As a **platform operator** starting a new feature delivery cycle,
I want to run `node bin/skills init <feature-slug> [--description "..."]` to create the discovery-stage feature stub in pipeline-state.json with schema validation and an atomic write,
So that the workaround of hand-crafting a `node -e "..."` script to add a new feature is eliminated — every feature initialisation is atomic, schema-validated, and traceable to the `skills init` command rather than a manual JSON edit.

**G5 evidence from this feature's own delivery:** The agent initialising `2026-05-24-governance-platform-architecture` had to write a raw node script because `skills advance` exits 8 on unknown slug (intentional — it only updates existing features). `skills init` is the deliberate creation path. The benefit is not just process hygiene: schema-validated, atomic feature creation means every future feature stub has the correct shape on first write, with no risk of malformed JSON, missing required fields, or corrupt state file from an interrupted partial write.

## Benefit Linkage

**Metric moved:** M3 — Architecture blind-spot recurrence rate.
**How:** The feature-initialisation workaround (G5) is the third documented blind-spot category. Manual node scripts for JSON editing are a recurring source of schema deviations. Making `skills init` the canonical creation path eliminates this workaround class. The benefit also touches M1: the `skills init` invocation pattern should be documented in trace-contract.md as the canonical feature lifecycle entry point.

## Architecture Constraints

- ADR-011: new CLI module or extension to `bin/skills` — this story artefact satisfies artefact-first.
- Plain Node.js, CommonJS modules, no external npm dependencies (must run with only `node` available).
- **Atomic write mandatory:** write to `.tmp` file, validate JSON, then `fs.renameSync` to target — per copilot-instructions.md "Disk canonicity" and the `skills advance` precedent.
- **Input validation mandatory:** slug input validated against allowlist pattern (`/^[a-z0-9][a-z0-9-]{0,78}[a-z0-9]$/` or equivalent) before any file operation. Traversal guard: `path.resolve(outputPath).startsWith(process.cwd() + path.sep)` before write.
- Checked against `.github/architecture-guardrails.md`.

## Dependencies

- **Upstream:** None.
- **Downstream:** Closes G5. Every future feature initialisation. SC-05 is a Wave 1 story — it does not block any Wave 2 or 3 stories directly, but its existence reduces the friction that produces schema deviations in future features.

## Acceptance Criteria

**AC1:** Given a valid feature slug (alphanumeric lowercase, hyphens allowed, 3–80 chars) and an optional `--description` flag, when `node bin/skills init <slug> [--description "..."]` is run, then pipeline-state.json is updated with a new feature stub containing: `slug` (as provided), `name` (from `--description` if given, otherwise derived from slug by replacing hyphens with spaces and title-casing), `stage: "discovery"`, `health: "green"`, `stories: []`, `metrics: []`, `updatedAt: <today ISO date>` — and the write is atomic (tmp-then-rename pattern; the partial tmp file is not left on disk if the rename fails).

**AC2:** Given a slug that already exists in pipeline-state.json, when `node bin/skills init <slug>` is run, then the command exits with a non-zero exit code and prints a human-readable error (`Error: feature slug '<slug>' already exists in pipeline-state.json`) — pipeline-state.json is not modified.

**AC3:** Given a slug containing characters outside the allowed pattern (spaces, `/`, `..`, `_`, or leading/trailing hyphens), when `node bin/skills init <slug>` is run, then the command exits with a non-zero exit code and prints a validation error describing the problem — pipeline-state.json is not modified.

**AC4:** Given `skills init` creates a new feature stub, when `node scripts/check-pipeline-state-integrity.js` is run immediately after, then it reports 0 failures for the new feature — the stub passes all integrity checks.

**AC5:** Given `node bin/skills` is run without arguments (or with `--help`), when the output is read, then `init <slug> [--description "..."]` is listed as a supported subcommand with a one-line description.

## Out of Scope

- Modifying `skills advance` to accept unknown slugs — that command intentionally exits 8 on unknown slug; `skills init` is the deliberate creation path, and the exit-8 guard is a safety property.
- Adding fields beyond the discovery-stage stub — subsequent pipeline stages add their own fields via `skills advance`.
- Creating artefact directories (`artefacts/<slug>/`) — the command writes only to pipeline-state.json; the operator creates the artefact directory manually or via a future story.
- GUI or web UI integration — CLI only.

## NFRs

- **Atomicity:** Write must use tmp-file-then-rename pattern; no partial state on failure.
- **No external npm dependencies.**
- **Input validation:** slug allowlist pattern validated before any file operation; path traversal guard on output path.
- **Exit codes:** 0 on success, non-zero (1 or 2) on validation failure or conflict.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
