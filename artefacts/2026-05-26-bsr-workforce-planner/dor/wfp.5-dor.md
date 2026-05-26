# Definition of Ready — Workforce roster view (Tab 1 — Planning Dashboard)

**Story:** wfp.5
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Workforce roster view (Tab 1 — Planning Dashboard)
**Review:** PASS — wfp.5, no HIGH findings
**Test plan:** 20 tests covering 5 ACs + 1 manual accessibility scenario
**Verification script:** 9 scenarios (wfp.5-verification.md)

---

## Step 2 — Contract Proposal

**What will be built:**
- `dashboards/workforce.html` — static HTML file. Tab 1: Roster View. Reads `workforce/roster.json` via `fetch()` at load time.
- `dashboards/wfp-functions.js` — pure functions extracted from dashboard logic: `filterRoster(records, filters)`, `renderRosterRow(record)`, `renderRosterTable(records)`, `renderRosterErrorState(message)`. Follows the same pattern as `dashboards/viz-functions.js`.

**What will NOT be built:**
- Tabs 2–5 — wfp.6–wfp.8 scope
- Editing records from the browser — read-only
- External data sources

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — renders roster table from roster.json | E2E: Playwright fixture load + row count assertion | E2E |
| AC2 — group/role filter controls work | Unit: `filterRoster` + E2E: filter interaction | Unit + E2E |
| AC3 — search field filters by name | Unit: `filterRoster` search test | Unit |
| AC4 — retired records shown/hidden by toggle | Unit: `filterRoster` retired toggle; E2E: toggle check | Unit + E2E |
| AC5 — empty state rendered when no records match | Unit: `renderRosterErrorState`; E2E: empty state check | Unit + E2E |

**Assumptions:**
- `workforce/roster.json` exists (wfp.1 DoD-complete)
- No server required — `workforce.html` served via local static file server in E2E tests
- `dashboards/viz-functions.js` exists as the pattern to follow for `wfp-functions.js`

**Estimated touch points:**
- Files: `dashboards/workforce.html` (new), `dashboards/wfp-functions.js` (new), `tests/check-wfp5-roster-view.js` (new), `tests/e2e/wfp5-roster-view.spec.js` (new)

---

## Step 3 — Contract review

Contract review passed — pure-function extraction pattern established; all ACs covered by unit + E2E tests.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering, I want … So that …" |
| H2 — three or more ACs in Given / When / Then | PASS | 5 ACs, all in GWT format |
| H3 — every AC has at least one test | PASS | All 5 ACs covered |
| H4 — out-of-scope populated | PASS | Tabs 2–5, editing, external sources explicit out-of-scope |
| H5 — benefit linkage to named metric | PASS | M1 and M3 |
| H6 — complexity rated | PASS | Rating: 1 |
| H7 — no unresolved HIGH findings | PASS | Review PASS, 0 HIGH findings |
| H8 — no uncovered ACs | PASS | All 5 ACs covered; contrast-ratio gap is Untestable-by-nature |
| H8-ext — cross-story schema check | PASS | Upstream: wfp.1 — no pipeline-state schema field dependency |
| H9 — architecture constraints populated | PASS | Static HTML, no external calls, fetch from relative path |
| H-E2E — CSS-layout-dependent gaps | PASS | Contrast ratio gap is Untestable-by-nature (not CSS-layout-dependent visual alignment) — manual scenario in verification script |
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
Workforce roster view (Tab 1 — Planning Dashboard) — wfp.5

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.5-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.5-test-plan.md`
20 tests — 15 unit + 4 E2E + 1 manual — all automated tests must pass.

### Test files
- `tests/check-wfp5-roster-view.js` — unit tests. Add to `npm test` chain in `package.json`.
- `tests/e2e/wfp5-roster-view.spec.js` — Playwright E2E. Run via `npm run test:e2e`.

### What to build
1. `dashboards/wfp-functions.js` — exports: `filterRoster(records, filters)`, `renderRosterRow(record)`, `renderRosterTable(records)`, `renderRosterErrorState(message)`.
2. `dashboards/workforce.html` — Tab 1 (Roster View) with tab bar placeholder for Tabs 2–5. Reads `workforce/roster.json` via fetch. Imports wfp-functions.js.
3. `tests/check-wfp5-roster-view.js` — unit tests for wfp-functions.js. All RED before implementation.
4. `tests/e2e/wfp5-roster-view.spec.js` — Playwright E2E tests. All RED before implementation.
5. Wire `node tests/check-wfp5-roster-view.js` into `package.json` test script.

### Dependencies
wfp.1 must be DoD-complete before implementation begins.

### Definition of done for this story
- `node tests/check-wfp5-roster-view.js` exits 0 with 15 passing
- `npm run test:e2e -- --grep wfp5` exits 0 with 4 passing
- `npm test` exits 0
- Tab 1 renders correctly when workforce.html opened with a sample roster.json

### Proceed: Yes

---

**Definition of ready: PROCEED — Workforce roster view Tab 1 Planning Dashboard (wfp.5)**
