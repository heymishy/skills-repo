## Test Plan: DELETE /api/journey/:journeyId — delete a stale/corrupted feature

**Story reference:** artefacts/2026-07-26-function-level-audit/stories/alrf-s10-delete-journey-capability.md
**Epic reference:** None directly — operator-requested tooling
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its test file (`tests/check-alrf-s10-delete-journey.js`) already existed and were merged (2026-07-26); documents existing coverage per `templates/retrospective-story.md`'s convention. A new, real destructive capability (MEDIUM risk classification) — coverage below emphasises the tenant-isolation and CSRF/auth boundaries.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Deletes a journey belonging to the requesting tenant; journey no longer resolvable afterward | 1 test | — | — | — | — | 🟢 |
| AC2 | A nonexistent journeyId returns 404 | 1 test | — | — | — | — | 🟢 |
| AC3 | A journey owned by a different tenant returns 404 (not 403), and is not deleted | 1 test | — | — | — | — | 🔴 |
| AC4 | A missing/mismatched CSRF token is rejected (403), and the journey survives | 1 test | — | — | — | — | 🔴 |
| AC5 | An unauthenticated request returns 401 | 1 test | — | — | — | — | 🔴 |
| AC6 | `journey-store.deleteJourney` delegates to the durable (Postgres) adapter with the correct journeyId | 1 test | — | — | — | — | 🟢 |
| AC7 | The feature-index page renders a real Delete button targeting the resolved journey's actual journeyId | 1 test | — | — | — | — | 🟢 |
| AC8 | No regression to existing journey-lifecycle/tenant-isolation/feature-index behaviour | — | 10 regression suites | — | — | — | 🟢 |

---

## Coverage gaps

None. All 8 ACs have direct test coverage. AC3/AC4/AC5 marked 🔴 — the security boundaries around a destructive, irreversible action.

---

## Test Data Strategy

**Source:** Synthetic — journeys across two distinct tenants, valid/invalid/missing CSRF tokens, authenticated/unauthenticated requests.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s10-delete-journey.js` (11 assertions total):

- **AC1:** Deletes a journey belonging to the requesting tenant; subsequent lookup fails.
- **AC2:** A nonexistent `journeyId` returns `404`.
- **AC3:** A cross-tenant journey returns `404` (not `403`, matching the existing FORBIDDEN-vs-NOT_FOUND policy so a probe can't distinguish "not yours" from "doesn't exist") — and is not actually deleted.
- **AC4:** Missing/mismatched CSRF token → `403`, journey survives.
- **AC5:** Unauthenticated request → `401`.
- **AC6:** `journey-store.deleteJourney` delegates to the Postgres adapter with the correct `journeyId`.
- **AC7:** Feature-index page renders a real Delete button targeting the actual resolved `journeyId`.

---

## Integration Tests

**AC8 (regression):** `check-owle1-clarify-side-trip.js` (14/14), `check-p0.2-journey-guard-wiring.js` (13/13), `check-p2.2-tenant-isolation.js` (27/27), `check-p3.1-pg-journey-adapter.js` (13/13), `check-jrf-s1-new-feature-redirect.js` (5/5), `check-wuce6-feature-navigation.js` (57/57), `check-wuce20-artefact-index-html.js` (40/40), `check-kfd1-...` (42/42), `check-alrf-s1-...` (8/8), `check-alrf-s4-...` (14/14) — all unchanged.

---

## E2E Tests

None — covered at the route/integration level; the Delete button's client-side `confirm()` + `fetch` mirrors `routes/products.js`'s already-tested module-delete pattern.

---

## NFR Tests

### Security — tenant-scoped, CSRF-protected, audit-logged destructive action

- **NFR addressed:** Security (a new irreversible capability).
- **Measurement method:** AC3/AC4/AC5 above ARE the security-relevant assertions. Audit logging (`journey_deleted` event with journeyId, featureSlug, tenantId, deletedBy) confirmed present by inspection, not independently asserted in a dedicated NFR test.
- **Pass threshold:** N/A — see AC3/AC4/AC5.
- **Tool:** This repo's hand-rolled `test()`/`assert` harness.

---

## Out of Scope for This Test Plan

- Cleaning up `feature_module_assignments` rows for a deleted feature — known limitation, not fixed this pass (story's own Out of Scope).
- A bulk "delete all stale features matching X" admin tool.
- Actually using this capability to delete the specific stale feature that prompted the request — a follow-up operational action, not part of this code change.

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Audit log content (`journey_deleted` event) not independently asserted in a dedicated test | Confirmed present by code inspection only | Low risk — the audit-logging pattern itself is a well-established convention elsewhere in this codebase (e.g. `require-admin.js`'s `admin_access_denied`) |
