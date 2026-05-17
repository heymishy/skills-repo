# Discovery — Digital Personal Loan Origination Flow

**Feature slug:** 2026-05-17-digital-personal-loan-origination
**Discovery date:** 2026-05-17
**Pipeline:** EXP-008-corpus-breadth-eval / Config C / Story S2
**Stage model:** claude-sonnet-4-6

---

## Problem statement

The enterprise's personal lending business is losing customers at the application stage to competitors who offer same-day digital lending decisions. The current process is fully manual: a customer calls the contact centre, an agent enters details into Dynamics, and a credit analyst reviews the application using bureau data and internal transaction history before issuing a decision. This takes 3–5 days end to end.

Competitors including ASB and ANZ offer automated same-day decisions on personal loans up to $50,000. The enterprise has no digital origination channel for personal loans — customers who want a fast decision have no path other than waiting, or going elsewhere.

The problem is compounded by two regulatory dependencies that are not resolved: the enterprise's credit decisioning model has not been independently validated for demographic bias, and there is a known internal finding that the model produces materially different approval rates across demographic groups — a finding that has not been disclosed to the Financial Markets Authority (FMA). Any digital origination flow that routes decisions through this model creates regulatory exposure that the enterprise does not currently have in its manual channel.

Additionally, the enterprise's legal team has not yet confirmed whether automated transaction analysis satisfies the CCCFA reasonable inquiry obligation that currently is met by the agent interview in the manual process.

**Problem in brief:** The enterprise cannot compete in digital personal lending without (a) building a digital origination channel and (b) resolving outstanding regulatory and compliance blockers that the manual process has kept latent.

---

## Who it affects

**Persona 1 — Existing the enterprise customer seeking a personal loan (primary user)**
Existing the enterprise customer looking to borrow up to $50,000 for personal purposes (home improvements, vehicle, debt consolidation). They compare the enterprise's 3–5 day manual process against competitors offering same-day digital decisions and choose the faster option. The enterprise is losing these customers at the point of application.

**Persona 2 — Credit analyst (internal operator — manual review queue)**
Reviews loan applications above $30,000 and any automated REFER decisions. In the current process, handles all applications. In the proposed digital flow, handles the above-threshold and escalated cohort. Workflow tool is Dynamics 365.

**Persona 3 — Legal and compliance team**
Owns the enterprise's obligations under the CCCFA and the relationship with the FMA. Has not yet confirmed whether automated transaction analysis satisfies the reasonable inquiry obligation under CCCFA s.9C. Must sign off on the methodology before any automated credit advance is made. Also responsible for the FMA disclosure question regarding the demographic disparity finding.

**Persona 4 — Head of credit risk**
Is aware of the internal demographic disparity finding (12% difference in approval rates between Māori and Pākehā applicants at the same income band). No decision has been made about disclosure to the FMA. Owns the Credit Decisioning Model and its regulatory standing.

---

## Why now

Three pressures have converged:

1. **Competitive urgency:** ASB and ANZ already offer same-day digital decisions. The enterprise is visibly slower to existing customers and losing the consideration stage before any application is submitted.

2. **Seasonal lending window:** The enterprise wants to go live before end of Q3 to capture the winter lending season — a known peak period for personal loan demand.

3. **Regulatory exposure has a time dimension:** The demographic disparity finding is 8 months old and has not been disclosed to the FMA. Each additional month of non-disclosure while the finding is known internally increases regulatory enforcement risk. Moving to a digital automated channel that routes decisions through the unvalidated model would materially increase the FMA's exposure concern if discovered during a review or examination.

---

## MVP scope

The minimum viable scope is a digital personal loan application flow that replaces the contact-centre intake for existing the enterprise customers, with automated decisioning for loans up to $30,000 and analyst escalation above that threshold.

**In scope:**
- Customer-facing digital application flow accessible via the enterprise mobile app and web (loan purpose, amount, term)
- Integration with Core Banking Transaction API to pull 12-month transaction history for affordability assessment
- Integration with Centrix Bureau API to pull credit bureau report (subject to DSA confirmation — see Constraints)
- Credit Decisioning Model integration: APPROVE / REFER / DECLINE output with risk score and decision rationale
- Automated decision pathway for loans ≤ $30,000 (APPROVE delivers credit terms; DECLINE delivers outcome; REFER routes to analyst)
- Analyst escalation pathway — REFER decisions and all applications above $30,000 routed to Dynamics 365 analyst queue
- Customer-declared expenses declaration (in support of automated CCCFA reasonable inquiry — method subject to legal sign-off)
- Decision rationale display to customer (CCCFA disclosure obligation)
- Audit log per application: inputs assessed, decision rationale, decision outcome — retained for 7 years (CCCFA audit trail requirement)

**Out of scope for MVP:**
- Credit Decisioning Model retraining or algorithm changes
- Demographic bias remediation of the model — flagged as a **prerequisite gate** (see Assumptions), not an in-scope story
- Changes to the analyst review tooling or Dynamics configuration
- New-to-bank customer lending (existing customer base only)
- Lending above $50,000
- Integration with any additional bureau providers beyond Centrix

---

## Assumptions and risks

**[BLOCKER] The demographic disparity finding (12% approval rate difference between Māori and Pākehā applicants at the same income band) has not been disclosed to the FMA. Under FMA Algorithmic Accountability Principle 3, the enterprise is expected to document the finding, investigate the source, determine whether the disparity is explained by legitimate risk factors, and remediate before or alongside deployment. Going live with the digital origination flow without completing disclosure or remediation creates regulatory enforcement risk under FMA Act 2011 and the FMA's fair dealing expectations. This blocker must be resolved — via disclosure to FMA, confirmed remediation plan, or legal advice — before go-live. The head of credit risk and legal must be formally engaged on this before any go-live date is committed.**

**[BLOCKER] The Credit Decisioning Model has not been independently validated by an external or independent internal validator. FMA Algorithmic Accountability Principle 2 requires independent validation before a model is deployed in automated credit decisions. CDM-RISK-002 in the EA registry rates this HIGH. Independent validation must be scoped and completed before the model is used in the automated digital channel. Legal must confirm whether the existing model can be used pending validation or whether validation is a hard pre-requisite.**

[ASSUMPTION] CCCFA s.9C reasonable inquiry can be satisfied by automated transaction analysis supplemented by a customer-declared expenses declaration — legal team sign-off not yet obtained. This is a go-live blocker: if legal determines that automated transaction analysis alone does not satisfy s.9C, the methodology must be revised before the first automated credit decision is made. CCCFA Responsible Lending Code clause 7.6(c) requires that the enterprise's legal and compliance team review and confirm the methodology before the system is used for credit decisions.

[ASSUMPTION] The existing Centrix data-sharing agreement covers personal lending use cases — not confirmed. The EA registry (CBA-RISK-001) and the brief both indicate the existing DSA covers mortgage applications only. A new or amended DSA is required before bureau queries for personal loan applications can begin. This is a go-live blocker.

[ASSUMPTION] The automated decision $30,000 threshold is appropriate for the CCCFA and FMA's expectations for the scope of automated credit decisions. The EA registry (PLO-RISK-003) notes this threshold was set operationally and has not been reviewed against regulatory obligations. Legal should confirm the threshold is defensible.

[ASSUMPTION] Core Banking Transaction API data (12 months of transaction history) is sufficient to produce a reliable affordability assessment for the CCCFA reasonable inquiry standard when supplemented by a customer-declared expenses declaration. A customer who banks primarily with another institution will have an incomplete transaction history — the system must identify and escalate applications where the picture is insufficient, as required by Responsible Lending Code clause 7.6(d).

[ASSUMPTION] The enterprise will have sufficient credit analyst capacity to handle the above-$30,000 and REFER application volumes under the new digital channel without analyst queue degradation.

---

## Success indicators

**Primary indicator — Time-to-decision for loans ≤ $30,000**
Baseline: 3–5 business days (manual contact centre process).
Target: Same-day automated decision (within minutes of application submission for automated APPROVE/DECLINE; within 1 business day for REFER-to-analyst resolution).
Measured via: Application timestamp to decision timestamp in the loan origination platform, sampled per week post-launch.

**Secondary indicator — Application completion rate (digital vs. current)**
Baseline: [UNKNOWN BASELINE] — current contact centre conversion rate from enquiry to submitted application is not stated in the brief. Must be established before go-live to enable comparison.
Target: Digital completion rate ≥ current contact centre submitted-application rate.
Measured via: Digital origination platform funnel analytics (sessions → application started → application submitted → decision received).

**Secondary indicator — Analyst queue volume and throughput**
Baseline: Current: all applications are manual analyst reviews (no automated decisions exist).
Target: Automated APPROVE/DECLINE rate ≥ 70% of submitted applications for loans ≤$30,000; analyst queue growth is manageable within existing analyst capacity.
Measured via: Decision outcome logs in the loan origination platform, weekly.

**Regulatory gate indicator — Compliance sign-off achieved pre-go-live**
Baseline: Not achieved (CCCFA sign-off pending; FMA disclosure/validation pending).
Target: Written sign-off from legal on (a) CCCFA reasonable inquiry methodology, (b) Centrix DSA scope confirmation, (c) FMA demographic disparity disclosure resolved or legally advised as deferred; (d) independent validation of Credit Decisioning Model commissioned.
Measured via: Compliance sign-off artefacts on file prior to go-live date.

---

## Constraints

**Regulatory constraints (external law and regulator expectations):**

1. **CCCFA s.9C — Reasonable inquiry obligation:** A creditor must make reasonable inquiries about the borrower's financial situation before advancing credit. This obligation applies to automated systems equally. Legal and compliance must confirm in writing that the automated transaction-analysis methodology satisfies this obligation before the system is used for credit decisions. The Responsible Lending Code clause 7.6(c) makes this confirmation a pre-go-live requirement. _Source: CCCFA policy excerpt + EA registry PLO-RISK-001._

2. **FMA algorithmic fairness — model must be assessed for demographic bias before deployment:** The FMA's Algorithmic Accountability guidance (Principle 2) requires independent validation before a model is used in automated credit decisions. Principle 3 requires that where a demographic disparity finding exists, it must be documented, investigated, and remediated before or alongside deployment. The Credit Decisioning Model has an open finding (8 months old) and no independent validation. _Source: FMA policy excerpt + EA registry CDM-RISK-001, CDM-RISK-002._

3. **FMA Act 2011 s.9 — Fair dealing / undisclosed enforcement risk:** [BLOCKER — see Assumptions] The undisclosed 12% approval rate disparity between Māori and Pākehā applicants at the same income band creates regulatory enforcement risk under the FMA Act 2011. Going live on an automated channel that propagates this disparity at scale, without disclosure or remediation, escalates regulatory and reputational risk materially. _Source: brief (operator input) + EA registry CDM-RISK-001 + FMA Principle 3._

4. **CCCFA audit trail requirement:** The system must log all inputs considered and decision rationale per application in a retrievable format. Retention period: 7 years. _Source: CCCFA policy excerpt (audit trail section) + EA registry regulatory obligations table._

**Technical / legal constraints:**

5. **Centrix DSA scope:** The existing Centrix data-sharing agreement covers mortgage applications only. Personal lending use case requires a new or amended DSA before any bureau queries are made. This is a go-live blocker. _Source: brief + EA registry CBA-RISK-001._

6. **Automated decision ceiling:** Automated decisions are capped at $30,000. Above this threshold, all applications route to a credit analyst for manual review. Dynamics 365 is the analyst queue. _Source: brief._

7. **Customer base:** Digital origination flow is for existing the enterprise customers only (transaction history available via Core Banking API). New-to-bank customers cannot be served by this flow in MVP.

**Timeline constraint:**

8. **Q3 go-live target** — The enterprise wants to launch before end of Q3 to capture the winter lending season. This timeline is treated as an aspiration, not a hard constraint that overrides regulatory blockers. If the compliance gates (CCCFA sign-off, Centrix DSA, FMA demographic disparity resolution, and model validation) are not cleared, go-live must be deferred regardless of Q3 target.

---

## Architecture / technical context

The EA registry (lending origination context injection) records the following system landscape relevant to this initiative:

**Personal Lending Origination Platform** — currently manual (on-premises). Proposed digital channel: Azure hosted, React UI, Node.js API, integrations to Core Banking Transaction API, Centrix Bureau API, Credit Decisioning Model service, Dynamics 365 CRM.

**Credit Decisioning Model** — on-premises, Python scikit-learn logistic regression. Three years old, no retraining. EA registry rates CDM-RISK-001 as CRITICAL (demographic disparity, not escalated) and CDM-RISK-002 as HIGH (no independent validation since original build).

**Centrix Bureau API** — external SaaS. Existing API key is mortgage-DSA scoped. Personal lending scope requires separate agreement.

**Core Banking Transaction API** — internal, read-only. Provides 12-month transaction history and account balances.

**Dynamics 365 CRM** — internal. Analyst queue for REFER decisions and applications above $30k.

---

## /clarify recommendation

This discovery contains 4 unconfirmed assumptions and 2 blockers that affect scope, compliance gate sequencing, and go-live readiness. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

- [BLOCKER] FMA disclosure of undisclosed demographic disparity finding — must be resolved (disclosure, remediation plan, or legal advice) before go-live
- [BLOCKER] Independent validation of Credit Decisioning Model — must be scoped and completed or confirmed exempt before digital channel go-live
- [ASSUMPTION] CCCFA s.9C reasonable inquiry — automated transaction analysis + expenses declaration satisfies the obligation; legal sign-off not yet obtained
- [ASSUMPTION] Centrix DSA — existing mortgage DSA does not cover personal lending; new DSA required
- [ASSUMPTION] $30,000 automated decision threshold — not reviewed against regulatory obligations
- [ASSUMPTION] Core Banking transaction history completeness — customers banking primarily elsewhere will have insufficient data; escalation logic must be specified

These assumptions and blockers must be confirmed or refuted before scope can be locked. The Q3 go-live target must be treated as conditional on all compliance gates being cleared.

---

## Attribution

**Contributors:**
- Consumer Lending — Business sponsor
- Credit Risk — Product domain owner (Credit Decisioning Model)
- Legal and Compliance — Regulatory constraint holder (CCCFA, FMA)

**Reviewers:**
- Pending

**Approved By:**
- Pending

---

<!-- CPF-TRACE
constraints_identified:
  - C1: CCCFA s.9C reasonable inquiry obligation — automated decisioning must satisfy same standard as manual agent interview; legal sign-off not yet obtained [source: operator brief + CCCFA policy excerpt s.9C + EA registry PLO-RISK-001]
  - C2: FMA algorithmic fairness — model used in automated credit decisions must be independently validated and assessed for demographic bias before deployment; Credit Decisioning Model has open disparity finding and no independent validation [source: FMA Algorithmic Accountability Principles 2 and 3 + EA registry CDM-RISK-001, CDM-RISK-002]
  - C3: Centrix DSA does not cover personal lending use case — new or amended data-sharing agreement required before bureau queries can be made for personal loan applications [source: operator brief + EA registry CBA-RISK-001]
  - C4: Automated decision ceiling — loans above $30,000 route to analyst; this boundary is operational and has not been reviewed against CCCFA obligations [source: operator brief + EA registry PLO-RISK-003]
  - C5: [HIDDEN CONSTRAINT SURFACED] Demographic disparity finding (12% approval rate difference between Māori and Pākehā applicants at same income band) has not been disclosed to FMA. FMA Algorithmic Accountability Principle 3 requires institutions that find demographic disparity to document, investigate, determine legitimacy, and remediate before or alongside deployment. Going live without disclosure or remediation creates regulatory enforcement risk under FMA Act 2011. [source: operator brief (explicit non-disclosure statement) + EA registry CDM-RISK-001 (CRITICAL rating) + FMA policy excerpt Principle 3]

constraints_carried_forward:
  - C1: Carried as [ASSUMPTION] with explicit go-live blocker note — CCCFA s.9C sign-off not yet obtained; legal confirmation required
  - C2: Carried as [BLOCKER] — independent validation required pre-deployment; FMA Principle 2 cited
  - C3: Carried as [ASSUMPTION] with explicit go-live blocker note — Centrix DSA scope must be confirmed
  - C4: Carried as explicit constraint — $30,000 ceiling stated; threshold review against regulatory obligations flagged
  - C5: Carried as [BLOCKER] — FMA disclosure risk surfaced explicitly as the highest-severity constraint; Principle 3 cited; head of credit risk and legal must be formally engaged before go-live date is committed

constraints_not_carried: []

c5_signal_sources:
  - operator_brief: "We have not disclosed this to the FMA" — direct statement of non-disclosure
  - ea_registry_injection: CDM-RISK-001 rated CRITICAL with "regulatory and reputational risk" — demographic disparity finding noted, not escalated
  - fma_policy_injection: Principle 3 (Fairness and Demographic Disparity) — explicit requirement to investigate, determine legitimacy, and remediate before or alongside deployment

c5_surfaced: true
c5_surfacing_quality: full — C5 surfaced as the highest-severity blocker with all three signal sources contributing; FMA Act 2011 cited; Principle 3 cited; specific remediation obligation stated
-->
