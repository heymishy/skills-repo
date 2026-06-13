# /discovery Pipeline Skill — Analysis & Critical Issues

This is a well-articulated problem with a clear business driver, but there are **several material risks** that need immediate escalation before proceeding to design. The 31 March constraint is real and tight, but it cannot override compliance obligations.

## Critical Path Blockers

### 1. **FMA Notification — This Is Not Standard Documentation**
You need urgent clarity here:

- **Transitional Services Notice (TSN)**: Changing how members execute fund switches is a material change to your scheme's operation. The FMA typically requires you to notify members *before* implementation, with a reasonable notice period (often 20+ business days).
- **If FMA approval is required** (vs. notification-only), you may need formal pre-approval — which could take 4–8 weeks depending on FMA workload.
- **Action now**: Your compliance team should immediately confirm with FMA whether this is notification or approval-gated, and what the actual timeline requirement is. Do not assume "standard."

**Risk**: If you miss the FMA process, you may be forced to roll back post-launch, or face enforcement action.

---

### 2. **Member Notice Timing — The 31 March Trap**
Even if FMA requires only notification (not approval), you likely need to give members reasonable notice before the feature goes live:

- If members must be notified by a certain date to allow time to understand the change, and you're targeting a 31 March go-live, you may need to send notices by mid-March at the latest.
- **Compounding risk**: You're asking members to use a *new process* during the *highest-stakes switching period of the year*. If there are bugs, member confusion, or processing failures in the first week, complaints will spike exactly when members are making time-sensitive financial decisions.

**Mitigating question**: Can you achieve compliance by notifying members in late February, giving them 4–5 weeks to familiarize themselves before the March 31 rush? Or does the FMA require longer?

---

### 3. **The 3pm March 31 Cut-Off Creates Operational Brittleness**
This is a hard constraint, but it compounds risk:

- Your operations, development, and infrastructure teams all need to be **fault-tolerant and battle-tested** by mid-March. Any outages, data issues, or bugs discovered in late March cannot be fixed in time.
- The unit registry integration is non-negotiable: if that system fails or processes late on 31 March, members' switches won't complete at the correct unit price, creating legal/reputational damage.
- **Recommendation**: Your go-live date should be **early March** (not late March), giving you 3–4 weeks of real production operation and monitoring before the peak load period.

---

## Secondary Issues Requiring Scope Clarity

### 4. **Edge Cases Are Not Minor**
You've deferred:
- Recent joiners (but when? First month? 90 days?)
- Contributors on holiday (these members may specifically want to switch during a break)
- Hardship applicants (these are often urgent; manual fallback could delay critical switches)

**Question**: What percentage of your 52,000 members fall into these categories? If it's >5%, manual fallback will create a parallel queue, operational confusion, and member frustration during peak periods.

**Recommendation**: Define rules for each cohort *now*:
- Either include them in the online flow with appropriate guards, OR
- Confirm that manual processing meets their needs within the required timeframe.

---

### 5. **The $15 Switching Fee — Regulatory & Fairness Exposure**
This is commercially reasonable, but needs legal/compliance review:

- **Conflicted pricing**: Are you introducing the fee at the same time as launching the feature? This creates an optics problem — "We made switching easier *and* we're charging for it now."
- **Fee justification**: Can you defend the $15 as cost-reflective? (System maintenance, transaction processing, unit registry updates, etc.) Or is it primarily revenue?
- **Member communications**: How clearly will you communicate when the fee applies, and that the first two switches per year are free?

**Recommendation**: Confirm with your compliance/legal team that the fee introduction doesn't need separate FMA notification, or if it does, include it in your March compliance paperwork.

---

## Recommended Immediate Actions (Next Week)

| Action | Owner | Deadline | Outcome |
|--------|-------|----------|---------|
| Confirm FMA notification vs. approval requirements | Compliance | By end of week | Clarify actual regulatory timeline |
| Define required member notice period | Compliance + FMA | By end of week | Lock in the latest safe go-live date |
| Map edge-case member cohorts and volumes | Operations | By Friday | Decide: online flow or manual fallback per cohort |
| Define unit registry integration requirements & SLAs | Tech lead + Operations | By Friday | Confirm 3pm March 31 is achievable |
| Legal review of $15 fee and combined messaging | Legal/Compliance | By end of week | Confirm no additional notification needed |
| Set production go-live target (recommend early March) | Program lead | By Friday | Build 3–4 week buffer before peak load |

---

## Bottom Line

**The 31 March deadline is achievable, but not if compliance is treated as a "standard documentation step."** Bring your compliance team into the room *now* to confirm actual FMA requirements and member notice timelines. If the FMA process is longer than you've assumed, you may need to choose between:

1. A phased launch (online switching live for most members by 31 March, with edge cases via fallback), or
2. Pushing peak support and communication earlier to give members more time to adapt.

Either way, you need 3–4 weeks of production stability before the peak period. Build to that timeline, not to the deadline.

Would you like me to help draft the FMA notification or map the edge cases?