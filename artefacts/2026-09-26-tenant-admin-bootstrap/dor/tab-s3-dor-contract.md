# Contract Proposal: Retire the legacy admin-bootstrap path

**Story reference:** artefacts/2026-09-26-tenant-admin-bootstrap/stories/tab-s3.md
**Date:** 2026-09-28

---

## What will be built

- Removal of `arl-s4`'s startup seeding block from `server.js` (the `INSERT INTO user_roles (tenant_id, role) VALUES ($1, 'admin') ON CONFLICT ...` block and the `ADMIN_GITHUB_LOGINS` env var parsing loop around it).
- Removal of the `setGetUserRole(...)` production wiring call in `server.js`.
- Removal of the `getUserRole`/`setGetUserRole` function definitions and their entries in `module.exports` from `user-roles.js` — not just their production wiring call site (per `/review` finding tab-s3 1-M1, already incorporated into AC1).
- Removal of `_backfillOne` and its call site inside `resolveRoleForTenant` (`user-roles.js`) — `resolveRoleForTenant`'s remaining logic reverts to a plain check-then-default (`team_memberships` lookup, `'user'` fallback), with no legacy-table fallback attempt.
- Update or removal of any existing test file(s) found (via grep, before implementation begins) to reference the removed functions.
- A tracked, non-code operator action: remove the `ADMIN_GITHUB_LOGINS` Fly secret from both `wuce-staging` and production (`skills-framework`) — tracked in this story's own DoD, per AC3.

## What will NOT be built

- No `DROP TABLE user_roles` — the table itself stays in the real database, empty and unused.
- No change to `resolveRoleForPerson`'s own primary (non-legacy) resolution logic — already correct.
- No change to `tab-s1`'s new bootstrap mechanism or `tab-s2`'s backfill script.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read `server.js` and `user-roles.js` as text, assert absence of the named patterns in both files | unit |
| AC2 | Read `user-roles.js` as text, assert absence of `_backfillOne` and its call site; confirm `resolveRoleForTenant`'s own remaining default-fallback behaviour is unchanged | unit |
| AC3 | Manual — real Fly secrets dashboard/CLI check on both environments | manual |
| AC4 | Full suite run; grep `tests/*.js` for pre-existing legacy references, confirm each accounted for | integration |
| AC5 | Fresh grep of the entire `src/web-ui/` tree for all 4 legacy identifiers | unit |

## Assumptions

- No other production code path calls `getUserRole`/`setGetUserRole`/`_backfillOne` beyond what's already been traced during `/review` (`server.js`'s own `arl-s4` block and `resolveRoleForTenant`'s own call site) — will be confirmed via a full grep before removing anything, not assumed.
- AC4's own full-suite regression run is the actual mechanism that confirms this removal doesn't break some other, not-yet-traced dependent feature — not a separate assumption to validate beforehand.

## Estimated touch points

**Files:**
- `src/web-ui/server.js` (modified)
- `src/web-ui/modules/user-roles.js` (modified)
- Any legacy test file(s) found via grep (modified or removed)
- `tests/check-tab-s3-legacy-removal.js` (new)

**Services:** Fly (operator action only, not code). **APIs:** None.
