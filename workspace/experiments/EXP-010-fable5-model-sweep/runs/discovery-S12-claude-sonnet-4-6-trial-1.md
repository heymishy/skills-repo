# Discovery Report: Credit Limit Increase Model Retraining

---

## What I understand you're doing and why

Your credit risk team operates an automated model that recommends credit limit increases for existing enterprise credit card customers. The model analyses transaction behaviour, repayment history, and utilisation patterns, and outputs both a yes/no recommendation and a suggested increase amount.

The current production model is approximately two years old. Its Gini coefficient has declined from 0.71 at deployment to 0.63 on recent holdout evaluation. Your attribution is plausible — post-COVID shifts in spending and repayment behaviour are a well-documented source of model drift in consumer and commercial credit. Retraining on a fresh 24-month window has restored offline performance to approximately 0.71 or better.

The retraining and offline evaluation are complete. You are now in the governance and deployment phase. Your target is production within 12 weeks.

Before I confirm the shape of this engagement, I want to work through several areas carefully — some of which I think deserve more scrutiny than your framing currently gives them.

---

## What looks straightforward

**The technical case for retraining is clear.** A Gini decline of 8 points is material for a credit decisioning model. Retraining on a behavioural window that reflects current customer patterns is the appropriate response. The offline recovery to ~0.71 is a positive signal, and the approach is methodologically sound on its face.

**The governance path is defined.** You have an established MRM process, a known committee cadence, and a track record of three prior submissions. This is not a novel governance situation for your organisation.

**The 12-week timeline is plausible** if the MRM review proceeds in the next available slot and integration testing is not complex. Eight weeks to MRM approval plus a brief staging and deployment window is tight but achievable if nothing slips.

---

## Areas where I want to push back or go deeper

I have four areas of concern. Some are questions I need answered to scope the engagement correctly. Others are gaps I think exist in your current framing that I'd want to surface now rather than later.

---

### 1. The fairness assessment as described is not sufficient, and I'd like to understand it more carefully

You've told me that the retrained model shows no regression relative to the current model on approval rate differences across demographic groups, and that you're satisfied the fairness profile is comparable.

I want to be direct: **"no regression versus a drifted model" is a lower bar than it may appear.** If the current production model's fairness profile has itself shifted over two years — which is likely if the model has drifted overall — then demonstrating parity with the current model does not establish that the retrained model meets the fairness standard you'd have applied at original deployment.

There are also several dimensions that "approval rate differences" alone does not cover:

- **Limit amount disparities.** The model recommends not just whether to offer an increase but how much. Approval rate parity can coexist with systematic differences in recommended limit amounts across demographic groups. Have you evaluated the distribution of recommended increase amounts by demographic group, not just binary approval rates?
- **Intersectional analysis.** Approval rate differences at group level can mask disparate impacts on intersectional subgroups. Depending on your customer base and applicable obligations, this may matter.
- **Calibration by group.** If the model's probability estimates are less well-calibrated for some groups than others, downstream decisions will be inequitable even with similar approval rates.
- **Which demographic attributes were assessed.** You've referenced a "demographic disparity assessment" without specifying which protected characteristics were included. For a credit product, at minimum race/ethnicity, sex, age, and national origin would typically be in scope under applicable fair lending obligations.

I'm not suggesting your model is unfair. I'm noting that the description you've given me is not sufficient for me to assess whether the fairness evaluation was adequate. Before MRM submission, I'd want to understand the full scope of what was assessed and be confident the analysis would survive regulatory scrutiny — not just internal review.

**What I need from you:** The full fairness evaluation documentation, including which protected classes were assessed, what metrics were applied beyond approval rate differences, whether amount distributions were analysed, and how the analysis was conducted (matched pairs, regression-based, etc.).

---

### 2. The regulatory position deserves more careful examination than "no regulatory approval anticipated"

You've characterised this as a model update rather than a new product, and on that basis concluded no regulatory approval is required. That framing is likely correct in a narrow sense, but there are adjacent regulatory obligations worth naming explicitly.

**Fair lending supervision.** In most jurisdictions where enterprise credit cards are offered, automated credit decisioning models — including those governing limit increases — fall within the scope of fair lending regulation (ECOA and Regulation B in the US, equivalent regimes elsewhere). A model change, even one characterised as a retrain rather than a redesign, that produces materially different outcomes for protected classes can attract examiner scrutiny. "No new product" does not equal "no regulatory exposure." The question is whether the retrained model produces materially different credit outcomes for any protected class — which connects directly to my point above.

**Adverse action and explainability obligations.** If the retrained model changes the population of customers who are declined limit increases, customers who were previously approved may now be declined. Depending on your notification practices, adverse action reason codes may need to be reviewed for consistency with the new model's feature importance profile.

**SR 11-7 or equivalent model risk guidance.** If you're a US-regulated institution, SR 11-7 applies to this change and your MRM process presumably reflects it. I'd want to confirm the MRM submission will include the validation elements that guidance requires — independent validation, not just development-team evaluation.

I'm not raising these to suggest you're non-compliant. I'm raising them because "no regulatory approval anticipated" is a conclusion that should be explicitly derived from a review of applicable obligations, not assumed from the product continuity argument alone. If your compliance or legal team has signed off on this characterisation, that's sufficient — I'd just want to know that review occurred.

**What I need from you:** Confirmation that compliance and/or legal has reviewed the regulatory position, and any documentation of that review.

---

### 3. I want to understand the model's recommendation pathway more precisely

You've described the model as generating a recommendation for whether to offer a credit limit increase, and if so, by how much. I want to understand how that recommendation becomes a decision.

- Is there human review of individual recommendations, or is this a straight-through automated decisioning flow?
- If there is human review, at what point, by whom, and is there any evidence of how consistently reviewers apply or override the model output?
- You've said you're not changing decision thresholds. Can you confirm whether the retrained model's score distribution is comparable to the current model's — specifically, whether the same threshold values produce similar approval rates at portfolio level? A retrained model with the same threshold can produce a materially different approval volume if the score distribution has shifted.
- What happens to customers currently sitting just above or below a threshold? Is there any analysis of population-level outcome changes when the new model replaces the old?

These questions matter for integration testing scope and for understanding the true operational impact of the change.

---

### 4. The 12-week timeline has one meaningful dependency that you don't fully control

Your plan is: MRM submission in ~8 weeks, one committee cycle for review, then integration test and deployment. The critical path assumption is that MRM approves in a single cycle.

You've noted you anticipate no issues based on three prior successful submissions. That's reasonable grounds for optimism, but I'd note:

- The fairness documentation questions I've raised above could, if the MRM committee shares my view, result in a request for additional analysis before approval. That adds at least one committee cycle — another two months.
- If the committee has questions about the regulatory position or about population-level outcome shifts, similar delays apply.

I'm not predicting this outcome. I'm saying the 12-week timeline should be understood as contingent on a clean first-pass MRM review, and that the areas I've flagged above are the most likely sources of a request for additional information.

The practical implication for scoping: we should structure the remaining work so that the MRM submission package is as complete as possible before submission, which means addressing the fairness documentation and regulatory position questions *before* the submission, not in response to committee feedback.

---

## What I think the engagement scope looks like

Based on what you've described, the remaining work is:

**1. MRM submission preparation** — assembling and reviewing the submission package to ensure it covers development methodology, validation results, fairness analysis, and any required independent validation components. This is where I'd want to invest time upfront to reduce MRM cycle risk.

**2. Integration and staging** — confirming the retrained model integrates correctly with the existing decisioning infrastructure, that score distributions are as expected, and that threshold behaviour at portfolio level is understood.

**3. Deployment and monitoring setup** — production rollout with monitoring configured for Gini, approval rate, demographic parity metrics, and score distribution stability. Post-deployment monitoring cadence should be established before go-live, not after.

What I am not scoping as part of this engagement: the retraining and offline evaluation work, which you've told me is complete.

---

## Questions I need answered before confirming scope and approach

To proceed, I'd like your team to address the following:

1. Can you share the full fairness evaluation documentation, including protected classes assessed, metrics applied, and whether limit amount distributions (not just approval rates) were analysed?

2. Has compliance or legal reviewed and signed off on the regulatory position? If so, can you share that review?

3. What is the model's decisioning pathway — straight-through automated or human-reviewed? And has there been any analysis of portfolio-level approval rate impact when the new model is applied at current thresholds?

4. What does the MRM submission package currently contain, and has an independent model validator (separate from the development team) conducted a review?

5. Who owns the post-deployment monitoring function, and is there an existing monitoring framework for this model that will be updated, or does monitoring need to be established?

The answers to these questions will let me confirm whether the 12-week timeline is realistic, whether there are gaps that need to be addressed before MRM submission, and what the right shape of support is for the remaining work.

---

## Summary position

This is a well-motivated, technically grounded model update with a clear governance path. My main concerns are not about the retraining itself but about (a) whether the fairness evaluation is comprehensive enough to support both MRM approval and regulatory defensibility, and (b) whether the regulatory position has been formally reviewed rather than assumed. Both are addressable before the MRM submission window, which is the right time to address them.

I'd recommend our next conversation focus on reviewing the fairness documentation and confirming the compliance sign-off, as those are the items most likely to affect your timeline if they surface late.