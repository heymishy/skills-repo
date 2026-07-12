## Story: A logged-in user links a second auth provider to their identity

**Epic reference:** artefacts/2026-07-09-team-identity-roles/epics/tir-e1.md
**Discovery reference:** artefacts/2026-07-09-team-identity-roles/discovery.md
**Benefit-metric reference:** artefacts/2026-07-09-team-identity-roles/benefit-metric.md

## User Story

As a **Product / BA team member**,
I want to **deliberately link my Google or email/password identity to my existing account from a settings page**,
So that **I don't appear as a separate, disconnected person just because I sometimes authenticate via a different provider than my teammates expect**.

## Benefit Linkage

**Metric moved:** Cross-provider identity collision is resolved, not silently fragmented.
**How:** This story builds the explicit manual link action resolved via /clarify — a logged-in user proves ownership of a second provider identity by completing that provider's real auth flow, and the two identities are recorded as the same `people` row. The metric's target (an explicit, tested resolution exists) is met the moment this action works end-to-end for one provider pair, with an automated test proving no silent automatic merging occurs.

## Architecture Constraints

- Builds on the existing multi-provider auth registry (lab-s1.3, lab-s2.1) — the provider adapter pattern (`gitHubProviderAdapter`, `setGoogleUserInfoAdapter`) already handles per-provider authentication; this story adds a linking action on top, it does not reimplement provider auth.
- **D37:** any new adapter this story introduces (e.g. a link-confirmation step) follows the injectable pattern — default stub throws, no silent no-op.
- **ADR-025:** the linked person's `team_memberships` rows (from tir-s1) are unaffected by linking — linking merges identity, not tenant/role state; a person's roles across different tenants stay exactly as they were before linking.
- **ADR-018:** a real cross-provider OAuth round-trip is not usable in CI. Link-flow tests (AC1, AC4) use the existing `NODE_ENV=test` auth-bypass fixture pattern to simulate both providers' completed authentication, not a live OAuth call — consistent with how every other provider-login test in this codebase is written.

## Dependencies

- **Upstream:** tir-s1 (the `people` table must exist to link two provider identities to the same person record).
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a user is logged in via GitHub as identity X, When they navigate to the account-linking settings page and complete a Google OAuth flow while already logged in (proving ownership of identity Y by successfully authenticating), Then identities X and Y are recorded as the same `people` row, and a subsequent login via either provider resolves to that same person.

**AC2:** Given a user is not logged in, When they attempt to reach the account-linking settings page, Then they are redirected to login — the link action requires being authenticated into the account being linked *to* first.

**AC3:** Given two different people have each signed up separately via different providers using the same email address, When either logs in via their own provider, Then their identities remain two separate `people` rows — no automatic merging occurs based on matching email alone.

**AC4:** Given a user attempts to link a provider identity that is already linked to a different person, When the link action is attempted, Then it is rejected with a clear error and no data changes for either person.

## Out of Scope

- Automatic email-based identity merging — resolved as explicitly unsafe in discovery (email/password signup does not verify email ownership), not built in any form.
- Unlinking a previously-linked provider — out of scope for this story; a person can add a link but not remove one yet.
- A polished settings UI beyond a functional control — discovery's MVP scope explicitly does not require this.

## NFRs

- **Performance:** None identified.
- **Security:** The link action must independently verify ownership of both identities before linking (already logged into one, must complete a real auth flow for the other) — a broken link flow could otherwise let one person hijack another's identity. This is the core security property tested by AC1 and AC4.
- **Accessibility:** The link-account control on the settings page meets WCAG 2.1 AA (keyboard-operable, labelled).
- **Audit:** Link actions are logged with both linked person IDs (or provider identity hashes — never raw tokens) and a timestamp.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
