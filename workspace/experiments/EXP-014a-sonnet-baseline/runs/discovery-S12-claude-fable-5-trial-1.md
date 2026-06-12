# Discovery Assessment: Credit Limit Increase Model Retrain

**Initiative type:** Material model change to a production credit decisioning model
**Requested timeline:** 12 weeks to production
**Discovery verdict:** **Conditional — proceed with significant caveats.** The technical work appears mature, but the regulatory framing, fairness validation scope, and timeline assumptions all have gaps that need resolution before this is committable.

---

## 1. What's in good shape

- Clear, well-scoped problem: performance restoration, not capability expansion.
- Drift is quantified (Gini 0.71 → 0.63) with a plausible causal hypothesis.
- A disparity assessment was performed *before* discovery — that's the right ordering.
- An established MRM governance path exists and the team has been through it.

---

## 2. Gaps and risks

### A. Regulatory framing — "no regulatory approval anticipated" needs challenge

The claim conflates **pre-approval** with **regulatory obligation**. Even without a formal approval gate, credit decisioning model changes typically carry:

- **Model risk management supervisory expectations** (e.g., SR 11-7 or local equivalent): a full retrain on a new 24-month window with materially restored discrimination is almost certainly a **material model change**, requiring full independent validation — not a light-touch update review. The "model update, not a new product" framing may not match how your regulator or your own MRM policy classifies it.
- **Fair lending / non-discrimination obligations** that apply continuously, not at approval gates.
- **Jurisdiction-dependent regimes**: if any portfolio segment involves natural persons in the EU, creditworthiness models are **high-risk under the EU AI Act**, with conformity and documentation obligations triggered by substantial modification. "Enterprise credit card accounts" is ambiguous — corporate cards with individual liability or small-business cards guaranteed by individuals may pull consumer-adjacent obligations in (e.g., ECOA/Reg B applies to business credit in the US).
- **Adverse action / explanation requirements**: a retrained model will produce different reason codes even at unchanged thresholds. If the model ever scores *customer-requested* increases (vs. only proactive offers), declined requests trigger adverse action notice obligations, and the new model's explanations must be validated.

**Discovery questions:** Which jurisdictions? Consumer, small business, or corporate liability? Does the model score customer-initiated requests? How does your MRM policy classify this change — minor or material?

### B. Fairness assessment — scope is too narrow to support the conclusion

The stated assessment ("approval rate differences within the same range as current model") has three problems:

1. **"No regression" is not "acceptable."** Parity with the current model only inherits whatever disparities the current model has. Was the current model's disparity profile itself within policy tolerance?
2. **The model has two outputs; only one was tested.** It recommends whether *and by how much*. Disparities in **increase amounts** across groups are untested and are exactly where retrained models often shift.
3. **Single-metric assessment.** Approval rate difference (demographic parity) misses error-rate disparities (qualified customers wrongly denied increases, by group), calibration across groups, and feature-driven proxy effects. Post-COVID behavioural shift — the very reason for retraining — plausibly affected demographic groups *differently*, so the disparity surface may have moved even if the headline approval gap hasn't.

**Discovery questions:** How are protected attributes obtained or inferred (and what's the inference methodology's error rate)? What metrics beyond approval-rate difference were run? Was increase-amount disparity tested? What is the documented fairness acceptance threshold, independent of the incumbent model?

### C. Timeline — single point of failure with no contingency

- 12-week target; MRM slot at week 8; committee is bi-monthly. The plan only works if the committee **approves unconditionally at first review**. Any request for additional analysis pushes to the next cycle — roughly **week 16+**, blowing the deadline.
- "We anticipate no issues — we've passed three times" is base-rate optimism, and notably none of those three was necessarily a material retrain of a credit decisioning model post-drift.
- ~4 weeks is left for staging integration and deployment after review — thin if validation conditions are attached.

**Recommendations:** Treat 12 weeks as best-case, not plan-of-record. Pre-engage the MRM secretariat now with the validation pack to surface issues before the formal slot. Define a contingency path (e.g., out-of-cycle review provision, or interim mitigations on the production model) if approval slips a cycle.

### D. Technical and data questions not yet answered

- **Evaluation rigour:** Was the 0.71 offline figure measured **out-of-time** on data unseen during training, or in-window? Retrains on recent data frequently overstate restored performance.
- **Outcome/selection bias:** Repayment outcomes are only observed at granted limits. How was this selection effect handled in labelling?
- **Unchanged thresholds ≠ unchanged behaviour:** A retrained model shifts the score distribution. Holding thresholds fixed will change approval volumes, exposure, and expected loss. A **portfolio impact analysis** (volume, exposure, loss forecast, capital) is needed and should accompany the MRM submission — committees commonly ask for exactly this.
- **Drift recurrence:** Drift happened once and will again. Is there a defined monitoring plan with disparity *and* performance triggers, a champion/challenger or shadow period, and rollback criteria? None is mentioned.

---

## 3. Required actions before commitment

| # | Action | Owner | Blocking? |
|---|--------|-------|-----------|
| 1 | Confirm jurisdictional scope, portfolio liability type, and applicable regimes (incl. EU AI Act exposure) | Legal/Compliance | Yes |
| 2 | Confirm MRM materiality classification of this change in writing | Model governance | Yes |
| 3 | Expand fairness testing: increase amounts, error-rate and calibration metrics, against an absolute policy threshold | Credit risk / fairness team | Yes |
| 4 | Out-of-time validation evidence and portfolio impact analysis for MRM pack | Modelling team | Yes |
| 5 | Confirm adverse-action/reason-code pathway and validate new explanations | Modelling + Compliance | Yes, if customer-requested increases are in scope |
| 6 | Post-deployment monitoring, shadow/challenger plan, rollback criteria | MLOps / model governance | Should precede go-live |
| 7 | Timeline contingency plan for a second MRM cycle | Programme | No, but required for honest planning |

---

## 4. Bottom line

The retrain itself is justified and the work is advanced