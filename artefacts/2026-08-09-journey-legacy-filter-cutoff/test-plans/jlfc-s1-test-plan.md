## Test Plan: Time-bound the journey list's pre-tenancy migration-grace filter

**Story reference:** artefacts/2026-08-09-journey-legacy-filter-cutoff/stories/jlfc-s1-journey-legacy-filter-cutoff.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-09

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Post-cutoff tenant-less journey excluded, regardless of ownerId match | 1 test | — | — | — | — | 🟢 |
| AC2 | Pre-cutoff tenant-less journey still included when owner matches | 1 test | — | — | — | — | 🟢 |
| AC3 | Tenant-less journey with no createdAt still included | 1 test | — | — | — | — | 🟢 |
| AC4 | Real-tenant-match path unregressed | existing suite | — | — | — | — | 🟢 |
| AC5 | Session-level no-tenantId backward compat unregressed | existing suite | — | — | — | — | 🟢 |

---

## Coverage gaps

None. AC4/AC5 are covered by re-running the existing `tests/check-s0.3-journey-list-filter.js` suite unchanged (its own AC1-AC4) rather than duplicating those assertions in a new file — this file's own convention (`journeyRoute.setJourneyStoreModule(stubStore)`) is the correct, already-established test seam for `handleGetJourney`.

---

## Test Data Strategy

**Source:** Hand-authored journey fixture objects via `journeyRoute.setJourneyStoreModule(stubStore)`, the exact pattern already established in `tests/check-s0.3-journey-list-filter.js`.
**PCI/sensitivity in scope:** No.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A journey with `tenantId: null`, `ownerId` matching the test session's login, `createdAt` AFTER the cutoff | Hand-authored, matching `check-s0.3`'s fixture shape | None | The exact shape of the real leaked E2E-test journeys |
| AC2 | A journey with `tenantId: null`, `ownerId` matching the test session's login, `createdAt` BEFORE the cutoff | Hand-authored | None | Genuine legacy shape |
| AC3 | A journey with `tenantId: null`, `ownerId` matching the test session's login, no `createdAt` field at all | Hand-authored | None | Edge case per AC3 |
| AC4/AC5 | N/A — covered by re-running the existing test file unchanged | `tests/check-s0.3-journey-list-filter.js` | None | |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### handleGetJourney_postCutoffTenantLessJourney_excludedEvenWhenOwnerMatches

- **Verifies:** AC1
- **Precondition:** Stub store returns a journey with `tenantId: null`, `ownerId: 'kim'`, `createdAt: '2026-08-01T00:00:00Z'` (after the 2026-06-29 cutoff). Request session: `{ login: 'kim', tenantId: 'kim-tenant' }`.
- **Action:** `handleGetJourney(req, res)`
- **Expected result:** The journey's `featureSlug` does NOT appear in the response body — this is the exact shape of the real leaked E2E-test journeys, and this is the defect being fixed.
- **Edge case:** Yes — this is the exact defect being fixed.

### handleGetJourney_preCutoffTenantLessJourney_stillIncludedWhenOwnerMatches

- **Verifies:** AC2
- **Precondition:** Stub store returns a journey with `tenantId: null`, `ownerId: 'kim'`, `createdAt: '2026-05-01T00:00:00Z'` (before the cutoff). Same session as above.
- **Action:** `handleGetJourney(req, res)`
- **Expected result:** The journey's `featureSlug` DOES appear in the response body — genuine pre-tenancy legacy visibility must be unaffected.
- **Edge case:** Yes — regression guard for the over-correction risk.

### handleGetJourney_tenantLessJourneyWithNoCreatedAt_stillIncludedWhenOwnerMatches

- **Verifies:** AC3
- **Precondition:** Stub store returns a journey with `tenantId: null`, `ownerId: 'kim'`, no `createdAt` field at all. Same session as above.
- **Action:** `handleGetJourney(req, res)`
- **Expected result:** The journey's `featureSlug` DOES appear in the response body — a missing timestamp must not be treated as proof of recency.
- **Edge case:** Yes — the specific edge case the story's Architecture Constraints call out.

---

## Integration Tests

None required beyond re-running the existing `tests/check-s0.3-journey-list-filter.js` suite, which already exercises `handleGetJourney` end-to-end via the same `setJourneyStoreModule` seam this new test file uses.

---

## NFR Tests

### noPostCutoffTenantLessLeakage

- **NFR addressed:** Correctness/Security
- **Measurement method:** `handleGetJourney_postCutoffTenantLessJourney_excludedEvenWhenOwnerMatches` above — already the primary AC1 test, called out here to make the traceability from NFR to test explicit.
- **Pass threshold:** Zero post-cutoff tenant-less journeys appear in the response, regardless of `ownerId` match.
- **Tool:** Same unit test harness.

---

## Out of Scope for This Test Plan

- Any live confirmation against the real staging database (would require either waiting out the ~1000 real leaked journeys' actual `createdAt` values or a live re-check post-deploy) — a reasonable one-off manual verification step post-merge (see DoD), not a new automated test.
- Testing the sidebar's own Postgres count query — untouched, already correct, already implicitly covered by not touching `products.js`.

---

## Test Gaps and Risks

None identified as blocking.
