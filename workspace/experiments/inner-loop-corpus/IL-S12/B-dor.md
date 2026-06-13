# IL-S12 DoR Artefact — credit.7

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.7 — Retrain credit limit model and produce MRM validation artefact
**DoR verdict:** Proceed: Yes
**Oversight level:** High (Tier-1 regulated model change — MRM policy requires tech lead + compliance awareness on PR; Model Risk team added as reviewer)
**Hard blocks:** 13/13 passed
**H-NFR1 (MRM):** PASS — NFR-1 requires production of `model-validation-report.md`; this is a hard constraint, not a nice-to-have
**H-NFR2 (FMA fairness):** PASS — NFR-2 requires demographic parity gap ≤ 5%; threshold defined in FMA methodology (not configurable); gap must be computed and reported
**H-GOV:** PASS — MRM sign-off gate acknowledged; this story delivers the validation artefact; sign-off is a separate tracked gate (feature-level blocker for production deployment)
**Warnings:** W1 — 12-week timeline is tight; Model Risk function review typically takes 4–6 weeks after artefact delivery; timeline risk accepted at feature level

---

## Contract Proposal

**What will be built:**
An enhanced credit model retrain pipeline that:
- Retrains on 24-month origination dataset
- Evaluates on holdout set: Gini, ROC-AUC, KS statistic
- Computes demographic parity gap per FMA methodology (gender: M/F; ethnicity: Māori/Pacific/Other)
- Writes `artefacts/credit-model/model-validation-report.md` with all required metrics
- Flags `FAIRNESS_THRESHOLD_EXCEEDED` in the report if any cohort gap > 5 percentage points

**What will NOT be built:**
- MRM independent validation sign-off
- Production deployment
- CCCFA affordability calculations
- Real-time serving infrastructure
- Explainability API

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 — Gini ≥ 0.68 on holdout | Unit test with synthetic dataset where known Gini is 0.69; pipeline must compute ≥ 0.68 | Unit/integration |
| AC2 — Validation report written with required fields | Unit test: assert file exists; assert all required fields present in report content | Unit |
| AC3 — Demographic parity gap ≤ 5% | Unit test: synthetic cohort data where gender gap = 3.2% and ethnicity gap = 4.1%; assert gap computed correctly and ≤ 5% | Unit |
| NFR-1 — Report produced deterministically | Integration: run pipeline end-to-end; assert report exists at expected path | Integration |
| NFR-2 — FMA gap threshold enforced | Unit test: cohort gap = 6.5%; assert FAIRNESS_THRESHOLD_EXCEEDED flag written to report | Unit |

**Estimated touch points:**
- Modify: `src/models/credit-model-pipeline.js` (add fairness computation and report writing)
- Create: `src/models/fairness-metrics.js` (demographic parity computation)
- Create: `tests/models/credit-model-pipeline.test.js`
- Output: `artefacts/credit-model/model-validation-report.md` (produced at runtime, not committed to repo)

---

## Coding Agent Instructions

**Goal:** Extend the credit model retrain pipeline to compute FMA fairness metrics and produce the MRM validation artefact.

**Branch:** `feature/credit.7`
**Test command:** `npm test`
**Oversight:** High

**Architecture Constraint (C5 — MRM POLICY 2023):** `artefacts/credit-model/model-validation-report.md` MUST be written before the pipeline function returns. This is not optional output — it is a hard production prerequisite. If the report is missing, the story is incomplete.

**Architecture Constraint (C6 — FMA ALGORITHMIC FAIRNESS):** The 5% demographic parity threshold is NOT configurable. It is `const FAIRNESS_THRESHOLD_PCT = 5` compiled in. If the gap exceeds this threshold, write `FAIRNESS_THRESHOLD_EXCEEDED: true` to the report and surface it in the pipeline return value — do NOT throw an error or halt the pipeline.

**NFR-1:** Model validation report must contain: `trainingPeriod`, `trainingSampleSize`, `holdoutGini`, `holdoutRocAuc`, `holdoutKsStat`, `genderParityGap`, `ethnicityParityGap`, `fairnessThresholdExceeded`.
**NFR-2:** Demographic parity gap computed as: `max(cohortApprovalRate) - min(cohortApprovalRate)` per dimension.

**Files to touch:**
- Modify: `src/models/credit-model-pipeline.js`
- Create: `src/models/fairness-metrics.js`
- Create: `tests/models/credit-model-pipeline.test.js`

**Out of scope:** MRM sign-off, production deploy, CCCFA, explainability API.
