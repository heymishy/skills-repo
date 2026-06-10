# Discovery Report: Credit Limit Increase Model Retraining

---

## What I understand you're doing and why

You have a deployed model that recommends credit limit increases on enterprise credit card accounts. Its discriminative performance has meaningfully degraded over two years — a Gini decline from 0.71 to 0.63 is not cosmetic drift; it represents a materially less reliable ranking of customers by credit risk. The cause is plausible and well-understood: COVID-era disruptions to spending and repayment patterns shifted the underlying data distribution. You've retrained on a fresh 24-month window, recovered the performance, and completed a fairness assessment. The remaining path to production involves governance review, integration testing, and deployment. Your target is 12 weeks.

This is a well-scoped, technically mature project. The main work at this stage is confirming that the path you've described is complete, and identifying any risks that could disrupt the timeline or create problems after deployment.

---

## Clarifying questions before confirming scope

Before treating the remaining work as straightforward, I want to surface a set of questions. Some may have obvious answers your team already has — but they're worth making explicit.

---

### 1. Model governance and the MRM submission

**The 8-week meeting slot is fixed, but is the submission deadline earlier than that?**

MRM committees typically require documentation packages to be submitted in advance — sometimes 2–3 weeks before the meeting date. If the next committee meeting is 8 weeks away, your effective submission deadline may be 5–6 weeks away. Have you confirmed what needs to be in that package, and whether all of it is ready now?

**What does the MRM committee actually review for a retrained model?**

You've put three models through this process, which is valuable precedent. But I'd want to confirm: were any of those three a *retrain of an existing model* rather than a new model? The documentation requirements and scrutiny level can differ. A retrained model sometimes attracts questions about why performance degraded in the first place, whether the training data window choices are justified, and whether the model is stable enough not to require retraining again soon.

**Is there a shadow period or post-deployment monitoring requirement attached to MRM approval?**

Some governance processes approve a model conditionally — requiring a parallel-run or shadow period before full production cutover, or mandating specific monitoring thresholds and escalation triggers. If that's the case here, it would affect your 12-week timeline and your operational readiness requirements.

---

### 2. The fairness assessment — what was assessed and what was the scope

You've described the fairness result as: approval rate differences across demographic groups are within the same range as the current model. I want to ask a few specific questions here, not to challenge the conclusion, but because the framing matters for what the MRM committee may ask and for your own risk posture.

**"No regression" compared to a drifted model — is that the right baseline?**

The current production model has a Gini of 0.63. A model with degraded predictive performance can have fairness properties that differ from what you'd see at 0.71 Gini. If the retrained model at 0.71 Gini shows comparable disparity metrics to the current model at 0.63, that's not necessarily a clean result — it depends on the direction of any interaction effects. Have you compared the retrained model's fairness profile against the *original deployed model* at 0.71, not just the current drifted version?

**What demographic dimensions were assessed?**

You mention demographic groups but don't specify which. For enterprise credit cards, the relevant dimensions may include age, gender, and race/ethnicity if that data is available, but also proxies like geography or business type if direct demographic data is limited. What was actually in scope for the assessment?

**Were both approval rates and credit limit amounts assessed?**

The model generates two outputs: a recommendation of whether to offer an increase, and a recommendation of how much. Approval rate disparity addresses the first. Were disparities in recommended increase amounts also examined across groups? A model can show parity on approval rates while showing meaningful disparities in the magnitude of offers.

**Who conducted the assessment?**

Was this the model development team assessing their own model, or an independent review? I'm not implying a problem — but MRM committees sometimes ask this, and it's worth knowing in advance whether independent validation is expected.

---

### 3. Training data and the 24-month window

**Does the training window include any data that shouldn't be used?**

The 24-month window will include the COVID period and its aftermath — which is precisely the behavioural shift you're trying to capture. But it also means you're training on a period that included significant macroeconomic interventions: stimulus payments, payment deferrals, forbearance programs, elevated savings rates. Some of those intervention effects are now unwinding. Have you assessed whether patterns from, say, mid-2021 are representative of how customers will behave going forward, or whether they introduce noise or bias into the model?

**What's the vintage composition of the training data?**

For a credit model, the outcomes (repayment, utilisation changes, default) need time to develop. Within a 24-month window, the most recent cohorts will have shorter outcome observation periods. How did you handle this — did you apply a performance window cutoff, vintage weighting, or exclude the most recent originations from the outcome labels?

**Has the feature set changed?**

You mention the model analyses transaction behaviour, repayment history, and utilisation patterns. Are the features in the retrained model identical to the production model, or were any features added, removed, or redefined? If features changed, the integration testing scope may be broader than a "brief" test.

---

### 4. The integration test

**What does "brief integration test in staging" actually cover?**

This is the one area where I'd want more specificity before agreeing that 12 weeks is achievable. Integration tests for model deployments often expand once they begin. Specific questions:

- Is the model being deployed in the same serving infrastructure as the current model, or has anything in the pipeline changed in two years?
- Are there upstream data feeds that need to be verified — ensuring that the features the model expects are being computed and delivered correctly in production?
- Is there a defined pass/fail criteria for the integration test, or is it exploratory?
- Who owns the integration test — the model team, a separate engineering team, or a combination? Do they have capacity in your timeline?

**Is there a production cutover strategy?**

When the retrained model goes live, do you intend to do a hard cutover, or a gradual rollout (e.g., a percentage of traffic, or a subset of accounts)? A gradual rollout is lower risk but requires monitoring infrastructure to be in place and adds time. A hard cutover is faster but means any issues affect all accounts immediately.

---

### 5. Regulatory position — are you confident no notification is required?

You've concluded that no regulatory approval is anticipated because this is a model update rather than a new product. That's likely correct, and I'm not suggesting you've missed something obvious. But I'd want to confirm a few things:

**Have you checked your obligations under any model-specific regulatory guidance that applies to your jurisdiction?**

In some jurisdictions, credit decisions that affect consumers (including credit limit changes) have specific model governance or explainability obligations — for example, requirements to provide adverse action notices with reasons, or obligations under fair lending regulation that apply to algorithm changes. If you operate in the US, SR 11-7 guidance applies to model risk broadly, and fair lending regulators (OCC, CFPB, state regulators) have shown increasing interest in algorithmic credit decision models. Even if formal approval isn't required, there may be a notification or documentation expectation.

**Does "enterprise credit card" mean the customers are businesses, not consumers?**

If the cardholders are businesses rather than individual consumers, the consumer protection and fair lending regulatory framework may be different or more limited. If individual consumers hold these cards under a business account, the analysis could differ. This affects the regulatory question and the fairness assessment scope.

---

### 6. Post-deployment monitoring

**What monitoring is in place for the retrained model after deployment?**

Given that you're deploying specifically because of drift, I'd expect a monitoring plan to be part of the deployment. Specific questions:

- How will you monitor Gini or equivalent performance metrics in production going forward, and at what frequency?
- What are the thresholds that would trigger a review or escalation?
- How frequently do you plan to retrain or reassess? If post-COVID normalisation continues, the data distribution may keep shifting.
- Are you monitoring for fairness metrics on an ongoing basis, or was the pre-deployment assessment a one-time check?

The MRM committee will likely ask about this. It's also a genuine risk — a model that needed retraining after two years of drift should have a defined monitoring cadence going forward.

---

## Preliminary timeline assessment

Your 12-week target is achievable if the conditions are right, but it's tight and has dependencies that need to be confirmed now.

| Step | Your assumption | Risk |
|---|---|---|
| MRM submission preparation | Work is complete | Confirm submission deadline vs. meeting date; confirm documentation package is ready |
| MRM review | One meeting cycle, 8 weeks out | Low risk given precedent, but any request for additional analysis resets the clock |
| Integration testing | Brief | Scope and duration unconfirmed; infrastructure changes in 2 years could expand this |
| Deployment | Straightforward cutover | Cutover strategy and rollback plan needed |

The realistic risk to your timeline is not the MRM committee — it's either a documentation gap that delays submission, or an integration test that uncovers something unexpected. Both of those risks are manageable if you start integration testing in parallel with the MRM process rather than sequentially.

---

## What I'd suggest as next steps for this engagement

1. **Confirm the MRM submission deadline and documentation requirements** against what you currently have prepared. Identify any gaps immediately.

2. **Revisit the fairness assessment framing** to ensure it will withstand MRM scrutiny — specifically the baseline comparison question and whether limit amounts (not just approval rates) were assessed.

3. **Define the integration test scope and ownership** in writing before the test begins, so you have a clear exit criterion and don't discover ambiguity mid-test.

4. **Confirm the regulatory position** with whoever in your organisation owns regulatory affairs for credit products, particularly if there is any consumer exposure.

5. **Draft the post-deployment monitoring plan** now, so it can be included in the MRM submission and so you're operationally ready at go-live.

---

## What I'm not raising as a concern

For clarity: I'm not raising the model performance recovery, the retraining approach, or the general governance path as concerns. A Gini recovery from 0.63 to 0.71 via retraining on a fresh data window is a standard and appropriate response to distribution shift. Your governance process appears well-established. The questions above are about confirming completeness and de-risking the path, not about whether the project is the right thing to do — it clearly is.

---

*If you can answer the questions above, I can produce a more precise scope definition, a refined timeline with explicit dependencies, and a risk register for this project.*