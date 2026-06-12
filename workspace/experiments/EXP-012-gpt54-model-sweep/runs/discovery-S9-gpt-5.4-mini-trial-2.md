Here’s a discovery readout based on what you’ve provided, framed as the key product, delivery, and risk issues to resolve before committing to build.

## Executive summary

The proposed online fund-switching feature is a **high-value, board-visible retention initiative** with a **hard regulatory and operational deadline of 31 March**. The biggest risks are not technical—they’re **compliance timing, cut-off handling, pricing/fee governance, and exception processing**.

If you want this live by 31 March, the likely path is:
1. **Confirm regulatory notification and member-notice requirements immediately**
2. **Define scope tightly for v1**
3. **Lock operational rules for cut-off, pricing date, and edge cases**
4. **Design a fallback/manual workflow for exceptions**
5. **Prioritise a minimal compliant release over “instant” behavior where dependencies are uncertain**

---

## What I heard

### Current state
- Around **52,000 KiwiSaver members**
- Four funds: **conservative, balanced, growth, aggressive growth**
- Fund switches are currently **paper-based**
- Operations takes **10–15 business days**
- Competitors already offer **online switching with same-day or next-business-day processing**
- Member attrition is increasing

### Desired future state
- Online switching in the member portal
- Member selects target fund, confirms switch
- Receives confirmation and an estimated processing date
- Preferably “instant where possible”
- At minimum, the instruction should be **committed to the unit registry on the same business day**

### Fixed deadline
- **Must be live by 31 March**
- Critical reason: members want to lock in switches against the **31 March unit price date**
- Particular sensitivity for members moving **growth → conservative**
- Cut-off expected to be **3pm on 31 March** for same-period processing

### Known compliance/business changes
- Need to **notify FMA**
- Need to give members **advance notice** before the process goes live
- Plan to introduce a **$15 switching fee** for members with more than two switches per calendar year
- Edge cases currently planned for manual handling via paper fallback:
  - very recent joiners
  - members on contributions holiday
  - members with active hardship applications

---

## Key discovery findings

## 1) The 31 March deadline is the primary constraint, not “instant switching”
Your true delivery requirement is not just “build an online switch form”; it is:

- **Enable compliant switching before 31 March**
- Ensure instructions submitted before **the 3pm cut-off** are handled correctly against the relevant unit price date
- Avoid disputes about whether a switch was accepted in time

That means the product must have:
- clear cut-off messaging
- deterministic processing rules
- confirmed downstream registry integration
- auditability of submission timestamps and acceptance status

---

## 2) Compliance is likely on the critical path
You’ve correctly identified that this is not just a UI change. Launching a member-facing switching workflow typically involves:
- member disclosure/notice updates
- operational process changes
- possible scheme document/terms updates
- FMA notification or other regulatory steps, depending on your scheme structure and obligations

The phrase “standard documentation step” is a warning sign only if the timing is underestimated. For 31 March, compliance work is not a side task; it is probably the gating item.

**Discovery risk:** if notification/notice periods are mandatory, the feature may need a narrower launch plan or a temporary first release with limited functionality.

---

## 3) The switching fee needs governance and likely product/legal review
A fee of **$15 for more than two switches per calendar year** is commercially plausible, but the key question is not whether competitors charge similar fees—it’s whether:
- the fee is allowed under your scheme rules / offer documents
- the fee is adequately disclosed
- the fee calculation is operationally enforceable
- members can understand it at the point of action
- the fee applies to all channels consistently, or only online

Potential issues:
- “more than two per calendar year” requires an accurate switch count across channels
- if paper switches are still allowed, the fee logic must span both online and offline transactions
- if the fee applies only to online switches, that may create customer fairness concerns
- if the fee is introduced at the same time as the digital feature, it may become a complaint driver unless explained well

---

## 4) The edge cases are not minor
The groups you flagged—recent joiners, contributions holiday members, hardship applicants—can’t simply be “handled manually” without defining exact business rules.

You need to know:
- Are they allowed to switch at all?
- If yes, are there restrictions or delays?
- If no, what message is shown online?
- Is the switch form disabled, warned, or allowed with manual review?
- Which team owns the exception decision?

If this is left vague, it will create operational bottlenecks and member frustration on day one.

---

## 5) “Same-business-day commitment to the registry” implies downstream integration work
Your minimum acceptable outcome implies more than a portal submission:
- member action captured
- time-stamped
- validated
- accepted or rejected immediately
- sent to registry within cut-off window
- acknowledgement returned to member
- confirmation available for audit and support

This means the registry interface, not just the portal, is part of the product.

---

## Product implications

## Suggested MVP scope for 31 March
To increase the chance of delivery, I’d recommend a tightly scoped v1:

### In scope
- Logged-in member can switch between the four funds
- Confirmation screen before submission
- Validation of eligibility
- Clear cut-off and processing-date messaging
- Immediate acknowledgment after submission
- Registry handoff on same business day
- Audit trail and support reference number
- Basic fee disclosure if applicable

### Out of scope for v1 unless already ready
- scheduled switches
- partial switches
- multi-fund allocations
- advanced automation for complex exceptions
- member self-service reversal
- real-time price simulation
- conditional future-dated switches

---

## Open questions you should answer immediately

### Compliance / legal
1. What exact notifications to the FMA are required?
2. What advance member notice period applies?
3. Do scheme documents/terms need updating before launch?
4. Does the $15 fee require explicit opt-in, notice period, or rule changes?
5. Are there disclosure obligations for the 3pm cut-off and processing dates?

### Operations / registry
6. What is the registry cut-off for same-day instruction acceptance?
7. What is the failure mode if the registry is unavailable?
8. Who monitors rejected or failed submissions?
9. Can the operations team process online instructions differently from paper instructions?
10. What is the expected confirmation to members if the registry receives the instruction after cut-off?

### Eligibility / edge cases
11. What are the exact rules for new members?
12. Can members on contributions holiday switch funds?
13. Can members with hardship applications switch funds?
14. Are there any blackout periods or restrictions near year-end?
15. What is the manual fallback process, and how is it communicated?

### Pricing / fee
16. Does the fee apply across all channels or only online?
17. How is “more than two switches per calendar year” counted?
18. What happens if a switch is initiated before year-end but processed after year-end?
19. Does the fee trigger at submission or at processing?
20. What refund rules apply if a switch fails?

---

## Main risks

### 1) Missing the 31 March deadline
This is the highest risk. If compliance, registry integration, or approvals slip, the feature may not be safely launched in time.

### 2) Incorrect cut-off handling
If members think they locked in at 3pm but the system processes later, complaints and compensation risk will be high.

### 3) Ambiguous fee application
If the fee isn’t unambiguous and transparent, it can become a complaints issue and potentially a regulatory issue.

### 4) Poor handling of exceptions
Manual fallback without clear rules will create inconsistent member experiences and operational overload.

### 5) Underestimating downstream integration
A portal front end is easy compared with reliable registry submission, audit logging, and exception handling.

---

## Recommendation

### Immediate next step
Run a **2–3 day discovery spike** with compliance, operations, registry/tech, and member experience to answer the open questions above.

### Delivery approach
Use a **phased release**:
- **Phase 1:** online switching with strict eligibility rules and transparent cut-off messaging
- **Phase 2:** automate more edge cases and enhance fee logic
- **Phase 3:** extend to richer self-service or future-dated switching if needed

### Decision needed
Before estimating build effort, you need a firm answer on:
- compliance notice timing
- exact registry cut-off and processing rules
- fee rules
- exception policy

---

## Suggested problem statement

> Build a compliant online fund-switching capability in the member portal that allows eligible KiwiSaver members to switch between the four scheme funds, confirms submission with a clear processing date, and commits valid instructions to the unit registry on the same business day when submitted before the 3pm cut-off, with launch completed by 31 March.

If you want, I can turn this into a **formal discovery output** next:
1. a **problem statement + assumptions + risks**, or  
2. a **prioritised requirements list / MVP scope**, or  
3. a **delivery plan to hit 31 March**.