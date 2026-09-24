# Contract Proposal — Backfill person_identities on login so existing real memberships become resolvable

**Story:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s4.md
**Test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s4-test-plan.md
**Date:** 2026-09-24

---

## What will be built

- `backfillIdentityIfNeeded(pool, identityKey, personId, provider, logger)` — a new exported function in `src/web-ui/modules/identity-links.js`. Checks `person_identities` for an existing row for `identityKey` (reuses the exact existing query, `SELECT person_id FROM person_identities WHERE identity_key = $1`); if none, inserts one (reuses the exact existing `INSERT INTO person_identities` query already used by `linkIdentity`). Audit-logs `identity_backfilled` with person id + SHA-256 identity hash (via the file's existing `_hashIdentity` helper) + provider + timestamp — never the raw identity string, matching `linkIdentity`'s own established convention.
- `resolveRoleForPerson(pool, identityKey, tenantId, provider)` in `src/web-ui/modules/user-roles.js` — extended with a new, optional 4th `provider` parameter. When a `personId` resolves (via either the explicit `person_identities` lookup or the `team_memberships.tenant_id` fallback) AND `provider` was supplied, calls `backfillIdentityIfNeeded`. When `provider` is omitted, behaves exactly as before (no backfill attempted) — preserves every existing caller's behaviour unchanged.
- `getRoleForTenant(tenantId, identityKey, provider)` — same optional-3rd-argument extension, forwarding to the wired implementation.
- `server.js`'s 2 `setGetRoleForTenant` wiring sites (real pool, `createFakeTestDb()`) — both updated to accept and forward the new `provider` argument to `resolveRoleForPerson`.
- `routes/auth.js`'s 2 real login call sites (GitHub OAuth, Google OAuth) and `routes/auth-email.js`'s 2 real call sites (email sign-in, email sign-up) — each updated to pass its own real, known provider string (`'github'`, `'google'`, `'email'`, `'email'` respectively) as the new 3rd argument.

## What will NOT be built

- No new table, no new adapter — extends the existing `getRoleForTenant` D37 adapter and the existing `person_identities` write convention.
- No retroactive batch backfill for users who never log in again — this story only backfills on a person's NEXT login, going forward.
- No change to `team_memberships` creation, invite acceptance, or account-linking flows — reused entirely unmodified. This story creates zero new `team_memberships` rows and zero new `people` rows (see AC4).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | 2 unit tests on `backfillIdentityIfNeeded` directly, 4 integration tests on `resolveRoleForPerson` (one per real call shape: GitHub, Google, email sign-in, email sign-up) | Unit + Integration |
| AC2 | Integration test: `listTeamMembers` (rtri-s1) called before and after a simulated login, on the same pool instance — proves the exact live-verified gap closes | Integration |
| AC3 | Unit test: `backfillIdentityIfNeeded` called twice, asserts no duplicate row, no error | Unit |
| AC4 | Integration test (case 4 of the AC1 integration set): a genuinely unknown identity resolves to `null`, backfill never attempted, zero new rows | Integration |
| AC5 | Regression: existing test suites for `linkIdentity`, `team-invitations.js`, `client-invitations.js` confirmed unmodified and passing via `/verify-completion`'s full-suite run | Regression (existing coverage) |

## Assumptions

- Audit NFR: scoped IN (per this contract) — `backfillIdentityIfNeeded` logs `identity_backfilled` matching `linkIdentity`'s own convention exactly, closing Run 1/2 review's LOW finding [1-L2]/[2-L2] rather than leaving it open. This was the simpler of the two options left open in the story (build it, matching an already-proven pattern one function away, vs. a formal RISK-ACCEPT for skipping it) — no new logging infrastructure needed, `identity-links.js` already has `_defaultLogger`/`_hashIdentity` ready to reuse.
- The 4 real login call sites' exact provider strings (`'github'`, `'google'`, `'email'`) match the strings already used elsewhere in this codebase for the `provider` column (confirmed: `linkIdentity`'s own callers already use these exact 3 string values).

## Estimated touch points

**Files:** `src/web-ui/modules/identity-links.js`, `src/web-ui/modules/user-roles.js`, `src/web-ui/server.js`, `src/web-ui/routes/auth.js`, `src/web-ui/routes/auth-email.js`
**Services:** None
**APIs:** None new — this is entirely internal to the existing login flow

## Schema Dependencies

`schemaDepends: ["reviewStatus", "testPlan", "stage"]`

This story's DoR sign-off depends on `rtri-s1`'s pipeline-state entry (already `dodStatus: "complete"`, `prStatus: "merged"`) confirming the `listTeamMembers` function this story's AC2 test relies on is real, merged, and stable. These fields must remain in `pipeline-state.schema.json` with their current enum definitions.
