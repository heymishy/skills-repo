## Test Plan: Auto-sync a product's pipeline-state.json immediately on repo connection

**Story reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/stories/urpv-s1-auto-sync-on-repo-connect.md
**Epic reference:** artefacts/2026-11-08-unified-reactive-proactive-visibility/epics/urpv-e1-reactive-work-visibility.md
**Test plan author:** Claude Sonnet 5 (Copilot)
**Date:** 2026-11-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Repo connect triggers `triggerProductSync` without blocking the HTTP response | 2 tests | 1 test | — | — | — | 🟢 |
| AC2 | `isSyncInProgress` guard respected on a re-connect while a sync is already in flight | — | 1 test | — | — | — | 🟢 |
| AC3 | Auto-triggered sync failure is logged server-side; connection is never rolled back or reported as failed | 1 test | — | — | — | — | 🟢 |
| AC4 | Product detail page reflects real rollup data after connect, without a manual Refresh click | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None. All 4 ACs are backend/data-flow behaviour with no CSS-layout or rendered-position dependency — fully coverable by Unit and Integration tests against the existing test runner.

---

## Test Data Strategy

**Source:** Synthetic
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — tests generate their own fixtures in setup

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | Mock repo-connect request body (`productId`, `tenantId`, `repoOwner`, `repoName`, `req.session.accessToken`) | Synthetic | None | `accessToken` is a synthetic test string, never a real token |
| AC2 | Same as AC1, plus a simulated in-flight sync state for the same `productId` | Synthetic | None | |
| AC3 | Mocked `pipeline-state-fetch-adapter.js` call rejecting with a synthetic `Error` | Synthetic | None | |
| AC4 | Minimal valid synthetic `pipeline-state.json` fixture (≥1 feature, with `track`, `stage`, `health`) returned by the mocked adapter | Synthetic | None | Shape matches the real schema's required fields, not the full 45k-line production file |

### PCI / sensitivity constraints

None — all fixtures are synthetic delivery-pipeline metadata (story slugs, stages, health), no PII or payment data, consistent with the feature's own NFR profile data classification ("Internal — non-public but low sensitivity").

### Gaps

None.

---

## Unit Tests

### Does not await triggerProductSync inside the repo-connect handler

- **Verifies:** AC1
- **Precondition:** `triggerProductSync` is mocked to return a promise that never resolves within the test's timeout window.
- **Action:** Call `_applyRepoChange` (or the `POST /products/:id/repo` handler) with a valid connect request.
- **Expected result:** The handler's response (`res.json`/equivalent) completes and the test assertion runs successfully without waiting on the mocked promise — proving the call site is fire-and-forget, not awaited inline.
- **Edge case:** No.

### Calls triggerProductSync with the exact tenant/product scoping from the request

- **Verifies:** AC1; ADR-025 (multi-tenancy)
- **Precondition:** Valid repo-connect request body with a specific `productId`, `tenantId`, `repoOwner`, `repoName`.
- **Action:** Call the handler.
- **Expected result:** `triggerProductSync` is called exactly once, with `productId`/`tenantId`/`repoOwner`/`repoName` arguments matching the request verbatim — no other tenant's identifiers appear in the call.
- **Edge case:** No.

### Logs sync failure without failing or rolling back the repo-connect response

- **Verifies:** AC3
- **Precondition:** `triggerProductSync` mocked to reject with a synthetic `Error('GitHub API error')` after the HTTP response has already been sent.
- **Action:** Call the handler; flush the microtask queue so the rejected promise's `.catch` handler runs.
- **Expected result:** `console.error` / `_posthog.captureException` is called once with the error; the HTTP response status/body already sent is unchanged (still the success connection response); no `UPDATE products` rollback call occurs.
- **Edge case:** Yes — asynchronous rejection occurring strictly after the response has been sent.

### Never persists or logs the accessToken used for the sync call

- **Verifies:** NFR-Security (session-scoped token, never logged); CLAUDE.md canonical field rule
- **Precondition:** Request with `req.session.accessToken` set to a synthetic token string.
- **Action:** Call the handler, including the failure path (forced `triggerProductSync` rejection).
- **Expected result:** `triggerProductSync` receives that same `req.session.accessToken` value as an argument; the captured exception payload and all `console.error` call arguments, when serialized, do not contain the token string.
- **Edge case:** Yes — covers both the success and the logged-failure path.

---

## Integration Tests

### Re-connect while a sync is already in-flight does not start a second sync

- **Verifies:** AC2
- **Components involved:** `product-repo.js` (`_applyRepoChange`), `product-rollup.js` (`triggerProductSync`, `isSyncInProgress`), `pipeline-state-fetch-adapter.js` (mocked at the adapter boundary)
- **Precondition:** `isSyncInProgress(productId)` returns `true` (simulating a sync already running for this product).
- **Action:** Issue a second `POST /products/:id/repo` request for the same product.
- **Expected result:** The mocked adapter's fetch function is not called a second time (asserted via call count); the second request's HTTP response still succeeds (connection itself is not blocked by the guard).
- **Expected result (continued):** The existing `isSyncInProgress` guard inside `triggerProductSync` is the mechanism relied on — this test asserts the call site does not bypass it with its own duplicate-prevention logic.

### Product detail page reflects real data after connect, with no manual Refresh

- **Verifies:** AC4
- **Components involved:** `product-repo.js`, `product-rollup.js`, `pipeline-state-fetch-adapter.js` (mocked to return the synthetic fixture), `products.js` (`_renderProductView`/`handleGetProductView`)
- **Precondition:** A newly-created product with no prior `product_rollups` row (or a stale/empty one).
- **Action:** `POST /products/:id/repo` to connect the repo; in the test, await the triggered sync's promise directly (bypassing the fire-and-forget timing, since the test is verifying the sync's *result*, not AC1's non-blocking behaviour); then `GET /products/:id`.
- **Expected result:** The response reflects `health_counts`/`taxonomy` fields derived from the synthetic fixture's real feature data — not an empty or pre-connection default rollup row.

---

## NFR Tests

### Repo-connect HTTP response returns before the GitHub fetch resolves

- **NFR addressed:** Performance
- **Measurement method:** Mock the pipeline-state-fetch adapter to resolve after an artificial 500ms delay; measure wall-clock time from request start to HTTP response completion.
- **Pass threshold:** Response completes in under 100ms (well under the 500ms mocked fetch delay), proving the response does not wait on the fetch.
- **Tool:** The project's configured test runner (`npm test` → `node scripts/run-all-tests.js`)

### accessToken never appears in a logged exception payload

- **NFR addressed:** Security
- **Measurement method:** Force a sync failure (as in the Unit test above); capture all arguments passed to `console.error`/`_posthog.captureException`; serialize and search for the synthetic token string.
- **Pass threshold:** Zero occurrences of the token string in any captured log/exception argument.
- **Tool:** The project's configured test runner (`npm test`)

---

## Out of Scope for This Test Plan

- A scheduled/periodic background resync — explicitly out of scope for this story per its own "Out of Scope" section and `decisions.md` (2026-11-09, SCOPE); no test needed here since no behaviour is being built.
- The manual Refresh endpoint's own existing behaviour (`handlePostProductSync`) — unchanged by this story, already covered by its own prior test suite.
- urpv-s2/s3/s4's rendering of `track`/`decisions.md`/pod-rollup data — covered by their own test plans; this plan only covers that the underlying data becomes available reliably.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| None | All 4 ACs are fully covered by Unit/Integration tests against existing, already-wired primitives (`triggerProductSync`, `isSyncInProgress`, the mocked adapter boundary) | — |
