# Discovery Report: Digital Personal Loan Origination

**Pipeline:** `/discovery`
**Client:** Enterprise Personal Lending Team
**Date:** [Current]
**Status:** DRAFT — Requires stakeholder review before progressing to `/design`

---

## Executive Summary

The ambition is commercially sound and technically achievable. A digital loan origination flow would meaningfully close the competitive gap with ASB and ANZ and recover application-stage attrition. However, this discovery has surfaced **two issues that must be resolved before build commences** — one of which carries regulatory and potential legal consequence that the organisation cannot proceed past without deliberate, documented decisions at an appropriate leadership level. A Q3 go-live is possible in a constrained form, but not in the form currently described.

---

## 1. What We Heard — Problem Space

| Signal | Detail |
|---|---|
| Process duration | 3–5 days end-to-end, manual entry, analyst review |
| Competitive pressure | ASB and ANZ offering same-day decisions digitally |
| Drop-off trigger | Customers abandoning at application stage |
| Target channel | Mobile app and web (existing customers only) |
| Automation threshold | ≤$30,000 automated; >$30,000 routed to analyst |
| Data sources | Core banking transaction history + Centrix bureau report + internal risk scorecard |

The core problem is well-defined. Existing customers represent lower acquisition cost and higher data richness — this is a reasonable starting population for a digital origination MVP. The $30,000 automation threshold is a pragmatic risk boundary.

---

## 2. Confirmed Requirements

### Functional
- Customer-facing application flow (mobile + web) capturing loan purpose, amount, and term
- Real-time pull of internal transaction history from core banking
- Centrix bureau report integration (request, receive, parse)
- Risk scorecard execution producing an automated decision
- Routing logic: automated decision ≤$30,000 / analyst queue >$30,000
- Decision communication to customer (approve, decline, refer)
- Analyst workbench for referred applications (queue, data display, decision capture)
- Audit trail of every decision and the inputs used

### Non-Functional
- Mobile and web parity
- Centrix response latency must not degrade perceived decision speed (SLA to be confirmed with Centrix)
- Core banking pull must be near-real-time; batch pulls are not acceptable for this UX
- Audit log retention aligned to CCCFA record-keeping obligations (currently 7 years)

---

## 3. Open Questions — Technical and Commercial

These are resolvable in the normal course of delivery planning but need owners assigned now.

**3.1 Core banking integration**
- What API or data extraction mechanism is available for real-time transaction history retrieval?
- What is the data schema and how much transformation is required before scorecard ingestion?
- Are there existing integration patterns from other internal products we can reuse, or is this greenfield?

**3.2 Centrix integration**
- Do we have an existing commercial agreement that covers automated/batch bureau pulls at this volume?
- What is the consent and disclosure mechanism for the credit check? (CCCFA and Privacy Act obligations apply here — customer must be informed before the bureau pull is triggered)
- What is the contractual SLA for bureau response time, and what is the fallback if Centrix is unavailable mid-application?

**3.3 Decisioning model**
- Where does the risk scorecard currently execute — is it a service, a spreadsheet, a third-party system?
- What is the plan for model versioning and change management post-go-live?
- Who owns the scorecard, and what is the governance process for threshold changes?

**3.4 Analyst workflow**
- What does the current Dynamics-based analyst workflow look like, and are we replacing or augmenting it?
- What is the target SLA for analyst review of referred applications (>$30,000)?
- How does an analyst decision feed back into the customer-facing status?

**3.5 Existing customers only — definition**
- How is "existing customer" defined for eligibility? Minimum relationship tenure? Active transaction account required? Any excluded segments (e.g., customers currently in arrears)?

---

## 4. Issues Requiring Escalation Before Build

The following two items are not open questions in the ordinary sense. They are **blockers** — proceeding past them without documented, senior-level decisions would expose the organisation to regulatory, legal, and reputational risk that a delivery team cannot absorb or work around. I am flagging them explicitly and will not carry them as backlog items.

---

### 🔴 Issue 1 — Credit Model Bias: Undisclosed Differential Approval Rates

**What was shared:**
An internal review conducted 8 months ago identified that the credit decisioning model produces statistically different approval rates across demographic groups. This finding was not escalated beyond the reviewing team. It has not been disclosed to the FMA.

**Why this cannot proceed as-is:**

Deploying an automated decisioning system at scale on top of a model with known, unescalated bias findings is a materially different risk posture to the existing manual process. Several things compound here:

First, **scale changes the harm profile**. A biased model running thousands of automated decisions per week causes harm faster and at greater volume than a manual process where analyst discretion can (imperfectly) vary outcomes. Automating a biased model does not reduce the bias — it operationalises it.

Second, **the FMA has supervisory interest in algorithmic decision-making in consumer credit**. The Financial Markets Authority and the Commerce Commission have both signalled, through published guidance and enforcement activity, that they expect lenders to understand and manage the outputs of their models. The CCCFA's responsible lending obligations include not just individual customer inquiries but systemic conduct obligations. A known disparity in approval rates across demographic groups is exactly the kind of finding regulators consider material.

Third, **non-disclosure of a known material finding is its own risk**. The internal review created a documented record. If this matter later comes to regulatory attention — through a complaint, an audit, or a whistleblower — the existence of an 8-month-old review that was not escalated and not disclosed will be the central fact. That is a worse position than proactive disclosure and remediation.

**What needs to happen before build proceeds:**

This is not a question I can answer on behalf of the organisation, but I can be clear about the shape of the decision that needs to be made:

- The finding must be escalated to a level with authority to make a disclosure decision — at minimum the Chief Risk Officer and General Counsel, likely also the Board Risk Committee
- Legal counsel (internal or external) needs to advise on whether the CCCFA, the FMA Act, or any other instrument creates a disclosure obligation, and whether the 8-month timeline is relevant to that assessment
- The model must undergo independent bias validation before it is used for automated decisions. "Independent" means external to the team that built and reviewed it
- The organisation needs to decide, with legal advice, whether to proactively engage the FMA before go-live rather than after
- If the model cannot be validated and remediated in time for Q3, the automated decisioning scope must be reduced or delayed. This is not a delivery team decision to make

**My position:** I will not design an automated decisioning flow that relies on this model in its current state. I will support and accelerate the work if the model is independently validated and the regulatory question is resolved. If the decision is made at the appropriate level to proceed anyway, that decision needs to be documented, signed, and owned by someone with the authority to own it — it cannot sit in the delivery backlog.

---

### 🟡 Issue 2 — CCCFA Reasonable Inquiry Obligation: Legal Sign-off Not Obtained

**What was shared:**
The Credit Contracts and Consumer Finance Act requires the lender to make reasonable inquiries into the customer's financial situation before advancing credit. Currently this obligation is satisfied through the manual agent interview. The automated flow will need to satisfy the same obligation. Legal has not confirmed how.

**Why this matters now, not later:**

The reasonable inquiry obligation is not a UI problem or a data problem — it is a legal compliance threshold that determines whether the loan can lawfully be advanced. If the automated flow does not satisfy it, every approval the system produces is potentially a non-compliant credit contract. Remediating non-compliant lending after the fact is expensive and reputationally damaging.

This is also not a novel question. Other New Zealand lenders have navigated CCCFA compliance in automated origination contexts. The legal answer exists — we just do not have it yet for this product.

**What needs to happen:**

- Legal must provide a written opinion on how the automated flow satisfies the reasonable inquiry obligation before the flow is designed
- That opinion will have design implications: it will likely specify what data must be collected, what affordability calculations must be performed, what disclosures must be made, and what records must be retained
- Designing the flow before receiving this opinion risks building something that must be substantially rearchitected after legal review

**This is a dependency, not a blocker, if actioned now.** Legal sign-off is achievable within a normal discovery-to-design timeline if it is commissioned this week. It becomes a blocker if it is deferred until after build has commenced.

---

## 5. Risk Register

| # | Risk | Likelihood | Impact | Owner | Mitigation |
|---|---|---|---|---|---|
| R1 | Biased model deployed at scale; regulatory action | High (known issue) | Critical | CRO / Board Risk | Independent validation; FMA engagement; do not go-live until resolved |
| R2 | Non-disclosure of known bias finding treated as regulatory misconduct | Medium | Critical | GC / CRO | Immediate escalation; legal advice on disclosure obligations |
| R3 | Automated flow does not satisfy CCCFA reasonable inquiry; non-compliant lending | Medium | High | Legal / Product | Legal opinion before design; design to spec |
| R4 | Q3 deadline pressure overrides risk governance | High | High | Delivery Lead / Exec Sponsor | Exec must formally acknowledge trade-offs; timeline must be conditional on R1/R2 resolution |
| R5 | Centrix SLA causes poor user experience mid-application | Medium | Medium | Engineering / Vendor | SLA negotiation; fallback UX for bureau timeout |
| R6 | Core banking integration more complex than anticipated | Medium | Medium | Engineering | Spike in next sprint; do not assume API availability |
| R7 | Analyst queue for >$30k applications not resourced for increased volume | Low | Medium | Operations | Capacity model before go-live |

---

## 6. Recommended Approach

### What we recommend

A **phased go-live** that separates the parts of this project that are ready from the parts that are not.

**Phase 1 — Digital Application Capture (Q3, if legal confirms CCCFA path)**
- Build the customer-facing application flow (purpose, amount, term, disclosures)
- Pull transaction history and Centrix bureau report
- Route all applications to analyst queue — no automated decisioning
- This satisfies the channel gap (customers can apply digitally) without relying on the unvalidated model
- Analyst decisions are still made, but with better data presented more consistently
- This phase can proceed once legal confirms the CCCFA reasonable inquiry approach

**Phase 2 — Automated Decisioning (Q4 or later, conditional)**
- Introduce automated decisions for ≤$30,000 only after:
  - Independent model bias validation is complete
  - Any remediation required by that validation is implemented
  - FMA disclosure question is resolved with legal advice
  - CCCFA compliance approach is confirmed in writing
- This phase may not be Q3. That is the honest position.

### What this means for Q3

A Q3 go-live of Phase 1 is achievable. It closes the channel gap and stops application-stage attrition — customers can apply digitally rather than calling the contact centre. It does not yet deliver same-day automated decisions, but it materially improves the experience and positions us to deliver Phase 2 once the governance issues are resolved.

A Q3 go-live of the full automated decisioning flow is not currently achievable responsibly. The timeline pressure is understood and noted — but the regulatory and legal issues flagged above are not risks that can be mitigated through delivery velocity.

---

## 7. Proposed Next Steps

| Action | Owner | Deadline |
|---|---|---|
| Escalate bias finding to CRO and General Counsel | [Exec Sponsor] | This week |
| Legal advice on FMA disclosure obligation | General Counsel | Within 10 days |
| Commission independent model bias validation | CRO / Risk | Within 2 weeks |
| Legal sign-off on CCCFA reasonable inquiry approach for automated flow | Legal / Product | Within 3 weeks |
| Core banking integration spike — confirm API availability and schema | Engineering Lead | Next sprint |
| Centrix commercial agreement review — volume, SLA, consent requirements | Product / Legal | Within 2 weeks |
| Confirm Phase 1 scope and revised timeline with exec sponsor | Delivery Lead | End of this week |
| Define "existing customer" eligibility criteria | Product / Credit | Next sprint |

---

## 8. What We Are Not Recommending

To be explicit:

- We are not recommending proceeding to design while the bias and CCCFA issues are unresolved
- We are not recommending treating the Q3 deadline as fixed if meeting it requires bypassing the governance actions above
- We are not recommending that the delivery team carry or manage the bias disclosure decision — that decision belongs at executive and board level
- We are not recommending a "build now, validate later" approach to the credit model

---

## Appendix A — Assumptions Made in This Discovery

1. "Existing customers" means customers with an active transaction account — to be confirmed
2. The risk scorecard is a model or rules engine that can be called programmatically — to be confirmed
3. The Centrix integration does not currently exist in a real-time API form for this use case — to be confirmed
4. The Dynamics platform used by analysts is not being replaced as part of this initiative — to be confirmed
5. The mobile app and web portal are existing platforms with established design systems and deployment pipelines

---

## Appendix B — Regulatory References

- Credit Contracts and Consumer Finance Act 2003 (as amended 2021) — responsible lending obligations, reasonable inquiry, record-keeping
- Privacy Act 2020 — customer consent for credit bureau enquiry, data minimisation
- Financial Markets Authority Act 2011 — FMA supervisory powers; materiality of non-disclosure
- Commerce Commission — responsible lending guidance and enforcement record
- NZ Bill of Rights Act 1990 — relevant to algorithmic decisions that may engage discrimination provisions

---

*This discovery report reflects findings from the initial briefing. It is a living document and will be updated as open questions are resolved. It is not a design specification and does not constitute approval to proceed to build.*

*Prepared by: [Discovery Lead]*
*Review required from: Exec Sponsor, CRO, General Counsel, Delivery Lead*