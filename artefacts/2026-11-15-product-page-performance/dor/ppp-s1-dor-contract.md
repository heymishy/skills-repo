# Contract Proposal - Make the product page fast by caching per-feature decisions and running independent reads in parallel

**What will be built:**
- `src/web-ui/modules/decisions-reactive-source.js`: `fetchReactiveDecisionsForFeaturesCached(owner, repo, slugs, token)` (in-memory stale-while-revalidate cache keyed by `owner/repo/slug`, TTL 5 minutes, cap 2000 entries, not-found cached, failures never cached, one background refresh per key, token never stored); test seams `_setClock`, `_setCacheConfig`, `_clearDecisionsCache`, `_cacheKeys`; concurrency constant 6 to 16. The existing uncached functions and the parser are unchanged.
- `src/web-ui/routes/products.js`: in `handleGetProductView`, the urpv-s3 call switches to the cached function, and independent reads (journey rows, rollup, modules, module assignments, nav summary, default pod, incident store) start together with `Promise.all`, each keeping its current error handling and fallback value. The rendered page is unchanged for the same data.
- `tests/check-ppp-s1-decisions-cache.js` (new, T1 to T9) and one added reset line in existing handler-driven tests that reuse a slug with different mocks.

**What will NOT be built:**
- No change to page content or layout; no deferred or lazy section; no sidebar query change; no HTML size or log changes (ppp-s2); no cross-machine cache; no startup pre-warm; no new npm dependency; no change to the parser or the uncached functions; no change to `server.js` routing.

**How each AC will be verified:**
| AC | Test approach | Type |
|----|---------------|------|
| AC1 | T1, T9 | unit and handler-level |
| AC2 | T2 | unit |
| AC3 | T3 | unit |
| AC4 | T4a, T4b | unit |
| AC5 | T5 | unit |
| AC6 | T6 | handler-level |
| AC7 | T7 | unit |
| AC8 | Scenario 8 | live (production-observed) |

**Assumptions:** `handleGetProductView` is the only caller of `fetchReactiveDecisionsForFeatures` outside tests (confirmed by search); the urpv-s3 tests drive the handler with `setFetchRepoPath` mocks, so a shared process-level cache needs a reset between scenarios; the reads listed for parallel start have no data dependency on each other (to be confirmed by reading the handler again at the implementation plan; any read that does depend on another stays sequential and is named in the plan).

`schemaDepends: []`. **Estimated touch points:** Files: `src/web-ui/modules/decisions-reactive-source.js`, `src/web-ui/routes/products.js`, `tests/check-ppp-s1-decisions-cache.js` (new), one to four existing test files (one added line each). Services: none. APIs: none changed.
