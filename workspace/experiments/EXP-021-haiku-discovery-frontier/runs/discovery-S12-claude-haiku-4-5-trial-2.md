# /discovery Output: Credit Limit Model Retraining

## Summary Assessment
This is a **well-structured, lower-risk model refresh** with clear business justification and completed foundational work. The timeline is feasible. However, there are several discovery-phase questions and considerations that should be addressed before MRM submission to de-risk the review and ensure you're ready for production.

---

## Key Strengths
- ✓ Clear performance degradation documented (Gini 0.71→0.63)
- ✓ Root cause identified (behavioral drift post-COVID)
- ✓ Offline retraining shows expected recovery
- ✓ Fairness assessment completed; no regression detected
- ✓ Governance process defined and precedented
- ✓ Realistic timeline with buffer
- ✓ No product/threshold changes (lower regulatory risk)

---

## Critical Discovery Questions

### 1. **Model Stability & Retraining Methodology**
- What validation approach was used in offline evaluation? (e.g., time-series cross-validation, separate holdout from 24-month window?)
- Did you test stability across different 24-month windows or just the most recent? Drift could recur if the 24-month window itself is non-stationary.
- How sensitive is the Gini recovery to hyperparameter choices? Was the retrained model tuned differently, and if so, why?
- **Why this matters:** MRM will ask whether 0.71 is reproducible or optimistic.

### 2. **Population Shift & Feature Behavior**
- Have you analyzed which features changed most since the original model? (e.g., transaction frequency, repayment cycles, seasonal patterns.)
- Are there early signs that behaviors are *still* shifting, or has the post-COVID adjustment stabilized?
- Did you compare feature distributions between the original training data, current production data, and the new 24-month window?
- **Why this matters:** If drift is ongoing, the retrained model may degrade again within 6–12 months, triggering another cycle.

### 3. **Fairness: Deeper Dive**
- You report approval rate parity with the current model, but:
  - Has the *absolute* approval rate changed? (The retrained model might be more generous/restrictive overall.)
  - Were other fairness metrics checked (e.g., Equalized Odds, disparate impact ratios on limit *amount*, not just approval)?
  - Did demographic subgroups' feature distributions shift post-COVID differently? (e.g., did one group's transaction patterns change more than another's?)
- **Why this matters:** "No regression" is a good baseline, but MRM may ask whether you've validated fairness *prospectively* for the new data.

### 4. **Business Impact & Monitoring Plan**
- What is the expected volume and average limit-increase amount under the retrained model vs. current model?
- Are there any scenarios where the retrained model's recommendations diverge significantly from the current model? (e.g., customers who were consistently rejected but are now approved?)
- Do you have a monitoring plan post-deployment? (e.g., tracking Gini, approval rate, limit-increase distribution by demographic, and loss rates 30/60/90 days post-increase?)
- **Why this matters:** MRM needs to know you can detect if things go wrong and have a rollback/remediation plan.

### 5. **Integration & Staging Testing**
- What will the staging test validate? (e.g., API latency, output format, edge cases?)
- Will you A/B test in production or direct-switch? If direct-switch, what's your rollback criterion/timeline?
- Are there any model serving dependencies (e.g., feature engineering, data pipelines) that have changed or need validation?
- **Why this matters:** Technical failures can mask model issues; you need both to succeed.

---

## Potential MRM Committee Concerns (Preempt These)

1. **"Why now, and why not sooner?"** — Be ready to explain why you didn't retrain earlier. Is there a trigger/policy for model refreshes?
2. **"What if performance drifts again?"** — Propose a scheduled refresh cadence or automated drift-detection threshold.
3. **"Fairness on only one metric?"** — Consider broadening fairness validation before submission.
4. **"What's the credit risk impact?"** — Do you have estimates of loss rate changes if the model becomes more/less approving?

---

## Recommended Pre-MRM Actions (Next 4–6 Weeks)

- [ ] Document feature stability analysis and explain if/why behavioral shifts have stabilized
- [ ] Expand fairness testing to include feature distributions by demographic group
- [ ] Define a post-deployment monitoring dashboard and alerting thresholds
- [ ] Prepare a rollback plan with decision criteria (e.g., "rollback if Gini < 0.68 or approval rate by [demographic] deviates >X%")
- [ ] Run a sensitivity analysis: how much does Gini degrade if you retrain on different 24-month windows or older cohorts?
- [ ] Clarify whether this is a one-off update or a signal to establish a regular retraining schedule

---

## Timeline Confidence
**12 weeks is achievable**, assuming:
- MRM committee approves without major requests for rework (realistic based on precedent)
- Staging testing uncovers no integration issues
- You don't need regulatory pre-approval (correct per your statement)

**Buffer:** You have ~4 weeks of slack; use it for monitoring readiness and documentation.

---

## Next Steps
1. **Before MRM submission:** Address the discovery questions above in a brief risk summary.
2. **MRM submission deck:** Lead with performance recovery + fairness parity + monitoring plan.
3. **Parallel track:** Begin staging infrastructure prep now; don't wait for MRM approval.

Would you like me to help structure the MRM submission or dive deeper into any of these areas?