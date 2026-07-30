## Story: Self-service Agency-to-Client provisioning

**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Benefit-metric reference:** artefacts/2026-07-30-agency-client-organisations/benefit-metric.md
**Domain:** [web-ui, auth]

## User Story

As an **Agency admin**,
I want to **create a Client organisation and invite its first user directly from within the app, without needing platform-operator involvement**,
So that **I can onboard an enterprise client on my own schedule, the same way I'd expect any modern B2B tool to let me manage my own customers**.

## Benefit Linkage

**Metric moved:** Agency-led client provisioning
**How:** This story is the actual user-facing flow the metric measures — an Agency org must complete this flow (create client, invite user) before the metric's "provisions ≥1 Client org" condition can be true at all.

## Architecture Constraints

- **ADR-027 (Live SaaS features are ordinary app code):** this is a new route/flow in `src/web-ui/routes/`, following the same session/adapter conventions as existing product-creation flows (e.g. `handlePostProductNew`).
- Depends on Story 1's `organisations` table and Story 2's relationship table existing — this story is the UI/flow layer on top of both.
- **ARCH decision 2026-07-31 (see `decisions.md`):** AC3's invitation link is issued and verified via Passport.js + the `passport-magic-login` strategy — the same mechanism Story 4 uses for ongoing Client-org login, not a separate one-time-code system. Clicking the invitation link both creates the Client-org user account and resolves a session in one step, through the same `verify()` callback Story 4's login path uses. The invitation email itself is sent via Resend (env var `RESEND_API_KEY`); no other new third-party dependency is introduced.
- **ARCH decision 2026-07-31 (see `decisions.md`, role-model entry):** the invited user's account creation (AC3) reuses the existing `team_memberships` role model (ADR-026 — reuse before introducing new entities) rather than a new Client-org-specific role field. The insert follows the same shape as `team-management.js`'s `addOrUpdateTeammate` (person + `team_memberships(person_id, tenant_id, role)`, scoped to the new Client org's own `tenant_id`), with `role = 'admin'`.

## Dependencies

- **Upstream:** Story 1 (organisation entity), Story 2 (relationship + grants model) must both be complete — this story creates rows in both tables via a user-facing flow.
- **Downstream:** Story 4 (dual-path auth) is what the invited Client-org user actually uses to log in after this story creates their invitation. Story 4 and this story share the same Passport.js/`passport-magic-login` wiring — build them together or in immediate sequence.
- **External:** Resend account and API key (`RESEND_API_KEY`), provisioned before this story reaches implementation.

## Acceptance Criteria

**AC1:** Given a logged-in user whose organisation has `org_type = 'agency'`, When they access the "Create Client" flow, Then they can enter a Client organisation name and submit it, resulting in a new `organisations` row with `org_type = 'client'` and a new `agency_client_relationships` row linking the Agency's org to the new Client org.

**AC2:** Given a logged-in user whose organisation is `org_type = 'standalone'` or `org_type = 'client'` (not `agency`), When they attempt to access the "Create Client" flow (e.g. by direct URL), Then the request is rejected — this flow is only reachable by Agency-type organisations.

**AC3:** Given an Agency admin has just created a Client organisation, When they invite the first user by entering an email address, Then an invitation record is created for that Client org, and the invited email receives an invitation (link or code) that, when used, creates a Client-org user account scoped to that new Client org, with a `team_memberships` row of `role = 'admin'` for that org's own `tenant_id` (the existing per-(person, tenant) role model from `modules/user-roles.js`/`team-management.js` — see `decisions.md` 2026-07-31 ARCH entry). This user's view of any Agency-shared resource is still independently restricted to read-only by Story 2's grant model regardless of this `admin` role — the two are separate axes, not in tension.

**AC4:** Given an Agency admin is partway through the create-client flow and submits with a blank or invalid organisation name, When the form is submitted, Then no `organisations` row is created and a validation error is shown — matching this codebase's existing form-validation conventions (e.g. `handlePostProductNew`'s validation pattern).

**AC5 (D37 adapter wiring, added 2026-07-31):** Given the email-sending function used to deliver the invitation (AC3) is an injectable adapter (`setSendInvitationEmail`-style, following this codebase's existing D37 convention), When the server starts up, Then `server.js` (or the equivalent wiring module) wires it to a real Resend API call — the stub default throws (`Adapter not wired: ...`) rather than returning silently, and this wiring is verified by a test asserting an observable, differentiating outcome (e.g. two different invitations resolve to two different, correctly-addressed Resend calls), not merely that a function reference was assigned.

## Out of Scope

- The actual authentication mechanism the invited user uses to complete their account (GitHub OAuth or magic-link) — that is Story 4.
- Sharing any specific product/feature with the newly-created Client org — this story only creates the org and relationship; granting access is a separate action a user takes afterward (already modelled by Story 2's grant mechanism).
- Inviting more than one user to a Client org, or any Client-org-side user management (e.g. removing a user) — this story covers the first-user invitation only; broader user management is a natural follow-up, not built here.

## NFRs

- **Performance:** Not a high-throughput path — no specific target beyond this codebase's existing page-load conventions.
- **Security:** The "Create Client" flow must verify `org_type = 'agency'` server-side on every request (AC2), not just hide the UI entry point client-side — a client-side-only restriction is not a valid security boundary.
- **Accessibility:** The create-client form and invitation flow use real `<form>`/`<input>` elements, keyboard-navigable, matching this codebase's existing accessibility conventions (e.g. `renderFleetPanel`'s established pattern).
- **Audit:** Client-org creation and user invitation are logged with the Agency admin's identity, the new Client org's ID, and timestamp.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
**Note (2026-07-31 re-affirmation):** Complexity holds at 2 now that the email/token mechanism is a named, bounded decision (Passport.js + `passport-magic-login` + Resend, see `decisions.md`) rather than an unstated assumption — the remaining unknowns were resolved by the decision itself, not by new implementation risk.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
