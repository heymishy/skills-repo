# Contract Proposal: Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog

**Story reference:** artefacts/2026-09-03-product-sync-blob-fallback-diagnostics/stories/psbf-s1-blob-fallback-diagnostics.md
**Assessed by:** Claude Code (agent, operator-directed — Hamish King)
**Date:** 2026-09-03

---

## What will be built

1. Extract `realFetchPipelineState`'s existing retry-with-backoff loop (`pgft-s1`) into a shared internal helper `_fetchTextWithRetry(url, headers)` in `src/web-ui/adapters/pipeline-state-fetch-adapter.js`, returning the raw response text (not parsed) so both callers can each do their own decode/parse step.
2. Add a new D37 injectable adapter function `realFetchBlobBySha(owner, repo, sha, accessToken)` to the same file — `GET /repos/{owner}/{repo}/git/blobs/{sha}` — reusing `_fetchTextWithRetry`, with its own `setPipelineStateBlobFetchAdapter`/`getPipelineStateBlobFetchAdapter` pair.
3. Modify `syncProductRollup` (`src/web-ui/modules/product-rollup.js`): after decoding `raw.content`, compare its byte length against `raw.size`. On mismatch (or a decode+parse throw), log + `posthog-server.captureException` (AC1), then call the Blobs adapter using `raw.sha` and retry the decode+parse against that response (AC2). If the fallback itself fails, log + capture with a distinguishing property and rethrow (AC3). If the original content already matches `size`, none of this runs (AC4).
4. Wire `setPipelineStateBlobFetchAdapter(realFetchBlobBySha)` in `server.js`, next to the existing `setPipelineStateFetchAdapter(realFetchPipelineState)` wiring line.
5. Writes the 4 tests from the test plan (AC1-AC4).

## What will NOT be built

- Any PostHog dashboard or alert configuration — instrumentation only.
- Additional Blobs-specific retry tuning beyond what the shared `_fetchTextWithRetry` helper already provides.
- Handling for files beyond the Git Blobs API's own 100MB ceiling.
- Any change to the five rollup-computation functions themselves, or the `product_rollups` UPSERT shape.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked Contents API response with decoded length ≠ `size`; assert a spied `captureException` was called with diagnostic properties before any fallback call | unit |
| AC2 | Same mismatched mock, plus a mocked Blobs API response with the full correct content; assert the written rollup reflects the full content, and the Blobs mock was called with the correct sha | unit |
| AC3 | Mismatched Contents API mock + a failing Blobs API mock; assert `captureException` was called with `fallbackAttempted: true` and the function still throws | unit |
| AC4 | Mocked Contents API response where decoded length matches `size`; assert the Blobs mock and PostHog spies were never called | unit (regression guard) |

## Assumptions

- GitHub's Contents API response always includes `size` and `sha` fields regardless of whether `content` itself is complete — a documented, stable part of that API's response shape, not something this story needs to newly prove; the story's own AC1/AC2 tests assert this codebase's handling of that shape, not GitHub's own API contract.
- The Git Blobs API's response shape (`{content, encoding, size, sha, url}`) is base64/UTF-8-compatible with the exact same decode pattern already used for the Contents API's own `content` field — no new decoding logic needed, only a different fetch target.
- Whether this fix actually resolves the live production incident cannot be proven pre-merge — this contract covers building and verifying the detection + fallback *mechanism* correctly (see story's Complexity Rating and NFR profile's Gaps section), not guaranteeing production behaviour sight-unseen. This mirrors the same caveat already accepted for `pgft-s1`'s own DoR.

## Estimated touch points

Files: `src/web-ui/adapters/pipeline-state-fetch-adapter.js` (retry-loop extraction + new Blobs adapter), `src/web-ui/modules/product-rollup.js` (truncation detection + fallback wiring in `syncProductRollup`), `src/web-ui/server.js` (new adapter wiring line), `tests/check-psbf-s1-*.js` (new).
Services: PostHog (existing `posthog-server.js` module, new call sites only — no new integration code).
APIs: One new GitHub endpoint (`GET /repos/{owner}/{repo}/git/blobs/{sha}`), same auth/token pattern as the existing Contents API call.
