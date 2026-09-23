# Contract Proposal — Expose the real team roster as a read API

**Story:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s1.md
**Test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s1-test-plan.md
**Date:** 2026-09-24

---

## What will be built

- `listTeamMembers(pool, tenantId)` — a new exported function in `src/web-ui/modules/team-management.js` (reuses this module's existing shape: plain `pool` parameter, no injectable adapter — matches `getRoleForPersonInTenant`'s own convention exactly, per ADR-026). Queries `team_memberships` INNER JOIN `person_identities` ON `person_id`, filtered by `tenant_id`, returning `[{identity: <identity_key>, role: <role>}, ...]`. The inner join is what gives AC2's silent-omission behaviour for free — no extra branching needed.
- `handleGetTeamMembersApi(req, res, pool)` — a new exported handler in `src/web-ui/routes/team-management.js`, calling `listTeamMembers` and responding `200 { members: [...] }` as JSON.
- A new route registration in `src/web-ui/server.js`: `GET /api/team/members` → `authGuard(req, res, async () => { await handleGetTeamMembersApi(req, res, _pshPool); })` — matches `GET /api/pods`'s exact existing registration shape (`routes/pods.js`'s `handleGetPods`, `server.js` line 4279).

## What will NOT be built

- No client-side consumer of this endpoint — `rtri-s2` and `rtri-s3` wire their own consumers separately, out of this story's scope.
- No new auth mechanism, no new tenant-scoping logic — reuses `authGuard` and the `tenant_id` column exactly as every existing `team_memberships` query already does.
- No pagination or filtering parameters on the endpoint or function — explicitly Out of Scope in the story.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Unit test: `listTeamMembers` against a fake pool with 2 fully-resolvable rows, assert exact 2-entry array | Unit |
| AC2 | Unit test: fake pool with 1 unresolvable row (no `person_identities` match), assert empty array, no throw | Unit |
| AC3 | Unit test: fake pool with 2 tenants, assert tenant-A call never returns tenant-B's entry | Unit |
| AC4 | Integration test: direct handler dispatch with a mocked req/res + fake pool, assert response body deep-equals the function's own direct-call output | Integration |
| AC5 | Integration test: dispatch through the real route registration (not the bare handler) with no `accessToken` in session, assert 302 + `Location: /`, handler/query never invoked | Integration |

## Assumptions

- The endpoint's JSON envelope wraps the array in a `members` key (`{ members: [...] }`), matching `GET /api/pods`'s own `{ pods: [...] }` convention — AC4's text ("a JSON array matching the read function's own output") refers to the function's own bare-array output, not the endpoint's envelope shape; this was clarified and logged in `decisions.md` during `/test-plan`.
- `_pshPool` (the module-level pool reference already used by every other route handler in `server.js`, real Postgres `Pool` or `createFakeTestDb()` depending on `DATABASE_URL`) is the correct pool to pass — no new pool wiring needed.

## Estimated touch points

**Files:** `src/web-ui/modules/team-management.js`, `src/web-ui/routes/team-management.js`, `src/web-ui/server.js`
**Services:** None (no external services)
**APIs:** New `GET /api/team/members`
