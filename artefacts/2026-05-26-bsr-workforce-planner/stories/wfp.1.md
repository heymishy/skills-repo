## Story: Ingest workforce roster from per-group xlsx files

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-data-foundation.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Last revised:** 2026-05-27

**Data model correction applied:** AC1 updated (standard person schema now includes `teamId` field derived from squad; teams.json noted as companion output); AC7 added (teams.json production requirement); AC8 added (unallocated person warning requirement).

## User Story

As a **Head of Engineering**,
I want to ingest per-group xlsx workforce files into structured JSON roster files using a single skill invocation,
So that I have a consolidated, machine-readable workforce dataset that downstream skills and the planning dashboard can query without manual xlsx cross-referencing.

## Benefit Linkage

**Metric moved:** M1 — Workforce + Initiative Reconciliation Time
**How:** Without a machine-readable roster, `workforce-map` cannot run and M1 cannot be measured. This story produces `workforce/roster.json` — the prerequisite that makes the sub-10-minute reconciliation target achievable at all.

## Architecture Constraints

- Plain Node.js, CommonJS (`require`) — no TypeScript, no transpilation. Consistent with all scripts in this repo (architecture-guardrails.md).
- No external npm dependencies that are not already in `package.json` — the xlsx parsing library must be an existing dependency or one added with operator approval.
- Skill is a SKILL.md file under `.github/skills/workforce-intake/` — the implementation (Node.js runner) lives under `src/` or a `workforce/` scripts directory, not inline in the SKILL.md.
- Output files (`workforce/roster.json`, `workforce/[group].json`) are committed to the repo. They are not `.gitignore`d — the repo is private and IAM-gated (discovery PII decision).

## Dependencies

- **Upstream:** None — this is the root story in the feature.
- **Downstream:** wfp.2 (workforce-update) and wfp.3 (workforce-map) both depend on the roster.json format produced by this story.

## Acceptance Criteria

**AC1:** Given a product group xlsx file and a `workforce/schema-map/[group].json` config that maps column names to standard fields, when I invoke `workforce-intake --group [name] --file [path]`, then `workforce/[group].json` is created or overwritten with all person records normalised to the standard schema: `{ name, team, squad, teamId, productGroup, role, title, employmentType, startDate, endDate, skills }` — with `null` for any field not present in the source file. The `teamId` field is populated by kebab-casing the person's `squad` value (e.g. squad "Platform API" → `teamId: "platform-api"`); persons with a null or blank `squad` receive `teamId: null`.

**AC2:** Given I invoke `workforce-intake --group [name]` for each of the 5 product groups (or in a single invocation with `--all`), when all groups complete, then `workforce/roster.json` is created or overwritten containing the merged set of all person records across all ingested groups, with each record including a `productGroup` field. Records with the same `name` and `productGroup` combination are deduplicated (last-write wins per group file).

**AC3:** Given a product group xlsx has a column named "Employee Name" and the schema-map for that group contains `{ "Employee Name": "name" }`, when I invoke `workforce-intake` for that group, then the `name` field in the output JSON is populated from the "Employee Name" column — not left null.

**AC4:** Given a person record in the xlsx has no end date (permanent employee), when I ingest the file, then the `endDate` field in the output JSON is `null` (not omitted, not an empty string).

**AC5:** Given a successful ingestion, when I inspect the output, then a `workforce/cost-model.json` file is created if it does not already exist. The seed file contains one entry per unique `role` value found in the roster, each with a placeholder structure: `{ "role": "[role name]", "quarterlyRateNZD": null, "annualRateNZD": null }`. If `cost-model.json` already exists it is not overwritten.

> **Operator prerequisite:** The seed file is created with `null` rates. Before running `workforce-map` for the first time, the operator must edit `workforce/cost-model.json` and populate each role's `quarterlyRateNZD` value. Any role with a `null` rate will contribute $0 to computed cost totals and generate a warning. Running `workforce-map` with an unpopulated cost model is valid but will produce zero-cost outputs for all roles until rates are filled in.

**AC6:** Given an xlsx file has rows with no value in the name column (blank rows), when I ingest the file, then those rows are silently skipped and do not appear in the output JSON.

**AC7:** Given a successful ingestion of one or more product groups, when the skill completes, then `workforce/teams.json` is created or overwritten. Each unique non-blank `squad` value found across all ingested person records produces one team entry: `{ "teamId": "<kebab-squad>", "name": "<squad verbatim>", "productGroup": "<most common productGroup across members>", "lead": null, "type": null, "members": ["<person name>", ...] }`. The `members` array contains all non-retired person names whose squad value matches. The skill prints to stdout: "Produced [N] team entries in workforce/teams.json". If `workforce/teams.json` already exists and the operator has manually set `lead` or `type` on any entry, those fields are preserved on re-ingestion (merged, not overwritten) for teams whose `teamId` matches an existing entry.

**AC8:** Given a successful ingestion, when any person records have a null or blank `squad` field, then those people are included in `workforce/roster.json` with `teamId: null` and are also written to `workforce/unallocated.json` as an array of full person records. The skill prints to stdout: "Unallocated (no squad): [N] people — see workforce/unallocated.json". If all persons have squad assignments, `unallocated.json` is written as an empty array `[]`. The unallocated list is not an error — overhead and shared-service roles commonly lack a squad assignment.

## Out of Scope

- HR system, payroll system, or Active Directory integration — JSON files in repo are the only data store for Phase 1.
- xlsx schema validation or required-field enforcement — if a field is absent from the sheet and not in the schema-map, the record is included with `null` for that field. No error is raised for missing optional fields.
- Merging or deduplicating records across product groups when the same person appears in two groups — if they do, both records are included (with distinct `productGroup` values). Cross-group deduplication is a Phase 2 consideration.
- Automated or scheduled re-ingestion — operator-initiated only.

## NFRs

- **Performance:** Ingestion of a 200-row xlsx file completes in under 10 seconds on a standard developer laptop.
- **Security:** No person data is written to stdout or logs beyond counts (e.g. "Ingested 42 records"). Full record data appears only in the output JSON files.
- **Integrity:** If any file write fails mid-ingestion, the partially-written file is removed and the previously-existing file (if any) is preserved. The skill must not leave a truncated JSON file.

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
