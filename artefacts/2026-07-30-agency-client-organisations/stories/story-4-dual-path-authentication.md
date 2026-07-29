## Story: Client-org dual-path authentication

**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Discovery reference:** artefacts/2026-07-30-agency-client-organisations/discovery.md
**Benefit-metric reference:** artefacts/2026-07-30-agency-client-organisations/benefit-metric.md
**Domain:** [auth, security]

## User Story

As a **Client org member (read-only)**,
I want to **sign in either with my GitHub account or with just my email address, without being forced to create or use a GitHub account I may not have**,
So that **I can actually access what my agency has shared with me, regardless of whether I use GitHub in my day-to-day work**.

## Benefit Linkage

**Metric moved:** Agency-led client provisioning
**How:** The metric requires "a client-user login event" — without a viable authentication path for users who don't have or want a GitHub account, a meaningful share of invited Client-org users could never complete the flow the metric measures.

## Architecture Constraints

- **ADR-025 (Multi-tenancy enforced at the application layer):** the new magic-link path must resolve to the same `tenantId`/`org_id` session shape as the existing GitHub OAuth path (`routes/auth.js`) — it is a second entry point into the same session model, not a parallel identity system.
- This story does not change GitHub OAuth for Agency or Standalone tenants in any way — that path is untouched.

## Dependencies

- **Upstream:** Story 3 (self-service provisioning) creates the invitation a Client-org user redeems via this story's login mechanism.
- **Downstream:** None within this epic — this is a leaf capability.

## Acceptance Criteria

**AC1:** Given a Client-org user was invited via Story 3's invitation flow, When they choose to sign in with GitHub OAuth, Then the existing GitHub OAuth flow (`routes/auth.js`) completes and resolves their session to their Client organisation, matching the existing OAuth resolution pattern used by Standalone and Agency tenants today.

**AC2:** Given a Client-org user was invited via Story 3's invitation flow and does not have or does not want to use a GitHub account, When they choose the email + magic-link path and enter their invited email address, Then a time-limited magic-link is sent to that email, and clicking it resolves their session to their Client organisation with the same shape (`tenantId`, `login`, session fields) as the GitHub OAuth path.

**AC3:** Given a user attempts to use the email + magic-link path, When their organisation is `org_type = 'agency'` or `org_type = 'standalone'` (not `client`), Then the magic-link path is not offered/rejected — this login mechanism is scoped to Client-org accounts only for this MVP, per the discovery's explicit scope boundary.

**AC4:** Given a magic-link has already been used once, When the same link is clicked again, Then it is rejected (link is single-use, time-limited) — matching standard magic-link security conventions.

## Out of Scope

- Making the magic-link mechanism available to any org type other than Client — explicitly out of scope per discovery; a general-purpose alternative login method for every tenant type is a separate, unscoped decision.
- Password-based authentication — the two paths are GitHub OAuth and magic-link only; no password field is introduced anywhere.
- Multi-factor authentication for the magic-link path — not addressed in this MVP.

## NFRs

- **Performance:** Magic-link email delivery should complete within this codebase's existing email-sending latency norms (no new email infrastructure — reuse whatever existing email-sending mechanism, if any, or a standard transactional email provider consistent with this codebase's other integrations).
- **Security:** Magic-links must be single-use, time-limited (e.g. 15–30 minutes, matching common transactional patterns), and delivered only to the exact email address on the invitation record — never guessable or brute-forceable. This is a genuinely new auth surface and should receive equivalent security scrutiny to the existing GitHub OAuth flow at `/review`.
- **Accessibility:** The magic-link request form uses a real `<form>`/`<input type=email>`, keyboard-navigable.
- **Audit:** Magic-link requests, sends, and successful/failed redemptions are logged with email (not raw token), timestamp, and outcome — tokens themselves are never logged in plaintext, matching this codebase's existing credential-handling conventions (product/constraints.md #12, applied by analogy even though that constraint is written for the platform's own credential handling).

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
