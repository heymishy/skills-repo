

# Discovery Report: Digital Personal Loan Origination

## Programme Overview

**Initiative:** Digitise the personal loan application journey for existing customers
**Sponsor:** Personal Lending Team
**Discovery Date:** [Current Date]
**Status:** Significant blockers identified — not ready to proceed to delivery

---

## 1. Problem Statement

The current personal loan application process is manual, slow, and competitively disadvantaged:

- **Current state:** Customer calls contact centre → agent enters details into Dynamics → credit analyst manually reviews using bureau data and transaction history → decision rendered
- **Current turnaround:** 3–5 days end to end
- **Competitive pressure:** ASB and ANZ offer same-day digital decisions; customers are abandoning applications mid-process
- **Target state:** Digital self-service flow via mobile and web with automated decisioning for loans ≤$30K and analyst routing for loans >$30K

---

## 2. Proposed Solution Summary

| Component | Description |
|---|---|
| **Customer interface** | Mobile app and web application flow capturing loan purpose, amount, and term |
| **Data inputs** | Internal transaction history from core banking system, Centrix credit bureau report, internal risk scorecard |
| **Automated decisioning** | Loans ≤$30,000 receive an automated approve/decline/refer decision |
| **Manual pathway** | Loans >$30,000 routed to credit analyst for manual review |
| **Target go-live** | End of Q3 (winter lending season) |

---

## 3. Stakeholders Identified

| Stakeholder | Role in Initiative | Discovery Input Needed |
|---|---|---|
| Personal Lending Team | Business sponsor and product owner | Business rules, lending policy, conversion targets |
| Legal & Compliance | Regulatory sign-off | CCCFA obligations, responsible lending confirmation, FMA disclosure |
| Credit Risk | Scorecard ownership, decisioning model | Model validation, bias remediation, threshold calibration |
| Technology / Engineering | Build and integration | Core banking API, Centrix integration, mobile/web platform |
| Contact Centre Operations | Impacted by channel shift | Transition plan, fallback process, manual review workflow |
| Data & Analytics | Model governance, MI/reporting | Model monitoring, fairness metrics, ongoing reporting |
| Information Security | Data protection | PII handling, consent, bureau data storage |
| Customer Experience | Journey design | UX research, accessibility, customer communication |
| FMA (external) | Regulator | Disclosure obligations, supervisory expectations |
| Centrix (external) | Bureau data provider | API contract, SLAs, data freshness, consent model |

---

## 4. Key Assumptions

| # | Assumption | Risk if Wrong |
|---|---|---|
| A1 | Existing customers have sufficient transaction history in core banking to support affordability assessment without a manual interview | We cannot satisfy CCCFA reasonable inquiry obligations digitally |
| A2 | The internal risk scorecard is fit for use in an automated decisioning context | Regulatory, legal, and fairness exposure |
| A3 | Centrix API integration can be delivered within the Q3 timeline | Dependency on third-party contracting and technical readiness |
| A4 | Legal will confirm a compliant digital substitute for the agent interview | Without this, the automated flow cannot lawfully originate loans |
| A5 | The $30K automated threshold is within risk appetite | Credit losses may exceed expectations if threshold is miscalibrated |
| A6 | The mobile app platform can support a multi-step application flow with real-time integrations | May require platform uplift that extends timeline |

---

## 5. Critical Blockers

I have identified three issues that must be resolved before this initiative should proceed to delivery. I want to be direct: these are not risks to be monitored — they are blockers.

---

### BLOCKER 1: Credit Decisioning Model — Unresolved Bias and No Independent Validation

**What we know:**
- The credit decisioning model has never been independently validated for bias.
- An internal review 8 months ago found statistically different approval rates across demographic groups.
- This finding was not escalated beyond the reviewing team.
- This has not been disclosed to the FMA.

**Why this blocks delivery:**

Deploying this model into an automated decisioning flow — where it will make approve/decline decisions at scale without human review for loans up to $30,000 — fundamentally changes the risk profile of the existing bias issue. In the current manual process, a credit analyst applies judgement to every application. In the proposed flow, the model *is* the decision-maker for the majority of applications. Every biased decision becomes an automated biased decision, at volume, with an audit trail.

This is not a technical debt item to remediate later. This is a conduct risk issue that exists today and that automation will amplify.

**What must happen:**

1. **Immediate escalation.** The internal review finding from 8 months ago must be escalated to the Chief Risk Officer and Head of Compliance now, regardless of whether this digital initiative proceeds. This is not contingent on the project. The finding exists independently and should have been escalated when it was identified.

2. **Independent model validation.** The scorecard must undergo independent validation for bias and fairness before it is used in any automated decisioning context. This validation should assess disparate impact across protected demographic groups and confirm whether differential approval rates are explainable by legitimate creditworthiness factors or reflect proxy discrimination.

3. **FMA disclosure assessment.** Legal and Compliance must assess whether the existing finding triggers a disclosure obligation to the FMA. I am not in a position to make that legal determination, but I am flagging clearly that a known, undisclosed, unresolved bias finding in a credit model is a material conduct risk — and that deploying the model into an automated channel without addressing it would compound that risk significantly.

4. **Fairness criteria defined.** Before the model is approved for automated use, the organisation must define what fairness means in this context — equal approval rates, equal false-positive rates, or another standard — and confirm the model meets that standard.

**My recommendation:** This initiative must not go live with automated decisioning until the model has been independently validated and the bias finding has been resolved, escalated, and (if required) disclosed. If the Q3 timeline cannot accommodate this, the timeline must move — not the validation.

---

### BLOCKER 2: Responsible Lending Obligations — No Confirmed Legal Basis for Digital Fulfilment

**What we know:**
- Under the CCCFA, we are required to make reasonable inquiries about a borrower's financial situation before advancing credit.
- We currently satisfy this obligation through a manual agent interview in the contact centre.
- The proposed digital flow eliminates the agent interview for loans ≤$30K.
- The legal team has not yet confirmed how the automated flow will satisfy the same obligation.

**Why this blocks delivery:**

You cannot build an application flow that originates loans without knowing whether it is lawful to originate loans through that flow. This is not a detail to be confirmed during build — it is a prerequisite to solution design.

The CCCFA reasonable inquiry obligation is not a formality. It requires the lender to make inquiries that are reasonable in the circumstances about the borrower's requirements, objectives, and financial situation. The question is whether pulling transaction history and bureau data — without any interactive inquiry — constitutes "reasonable inquiries" under the Act.

There are plausible paths forward: transaction categorisation as evidence of income and expenses, pre-population of financial summaries for customer confirmation, or a digital questionnaire step. But until Legal confirms which path is compliant, the solution design is speculative.

**What must happen:**

1. **Legal opinion.** Obtain a written legal opinion from the legal team (or external counsel if needed) confirming what constitutes reasonable inquiry in a fully digital, non-interactive loan origination flow for existing customers.

2. **Design constraints.** The legal opinion must be specific enough to define solution design constraints — for example, whether the customer must actively confirm an affordability summary, whether a minimum set of questions must be asked, and whether transaction data analysis alone is sufficient.

3. **Precedent review.** Review how ASB and ANZ (who already have digital origination) satisfy CCCFA obligations in their flows, to calibrate our approach against market practice and regulator expectations.

**My recommendation:** Solution design for the application flow cannot be finalised until the legal opinion is received. UX and technical discovery can proceed in parallel on other components, but the core origination flow depends on this input.

---

### BLOCKER 3: The Q3 Deadline Is Incompatible with the Current State of Readiness

**What we know:**
- The business wants to go live before end of Q3 to capture winter lending season.
- The credit model has not been validated for automated use.
- Legal has not confirmed the compliance approach.
- Centrix integration has not been scoped or contracted.
- No UX research or design has been referenced.

**Why this blocks delivery:**

The Q3 target was set against a commercial objective (winter lending season) without accounting for the actual state of readiness. The two blockers above — model validation and legal confirmation — each carry timelines that are not within the delivery team's control. Independent model validation typically takes 6–10 weeks. Legal opinions on novel compliance questions take 2–6 weeks. Neither has started.

Committing to a Q3 go-live creates pressure to shortcut the model validation or to proceed without legal confirmation. Both of those outcomes are unacceptable. Going live with a biased, unvalidated model and an unconfirmed legal basis for lending is not a calculated risk — it is a conduct and regulatory failure that will cost materially more than a missed lending season.

**What must happen:**

1. **Decouple the deadline from the blockers.** The Q3 date should be treated as an aspiration, not a constraint. The constraint is: we go live when the model is validated, bias is remediated, legal has confirmed the compliance approach, and the solution has been tested.

2. **Explore phased delivery.** If there is commercial urgency, consider a phased approach:
   - **Phase 1 (Q3 candidate):** Digital application capture only — customer submits application via app/web, but decisioning remains with the credit analyst. This digitises the front door without automating the decision. It eliminates the contact centre call, reduces turnaround from 3–5 days to potentially 1–2 days, and captures customer intent digitally.
   - **Phase 2 (post-validation):** Automated decisioning for loans ≤$30K, deployed once the model is validated, bias is resolved, and legal has confirmed the compliance path.

3. **Reset stakeholder expectations.** The personal lending team needs to understand that the blockers are not delivery obstacles — they are governance obligations. The framing should not be "delivery is slow" but "we discovered we have unresolved conduct risk that must be addressed before we automate."

---

## 6. Risks (Beyond Blockers)

| # | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R1 | Centrix API integration takes longer than expected due to contracting or technical complexity | Medium | High — blocks automated bureau pull | Begin Centrix engagement immediately; identify fallback (manual bureau pull with digital submission) |
| R2 | Core banking system cannot expose transaction data via a performant, real-time API | Medium | High — blocks affordability assessment | Conduct technical spike on core banking integration in first two weeks of delivery |
| R3 | Customer drop-off in digital flow is high due to poor UX or friction from compliance steps | Medium | Medium — undermines business case | Invest in UX research and prototype testing before build |
| R4 | Automated decisioning increases credit losses due to removal of analyst judgement | Medium | High — direct financial impact | Define monitoring framework pre-launch; set conservative initial thresholds; implement post-decision sampling |
| R5 | Contact centre staff resistance or confusion during transition | Low | Medium — operational disruption | Change management plan, clear cutover process, retain manual pathway |
| R6 | Model drift over time produces degraded or biased outcomes post-launch | Medium | High — ongoing conduct risk | Implement ongoing model monitoring with fairness metrics, scheduled periodic revalidation |

---

## 7. Open Questions

| # | Question | Owner | Needed By |
|---|---|---|---|
| Q1 | What constitutes "reasonable inquiry" under CCCFA in a digital-only origination flow? | Legal | Before solution design begins |
| Q2 | Has the 8-month-old bias finding been escalated to CRO and Compliance? | Credit Risk / Compliance | Immediately |
| Q3 | Does the bias finding trigger an FMA disclosure obligation? | Legal / Compliance | Within 2 weeks |
| Q4 | What is the Centrix API contract status — do we have an existing agreement, or does this need procurement? | Technology / Procurement | Within 2 weeks |
| Q5 | What core banking APIs exist for transaction history retrieval, and what are their performance characteristics? | Technology | Within 2 weeks |
| Q6 | What is the current false-positive and false-negative rate of the risk scorecard? | Credit Risk | Before model validation scope is defined |
| Q7 | What customer authentication model will be used for the digital flow (existing app auth, step-up, etc.)? | Information Security | Before solution design |
| Q8 | Has a Data Protection Impact Assessment been considered for automated credit decisioning using personal financial data? | Privacy / Legal | Before build |
| Q9 | What is the fallback experience if Centrix or core banking integrations are unavailable at runtime? | Technology / Product | During solution design |
| Q10 | Who is accountable for the decisioning model in an automated context — Credit Risk, or the product team? | Executive sponsor | Before delivery begins |

---

## 8. Recommended Next Steps

| Priority | Action | Owner | Timeframe |
|---|---|---|---|
| **1 — Immediate** | Escalate the credit model bias finding to CRO and Head of Compliance | Credit Risk lead | This week |
| **2 — Immediate** | Commission legal opinion on CCCFA reasonable inquiry obligations for digital origination | Legal team | Initiate this week, target opinion within 3 weeks |
| **3 — Urgent** | Commission independent validation of credit decisioning model for bias and fitness for automated use | Credit Risk + external validator | Initiate within 2 weeks |
| **4 — Urgent** | Assess FMA disclosure obligation in relation to the bias finding | Legal / Compliance | Within 2 weeks |
| **5 — Near-term** | Begin technical discovery: core banking API, Centrix integration, mobile/web platform readiness | Technology team | Initiate this week (can proceed in parallel) |
| **6 — Near-term** | Propose phased delivery plan (Phase 1: digital capture; Phase 2: automated decisioning) to sponsor | Product / Delivery lead | Within 2 weeks |
| **7 — Near-term** | Conduct UX discovery: customer research, journey mapping, prototype design | CX / Design team | Initiate within 2 weeks |
| **8 — Near-term** | Define model monitoring and fairness reporting framework for ongoing governance | Data & Analytics + Credit Risk | Before Phase 2 build |

---

## 9. Summary Position

This is a sound initiative with clear commercial logic. The current process is slow, manual, and losing customers to competitors who have already digitised. The proposed solution architecture — digital capture, automated data assembly, risk scoring, and tiered decisioning — is the right direction.

However, the initiative has surfaced a pre-existing conduct risk that is serious and unresolved. The credit decisioning model has a known, documented bias issue that was identified eight months ago, was not escalated, and has not been disclosed to the regulator. Proceeding to automate decisions using this model — at scale, without human review — would materially increase the organisation's regulatory and conduct exposure.

Separately, the legal basis for the core function of the product — originating loans digitally without a manual interview — has not been confirmed.

These are not items that can be resolved during a delivery sprint. They are prerequisites. The responsible path is to begin the work that can proceed in parallel — technical integration discovery, UX research, phased delivery planning — while resolving the blockers on a track that is governed by their actual complexity, not by a commercial deadline.

The Q3 deadline should be reframed. A phased approach that delivers digital application capture in Q3 and automated decisioning post-validation is both commercially viable and responsible. Going live with automated decisioning before the model is validated and the legal basis is confirmed is a decision I would recommend against in the strongest terms.

---

*This discovery report is intended to provide an honest assessment of readiness. It identifies opportunities to move forward and obligations that must be met before doing so. The blockers documented here are raised in good faith and in the interest of the programme, the organisation, and the customers who will be affected by the decisions this system makes.*