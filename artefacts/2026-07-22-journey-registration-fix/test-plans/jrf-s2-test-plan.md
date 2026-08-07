## Test Plan: Register product-feature journeys in the shared in-memory store

**Story reference:** artefacts/2026-07-22-journey-registration-fix/stories/jrf-s2-register-product-feature-journeys.md
**Epic reference:** None — short-track
**Test plan author:** Claude (autonomous, short-track)
**Date:** 2026-07-22
**Test runner confirmed from package.json:** `node scripts/run-all-tests.js`

**Critical test-authoring note:** jrf-s1's own test file (`tests/check-jrf-s1-new-feature-redirect.js`) contains a **hand-copied reimplementation** of `handlePostProductFeature` inside the test file itself (`handlePostProductFeatureFixed`), rather than importing and calling the real, exported function from `routes/products.js`. This is exactly the mock-shape-divergence pattern CLAUDE.md's own established convention warns against (see tir-s5/tir-s8) — the test validated a hand-written stand-in, not production code, which is why it never caught this bug. Every test in this plan calls the REAL exported `handlePostProductFeature` directly.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Journey registered in-memory at creation | — | 1 test | — | — | — | 🟢 |
| AC2 | activeSession actually set, not silently dropped | — | 1 test | — | — | — | 🟢 |
| AC3 | product_id persists to the real column | — | 1 test | — | — | — | 🟢 |
| AC4 | gate-confirm succeeds end-to-end | — | 1 test | — | — | — | 🟢 |
| AC5 | Existing product-view journeys listing unaffected | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All server-side logic, no CSS-layout concern.

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Notes |
|----|-------------|--------|-------|
| AC1-AC3 | A real (`freshRequire`'d) `journey-store.js` module (cleared via `_clearForTesting`), a fake Postgres pool for `handlePostProductFeature`'s own direct queries, and a stub `journey-store-pg.js` adapter wired via `setPgAdapterForTesting` | Synthetic | Uses the real modules, not reimplementations |
| AC4 | A journey created via the fixed `handlePostProductFeature`, its skill session marked `done`, an artefact path | Synthetic, mirrors `handlePostGateConfirm`'s own existing test conventions | |
| AC5 | A mock main pool returning the created journey row when queried by `product_id` | Synthetic | |

### Gaps

None — all test data is available now and self-contained.

---

## Integration Tests

### IT1 — handlePostProductFeature registers the journey in the real in-memory store (AC1)

- **Verifies:** AC1
- **Components involved:** `routes/products.js`'s real `handlePostProductFeature`, the real `modules/journey-store.js`.
- **Precondition:** `journeyStore._clearForTesting()`; a fake pool that accepts any query.
- **Action:** Call the real `handlePostProductFeature(req, res, null, fakePool, fakePosthog)`.
- **Expected result:** After the call, `journeyStore.getJourney(<the journeyId the handler redirected to>)` returns a real, non-null journey object.

### IT2 — activeSession is genuinely set, not a silent no-op (AC2)

- **Verifies:** AC2
- **Precondition:** Same as IT1.
- **Action:** Same call.
- **Expected result:** The retrieved journey's `activeSessionId` and `activeSkill` (`'discovery'`) are both populated — not `null`/undefined, proving `setActiveSession` found a real in-memory entry to mutate.

### IT3 — product_id persists to the real Postgres column, not just JSONB (AC3)

- **Verifies:** AC3
- **Components involved:** `routes/products.js`, `modules/journey-store.js`, `adapters/journey-store-pg.js` (stubbed via `setPgAdapterForTesting`).
- **Precondition:** A stub PG adapter recording every `saveJourney` call's arguments.
- **Action:** Call the real handler with a known `productId`.
- **Expected result:** The stub's recorded `saveJourney` call was invoked with a journey object whose `.productId` equals the real `productId` from the request — proving the value reaches the adapter layer responsible for writing the real column (the adapter-layer SQL change itself is verified separately at the unit level, U1 below).

### U1 — journey-store-pg.js's saveJourney writes product_id into the real column (AC3)

- **Verifies:** AC3
- **Components involved:** `adapters/journey-store-pg.js`.
- **Precondition:** A fake `pg.Pool`-shaped object recording the exact SQL + params passed to `query()`.
- **Action:** Call `saveJourney({ journeyId: 'j1', tenantId: 't1', ownerId: 'o1', featureSlug: 'f1', productId: 'p1' })`.
- **Expected result:** The recorded SQL text includes `product_id` in both the INSERT column list and the `ON CONFLICT ... DO UPDATE SET` clause; the params array includes `'p1'`.

### IT4 — gate-confirm succeeds for a journey created via the fixed flow (AC4)

- **Verifies:** AC4
- **Components involved:** `routes/products.js`'s `handlePostProductFeature`, `routes/journey.js`'s `handlePostGateConfirm`, `modules/journey-store.js`, `modules/skills` (session registration).
- **Precondition:** Create a journey via the real, fixed `handlePostProductFeature`. Mark its registered skill session `done: true` with a valid `artefactPath`/`artefactContent`.
- **Action:** Call the real `handlePostGateConfirm(req, res)` for that journey's ID.
- **Expected result:** No 404 "Journey not found" — the handler proceeds past the journey/session lookup (may still hit other, unrelated preconditions depending on fixture completeness, but must not fail at the specific `getJourney` null-check this story targets).

### IT5 — the product-view journeys listing query picks up the journey correctly (AC5)

- **Verifies:** AC5
- **Precondition:** A journey created via the fixed handler, with a real `productId`.
- **Action:** Query `SELECT journey_id, feature_slug FROM journeys WHERE product_id = $1` (the exact query `handleGetProductView` already uses) against the same fake/stub pool the journey was created against.
- **Expected result:** The created journey's row appears in the result set.

---

## Out of Scope for This Test Plan

- Any test of the ~2 pre-existing placeholder journeys or the operator's own already-broken journey — not retroactively repaired (per the story's own Out of Scope section).
- Any test of `handlePostJourney`'s own already-correct behaviour — untouched, not this story's concern.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| jrf-s1's own existing test file (`check-jrf-s1-new-feature-redirect.js`) tests a hand-copied reimplementation, not the real function — this gap is NOT closed by this test plan (out of scope: fixing that file's own test methodology is a separate concern) | Fixing jrf-s1's own test file is out of this story's scope; this test plan's own tests import and call the real function directly instead, so the actual production code is what's verified here | Flagged as a `/improve` candidate in decisions.md — future story tests for `routes/products.js` handlers should always import the real module, never hand-copy a handler's logic into the test file itself |
