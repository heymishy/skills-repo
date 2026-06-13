# IL-S12 AC Verification Script — credit.7

**Story:** credit.7 — Retrain credit limit model and produce MRM validation artefact
**Setup:** `npm test tests/models/credit-model-pipeline.test.js`

---

## Scenario 1 — Model performance on holdout set (AC1)

**Steps:** Confirm T1 passes.
**Expected:** Pipeline returns `holdoutGini: 0.69` (or higher) with no underperformance flag.
**Failure:** T1 fails — Gini not computed, or computed value below 0.68. If T2 also fails (underperformance flag not raised for 0.67 case), the pipeline has no monitoring signal for model drift.

---

## Scenario 2 — Validation report written with required fields (AC2 + NFR-1)

**Steps:** Confirm T3 passes. Additionally verify manually:
1. `artefacts/credit-model/model-validation-report.md` exists after test run
2. All 8 fields present: `trainingPeriod`, `trainingSampleSize`, `holdoutGini`, `holdoutRocAuc`, `holdoutKsStat`, `genderParityGap`, `ethnicityParityGap`, `fairnessThresholdExceeded`

**Expected:** File present; all 8 fields populated.
**Failure:** File missing — C5 architecture constraint violated; this story is incomplete regardless of test pass rate. Missing fields — MRM team cannot perform independent validation without complete inputs.

---

## Scenario 3 — Demographic parity gap within FMA threshold (AC3 + NFR-2)

**Steps:** Confirm T4, T5, T6 pass.
**Expected:**
- T4: Both gender and ethnicity gaps below 5% → `fairnessThresholdExceeded: false`
- T5: Gender gap 7% → `fairnessThresholdExceeded: true` in report; pipeline completes (no throw)
- T6: Ethnicity gap 5.1% (just above 5.0%) → `fairnessThresholdExceeded: true`

**Failure:** T5 or T6 fails — either the threshold is not being computed, the 5% constant is wrong (e.g. using 0.05 fraction instead of 5.0 percentage points), or the pipeline throws instead of writing the artefact with the warning flag.

---

## Scenario 4 — FMA threshold is NOT configurable (C6 architecture constraint)

**Steps:** Read `src/models/fairness-metrics.js` or `src/models/credit-model-pipeline.js` and verify:
1. `FAIRNESS_THRESHOLD_PCT = 5` is a compiled-in constant
2. No function accepts a threshold parameter that would allow overriding the FMA value

**Expected:** Constant present in source; no exported function has a `threshold` parameter.
**Failure:** Threshold is a configurable parameter — violates C6; would allow bypassing FMA methodology.

---

## Reset

No reset needed between scenarios; synthetic fixtures are per-test.
