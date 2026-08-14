## Story: Invitee accepts the invite and joins the tenant with the assigned role

**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Discovery reference:** artefacts/2026-08-14-wuce-self-serve-invites/discovery.md
**Benefit-metric reference:** artefacts/2026-08-14-wuce-self-serve-invites/benefit-metric.md
**Domain:** [auth]

## User Story

As a **teammate who received an invite email**,
I want to **click the link, authenticate, and land directly in the tenant with the role the admin assigned**,
So that **I don't need the admin to separately "add me by identity" after I've logged in — the invite itself is what grants my access**.

## Benefit Linkage

**Metric moved:** Share of new teammates added via self-serve invite; Time from invite creation to invitee access
**How:** This story completes the round-trip `wsi-s1` starts — without a working accept-and-join path, an invite is just an email that goes nowhere. This is also the story whose completion timestamp the second metric (time from invite to access) directly measures.

## Architecture Constraints

- **Extends `server.js`'s existing `_combinedMagicLinkVerify` dispatcher to a THIRD case, without disturbing the existing two.** Currently: `payload.invitationId` present → `_verifyInvitationRedemption` (Client-org invite, `story-3-self-service-provisioning`); its absence → `_verifyClientLogin` (Client login, `story-4-dual-path-authentication`). This story adds a third check using a distinctly-named field (`payload.teamInvitationId`, per `wsi-s1`'s own Architecture Constraints) so the three cases never collide: `if (payload.teamInvitationId) → team invite verify; else if (payload.invitationId) → client-org invite verify; else → client login`. The existing two branches' behaviour must be verified unchanged by a regression test, not just informally assumed safe.
- **Never call `registerMagicLinkStrategy` again** — extend the SAME shared strategy instance via `setVerifyCallback`, matching the exact pattern `story-4-dual-path-authentication` already established (see `auth/magic-link-strategy.js`'s own module header and `server.js`'s wiring comments — this is an explicit, documented "never re-register" rule, not just current convention).
- **Person creation reuses `client-invitations.js`'s `createClientOrgUserAndAdminMembership` PATTERN (resolve-or-create a `people`/`person_identities` row), but NOT its hardcoded `role='admin'`** — this story creates the `team_memberships` row with the invite's own stored `role` column (from `wsi-s1`'s `team_invitations` table), reusing the reuse-before-create logic exactly but parameterising the role instead of hardcoding it.
- **ADR-025 (tenant scoping):** the `team_memberships` row's `tenant_id` comes from the invite's own stored `tenant_id` (set server-side at creation time in `wsi-s1`, never from the accept-time request), preventing a tampered accept-time payload from joining a different tenant than the one the admin actually invited them to.
- **Atomic single-use redemption**, matching `client-invitations.js`'s own `markInvitationRedeemed`'s `UPDATE ... WHERE redeemed_at IS NULL RETURNING *` convention exactly — a second, concurrent accept attempt for the same invite token must never both succeed.

## Dependencies

- **Upstream:** `wsi-s1` (this story redeems what that story creates; the `team_invitations` table and its `teamInvitationId`-shaped payload must exist first)
- **Downstream:** `wsi-s3` (expiry check runs as part of this story's own redemption logic), `wsi-s4` (seat-limit check runs as part of this story's own redemption logic), `wsi-s5` (metrics instrumentation reads this story's own accept-event)

## Acceptance Criteria

**AC1:** Given a valid, unexpired, unredeemed invite token, When the invitee clicks the link and completes authentication, Then a `team_memberships` row is created (or updated, if they're already a member — matching `addOrUpdateTeammate`'s own existing upsert behaviour) with the invite's stored `tenant_id` and `role`, and the invitee is redirected into that tenant.

**AC2:** Given the invitee's email has never logged in before (no existing `people`/`person_identities` row), When they accept the invite, Then a new person is created and linked — this is the exact case `addOrUpdateTeammate` cannot handle (it throws `UnknownIdentityError`), which is why this story exists as a separate path.

**AC3:** Given the invitee's email already resolves to an existing person (they've logged in elsewhere before), When they accept the invite, Then the EXISTING person is reused (not a duplicate created) — matching `createClientOrgUserAndAdminMembership`'s own existing-link-reuse logic exactly.

**AC4:** Given the SAME invite token is used a second time (e.g. the invitee double-clicks, or the link is somehow reused), When the second accept attempt is made, Then it is rejected cleanly (invite already redeemed) and does NOT create a second `team_memberships` row or silently succeed again.

**AC5:** Given the existing `story-3-self-service-provisioning` (Client-org invite) and `story-4-dual-path-authentication` (Client login) flows, When either of their own payload shapes is verified after this story's dispatcher extension ships, Then both continue to behave exactly as before — a regression test confirms this, not just informal confidence.

## Out of Scope

- **Invite creation** — that is `wsi-s1`; this story only covers acceptance.
- **What happens if the invitee's email doesn't match who the admin intended** (e.g. a shared/forwarded email address) — the invite is scoped to the named email address only; broader identity verification beyond "this email successfully authenticated" is out of scope, matching the existing OAuth/email-password trust model this codebase already uses everywhere else.
- **A distinct "welcome to the tenant" onboarding flow** — the invitee lands in the tenant using the existing post-login experience; no new onboarding UI is built here.

## NFRs

- **Performance:** Redemption completes within the normal request/response cycle — no async/background processing needed for this story's own scope.
- **Security:** Atomic redemption prevents double-use (AC4). `tenant_id` is never accept-time-request-controlled (ADR-025). The existing two dispatcher cases are regression-tested, not just assumed unaffected (AC5).
- **Accessibility:** Not a new UI surface — the invitee authenticates via the existing OAuth/email-password flow's own existing accessible UI.
- **Audit:** Redemption is logged (`team_invitation_id`, `tenant_id`, `person_id`, `role`, timestamp) — matching `client-invitations.js`'s own `markInvitationRedeemed` logging shape, never logging the raw token.

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

---CANVAS-JSON: {"type":"data-model","title":"Data model — invite acceptance","content":{"mermaid":"erDiagram\n    TEAM_INVITATIONS {\n        text team_invitation_id PK\n        text tenant_id\n        text email\n        text role\n        timestamptz created_at\n        timestamptz expires_at\n        timestamptz redeemed_at\n    }\n    TEAM_MEMBERSHIPS {\n        integer person_id PK\n        text tenant_id PK\n        text role\n    }\n    PEOPLE {\n        integer id PK\n    }\n    TEAM_INVITATIONS ||--o| TEAM_MEMBERSHIPS : \"redemption creates/updates\"\n    PEOPLE ||--o{ TEAM_MEMBERSHIPS : \"has\""}}---
