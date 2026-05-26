# Definition of Ready — Map workforce to initiatives (core direct-allocation)

**Story:** wfp.3
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Map workforce to initiatives (core direct-allocation)
**Review:** PASS — wfp.3, no HIGH findings
**Test plan:** 17 tests covering 6 ACs + 2 NFR checks
**Verification script:** 9 scenarios (wfp.3-verification.md)

---

## Step 2 — Contract Proposal

**What will be built:**
- `src/workforce/map.js` exporting core functions: `loadRoster(rosterPath)`, `loadCostModel(costModelPath)`, `loadPortfolioItem(slug, portfolioDir)`, `processDirectAllocation(entry, roster, costModel)`, `computeFTEDelta(computedFTE, claimedFTE)`, `writeInitiativeMap(entries, outputPath)`, top-level `run(inputPath, options)` CLI entry point
- `.github/skills/workforce-map/SKILL.md` (CLI skill) — `workforce-map` invocation
- `workforce/initiative-map.json` output file convention

**What will NOT be built:**
- Profile-match or net-new allocation modes — wfp.4 scope
- Dashboard tab rendering — wfp.5+ scope
- Multi-team rollup entries — wfp.8 scope

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — direct allocation: people summed to computedFTE; cost computed | `processDirectAllocation` unit test | Unit |
| AC2 — portfolio slug match: claimedFTE/claimedCost from portfolio file | `loadPortfolioItem` + delta unit test | Unit |
| AC3 — unknown portfolio slug: null claimedFTE, warning to stderr | `processDirectAllocation` unknown slug test | Unit |
| AC4 — missing person in roster: warning, contribution = 0 | Roster lookup missing-person test | Unit |
| AC5 — initiative-map.json written with all required fields | `writeInitiativeMap` integration test | Integration |
| AC6 — no cost-model entry for role: cost contribution = 0; warning | `loadCostModel` null rate test | Unit |

**Assumptions:**
- wfp.1 is DoD-complete (roster.json exists)
- `workforce/cost-model.json` is populated with rates
- `portfolio/[slug].json` files exist for each initiative to be tracked

**Estimated touch points:**
- Files: `src/workforce/map.js` (new), `.github/skills/workforce-map/SKILL.md` (new), `tests/check-wfp3-map-core.js` (new)

---

## Step 3 — Contract review

✅ **Contract review passed** — implementation aligns with all 6 ACs. All ACs covered by unit or integration tests.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | ✅ PASS | "As a Head of Engineering, I want … So that …" |
| H2 — ≥3 ACs in Given / When / Then | ✅ PASS | 6 ACs, all in GWT format |
| H3 — every AC has ≥1 test | ✅ PASS | All 6 ACs covered in test plan |
| H4 — out-of-scope populated | ✅ PASS | Profile-match/net-new, dashboard, rollup all explicit out-of-scope |
| H5 — benefit linkage to named metric | ✅ PASS | M1 and M2 |
| H6 — complexity rated | ✅ PASS | Rating: 2 |
| H7 — no unresolved HIGH findings | ✅ PASS | Review PASS, 0 HIGH findings |
| H8 — no uncovered ACs | ✅ PASS | All 6 ACs covered |
| H8-ext — cross-story schema check | ✅ PASS | Upstream: wfp.1 — no pipeline-state schema field dependency |
| H9 — architecture constraints populated | ✅ PASS | Plain Node.js, CommonJS, portfolio files read-only |
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
| W1 — NFRs populated or "None" | ✅ No warning — Performance + Security + Integrity NFRs present |
| W2 — scope stability declared | ✅ No warning — Stable |
| W3 — MEDIUM review findings acknowledged | ✅ No warning — 0 MEDIUM findings |
| W4 — verification script reviewed by domain expert | ⚠️ Warning — script not yet reviewed by a domain expert |
| W5 — no UNCERTAIN items in test plan | ✅ No warning |

**W4 acknowledgement:** Internal engineering tool, low risk. Operator proceeds.

---

## Oversight level

**Low** — from parent epic wfp-reconciliation-engine.md. No sign-off required.

---

## Coding Agent Instructions

### Story
Map workforce to initiatives (core direct-allocation) — wfp.3

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.3-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.3-test-plan.md`
17 tests — all must pass before this story is considered complete.

### Test file
`tests/check-wfp3-map-core.js` — add to `npm test` chain in `package.json`.

### What to build
1. `src/workforce/map.js` — exports: `loadRoster`, `loadCostModel`, `loadPortfolioItem`, `processDirectAllocation`, `computeFTEDelta`, `writeInitiativeMap`, `run`.
2. `.github/skills/workforce-map/SKILL.md` — CLI skill definition.
3. `tests/check-wfp3-map-core.js` — all tests RED before implementation.
4. Wire `node tests/check-wfp3-map-core.js` into `package.json` `test` script.

### Dependencies
wfp.1 must be DoD-complete before implementation begins.

### Definition of done for this story
- `node tests/check-wfp3-map-core.js` exits 0 with 17 passing
- `npm test` exits 0
- `workforce/initiative-map.json` produced from a sample invocation

### Proceed: Yes

---

✅ **Definition of ready: PROCEED — Map workforce to initiatives (core direct-allocation) (wfp.3)**
