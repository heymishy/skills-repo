## Test Plan: Delivery view: feature and metric annotation rows on stage cards

**Story reference:** artefacts/2026-10-05-customer-journey-as-first-class/stories/ep2-s3.md
**Epic reference:** feature-mapping-and-delivery-view
**Test plan author:** Claude Sonnet 5 (session_01FWedhLob35Ggekkzc7DUmy)
**Date:** 2026-10-10

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`.

---

**Real architecture grounding (confirmed by direct code read, 2026-10-10):**

- **No view-toggle mechanism exists yet.** Confirmed by grep across `journeys.js`: no `data-view`, no "Customer experience"/"Delivery view" markup anywhere. `design.md` (lines 125-131) specifies four canvas view modes (Canvas/Customer experience/Delivery/Customise), client-side, CSS-class-driven, no server round-trip — but no prior story has built the toggle control itself. This story introduces it (the 3 modes its own AC3 names: Canvas, Customer experience, Delivery — "Customise" is not named in any of this story's ACs and stays fully out of scope). The "Customer experience" toggle button is built now but reveals no extra annotation content yet (`ep3-s1`'s own separate, not-yet-built scope) — forward-compatible, same pattern as `ep2-s2`'s own unpopulated `metricKeys` field (D12).
- **No mapping query exists yet in `handleGetJourneyCanvas`.** Confirmed by grep: `feature_customer_journey_stage_mappings` is read nowhere in this handler today (only written, by `ep2-s2`'s own `handlePostFeatureMapping`). This story adds `SELECT id, journey_stage_id, feature_slug, metric_keys FROM feature_customer_journey_stage_mappings WHERE journey_id = $1` — safe to filter by `journey_id` alone (no separate tenant check needed on this query) because the journey's own tenant ownership is already verified earlier in the same handler (`journeys.js:384-394`, the existing `customer_journeys` ownership `SELECT` that 404s before any stage/mapping data is read).
- **Metric-value source (operator decision, 2026-10-10, D15):** AC1/AC4 assume each selected metric key has a recorded value in `pipeline-state.json` — no such field exists anywhere (confirmed by grep; `feature.metricKeys`, added in `ep2-s2`, only stores key *names*). Resolved: add read support for an optional `metricValues: { [key]: value }` map on each feature's own record. Nothing writes this field yet, so every metric key correctly falls through to AC4's own explicit "No value recorded" fallback today — forward-compatible, mirrors D12 exactly.
- **AC2/Out-of-Scope contradiction (operator decision, 2026-10-10, D16):** AC2 requires a "remove affordance" for an orphaned (feature-not-found) mapping; the story's own Out of Scope section originally said "removing mappings (deferred for MVP)" with no carve-out. Resolved: build a narrow `DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId` route, reusing this file's own ownership-check-before-mutation / 404-not-403 cross-tenant convention (D13) — scoped specifically to removing one mapping row by its own id. The general case (editing or removing a *valid* mapping) stays deferred; the "Remove" affordance is only ever rendered on the feature-not-found warning row. Story text corrected to carve out this exception explicitly.
- **No new D37 injectable adapter.** The new `DELETE` handler receives `pool` as an ordinary parameter, matching every other handler in this file (none of them use the `setX`/`getX` adapter pattern for Postgres access). H-ADAPTER: N/A.
- **Route collision check needed.** The new `DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId` path adds a 4th path segment after `/stages/:stageId/`, distinct in both method (`DELETE`) and shape from the existing `POST /journeys/:id/stages/:stageId/feature-mappings` (3 segments, `POST`) and the `/stages$`, `/stages/[^/]+$`, `/stages-order$` family — needs an explicit shape test confirming no false match against any existing regex, matching `ep2-s2`'s own precedent for its new route.

---

**E2E/browser-layout detection (Step 3a):** AC3's view toggle is a pure CSS-class swap (no drag, no pointer coordinates, no `getBoundingClientRect`) — testable via jsdom behavioral assertions (click → class present/absent), not a CSS-layout-dependent AC under B2's own definition (no visual alignment, breakpoint, or pixel-rendering assertion). No E2E spec required, no RISK-ACCEPT needed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Delivery view shows mapped features + selected metric keys/values per stage, or "No features mapped"/"No metrics selected" | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | A mapped feature no longer in `pipeline-state.json` shows "⚠️ Feature not found (slug)" + a Remove affordance, no crash | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Canvas/Customer experience/Delivery view toggle shows/hides annotation rows via CSS class, no server round-trip | 1 test | — | — | — | — | 🟢 (jsdom behavioral) |
| AC4 | A selected metric key with no recorded value shows "No value recorded" | 1 test | — | — | — | — | 🟢 |
| (new route) | `DELETE .../feature-mappings/:mappingId` — ownership check, 404-not-403 cross-tenant, deletes exactly the one row | — | 2 tests | — | — | — | 🟢 |
| (shape) | New `DELETE` route regex does not collide with existing `/stages`/`/feature-mappings` regexes | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC1/AC2/AC4 are covered by server-rendered markup assertions against a mocked mappings-query result and a mocked `pipeline-state.json` features list (including the new `metricValues` field). AC3 is covered by a jsdom behavioral test (real click → real class assertions), extending the established precedent from `check-ep2-s1-feature-picker.js`/`check-ep2-s2-feature-mapping-save.js`. The new `DELETE` route is covered by an integration test extending `ep2-s2`'s own mock-pool convention.

---

## Test Data Strategy

**Source:** Synthetic — extends `tests/check-ep2-s2-feature-mapping-save.js`'s own mock-pool and `pipeline-state.json`-mocking conventions.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Mock pool returning 2 mapping rows for one stage (one with `metric_keys: ['m1']`, one with `metric_keys: []`); mocked features list where `feat-a` has `metricValues: { m1: '0.42' }` | Synthetic | None | Assert the delivery-view annotation row for `feat-a` shows "m1: 0.42" and the zero-key feature shows "No metrics selected" |
| AC1 (boundary) | Mock pool returning zero mapping rows for a stage | Synthetic | None | Assert "No features mapped" renders for that stage |
| AC2 | Mock pool returning one mapping row with `feature_slug: 'ghost-feature'`, not present in the mocked `features` list | Synthetic | None | Assert "⚠️ Feature not found (ghost-feature)" renders with a `data-mapping-id` Remove button |
| AC4 | Mock pool returning a mapping with `metric_keys: ['m2']`; mocked feature has no `metricValues.m2` entry | Synthetic | None | Assert "m2: No value recorded" renders, not blank, not an error |
| (new route) happy path | Mock pool with a mapping row owned by the requester's tenant | Synthetic | None | Assert exactly one `DELETE` query by mapping id, 200/204 response |
| (new route) cross-tenant | Mock pool where the mapping's own stage belongs to a different `tenant_id` | Synthetic | None | Assert `res._s === 404`, zero `DELETE` calls |
| (shape) | Server source text | Synthetic | None | Assert the new `DELETE` dispatch regex and that it's distinct from every existing `/stages`/`/feature-mappings` entry |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Delivery view shows mapped features with their selected metric keys and values

- **Verifies:** AC1
- **Action:** Call `handleGetJourneyCanvas` with a mocked mapping-query result for one stage: `{ feature_slug: 'feat-a', metric_keys: ['m1'] }`, and a mocked `pipeline-state.json` feature `{ slug: 'feat-a', name: 'Feature A', metricValues: { m1: '0.42' } }`
- **Expected result:** The stage's delivery-view annotation row lists "Feature A (feat-a)" and "m1: 0.42"
- **Edge case:** No

### A feature mapped with zero metric keys shows "No metrics selected"

- **Verifies:** AC1
- **Action:** Mock mapping `{ feature_slug: 'feat-b', metric_keys: [] }`
- **Expected result:** The annotation row for `feat-b` shows the exact text "No metrics selected"
- **Edge case:** Yes

### Switching the view toggle shows/hides annotation rows via CSS class with no fetch call

- **Verifies:** AC3
- **Action:** Render the canvas (real script extraction + jsdom, same technique as `check-ep2-s1-feature-picker.js`/`check-ep2-s2-feature-mapping-save.js`), stub `window.fetch` to record calls, click the "Delivery" view-toggle button, then click "Canvas"
- **Expected result:** After clicking "Delivery", the canvas root element's class list includes `sw-journey-canvas--view-delivery` and a `.sw-stage-annotations--delivery` block is visible (computed/inline style, not `display:none`); after clicking "Canvas", the class reverts and the annotation block is hidden again. Zero `fetch` calls recorded throughout — confirming the toggle never hits the network
- **Edge case:** No

---

## Integration Tests

### A stage with zero mappings shows "No features mapped"

- **Verifies:** AC1 (boundary)
- **Action:** Mock pool returns zero rows from the mappings query for a given stage
- **Expected result:** That stage's delivery-view annotation area shows the exact text "No features mapped", not an empty `<div>`

### A mapped feature no longer in pipeline-state.json shows a Feature-not-found warning with a Remove affordance

- **Verifies:** AC2
- **Action:** Mock mapping `{ id: 'map-1', feature_slug: 'ghost-feature' }`; mocked features list has no entry with that slug
- **Expected result:** Renders "⚠️ Feature not found (ghost-feature)" and a `<button class="sw-feature-mapping-remove" data-mapping-id="map-1" data-stage-id="...">` — no exception thrown, no silent omission of the row

### A selected metric key with no recorded value shows "No value recorded"

- **Verifies:** AC4
- **Action:** Mock mapping `{ feature_slug: 'feat-a', metric_keys: ['m2'] }`; mocked feature `feat-a` has `metricValues: {}` (no `m2` entry)
- **Expected result:** Renders "m2: No value recorded" — not blank, not a thrown error, not omitted from the row
- **Edge case:** Yes

### Removing an orphaned mapping deletes exactly the one targeted row

- **Verifies:** (new route) happy path
- **Components involved:** New `handleDeleteFeatureMapping` handler, mock pool
- **Precondition:** Mock pool with one mapping row owned by the requester's tenant (via the stage/journey ownership join, matching `handlePostFeatureMapping`'s own precedent)
- **Action:** `DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId`
- **Expected result:** Exactly one `DELETE FROM feature_customer_journey_stage_mappings WHERE id = $1` (plus an ownership-scoping predicate), response 200/204

### A cross-tenant mapping delete returns 404, not 403, with no deletion

- **Verifies:** (new route) cross-tenant
- **Action:** `DELETE` against a mapping whose own stage belongs to a different `tenant_id`
- **Expected result:** `res._s === 404` (matching D13's own established policy), zero `DELETE` calls issued, ownership checked before any mutation attempt
- **Edge case:** Yes

### The new DELETE feature-mappings route does not collide with existing stage/feature-mapping route regexes

- **Verifies:** (shape)
- **Action:** Read `server.js`'s own dispatch source text
- **Expected result:** A regex matching `DELETE /journeys/:id/stages/:stageId/feature-mappings/:mappingId`, distinct from the existing `POST /stages/:stageId/feature-mappings` entry and every other `/stages`-family regex — confirmed by testing each existing regex against the new path/method pair and asserting no false match
- **Edge case:** Yes
