## Test Plan: Restyle the Dashboard and Wire Its Real Content to Match DESIGN.md

**Story reference:** artefacts/2026-09-18-design-system-adoption/stories/dsa-s2.md
**Epic reference:** artefacts/2026-09-18-design-system-adoption/epics/visual-restyle-rollout.md
**Test plan author:** Claude (agent)
**Date:** 2026-09-18 (amended 2026-09-19 for AC5-AC7, added by the full-live-data-wiring scope decision; amended again 2026-09-19 for the CRITICAL re-target — the real `GET /dashboard` route is `routes/products.js`'s `handleGetDashboard`/`_renderProductDashboard`, not `routes/dashboard.js`, which is confirmed dead code. AC8 added for the zero-products onboarding preservation requirement. See `decisions.md` for the full investigation trail.)

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
| AC8 | Zero-products onboarding CTA is preserved, unaffected by the new mock-derived content | — | — | 1 test | — | — | 🟢 |

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
| AC4 | Pre-existing test fixtures already used by `psh-s4-dashboard-layout.spec.js`, PLUS `products.js`'s own existing dashboard test coverage (to be exhaustively enumerated by `/verify-completion`'s mandatory route/handler coverage check, given the real target file changed) | Existing fixtures | None | The real target file is now `products.js`, a much more heavily-tested file than the dead `dashboard.js` — expect materially MORE pre-existing specs to enumerate here than the original amendment anticipated |
| AC5 | A fake/seeded `getPendingActions` result (both populated and empty) | Synthetic — the exact real injection mechanism depends on `/implementation-plan`'s own decision for where the reused `_mapPendingActionsForDashboard`/`getPendingActions` call now lives (`products.js` directly, or still via `dashboard.js`'s exported seam) — confirm the real, current seam at implementation time rather than assuming `dashboard.js`'s own `setGetPendingActions` is still the right injection point once the real caller moves | None | Mirrors `check-wuce5-action-queue.js`'s own existing fixture pattern for this adapter |
| AC6 | The new static skills catalog itself (no external data needed — it's a hardcoded array) | Synthetic (the catalog is the fixture) | None | |
| AC7 | Seeded journeys with real `completedStages[]` entries (populated case) and zero journeys (empty case) | Synthetic — existing `journey-store.js` test-session seeding conventions, matching `dsa-s1`'s own Task 6 fake-test-db precedent for NODE_ENV=test | None | |
| AC8 | A real, authenticated session with zero products (no product-creation fixture seeded) | Synthetic — the existing `products.length === 0` branch's own real precondition, already exercised by `products.js`'s own pre-existing test coverage (to be identified by name at `/implementation-plan` time) | None | This is the one AC that requires NO new fixture — it's the absence of a fixture (no products created for this session) |

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
- **Precondition:** `handleGetDashboard`/`_renderProductDashboard` (`routes/products.js`, the REAL live route) dispatched with a fake `_getPendingActions` and fake `journey-store` data injected, and at least one real product so the mock-derived content branch (not the zero-products branch) renders
- **Action:** Dispatch a real request through the route handler (not the browser), inspect the returned HTML
- **Expected result:** The response body contains the real mapped pending-action text, the real skill-catalog card labels, and the real derived recent-session/in-progress content — not the old Products-list-only body
- **Edge case:** No

---

## E2E Tests (Playwright)

### dashboard-dark-mode-tokens-match-design-md

- **Verifies:** AC1
- **Precondition:** A real, authenticated session with at least one real product reaches `/dashboard` (dark mode default) — this is now the REAL, live route (`routes/products.js`)
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
- **Precondition:** Same session (at least one real product)
- **Action:** Assert presence of the fixed 224px sidebar (products list, main nav, account nav pinned to bottom), the fluid main column at max-width 1080px, and the new mock-derived content (greeting, skill grid, "Waiting on you"/"Recent sessions" columns)
- **Expected result:** All named structural elements present and positioned per the layout pattern
- **Edge case:** No

### dashboard-pre-existing-specs-still-pass

- **Verifies:** AC4
- **Precondition:** Restyle implemented on the real route
- **Action:** Re-run `tests/e2e/psh-s4-dashboard-layout.spec.js` unmodified, PLUS every other pre-existing spec touching `routes/products.js`'s `handleGetDashboard`/`_renderProductDashboard` (a materially larger set than `dashboard.js` ever had — identified exhaustively by `/verify-completion`'s own mandatory coverage check at implementation time, not assumed to be just this one file), PLUS a direct check that `GET /dashboard?view=board` (the kanban route, same handler, different query param) still renders correctly and is visually unaffected by this story's changes to the non-board branch
- **Expected result:** All pass with no changes required to their own assertions; the `?view=board` route in particular renders exactly as it did before this story
- **Edge case:** No

### dashboard-zero-products-onboarding-preserved

- **Verifies:** AC8
- **Precondition:** A real, authenticated session with ZERO products
- **Action:** Load `/dashboard`
- **Expected result:** The existing "Create your first product →" CTA renders exactly as it does today — the new mock-derived content (greeting, skill grid, pending actions, recent sessions) does NOT appear in place of, or alongside in a broken way, the zero-products onboarding branch
- **Edge case:** This IS the edge case

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
| The real target file changed from `routes/dashboard.js` (dead, low-traffic-by-definition) to `routes/products.js` (confirmed real, live, beta-user-facing) mid-story — the full inventory of pre-existing specs touching `handleGetDashboard`/`_renderProductDashboard` was not exhaustively enumerated at this test-plan amendment time | `/verify-completion`'s own mandatory route/handler coverage check is designed exactly for this — but the stakes of missing something here are now materially higher than they were for the original dead-code target | `/implementation-plan` and `/verify-completion` must both treat this file's coverage check with the same seriousness this repo gave `skills.js` (this codebase's single largest, most heavily-used file) in `dsa-s4`'s own Architecture Constraints — do not under-budget this check because the story started out targeting dead code |
| The exact mechanism for relocating Tasks 1-3's data-wiring functions (shared module vs. direct import from `dashboard.js`) is undecided at test-plan time (deferred to `/implementation-plan`, per review finding [3-L1]) | A real, deliberately-deferred implementation choice, not an oversight | `/implementation-plan` must resolve this explicitly and document which mechanism was chosen and why, before Task 1 of the new plan begins |
