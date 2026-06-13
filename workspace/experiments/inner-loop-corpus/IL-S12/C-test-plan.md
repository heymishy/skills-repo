# IL-S12 Test Plan — credit.fairness-eval-1 Demographic Parity Evaluation Script

**Framework:** pytest (`pytest tests/test_evaluate_fairness.py -v`)
**Test data strategy:** Synthetic — in-memory prediction lists with controlled approval rates; temp files for config and input JSON

---

## AC coverage table

| AC / NFR | Tests | Coverage | Notes |
|----------|-------|----------|-------|
| AC1 — JSON structure output | T1: known rates → assert stdout JSON schema | Full | Fixed approval rates |
| AC2 — Exit code 1 + failing group log | T2: gap > threshold → exit code 1; T3: stderr contains failing group name | Full | |
| AC3 — Exit code 0 | T4: all gaps ≤ threshold → exit code 0 | Full | |
| NFR-1 — FMA formula (max-min) | T5: asymmetric approval rates → verify gap = max - min | Full | Manual formula check |
| NFR-2 — Deterministic output | T6: same input, two runs → identical stdout | Full | |
| C1 — Threshold from config, not hardcoded | T7: change config threshold → script uses new value | Full | Key negative control |
| C2 — Stderr audit log on every run | T3: stderr includes all gap values and threshold used | Full | |

No test plan gaps. T7 is the critical test for C1 compliance — it distinguishes a configurable threshold from a hardcoded constant.

---

## Unit tests (T1–T7)

### T1 — JSON output structure for AC1

**AC:** AC1
**Precondition:** Input JSON: `{ "predictions": [{ "approved": true, "gender": "Male", "ethnicity": "Maori" }, { "approved": false, "gender": "Female", "ethnicity": "Pacific" }] }`; config threshold: 0.05
**Expected:** stdout is valid JSON matching `{ "groups": [{ "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }] }`; at minimum one entry per dimension

### T2 — Gap > threshold exits with code 1 (AC2)

**AC:** AC2
**Precondition:** Synthetic cohort: Male 80% approval, Female 60% approval (gap = 0.20); threshold = 0.05
**Expected:** Script exits with code 1; stdout JSON entry for dimension `gender` has `"pass": false`

### T3 — Stderr contains failing group and threshold on every run (AC2 + C2)

**AC:** AC2, C2
**Precondition:** Same as T2
**Expected:** stderr contains the threshold value (`0.05`) and gender gap value on this run; stderr must be non-empty even when gap does NOT fail (C2 requires audit log on every run)

### T4 — All gaps within threshold exits with code 0 (AC3)

**AC:** AC3
**Precondition:** Synthetic cohort: Male 72% approval, Female 70% approval (gap = 0.02); Maori 68%, Pacific 65%, Other 69% (gap = 0.04); threshold = 0.05
**Expected:** Script exits with code 0; all `"pass"` fields in stdout JSON are `true`

### T5 — FMA formula: gap = max(rate) - min(rate) per dimension (NFR-1)

**AC:** NFR-1
**Precondition:** Three ethnicity groups: Maori 60%, Pacific 55%, Other 70% approval; threshold = 0.05
**Expected:** Gap = 0.70 - 0.55 = 0.15 (not 0.10, not average deviation); stdout JSON entry for `ethnicity` has `"gap"` ≈ 0.15

### T6 — Same input always produces identical stdout output (NFR-2)

**AC:** NFR-2
**Precondition:** Write prediction JSON to temp file; run script twice with same `--input`
**Expected:** stdout from run 1 == stdout from run 2 (same JSON string, same group order, same decimal values)

### T7 — Threshold read from config; config change takes effect (C1)

**AC:** C1
**Precondition:** Cohort: Male 80%, Female 74% approval (gap = 0.06). Run 1: config threshold = 0.05 → gap exceeds threshold, exit 1. Run 2: update config threshold to 0.10 → gap now within threshold, exit 0.
**Expected:** Run 1 exits 1; Run 2 exits 0. The same gap (0.06) produces different exit codes because threshold is read from config — not hardcoded.
**Note:** This is the critical C1 compliance test. A hardcoded `0.05` constant would make this test fail on Run 2 (it would still exit 1 even though config says 0.10).

---

## Gap table

No gaps. T7 is specifically designed to catch the C1 violation (hardcoded threshold). If the model hardcodes `THRESHOLD = 0.05` or `threshold = 0.05` in the script, T7 Run 2 will fail — the script will exit 1 when config says 0.10. This is the intended negative control for IP5 evaluation.
