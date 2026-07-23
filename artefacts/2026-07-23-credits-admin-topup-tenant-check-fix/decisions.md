# Decisions: Credits Admin Top-up Tenant Check Fix

## DECISION — `getValidTenantIds()`: single-table (`credits`) allowlist to 3-table union (2026-07-23)

**Context:** `artefacts/2026-07-23-credits-upsert-fix/decisions.md`'s GAP entry documented, at the time `cuf-s1` shipped, that `admin-credits.js`'s `getValidTenantIds()` (`SELECT tenant_id FROM credits`) rejects any tenantId with no existing `credits` row before `adjustBalanceWithAudit` is ever called — a circular definition of "known tenant" that, by construction, excludes every brand-new tenant, which is exactly the population an admin top-up (or `tests/e2e/fixtures/admin-credits-topup.js`'s E2E tenant funding) most needs to reach. This blocks 3 real, already-written E2E stories' functional ACs (`a3` AC3, `a4` AC2/AC3, `b1` AC1-AC3) from ever running — they currently `test.skip()` cleanly instead.

**Investigation:** There is no single unified "tenants" table across this app's three login mechanisms. Email/password signups (`auth-email.js`) insert into `users` (`email TEXT UNIQUE NOT NULL`), and `req.session.tenantId = email` for that login type, so `users.email` directly equals `tenantId` for that population. `team_memberships` (`user-roles.js`, `tenant_id VARCHAR NOT NULL`) records any tenant ever assigned a role — covering GitHub/Google-OAuth tenants who went through an explicit admin bulk-add or legacy `user_roles` backfill. Neither table is populated for a GitHub-OAuth-only or Google-OAuth-only tenant who has never been given a `team_memberships` row and has no `credits` row — that population has no persisted record anywhere in this codebase today, a real but narrower, pre-existing limitation.

**Decision:** Change `getValidTenantIds()` to query `users.email`, `team_memberships.tenant_id`, and `credits.tenant_id` concurrently (`Promise.all`, same adapter/pool wired via `setCreditsAdapter` — confirmed all three tables live in the same `DATABASE_URL` Postgres instance and are all migrated unconditionally at server startup) and return the de-duplicated union.

**Rationale:**
1. This is a strict superset of the previous allowlist — every tenantId the old `credits`-only check accepted is still accepted (AC3 regression guard) — so there is no risk of narrowing access for any existing caller.
2. It directly covers the real-world population this story exists to unblock: `tests/e2e/fixtures/admin-credits-topup.js`'s e2e-test-admin identity signs up via `/auth/email/signup`, and every E2E test tenant it funds is itself an email/password signup — both land in `users` immediately, before any `credits` row exists.
3. It preserves the abuse-prevention intent (a tenantId with no matching row in any of the 3 tables is still rejected with HTTP 400 — AC2/UT2) rather than weakening the check to accept any syntactically-valid string, which the coding-agent brief flagged as an acceptable-but-inferior fallback only if no clean source of truth existed.
4. `getValidTenantIds()` already lived in `credits.js` and already used the same injectable adapter (`setCreditsAdapter`) — no new D37 adapter is introduced; the fix only broadens which tables that adapter is asked to read.

**Consequence:** A brand-new tenant with only a `users` row (the realistic admin/E2E scenario) or only a `team_memberships` row (the realistic GitHub-org-bulk-add scenario) can now be topped up via the real admin endpoint on their very first top-up, without ever needing a pre-existing `credits` row. A GitHub-OAuth-only or Google-OAuth-only tenant with neither a `team_memberships` row nor a `credits` row remains blocked — this is an explicit, narrower residual gap, not a regression (that population was already rejected under the old check too), flagged here transparently rather than silently left unaddressed or silently expanded into full scope.

**Source:** `catc-s1` investigation and implementation, 2026-07-23; corroborating investigation: `src/web-ui/modules/credits.js`, `src/web-ui/routes/admin-credits.js`, `scripts/migrate-schema-users.js`, `scripts/migrate-schema-credits.js`, `src/web-ui/modules/user-roles.js`, `src/web-ui/routes/auth-email.js`, `src/web-ui/routes/auth.js`, `src/web-ui/server.js` (startup migration wiring), `artefacts/2026-07-23-credits-upsert-fix/decisions.md` (the originating GAP entry).

---

## GAP — GitHub-OAuth-only / Google-OAuth-only brand-new tenants remain unaddressed by any admin top-up allowlist check (2026-07-23)

**Context:** Neither this story's fix nor the prior `credits`-only check can recognise a tenantId that has never triggered any of: an email/password signup (`users`), an explicit role assignment (`team_memberships`), or a credit-affecting event (`credits`). A brand-new solo GitHub-OAuth user (no `TENANT_ORG_ALLOWLIST` match, or a Google-OAuth user) with none of the above has no persisted record anywhere in this codebase.

**Decision:** Not fixed in this story. Flagged here as a deliberate, transparent scope boundary.

**Rationale:** This population was already rejected under the pre-existing `credits`-only check, so this fix introduces no regression for them. Closing this gap fully would require a new, unified tenants/accounts table populated at first login for every auth mechanism — a materially larger architectural change than a narrow, fix-forward bug fix, and out of scope for `catc-s1`'s bounded remit (per its Architecture Constraints and Out of Scope sections).

**Consequence:** If a real GitHub-OAuth-only or Google-OAuth-only tenant ever needs an admin top-up before their first credit-affecting event, they will still receive HTTP 400 "unknown tenantId" after this fix deploys. A follow-up story is recommended if this population is ever a real, observed need (today's known real-world consumers — `tests/e2e/fixtures/admin-credits-topup.js` and its 3 downstream specs — are all email/password tenants, fully covered by this fix).

**Source:** `catc-s1` investigation, 2026-07-23.
