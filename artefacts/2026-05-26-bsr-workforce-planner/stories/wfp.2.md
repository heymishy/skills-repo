## Story: Update individual roster records without full re-ingestion

**Epic reference:** artefacts/2026-05-26-bsr-workforce-planner/epics/wfp-data-foundation.md
**Discovery reference:** artefacts/2026-05-26-bsr-workforce-planner/discovery.md
**Benefit-metric reference:** artefacts/2026-05-26-bsr-workforce-planner/benefit-metric.md
**Last revised:** 2026-05-27

**Data model correction applied:** AC6 added (team record add to teams.json); AC7 added (team record edit and retire in teams.json); AC8 added (referential integrity — person assignment to non-existent teamId is rejected).

## User Story

As a **Head of Engineering**,
I want to add, edit, or retire individual roster records without running a full xlsx re-ingestion,
So that the workforce roster stays current between planning cycles — for example when someone joins, leaves, changes role, or moves squad — without the overhead of preparing and re-importing a full group spreadsheet.

## Benefit Linkage

**Metric moved:** M1 — Workforce + Initiative Reconciliation Time
**How:** A stale roster produces incorrect FTE counts in `workforce-map`. This skill ensures the roster can be kept accurate at record granularity, so M1 measurements reflect actual current headcount rather than a snapshot from the last xlsx cycle.

## Architecture Constraints

- Plain Node.js, CommonJS — consistent with all repo scripts (architecture-guardrails.md).
- No external npm dependencies not already in `package.json`.
- Updates must be atomic at the file level: both `workforce/[group].json` and `workforce/roster.json` are updated together or neither is updated. A partial update (one file updated, the other not) is a data integrity failure.
- Retired records must remain in the JSON with a `retired: true` flag — not deleted — so that historical `initiative-map.json` entries referencing those people remain traceable.

## Dependencies

- **Upstream:** wfp.1 (workforce-intake) must be DoD-complete — this story reads and writes the roster.json and per-group JSON files that wfp.1 produces.
- **Downstream:** wfp.3 (workforce-map core) — a stale roster after an update would cause wfp.3 to use incorrect data.

## Acceptance Criteria

**AC1:** Given `workforce/roster.json` and `workforce/[group].json` both exist, when I invoke `workforce-update --action add --group [name] --record '[JSON person object]'`, then the person record is appended to both `workforce/[group].json` and `workforce/roster.json`, and both files remain valid JSON after the write.

**AC2:** Given a person record exists in the roster, when I invoke `workforce-update --action edit --group [name] --name '[person name]' --fields '{"endDate":"2026-09-30"}'`, then the specified fields are updated in both `workforce/[group].json` and `workforce/roster.json` atomically — either both files are updated or neither is (the skill rolls back if either write fails).

**AC3:** Given a person record exists in the roster, when I invoke `workforce-update --action retire --group [name] --name '[person name]' --endDate [ISO-date]`, then the person's record in both files has `endDate` set to the supplied `--endDate` value and `retired: true` added. The record is not deleted from either file. Given I invoke `--action retire` without supplying `--endDate`, then the skill exits with a non-zero code and prints an error: "--endDate is required for retire action (use ISO 8601 format, e.g. 2026-09-30)". The end date is not defaulted to today — the person's actual contractual end date is not the same as the date the skill is run.

**AC4:** Given I invoke `workforce-update` with any action and a `--name` value that does not match any record in the specified product group, then the skill exits with a non-zero code and prints an error message naming the unmatched person. No file is modified.

**AC5:** Given I invoke `workforce-update --action add` with a person record that has the same `name` and `productGroup` as an existing record in the roster, then the skill exits with a non-zero code and prints a conflict message. The operator must use `--action edit` to modify an existing record; `add` does not silently overwrite.

**AC6 (team add):** Given `workforce/teams.json` exists, when I invoke `workforce-update --action add-team --record '{"teamId":"...","name":"...","productGroup":"...","lead":null,"type":null,"members":[]}'`, then the team entry is appended to `workforce/teams.json` atomically and the updated file remains valid JSON. If a team with the same `teamId` already exists, the skill exits with a non-zero code and prints a conflict message naming the duplicate `teamId`. The `teamId` field is required; if absent the skill exits with a non-zero code.

**AC7 (team edit and retire):** Given a team entry with the specified `teamId` exists in `workforce/teams.json`, when I invoke `workforce-update --action edit-team --teamId [id] --fields '{"lead":"Alice","type":"stream-aligned"}'`, then only the specified fields are updated on the matching entry and `workforce/teams.json` is written atomically. When I invoke `workforce-update --action retire-team --teamId [id]`, then the matching team entry has `retired: true` added and is not deleted. Given no entry with the specified `teamId` exists, the skill exits with a non-zero code and prints: "Team not found: [id]".

**AC8 (referential integrity):** Given I invoke `workforce-update --action add` or `--action edit` with a person record that specifies a `teamId` value, when the skill processes the record, then it first checks whether that `teamId` exists as an entry in `workforce/teams.json`. If no matching team entry exists, the skill exits with a non-zero code and prints: "Referential integrity error: teamId '[id]' does not exist in workforce/teams.json. Create the team first with --action add-team." No person record is written when this check fails.

## Out of Scope

- Bulk record updates from a CSV or JSON batch file — single-record operations only for Phase 1.
- Updating the `workforce/cost-model.json` file — cost model edits are a manual operator action (out of scope for this skill).
- Undo or rollback of a previous update — git history is the rollback mechanism; no in-skill undo command.
- Validation of field values beyond structural JSON validity (e.g. checking that `employmentType` is one of a permitted set) — out of scope for Phase 1.

## NFRs

- **Integrity:** Atomic file write behaviour is required (write to a temp file, rename over target) to prevent truncated JSON if the process is interrupted.
- **Security:** No PII is written to stdout or terminal logs beyond confirmation messages (e.g. "Record updated: [name]"). Full record data appears only in the output JSON files.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
