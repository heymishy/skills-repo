# IL-S12 Definition Artefact — Credit Model Retrain

**Feature:** 2026-07-01-credit-model-refresh
**Epic:** Model Risk Management
**Story slug:** credit.7
**Slicing strategy:** Regulated compliance slice — retrain + validation artefact production (independent validation sign-off is a separate MRM process gate, not a coding deliverable)

---

## Story: credit.7 — Retrain credit limit model and produce MRM validation artefact

**As a** credit modelling team,
**I want** the credit limit model retrained on the last 24 months of origination data and an MRM validation artefact produced,
**So that** the Gini coefficient drift (0.71 → 0.63) is corrected and the Model Risk function can perform independent validation before production deployment.

### Acceptance Criteria

**AC1:** Given the retrain pipeline runs on the configured 24-month training dataset, when training completes, then the retrained model achieves a Gini coefficient ≥ 0.68 on the holdout evaluation set.

**AC2:** Given the retrain pipeline completes, when evaluation is done, then a model validation report is written to `artefacts/credit-model/model-validation-report.md` containing: training dataset period, training sample size, holdout Gini coefficient, ROC-AUC, KS statistic, and the demographic parity gap values per cohort (gender: M/F, ethnicity: Māori/Pacific/Other).

**AC3:** Given the model validation report is produced, when the demographic parity gap is computed, then the gap between the highest-approval-rate cohort and the lowest-approval-rate cohort is ≤ 5 percentage points for both gender and ethnicity dimensions (FMA threshold).

### Out of Scope

- Independent validation sign-off (performed by Model Risk function — not a coding deliverable)
- Production deployment (blocked on MRM sign-off — tracked at feature level)
- CCCFA affordability rule changes (separate regulatory story)
- Real-time model serving infrastructure changes
- Explainability API endpoint (separate story)

### NFRs

**NFR-1 (MRM Policy 2023 — Tier-1 Model Change):** The retrain pipeline must produce `artefacts/credit-model/model-validation-report.md` as a mandatory artefact. This report is the input to the Model Risk independent validation process. Production deployment is blocked until Model Risk signs off. The story DELIVERS the artefact; sign-off is a separate gate.

**NFR-2 (FMA Algorithmic Fairness Methodology):** Demographic parity gap ≤ 5 percentage points across gender (Male/Female) and ethnicity (Māori/Pacific/Other) cohorts. Gap computed on holdout set using approval rate disparity between highest and lowest cohort. The retrain pipeline must compute and embed these metrics in the validation report.

### Architecture Constraints

**C5 (MRM Policy 2023 — independent validation prerequisite):** The model validation report (`model-validation-report.md`) is a HARD prerequisite for production deployment. The pipeline must write this artefact deterministically — it cannot be a side effect or optional output. If the pipeline completes without producing the report, the story is incomplete regardless of model performance metrics.

**C6 (FMA Algorithmic Fairness Methodology — 5% threshold):** The 5 percentage point demographic parity threshold is defined in the FMA methodology and is not configurable. If computed gap exceeds 5%, the pipeline must surface this as a FAIRNESS_THRESHOLD_EXCEEDED warning in the validation report and flag the story as needing remediation before MRM sign-off.

### Complexity

4 — regulated ML pipeline; fairness metric computation; mandatory artefact production; multiple regulatory touchpoints.
