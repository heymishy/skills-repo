## Test Plan: Fix admin credits top-up rejecting a genuinely brand-new tenant via a circular "known tenant" definition

**Story reference:** artefacts/2026-07-23-credits-admin-topup-tenant-check-fix/stories/catc-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | tenantId in `users` only, admin top-up succeeds (302) | 1 | — | — | — | — | 🟢 |
| AC2 | tenantId in none of the 3 tables, admin top-up rejected (400) | 1 | — | — | — | — | 🟢 |
| AC3 | tenantId already in `credits`, behaviour unchanged (302) | 1 | — | — | — | — | 🟢 |
| AC4 | tenantId in `team_memberships` only, admin top-up succeeds (302) | 1 | — | — | — | — | 🟢 |
| AC5 | `getValidTenantIds()` returns de-duplicated union of all 3 tables | 1 | — | — | — | — | 🟢 |
| AC6 | full regression pass, no new baseline failures | — | 1 | — | — | — | 🟢 |
| AC1/AC2 (real-world) | real `wuce-staging` admin top-up flow confirms fix | — | — | 1 | — | Deploy-dependent | 🟡 |

---

## Test Data Strategy

**Source:** Fixtures — a fake Postgres query executor that dispatches on the exact SQL string shape (`SELECT email FROM users`, `SELECT tenant_id FROM team_memberships`, `SELECT tenant_id FROM credits`), returning distinct, independently-controlled row sets per table so RED (today's code, `credits`-only) and GREEN (the fix, all 3 tables) are both provable against the same fixture shapes.
**PCI/sensitivity in scope:** No — no real Postgres connection, no real Stripe data.
**Availability:** Available now for all unit/integration rows. The real-world row requires a live `flyctl deploy` and is tracked separately.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | Fake DB: `users` has `newtenant@example.test`; `team_memberships` and `credits` empty | Fixture | None | |
| AC2 | Fake DB: all 3 tables empty for `ghost-tenant` | Fixture | None | |
| AC3 | Fake DB: `credits` has `tenant-existing`; `users`/`team_memberships` empty | Fixture | None | Same shape as pre-existing `check-arl-s3-admin-credits.js` T7/T2 |
| AC4 | Fake DB: `team_memberships` has `org-tenant`; `users`/`credits` empty | Fixture | None | |
| AC5 | Fake DB seeded with overlapping + distinct rows across all 3 tables | Fixture | None | Overlap case proves de-duplication |
| AC6 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |

### PCI / sensitivity constraints

None — no real payment or credential data anywhere in this story's own tests.

### Gaps

The real-world row (confirming a previously-400'd admin top-up now succeeds against real `wuce-staging` for a genuinely brand-new tenant) depends on a live `flyctl deploy` succeeding within this session, and separately on the e2e-test-admin identity already having (or being given) the admin role on `wuce-staging` — a pre-existing, separately-tracked blocker (see story's Out of Scope). If either cannot complete, this row is reported as pending, not claimed as passing.

---

## Unit Tests

### UT1 — brand-new tenant with only a `users` row can be topped up (AC1)
- **Verifies:** AC1
- **Component:** `src/web-ui/routes/admin-credits.js` — `adminCreditsPost`; `src/web-ui/modules/credits.js` — `getValidTenantIds`
- **Action:** Fake DB: `users` contains `newtenant@example.test`; `team_memberships` and `credits` are empty. Call `adminCreditsPost` with `tenantId=newtenant@example.test`, `amount=100`, valid CSRF, admin session.
- **Expected result:** HTTP 302, redirect to `/admin/credits`.
- **RED against current code:** `getValidTenantIds()` only queries `credits`, which has no row for this tenant — HTTP 400 `{"error": "unknown tenantId"}`.

### UT2 — tenantId with no row anywhere is still rejected (AC2)
- **Verifies:** AC2
- **Component:** Same as UT1
- **Action:** Fake DB: `users`, `team_memberships`, `credits` all empty for `ghost-tenant`. Call `adminCreditsPost` with `tenantId=ghost-tenant`, `amount=100`, valid CSRF, admin session.
- **Expected result:** HTTP 400, `{"error": "unknown tenantId"}` (case-insensitive substring match on "unknown"). This is the key regression-guard: proves the fix does not simply accept any string.

### UT3 — existing `credits`-only tenant is unaffected (AC3, regression guard)
- **Verifies:** AC3
- **Component:** Same as UT1
- **Action:** Fake DB: `credits` contains `tenant-existing`; `users`/`team_memberships` empty. Call `adminCreditsPost` with `tenantId=tenant-existing`, `amount=50`.
- **Expected result:** HTTP 302 — identical to pre-fix behaviour for this population.

### UT4 — `team_memberships`-only tenant can be topped up (AC4)
- **Verifies:** AC4
- **Component:** Same as UT1
- **Action:** Fake DB: `team_memberships` contains `org-tenant`; `users`/`credits` empty. Call `adminCreditsPost` with `tenantId=org-tenant`, `amount=25`.
- **Expected result:** HTTP 302.
- **RED against current code:** `getValidTenantIds()` does not query `team_memberships` today — HTTP 400.

### UT5 — `getValidTenantIds()` returns de-duplicated union across all 3 tables (AC5)
- **Verifies:** AC5
- **Component:** `src/web-ui/modules/credits.js` — `getValidTenantIds`
- **Action:** Fake DB: `users` = `[a@x.test, shared@x.test]`; `team_memberships` = `[shared@x.test, org-b]`; `credits` = `[tenant-c]`. Call `getValidTenantIds()` directly.
- **Expected result:** Returned array contains exactly `{a@x.test, shared@x.test, org-b, tenant-c}` — 4 distinct entries, `shared@x.test` appearing once despite being present in two source tables.
- **RED against current code:** Returns only `[tenant-c]` (the `credits`-only query).

---

## Integration Tests

### IT1 — full existing regression suite (AC6)
- **Verifies:** AC6
- **Action:** Run `npm test`.
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`. In particular `tests/check-arl-s3-admin-credits.js` (T7, T10) and `tests/check-arl-s5-credit-audit-log.js` (T5) continue to pass unchanged — their mocks' dispatch predicates (`sql.includes('SELECT tenant_id FROM')`) only match the `credits`-table query shape used inside `getValidTenantIds()`'s new implementation, and their `users`/`team_memberships` mock responses default to `{ rows: [] }` for any unmatched query, which correctly yields no additional allowed tenantIds beyond what those tests already seed into their `credits` mock rows.

---

## E2E Tests

### E2E1 — real `wuce-staging` confirmation (real-world, deploy-dependent)
- **Verifies:** AC1/AC2 (real-world)
- **Components involved:** Real `wuce-staging` deployment
- **Precondition:** This fix is deployed via `flyctl deploy`; the e2e-test-admin identity (`e2e-test-admin@example.test`) has (or is given) the admin role on `wuce-staging` per `tests/e2e/fixtures/admin-credits-topup.js`'s own documented precondition.
- **Action:** Re-run the flow underlying `tests/e2e/fixtures/admin-credits-topup.js`'s `topUpTestTenantCredits()` (or the relevant portion of `a3`/`a4`/`b1`'s specs) against real staging, for a tenant that has genuinely never had a `credits`, `users`-independent, or `team_memberships` row before this session.
- **Expected result:** The top-up call that previously returned HTTP 400 now returns HTTP 302 and the tenant's balance reflects the top-up amount. Report honestly whether the separate admin-role-provisioning precondition (out of this story's scope) is already satisfied on `wuce-staging`; if not, report the top-up call's actual HTTP status without claiming success.
- **Contingency:** If deploy cannot complete this session, or the admin-role precondition is not met, reported as not run / blocked, not glossed over.

---

## NFR Tests

### NFR-Security — a tenantId with no matching row in any of the 3 tables is still rejected
Covered directly by UT2 — this is the regression guard proving the fix is additive (broadens the allowlist source), not a removal of the check itself.

---

## Out of Scope for This Test Plan

- Provisioning `e2e-test-admin@example.test` into `ADMIN_GITHUB_LOGINS` — separate, already-documented human-operator action.
- `adjustBalance`/`adjustBalanceWithAudit`'s own SQL — already covered by `tests/check-cuf-s1-credits-upsert-fix.js`, unchanged here.
- CSRF, `requireAdmin`, amount validation — already covered by `tests/check-sec-perf-s3-admin-credits-csrf.js` and `tests/check-arl-s3-admin-credits.js`, unchanged here.
- GitHub-OAuth-only/Google-OAuth-only tenants with no `team_memberships` row and no `credits` row — documented residual gap, not covered by new tests (no regression: this population was already rejected before this fix).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real-staging E2E confirmation (E2E1) depends on a live `flyctl deploy` succeeding within this session, and on the separate admin-role-provisioning precondition already being met | Deploy environment availability and a pre-existing, separately-tracked human-operator action are not guaranteed at test-plan-authoring time | E2E1's contingency clause requires explicit "not run" / "blocked" reporting rather than a fabricated pass |
| GitHub-OAuth-only/Google-OAuth-only brand-new tenants remain unaddressed | No persisted table records their existence anywhere in this codebase today; a genuinely complete fix would require a new unified tenants table, out of scope for a narrow fix-forward | Documented transparently in the story's Out of Scope and in `decisions.md`; no regression versus pre-fix behaviour for this population |
