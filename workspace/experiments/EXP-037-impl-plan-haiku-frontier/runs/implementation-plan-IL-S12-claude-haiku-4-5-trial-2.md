Save path: artefacts/2026-07-01-credit-model-refresh/plans/credit.fairness-eval-1-plan.md

---

# Implementation Plan: credit.fairness-eval-1

**Feature:** 2026-07-01-credit-model-refresh  
**Story:** credit.fairness-eval-1 — Implement demographic parity evaluation script  
**Branch:** `feature/credit.fairness-eval-1`  
**Test command:** `pytest tests/test_evaluate_fairness.py -v`  
**Oversight:** Medium (MRM team reviewer for NFR-1 formula verification)

---

## Test Suite (RED phase)

### File: `tests/test_evaluate_fairness.py`

```python
import json
import os
import subprocess
import sys
import tempfile
import pytest


class TestDemographicParityEvaluation:
    """Test suite for evaluate_fairness.py demographic parity script."""

    @pytest.fixture
    def temp_dir(self):
        """Create temporary directory for test files."""
        with tempfile.TemporaryDirectory() as tmpdir:
            yield tmpdir

    @pytest.fixture
    def sample_predictions(self):
        """Sample prediction data with known approval rates."""
        return {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": False, "gender": "Male", "ethnicity": "Maori"},
                {"approved": False, "gender": "Male", "ethnicity": "Maori"},
                # Male/Maori: 2/4 = 0.50
                
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                # Female/Maori: 1/4 = 0.25
                
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Male", "ethnicity": "Pacific"},
                # Male/Pacific: 3/4 = 0.75
                
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                # Female/Pacific: 2/4 = 0.50
                
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                # Male/Other: 4/4 = 1.00
                
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                # Female/Other: 0/4 = 0.00
            ]
        }

    @pytest.fixture
    def fairness_config_threshold_005(self, temp_dir):
        """Fairness config with threshold 0.05."""
        config = {
            "fairness_threshold": 0.05,
            "dimensions": ["gender", "ethnicity"],
            "groups": {
                "gender": ["Male", "Female"],
                "ethnicity": ["Maori", "Pacific", "Other"]
            }
        }
        config_path = os.path.join(temp_dir, "fairness-config.json")
        with open(config_path, "w") as f:
            json.dump(config, f)
        return config_path

    @pytest.fixture
    def fairness_config_threshold_010(self, temp_dir):
        """Fairness config with threshold 0.10."""
        config = {
            "fairness_threshold": 0.10,
            "dimensions": ["gender", "ethnicity"],
            "groups": {
                "gender": ["Male", "Female"],
                "ethnicity": ["Maori", "Pacific", "Other"]
            }
        }
        config_path = os.path.join(temp_dir, "fairness-config.json")
        with open(config_path, "w") as f:
            json.dump(config, f)
        return config_path

    # ========== T1: AC1 — JSON structure output ==========
    def test_T1_json_output_schema_with_known_rates(
        self, temp_dir, sample_predictions, fairness_config_threshold_005
    ):
        """
        T1: Given a JSON file of model predictions with known approval rates,
        when evaluate_fairness.py --input <file> runs,
        then it outputs valid JSON to stdout with structure:
        { "groups": [{ "group": str, "dimension": str, "gap": float, "threshold": float, "pass": bool }] }
        """
        predictions_path = os.path.join(temp_dir, "predictions.json")
        with open(predictions_path, "w") as f:
            json.dump(sample_predictions, f)

        # Copy config to temp directory for script to read
        import shutil
        shutil.copy(fairness_config_threshold_005, os.path.join(temp_dir, "fairness-config.json"))
        
        # Run script from temp_dir so it reads local config
        result = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        # Assert exit code is 0 or 1 (defined behaviour)
        assert result.returncode in [0, 1], f"Unexpected exit code: {result.returncode}"
        
        # Parse stdout as JSON
        output = json.loads(result.stdout)
        
        # Assert root structure
        assert "groups" in output, "Output missing 'groups' key"
        assert isinstance(output["groups"], list), "'groups' must be a list"
        assert len(output["groups"]) > 0, "'groups' list must not be empty"
        
        # Assert each group has required keys
        for group in output["groups"]:
            assert "group" in group, f"Group {group} missing 'group' key"
            assert "dimension" in group, f"Group {group} missing 'dimension' key"
            assert "gap" in group, f"Group {group} missing 'gap' key"
            assert "threshold" in group, f"Group {group} missing 'threshold' key"
            assert "pass" in group, f"Group {group} missing 'pass' key"
            
            # Type checks
            assert isinstance(group["group"], str), f"'group' must be str, got {type(group['group'])}"
            assert isinstance(group["dimension"], str), f"'dimension' must be str, got {type(group['dimension'])}"
            assert isinstance(group["gap"], (int, float)), f"'gap' must be numeric, got {type(group['gap'])}"
            assert isinstance(group["threshold"], (int, float)), f"'threshold' must be numeric, got {type(group['threshold'])}"
            assert isinstance(group["pass"], bool), f"'pass' must be bool, got {type(group['pass'])}"

    # ========== T2: AC2 — Exit code 1 when gap > threshold ==========
    def test_T2_exit_code_1_when_gap_exceeds_threshold(
        self, temp_dir, sample_predictions, fairness_config_threshold_005
    ):
        """
        T2: Given any group's parity gap exceeds the threshold,
        when the script completes,
        then it exits with code 1.
        
        Sample data: gender gap = |0.50 - 0.25| = 0.25 (exceeds 0.05 threshold)
        """
        predictions_path = os.path.join(temp_dir, "predictions.json")
        with open(predictions_path, "w") as f:
            json.dump(sample_predictions, f)

        import shutil
        shutil.copy(fairness_config_threshold_005, os.path.join(temp_dir, "fairness-config.json"))
        
        result = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 1, f"Expected exit code 1 for gap > threshold, got {result.returncode}"

    # ========== T3: AC2 + C2 — Stderr audit log on failure ==========
    def test_T3_stderr_audit_log_on_failure(
        self, temp_dir, sample_predictions, fairness_config_threshold_005
    ):
        """
        T3: Given any group fails the fairness threshold (AC2),
        when the script completes,
        then stderr contains the failing group name and gap value (C2 audit trail).
        stderr must be non-empty on every run (C2).
        """
        predictions_path = os.path.join(temp_dir, "predictions.json")
        with open(predictions_path, "w") as f:
            json.dump(sample_predictions, f)

        import shutil
        shutil.copy(fairness_config_threshold_005, os.path.join(temp_dir, "fairness-config.json"))
        
        result = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        # stderr must be non-empty
        assert result.stderr.strip() != "", "stderr must contain audit log (C2 violation)"
        
        # stderr should mention failing group or threshold
        assert "gap" in result.stderr.lower() or "fail" in result.stderr.lower() or "threshold" in result.stderr.lower(), \
            f"stderr does not mention gap/threshold info. stderr: {result.stderr}"

    # ========== T4: AC3 — Exit code 0 when all gaps ≤ threshold ==========
    def test_T4_exit_code_0_when_all_gaps_within_threshold(self, temp_dir):
        """
        T4: Given all groups' parity gaps are within the threshold,
        when the script completes,
        then it exits with code 0.
        
        Create predictions where all group gaps are ≤ 0.05.
        """
        predictions = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                # Male: 100%
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                # Female: 50%
                # Gender gap: 100% - 50% = 50% — exceeds 0.05, so we need tighter control
            ]
        }
        # Simplify: all same group to get 0 gap
        predictions = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                # All groups: 100% approval → all gaps = 0.0
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                # All: 100%
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        predictions_path = os.path.join(temp_dir, "predictions.json")
        with open(predictions_path, "w") as f:
            json.dump(predictions, f)

        config = {
            "fairness_threshold": 0.05,
            "dimensions": ["gender", "ethnicity"],
            "groups": {
                "gender": ["Male", "Female"],
                "ethnicity": ["Maori", "Pacific", "Other"]
            }
        }
        config_path = os.path.join(temp_dir, "fairness-config.json")
        with open(config_path, "w") as f:
            json.dump(config, f)

        result = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        assert result.returncode == 0, f"Expected exit code 0 for all gaps ≤ threshold, got {result.returncode}"

    # ========== T5: NFR-1 — FMA formula correctness ==========
    def test_T5_nfr1_fma_formula_max_min_gap(
        self, temp_dir, sample_predictions, fairness_config_threshold_005
    ):
        """
        T5: NFR-1 — Gap = max(group_approval_rate) - min(group_approval_rate) per dimension.
        
        For gender dimension using sample_predictions:
          - Male groups: Male/Maori=0.50, Male/Pacific=0.75, Male/Other=1.00 → max=1.00
          - Female groups: Female/Maori=0.25, Female/Pacific=0.50, Female/Other=0.00 → min=0.00
          - Gap = 1.00 - 0.00 = 1.00 (without considering within-gender variation)
        
        Actually, per dimension means per gender/ethnicity dimension separately:
          - Gender dimension: Male approval rate (aggregate) vs Female approval rate (aggregate)
          - Ethnicity dimension: Maori, Pacific, Other approval rates
        
        Let's verify: gender dimension:
          - Male: (2+3+4)/(4+4+4) = 9/12 = 0.75
          - Female: (1+2+0)/(4+4+4) = 3/12 = 0.25
          - Gender gap = 0.75 - 0.25 = 0.50 ✓
        
        Ethnicity dimension:
          - Maori: (2+1)/(4+4) = 3/8 = 0.375
          - Pacific: (3+2)/(4+4) = 5/8 = 0.625
          - Other: (4+0)/(4+4) = 4/8 = 0.50
          - Ethnicity gap = 0.625 - 0.375 = 0.25 ✓
        """
        predictions_path = os.path.join(temp_dir, "predictions.json")
        with open(predictions_path, "w") as f:
            json.dump(sample_predictions, f)

        import shutil
        shutil.copy(fairness_config_threshold_005, os.path.join(temp_dir, "fairness-config.json"))
        
        result = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        output = json.loads(result.stdout)
        groups = output["groups"]
        
        # Find gender dimension gaps
        gender_groups = [g for g in groups if g["dimension"] == "gender"]
        assert len(gender_groups) > 0, "No gender dimension groups in output"
        
        # Verify formula: there should be Male and Female groups with gaps
        # For gender, we expect one gap value per dimension (max - min of all groups in dimension)
        # Check the gap calculation against expected values
        gender_gap = max(g["gap"] for g in gender_groups)
        assert abs(gender_gap - 0.50) < 0.01, f"Gender gap should be ~0.50, got {gender_gap}"
        
        # Find ethnicity dimension gaps
        ethnicity_groups = [g for g in groups if g["dimension"] == "ethnicity"]
        assert len(ethnicity_groups) > 0, "No ethnicity dimension groups in output"
        
        ethnicity_gap = max(g["gap"] for g in ethnicity_groups)
        assert abs(ethnicity_gap - 0.25) < 0.01, f"Ethnicity gap should be ~0.25, got {ethnicity_gap}"

    # ========== T6: NFR-2 — Deterministic output ==========
    def test_T6_nfr2_deterministic_output_reproducibility(
        self, temp_dir, sample_predictions, fairness_config_threshold_005
    ):
        """
        T6: NFR-2 — Same input file → identical stdout JSON on every run.
        Run the script twice on same input; stdout must be byte-for-byte identical.
        """
        predictions_path = os.path.join(temp_dir, "predictions.json")
        with open(predictions_path, "w") as f:
            json.dump(sample_predictions, f)

        import shutil
        shutil.copy(fairness_config_threshold_005, os.path.join(temp_dir, "fairness-config.json"))
        
        # Run 1
        result1 = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        # Run 2
        result2 = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        # Stdout must be identical (deterministic)
        assert result1.stdout == result2.stdout, \
            f"Outputs differ:\nRun 1:\n{result1.stdout}\n\nRun 2:\n{result2.stdout}"

    # ========== T7: C1 — Threshold read from config, not hardcoded ==========
    def test_T7_C1_threshold_from_config_not_hardcoded(
        self, temp_dir, sample_predictions, fairness_config_threshold_005, fairness_config_threshold_010
    ):
        """
        T7: C1 Critical — Threshold MUST be read from config/fairness-config.json.
        Hardcoding 0.05, 0.10, or any constant is prohibited.
        
        Scenario:
          - Cohort gap = 0.06 (from sample data gender gap ≈ 0.50, but use simpler data)
          - Run 1: config threshold = 0.05 → gap > threshold → exit 1
          - Run 2: update config to 0.10 → gap < threshold → exit 0
          - If hardcoded 0.05, Run 2 would incorrectly exit 1 (FAIL C1)
        """
        # Create predictions with controlled gap = 0.06
        predictions = {
            "predictions": [
                # Male: 6/10 = 0.60
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": False, "gender": "Male", "ethnicity": "Maori"},
                {"approved": False, "gender": "Male", "ethnicity": "Maori"},
                {"approved": False, "gender": "Male", "ethnicity": "Maori"},
                {"approved": False, "gender": "Male", "ethnicity": "Maori"},
                # Female: 4/10 = 0.40
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                {"approved": False, "gender": "Female", "ethnicity": "Maori"},
                # Ethnicity: same for all (all Maori) → gap = 0
                # All other genders/ethnicities same rate
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Male", "ethnicity": "Pacific"},
                # Female/Pacific: 0.40
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
                # Other: same as Pacific
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Male", "ethnicity": "Other"},
                {"approved": False, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
                {"approved": False, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        predictions_path = os.path.join(temp_dir, "predictions.json")
        with open(predictions_path, "w") as f:
            json.dump(predictions, f)

        # === Run 1: threshold = 0.05, gap = 0.20 > 0.05 → expect exit 1 ===
        import shutil
        shutil.copy(fairness_config_threshold_005, os.path.join(temp_dir, "fairness-config.json"))
        
        result1 = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        assert result1.returncode == 1, \
            f"Run 1 (threshold=0.05, gap=0.20): expected exit 1, got {result1.returncode}"

        # === Run 2: threshold = 0.10, gap = 0.20 > 0.10 → still expect exit 1 ===
        # (using 0.10 instead of 0.20 to demonstrate config reading)
        # Let's use 0.25 instead to show pass case
        shutil.copy(fairness_config_threshold_010, os.path.join(temp_dir, "fairness-config.json"))
        
        # Actually: gap is 0.20, threshold 0.10 → still fails. Use threshold 0.30
        config_030 = {
            "fairness_threshold": 0.30,
            "dimensions": ["gender", "ethnicity"],
            "groups": {
                "gender": ["Male", "Female"],
                "ethnicity": ["Maori", "Pacific", "Other"]
            }
        }
        with open(os.path.join(temp_dir, "fairness-config.json"), "w") as f:
            json.dump(config_030, f)
        
        result2 = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        assert result2.returncode == 0, \
            f"Run 2 (threshold=0.30, gap=0.20): expected exit 0, got {result2.returncode}. " \
            f"If hardcoded 0.05, this would fail. Config-driven threshold works."

    # ========== T8: C2 — Stderr non-empty on every run (pass + fail) ==========
    def test_T8_C2_stderr_audit_log_on_every_run(
        self, temp_dir
    ):
        """
        C2 — Audit trail: stderr must contain gap/threshold info on EVERY run,
        regardless of pass/fail outcome. This is independent of exit code.
        """
        # Create passing predictions (all 100% approval)
        predictions = {
            "predictions": [
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Maori"},
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": True, "gender": "Female", "ethnicity": "Maori"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Female", "ethnicity": "Pacific"},
                {"approved": True, "gender": "Male", "ethnicity": "Other"},
                {"approved": True, "gender": "Female", "ethnicity": "Other"},
            ]
        }
        
        predictions_path = os.path.join(temp_dir, "predictions.json")
        with open(predictions_path, "w") as f:
            json.dump(predictions, f)

        config = {
            "fairness_threshold": 0.05,
            "dimensions": ["gender", "ethnicity"],
            "groups": {
                "gender": ["Male", "Female"],
                "ethnicity": ["Maori", "Pacific", "Other"]
            }
        }
        config_path = os.path.join(temp_dir, "fairness-config.json")
        with open(config_path, "w") as f:
            json.dump(config, f)

        result = subprocess.run(
            [sys.executable, "scripts/evaluate_fairness.py", "--input", predictions_path],
            cwd=temp_dir,
            capture_output=True,
            text=True
        )

        # Exit code should be 0 (all pass)
        assert result.returncode == 0

        # stderr must still be non-empty with audit info (C2)
        assert result.stderr.strip() != "", \
            "stderr must contain audit log even on passing run (C2 violation)"
        assert "gap" in result.stderr.lower() or "threshold" in result.stderr.lower(), \
            f"stderr should mention gap/threshold. stderr: {result.stderr}"
```

---

## Implementation

### File: `scripts/evaluate_fairness.py`

```python
#!/usr/bin/env python3
"""
Demographic parity evaluation script for credit model fairness.

Implements NFR-1 (FMA algorithmic fairness methodology):
  Gap = max(group_approval_rate) - min(group_approval_rate) per dimension

Architecture constraints:
  C1: Threshold MUST be read from config/fairness-config.json (not hardcoded)
  C2: Audit trail — log all gaps and threshold to stderr on every run
"""

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
    """
    Load fairness evaluation configuration from config/fairness-config.json.
    C1: Threshold is read here, NOT hardcoded in script.
    """
    with open('config/fairness-config.json') as f:
        return json.load(f)


def calculate_approval_rate(records):
    """Calculate approval rate from list of prediction records."""
    if not records:
        return 0.0
    approved = sum(1 for r in records if r['approved'])
    return approved / len(records)


def evaluate_demographic_parity(predictions, config):
    """
    Calculate demographic parity gaps per dimension (NFR-1).
    
    Gap = max(group_approval_rate) - min(group_approval_rate) per dimension
    
    Args:
        predictions: List of {approved: bool, gender: str, ethnicity: str}
        config: {fairness_threshold: float, dimensions: [str], groups: {str: [str]}}
    
    Returns:
        {
            "groups": [
                {
                    