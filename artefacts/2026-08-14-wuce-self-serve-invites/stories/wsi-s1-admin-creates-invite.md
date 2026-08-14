## Story: Admin creates a per-person team invite, which sends the invite email

**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Benefit-metric reference:** artefacts/2026-08-14-wuce-self-serve-invites/benefit-metric.md
**Domain:** [auth]

## User Story

As a **tenant admin**,
I want to **invite a specific teammate by email and role, and have them actually receive an email**,
So that **I don't have to wait for them to already exist in the system before I can add them — today `addOrUpdateTeammate` throws `UnknownIdentityError` for anyone who has never logged in, which is exactly the case for a brand-new teammate**.

## Benefit Linkage

**Metric moved:** Share of new teammates added via self-serve invite
**How:** This story is the entry point of the entire self-serve mechanism the metric measures — no self-serve join can happen without an invite first existing and being emailed.

## Architecture Constraints

- **ADR-025 (multi-tenancy, application-layer tenant_id scoping):** the invite's `tenant_id` MUST come from the calling admin's own session (`req.session.tenantId`), never from request input — matching `team-management.js`'s `addOrUpdateTeammate`'s own documented pattern exactly (its own header comment: "adminTenantId MUST come from the calling admin's own session ... never from request input").
- **Reuse `sendInvitationEmail` unchanged (ADR-026, reuse before introducing a new entity):** `src/web-ui/modules/invitation-email.js`'s `sendInvitationEmail(destinationEmail, link, code)` is called directly — this story does not build a second email adapter. If the invite email's content needs to differ from the existing "You have been invited" Client-org text (e.g. naming the tenant and role), that is a content-only change inside the SAME `createResendSendInvitationEmail` factory or a new template parameter — not a new adapter.
- **New `team_invitations` table (ADR-026 reuse-check confirmed with operator at /definition — genuinely new table, not an extension of `client_invitations`, to avoid coupling two features' schemas), matching `client_invitations`' shape (`modules/client-invitations.js`) with 3 additions this feature specifically needs:** `tenant_id` (not `client_org_id` — joining an existing tenant, not creating a new org), `role` (the admin-chosen role from `team-management.js`'s `VALID_ROLES = ['admin', 'engineer', 'product', 'viewer']` — `client_invitations` has no role column since it always hardcodes `role='admin'`), and `expires_at` (client_invitations has no expiry at all — this feature's own 24-hour rule, per `decisions.md`'s Q4 resolution, is new). **Reuse the pattern, not just the shape:** the new module's functions (create/get/mark-redeemed) should mirror `client-invitations.js`'s own function signatures and atomic-redemption `UPDATE ... WHERE redeemed_at IS NULL RETURNING *` convention as closely as the schema difference allows — this is a new table with deliberately-copied logic, not independently reinvented logic.
- **Payload field name must be distinguishable from the existing two invitation/login payload shapes** dispatched by `server.js`'s `_combinedMagicLinkVerify` (`payload.invitationId` → Client-org invite redemption; its absence → Client login). This story's own invite payload must use a differently-named field (e.g. `teamInvitationId`) so `wsi-s2`'s dispatcher extension can distinguish all three cases without ambiguity or collision.
- **Role validation:** reuse `team-management.js`'s exported `VALID_ROLES` array and `InvalidRoleError` — do not invent a second role-validation list.

## Dependencies

- **Upstream:** None (the email adapter and magic-link strategy this story depends on are already merged, production-wired infrastructure — not stories in this feature)
- **Downstream:** `wsi-s2` (invitee accepts what this story creates), `wsi-s3` (expiry check reads this story's `expires_at` column), `wsi-s4` (seat-limit check runs during `wsi-s2`'s acceptance, gated on this story's invite existing), `wsi-s5` (metrics instrumentation reads this story's invite-creation event)

## Acceptance Criteria

**AC1:** Given an admin submits a teammate's email address and a valid role (one of `admin`/`engineer`/`product`/`viewer`), When the invite is created, Then a new `team_invitations` row is written scoped to the admin's own `tenant_id` (from session, not request input), with the chosen role, a `created_at` timestamp, and an `expires_at` timestamp 24 hours later.

**AC2:** Given a `team_invitations` row was just created, When invite creation completes, Then `sendInvitationEmail` is called with the invitee's email address and a link containing the signed invite token — the same reused adapter `2026-07-30-agency-client-organisations` already uses, not a new one.

**AC3:** Given an admin submits a role that is not one of the 4 valid roles, When the invite is created, Then the request is rejected with a clear error (reusing `team-management.js`'s `InvalidRoleError`) and no `team_invitations` row is written.

**AC4:** Given an admin omits the role field entirely, When the invite is created, Then the request is rejected — role selection is required with no silent default, per this feature's own /clarify decision (`decisions.md`, Q2).

**AC5:** Given the email-send call fails after the `team_invitations` row was already written (e.g. Resend API error), When the failure occurs, Then the admin sees a clear error indicating the invite could not be emailed — the row is not silently left in a state where the admin believes an email was sent when it was not.

## Out of Scope

- **Invitee-side acceptance flow** — that is `wsi-s2`; this story only covers creation and sending.
- **Bulk/CSV invite of multiple teammates** — one invite per submission, matching the epic's own Out of Scope.
- **Resend/regenerate an existing invite** — out of scope per the epic; if an invite email fails to send (AC5), the admin's only recourse in this story's scope is creating a new invite.
- **A distinct email template/branding pass** — reusing the existing `createResendSendInvitationEmail` factory's minimal HTML shape (with updated copy naming the tenant/role) is sufficient; a polished template is a future refinement.

## NFRs

- **Performance:** No hard SLO — matches `wsi-s1`'s upstream dependency (`sendInvitationEmail`)'s own existing non-blocking behaviour; the admin's request does not wait synchronously for the invitee's email client to receive the message, only for the send API call to be accepted.
- **Security:** Tenant scoping enforced server-side from session only (ADR-025). The raw invite token/link is never logged in plaintext — matching `client-invitations.js`'s own established audit convention (log `invitation_id`/`tenant_id`/timestamp only, never the token).
- **Accessibility:** The invite-creation form's email and role fields have labels; the submit action is a real, keyboard-accessible button.
- **Audit:** Invite creation is logged (`invitation_id`, `tenant_id`, `role`, `created_by` admin identifier, timestamp) — matching `client-invitations.js`'s `createInvitation` logging shape.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic

---CANVAS-JSON: {"type":"data-model","title":"Data model — team_invitations","content":{"mermaid":"erDiagram\n    TEAM_INVITATIONS {\n        text team_invitation_id PK\n        text tenant_id\n        text email\n        text role\n        timestamptz created_at\n        timestamptz expires_at\n        timestamptz redeemed_at\n    }"}}---

