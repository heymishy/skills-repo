# IL-S12 — Credit Model Retrain + MRM Validation (HIGH difficulty)

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.7
**Difficulty:** HIGH
**Expected Phase A score:** ~0.65–0.75

## Operator input

> You are running /implementation-plan on the following story in eval mode.

DoR artefact:

# IL-S12 DoR Artefact — credit.7

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.7 — Retrain credit limit model and produce MRM validation artefact
**DoR verdict:** Proceed: Yes
**Oversight level:** High (Tier-1 regulated model change — MRM policy requires tech lead + compliance awareness on PR; Model Risk team added as reviewer)
**H-NFR1 (MRM):** PASS — NFR-1 requires production of `model-validation-report.md`; hard constraint
**H-NFR2 (FMA fairness):** PASS — NFR-2 requires demographic parity gap ≤ 5%; threshold defined in FMA methodology (not configurable)
**H-GOV:** PASS — MRM sign-off gate acknowledged; this story delivers the validation artefact; sign-off is a separate tracked gate
**Warnings:** W1 — 12-week timeline is tight; Model Risk review typically takes 4–6 weeks after artefact delivery

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
| AC1 — Gini ≥ 0.68 on holdout | Unit test with synthetic dataset where known Gini is 0.69 | Unit/integration |
| AC2 — Validation report written | Unit test: assert file exists; assert all required fields present | Unit |
| AC3 — Demographic parity gap ≤ 5% | Unit test: synthetic cohort with gender gap = 3.2%, ethnicity = 4.1%; assert ≤ 5% | Unit |
| NFR-1 — Report produced deterministically | Integration: run pipeline end-to-end; assert report exists | Integration |
| NFR-2 — FMA threshold enforced | Unit: cohort gap = 6.5%; assert FAIRNESS_THRESHOLD_EXCEEDED flag written | Unit |

**Estimated touch points:**
- Modify: `src/models/credit-model-pipeline.js`
- Create: `src/models/fairness-metrics.js`
- Create: `tests/models/credit-model-pipeline.test.js`
- Output: `artefacts/credit-model/model-validation-report.md` (produced at runtime)

## Coding Agent Instructions

**Goal:** Extend the credit model retrain pipeline to compute FMA fairness metrics and produce the MRM validation artefact.

**Branch:** `feature/credit.7`
**Test command:** `npm test`
**Oversight:** High

**Architecture Constraint (C5 — MRM POLICY 2023):** `artefacts/credit-model/model-validation-report.md` MUST be written before the pipeline function returns. Hard production prerequisite. Missing report = incomplete story.

**Architecture Constraint (C6 — FMA ALGORITHMIC FAIRNESS):** The 5% demographic parity threshold is NOT configurable. It is `const FAIRNESS_THRESHOLD_PCT = 5` compiled in. If gap exceeds threshold, write `FAIRNESS_THRESHOLD_EXCEEDED: true` to the report — do NOT throw or halt.

**NFR-1:** Validation report must contain: `trainingPeriod`, `trainingSampleSize`, `holdoutGini`, `holdoutRocAuc`, `holdoutKsStat`, `genderParityGap`, `ethnicityParityGap`, `fairnessThresholdExceeded`.
**NFR-2:** Demographic parity gap = `max(cohortApprovalRate) - min(cohortApprovalRate)` per dimension.

**Files to touch:**
- Modify: `src/models/credit-model-pipeline.js`
- Create: `src/models/fairness-metrics.js`
- Create: `tests/models/credit-model-pipeline.test.js`

**Out of scope:** MRM sign-off, production deployment, CCCFA, explainability API.

---

Definition artefact:

# IL-S12 Definition Artefact — Credit Model Retrain

**Feature:** 2026-07-01-credit-model-refresh
**Story slug:** credit.7

## Story: credit.7 — Retrain credit limit model and produce MRM validation artefact

**AC1:** Given the retrain pipeline runs on 24-month training data, when training completes, then the retrained model achieves Gini ≥ 0.68 on the holdout evaluation set.

**AC2:** Given the retrain pipeline completes, when evaluation is done, then a model validation report is written to `artefacts/credit-model/model-validation-report.md` containing: training dataset period, training sample size, holdout Gini, ROC-AUC, KS statistic, and demographic parity gap values (gender: M/F, ethnicity: Māori/Pacific/Other).

**AC3:** Given the validation report is produced, when the demographic parity gap is computed, then the gap between the highest and lowest approval-rate cohort is ≤ 5 percentage points for both gender and ethnicity dimensions (FMA threshold).

**Out of Scope:** MRM independent validation sign-off, production deployment, CCCFA affordability changes, real-time serving, explainability API.

**NFR-1 (MRM Policy 2023):** Retrain pipeline MUST produce `artefacts/credit-model/model-validation-report.md`. Hard prerequisite for production deployment.

**NFR-2 (FMA Algorithmic Fairness Methodology):** Demographic parity gap ≤ 5 percentage points. Not configurable. Pipeline must flag `FAIRNESS_THRESHOLD_EXCEEDED` if exceeded.

**Architecture Constraints:**
**C5:** `model-validation-report.md` is a HARD prerequisite. Must be written deterministically.
**C6:** `FAIRNESS_THRESHOLD_PCT = 5` is NOT configurable. FMA-defined threshold.

---

Test plan:

# IL-S12 Test Plan — credit.7 Credit Model Retrain

| AC / NFR | Tests | Coverage |
|----------|-------|----------|
| AC1 — Gini ≥ 0.68 | T1: synthetic holdout Gini = 0.69; T2: Gini = 0.67 → underperformance flag | Full |
| AC2 — Report written | T3: pipeline run → file exists with all 8 required fields | Full |
| AC3 — Parity gap ≤ 5% | T4: gender gap 3.2%, ethnicity gap 4.0% → `fairnessThresholdExceeded: false` | Full |
| NFR-2 — FMA threshold | T5: gender gap 6.5% → `FAIRNESS_THRESHOLD_EXCEEDED: true`; T6: ethnicity gap 5.1% → exceeded | Full |

**T1:** Mock evaluator returns `{ gini: 0.69, rocAuc: 0.84, ksStat: 0.41 }` → `holdoutGini: 0.69`
**T2:** Mock returns `{ gini: 0.67 }` → `performanceWarning: 'GINI_BELOW_THRESHOLD'`; report still written
**T3:** Full pipeline run → `artefacts/credit-model/model-validation-report.md` exists; contains all 8 fields
**T4:** Synthetic cohort gender M=72%, F=69% (gap=3.2%); ethnicity gap=4.0% → `fairnessThresholdExceeded: false`
**T5:** Gender M=74%, F=67% (gap=7%) → `FAIRNESS_THRESHOLD_EXCEEDED: true`; pipeline does NOT throw
**T6:** Ethnicity gap=5.1% → `fairnessThresholdExceeded: true`

---

Codebase context:

```js
// src/models/credit-model-pipeline.js (existing — credit.7 MODIFIES this)
'use strict';

const modelTrainer = require('./model-trainer');
const modelEvaluator = require('./model-evaluator');
const dataLoader = require('./training-data-loader');

async function runRetrainPipeline(config) {
  const { trainingPeriodMonths = 24, holdoutFraction = 0.2 } = config;
  const { trainSet, holdoutSet } = await dataLoader.load({ periodMonths: trainingPeriodMonths, holdoutFraction });
  const model = await modelTrainer.train(trainSet);
  const metrics = await modelEvaluator.evaluate(model, holdoutSet);
  // metrics = { gini, rocAuc, ksStat }

  // TODO credit.7: compute demographic parity metrics (src/models/fairness-metrics.js — new file)
  // TODO credit.7: write model-validation-report.md (C5 — mandatory MRM artefact)
  // TODO credit.7: flag FAIRNESS_THRESHOLD_EXCEEDED if gap > 5pp (C6 — FMA methodology)

  return { model, metrics };
}
module.exports = { runRetrainPipeline };

// Fairness metrics module to be created (src/models/fairness-metrics.js):
// const FAIRNESS_THRESHOLD_PCT = 5; // FMA Algorithmic Fairness Methodology — NOT configurable
// function computeDemographicParityGap(predictions, demographicField) {
//   // Returns: { gap: number (percentage points), cohortRates: { [cohort]: number } }
// }
// module.exports = { computeDemographicParityGap, FAIRNESS_THRESHOLD_PCT };
```

Produce the implementation plan. Write it to artefacts/2026-07-01-credit-model-refresh/plans/credit.7-plan.md.

## Expected characteristics

# IL-S12 DoR Artefact — credit.7

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.7 — Retrain credit limit model and produce MRM validation artefact
**Oversight level:** High (Tier-1 regulated model change)

## Contract Proposal

**What will be built:** Enhanced retrain pipeline:
- Retrain on 24-month dataset; evaluate Gini, ROC-AUC, KS on holdout
- Compute demographic parity gap (gender: M/F; ethnicity: Māori/Pacific/Other) per FMA methodology
- Write `artefacts/credit-model/model-validation-report.md` with all 8 required fields
- Flag `FAIRNESS_THRESHOLD_EXCEEDED: true` if any gap > 5pp (does NOT halt pipeline)

**What will NOT be built:** MRM sign-off, production deploy, CCCFA, real-time serving, explainability API.

**ACs:**
- AC1: Gini ≥ 0.68 on holdout
- AC2: `model-validation-report.md` written with all 8 fields
- AC3: Parity gap ≤ 5% for gender and ethnicity

**NFR-1:** Report is a HARD prerequisite — must be written deterministically.
**NFR-2:** `FAIRNESS_THRESHOLD_PCT = 5` — NOT configurable. Flag in report if exceeded; do not halt.

**Architecture Constraints:**
- C5: `model-validation-report.md` MUST be written before function returns
- C6: `FAIRNESS_THRESHOLD_PCT = 5` is a COMPILED-IN CONSTANT — NOT a config parameter

**Files to touch:**
- Modify: `src/models/credit-model-pipeline.js`
- Create: `src/models/fairness-metrics.js`
- Create: `tests/models/credit-model-pipeline.test.js`
