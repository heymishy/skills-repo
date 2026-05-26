# Definition of Ready — Allocation matrix view (Tab 2 — Planning Dashboard)

**Story:** wfp.6
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Allocation matrix view (Tab 2 — Planning Dashboard)
**Review:** PASS — wfp.6, no HIGH findings
**Test plan:** 15 tests covering 5 ACs — 12 unit + 3 E2E
**Verification script:** 8 scenarios (wfp.6-verification.md)

---

## Step 2 — Contract Proposal

**What will be built:**
- Extensions to `dashboards/wfp-functions.js`: `renderAllocationRow(entry)`, `renderAllocationTable(entries)`, `renderAllocationErrorState(message)`. CSS classes `delta-negative` / `delta-ok` introduced for delta colouring.
- `dashboards/workforce.html` Tab 2 (Allocation Matrix) wired up — reads from `workforce/initiative-map.json`.

**What will NOT be built:**
- Tab 3 (Gap Analysis) — separate story
- Tab 4 (Leadership Coverage) — wfp.7 scope
- Tab 5 (Initiative Rollup) — wfp.8 scope
- Editing entries from the browser

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — renders row per initiative with FTE, cost, delta | Unit: `renderAllocationRow` fields test | Unit |
| AC2 — delta-negative class for negative delta | Unit: `renderAllocationRow` negative delta | Unit |
| AC3 — delta-ok class for zero/positive delta | Unit: `renderAllocationRow` positive delta | Unit |
| AC4 — null delta renders "no claim" text; no colour class | Unit: `renderAllocationRow` null delta | Unit |
| AC5 — empty state when no initiatives | Unit: `renderAllocationErrorState`; E2E: empty state check | Unit + E2E |

**Assumptions:**
- wfp.5 is DoD-complete (`dashboards/wfp-functions.js` and `dashboards/workforce.html` exist)
- wfp.3 is DoD-complete (`workforce/initiative-map.json` format established)

**Estimated touch points:**
- Files: `dashboards/wfp-functions.js` (extend), `dashboards/workforce.html` (extend Tab 2), `tests/check-wfp6-allocation-matrix.js` (new), `tests/e2e/wfp6-allocation-matrix.spec.js` (new)

---

## Step 3 — Contract review

Contract review passed — extends established pattern; delta classes introduced; all ACs covered.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering, I want … So that …" |
| H2 — three or more ACs in Given / When / Then | PASS | 5 ACs, all in GWT format |
| H3 — every AC has at least one test | PASS | All 5 ACs covered |
| H4 — out-of-scope populated | PASS | Tabs 3–5, editing explicit out-of-scope |
| H5 — benefit linkage to named metric | PASS | M1 and M2 |
| H6 — complexity rated | PASS | Rating: 1 |
| H7 — no unresolved HIGH findings | PASS | Review PASS, 0 HIGH findings |
| H8 — no uncovered ACs | PASS | All 5 ACs covered |
| H8-ext — cross-story schema check | PASS | Upstream: wfp.5 / wfp.3 — no pipeline-state schema dependency |
| H9 — architecture constraints populated | PASS | Extends wfp-functions.js; reuses delta CSS classes |
| H-E2E — CSS-layout-dependent gaps | PASS | No CSS-layout-dependent gaps |
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
| W1 — NFRs populated or None | No warning — Performance + Accessibility + Security NFRs present |
| W2 — scope stability declared | No warning — Stable |
| W3 — MEDIUM review findings acknowledged | No warning — 0 MEDIUM findings |
| W4 — verification script reviewed by domain expert | Warning — script not yet reviewed by a domain expert |
| W5 — no UNCERTAIN items in test plan | No warning |

**W4 acknowledgement:** Internal engineering tool, low risk. Operator proceeds.

---

## Oversight level

**Low** — from parent epic wfp-planning-dashboard.md. No sign-off required.

---

## Coding Agent Instructions

### Story
Allocation matrix view (Tab 2 — Planning Dashboard) — wfp.6

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.6-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.6-test-plan.md`
15 tests — 12 unit + 3 E2E — all must pass.

### Test files
- `tests/check-wfp6-allocation-matrix.js` — unit tests. Add to `npm test` chain.
- `tests/e2e/wfp6-allocation-matrix.spec.js` — Playwright E2E.

### What to build
1. Extend `dashboards/wfp-functions.js` with: `renderAllocationRow(entry)`, `renderAllocationTable(entries)`, `renderAllocationErrorState(message)`. Add `delta-negative` / `delta-ok` CSS classes.
2. Extend `dashboards/workforce.html` Tab 2 to render allocation matrix from `workforce/initiative-map.json`.
3. `tests/check-wfp6-allocation-matrix.js` — all tests RED before implementation.
4. `tests/e2e/wfp6-allocation-matrix.spec.js` — all tests RED before implementation.
5. Wire `node tests/check-wfp6-allocation-matrix.js` into `package.json` test script.

### Dependencies
wfp.5 and wfp.3 must be DoD-complete before implementation begins.

### Definition of done for this story
- `node tests/check-wfp6-allocation-matrix.js` exits 0 with 12 passing
- `npm run test:e2e -- --grep wfp6` exits 0 with 3 passing
- `npm test` exits 0
- Tab 2 renders correctly with sample initiative-map.json

### Proceed: Yes

---

**Definition of ready: PROCEED — Allocation matrix view Tab 2 Planning Dashboard (wfp.6)**
