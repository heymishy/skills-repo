## Test Plan: Invite acceptance is blocked if the tenant is at its member-count cap

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s4-member-count-cap.md
**Epic reference:** artefacts/2026-08-14-wuce-self-serve-invites/epics/epic-1-self-serve-invite-flow.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-15

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | tenant at cap, join blocked, invite not consumed | 1 test | — | — | — | — | 🟢 |
| AC2 | tenant below cap, unaffected (regression) | 1 test | — | — | — | — | 🟢 |
| AC3 | paid tier cap materially higher than trial | 1 test | — | — | — | — | 🟢 |
| AC4 | exactly-at-cap boundary blocked (inclusive) | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (mock `getPlanState` return value, mock `COUNT(*)` query result)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1–AC4 | Mock `tenant-plan.js`'s `getPlanState(tenantId)` returning `{plan: 'trial'}` or `{plan: 'paid'}`; mock pool returning a controlled `team_memberships` count | Mock adapter + mock pool | None | Reuses `tenant-plan.js`'s existing test-double convention |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### acceptInvite_tenantAtTrialCap_blockedInviteNotConsumed

- **Verifies:** AC1
- **Precondition:** Mock `getPlanState` returns `{plan: 'trial'}`; mock count query returns the trial cap's own value (at cap); valid, unexpired, unredeemed invite
- **Action:** Simulate acceptance
- **Expected result:** Rejected with a clear "member limit reached" message; no `team_memberships` row created; the invite's own `redeemed_at` remains `NULL` (so it can still succeed later if a seat frees up — distinct assertion from just "join failed")
- **Edge case:** Yes

### acceptInvite_tenantBelowCap_unaffected

- **Verifies:** AC2
- **Precondition:** Mock count well below the cap
- **Action:** Simulate acceptance
- **Expected result:** Proceeds normally — regression guarantee that the common case isn't broken by the cap check
- **Edge case:** No

### capValues_paidTierVsTrialTier_paidIsMateriallyHigher

- **Verifies:** AC3
- **Precondition:** Read both cap constants directly from the implementation
- **Action:** Compare `paid` cap to `trial` cap
- **Expected result:** `paid` cap is strictly greater than `trial` cap, and by more than a trivial margin (asserted as at least double, tightening the story's own "materially higher" wording per review finding wsi-s4 1-L1 — not a re-fix of the AC text itself, just a more precise test assertion)
- **Edge case:** No

### acceptInvite_countExactlyAtCap_stillBlocked

- **Verifies:** AC4
- **Precondition:** Mock count exactly equal to the cap value (not one over)
- **Action:** Simulate acceptance
- **Expected result:** Blocked — proves the cap is an inclusive maximum ("at most N"), catching a plausible off-by-one where an implementer might allow N+1
- **Edge case:** Yes — deliberately targets the boundary condition

---

## Integration Tests

None — this story runs as part of `wsi-s2`'s own redemption code path; no new integration seam beyond what `wsi-s2`'s own integration tests already cover.

---

## NFR Tests

### capCheck_tenantScoped_countQueryUsesInviteOwnTenantId

- **NFR addressed:** Security
- **Measurement method:** Assert the `COUNT(*)` query's `tenant_id` parameter comes from the invite's own stored `tenant_id`, never from any accept-time request field
- **Pass threshold:** No code path exists where a tampered request could cause the count check to run against a different tenant than the one the invite actually belongs to
- **Tool:** Node test asserting on the query parameters passed to the mock pool

---

## Out of Scope for This Test Plan

- Full Stripe per-seat billing / metered quantity — not built, per the story's own Out of Scope.
- A UI showing current count vs. cap before the block occurs — not built.

---

## Test Gaps and Risks

None identified as blocking.
