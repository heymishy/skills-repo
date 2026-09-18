## Test Plan: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-18 (amended 2026-09-19 for AC5-AC7, added by the full-live-data-wiring scope decision — see `decisions.md`)

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Dark-mode computed CSS custom-property values match DESIGN.md's dark token table | — | — | 1 test | — | — | 🟢 |
| AC2 | Light-mode computed CSS custom-property values match DESIGN.md's light token table | — | — | 1 test | — | — | 🟢 |
| AC3 | Layout matches DESIGN.md's "Dashboard/app shell" pattern and the real mock | — | — | 1 test | — | — | 🟢 |
| AC4 | No functional regression to pre-existing dashboard behavior | — | — | 1+ pre-existing specs re-run | — | — | 🟢 |
| AC5 | "Waiting on you" shows real pending sign-off items via getPendingActions | 1 test (mapping fn) | — | 1 test | — | — | 🟢 |
| AC6 | "Run a skill" shows the real static skill catalog with working session-start links | 1 test (catalog shape) | — | 1 test | — | — | 🟢 |
| AC7 | Real in-progress count and recent-sessions data from journey-store | 1 test (derivation fn) | — | 2 tests (populated + empty state) | — | — | 🟢 |

---

## Coverage gaps

None — same reasoning as `dsa-s1`'s test plan: real browser (Playwright) computed-style/layout assertions are E2E-testable, not a genuine gap. AC5-AC7's new data-mapping/derivation logic (unlike AC1-AC4's pure presentation) has a genuine unit-testable seam — pure JS functions taking raw adapter/store data and returning `renderDashboard`'s expected shape — covered directly rather than only through the browser.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A real authenticated session reaching the dashboard (dark mode active) | Synthetic — existing test-session seeding conventions already used throughout this codebase's E2E suite | None | |
| AC2 | Same as AC1, with light mode applied | Synthetic | None | |
| AC3 | Same authenticated session | Synthetic | None | |
| AC4 | Pre-existing test fixtures already used by `psh-s4-dashboard-layout.spec.js` | Existing fixtures | None | Additional dashboard-touching specs may exist beyond this one named file — `/verify-completion`'s own mandatory route/handler coverage check (per this repo's established `ep2-s3` precedent) will do the exhaustive search at implementation time; this test plan names the one confirmed dedicated spec |
| AC5 | A fake/seeded `getPendingActions` result (both populated and empty) | Synthetic — injected via `dashboard.js`'s own existing `setGetPendingActions(fn)` injectable seam (confirmed present, already used by `handleGetActions`'s own test coverage) | None | Mirrors `check-wuce5-action-queue.js`'s own existing fixture pattern for this adapter |
| AC6 | The new static skills catalog itself (no external data needed — it's a hardcoded array) | Synthetic (the catalog is the fixture) | None | |
| AC7 | Seeded journeys with real `completedStages[]` entries (populated case) and zero journeys (empty case) | Synthetic — existing `journey-store.js` test-session seeding conventions, matching `dsa-s1`'s own Task 6 fake-test-db precedent for NODE_ENV=test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### dashboard-pending-actions-mapping-shape

- **Verifies:** AC5
- **Precondition:** A raw `getPendingActions`-shaped result (`{items: [{featureName, artefactType, daysPending, artefactUrl}], bannerMessage}`)
- **Action:** Call the new mapping function that produces `renderDashboard`'s expected `actions` shape
- **Expected result:** Each mapped item has `what` (derived text mentioning the artefact type), `feature` (= `featureName`), `age` (relative-time text derived from `daysPending`), `you` (= `true`); `pendingActionsCount` = `items.length`
- **Edge case:** Empty `items` array → empty `actions`, `pendingActionsCount` 0

### dashboard-skill-catalog-shape

- **Verifies:** AC6
- **Precondition:** None (static data)
- **Action:** Read the new static skills-catalog array
- **Expected result:** Exactly the fields `renderDashboard`'s `skills` prop expects (`name`, `label`, `desc`, `est`, `stage`); each `name` corresponds to a real, working skill (cross-checked against `routes/skills.js`'s own real `skillName === '...'` conditionals, not invented)
- **Edge case:** No

### dashboard-journey-derivation-shape

- **Verifies:** AC7
- **Precondition:** A set of fake journeys with varying `complete`/`completedStages` state
- **Action:** Call the new derivation function that produces `inProgressCount` and `recent[]`
- **Expected result:** `inProgressCount` = count of journeys where `!journey.complete`; `recent` = the flattened, `completedAt`-descending-sorted, top-N `completedStages` entries across all journeys, each mapped to `{skill, feature, when, stage: 'done', pillBg, pillColor}`
- **Edge case:** Zero journeys → `inProgressCount` 0, `recent` empty array (not undefined/null)

---

## Integration Tests

### dashboard-route-wires-real-data-end-to-end

- **Verifies:** AC5, AC6, AC7
- **Precondition:** `handleDashboard` dispatched with a fake `_getPendingActions` and fake `journey-store` data injected
- **Action:** Dispatch a real request through the route handler (not the browser), inspect the returned HTML
- **Expected result:** The response body contains the real mapped pending-action text, the real skill-catalog card labels, and the real derived recent-session/in-progress content — not the old placeholder `<h1>Dashboard</h1>`
- **Edge case:** No

---

## E2E Tests (Playwright)

### dashboard-dark-mode-tokens-match-design-md

- **Verifies:** AC1
- **Precondition:** A real, authenticated session reaches the dashboard (dark mode default)
- **Action:** Read computed color custom-property values via `getComputedStyle`
- **Expected result:** Every value exactly matches `DESIGN.md`'s dark-mode token table
- **Edge case:** No

### dashboard-light-mode-tokens-match-design-md

- **Verifies:** AC2
- **Precondition:** Same session, light mode toggled on
- **Action:** Same computed-style read
- **Expected result:** Every value exactly matches `DESIGN.md`'s light-mode token table
- **Edge case:** No

### dashboard-layout-matches-design-md-pattern

- **Verifies:** AC3
- **Precondition:** Same session
- **Action:** Assert presence of the fixed 224px sidebar (products list, main nav, account nav pinned to bottom) and the fluid main column at max-width 1080px
- **Expected result:** All named structural elements present and positioned per the layout pattern
- **Edge case:** No

### dashboard-pre-existing-specs-still-pass

- **Verifies:** AC4
- **Precondition:** Restyle implemented
- **Action:** Re-run `tests/e2e/psh-s4-dashboard-layout.spec.js` unmodified, plus any additional dashboard-touching specs identified by `/verify-completion`'s own mandatory coverage check at implementation time
- **Expected result:** All pass with no changes required to their own assertions
- **Edge case:** No

### dashboard-waiting-on-you-shows-real-pending-items

- **Verifies:** AC5
- **Precondition:** A real, authenticated session; a seeded/mocked pending-action result
- **Action:** Load the dashboard in a real browser, read the "Waiting on you" list's rendered content
- **Expected result:** The seeded item's feature name and artefact type appear in the list, not static placeholder text
- **Edge case:** No pending items → the empty-state text ("Nothing waiting.", already present in `dashboard-view.js`) renders instead

### dashboard-run-a-skill-shows-real-catalog

- **Verifies:** AC6
- **Precondition:** Real, authenticated session
- **Action:** Load the dashboard, read the "Run a skill" grid's rendered cards
- **Expected result:** Cards show the real static catalog's labels/descriptions/estimates; clicking/submitting a card's form targets the real `POST /api/skills/:name/sessions` route with the correct real skill name
- **Edge case:** No

### dashboard-recent-sessions-and-in-progress-count-populated

- **Verifies:** AC7
- **Precondition:** Real, authenticated session with at least one journey that has real `completedStages[]` entries and at least one in-progress (incomplete) journey
- **Action:** Load the dashboard, read the greeting's in-progress count and the "Recent sessions" list
- **Expected result:** In-progress count matches the real count of incomplete journeys; recent sessions shows real skill/feature/when data, oldest-to-newest ordering matching `completedAt` descending (most recent first)
- **Edge case:** No

### dashboard-recent-sessions-empty-state

- **Verifies:** AC7
- **Precondition:** Real, authenticated session with zero journeys (or zero completed stages across all journeys)
- **Action:** Load the dashboard
- **Expected result:** "Recent sessions" shows the honest empty-state text ("No recent sessions.", already present in `dashboard-view.js`), in-progress count shows 0 — never a stale/incorrect placeholder number
- **Edge case:** This IS the edge case

---

## NFR Tests

### dashboard-page-load-no-regression

- **NFR addressed:** Performance
- **Measurement method:** Compare page-load timing before/after the restyle
- **Pass threshold:** No measurable regression
- **Tool:** Manual timing comparison during implementation

### dashboard-accessibility-no-regression

- **NFR addressed:** Accessibility
- **Measurement method:** Compare contrast ratios and keyboard-navigation behavior before/after
- **Pass threshold:** No regression to any existing accessibility property (WCAG 2.1 AA floor)
- **Tool:** Manual comparison during implementation

### dashboard-pending-actions-call-latency

- **NFR addressed:** Performance (amended NFR — `getPendingActions` is now also invoked on dashboard page load, not only the existing `/api/actions` route)
- **Measurement method:** Compare dashboard page-load timing with the new `getPendingActions` call present vs. absent (or against the existing `/api/actions` route's own established timing baseline)
- **Pass threshold:** No unacceptable added latency beyond what the existing `/api/actions` route already exhibits for the same underlying adapter call
- **Tool:** Manual timing comparison during implementation

---

## Out of Scope for This Test Plan

- Fixing the stale/dead nav links tracked separately in the `web-ui-experience-redesign` feature — that is a different, unrelated IA fix, not this story's scope.
- Testing any of the other 3 real screens — each has its own test plan.
- Testing the `design.system` DoR governance mechanism — `dsa-s5`'s own test plan.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Full dashboard-touching spec inventory not exhaustively enumerated at test-plan time | The dashboard is the app-shell, likely a starting point for many specs beyond the one dedicated `psh-s4` spec | `/verify-completion`'s own mandatory route/handler coverage check does the exhaustive search before merge, matching this repo's established `ep2-s3` precedent |
| `getPendingActions`'s real repo-access-validation network calls cannot be fully exercised in local/CI E2E (no real GitHub repos connected in that environment) | Same class of external-dependency gap already accepted for `dsa-s1`'s AC5 (`sign-off.spec.js` precedent) and `handleGetActions`'s own existing test coverage | AC5's E2E test seeds/mocks the adapter response directly (via `setGetPendingActions`) rather than exercising the real network path — the unit test covers the mapping logic in isolation, the E2E test covers the render path with a controlled input |
| `listJourneys()`'s real production wiring status was not independently re-confirmed at test-plan time (only confirmed wired for `NODE_ENV=test`, per `dsa-s1`'s own Task 6 finding) | Flagged explicitly in the story's own amended Complexity rationale | `/implementation-plan` must independently re-confirm real production wiring before treating AC7 as implementable as designed — if not wired, this becomes a new finding requiring its own scope decision |
