# Implementation Plan: fstf-s1

**Story:** artefacts/2026-10-06-feature-slug-timezone-fix/stories/fstf-s1-timezone-aware-feature-slug-date.md
**Mode:** Implemented directly in-session via `/tdd`, not dispatched to a subagent — single-task, well-understood scope.

## Task 1 (only task)

1. New module `src/web-ui/modules/person-locale.js` exporting `getTenantLocalDateString(pool, identityKey, date)` — plain fail-open function (not a D37 adapter), resolves the operator's `people.timezone` via the existing `resolvePersonForIdentity` seam, formats via `Intl.DateTimeFormat`'s `formatToParts` (explicit, not locale-default-separator-dependent), falls back to UTC on any failure.
2. `routes/journey.js`'s `handlePostJourney`: replaced `new Date().toISOString().slice(0, 10)` with `await getTenantLocalDateString(_featureEditsPool, req.session.tenantId)` — reused the already-wired module-level pool, no new wiring.
3. `routes/products.js`'s `handlePostProductFeature`: same replacement, reusing the already-threaded `pool` parameter.
4. New test file `tests/check-fstf-s1-timezone-aware-slug.js`: 7 direct unit tests against the new module (AC1-AC3) + 1 call-site integration test against `handlePostJourney` (AC1).
5. Regression: re-ran `tests/check-fsdn-s1-feature-slug-display-name.js` (products.js call site) and 7 other test files exercising `handlePostJourney` — all pass unchanged (AC4), confirming the fail-open design doesn't alter behaviour for callers with no timezone set.
6. Full `npm test` suite run to confirm no unrelated breakage.

**Result:** All new tests pass; all pre-existing tests touching either call site pass unchanged.
