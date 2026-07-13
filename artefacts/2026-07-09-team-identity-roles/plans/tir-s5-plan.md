# Implementation Plan: tir-s5 — An admin bulk-adds teammates from their connected GitHub org

**Story:** artefacts/2026-07-09-team-identity-roles/stories/tir-s5.md
**Test plan:** artefacts/2026-07-09-team-identity-roles/test-plans/tir-s5-github-org-bulk-add-test-plan.md
**DoR:** artefacts/2026-07-09-team-identity-roles/dor/tir-s5-dor.md

## D37 confirmation

No new injectable adapter is introduced. This story reuses two existing adapters/functions: `setFetchOrgs` (p1.1, `routes/auth.js`, already D37-compliant with a stub-throw default) and `addOrUpdateTeammate` (tir-s3, `modules/team-management.js`, a plain function taking `pool`, not a D37 adapter itself). A single minimal accessor, `getFetchOrgs()`, is added to `routes/auth.js` so a second route module can read the currently-wired adapter reference — this exposes the existing adapter to a second caller, it does not add a second injectable pair or a second stub-throw contract.

## Judgment call — `addOrUpdateTeammate` is not automatically idempotent for AC3

Verified by reading `modules/team-management.js`: `addOrUpdateTeammate` issues `INSERT ... ON CONFLICT (person_id, tenant_id) DO UPDATE SET role = EXCLUDED.role` — this unconditionally overwrites an existing row's role with whatever role is passed in. Calling it for every org member on every bulk-add run would violate AC3 ("no existing member's manually-set role is overwritten"). The bulk-add loop therefore checks `getRoleForPersonInTenant` first and only calls `addOrUpdateTeammate` for members who are not yet present in the admin's tenant — already-present members are skipped entirely, so their role is never touched.

## Judgment call — "org name" and the NFR security scoping

`setFetchOrgs`'s real signature is `(accessToken, page) => Array<{login}> | {orgs, nextPage}` — it has no "org name" input parameter at all (it lists organisations the token belongs to; the production wiring in `server.js` calls GitHub's `/user/orgs`). Because there is no org-name parameter anywhere in this call path, there is no parameter for an admin to spoof — the security property in the story's NFR ("cannot be pointed at an arbitrary org name via request parameters") is satisfied by construction: the bulk-add route reads no org field from the request body at all, and every written row uses `adminTenantId = req.session.tenantId` exclusively (matching tir-s3's ADR-025 convention). In this system's model, tenantId already *is* the GitHub org login (see `routes/auth.js`'s `resolveTenant`), so the audit log's "org name" field is populated from `adminTenantId`.

## Files

1. `src/web-ui/routes/auth.js` — add `getFetchOrgs()` accessor (returns the currently-wired `_fetchOrgs` adapter reference) + export it. No other change.
2. `src/web-ui/modules/github-org-bulk-add.js` (new) — `bulkAddFromGithubOrg(pool, adminTenantId, fetchOrgs, accessToken, adminId, logger)` core logic + `OrgAccessError`.
3. `src/web-ui/routes/github-org-bulk-add.js` (new) — `createGithubOrgBulkAddHandlers(pool, fetchOrgsGetter)` factory exposing `handleBulkAddFromGithubOrg` (POST-only, no request body fields consumed) + `setLogger`.
4. `src/web-ui/server.js` — require the new route module, wire `_githubOrgBulkAddHandlers`, mount `POST /api/team/bulk-add-github-org` behind `requireAdmin` (mirrors tir-s3's `/api/team/members` wiring exactly).
5. `tests/check-tir-s5-github-org-bulk-add.js` (new) — 6 tests (4 AC + 2 NFR) per the test plan, hand-rolled `test()`/`assert` harness, narrow fake pool mirroring `check-tir-s3-admin-adds-teammate.js`'s convention.

## Tasks (TDD, RED-GREEN-REFACTOR per task)

1. RED: write all 6 tests against not-yet-existing modules → confirm they fail on module load.
2. GREEN: implement `getFetchOrgs()` in `auth.js`.
3. GREEN: implement `modules/github-org-bulk-add.js` (AC1, AC3, AC4 logic).
4. GREEN: implement `routes/github-org-bulk-add.js` + server.js wiring (AC2 relies on the shared write path; NFR-security relies on route-level scoping).
5. GREEN: run the full 6-test file, iterate until all pass.
6. REFACTOR: tidy, re-read against DoR constraints (CommonJS only, no Express, `req.session.accessToken` canonical field, no `pipeline-state.json` write).
7. Regression: `node scripts/run-all-tests.js`, diff against `tests/known-baseline-failures.json` — 0 new failures.
8. `/branch-complete`: push, open draft PR.
