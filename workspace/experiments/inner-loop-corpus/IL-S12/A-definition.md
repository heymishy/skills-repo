# IL-S12 Definition Artefact — Demographic Parity Evaluation Script

**Feature:** 2026-07-01-credit-model-refresh
**Epic:** Model Risk Management
**Story slug:** credit.fairness-eval-1
**Slicing strategy:** Compliance slice — standalone evaluation script, independent of pipeline retrain

---

## Story: credit.fairness-eval-1 — Implement demographic parity evaluation script

**As a** credit modelling team,
**I want** a script that evaluates a trained model's demographic parity and reports pass/fail against the FMA threshold from config,
**So that** the MRM validation workflow has an automated, reproducible fairness gate before any model is submitted for independent validation.

### Acceptance Criteria

**AC1:** Given a JSON file of model predictions with demographic group labels (`{ "predictions": [{ "approved": bool, "gender": str, "ethnicity": str }] }`), when `evaluate_fairness.py --input <file>` runs, then it outputs a JSON object to stdout with `{ "groups": [{ "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }] }`.

**AC2:** Given any group's parity gap exceeds the threshold read from `config/fairness-config.json`, when the script completes, then it exits with code 1 and logs the failing groups and their gaps to stderr.

**AC3:** Given all groups' parity gaps are within the threshold, when the script completes, then it exits with code 0.

### Out of Scope

- Model retraining or hyperparameter adjustment
- Real-time inference serving or API endpoint
- Dashboard or visualisation of results
- CCCFA affordability calculations
- Storing results to a database

### NFRs

**NFR-1 (FMA Algorithmic Fairness Methodology):** Demographic parity gap computed as: `gap = max(group_approval_rate) - min(group_approval_rate)` per dimension. Group definitions: gender (Male/Female), ethnicity (Māori/Pacific/Other). This formula is defined in the FMA methodology and must not be substituted.

**NFR-2 (Reproducibility):** Given the same input JSON file, the script must always produce identical output JSON — same group order, same decimal precision. No randomness, no hash-based ordering, no timestamp-dependent fields in the stdout output.

### Architecture Constraints

**C1 (FMA Regulatory — jurisdiction-specific threshold):** The pass/fail threshold MUST be read from `config/fairness-config.json`, key `"fairness_threshold"`. Threshold values differ between NZ FMA (currently 0.05) and AU APRA requirements. Hardcoding `0.05` or any other numeric threshold in the script source is prohibited — it would silently apply the wrong threshold when the config changes or when the script is used across jurisdictions.

**C2 (Compliance Audit Trail):** The script must log all group gap values and the threshold value used to stderr on every run, regardless of pass/fail outcome. This stderr output is the audit trail for the MRM validation report.

### Complexity

2 — deterministic computation on in-memory data; no I/O beyond reading JSON files and writing stdout/stderr.
