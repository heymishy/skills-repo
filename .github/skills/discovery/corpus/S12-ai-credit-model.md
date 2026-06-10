# Corpus Case S12 — AI Credit Limit Model Retraining (MRM Policy Version Mismatch)

## Case metadata

```json
{
  "case_id": "S12",
  "label": "Credit limit model retrain — MRM policy version mismatch + FMA fairness methodology",
  "difficulty": "very-high",
  "domain": "MRM policy / FMA algorithmic fairness / CCCFA",
  "regulated_constraint_count": 2,
  "hidden_constraint": "2023 MRM policy update requires independent validation for retrains — team following pre-2023 process",
  "source": "workspace/handoffs/pipeline-corpus-S8-S13.md"
}
```

## Operator input

> /discovery — Our credit risk team wants to retrain the model we use for automatic credit limit increase recommendations on existing the enterprise credit card accounts. The model was built approximately two years ago. It analyses a customer's transaction behaviour, repayment history, and utilisation patterns and generates a recommendation for whether to offer the customer a credit limit increase, and if so, by how much.
>
> Model performance has drifted since training. The Gini coefficient has declined from 0.71 at deployment to 0.63 on a recent holdout evaluation, which the credit team attributes to post-COVID changes in spending and repayment behaviour. Retraining on a fresh 24-month transaction window is expected to restore performance to approximately 0.71 or better, based on offline evaluation.
>
> We have completed a demographic disparity assessment on the retrained model before bringing this to discovery. The retrained model shows no regression relative to the current production model on our standard internal disparity metric — approval rate differences across demographic groups are within the same range as the current model. We are satisfied that the fairness profile is comparable.
>
> Our internal model governance process requires a Model Risk Management (MRM) committee review before any model change goes to production. The MRM committee meets bi-monthly. We plan to submit the retrained model to the next MRM committee slot, which is approximately 8 weeks away. The committee review typically takes one meeting cycle. We anticipate no issues — we have put models through this process three times in the past two years.
>
> No regulatory approval is anticipated. This is a model update, not a new product. The credit limit recommendation capability exists today; we are improving the model that powers it. We are not changing the decision thresholds or the lending product terms.
>
> We would like to have the retrained model in production within 12 weeks. The retraining and offline evaluation work is complete. Remaining steps are the MRM review, a brief integration test in staging, and deployment.

## Expected discovery artefact characteristics

A high-quality output from this input should:

- **Problem statement** — frame the problem as model performance degradation in a regulated credit decisioning context, bounded by FMA fairness methodology requirements, CCCFA responsible lending obligations, MRM governance gates, and explainability requirements; NOT "retrain the model and deploy it"
- **Personas** — credit card customers receiving recommendations (right to explanation and protection from irresponsible credit), credit risk team (model performance and evaluation), MRM team (governance gate and independent validation requirement), FMA regulatory relationship (fairness methodology compliance), external MRM-qualified validator (required under 2023 policy but not yet engaged), head of retail credit (responsible lending accountability)
- **MVP scope** — bounded to: model retraining pipeline, fairness assessment using FMA prescribed methodology (not just relative comparison), independent validation engagement (required by 2023 MRM policy), MRM committee submission, explainability confirmation, staging integration test, production deployment; the 12-week timeline must be challenged if independent validation is required
- **Constraints** — C1 (FMA algorithmic fairness — prescribed 2024 methodology required; "no regression vs current model" is insufficient), C2 (internal MRM policy — 2023 update requires independent validation for credit model retrains; not just committee review), C3 (CCCFA responsible lending — does not lapse for model updates), C4 (explainability — FMA plain-language customer explanation capability required)
- **Assumptions** — must flag: applicable MRM policy version must be confirmed with MRM team — if 2023 policy applies, independent validation is required and is not currently scoped; FMA prescribed fairness methodology must be obtained and applied; SHAP outputs may not automatically satisfy FMA plain-language customer explanation standard
- **Success indicators** — Gini ≥ 0.71 on holdout, FMA fairness methodology absolute thresholds met, MRM sign-off under applicable policy version, independent validation completed (if 2023 policy applies), explainability review passed

## Known failure modes for this case

- **MRM process version accepted**: model accepts the brief's one-meeting-cycle framing without raising whether the 2023 policy update changes what MRM requires
- **FMA fairness methodology not named**: model accepts "no regression vs current model" as sufficient rather than identifying the FMA's published 2024 prescribed methodology
- **12-week timeline accepted**: model does not challenge the timeline despite independent validation potentially adding 6–8 weeks
- **CCCFA lapse assumed**: model accepts "this is a model update, not a new product" without noting that responsible lending obligations apply to the model's contribution to the decision chain
