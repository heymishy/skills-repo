## Test Plan: Show last-synced freshness and a manual refresh action

**Story reference:** artefacts/2026-07-16-product-rollup/stories/pr-s3.md
**Epic reference:** artefacts/2026-07-16-product-rollup/epics/pr-e1-foundation.md
**Test plan author:** Claude (agent)
**Date:** 2026-07-17

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Human-readable last-synced timestamp shown | 1 test | — | — | — | — | 🟢 |
| AC2 | Refresh triggers sync, updates timestamp + rollup | — | 1 test | — | — | — | 🟢 |
| AC3 | Never-synced state shown clearly with a trigger action | 1 test | — | — | — | — | 🟢 |
| AC4 | In-progress state disables Refresh, prevents concurrent syncs | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Mixed — synthetic cache-row fixtures with known `synced_at` values, mocked sync mechanism (reusing pr-s2's own mocked-fetch approach) for the Refresh integration test.
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A cache row fixture with a known `synced_at` timestamp (e.g. 2 hours before test run time) | Synthetic | None | Test asserts the human-readable string, not the raw timestamp |
| AC2 | pr-s2's mocked-fetch sync mechanism, plus a cache row with an initial `synced_at`/rollup value | Mocked + synthetic | None | Reuses pr-s2's own test fixtures rather than duplicating the Contents API mock |
| AC3 | A product with no cache row at all | Synthetic — omit the row | None | Tests the absence case explicitly |
| AC4 | A way to simulate an in-flight sync (e.g. a sync promise that hasn't resolved yet) | Synthetic — controlled promise/mock timing | None | Requires control over timing to assert the "in progress" window specifically |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### formats a synced_at timestamp as a human-readable relative time

- **Verifies:** AC1
- **Precondition:** A cache row fixture with `synced_at` set to exactly 2 hours before the test's "now".
- **Action:** Call the formatting function that turns `synced_at` into display text.
- **Expected result:** Output reads as a relative time matching "2 hours ago" (exact wording may vary, but must be human-readable, not a raw ISO timestamp or epoch number).
- **Edge case:** No.

### shows a "Not yet synced" state when no cache row exists

- **Verifies:** AC3
- **Precondition:** A product with no cache row.
- **Action:** Render the freshness section for this product.
- **Expected result:** Output is an explicit "Not yet synced" state (not a blank string, not "Invalid Date", not a misleading default timestamp) and includes a visible trigger-first-sync action.
- **Edge case:** Yes — the empty/absent-data case, distinct from a normal formatted timestamp.

### Refresh control is disabled while a sync is in progress

- **Verifies:** AC4
- **Precondition:** A sync has been triggered and its underlying promise has not yet resolved (controlled via a mock that doesn't resolve until the test explicitly allows it).
- **Action:** Check the Refresh control's disabled state while the promise is still pending.
- **Expected result:** The control's disabled state is `true` while pending, and a loading indicator's presence flag is `true`.
- **Edge case:** Yes — timing-dependent state, tested with controlled promise resolution rather than real delays.

---

## Integration Tests

### clicking Refresh triggers a new sync and updates the rendered rollup and timestamp

- **Verifies:** AC2
- **Components involved:** The Refresh action handler, pr-s2's sync mechanism (mocked fetch), the cache table, `_renderProductView`.
- **Precondition:** An existing cache row with an old `synced_at` and old rollup values; the mocked fetch is set up to return updated `pipeline-state.json` content reflecting a changed feature count.
- **Action:** Trigger the Refresh action.
- **Expected result:** The cache row is updated with a new `synced_at` and the new rollup values; the response/render reflects both the new timestamp and the new rollup data — not the stale pre-refresh values.

### Refresh cannot be triggered twice concurrently for the same product

- **Verifies:** AC4
- **Components involved:** The Refresh action handler, the sync mechanism's in-flight state tracking.
- **Precondition:** A Refresh has just been triggered and its sync is still in progress (controlled via a mock that doesn't resolve immediately).
- **Action:** Attempt to trigger Refresh a second time for the same product before the first completes.
- **Expected result:** The second attempt is rejected or no-ops (does not start a second concurrent sync against the same product) — only one sync's mocked fetch call is recorded during the overlap window.

---

## NFR Tests

### Refresh click shows loading feedback within 200ms

- **NFR addressed:** Performance
- **Measurement method:** Measure the time between the click event firing and the loading-state flag becoming `true` in the UI state.
- **Pass threshold:** Under 200ms — this is a synchronous UI state change, not dependent on the underlying sync's own duration.
- **Tool:** Timestamp comparison in the test (Node `Date.now()` before/after), no external tool needed.

### Sync-in-progress state is distinguishable without relying on colour alone

- **NFR addressed:** Accessibility
- **Measurement method:** Confirm the rendered loading state includes a text label or icon (not only a CSS colour/class change) that a screen reader or colour-blind user would perceive.
- **Pass threshold:** A non-colour signal (text or `aria-` attribute) is present alongside any colour change.
- **Tool:** Assertion against rendered markup/attributes.

---

## Out of Scope for This Test Plan

- Automatic staleness/change detection — explicitly out of scope for this story (see Out of Scope section); MVP shows time-since-last-sync only.
- Full browser E2E testing of the click → loading → updated-timestamp flow — no AC here is CSS-layout-dependent; ADR-018 recommends an E2E spec as a DoR-time architecture-guardrail addition, not required by this test plan's own AC coverage.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | — | — |
