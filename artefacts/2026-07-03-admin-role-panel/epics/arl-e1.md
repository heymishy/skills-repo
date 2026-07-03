## Epic: Admin gains platform access and credits control without SQL

**Discovery reference:** artefacts/2026-07-03-admin-role-panel/discovery.md
**Benefit-metric reference:** artefacts/2026-07-03-admin-role-panel/benefit-metric.md
**Slicing strategy:** Risk-first — role system foundation (arl-s1) must be proven before access control (arl-s2), which must be proven before exposing the admin UI (arl-s3).

## Goal

When this epic is complete, Hamish King (platform operator) can log in via GitHub OAuth and immediately receive `req.session.role = 'admin'` because his `tenant_id` (`heymishy`) is seeded in the `user_roles` table. Every skill session turn he makes bypasses the credits guard regardless of credit balance. He can navigate to `/admin/credits` in a browser, see all tenant balances at a glance, and submit a top-up for any tenant in under two minutes — without running a single SQL command or opening a terminal. Non-admin users continue to receive HTTP 402 when their balance is zero, preserving the existing enforcement. Any future operator can be granted admin access via a single `INSERT` into `user_roles`.

## Out of Scope

- **Multi-admin management UI** — granting or revoking admin roles from within the browser is not part of this epic. Role assignment is SQL-only in MVP.
- **Audit logging of admin credit adjustments** — admin top-up actions are not written to an audit trail. Deferred to a future admin panel evolution story.
- **Fine-grained permissions beyond admin/user binary** — no permission matrix, capability lists, or resource-scoped permissions.
- **Stripe-integrated credit operations** — admin top-ups are direct DB balance adjustments, not payment transactions.
- **User-facing account management** — users cannot view or modify their own role through any UI this epic delivers.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| M1 — Admin credits-guard bypass operational | 0% (every admin turn returns HTTP 402; no bypass or role system exists) | 100% of admin turns succeed regardless of balance | arl-s1 seeds the role system and loads role into session; arl-s2 adds the bypass check to `creditsGuard` |
| M2 — Credits top-up time via browser UI | 5–10 min via `fly postgres connect` + manual SQL | Under 2 minutes end-to-end in browser | arl-s3 delivers the `/admin/credits` server-rendered page and `POST /api/admin/credits/adjust` handler |
| M3 — Non-admin credits enforcement not regressed | 100% (all users with 0 balance blocked) | 100% maintained | arl-s2 adds bypass conditioned strictly on `req.session.role === 'admin'`; regression asserted by CI gate |

## Stories in This Epic

- [ ] arl-s1 — Create user_roles table and load role into session for all auth paths
- [ ] arl-s2 — Credits guard admin bypass and requireAdmin middleware
- [ ] arl-s3 — Admin credits page: view all balances and submit top-up

## Human Oversight Level

**Oversight:** Medium
**Rationale:** Changes touch production authentication callbacks (3 auth paths), credits enforcement middleware, and new admin-only routes. A bug in role loading or the guard bypass could block all users or silently grant access. Coding agent pauses for human review at PR before merge.

## Complexity Rating

**Rating:** 2

Multiple auth paths must be modified (GitHub OAuth, Google OAuth, email/password). Injectable adapter (D37) must be wired separately. Admin UI has no prior pattern in the codebase. Scope is understood — no unknown unknowns — but the cross-cutting nature of auth changes elevates complexity above routine.

## Scope Stability

**Stability:** Stable

Scope is fully locked after the /clarify session (user_roles table, all-auth-path role loading, credits bypass, admin credits UI). No external dependencies could shift scope during implementation.
