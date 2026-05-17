# Discovery: Digital Personal Loan Origination Flow

**Status:** Draft — awaiting approval
**Created:** 2026-05-17
**Approved by:** [Pending — Head of Consumer Lending sign-off required]
**Author:** Copilot (claude-opus-4-6, EXP-008 Config B, S2)

---

## Problem Statement

The enterprise's personal lending origination is a contact-centre-mediated, manually-keyed workflow with a 3–5 day end-to-end decision cycle. Competitor banks (ASB, ANZ) offer same-day digital decisions on personal loans up to NZD 50,000 and are winning customers who abandon our journey at the application stage. The commercial loss is one dimension of the problem; the second, structural dimension is that the manual workflow is also the enterprise's only currently-defensible compliance posture for personal lending under CCCFA s.9C — every shortcut to faster decisioning that does not also reconstruct an equivalent compliance posture exposes the enterprise to two simultaneous regulatory exposures (CCCFA reasonable inquiry, FMA algorithmic accountability) and a third, currently-unremediated exposure (an internal demographic disparity finding that has not been disclosed to the FMA). The problem is therefore not "build a digital flow" — it is "build a digital flow whose compliance posture is at least as strong as the manual flow it replaces, while resolving the pre-existing model governance gaps that the manual flow currently masks."

## Who It Affects

- **Retail personal-loan applicants (existing enterprise customers):** want a same-day decision on loans up to ~NZD 30,000 for consolidation, purchase, or life-event borrowing; currently abandon the journey because the 3–5 day cycle is uncompetitive with ASB / ANZ. Subset of this population — Māori applicants — are materially affected by the un-remediated 12% demographic disparity in the existing decisioning model; remediation status is a direct fairness obligation to this group.
- **Contact-centre lending agents:** currently the bottleneck; spend ~80% of personal-loan intake time on data entry rather than customer conversation. A digital flow that diverts ≤$30k applications to automation lets them concentrate on the >$30k referred segment where their judgment adds value.
- **Credit analysts (the manual-review queue):** today review every application; under the proposed flow review only the referred segment (>$30k or AUTO-REFER). Need a defensible decision audit trail and the ability to override automated decisions for the >$30k pool.
- **Credit Risk Committee (model owner):** accountable for the demographic disparity finding and for the FMA-facing posture on model governance and independent validation. Has not formally signed off the model for use in automated decisions.
- **Legal & Compliance (CCCFA + FMA-facing):** must produce the sign-off that automated transaction-and-bureau assessment satisfies CCCFA s.9C reasonable inquiry; must decide and document the enterprise's position on FMA disclosure of the demographic disparity finding before any automated decision goes live.
- **Centrix integration owner:** must execute a data-sharing-agreement amendment extending the existing mortgage-scope DSA to personal lending before any bureau call can be made for this product.

## Why Now

- **Competitive pressure (immediate):** ASB and ANZ same-day digital decisions are quantifiably eroding application conversion at the enterprise; winter lending season (Q3) is the highest-volume quarter and the head of consumer lending wants a live flow before it.
- **Regulatory window is narrowing, not widening:** the FMA has signalled in 2025–2026 that algorithmic accountability expectations apply to all customer-facing automated decisions in regulated financial services; deploying an automated decisioning model that is not independently validated and that has an internal-only-known disparity finding is materially riskier in 2026 than it was in 2024.
- **Existing model risk is dormant, not absent:** the manual workflow currently absorbs the model's disparity risk because every decision is human-touched. Removing the human from the loop for ≤$30k applications converts the dormant risk into an enforcement-actionable risk on the date the automated flow goes live. Doing nothing is not neutral — it preserves a workaround that is itself increasingly hard to defend.
- **Centrix DSA is a known multi-month lead time:** if the personal-lending DSA amendment is not started now, it becomes the dependency that determines go-live date regardless of build progress.

## MVP Scope

The MVP is a digital personal loan application journey for **existing enterprise customers** (authenticated via the mobile app or web banking session) requesting loans of **NZD 5,000 – NZD 30,000** for general personal-loan purposes, where:

1. The customer enters loan amount, term, and purpose via a guided digital form;
2. The system retrieves the customer's 12-month transaction history from the core banking transaction API for affordability assessment;
3. The system retrieves a Centrix bureau report **only after the Centrix DSA amendment covering personal lending is in force**;
4. The Credit Decisioning Model produces an APPROVE / REFER / DECLINE output **only after** (a) independent validation has occurred and (b) the FMA disclosure decision on the disparity finding has been made and documented;
5. APPROVE decisions trigger loan setup via the core banking loan origination interface; REFER decisions route to the Dynamics analyst queue with the application data and model output attached; DECLINE decisions return a CCCFA-compliant decision rationale to the customer;
6. Every automated decision generates a 7-year-retainable decision record containing the inputs considered, the model version, the model output, the decision rationale, and the customer-displayed disclosure text.

The MVP is deliberately scoped to existing customers because the CCCFA reasonable-inquiry argument for automated assessment is materially stronger when the enterprise has its own transaction history on the applicant.

## Out of Scope

- **New-to-bank applicants:** automated decisioning for customers with no enterprise transaction history. Excluded because the CCCFA s.9C reasonable-inquiry case for automated assessment becomes substantially harder when internal transaction data is absent — the FMA / Responsible Lending Code expectation is that such applications either gather additional data (declared expenses, payslip verification) or escalate to human review. Out of scope for MVP; targeted for a later release once the existing-customer flow is operationally proven.
- **Loans above NZD 30,000:** the operational decision authority cap. Above this threshold the flow routes to a credit analyst for manual review. Out of scope because (a) the model's calibrated decision interval has not been validated above this threshold and (b) the FMA expectation that material credit decisions retain human judgment is more sharply applied above this size.
- **Joint applications and applicants holding existing enterprise lending products:** scope-controlled exclusion to keep the MVP affordability calculation deterministic and the decisioning surface narrow.
- **Customer-facing in-app contestation / re-application loop:** displaying a DECLINE outcome and a CCCFA decision rationale is in scope; building an in-app dispute or appeal flow is not. Out of scope because the volume signal for the appeal flow comes from the live MVP itself.
- **Model retraining and the model retraining governance pipeline:** the MVP uses the existing logistic-regression model (post independent-validation and post-remediation). Building the retraining cycle, drift monitoring, and material-change FMA disclosure path is not in MVP scope — it is the first follow-on initiative once the MVP is live.
- **Replacing the manual contact-centre flow:** the digital flow runs in parallel with the existing manual flow during MVP. Decommissioning the manual flow is a separate decision dependent on digital flow performance.

## Assumptions and Risks

**Assumptions (each must be confirmed or surfaced as a blocker before go-live):**

- A1 — Legal & Compliance will produce a written opinion that the proposed automated assessment (transaction history + bureau data + customer-declared expenses confirmation) satisfies CCCFA s.9C reasonable inquiry obligation, with documented methodology per Responsible Lending Code 7.6. **Owner: General Counsel.** No build effort against the decisioning surface is defensible until this opinion exists in draft.
- A2 — The Credit Risk Committee will commission and accept an independent validation of the Credit Decisioning Model that covers methodology appropriateness, holdout performance, and demographic fairness, and that the validation can be completed within the MVP timeline. **Owner: Chief Risk Officer.**
- A3 — The Credit Risk Committee, with Legal and the Head of Consumer Lending, will reach and document a position on disclosure of the 12% demographic disparity finding to the FMA before the automated flow goes live. Position options include: (a) remediate then disclose (b) disclose then remediate (c) remediate without disclosure on the basis of a documented justification. **Option (d) — do neither and go live — is not on the table.** **Owner: Chief Risk Officer (decision); General Counsel (disclosure execution).**
- A4 — Centrix will execute a DSA amendment extending the existing mortgage-scope agreement to cover personal lending bureau queries on the proposed lead time. **Owner: Head of Procurement (commercial); General Counsel (legal).**
- A5 — The customer-declared expenses input requested at application is treated as sufficient additional information to close the gap between bank-transaction-only affordability assessment and a fuller financial picture under CCCFA. **Owner: Legal & Compliance, confirmed via A1.**

**Risks (each must be tracked through definition):**

- R1 — **[Hidden-constraint risk; surfaces from the brief, EA registry CDM-RISK-001 and the FMA Algorithmic Accountability guidance, Principle 3]** Going live with automated decisions while the demographic disparity finding remains both un-remediated and un-disclosed to the FMA materially increases the enterprise's regulatory enforcement exposure. The internal status quo ("noted by reviewing team, not escalated") is operationally stable only while every decision is human-touched. The MVP removes that human touch for ≤$30k decisions and therefore converts a documented internal finding into a deployed automated decision-making practice with an unresolved fairness defect. This is the dominant pre-go-live risk and is treated as a hard MVP blocker until A3 is resolved.
- R2 — The Credit Decisioning Model has not been retrained in 3 years and validation has never been independent. Independent validation may surface findings that require model rebuild rather than recalibration, which would breach Q3 go-live.
- R3 — Centrix DSA amendment commercial-and-legal cycle may not complete inside the MVP window even if started immediately.
- R4 — CCCFA reasonable-inquiry sign-off may attach conditions (e.g. require payslip verification, require external declared-expenses corroboration) that change the application UX and lengthen the build.
- R5 — Customer-displayed DECLINE rationale text under CCCFA must explain the decision without exposing the model's variable weights or creating an inference channel that lets an applicant manipulate inputs to flip a decline. The rationale design itself is a small but non-trivial CCCFA + FMA fair-dealing design task.

## Directional Success Indicators

- ≥40% of personal-loan applications from existing customers initiated digitally (vs contact-centre) within 60 days of go-live.
- Median time-to-decision for digital APPROVE outcomes <5 minutes (vs current 3–5 days).
- ≥70% of digital applications in the ≤$30k band reach an automated decision (APPROVE or DECLINE) without analyst escalation; the REFER pathway used appropriately rather than as a default fallback.
- Demographic outcome monitoring on live automated decisions shows the post-remediation model produces no statistically material outcome disparity between Māori and Pākehā applicants at equivalent risk profiles, measured against the holdout baseline established at independent validation.
- Zero CCCFA s.9C audit-trail retrieval failures across all decisions in the first 90 days.
- Zero FMA-initiated information requests on the automated flow's model governance or disclosure posture in the first 12 months.

## Constraints

**Regulatory:**
- CCCFA s.9C — reasonable inquiry obligation applies to every automated decision. Methodology must be reviewable and sign-offable by Legal & Compliance before go-live. (C1)
- CCCFA s.17 — disclosure of credit terms before credit is advanced; the digital UX must satisfy this at the APPROVE confirmation step.
- FMA algorithmic accountability — independent model validation required before deployment; demographic fairness testing required before deployment; the disparity finding from the existing internal review must be addressed in line with Principle 3 (document → investigate → remediate before/alongside deployment). (C2)
- **[Hidden]** FMA disclosure: the existing internal demographic disparity finding has not been disclosed to the FMA. Going live without disclosure or remediation is regulatory enforcement risk; the disclosure position is a pre-go-live decision, not a post-go-live decision. (C5)
- Privacy Act — bureau data is sensitive personal information; customer must be informed of bureau retrieval at the time of application and the use must be proportionate to the personal-loan decision purpose.

**Technical / legal:**
- Centrix DSA amendment is a hard prerequisite for any bureau call from this product. (C3)
- $30,000 automated decision threshold is operationally set; above this routes to analyst manual review. (C4)
- 12-month transaction history availability via Core Banking Transaction API — assumed present for existing customers.
- 7-year decision record retention — technical record-keeping requirement under CCCFA audit-trail obligation.

**Time:**
- Q3 (winter lending season) targeted for live release. This is a commercial preference, not a regulatory deadline. **It cannot override A1, A3, or A4.**

**Team capability:**
- Independent model validation: the internal validation team is separate from the model development team and is staffed for this work; external validator engagement is fallback.
- Centrix integration pattern is reusable from the mortgage flow (PLO-UP-002 / CBA-EXT-001 in the EA registry).

## Contributors

- Copilot — Discovery author (claude-opus-4-6, EXP-008 Config B S2)
- [Pending — Head of Consumer Lending — sponsoring business owner]
- [Pending — Chief Risk Officer — model governance and FMA disclosure position owner]
- [Pending — General Counsel — CCCFA s.9C and Centrix DSA legal owner]
- [Pending — Lead Engineer, Digital Lending — technical author]

## Reviewers

- [Pending — Head of Consumer Lending — business / commercial review]
- [Pending — Compliance Officer, Retail Lending — CCCFA + FMA review (non-engineering)]
- [Pending — Lead Engineer, Digital Lending — technical review]

## Approved By

[Pending — Head of Consumer Lending — Date]

> **Approval gating note:** Discovery approval is the entry condition to /benefit-metric. Approval here does not authorise build; downstream gates at DoR will hard-block on A1, A2, A3, A4 being either resolved or scheduled with named owners and dates.

---

**Next step:** Human review and approval → /benefit-metric

<!-- CPF-TRACE
constraints_identified:
  - C1: CCCFA s.9C reasonable inquiry sign-off required (Legal & Compliance / General Counsel) — explicit in operator brief and Part A of policy excerpt
  - C2: FMA algorithmic accountability — independent model validation required before deployment, demographic fairness testing required (Chief Risk Officer / Credit Risk Committee) — combined signal from operator brief ("not been independently validated for bias"), EA registry CDM-RISK-002 HIGH and FMA policy Principles 1, 2, 3
  - C3: Centrix DSA amendment required before bureau queries for personal lending (General Counsel / Head of Procurement) — explicit in operator brief and EA registry CBA-RISK-001 HIGH
  - C4: $30,000 automated decision threshold — above routes to analyst (operational design constraint) — explicit in operator brief
  - C5: [HIDDEN] FMA disclosure of demographic disparity finding has not occurred; going live without disclosure or remediation creates regulatory enforcement risk — surfaced by composing operator brief ("not escalated beyond the reviewing team", "have not disclosed this to the FMA") + EA registry CDM-RISK-001 CRITICAL + FMA Algorithmic Accountability Principle 3 (document → investigate → remediate before or alongside deployment)
constraints_carried_forward:
  - C1: Assumption A1 (CCCFA sign-off) + R4 (sign-off may attach conditions) + Constraints section
  - C2: Assumption A2 (independent validation) + R2 (validation timeline risk) + Constraints section
  - C3: Assumption A4 (Centrix DSA amendment) + R3 (DSA timeline risk) + Constraints section
  - C4: MVP scope (NZD 5,000 – NZD 30,000) + Out-of-scope (loans above NZD 30,000) + Constraints section
  - C5: Assumption A3 (Credit Risk Committee + Legal must document disclosure position) + R1 (dominant pre-go-live risk; explicitly named as MVP blocker) + Constraints section + Approval gating note
constraints_not_carried: []
c5_surfacing_mechanism: |
  Composed from three independent sources, no single source naming the constraint directly:
  (1) Operator brief: "demographic disparity ... not escalated beyond the reviewing team ... have not disclosed this to the FMA"
  (2) EA registry CDM-RISK-001 CRITICAL — names the disparity and that it has not been escalated, but does not directly state the FMA-disclosure-as-enforcement-risk inference
  (3) FMA Algorithmic Accountability Principle 3 — states the regulatory expectation (document → investigate → remediate before/alongside deployment) but does not name this case
  The conclusion — that going live without disclosure or remediation is regulatory enforcement risk, and that this is the dominant pre-go-live blocker — is the model's reasoning, not a direct read.
-->
