# Discovery Pipeline Analysis: Fund Switching Feature

## Critical Issues Requiring Immediate Attention

I'm going to flag several problems that could derail this project or create compliance/operational risk, despite the clear deadline pressure.

---

## 1. **FMA Notification Timing (High Risk)**

**The Issue:**
- You need FMA notification *before* launch, not as a "standard documentation step"
- FMA guidance on KiwiSaver product changes typically requires 20–30 working days minimum for assessment
- Your 31 March deadline is ~8 weeks away (assuming you're reading this in late January/early February)
- FMA *may* flag the fee change, the switching rules, or edge case handling as requiring fuller disclosure

**Discovery Questions:**
- Have you already submitted a pre-notification draft to FMA for informal feedback?
- Does your compliance team have documented precedent for how long FMA took to clear similar changes?
- What triggers re-notification vs. standard notification? (The fee introduces a new commercial condition.)

**Recommendation:**
Contact FMA this week to confirm the pathway. Do not assume "standard documentation." The 31 March date is immovable; FMA assessment timelines are not.

---

## 2. **Member Advance Notice & Communication (Medium-High Risk)**

**The Issue:**
- You need to notify members of the new process *and* the $15 fee before they can use it
- Members need enough notice to understand the fee applies retroactively (or from what date?)
- Last-minute communication before 31 March will confuse high-intent members trying to switch before year-end

**Discovery Questions:**
- What is your planned member notification window? (Recommendation: 4–6 weeks minimum)
- Does the $15 fee apply to switches made after launch, or only from a specific date?
- Are members on contributions holidays or hardship clearly informed they *cannot* use online switching?
- How will you communicate the edge cases—via email, portal message, or just let them discover it fails?

**Recommendation:**
Plan communication rollout *before* FMA notification is finalized. This becomes the critical path, not the tech build.

---

## 3. **Edge Cases & Operational Fallback (High Risk)**

**The Issue:**
You've described three categories ("we expect operations to handle manually") but:

- **Recent joiners**: What's the definition? Some KiwiSaver schemes have 40-day lockdown periods. Does your scheme?
- **Contributions holiday members**: Can they switch funds? If yes, why is online switching blocked for them? If no, this is a hard rule, not an edge case.
- **Active hardship applications**: Why can't they use online switching? Are you worried about reversals or compliance?

**The real problem:** If you don't define these rules now, operations will face conflicting requests on 31 March at 2:45pm.

**Discovery Questions:**
- What percentage of your 52,000 members fall into each edge case category?
- What's the current approval rate for hardship applications? (i.e., how many members would be blocked?)
- Does your unit registry system actually *prevent* switches for these cohorts, or does the paper form just get reviewed differently?

**Recommendation:**
Decide: are these **hard blocks** (code enforces them in the portal) or **soft guardrails** (operations reviews before processing)? If hard blocks, you need the rules codified and tested. If soft, you're creating a customer service nightmare on year-end day.

---

## 4. **Unit Registry Processing & Same-Day Commitment (Medium Risk)**

**The Issue:**
- You say "committing the switch instruction to the unit registry on the same business day"
- But unit pricing for KiwiSaver closes at a specific time (typically 4pm or later, depending on your fund manager setup)
- If a member switches at 2:50pm on 31 March, can you guarantee the registry commit happens *before* the 3pm cut-off you mentioned? (Or is the cut-off actually EOD?)

**Discovery Questions:**
- What is the exact cut-off time for 31 March unit pricing? (3pm member submission deadline vs. EOD registry commit deadline)
- Who controls the unit pricing? Is it in-house or delegated to a fund manager?
- Can the unit registry handle concurrent writes at scale? (52,000 members, even 5% switching = 2,600 requests; year-end could spike higher)
- What's your fallback if the registry is down on 31 March afternoon?

**Recommendation:**
Load-test the unit registry pipeline with realistic year-end volume. Do not assume "same-day" is technically feasible under peak load.

---

## 5. **The $15 Switching Fee (Medium Risk)**

**The Issue:**
- This is a commercial change to the scheme's terms
- Members may contest it if they've switched twice already this year (they'll feel penalized retroactively)
- It may need separate FMA notification or disclosure

**Discovery Questions:**
- Does the fee apply to switches made *before* launch (i.e., retroactively) or only *after*?
- Are you exempting existing members who switched twice in Jan–Mar of this year?
- Is this fee disclosed in your current scheme document, or does it require a scheme amendment?
- Competitor schemes that charge fees—are they charging on the 3rd switch, or from the 1st switch beyond a threshold?

**Recommendation:**
Clarify the effective date of the fee with FMA. If it applies retroactively, be prepared for member complaints. If not, document the exemption window clearly.

---

## 6. **Portal Readiness & Testing (Medium Risk)**

**The Issue:**
- You haven't mentioned UAT or member testing timelines
- Integration with the unit registry, fund manager systems, and compliance logging all need to work
- If the portal goes down on 31 March, you need a fallback *and* a communication plan

**Discovery Questions:**
- What's the current member portal technology? (Home-built, vendor-supplied?)
- How long does it typically take to push changes live after UAT?
- Do you have a staged rollout plan, or full 52,000-member launch on day one?
- What's the rollback procedure if bugs are discovered post-launch?

**Recommendation:**
Plan a soft launch 2–3 weeks before 31 March (e.g., early March) with a small cohort, so you catch integration bugs before the year-end rush.

---

## Revised Critical Path

1. **This week**: FMA pre-notification discussion (confirm pathway, not a blocker)
2. **Week 2–3**: FMA formal notification submitted; compliance drafts member communication
3. **Week 4–5**: Member communication goes live (email, portal banners); member questions flow in
4. **Week 5–6**: Portal feature UAT and soft launch to 10% of members
5. **Week 6–7**: Full launch with live support ramped up
6. **31 March**: Monitor closely; maintain paper fallback for any edge cases

---

## Summary for Your Board

**The 31 March deadline is achievable, but not a guarantee.** The technical build is probably feasible in 8 weeks, but the critical path is:
- FMA notification sign-off (not guaranteed within your timeline; start immediately)
- Member communication (needs 4–6 weeks for awareness)
- Edge case policies (need definition now, not on launch day)
- Registry and portal load testing (highest technical risk)

I'd recommend confirming FMA feedback by mid-February, or you'll be managing member complaints about a feature that isn't ready rather than managing the operational improvement you intended.

What's the current status of FMA pre-engagement?