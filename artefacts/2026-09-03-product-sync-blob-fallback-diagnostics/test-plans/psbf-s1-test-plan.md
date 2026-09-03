## Test Plan: Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog

**Story reference:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/stories/psbf-s1-blob-fallback-diagnostics.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent, operator-directed)
**Date:** 2026-09-03

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Truncation detected, logged, sent to PostHog with diagnostic properties | 1 | — | — | — | — | 🟢 |
| AC2 | Blobs API fallback fetches full content, rollup proceeds correctly | 1 | — | — | — | — | 🟢 |
| AC3 | Fallback failure also logged/captured, still reaches pst-s1's handler catch | 1 | — | — | — | — | 🟢 |
| AC4 (regression) | Normal-sized content: no fallback, no new log lines, unchanged behaviour | 1 | — | — | — | — | 🟢 |

**E2E / browser-layout scan (Step 3a):** No CSS-layout-dependent language, no rendered-UI component at all — this story touches only `src/web-ui/adapters/pipeline-state-fetch-adapter.js` and `src/web-ui/modules/product-rollup.js`, both server-side. N/A.

---

## Coverage gaps

None for the retry/fallback *mechanism* itself — fully coverable with mocked `global.fetch` and a spied `posthog-server` module.

**Named residual uncertainty (not a test gap, a product-risk note):** Whether the Git Blobs API fallback actually resolves the live production incident is not fully verifiable pre-merge (depends on GitHub's real API behaviour for this repo's real file, which this test suite cannot reproduce). The tests below verify the *mechanism* is correct (detects the mismatch, calls the right fallback endpoint with the right SHA, decodes/parses correctly) — this is the same category of residual uncertainty already named and accepted in `pgft-s1`'s own test plan, now resolved one layer further down. Post-merge production log/PostHog observation is the real confirmation.

---

## Test Data Strategy

**Source:** Synthetic — mocked `global.fetch` responses and a spied `posthog-server` module in test setup, no real network calls
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained — reuses this repo's own established mocked-`global.fetch` pattern (`tests/check-pgft-s1-fetch-retry.js`) plus a simple in-test spy replacing `posthog-server.capture`/`captureException`.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A mocked Contents API response whose `content` (decoded) length deliberately does not match its own `size` field | Synthetic, in-test | None | |
| AC2 | The same mismatched response, plus a mocked Blobs API response (`GET .../git/blobs/{sha}`) returning the full, correctly-sized content | Synthetic, in-test | None | |
| AC3 | A mismatched Contents API response, with the mocked Blobs API fetch also failing (network error or non-ok status) | Synthetic, in-test | None | |
| AC4 | A normal Contents API response where decoded length matches `size` | Synthetic, in-test | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### Truncation detected: logged and sent to PostHog before any fallback attempt
- **Verifies:** AC1
- **Precondition:** Mocked `realFetchPipelineState`-equivalent fetch returning `{content: <base64 of a short/truncated string>, encoding: 'base64', size: 1340000, sha: 'abc123'}` — decoded length deliberately far short of `size`. Spied `posthog-server.captureException`.
- **Action:** Call `syncProductRollup(pool, adapterModule, opts)`.
- **Expected result:** `captureException` was called with an event/property set identifying this as a truncation (reported size, actual decoded length, product/repo identifiers) — confirms the detection and diagnostic-capture logic fires on the mismatch, independent of whether a fallback later succeeds.
- **Edge case:** No

### Blobs API fallback fetches and uses the full content correctly
- **Verifies:** AC2
- **Precondition:** Same mismatched Contents API mock as above, plus a mocked Blobs API response for `sha: 'abc123'` returning `{content: <base64 of the FULL, correct pipeline-state.json>, encoding: 'base64', size: 1340000, sha: 'abc123'}`.
- **Action:** Call `syncProductRollup(pool, adapterModule, opts)`.
- **Expected result:** The rollup written to `product_rollups` reflects the *full* content (e.g. a specific feature slug only present in the full fixture, not in the truncated one) — proves the fallback's content, not the truncated original, drove the computation. Also confirms `realFetchBlobBySha` was called with the correct owner/repo/sha.
- **Edge case:** No

### Fallback failure is also captured and still reaches the caller's own error handling
- **Verifies:** AC3
- **Precondition:** Same mismatched Contents API mock; the mocked Blobs API fetch throws/returns non-ok.
- **Action:** Call `syncProductRollup(pool, adapterModule, opts)` and catch the thrown error.
- **Expected result:** `captureException` was called with a property distinguishing this as a fallback failure (e.g. `fallbackAttempted: true`), and the function still throws (proving `pst-s1`'s own `handlePostProductSync` `.catch(...)` chain is unaffected one layer up — reuses that story's own regression-guard pattern).
- **Edge case:** Yes — the "fallback also fails" path.

### Normal-sized content: no fallback, no new log lines, unchanged behaviour (regression guard)
- **Verifies:** AC4
- **Precondition:** Mocked Contents API response where decoded `content` length exactly matches `size`.
- **Action:** Call `syncProductRollup(pool, adapterModule, opts)`.
- **Expected result:** The Blobs API mock function was never called (call count 0), `captureException`/`capture` were never called, and the rollup is written correctly from the original content — confirms zero behavioural change for the common case.
- **Edge case:** No

---

## Out of Scope for This Test Plan

- Live production verification that the Blobs API fallback actually resolves `skills-framework`'s real 1.34MB file — cannot be reproduced deterministically pre-merge; covered as a post-merge production/PostHog observation instead.
- Any test of `computeDodStatusRollup`/`computeHealthCounts`/etc's own internal correctness — unchanged by this story, already covered by pre-existing tests.
- Building or testing a PostHog dashboard/alert — explicitly out of scope per the story.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Whether the Blobs API fallback resolves the real production incident | Cannot be deterministically reproduced pre-merge; depends on live GitHub API behaviour for the real file | Post-merge observation: watch PostHog for `product_sync_content_truncated` events and whether the sync ultimately succeeds afterward; watch production logs for the same. If the fallback itself also fails, AC3's diagnostics make that immediately distinguishable from the original truncation, unlike the two prior rounds of this incident. |
