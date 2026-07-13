## Story: The identityKey passed to login-time role resolution must be each person's own identity, not the shared tenantId

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As an **Engineer whose team shares one GitHub-org-allowlisted tenant (`TENANT_ORG_ALLOWLIST`) with an admin and other teammates**,
I want **my own login to resolve my own individually-assigned role, not whichever teammate's row the identity lookup happens to land on**,
So that **tir-s7's per-person fix actually holds on the exact multi-person, shared-tenant path this epic exists to support — not only when tested by calling the corrected function directly with distinct identity strings**.

## Benefit Linkage

**Metric moved:** Per-person role assignment exists (Metric 1).
**How:** tir-s7 (PR #467, merged) correctly rewrote the login-time lookup to resolve `identityKey` -> `personId` via `resolvePersonForIdentity` before scoping `team_memberships` by both `person_id` and `tenant_id`. That fix is correct in isolation — its own tests (`tests/check-tir-s7-person-scoped-login-resolution.js`) call `resolveRoleForPerson(pool, identityKey, tenantId)` directly with two distinct, already-correct identity strings (`person-x@example.com` / `person-y@example.com`) and prove the query logic resolves each to their own role. But the *caller* of that function — `server.js`'s production wiring of `setGetRoleForTenant` — collapses both arguments into the same value: `resolveRoleForPerson(_userRolesPool, tenantId, tenantId)`. Every one of the three login call sites (`routes/auth.js` GitHub callback, `routes/auth.js` Google callback) calls `getRoleForTenant(req.session.tenantId)` with a single argument, so `identityKey` always equals `tenantId` in production. For a solo tenant or an email/password login this is harmless, because `tenantId` already equals that one person's own identity. But once `TENANT_ORG_ALLOWLIST` is configured — the GitHub-org-shared-tenant case this whole epic was built to support — `resolveTenant()` returns the *same* org-level `tenantId` for every teammate on that org's login path, so every teammate's login calls `resolveRoleForPerson` with the shared org name as `identityKey`. `resolvePersonForIdentity` can only ever resolve one specific person from that shared string (via `person_identities.identity_key` or the `team_memberships.tenant_id` fallback — whichever row happens to match), so every teammate on a shared-tenant GitHub login reproduces tir-s7's original bug one layer removed: the correct query logic runs, but it is fed the wrong `identityKey` before it ever runs. This story closes that gap so tir-s7's fix is real on the actual production login path, not only when its own unit tests call the corrected function with hand-picked distinct arguments.

## Architecture Constraints

- **ADR-025:** tenant-scoping remains the isolation boundary; this story does not change which `tenantId` is used to scope the `team_memberships` lookup — only which `identityKey` is used to resolve `personId` first. The tenant argument passed to `resolveRoleForPerson` is unchanged.
- **D37:** extends the existing `getRoleForTenant`/`setGetRoleForTenant` adapter pair (tir-s1, tir-s7) rather than introducing a new one. `getRoleForTenant` gains an optional second parameter, `identityKey` — when a caller does not supply it, it defaults to `tenantId`, preserving every existing call site's behaviour unchanged (`auth-email.js`'s two single-argument call sites are not touched by this story). The stub-throws-when-unwired contract is preserved.
- Reuses `user.login` (GitHub, already in scope in `handleAuthCallback` before `resolveTenant()` is even called) and `userInfo.sub` (Google, already in scope and already equal to `req.session.tenantId` for that provider) as the per-person `identityKey` values — this story does not introduce a new identity-key convention, it reuses exactly the strings `identity-links.js` already documents as the per-provider identity key.
- Follows the same fix-forward pattern as tir-s7 and tir-s8: a real bug found during later work in this epic, filed and fixed as its own story rather than silently patched.

## Dependencies

- **Upstream:** tir-s1 (schema, adapter pair — PR #463), tir-s2 (`resolvePersonForIdentity` — `identity-links.js`), tir-s7 (person-scoped query logic — PR #467). All merged.
- **Downstream:** None. tir-s3 (add-teammate write path), tir-s5/tir-s8 (bulk-add) are unaffected — they already write/read `team_memberships` correctly; this story only fixes which `identityKey` string the login-time callers pass into the already-correct resolution function.

## Acceptance Criteria

**AC1:** Given a GitHub-org-allowlisted shared tenant (`acme`) with two people who have each previously been resolvable by their own GitHub login (person X = `admin`, person Y = `engineer`, both via `team_memberships` rows keyed by `person_id` in tenant `acme`), When person Y logs in through the real `handleAuthCallback` GitHub OAuth callback, Then `req.session.role` resolves to `engineer` — because the `identityKey` passed into role resolution is `user.login` (Y's own GitHub login), not `req.session.tenantId` (the shared org name `acme`).

**AC2:** Given the same two-person shared tenant, When person X (the admin) logs in through the same real callback, Then `req.session.role` resolves to `admin` — confirming both people resolve independently through the actual production login path, not only when `resolveRoleForPerson` is called directly with hand-picked distinct arguments (closing the exact gap tir-s7's own tests did not cover).

**AC3:** Given a solo GitHub tenant (no `TENANT_ORG_ALLOWLIST` match, `tenantId` = the person's own login) and given an email/password login (`tenantId` = the person's own email, via `auth-email.js`), When each logs in, Then `req.session.role` resolves exactly as it did before this story — zero regression for both existing common cases. `auth-email.js`'s two `getRoleForTenant(email)` call sites are not modified.

**AC4:** Given the Google OAuth callback (`handleAuthGoogleCallback`), Then confirmed by direct code reading: Google has no `TENANT_ORG_ALLOWLIST`-equivalent shared-tenant mechanism — `req.session.tenantId` is unconditionally set to `userInfo.sub`, the same per-person value this story would otherwise pass as `identityKey`. This story updates the Google callback to pass `userInfo.sub` explicitly as the second (`identityKey`) argument for consistency with the GitHub and D37-wiring changes and as a defensive/future-proofing measure, but a dedicated regression test proves `req.session.role` is byte-for-byte unchanged versus the pre-story single-argument call — this AC is a documented non-bug finding for Google, not a behaviour change.

**AC5 (D37 wiring):** Given `server.js` currently wires `setGetRoleForTenant` to always call `resolveRoleForPerson(_userRolesPool, tenantId, tenantId)`, discarding any second argument a caller might supply, When this story ships, Then the wiring is updated to accept an `identityKey` parameter and pass it through (`resolveRoleForPerson(_userRolesPool, identityKey || tenantId, tenantId)`), verified by a test that asserts two different identities sharing one `tenantId` resolve to two different, individually-correct role values through the wired function — not merely that a function reference or call shape changed (per CLAUDE.md's injectable-adapter wiring-test correctness rule, the same weaker-test shape that let tir-s1's own bug ship undetected).

## Out of Scope

- Any change to `resolveRoleForPerson`, `resolvePersonForIdentity`, or the `team_memberships`/`person_identities` query logic itself — tir-s7 already fixed that logic; this story only fixes which `identityKey` string production callers pass into it.
- **Related but distinct finding, explicitly deferred:** a Google-authenticated person who is manually added as a teammate to a GitHub-org-shared tenant (via `team-management.js`'s `addOrUpdateTeammate`, which accepts "Google email" per its own form label) can never see their assigned role on subsequent logins, because their own Google login always recomputes `req.session.tenantId = userInfo.sub` (their personal Google identity), which never matches the shared org `tenant_id` their `team_memberships` row was actually written under — they silently default to `user` every time, rather than colliding with another person's role. This is a real gap but a *different bug shape* (silent role loss, not role collision) than the one this story fixes, and is not part of Metric 1's "distinct, independently assigned role is used" claim in the way the GitHub-org collision case is — it is not fixed here. Flagged in `decisions.md` as a candidate follow-up story, not silently dropped.
- Auto-creating a `people`/`team_memberships`/`person_identities` row for a brand-new, never-seen-before identity — unchanged from tir-s7's existing scope boundary.
- Any UI change — this is a backend login-path fix only.

## NFRs

- **Performance:** No new NFR — this story does not add a query; it only changes which string value is passed into an existing lookup.
- **Security:** This is a correctness-critical, security-relevant fix — the underlying finding is that a teammate on a shared tenant can resolve into a *different* teammate's role (privilege confusion in either direction: an engineer could resolve into an admin's role, or vice versa, depending on row/insertion order). AC1/AC2 (exercised through the real OAuth callback, not just the already-fixed query function) are the core security-relevant tests. Per the operator's explicit direction, this finding is described accurately and in full technical detail in this story, its tests, its PR, and its commit messages — the product is pre-launch with zero live paying customers (`product/roadmap.md`), so there is no disclosure risk in doing so.
- **Accessibility:** Not applicable — no UI.
- **Audit:** No new audit requirement beyond what tir-s1/tir-s7 already log at login/role-assignment time.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
