# IL-S12 DoD Input Bundle — credit.fairness-eval-1 Demographic Parity Evaluation Script

**Story:** credit.fairness-eval-1 — Implement demographic parity evaluation script
**PR:** #251
**Expected DoD verdict:** COMPLETE WITH DEVIATIONS
**Difficulty:** MEDIUM

---

## Definition artefact (inline)

Story: credit.fairness-eval-1 — Implement demographic parity evaluation script

AC1: Script outputs `{ "groups": [{ "group", "dimension", "gap", "threshold", "pass" }] }` JSON to stdout for each demographic group per dimension.
AC2: Any group gap exceeding threshold → exit code 1; failing groups logged to stderr.
AC3: All groups within threshold → exit code 0.
NFR-1 (FMA methodology): Gap = max(approval_rate) - min(approval_rate) per dimension. Not substitutable.
NFR-2 (Reproducibility): Same input → identical stdout output (deterministic group ordering).
C1 (Configurable threshold): Threshold MUST be read from `config/fairness-config.json`. Hardcoding prohibited.
C2 (Audit trail): Stderr log with all gap values and threshold used on every run.

Out of scope: Model retraining, CCCFA affordability, Gini/ROC-AUC/KS metrics, real-time inference, database storage.

---

## Test plan summary

| Test | AC/NFR | Status |
|------|--------|--------|
| T1 — JSON output schema correct | AC1 | PASS |
| T2 — Gap > threshold → exit code 1 | AC2 | PASS |
| T3 — Stderr contains failing group and threshold | AC2, C2 | PASS |
| T4 — All gaps ≤ threshold → exit code 0 | AC3 | PASS |
| T5 — FMA formula: gap = max(rate) - min(rate) | NFR-1 | PASS |
| T6 — Same input → identical stdout (two runs) | NFR-2 | PASS |
| T7 — Config threshold change → exit code changes | C1 | PASS |

**All 7 tests passing. Test suite command:** `pytest tests/test_evaluate_fairness.py -v`

---

## Test run evidence

```
tests/test_evaluate_fairness.py::test_json_output_schema PASSED
tests/test_evaluate_fairness.py::test_exit_code_1_on_threshold_breach PASSED
tests/test_evaluate_fairness.py::test_stderr_audit_log_contains_failing_group PASSED
tests/test_evaluate_fairness.py::test_exit_code_0_all_groups_pass PASSED
tests/test_evaluate_fairness.py::test_fma_max_minus_min_formula PASSED
tests/test_evaluate_fairness.py::test_deterministic_output PASSED
tests/test_evaluate_fairness.py::test_config_threshold_drives_exit_code PASSED

7 passed in 0.42s
```

---

## AC verification results

| Scenario | Result |
|----------|--------|
| S1 — JSON structure for all dimension groups | PASS — stdout matches `{ "groups": [...] }` schema; entries include group, dimension, gap, threshold, pass |
| S2 — Exit code 1 when gender gap 0.20 > threshold 0.05 | PASS — exit code 1; `"pass": false` for gender dimension |
| S3 — Exit code 0 when all gaps within threshold | PASS — exit code 0; all `"pass": true` |
| S4 — Threshold read from config (T7: config → 0.10, gap 0.06 now passes) | PASS — exit code 0 when config raised to 0.10; confirms threshold is not hardcoded |
| S5 — Stderr audit log present on every run | PASS — stderr non-empty on both passing and failing runs; includes threshold value |

---

## PR diff summary

**Files changed:**
- `scripts/evaluate_fairness.py` — new script; reads threshold from config/fairness-config.json (C1 compliant); computes FMA max-min gap per dimension; outputs JSON to stdout; logs audit trail to stderr (C2); exits 0 or 1
- `tests/test_evaluate_fairness.py` — new file; T1–T7 pytest tests
- `config/fairness-config.json` — new config; `"fairness_threshold": 0.05` (NZ FMA default); group definitions for gender and ethnicity

---

## Out-of-scope check

No model retraining. No CCCFA affordability scoring. No Gini, ROC-AUC, or KS computation. No database writes. No API endpoints. No real-time inference. Threshold is NOT a constant in the script — it is read from `config/fairness-config.json` on every invocation.

---

## NFR check

NFR-1 (FMA formula): `gap = max(group_approval_rate) - min(group_approval_rate)` per dimension. T5 verifies formula on three-group ethnicity case (max 0.70, min 0.55 → gap 0.15). Correct.

NFR-2 (Reproducibility): T6 runs script twice with identical input; stdout strings are equal. Group output order is deterministic (sorted by dimension, then group name within dimension).

---

## Expected DoD verdict

**COMPLETE WITH DEVIATIONS**

Deviation recorded:
- D1: `config/fairness-config.json` as committed includes a JSON comment listing AU APRA threshold alternatives (0.03, 0.04). Compliance team flagged this as premature — AU APRA thresholds are not yet approved for use. The comment must be removed before the PR is merged to avoid compliance confusion. The script itself correctly reads `"fairness_threshold"` from config (C1 compliant — no hardcoded constant in script). This deviation is minor and does not affect AC pass/fail.

Gate conditions:
- D1 (AC coverage): 3/3 ACs verified ✓
- D2 (out-of-scope): No model retraining, CCCFA, Gini/ROC-AUC/KS, database writes, real-time serving ✓
- D3 (test plan): 7/7 tests pass ✓
- D4 (NFR): NFR-1 FMA formula correct; NFR-2 deterministic output verified ✓
- D5 (C1 compliance): Threshold read from config; T7 confirms no hardcoded constant ✓
- D6 (verdict): COMPLETE WITH DEVIATIONS — config comment cleanup required before merge
