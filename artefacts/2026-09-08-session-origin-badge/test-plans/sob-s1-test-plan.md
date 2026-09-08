## Test Plan: Shared session-origin derivation + product feature-list indicator

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s1-shared-derivation-and-product-list-indicator.md
**Epic reference:** artefacts/2026-09-08-session-origin-badge/epics/session-origin-visibility.md
**Test plan author:** Copilot
**Date:** 2026-09-08

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js`, which aggregates plain-Node `tests/check-*.js` files (this repo's own convention — no Jest/Mocha). New files: `tests/check-sob-s1-session-origin-derivation.js` (unit, the `deriveSessionOrigin` function contract) and `tests/check-sob-s1-product-list-integration.js` (integration, `handleGetProductView`/`_renderProductView` rendering). Both registered in `scripts/run-all-tests.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fully session-backed → indicator shown | 1 test | — | — | — | — | 🟢 |
| AC2 | Mixed → indicator shown | 1 test | — | — | — | — | 🟢 |
| AC3 | Real journey, no sessionId → "no session" | 1 test | — | — | — | — | 🟢 |
| AC4 | Taxonomy-only (no journey) → "no session" | — | 1 test | — | — | — | 🟢 |
| AC5 | Zero completed stages → no indicator | 1 test | 1 test | — | — | — | 🟢 |
| AC6 | Bulk lookup called exactly once per render | — | 1 test | — | — | — | 🟢 |
| AC7 | Bulk-read failure degrades gracefully | — | 1 test | — | — | — | 🟢 |
| AC8 | Text-equivalent present on every state | — | 1 test | — | — | — | 🟢 |
| AC9 | `hasJourney` contract, both branches | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None — every AC is covered by an automated unit or integration test. No CSS-layout-dependent, browser-rendering, or drag/pointer-coordinate behaviour is involved (this is a static, non-interactive indicator per the story's own MVP scope) — Step 3a's E2E/browser-layout scan found no trigger patterns in any AC.

---

## Test Data Strategy

**Source:** Synthetic — generated directly in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixture journey/`mergedItems` objects in setup

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey-shaped object: `{ hasJourney: true, completedStages: [{ sessionId: 'x' }, { sessionId: 'y' }] }` | Synthetic, inline in test | None | |
| AC2 | Same shape, one entry with `sessionId` and one without | Synthetic, inline | None | |
| AC3 | Same shape, `hasJourney: true`, all entries with `sessionId: null`/absent | Synthetic, inline | None | |
| AC4 | A `mergedItems`-shaped fixture array with one taxonomy-only entry (no `journeyId`) | Synthetic, mirrors `product-rollup.js`'s real `mergeFeatureSources` output shape | None | |
| AC5 | `{ hasJourney: true, completedStages: [] }` (unit); a `mergedItems` fixture with a journey that has zero completed stages (integration) | Synthetic, inline | None | |
| AC6 | A `mergedItems` fixture array with 3+ journey-backed entries, plus a spy on `_getSessionOriginBulk` (via `setGetSessionOriginBulk`, mirroring the existing `setGetArtefactCountsBulk` test seam) | Synthetic + injected spy | None | |
| AC7 | Same as AC6, but the injected bulk function throws | Synthetic + injected spy | None | |
| AC8 | Fixtures covering all three states, rendered HTML inspected for `title`/`aria-label` | Synthetic, inline | None | |
| AC9 | `{ hasJourney: false, completedStages: [] }` and `{ hasJourney: true, completedStages: [] }` called directly | Synthetic, inline | None | |

### PCI / sensitivity constraints

None — journey existence and stage-completion state are operational metadata, not sensitive/regulated data (per `nfr-profile.md`).

### Gaps

None — all test data is synthetic and available immediately.

---

## Unit Tests

### `deriveSessionOrigin` returns "fully-session-backed" when every completed stage has a sessionId

- **Verifies:** AC1
- **Precondition:** None — pure function
- **Action:** Call `deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: 's1' }, { sessionId: 's2' }] })`
- **Expected result:** Returns `"fully-session-backed"`
- **Edge case:** No

### `deriveSessionOrigin` returns "mixed" when some completed stages have a sessionId and some don't

- **Verifies:** AC2
- **Precondition:** None
- **Action:** Call `deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: 's1' }, { sessionId: null }] })`
- **Expected result:** Returns `"mixed"`
- **Edge case:** No

### `deriveSessionOrigin` returns "no-session" when a real journey has zero sessionId-bearing completed stages

- **Verifies:** AC3
- **Precondition:** None
- **Action:** Call `deriveSessionOrigin({ hasJourney: true, completedStages: [{ sessionId: null }, { sessionId: undefined }] })`
- **Expected result:** Returns `"no-session"`
- **Edge case:** No

### `deriveSessionOrigin` returns `null` when a real journey has zero completed stages

- **Verifies:** AC5
- **Precondition:** None
- **Action:** Call `deriveSessionOrigin({ hasJourney: true, completedStages: [] })`
- **Expected result:** Returns `null`
- **Edge case:** Yes — this is the "nothing to classify yet" state, distinct from "no-session"

### `deriveSessionOrigin` returns "no-session" when `hasJourney` is false, regardless of `completedStages`

- **Verifies:** AC9
- **Precondition:** None
- **Action:** Call `deriveSessionOrigin({ hasJourney: false, completedStages: [] })` and `deriveSessionOrigin({ hasJourney: false, completedStages: [{ sessionId: 's1' }] })`
- **Expected result:** Both calls return `"no-session"` — `completedStages` content is irrelevant when `hasJourney` is `false`
- **Edge case:** Yes — proves `hasJourney: false` always short-circuits to "no-session"

### `deriveSessionOrigin`'s `hasJourney: true` + empty array and `hasJourney: false` + empty array are distinguishable

- **Verifies:** AC9 (the specific contract distinction from `decisions.md`)
- **Precondition:** None
- **Action:** Call `deriveSessionOrigin({ hasJourney: true, completedStages: [] })` and `deriveSessionOrigin({ hasJourney: false, completedStages: [] })` in the same test
- **Expected result:** First call returns `null`; second returns `"no-session"` — both given the identical empty `completedStages` array, proving the distinction comes from `hasJourney`, not the array
- **Edge case:** Yes — this is the exact regression this AC exists to prevent (see `decisions.md`, 2026-09-08)

---

## Integration Tests

### Product feature-list page shows "no session" for a taxonomy-only merged item with no journeyId

- **Verifies:** AC4
- **Components involved:** `_buildGroupedFromTrace`-adjacent merge output (`_renderProductView`'s `mergedItems`), `deriveSessionOrigin`, the row-rendering function
- **Precondition:** A `mergedItems`-shaped fixture array containing one entry with `source: 'taxonomy'` and no `journeyId` field (mirrors `product-rollup.js`'s real `mergeFeatureSources` output for a taxonomy-only feature)
- **Action:** Render the product feature list with this fixture
- **Expected result:** The rendered HTML for that row contains the "no session" indicator markup

### Product feature-list page shows no session-origin indicator for a feature with zero completed stages

- **Verifies:** AC5
- **Components involved:** Same rendering path as above
- **Precondition:** A `mergedItems` fixture entry with a real `journeyId` but whose corresponding journey has `completedStages: []`
- **Action:** Render the product feature list
- **Expected result:** The rendered HTML for that row contains no session-origin indicator element at all (absence asserted, not a specific "none" glyph)

### `_getSessionOriginBulk` is called exactly once per page render, regardless of row count

- **Verifies:** AC6
- **Components involved:** `handleGetProductView`, `_getSessionOriginBulk`/`setGetSessionOriginBulk` seam
- **Precondition:** A fixture with 5 journey-backed features (via `setGetSessionOriginBulk` injecting a call-counting spy)
- **Action:** Render the product feature-list page once
- **Expected result:** The spy's call count is exactly 1, called with an array of all 5 journeyIds (built from `mergedItems`, not the raw `rows` array — per the 1-M1 review fix)

### Page renders successfully with no indicators when `_getSessionOriginBulk` throws

- **Verifies:** AC7
- **Components involved:** `handleGetProductView`
- **Precondition:** `setGetSessionOriginBulk` injects a function that throws synchronously
- **Action:** Render the product feature-list page
- **Expected result:** The page renders with HTTP 200 and complete HTML; no session-origin indicator appears on any row; no unhandled exception propagates to the response

### Every rendered session-origin indicator carries a text-equivalent

- **Verifies:** AC8
- **Components involved:** Row-rendering function
- **Precondition:** Fixtures covering "fully-session-backed", "mixed", and "no-session" states
- **Action:** Render each state and inspect the resulting HTML element
- **Expected result:** Each indicator element has a non-empty `title` or `aria-label` attribute naming the exact state in words (e.g. containing "session-backed", "mixed", or "no session" as substrings, not just a bare icon/colour)

---

## NFR Tests

### Bulk lookup call count (Performance)

- **NFR addressed:** Performance
- **Measurement method:** Call-count assertion via the injected `setGetSessionOriginBulk` spy — same test as the AC6 integration test above (per EXP-007's NFR-test-scope rule, this NFR is a pure call-count/threshold check with no functional assertion mixed in, so no separate duplicate test is written)
- **Pass threshold:** Exactly 1 call per page render, regardless of row count
- **Tool:** `node scripts/run-all-tests.js` (this repo's own runner)

### Text-equivalent presence (Accessibility)

- **NFR addressed:** Accessibility
- **Measurement method:** DOM/string assertion on the rendered indicator's `title`/`aria-label` attribute — same test as the AC8 integration test above
- **Pass threshold:** 100% of rendered indicators (all 3 states) carry a non-empty text-equivalent
- **Tool:** `node scripts/run-all-tests.js`

---

## Out of Scope for This Test Plan

- `/journey` and org kanban rendering — covered by `sob-s2-test-plan.md` and `sob-s3-test-plan.md`.
- Any drag/click/drill-down interaction on the indicator — not part of this story's MVP scope, nothing to test.
- Real Postgres integration (actual `getSessionOriginForJourneys` SQL query correctness) — the injectable seam is unit/integration tested via the spy; a real-DB smoke check happens post-merge on staging per this session's own established RISK-ACCEPT pattern for Postgres-backed features (see `decisions.md` precedent from the `cat-*` epic).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| `getSessionOriginForJourneys`'s real SQL correctness against a live Postgres `journeys` table | No local `DATABASE_URL` in the standard test run; the seam is mocked/spied in all automated tests | Verified against real staging data post-merge (same pattern this session used for `cat-s5`'s Postgres-backed wiring) — noted in the AC verification script's post-merge scenario |
