# Definition of Ready — Extended allocation modes: profile-match and net-new

**Story:** wfp.4
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Extended allocation modes: profile-match and net-new
**Review:** PASS — wfp.4, no HIGH findings
**Test plan:** 16 tests covering 5 ACs + 2 NFR checks
**Verification script:** 8 scenarios (wfp.4-verification.md)

---

## Step 2 — Contract Proposal

**What will be built:**
- Extensions to `src/workforce/map.js`: new exported functions `processProfileMatch(entry, roster, costModel)`, `processNetNew(entry, costModel)`, `buildGapReport(results)` — extending the existing `run()` dispatcher to handle `allocationMode: "profile-match"` and `allocationMode: "net-new"`
- No separate file — all new functions go into `src/workforce/map.js` alongside existing wfp.3 functions

**What will NOT be built:**
- Dashboard rendering for profile-match or net-new — wfp.5/wfp.6 scope
- Multi-team rollup — wfp.8 scope
- Cost-model editing

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — profile-match: FTE counted from roster by skills/role criteria | `processProfileMatch` unit test | Unit |
| AC2 — net-new: FTE = required count; cost from cost model | `processNetNew` unit test | Unit |
| AC3 — gap report: roles with 0 profile-match FTE listed | `buildGapReport` unit test | Unit |
| AC4 — mixed mode input: all 3 modes in one file processed correctly | Integration: `run` with fixture containing all 3 modes | Integration |
| AC5 — profile-match: partial skills match — threshold satisfied | `processProfileMatch` partial-match threshold test | Unit |

**Assumptions:**
- wfp.3 is DoD-complete before implementation begins
- `src/workforce/map.js` already exports wfp.3 functions

**Estimated touch points:**
- Files: `src/workforce/map.js` (extend), `tests/check-wfp4-map-extended.js` (new)

---

## Step 3 — Contract review

Contract review passed — extends wfp.3 module cleanly; all ACs tested.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering, I want … So that …" |
| H2 — three or more ACs in Given / When / Then | PASS | 5 ACs, all in GWT format |
| H3 — every AC has at least one test | PASS | All 5 ACs covered in test plan |
| H4 — out-of-scope populated | PASS | Dashboard, rollup, cost-model editing explicit out-of-scope |
| H5 — benefit linkage to named metric | PASS | M1 and M2 |
| H6 — complexity rated | PASS | Rating: 2 |
| H7 — no unresolved HIGH findings | PASS | Review PASS, 0 HIGH findings |
| H8 — no uncovered ACs | PASS | All 5 ACs covered |
| H8-ext — cross-story schema check | PASS | Upstream: wfp.3 — no pipeline-state schema field dependency |
| H9 — architecture constraints populated | PASS | Extends map.js, no new dependencies |
| H-E2E — CSS-layout-dependent gaps | PASS | No CSS-layout-dependent ACs |
| H-NFR — NFR profile exists | PASS | nfr-profile.md present |
| H-NFR2 — compliance NFRs have sign-off | PASS | No regulatory clause NFRs |
| H-NFR3 — data classification not blank | PASS | Internal / Private in nfr-profile.md |
| H-NFR-profile — NFR profile present for stories with NFRs | PASS | nfr-profile.md exists |
| H-GOV — Approved By populated | PASS | Hamish King 2026-05-26 |
| H-ADAPTER — injectable adapters wired | PASS | No injectable adapters introduced |

---

## Warnings

| Check | Result |
|-------|--------|
| W1 — NFRs populated or None | No warning — Performance + Security NFRs present |
| W2 — scope stability declared | No warning — Stable |
| W3 — MEDIUM review findings acknowledged | No warning — 0 MEDIUM findings |
| W4 — verification script reviewed by domain expert | Warning — script not yet reviewed by a domain expert |
| W5 — no UNCERTAIN items in test plan | No warning |

**W4 acknowledgement:** Internal engineering tool, low risk. Operator proceeds.

---

## Oversight level

**Low** — from parent epic wfp-reconciliation-engine.md. No sign-off required.

---

## Coding Agent Instructions

### Story
Extended allocation modes: profile-match and net-new — wfp.4

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.4-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.4-test-plan.md`
16 tests — all must pass before this story is considered complete.

### Test file
`tests/check-wfp4-map-extended.js` — add to `npm test` chain in `package.json`.

### What to build
1. Extend `src/workforce/map.js` with: `processProfileMatch(entry, roster, costModel)`, `processNetNew(entry, costModel)`, `buildGapReport(results)`. Update `run()` dispatcher to route `allocationMode: "profile-match"` and `"net-new"`.
2. `tests/check-wfp4-map-extended.js` — all tests RED before implementation.
3. Wire `node tests/check-wfp4-map-extended.js` into `package.json` `test` script.

### Dependencies
wfp.3 must be DoD-complete before implementation begins.

### Definition of done for this story
- `node tests/check-wfp4-map-extended.js` exits 0 with 16 passing
- `npm test` exits 0
- `workforce/initiative-map.json` produced from a mixed-mode sample invocation

### Proceed: Yes

---

**Definition of ready: PROCEED — Extended allocation modes: profile-match and net-new (wfp.4)**
