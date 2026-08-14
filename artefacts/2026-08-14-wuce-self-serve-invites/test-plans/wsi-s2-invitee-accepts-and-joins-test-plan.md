## Test Plan: Invitee accepts the invite and joins the tenant with the assigned role

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s2-invitee-accepts-and-joins.md
**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-15

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | valid invite redeemed, membership created/updated, correct tenant+role | 1 test | — | — | — | — | 🟢 |
| AC2 | never-logged-in invitee, new person created | 1 test | — | — | — | — | 🟢 |
| AC3 | already-existing person, reused not duplicated | 1 test | — | — | — | — | 🟢 |
| AC4 | double redemption rejected, atomic | 1 test | — | — | — | — | 🟢 |
| AC5 | existing 2 dispatcher cases unaffected | — | 2 tests | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock pool/session, mock `_combinedMagicLinkVerify` payload shapes)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | Mock `team_invitations` row (valid/expired/redeemed states), mock `people`/`person_identities`/`team_memberships` pool responses | Mock pool | None | Mirrors `client-invitations.js`'s own existing test convention |
| AC5 | Mock payload shapes for all three dispatch cases (`teamInvitationId`, `invitationId`, neither) | Mock payload objects | None | Regression-proves the dispatcher extension didn't break the other two cases |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### acceptInvite_validToken_createsTeamMembershipWithInviteTenantAndRole

- **Verifies:** AC1
- **Precondition:** Mock unexpired, unredeemed `team_invitations` row with `tenant_id: 'tenant-A'`, `role: 'engineer'`
- **Action:** Simulate acceptance (call the team-invite verify function directly with the invite's payload)
- **Expected result:** A `team_memberships` row is written with `tenant_id: 'tenant-A'` and `role: 'engineer'` — matching the INVITE's own stored values, not any value from the accept-time request
- **Edge case:** No

### acceptInvite_newInvitee_createsPersonAndIdentityLink

- **Verifies:** AC2
- **Precondition:** Mock pool returns no existing `person_identities` row for the invitee's email
- **Action:** Simulate acceptance
- **Expected result:** A new `people` row and a linked `person_identities` row are created before the `team_memberships` write — this is the exact case `addOrUpdateTeammate` cannot handle (asserted by confirming the flow does NOT call `addOrUpdateTeammate` at all, it uses the create-or-reuse path instead)
- **Edge case:** Yes

### acceptInvite_existingInvitee_reusesPersonNoDuplicate

- **Verifies:** AC3
- **Precondition:** Mock pool returns an EXISTING `person_identities` row for the invitee's email (`person_id: 42`)
- **Action:** Simulate acceptance
- **Expected result:** No new `people`/`person_identities` INSERT occurs; the `team_memberships` row is written with `person_id: 42`, the reused ID
- **Edge case:** No

### acceptInvite_sameTokenTwice_secondAttemptRejectedNoSecondMembership

- **Verifies:** AC4
- **Precondition:** Mock pool: first call to the atomic redemption UPDATE succeeds (returns 1 row); second call (same token) returns 0 rows (already redeemed, `WHERE redeemed_at IS NULL` no longer matches)
- **Action:** Simulate two sequential accept attempts with the identical token
- **Expected result:** First attempt succeeds (membership created). Second attempt is rejected cleanly (invite already redeemed) and does NOT issue a second `team_memberships` INSERT
- **Edge case:** Yes — this is the story's own explicit atomicity guarantee

---

## Integration Tests

### combinedDispatcher_clientOrgInvitePayload_stillRoutesToOriginalHandlerUnchanged

- **Verifies:** AC5 (regression, case 1 of 2)
- **Components involved:** `server.js`'s `_combinedMagicLinkVerify`, `_verifyInvitationRedemption` (Client-org invite, `story-3-self-service-provisioning`)
- **Precondition:** Mock payload with `payload.invitationId` set (Client-org invite shape), no `teamInvitationId`
- **Action:** Call the (three-way-extended) dispatcher with this payload
- **Expected result:** Routes to the EXISTING `_verifyInvitationRedemption` function, unchanged behaviour — confirmed via a spy/mock asserting that function (not the new team-invite path) was called
- **Edge case:** No

### combinedDispatcher_clientLoginPayload_stillRoutesToOriginalHandlerUnchanged

- **Verifies:** AC5 (regression, case 2 of 2)
- **Components involved:** `server.js`'s `_combinedMagicLinkVerify`, `_verifyClientLogin` (Client login, `story-4-dual-path-authentication`)
- **Precondition:** Mock payload with NEITHER `invitationId` nor `teamInvitationId` set (plain Client login shape)
- **Action:** Call the dispatcher with this payload
- **Expected result:** Routes to the EXISTING `_verifyClientLogin` function, unchanged behaviour
- **Edge case:** No

---

## NFR Tests

### auditLog_redemption_neverLogsRawToken

- **NFR addressed:** Security (audit)
- **Measurement method:** Inspect logger call arguments during a successful redemption
- **Pass threshold:** Logged payload contains `team_invitation_id`/`tenant_id`/`person_id`/`role`/timestamp; never the raw token
- **Tool:** Node test asserting on a mock logger's captured arguments

---

## Out of Scope for This Test Plan

- Invite creation — covered by `wsi-s1`'s own test plan.
- Expiry and member-count-cap enforcement — covered by `wsi-s3`'s and `wsi-s4`'s own test plans (both extend this story's redemption logic).
- The existing OAuth/email-password authentication UI itself — already tested by its own originating feature (`2026-07-01-landing-auth-billing`).

---

## Test Gaps and Risks

None identified as blocking.
