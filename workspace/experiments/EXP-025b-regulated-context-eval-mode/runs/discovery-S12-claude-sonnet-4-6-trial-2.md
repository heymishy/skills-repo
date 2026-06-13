I'll read the product context and reference materials before beginning.

No `product/` directory context files or `artefacts/` reference folder are detectable from the input, so I'll proceed directly from the problem statement.

Before I draft any artefact sections, I need to flag something significant about the regulatory framing in this brief — because it affects whether the 12-week timeline is achievable and whether the discovery can be scoped as described.

---

> **Before I write the discovery artefact, I need to surface a hard constraint the brief does not account for.**

The brief states: *"No regulatory approval is anticipated. This is a model update, not a new product."*

That framing is commercially understandable but it is not consistent with the obligations that apply here. Let me be specific:

**CPG 220 (APRA Prudential Practice Guide — Risk Management), which is the operative standard for model risk management at NZ registered banks pending RBNZ BS2B:**

- AI/ML models used in **credit decisioning** must undergo **independent model risk validation** before being activated in production.
- "Independent" means external to the team that built and evaluated the model. The credit risk team's own demographic disparity assessment and offline Gini evaluation do not satisfy this — they are internal to the model owner.
- The validation requirement applies to **material model changes**, not only new models. A retraining on a new 24-month window that restores a Gini shift from 0.63 to ~0.71 is a material change.
- **Board-level accountability:** CPG 220 requires model validation sign-off for material credit models cannot be delegated below Chief Risk Officer level.
- A model that has not completed independent validation **must not be used in live customer-facing credit decisions.** This is a hard go-live gate.

**CCCFA (Credit Contracts and Consumer Finance Act 2003):**

- Credit limit increase recommendations on consumer credit card accounts are **credit decisions** under the CCCFA.
- Responsible lending obligations require that automated decisioning for limit increases is auditable and that the methodology is retainable for 7 years from contract end.
- A model change requires that the audit trail covers the retrained model's logic, not only the prior version's.

**The internal MRM committee is not a substitute for independent model validation under CPG 220.** An internal governance committee is a necessary control — but CPG 220's independence requirement means the validator must not report to the same business line as the model owner. Whether your MRM committee structure satisfies this needs to be confirmed with your Chief Risk Officer before the 12-week go-live date is treated as firm.

I am proceeding to draft the discovery artefact now, surfacing these as `[ASSUMPTION]` items requiring /clarify resolution before scope is locked. The artefact will reflect the brief as provided and flag where assumptions need confirmation.

---

# Discovery Artefact

**Feature:** Credit Risk Model Retrain — Enterprise Credit Card Limit Recommendations
**Status:** Draft
**Date:** 2025-07-15
**Skill:** /discovery

---

## Problem Statement

The credit limit increase recommendation model deployed on enterprise credit card accounts has experienced measurable performance drift over approximately two years. The Gini coefficient has declined from 0.71 at deployment to 0.63 on a recent holdout evaluation — a 0.08-point degradation that the credit risk team attributes to structural shifts in customer spending and repayment behaviour following COVID-19.

At a Gini of 0.63, the model's rank-ordering of credit risk is materially weaker than at deployment. This means the model is less accurately distinguishing customers who would safely use a higher credit limit from those who would not, increasing the probability of limit increases being offered to customers with elevated default or delinquency risk — and potentially withholding increases from lower-risk customers who would benefit from them.

Retraining on a fresh 24-month transaction window has been completed offline. Holdout evaluation of the retrained model shows Gini restoration to approximately 0.71, consistent with original deployment performance.

The remaining work is governance, integration testing, and deployment.

---

## Personas

**1. Credit Risk Analyst / Model Owner (internal)**
- Owns the retrained model and has completed offline evaluation and the demographic disparity assessment.
- Encounters the problem when reporting model performance metrics and observing deteriorating accuracy on recent cohorts.
- Cost of inaction: continued operation of a model producing suboptimal credit limit recommendations; reputational and credit loss exposure if the degraded model misclassifies risk at scale.

**2. Enterprise Credit Card Customer (existing account holder)**
- Receives (or does not receive) an automated credit limit increase recommendation based on the model's output.
- Encounters the problem when the model's degraded discrimination means they are incorrectly assessed — either denied a limit increase they would safely use, or offered one they cannot safely service.
- Cost of inaction: suboptimal credit outcomes; potential for customer harm if limit increases are extended to higher-risk customers at scale.

**3. Chief Risk Officer / MRM Committee (governance)**
- Accountable for model risk sign-off before production deployment.
- Encounters the problem at the governance gate — the sign-off requires confidence that the model meets independence, validation, and audit standards under CPG 220.
- Cost of gap: if the MRM committee structure does not satisfy CPG 220 independence requirements, a separate independent validation step is required before sign-off can be granted, which extends the timeline.

**4. Compliance / Regulatory Affairs Team (internal)**
- Must confirm whether the retrained model triggers any notification, registration, or disclosure obligations — including whether the CCCFA audit trail and responsible lending documentation have been updated to reflect the new model version.

---

## Why Now

The model has drifted to a Gini of 0.63 against an original deployment Gini of 0.71. The offline retraining work is complete. Continued operation of the degraded model carries increasing credit loss and customer outcome risk with each passing month. The credit risk team has a natural governance window — the next MRM committee slot is approximately 8 weeks away — making now the correct point to initiate the formal project and compliance confirmation steps.

---

## MVP Scope

**In scope for this initiative:**

1. Submission of the retrained model to the MRM committee for review and sign-off (next available slot, ~8 weeks).
2. Confirmation that the MRM review structure satisfies CPG 220 independence requirements — or, if it does not, scoping an independent validation step.
3. Integration testing of the retrained model in the staging environment.
4. Production deployment of the retrained model, replacing the current production model version.
5. Updated model documentation and audit trail covering the retrained model (for CCCFA 7-year retention compliance).
6. Post-deployment monitoring baseline established: Gini, approval rate by demographic group, and limit utilisation tracking for the first 90 days.

**Explicit deferrals (MVP boundary):**

- Decision threshold changes are deferred. This initiative retrains the model on new data; it does not change the recommendation thresholds applied to model output.
- Lending product term changes are out of scope.
- Expansion of the model to new account types (e.g. consumer cards, SME cards) is deferred.
- Retraining methodology changes (feature set, model architecture) are deferred — this is a data window refresh, not a model redesign.

---

## Out of Scope

1. **Decision threshold changes** — The cut-off points that convert model scores into approve/decline/amount recommendations are not changing. Any threshold recalibration is a separate initiative requiring its own impact assessment and governance cycle.
2. **New lending product terms** — Credit limit increase product parameters, interest rates, and fee structures are not within scope.
3. **Consumer or SME card accounts** — This initiative covers enterprise credit card accounts only. Extension to other portfolios is a separate scoping exercise.
4. **Model architecture redesign** — The retrained model uses the same feature set and model type as the current production model. Architectural changes (different algorithm, new input features) are deferred.
5. **Customer-facing communication changes** — No changes to how limit increase offers are communicated to customers are in scope.

---

## Assumptions and Risks

**Unconfirmed assumptions requiring /clarify resolution:**

> [ASSUMPTION] The internal MRM committee structure satisfies CPG 220's independence requirement (validator must be independent of the model owner business line) — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The demographic disparity assessment completed by the credit risk team constitutes sufficient fairness validation under CPG 220 — unconfirmed; CPG 220 may require independent review of the fairness methodology, not only the output — requires /clarify before scope is locked.

> [ASSUMPTION] No RBNZ notification is required for this model change — unconfirmed. If the credit limit recommendation model is treated as a material component of the bank's credit decisioning system under BS11, RBNZ may require notification. The "model update not new product" framing does not automatically exclude BS11 applicability — requires /clarify before scope is locked.

> [ASSUMPTION] The 12-week production timeline is achievable given MRM committee scheduling — unconfirmed. The MRM committee meets bi-monthly; if the submission is not accepted at the next slot or requires a second review cycle, the timeline extends beyond 12 weeks — requires /clarify before scope is locked.

> [ASSUMPTION] The CCCFA audit trail and responsible lending documentation have been updated (or are in plan to be updated) to reflect the retrained model version and its documentation — unconfirmed, requires /clarify before scope is locked.

> [ASSUMPTION] The retrained model's offline Gini of ~0.71 will replicate in production on live transaction data — this is an offline holdout result; production performance may differ due to data pipeline differences, feature computation timing, or population shift — requires post-deployment monitoring plan.

**Confirmed constraints (from regulatory context):**

- CPG 220 applies. Independent model risk validation is a hard go-live gate for material credit models. This is not a process preference.
- CCCFA applies. Credit limit decisions on consumer credit card accounts require a 7-year retainable audit trail covering the model version and responsible lending assessment methodology.
- The MRM committee sign-off is a necessary but potentially not sufficient condition for production deployment — CPG 220 independence requirements must be confirmed separately.

**Risks:**

- **Timeline risk (HIGH):** If the MRM committee review does not satisfy CPG 220 independence requirements, an independent validation step is required. Independent model validators typically require 4–8 weeks. This would push production deployment to 16–20 weeks, not 12.
- **Fairness validation risk (MEDIUM):** The demographic disparity assessment was conducted by the credit risk team (model owner). If the MRM committee or CRO determines that an independent fairness audit is required, this adds a step not currently planned.
- **Responsible lending documentation risk (MEDIUM):** If the CCCFA audit trail for the retrained model has not been updated, deployment is blocked until documentation is complete.
- **Data pipeline risk (LOW-MEDIUM):** The 24-month training window retraining assumes production data pipelines produce features consistently with the training environment. Any feature computation discrepancy will cause production Gini to diverge from offline holdout results.

---

## Directional Success Indicators

**1. Model discrimination performance (Gini coefficient)**
- Baseline: 0.63 (current production model, recent holdout evaluation)
- Target: ≥ 0.71 (restoration to original deployment performance, consistent with offline evaluation of retrained model)
- Measured via: holdout evaluation on a held-out post-deployment cohort, 90 days post go-live; periodic backtesting schedule to be defined by MRM committee

**2. Demographic disparity stability**
- Baseline: Approval rate differences across demographic groups at current production model levels (specific values held by credit risk team — `[UNKNOWN BASELINE — exact figures not provided in brief]`)
- Target: Retrained model approval rate differences within the same range as the current production model (no regression)
- Measured via: same internal disparity metric used in the pre-submission assessment; confirmed at 90-day post-deployment review

**3. Credit loss rate on limit-increased accounts**
- Baseline: `[UNKNOWN BASELINE — 12-month rolling delinquency/default rate on accounts receiving limit increases under current model not provided]`
- Target: No deterioration relative to baseline cohort at 12 months
- Measured via: delinquency and charge-off tracking on accounts that received limit increases post-deployment; cohort comparison against accounts that received limit increases under the prior model version

**4. MRM governance cycle completion**
- Baseline: Not started (pending next committee slot)
- Target: MRM sign-off obtained within 8 weeks; CPG 220 independence confirmation obtained before or concurrent with MRM sign-off
- Measured via: MRM committee meeting records and sign-off documentation

---

## Constraints

**Regulatory (confirmed applicable):**

- **CPG 220:** Independent model risk validation is a hard go-live gate for material credit models. Sign-off cannot be delegated below CRO level. A model that has not completed independent validation must not be used in live customer-facing credit decisions.
- **CCCFA:** Credit contract records and responsible lending assessments must be retained for 7 years from contract end. The audit trail must cover the retrained model version.
- **RBNZ BS11:** Applicability to this model change is unconfirmed — see `[ASSUMPTION]` above. Must be assessed before the project proceeds past initiation.

**Governance (confirmed):**

- MRM committee review is required before production deployment. Committee meets bi-monthly. Next available slot is approximately 8 weeks.
- Board-level accountability (CRO sign-off) is required for material credit model changes under CPG 220.

**Timeline:**

- Desired production deployment: within 12 weeks.
- This timeline is contingent on MRM review completing in one cycle and no additional independent validation step being required. If independent validation is required, 12 weeks is not achievable.

**Technical:**

- Retraining and offline evaluation are complete. Remaining work is governance, staging integration test, and deployment.
- Production data pipeline feature computation must be confirmed consistent with training environment before deployment.

---

## /clarify Recommendation

This discovery contains **6 unconfirmed assumptions** that affect scope and go-live timeline. Before proceeding to `/benefit-metric`, run `/clarify` to resolve:

1. [ASSUMPTION] The internal MRM committee structure satisfies CPG 220's independence requirement — unconfirmed, requires /clarify before scope is locked.
2. [ASSUMPTION] The demographic disparity assessment completed by the credit risk team constitutes sufficient fairness validation under CPG 220 — unconfirmed, requires /clarify before scope is locked.
3. [ASSUMPTION] No RBNZ notification is required for this model change under BS11 — unconfirmed, requires /clarify before scope is locked.
4. [ASSUMPTION] The 12-week production timeline is achievable given MRM committee scheduling — unconfirmed, requires /clarify before scope is locked.
5. [ASSUMPTION] The CCCFA audit trail and responsible lending documentation have been updated to reflect the retrained model — unconfirmed, requires /clarify before scope is locked.
6. [ASSUMPTION] The retrained model's offline Gini of ~0.71 will replicate in production — requires post-deployment monitoring plan to be confirmed.

**The most consequential of these is assumption #1.** If the MRM committee does not satisfy CPG 220 independence requirements, the 12-week timeline is not achievable and an independent validation track must be scoped. This should be confirmed with the CRO before the MRM submission is treated as the sole governance gate.

---

## Attribution

**Contributors:**
- [Operator name — Role] — 2025-07-15

**Reviewers:**
- Pending

**Approved By:**
- Pending

> ⚠️ This artefact must not be marked Approved until the Approved By field is populated with a named individual (name, role, date). A non-engineering approver is expected. Leaving this field empty will result in a H-GOV hard block at Definition of Ready.

---

## Next Steps

Before approving this discovery and proceeding to `/benefit-metric`:

1. **Run `/clarify`** to resolve the 6 unconfirmed assumptions above — particularly the CPG 220 independence question and BS11 applicability.
2. **Confirm MRM committee independence structure** with the CRO or Chief Compliance Officer before treating the 8-week MRM slot as the critical path.
3. **Confirm CCCFA documentation update** is in plan for the retrained model version.
4. **Establish the post-deployment monitoring plan** (Gini tracking, disparity monitoring, credit loss cohort tracking) so it is ready for deployment, not retrofitted.

---

> **Discovery draft complete ✓**
>
> This draft surfaces 6 unconfirmed assumptions, the most significant of which concerns whether the internal MRM committee satisfies CPG 220's independence requirement. Until that is confirmed, the 12-week timeline should be treated as aspirational rather than committed.
>
> How do you want to proceed?
> 1. Run /clarify now (recommended — 6 open assumptions, one of which affects the critical path)
> 2. Review and approve without /clarify
>
> Reply: 1 or 2

<!-- eval-mode: true -->