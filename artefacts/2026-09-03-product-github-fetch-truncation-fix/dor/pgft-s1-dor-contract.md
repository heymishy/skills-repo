# Contract Proposal: Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion

**Story reference:** artefacts/2026-09-03-product-github-fetch-truncation-fix/stories/pgft-s1-retry-github-fetch-truncation.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## What will be built

1. Modify `realFetchPipelineState` (`src/web-ui/adapters/pipeline-state-fetch-adapter.js`): wrap the fetch + response-parse steps in a bounded retry loop (3 total attempts, 500ms/1000ms linear backoff). A thrown network error or a `JSON.parse` failure on an otherwise-`ok` response triggers a retry; a non-`ok` HTTP status fails immediately, unchanged, never retried.
2. Switch from `res.json()` to `res.text()` + `JSON.parse(text)` so the failure path can report the actual received byte count against the response's own `Content-Length` header.
3. Update the two pre-existing test mocks in `tests/check-pr-s2-pipeline-state-fetch-adapter.js` (T3, T6) that return a `.json()`-only fake `Response` for an `ok:true` case, adding a matching `.text()` method — a mock-fidelity fix, not a behaviour change (real `fetch()` Response objects always provide both).
4. Writes the 5 tests from the test plan: 4 unit (AC1 ×2, AC2, AC3) + 1 regression guard (AC4).

## What will NOT be built

- Any change to `syncProductRollup`'s own downstream logic (rollup computation, `product_rollups` UPSERT) — untouched.
- Any change to `handlePostProductSync`'s own fire-and-forget response timing or background-failure `.catch(...)` logging (`pst-s1`) — reused entirely as-is; this story only makes the fetch step one layer below it more resilient.
- Reducing `pipeline-state.json`'s own file size, or switching to the Git Blobs/Trees API — both explicitly out of scope per the story.
- Rate-limit-aware (`Retry-After`-respecting) backoff — non-ok responses are never retried at all (AC3), so this does not apply.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked `fetch` throwing then succeeding, and mocked `.text()` returning invalid-then-valid JSON, asserting exactly 2 calls before success | unit |
| AC2 | Mocked `.text()` returning a fixed truncated string across all 3 attempts, with `headers.get('content-length')` mocked; assert the thrown error's message contains both the actual byte count and the header value | unit |
| AC3 | Mocked `ok:false, status:404` response; assert exactly 1 `fetch` call (no retry) and the existing `HTTP 404` message format | unit |
| AC4 | Reuses `pst-s1`'s own AC3 test pattern in `check-pst-s1-sync-async-polling.js` — a rejecting mocked adapter, asserting `console.error` was called | unit (regression guard) |

## Assumptions

- Real `fetch()` `Response` objects always expose both `.json()` and `.text()` methods — a standard, well-established Web/Node Fetch API guarantee, not something this story needs to newly prove; only the two pre-existing test mocks that assumed `.json()`-only need updating to match.
- A fixed 500ms/1000ms linear backoff is a reasonable default for this story's scope; the exact interval values are an implementation detail not prescribed precisely by any AC (AC1 only requires "a short linear backoff" and "up to 2 additional attempts").
- Whether this fix fully resolves the live production incident cannot be proven pre-merge (see story's Complexity Rating and NFR profile's Gaps section) — this contract covers building and verifying the retry *mechanism* correctly, not guaranteeing production behaviour sight-unseen.

## Estimated touch points

Files: `src/web-ui/adapters/pipeline-state-fetch-adapter.js` (retry logic), `tests/check-pgft-s1-*.js` (new), `tests/check-pr-s2-pipeline-state-fetch-adapter.js` (mock fidelity fix, T3/T6 only).
Services: None new.
APIs: None new — same GitHub Contents API endpoint, same shape.
