# Discovery Assessment: Credit Limit Increase Model Retrain

## Summary

A retrain of an existing credit limit increase recommendation model to address performance drift (Gini 0.71 → 0.63). The technical work is complete; the proposal frames remaining effort as procedural (MRM review, staging test, deploy) within 12 weeks.

**Discovery outcome: Proceed with conditions.** The retrain itself is well-motivated, but the proposal understates the regulatory surface, the fairness assessment is insufficient as scoped, and the timeline has an arithmetic problem with the MRM cycle. Several claims presented as settled need validation before this should be treated as a "deploy-only" effort.

---

## What's solid

- Clear business rationale with quantified drift (Gini 0.71 → 0.63) and an expected recovery target.
- Retraining and offline evaluation already complete — execution risk on the modelling work is low.
- A fairness check was performed proactively rather than retroactively.
- Existing MRM governance path with prior successful passages.

---

## Gaps and risks

### 1. Regulatory scope — the "just a model update" claim needs validation

"No regulatory approval is anticipated" may be correct in the narrow sense of *pre-approval*, but credit limit increases on card accounts are regulated credit decisions, and a full retrain on a new data window is typically classified as a **material model change**, not a minor update. Specific exposures to confirm:

- **Fair lending / anti-discrimination law** (ECOA/Reg B, or FCA/CONC and Consumer Duty depending on jurisdiction) applies to limit increase decisions regardless of whether the product is new. "Enterprise" accounts do not necessarily exempt you — small business credit is in scope in most regimes, and guarantors may be natural persons.
- **EU AI Act**: if any natural persons' creditworthiness is assessed, this is a high-risk use case with conformity obligations that attach to substantial modifications.
- **Automated decision-making** (GDPR Art. 22 or equivalent): the proposal says "automatic" recommendations. Clarify whether there is meaningful human review, and whether reason codes / explanations are generated for the retrained model.
- **Responsible lending rules on unsolicited limit increases**: several regimes (e.g., UK persistent debt rules, opt-out requirements) constrain *proactive* limit increases specifically. Confirm the eligibility filters sit outside the model and are unchanged.

**Action:** Get a written scope determination from compliance/legal on the materiality classification and applicable regimes *before* the MRM submission, not as part of it.

### 2. Fairness assessment — comparing to the baseline is not a clean bill of health

"No regression relative to the current production model" has three weaknesses:

- It anchors to a baseline that was itself never re-validated post-drift. If the production model has developed disparities since 2-year-old training, "comparable" means "comparably problematic."
- **Approval rate differences alone are insufficient for this model.** The model outputs both a decision *and an amount*. Disparity in recommended increase amounts across groups is a distinct and likely larger exposure than approval rates, and it isn't covered by the stated metric.
- No mention of error-rate disparities (who gets wrongly denied vs. wrongly extended), intersectional analysis, or proxy review of transaction-behaviour features — transaction patterns are well-known proxies for protected characteristics.

**Action:** Extend the disparity assessment to cover limit amounts and error rates before MRM submission. Expect the committee (or a regulator, later) to ask exactly this.

### 3. Drift root cause and training data — attributed, not analysed

- The post-COVID explanation is plausible but appears asserted rather than demonstrated. If the actual driver is different (population shift from marketing changes, feedback loops from the model's own past limit decisions), a 24-month refresh may not restore or sustain performance.
- **Feedback loop / selection bias:** the new training window contains outcomes shaped by the current model's recommendations. Confirm how this was handled (e.g., reject inference, holdout populations).
- The same drift will recur. There is no mention of a monitoring or recalibration strategy — and the fact that Gini decayed by 8 points before triggering action suggests current monitoring is reactive.

**Action:** Document drift root-cause analysis and define ongoing monitoring (Gini, calibration, PSI, fairness metrics) with thresholds and a retrain trigger. This converts a recurring fire drill into a managed lifecycle and will strengthen the MRM submission.

### 4. Timeline — the maths likely doesn't work

- Next MRM slot: ~8 weeks away. Review "takes one meeting cycle" — if that means a decision at the *following* bi-monthly meeting, approval lands around week 16, against a 12-week target. If it means decision at the same meeting, you have ~4 weeks for staging integration, deployment, and any MRM conditions. Tight but feasible — **clarify which it is.**
- "We anticipate no issues" carries optimism bias: prior passages were presumably routine changes; a material retrain with the fairness and classification questions above is more likely to attract conditions or a resubmission. No buffer exists for that outcome.
- No rollback plan, shadow/champion-challenger period, or staged rollout is mentioned. For a model that changes credit exposure, deploying straight from a "brief" staging test to full production is aggressive.

**Action:** Confirm MRM cycle semantics now; consider requesting a pre-read or interim engagement with MRM validators during the 8-week wait rather than losing it. Add a shadow-mode or phased rollout to the deployment plan.

---

## Discovery questions to resolve before MRM submission

1. What is the formal materiality classification of this change under your model risk policy, and who signed off on it?
2. Which jurisdictions and account types (natural-person guarantors, sole traders) are in scope, and what fair-lending/AI regulations attach?
3. Does the fairness assessment cover increase *amounts* and error rates, or approval rates only?
4. Is there a human in the loop, and are adverse/explanatory reason codes produced by the retrained model?
5. What was the actual root cause of the drift, and how was feedback bias in the new training window handled?
6. What is the post-deployment monitoring plan and retrain trigger?
7. Does "one meeting cycle" for MRM mean decision at submission meeting or the following one?
8. What is the rollback plan if production behaviour diverges from offline evaluation?

---

## Recommended gate decision

**Conditional proceed.** Do not treat this as deployment-only work. Run a 2–3 week pre-MRM workstream (regulatory scope determination, expanded fairness analysis, root-cause documentation, monitoring plan) in parallel with the wait for the committee slot — the 8-week gap is an asset, not dead time. Re-baseline the production date once MRM cycle semantics are confirmed; communicate now that 12 weeks is at risk and 14–18 weeks is the realistic range if the review attaches conditions.