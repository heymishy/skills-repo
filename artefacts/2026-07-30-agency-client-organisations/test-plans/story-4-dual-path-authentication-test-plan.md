# Test Plan: Client-org dual-path authentication

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-4-dual-path-authentication.md
**Epic reference:** artefacts/2026-07-30-agency-client-organisations/epics/agency-client-organisations.md
**Test plan author:** Claude (agent-authored)
**Date:** 2026-07-31

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | GitHub OAuth path resolves Client-org session | — | 1 test | — | — | — | 🟢 |
| AC2 | Magic-link path sends link, resolves session with matching shape | 2 tests | 2 tests | — | 1 scenario | External-dependency (actual email delivery) | 🔴 |
| AC3 | Magic-link path scoped to `client` org_type only | 1 test | 1 test | — | — | — | 🟢 |
| AC4 | Single-use magic-link rejected on reuse | 1 test | 1 test | — | — | — | 🔴 |
| AC5 | D37 adapter wiring: `verify()`/send callbacks wired to real implementations in `server.js`, stubs throw unwired | 1 test | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|-----------------------------|----------|
| Actual receipt of the magic-link email in a real inbox | AC2 | External-dependency | Resend's delivery pipeline is a third-party service, mocked at the adapter boundary in automated tests | Manual scenario in verification script — see Scenario 2 |

---

## Test Data Strategy

**Source:** Mixed — synthetic org/session fixtures; mocked Resend adapter and `passport-magic-login` strategy (shared with Story 3's mechanism)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An invited Client-org user with a linked GitHub identity | Synthetic | None | Reuses existing GitHub OAuth test fixtures/mocks already used by `routes/auth.js`'s own test suite |
| AC2 | An invited Client-org user's email; mocked Resend send; mocked `passport-magic-login` token issuance/verification | Synthetic + Mocked | Email not logged in plaintext alongside token | Same mocked mechanism as Story 3 — build once, share the test helper between both stories' suites |
| AC3 | Agency-type and Standalone-type org fixtures attempting the magic-link path | Synthetic | None | |
| AC4 | An already-used magic-link token | Synthetic | None | |

### PCI / sensitivity constraints

None.

### Gaps

None beyond the External-dependency coverage gap noted above.

---

## Unit Tests

### `githubOAuthResolvesClientOrgSessionShape`

- **Verifies:** AC1
- **Precondition:** A Client-org user with a linked GitHub identity
- **Action:** Simulate the existing GitHub OAuth callback resolution for this user
- **Expected result:** Session resolves with `tenantId`/`login`/session fields identical in shape to the Standalone/Agency GitHub OAuth resolution path — no divergent fields
- **Edge case:** No

### `magicLinkRequestIssuesTokenAndCallsSendCallback`

- **Verifies:** AC2
- **Precondition:** An invited Client-org user's email
- **Action:** Call the magic-link request handler
- **Expected result:** `passport-magic-login` issues a time-limited token; the mocked Resend send callback is invoked with the destination email and a link containing that token
- **Edge case:** No

### `magicLinkVerificationResolvesSameSessionShapeAsOAuth`

- **Verifies:** AC2
- **Precondition:** A valid, unused magic-link token
- **Action:** Simulate `passport-magic-login`'s `verify()` callback firing for that token
- **Expected result:** Session resolves with `tenantId`, `login`, and session fields in the SAME shape as `githubOAuthResolvesClientOrgSessionShape`'s assertion — assert field-for-field equality of shape, not just "a session was created"
- **Edge case:** No

### `magicLinkPathRejectedForAgencyOrgType`

- **Verifies:** AC3
- **Precondition:** A user whose org has `org_type = 'agency'`
- **Action:** Call the magic-link request handler for that user
- **Expected result:** Request rejected/not offered — no token issued, no send-callback invocation
- **Edge case:** Yes — parametrised over `agency` and `standalone` org types (both must be rejected, only `client` accepted)

### `usedMagicLinkTokenRejectedOnSecondClick`

- **Verifies:** AC4
- **Precondition:** A magic-link token already redeemed once (verified successfully)
- **Action:** Simulate `verify()` firing again for the same token
- **Expected result:** Rejected — no new session resolved, no side effect; matches Story 3's shared invitation-redemption single-use test at the mechanism level
- **Edge case:** Yes — also assert an EXPIRED (time-limited) but never-used token is separately rejected, distinct from the already-used case, since both are named in the story's Security NFR

### `magicLinkAdapterStubsThrowWhenUnwired`

- **Verifies:** AC5
- **Precondition:** `passport-magic-login`'s `verify()`/send callbacks never wired (fresh module load)
- **Action:** Call the underlying adapter functions directly, unwired
- **Expected result:** Each throws its own `Adapter not wired: ...` error — never silently returns/no-ops
- **Edge case:** Yes — the D37 stub-throws contract itself

---

## Integration Tests

### `githubOAuthFlowEndToEndForClientOrgUser`

- **Verifies:** AC1
- **Components involved:** Full existing OAuth route stack (`routes/auth.js`), Client-org session resolution
- **Precondition:** Client-org user with linked GitHub identity
- **Action:** Full HTTP-level OAuth callback request
- **Expected result:** Session established, resolves to the correct Client org, matching existing OAuth resolution pattern exactly (non-regression on the existing path)

### `magicLinkRequestEndToEndSendsEmail`

- **Verifies:** AC2
- **Components involved:** Full route stack for the magic-link request endpoint, mocked Resend adapter
- **Precondition:** Invited Client-org user's email
- **Action:** Full HTTP-level POST with the email address
- **Expected result:** 200/success response; mocked send function invoked exactly once with correct destination and token-bearing link

### `magicLinkRedemptionEndToEndResolvesSession`

- **Verifies:** AC2
- **Components involved:** Full route stack for the redemption endpoint, Passport `verify()` wiring
- **Precondition:** A valid, unused token
- **Action:** Full HTTP-level GET to the redemption URL
- **Expected result:** Session cookie set, resolves to the Client org with the correct shape

### `magicLinkRequestRejectedAtRouteLevelForNonClientOrgType`

- **Verifies:** AC3
- **Components involved:** Full route stack
- **Precondition:** Agency or Standalone user
- **Action:** Full HTTP-level POST to the magic-link request endpoint
- **Expected result:** Rejected before token issuance — server-side guard, not UI-hidden-only

### `secondClickOnUsedMagicLinkRejectedAtRouteLevel`

- **Verifies:** AC4
- **Components involved:** Full route stack for the redemption endpoint
- **Precondition:** Token already redeemed once in a prior request within the test
- **Action:** Full HTTP-level GET to the same redemption URL a second time
- **Expected result:** Rejected (error page or equivalent, no new session established)

### `serverJsWiresMagicLoginToDistinctRealSessions`

- **Verifies:** AC5
- **Components involved:** `server.js` wiring, real `verify()`/send callback path
- **Precondition:** Server bootstrap wires both callbacks as it does in production
- **Action:** Redeem magic-links for two different invited Client-org users in sequence
- **Expected result:** Two distinct, individually-correct sessions are resolved (each with its own correct `tenantId`) — an observable, differentiating outcome, not merely confirmation that the setter functions were called (per D37's wiring-test convention)

---

## NFR Tests

### `magicLinkDeliveryLatencyWithinExistingNorms`

- **NFR addressed:** Performance
- **Measurement method:** N/A — story NFR references "existing email-sending latency norms," which is only meaningfully measurable against the real Resend service, not the mocked adapter
- **Pass threshold:** N/A
- **Tool:** **None — confirmed with story NFRs** for automated coverage; deferred to the manual verification scenario (Scenario 2) to observe real-world delivery time qualitatively

### `magicLinkSingleUseTimeLimitedAndAddressBound`

- **NFR addressed:** Security
- **Measurement method:** Assert (a) token TTL is set to a value within 15–30 minutes at issuance, (b) an expired token (simulated via clock injection) is rejected, (c) `verify()` binds strictly to the exact invited email address — a token issued for email A cannot be redeemed against a session claiming email B
- **Pass threshold:** All three sub-assertions pass
- **Tool:** Node (fake-clock injection for TTL; direct adapter call for address binding)

### `magicLinkRequestEndpointIsRateLimited`

- **NFR addressed:** Security (rate-limiting, resolves review [1-M1])
- **Measurement method:** Fire N+1 magic-link requests from the same IP/target-email within the rate-limit window (N matching `auth-email.js`'s existing signup rate-limiter threshold) and assert the (N+1)th is rejected
- **Pass threshold:** Requests beyond the configured threshold are rejected with the same rate-limit response shape as `auth-email.js`'s existing limiter
- **Tool:** Node (reuses the existing rate-limiter test helper pattern from `auth-email.js`'s own test suite)

### `magicLinkRequestFormIsKeyboardNavigable`

- **NFR addressed:** Accessibility
- **Measurement method:** Static assertion that the rendered form uses a real `<form>`/`<input type="email">`
- **Pass threshold:** Real form elements present in rendered HTML
- **Tool:** Node (HTML-string assertion)

### `magicLinkEventsAuditedWithoutRawToken`

- **NFR addressed:** Audit
- **Measurement method:** Capture logger calls across request/send/redemption; assert email, timestamp, and outcome are present and the raw token string never appears
- **Pass threshold:** All three fields present per event; zero raw-token matches
- **Tool:** Node (injectable logger spy — same helper as Story 3's equivalent test)

---

## Out of Scope for This Test Plan

- Password-based authentication — not introduced anywhere in this story
- Multi-factor authentication for the magic-link path — not addressed in this MVP
- Extending magic-link to non-Client org types — explicitly rejected by AC3

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| Real email delivery/rendering and real-world latency | Resend's actual delivery pipeline is outside the test boundary | Manual verification scenario (Scenario 2) checks a real test inbox and qualitatively observes delivery time after merge |
