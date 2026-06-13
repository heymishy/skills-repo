# Discovery Pipeline: Initial Assessment

Before I run the discovery framing, let me be clear about my role here: I'm pressure-testing the assumptions in this submission, not rubber-stamping a path to production. Several claims in this brief are doing a lot of load-bearing work, and a few deserve scrutiny. Let me walk through them.

---

## 1. The framing of "this is just a model update, not a new product"

This is the assumption I'd challenge hardest, because it's the one being used to retire the regulatory question.

**The capability existing today does not mean the risk profile is unchanged.** A retrained model on a fresh 24-month window is a *new decision-making artifact*. The fact that thresholds and product terms are static doesn't mean the model's behavior is static — by design, you're changing what the model recommends. That's the whole point of retraining.

Questions that need explicit answers, not assumptions:

- **What jurisdictions does this operate in, and what do they require?** "No regulatory approval anticipated" is a conclusion, not an input. Depending on where you operate (US — ECOA/Reg B/SR 11-7; EU — the AI Act treats creditworthiness assessment as *high-risk*; UK — FCA Consumer Duty), credit decisioning models can carry obligations that attach to *material model changes*, not just new products. A Gini shift from 0.63 back to 0.71 is a material change in model behavior.
- **Who made the "no regulatory approval" determination, and is it documented?** If this is the credit team's read rather than a sign-off from legal/compliance, that's a gap. The discovery output should record *who* owns that conclusion.

I'm not asserting you need regulatory approval. I'm flagging that the brief *assumes* the answer to a question it hasn't shown its working on.

---

## 2. The fairness assessment is weaker than it's being presented

This is the second claim I won't accept at face value.

The brief says: *no regression relative to the current model on approval rate differences across demographic groups, within the same range.*

Problems:

- **"No regression vs. a drifted incumbent" is the wrong baseline.** The current production model has degraded for two years. If its fairness profile drifted alongside its performance, "comparable to current" could mean "comparable to a model that's quietly gotten worse." Parity with a degraded baseline is not evidence of an acceptable absolute fairness profile.
- **Approval rate difference is one metric, and a coarse one.** A credit *limit increase* model has two outputs: whether to offer, and *how much*. Disparity in the **magnitude** of recommended increases can exist with identical approval rates. Has the assessment looked at the size of recommended increases across groups? This is where economic harm actually accrues.
- **What demographic groups, and how defined?** "Standard internal disparity metric" needs to be named. Which protected characteristics? Are intersectional cohorts examined or only marginal ones?
- **COVID-era spending/repayment behavior was not demographically uniform.** The exact thing motivating the retrain — behavioral change — landed differently across income bands, sectors, and demographics. A model trained on 2022–2024 data could encode pandemic-shaped patterns as durable signal in ways that correlate with protected attributes. "Comparable approval rates" doesn't rule this out.

**Recommendation:** the fairness claim should be re-stated against an *absolute* standard and should cover increase-magnitude disparity, not just approval-rate parity vs. the incumbent.

---

## 3. The timeline assumptions

- *"Committee review typically takes one cycle… we anticipate no issues… three times in the past two years."* Past clean passes were likely for changes the committee judged routine. If MRM is doing its job, a model with a measurable performance and behavioral change should get scrutiny on exactly the fairness/regulatory questions above. Planning for "no issues" creates pressure to wave through the items I've flagged. **Don't pre-commit to a 12-week date that depends on MRM not raising the questions MRM exists to raise.**
- The 8-week wait to the next slot is fixed — that's fine. But use those 8 weeks to close the gaps, not to treat the date as locked.

---

## 4. What's *not* in the brief that should be

- **Monitoring plan post-deployment.** The model drifted from 0.71 to 0.63 over two years — was that detected proactively or at a holdout checkpoint? What's the ongoing drift-detection and fairness-monitoring plan for the *new* model? Retraining without fixing the detection gap means you're back here in 24 months.
- **Adverse action / explainability.** If recommendations feed decisions that affect customers, can you generate reason codes for the new model? A model swap can break downstream explanation logic.
- **Rollback criteria.** What triggers reverting to the prior model?

---

## Discovery Output: Open Questions to Resolve Before MRM

| # | Question | Owner | Blocker? |
|---|----------|-------|----------|
| 1 | Documented legal/compliance sign-off on regulatory status per jurisdiction (esp. EU AI Act high-risk treatment) | Legal/Compliance | **Yes** |
| 2 | Fairness re-assessment against absolute standard + increase-magnitude disparity, not just approval-rate parity vs. incumbent | Model Risk / Fairness | **Yes** |
| 3 | Named protected groups + intersectional analysis | Fairness | Yes |
| 4 | Check for COVID-era behavioral signal correlating with protected attributes | Modeling | Yes |
| 5 | Post-deployment drift + fairness monitoring plan | MLOps / Credit | Should-have |
| 6 | Adverse-action / reason-code compatibility | Compliance / Modeling | Should-have |
| 7 | Rollback criteria | Credit Risk | Should-have |

---

## Bottom line

The performance case for retraining is reasonable and well-evidenced. But two of the brief's conclusions — *"no regulatory approval anticipated"* and *"fairness profile is comparable"* — are presented as settled when they're actually assumptions resting on a weak baseline and an unstated jurisdictional read. I'd resolve items 1–4 before this goes to MRM, not after. That makes the committee review smoother *and* means you're not relying on the committee to catch what discovery should have.

Want me to draft the fairness re-assessment scope (item 2) or the regulatory-status questions for legal (item 1) next?