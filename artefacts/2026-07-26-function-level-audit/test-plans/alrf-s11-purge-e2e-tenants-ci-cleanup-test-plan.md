## Test Plan: Auto-purge e2e-test- tenants after every staging E2E CI run

**Story reference:** artefacts/2026-07-26-function-level-audit/stories/alrf-s11-purge-e2e-tenants-ci-cleanup.md
**Epic reference:** None directly — operator-requested, following from `alrf-s10`
**Test plan author:** Claude (agent) — retrospective backfill, 2026-08-21
**Date:** 2026-08-21

**Backfill note:** reconstructed after the fact — implementation and its test file (`tests/check-alrf-s11-purge-e2e-tenants.js`) already existed and were merged (2026-07-27); documents existing coverage per `templates/retrospective-story.md`'s convention. A new destructive script wired into CI (MEDIUM risk classification) — coverage below emphasises the scoping to the unambiguous `e2e-test-` prefix and resilience to partial failure.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `findE2eTenantIds` finds tenants across all four source tables, de-duplicated, with real/seeded tenants correctly excluded | 1 test | — | — | — | — | 🔴 |
| AC2 | `purgeTenant` removes exactly the target tenant's rows from every relevant table, leaving other tenants untouched | 1 test | — | — | — | — | 🔴 |
| AC3 | `purgeE2eTenants` is the correct end-to-end find+purge, and is idempotent | 1 test | — | — | — | — | 🟢 |
| AC4 | A missing/failing table does not abort the rest of the purge | 1 test | — | — | — | — | 🟢 |
| AC5 | Wired into CI with `always()`, so cleanup happens regardless of test pass/fail | — | — | — | 1 (YAML inspection) | — | 🟢 |
| AC6 | No regression to existing CI-gate/deploy-safety tests | — | 7 regression suites | — | — | — | 🟢 |

---

## Coverage gaps

**AC5** — verified by inspection (confirmed the `if: always()` step is present in both `e2e.yml` jobs and `staging-deploy.yml`'s smoke-test job, and that both edited workflow files remain valid YAML via `js-yaml` parse), not by a live CI dry-run of the actual cleanup step firing after a real pass/fail. Low risk: YAML structure was directly verified; the step's own script logic (find + purge) is independently covered by AC1–AC4.

---

## Test Data Strategy

**Source:** Synthetic — `e2e-test-`-prefixed tenant fixtures across `credits`, `journeys`, `team_memberships`, `users.email`, alongside real/seeded (`tenant-demo-N`) tenants to confirm exclusion.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in `tests/check-alrf-s11-purge-e2e-tenants.js` (9 assertions total):

- **AC1:** `findE2eTenantIds` unions distinct `e2e-test-`-prefixed ids across all 4 tables, de-duplicated; `tenant-demo-N` and other real/seeded tenants correctly excluded.
- **AC2:** `purgeTenant` removes exactly the target tenant's rows (credits, journeys, artefacts, team_memberships, users all verified) — other tenants untouched.
- **AC3:** `purgeE2eTenants` end-to-end find+purge; a second run finds nothing left (idempotent).
- **AC4:** A missing/failing table does not abort the rest of the purge (each delete individually try/caught).

---

## Integration Tests

**AC6 (regression):** `check-a5-ci-gate-config.js` (14/14), `check-b2-ci-gate-config.js` (15/15, 1 pre-existing skip unrelated to this change), `check-bri-s2.5-ci-pipeline-staging-deploy.js` (7/7), `check-bri-s2.6-smoke-test-promote-gate.js` (10/10), `check-dsn-s1-deploy-config-safety-net.js` (8/8), `check-rlcc-s1-smoke-test-worker-isolation.js` (5/5), `check-wuce17-e2e-infra.js` (22/22) — all unchanged.

---

## E2E Tests

None — the CI wiring itself (AC5) is verified by YAML inspection rather than a live E2E dry-run; see Coverage gaps.

---

## NFR Tests

### Data-safety — purge scoping cannot collide with real or seeded data

- **NFR addressed:** Data safety (a destructive script wired into CI).
- **Measurement method:** AC1's exclusion assertion IS the data-safety-relevant check — matching only the unambiguous `e2e-test-` prefix, never `tenant-demo-N` or any real tenant id.
- **Pass threshold:** N/A — see AC1.
- **Tool:** This repo's hand-rolled `test()`/`assert` harness.

---

## Out of Scope for This Test Plan

- Retroactively purging the hundreds of already-accumulated `e2e-test-` tenants on staging — deliberately deferred to a follow-up one-off run (story's own Out of Scope).
- An admin tenant-list view and PostHog tie-in — explicitly deferred to a separate, later piece.
- Cleaning up `people`/`person_identities` rows — deliberately left alone (cross-tenant identity records).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| AC5 (CI wiring) verified by YAML inspection, not a live dry-run of the cleanup step firing | The step's own logic is independently covered by AC1–AC4; only the wiring itself wasn't live-exercised | Low risk — YAML structure directly verified; consider a live staging dry-run if this script is ever modified |
