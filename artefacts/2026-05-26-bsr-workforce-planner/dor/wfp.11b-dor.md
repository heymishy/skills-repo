# Definition of Ready — Interactive allocation assignment UI: person-centric and squad-centric views

**Story:** wfp.11b
**Feature:** 2026-05-26-bsr-workforce-planner
**Date:** 2026-05-27
**DoR run by:** Copilot

---

## Step 1 — Story loaded

**Story loaded:** Interactive allocation assignment UI — Story B: person-centric and squad-centric views
**Review:** PASS — wfp.11b run 1, 0 HIGH findings; 1-M1 MEDIUM (H-E2E trigger — Playwright E2E spec named in test plan); 1-L1 LOW (squad bulk-assign idempotency — specified in contract below)
**Test plan:** 15 E2E tests covering all 3 ACs and key NFRs; no unit tests (no new Node.js modules)
**Verification scenarios:** 4 scenarios (see Step 5 below)

---

## Step 2 — Contract Proposal

**What will be built:**
- Extension of the inline HTML/JS served by `handleGetWorkforceHtml` in `src/web-ui/routes/workforce.js`:
  - Person-centric view panel: renders all roster people with 4 filter controls (product group, employment type, squad, skill tag). Per-person detail shows: all initiatives assigned (from shared in-memory state), total FTE commitment count, skill tags. A person whose assignment count exceeds `OVER_ALLOCATION_THRESHOLD` (already declared as `const OVER_ALLOCATION_THRESHOLD = 2` in wfp.11a) is flagged with a warning indicator in both list and detail. The operator can add or remove initiative assignments from this view. Changes update the shared in-memory state.
  - Squad-centric view panel: renders all squads (from distinct `squad` values in roster) with product-group filter. Per-squad detail shows: all initiatives any member is assigned to, aggregate FTE count, union of skill tags. "Assign squad to initiative" action: shows an initiative picker; stages all squad members as individual person entries in the in-memory allocation for that initiative. Idempotent: members already staged or saved for that initiative are skipped; only absent members are added.
  - Cross-view consistency: all three view panels (initiative, person, squad) share the same in-memory allocation state object. Navigation between views does not re-fetch data from the server. The "You have unsaved changes" banner (established in wfp.11a) remains visible across all three views when staged changes exist.
  - The person and squad view tabs that were disabled ("coming in Phase 2") in wfp.11a are activated (enabled) in this story.
- `tests/e2e/wfp11b-person-squad-views.spec.js` — 15 Playwright E2E tests
- `tests/fixtures/workforce/` — extend `roster.json` to 8 people (Frank, Grace, Hana added); add `allocation-input-overallocated.json`

**What will NOT be built:**
- New route handlers — all four routes established in wfp.11a; none are modified
- Changes to `GET /workforce/data`, `POST /workforce/allocations`, or `POST /workforce/run-map` handler logic — frozen unless bug fix required (must be explicitly justified)
- Changes to `dashboards/workforce.html`
- LocalStorage persistence of unsaved changes
- `OVER_ALLOCATION_THRESHOLD` as a UI control or server config
- Real-time multi-user collaboration
- Streaming of `workforce-map` output (established in wfp.11a)
- Any change to `package.json` test chain (wfp.11b is E2E only; E2E is run via `npm run test:e2e`, not `npm test`)

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC6 — Person-centric view: list, 4 filters, detail, over-allocation flag, shared state | E2E: E1–E8 | E2E |
| AC7 — Squad-centric view: list, filter, detail, bulk assign, shared state; idempotent | E2E: E9–E12 | E2E |
| AC11 — Cross-view navigation: staged changes preserved; banner consistent; count consistent; reload loses all | E2E: E13, E14, E15 | E2E |

**RISK-ACCEPT — B2 CSS-layout ACs:**
1280px no-horizontal-scroll across all three views cannot be verified by automated tests. Post-implementation manual smoke test step covers this (Verification Scenario 4 below). Consistent with RISK-ACCEPT declared in wfp.11a.

**RISK-ACCEPT — squad bulk-assign idempotency edge case (1-L1 resolution):**
When "Assign squad to initiative" is invoked for a squad+initiative pair where one or more squad members are already present in the staged state, the action is idempotent: existing entries are preserved unchanged; only members not yet present are added. This avoids accidental data loss. The E2E test E12 exercises this case.

**Assumptions:**
- wfp.11a is DoD-complete: `handleGetWorkforceHtml` in `src/web-ui/routes/workforce.js` exists and serves the HTML page; `OVER_ALLOCATION_THRESHOLD = 2` is declared in the inline script; person and squad tabs are present but disabled
- The shared in-memory state pattern from wfp.11a (a single JS object updated by initiative-view actions) is documented in the code — the implementer must read it before adding person/squad view mutations
- The test server fixture for wfp.11b E2E tests can reuse the global setup from wfp.11a (same server, same fixture directory with extended roster)

**Estimated touch points:**
- `src/web-ui/routes/workforce.js` — extend the inline HTML/JS in `handleGetWorkforceHtml` (person and squad view panels; enable view tabs; shared state mutations)
- `tests/e2e/wfp11b-person-squad-views.spec.js` — new
- `tests/fixtures/workforce/roster.json` — extend to 8 people
- `tests/fixtures/workforce/allocation-input-overallocated.json` — new fixture

---

## Step 3 — Contract review

Contract review passed — pure UI extension; no new routes; shared state pattern established by wfp.11a; all 3 ACs covered by E2E tests; squad idempotency edge case resolved; no new npm dependencies; B2 layout risk acknowledged.

---

## Hard blocks

| Check | Result | Notes |
|-------|--------|-------|
| H1 — As / Want / So with named persona | PASS | "As a Head of Engineering" |
| H2 — three or more ACs in Given / When / Then | PASS | 3 ACs in GWT format (H2 requires three or more — met exactly) |
| H3 — every AC has at least one test | PASS | AC6 → E1–E8; AC7 → E9–E12; AC11 → E13–E15 |
| H4 — out-of-scope populated | PASS | 7 explicit exclusions: no new routes, no handler modifications, dashboards/workforce.html unchanged, no localStorage, no OVER_ALLOCATION_THRESHOLD UI, no multi-user, no streaming |
| H5 — benefit linkage to named metric | PASS | M1 and M2; mechanism sentences specific (person/squad views eliminate cross-reference rework; over-allocation flag surfaces capacity risk early) |
| H6 — complexity rated | PASS | Rating: 2; rationale present |
| H7 — no unresolved HIGH findings | PASS | 0 HIGH findings; 1-M1 MEDIUM resolved (Playwright E2E spec named); 1-L1 LOW resolved (idempotency specified in contract) |
| H8 — no uncovered ACs | PASS | All 3 ACs have named E2E tests |
| H8-ext — cross-story schema check | PASS | No pipeline-state schema field dependency |
| H9 — architecture constraints populated | PASS | No new routes, no new deps, inline HTML/JS, shared state via wfp.11a pattern, route handlers frozen, dashboards/workforce.html unchanged |
| H-E2E — web UI change requiring E2E | PASS | Extends browser-rendered HTML → H-E2E triggered; Playwright spec at tests/e2e/wfp11b-person-squad-views.spec.js (15 E2E tests). B2 layout ACs addressed by RISK-ACCEPT with manual smoke test. |
| H-NFR — NFR profile exists | PASS | nfr-profile.md present; wfp.11b NFRs to be added |
| H-NFR2 — compliance NFRs have sign-off | PASS | No regulatory clause NFRs |
| H-NFR3 — data classification not blank | PASS | Internal / Private — same classification as wfp.11a |
| H-NFR-profile — NFRs registered in nfr-profile.md | PASS | NFRs added to nfr-profile.md alongside pipeline-state update for this story |
| H-GOV — Approved By populated | PASS | Hamish King 2026-05-27 |
| H-ADAPTER — injectable adapters introduced | PASS | No new injectable adapters |

---

## Warnings

| Check | Result |
|-------|--------|
| W1 — NFRs populated or "None" | No warning — NFRs explicit: scale (200 persons, 40 squads, keystroke filter sync), performance (no additional GET /workforce/data on view switch), compatibility (1280px) |
| W2 — scope stability declared | No warning — Stable; no new routes; shared state pattern inherited from wfp.11a |
| W3 — MEDIUM review findings acknowledged | No warning — 1-M1 resolved (Playwright E2E spec named in test plan); 1-L1 resolved (idempotency specified) |
| W4 — verification script reviewed by domain expert | Warning — scenarios written below; not yet reviewed by Hamish King |
| W5 — no UNCERTAIN items in test plan | No warning |

**W4 acknowledgement:** Internal engineering tool. Operator proceeds.

---

## Step 5 — Verification scenarios

Manual scenarios to run post-implementation before DoD:

1. **Person view:** Navigate to the person-centric view tab. Confirm it is enabled (not "coming in Phase 2"). Filter by product group "Platform" — confirm only Platform Eng members shown. Select Alice. Confirm detail panel shows all initiatives Alice is assigned to plus her skill tags.
2. **Over-allocation flag:** In `allocation-input.json`, assign Alice to 3 initiatives. Reload the page. Open person view. Confirm Alice's row carries a warning indicator (colour, icon, or label).
3. **Squad bulk-assign:** Navigate to squad-centric view. Select "Platform Eng" squad. Click "Assign squad to initiative" → select "pilot-platform". Confirm all Platform Eng members (Alice, Bob, Frank) appear as staged entries for pilot-platform. Navigate to the initiative-centric view and confirm pilot-platform shows those three members as pending assignees.
4. **Layout smoke test (B2 — manual):** Open the assignment UI in Chrome and Firefox at 1280px viewport. Switch between all three views. Confirm no horizontal scrollbar appears in any view. Confirm filters and detail panels are usable without overlapping content.

---

## Oversight level

**Low** — from parent epic wfp-planning-dashboard.md. Pure UI extension; no file writes, no child-process execution in this story. All disk operations are performed by the route handlers established in wfp.11a.

---

## Coding Agent Instructions

### Story
Interactive allocation assignment UI — Story B: person-centric and squad-centric views — wfp.11b

### DoR contract reference
`artefacts/2026-05-26-bsr-workforce-planner/dor/wfp.11b-dor-contract.md`

### Test plan
`artefacts/2026-05-26-bsr-workforce-planner/test-plans/wfp.11b-test-plan.md`
15 E2E tests — all must pass. No unit test file for this story.

### Test files
- `tests/e2e/wfp11b-person-squad-views.spec.js` — Playwright E2E. Run via `npm run test:e2e`.
- No unit test file. No `package.json` test chain change required.

### What to build

**Task 1 — Extend the inline HTML/JS in `handleGetWorkforceHtml` (`src/web-ui/routes/workforce.js`):**
Read the full current content of `handleGetWorkforceHtml` before making any changes.

Person-centric view panel additions:
- Enable the person-centric view tab (remove disabled state / "coming in Phase 2" label)
- Render all roster people from the loaded data with a filter bar supporting 4 dimensions: product group (dropdown), employment type (dropdown), squad (dropdown), skill tag (text input with live filtering)
- Selecting a person opens a detail panel showing: all current initiatives (from shared in-memory state), total assignment count (FTE commitment count), skill tags
- When total assignment count > `OVER_ALLOCATION_THRESHOLD`: apply a warning class to the row and the count display in the detail panel
- Add/remove initiative assignments from this view: mutations update the shared in-memory state; trigger unsaved-changes banner update

Squad-centric view panel additions:
- Enable the squad-centric view tab
- Render all squads (derived from distinct `squad` field values in the loaded roster) with a product-group filter
- Selecting a squad shows: all initiatives any member is assigned to; aggregate assignment count; union of all member skill tags
- "Assign squad to initiative" button: shows a picker of all portfolio initiative slugs; on selection, iterates all squad members and for each member not already present in the staged state for that initiative, adds a new entry. Members already present are skipped (idempotent).

Shared state:
- All three views (initiative, person, squad) read from and write to the same in-memory allocation state object
- Navigation between views does not call `GET /workforce/data` again
- The unsaved-changes banner state and staged-change count reflect the full in-memory state regardless of which view is active

**Task 2 — Extend fixture files:**
- Add Frank, Grace, Hana to `tests/fixtures/workforce/roster.json` per the test data strategy in the test plan
- Create `tests/fixtures/workforce/allocation-input-overallocated.json` with Alice assigned to 3 initiatives

**Task 3 — Create Playwright E2E spec `tests/e2e/wfp11b-person-squad-views.spec.js`:**
Implement all 15 E2E tests (E1–E15) from the test plan. Reuse the global setup defined for wfp.11a (same server, extended fixtures). Start each test from a clean page load.

### Dependencies
- wfp.11a must be DoD-complete: `handleGetWorkforceHtml` implemented; `OVER_ALLOCATION_THRESHOLD = 2` declared in inline script; person and squad tabs present but disabled; shared in-memory state pattern established
- Read `src/web-ui/routes/workforce.js` in full before modifying `handleGetWorkforceHtml`

### Definition of done for this story
- `npx playwright test tests/e2e/wfp11b-person-squad-views.spec.js` exits 0 with 15 passing
- `npm test` exits 0 (no regression to wfp.11a unit tests)
- All 4 verification scenarios pass (3 behavioral, 1 manual layout)
- Person and squad view tabs are enabled (not labelled "coming in Phase 2")
- Squad bulk-assign is idempotent (confirmed by E12)

### Proceed: Yes

---

**Definition of ready: PROCEED — Interactive allocation assignment UI — Story B: person-centric and squad-centric views (wfp.11b)**
