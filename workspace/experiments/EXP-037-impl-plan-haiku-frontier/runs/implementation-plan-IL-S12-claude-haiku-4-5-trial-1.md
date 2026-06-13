Save path: artefacts/2026-07-01-credit-model-refresh/plans/credit.fairness-eval-1-plan.md

---

# IL-S12 Implementation Plan — credit.fairness-eval-1

**Feature:** 2026-07-01-credit-model-refresh  
**Story:** credit.fairness-eval-1 — Implement demographic parity evaluation script  
**Branch:** `feature/credit.fairness-eval-1`  
**Test command:** `pytest tests/test_evaluate_fairness.py -v`  
**Oversight level:** Medium (MRM team reviewer for NFR-1 formula verification)

---

## Task 1: T1 — JSON output schema validation (AC1)

### RED: Test JSON structure and output format

**File:** `tests/test_evaluate_fairness.py`

```python
import json
import subprocess
import pytest
import tempfile
import os

class TestDemographicParityOutput:
    """Test AC1: JSON output schema and structure."""
    
    def test_T1_json_output_schema_matches_spec(self):
        """
        GIVEN: predictions JSON with known approval rates
        WHEN: evaluate_fairness.py runs with --input <file>
        THEN: stdout contains valid JSON with schema:
              { "groups": [{ "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }] }
        """
        predictions_data = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(predictions_data, f)
            pred_file = f.name
        
        try:
            result = subprocess.run(
                ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                capture_output=True,
                text=True
            )
            
            output_json = json.loads(result.stdout)
            
            # Assert schema
            assert "groups" in output_json
            assert isinstance(output_json["groups"], list)
            assert len(output_json["groups"]) > 0
            
            for group_result in output_json["groups"]:
                assert "group" in group_result
                assert "dimension" in group_result
                assert "gap" in group_result
                assert "threshold" in group_result
                assert "pass" in group_result
                assert isinstance(group_result["gap"], float)
                assert isinstance(group_result["threshold"], float)
                assert isinstance(group_result["pass"], bool)
                assert isinstance(group_result["dimension"], str)
                assert isinstance(group_result["group"], str)
        
        finally:
            os.unlink(pred_file)
```

### GREEN: Minimal implementation

**File:** `scripts/evaluate_fairness.py`

```python
import json
import sys
import argparse
from collections import defaultdict


def load_predictions(filepath):
    """Load model prediction results from JSON file."""
    with open(filepath) as f:
        data = json.load(f)
    return data['predictions']


def load_fairness_config():
    """Load fairness evaluation configuration from config/fairness-config.json."""
    with open('config/fairness-config.json') as f:
        return json.load(f)


def calculate_demographic_parity(predictions, config):
    """
    Calculate demographic parity gap per dimension (NFR-1).
    Gap = max(group_approval_rate) - min(group_approval_rate)
    
    Args:
        predictions: list of { "approved": bool, "gender": str, "ethnicity": str }
        config: { "fairness_threshold": float, "dimensions": [...], "groups": {...} }
    
    Returns:
        list of { "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }
    """
    threshold = config['fairness_threshold']
    dimensions = config['dimensions']
    group_definitions = config['groups']
    results = []
    
    for dimension in dimensions:
        # Tally approvals per group within this dimension
        group_counts = defaultdict(lambda: {"approved": 0, "total": 0})
        
        for pred in predictions:
            group_name = pred[dimension]
            group_counts[group_name]["total"] += 1
            if pred['approved']:
                group_counts[group_name]["approved"] += 1
        
        # Calculate approval rates
        approval_rates = {}
        for group_name in group_definitions[dimension]:
            if group_counts[group_name]["total"] > 0:
                approval_rates[group_name] = (
                    group_counts[group_name]["approved"] / group_counts[group_name]["total"]
                )
            else:
                approval_rates[group_name] = 0.0
        
        # Calculate gap (max - min) for this dimension
        if approval_rates:
            gap = max(approval_rates.values()) - min(approval_rates.values())
        else:
            gap = 0.0
        
        # Record result for each group in this dimension
        for group_name in group_definitions[dimension]:
            passes = gap <= threshold
            results.append({
                "group": group_name,
                "dimension": dimension,
                "gap": round(gap, 6),
                "threshold": threshold,
                "pass": passes
            })
    
    return results


def main():
    parser = argparse.ArgumentParser(description='Evaluate demographic parity fairness.')
    parser.add_argument('--input', required=True, help='Path to predictions JSON file')
    args = parser.parse_args()
    
    predictions = load_predictions(args.input)
    config = load_fairness_config()
    
    results = calculate_demographic_parity(predictions, config)
    
    output = {"groups": results}
    json.dump(output, sys.stdout, indent=2)
    sys.stdout.write('\n')


if __name__ == '__main__':
    main()
```

**File:** `config/fairness-config.json`

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

---

## Task 2: T2 — Exit code 1 when gap exceeds threshold (AC2)

### RED: Test exit code 1 on failing gap

**File:** `tests/test_evaluate_fairness.py`

```python
    def test_T2_exit_code_1_when_gap_exceeds_threshold(self):
        """
        GIVEN: predictions with approval rates such that gap > threshold
        WHEN: evaluate_fairness.py completes
        THEN: exit code is 1
        """
        # Male: 2/2 approved (100%), Female: 0/2 approved (0%)
        # Gap = 1.0 - 0.0 = 1.0, threshold = 0.05 → gap > threshold
        predictions_data = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(predictions_data, f)
            pred_file = f.name
        
        try:
            result = subprocess.run(
                ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                capture_output=True,
                text=True
            )
            assert result.returncode == 1, f"Expected exit code 1, got {result.returncode}"
        
        finally:
            os.unlink(pred_file)
```

### GREEN: Update implementation to compute and return exit code

**File:** `scripts/evaluate_fairness.py` — update `main()`

```python
def main():
    parser = argparse.ArgumentParser(description='Evaluate demographic parity fairness.')
    parser.add_argument('--input', required=True, help='Path to predictions JSON file')
    args = parser.parse_args()
    
    predictions = load_predictions(args.input)
    config = load_fairness_config()
    
    results = calculate_demographic_parity(predictions, config)
    
    output = {"groups": results}
    json.dump(output, sys.stdout, indent=2)
    sys.stdout.write('\n')
    
    # Check for any failing gaps (AC2 logic)
    any_fail = any(not group['pass'] for group in results)
    
    if any_fail:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
```

---

## Task 3: T3 — Stderr logging of failing groups (AC2 + C2)

### RED: Test stderr contains failing group details

**File:** `tests/test_evaluate_fairness.py`

```python
    def test_T3_stderr_log_contains_failing_groups(self):
        """
        GIVEN: predictions with gap > threshold (failing scenario)
        WHEN: evaluate_fairness.py completes
        THEN: stderr contains information about the failing groups
        """
        predictions_data = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(predictions_data, f)
            pred_file = f.name
        
        try:
            result = subprocess.run(
                ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                capture_output=True,
                text=True
            )
            
            # Verify stderr is not empty
            assert result.stderr, "stderr should contain audit log"
            
            # Verify stderr mentions the dimension (gender) and gap values
            assert "gender" in result.stderr.lower() or "gap" in result.stderr.lower(), \
                "stderr should mention dimension or gap values"
        
        finally:
            os.unlink(pred_file)
```

### GREEN: Add stderr logging to implementation (C2 — Audit Trail)

**File:** `scripts/evaluate_fairness.py` — update imports and `main()`

```python
import json
import sys
import argparse
from collections import defaultdict


def load_predictions(filepath):
    """Load model prediction results from JSON file."""
    with open(filepath) as f:
        data = json.load(f)
    return data['predictions']


def load_fairness_config():
    """Load fairness evaluation configuration from config/fairness-config.json."""
    with open('config/fairness-config.json') as f:
        return json.load(f)


def calculate_demographic_parity(predictions, config):
    """
    Calculate demographic parity gap per dimension (NFR-1).
    Gap = max(group_approval_rate) - min(group_approval_rate)
    
    Args:
        predictions: list of { "approved": bool, "gender": str, "ethnicity": str }
        config: { "fairness_threshold": float, "dimensions": [...], "groups": {...} }
    
    Returns:
        list of { "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }
    """
    threshold = config['fairness_threshold']
    dimensions = config['dimensions']
    group_definitions = config['groups']
    results = []
    
    for dimension in dimensions:
        # Tally approvals per group within this dimension
        group_counts = defaultdict(lambda: {"approved": 0, "total": 0})
        
        for pred in predictions:
            group_name = pred[dimension]
            group_counts[group_name]["total"] += 1
            if pred['approved']:
                group_counts[group_name]["approved"] += 1
        
        # Calculate approval rates
        approval_rates = {}
        for group_name in group_definitions[dimension]:
            if group_counts[group_name]["total"] > 0:
                approval_rates[group_name] = (
                    group_counts[group_name]["approved"] / group_counts[group_name]["total"]
                )
            else:
                approval_rates[group_name] = 0.0
        
        # Calculate gap (max - min) for this dimension
        if approval_rates:
            gap = max(approval_rates.values()) - min(approval_rates.values())
        else:
            gap = 0.0
        
        # Record result for each group in this dimension
        for group_name in group_definitions[dimension]:
            passes = gap <= threshold
            results.append({
                "group": group_name,
                "dimension": dimension,
                "gap": round(gap, 6),
                "threshold": threshold,
                "pass": passes
            })
    
    return results


def log_audit_trail(results, threshold):
    """
    Log all group gaps and threshold to stderr (C2 — Compliance Audit Trail).
    Runs on every execution regardless of outcome.
    """
    sys.stderr.write("=== FAIRNESS EVALUATION AUDIT LOG ===\n")
    sys.stderr.write(f"Threshold: {threshold}\n")
    
    # Group by dimension for clarity
    by_dimension = {}
    for result in results:
        dim = result['dimension']
        if dim not in by_dimension:
            by_dimension[dim] = []
        by_dimension[dim].append(result)
    
    for dimension in sorted(by_dimension.keys()):
        sys.stderr.write(f"\nDimension: {dimension}\n")
        for result in by_dimension[dimension]:
            status = "PASS" if result['pass'] else "FAIL"
            sys.stderr.write(
                f"  Group {result['group']:12} Gap={result['gap']:.6f} "
                f"Threshold={result['threshold']:.6f} [{status}]\n"
            )
    
    sys.stderr.write("=====================================\n")


def main():
    parser = argparse.ArgumentParser(description='Evaluate demographic parity fairness.')
    parser.add_argument('--input', required=True, help='Path to predictions JSON file')
    args = parser.parse_args()
    
    predictions = load_predictions(args.input)
    config = load_fairness_config()
    threshold = config['fairness_threshold']
    
    results = calculate_demographic_parity(predictions, config)
    
    # C2: Log audit trail to stderr on every run
    log_audit_trail(results, threshold)
    
    # Output JSON to stdout
    output = {"groups": results}
    json.dump(output, sys.stdout, indent=2)
    sys.stdout.write('\n')
    
    # Check for any failing gaps (AC2 logic)
    any_fail = any(not group['pass'] for group in results)
    
    if any_fail:
        sys.exit(1)
    else:
        sys.exit(0)


if __name__ == '__main__':
    main()
```

---

## Task 4: T4 — Exit code 0 when all gaps within threshold (AC3)

### RED: Test exit code 0 on passing gaps

**File:** `tests/test_evaluate_fairness.py`

```python
    def test_T4_exit_code_0_when_all_gaps_within_threshold(self):
        """
        GIVEN: predictions with approval rates such that gap ≤ threshold (all pass)
        WHEN: evaluate_fairness.py completes
        THEN: exit code is 0
        """
        # All groups: 2/4 approved (50%), so gap = 0.0 ≤ 0.05
        predictions_data = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": False, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(predictions_data, f)
            pred_file = f.name
        
        try:
            result = subprocess.run(
                ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                capture_output=True,
                text=True
            )
            assert result.returncode == 0, f"Expected exit code 0, got {result.returncode}"
        
        finally:
            os.unlink(pred_file)
```

### GREEN: Already implemented in Task 2

No additional code changes needed; exit code 0 logic is already in place.

---

## Task 5: T5 — NFR-1 FMA formula validation (max-min per dimension)

### RED: Test FMA formula produces correct gap calculation

**File:** `tests/test_evaluate_fairness.py`

```python
    def test_T5_fma_formula_max_minus_min_gap_per_dimension(self):
        """
        NFR-1: Gap = max(group_approval_rate) - min(group_approval_rate) per dimension.
        GIVEN: gender dimension with known approval rates
        WHEN: evaluate_fairness.py calculates gaps
        THEN: gap matches max_rate - min_rate exactly
        """
        # Male: 3/4 = 75%, Female: 1/4 = 25%
        # Gender gap = 0.75 - 0.25 = 0.50
        predictions_data = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(predictions_data, f)
            pred_file = f.name
        
        try:
            result = subprocess.run(
                ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                capture_output=True,
                text=True
            )
            
            output = json.loads(result.stdout)
            
            # Find gender dimension results
            gender_results = [g for g in output['groups'] if g['dimension'] == 'gender']
            
            # All gender group results should have the same gap (0.50)
            assert len(gender_results) == 2  # Male and Female
            for result in gender_results:
                assert abs(result['gap'] - 0.50) < 0.0001, \
                    f"Expected gap ~0.50, got {result['gap']}"
        
        finally:
            os.unlink(pred_file)
```

### GREEN: Already implemented in Task 1

The `calculate_demographic_parity()` function already implements the NFR-1 formula correctly:
```python
gap = max(approval_rates.values()) - min(approval_rates.values())
```

No additional changes needed.

---

## Task 6: T6 — NFR-2 Reproducibility (deterministic output)

### RED: Test identical output on repeated runs

**File:** `tests/test_evaluate_fairness.py`

```python
    def test_T6_reproducibility_identical_stdout_on_repeated_runs(self):
        """
        NFR-2: Same input file → identical stdout JSON on every run.
        No randomness or non-deterministic fields.
        """
        predictions_data = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(predictions_data, f)
            pred_file = f.name
        
        try:
            # Run 1
            result1 = subprocess.run(
                ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                capture_output=True,
                text=True
            )
            output1 = result1.stdout
            
            # Run 2
            result2 = subprocess.run(
                ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                capture_output=True,
                text=True
            )
            output2 = result2.stdout
            
            # Parse and compare (accounting for JSON formatting)
            json1 = json.loads(output1)
            json2 = json.loads(output2)
            
            assert json1 == json2, "Outputs differ between runs"
            
            # Also verify order is deterministic by comparing string representation
            # (after normalizing whitespace)
            assert output1.strip() == output2.strip(), \
                "Output string representation differs (ordering or formatting)"
        
        finally:
            os.unlink(pred_file)
```

### GREEN: Ensure deterministic group ordering

**File:** `scripts/evaluate_fairness.py` — update `calculate_demographic_parity()` to ensure ordering

```python
def calculate_demographic_parity(predictions, config):
    """
    Calculate demographic parity gap per dimension (NFR-1).
    Gap = max(group_approval_rate) - min(group_approval_rate)
    
    Args:
        predictions: list of { "approved": bool, "gender": str, "ethnicity": str }
        config: { "fairness_threshold": float, "dimensions": [...], "groups": {...} }
    
    Returns:
        list of { "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }
        Ordered by dimension name, then group name (deterministic — NFR-2).
    """
    threshold = config['fairness_threshold']
    dimensions = config['dimensions']
    group_definitions = config['groups']
    results = []
    
    for dimension in sorted(dimensions):  # NFR-2: Deterministic dimension order
        # Tally approvals per group within this dimension
        group_counts = defaultdict(lambda: {"approved": 0, "total": 0})
        
        for pred in predictions:
            group_name = pred[dimension]
            group_counts[group_name]["total"] += 1
            if pred['approved']:
                group_counts[group_name]["approved"] += 1
        
        # Calculate approval rates
        approval_rates = {}
        for group_name in group_definitions[dimension]:
            if group_counts[group_name]["total"] > 0:
                approval_rates[group_name] = (
                    group_counts[group_name]["approved"] / group_counts[group_name]["total"]
                )
            else:
                approval_rates[group_name] = 0.0
        
        # Calculate gap (max - min) for this dimension
        if approval_rates:
            gap = max(approval_rates.values()) - min(approval_rates.values())
        else:
            gap = 0.0
        
        # Record result for each group in this dimension (sorted order — NFR-2)
        for group_name in sorted(group_definitions[dimension]):
            passes = gap <= threshold
            results.append({
                "group": group_name,
                "dimension": dimension,
                "gap": round(gap, 6),
                "threshold": threshold,
                "pass": passes
            })
    
    return results
```

---

## Task 7: T7 — C1 Architecture Constraint: Threshold from config (not hardcoded)

### RED: Test that config threshold change affects exit code (critical C1 validation)

**File:** `tests/test_evaluate_fairness.py`

```python
    def test_T7_c1_threshold_read_from_config_not_hardcoded(self):
        """
        C1 (FMA Regulatory): Threshold MUST be read from config, not hardcoded.
        GIVEN: predictions with gap = 0.06
        WHEN: Run 1 with config threshold = 0.05 → exit 1
        THEN: Run 2 with config threshold = 0.10 → exit 0
        
        If threshold were hardcoded at 0.05, Run 2 would also exit 1 (FAIL).
        """
        predictions_data = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Male", "ethnicity": "Other"},
                # Female: 1/5 = 20%
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                # Gender gap = 60% - 20% = 0.40
            ]
        }
        
        with tempfile.NamedTemporaryFile(mode='w', suffix='.json', delete=False) as f:
            json.dump(predictions_data, f)
            pred_file = f.name
        
        try:
            # Create temp config files
            config_strict = {
                "fairness_threshold": 0.05,
                "dimensions": ["gender", "ethnicity"],
                "groups": {
                    "gender": ["Female", "Male"],
                    "ethnicity": ["Maori", "Other", "Pacific"]
                }
            }
            
            config_lenient = {
                "fairness_threshold": 0.50,
                "dimensions": ["gender", "ethnicity"],
                "groups": {
                    "gender": ["Female", "Male"],
                    "ethnicity": ["Maori", "Other", "Pacific"]
                }
            }
            
            # Save strict config temporarily
            with tempfile.NamedTemporaryFile(
                mode='w', suffix='.json', dir='config', delete=False
            ) as f:
                config_file = f.name
            
            try:
                # RUN 1: threshold = 0.05, gap = 0.40 → expect exit 1
                with open('config/fairness-config.json', 'w') as f:
                    json.dump(config_strict, f)
                
                result1 = subprocess.run(
                    ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                    capture_output=True,
                    text=True
                )
                assert result1.returncode == 1, \
                    f"Run 1 (threshold=0.05): expected exit 1, got {result1.returncode}"
                
                # RUN 2: threshold = 0.50, gap = 0.40 → expect exit 0
                with open('config/fairness-config.json', 'w') as f:
                    json.dump(config_lenient, f)
                
                result2 = subprocess.run(
                    ['python', 'scripts/evaluate_fairness.py', '--input', pred_file],
                    capture_output=True,
                    text=True
                )
                assert result2.returncode == 0, \
                    f"Run 2 (threshold=0.50): expected exit 0, got {result2.returncode}. " \
                    f"If this fails, threshold may be hardcoded!"
            
            finally:
                # Restore original config
                original_config = {
                    "fairness_threshold": 0.05,
                    "dimensions": ["gender", "ethnicity"],
                    "groups": {
                        "gender": ["Female", "Male"],
                        "ethnicity": ["Maori", "Other", "Pacific"]
                    }
                }
                with open('config/fairness-config.json', 'w') as f:
                    json.dump(original_config, f)
        
        finally:
            os.unlink(pred_file)
```

### GREEN: Already implemented

The implementation already reads threshold from config:
```python
threshold = config['fairness_threshold']
```

No hardcoded constant exists. No additional changes needed.

---

## Summary of Files and Deliverables

### Files to Create

1. **`scripts/evaluate_fairness.py`** — Main evaluation script
   - Reads predictions from `--input` JSON file
   - Reads fairness threshold from `config/fairness-config.json` (C1 — not hardcoded)
   - Calculates demographic parity gaps per dimension (NFR-1: max-min formula)
   - Outputs JSON schema to stdout (AC1)
   - Logs all gaps and threshold to stderr on every run (C2)
   - Exits with code 1 if any gap > threshold; code 0 if all pass (AC2, AC3)
   - Deterministic ordering for reproducibility (NFR-2)

2. **`config/fairness-config.json`** — Configuration file
   - Contains `fairness_threshold` (read by script, not hardcoded in code)
   - Dimensions: gender, ethnicity
   - Group definitions per dimension

3. **`tests/test_evaluate_fairness.py`** — Complete test suite
   - T1: JSON output schema validation
   - T2: Exit code 1 on failing gap
   - T3: Stderr audit log on every run
   - T4: Exit code 0 on passing gaps
   - T5: NFR-1 FMA formula (max-min)
   - T6: NFR-2 reproducibility (deterministic output)
   - T7: C1 constraint (config-driven threshold, not hardcoded)

### Test Execution

```bash
pytest tests/test_evaluate_fairness.py -v
```

### Key Compliance Notes

- **C1 Violation Prevention:** No hardcoded threshold constant. All threshold values read from `config/fairness-config.json`.
- **C2 Audit Trail:** Stderr logged on every execution with all gaps, threshold, and pass/fail status.
- **NFR-1 (FMA Formula):** Gap calculation is exactly `max(approval_rates) - min(approval_rates)` per dimension, not substituted.
- **NFR-2 (Reproducibility):** Dimensions and groups sorted alphabetically for deterministic output; no randomness or timestamps in stdout.
- **MRM Compliance Review:** `config/fairness-config.json` flagged for compliance review before merge (W1).

---

**Branch:** `feature/credit.fairness-eval-1`  
**Oversight:** Medium (MRM team reviewer for NFR-1 formula + C1 hardcoding check)