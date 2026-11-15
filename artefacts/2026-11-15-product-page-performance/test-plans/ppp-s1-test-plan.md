## Test Plan: Make the product page fast by caching per-feature decisions and running independent reads in parallel

**Story reference:** artefacts/2026-11-15-product-page-performance/stories/ppp-s1-product-page-performance.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-15
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-ppp-s1-decisions-cache.js`. Existing files that drive `handleGetProductView` with different fetch mocks for the same product and slug get one added line each (reset the new cache before each scenario): `tests/check-urpv-s3-decisions-md-as-reactive-source.js`, and any other file the full suite shows failing for that reason (candidates: `check-urpv-s4-reactive-planned-rollup-by-pod.js`, `check-itar-s3-web-ui-rendering.js`, `check-ep4-s2-nav-and-product-link.js`).

---

## Design under test (decided here, recorded in decisions.md)

`src/web-ui/modules/decisions-reactive-source.js` gains `fetchReactiveDecisionsForFeaturesCached(owner, repo, slugs, token)` (the handler's new entry point; the existing uncached functions are unchanged so their tests keep proving the parser and fetch behaviour), plus test seams `_setClock(fn)`, `_setCacheConfig({ ttlMs, maxEntries })`, `_clearDecisionsCache()` and `_cacheKeys()` (returns the keys only). The concurrency constant becomes 16. Defaults: TTL 5 minutes, cap 2000 entries.

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fresh entries: no GitHub request on repeat | 1 (T1) | 1 (T9, via the handler) | - | - | - | 🟢 |
| AC2 | Stale entries served at once, one refresh per slug | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Not-found cached | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Failures not cached; stale kept on failed refresh | 2 (T4a, T4b) | - | - | - | - | 🟢 |
| AC5 | Entry cap with oldest evicted | 1 (T5) | - | - | - | - | 🟢 |
| AC6 | Independent handler reads started together | - | 1 (T6) | - | - | - | 🟢 |
| AC7 | At most 16 in flight | 1 (T7) | - | - | - | - | 🟢 |
| AC8 | Live: second and later loads under 3 s | - | - | - | 1 | Live-only | 🟡 |
| NFR | Token neither stored nor in the key; slug validation kept | 2 (T8a, T8b) | - | - | - | - | 🟢 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs the deployed production app, the operator's login and approval for a read-only timing | AC8 | Live-only (not CSS-layout) | Verification scenario 8; `production-observed` |
| Real GitHub latency and rate limits are not reproduced by the mocks | AC1, AC7 | Environmental | AC8 measures the real effect; the 16 ceiling is a named constant |

No AC depends on CSS layout; no B2 classification needed.

## Test Data Strategy

**Source:** Synthetic. A fake fetch adapter (via `setFetchRepoPath`, the seam the urpv-s3 tests already use) that counts calls per path, can be made to hang on a deferred promise, to return decisions content, to throw `ArtefactNotFoundError`, or to throw a generic error; an injected clock; a mock pool for T6 and T9 in the shape the urpv-s3 tests already use for `handleGetProductView` (read from that file, not invented). **PCI/sensitivity:** No. **Owner:** self-contained.

## Unit Tests (new file `tests/check-ppp-s1-decisions-cache.js`)

- **T1 - warm hit (AC1).** Two slugs; call the cached function twice within the TTL; the fake counts exactly one request per slug in total and both calls return identical items. Fails today (function does not exist).
- **T2 - stale-while-revalidate (AC2).** Prime the cache; advance the clock past the TTL; make the next fetch hang. Two overlapping calls both resolve immediately with the old items while the fake has been called exactly once per slug (not twice); release the hang with changed content; a third call returns the new items.
- **T3 - not found is cached (AC3).** A slug whose fetch throws `ArtefactNotFoundError`: two calls within the TTL, one request, empty result both times.
- **T4a - cold failure not cached (AC4).** A generic error on a cold slug yields no items for it; the next call retries (second request made) and succeeds.
- **T4b - stale failure keeps the old value (AC4).** After the TTL the refresh throws; the old items are still returned, now and on the next call (which retries).
- **T5 - cap (AC5).** With a cap of 3 and 5 distinct slugs, `_cacheKeys()` has at most 3 keys and the oldest two are gone.
- **T7 - concurrency ceiling (AC7).** 100 slugs, a fake that tracks in-flight count with a short async delay: the maximum observed in flight is more than 6 and at most 16.
- **T8a - token never stored (NFR).** Call with the token `SECRET-TOKEN-123`; no key from `_cacheKeys()` contains it and the cache module source contains no assignment of the token into the cache (checked by asserting the keys and a JSON dump of the keys).
- **T8b - slug validation kept (NFR).** A slug of `../x` or `a/b` triggers no request and no cache key.

## Integration Tests

- **T6 - handler starts independent reads together (AC6).** Drive `handleGetProductView` with a mock pool whose `query` records how many queries are in flight and resolves after a short delay: the maximum in flight is at least 3 (today it is 1, because every read is awaited in turn), and the rendered page equals the page rendered by the previous implementation for the same data (the existing urpv-s3 and ep4-s2 render assertions stay green; additionally the test asserts the product name and one feature name appear).
- **T9 - handler uses the cache (AC1, end to end through the real entry point).** Two consecutive `handleGetProductView` calls for the same product with the fake fetch counting: the second makes zero decisions fetches, and both pages contain the same reactive decision text. Also static check: `routes/products.js` calls `fetchReactiveDecisionsForFeaturesCached` and no longer calls the uncached `fetchReactiveDecisionsForFeatures` for the page.

## Edited existing tests
- The urpv-s3 file (and any other the suite shows) calls `_clearDecisionsCache()` at the start of each scenario that sets a new fetch mock. No assertion changes.

## NFR Tests
- Security: T8a, T8b. Performance: T1, T2, T7, T6 (structure) and AC8 (live). Reliability: T4a, T4b. Memory: T5.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| Mock timing cannot prove the 3 s live target | Real network | AC8 live read-only timing |
| First view after each deploy stays slow (cold path) | Cache is in memory; no user token at start | Reported at AC8; concurrency 16 shortens it; a later story can use the synced rollup |

**Total automated tests:** 11 new (T1, T2, T3, T4a, T4b, T5, T6, T7, T8a, T8b, T9) plus one added reset line in the existing handler-driven tests.
