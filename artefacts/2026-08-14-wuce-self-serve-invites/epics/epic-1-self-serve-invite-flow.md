## Epic: Teammates can join a tenant on their own, without waiting on the admin

**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Benefit-metric reference:** artefacts/2026-08-14-wuce-self-serve-invites/benefit-metric.md
**Slicing strategy:** Walking skeleton — Story 1 (admin creates an invite, real email is sent via the existing `sendInvitationEmail` adapter) establishes the thinnest possible end-to-end proof that reaches a real inbox, Story 2 completes the round-trip (invitee accepts and joins), and subsequent stories add the remaining guarantees (expiry, seat limit, metrics). Revised 2026-08-15 from an earlier plan that incorrectly assumed no email infrastructure existed — see `decisions.md`'s correction entry.

## Goal

An admin can invite a specific teammate by email and role, without that teammate needing the admin to separately "add them by identity" afterward. The teammate receives a real email, clicks through, authenticates via the existing OAuth/email flow, and lands in the tenant with the role the admin assigned — bounded by a 24-hour expiry and a new, basic per-plan-tier member-count cap. When this epic is complete, self-serve invite is a real, working alternative to the admin's manual add-by-identity action, not just a UI mockup.

---CANVAS-JSON: {"type":"program-design","title":"Program Design — Self-serve team invite flow","content":{"mermaid":"flowchart LR\n    subgraph Creation [wsi-s1: Admin creates invite]\n        ROUTE_CREATE[routes/team-invitations.js]\n        MOD_INVITE[modules/team-invitations.js]\n        MOD_EMAIL[modules/invitation-email.js REUSED]\n        RESEND[Resend SDK — already wired]\n    end\n    subgraph Acceptance [wsi-s2/s3/s4: Invitee accepts]\n        DISPATCH[server.js _combinedMagicLinkVerify EXTENDED]\n        VERIFY_TEAM[verifyTeamInviteRedemption]\n        MOD_TEAM[modules/team-management.js pattern reused, role parameterised]\n        MOD_PLAN[modules/tenant-plan.js getPlanState REUSED]\n    end\n    subgraph Metrics [wsi-s5]\n        POSTHOG[modules/posthog-server.js REUSED]\n    end\n    ROUTE_CREATE --> MOD_INVITE\n    MOD_INVITE --> MOD_EMAIL\n    MOD_EMAIL --> RESEND\n    MOD_INVITE --> POSTHOG\n    DISPATCH --> VERIFY_TEAM\n    VERIFY_TEAM --> MOD_INVITE\n    VERIFY_TEAM --> MOD_PLAN\n    VERIFY_TEAM --> MOD_TEAM\n    VERIFY_TEAM --> POSTHOG"}}---

## Out of Scope

- **Invite management (manual revoke, resend, per-invite audit trail)** — the only lifecycle rule is the fixed 24-hour expiry; no admin-facing management UI is built in this epic.
- **Bulk/CSV invite of multiple teammates at once** — one invite at a time, matching the existing single "add by identity" admin action.
- **Changes to per-seat/usage-based billing** — self-serve joining respects the existing seat limit; it does not change how seats are billed or counted.
- **Building new email-sending infrastructure** — this epic reuses the existing `sendInvitationEmail`/Resend adapter (`modules/invitation-email.js`, built for `2026-07-30-agency-client-organisations`) unchanged; it does not build a second email adapter or a general-purpose notification system.

## Benefit Metrics Addressed

| Metric | Current baseline | Target | How this epic moves it |
|--------|-----------------|--------|----------------------|
| Share of new teammates added via self-serve invite | 0% | Majority (>50%) within a few weeks of launch | This epic is the entire mechanism the metric measures — every self-serve join originates from a story in this epic |
| Time from invite creation to invitee access | Not yet established | Under 10 minutes | The reused email adapter's delivery speed, plus the accept-and-join story's own responsiveness, directly determine this metric |

## Stories in This Epic

- [ ] Admin creates a per-person invite, which sends the invite email (reusing the existing adapter) — wsi-s1
- [ ] Invitee accepts the invite and joins the tenant with the assigned role — wsi-s2
- [ ] Expired invites (past 24 hours) are rejected cleanly — wsi-s3
- [ ] Invite acceptance is blocked if the tenant is at its paid seat limit — wsi-s4
- [ ] PostHog instrumentation for both benefit metrics — wsi-s5

## Human Oversight Level

**Oversight:** Medium
**Rationale:** This touches tenant boundaries (ADR-025) and grants real access to a tenant based on an email the admin names — consequential, but not as high-stakes as a governance-approval workflow (no financial transaction, no irreversible external action beyond an email send). Matches the oversight level used for comparable tenant-boundary-adjacent work in `team-identity-roles` and `wugs` Epic 1 (repo-backed viewing).

## Complexity Rating

**Rating:** 2
<!-- Some ambiguity, but not from missing infrastructure — the email adapter, invitation-table pattern, and magic-link dispatcher all already exist. The real complexity is correctly extending the shared magic-link verify dispatcher (already juggling two invitation/login types via payload-shape dispatch) to a third case without disturbing the existing two, and correctly diverging from client_invitations' hardcoded role='admin' to the admin-chosen role this feature needs. -->

## Scope Stability

**Stability:** Stable
