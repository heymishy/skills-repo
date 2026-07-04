# Discovery: Admin Role System and Admin Panel

**Status:** Approved
**Created:** 2026-07-03
**Approved by:** Hamish King — Platform operator — 2026-07-03
**Author:** Claude Sonnet 4.6

---

> **Product context read:**
> Target users: Platform owner/operator (Hamish King), future platform operators and beta users.
> Known constraints: No new npm dependencies; Node.js CommonJS only; no Express; same Postgres database; injectable adapter rule (D37); path traversal guard (ougl).
>
> **EA registry blast-radius:** `architecture.ea_registry_authoritative: true` is set. No EA registry entry was found for the skills-platform web-UI system (`skills-framework.fly.dev`). Proceeding without blast-radius data — this does not block discovery.

---

## Problem Statement

The skills platform deployed a credits guard in July 2026 that blocks all skill session turns when a tenant's credit balance reaches 0. All new accounts — including the platform owner's own account — start with a balance of 0 by default. There is currently no mechanism to manage credit balances, user roles, or any administrative function from within the platform UI or API. The only workaround is direct SQL access via `fly postgres connect`.

The immediate consequence: Hamish King (platform owner and sole current operator) is blocked from using the platform he built. Every attempt to progress a skill session turn returns HTTP 402 (payment required) because the credits guard has no concept of a privileged user who should bypass it. Direct DB SQL is the only current unblocking mechanism, which is not sustainable as an operational method and cannot be extended to any future operators or beta users.

## Who It Affects

**Hamish King — Platform owner and primary operator**
Attempting to run skill sessions (discovery, definition, test-plan, etc.) on the deployed platform at `skills-framework.fly.dev`. Experiences HTTP 402 on every turn submission because his credit balance is 0. Must use direct DB SQL to unblock himself, which breaks the intended self-serve operational model and will not scale to any second user.

**Future platform operators or beta users (anticipated)**
Any person granted access to the platform who needs to start using it will face the same 0-balance block. Without an admin who can top up balances via a UI, new users cannot progress past their first few turns unless the operator manually adjusts their DB record.

## Why Now

The credits guard shipped as part of the landing-auth-billing billing foundation (lab-s3.3) and is live in production on Fly.io. The block is immediate — the platform owner cannot use his own platform without direct DB access after every server restart or new session. This is an operational regression that must be resolved before any further platform development or external user onboarding can proceed. The trigger is the live deployment of lab-s3.3: a billing control that correctly enforces payment at scale but has no privileged-user escape hatch for the platform operator.

## MVP Scope

- Add a `user_roles` table keyed by `tenant_id` — the common session identifier across all auth paths (GitHub OAuth, Google OAuth, email/password): `CREATE TABLE IF NOT EXISTS user_roles (tenant_id VARCHAR PRIMARY KEY, role VARCHAR NOT NULL DEFAULT 'user')`. Migration runs in the existing auto-migration startup block in `server.js`.
- After every successful auth callback (GitHub OAuth in `auth.js`, Google OAuth, and email/password in `auth-email.js`) — query `SELECT role FROM user_roles WHERE tenant_id = $1` using `req.session.tenantId` and set `req.session.role`. Default to `'user'` if no row exists. This works for all auth paths without modifying the `users` table schema.
- Modify the credits guard (`src/web-ui/middleware/credits-guard.js`) to bypass the balance check when `req.session.role === 'admin'`.
- Add a `requireAdmin` middleware: checks `req.session.userId` (authenticated) AND `req.session.role === 'admin'`; returns HTTP 403 otherwise.
- Add an `/admin` route group in `server.js` gated by `requireAdmin`.
- Deliver a `/admin/credits` server-rendered HTML page: lists all tenants with their current balance, with a per-tenant top-up form that POSTs to `/api/admin/credits/adjust`.
- The first admin is seeded via a documented one-time SQL command: `INSERT INTO user_roles (tenant_id, role) VALUES ('heymishy', 'admin') ON CONFLICT (tenant_id) DO UPDATE SET role = 'admin'` via `fly postgres connect`. (`heymishy` is the GitHub login, which becomes `tenantId` for GitHub OAuth users.)

## Out of Scope

- **User-facing account management / profile pages** — users cannot see or modify their own role; no "account settings" UI is part of this feature.
- **Fine-grained permissions beyond the binary admin/user role** — no permission matrix, capability lists, or resource-scoped permissions in this feature.
- **Audit logging of admin actions** — admin credit top-ups are not written to an audit trail in this story; deferred to a future admin panel evolution story.
- **Multi-admin management UI** — the ability to grant or revoke admin role from within the browser UI is out of scope; role assignment is done via SQL only in MVP.
- **GitHub OAuth users receiving admin roles** — admin role is email-auth only in MVP; OAuth sessions do not gain admin status through this story (the `users` table insert path is `auth-email.js`).
- **Stripe / billing integration for admin credit operations** — admin top-ups are direct DB balance adjustments, not Stripe transactions.
- **Per-feature or per-skill credit pricing** — the credits guard is binary (block/pass); pricing model changes are out of scope.

## Assumptions and Risks

**Risk: Migration timing.** The `ALTER TABLE users ADD COLUMN IF NOT EXISTS role` migration must run before the app accepts login requests. If the column does not exist when role-loading code runs, all logins will fail with a DB column error. Mitigation: use `IF NOT EXISTS` on the `ALTER TABLE` for idempotency; run it in the startup auto-migration block before the server begins accepting connections.

**Risk: First admin seed.** If the seed SQL is not run after deployment, the platform owner remains a `'user'` and the credits block persists despite the new code. The seed step must be explicitly documented in the DoR post-deploy checklist and in the story's verification script.

**Risk: Admin route authentication gap.** Admin routes must validate both that the user is authenticated (`req.session.userId` present) AND that `req.session.role === 'admin'`. Missing either check creates an authorization bypass. The `requireAdmin` middleware must check both fields; this is a DoR hard AC.

**Risk: Regression on non-admin credit enforcement.** Adding an admin bypass must not inadvertently loosen the guard for ordinary users. A regression test asserting the guard still returns HTTP 402 for a `'user'` with 0 balance is mandatory.

## Directional Success Indicators

**Admin bypass of credits guard:**
Baseline: Platform owner blocked on every turn (balance = 0, HTTP 402 returned). Target: Platform owner completes full multi-turn skill sessions without any 402 responses, regardless of credit balance. Measurement: automated test asserting `creditsGuard` calls `next()` when `req.session.role === 'admin'`; manual smoke test on Fly.io post-deploy confirming no 402 during a full session.

**Admin credits top-up via browser UI:**
Baseline: Credits can only be adjusted via direct SQL (`fly postgres connect`). Target: Admin can navigate to `/admin/credits`, enter a top-up amount for any tenant, submit the form, and see the updated balance reflected on the page — without any SQL access. Measurement: manual smoke test on Fly.io; automated test asserting POST `/api/admin/credits/adjust` adjusts the balance and responds with a redirect.

**Non-admin credits enforcement preserved:**
Baseline: N/A (no role system exists today). Target: Non-admin users with a 0 balance still receive HTTP 402 from the credits guard. Measurement: automated regression test asserting `creditsGuard` returns 402 when `req.session.role` is `'user'` and balance is 0.

## Constraints

- **No new npm dependencies** — per `product/tech-stack.md`; admin UI must be server-rendered HTML using Node.js built-ins only (`http`, `fs`, `path`, `crypto`).
- **Node.js CommonJS only** — `require()`, no ES modules, no TypeScript.
- **No Express** — route matching via `pathname.match()` in `src/web-ui/server.js`; no Express router.
- **Same Postgres database** — no new data stores; schema migration runs in the existing startup auto-migration block.
- **Injectable adapter rule (D37)** — any new injectable adapter introduced (e.g. for the admin credits query) must throw by default; production wiring in `server.js` is a separate mandatory task.
- **Path traversal guard (ougl)** — any admin route that writes to disk or accepts user input must validate resolved paths per the `ougl` coding standard.
- **`req.session.accessToken` is canonical** — all routes using the GitHub token must use `req.session.accessToken`, not `req.session.token`.

## Contributors

- Hamish King — Platform owner, operator

## Reviewers

- Hamish King — Platform owner

## Approved By

Hamish King — Platform operator — 2026-07-03

---

**Next step:** Human review and approval → /benefit-metric

---

## Clarification log

**2026-07-03** Clarified via /clarify:
- Q: Does Hamish log in via email/password or GitHub OAuth? A: GitHub OAuth exclusively — it is the only visible login option in the UI. Email/password is wired but not surfaced.
- Scope update: Removed `role` column on `users` table approach. Replaced with separate `user_roles` table keyed by `tenant_id` — the common session identifier across all auth paths (GitHub OAuth sets `tenantId = user.login`; email sets `tenantId = email`). This resolves role loading for GitHub OAuth sessions without modifying the `users` table schema. Resolved [ASSUMPTION].

