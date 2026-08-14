## Test Plan: Expired invites (past 24 hours) are rejected cleanly

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s3-invite-expiry.md
**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-15

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | expired invite rejected with clear message | 1 test | — | — | — | — | 🟢 |
| AC2 | expired invite not marked redeemed, no membership | 1 test | — | — | — | — | 🟢 |
| AC3 | unexpired invite unaffected (regression) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock `team_invitations` rows with `expires_at` in the past vs. the future)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC3 | Mock `team_invitations` rows with `expires_at` set to a past or future timestamp relative to a controlled "now" | Mock pool | None | Extends `wsi-s2`'s own test data shapes with an explicit expiry dimension |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### acceptInvite_expiredUnredeemed_rejectedWithClearExpiredMessage

- **Verifies:** AC1
- **Precondition:** Mock invite with `expires_at` in the past, `redeemed_at` still `NULL`
- **Action:** Simulate acceptance
- **Expected result:** Rejected with a specific "this invite has expired" message — asserted as a distinct string, not merely "an error occurred"
- **Edge case:** Yes

### acceptInvite_expired_noMembershipCreatedRedeemedAtStaysNull

- **Verifies:** AC2
- **Precondition:** Same as above
- **Action:** Simulate acceptance
- **Expected result:** No `team_memberships` INSERT/UPDATE occurs; the invite's own `redeemed_at` remains `NULL` after the rejected attempt (proving the expired attempt is not mistaken for a redemption)
- **Edge case:** Yes

### acceptInvite_withinWindow_unaffectedByExpiryCheck

- **Verifies:** AC3
- **Precondition:** Mock invite with `expires_at` 12 hours in the future (still valid), unredeemed
- **Action:** Simulate acceptance
- **Expected result:** Proceeds exactly as `wsi-s2`'s own AC1 test already verifies — this test exists specifically to catch a regression where the new expiry check might incorrectly reject a still-valid invite
- **Edge case:** No — this is the regression guarantee, deliberately testing the unaffected common case

---

## Integration Tests

None — this story is a refinement of `wsi-s2`'s own redemption code path; no new integration seam is introduced.

---

## NFR Tests

### expiryCheck_racesWithRedemption_noWindowWhereExpiredInviteSucceeds

- **NFR addressed:** Security
- **Measurement method:** Assert the expiry check and the atomic `redeemed_at IS NULL` check are evaluated together (e.g. within the same guarded code path / same query conditions), not as two independently-timed, separately-racy steps
- **Pass threshold:** No code path exists where an invite that is simultaneously "about to expire" and "being redeemed" can succeed after its `expires_at` has passed
- **Tool:** Node test constructing the boundary condition directly (invite with `expires_at` exactly at or just past "now")

---

## Out of Scope for This Test Plan

- Extending or renewing an expired invite — not built, per the story's own Out of Scope.
- Configurable expiry duration — fixed at 24 hours, not tested as a variable.

---

## Test Gaps and Risks

None identified as blocking.
