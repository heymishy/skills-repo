# IL-S12 — Demographic Parity Evaluation Script (MEDIUM difficulty)

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.fairness-eval-1
**Difficulty:** MEDIUM
**Expected Phase A score:** ~0.70–0.80
**Key IP5 signal:** Threshold MUST be read from `config/fairness-config.json` — hardcoding `0.05` is a C1 violation → IP5=0.0

## Operator input

> You are running /implementation-plan on the following story in eval mode.

DoR artefact:

# IL-S12 DoR Artefact — credit.fairness-eval-1

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.fairness-eval-1 — Implement demographic parity evaluation script
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (compliance tooling — MRM team added as reviewer for NFR-1 formula verification)
**H-NFR1 (FMA formula):** PASS — NFR-1 FMA parity formula (max-min per dimension) is a hard regulatory requirement; cannot be substituted
**H-NFR2 (Reproducibility):** PASS — NFR-2 deterministic output required for audit trail integrity
**H-C1 (Configurable threshold):** PASS — C1 prohibits hardcoding; NZ FMA and AU APRA use different threshold values
**Warnings:** W1 — `config/fairness-config.json` must be reviewed by compliance before merge

## Contract Proposal

**What will be built:**

A standalone Python script `scripts/evaluate_fairness.py` that:
- Reads prediction JSON from `--input <filepath>` (format: `{ "predictions": [{ "approved": bool, "gender": str, "ethnicity": str }] }`)
- Reads `"fairness_threshold"` from `config/fairness-config.json` (C1 — must NOT be hardcoded)
- Computes demographic parity gap per dimension: `gap = max(group_approval_rate) - min(group_approval_rate)` (NFR-1)
- Outputs JSON to stdout: `{ "groups": [{ "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }] }`
- Logs all group gaps and threshold to stderr on every run (C2)
- Exits with code 1 if any gap exceeds threshold; exits with code 0 if all groups pass

**What will NOT be built:** Model retraining, CCCFA affordability, Gini/ROC-AUC/KS metrics, real-time inference, database storage.

**Files to touch:**
- Create: `scripts/evaluate_fairness.py`
- Create: `tests/test_evaluate_fairness.py`
- Create: `config/fairness-config.json`

## Coding Agent Instructions

**Branch:** `feature/credit.fairness-eval-1`
**Test command:** `pytest tests/test_evaluate_fairness.py -v`
**Oversight:** Medium

**Architecture Constraint (C1 — FMA REGULATORY):** The pass/fail threshold MUST be read from `config/fairness-config.json`, key `"fairness_threshold"`. Hardcoding `0.05`, `THRESHOLD = 0.05`, or any numeric threshold constant in the script is prohibited — it would silently apply the wrong jurisdiction's threshold when config changes. C1 violation = categorical IP5 fail.

**Architecture Constraint (C2 — COMPLIANCE AUDIT TRAIL):** Script MUST log all group gap values and threshold used to stderr on every run regardless of outcome. This is the audit trail for MRM validation.

**NFR-1 (FMA Algorithmic Fairness Methodology):** Gap = `max(group_approval_rate) - min(group_approval_rate)` per dimension. Groups: gender (Male/Female), ethnicity (Māori/Pacific/Other). Formula must not be substituted.

**NFR-2 (Reproducibility):** Same input file → identical stdout JSON on every run. Deterministic group ordering. No randomness or timestamp-dependent fields in stdout.

**Out of scope:** Model retraining, CCCFA, Gini/ROC-AUC/KS, real-time inference, database storage.

---

Definition artefact:

# IL-S12 Definition Artefact — Demographic Parity Evaluation Script

**Feature:** 2026-07-01-credit-model-refresh
**Story slug:** credit.fairness-eval-1

## Story: credit.fairness-eval-1 — Implement demographic parity evaluation script

**AC1:** Given a JSON file of model predictions, when `evaluate_fairness.py --input <file>` runs, then it outputs `{ "groups": [{ "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }] }` to stdout.

**AC2:** Given any group's parity gap exceeds the threshold from `config/fairness-config.json`, when the script completes, then it exits with code 1 and logs the failing groups to stderr.

**AC3:** Given all groups' parity gaps are within the threshold, when the script completes, then it exits with code 0.

**Out of Scope:** Model retraining, CCCFA affordability, Gini/ROC-AUC/KS metrics, real-time inference, database storage.

**NFR-1 (FMA Algorithmic Fairness Methodology):** Gap = `max(group_approval_rate) - min(group_approval_rate)` per dimension. Group definitions: gender (Male/Female), ethnicity (Māori/Pacific/Other). Formula must not be substituted.

**NFR-2 (Reproducibility):** Same input file → identical stdout output. Deterministic ordering. No randomness.

**Architecture Constraints:**
**C1 (FMA Regulatory):** Threshold MUST be read from `config/fairness-config.json`, key `"fairness_threshold"`. Hardcoding prohibited.
**C2 (Audit Trail):** Log all group gap values and threshold to stderr on every run.

---

Test plan:

# IL-S12 Test Plan — credit.fairness-eval-1

| AC / NFR | Tests | Coverage |
|----------|-------|----------|
| AC1 — JSON structure output | T1: known rates → assert stdout schema | Full |
| AC2 — Exit code 1 + stderr log | T2: gap > threshold → exit 1; T3: stderr contains failing group | Full |
| AC3 — Exit code 0 | T4: all gaps ≤ threshold → exit 0 | Full |
| NFR-1 — FMA formula | T5: three groups → verify max-min gap value | Full |
| NFR-2 — Deterministic output | T6: two runs same input → identical stdout | Full |
| C1 — Threshold from config | T7: change config threshold → exit code changes | Full |
| C2 — Stderr audit log | T3: stderr non-empty on every run | Full |

**T7 (C1 critical test):** Cohort gap = 0.06. Run 1: config threshold = 0.05 → exit 1. Run 2: update config to 0.10 → exit 0. A hardcoded `0.05` constant would fail Run 2.

---

Codebase context:

```python
# scripts/evaluate_model.py (existing — credit.fairness-eval-1 does NOT modify this)
import json
import sys

def load_predictions(filepath):
    """Load model prediction results from JSON file produced by the retrain pipeline."""
    with open(filepath) as f:
        data = json.load(f)
    # Returns list of: { 'approved': bool, 'gender': str, 'ethnicity': str }
    return data['predictions']

def load_fairness_config():
    """Load fairness evaluation configuration from config/fairness-config.json."""
    with open('config/fairness-config.json') as f:
        return json.load(f)
    # Returns: {
    #   "fairness_threshold": 0.05,           # read from here — do NOT hardcode
    #   "dimensions": ["gender", "ethnicity"],
    #   "groups": { "gender": ["Male", "Female"],
    #               "ethnicity": ["Maori", "Pacific", "Other"] }
    # }

def write_json_output(data, dest=sys.stdout):
    """Write JSON result to dest (stdout by default)."""
    dest.write(json.dumps(data, indent=2) + '\n')
```

Produce the implementation plan. Write it to artefacts/2026-07-01-credit-model-refresh/plans/credit.fairness-eval-1-plan.md.

## Expected characteristics

# IL-S12 DoR Artefact — credit.fairness-eval-1

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.fairness-eval-1 — Implement demographic parity evaluation script
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium

## Contract Proposal

**What will be built:** Python script `scripts/evaluate_fairness.py`:
- Reads prediction JSON from `--input <filepath>`
- Reads `"fairness_threshold"` from `config/fairness-config.json` (C1 — NOT hardcoded)
- Computes gap = max(approval_rate) - min(approval_rate) per dimension (FMA NFR-1 formula)
- Outputs `{ "groups": [{ "group", "dimension", "gap", "threshold", "pass" }] }` to stdout
- Logs audit trail to stderr on every run (C2)
- Exits 1 if any gap exceeds threshold; exits 0 if all pass

**What will NOT be built:** Model retraining, CCCFA, Gini/ROC-AUC/KS, real-time inference, database.

**ACs:**
- AC1: JSON output structure correct
- AC2: Exit 1 + stderr log when any gap > threshold
- AC3: Exit 0 when all gaps ≤ threshold

**NFR-1:** FMA formula: gap = max(rate) - min(rate). Groups: gender (Male/Female), ethnicity (Māori/Pacific/Other).
**NFR-2:** Same input → identical stdout. Deterministic ordering.

**Architecture Constraints:**
- C1: Threshold MUST come from `config/fairness-config.json` — NOT hardcoded. Hardcoding = IP5=0.0 categorical fail.
- C2: Stderr audit log on every run — threshold used + all gap values.

**Files to touch:**
- Create: `scripts/evaluate_fairness.py`
- Create: `tests/test_evaluate_fairness.py`
- Create: `config/fairness-config.json`
