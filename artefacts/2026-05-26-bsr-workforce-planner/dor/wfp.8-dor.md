# Definition of Ready — Multi-team initiative scope decomposition and rollup view (Tab 5)

**Story:** wfp.8
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Multi-team initiative scope decomposition and rollup view (Tab 5)
**Review:** PASS — wfp.8, no HIGH findings
**Test plan:** 21 tests covering 6 ACs — 18 unit + 1 integration + 2 E2E
**Verification script:** 9 scenarios (wfp.8-verification.md)

---

## Step 2 — Contract Proposal

**What will be built:**
- Extensions to `src/workforce/map.js`: `groupByParentSlug(entries)`, `processRollupGroup(parentSlug, scopeItems, portfolio)` — collects child entries by `parentSlug`, computes totals, suppresses child entries as top-level items
- Extensions to `dashboards/wfp-functions.js`: `renderRollupTab(initiativeMap)`, `renderRollupParentRow(rollupEntry)`, `renderRollupChildRow(scopeItem)` — renders Tab 5 with parent heading rows and indented child rows
- `dashboards/workforce.html` Tab 5 (Initiative Rollup) wired up — reads from `workforce/initiative-map.json`

**What will NOT be built:**
- Nested rollup (grandparent hierarchy) — Phase 1 is one level only
- Editing scope items from browser
- Drag-and-drop reordering
- Export of rollup view

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — two entries same parentSlug → single rollup parent with scopeItems/totals/claimedFTE/fteDelta | Unit: `processRollupGroup` | Unit |
| AC2 — entries without parentSlug unchanged (backwards compat) | Unit: `groupByParentSlug` standalone test; Integration: `run` | Unit + Integration |
| AC3 — single scope item → rollup with length-1 scopeItems array | Unit: `processRollupGroup` single item test | Unit |
| AC4 — Tab 5 renders parent row + indented child rows with scopeLabel fallback | Unit: `renderRollupParentRow` + `renderRollupChildRow` | Unit |
| AC5 — delta-negative / delta-ok / null → "no claim" classes | Unit: `renderRollupParentRow` delta tests | Unit |
| AC6 — empty state when no rollup entries | Unit: `renderRollupTab` empty + E2E: Tab 5 empty state | Unit + E2E |

**Assumptions:**
- wfp.3 and wfp.7 are DoD-complete before implementation begins
- `src/workforce/map.js` exports `run()` and processes all allocation modes
- `dashboards/wfp-functions.js` and `dashboards/workforce.html` have Tabs 1–4

**Estimated touch points:**
- Files: `src/workforce/map.js` (extend), `dashboards/wfp-functions.js` (extend), `dashboards/workforce.html` (extend Tab 5), `tests/check-wfp8-rollup.js` (new), `tests/e2e/wfp8-rollup-tab.spec.js` (new)

---

## Step 3 — Contract review

Contract review passed — backwards compat explicitly tested; rollup suppresses child top-level entries; delta colouring reuses established classes; all ACs covered.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering, I want … So that …" |
| H2 — three or more ACs in Given / When / Then | PASS | 6 ACs, all in GWT format |
| H3 — every AC has at least one test | PASS | All 6 ACs covered |
| H4 — out-of-scope populated | PASS | Nested rollup, editing, drag-and-drop, export explicit out-of-scope |
| H5 — benefit linkage to named metric | PASS | M1 and M2 |
| H6 — complexity rated | PASS | Rating: 2 (inherits from wfp-reconciliation-engine epic; extends map.js) |
| H7 — no unresolved HIGH findings | PASS | Review PASS, 0 HIGH findings |
| H8 — no uncovered ACs | PASS | All 6 ACs covered |
| H8-ext — cross-story schema check | PASS | Upstream: wfp.3, wfp.4, wfp.7 — no pipeline-state schema dependency |
| H9 — architecture constraints populated | PASS | Optional fields, backwards compat, no separate child top-level entries, delta classes reused |
| H-E2E — CSS-layout-dependent gaps | PASS | No CSS-layout-dependent gaps |
| H-NFR — NFR profile exists | PASS | nfr-profile.md present |
| H-NFR2 — compliance NFRs have sign-off | PASS | No regulatory clause NFRs |
| H-NFR3 — data classification not blank | PASS | Internal / Private in nfr-profile.md |
| H-NFR-profile — story declares no explicit NFRs; profile present | PASS | No NFR section in wfp.8 story; nfr-profile.md covers feature-level data classification |
| H-GOV — Approved By populated | PASS | Hamish King 2026-05-26 |
| H-ADAPTER — injectable adapters wired | PASS | No injectable adapters introduced |

---

## Warnings

| Check | Result |
|-------|--------|
| W1 — NFRs populated or None | No warning — story carries no explicit NFRs; feature-level NFR profile present |
| W2 — scope stability declared | No warning — Stable |
| W3 — MEDIUM review findings acknowledged | No warning — 0 MEDIUM findings |
| W4 — verification script reviewed by domain expert | Warning — script not yet reviewed by a domain expert |
| W5 — no UNCERTAIN items in test plan | No warning |

**W4 acknowledgement:** Internal engineering tool, low risk. Operator proceeds.

---

## Oversight level

**Low** — from parent epic wfp-planning-dashboard.md and wfp-reconciliation-engine.md. No sign-off required.

---

## Coding Agent Instructions

### Story
Multi-team initiative scope decomposition and rollup view (Tab 5) — wfp.8

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.8-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.8-test-plan.md`
21 tests — 18 unit + 1 integration + 2 E2E — all must pass.

### Test files
- `tests/check-wfp8-rollup.js` — unit + integration tests. Add to `npm test` chain.
- `tests/e2e/wfp8-rollup-tab.spec.js` — Playwright E2E.

### What to build
1. Extend `src/workforce/map.js` with: `groupByParentSlug(entries)`, `processRollupGroup(parentSlug, scopeItems, portfolio)`. Update `run()` to call `groupByParentSlug` first; write one rollup parent entry per group to initiative-map.json; suppress scope items as top-level entries.
2. Extend `dashboards/wfp-functions.js` with: `renderRollupTab(initiativeMap)`, `renderRollupParentRow(rollupEntry)`, `renderRollupChildRow(scopeItem)`.
3. Extend `dashboards/workforce.html` Tab 5 (Initiative Rollup).
4. `tests/check-wfp8-rollup.js` — all tests RED before implementation.
5. `tests/e2e/wfp8-rollup-tab.spec.js` — all tests RED before implementation.
6. Wire `node tests/check-wfp8-rollup.js` into `package.json` test script.

### Key implementation constraints
- `parentSlug` and `scopeLabel` fields are optional in `workforce/allocation-input.json`. Entries without `parentSlug` must produce identical output to a pre-wfp.8 invocation.
- Child scope items must NOT appear as separate top-level entries in `initiative-map.json`. They appear only in the rollup parent's `scopeItems` array.
- Delta colouring reuses `delta-negative` and `delta-ok` CSS classes established in wfp.6. No new colour values.
- Tab 5 is "Initiative Rollup" — the fifth tab in the tab bar.

### Dependencies
wfp.3, wfp.4 (for processRollupGroup using all allocation modes), and wfp.7 (for Tab 5 being added after Tabs 1–4) must all be DoD-complete before implementation begins.

### Definition of done for this story
- `node tests/check-wfp8-rollup.js` exits 0 with 19 passing (18 unit + 1 integration)
- `npm run test:e2e -- --grep wfp8` exits 0 with 2 passing
- `npm test` exits 0
- `workforce/initiative-map.json` produced from a multi-team sample input; Tab 5 renders correctly in browser

### Proceed: Yes

---

**Definition of ready: PROCEED — Multi-team initiative scope decomposition and rollup view Tab 5 (wfp.8)**
