Save path: artefacts/2026-07-01-credit-model-refresh/plans/credit.fairness-eval-1-plan.md

```markdown
# Implementation Plan — credit.fairness-eval-1
# Demographic Parity Evaluation Script

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.fairness-eval-1
**Branch:** `feature/credit.fairness-eval-1`
**Oversight:** Medium (MRM team reviewer required before merge)
**Test command:** `pytest tests/test_evaluate_fairness.py -v`

---

## Overview

Implement `scripts/evaluate_fairness.py` — a standalone CLI script that reads model
predictions, loads a configurable fairness threshold, computes demographic parity gaps
per dimension using the FMA-mandated max-min formula, writes structured JSON to stdout,
logs audit information to stderr, and exits with the appropriate code.

**Files to create:**
1. `tests/test_evaluate_fairness.py` — full test suite (written first, RED)
2. `config/fairness-config.json` — configuration file
3. `scripts/evaluate_fairness.py` — implementation

---

## TDD Task Sequence

---

### TASK 1 — Write the failing test suite (RED)

**File:** `tests/test_evaluate_fairness.py`

Write all tests before any implementation exists. Every test will fail (ImportError or
AssertionError) at this stage. That is the expected RED state.

```python
# tests/test_evaluate_fairness.py
"""
Test suite for scripts/evaluate_fairness.py
Covers: AC1, AC2, AC3, NFR-1, NFR-2, C1, C2

Run with: pytest tests/test_evaluate_fairness.py -v
"""

import json
import os
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SCRIPT = Path(__file__).parent.parent / "scripts" / "evaluate_fairness.py"
CONFIG_PATH = Path(__file__).parent.parent / "config" / "fairness-config.json"


def _write_config(threshold: float, path: Path = CONFIG_PATH) -> None:
    """Overwrite config/fairness-config.json with the given threshold."""
    config = {
        "fairness_threshold": threshold,
        "dimensions": ["gender", "ethnicity"],
        "groups": {
            "gender": ["Male", "Female"],
            "ethnicity": ["Maori", "Pacific", "Other"],
        },
    }
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(config, indent=2))


def _write_predictions(predictions: list, tmp_path: Path) -> Path:
    """Write a predictions JSON file and return its path."""
    p = tmp_path / "predictions.json"
    p.write_text(json.dumps({"predictions": predictions}))
    return p


def _run_script(input_path: Path, config_path: Path = CONFIG_PATH):
    """
    Run evaluate_fairness.py as a subprocess.
    Returns (returncode, stdout_str, stderr_str).
    """
    result = subprocess.run(
        [sys.executable, str(SCRIPT), "--input", str(input_path)],
        capture_output=True,
        text=True,
        cwd=str(Path(__file__).parent.parent),
    )
    return result.returncode, result.stdout, result.stderr


# ---------------------------------------------------------------------------
# Fixtures — shared prediction datasets
# ---------------------------------------------------------------------------

@pytest.fixture
def all_pass_predictions():
    """
    Gender gap = 0.0 (both 100% approved).
    Ethnicity gap = 0.0 (all 100% approved).
    Designed so every group passes a threshold of 0.05.
    """
    return [
        {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
        {"approved": True,  "gender": "Female",  "ethnicity": "Pacific"},
        {"approved": True,  "gender": "Male",   "ethnicity": "Other"},
        {"approved": True,  "gender": "Female",  "ethnicity": "Maori"},
    ]


@pytest.fixture
def gender_fail_predictions():
    """
    Male approval = 4/4 = 1.0
    Female approval = 0/4 = 0.0
    Gender gap = 1.0 — clearly exceeds threshold 0.05.
    Ethnicity gap = 0.0 (Maori 100%, Pacific 100%, Other 100% because
    we spread approvals evenly across ethnicities).
    """
    return [
        {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
        {"approved": True,  "gender": "Male",   "ethnicity": "Pacific"},
        {"approved": True,  "gender": "Male",   "ethnicity": "Other"},
        {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
        {"approved": False, "gender": "Female",  "ethnicity": "Pacific"},
        {"approved": False, "gender": "Female",  "ethnicity": "Other"},
        {"approved": False, "gender": "Female",  "ethnicity": "Maori"},
        {"approved": False, "gender": "Female",  "ethnicity": "Pacific"},
    ]


@pytest.fixture
def known_rate_predictions():
    """
    Precise rates for formula verification (NFR-1 / T5):
      gender:
        Male:   3 approved / 4 total = 0.75
        Female: 1 approved / 4 total = 0.25
        gap = 0.75 - 0.25 = 0.50
      ethnicity:
        Maori:   2/2 = 1.00
        Pacific: 1/3 = 0.3333...
        Other:   1/3 = 0.3333...
        gap = 1.00 - 0.3333... = 0.6667...
    """
    return [
        # Male approvals (3 of 4)
        {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
        {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
        {"approved": True,  "gender": "Male",   "ethnicity": "Pacific"},
        {"approved": False, "gender": "Male",   "ethnicity": "Pacific"},
        # Female approvals (1 of 4)
        {"approved": True,  "gender": "Female",  "ethnicity": "Other"},
        {"approved": False, "gender": "Female",  "ethnicity": "Pacific"},
        {"approved": False, "gender": "Female",  "ethnicity": "Other"},
        {"approved": False, "gender": "Female",  "ethnicity": "Other"},
    ]


@pytest.fixture
def threshold_boundary_predictions():
    """
    Gender gap = 0.06 exactly.
    Male:   10/10 = 1.0
    Female: 94/100 = 0.94
    gap = 0.06
    Ethnicity gap = 0.0 (all same rate).
    Used for C1 / T7 config-threshold test.
    """
    preds = []
    for _ in range(10):
        preds.append({"approved": True, "gender": "Male", "ethnicity": "Other"})
    for i in range(100):
        approved = i < 94  # first 94 approved
        preds.append({"approved": approved, "gender": "Female", "ethnicity": "Other"})
    return preds


# ---------------------------------------------------------------------------
# T1 — AC1: stdout JSON schema
# ---------------------------------------------------------------------------

class TestAC1JsonSchema:
    """T1: Script outputs well-formed JSON matching the required schema."""

    def test_stdout_is_valid_json(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        # Must not raise
        data = json.loads(stdout)
        assert isinstance(data, dict), "stdout must be a JSON object"

    def test_stdout_has_groups_key(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        assert "groups" in data, "stdout JSON must have top-level 'groups' key"

    def test_groups_is_list(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        assert isinstance(data["groups"], list), "'groups' must be a list"

    def test_each_group_entry_has_required_keys(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        required_keys = {"group", "dimension", "gap", "threshold", "pass"}
        for entry in data["groups"]:
            assert required_keys.issubset(entry.keys()), (
                f"Group entry missing keys. Got: {set(entry.keys())}, "
                f"expected superset of: {required_keys}"
            )

    def test_group_field_types(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        for entry in data["groups"]:
            assert isinstance(entry["group"],     str),   "'group' must be str"
            assert isinstance(entry["dimension"], str),   "'dimension' must be str"
            assert isinstance(entry["gap"],       float), "'gap' must be float"
            assert isinstance(entry["threshold"], float), "'threshold' must be float"
            assert isinstance(entry["pass"],      bool),  "'pass' must be bool"

    def test_dimensions_present(self, tmp_path, all_pass_predictions):
        """Output must include entries for both 'gender' and 'ethnicity' dimensions."""
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        dimensions = {e["dimension"] for e in data["groups"]}
        assert "gender"    in dimensions, "Output must include dimension 'gender'"
        assert "ethnicity" in dimensions, "Output must include dimension 'ethnicity'"

    def test_expected_group_names_present(self, tmp_path, all_pass_predictions):
        """Output must contain entries for Male, Female, Maori, Pacific, Other."""
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        group_names = {e["group"] for e in data["groups"]}
        for expected in ("Male", "Female", "Maori", "Pacific", "Other"):
            assert expected in group_names, f"Expected group '{expected}' in output"


# ---------------------------------------------------------------------------
# T2 — AC2: Exit code 1 when gap exceeds threshold
# ---------------------------------------------------------------------------

class TestAC2ExitCode1:
    """T2: Script exits with code 1 when any gap exceeds the threshold."""

    def test_exit_code_1_when_gap_exceeds_threshold(
        self, tmp_path, gender_fail_predictions
    ):
        _write_config(0.05)
        input_file = _write_predictions(gender_fail_predictions, tmp_path)
        returncode, _, _ = _run_script(input_file)
        assert returncode == 1, (
            f"Expected exit code 1 when gap exceeds threshold, got {returncode}"
        )

    def test_pass_field_false_for_failing_group(
        self, tmp_path, gender_fail_predictions
    ):
        """The output JSON must mark failing groups with pass=false."""
        _write_config(0.05)
        input_file = _write_predictions(gender_fail_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        failing = [e for e in data["groups"] if not e["pass"]]
        assert len(failing) > 0, "Expected at least one group with pass=false"

    def test_failing_group_dimension_is_gender(
        self, tmp_path, gender_fail_predictions
    ):
        _write_config(0.05)
        input_file = _write_predictions(gender_fail_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        failing_dims = {e["dimension"] for e in data["groups"] if not e["pass"]}
        assert "gender" in failing_dims, "Gender dimension should be marked failing"


# ---------------------------------------------------------------------------
# T3 — C2: Stderr audit log non-empty on every run
# ---------------------------------------------------------------------------

class TestC2StderrAuditLog:
    """T3: stderr must contain gap values and threshold on every run."""

    def test_stderr_nonempty_on_pass(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, _, stderr = _run_script(input_file)
        assert stderr.strip(), "stderr must be non-empty even when all groups pass"

    def test_stderr_nonempty_on_fail(self, tmp_path, gender_fail_predictions):
        _write_config(0.05)
        input_file = _write_predictions(gender_fail_predictions, tmp_path)
        _, _, stderr = _run_script(input_file)
        assert stderr.strip(), "stderr must be non-empty when groups fail"

    def test_stderr_contains_threshold_value(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, _, stderr = _run_script(input_file)
        assert "0.1" in stderr, (
            "stderr must log the threshold value used (0.10 / 0.1)"
        )

    def test_stderr_contains_group_names(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, _, stderr = _run_script(input_file)
        for group in ("Male", "Female", "Maori", "Pacific", "Other"):
            assert group in stderr, f"stderr must log gap for group '{group}'"

    def test_stderr_contains_gap_keyword(self, tmp_path, all_pass_predictions):
        """stderr should reference 'gap' to be human-readable for MRM reviewers."""
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, _, stderr = _run_script(input_file)
        assert "gap" in stderr.lower(), "stderr should contain the word 'gap'"

    def test_stderr_logs_failing_group_on_fail(
        self, tmp_path, gender_fail_predictions
    ):
        """stderr should explicitly mention failing groups (AC2)."""
        _write_config(0.05)
        input_file = _write_predictions(gender_fail_predictions, tmp_path)
        _, _, stderr = _run_script(input_file)
        assert "FAIL" in stderr.upper() or "fail" in stderr.lower(), (
            "stderr should indicate FAIL status for groups that exceed threshold"
        )


# ---------------------------------------------------------------------------
# T4 — AC3: Exit code 0 when all gaps within threshold
# ---------------------------------------------------------------------------

class TestAC3ExitCode0:
    """T4: Script exits with code 0 when all gaps are within threshold."""

    def test_exit_code_0_when_all_pass(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        returncode, _, _ = _run_script(input_file)
        assert returncode == 0, (
            f"Expected exit code 0 when all gaps within threshold, got {returncode}"
        )

    def test_all_pass_fields_true(self, tmp_path, all_pass_predictions):
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        for entry in data["groups"]:
            assert entry["pass"] is True, (
                f"Expected pass=True for group {entry['group']} but got False"
            )


# ---------------------------------------------------------------------------
# T5 — NFR-1: FMA formula max(rate) - min(rate) per dimension
# ---------------------------------------------------------------------------

class TestNFR1FMAFormula:
    """T5: Verify gap = max(group_approval_rate) - min(group_approval_rate)."""

    def test_gender_gap_value(self, tmp_path, known_rate_predictions):
        """
        Male rate = 3/4 = 0.75, Female rate = 1/4 = 0.25
        Expected gender gap = 0.75 - 0.25 = 0.50
        """
        _write_config(0.80)  # High threshold so both dimensions pass
        input_file = _write_predictions(known_rate_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        gender_entries = [e for e in data["groups"] if e["dimension"] == "gender"]
        # All gender entries share the same gap (it's a per-dimension scalar)
        for entry in gender_entries:
            assert abs(entry["gap"] - 0.50) < 1e-9, (
                f"Gender gap expected 0.50, got {entry['gap']}"
            )

    def test_ethnicity_gap_value(self, tmp_path, known_rate_predictions):
        """
        Maori: 2/2=1.0, Pacific: 1/3≈0.3333, Other: 1/3≈0.3333
        Expected ethnicity gap = 1.0 - 0.3333... = 0.6667...
        """
        _write_config(0.80)
        input_file = _write_predictions(known_rate_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        ethnicity_entries = [
            e for e in data["groups"] if e["dimension"] == "ethnicity"
        ]
        expected_gap = 1.0 - (1.0 / 3.0)
        for entry in ethnicity_entries:
            assert abs(entry["gap"] - expected_gap) < 1e-9, (
                f"Ethnicity gap expected {expected_gap:.6f}, got {entry['gap']}"
            )

    def test_gap_is_max_minus_min_not_absolute_difference(
        self, tmp_path, known_rate_predictions
    ):
        """Gap must be non-negative (max - min, not signed difference)."""
        _write_config(0.80)
        input_file = _write_predictions(known_rate_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        for entry in data["groups"]:
            assert entry["gap"] >= 0.0, (
                f"Gap must be non-negative, got {entry['gap']} for {entry['group']}"
            )

    def test_gap_does_not_exceed_one(self, tmp_path, gender_fail_predictions):
        """Approval rates are bounded [0,1] so gap cannot exceed 1.0."""
        _write_config(2.0)  # threshold above 1 so script doesn't exit 1
        input_file = _write_predictions(gender_fail_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        for entry in data["groups"]:
            assert entry["gap"] <= 1.0, (
                f"Gap must not exceed 1.0, got {entry['gap']}"
            )


# ---------------------------------------------------------------------------
# T6 — NFR-2: Deterministic / reproducible output
# ---------------------------------------------------------------------------

class TestNFR2Reproducibility:
    """T6: Two runs on the same input must produce identical stdout."""

    def test_identical_stdout_two_runs(self, tmp_path, known_rate_predictions):
        _write_config(0.80)
        input_file = _write_predictions(known_rate_predictions, tmp_path)
        _, stdout1, _ = _run_script(input_file)
        _, stdout2, _ = _run_script(input_file)
        assert stdout1 == stdout2, (
            "stdout must be byte-for-byte identical across runs on the same input"
        )

    def test_group_ordering_is_stable(self, tmp_path, known_rate_predictions):
        """Group order must not vary between runs."""
        _write_config(0.80)
        input_file = _write_predictions(known_rate_predictions, tmp_path)
        _, stdout1, _ = _run_script(input_file)
        _, stdout2, _ = _run_script(input_file)
        groups1 = [e["group"] for e in json.loads(stdout1)["groups"]]
        groups2 = [e["group"] for e in json.loads(stdout2)["groups"]]
        assert groups1 == groups2, "Group ordering must be stable across runs"

    def test_no_timestamp_in_stdout(self, tmp_path, all_pass_predictions):
        """stdout JSON must contain no timestamp or run-id fields."""
        _write_config(0.10)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        forbidden_keys = {"timestamp", "run_id", "generated_at", "datetime"}
        top_level_keys = set(data.keys())
        overlap = forbidden_keys & top_level_keys
        assert not overlap, f"stdout must not contain non-deterministic keys: {overlap}"


# ---------------------------------------------------------------------------
# T7 — C1: Threshold read from config (regulatory constraint)
# ---------------------------------------------------------------------------

class TestC1ThresholdFromConfig:
    """
    T7 (C1 critical): The pass/fail outcome MUST change when config threshold
    changes. A hardcoded 0.05 constant would pass Run 1 but fail Run 2.

    Cohort: gender gap = 0.06 exactly.
    Run 1: threshold = 0.05 → gap > threshold → exit 1.
    Run 2: threshold = 0.10 → gap ≤ threshold → exit 0.
    """

    def test_exit_1_with_strict_threshold(
        self, tmp_path, threshold_boundary_predictions
    ):
        """threshold=0.05, gap=0.06 → exit 1"""
        _write_config(0.05)
        input_file = _write_predictions(threshold_boundary_predictions, tmp_path)
        returncode, _, _ = _run_script(input_file)
        assert returncode == 1, (
            "Expected exit 1: gap 0.06 exceeds threshold 0.05"
        )

    def test_exit_0_with_relaxed_threshold(
        self, tmp_path, threshold_boundary_predictions
    ):
        """threshold=0.10, gap=0.06 → exit 0"""
        _write_config(0.10)
        input_file = _write_predictions(threshold_boundary_predictions, tmp_path)
        returncode, _, _ = _run_script(input_file)
        assert returncode == 0, (
            "Expected exit 0: gap 0.06 within threshold 0.10. "
            "If this fails with a hardcoded threshold 0.05, C1 is violated."
        )

    def test_threshold_value_reflected_in_output(
        self, tmp_path, threshold_boundary_predictions
    ):
        """The 'threshold' field in output JSON must match config, not a hardcoded value."""
        _write_config(0.10)
        input_file = _write_predictions(threshold_boundary_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        for entry in data["groups"]:
            assert abs(entry["threshold"] - 0.10) < 1e-9, (
                f"threshold field in output should be 0.10 (from config), "
                f"got {entry['threshold']} — possible C1 hardcoding violation"
            )

    def test_threshold_0_05_appears_in_output_when_config_is_0_05(
        self, tmp_path, all_pass_predictions
    ):
        """Sanity: when config says 0.05, output threshold field is 0.05."""
        _write_config(0.05)
        input_file = _write_predictions(all_pass_predictions, tmp_path)
        _, stdout, _ = _run_script(input_file)
        data = json.loads(stdout)
        for entry in data["groups"]:
            assert abs(entry["threshold"] - 0.05) < 1e-9, (
                f"Expected threshold 0.05 in output, got {entry['threshold']}"
            )
```

---

### TASK 2 — Create `config/fairness-config.json` (GREEN prerequisite)

**File:** `config/fairness-config.json`

> W1 compliance note: this file must be reviewed by the compliance team before merge.
> The initial value 0.05 is a placeholder; the MRM team will set the production value.

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

**Rationale:**
- `"fairness_threshold"` key is exactly as required by C1.
- `"dimensions"` and `"groups"` are co-located with the threshold so the script
  never has dimensions or group names hardcoded in logic.
- The threshold value `0.05` is the NZ FMA baseline. AU APRA deployments will
  supply a different config file; no code change is required (C1 satisfied).

---

### TASK 3 — Implement `scripts/evaluate_fairness.py` (GREEN)

**File:** `scripts/evaluate_fairness.py`

Implementation must satisfy all tests written in Task 1. The design mirrors the
existing `evaluate_model.py` helper patterns already in the codebase.

```python
#!/usr/bin/env python3
"""
evaluate_fairness.py — Demographic parity evaluation script.

Regulatory context:
  NFR-1: FMA Algorithmic Fairness Methodology
         gap = max(group_approval_rate) - min(group_approval_rate) per dimension
  C1:    Threshold MUST be read from config/fairness-config.json — no hardcoding.
  C2:    All group gaps and threshold logged to stderr on every run (audit trail).
  NFR-2: Deterministic stdout — same input → identical output.

Usage:
    python scripts/evaluate_fairness.py --input <predictions.json>

Exit codes:
    0 — all group parity gaps within threshold
    1 — at least one group parity gap exceeds threshold
"""

import argparse
import json
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Constants — file paths only; NO numeric threshold constant (C1)
# ---------------------------------------------------------------------------

_CONFIG_PATH = Path("config/fairness-config.json")


# ---------------------------------------------------------------------------
# I/O helpers
# ---------------------------------------------------------------------------

def load_predictions(filepath: str) -> list:
    """
    Load model predictions from a JSON file.

    Expected format:
        { "predictions": [{ "approved": bool, "gender": str, "ethnicity": str }] }
    """
    with open(filepath) as f:
        data = json.load(f)
    return data["predictions"]


def load_fairness_config(config_path: Path = _CONFIG_PATH) -> dict:
    """
    Load fairness evaluation configuration.

    Returns dict with keys:
        "fairness_threshold" : float  — regulatory pass/fail threshold (C1)
        "dimensions"         : list   — e.g. ["gender", "ethnicity"]
        "groups"             : dict   — { dimension: [group_name, ...] }
    """
    with open(config_path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Core computation — NFR-1 FMA formula
# ---------------------------------------------------------------------------

def compute_approval_rates(predictions: list, dimension: str, groups: list) -> dict:
    """
    Compute per-group approval rate for a single dimension.

    Returns:
        { group_name: approval_rate_float, ... }

    Groups with zero predictions default to 0.0 approval rate.
    """
    counts = {g: {"approved": 0, "total": 0} for g in groups}

    for pred in predictions:
        group_value = pred.get(dimension)
        if group_value in counts:
            counts[group_value]["total"] += 1
            if pred.get("approved"):
                counts[group_value]["approved"] += 1

    rates = {}
    for group, c in counts.items():
        rates[group] = c["approved"] / c["total"] if c["total"] > 0 else 0.0

    return rates


def compute_parity_gap(rates: dict) -> float:
    """
    NFR-1 FMA formula: gap = max(group_approval_rate) - min(group_approval_rate).

    This formula is a hard regulatory requirement (FMA Algorithmic Fairness
    Methodology). It must not be substituted with an alternative metric.
    """
    values = list(rates.values())
    return max(values) - min(values)


def evaluate_dimension(
    predictions: list,
    dimension: str,
    groups: list,
    threshold: float,
) -> list:
    """
    Evaluate parity for all groups in one dimension.

    Returns a list of result dicts in deterministic group order (NFR-2):
        [{ "group": str, "dimension": str, "gap": float,
           "threshold": float, "pass": bool }, ...]

    The gap value is the same for every group entry within a dimension
    (it is a dimension-level scalar); each group entry carries it so that
    downstream consumers can filter by group without a join.
    """
    rates = compute_approval_rates(predictions, dimension, groups)
    gap   = compute_parity_gap(rates)

    # Deterministic ordering: use the canonical order from config (NFR-2)
    results = []
    for group in groups:  # groups list order is from config — stable
        results.append({
            "group":     group,
            "dimension": dimension,
            "gap":       gap,
            "threshold": threshold,
            "pass":      gap <= threshold,
        })
    return results


# ---------------------------------------------------------------------------
# Audit logging — C2
# ---------------------------------------------------------------------------

def log_audit(group_results: list, threshold: float) -> None:
    """
    Write all group gap values and the threshold to stderr (C2 — audit trail).

    Called on every run regardless of