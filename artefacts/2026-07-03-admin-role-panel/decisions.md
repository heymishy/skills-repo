# Decisions: Admin Role System and Admin Panel

**Feature slug:** 2026-07-03-admin-role-panel
**Feature:** Admin Role System and Admin Panel
**Created:** 2026-07-03

---

## Decision Log

---

### ADR-001 — user_roles table keyed by tenant_id rather than role column on users table

**Date:** 2026-07-03
**Context:** The discovery originally scoped a `role` column added to the existing `users` table. During /clarify, it was confirmed that Hamish King (the platform owner and primary user) logs in exclusively via GitHub OAuth. The GitHub OAuth callback in `auth.js` (`handleAuthCallback`) sets `req.session.userId = user.id`, `req.session.login = user.login`, and `req.session.tenantId = user.login` — but does not insert a row into the `users` table (that table is populated only via email/password registration in `auth-email.js`). A role column on `users` would be unreachable for GitHub OAuth sessions because no `users` row exists for those sessions.
**Decision:** Implement a separate `user_roles (tenant_id VARCHAR PRIMARY KEY, role VARCHAR NOT NULL DEFAULT 'user')` table. Role is looked up by `tenant_id` (the common session identifier across all auth paths — GitHub OAuth sets `tenantId = user.login`; Google OAuth sets `tenantId = userInfo.sub`; email sets `tenantId = email`). After every successful auth callback, the role is loaded into `req.session.role` via a single SELECT query.
**Rationale:** `tenant_id` is the only identifier shared across all three auth paths with no nullable risk. This approach requires no schema change to `users` and avoids any auth-path-specific special-casing. The `user_roles` table is small, rarely written, and can be queried cheaply on every login.

---

### ADR-002 — Admin seed via documented SQL command rather than code-based bootstrap

**Date:** 2026-07-03
**Context:** The platform needs at least one admin record to seed the role system. Options considered: (a) seed in the auto-migration block (hard-coded `heymishy`); (b) environment variable override; (c) documented one-time SQL command.
**Decision:** Document a one-time SQL seed command to be run once via `fly postgres connect` after the initial deploy: `INSERT INTO user_roles (tenant_id, role) VALUES ('heymishy', 'admin') ON CONFLICT (tenant_id) DO UPDATE SET role = 'admin'`. This is the only admin bootstrap mechanism in MVP. The seed command is included in the DoR post-deploy checklist for arl-s1.
**Rationale:** Hard-coding a specific `tenant_id` in migration code creates a coupling between the DB schema migration and a specific deployment identity that is fragile under renaming or multi-operator scenarios. Environment variable override adds complexity for a one-time operation. The one-time SQL seed is the minimum viable mechanism — the admin can manage additional admin grants via future UI stories. The `ON CONFLICT DO UPDATE` variant makes the command idempotent and safe to re-run.

---

### ADR-003 — requireAdmin returns HTTP 403 for both unauthenticated and insufficient-role states

**Date:** 2026-07-03
**Context:** Conventional REST practice distinguishes HTTP 401 (unauthenticated) from HTTP 403 (authenticated but insufficient permissions). The question arose whether `requireAdmin` should return 401 for unauthenticated requests and 403 for authenticated non-admin requests.
**Decision:** `requireAdmin` returns HTTP 403 for both states (no `req.session.userId` and insufficient role both return 403).
**Rationale:** The `/admin/*` routes are not publicly documented or discoverable. Returning 401 for unauthenticated requests would expose information about the existence and authentication requirements of the admin route to any caller. Returning 403 uniformly avoids user/route enumeration. This matches the existing pattern in this codebase where internal routes do not distinguish authentication state publicly.

---

### ADR-004 — RISK-ACCEPT: AC7 of arl-s3 keyboard navigation verified by manual smoke test only

**Date:** 2026-07-03
**Context:** Per CLAUDE.md coding standard B2, any AC that can only be verified by a browser rendering CSS layout must be classified at DoR time as either (a) automated visual regression test or (b) RISK-ACCEPT + manual smoke test script. arl-s3 AC7 asserts that the admin credits page is keyboard-navigable (Tab, Enter, Space to reach and submit all forms). Playwright visual regression for a minimal server-rendered HTML page with no custom layout is disproportionate to the risk level on a solo-operator admin page with no external users.
**Decision:** RISK-ACCEPT. AC7 will be verified by manual keyboard navigation smoke test performed by Hamish King post-deploy. A manual step covering keyboard navigation is included in the arl-s3 verification script. No automated visual regression test will be written for this AC.
**Rationale:** The admin credits page is used exclusively by the platform operator in MVP. The risk of keyboard navigation failure affecting external users is zero. The implementation will use standard `<form>`, `<input>`, and `<button>` HTML elements which are natively keyboard-accessible by default — automated testing would be testing browser defaults, not application logic.

---
