# IL-S12 DoR Artefact — credit.fairness-eval-1

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.fairness-eval-1 — Implement demographic parity evaluation script
**DoR verdict:** Proceed: Yes
**Oversight level:** Medium (compliance tooling — not a regulated model change itself; MRM team added as reviewer for NFR-1 formula verification)
**Hard blocks:** 10/10 passed
**H-NFR1 (FMA formula):** PASS — NFR-1 FMA parity formula (max-min per dimension) is a hard regulatory requirement; cannot be substituted with another metric
**H-NFR2 (Reproducibility):** PASS — NFR-2 deterministic output is required for audit trail integrity; identical runs on identical data must produce identical JSON
**H-C1 (Configurable threshold):** PASS — C1 explicitly prohibits hardcoding the threshold; NZ FMA and AU APRA use different threshold values; the script must read from config to remain jurisdiction-agnostic
**Warnings:** W1 — `config/fairness-config.json` must be reviewed by compliance before merge to confirm threshold is correct for the current regulatory period

---

## Contract Proposal

**What will be built:**

A standalone Python script `scripts/evaluate_fairness.py` that:
- Reads model prediction JSON from `--input <filepath>` (format: `{ "predictions": [{ "approved": bool, "gender": str, "ethnicity": str }] }`)
- Reads `"fairness_threshold"` from `config/fairness-config.json` (C1 — must NOT be hardcoded)
- Computes demographic parity gap per dimension using FMA formula: `gap = max(group_approval_rate) - min(group_approval_rate)`
- Outputs JSON to stdout: `{ "groups": [{ "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }] }`
- Logs all group gaps and the threshold used to stderr on every run, regardless of outcome (C2 — audit trail)
- Exits with code 1 if any gap exceeds threshold; exits with code 0 if all groups pass

**What will NOT be built:**
- Model retraining, hyperparameter adjustment, or dataset loading
- CCCFA affordability scoring or credit limit calculation
- Real-time inference API or serving endpoint
- Dashboard or visualisation of parity results
- Model performance metrics (Gini, ROC-AUC, KS) — those are in `scripts/evaluate_model.py`
- Database storage of fairness results

**How each AC will be verified:**

| AC / NFR | Test approach | Type |
|----------|---------------|------|
| AC1 — JSON structure output | T1: predictions with known rates → assert stdout JSON matches `{ "groups": [...] }` schema | Unit |
| AC2 — Exit code 1 + stderr log | T2: gender gap = 0.08 (> threshold) → exit code 1; T3: stderr contains failing group names | Unit |
| AC3 — Exit code 0 | T4: all gaps ≤ threshold → exit code 0 | Unit |
| NFR-1 — FMA formula | T5: known approval rates → manually verify max-min formula output | Unit |
| NFR-2 — Deterministic output | T6: run script twice with same input → identical stdout (same group order, same decimal rounding) | Unit |
| C1 — Threshold from config | T7: write config with threshold 0.03; run script → exit 1 for gap that would pass at 0.05 | Unit |
| C2 — Stderr audit log | T3: stderr contains threshold value and all group gap values on every run | Unit |

**Estimated touch points:**
- Create: `scripts/evaluate_fairness.py`
- Create: `tests/test_evaluate_fairness.py`
- Create: `config/fairness-config.json`

---

## Coding Agent Instructions

**Goal:** Implement the demographic parity evaluation script for the credit model fairness gate.

**Branch:** `feature/credit.fairness-eval-1`
**Test command:** `pytest tests/test_evaluate_fairness.py -v`
**Oversight:** Medium

**Architecture Constraint (C1 — FMA REGULATORY — JURISDICTION-SPECIFIC THRESHOLD):** The pass/fail threshold MUST be read from `config/fairness-config.json`, key `"fairness_threshold"`. Threshold values differ between NZ FMA (currently 0.05) and AU APRA requirements. **Hardcoding `0.05`, `THRESHOLD = 0.05`, or any numeric threshold constant in the script source is prohibited** — it would silently apply the wrong jurisdiction's threshold when the config changes. C1 violation is a categorical IP5 fail.

**Architecture Constraint (C2 — COMPLIANCE AUDIT TRAIL):** The script MUST log all group gap values and the threshold value used to stderr on every run, regardless of pass/fail outcome. This stderr output is the audit trail consumed by the MRM validation report generator.

**NFR-1 (FMA Algorithmic Fairness Methodology):** Demographic parity gap = `max(group_approval_rate) - min(group_approval_rate)` per dimension. Group definitions: gender (Male/Female), ethnicity (Māori/Pacific/Other). Formula must not be substituted with a different fairness metric (e.g., equalised odds, calibration).

**NFR-2 (Reproducibility):** Same `--input` file → identical stdout JSON on every run. Groups must be output in a stable deterministic order. No randomness or timestamp-dependent fields in stdout.

**Files to touch:**
- Create: `scripts/evaluate_fairness.py` (main evaluation script)
- Create: `tests/test_evaluate_fairness.py` (pytest test suite)
- Create: `config/fairness-config.json` (fairness threshold config — default NZ FMA value 0.05)

**Out of scope:** Model retraining, CCCFA affordability, Gini/ROC-AUC/KS metrics, real-time inference, database storage.
