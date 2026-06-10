

# Discovery Assessment: Credit Limit Increase Model Retraining

## Understanding the Request

Your credit risk team wants to retrain an existing production model that recommends automatic credit limit increases on enterprise credit card accounts. The model analyses transaction behaviour, repayment history, and utilisation patterns to recommend whether to offer a limit increase and by what amount. Performance has degraded from a Gini of 0.71 to 0.63 due to post-COVID behavioural shifts, and retraining on a fresh 24-month window is expected to restore performance. The retraining and offline evaluation are complete; remaining work is governance review, integration testing, and deployment within a 12-week window.

This is a model update to an existing production capability, not a new product or a change in decision scope.

---

## Assessment

### What is Straightforward

**The core rationale is sound.** Model drift is well-documented, the cause is plausible, and retraining on a refreshed window is the standard remedy. A Gini decline from 0.71 to 0.63 is material enough to justify action, and restoring it is a legitimate performance objective.

**The governance path is established.** You have run models through MRM review three times in two years. The process exists, you know the timeline, and you anticipate no issues. An 8-week wait for the next committee slot followed by integration testing fits within your 12-week target.

**No new decision scope is being introduced.** The model already makes credit limit increase recommendations. You are not changing thresholds, product terms, or the population the model applies to. This meaningfully limits the incremental risk surface.

**The fairness assessment has been completed proactively.** You have compared the retrained model against the current production model on your standard disparity metrics and found no regression. This is the right comparison to make.

---

### Where I Want to Probe Further

There are several areas where the picture is incomplete or where I want to make sure we are not moving past important questions too quickly.

#### 1. What "comparable fairness profile" actually means in practice

You have confirmed that approval rate differences across demographic groups are within the same range as the current model. This is a necessary check, but I want to understand what it does and does not cover.

- **Approval rates vs. outcome rates.** Are you measuring only whether the model recommends limit increases at similar rates across groups, or are you also looking at whether the *outcomes* of those increases (default, delinquency, utilisation distress) are equitable? A model can have comparable approval rate parity while shifting which individuals within each group receive increases in ways that produce disparate outcomes downstream.
- **Amount distribution, not just approval.** The model recommends both whether to increase and by how much. Have you assessed the distribution of recommended increase amounts across demographic groups, or only the binary approval rate? It is possible to have parity on the yes/no decision while introducing disparity in the magnitude of increases offered.
- **Stability across score bands.** Is the fairness comparison conducted at the population level or within score bands? Population-level parity can mask within-band disparities, particularly if the retrained model shifts the score distribution differently for different groups.

I am not suggesting the retrained model has a fairness problem. I am asking whether the assessment you have done is sufficient to confirm it does not, or whether additional analysis is warranted before MRM submission.

#### 2. The training window and what it encodes

You are retraining on a 24-month transaction window, which would cover roughly mid-2023 to mid-2025. This is a deliberate choice to capture post-COVID behaviour, and it makes sense. But I want to understand whether you have considered what *else* this window captures.

- **Economic cycle positioning.** The last 24 months include a specific interest rate environment and macroeconomic context. A model trained purely on this window may learn patterns that are specific to this regime. Have you evaluated how the retrained model performs on data from other periods, or stress-tested it against scenarios where conditions change again?
- **Portfolio composition effects.** If the bank's customer acquisition strategy or account mix changed over the last two years, the training data reflects not just changed behaviour but a changed population. Is the model being validated on a population that is representative of the accounts it will score in production?
- **Interaction with current model decisions.** The training data was generated under the current production model's decisions. Customers who received limit increases under the old model may behave differently than those who did not. Have you accounted for this selection bias in model training and evaluation?

#### 3. The offline evaluation and what "restored performance" means

You report that offline evaluation suggests the retrained model will restore the Gini to approximately 0.71. I want to understand the evaluation methodology.

- **What is the holdout set?** Is it a time-based holdout (the most recent N months), a random sample, or something else? A time-based holdout is more informative for a model that will be applied going forward.
- **What is the target variable?** Credit limit increase models can be evaluated against several outcomes: whether the customer accepted the increase, whether they subsequently defaulted, whether they became distressed, whether the increase was profitable. Which outcome is the Gini measured against, and is it the right one?
- **How does "approximately 0.71" compare to what you need?** Is 0.71 a minimum threshold, a target, or simply the historical benchmark? If the model comes back at 0.68, does that change the decision?

#### 4. Deployment mechanics and monitoring

You describe the remaining steps as MRM review, integration testing, and deployment. This is probably fine, but I want to confirm a few things.

- **Champion-challenger or hard cutover?** Are you planning to run the retrained model alongside the current model for a period, or is this a direct replacement? Given that the current model is underperforming, a direct replacement may be justified, but a brief parallel run would provide additional confidence.
- **Post-deployment monitoring plan.** What monitoring will be in place after deployment? Specifically, how quickly will you detect if the retrained model's real-world performance diverges from offline evaluation, and what is the rollback mechanism?
- **Downstream system impacts.** The model feeds recommendations into a decision process. Are there any downstream systems, rules engines, or human review workflows that depend on the current model's score distribution or recommendation patterns? A retrained model that shifts the distribution of recommendations could have unexpected effects even if overall accuracy improves.

#### 5. The MRM timeline as a constraint vs. an assumption

You have framed the 8-week wait for MRM review as a given, and the 12-week end-to-end timeline follows from it. I want to flag two things.

- **Is there an expedited review path?** If the model is underperforming and you have completed the retraining and evaluation work, is there a mechanism to bring this to MRM sooner? I am not suggesting you bypass governance, but if the current model is making worse recommendations every day it runs, the cost of waiting is not zero.
- **Conversely, is 12 weeks actually sufficient?** The MRM committee typically takes one meeting cycle, and you anticipate no issues. But if the committee raises questions, particularly around the fairness assessment or the training window, the timeline could extend. Have you built contingency into the plan?

---

### What I Think the Key Risk Areas Are

In order of significance:

1. **The fairness assessment may be narrower than it needs to be.** Approval rate parity is a necessary but not sufficient condition. If the MRM committee or a future audit examines amount-level disparity or outcome-level disparity and finds issues, you will wish you had done that analysis now. This is the area I would invest additional effort in before submission.

2. **The training window creates regime-specific risk.** This is inherent in any retraining and not a reason to delay, but it should be acknowledged in the MRM submission and addressed with appropriate monitoring and stress testing.

3. **The offline-to-production gap is unquantified.** Offline Gini of 0.71 is encouraging but not a guarantee of production performance. Your deployment plan should include explicit monitoring thresholds and a rollback trigger.

4. **Selection bias in training data.** The interaction between the current model's decisions and the training data for the new model is a known methodological challenge. It may or may not be material here, but it should be addressed explicitly.

---

## Recommended Next Steps

Before this moves to build or to MRM submission, I would suggest the following:

1. **Expand the fairness assessment** to cover recommended increase amounts (not just approval rates) and, if feasible, projected outcome rates across demographic groups. This does not need to delay the timeline significantly but should be completed before MRM submission.

2. **Document the training window rationale and its limitations** explicitly in the MRM submission materials, including any stress testing or sensitivity analysis you have performed.

3. **Clarify the evaluation methodology** — specifically the holdout construction, target variable, and minimum performance threshold — so that the MRM committee has a clear basis for approval.

4. **Define the post-deployment monitoring plan** including performance thresholds, fairness monitoring, and rollback criteria, and include this in the MRM submission.

5. **Confirm the deployment approach** (champion-challenger vs. hard cutover) and ensure downstream systems are tested against the retrained model's output distribution.

6. **Assess whether an expedited MRM path is warranted** given the current model's underperformance, or alternatively, confirm that the cost of running the degraded model for 12 more weeks is acceptable.

---

## Overall Assessment

This is a well-motivated, well-scoped model update with a clear rationale and an established governance path. The team has done the right things: identified drift, retrained on a fresh window, evaluated offline performance, and conducted a fairness assessment before bringing it to review.

The areas I have flagged are not blockers. They are gaps in the current evidence that, if addressed, will strengthen the MRM submission, reduce the risk of post-deployment surprises, and ensure the fairness assessment is robust enough to withstand scrutiny. The 12-week timeline appears achievable if the MRM review proceeds as expected, but the plan would benefit from explicit contingency.

I am comfortable with this moving toward MRM submission once the expanded fairness analysis and monitoring plan are in place. I do not see a need for external regulatory engagement or a fundamental rethinking of the approach.