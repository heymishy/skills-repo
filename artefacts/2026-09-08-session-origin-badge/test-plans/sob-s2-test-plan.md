## Test Plan: Session-origin indicator on the /journey dashboard

**Story reference:** artefacts/2026-09-08-session-origin-badge/stories/sob-s2-journey-dashboard-indicator.md
**Epic reference:** artefacts/2026-09-08-session-origin-badge/epics/session-origin-visibility.md
**Test plan author:** Copilot
**Date:** 2026-09-08

**Test runner (confirmed from `package.json`):** `npm test` → `node scripts/run-all-tests.js`. New file: `tests/check-sob-s2-journey-dashboard-integration.js`, registered in `scripts/run-all-tests.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Real journey, fully session-backed → indicator shown | — | 1 test | — | — | — | 🟢 |
| AC2 | Real journey, mixed → indicator shown | — | 1 test | — | — | — | 🟢 |
| AC3 | Synthesized (no real journey) entry → "no session" via `hasJourney: false` | — | 1 test | — | — | — | 🟢 |
| AC4 | Real journey, zero completed stages → no indicator | — | 1 test | — | — | — | 🟢 |
| AC5 | No new query beyond what `_renderJourneyHome` already performs | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. `deriveSessionOrigin` itself is already unit-tested in `sob-s1-test-plan.md` — this story's tests only cover the new call site wiring it into `/journey`'s rendering, not the function's own internal logic (avoiding duplicate coverage of the same contract).

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A real-journey-shaped fixture with `completedStages` all carrying `sessionId` | Synthetic | None | |
| AC2 | Same shape, mixed `sessionId` presence | Synthetic | None | |
| AC3 | A synthesized-entry fixture matching `_mergeStateFeaturesIntoJourneyList`'s real output shape (`{ featureSlug, currentStage, productProfile, createdAt, stages: {} }`, no `completedStages` field at all) | Synthetic, mirrors real code shape verified during `/design` and `/definition` | None | |
| AC4 | A real-journey-shaped fixture with `completedStages: []` | Synthetic | None | |
| AC5 | A spy/counter on the existing `listJourneys`/`_mergeStateFeaturesIntoJourneyList` call sites, asserting call count is unchanged from the pre-story baseline | Synthetic + call-count spy | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

None for this story — see Coverage gaps above. All logic reuses `deriveSessionOrigin`, already unit-tested in `sob-s1-test-plan.md`.

---

## Integration Tests

### /journey card shows "fully session-backed" for a real journey with all stages session-backed

- **Verifies:** AC1
- **Components involved:** `_renderJourneyHome`, `deriveSessionOrigin` (reused)
- **Precondition:** A real-journey fixture in the `journeys` array passed to `_renderJourneyHome`, `completedStages` all with `sessionId`
- **Action:** Render the `/journey` dashboard with this fixture
- **Expected result:** That card's rendered HTML contains the "fully-session-backed" indicator, using the same markup/class as sob-s1's product-page treatment

### /journey card shows "mixed" for a real journey with partial session coverage

- **Verifies:** AC2
- **Components involved:** Same as above
- **Precondition:** A real-journey fixture with mixed `sessionId` presence across `completedStages`
- **Action:** Render `/journey`
- **Expected result:** That card shows the "mixed" indicator

### /journey card shows "no session" for a synthesized entry, without erroring on a missing completedStages field

- **Verifies:** AC3
- **Components involved:** `_renderJourneyHome`, the card-level `hasJourney` classification logic, `deriveSessionOrigin`
- **Precondition:** A fixture entry matching `_mergeStateFeaturesIntoJourneyList`'s real synthesized shape (no `completedStages` property at all — not an empty array, the property is absent)
- **Action:** Render `/journey` with this fixture mixed in among real-journey entries
- **Expected result:** That card shows the "no-session" indicator; rendering does not throw or read `undefined.length` or similar on the missing field

### /journey card shows no indicator for a real journey with zero completed stages

- **Verifies:** AC4
- **Components involved:** Same as above
- **Precondition:** A real-journey fixture with `completedStages: []`
- **Action:** Render `/journey`
- **Expected result:** No session-origin indicator element present for that card

### /journey's own listJourneys/_mergeStateFeaturesIntoJourneyList call count is unchanged by this story

- **Verifies:** AC5
- **Components involved:** `_renderJourneyHome`'s calling code (the route handler that invokes `listJourneys`/`_mergeStateFeaturesIntoJourneyList`)
- **Precondition:** Spies/counters wrapping both functions, captured once before this story's changes (documented baseline: 1 call each per page render) and asserted again after
- **Action:** Render `/journey` once
- **Expected result:** Both functions are still called exactly once per render — identical count to the pre-story baseline, proving no new query was introduced

---

## NFR Tests

### No new query introduced (Performance)

- **NFR addressed:** Performance
- **Measurement method:** Same test as the AC5 integration test above — a pure call-count assertion, no functional assertion mixed in (per EXP-007)
- **Pass threshold:** Zero net-new calls to any data-fetching function
- **Tool:** `node scripts/run-all-tests.js`

### Text-equivalent on every indicator (Accessibility)

- **NFR addressed:** Accessibility
- **Measurement method:** Reuses sob-s1's own indicator markup unchanged (same component, same `title`/`aria-label` attribute) — no new accessibility surface introduced by this story, so no new test is needed beyond confirming the same markup is emitted (implicitly covered by the AC1/AC2/AC3 integration tests, which assert on the full rendered element)
- **Pass threshold:** Same as sob-s1
- **Tool:** `node scripts/run-all-tests.js`

---

## Out of Scope for This Test Plan

- `deriveSessionOrigin`'s own internal logic — covered by `sob-s1-test-plan.md`.
- Org kanban rendering — covered by `sob-s3-test-plan.md`.
- Any change to what `_mergeStateFeaturesIntoJourneyList` synthesizes or when — this story only consumes its existing, unchanged output.

---

## Test Gaps and Risks

None identified — all test data is synthetic, all logic is either reused (already tested) or a small, fully-mockable call site.
