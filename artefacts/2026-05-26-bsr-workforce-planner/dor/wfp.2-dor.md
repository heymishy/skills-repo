# Definition of Ready — Update individual roster records without full re-ingestion

**Story:** wfp.2
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Update individual roster records without full re-ingestion
**Review:** PASS — wfp.2, no HIGH findings
**Test plan:** 15 tests covering 5 ACs + 1 NFR check
**Verification script:** 8 scenarios (wfp.2-verification.md)

---

## Step 2 — Contract Proposal

**What will be built:**
- `src/workforce/update.js` exporting functions: `addRecord(groupName, record, groupPath, rosterPath)`, `editRecord(groupName, personName, fields, groupPath, rosterPath)`, `retireRecord(groupName, personName, endDate, groupPath, rosterPath)` — all atomic (temp-file + rename)
- `.github/skills/workforce-update/SKILL.md` (CLI skill) — `workforce-update --action add|edit|retire …`
- Retired records flagged `retired: true` — not deleted

**What will NOT be built:**
- Bulk update from CSV/JSON batch
- cost-model.json update — manual operator action
- Undo/rollback command — git is the rollback mechanism
- Field value validation beyond structural JSON

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — add record to both group and roster files | `addRecord` unit test with temp fixtures | Unit |
| AC2 — edit fields atomically in both files | `editRecord` unit test; mock write failure to test rollback | Unit |
| AC3 — retire: sets endDate + retired:true; error without --endDate | `retireRecord` unit tests; missing endDate error test | Unit |
| AC4 — unknown name exits non-zero, no file modified | `editRecord` / `retireRecord` not-found test | Unit |
| AC5 — add with duplicate name+group exits non-zero, no file modified | `addRecord` duplicate test | Unit |

**Assumptions:**
- wfp.1 is DoD-complete before implementation begins
- `workforce/roster.json` and `workforce/[group].json` exist before `workforce-update` is invoked

**Estimated touch points:**
- Files: `src/workforce/update.js` (new), `.github/skills/workforce-update/SKILL.md` (new), `tests/check-wfp2-update.js` (new)
- Services: None
- APIs: None

---

## Step 3 — Contract review

✅ **Contract review passed** — proposed implementation aligns with all 5 ACs. Atomic write pattern addresses Integrity NFR.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | ✅ PASS | "As a Head of Engineering, I want … So that …" |
| H2 — ≥3 ACs in Given / When / Then | ✅ PASS | 5 ACs, all in GWT format |
| H3 — every AC has ≥1 test | ✅ PASS | All 5 ACs covered in test plan |
| H4 — out-of-scope populated | ✅ PASS | 4 explicit out-of-scope items |
| H5 — benefit linkage to named metric | ✅ PASS | M1 — Workforce + Initiative Reconciliation Time |
| H6 — complexity rated | ✅ PASS | Rating: 1 |
| H7 — no unresolved HIGH findings | ✅ PASS | Review PASS, 0 HIGH findings |
| H8 — no uncovered ACs | ✅ PASS | All 5 ACs covered; 0 untested gaps |
| H8-ext — cross-story schema check | ✅ PASS | Upstream wfp.1 — no pipeline-state schema field dependency |
| H9 — architecture constraints populated | ✅ PASS | Plain Node.js, CommonJS, atomic writes, retired flag (not delete) |
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

**W4 acknowledgement:** Risk is low — internal engineering tool. Operator proceeds without domain expert review.

---

## Oversight level

**Low** — from parent epic wfp-data-foundation.md. No sign-off required.

---

## Standards injection

Domain tags: not declared. Standards injection: skipped.

---

## Coding Agent Instructions

### Story
Update individual roster records without full re-ingestion — wfp.2

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.2-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.2-test-plan.md`
15 tests — all must pass before this story is considered complete.

### Test file
`tests/check-wfp2-update.js` — add to `npm test` chain in `package.json`.

### What to build
1. `src/workforce/update.js` — exports: `addRecord`, `editRecord`, `retireRecord`. All writes are atomic (write to temp file, rename over target).
2. `.github/skills/workforce-update/SKILL.md` — CLI skill definition.
3. `tests/check-wfp2-update.js` — unit test file; all tests RED before implementation.
4. Wire `node tests/check-wfp2-update.js` into `package.json` `test` script.

### Dependencies
wfp.1 must be DoD-complete before implementation begins.

### Definition of done for this story
- `node tests/check-wfp2-update.js` exits 0 with 15 passing
- `npm test` exits 0
- Atomic write confirmed (no truncated files on simulated failure)

### Proceed: Yes

---

✅ **Definition of ready: PROCEED — Update individual roster records without full re-ingestion (wfp.2)**
