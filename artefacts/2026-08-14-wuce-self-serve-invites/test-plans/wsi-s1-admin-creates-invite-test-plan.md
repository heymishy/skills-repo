## Test Plan: Admin creates a per-person team invite, which sends the invite email

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s1-admin-creates-invite.md
**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-15

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | invite row written, tenant-scoped, correct fields | 2 tests | — | — | — | — | 🟢 |
| AC2 | sendInvitationEmail called with correct args | 1 test | — | — | — | — | 🟢 |
| AC3 | invalid role rejected, no row written | 1 test | — | — | — | — | 🟢 |
| AC4 | missing role rejected | 1 test | — | — | — | — | 🟢 |
| AC5 | email-send failure surfaces clear error, no silent success | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock pool/session, matching this codebase's own established test convention throughout `wugs-s1`–`wugs-s14` and `check-story3-self-service-provisioning.js`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC5 | Mock admin session (`tenantId`), mock pool for `team_invitations` INSERT, mock `sendInvitationEmail` (test double, matching `modules/invitation-email.js`'s own established `_resetForTesting`/`setSendInvitationEmail` pattern) | Mock pool + mock adapter | None | No real network calls; matches `modules/invitation-email.js`'s own documented test convention ("Tests mock this function directly — never make a real network call in tests") |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### createInvite_validRoleAndEmail_writesTenantScopedRow

- **Verifies:** AC1
- **Precondition:** Mock admin session with `tenantId`; mock pool with no existing invites
- **Action:** Call the invite-creation handler with a valid email and role
- **Expected result:** A `team_invitations` INSERT is issued with `tenant_id` matching the session's own `tenantId` (not any request-supplied value), the submitted `role`, and an `expires_at` exactly 24 hours after `created_at`
- **Edge case:** No

### createInvite_tenantIdNeverFromRequest_onlyFromSession

- **Verifies:** AC1 (ADR-025 tenant-scoping guarantee)
- **Precondition:** Mock admin session with `tenantId: 'tenant-A'`; request body includes a spoofed `tenantId: 'tenant-B'` field
- **Action:** Call the invite-creation handler
- **Expected result:** The written row's `tenant_id` is `'tenant-A'` (from session), never `'tenant-B'` (from request) — proves the constraint is actually enforced, not just documented
- **Edge case:** Yes — this is the story's own explicit ADR-025 tamper-resistance guarantee

### createInvite_success_callsSendInvitationEmailWithCorrectArgs

- **Verifies:** AC2
- **Precondition:** Mock `sendInvitationEmail` (test double); valid invite-creation request
- **Action:** Call the invite-creation handler
- **Expected result:** `sendInvitationEmail` is called exactly once, with the invitee's real submitted email address and a link containing the newly-created invite's own token — not a placeholder or a different invite's token
- **Edge case:** No

### createInvite_invalidRole_rejectedNoRowWritten

- **Verifies:** AC3
- **Precondition:** Mock pool; request with `role: 'superadmin'` (not in `VALID_ROLES`)
- **Action:** Call the invite-creation handler
- **Expected result:** Request rejected with `InvalidRoleError` (reused from `team-management.js`, not a new error type); mock pool's INSERT is never called
- **Edge case:** Yes

### createInvite_missingRole_rejected

- **Verifies:** AC4
- **Precondition:** Mock pool; request with `role` field omitted entirely
- **Action:** Call the invite-creation handler
- **Expected result:** Request rejected — no silent default role applied; mock pool's INSERT is never called
- **Edge case:** Yes

### createInvite_emailSendFails_surfacesErrorRowAlreadyWritten

- **Verifies:** AC5
- **Precondition:** Mock pool succeeds; mock `sendInvitationEmail` throws (simulated Resend API failure)
- **Action:** Call the invite-creation handler
- **Expected result:** The admin-facing response is a clear error indicating the email could not be sent (not a generic 500, not a false-success response) — the test asserts the SPECIFIC error surfaced, not just that *an* error occurred
- **Edge case:** Yes — this is the story's own explicit failure-path guarantee

---

## Integration Tests

None — this story's scope is fully covered by unit tests against the handler with mocked pool/email adapter; no route/handler-level integration test is needed beyond what `/verify-completion` will confirm via the real route wiring.

---

## NFR Tests

### auditLog_invitationCreated_neverLogsRawToken

- **NFR addressed:** Security (audit)
- **Measurement method:** Inspect the arguments passed to the logger in the invite-creation code path
- **Pass threshold:** The logged payload contains `invitation_id`/`tenant_id`/`role`/timestamp; it never contains the raw invite token or the signed link
- **Tool:** Node test asserting on a mock logger's captured call arguments

---

## Out of Scope for This Test Plan

- The invitee-side acceptance flow — covered by `wsi-s2`'s own test plan.
- The real Resend SDK's actual HTTP behavior — `sendInvitationEmail`'s own production wiring is already tested by `2026-07-30-agency-client-organisations`'s own test suite; this plan only tests that the invite-creation handler CALLS it correctly, not that Resend itself works.

---

## Test Gaps and Risks

None identified as blocking.
