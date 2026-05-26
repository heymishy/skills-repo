# DoR Contract — wfp.2 Update individual roster records without full re-ingestion

**Story:** wfp.2
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- `src/workforce/update.js` — Node.js CommonJS module with exported functions:
  - `addRecord(groupName, record, groupPath, rosterPath)` — appends to group file + roster; exits non-zero on duplicate name+group
  - `editRecord(groupName, personName, fields, groupPath, rosterPath)` — updates specified fields atomically in both files; exits non-zero if name not found
  - `retireRecord(groupName, personName, endDate, groupPath, rosterPath)` — sets `endDate` and `retired: true` atomically; exits non-zero if endDate missing or name not found
  - All functions write to a temp file then rename (atomic write pattern)
- `.github/skills/workforce-update/SKILL.md` — CLI skill definition

## What will NOT be built

- Bulk update from CSV/JSON batch file
- Updating `workforce/cost-model.json` — manual operator action
- Undo/rollback command (git is the mechanism)
- Field value validation beyond structural JSON validity

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — add record; both files updated, valid JSON | Unit: `addRecord` happy path | wfp2-T1 |
| AC2 — edit fields atomically; rollback on write fail | Unit: `editRecord` happy path + mocked write failure | wfp2-T2, wfp2-T3 |
| AC3 — retire sets endDate + retired:true; error without endDate | Unit: `retireRecord` happy path + missing endDate test | wfp2-T4, wfp2-T5 |
| AC4 — unknown name: non-zero exit, no file modified | Unit: `editRecord` + `retireRecord` not-found tests | wfp2-T6, wfp2-T7 |
| AC5 — add duplicate name+group: non-zero exit, no file modified | Unit: `addRecord` duplicate test | wfp2-T8 |

## Assumptions

- wfp.1 is DoD-complete before implementation begins
- `workforce/roster.json` and `workforce/[group].json` exist before `workforce-update` is invoked

## Required touchpoints (MUST NOT be in out-of-scope list)

- `src/workforce/update.js` — new file
- `.github/skills/workforce-update/SKILL.md` — new file
- `tests/check-wfp2-update.js` — new file
- `package.json` — add test script entry

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/intake.js` — wfp.1 scope
- `src/workforce/map.js` — wfp.3/wfp.4 scope
- `dashboards/workforce.html` — wfp.5–wfp.8 scope
- Any existing test file other than `tests/check-wfp2-update.js`

## Schema dependencies

Upstream: wfp.1. No pipeline-state schema field dependency.
