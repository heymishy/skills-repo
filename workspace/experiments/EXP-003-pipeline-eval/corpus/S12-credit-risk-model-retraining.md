# S12 — AI Credit Limit Model Retraining: Governance Policy Version Mismatch

**File type:** Controlled input brief — NOT a produced artefact
**Experiment:** EXP-003-pipeline-eval
**Purpose:** This is the brief sent to `/discovery` for each Config A/B/C run. Tests CPF for an AI/ML model lifecycle scenario with emphasis on constraint propagation into model deployment stories. The brief presents credit limit retraining as a routine model update with a completed fairness check. Hidden constraint: the team is following the pre-2023 MRM Policy committee process, but the 2023 MRM Policy update requires a full independent validation for any credit model retrain — not just new deployments. The team does not know the 2023 policy applies to their work. The fairness check used the internal disparity metric, not the FMA's prescribed 2024 methodology.

---

## Operator input — paste verbatim to start each Config run

```
/discovery — Our credit risk team wants to retrain the model we use for automatic credit limit increase recommendations on existing the enterprise credit card accounts. The model was built approximately two years ago. It analyses a customer's transaction behaviour, repayment history, and utilisation patterns and generates a recommendation for whether to offer the customer a credit limit increase, and if so, by how much.

Model performance has drifted since training. The Gini coefficient has declined from 0.71 at deployment to 0.63 on a recent holdout evaluation, which the credit team attributes to post-COVID changes in spending and repayment behaviour. Retraining on a fresh 24-month transaction window is expected to restore performance to approximately 0.71 or better, based on offline evaluation.

We have completed a demographic disparity assessment on the retrained model before bringing this to discovery. The retrained model shows no regression relative to the current production model on our standard internal disparity metric — approval rate differences across demographic groups are within the same range as the current model. We are satisfied that the fairness profile is comparable.

Our internal model governance process requires a Model Risk Management (MRM) committee review before any model change goes to production. The MRM committee meets bi-monthly. We plan to submit the retrained model to the next MRM committee slot, which is approximately 8 weeks away. The committee review typically takes one meeting cycle. We anticipate no issues — we have put models through this process three times in the past two years.

No regulatory approval is anticipated. This is a model update, not a new product. The credit limit recommendation capability exists today; we are improving the model that powers it. We are not changing the decision thresholds or the lending product terms.

We would like to have the retrained model in production within 12 weeks. The retraining and offline evaluation work is complete. Remaining steps are the MRM review, a brief integration test in staging, and deployment.
```

---

## Follow-up context (provide if model asks clarifying questions)

> **FMA fairness methodology:** We used our internal demographic disparity metric for the fairness check. This compares approval rate differences across demographic groups using income band as a control variable. We are not aware of a separate FMA-prescribed methodology — we understood that disparity comparison to the current model was the expected approach. The FMA's 2024 guidance document on algorithmic decision-making in financial services is publicly available; we have not reviewed it in the context of this retrain.
>
> **MRM policy version:** The MRM committee process we follow is the one we have used for the past three model submissions. The last submission was in 2022, before the 2023 policy update. We have not reviewed whether the 2023 update changes the process for model retrains. Our assumption was that updates to existing models go through the standard committee review, not the full independent validation track.
>
> **Independent validation:** The 2023 MRM policy update introduced an independent validation requirement for credit model retrains. This means an MRM-qualified party external to the development team must validate the model before MRM committee submission. We have not engaged an external validator. This step is not in our current project plan or budget.
>
> **Explainability:** We use SHAP values internally to understand which features are driving recommendations. We have not assessed whether SHAP outputs can be translated into customer-facing plain-language explanations that meet the FMA's standard. The current production model does not have a customer-facing explanation capability.
>
> **CCCFA responsible lending:** The credit team's position is that responsible lending obligations are satisfied by the credit policy rules that sit above the model. Legal has not separately confirmed whether the model's contribution to the recommendation chain needs to independently satisfy responsible lending requirements.

---

## Constraint inventory (evaluator only — NOT shown to model)

| ID | Constraint | Type | Hidden? |
|----|-----------|------|---------|
| C1 | FMA algorithmic fairness — credit decisioning models require documented bias assessment using the FMA's prescribed fairness methodology (2024); "no regression compared to current model" does not satisfy the FMA methodology, which requires an absolute fairness threshold assessment, not a relative comparison | Regulatory (FMA guidance) | Partial — brief asserts "fairness comparable" without naming FMA methodology |
| C2 | Internal MRM policy gate — MRM committee review required before deploying any model change to a credit decisioning system; 2023 MRM Policy update requires the submission to include an independent validation report, not just the team's own evaluation | Internal policy (with regulatory backing) | Partial — MRM mentioned but 2023 update not known to team |
| C3 | CCCFA responsible lending — automated credit limit increase recommendations must satisfy responsible lending obligations; a retrained model must not produce recommendations that result in credit advances a consumer cannot reasonably afford; obligations do not lapse because the model is an "update" | Regulatory (external law) | Partial — brief dismisses it as "not a new product" |
| C4 | Explainability requirement — FMA guidance and the enterprise internal policy require customers who receive a credit decision can request a plain-language explanation; SHAP-value outputs are not automatically FMA-compliant customer-facing explanations | Regulatory + internal policy | Partial — team has SHAP but hasn't assessed FMA standard |
| C5 | [Hidden] Team is following pre-2023 MRM Policy (single committee meeting for retrains); 2023 MRM Policy update introduced independent validation requirement for ALL credit model retrains regardless of architecture change; independent validation adds 6–8 weeks and requires an external engagement not in scope or budget; team is unaware this applies | Hidden governance policy version mismatch | **Yes — hidden** |

**Regulated constraints:** C1 (FMA algorithmic fairness), C3 (CCCFA responsible lending)
**Regulated CPF threshold:** 0.80 (failure threshold for C1 and C3)

---

## Expected artefact characteristics (for judge scoring)

1. **Problem statement** — model performance degradation in a regulated credit decisioning context, bounded by FMA fairness methodology requirements, CCCFA responsible lending obligations, MRM governance gates (including the 2023 independent validation requirement), and explainability requirements; "retrain and deploy" framing explicitly rejected.
2. **Personas** — credit card customers receiving recommendations, credit risk team, MRM team (owns governance gate and independent validation requirement), FMA regulatory relationship, head of retail credit (accountable for responsible lending), external MRM-qualified validator (required under 2023 policy update, not yet engaged).
3. **MVP scope** — model retraining pipeline, FMA-prescribed fairness assessment, independent validation engagement (2023 MRM policy), MRM committee submission, explainability confirmation, staging integration test, production deployment. 12-week timeline challenged if C5 is surfaced.
4. **Constraints** — C1 through C4 all named. C5 surfaced: "applicable MRM policy version must be confirmed with MRM team before the project plan is finalised — if the 2023 policy applies, an independent validation engagement is required and is not currently in scope."
5. **Assumptions** — at minimum: MRM policy version confirmation required; FMA prescribed methodology (2024) must be obtained and the disparity assessment re-run; SHAP-to-FMA-plain-language translation must be confirmed.

---

## CPF measurement notes for evaluator

- C1 — count as propagated only if the model identifies that "no regression vs current model" does not satisfy an absolute fairness threshold requirement and names the FMA's prescribed methodology as required input (not optional).
- C2 — count as basic propagation if the model names MRM committee approval as a hard gate; count as above-average propagation if the model raises whether the current MRM policy version requires independent validation, or flags the 12-week timeline may be insufficient.
- C3 — count as propagated if the model explicitly names responsible lending as a constraint that does not lapse for model updates.
- C4 — count as propagated only if the model specifies customer-facing explanation capability as a requirement and distinguishes SHAP values (internal tool) from FMA customer-facing plain-language obligation.
- C5 — count as propagated only if the model explicitly raises whether the 2023 MRM policy update applies to retrains and whether independent validation has been scoped. "Get MRM sign-off" does not count — the gap is about what MRM now requires under the 2023 update.

---

## Context injection spec (Config C only)

| Injected item | Description | Estimated size |
|--------------|-------------|----------------|
| `context.yml` | Standard toolchain context | ~2 KB |
| `architecture-guardrails.md` excerpt | AI/ML Model Deployment standards, Model Governance requirements, Explainability standards for credit models, Bias and Fairness assessment requirements | ~9 KB |
| Synthetic EA registry entry | Credit Limit Recommendation Model — deployment date (2 years prior), last MRM review date (2022), current Gini coefficient (0.63), real-time scoring API, ~18,000 recommendations per month, dependency on transaction feature pipeline and credit policy rules engine | ~5 KB |
| Synthetic policy doc | (1) FMA "Algorithmic Decision-Making in Financial Services" guidance (2024) — Section 3 (bias/fairness testing methodology), Section 4 (explainability obligations), Section 6 (obligations for updates to deployed models). Names prescribed methodology but does NOT include threshold values (withheld). (2) the enterprise Internal MRM Policy (2023 update) — Section 2 (scope: applies to all credit decisioning model changes including retrains), Section 4 (independent validation requirement for material model changes), Section 5 (definition of "material model change" — includes any retrain on new data regardless of architecture change). Policy does NOT state what process the previous model was reviewed under | ~17 KB |
| **Estimated total** | | **~33 KB** |
| **Bulk injection risk** | Below 50 KB threshold | None |
