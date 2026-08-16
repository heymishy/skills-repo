# Definition of Done: Invite acceptance is blocked if the tenant is at its member-count cap

**PR:** https://github.com/heymishy/skills-repo/pull/740 | **Merged:** 2026-08-15
**Story:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s4-member-count-cap.md
**Test plan:** artefacts/2026-08-14-wuce-self-serve-invites/test-plans/wsi-s4-member-count-cap-test-plan.md
**DoR artefact:** artefacts/2026-08-14-wuce-self-serve-invites/dor/wsi-s4-dor.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `acceptInvite_tenantAtTrialCap_blockedInviteNotConsumed` — PASS (fresh run against merged `master`, 2026-08-16) | automated test | None |
| AC2 | ✅ | `acceptInvite_tenantBelowCap_unaffected` — PASS | automated test | None |
| AC3 | ✅ | `capValues_paidTierVsTrialTier_paidIsMateriallyHigher` — PASS (25 vs 3, ≥2×) | automated test | None |
| AC4 | ✅ | `acceptInvite_countExactlyAtCap_stillBlocked` — PASS | automated test | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor.

---

## Scope Deviations

None substantive. The merged PR's first commit (`691635cf`) touches `tests/check-wsi-s2-invitee-accepts-and-joins.js` and `tests/check-wsi-s3-invite-expiry.js` in addition to this story's own files — this was a real gap found and fixed during implementation (both sibling stories' fake pools lacked a mock branch for the new required `SELECT COUNT(*)` query this story's shared-code change introduced), fully documented at the time in `plans/wsi-s4-plan.md`'s own Task 1 correction note and in the PR description. Not scope creep — a necessary, immediately-fixed consequence of extending shared code, matching the same class of finding `wsi-s1` made for its own D2/D4 checklist updates.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5
**Tests passing in CI:** 5 / 5

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| acceptInvite_tenantAtTrialCap_blockedInviteNotConsumed | ✅ | ✅ | |
| acceptInvite_tenantBelowCap_unaffected | ✅ | ✅ | |
| capValues_paidTierVsTrialTier_paidIsMateriallyHigher | ✅ | ✅ | |
| acceptInvite_countExactlyAtCap_stillBlocked | ✅ | ✅ | |
| capCheck_tenantScoped_countQueryUsesInviteOwnTenantId | ✅ | ✅ | |

**Gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — single `COUNT(*)` query, negligible overhead | ✅ | Code review: one additional query, matches the story's own stated bar |
| Security — count query scoped by invite's own tenant_id, never request-supplied | ✅ | `capCheck_tenantScoped_...` test — a spoofed `tenantId` field in the payload proven ignored |
| Accessibility — "member limit reached" is real, readable text | ✅ | `acceptInvite_tenantAtTrialCap_...` asserts a distinct `'member limit reached'` reason string |
| Audit — blocked-by-cap attempt logged (tenant_id, plan, count, cap, timestamp) | ✅ | Code review: `log.info` call in the cap-check block, present and correctly shaped |

Update the NFR profile's status: **not updated to Verified feature-wide** — tracked per-story, consistent with prior DoD entries in this feature.

---

## Metric Signal

| Metric | Baseline available? | First signal measurable | Notes |
|--------|--------------------|-----------------------|-------|
| Share of new teammates added via self-serve invite | ✅ (0%) | Not yet — this story is a guardrail (per its own Benefit Linkage: "This story doesn't move either metric directly; it prevents the self-serve mechanism from having an unintended side effect"), not a metric-moving story. No real usage data yet. | Signal: **not-yet-measured**. Evidence note: "Guardrail story, not a direct metric driver — see its own honestly-labelled indirect Benefit Linkage. No production usage yet regardless." |

Note: `benefit-metric.md`'s own Metric Coverage Matrix does not list `wsi-s4` against either metric row — correctly, matching this story's own explicitly indirect linkage framing (flagged and RISK-ACCEPTed at `/review` time, `decisions.md` 2026-08-15 entry — not a new finding here).

---

## Outcome

**COMPLETE**

**Follow-up actions:** None.

---

## DoD Observations

1. **The cross-story mock-pool gap this story found (and immediately fixed) is a recurring risk class worth naming explicitly.** Three of six stories in this epic (`wsi-s1`→D2/D4, `wsi-s5`→its own AC4/NFR tests, and this story→`wsi-s2`/`wsi-s3`'s pools) each independently hit some variant of "extending shared code broke a sibling's own test double, which had no branch for the new required query/check." Every instance was caught immediately (never shipped broken), but the pattern recurring three times in one six-story epic suggests it's not random. **Tag: /improve candidate** — `/implementation-plan`'s own self-review checklist could add: "if this task adds a new query/check to a function already exercised by an earlier story's own test file, list every such file and confirm its own mock/fake pool handles the new call" as an explicit step, rather than relying on each dispatched subagent (or the orchestrating session) to discover it live during dispatch.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for "Invite acceptance is blocked if the tenant is at its member-count cap" (wsi-s4).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
```
