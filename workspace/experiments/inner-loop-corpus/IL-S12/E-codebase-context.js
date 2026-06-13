// Existing codebase context for IL-S12
// File: scripts/evaluate_model.py (existing — credit.fairness-eval-1 does NOT modify this)
// credit.fairness-eval-1 creates evaluate_fairness.py in the same directory

// ─────────────────────────────────────────────────────────────────────────────
// scripts/evaluate_model.py  (existing — do NOT modify)
// ─────────────────────────────────────────────────────────────────────────────

/*
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
*/

// ─────────────────────────────────────────────────────────────────────────────
// config/fairness-config.json  (to be CREATED by credit.fairness-eval-1)
// ─────────────────────────────────────────────────────────────────────────────

// {
//   "fairness_threshold": 0.05,
//   "dimensions": ["gender", "ethnicity"],
//   "groups": {
//     "gender": ["Male", "Female"],
//     "ethnicity": ["Maori", "Pacific", "Other"]
//   }
// }

// ─────────────────────────────────────────────────────────────────────────────
// scripts/evaluate_fairness.py  (to be CREATED by credit.fairness-eval-1)
// ─────────────────────────────────────────────────────────────────────────────
//
// CLI usage: python scripts/evaluate_fairness.py --input <predictions.json>
// Exit code: 0 (all groups pass), 1 (one or more groups exceed threshold)
// Stdout:    JSON: { "groups": [{ "group", "dimension", "gap", "threshold", "pass" }] }
// Stderr:    Audit log — threshold used and gap values per dimension (C2 requirement)
//
// tests/test_evaluate_fairness.py  (to be CREATED by credit.fairness-eval-1)
//
// pytest test suite covering T1–T7 (see C-test-plan.md)
