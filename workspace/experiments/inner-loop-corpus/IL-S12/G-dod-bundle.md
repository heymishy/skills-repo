# IL-S12 DoD Input Bundle — credit.7 Credit Model Retrain

**Story:** credit.7 — Retrain credit limit model and produce MRM validation artefact
**PR:** #247
**Expected DoD verdict:** COMPLETE WITH DEVIATIONS
**Difficulty:** HIGH

---

## Definition artefact (inline)

Story: credit.7 — Retrain credit limit model and produce MRM validation artefact

AC1: Retrained model achieves Gini ≥ 0.68 on holdout evaluation set.
AC2: Pipeline writes `artefacts/credit-model/model-validation-report.md` with 8 required fields.
AC3: Demographic parity gap ≤ 5 percentage points for gender and ethnicity dimensions (FMA threshold).
NFR-1 (MRM Policy 2023): `model-validation-report.md` is mandatory artefact; production deployment blocked until Model Risk sign-off.
NFR-2 (FMA Algorithmic Fairness): Gap computed via FMA methodology; threshold = 5pp (compiled-in constant, not configurable).

Out of scope: MRM sign-off, production deployment, CCCFA affordability, explainability API, real-time serving infrastructure.

---

## Test plan summary

| Test | AC/NFR | Status |
|------|--------|--------|
| T1 — Gini ≥ 0.68 on synthetic holdout | AC1 | PASS |
| T2 — Gini < 0.68 surfaces performance warning | AC1 guard | PASS |
| T3 — Validation report written with all 8 fields | AC2, NFR-1 | PASS |
| T4 — Demographic parity gap within 5% threshold | AC3 | PASS |
| T5 — Gender gap 7% → FAIRNESS_THRESHOLD_EXCEEDED: true | NFR-2 | PASS |
| T6 — Ethnicity gap 5.1% → threshold exceeded (boundary) | NFR-2 | PASS |

**All 6 tests passing. Test suite command:** `npm test`

---

## Test run evidence

```
PASS tests/models/credit-model-pipeline.test.js
  Credit model retrain pipeline
    ✓ Gini ≥ 0.68 on synthetic holdout (12 ms)
    ✓ Gini < 0.68 surfaces GINI_BELOW_THRESHOLD warning (8 ms)
    ✓ validation report written with all 8 required fields (15 ms)
    ✓ demographic parity gap within FMA threshold (9 ms)
    ✓ gender gap 7% writes FAIRNESS_THRESHOLD_EXCEEDED: true (7 ms)
    ✓ ethnicity gap 5.1% triggers threshold exceeded (boundary) (6 ms)

Test Suites: 1 passed, 1 total
Tests:       6 passed, 6 total
```

---

## AC verification results

| Scenario | Result |
|----------|--------|
| S1 — Gini ≥ 0.68 on holdout | PASS |
| S2 — Validation report written with required fields (C5) | PASS — file written to `artefacts/credit-model/model-validation-report.md`; all 8 fields present |
| S3 — Demographic parity within FMA threshold | PASS — gender gap: 3.2pp, ethnicity gap: 4.0pp; both < 5pp |
| S4 — FAIRNESS_THRESHOLD_PCT is compiled-in constant (C6) | PASS — `const FAIRNESS_THRESHOLD_PCT = 5` in `fairness-metrics.js`; no configurable override |

---

## PR diff summary

**Files changed:**
- `src/models/fairness-metrics.js` — new module; `computeDemographicParityGap(predictions, field)` returning `{ gap, cohortRates }`; `FAIRNESS_THRESHOLD_PCT = 5` compiled-in constant
- `src/models/credit-model-pipeline.js` — modified; added fairness metric computation and `model-validation-report.md` write step; pipeline returns `{ model, metrics, report }`
- `tests/models/credit-model-pipeline.test.js` — new file; T1–T6 unit tests

**Artefact produced at runtime:**
- `artefacts/credit-model/model-validation-report.md` — not committed to repo; produced by pipeline execution; input to Model Risk independent validation

---

## Out-of-scope check

No CCCFA affordability calculations added. No MRM sign-off action taken. No explainability API endpoint. No real-time serving infrastructure. No configurable threshold parameter.

---

## NFR check

NFR-1 (MRM): `model-validation-report.md` written with all 8 fields. Production deployment NOT triggered — blocked at feature level pending Model Risk sign-off.

NFR-2 (FMA): Fairness metrics computed per FMA methodology. `FAIRNESS_THRESHOLD_PCT = 5` is compiled-in. Reference run: gender gap 3.2pp, ethnicity gap 4.0pp — both within threshold. `fairnessThresholdExceeded: false` in report.

---

## Expected DoD verdict

**COMPLETE WITH DEVIATIONS**

Deviation recorded:
- D1: MRM independent validation sign-off pending — Model Risk function has not reviewed the validation artefact. This is an expected and accepted deviation: sign-off is a Model Risk function gate, not a coding deliverable for this story. Feature-level production deployment is blocked until sign-off is received.

Gate conditions:
- D1 (AC coverage): 3/3 ACs verified ✓
- D2 (out-of-scope): No fabricated CCCFA scope, no MRM sign-off simulation, no explainability API ✓
- D3 (test plan): 6/6 tests pass ✓
- D4 (NFR): NFR-1 artefact written; NFR-2 fairness computed; threshold constants compiled-in ✓
- D5 (metric signal): Gini, ROC-AUC, KS, parity gaps all in test output ✓
- D6 (verdict): COMPLETE WITH DEVIATIONS — MRM sign-off pending (accepted deviation; not a story defect)
