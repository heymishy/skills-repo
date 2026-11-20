## Test Plan: A person with no membership in a tenant gets the lowest role, not another member's role

**Story reference:** artefacts/2026-11-20-role-resolution-fallback/stories/rrf-s1-no-membership-gets-user-role.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-rrf-s1-no-membership-gets-user-role.js`, plain Node, using the in-memory `createFakeTestDb()` from `src/web-ui/adapters/fake-test-db.js` (the same instance the test server wires) and the real `user-roles.js`, `identity-links.js` modules. The Playwright check (AC5) is run by hand with `npx playwright test`, because the E2E specs are not in the `npm test` chain.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Known person, no membership, tenant has an admin: `'user'` | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Three members of one tenant each resolve to their own role | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Identity with no person row in a tenant that has members: `'user'` | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | First person in a new tenant is bootstrapped to admin and resolves `'admin'` | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | `bri-s3.3` then `bri-s3.6` on one server: AC1 passes, specs unchanged | - | - | 1 (existing) | - | - | 🟢 |
| AC6 | The nine existing role tests pass; any updated assertion is listed | 9 (existing) | - | - | - | - | 🟢 |
| AC7 | Production count of people with an identity and no membership | - | - | - | 1 (M1) | Needs production | 🟡 |

## Red-first plan

T1 and T3 fail before the change: both return `'admin'` for a tenant whose only member is an admin (T1 was reproduced with a probe script during diagnosis). T2 and T4 pass before and after; they exist to prove the fix did not remove a real role. If an existing test pinned the arbitrary-row fallback (most likely `check-tir-s7` T4 or `check-tir-s1`), it fails after the change and is updated deliberately with a comment naming this story.

## Tests

- **T1 (AC1):** seed `e2e-alice` (person 101) as admin of `e2e-shared-org`; create a new person with `resolveOrCreatePersonForIdentity` (the same call the login path makes); assert `resolveRoleForPerson(db, 'brand-new-user', 'e2e-shared-org', 'github')` is `'user'`. Also assert no `team_memberships` row was written by the call.
- **T2 (AC2):** seed admin, engineer and viewer memberships for three people in one tenant; assert each resolves to their own role, in two different orders, so a result that depends on row order fails.
- **T3 (AC3):** an identity with no `person_identities` row in a tenant that has members resolves to `'user'`, and no person or identity row is created.
- **T4 (AC4):** an empty tenant; run `bootstrapTenantAdminIfNeeded` for the first person; assert `resolveRoleForPerson` returns `'admin'`, and a second new person in the same tenant then resolves to `'user'`.
- **T5 (guard):** a source check that `resolveRoleForPerson` no longer contains a call to `resolveRoleForTenant`, so the arbitrary-row lookup cannot be reintroduced behind it (naming this story in the failure message).

## Manual steps

- **AC5:** run `npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js tests/e2e/bri-s3.6-auth-journey.spec.js --workers=1` with `NODE_ENV=test` and `E2E_LOCAL_SUITE=true`; before the change `bri-s3.6` AC1 fails, after it passes. Record both results in the PR.
- **M1 (AC7):** a single read-only aggregate on production: the number of `person_identities` rows whose `person_id` has no `team_memberships` row. Record the number only. If it cannot be run read-only, the DoD says so.

## Deliberate updates to existing tests

Listed in the PR after the run. None is expected beyond a possible assertion in `check-tir-s7` T4 that the unknown-identity result equals the tenant-wide lookup; if so it changes to `'user'` with a comment.
