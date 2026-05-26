# Definition of Ready — Ingest workforce roster from per-group xlsx files

**Story:** wfp.1
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Ingest workforce roster from per-group xlsx files
**Review:** PASS — wfp.1, no HIGH findings
**Test plan:** 18 tests covering 6 ACs + 2 NFR checks
**Verification script:** 10 scenarios (wfp.1-verification.md)

---

## Step 2 — Contract Proposal

**What will be built:**
- `src/workforce/intake.js` exporting functions: `normaliseRecord(row, schemaMap)`, `ingestGroup(groupName, filePath, schemaMap)`, `seedCostModel(groupPath, costModelPath)`, `mergeRoster(groupFiles, rosterPath)`
- `.github/skills/workforce-intake/SKILL.md` (CLI skill file) — operator-facing entry point for `workforce-intake` command
- `workforce/schema-map/[group].json` convention documented in SKILL.md

**What will NOT be built:**
- HR/payroll/Active Directory integration — out of scope
- xlsx schema validation or required-field enforcement — out of scope; missing optional fields become null
- Cross-group deduplication — out of scope; same person in two groups produces two records
- Automated/scheduled re-ingestion — operator-initiated only

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — normalise record to standard schema | `normaliseRecord` unit test: standard fields present; missing fields null | Unit |
| AC2 — roster.json merged with productGroup; dedup same name+group | `mergeRoster` unit test; dedup test | Unit |
| AC3 — column name mapping applied | `normaliseRecord` with schemaMap override; output name field populated | Unit |
| AC4 — null endDate for permanent employees | `normaliseRecord` null end-date test | Unit |
| AC5 — cost-model.json seeded with unique roles; not overwritten if exists | `seedCostModel` unit tests | Unit |
| AC6 — blank name rows silently skipped | `ingestGroup` with blank row in fixture | Unit |

**Assumptions:**
- An xlsx-parsing library (e.g. `xlsx` / `exceljs`) is already in `package.json` or will be added with operator approval before the first coding task
- The operator will populate `workforce/cost-model.json` rates before running `workforce-map`
- `workforce/` directory exists in the repo; output files are committed

**Estimated touch points:**
- Files: `src/workforce/intake.js` (new), `.github/skills/workforce-intake/SKILL.md` (new), `workforce/schema-map/` directory (new), `tests/check-wfp1-intake.js` (new)
- Services: None
- APIs: None (local file system only)

---

## Step 3 — Contract review

✅ **Contract review passed** — proposed implementation aligns with all 6 ACs. All ACs verified by unit tests on exported functions. No CSS-layout-dependent gaps.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | ✅ PASS | "As a Head of Engineering, I want … So that …" |
| H2 — ≥3 ACs in Given / When / Then | ✅ PASS | 6 ACs, all in GWT format |
| H3 — every AC has ≥1 test | ✅ PASS | All 6 ACs covered in test plan |
| H4 — out-of-scope populated | ✅ PASS | 4 explicit out-of-scope items |
| H5 — benefit linkage to named metric | ✅ PASS | M1 — Workforce + Initiative Reconciliation Time |
| H6 — complexity rated | ✅ PASS | Rating: 2 |
| H7 — no unresolved HIGH findings | ✅ PASS | Review PASS, 0 HIGH findings |
| H8 — no uncovered ACs | ✅ PASS | All 6 ACs covered; 0 untested gaps |
| H8-ext — cross-story schema check | ✅ PASS | Dependencies: None — schema check not required |
| H9 — architecture constraints populated | ✅ PASS | Plain Node.js, CommonJS, no new external deps, output files committed |
| H-E2E — CSS-layout-dependent gaps | ✅ PASS | No CSS-layout-dependent ACs |
| H-NFR — NFR profile exists | ✅ PASS | `nfr-profile.md` present |
| H-NFR2 — compliance NFRs have sign-off | ✅ PASS | No regulatory clause NFRs |
| H-NFR3 — data classification not blank | ✅ PASS | Internal / Private — in nfr-profile.md |
| H-NFR-profile — NFR profile present for stories with NFRs | ✅ PASS | `nfr-profile.md` exists |
| H-GOV — Approved By populated | ✅ PASS | Hamish King — 2026-05-26 |
| H-ADAPTER — injectable adapters wired | ✅ PASS | No injectable adapters introduced |

---

## Warnings

| Check | Result |
|-------|--------|
| W1 — NFRs populated or "None" | ✅ No warning — NFRs present and specific |
| W2 — scope stability declared | ✅ No warning — Stable |
| W3 — MEDIUM review findings acknowledged | ✅ No warning — 0 MEDIUM findings from review |
| W4 — verification script reviewed by domain expert | ⚠️ Warning — script not yet reviewed by a domain expert |
| W5 — no UNCERTAIN items in test plan | ✅ No warning — no UNCERTAIN items |

**W4 acknowledgement:** Risk is low — this is an internal engineering tool with no external users. Operator proceeds without domain expert review of verification script.

---

## Oversight level

**Low** — from parent epic wfp-data-foundation.md. No sign-off required.

---

## Standards injection

Domain tags: not declared. Standards injection: skipped.

---

## Coding Agent Instructions

### Story
Ingest workforce roster from per-group xlsx files — wfp.1

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.1-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.1-test-plan.md`
18 tests — all must pass before this story is considered complete.

### Test file
`tests/check-wfp1-intake.js` — add to `npm test` chain in `package.json`.

### What to build
1. `src/workforce/intake.js` — exports: `normaliseRecord(row, schemaMap)`, `ingestGroup(groupName, filePath, schemaMap)`, `seedCostModel(groupPath, costModelPath)`, `mergeRoster(groupFiles, rosterPath)`.
2. `.github/skills/workforce-intake/SKILL.md` — CLI skill definition. The Node.js runner is in `src/workforce/intake.js`.
3. `tests/check-wfp1-intake.js` — unit test file; all tests RED before implementation.
4. Wire `node tests/check-wfp1-intake.js` into `package.json` `test` script.

### Definition of done for this story
- `node tests/check-wfp1-intake.js` exits 0 with 18 passing
- `npm test` exits 0
- `workforce/roster.json` produced from a sample invocation with no PII in stdout

### Proceed: Yes

---

✅ **Definition of ready: PROCEED — Ingest workforce roster from per-group xlsx files (wfp.1)**
