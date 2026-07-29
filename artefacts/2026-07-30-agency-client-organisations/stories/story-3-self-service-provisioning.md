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

## Dependencies

- **Upstream:** Story 1 (organisation entity), Story 2 (relationship + grants model) must both be complete — this story creates rows in both tables via a user-facing flow.
- **Downstream:** Story 4 (dual-path auth) is what the invited Client-org user actually uses to log in after this story creates their invitation.

## Acceptance Criteria

**AC1:** Given a logged-in user whose organisation has `org_type = 'agency'`, When they access the "Create Client" flow, Then they can enter a Client organisation name and submit it, resulting in a new `organisations` row with `org_type = 'client'` and a new `agency_client_relationships` row linking the Agency's org to the new Client org.

**AC2:** Given a logged-in user whose organisation is `org_type = 'standalone'` or `org_type = 'client'` (not `agency`), When they attempt to access the "Create Client" flow (e.g. by direct URL), Then the request is rejected — this flow is only reachable by Agency-type organisations.

**AC3:** Given an Agency admin has just created a Client organisation, When they invite the first user by entering an email address, Then an invitation record is created for that Client org, and the invited email receives an invitation (link or code) that, when used, creates a Client-org user account scoped to that new Client org with a read-only role.

**AC4:** Given an Agency admin is partway through the create-client flow and submits with a blank or invalid organisation name, When the form is submitted, Then no `organisations` row is created and a validation error is shown — matching this codebase's existing form-validation conventions (e.g. `handlePostProductNew`'s validation pattern).

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

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
