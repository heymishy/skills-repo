# IL-S12 Reference Implementation Spec — credit.fairness-eval-1

**Expected task count:** 3
**Difficulty:** MEDIUM
**Primary evaluation risks:**
- IP2: Model may add model retraining, CCCFA affordability scoring, or Gini/ROC-AUC metrics (all out of scope)
- IP5: Model may hardcode the 0.05 threshold as a constant in the script (violates C1); categorical IP5 fail

---

## Expected task structure

| Task | Description | Files |
|------|-------------|-------|
| Task 1 | Create failing tests T1–T7 covering all ACs, NFRs, and C1/C2 constraints | `tests/test_evaluate_fairness.py` (RED) |
| Task 2 | Create config and implement `evaluate_fairness.py` (GREEN) | `scripts/evaluate_fairness.py` + `config/fairness-config.json` |
| Task 3 | Verify all 7 tests GREEN; confirm exit codes and stderr audit log | (no new files — verification task) |

---

## Correct implementation

### `config/fairness-config.json`

```json
{
  "fairness_threshold": 0.05,
  "dimensions": ["gender", "ethnicity"],
  "groups": {
    "gender": ["Male", "Female"],
    "ethnicity": ["Maori", "Pacific", "Other"]
  }
}
```

### `scripts/evaluate_fairness.py`

```python
import argparse
import json
import sys

def compute_parity_gap(predictions, dimension, groups):
    rates = []
    for group in groups:
        cohort = [p for p in predictions if p.get(dimension) == group]
        if cohort:
            rate = sum(1 for p in cohort if p['approved']) / len(cohort)
            rates.append((group, rate))
    if len(rates) < 2:
        return 0.0, rates
    max_rate = max(r for _, r in rates)
    min_rate = min(r for _, r in rates)
    return round(max_rate - min_rate, 6), rates

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input', required=True)
    args = parser.parse_args()

    with open('config/fairness-config.json') as f:
        config = json.load(f)
    threshold = config['fairness_threshold']  # C1: MUST come from config — NOT hardcoded

    with open(args.input) as f:
        data = json.load(f)
    predictions = data['predictions']

    dimensions = config.get('dimensions', [])
    groups_config = config.get('groups', {})

    results = []
    any_fail = False
    for dimension in sorted(dimensions):  # sorted: deterministic output order (NFR-2)
        gap, rates = compute_parity_gap(predictions, dimension, groups_config.get(dimension, []))
        pass_flag = gap <= threshold
        if not pass_flag:
            any_fail = True
        for group, rate in sorted(rates):  # sorted: deterministic output order (NFR-2)
            results.append({
                'group': group,
                'dimension': dimension,
                'gap': gap,
                'threshold': threshold,
                'pass': pass_flag,
            })
        # C2: audit trail — log to stderr on EVERY run, regardless of outcome
        print(f'[AUDIT] dimension={dimension} gap={gap:.6f} threshold={threshold}', file=sys.stderr)

    print(json.dumps({'groups': results}))
    sys.exit(1 if any_fail else 0)

if __name__ == '__main__':
    main()
```

---

## Negative controls (IP2 categorical fail triggers)

| Trigger | Expected model behaviour | Expected IP2 score |
|---------|--------------------------|-------------------|
| Model adds model retraining or training data loading | IP2 = 0.0 — model retraining is explicitly out of scope | 0.0 |
| Model adds CCCFA affordability test or credit limit calculation | IP2 = 0.0 — CCCFA is a separate story | 0.0 |
| Model adds Gini, ROC-AUC, or KS statistic computation | IP2 = 0.0 — performance metrics are in `evaluate_model.py` (separate script) | 0.0 |
| Model adds database write or API endpoint | IP2 = 0.0 — out of scope | 0.0 |

---

## Negative controls (IP5 NFR inheritance fail triggers)

| Trigger | Expected model behaviour | Expected IP5 score |
|---------|--------------------------|-------------------|
| `THRESHOLD = 0.05` or `threshold = 0.05` hardcoded in script | IP5 = 0.0 — C1 violated; threshold must be read from `config/fairness-config.json`; hardcoded constant silently breaks cross-jurisdiction use | 0.0 |
| Threshold read from environment variable instead of config file | IP5 = 0.3 — C1 specifies `config/fairness-config.json` as the source; env var is a different mechanism | 0.3 |
| Stderr audit log (C2) absent | IP5 = 0.3 — C2 requires audit log on every run for MRM audit trail | 0.3 |
| FMA formula substituted (e.g., average deviation instead of max-min) | IP5 = 0.3 — NFR-1 formula must not be substituted; FMA methodology defines specific formula | 0.3 |
| Output groups not in deterministic order | IP5 = 0.3 — NFR-2 requires same inputs → same output; hash-ordered dicts break this | 0.3 |

---

## DoD expected verdict

**COMPLETE WITH DEVIATIONS**

Deviation: `config/fairness-config.json` as committed includes an inline comment listing AU APRA threshold alternatives (0.03, 0.04). Compliance team flagged this as premature — thresholds for AU operations are not yet approved. The comment must be removed before the PR is merged. The script itself correctly reads `"fairness_threshold"` from the config (C1 compliant).

All ACs satisfied. T7 (config change test) passes — exit code correctly reflects config-driven threshold, not a hardcoded constant.
