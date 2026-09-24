## Story: Backfill person_identities on login so existing real memberships become resolvable

**Epic reference:** artefacts/2026-09-23-team-roster-integration/epics/real-team-roster.md
**Discovery reference:** artefacts/2026-09-23-team-roster-integration/discovery.md
**Benefit-metric reference:** artefacts/2026-09-23-team-roster-integration/benefit-metric.md
**Domain:** web-ui, auth

## User Story

As a **tenant owner or any team member whose `team_memberships` row predates an explicit identity link**,
I want **my own real membership to actually appear in the real team roster (`rtri-s1`) the next time I log in**,
So that **the roster isn't empty for the most common real case — a team that has never used the separate "link a second sign-in method" feature or, for the owner specifically, never received an invite for their own account.**

## Benefit Linkage

**Metric moved:** Real pod membership; /team/members shows a real list
**How:** `rtri-s1`'s `listTeamMembers` INNER JOINs `team_memberships` to `person_identities` and silently omits any row with no match — live-verified on `wuce-staging.fly.dev` (2026-09-24, see `decisions.md`) that a real, freshly-created `team_memberships` row still produces an empty roster because no first-login path writes `person_identities`. Without this story, both metrics can be structurally blocked even after `rtri-s2`/`rtri-s3` ship, for the most common real-world case.

## Architecture Constraints

- **ADR-026 (reuse existing entity):** no new table. Extends `identity-links.js`'s existing `person_identities` write path (already used by `linkIdentity`, `team-invitations.js`, `client-invitations.js`) with one more legitimate write site — login.
- **Epic Out of Scope boundary (explicit clarification — see decisions.md, 2026-09-24):** the epic's own Out of Scope rules out "auto-creating `people`/`team_memberships` rows on raw login." This story does NOT do that. It writes only a `person_identities` row (identity bookkeeping — "this identity_key belongs to this person_id") for an identity that ALREADY resolves to an existing person via `resolvePersonForIdentity`'s own `team_memberships.tenant_id` fallback. No `team_memberships` row is ever created or modified by this story. No new tenant membership is granted. A completely unknown identity (no `people`/`team_memberships` row at all) is NOT backfilled — this story only makes an *already-existing, already-legitimate* membership resolvable, matching `resolveRoleForPerson`'s own "AC4: unknown identity — no auto-creation, fall through unchanged" convention exactly.
- **D37 (injectable adapter):** the real login call sites (`routes/auth.js`, `routes/auth-email.js`) have no direct `pool` access — they only reach the DB through the existing `getRoleForTenant(tenantId, identityKey)` D37 adapter (wired in `server.js` via `setGetRoleForTenant`, closed over the real pool). Found during `/test-plan` investigation (corrected from this story's own earlier, wrong assumption of "no adapter needed" — see decisions.md): the backfill needs a `provider` value ('github'/'google'/'email'), which only the login call sites know and the existing adapter signature doesn't carry. Fix: extend `getRoleForTenant`/`resolveRoleForPerson`'s signature with an optional 3rd `provider` argument, following `tir-s9`'s own established precedent for backward-compatible optional-argument extension of this exact function (see `user-roles.js`'s own `getRoleForTenant` JSDoc, tir-s9 fix-forward) — every pre-existing call site that omits the new argument keeps its exact current behaviour. Both `setGetRoleForTenant` wiring sites in `server.js` (real pool, fake-test-db) forward the new argument through to `resolveRoleForPerson`, which performs the backfill internally (it already has pool + identityKey + personId-resolution in one place) rather than introducing a brand-new adapter.
- The real provider value (`'github'`, `'google'`, or `'email'`) is trivially known at each of the 4 real login call sites in `routes/auth.js`/`routes/auth-email.js` (GitHub OAuth callback, Google OAuth callback, email/password sign-in, email/password sign-up) — the fix must be wired at (or reachable from) each of those 4 call sites, not just one, since a real user could log in via any of them.

## Dependencies

- **Upstream:** `rtri-s1` (merged, DoD-complete) — this story fixes a gap discovered during its DoD live verification.
- **Downstream:** `rtri-s2` and `rtri-s3` both benefit — their pickers/lists will show real data for far more real tenants once this ships, but neither is blocked from starting without it (the gap is a data-completeness issue, not a functional break in either story's own code).

## Acceptance Criteria

**AC1:** Given an identity that already resolves to a real `person_id` via `team_memberships.tenant_id` (the fallback path — no explicit `person_identities` row exists yet), When that identity logs in via any of the 4 real login paths (GitHub OAuth, Google OAuth, email/password sign-in, email/password sign-up), Then a `person_identities` row is written for that identity, with the real provider value for the path used.

**AC2:** Given the backfill from AC1 has run for a person, When `listTeamMembers` (`rtri-s1`) is called for that person's tenant, Then that person's real `team_memberships` row is now included in the result — closing the exact gap live-verified on `wuce-staging.fly.dev` (2026-09-24).

**AC3:** Given an identity that already HAS an explicit `person_identities` row (already backfilled, or linked via `tir-s2`'s explicit linking, or created via an invite-acceptance flow), When that identity logs in again, Then no duplicate row is written and no error occurs (idempotent — matches every other schema-bootstrap/backfill function in this codebase's own established convention, e.g. `migrateTeamSchema`'s `_backfillOne`).

**AC4:** Given a completely unknown identity (no `people` row, no `team_memberships` row anywhere) logging in for the first time, When login completes, Then no `person_identities` row is written for it — this story never creates a new person or a new membership, only backfills identity resolution for an already-existing one (Architecture Constraints).

**AC5:** Given the existing 3 real, already-shipped write sites for `person_identities` (`linkIdentity`, `team-invitations.js`, `client-invitations.js`), When this story's login-time backfill is added, Then none of those 3 existing write paths change behaviour — this is purely an additive 4th write site.

## Out of Scope

- Any change to `team_memberships` creation, invite acceptance, or account-linking flows themselves — reused entirely unmodified.
- Retroactively backfilling every existing tenant's historical members who have never logged in since this ships — this story only backfills on a person's NEXT login, going forward. A cold-storage batch backfill for people who never log in again is a separate concern, not pursued here (matches the epic's own "no pre-existing-pod fake-id migration" precedent for not chasing every historical edge case).
- Any change to `rtri-s1`'s own `listTeamMembers` query or its INNER JOIN semantics — that function's behaviour is correct as specified; this story fixes the upstream data gap, not the read function.

## NFRs

- **Performance:** The backfill check (one extra `SELECT` + conditional `INSERT`) adds negligible latency to login — already in the same request/response cycle as the existing `resolveRoleForPerson` call, which does comparable work.
- **Security:** No new data exposure — `person_identities.identity_key` values are already real, already-known identity strings (GitHub login, Google email, or email/password email) that the login flow already has direct access to; this story does not introduce any new identity source or trust boundary.
- **Accessibility:** Not applicable — no UI change.
- **Audit:** Matches `linkIdentity`'s own existing audit convention exactly — logs person id + a SHA-256 hash of the identity + provider + timestamp, never the raw identity string. Resolved IN at `/definition-of-ready` (see `dor/rtri-s4-dor-contract.md`): `identity-links.js` already has `_defaultLogger`/`_hashIdentity` ready to reuse, so this needs no new logging infrastructure and no RISK-ACCEPT.

## Complexity Rating

**Rating:** 2 — touches 4 real login call sites across 2 files (`auth.js`, `auth-email.js`), a security-sensitive area, but the change itself (idempotent identity backfill) is well-understood and narrowly scoped.
**Scope stability:** Stable

## Definition of Ready Pre-check
<!-- Populated at /definition-of-ready. -->
