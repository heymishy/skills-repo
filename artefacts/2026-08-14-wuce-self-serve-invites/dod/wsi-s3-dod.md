# Definition of Done: Expired invites (past 24 hours) are rejected cleanly

**PR:** https://github.com/heymishy/skills-repo/pull/739 | **Merged:** 2026-08-15
**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s3-invite-expiry.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s3-invite-expiry-test-plan.md
**DoR artefact:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s3-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `acceptInvite_expiredUnredeemed_rejectedWithClearExpiredMessage` — PASS (fresh run against merged `master`, 2026-08-16) | automated test | None |
| AC2 | ✅ | `acceptInvite_expired_noMembershipCreatedRedeemedAtStaysNull` — PASS | automated test | None |
| AC3 | ✅ | `acceptInvite_withinWindow_unaffectedByExpiryCheck` — PASS | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None. The merged PR has exactly one source-touching commit (`d1d18c42`, `modules/team-invitations.js`). No revocation/resend UI, no configurable expiry duration — both correctly out of scope per the story and untouched.

---

## Test Plan Coverage

**Tests from plan implemented:** 4 / 4
**Tests passing in CI:** 4 / 4

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| acceptInvite_expiredUnredeemed_rejectedWithClearExpiredMessage | ✅ | ✅ | |
| acceptInvite_expired_noMembershipCreatedRedeemedAtStaysNull | ✅ | ✅ | |
| acceptInvite_withinWindow_unaffectedByExpiryCheck | ✅ | ✅ | |
| expiryCheck_racesWithRedemption_noWindowWhereExpiredInviteSucceeds | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — single additional timestamp comparison | ✅ | Code review: expiry check is a single SQL condition added to an existing query, no new query |
| Security — expiry and redemption checked atomically, no race window | ✅ | `expiryCheck_racesWithRedemption_...` test — both structurally verified (the SQL `WHERE` clause itself, not a separate JS-level check) and behaviourally verified (boundary-condition test) |
| Accessibility — expired-invite message is real, readable text | ✅ | `acceptInvite_expiredUnredeemed_...` asserts a distinct `'invitation expired'` reason string, not a generic error |
| Audit — not required beyond `wsi-s2`'s own existing logging | ✅ | Correctly scoped — no separate audit entry claimed or needed |

Update the NFR profile's status: **not updated to Verified feature-wide** — tracked per-story, consistent with `wsi-s1`/`wsi-s2`'s own DoD entries.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Time from invite creation to invitee access | ✅ (not yet established) | Not yet — this story is a guardrail on the existing mechanism, not itself a metric-moving story (per its own Benefit Linkage: "the security bound this feature's own /clarify decision established... without it, an invite is effectively permanent"). No real usage data yet. | Signal: **not-yet-measured**. Evidence note: "This story is a security-bound guardrail, not a direct metric driver — see its own Benefit Linkage. No production usage yet regardless." |

Note: this story's own Benefit Linkage names only the timing metric, not the self-serve-share metric — consistent with the feature's own `benefit-metric.md` Metric Coverage Matrix, which does not list `wsi-s3` against either metric row (correctly, since this story is a guardrail rather than a mechanism-builder).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **The atomic-SQL-WHERE-clause design (rather than a separate JS-level expiry check) was the right call, confirmed in retrospect.** Had the expiry check been a separate `if` statement before the atomic redeem UPDATE (the more obvious, naive approach), it would have created exactly the kind of race window this story's own NFR exists to prevent — and might have looked correct in every test that doesn't specifically probe the boundary. The `expiryCheck_racesWithRedemption_...` test's structural assertion (checking the actual SQL text, not just behaviour) is what makes this guarantee durable against a future refactor accidentally reintroducing a separate check. No action needed — noting this as a pattern worth reusing: **Tag: /improve candidate** — for any future story combining an atomicity NFR with a multi-condition guard, prefer a single combined `WHERE` clause over sequential JS checks, and test the SQL text structurally, not just the outcome.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Expired invites (past 24 hours) are rejected cleanly" (wsi-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
