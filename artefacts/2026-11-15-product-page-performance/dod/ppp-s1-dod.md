# ppp-s1 Definition of Done

Date: 2026-11-15. Story: make the product page fast by caching per-feature decisions and running independent reads in parallel. PR #1105, merged to master as `45f728f3b`, deployed to production as v190.

## Result: COMPLETE

All 8 acceptance criteria (AC) met. AC1 to AC7 were verified by automated tests before merge (see `reference/ppp-s1-verify-completion-evidence.md`). AC8 (live: second and later loads of the skills-framework product page under 3 s) was observed on production.

## AC8 observation (read-only, operator-approved, signed-in Chrome tab, GET requests only)

| Load | Time to first byte | Total | HTML | Decision rows |
|---|---|---|---|---|
| Before (v189), run 1 | 16,335 ms | 16,752 ms | 2,972 KB | 282 |
| Before (v189), run 2 | 15,660 ms | 15,819 ms | 2,972 KB | 282 |
| After (v190), operator's first load | "quite slow" (cache empty, as designed; not timed) | | | |
| After (v190), load 1 | 517 ms | 632 ms | 2,972 KB | 282 |
| After (v190), load 2 | 426 ms | 468 ms | 2,972 KB | 282 |
| After (v190), load 3 | 439 ms | 479 ms | 2,972 KB | 282 |
| Reference: `/dashboard` (v190) | | 401 ms | | |

Roughly a 35-fold improvement. The page content is unchanged (same size, same 282 decision rows), so the cache returns the same data. Warm product-page loads are within about 0.1 s of the dashboard.

## Observations and follow-ups

- First load after each deploy is slow by design (empty in-memory cache); the operator saw this. It is the accepted cost recorded in decisions.md. The cold path is bounded by the 16-request concurrency; a later story could use the synced rollup to avoid it entirely.
- Each Fly machine has its own cache. All three timed loads were fast, so the requests either hit one machine or each machine had been warmed; not separately investigated.
- Staleness: decisions can be up to 5 minutes old (stale entries are served and refreshed behind). Acceptable for a read-only reactive-work list.
- ppp-s2 was deferred with evidence (see decisions.md): compressed page is 154 KB, the sidebar's N+1 costs about 7 small queries for 5 products, and about 50 test files mock that SQL.
- Deploys restart the app and sign the operator out (in-memory sessions); seen twice this session; not caused by this story.