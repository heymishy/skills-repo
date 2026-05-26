# DoR Contract — wfp.1 Ingest workforce roster from per-group xlsx files

**Story:** wfp.1
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27

---

## What will be built

- `src/workforce/intake.js` — Node.js CommonJS module with exported functions:
  - `normaliseRecord(row, schemaMap)` — maps xlsx row object to standard person schema; missing fields become `null`
  - `ingestGroup(groupName, filePath, schemaMap)` — reads xlsx at `filePath`, applies schemaMap, skips blank-name rows, returns array of normalised records; writes `workforce/[group].json`
  - `seedCostModel(groupPath, costModelPath)` — creates `workforce/cost-model.json` with one entry per unique role if it does not already exist; no-op if file exists
  - `mergeRoster(groupFiles, rosterPath)` — reads all group files, merges into `workforce/roster.json`; deduplicates on `name + productGroup`
- `.github/skills/workforce-intake/SKILL.md` — CLI skill file for `workforce-intake --group [name] --file [path]` and `--all` invocations
- `workforce/schema-map/` directory convention documented in SKILL.md

## What will NOT be built

- HR/payroll/Active Directory integration
- xlsx schema validation or required-field enforcement
- Cross-group deduplication (same person in two groups → two records)
- Automated/scheduled re-ingestion

## AC verification table

| AC | Verified by | Test ID |
|----|-------------|---------|
| AC1 — standard schema fields; null for missing | Unit: `normaliseRecord` standard fields test | wfp1-T1 |
| AC2 — roster.json merged; dedup same name+group | Unit: `mergeRoster` dedup test | wfp1-T2, wfp1-T3 |
| AC3 — schemaMap column name override | Unit: `normaliseRecord` with schemaMap | wfp1-T4 |
| AC4 — null endDate for permanent | Unit: `normaliseRecord` null endDate | wfp1-T5 |
| AC5 — cost-model.json seeded; not overwritten | Unit: `seedCostModel` new-file + existing-file | wfp1-T6, wfp1-T7 |
| AC6 — blank name rows skipped | Unit: `ingestGroup` blank row fixture | wfp1-T8 |

## Assumptions

- An xlsx-parsing library is already in `package.json` or will be added with operator approval before first task
- `workforce/` directory exists in the repo; output files are committed

## Required touchpoints (MUST NOT be in out-of-scope list)

- `src/workforce/intake.js` — new file
- `.github/skills/workforce-intake/SKILL.md` — new file
- `tests/check-wfp1-intake.js` — new file
- `package.json` — add test script entry

## Out-of-scope constraints (MUST NOT touch)

- `src/workforce/update.js` — that is wfp.2 scope
- `src/workforce/map.js` — that is wfp.3/wfp.4 scope
- `dashboards/workforce.html` — that is wfp.5–wfp.8 scope
- Any existing test file other than `tests/check-wfp1-intake.js`

## Schema dependencies

No upstream pipeline-state dependencies declared.
