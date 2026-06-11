Below is the /discovery output for your initiative, focused on surfacing what matters early so delivery, risk, and governance can make sound decisions.

---

# /discovery

## 1) Problem summary

You operate a KiwiSaver scheme with ~52,000 members across four funds. Fund switching is currently paper-based and slow, with 10–15 business day processing by operations. Competitors offer online switching with same-day or next-business-day turnaround, and you believe this gap is contributing to member attrition.

You want an online fund switching feature in the member portal that allows members to:
- select a target fund,
- confirm the switch,
- receive confirmation and an estimated processing date.

Your aspiration is “instant where possible,” but the minimum acceptable operational outcome is that switch instructions are committed to the unit registry on the same business day they are submitted.

The stated hard deadline is **31 March**, tied to member expectations around end-of-financial-year unit price timing and a **3pm cut-off** for same-period processing.

You also intend to:
- notify the FMA and provide advance member notice,
- introduce a **$15 fee after more than two switches per calendar year**,
- leave some edge cases on a manual fallback path.

---

## 2) Desired outcomes

### Business outcomes
- Reduce member attrition to competitors.
- Improve member experience and scheme competitiveness.
- Reduce operational effort and turnaround time for switches.
- Meet board-mandated delivery before 31 March.

### Member outcomes
- Members can switch funds online without paper forms.
- Members get immediate confirmation of their instruction.
- Members understand when the switch will be processed.
- Members can submit before the stated cut-off and trust it will be handled correctly.

### Operational outcomes
- Same-business-day submission to the unit registry for in-scope cases.
- Clear exception handling for members not eligible for straight-through processing.
- Reduced manual handling volume.

---

## 3) What appears in scope

Likely in scope based on your brief:
- Member portal journey for fund switching.
- Eligibility checks for standard switch scenarios.
- Capture of member instruction and confirmation.
- Estimated processing date display.
- Integration to the unit registry or equivalent downstream instruction mechanism.
- Cut-off handling for 3pm on 31 March and likely for normal business days generally.
- Member communications/confirmation.
- Switching fee logic after two switches per calendar year.
- Manual fallback path for exceptions.

---

## 4) What appears out of scope or assumed away

These items are either explicitly out of scope or currently underexplored:
- End-to-end treatment of all edge cases.
- Full redesign of registry operating model.
- Broader product disclosure / governing document change impacts.
- Reversal/cancellation flows after submission.
- Adviser/intermediary-initiated switches.
- Mobile app support, if separate from portal.
- Contact centre/admin tooling.
- Audit/reporting/regulatory evidence requirements.
- Complaints/disputes workflow for cut-off misses or disputed fees.

---

## 5) Critical assumptions being made

These assumptions are material and should be validated immediately:

1. **31 March is achievable regardless of dependency lead times**  
   This may be false if registry integration, notices, disclosure updates, legal review, or operational readiness have minimum lead times longer than expected.

2. **FMA notification and member notice are “standard documentation steps” only**  
   This may understate legal/compliance complexity, especially if:
   - the switch process materially changes scheme operations,
   - a new fee is introduced,
   - disclosure documents or terms need amendment,
   - advance notice periods are prescribed by governing documents or regulation.

3. **A $15 switching fee can be introduced without significant legal/product change effort**  
   This is a major assumption and could be wrong. Charging a new fee often requires review of:
   - trust deed/governing document,
   - PDS and other disclosure,
   - fee certification and governance approvals,
   - operational treatment, tax/GST treatment, and member communications.

4. **Same-day commit to the unit registry is operationally feasible**  
   Depends on:
   - registry interface capabilities,
   - cut-off times,
   - validation rules,
   - batch windows,
   - same-day operational support,
   - failure handling and retries.

5. **“Instant where possible” is compatible with unit pricing and KiwiSaver processing rules**  
   “Instant” may not be a safe term operationally or legally if actual effect depends on end-of-day batch, unit pricing timing, or registry acceptance.

6. **Manual fallback for edge cases is sufficient**  
   This may create inconsistent treatment, complaints, and missed cut-offs, especially around 31 March demand spikes.

7. **Portal authentication is already strong enough for this type of transaction**  
   A fund switch is a consequential financial instruction. Additional step-up authentication or fraud controls may be required.

---

## 6) Key questions that must be answered

## A. Regulatory / legal / compliance
1. Does online fund switching itself require any formal notification, approval, or only operational readiness and member notice?
2. Does introducing the **$15 fee** require:
   - board approval,
   - supervisor/trustee approval,
   - deed amendment,
   - PDS update,
   - advance notice period,
   - FMA notification?
3. What is the minimum lawful/prudent **member notice period** before:
   - online switching goes live?
   - the new switching fee takes effect?
4. Can the feature launch before the fee, if the fee work is not ready?
5. Are there specific disclosure requirements around:
   - cut-off times,
   - processing dates,
   - unit price date used,
   - circumstances where a switch may be delayed or rejected?

## B. Product / business rules
6. What exactly counts as a “switch” for fee purposes?
   - full balance only?
   - future contributions only?
   - both current balance and future contributions?
   - submitted vs completed vs cancelled?
7. Is the feature for:
   - existing balance switches,
   - future contribution allocation changes,
   - or both?
8. Are members allowed to submit multiple switches in one day?
9. Can a member cancel or amend a switch before cut-off?
10. What fund-specific constraints apply, if any?
11. What date/time basis governs the cut-off:
   - NZDT/NZST portal time,
   - registry receipt time,
   - business calendar?
12. What happens if the portal is unavailable near cut-off?

## C. Operations / registry
13. What is the unit registry’s actual capability for same-day instruction receipt and processing?
14. Is there an API, file drop, batch process, or manual intervention step?
15. What is the latest internal submission time to guarantee registry commitment same day?
16. What exception codes and reject reasons can the registry return?
17. How will failed submissions be monitored and remediated before the cut-off expires?
18. Can operations handle a volume spike on 31 March?

## D. Member experience
19. What exact promise will be shown to members:
   - “submitted today,”
   - “processed same day,”
   - “effective at next available unit price,”
   - “estimated processing date only”?
20. How will fees be explained before confirmation?
21. How will edge-case members be told they must use paper/manual processing?
22. Will members see historical switches and fee count?

## E. Delivery / governance
23. What are the non-negotiable must-haves for 31 March vs later enhancements?
24. Is there appetite for phased delivery?
25. Who owns the final go/no-go decision if compliance readiness lags?

---

## 7) Risks

## Highest risks

### 1. Deadline risk: 31 March may be externally constrained
This is the most significant delivery risk. The date is business-critical, but may not be fully under engineering control if:
- notice periods are required,
- legal disclosures must be updated,
- registry/vendor changes are needed,
- supervisor/FMA engagement takes time.

**Why it matters:** The board sees 31 March as a build deadline, but it may actually be a **regulatory/operational readiness deadline**.

---

### 2. Fee introduction may materially complicate delivery
Adding a new fee is not a minor bolt-on. It can introduce:
- legal and disclosure work,
- product governance approvals,
- billing/refund edge cases,
- member comms complexity,
- complaints risk.

**Why it matters:** The fee could become the tail that wags the dog and jeopardise the core online switching launch.

---

### 3. Cut-off and unit-price expectations create high complaints risk
Members care about whether their switch catches the 31 March processing period. Any ambiguity about:
- submission time,
- acceptance time,
- registry commit time,
- unit price date,
- portal outage,
can lead to disputes and complaints.

**Why it matters:** This feature is not just convenience; it affects perceived investment outcomes.

---

### 4. Straight-through processing may be overstated
“Instant where possible” and same-day registry commitment may not hold for:
- recent joiners,
- pending contributions,
- contribution holidays,
- hardship cases,
- AML/KYC flags,
- account restrictions,
- duplicate requests,
- in-flight transactions.

**Why it matters:** If exception volumes are higher than expected, operations could be overwhelmed, especially near 31 March.

---

### 5. Member-facing financial transaction controls may be insufficient
Online fund switching likely requires:
- strong authentication,
- audit trail,
- non-repudiation evidence,
- clear disclosures and confirmations.

**Why it matters:** Weak control design increases fraud, dispute, and regulatory risk.

---

## 8) Dependencies

Likely dependencies include:
- Member portal team.
- Identity/authentication capability.
- Unit registry/vendor.
- Operations team and processing procedures.
- Compliance/legal review.
- Product/governance/board approvals.
- Communications/content team.
- Potential supervisor/trustee engagement.
- Finance/billing capability for fee application and collection.
- Reporting/audit support.

---

## 9) Edge cases explicitly mentioned

You already called out:
- very recent joiners,
- members on contribution holiday,
- members with active hardship applications.

These need concrete business rules, not just a manual fallback label. For each:
- can they switch at all?
- under what conditions?
- who decides?
- how is the member informed?
- what SLA applies?
- does the 31 March cut-off still apply?

Other likely edge cases to consider:
- dormant or locked portal accounts,
- deceased estates / POA / guardianship,
- members with pending identity changes,
- simultaneous withdrawal or transfer requests,
- duplicate submissions,
- registry unavailable,
- post-cut-off submissions,
- daylight saving/time-zone display issues,
- members charged a fee due to failed/retried submissions.

---

## 10) Recommended framing of MVP

To hit the deadline, the cleanest MVP may be:

### MVP goal
Enable **in-scope members** to submit a fund switch online and have the instruction transmitted to the registry **same business day** when submitted before cut-off.

### MVP scope
- Single online switch journey.
- Limited to standard eligible members.
- Clear cut-off messaging.
- Immediate confirmation screen/email.
- Manual fallback for exceptions.
- No “instant switch” language unless technically and legally true.
- Potentially **exclude the new fee from MVP** if it creates approval/disclosure delay.

### Defer if necessary
- Fee charging.
- Complex cancellation/amendment flows.
- Full self-service handling of edge cases.
- Rich switch history/reporting.
- Contribution allocation changes, if separate and complicating.

---

## 11) Hard truths / likely misconceptions

1. **The real critical path may be compliance and product governance, not software.**
2. **The fee is likely not “standard��� from an implementation standpoint, even if commercially common.**
3. **A member notice requirement means the practical go-live date may be earlier than 31 March in order to be valid by 31 March.**
4. **“Same-day commit” and “same-period processing” need exact, testable definitions.**
5. **Manual fallback is not harmless if many members fall into exceptions at the exact peak demand period.**

---

## 12) Immediate decisions needed

These should be made urgently, ideally within days:

### Decision 1: Is the fee in MVP or post-MVP?
Recommendation: **separate this decision now**. If the fee introduces legal/disclosure complexity, defer it.

### Decision 2: What is the exact member promise?
Choose one precise service statement, e.g.:
- “Instructions submitted before 3pm on a business day will be sent to the registry the same day.”
or
- “Eligible instructions submitted before 3pm on 31 March will be processed using the applicable 31 March processing cycle, subject to successful validation.”

This wording needs legal/compliance sign-off.

### Decision 3: What is the eligibility perimeter for straight-through processing?
Define the in-scope member cohorts for launch.

### Decision 4: Is phased launch acceptable?
For example:
- Phase 1: online submission for standard cases by 31 March
- Phase 2: fees, advanced exceptions, richer self-service later

---

## 13) Recommended next actions

## In the next 48–72 hours
1. Run a cross-functional rule-setting workshop with:
   - product,
   - operations,
   - registry/vendor,
   - compliance/legal,
   - portal/engineering,
   - member services.
2. Confirm whether the **fee** requires deed/disclosure/governance changes.
3. Confirm the **minimum notice period** for:
   - online process launch,
   - fee introduction.
4. Map the exact cut-off process from member click through to registry receipt.
5. Define launch eligibility and exception handling.
6. Decide whether to split fee from core switching.

## In the next week
7. Produce a service blueprint covering:
   - happy path,
   - exceptions,
   - failure handling,
   - operational monitoring,
   - member communications.
8. Get registry/vendor written confirmation of same-day capability and constraints.
9. Draft the exact member-facing wording for:
   - confirmation,
   - cut-off,
   - processing estimate,
   - fee disclosure,
   - exception messages.
10. Establish a deadline-backward plan from the latest lawful go-live date.

---

## 14) Discovery conclusion

This is a high-value feature with a clear competitive need and strong member benefit. However, the initiative is not just a portal enhancement; it is a **time-sensitive, regulated transaction capability** with significant operational, legal, and expectation-management implications.

The main discovery conclusion is:

> **The biggest threat to success is not building the front end — it is underestimating compliance, disclosure, fee-change, and cut-off handling complexity against the immovable 31 March deadline.**

The most prudent path is to:
- treat **31 March** as a full operational-readiness deadline,
- narrow MVP to standard online switching,
- define exact processing promises,
- and strongly consider **deferring the $15 switching fee** if it jeopardises timely launch.

---

If helpful, I can next turn this into one of the following:
1. a **RAID log**,
2. a **discovery question pack for stakeholders**,
3. an **MVP scope vs deferred scope recommendation**,
4. or a **board-ready one-page briefing**.