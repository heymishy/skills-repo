## Test Plan: Make product sync fire-and-forget with client-side polling

**Story reference:** artefacts/2026-09-03-product-sync-timeout-fix/stories/pst-s1-make-product-sync-async-with-polling.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Immediate response before background sync completes | 1 | — | — | — | — | 🟢 |
| AC2 | Background success still updates product_rollups | — | 1 | — | — | — | 🟢 |
| AC3 | Background failure is logged, not swallowed | 1 | — | — | — | — | 🟢 |
| AC4 | Client polls status + reloads on completion | 1 | — | — | 1 | DOM-behaviour | 🟡 |
| AC5 (regression) | Existing isSyncing button-disable on page load unaffected | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language found (no drag-drop, no `getBoundingClientRect`, no pointer coordinates). AC4's client-side polling *logic* is verified by presence/shape assertions on the rendered inline `<script>` (matching this repo's own established convention for testing embedded client JS — e.g. `check-pdt-s2-triage-summary-strip.js`'s own `pvcFilterByHealth` reuse check — never literal jsdom/timer execution of the script). The *runtime timing behaviour* (does it genuinely poll every ~3s, does it genuinely reload) is real DOM-behaviour outside what a string-presence assertion can prove — flagged as a gap below, not silently assumed correct.

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Node test runner | Handling |
|-----|----|----------|--------------------------|---------|
| Runtime polling cadence and reload-on-completion behaviour in a real browser | AC4 | DOM-behaviour | The test runner (`scripts/run-all-tests.js`, plain Node assertions) has no browser/DOM environment; this repo has no E2E framework configured (confirmed: no `tests/e2e/*.spec.js` exists for this route today, and `playwright.config.js`'s own test set doesn't cover `/products/:id/sync`). Verifying the *presence and correct shape* of the polling code (fetch URL, interval constant, reload call) is testable and covered by a unit test; verifying it *actually behaves that way when a browser runs it* is not, without adding E2E tooling for this one story. | Manual scenario — see AC verification script 🟡 (not 🔴, since this is a lower-severity UX-timing behaviour, not a CSS-layout-dependent correctness risk) |

---

## Test Data Strategy

**Source:** Synthetic — generated in test setup, no real data involved
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — reuses this repo's own established mock-`pool`/mock-`req`/mock-`res` pattern for testing `products.js` route handlers directly (e.g. `check-dfr-s1-fix-delete-feature-redirect.js`'s own `makeRes()` helper).

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | A deferred-promise mock for the sync adapter (so the test controls exactly when the "slow" work resolves) | Synthetic, in-test | None | |
| AC2 | Same deferred-promise mock, resolved after asserting the immediate response already happened | Synthetic, in-test | None | |
| AC3 | A mock sync adapter that rejects, plus a captured `console.error` call | Synthetic, in-test | None | |
| AC4 | The rendered HTML from `_renderProductView` (string presence check on the inline script) | Synthetic, in-test | None | |
| AC5 | Same `isSyncing`-fixture pattern already used by the pre-existing `check-pr-s2-products-route.js` test this AC guards against regressing | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the AC4 DOM-behaviour gap already named above.

---

## Unit Tests

### Sync route responds immediately, before the background sync work resolves
- **Verifies:** AC1
- **Precondition:** A mock `_pipelineStateFetchAdapter` whose `getPipelineStateFetchAdapter()(...)` call returns a Promise that does not resolve until the test explicitly releases it (a deferred/controllable promise). Valid product/tenant, no sync already in progress, repo configured.
- **Action:** Call `handlePostProductSync(req, res, null, pool, null)` and, without awaiting the full handler to finish its background work, check `res`'s own state immediately after the handler's own synchronous/pre-flight portion completes.
- **Expected result:** `res.writeHead`/`res.end` (the immediate acknowledgment) has already been called with a success status *before* the deferred promise is released — proving the response does not wait on the actual sync work.
- **Edge case:** No

### Background sync failure is logged, not silently swallowed
- **Verifies:** AC3
- **Precondition:** A mock sync adapter that rejects with a real Error after the immediate response has already been sent.
- **Action:** Call the handler, confirm the immediate response already succeeded, then let the background promise reject; capture `console.error` calls during that window.
- **Expected result:** `console.error` (or the repo's own established server-side logging call) was invoked with the error's message — the failure is diagnosable server-side, not lost.
- **Edge case:** Yes — the failure happens *after* the response has already been sent, so there is no HTTP request left to receive it directly.

### Rendered page includes real polling logic targeting the status endpoint
- **Verifies:** AC4 (the testable, presence/shape portion)
- **Precondition:** A fixture product with `isSyncing: false` initially, rendered via `_renderProductView`.
- **Action:** Inspect the rendered HTML's inline `<script>` content.
- **Expected result:** The script contains a `fetch` call targeting a `/products/:id/sync/status`-shaped URL, a real interval/polling construct (not a single one-shot fetch), and a `window.location.reload()` call gated on the polled status — confirming the *shape* of the fix is present, matching this repo's own established convention for testing embedded client JS (string/regex presence on rendered markup, not literal execution).
- **Edge case:** No

### Existing isSyncing-driven button-disable state on page load is unaffected (regression guard)
- **Verifies:** AC5
- **Precondition:** Same fixture pattern as the pre-existing `check-pr-s2-products-route.js`'s own "Refresh control is disabled while a sync is in progress (AC4)" test — a product with `isSyncing: true`.
- **Action:** Call `_renderProductView(...)` with `isSyncing: true`.
- **Expected result:** The Refresh button still renders `disabled` with `textContent`/label `"Syncing…"`, unchanged from before this story's changes — confirms this story's changes to the *trigger* mechanism did not regress the pre-existing *display* mechanism, which is separate code this story does not touch.
- **Edge case:** No

---

## Integration Tests

### Background sync success still writes to product_rollups exactly as it does today
- **Verifies:** AC2
- **Components involved:** `handlePostProductSync`, `triggerProductSync`, the mock `pool`'s own UPSERT call capture
- **Precondition:** A mock `pool` and a deferred-promise-controlled `_pipelineStateFetchAdapter` returning valid pipeline-state JSON content.
- **Action:** Call the handler, confirm the immediate AC1 response already happened, then release the deferred promise and await its resolution.
- **Expected result:** The mock `pool.query` was called with the same `INSERT INTO product_rollups ... ON CONFLICT ... DO UPDATE` shape this repo's own `syncProductRollup` already uses today — confirming the actual sync logic and its data-write behaviour are unchanged, only the response timing is different.

---

## NFR Tests

### Immediate acknowledgment response returns in well under 1 second
- **NFR addressed:** Performance
- **Measurement method:** Measure elapsed wall-clock time between calling `handlePostProductSync` and `res.end` being invoked, using a deliberately slow (multi-second, deferred) mock sync adapter — the response must return long before that mock ever resolves.
- **Pass threshold:** Immediate response observed in under 1000ms, regardless of how long the mock background work is configured to take (proves decoupling, not just "it happened to be fast in this run").
- **Tool:** Node.js assert-based test helper (this repo's `npm test` runner), using `Date.now()` deltas.

### Syncing state remains a real, disabled button — not a silent background operation
- **NFR addressed:** Accessibility
- **Measurement method:** Covered by the AC5 regression-guard unit test above — confirms a real `disabled` attribute and visible `"Syncing…"` label, not a change with no user-visible feedback.
- **Pass threshold:** Same as AC5's own expected result.
- **Tool:** Node.js assert-based test helper (shared with the AC5 test — no separate NFR-only test needed).

**Security:** None — confirmed with story owner. No new external input, no new attack surface; the same tenant/product validation already performed today runs unchanged before the response is sent.

**Audit:** None — confirmed with story owner. No new data write; `product_rollups.synced_at` remains the unchanged audit trail for sync completion.

---

## Out of Scope for This Test Plan

- Real end-to-end browser verification of the polling interval's exact timing and the reload behaviour — covered by the AC verification script's manual scenario instead (see Coverage gaps).
- Load-testing how many products' syncs can run concurrently — this story does not change concurrency limits, only per-request response timing.
- Testing `triggerProductSync`'s own internal rollup-computation correctness — that is pre-existing, unmodified logic with its own pre-existing test coverage.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-browser polling/reload timing (AC4) | No E2E framework configured for this specific route; adding one is a larger, separate initiative than this bounded bug fix | Manual verification scenario in the AC verification script, run pre-code (spec sign-off) and post-merge (smoke test) — see verification-scripts/pst-s1-verification.md |
