## Test Plan: Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion

**Story reference:** artefacts/2026-09-03-product-github-fetch-truncation-fix/stories/pgft-s1-retry-github-fetch-truncation.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Retries up to 3 total attempts on network error or JSON-parse failure | 2 | — | — | — | — | 🟢 |
| AC2 | Diagnostic detail (bytes received, Content-Length) in the final error message | 1 | — | — | — | — | 🟢 |
| AC3 | Non-ok HTTP status never retried, fails immediately unchanged | 1 | — | — | — | — | 🟢 |
| AC4 (regression) | Background-failure logging (pst-s1) unaffected after retries exhaust | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language, no rendered-UI component at all — this story touches only `src/web-ui/adapters/pipeline-state-fetch-adapter.js`, a server-side fetch adapter with no client-facing surface. N/A.

---

## Coverage gaps

None. All 4 ACs are fully coverable with mocked `global.fetch` at the unit level — no external network dependency, no DOM/browser dependency.

**Named residual uncertainty (not a test gap, a product-risk note):** Whether retry-with-backoff actually resolves the production truncation is not fully verifiable pre-merge (it depends on production network conditions this test suite cannot reproduce). The tests below verify the *mechanism* works exactly as designed (retries the right failure classes, the right number of times, with the right diagnostic output) — confirming this story's own implementation is correct, not proving in advance that it fixes the live incident. Story's own Complexity Rating section names this explicitly.

---

## Test Data Strategy

**Source:** Synthetic — mocked `global.fetch` responses in test setup, no real network calls
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — reuses this repo's own established mocked-`global.fetch` pattern already used by `tests/check-pr-s2-pipeline-state-fetch-adapter.js` (T3/T4/T6).

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked `fetch` that throws on the first N calls, then succeeds (or a mocked `res.text()` that returns invalid JSON on the first N calls, then valid) | Synthetic, in-test | None | |
| AC2 | A mocked `res` whose `.text()` always returns truncated/invalid JSON across all 3 attempts, with a `headers.get('content-length')` mock returning a known value | Synthetic, in-test | None | |
| AC3 | A mocked `res` with `ok: false, status: 404` — call-count assertion confirms `fetch` was invoked exactly once | Synthetic, in-test | None | |
| AC4 | Reuses `tests/check-pst-s1-sync-async-polling.js`'s own AC3 pattern: a mocked adapter that ultimately rejects, asserting `console.error` was called | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Retries on a network-level fetch error, succeeds on a later attempt
- **Verifies:** AC1
- **Precondition:** Mocked `global.fetch` that throws a network error (e.g. `TypeError: fetch failed`) on its first call, then returns a valid `ok:true` response with parseable JSON on its second call.
- **Action:** Call `realFetchPipelineState(owner, repo, token)`.
- **Expected result:** The call ultimately resolves with the correct decoded content (does not throw) — confirms the retry loop recovers from a transient network error rather than failing on the first attempt. `fetch` was called exactly 2 times.
- **Edge case:** No

### Retries on a JSON-parse failure, succeeds on a later attempt
- **Verifies:** AC1
- **Precondition:** Mocked `global.fetch` returning `ok:true` with `.text()` resolving to truncated/invalid JSON on its first call, then valid JSON on its second call.
- **Action:** Call `realFetchPipelineState(owner, repo, token)`.
- **Expected result:** The call ultimately resolves with the correct decoded content. `fetch` was called exactly 2 times, confirming the same retry mechanism handles a parse failure, not just a thrown network error.
- **Edge case:** No

### Diagnostic detail included when all retries are exhausted on a parse failure
- **Verifies:** AC2
- **Precondition:** Mocked `global.fetch` returning `ok:true` with `.text()` always resolving to a fixed truncated string (e.g. `'{"features":[' ` — 14 bytes) across all 3 attempts, and `headers.get('content-length')` returning `'1800000'`.
- **Action:** Call `realFetchPipelineState(owner, repo, token)` and catch the thrown error.
- **Expected result:** The error message contains `14` (the actual received byte count) and `1800000` (the Content-Length header value) — confirms the failure is diagnosable from the message alone, not just the bare `Unexpected end of JSON input` text. `fetch` was called exactly 3 times (all attempts exhausted).
- **Edge case:** Yes — the "all attempts fail" path, the one this AC specifically targets.

### Non-ok HTTP response fails immediately, never retried
- **Verifies:** AC3
- **Precondition:** Mocked `global.fetch` returning `ok:false, status:404` on every call.
- **Action:** Call `realFetchPipelineState(owner, repo, token)` and catch the thrown error.
- **Expected result:** The error message contains `404` (existing, unchanged message format). `fetch` was called exactly 1 time — confirms non-ok responses are never retried, preserving the pre-existing immediate-failure behaviour and not wasting GitHub API rate-limit quota.
- **Edge case:** No

### Background-failure logging still catches an exhausted-retries failure (regression guard)
- **Verifies:** AC4
- **Precondition:** Reuses `tests/check-pst-s1-sync-async-polling.js`'s own AC3 test pattern — a mocked `pipelineStateFetchAdapter` that always rejects (simulating this story's own "all 3 attempts exhausted" outcome from `handlePostProductSync`'s perspective, one layer up).
- **Action:** Call `handlePostProductSync(req, res, null, mockPool, null)`, let the background promise settle, capture `console.error` calls.
- **Expected result:** `console.error` was invoked with the error — confirms `pst-s1`'s own background-failure-logging mechanism is unaffected by this story's changes to the fetch adapter one layer below it.
- **Edge case:** No

---

## Out of Scope for This Test Plan

- Live production verification that retry-with-backoff actually resolves the real intermittent truncation on `skills-framework.fly.dev` — cannot be reproduced deterministically in a unit test; covered as a post-merge production observation instead (see story's Complexity Rating note).
- Any test of `syncProductRollup`'s own downstream rollup-computation logic — unchanged by this story, already covered by its own pre-existing tests.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Whether retry-with-backoff resolves the real production incident | Cannot be deterministically reproduced pre-merge; depends on live network conditions | Post-merge observation: if `[product-sync] background sync failed` recurs in production logs for the same product after this fix ships, that is new evidence for a harder root cause requiring follow-up investigation, not a sign this story's own retry mechanism is broken (it will be provably correct per the unit tests above regardless) |
