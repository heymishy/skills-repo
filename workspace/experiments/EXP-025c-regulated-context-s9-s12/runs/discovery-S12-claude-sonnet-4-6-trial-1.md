I've read the organisational context, including the full NZ regulatory framework. This is a regulated environment — registered bank, RBNZ primary supervisor, CCCFA in scope for consumer credit, CPG 220 as the model risk management standard. Several obligations are triggered by this brief that the operator has not addressed. I'll surface them fully in the artefact.

The input is specific enough to proceed directly to artefact production (eval mode: single_turn).

---

# Discovery Artefact

**Feature:** Credit Risk Model Retrain — Enterprise Credit Card Automatic Limit Increase
**Slug:** `2025-01-31-credit-risk-model-retrain-enterprise-cli`
**Status:** Draft — Pending Approval
**Date:** 2025-01-31
**Pipeline stage:** Discovery

---

## Problem Statement

The credit risk model powering automatic credit limit increase (CLI) recommendations for enterprise credit card accounts has experienced material performance drift since deployment approximately two years ago. The Gini coefficient has declined from 0.71 at deployment to 0.63 on a recent holdout evaluation — a degradation the credit risk team attributes to post-COVID structural shifts in customer spending and repayment behaviour.

At a Gini of 0.63, the model's rank-ordering of credit risk is meaningfully weaker than at deployment. This has two operational consequences: (a) the bank may be offering limit increases to customers whose current risk profile does not support them, and (b) it may be declining or under-sizing increases for customers who would perform well. Both outcomes carry credit loss exposure and customer experience cost.

The retraining work — using a fresh 24-month transaction window — and offline evaluation are complete. The retrained model achieves an estimated Gini of ≥0.71 in offline evaluation, restoring performance to deployment-era levels. The remaining path to production is governance, integration testing, and deployment.

---

## Personas

**Primary persona: Credit Risk Analyst / Model Owner (credit risk team)**
- Responsible for model performance monitoring and the retraining programme
- Encounters the problem continuously: each CLI recommendation cohort processed by the drifted model carries elevated misclassification risk
- Has completed the technical remediation (retraining, offline evaluation, disparity assessment); is now navigating the governance and deployment path
- Cost of delay: every week the drifted model remains in production, CLI recommendations are generated under a degraded risk signal

**Primary persona: Enterprise Credit Card Customer**
- Existing customer holding an enterprise credit card account
- Encounters the model's output at the moment the bank makes an automatic CLI decision
- Under the drifted model: may receive a limit increase that does not match their current repayment capacity, or may be denied an increase they could support
- Has no direct visibility into model performance — the harm is indirect and probabilistic

**Secondary persona: MRM Committee Member**
- Responsible for independent model risk validation before production deployment
- Encounters this initiative at the governance gate (MRM committee review, ~8 weeks from now)
- Must be satisfied that the retrained model meets the bank's model risk management standards before sign-off

**Secondary persona: Chief Risk Officer**
- Board-level accountability for material credit model validation sign-off (CPG 220 obligation — see Constraints)
- Final human authority before production deployment

---

## Why Now

Three converging factors:

1. **Measured performance degradation has crossed a material threshold.** A Gini decline from 0.71 to 0.63 is not marginal — it represents meaningful deterioration in the model's discriminatory power. The credit risk team has determined this warrants remediation rather than continued monitoring.

2. **Post-COVID behavioural shift is structural, not transient.** The team's attribution of drift to changed spending and repayment patterns implies the gap between training data and current population behaviour will not self-correct. Continued operation on the 2-year-old model is not a stable holding position.

3. **Retraining is complete.** The technical remediation work is done. The initiative is not seeking approval to begin work — it is seeking governance clearance to deploy work that is already complete. The 12-week target is a deployment timeline, not a development timeline.

---

## MVP Scope

The bounded scope of this initiative is:

- **Deploy the retrained credit risk model** (trained on a 24-month transaction window, offline-evaluated at Gini ≥0.71) as a drop-in replacement for the current production model powering automatic CLI recommendations on enterprise credit card accounts
- **Complete MRM committee review** and obtain the required sign-offs (MRM committee + CRO, per CPG 220 — see Constraints)
- **Integration testing in staging** to confirm the retrained model produces well-formed outputs through the existing CLI recommendation pipeline
- **Production deployment** with a defined rollback procedure

**Explicit deferrals (part of MVP definition):**
- Decision threshold changes — deferred; thresholds remain as currently configured
- Lending product term changes — deferred; out of scope
- Extension of the CLI recommendation capability to non-enterprise card products — deferred
- Any changes to the demographic disparity assessment methodology — deferred; the completed assessment is accepted as-is for this initiative

---

## Out of Scope

1. **Decision threshold changes.** The operator has explicitly confirmed thresholds are not changing. Any proposal to adjust thresholds during this initiative would require a separate discovery.

2. **Product term changes.** Lending product terms (rates, fees, credit limit bands) are not within scope. A change to terms would trigger a separate CCCFA disclosure obligation.

3. **Extension to other card products.** The CLI recommendation model for consumer or SME card products is not part of this initiative. Performance on those models is a separate question.

4. **Disparity methodology revision.** The demographic disparity assessment is complete and accepted. This initiative does not include a review of the assessment methodology or the disparity metrics used.

5. **Core banking system changes.** Model deployment does not touch the loan ledger or deposits platform. No BS11 notification is triggered by this initiative alone. *(Note: if the model serving infrastructure is hosted on or integrated with a system that is separately undergoing migration, that intersection must be assessed — see Assumptions.)*

---

## Assumptions

[ASSUMPTION] **CPG 220 board-level sign-off is satisfied by CRO approval within the existing MRM process** — the operator states the MRM committee review covers the governance requirement, but CPG 220 requires that material credit model validation sign-off cannot be delegated below CRO level. It is assumed the MRM committee process includes or escalates to CRO sign-off. If the MRM committee can approve without CRO involvement, this is a compliance gap. **Unconfirmed — requires /clarify before scope is locked.**

[ASSUMPTION] **The retrained model's CCCFA record retention obligations are met across the transition.** The existing CLI recommendation records (credit contract decisions made using the current model) must be retained for 7 years from contract end. It is assumed the model transition does not alter the retention posture of existing decision records — i.e. the old model's outputs remain archived and auditable after the new model is deployed. **Unconfirmed — requires /clarify before scope is locked.**

[ASSUMPTION] **The 8-week MRM committee timeline is the critical path.** It is assumed that integration testing and deployment can be completed within the window following MRM sign-off, keeping the 12-week target achievable. If staging integration testing reveals issues requiring model-side changes, the timeline is at risk.

[ASSUMPTION] **The disparity assessment methodology meets CCCFA responsible lending obligations.** The operator states the retrained model shows no regression on internal disparity metrics. It is assumed this assessment satisfies the bank's responsible lending obligations under CCCFA, which require that automated decisioning does not produce discriminatory outcomes. The assessment methodology and the standard against which "no regression" is measured have not been described. **Unconfirmed — the adequacy of the methodology relative to CCCFA obligations requires confirmation from the bank's legal/compliance team before scope is locked.**

[ASSUMPTION] **No RBNZ notification obligation is triggered by the model update itself.** The operator's position is that this is a model update to an existing capability, not a new product, and therefore no regulatory approval is required. This assumption is assessed as **plausible but requires explicit confirmation from the RBNZ relationship team**. RBNZ's BS11 notification requirements apply to material changes to core banking systems. An automated credit decisioning model that influences credit limits on enterprise accounts may or may not constitute a material change depending on how the bank's BS11 materiality assessment is defined. The operator's assertion ("no regulatory approval anticipated") does not substitute for a confirmed materiality assessment.

[ASSUMPTION] **The offline Gini evaluation (≥0.71) is a reliable predictor of in-production performance.** The claim that retraining restores performance is based on offline holdout evaluation. It is assumed the holdout sample is representative of the current production population and that no further drift has occurred since the training window was closed. If the holdout evaluation is stale or the production population has continued to shift, the live Gini may not match the offline result.

[ASSUMPTION] **"No issues anticipated" at MRM committee is not a confirmed outcome.** The operator notes three prior successful submissions. Past approval does not guarantee current approval, particularly given: (a) the CPG 220 board-level sign-off requirement, and (b) the fact that this retrained model is replacing a model that has been running in production at degraded performance — the committee may scrutinise the monitoring and escalation process that permitted 8+ months of drift before remediation.

---

## Regulatory Constraints (mandatory surface — NZ registered bank context)

The following regulatory obligations are triggered by this initiative. They are surfaced here because they apply regardless of whether the operator brief addresses them. They are not optional considerations.

### CPG 220 — Model Risk Management (hard go-live gate)

CPG 220 requires that:

- AI and ML models used in credit decisioning must undergo **independent model risk validation** before being activated in production
- **Board-level accountability applies:** model validation sign-off for material credit models cannot be delegated below Chief Risk Officer level
- A model that has not completed validation **must not** be used in live customer-facing credit decisions — this is a hard go-live gate, not a documentation preference

**Assessment:** The retrained CLI recommendation model is a credit decisioning model. CPG 220 applies. The operator's described MRM committee process appears to be the intended validation mechanism. **The critical question is whether the MRM committee process satisfies CPG 220's independence and CRO sign-off requirements.** The operator states the committee review "typically takes one meeting cycle" and anticipates no issues — but CPG 220's requirements are not relaxed by historical approval rate.

**This is a hard gate. The retrained model cannot go to production until CPG 220 validation and CRO sign-off are complete, regardless of the 12-week target.**

### CCCFA — Credit record retention

CCCFA requires credit records and credit contract documents to be retained for 7 years from the date the contract ends. CLI decisions generated by the current (drifted) model are credit records subject to this obligation.

**Assessment:** The model transition must not disturb the retention posture of existing decision records. Before the current model is decommissioned or its outputs archived in a way that alters access, the bank must confirm:
- Existing CLI decision records remain auditable for their full 7-year retention window
- The new model's decision outputs are captured and retained from day one of production operation

### CCCFA — Responsible lending assessment retention

Responsible lending assessments must be retained and auditable for 7 years from contract end. The demographic disparity assessment completed for the retrained model is a responsible lending artefact.

**Assessment:** The disparity assessment report and its supporting data must be retained. This is not a one-time gate artefact — it is a durable compliance record. Confirm the bank's document management process captures this artefact under the correct retention policy.

### RBNZ BS11 — Materiality assessment (requires confirmation, not assumed clear)

The operator's position is that no RBNZ notification is required. This may be correct — a model retrain that does not change the surrounding system architecture, decision thresholds, or product terms is a plausible candidate for sub-materiality treatment. However:

- The bank must have a documented BS11 materiality assessment for this change
- "This is a model update, not a new product" is a business framing, not a regulatory determination
- The RBNZ relationship team must confirm the materiality assessment before any irreversible project activity proceeds (noting that integration testing in staging may constitute a material step depending on the bank's BS11 procedure)

**This does not block discovery. It does block irreversible project steps until confirmed.**

---

## Success Indicators

| Indicator | Baseline | Target | Measurement method |
|---|---|---|---|
| Model discriminatory power (Gini coefficient) | 0.63 (current production, recent holdout) | ≥ 0.71 (restoring deployment-era performance) | Holdout evaluation on production data post-deployment; scheduled backtesting per CPG 220 model monitoring requirements |
| CLI recommendation accuracy (approval rate stability) | [UNKNOWN BASELINE — current approval rate on enterprise CLI cohort not stated in brief] | No material change from current approval rate cohort post-deployment, within expected statistical variation | CLI decision log comparison: pre/post deployment cohort analysis, 30-day and 90-day post-deployment |
| Demographic disparity profile | Approval rate differences across demographic groups: within current model's range (per completed assessment) | No regression relative to current model; disparity within the range established in the pre-deployment assessment | Post-deployment disparity monitoring; 90-day cohort analysis against the pre-deployment assessment baseline |
| MRM governance timeline | MRM committee slot: ~8 weeks from discovery date | MRM sign-off and CRO approval obtained within 10 weeks of discovery; production deployment within 12 weeks | Project milestone tracking; MRM committee minutes; CRO sign-off date |
| CCCFA retention posture | [UNKNOWN BASELINE — current CLI decision record retention posture not confirmed] | 100% of CLI decision records (old model and new model) retained and auditable for 7 years from contract end | Compliance audit; document management system confirmation |

---

## Constraints

**Hard constraints (sourced from NZ regulatory framework and operator context):**

1. **CPG 220 CRO sign-off is a hard production gate.** The retrained model cannot go live until the MRM committee review is complete and CRO sign-off is obtained. The 12-week timeline is contingent on this gate clearing within approximately 10 weeks (allowing 2 weeks for integration testing and deployment).

2. **MRM committee meets bi-monthly.** Missing the next slot extends the timeline by a full committee cycle. There is no described mechanism to accelerate MRM review outside the scheduled meeting cadence.

3. **CCCFA 7-year retention applies to CLI decision records.** Decommissioning or archiving the current model's decision outputs requires confirmed retention compliance on the destination system before any source data is removed.

4. **RBNZ BS11 materiality assessment must be completed and documented** before integration testing in staging proceeds. The bank's RBNZ relationship team must confirm the materiality determination.

5. **The demographic disparity assessment, as a responsible lending artefact, must be retained** under CCCFA's 7-year retention obligation from the date of the associated credit contracts' end.

**Operational constraints (from operator brief):**

6. **Retraining and offline evaluation are complete.** The initiative scope begins at governance, not at model development. No further model development is in scope without a separate discovery.

7. **12-week production target.** The operator has named this as the target. It is achievable if and only if: (a) the MRM committee slot is secured and clears in one cycle, (b) CRO sign-off follows without delay, and (c) staging integration testing reveals no issues requiring model-side changes.

[ASSUMPTION] **The staging integration environment is available and representative of production** — not confirmed in the brief. If staging is shared with other initiatives or is unavailable in the post-MRM-approval window, the deployment timeline is at risk. **Unconfirmed — requires /clarify before scope is locked.**

---

## /clarify recommendation

This discovery contains **6 unconfirmed assumptions** that affect scope, regulatory compliance, and timeline reliability. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. [ASSUMPTION] CPG 220 board-level sign-off — whether the MRM committee process includes or escalates to CRO sign-off, and whether that satisfies CPG 220's independence requirement
2. [ASSUMPTION] CCCFA record retention across the model transition — whether existing CLI decision records remain auditable for their full 7-year retention window after the new model is deployed
3. [ASSUMPTION] CCCFA responsible lending — whether the completed disparity assessment methodology satisfies the bank's CCCFA responsible lending obligations (requires legal/compliance confirmation)
4. [ASSUMPTION] RBNZ BS11 materiality — whether a documented BS11 materiality assessment exists or has been obtained from the RBNZ relationship team confirming this change is sub-material
5. [ASSUMPTION] Offline evaluation representativeness — whether the holdout sample used to establish the ≥0.71 Gini estimate is current and representative of the live production population
6. [ASSUMPTION] Staging environment availability — whether the integration test environment is available and representative of production in the post-MRM-approval window

These assumptions must be confirmed or refuted before scope can be locked. The most time-sensitive is item 4 (BS11 materiality) — if integration testing in staging constitutes a material step under the bank's BS11 procedure, it cannot begin until the materiality assessment is complete.

---

## Attribution

**Contributors:**
- [Operator — Credit Risk Team Lead / Initiative Owner] — 2025-01-31

**Reviewers:**
- Pending

**Approved By:**
- Pending — *Note: Approved By must be populated before this artefact is submitted to the Definition of Ready gate. A non-engineering approver is required for governance attribution compliance. Leaving this field empty will result in a H-GOV hard block at Definition of Ready.*

---

## Approval gate

> **Discovery draft complete ✓**
>
> This artefact contains 6 unconfirmed assumptions, including two that may constitute hard compliance gates (CPG 220 CRO sign-off path; RBNZ BS11 materiality). I strongly recommend running **/clarify** before approving.
>
> The most urgent item: **RBNZ BS11 materiality assessment**. If the bank's BS11 procedure treats staging integration testing as a material step, that work cannot begin until the RBNZ relationship team has confirmed the materiality determination. The 12-week clock may effectively already be running.
>
> How do you want to proceed?
> 1. Run /clarify now (recommended — 6 open assumptions, 2 potentially hard gates)
> 2. Review and approve without /clarify — skip to sign-off
>
> Reply: 1 or 2

---

*Before closing: run `/estimate` to record a rough focus-time forecast for this feature, or reply `skip` to continue without an estimate.*

<!-- eval-mode: true -->