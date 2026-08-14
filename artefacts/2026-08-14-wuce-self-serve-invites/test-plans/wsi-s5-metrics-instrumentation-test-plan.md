## Test Plan: PostHog instrumentation for both benefit metrics

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s5-metrics-instrumentation.md
**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-15

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | team_invite_created event captured with correct properties | 1 test | — | — | — | — | 🟢 |
| AC2 | team_invite_accepted event includes elapsed-time property | 1 test | — | — | — | — | 🟢 |
| AC3 | teammate_added_by_admin event added to existing admin-add path | 1 test | — | — | — | — | 🟢 |
| AC4 | both metrics computable from real event data alone | — | 1 test | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock `_posthog.capture`, matching this codebase's own established PostHog test-mocking convention already used in `products.js`/`skills.js`/`journey.js`/`landing.js`'s own test suites)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | Mock `_posthog.capture` (spy/test double); mock invite-creation/acceptance/admin-add flows from `wsi-s1`/`wsi-s2`/`team-management.js` | Mock module | None | Reuses established PostHog mocking pattern, no new integration |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### createInvite_success_capturesTeamInviteCreatedWithProperties

- **Verifies:** AC1
- **Precondition:** Mock `_posthog.capture` (spy); valid invite-creation flow
- **Action:** Create an invite
- **Expected result:** `_posthog.capture` called with event name `team_invite_created` and properties including `tenant_id`, `role`, `team_invitation_id` — all matching the real invite just created, not placeholder values
- **Edge case:** No

### acceptInvite_success_capturesTeamInviteAcceptedWithElapsedTime

- **Verifies:** AC2
- **Precondition:** Mock `_posthog.capture`; a `team_invitations` row with a known `created_at`; acceptance happens at a controlled, later "now"
- **Action:** Accept the invite
- **Expected result:** `_posthog.capture` called with event name `team_invite_accepted` and properties including `tenant_id`, `role`, `team_invitation_id`, and an elapsed-time property whose value matches (acceptance time − `created_at`) — asserted as the actual computed difference, not just "a number is present"
- **Edge case:** No

### addTeammateByAdmin_success_capturesComparableEvent

- **Verifies:** AC3
- **Precondition:** Mock `_posthog.capture`; call `team-management.js`'s `addOrUpdateTeammate` directly
- **Action:** Add a teammate via the existing admin-add path
- **Expected result:** `_posthog.capture` called with event name `teammate_added_by_admin` and comparable properties (`tenant_id`, `role`) — this test would FAIL against the pre-story code (confirmed: no such event exists today), proving the test genuinely exercises new work, not a pre-existing behaviour
- **Edge case:** No

---

## Integration Tests

### bothMetrics_realEventShapes_computableWithoutManualEstimation

- **Verifies:** AC4
- **Components involved:** `wsi-s1`'s invite-creation path, `wsi-s2`'s acceptance path, `team-management.js`'s admin-add path, all three now emitting PostHog events
- **Precondition:** Simulate a mix of self-serve invites (created + accepted) and admin-adds within a mock event store
- **Action:** Compute both benefit-metric formulas (share of self-serve vs. admin-add; average/individual elapsed time) directly from the captured mock events
- **Expected result:** Both metrics can be computed using only the captured event data — no field or event needed for the calculation is missing
- **Edge case:** No

---

## NFR Tests

### eventProperties_neverIncludeEmailOrToken

- **NFR addressed:** Security
- **Measurement method:** Inspect every `_posthog.capture` call's properties object across all 3 new call sites
- **Pass threshold:** No property contains the invitee's raw email address or the invite token/link
- **Tool:** Node test asserting on captured call arguments

---

## Out of Scope for This Test Plan

- A dashboard/visualisation of the metrics — not built, per the story's own Out of Scope.
- Historical backfill of past admin-adds — not built; baseline is correctly 0% by design.

---

## Test Gaps and Risks

None identified as blocking.
