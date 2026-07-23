# Story: Fix admin credits top-up rejecting a genuinely brand-new tenant via a circular "known tenant" definition

**Epic reference:** None — short-track (bounded bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live, real-code-verified defect documented in `artefacts/2026-07-23-credits-upsert-fix/decisions.md`'s "GAP" entry (2026-07-23), found while verifying `cuf-s1`'s own fix (PR #556, merged) against real `wuce-staging`.
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below rather than fabricating a metric artefact. This story indirectly serves this feature's own m1 (Meta-metric 1 — E2E ACs actually running and reporting a real pass/fail, not skipping) by removing the specific blocker that causes 3 real, already-written E2E stories' functional ACs to skip instead of run.

## User Story

As **an admin (a real operator, or an E2E test acting as a staging-only admin identity) topping up a genuinely new tenant's credits for the first time, before that tenant has ever triggered a credits-row-creating event such as a Stripe webhook**,
I want **`POST /api/admin/credits/adjust` to succeed for that tenant as long as it corresponds to a real, existing account**,
So that **I am not blocked by a circular allowlist check that defines "known tenant" as "already has a credits row" — the exact population a first-time top-up most needs to reach — while a tenantId that does not correspond to any real account at all is still rejected**.

## Benefit Linkage

**Metric moved:** Indirectly serves this feature's own benefit-metric m1 (Meta-metric 1 — E2E acceptance criteria actually execute and report a real pass/fail, not a clean skip) — not a new formal benefit-metric artefact of its own (short-track, per CLAUDE.md guidance to state this explicitly rather than fabricate a metric reference).
**How:** `tests/e2e/fixtures/admin-credits-topup.js`'s `topUpTestTenantCredits()` (used by `tests/e2e/a3-product-feature-ideate-canvas.spec.js`, `tests/e2e/a4-ideate-session-resume.spec.js`, and `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js`) calls the real `POST /api/admin/credits/adjust` endpoint to fund each E2E test tenant before its functional assertions run. Today it is blocked for every brand-new e2e-test tenant by `admin-credits.js`'s `getValidTenantIds()` allowlist, which only recognises a tenantId that already has a `credits` row — a condition no brand-new tenant can ever satisfy on its first top-up. As a direct, confirmed result, several already-written functional ACs currently skip in CI instead of running: `a3`'s AC3 (ideate canvas render), `a4`'s AC2 and AC3 (SSE session-resume — the main point of that story), and all of `b1`'s AC1 through AC3 (the entire formed-idea discovery-to-definition-to-DoR outer-loop progression, including the `/definition` story-map canvas assertion). Only each spec's unconditional NFR-Security tests currently pass. Fixing this allowlist check makes those specs' own coverage claims genuinely true (tests that actually exercise the behaviour) rather than passing by skipping.

## Architecture Constraints

- This is a fix-forward follow-up to `cuf-s1` (PR #556, merged), which fixed `adjustBalance`/`adjustBalanceWithAudit` in `src/web-ui/modules/credits.js` to use an atomic `INSERT ... ON CONFLICT` upsert — so a brand-new tenant's credit adjustment now correctly creates their row instead of silently no-op'ing. That fix fully resolved the real Stripe webhook path (no allowlist gate in front of it), but `admin-credits.js`'s own `getValidTenantIds()` allowlist check runs **before** `adjustBalanceWithAudit` is ever reached, and its own source of truth for "known tenant" is `SELECT tenant_id FROM credits` — circular with the exact bug already fixed, because it excludes every tenant who does not yet have a `credits` row by definition.
- **Investigated the real intent of `getValidTenantIds()`:** its purpose (per `admin-credits.js`'s own comment: "Validates: amount must be a positive integer (>0), tenantId must exist in credits table") is a safety/abuse-prevention check — reject a typo'd or made-up tenantId before an admin (or a compromised admin session) can credit an account that does not really exist. It was never meant to specifically require "already has a credits row" — that was simply the only table available to query at the time it was written, and it happened to also be the table this bug affects.
- **Investigated the real sources of truth for "does this tenantId correspond to a real, existing account" in this codebase.** There is no single unified tenants table across all three login mechanisms this app supports:
  - Email/password signups (`src/web-ui/routes/auth-email.js`) insert into the `users` table (`scripts/migrate-schema-users.js`: `email TEXT UNIQUE NOT NULL`), and `req.session.tenantId = email` for this login type — so `email` in `users` directly equals `tenantId` for every email/password tenant, which is the exact real-world population both `tests/e2e/fixtures/admin-credits-topup.js` (its fixed e2e-test-admin identity signs up/logs in via `/auth/email/signup`) and this story's target new-tenant scenario use.
  - `team_memberships` (`src/web-ui/modules/user-roles.js`, `tenant_id VARCHAR NOT NULL`) records any tenant that has ever been assigned a role — covers GitHub-OAuth/Google-OAuth tenants who went through an explicit admin bulk-add or a legacy `user_roles` backfill, in addition to email/password tenants.
  - Neither table is populated for a GitHub-OAuth-only or Google-OAuth-only tenant who has never been given an explicit team_memberships row and has no `credits` row yet — this is a real, narrower residual gap that is not fully closed by this story (see Out of Scope). It does not regress anything: that population was already rejected under the old `credits`-only check too.
  - All three tables (`credits`, `users`, `team_memberships`) are migrated (`CREATE TABLE IF NOT EXISTS`) unconditionally at server startup whenever `DATABASE_URL` is set (`src/web-ui/server.js`), and all three are queried through Pool instances pointed at the same `DATABASE_URL` — so querying `users`/`team_memberships` from the same adapter wired via `setCreditsAdapter` is safe; there is no risk of querying a table that does not exist in any environment where `credits` itself exists.
- **The fix:** change `getValidTenantIds()` (`src/web-ui/modules/credits.js`) to return the union of tenant/account identifiers from `users.email`, `team_memberships.tenant_id`, and `credits.tenant_id` (kept for backward compatibility with any tenant whose only record today is a `credits` row), rather than `credits.tenant_id` alone. This is a strict superset of the current allowlist — every tenantId the old check accepted is still accepted — so there is no risk of narrowing access for any existing caller.
- This does NOT change `adminCreditsPost`'s validation *order* (amount is still validated first, tenantId allowlist check still runs before `adjustBalanceWithAudit`), its CSRF guard, its admin-role gate (`requireAdmin`, mounted in `server.js`), or `adjustBalanceWithAudit`/`adjustBalance` themselves (already fixed by `cuf-s1`).
- Do not weaken the check to "any syntactically-valid string" — a tenantId with no matching row in any of the three tables must still be rejected with HTTP 400, preserving the abuse-prevention intent.

## Dependencies

- **Upstream:** `cuf-s1` (PR #556, merged) — the atomic upsert fix this story builds on. Without it, a passing allowlist check here would still hit the (now-fixed) UPDATE-only no-op; with it, a passing allowlist check now reaches a `adjustBalanceWithAudit` call that correctly creates the row.
- **Downstream:** `tests/e2e/fixtures/admin-credits-topup.js` and the three E2E specs that consume it (`a3-product-feature-ideate-canvas.spec.js`, `a4-ideate-session-resume.spec.js`, `b1-formed-idea-outer-loop-story-map.spec.js`) are the real consumers of this fix — not modified by this story. They are expected to newly succeed at the top-up step once this fix is deployed, with no changes needed on their end. A second, separate blocker documented in that fixture's header comment (provisioning the fixed e2e-test-admin identity into `ADMIN_GITHUB_LOGINS` via a live `flyctl secrets set`) is outside this story's scope — see Out of Scope.

## Acceptance Criteria

**AC1:** Given a tenantId that has a row in `users` (email/password signup) but no row in `credits` and no row in `team_memberships`, When `POST /api/admin/credits/adjust` is called with that tenantId and a valid positive-integer amount by an authenticated admin, Then the request succeeds (HTTP 302 redirect to `/admin/credits`), not HTTP 400.

**AC2:** Given a tenantId that has no row in `users`, `team_memberships`, or `credits` (i.e. does not correspond to any real account), When `POST /api/admin/credits/adjust` is called with that tenantId, Then the request is rejected with HTTP 400 `{"error": "unknown tenantId"}` — the abuse-prevention/regression-guard behaviour is preserved, not silently removed.

**AC3:** Given a tenantId that already has an existing `credits` row (the pre-existing, already-working case), When `POST /api/admin/credits/adjust` is called with that tenantId, Then behaviour is unchanged from before this fix — request succeeds identically (no regression for tenants the old check already allowed).

**AC4:** Given a tenantId that has a row in `team_memberships` only (e.g. a GitHub-org tenant added via an admin bulk-add, no `users` row, no `credits` row), When `POST /api/admin/credits/adjust` is called with that tenantId, Then the request succeeds — proving the fix covers all three source-of-truth tables, not just `users`.

**AC5:** Given `getValidTenantIds()` is called directly (unit level), When the underlying adapter has distinct rows across `users`, `team_memberships`, and `credits` with some overlap, Then the returned array is the de-duplicated union of all three tables' identifiers (no duplicates, no dropped entries).

**AC6:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced) — including `tests/check-arl-s3-admin-credits.js` and `tests/check-arl-s5-credit-audit-log.js`, whose existing mocks must continue to pass unchanged (their mock dispatch predicates only match the `credits`-table query shape, so they are unaffected by the additional queries this fix introduces).

## Out of Scope

- Provisioning the fixed e2e-test-admin identity (`e2e-test-admin@example.test`) into wuce-staging's `ADMIN_GITHUB_LOGINS` Fly secret — this is a separate, already-documented human-operator action (`tests/e2e/fixtures/admin-credits-topup.js` header comment, blocker #1), required before this fix's benefit can be observed end-to-end against real staging, but not something this story performs or blocks on for its own AC verification (unit/integration coverage does not require it).
- Closing the residual gap for a GitHub-OAuth-only or Google-OAuth-only tenant who has never been assigned a `team_memberships` row and has no `credits` row (no persisted table records their existence at all in this codebase today) — this is a real, narrower, pre-existing limitation, not a regression introduced by this fix, and is flagged transparently in `decisions.md` as a follow-up if that population is ever needed for admin top-up.
- Any change to `adjustBalance`/`adjustBalanceWithAudit`'s own SQL — already fixed by `cuf-s1`, not touched here.
- Any change to CSRF protection, `requireAdmin`, amount validation, or the admin credits GET page (`adminCreditsGet`).
- `tests/e2e/fixtures/admin-credits-topup.js`, `tests/e2e/a3-product-feature-ideate-canvas.spec.js`, `tests/e2e/a4-ideate-session-resume.spec.js`, `tests/e2e/b1-formed-idea-outer-loop-story-map.spec.js` — these are the consumers of this fix, not modified by this story.
- Any change to `users` or `team_memberships` table schema — both already exist and are already migrated at startup; no migration is required.

## NFRs

- **Performance:** Negligible — `getValidTenantIds()` now issues three simple, indexed, single-table SELECTs (run concurrently via `Promise.all` against the same connection pool) instead of one; each is a full-table scan already present in the original implementation's own `SELECT tenant_id FROM credits` pattern, unchanged in shape.
- **Security:** Preserves the existing abuse-prevention intent — a tenantId with no matching row in any of the three tables is still rejected with HTTP 400 (AC2). No new user input reaches any query; the three additional table reads are unparameterized, static SELECTs.
- **Accessibility:** Not applicable — no UI change (the admin credits GET page and its form are untouched).
- **Audit:** No change — `adjustBalanceWithAudit`'s audit trail behaviour (fixed by `cuf-s1`) is unaffected; this story only changes which tenantIds are allowed to reach that call.

## Complexity Rating

**Rating:** 1 — well understood; root cause, the three candidate source-of-truth tables, and their exact schemas are all already identified and confirmed by reading the actual code and schema files. The remaining work is a narrow, mechanical query change to one function plus a new regression-guard test.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic
