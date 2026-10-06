## Test Plan: Generate the feature-slug date prefix in the operator's own saved timezone

**Story reference:** artefacts/2026-10-06-feature-slug-timezone-fix/stories/fstf-s1-timezone-aware-feature-slug-date.md
**Epic reference:** None — short-track
**Test plan author:** Claude Sonnet 5 (session_012fTPDihegV68ecrr2a1e4A)
**Date:** 2026-10-06

**Confirmed test runner:** `npm test` → `node scripts/run-all-tests.js`. New module `src/web-ui/modules/person-locale.js`, new dedicated test file `tests/check-fstf-s1-timezone-aware-slug.js`.

**Real architecture grounding (confirmed by direct code read, 2026-10-06):**
- `routes/journey.js:529-530` and `routes/products.js:3734` both independently compute `new Date().toISOString().slice(0, 10)` for the feature-slug date prefix — UTC-only, confirmed root cause of the real incident investigated this session.
- `si-s2`'s existing `people.timezone` column and `identity-links.js`'s `resolvePersonForIdentity(pool, identityKey)` are already real and already correctly keyed by `req.session.tenantId` (confirmed matching `routes/settings.js:649/662`'s own convention) — this story only reads that existing data.
- `routes/products.js`'s `handlePostProductFeature` already takes `pool` as an explicit 4th parameter (confirmed via `tests/check-fsdn-s1-feature-slug-display-name.js`'s own `fakePool` call convention) — no new wiring needed there.
- `routes/journey.js` already has a module-level `_featureEditsPool` (set via `setFeatureEditsPool`, already wired to the real pool in `server.js`) — reused directly, no new wiring needed.

**E2E/browser-layout detection (Step 3a):** N/A — pure backend date-computation fix, no rendered UI change.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Set timezone shifts the computed date across a UTC/local boundary | 2 tests (helper direct + journey.js call site) | — | — | — | — | 🟢 |
| AC2 | Unset timezone / unresolved identity / no pool → unchanged UTC behaviour | 3 tests | — | — | — | — | 🟢 |
| AC3 | DB error during lookup never blocks journey creation | 1 test | — | — | — | — | 🟢 |
| AC4 | Pre-existing slug-generation tests pass unchanged | — | — | — | — | — | 🟢 (regression) |

---

## Test Data Strategy

**Source:** A fake pool object (matching `tests/check-fsdn-s1-feature-slug-display-name.js`'s own `fakePool` convention) with a controllable `query` function returning real `people.timezone`-shaped rows, or throwing, per test case.
**PCI/sensitivity in scope:** No.

---

## Unit Tests

### getTenantLocalDateString returns the correct local date when a real timezone is set (AC1)

- **Verifies:** AC1
- **Precondition:** A fake pool resolving `person_identities`/`team_memberships` to a personId, then `people.timezone = 'Pacific/Auckland'`
- **Action:** Call `getTenantLocalDateString(fakePool, 'tenant-1')` with a fixed `Date` corresponding to `2026-10-04T23:09:29Z` (real timestamp from the investigated incident — this IS `2026-10-05` in `Pacific/Auckland`)
- **Expected result:** Returns `'2026-10-05'`, not `'2026-10-04'` — reproduces the exact incident and confirms it's fixed
- **Edge case:** Yes — the exact real production timestamp that caused the duplicate feature

### getTenantLocalDateString falls back to UTC when timezone is unset (AC2)

- **Verifies:** AC2
- **Precondition:** Fake pool resolves a personId but `people.timezone` is `NULL`
- **Action:** Call the helper
- **Expected result:** Returns the same value as `new Date().toISOString().slice(0, 10)`
- **Edge case:** No — the documented majority-case default

### getTenantLocalDateString falls back to UTC when identity cannot be resolved (AC2)

- **Verifies:** AC2
- **Precondition:** Fake pool returns zero rows for both `person_identities` and `team_memberships`
- **Expected result:** UTC fallback, no throw

### getTenantLocalDateString falls back to UTC when pool is null/undefined (AC2)

- **Verifies:** AC2
- **Action:** Call with `pool = null`
- **Expected result:** UTC fallback, no throw — covers `NODE_ENV=test` with no `DATABASE_URL`

### getTenantLocalDateString falls back to UTC when the query throws (AC3)

- **Verifies:** AC3
- **Precondition:** Fake pool's `query` rejects
- **Expected result:** UTC fallback, no throw propagates

### handlePostJourney uses the timezone-aware date when creating a feature slug (AC1, call-site integration)

- **Verifies:** AC1
- **Action:** Same technique as `check-fsdn-s1-feature-slug-display-name.js`'s own `createFeatureAndGetJourney` helper, with `_featureEditsPool` set to a fake pool resolving a `Pacific/Auckland` timezone, and the request's `Date.now()` mocked/fixed at the exact incident timestamp
- **Expected result:** The created journey's `featureSlug` starts with `2026-10-05-`, not `2026-10-04-`

---

## Integration Tests

None beyond the call-site test above — the fix is a small, pure addition to two existing, already-integration-tested handlers.

---

## NFR Tests

None — no new measurable NFR surface beyond the story's own stated "negligible" performance note.

---

## Out of Scope for This Test Plan

- Duplicate-feature-name detection/warning — named as a real `/improve` candidate in the story's own Out of Scope, not built or tested here.
- Any retroactive data fix for the two already-existing duplicate `customer-journey-as-first-class` records — a separate, explicit operator decision.

---

## Test Gaps and Risks

None — all 4 ACs have direct, deterministic unit/integration coverage with no timing-dependent or flaky elements.
