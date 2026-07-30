# Test Plan: Self-service Agency-to-Client provisioning

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-3-self-service-provisioning.md
**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Test plan author:** Claude (agent-authored)
**Date:** 2026-07-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Agency creates Client org + relationship row | 1 test | 1 test | — | — | — | 🟢 |
| AC2 | Non-Agency org_type rejected from Create Client flow | 1 test | 1 test | — | — | — | 🟢 |
| AC3 | Invitation created; invited user account gets `role='admin'` via shared Passport.js/passport-magic-login mechanism | 2 tests | 2 tests | — | 1 scenario | External-dependency (actual email delivery) | 🔴 |
| AC4 | Blank/invalid org name rejected with validation error | 1 test | 1 test | — | — | — | 🟢 |
| AC5 | D37 adapter wiring: `setSendInvitationEmail` wired to real Resend call in `server.js`, stub throws unwired | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|-----------------------------|----------|
| Actual receipt of the invitation email in a real inbox | AC3 | External-dependency | Resend's own delivery pipeline is a third-party service not exercised in the test suite — automated tests mock the Resend adapter call, they do not confirm an email physically arrives | Manual scenario in verification script — see Scenario 3 |

---

## Test Data Strategy

**Source:** Mixed — synthetic data for org/invitation records; mocked external service for Resend and Passport.js's magic-link send callback
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An Agency-type org fixture | Synthetic | None | |
| AC2 | Standalone-type and Client-type org fixtures | Synthetic | None | |
| AC3 | An invited email address; a mocked Resend send function; a mocked `passport-magic-login` `verify()` callback | Synthetic + Mocked external services | Invited email address is not a real sensitive field in this MVP, but must never be logged in plaintext alongside the raw token (D37/audit convention) | The Resend API key is not exercised in tests — the adapter's send function is replaced with a test double (D37 injectable-adapter pattern), consistent with how this codebase already mocks other injectable adapters |
| AC4 | Blank/invalid org name string | Synthetic | None | |

### PCI / sensitivity constraints

None. The invited email address is a normal PII field, not a payment or government-ID field — handled per this codebase's existing audit-logging convention (never log the raw invitation token in plaintext).

### Gaps

None — the External-dependency gap above (actual email delivery) is a coverage gap, not a test-data gap; test data itself (mocked adapter) is available now.

---

## Unit Tests

### `createsClientOrgAndRelationshipForAgencyUser`

- **Verifies:** AC1
- **Precondition:** Logged-in user whose org has `org_type = 'agency'`
- **Action:** Call the create-client handler with a valid org name
- **Expected result:** A new `organisations` row is created with `org_type = 'client'`; a new `agency_client_relationships` row links the Agency org to the new Client org
- **Edge case:** No

### `rejectsCreateClientForNonAgencyOrgType`

- **Verifies:** AC2
- **Precondition:** Logged-in user whose org has `org_type = 'standalone'` or `org_type = 'client'`
- **Action:** Call the create-client handler directly (bypassing UI)
- **Expected result:** Request rejected server-side; no `organisations` row created
- **Edge case:** Yes — parametrised over both `standalone` and `client` org types, not just one

### `invitationRecordCreatedWithPassportMagicLinkToken`

- **Verifies:** AC3
- **Precondition:** A newly-created Client org; a mocked `passport-magic-login` token-issuance function
- **Action:** Call the invite-user handler with an invited email
- **Expected result:** An invitation record is created for the Client org referencing the issued token; the mocked Resend send function is called with the invited email and a link containing that token
- **Edge case:** No

### `invitationRedemptionCreatesAdminRoleTeamMembership`

- **Verifies:** AC3 (role-model decision)
- **Precondition:** A pending invitation record; a simulated `passport-magic-login` `verify()` callback firing for that token
- **Action:** Simulate the invitation link being redeemed
- **Expected result:** A Client-org user account is created; a `team_memberships` row is inserted with `role = 'admin'` scoped to the new Client org's own `tenant_id` (not the legacy `getUserRole`/`user_roles` path) — asserted by querying `team_memberships` directly, not by asserting a setter was merely called (per D37's "assert observable, differentiating outcome" convention)
- **Edge case:** Yes — also assert that a SECOND invitation redemption attempt with the same already-used token is rejected (ties into Story 4 AC4's single-use requirement, tested at the shared-mechanism level here since Story 3's invitation link uses the same token verification)

### `rejectsBlankOrInvalidOrgName`

- **Verifies:** AC4
- **Precondition:** Logged-in Agency user
- **Action:** Call the create-client handler with a blank string and, separately, with an invalid value matching `handlePostProductNew`'s existing invalid-input test case
- **Expected result:** No `organisations` row created; validation error returned matching the existing convention's error shape
- **Edge case:** Yes — parametrised over blank string and the invalid-format case

### `sendInvitationEmailAdapterStubThrowsWhenUnwired`

- **Verifies:** AC5
- **Precondition:** `setSendInvitationEmail` never called (fresh module load)
- **Action:** Call the invite-user handler's underlying adapter function directly, unwired
- **Expected result:** Throws `Adapter not wired: sendInvitationEmail. Call setSendInvitationEmail() with a real implementation before use.` — never silently returns/no-ops
- **Edge case:** Yes — this is the D37 stub-throws contract itself

---

## Integration Tests

### `createClientFlowEndToEndAsAgencyAdmin`

- **Verifies:** AC1
- **Components involved:** Create-client route, organisations adapter, relationship adapter
- **Precondition:** Logged-in Agency admin session
- **Action:** Full HTTP-level POST to the create-client route
- **Expected result:** 200/redirect on success; both rows persisted and queryable afterward

### `createClientFlowRejectedForWrongOrgTypeAtRouteLevel`

- **Verifies:** AC2
- **Components involved:** Full route stack (session middleware → org-type guard → handler)
- **Precondition:** Logged-in Standalone or Client-type user, direct URL access to the create-client route
- **Action:** Full HTTP-level request
- **Expected result:** Request rejected before reaching the handler body — server-side guard fires regardless of whether the UI entry point is hidden

### `inviteUserFlowSendsEmailAndPersistsInvitation`

- **Verifies:** AC3
- **Components involved:** Invite-user route, mocked Resend adapter, mocked `passport-magic-login` strategy
- **Precondition:** Existing Client org
- **Action:** Full HTTP-level POST to the invite-user route with an email address
- **Expected result:** Invitation persisted; mocked send function invoked exactly once with the correct destination and a token-bearing link; no plaintext token appears in any log call captured by the test's logger spy

### `redeemedInvitationResolvesSessionAndCreatesAdminMembership`

- **Verifies:** AC3
- **Components involved:** Full route stack for the invitation-redemption endpoint, Passport `verify()` wiring, `team_memberships` adapter
- **Precondition:** A pending invitation, simulated as clicked (full HTTP GET to the redemption URL with the issued token)
- **Action:** Full HTTP-level request through the redemption route
- **Expected result:** Session resolves to the new Client-org user with the correct `tenantId`/session shape (matching the GitHub OAuth path's shape, per ADR-025); `team_memberships` row confirmed `role = 'admin'` for that org

### `createClientFlowRejectsInvalidNameAtRouteLevel`

- **Verifies:** AC4
- **Components involved:** Full route stack
- **Precondition:** Logged-in Agency admin
- **Action:** Full HTTP-level POST with a blank org name
- **Expected result:** 400-shaped response matching `handlePostProductNew`'s existing validation-error convention; no row created

### `serverJsWiresSendInvitationEmailToRealDifferentiatedResendCalls`

- **Verifies:** AC5
- **Components involved:** `server.js` wiring, real (test-mode) Resend adapter call path
- **Precondition:** Server bootstrap runs `setSendInvitationEmail(...)` as it does in production
- **Action:** Invite two different emails in sequence; capture the wired adapter's outbound call args each time
- **Expected result:** Two distinct Resend calls are observed, each addressed to its own correct invited email with its own distinct token-bearing link — an observable, differentiating outcome, not merely confirmation that `setSendInvitationEmail` was called once at bootstrap (per D37's wiring-test convention)

---

## NFR Tests

### `createClientFlowHasNoSpecificLatencyTargetBeyondPageLoadNorms`

- **NFR addressed:** Performance
- **Measurement method:** N/A — story NFR states no specific target beyond existing page-load conventions
- **Pass threshold:** N/A
- **Tool:** N/A — **None — confirmed with story NFRs** (no dedicated performance test written; this is not a high-throughput path)

### `createClientOrgTypeCheckIsServerSideNotClientSideOnly`

- **NFR addressed:** Security
- **Measurement method:** Assert the org-type check occurs in the request handler regardless of any client-side UI state (covered functionally by `rejectsCreateClientForNonAgencyOrgType` above; this NFR test additionally confirms no route-level bypass exists by calling the handler with a forged/absent client-side flag)
- **Pass threshold:** Rejection occurs purely from server-side session `org_type`, never influenced by a request body/query flag
- **Tool:** Node

### `invitationTokenNeverLoggedInPlaintext`

- **NFR addressed:** Audit (also ties to Security)
- **Measurement method:** Capture all logger calls during the invite-send and redemption flows; assert the raw token string never appears in any captured log line
- **Pass threshold:** Zero matches for the raw token value across all captured log calls
- **Tool:** Node (injectable logger spy)

### `createClientAndInviteAreAudited`

- **NFR addressed:** Audit
- **Measurement method:** Assert a log/event is emitted for both client-org creation and user invitation, containing the Agency admin's identity, the Client org's ID, and a timestamp
- **Pass threshold:** Both events present with all required fields
- **Tool:** Node (injectable logger stub)

### `createClientFormIsKeyboardNavigable`

- **NFR addressed:** Accessibility
- **Measurement method:** Static assertion that the rendered form uses real `<form>`/`<input>` elements (matching `renderFleetPanel`'s convention) — no custom non-semantic click targets
- **Pass threshold:** Real form elements present in rendered HTML
- **Tool:** Node (HTML-string assertion against the route's rendered output)

---

## Out of Scope for This Test Plan

- The authentication mechanism the invited user uses beyond invitation redemption itself (ongoing GitHub OAuth or repeat magic-link sign-in) — covered by Story 4's test plan
- Actual Resend delivery pipeline behaviour — Resend itself is a third-party service, mocked at the adapter boundary
- Inviting a second/subsequent user to a Client org — explicitly out of scope per the story

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real email delivery/rendering | Resend's actual delivery pipeline is outside the test boundary | Manual verification scenario (Scenario 3) checks an actual test inbox after merge; the mocked-adapter call shape is asserted automatically pre-merge |
