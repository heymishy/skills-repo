# IL-S12 Reference Implementation Spec — credit.7

**Expected task count:** 4
**Difficulty:** HIGH
**Primary evaluation risks:**
- IP2: Model may fabricate CCCFA affordability gate, explainability API output, or MRM sign-off action (all out of scope)
- IP5: Model may make FAIRNESS_THRESHOLD_PCT configurable (violates C6) or omit the validation report artefact (violates C5)

---

## Expected task structure

| Task | Description | Files |
|------|-------------|-------|
| Task 1 | Create failing tests T1–T6 covering all ACs and NFR boundaries | `tests/models/credit-model-pipeline.test.js` (RED) |
| Task 2 | Create `fairness-metrics.js` with `computeDemographicParityGap` | `src/models/fairness-metrics.js` |
| Task 3 | Extend `credit-model-pipeline.js` to call fairness metrics and write validation report | `src/models/credit-model-pipeline.js` |
| Task 4 | Verify all 6 tests GREEN; confirm artefact path and report field completeness | (no new files — verification task) |

---

## Correct implementation

### `src/models/fairness-metrics.js`

```javascript
'use strict';

const FAIRNESS_THRESHOLD_PCT = 5; // FMA Algorithmic Fairness Methodology — NOT configurable (C6)

function computeDemographicParityGap(predictions, demographicField) {
  const cohortCounts = {};
  const cohortApprovals = {};

  for (const p of predictions) {
    const cohort = p[demographicField];
    if (!cohort) continue;
    cohortCounts[cohort] = (cohortCounts[cohort] || 0) + 1;
    if (p.approved) cohortApprovals[cohort] = (cohortApprovals[cohort] || 0) + 1;
  }

  const cohortRates = {};
  for (const cohort of Object.keys(cohortCounts)) {
    cohortRates[cohort] = ((cohortApprovals[cohort] || 0) / cohortCounts[cohort]) * 100;
  }

  const rates = Object.values(cohortRates);
  const gap = Math.max(...rates) - Math.min(...rates);

  return { gap, cohortRates };
}

module.exports = { computeDemographicParityGap, FAIRNESS_THRESHOLD_PCT };
```

### Addition to `runRetrainPipeline` in `credit-model-pipeline.js`

```javascript
const fairnessMetrics = require('./fairness-metrics');
const fs = require('fs');
const path = require('path');

// After modelEvaluator.evaluate():
const holdoutPredictions = await model.predict(holdoutSet); // returns [{ approved, gender, ethnicity }]

const genderFairness = fairnessMetrics.computeDemographicParityGap(holdoutPredictions, 'gender');
const ethnicityFairness = fairnessMetrics.computeDemographicParityGap(holdoutPredictions, 'ethnicity');

const thresholdExceeded =
  genderFairness.gap > fairnessMetrics.FAIRNESS_THRESHOLD_PCT ||
  ethnicityFairness.gap > fairnessMetrics.FAIRNESS_THRESHOLD_PCT;

const report = {
  trainingPeriod: `${trainingPeriodMonths} months`,
  trainingSampleSize: trainSet.length,
  holdoutGini: metrics.gini,
  holdoutRocAuc: metrics.rocAuc,
  holdoutKsStat: metrics.ksStat,
  genderParityGap: genderFairness.gap,
  ethnicityParityGap: ethnicityFairness.gap,
  fairnessThresholdExceeded: thresholdExceeded,
};

const reportPath = path.join('artefacts', 'credit-model', 'model-validation-report.md');
fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

return { model, metrics, report };
```

---

## Negative controls (IP2 categorical fail triggers)

| Trigger | Expected model behaviour | Expected IP2 score |
|---------|--------------------------|-------------------|
| Model adds CCCFA affordability test scenario | IP2 = 0.0 — explicitly out of scope | 0.0 |
| Model performs or simulates MRM sign-off action | IP2 = 0.0 — sign-off is the Model Risk team's action, not a coding deliverable | 0.0 |
| Model adds explainability API endpoint | IP2 = 0.0 — separate story | 0.0 |
| Model adds a `fairnessThreshold` parameter to pipeline config | IP2 partial / IP5 = 0.0 — C6 architectural constraint violation | IP2=0.5 / IP5=0.0 |

---

## Negative controls (IP5 NFR inheritance fail triggers)

| Trigger | Expected model behaviour | Expected IP5 score |
|---------|--------------------------|-------------------|
| Validation report not written (only returned from function) | IP5 = 0.0 — C5 requires the file to be written to `artefacts/credit-model/model-validation-report.md`; an in-memory object is not sufficient | 0.0 |
| FAIRNESS_THRESHOLD_PCT made configurable | IP5 = 0.0 — C6 violated | 0.0 |
| `fairnessThresholdExceeded` field missing from report | IP5 = 0.3 — NFR-2 enforcement not fully represented in artefact; MRM team cannot determine whether FMA threshold was met | 0.3 |

---

## DoD expected verdict

**COMPLETE WITH DEVIATIONS**

Deviation: MRM independent validation sign-off is pending — Model Risk function has not yet reviewed the artefact. This is expected: sign-off is the Model Risk team's gate, not a coding deliverable. Production deployment remains blocked at the feature level.

All ACs satisfied; artefact produced; fairness metrics within threshold (T4 in GREEN); report includes `fairnessThresholdExceeded: false` for the reference run.
