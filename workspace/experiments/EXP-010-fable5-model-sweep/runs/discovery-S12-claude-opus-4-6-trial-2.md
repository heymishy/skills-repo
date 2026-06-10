

# Discovery Summary

## Credit Limit Increase Recommendation Model — Retraining

### What is being proposed?

Retraining the existing credit limit increase recommendation model on a fresh 24-month transaction window to address observed performance drift. The model analyses transaction behaviour, repayment history, and utilisation patterns on enterprise credit card accounts and recommends whether to offer a credit limit increase and the amount.

This is a like-for-like model update — same architecture, same decision thresholds, same product terms — intended to restore predictive performance to its original level.

---

### What problem does this solve?

The production model's Gini coefficient has declined from 0.71 at deployment to 0.63 on recent holdout evaluation, attributed to post-COVID shifts in spending and repayment behaviour. The degraded model is generating less accurate credit limit increase recommendations, which creates two risks running in parallel: under-recommendation (missed revenue and customer dissatisfaction) and over-recommendation (increased credit exposure on accounts that do not warrant an increase). Retraining on current data is expected to restore performance to approximately 0.71 or better based on completed offline evaluation.

---

### Key Facts and Constraints

| Dimension | Detail |
|---|---|
| **Current state** | Production model Gini at 0.63, down from 0.71 at deployment (~2 years ago) |
| **Expected outcome** | Retrained model restores Gini to ≈0.71+ per offline evaluation |
| **Work completed** | Retraining and offline evaluation are done |
| **Fairness assessment** | Demographic disparity assessment completed; approval rate differences across demographic groups are within the same range as the current production model — no regression observed |
| **Governance gate** | MRM committee review required before production deployment; next slot ≈8 weeks out, typically resolved in one meeting cycle |
| **Regulatory posture** | No regulatory approval anticipated — this is a model update on an existing capability, not a new product or change to lending terms |
| **Target timeline** | Production deployment within 12 weeks |
| **Remaining work** | MRM submission and review → integration test in staging → deployment |

---

### Areas Requiring Further Exploration

The following items are not objections to the proposal. They are areas where I want to develop a fuller understanding before moving to assess, either because the information was not covered in this conversation or because the details provided would benefit from elaboration.

**1. Fairness assessment methodology and sufficiency**

The team has confirmed that the retrained model shows no regression on a standard internal disparity metric (approval rate parity). I want to understand this more fully:

- What specific metric is being used and what thresholds define "within the same range"?
- Approval rate parity is one lens. Has the assessment examined outcome-level disparity — for example, whether customers who receive increases under the retrained model experience differential default rates across demographic groups? A model can be approval-rate neutral but shift risk unevenly.
- Was the assessment conducted on the same demographic categories as the original model validation, or has the scope been updated?
- Is the 24-month retraining window itself demographically representative, or could COVID-era behavioural shifts be correlated with demographic factors in ways that change the model's effective treatment of subgroups even if headline approval rates look stable?

I am not suggesting a problem exists. The completed assessment is a strong starting point. I want to confirm its scope is sufficient for the MRM submission and for our own confidence.

**2. Performance metric context**

Gini coefficient tells us about rank-ordering power. A few supplementary questions:

- What does the performance decline look like in business-outcome terms — has the team quantified changes in default rates, loss rates, or acceptance rates on recommended increases since drift began?
- Are there specific customer segments or account profiles where drift is concentrated, or is it broadly distributed?
- The offline evaluation targets ≈0.71 Gini. What monitoring regime will be in place post-deployment to detect future drift earlier, and is there a defined threshold that would trigger the next retraining cycle?

These help frame the urgency and the ongoing risk posture.

**3. Retraining scope and architecture**

The proposal describes this as retraining on fresh data, not a model redesign. To confirm:

- Is the feature set identical to the current production model, or have any features been added, removed, or re-engineered?
- Is the model architecture (algorithm, hyperparameter configuration) unchanged?
- If any features or architecture elements have changed, this starts to shade from "retraining" toward "model redevelopment," which may carry different governance or validation expectations.

**4. Integration and deployment risk**

The remaining technical steps are described as brief. I'd like to understand:

- Does the retrained model produce outputs in exactly the same format and scale as the current model, such that downstream systems (decisioning logic, limits engines, customer communications) require zero change?
- What is the rollback plan if post-deployment monitoring shows unexpected behaviour?
- Is there a shadow-mode or champion-challenger deployment option, or will this be a full cutover?

**5. MRM process confidence**

The team expresses high confidence in MRM approval based on three prior successful submissions. Understood — but I want to briefly confirm:

- Does the MRM committee have any new requirements or heightened scrutiny standards that have been introduced since the last submission?
- Is the 8-week timeline firm, or is there risk of the slot slipping? The 12-week production target has very little slack if the MRM meeting moves.

**6. Regulatory and conduct considerations**

The team's position that no regulatory approval is needed appears sound on the facts presented. Two areas to confirm:

- Has the credit risk or compliance team confirmed in writing that this model update does not trigger any notification or reporting obligation under the institution's regulatory framework — even as an informational filing?
- Are there any conduct-risk considerations around the population that will newly receive (or lose) increase recommendations under the retrained model? Even with stable approval rates in aggregate, the specific customers affected may shift. If a meaningful population segment that was previously recommended for an increase is no longer recommended (or vice versa), is there a customer-impact or complaints-handling consideration?

---

### Initial Observations on Viability

This is a well-scoped proposal with a clear problem statement, completed technical work, a defined governance path, and a reasonable timeline. The team has proactively conducted a fairness assessment before bringing this to discovery, which is good practice.

The primary dependency is the MRM committee timeline. The primary areas where I want deeper understanding are the fairness methodology (to confirm it is robust enough, not to suggest it isn't) and the post-deployment monitoring posture.

Nothing raised in discovery suggests this proposal cannot proceed. The areas above are about building the right level of understanding to move into a confident assessment.

---

**Next step:** I would like to schedule a follow-up conversation to work through the areas listed above. Once those are addressed, we can move to the /assess phase.