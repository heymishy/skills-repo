# Discovery: Unified Per-User Identity and Role-Based Access Model for Multi-Tenant Teams

**Status:** Clarified — awaiting approval
**Created:** 2026-07-09
**Approved by:** [Name + date — filled in after human review]
**Author:** Copilot

---

## Problem Statement

The web-ui app's tenancy and role model conflates two distinct concerns: `tenant_id` (the data-isolation boundary for `products`/`credits`/`standards`/`user_roles`) and per-person role identity. `tenant_id` is derived independently per auth provider — GitHub login, Google `sub`, or email — and none of the three auth providers (GitHub OAuth, Google OAuth, email/password) share a unified identity table. `user_roles` stores exactly one role per `tenant_id`, not one role per person. This works today only because every customer is currently a solo individual, so tenant_id happens to equal exactly one person. The moment a team needs to share a tenant, the model breaks: you cannot make one team member an admin without making the whole team admin (there's no per-person key to fall back on), and there's no mechanism to differentiate in-app feature access by role (engineer vs. product vs. admin). Surfaced while fixing the GitHub OAuth first-login bug (commit `f845caf7`, 2026-07-09) and logged as ARCH-004/ARCH-005 in `artefacts/2026-07-01-landing-auth-billing/decisions.md`.

## Who It Affects

- **Team admin / tech lead** — manages the team's workspace: invites/removes members (up to ~100 per team), assigns roles, controls billing and plan. Needs full feature access plus admin-only controls (credits adjustment, team management) that individual contributors must not have.
- **Engineer** — the primary "Developer/engineer" persona from `product/mission.md`. Runs the inner/outer loop skill sessions, implements stories. Needs delivery-pipeline features but not billing, team management, or other members' admin controls. Billed via the team's per-seat or team plan, not managed individually.
- **Product / BA** — the "Product manager / business analyst" persona from `product/mission.md`. Owns benefit metrics, story AC quality, definition-of-ready sign-off from a business perspective. Needs outer-loop discovery/definition/benefit-metric features but likely not the same code-facing surfaces as engineers, and not admin controls. Also billed via the team plan, not individually.
- **Viewer / stakeholder** — a fourth role added via /clarify: someone who needs visibility into a team's progress and artefacts (e.g. a non-participating stakeholder) but no write access anywhere. Also billed via the team plan.
- **You (Hamish), today** — the immediate blocked case: a solo operator who is currently forced through the same `/welcome` billing gate as a brand-new customer, with no way to express "I run this tenant" distinctly from "I'm a paying customer's employee."

All roles are billable — engineers and product/BA consume a seat under the team's plan; the admin is the one who manages payment/plan for the whole team, not the only one paying for it.

## Why Now

This was surfaced as a direct side effect of shipping GitHub OAuth + billing (landing-auth-billing feature, merged 2026-07-05) and fixing a related login bug today (2026-07-09). The platform is pre-launch — no live paying customers yet — which makes this the cheapest possible moment to fix: zero migration cost for existing users (there are none), and the tenancy/role model must be right before the first real team signs up, since retrofitting a per-person role key after teams have shared data would require a harder migration than building it now.

## MVP Scope

The smallest validated slice: a unified per-person identity record spanning all three auth providers (GitHub OAuth, Google OAuth, email/password), a genuine per-person role assignment scoped per team-membership (not per tenant, and supporting many-to-many person↔team membership in the schema even though v1 UI only surfaces one active team per session), and one real shared-tenant team scenario working end-to-end — an admin can add a small number of teammates to their tenant (by person, regardless of auth provider — team membership is a first-class concept, not derived from GitHub org membership), assign each a role (admin/engineer/product/viewer), and at least one feature (e.g. the admin/credits panel) is visibly gated by that per-person role rather than by tenant membership alone. GitHub org membership is one convenience mechanism for bulk-adding members already in that org, layered on top of manual per-person add — not a replacement for it, since Product/BA members will often authenticate via Google or email with no GitHub org affiliation at all. Team size is designed to scale to ~100 members per tenant (schema/indexing must not degrade at that scale), but MVP validation itself doesn't require populating 100 real accounts — a handful is enough to prove the model. Self-serve team creation, a full per-seat billing UI, and a complete feature-access matrix across every screen are explicitly deferred (see Out of Scope) — MVP proves the identity + role foundation works, not the full team-management product surface.

Note: the zero-new-npm-dependency constraint from `product/tech-stack.md` is relaxed for this feature specifically (operator decision, 2026-07-09) — see Constraints.

## Out of Scope

- **Self-serve team/org creation and invite flow.** MVP relies on the admin adding teammates via an admin-only mechanism (not a public "create your team" signup flow). Excluded because a full invite/self-serve UX is a distinct, sizeable product surface — the identity/role foundation must exist before it's worth building.
- **Per-seat/usage-based Stripe billing.** MVP does not redesign checkout, webhooks, or pricing for seat-count billing. Excluded because current billing (`credits` table, Stripe checkout) is single-plan-per-tenant; seat-based billing is a distinct pricing/finance decision requiring its own discovery.
- **A complete feature-access matrix across every screen.** MVP proves the mechanism (one role-gated feature, e.g. the admin/credits panel) — it does not enumerate and gate every existing UI surface by role. Excluded because the full matrix should be shaped by real usage, not decided upfront in one pass.
- **Multi-team switching UX.** Even though the schema supports a person belonging to multiple teams, v1 UI only surfaces one active team per session — no "switch team" control. Excluded because the UX for this needs real multi-team usage to shape it well, and the schema doesn't require it to ship now.
- **GitHub-org-based bulk team import automation.** Automatically syncing team membership from live GitHub org membership changes (e.g. auto-removing someone the moment they leave the GitHub org) is out of scope for MVP — GitHub org membership is only used as a one-time bulk-add convenience at team setup, not an ongoing sync. Excluded because live org-sync is an operational feature that can be added once manual team membership (the actual scope boundary) is proven.

## Assumptions and Risks

**Resolved via /clarify (2026-07-09):** the v1 role list is closed at 4: admin, engineer, product, and viewer (read-only, no write access anywhere). No further granularity (e.g. billing-only role, per-CoP-discipline roles) is in scope for v1.
**Resolved via /clarify (2026-07-09):** team membership is a first-class concept, independent of auth provider — an admin adds people to a team by identity, not by GitHub org membership. GitHub org membership is retained only as a one-time bulk-add convenience at team setup (see MVP Scope / Out of Scope), not the team-membership model itself. This avoids excluding Google/email-only members (e.g. Product/BA) from teams.
**Resolved via /clarify (2026-07-09):** the schema supports many-to-many person↔team membership (role scoped per membership, not globally per person) from the start — this is the expensive-to-retrofit part and must be right now. The UI, however, scopes each session to a single active team for v1; multi-team switching UX is deferred (see Out of Scope) without requiring another schema migration later.
[ASSUMPTION] The current `ADMIN_GITHUB_LOGINS`/tenant_id-keyed admin scaffolding (commit `f845caf7`) can be replaced outright rather than migrated, since there are zero live customers depending on it today — unconfirmed, requires /clarify before scope is locked.
[ASSUMPTION] ~100 users per team is a genuine soft ceiling for the foreseeable future, not a placeholder that will need revisiting for larger enterprise customers soon — unconfirmed, requires /clarify before scope is locked.

**Resolved via /clarify (2026-07-09):** cross-provider identity collision is handled via **explicit manual linking** — each provider produces a separate identity by default (no automatic email-based merging, which would be unsafe today since `auth-email.js` signup does not verify email ownership). A logged-in user can deliberately link another provider to their existing identity from a settings page, proving ownership by being authenticated into both at the time of linking. MVP scope includes the linking data model and the link action; it does not require a polished settings UI beyond a functional control.

## Directional Success Indicators

1. **Per-person role assignment exists.** Baseline: 0% — today role is tenant-wide only, no per-person key exists. Target: 100% of team members in a shared tenant have an individually assigned role. Measured via: automated test asserting distinct role rows per person, not per tenant.
2. **Cross-provider identity collision is resolved, not silently fragmented.** Baseline: `[UNKNOWN BASELINE]` — no mechanism exists today to detect the same human across GitHub/Google/email, so current collision behaviour is undefined rather than measured. Target: an explicit, tested resolution exists for "same person, multiple providers" (link or intentionally-separate, but never silent duplication). Measured via: automated test suite covering multi-provider login for one identity.
3. **At least one feature is gated by per-person role, not tenant membership.** Baseline: 0 — today's `requireAdmin` middleware only checks tenant-wide role. Target: admin/credits panel access is denied to a non-admin team member even though they share the same tenant. Measured via: extension of the existing `check-arl-s2-admin-middleware.js` test pattern.
4. **Schema holds up at ~100 members per tenant.** Baseline: unverified beyond 1 member per tenant today. Target: role/team-membership lookups stay indexed (O(1), not a full-table scan) at 100 synthetic members. Measured via: a load test inserting 100 team-member rows and asserting query time stays within an agreed threshold.
5. **Zero regression for existing solo tenants.** Baseline: 100% of current auth/billing/tenancy tests pass under today's model. Target: same 100% pass rate, unchanged, after the new model ships — no manual migration for solo (non-team) customers. Measured via: the existing test suite (`check-arl-s1`, `check-arl-s4`, `check-lab-s2.3`, etc.) continuing to pass without modification to their assertions.

## Constraints

- **Zero-new-npm-dependencies is relaxed for this feature specifically** (operator decision, 2026-07-09) — a deviation from `product/tech-stack.md`'s stated runtime constraint, logged here rather than silently updating `tech-stack.md`.
- **CommonJS-only, no Express, no TypeScript still applies** — the relaxation is about adding npm packages (e.g. a session/auth library), not about the module system or framework choice.
- **Injectable adapter pattern (D37) required** for any new external dependency — no direct wiring, default stubs must throw.
- **Not a regulated context** — `context.yml` confirms `meta.regulated: false`; no compliance framework applies.
- **W4 solo-operator posture** — per `.github/architecture-guardrails.md`, no second reviewer is required; same posture as the existing landing-auth-billing feature.
- No time/budget constraint identified.

## Contributors

- Hamish King — Founder / Operator

## Reviewers

- None (solo pass)

## Approved By

[Name — Role — Date]

---

## Clarification log

[2026-07-09] Clarified via /clarify:
- Q: How should the same human logging in via different providers (GitHub, Google, email/password) be handled — one identity or separate?
  A: Explicit manual linking — separate identities by default; a logged-in user can deliberately link another provider from a settings page. No automatic email-based merging (unsafe today, since email/password signup doesn't verify email ownership).
- Q: Should GitHub org membership remain the sole team-membership signal, or does team membership need to be independent of auth provider?
  A: Hybrid — team is a first-class entity independent of auth provider (admin adds people by identity); GitHub org membership is retained only as a one-time bulk-add convenience layered on top.
- Q: Is the v1 role list exactly admin/engineer/product, or is a 4th read-only role needed?
  A: 4 roles: admin, engineer, product, viewer (read-only, no write access anywhere).
- Q: Can one person belong to more than one team/tenant, or exactly one at a time?
  A: Schema supports many-to-many person↔team membership (role scoped per membership) from the start; v1 UI surfaces only one active team per session — multi-team switching UX is deferred, not the schema.

**2 lower-priority assumptions remain open (not asked this round — below the impact cut-line for this pass, safe to resolve in a follow-up /clarify or at /definition):**
- [ASSUMPTION] The current `ADMIN_GITHUB_LOGINS`/tenant_id-keyed admin scaffolding (commit `f845caf7`) can be replaced outright rather than migrated, since there are zero live customers depending on it today.
- [ASSUMPTION] ~100 users per team is a genuine soft ceiling for the foreseeable future, not a placeholder that will need revisiting for larger enterprise customers soon.

---

**Next step:** Human review and approval → /benefit-metric
