# Retrospective Story: auto-purge e2e-test- tenants after every staging E2E run

**Story ID:** alrf-s11
**Retrospective audit date:** 2026-07-26
**Risk classification:** MEDIUM (a new destructive script wired into CI; scoped narrowly to an unambiguous, unique tenant-id prefix, never run against non-staging databases)

**Epic reference:** none directly — operator-requested, following directly from `alrf-s10`
**Parent signal:** operator noticed, via `/admin/credits`, hundreds of persistent `e2e-test-`/UAT-based tenants on staging that had never been cleaned up. Sequencing agreed with the operator: stop the leak first (this story), retroactive one-off purge next, admin visibility view and PostHog tie-in as a separate, later piece.

## What was delivered

Both of this repo's E2E-tenant-creation mechanisms tag their synthetic identities with an unambiguous, unique `e2e-test-` prefix:
- `tests/e2e/fixtures/staging-auth.js`'s `uniqueEmail()`: `'e2e-test-' + tag + '-' + Date.now() + ... + '@example.test'`
- `routes/auth-stub.js`'s GitHub OAuth stub: `'e2e-test-gh-' + Date.now() + ...`

Both become the session's `tenantId`. Nothing else in this codebase uses that prefix (`scripts/seed-staging.js`'s own synthetic demo tenants are named `tenant-demo-N`), so matching on it cannot collide with real or seeded data.

**`scripts/purge-e2e-tenants.js`** (new) — a reusable, idempotent purge, following `scripts/seed-staging.js`'s exact D37 injectable-DB-connection convention:
- `findE2eTenantIds(db)` — unions distinct `e2e-test-`-prefixed ids across `credits`, `journeys`, `team_memberships`, and `users.email`.
- `purgeTenant(db, tenantId)` — explicit per-table deletes (not cascade-reliance-alone, matching `routes/products.js`'s `handleDeleteProduct` convention): `artefacts` (via its journeys, since `artefacts.journey_id` has a plain FK with no `ON DELETE` clause), `journeys`, `products` (whose own `ON DELETE CASCADE` already cleans up `standards`/`standard_product_optouts`/`product_rollups`/`product_modules`/`feature_module_assignments`), `credits`, `credit_audit_log`, `tenant_plan`, `user_roles`, `team_memberships`, `impersonation_audit_log`, `github_first_login`, `users`.
- Deliberately does **not** touch `people`/`person_identities` — those are intentionally cross-tenant identity records (a person can belong to multiple tenants); only the tenant-scoped join (`team_memberships`) is cleaned up, to avoid risking deletion of an identity shared with a non-test tenant.
- Each delete is individually try/caught — a table that doesn't exist in a given environment, or one delete failing, never aborts the rest of the purge.

**CI wiring** — a new "Purge e2e-test- tenants created by this run" step, `if: always()` (so cleanup happens on both pass and fail — a genuinely failed test run leaving its tenant behind forever was very likely a real contributor to the reported accumulation), added to all three jobs that run real specs against `wuce-staging`: `e2e.yml`'s Scenario A and Scenario B jobs, and `staging-deploy.yml`'s smoke-test job.

## Benefit Linkage

**Metric moved:** stops the ongoing accumulation the operator observed. The retroactive one-off purge of the *existing* hundreds of already-accumulated tenants is a separate, deliberately deferred follow-up (per the agreed sequencing) — this story only stops new leakage.

## Acceptance Criteria

**AC1 — `findE2eTenantIds` finds tenants across all four source tables, de-duplicated, with real/seeded tenants correctly excluded**
Status: MET — `tests/check-alrf-s11-purge-e2e-tenants.js` AC1.

**AC2 — `purgeTenant` removes exactly the target tenant's rows from every relevant table, leaving other tenants untouched**
Status: MET — AC2 (credits, journeys, artefacts, team_memberships, users all verified).

**AC3 — `purgeE2eTenants` is the correct end-to-end find+purge, and is idempotent (a second run finds nothing left)**
Status: MET — AC3.

**AC4 — a missing/failing table does not abort the rest of the purge**
Status: MET — AC4.

**AC5 — wired into CI with `always()`, so cleanup happens regardless of test pass/fail**
Status: MET by inspection — both `e2e.yml` jobs and `staging-deploy.yml`'s smoke-test job; confirmed via `js-yaml` parse that both edited workflow files remain valid YAML.

**AC6 — no regression to existing CI-gate/deploy-safety tests**
Status: MET — `check-a5-ci-gate-config.js` (14/14), `check-b2-ci-gate-config.js` (15/15, 1 pre-existing skip unrelated to this change), `check-bri-s2.5-ci-pipeline-staging-deploy.js` (7/7), `check-bri-s2.6-smoke-test-promote-gate.js` (10/10), `check-dsn-s1-deploy-config-safety-net.js` (8/8), `check-rlcc-s1-smoke-test-worker-isolation.js` (5/5), `check-wuce17-e2e-infra.js` (22/22) — all unchanged.

## Out of Scope

- Retroactively purging the hundreds of already-accumulated `e2e-test-` tenants on staging today — deliberately deferred to a follow-up one-off run of this same script (`node scripts/purge-e2e-tenants.js` against `STAGING_DATABASE_URL`), per the agreed sequencing.
- An admin tenant-list view (size/key info per tenant) and a PostHog tie-in for tenant metrics — explicitly deferred to a separate, later piece per the operator's own sequencing decision.
- Cleaning up `people`/`person_identities` rows — deliberately left alone; see rationale above.

## Traceability Linkage

**DoR artefact:** not written — retrospective story, same convention as this session's other same-day fixes
**Test plan:** `tests/check-alrf-s11-purge-e2e-tenants.js` (9 ACs, all passing)
**DoD artefact:** not yet written
