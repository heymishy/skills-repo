# Discovery Pipeline: Credit Limit Increase Model Retrain

Thanks for the detailed framing. Before I help you map the path to production, I want to surface several areas where the discovery framing may be underestimating risk or scope. My job here is to pressure-test, not just validate — so the bulk of what follows is challenge.

## What seems well-founded

- **The drift problem is real and quantified.** A Gini decline from 0.71 to 0.63 is material, and the COVID-era behavioural-shift hypothesis is plausible. Retraining on a fresh window is a reasonable response.
- **The governance discipline exists.** You have an MRM process, you've used it three times, and you've front-loaded a disparity assessment. That's a good posture.

Now the challenges.

## Challenge 1: "No regression on the disparity metric" is not the same as "fair"

This is the claim I'd push hardest on.

- You've shown the retrained model is **no worse than production** on your *standard internal disparity metric* (approval-rate differences across groups). That establishes *non-regression*, not *adequacy*. If the current model has a latent fairness problem, you've just confirmed you've preserved it.
- **The drift itself is a fairness event.** Post-COVID spending/repayment changes were not evenly distributed across demographic and socioeconomic groups. A model retrained on 24 months of post-COVID data is learning patterns that may encode pandemic-era hardship that fell disproportionately on certain populations. "Approval rates within the same range" can mask shifts in *who* gets the increases and *how large*.
- **You assessed approval rate, but the model also outputs increase amount.** Disparity in the *magnitude* of recommended increases is a distinct fairness dimension that your stated metric may not capture at all. Two groups with identical approval rates but systematically different increase amounts is a real disparate-impact exposure.
- **Single metric, single cut.** Was the assessment intersectional? Within-segment? Did you check calibration and error-rate balance, not just outcome rates?

**Recommendation:** Don't carry "fairness profile is comparable" into MRM as a settled conclusion. Reframe it as one input, and add (a) increase-amount disparity analysis, (b) intersectional cuts, and (c) an explicit look at whether the new training window shifted the *composition* of who benefits.

## Challenge 2: "No regulatory approval anticipated" — verify, don't assume

You've reasoned: same product, same thresholds, just a better model → no regulatory dimension. I'd treat that as a hypothesis to confirm, not a conclusion.

- **Credit decisioning is among the most regulated model use cases that exist.** Depending on jurisdiction, fair-lending law (e.g., ECOA/Reg B and disparate-impact doctrine in the US, consumer credit and equality legislation elsewhere) applies to the *model's behaviour*, not to whether you've labelled this a "new product."
- **"We didn't change the thresholds" doesn't mean the outcomes didn't change.** A model that restores Gini from 0.63 to 0.71 is, by construction, making materially different recommendations. At the same threshold, different customers now get different decisions. That is a change in lending outcomes even if the product terms are static.
- **Adverse action / explainability.** If recommendations feed into customer-facing decisions, the new model's feature behaviour may change what reasons are surfaced or whether they remain accurate and disclosable.
- **The right move is not to self-certify "no regulatory approval."** It's to get a documented sign-off from your compliance/legal/fair-lending function that confirms no external approval or notification is required. That sign-off is cheap insurance; the assumption is expensive if wrong.

**Recommendation:** Add an explicit compliance gate parallel to MRM. Do not let "no regulatory approval anticipated" stand unchallenged into the plan.

## Challenge 3: The MRM "we anticipate no issues" framing

Three clean prior passes is reassuring, but be careful about the base rate you're drawing from.

- Were those three prior models *fairness-sensitive credit decisioning models retrained on a post-COVID window with a flagged disparity question*? Or were they lower-stakes changes? The relevant prior is "how does MRM handle a model like *this one*," not "how often does MRM say yes."
- If you walk in framing fairness as "already settled" and regulatory as "not applicable," and MRM disagrees with either, you don't just lose the slot — you lose the *cycle*, because the next meeting is bi-monthly. **The 8-week-away meeting is a single point of failure with a ~8-week penalty for a miss.**

**Recommendation:** Pre-socialise with MRM before the formal slot. Surface the fairness scope and the compliance sign-off in advance so the committee isn't seeing open questions for the first time in the meeting that gates your timeline.

## Challenge 4: The timeline has no slack and an aggressive critical path

The plan is: MRM at week ~8 → integration test → deploy by week 12.

- That leaves ~4 weeks post-MRM for staging integration test *and* deployment, **assuming MRM approves on the first cycle with no conditions.**
- MRM committees frequently approve *with remediation conditions* (e.g., "deploy with enhanced monitoring," "add the increase-amount disparity analysis," "implement champion/challenger"). Conditions can consume your remaining 4 weeks or push you past 12.
- There's no buffer for the fairness work I flagged above, which ideally happens *before* MRM, not after.

**Recommendation:** Treat 12 weeks as a stretch target contingent on (a) front-loaded fairness + compliance work, (b) MRM pre-socialisation, and (c) clean first-cycle approval. Have a realistic fallback (16–18 weeks) ready so the team isn't tempted to cut the fairness/compliance steps to defend the date.

## Challenge 5: Monitoring is missing from the plan

The model drifted from 0.71 to 0.63 over two years — and it sounds like this was caught on a *recent holdout evaluation* rather than by continuous monitoring. If that's right, the more important systemic fix isn't this retrain; it's **why drift ran for up to two years before detection.**

- Retraining resets the clock but doesn't fix the detection gap. You'll drift again.
- **Recommendation:** Make ongoing performance *and* fairness monitoring (with alert thresholds) part of this deployment, not a future project. MRM is likely to ask for it anyway.

## Suggested discovery outputs / next steps

1. **Expand the fairness assessment** before MRM: increase-amount disparity, intersectional cuts, calibration/error-rate balance, and an explicit analysis of compositional shift from the new training window.
2. **Obtain a documented compliance/fair-lending sign-off** on the "no external approval required" position — don't self-certify.
3. **Pre-socialise with MRM** to de-risk the single-cycle gate.
4. **Add continuous performance + fairness monitoring** to the deployment scope, and investigate the detection gap that let drift persist.
5. **Re-baseline the timeline** with explicit contingency for MRM conditions; keep 12 weeks as a target, not a commitment.

Would you like me to turn this into a structured discovery brief / risk register, or focus next on the fairness assessment scope specifically?