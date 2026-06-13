I'll read the product context and reference materials before starting.

No `product/` directory context files are present in this session, and no reference corpus exists for this feature. I'll proceed with the input as provided.

Before I draft any section, I need to flag something the operator input states that I cannot let pass without surfacing explicitly.

---

> **A regulatory constraint requires attention before I can accurately scope this discovery.**
>
> The operator input states: *"No regulatory approval is anticipated. This is a model update, not a new product."*
>
> Under the organisational context for this registered NZ bank, that characterisation requires direct challenge. **CPG 220** (the current de facto model risk management standard, applied by RBNZ pending BS2B) establishes that:
>
> - AI/ML models used in **credit decisioning** must undergo **independent model risk validation** before production activation.
> - A model that has not completed validation **must not** be used in live customer-facing credit decisions — this is a **hard go-live gate**, not a documentation preference.
> - Board-level accountability applies: validation sign-off for material credit models cannot be delegated below **Chief Risk Officer level**.
>
> The internal MRM committee review described in the input may or may not satisfy the CPG 220 independent validation requirement depending on whether the MRM committee constitutes an *independent* validator under the standard, and whether the sign-off chain reaches CRO level. This cannot be assumed — it must be confirmed.
>
> Additionally, under **CCCFA**, this model governs credit limit increases on consumer credit accounts. Credit records touched by this model change must remain auditable and retainable for **7 years from contract end** — the retrained model's decisioning logic and the training dataset used must be documented and retained accordingly.
>
> I'll surface both of these as `[ASSUMPTION]` items and include a `/clarify` recommendation, but I want to make sure the operator is aware *before* the artefact is drafted that the "no regulatory approval anticipated" framing may need revision.
>
> I'll now proceed through the discovery sections.

---

## Step 1 — Problem Statement

The operator input is substantive. I have enough to write this section directly.

**Problem Statement (draft):**
The credit limit increase recommendation model for enterprise credit card accounts has experienced material performance drift since deployment approximately two years ago. The Gini coefficient has declined from 0.71 at deployment to 0.63 on a recent holdout evaluation — a degradation the credit risk team attributes to post-COVID shifts in customer spending and repayment behaviour. A model operating at 0.63 Gini is generating credit limit recommendations with materially lower discriminatory power than the model was designed to deliver, increasing the risk of limit increases being extended to customers who will not perform well, or withheld from customers who would. Retraining on a fresh 24-month transaction window has been completed offline and is expected to restore Gini to approximately 0.71 or better.

---

## Step 2 — Who It Affects

From the input I can identify:

- **Credit risk team** — owns the model, monitors performance, initiated retraining
- **Enterprise credit card customers** — receive (or don't receive) limit increase offers based on model output; affected by both false positives (limit increases to customers who will underperform) and false negatives (limit increases withheld from customers who would perform well)
- **MRM committee** — governance gate owner
- **CRO / Board** — CPG 220 accountability chain (surfaced above)

I'll write this section with these personas but flag that the operator input does not describe the customer-facing experience in any detail.

---

## Step 3 — Why Now

Clear from input: model performance has drifted to a level the credit team considers materially degraded (0.63 Gini vs 0.71 at deployment). The trigger is the holdout evaluation result, not a scheduled refresh cycle. The 12-week target is operator-set.

---

## Step 4 — MVP Scope

The operator has provided a clear bounded scope: retrain the existing model on a 24-month transaction window, pass MRM review, integration test in staging, deploy to production. No change to decision thresholds, product terms, or model architecture. I'll write this as stated and flag the CPG 220 assumption against it.

---

## Step 5 — Out of Scope

From the input: no change to decision thresholds, no change to lending product terms, no new product. I'll add the two items explicitly and prompt for confirmation.

---

## Step 6–8 — Assumptions, Success Indicators, Constraints

I have enough to write all three sections. Multiple `[ASSUMPTION]` lines will be generated, triggering the `/clarify` block.

---

I now have everything I need to produce the full artefact. Here it is:

---

# Discovery Artefact

**Feature:** Credit Limit Increase Model Retraining — Enterprise Credit Card
**Status:** Draft
**Date:** 2025-07-15
**Pipeline stage:** Discovery

---

## Problem Statement

The credit limit increase (CLI) recommendation model for enterprise credit card accounts has experienced material performance drift since its deployment approximately two years ago. The model's Gini coefficient has declined from **0.71 at deployment to 0.63** on a recent holdout evaluation. The credit risk team attributes this degradation to post-COVID shifts in customer spending and repayment behaviour that were not represented in the original training data.

A Gini of 0.63 means the model's ability to discriminate between customers who will perform well under a higher limit and those who will not has materially weakened relative to the standard the business accepted at deployment. This creates two categories of ongoing harm: limit increases extended to customers who will underperform (credit loss exposure), and limit increases withheld from customers who would have performed well (revenue and customer experience cost).

Retraining on a fresh 24-month transaction window has been completed offline. The retrained model achieves a Gini of approximately 0.71 on holdout evaluation, restoring discriminatory performance to original deployment standards. The remaining work is governance review, integration testing, and production deployment.

---

## Personas

**1. Credit Risk Analyst / Model Owner (Credit Risk Team)**
- Monitors model performance metrics on an ongoing basis
- Identified the Gini degradation through holdout evaluation
- Completed the retraining and offline evaluation work
- Responsible for MRM submission package preparation
- Pain: operating with a model known to be underperforming; cannot act on the retrained model until governance gates are cleared

**2. Enterprise Credit Card Customer (existing account holder)**
- Receives — or does not receive — a credit limit increase offer based on the model's recommendation
- Not aware of the model; experiences the outcome as a credit decision
- Affected by both under-offering (missed limit increase they would have managed well) and over-offering (limit increase accepted, leading to financial stress)
- Post-COVID behaviour patterns mean the current model's predictions are less well-calibrated to their actual current repayment and utilisation profile

**3. MRM Committee Member**
- Governance gate owner for model changes
- Meets bi-monthly; next slot approximately 8 weeks away
- Reviews model documentation, validation evidence, fairness assessment, and backtesting before approving production promotion
- Under CPG 220, the committee's independence and sign-off chain relative to CRO-level accountability must be confirmed (see Assumptions)

**4. Chief Risk Officer (CRO)**
- Under CPG 220, cannot delegate below CRO level for material credit model validation sign-off
- May or may not be formally in the MRM committee sign-off chain — this is unconfirmed (see Assumptions)

---

## Why Now

The holdout evaluation result is the immediate trigger: a Gini decline from 0.71 to 0.63 crosses a threshold the credit risk team considers material. This is not a scheduled refresh; it is a response to measured performance degradation. The 12-week production target is operator-set and driven by the desire to restore model performance before further drift occurs. The retraining and offline evaluation work is already complete, reducing delivery risk for the remaining steps.

---

## MVP Scope

**In scope:**
- Deployment of the retrained credit limit increase recommendation model to production, replacing the current production model
- Retraining uses the same model architecture as the current production model, trained on a fresh 24-month transaction window of transaction behaviour, repayment history, and utilisation patterns
- MRM committee review and approval (next slot, approximately 8 weeks)
- Integration testing in staging environment
- Production deployment
- No change to decision thresholds
- No change to credit card product terms or lending criteria

**Explicitly deferred (not MVP):**
- Model architecture changes or feature engineering enhancements beyond the training data refresh
- Automated model monitoring or drift-detection infrastructure (not mentioned; deferred unless confirmed in scope)
- Any expansion of the CLI recommendation capability to new account types or products

---

## Out of Scope

1. **Decision threshold changes** — The approval/decline and limit-sizing thresholds are unchanged. This is a model weight update only. Any threshold review is a separate initiative requiring its own credit policy sign-off.
2. **Credit product term changes** — No changes to interest rates, fees, minimum payments, or any other contractual terms governing the enterprise credit card product.
3. **New account types or segments** — The retrained model covers the same enterprise credit card account population as the current model. Extension to other account types (personal cards, SME, etc.) is out of scope.
4. **Model architecture redesign** — Feature set and model architecture are unchanged. Architectural changes would require a separate discovery and a full new-model MRM submission rather than a model update submission.

---

## Assumptions and Risks

**Governance and regulatory assumptions:**

> [ASSUMPTION] The internal MRM committee review constitutes "independent model risk validation" as required under CPG 220 — unconfirmed, requires /clarify before scope is locked. If the MRM committee is not structured to satisfy CPG 220's independence requirement, a separate independent validation step is required before production deployment. This would affect the 12-week timeline.

> [ASSUMPTION] The MRM committee sign-off chain includes or reaches CRO level as required under CPG 220 for material credit models — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] "No regulatory approval is anticipated" is accurate — unconfirmed in the context of RBNZ expectations for model changes affecting consumer credit decisioning, requires /clarify before scope is locked. RBNZ does not have a formal pre-approval process for individual model updates, but if RBNZ has previously been notified of this model's existence or if the CLI capability is referenced in any BS11 notification or outsourcing arrangement, a change notification obligation may exist.

> [ASSUMPTION] The demographic disparity assessment conducted satisfies the fairness documentation requirements of the MRM committee submission — confirmed by operator for the retrained model's disparity profile, but the sufficiency of the methodology for MRM purposes is unconfirmed.

**Data and retention assumptions:**

> [ASSUMPTION] The retrained model's training dataset, feature definitions, hyperparameters, and decisioning logic will be documented and retained in a form that satisfies CCCFA 7-year auditability requirements for consumer credit decisions — unconfirmed, requires /clarify before scope is locked. CCCFA requires that credit contract records and responsible lending assessments be retainable for 7 years from contract end; model documentation underpinning automated credit decisions is part of that audit trail.

> [ASSUMPTION] The 24-month training window data used for retraining has been sourced, processed, and governed in accordance with the bank's data handling policies and any applicable privacy obligations — unconfirmed, requires /clarify.

**Timeline assumptions:**

> [ASSUMPTION] The MRM committee will review and approve the submission in a single meeting cycle (approximately 2 weeks after the 8-week submission window) — unconfirmed. The operator notes this is anticipated based on three prior submissions; however, a first-time-through assumption is embedded in the 12-week target.

> [ASSUMPTION] The staging integration test can be completed within the time remaining after MRM approval (approximately 2 weeks) — unconfirmed, depends on staging environment availability and test scope.

**Risks:**

- **CPG 220 hard gate risk:** If the MRM committee review does not satisfy CPG 220's independent validation requirement, the model cannot go to production. This is not a documentation risk — it is a go-live blocking condition. The 12-week target does not account for a separate independent validation cycle if required.
- **Timeline compression risk:** The 12-week target leaves approximately 2 weeks after MRM approval for integration testing and deployment. Any MRM feedback requiring model revision or additional documentation would collapse this window.
- **Fairness methodology sufficiency risk:** The operator reports the retrained model shows no regression on the internal disparity metric. The MRM committee may require additional fairness analysis (e.g. intersectional analysis, adverse action rate review) beyond the single metric reported. This is unconfirmed.
- **CCCFA audit trail risk:** If the bank's model documentation and retention practices do not explicitly cover the automated credit decisioning audit trail, a gap may exist that is not visible until an audit or complaint investigation.

---

## Success Indicators

**Primary performance indicator — Gini coefficient restoration:**
- Baseline: 0.63 (current production model, recent holdout evaluation)
- Target: ≥ 0.71 (retrained model offline evaluation result; to be confirmed on post-deployment monitoring)
- Measured by: holdout evaluation at deployment; ongoing model performance monitoring cadence (monitoring cadence is `[UNKNOWN BASELINE]` — not specified in operator input)

**Secondary indicator — CLI offer rate stability:**
- Baseline: `[UNKNOWN BASELINE]` — current production CLI offer rate not provided in operator input
- Target: CLI offer rate remains within an acceptable range relative to current production (no material unexplained shift in approval volumes)
- Measured by: post-deployment reporting from the credit risk team, first 30 and 90 days post-deployment

**Governance indicator — MRM approval without material remediation:**
- Baseline: Three prior model submissions approved in a single cycle (operator-reported)
- Target: MRM submission approved in the next available committee slot without requiring a re-submission cycle
- Measured by: MRM committee outcome record

**Risk indicator — post-deployment performance monitoring:**
- Baseline: `[UNKNOWN BASELINE]` — no current monitoring cadence or alert threshold specified
- Target: Gini coefficient remains ≥ 0.68 at first scheduled post-deployment evaluation (indicative; to be set by credit risk team)
- Measured by: post-deployment holdout evaluation at a cadence to be confirmed with the credit risk team

---

## Constraints

- **CPG 220 (APRA Prudential Practice Guide — Model Risk Management):** Independent model risk validation is required before production activation of a material credit model. CRO-level sign-off cannot be delegated. This is a hard go-live gate. *Whether the internal MRM committee satisfies this requirement is an unconfirmed assumption — see Assumptions.*
- **CCCFA (Credit Contracts and Consumer Finance Act 2003):** Credit records and responsible lending documentation must be retained for 7 years from contract end. Model documentation underpinning automated credit limit decisions is part of this audit trail. *Whether current documentation practices satisfy this for the retrained model is an unconfirmed assumption — see Assumptions.*
- **Internal MRM governance process:** MRM committee review required before any model change goes to production. Committee meets bi-monthly; next slot approximately 8 weeks away.
- **12-week production target:** Operator-set hard target. Contains limited float given the 8-week MRM submission window and the integration test requirement.
- **Model architecture unchanged:** The retrained model uses the same architecture and feature set as the current production model. Any architectural change is explicitly out of scope and would require a separate MRM submission track.

---

## /clarify recommendation

This discovery contains **7 unconfirmed assumptions** that affect scope, governance compliance, and the validity of the 12-week timeline. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. `[ASSUMPTION]` The internal MRM committee review constitutes "independent model risk validation" as required under CPG 220 — unconfirmed, requires /clarify before scope is locked.
2. `[ASSUMPTION]` The MRM committee sign-off chain includes or reaches CRO level as required under CPG 220 for material credit models — unconfirmed, requires /clarify before scope is locked.
3. `[ASSUMPTION]` "No regulatory approval is anticipated" is accurate in the context of RBNZ expectations for model changes affecting consumer credit decisioning — unconfirmed, requires /clarify before scope is locked.
4. `[ASSUMPTION]` The demographic disparity assessment methodology is sufficient for the MRM committee submission requirements — unconfirmed, requires /clarify before scope is locked.
5. `[ASSUMPTION]` The retrained model's training dataset, feature definitions, hyperparameters, and decisioning logic will be documented and retained in a form satisfying CCCFA 7-year auditability requirements — unconfirmed, requires /clarify before scope is locked.
6. `[ASSUMPTION]` The 24-month training window data has been sourced and governed in accordance with the bank's data handling and privacy obligations — unconfirmed, requires /clarify.
7. `[ASSUMPTION]` The MRM committee will review and approve the submission in a single cycle, and the staging integration test can be completed within approximately 2 weeks after approval — unconfirmed; the 12-week target depends on both being true simultaneously.

**These assumptions must be confirmed or refuted before scope can be locked.** Running `/benefit-metric` with assumptions 1–3 unresolved means the go-live gate conditions are undefined. Running it with assumption 5 unresolved means the audit trail obligations for the decisioning system are undefined.

---

## Attribution

**Contributors:**
- [Name — Role — Date: to be populated]

**Reviewers:**
- Pending

**Approved By:**
- Pending

> ⚠️ The Approved By field must be populated before this discovery is submitted to the Definition of Ready gate. A non-engineering approver is expected for governance attribution. Leaving this field empty will result in a H-GOV hard block at Definition of Ready.

---

## Approval gate

**Discovery draft complete ✓**

Given the 7 unconfirmed assumptions — three of which directly concern whether the bank's governance process satisfies CPG 220's hard go-live gate conditions — I strongly recommend running **/clarify** before progressing.

The specific risk of skipping /clarify here is not documentation quality. It is that the operator has stated "no regulatory approval is anticipated" in a context where CPG 220 establishes a hard production gate that the internal MRM committee may or may not satisfy as currently structured. If that assumption is wrong, the 12-week target is not achievable regardless of how well the retraining work has been done.

How do you want to proceed?
1. **Run /clarify now** (strongly recommended)
2. **Review and approve without /clarify** — skip to sign-off

Reply: `1` or `2`

---

**Before we move to /benefit-metric:**
Run `/estimate` to record a rough focus-time forecast for this feature. This gives us a Phase 1 baseline for calibration at /improve.
Reply: `/estimate` — or `skip` to continue without an estimate

---

*Pipeline state will be updated to `stage: discovery`, `health: green`, `regulated: true`, `complianceProfile: "regulated"`, `complianceFrameworks: ["CPG_220", "CCCFA"]` upon approval. Config governance gates from context.yml will be written to pipeline-state.json. Guardrails seeded: CF-CPG_220, CF-CCCFA.*

<!-- eval-mode: true -->