# Discovery: Self-serve team invite flow

**Status:** Approved
**Created:** 2026-08-14
**Approved by:** Hamish King — Platform Owner — 2026-08-14
**Author:** Copilot (Claude)

---

## Problem Statement

Every wuce beta customer's admin has to manually add each teammate themselves — there is no way for a teammate to request or receive access on their own. Today the only path into a tenant is the admin's own "add by identity" action or a GitHub-org bulk-add, both of which require the admin to act first, one person (or one bulk operation) at a time. This is direct friction on exactly the thing beta is meant to validate — real teams collaborating with per-person roles, not a solo operator — and it happens on every single beta customer's onboarding, not just a hypothetical future case. `product/roadmap.md` (2026-07-14) already flagged this as a live, unresolved friction point.

## Who It Affects

- **The tenant admin** — currently the only person who can add a teammate. They are the bottleneck: every new teammate requires the admin to stop what they're doing and go add that person individually.
- **The teammate being invited** — an Engineer or Product/BA persona (per `product/mission.md`'s personas, applied to the wuce commercial surface) who wants to start using wuce but cannot self-provision access; they are blocked waiting on the admin's availability.

## Why Now

Beta is live and actively testing exactly this: real teams collaborating with per-person roles (`team-identity-roles`, DoD-complete 2026-07-13). Every beta customer's onboarding currently hits this admin bottleneck immediately during the exact flow beta exists to validate. This is not a hypothetical future pain — it is active friction on every current beta customer's first real usage.

## MVP Scope

An admin enters a teammate's email address and a role (role selection is required, no default); the platform sends that person a unique, per-person invite email, valid for 24 hours. **This requires a new, minimal transactional email-sending capability — wuce has never sent an email before (confirmed at /definition: `lab-s2.2` explicitly scoped out even signup verification email), so building this adapter is a genuine prerequisite, not existing infrastructure to reuse.** The invitee clicks the link within that window and authenticates via the existing GitHub OAuth / Google OAuth / email-password flow, joining the tenant directly with the role the admin assigned — without the admin having to separately "add by identity" afterward. If the tenant is at its paid seat limit at the moment the invitee tries to accept, the join is blocked (seat limits are checked at acceptance, not at invite creation). This removes both the "admin must act first, one person at a time" bottleneck and the "admin must manually share a link some other way" step, without requiring a full invite-management UI (revoke, resend, audit trail) in the first cut.

## Out of Scope

- **Invite management (manual revoke, resend, per-invite audit trail)** — the MVP's only lifecycle rule is the fixed 24-hour expiry; an admin-facing UI to revoke or resend an invite before it expires is a natural but separate follow-up.
- **Bulk/CSV invite of multiple teammates at once** — MVP is one invite at a time, matching the existing single "add by identity" admin action; bulk invite (distinct from the existing GitHub-org bulk-add, which adds directly rather than inviting) is a refinement.
- **Changes to per-seat/usage-based billing** — already separately deferred per `product/roadmap.md`; self-serve joining does not change how seats are billed.

## Assumptions and Risks

- [RESOLVED via /clarify 2026-08-14] Invites are per-person (not a reusable tenant-wide link): the admin names a specific email address, and the platform emails that person a unique invite tied to their address. This substantially reduces the original leaked-link risk, since a leaked per-person invite still only grants access as that named person's role, not open access to anyone who finds it.
- [RESOLVED via /clarify 2026-08-14] Role selection is required, not optional — the admin must explicitly pick a role every time they create an invite. No silent default.
- [RESOLVED via /clarify 2026-08-14] Seat/plan limits are checked at invite-ACCEPTANCE time, not at invite-creation time — an admin can create an invite freely even near the seat limit, but the invitee is blocked from actually joining if the tenant is at its paid seat count by the time they accept (seats can free up between invite and accept, so creation-time blocking would be overly restrictive).
- [RESOLVED via /clarify 2026-08-14] Invites expire 24 hours after creation. This is the MVP's security bound in place of full invite-management (revoke/resend remain out of scope) — an unaccepted invite simply stops being valid after 24 hours rather than remaining open-ended.

**What could make this not worth building:** If beta teams are actually small enough (2-3 people) that the admin doing manual adds is not real friction in practice, the pain may be smaller than `product/roadmap.md`'s note assumed, and building invite infrastructure would be solving a problem beta customers do not yet feel.

## Directional Success Indicators

**Share of new teammates added via self-serve invite vs. admin manual add.** Baseline: 0% (self-serve does not exist yet — 100% of additions today are the admin's "add by identity" or bulk-add actions). Target: a majority of new teammates join via self-serve invite within a few weeks of launch. Measured via: PostHog event comparing invite-based joins against the existing admin-add event.

**Time from "admin wants to add someone" to "that person has access."** Baseline: [UNKNOWN BASELINE] — no current instrumentation measures how long an admin takes to get around to manually adding someone; anecdotally it is "whenever the admin is free," not instant. Target: minutes, not hours or days. Measured via: timestamp diff between invite-link creation and the invitee's first successful login.

## Constraints

- Must reuse the existing multi-auth flow (GitHub OAuth, Google OAuth, email/password, `2026-07-01-landing-auth-billing`) — no new authentication mechanism.
- Must respect existing tenant isolation (ADR-025, multi-tenancy foundation) — an invite must correctly scope the joiner to the right `tenant_id`, with the same rigor as the existing per-person role resolution work (`team-identity-roles`).
- Must respect Stripe seat/plan limits already in place — a self-serve join should not be able to bypass a paid seat cap that a manual admin-add would otherwise hit.
- No fixed deadline, but this is competing for attention against other pre-beta items already flagged (e.g. the cross-tenant prompt-cache leak) — should stay small and bounded given that competition, not grow into a larger project.

## Contributors

- Hamish King — Platform owner — 2026-08-14

## Reviewers

- Hamish King — Platform Owner — 2026-08-14

## Approved By

Hamish King — Platform Owner — 2026-08-14

---

**Next step:** Human review and approval → /benefit-metric

---

## Clarification log

[2026-08-14] Clarified via /clarify:
- Q: Should the invite be a single reusable tenant-scoped link, or a per-person invite?  A: Per-person, with platform-sent email delivery brought into MVP scope (a scope change from the original draft, not just an assumption resolution).
- Q: Should the admin be required to pick a role every time, or should there be a silent default?  A: Required — no silent default.
- Q: Should a self-serve invite be blocked at creation-time or acceptance-time if seats are full?  A: Acceptance-time — invite creation is unrestricted, joining is blocked if the tenant is at its seat limit when the invitee accepts.
- Q: Do invite links need expiry or single-use enforcement, or is "valid until manually revoked" acceptable for MVP?  A: Fixed 24-hour expiry (not the 7-day default I suggested — the operator specified 24 hours).
