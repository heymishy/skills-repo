# Discovery Pipeline Assessment: Credit Limit Increase Model Retraining

## Summary
This is a **low-risk model update** with a clear improvement case and appropriate governance. The plan is sound. I'd recommend proceeding to implementation planning.

---

## Strengths of the Proposal

**Performance case is solid**
- Measurable drift (0.71 → 0.63 Gini) with identified root cause (post-COVID behavior changes)
- Offline evaluation shows recovery to baseline or better
- Retraining methodology is conservative (extended lookback window, no architectural changes)

**Fairness assessment is credible**
- Demographic disparity metric applied *before* committee submission (good practice)
- No regression relative to current model, which is already in production
- This reduces committee review burden appropriately

**Governance is proportionate**
- MRM review is the right gate for a model update
- Timeline (8 weeks to review, 12 weeks total) is realistic for this risk profile
- Integration testing in staging before production is standard practice

**Scope is tightly bounded**
- Not a new product or capability
- No threshold or business rule changes
- No regulatory novelty

---

## Questions for Pre-Submission (Before Week 8)

**On performance stability:**
1. Does offline evaluation test stability across customer segments (e.g., new vs. mature accounts, different spending profiles)? Drift was behavior-driven; confirm the retrained model isn't sensitive to further seasonal or cyclical shifts.
2. What is the performance comparison on the 2023 holdout (i.e., how does the retrained model perform on the old model's test set)? This matters for production transition confidence.

**On fairness depth:**
3. Beyond approval rate disparity, have you checked for differences in *recommended increase amounts* by demographic group? Approval parity is necessary but not sufficient if the magnitude of offers differs materially.
4. Did you test for disparities in the *subpopulations most affected by the retraining*—i.e., customers who would get different recommendations under the new model? (This is a common blind spot.)

**On integration readiness:**
5. What is the rollback plan if staging integration testing reveals issues? (Likely straightforward, but MRM will ask.)
6. Do you have a monitoring spec for production deployment—e.g., how you'll detect if the model drifts again, and at what Gini threshold you'd retrain?

---

## What to Include in MRM Submission

- **One-page executive summary**: Gini recovery, demographic parity confirmation, no product changes
- **Model card**: training data window, features, performance on key segments, fairness results
- **Deployment plan**: staging gates, monitoring thresholds, rollback procedure
- **Answers to the questions above**

This reduces review cycle time and shows the committee you've thought through edge cases.

---

## Risk Level
**Green.** Proceed to implementation planning.