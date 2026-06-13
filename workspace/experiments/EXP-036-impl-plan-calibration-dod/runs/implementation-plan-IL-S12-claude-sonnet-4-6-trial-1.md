Save path: artefacts/2026-07-01-credit-model-refresh/plans/credit.fairness-eval-1-plan.md

```markdown
# Implementation Plan — credit.fairness-eval-1
# Demographic Parity Evaluation Script

**Feature:** 2026-07-01-credit-model-refresh
**Story:** credit.fairness-eval-1
**Branch:** `feature/credit.fairness-eval-1`
**Oversight:** Medium (MRM team reviewer required for NFR-1 formula verification)
**Test command:** `pytest tests/test_evaluate_fairness.py -v`

---

## Overview

Implement `scripts/evaluate_fairness.py` — a standalone CLI script that reads model
predictions, computes demographic parity gaps per dimension using the FMA-mandated
max-min formula, and exits with code 0 (all pass) or 1 (any gap exceeds threshold).
Threshold is read exclusively from `config/fairness-config.json` (C1 regulatory
constraint). All gap values and threshold are logged to stderr on every run (C2
audit trail).

---

## Files to Create

| File | Purpose |
|------|---------|
| `tests/test_evaluate_fairness.py` | All tests — written first (RED phase) |
| `config/fairness-config.json` | Threshold config — required by C1; compliance review before merge |
| `scripts/evaluate_fairness.py` | Implementation — written after tests exist |

> **W1 reminder:** `config/fairness-config.json` must be reviewed by compliance
> before merge. Do not merge without that sign-off.

---

## TDD Task Sequence

---

### TASK 1 — RED: Write all failing tests

**File:** `tests/test_evaluate_fairness.py`

Write the complete test file. All tests must fail (ImportError or assertion failure)
because neither `scripts/evaluate_fairness.py` nor `config/fairness-config.json`
exist yet.

```python
"""
tests/test_evaluate_fairness.py

Test suite for scripts/evaluate_fairness.py
Covers: AC1, AC2, AC3, NFR-1, NFR-2, C1, C2
"""
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SCRIPT = Path(__file__).parent.parent / "scripts" / "evaluate_fairness.py"
CONFIG_PATH = Path(__file__).parent.parent / "config" / "fairness-config.json"


def _write_config(threshold: float, path: Path = CONFIG_PATH) -> None:
    """Overwrite fairness-config.json with the given threshold."""
    path.parent.mkdir(parents=True, exist_ok=True)
    config = {
        "fairness_threshold": threshold,
        "dimensions": ["gender", "ethnicity"],
        "groups": {
            "gender": ["Male", "Female"],
            "ethnicity": ["Maori", "Pacific", "Other"],
        },
    }
    path.write_text(json.dumps(config, indent=2))


def _write_predictions(predictions: list, tmp_dir: str) -> str:
    """Write a predictions JSON file; return its path."""
    fpath = os.path.join(tmp_dir, "predictions.json")
    with open(fpath, "w") as f:
        json.dump({"predictions": predictions}, f)
    return fpath


def _run_script(input_path: str) -> subprocess.CompletedProcess:
    """Run evaluate_fairness.py and capture stdout, stderr, returncode."""
    return subprocess.run(
        [sys.executable, str(SCRIPT), "--input", input_path],
        capture_output=True,
        text=True,
    )


# ---------------------------------------------------------------------------
# Shared fixtures / prediction sets
# ---------------------------------------------------------------------------

# Predictions where gender gap = 0.0, ethnicity gap = 0.0  (all pass)
ALL_PASS_PREDICTIONS = [
    {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
    {"approved": True,  "gender": "Female", "ethnicity": "Pacific"},
    {"approved": True,  "gender": "Male",   "ethnicity": "Other"},
    {"approved": True,  "gender": "Female", "ethnicity": "Maori"},
]

# Predictions with a known gap:
#   gender:    Male approval = 2/2 = 1.0, Female approval = 0/2 = 0.0  → gap = 1.0
#   ethnicity: Maori = 1/1 = 1.0, Pacific = 1/1 = 1.0, Other = 0/1 = 0.0 → gap = 1.0
HIGH_GAP_PREDICTIONS = [
    {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
    {"approved": True,  "gender": "Male",   "ethnicity": "Pacific"},
    {"approved": False, "gender": "Female", "ethnicity": "Other"},
    {"approved": False, "gender": "Female", "ethnicity": "Maori"},
]

# Predictions designed for T5 (NFR-1 exact formula verification):
#   gender:    Male  = 3/4 = 0.75, Female = 1/4 = 0.25  → gap = 0.50
#   ethnicity: Maori = 2/4 = 0.50, Pacific = 1/2 = 0.50, Other = 1/2 = 0.50 → gap = 0.00
NFR1_PREDICTIONS = [
    {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
    {"approved": True,  "gender": "Male",   "ethnicity": "Maori"},
    {"approved": True,  "gender": "Male",   "ethnicity": "Pacific"},
    {"approved": False, "gender": "Male",   "ethnicity": "Other"},
    {"approved": True,  "gender": "Female", "ethnicity": "Maori"},
    {"approved": False, "gender": "Female", "ethnicity": "Maori"},
    {"approved": False, "gender": "Female", "ethnicity": "Pacific"},
    {"approved": False, "gender": "Female", "ethnicity": "Other"},
]
# gender:  Male  approved 3/4 = 0.75, Female approved 1/4 = 0.25 → gap = 0.50
# ethnicity: Maori 2/4 = 0.50, Pacific 1/2 = 0.50, Other 1/2 = 0.50 → gap = 0.00


# ---------------------------------------------------------------------------
# T1 — AC1: stdout JSON schema
# ---------------------------------------------------------------------------

class TestT1_OutputSchema:
    """T1: Known rates → assert stdout conforms to schema."""

    def test_stdout_is_valid_json(self, tmp_path):
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        # Must not raise
        data = json.loads(result.stdout)
        assert "groups" in data

    def test_stdout_groups_have_required_fields(self, tmp_path):
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        for entry in data["groups"]:
            assert "group"     in entry, "Missing 'group' key"
            assert "dimension" in entry, "Missing 'dimension' key"
            assert "gap"       in entry, "Missing 'gap' key"
            assert "threshold" in entry, "Missing 'threshold' key"
            assert "pass"      in entry, "Missing 'pass' key"

    def test_stdout_field_types(self, tmp_path):
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        for entry in data["groups"]:
            assert isinstance(entry["group"],     str),  "group must be str"
            assert isinstance(entry["dimension"], str),  "dimension must be str"
            assert isinstance(entry["gap"],       float),"gap must be float"
            assert isinstance(entry["threshold"], float),"threshold must be float"
            assert isinstance(entry["pass"],      bool), "pass must be bool"

    def test_stdout_dimensions_present(self, tmp_path):
        """Both 'gender' and 'ethnicity' dimensions must appear in output."""
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        dimensions_seen = {e["dimension"] for e in data["groups"]}
        assert "gender"    in dimensions_seen
        assert "ethnicity" in dimensions_seen

    def test_stdout_group_names_present(self, tmp_path):
        """All configured group names must appear in output."""
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        # One entry per group per dimension — groups within a dimension share gap
        group_names = {e["group"] for e in data["groups"]}
        assert "Male"    in group_names
        assert "Female"  in group_names
        assert "Maori"   in group_names
        assert "Pacific" in group_names
        assert "Other"   in group_names


# ---------------------------------------------------------------------------
# T2 — AC2: exit code 1 when gap exceeds threshold
# ---------------------------------------------------------------------------

class TestT2_ExitCode1OnFailure:
    """T2: gap > threshold → exit 1."""

    def test_exit_code_1_when_gap_exceeds_threshold(self, tmp_path):
        _write_config(0.05)  # threshold 0.05; HIGH_GAP gap = 1.0
        input_path = _write_predictions(HIGH_GAP_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        assert result.returncode == 1, (
            f"Expected exit code 1 but got {result.returncode}. "
            f"stderr: {result.stderr}"
        )

    def test_pass_field_false_for_failing_group(self, tmp_path):
        _write_config(0.05)
        input_path = _write_predictions(HIGH_GAP_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        failing = [e for e in data["groups"] if not e["pass"]]
        assert len(failing) > 0, "Expected at least one group with pass=False"


# ---------------------------------------------------------------------------
# T3 — AC2 + C2: stderr contains gap/threshold audit log on every run
# ---------------------------------------------------------------------------

class TestT3_StderrAuditLog:
    """T3: stderr must be non-empty on every run; must log gaps and threshold."""

    def test_stderr_non_empty_on_failure_run(self, tmp_path):
        _write_config(0.05)
        input_path = _write_predictions(HIGH_GAP_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        assert result.stderr.strip() != "", "stderr must not be empty (C2 audit trail)"

    def test_stderr_non_empty_on_pass_run(self, tmp_path):
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        assert result.stderr.strip() != "", (
            "stderr must be non-empty even on passing run (C2 audit trail)"
        )

    def test_stderr_contains_threshold_value(self, tmp_path):
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        assert "0.1" in result.stderr or "0.10" in result.stderr, (
            "stderr must log the threshold value used"
        )

    def test_stderr_mentions_gap(self, tmp_path):
        _write_config(0.05)
        input_path = _write_predictions(HIGH_GAP_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        # stderr must mention each dimension
        assert "gender"    in result.stderr.lower()
        assert "ethnicity" in result.stderr.lower()

    def test_stderr_contains_failing_group_name_on_failure(self, tmp_path):
        _write_config(0.05)
        input_path = _write_predictions(HIGH_GAP_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        # The failing gap is for gender and ethnicity dimensions
        stderr_lower = result.stderr.lower()
        assert "fail" in stderr_lower or "exceed" in stderr_lower or ">" in result.stderr, (
            "stderr must indicate failing groups"
        )


# ---------------------------------------------------------------------------
# T4 — AC3: exit code 0 when all gaps within threshold
# ---------------------------------------------------------------------------

class TestT4_ExitCode0OnPass:
    """T4: all gaps ≤ threshold → exit 0."""

    def test_exit_code_0_when_all_gaps_within_threshold(self, tmp_path):
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        assert result.returncode == 0, (
            f"Expected exit code 0 but got {result.returncode}. "
            f"stderr: {result.stderr}"
        )

    def test_all_pass_fields_true_when_within_threshold(self, tmp_path):
        _write_config(0.10)
        input_path = _write_predictions(ALL_PASS_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        failing = [e for e in data["groups"] if not e["pass"]]
        assert failing == [], f"Expected no failing groups but got: {failing}"

    def test_exit_code_0_when_gap_exactly_equals_threshold(self, tmp_path):
        """Boundary: gap == threshold should pass (not exceed)."""
        # gender: Male 1/1 = 1.0, Female 1/1 = 1.0 → gap = 0.0
        # ethnicity: all same → gap = 0.0
        # Use NFR1_PREDICTIONS with threshold exactly 0.50 for gender gap
        _write_config(0.50)
        input_path = _write_predictions(NFR1_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        # gender gap = 0.50, threshold = 0.50 → pass (not strictly greater)
        assert result.returncode == 0, (
            f"Gap == threshold should exit 0 (not strictly exceeded). "
            f"returncode={result.returncode}, stderr={result.stderr}"
        )


# ---------------------------------------------------------------------------
# T5 — NFR-1: FMA formula max(rate) - min(rate) verified exactly
# ---------------------------------------------------------------------------

class TestT5_NFR1_FMAFormula:
    """T5: Three-group ethnicity dimension → verify max-min gap exactly."""

    def test_gender_gap_equals_max_minus_min(self, tmp_path):
        """
        NFR1_PREDICTIONS:
          Male:   3 approved / 4 total = 0.75
          Female: 1 approved / 4 total = 0.25
          gap = 0.75 - 0.25 = 0.50
        """
        _write_config(0.60)  # above 0.50 so script passes and we can inspect output
        input_path = _write_predictions(NFR1_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        gender_entries = [e for e in data["groups"] if e["dimension"] == "gender"]
        assert len(gender_entries) > 0, "No gender entries in output"
        # All gender entries share the same gap value (gap is per dimension)
        for entry in gender_entries:
            assert abs(entry["gap"] - 0.50) < 1e-9, (
                f"Gender gap should be 0.50 (max-min formula) but got {entry['gap']}"
            )

    def test_ethnicity_gap_equals_max_minus_min(self, tmp_path):
        """
        NFR1_PREDICTIONS ethnicity:
          Maori:   2 approved / 4 total = 0.50
          Pacific: 1 approved / 2 total = 0.50
          Other:   1 approved / 2 total = 0.50
          gap = 0.50 - 0.50 = 0.00
        """
        _write_config(0.60)
        input_path = _write_predictions(NFR1_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        eth_entries = [e for e in data["groups"] if e["dimension"] == "ethnicity"]
        assert len(eth_entries) > 0, "No ethnicity entries in output"
        for entry in eth_entries:
            assert abs(entry["gap"] - 0.00) < 1e-9, (
                f"Ethnicity gap should be 0.00 but got {entry['gap']}"
            )

    def test_gap_is_not_average_deviation(self, tmp_path):
        """
        Regression guard: ensure formula is max-min, not mean-deviation or similar.
        With NFR1_PREDICTIONS gender: max=0.75, min=0.25 → correct gap=0.50.
        Average approval = 0.50; mean-abs-deviation = 0.25 → would give wrong answer.
        """
        _write_config(0.60)
        input_path = _write_predictions(NFR1_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        gender_entries = [e for e in data["groups"] if e["dimension"] == "gender"]
        for entry in gender_entries:
            # If formula were mean-abs-deviation it would be ~0.25, not 0.50
            assert entry["gap"] > 0.49, (
                f"Gap {entry['gap']} looks like mean-deviation; expected max-min=0.50"
            )


# ---------------------------------------------------------------------------
# T6 — NFR-2: Deterministic / reproducible stdout
# ---------------------------------------------------------------------------

class TestT6_NFR2_DeterministicOutput:
    """T6: Two runs with same input → identical stdout JSON."""

    def test_two_runs_produce_identical_stdout(self, tmp_path):
        _write_config(0.10)
        input_path = _write_predictions(NFR1_PREDICTIONS, str(tmp_path))
        result_a = _run_script(input_path)
        result_b = _run_script(input_path)
        assert result_a.stdout == result_b.stdout, (
            "stdout must be identical across runs (NFR-2 reproducibility)"
        )

    def test_group_ordering_is_stable(self, tmp_path):
        """Group order must be deterministic — not dict-iteration-order dependent."""
        _write_config(0.10)
        input_path = _write_predictions(NFR1_PREDICTIONS, str(tmp_path))
        results = [_run_script(input_path) for _ in range(3)]
        outputs = [r.stdout for r in results]
        assert len(set(outputs)) == 1, (
            "Group ordering differs between runs — output is non-deterministic"
        )

    def test_stdout_contains_no_timestamps(self, tmp_path):
        """stdout JSON must not contain timestamp or run-id fields."""
        _write_config(0.10)
        input_path = _write_predictions(NFR1_PREDICTIONS, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        top_level_keys = set(data.keys())
        forbidden = {"timestamp", "run_id", "generated_at", "run_timestamp"}
        assert top_level_keys.isdisjoint(forbidden), (
            f"stdout contains non-deterministic fields: {top_level_keys & forbidden}"
        )


# ---------------------------------------------------------------------------
# T7 — C1: Threshold read from config (not hardcoded)
# ---------------------------------------------------------------------------

class TestT7_C1_ThresholdFromConfig:
    """
    T7 (C1 critical test): cohort gap = 0.06.
    Run 1: config threshold = 0.05 → exit 1 (gap exceeds threshold).
    Run 2: config threshold = 0.10 → exit 0 (gap within threshold).
    A hardcoded 0.05 constant would make Run 2 still exit 1, failing this test.
    """

    # Predictions where gender gap = 0.06 exactly
    # Male:   53/100 = 0.53, Female: 47/100 = 0.47 → gap = 0.06
    @staticmethod
    def _build_cohort_predictions():
        preds = []
        # 53 Male approved
        for _ in range(53):
            preds.append({"approved": True,  "gender": "Male", "ethnicity": "Other"})
        # 47 Male rejected
        for _ in range(47):
            preds.append({"approved": False, "gender": "Male", "ethnicity": "Other"})
        # 47 Female approved
        for _ in range(47):
            preds.append({"approved": True,  "gender": "Female", "ethnicity": "Other"})
        # 53 Female rejected
        for _ in range(53):
            preds.append({"approved": False, "gender": "Female", "ethnicity": "Other"})
        return preds

    def test_run1_threshold_005_exits_1(self, tmp_path):
        """gap=0.06, threshold=0.05 → exit 1."""
        _write_config(0.05)
        preds = self._build_cohort_predictions()
        input_path = _write_predictions(preds, str(tmp_path))
        result = _run_script(input_path)
        assert result.returncode == 1, (
            f"gap=0.06 > threshold=0.05 should exit 1, got {result.returncode}"
        )

    def test_run2_threshold_010_exits_0(self, tmp_path):
        """gap=0.06, threshold=0.10 → exit 0. Hardcoded 0.05 would fail this."""
        _write_config(0.10)
        preds = self._build_cohort_predictions()
        input_path = _write_predictions(preds, str(tmp_path))
        result = _run_script(input_path)
        assert result.returncode == 0, (
            f"gap=0.06 <= threshold=0.10 should exit 0, got {result.returncode}. "
            f"If 1: threshold may be hardcoded (C1 violation). stderr={result.stderr}"
        )

    def test_threshold_value_in_stdout_matches_config(self, tmp_path):
        """threshold field in each group output must equal the value in config."""
        config_threshold = 0.07
        _write_config(config_threshold)
        preds = self._build_cohort_predictions()
        input_path = _write_predictions(preds, str(tmp_path))
        result = _run_script(input_path)
        data = json.loads(result.stdout)
        for entry in data["groups"]:
            assert abs(entry["threshold"] - config_threshold) < 1e-9, (
                f"threshold in output {entry['threshold']} != config {config_threshold}"
            )
```

**Verification (RED phase):**
Run `pytest tests/test_evaluate_fairness.py -v` — all tests must fail with
`FileNotFoundError` or `ModuleNotFoundError` because neither
`scripts/evaluate_fairness.py` nor `config/fairness-config.json` exist yet.

---

### TASK 2 — Create `config/fairness-config.json`

> **W1:** This file must be reviewed by compliance before merge.

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

Notes:
- `0.05` is the NZ FMA baseline; AU APRA deployments will override this value.
- The script reads this value at runtime — changing the value here changes behaviour
  without any code modification (C1 satisfied).
- Do **not** change the key name `"fairness_threshold"` — the script depends on it.

---

### TASK 3 — GREEN: Implement `scripts/evaluate_fairness.py`

> Tests must already exist and be failing before this task is started.

```python
"""
scripts/evaluate_fairness.py

Demographic parity evaluation script.

Regulatory constraints:
  C1 — Threshold MUST be read from config/fairness-config.json; never hardcoded.
  C2 — Log all group gap values and threshold to stderr on every run.
  NFR-1 — Gap formula: max(group_approval_rate) - min(group_approval_rate) per dim.
  NFR-2 — stdout output is deterministic; no randomness or timestamps in stdout.
"""
import argparse
import json
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Constants — paths only; no threshold value here (C1)
# ---------------------------------------------------------------------------

CONFIG_PATH = Path(__file__).parent.parent / "config" / "fairness-config.json"


# ---------------------------------------------------------------------------
# I/O helpers
# ---------------------------------------------------------------------------

def load_predictions(filepath: str) -> list:
    """
    Load model predictions from JSON file.

    Expected format:
        { "predictions": [{ "approved": bool, "gender": str, "ethnicity": str }] }
    """
    with open(filepath) as f:
        data = json.load(f)
    return data["predictions"]


def load_fairness_config() -> dict:
    """
    Load fairness configuration from config/fairness-config.json.

    C1: All threshold values come from here. Never read from anywhere else.
    Returns dict with at minimum:
        "fairness_threshold": float
        "dimensions": list[str]
        "groups": dict[str, list[str]]
    """
    with open(CONFIG_PATH) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Core computation — NFR-1
# ---------------------------------------------------------------------------

def compute_approval_rate(predictions: list, dimension: str, group: str) -> float:
    """
    Compute the approval rate for a single group within a dimension.

    Args:
        predictions: full list of prediction dicts
        dimension:   e.g. "gender"
        group:       e.g. "Male"

    Returns:
        float — approved / total for this group; 0.0 if no members (safe default)
    """
    members = [p for p in predictions if p.get(dimension) == group]
    if not members:
        return 0.0
    approved = sum(1 for p in members if p.get("approved") is True)
    return approved / len(members)


def compute_dimension_gap(predictions: list, dimension: str, groups: list) -> float:
    """
    Compute the demographic parity gap for one dimension.

    NFR-1 formula (FMA-mandated, must not be substituted):
        gap = max(group_approval_rate) - min(group_approval_rate)

    Args:
        predictions: full list of prediction dicts
        dimension:   e.g. "ethnicity"
        groups:      ordered list of group names, e.g. ["Maori", "Pacific", "Other"]

    Returns:
        float — gap value in [0.0, 1.0]
    """
    rates = [compute_approval_rate(predictions, dimension, g) for g in groups]
    return max(rates) - min(rates)  # NFR-1: max-min; do not alter this formula


# ---------------------------------------------------------------------------
# Result builder — NFR-2 (deterministic ordering)
# ---------------------------------------------------------------------------

def build_results(
    predictions: list,
    dimensions: list,
    groups_by_dim: dict,
    threshold: float,
) -> list:
    """
    Build the list of per-group result dicts.

    Ordering guarantee (NFR-2):
      - Dimensions are iterated in the order they appear in config["dimensions"].
      - Groups within each dimension are iterated in the order they appear in
        config["groups"][dimension].
      - No sorting by runtime values (gaps, rates) — ordering is config-driven only.

    Each entry:
        {
            "group":     str,   — group name
            "dimension": str,   — dimension name
            "gap":       float, — max-min approval rate for this dimension
            "threshold": float, — from config (C1)
            "pass":      bool   — gap <= threshold (not strictly less; boundary passes)
        }
    """
    results = []
    for dim in dimensions:           # stable order from config list
        groups = groups_by_dim[dim]  # stable order from config list
        gap = compute_dimension_gap(predictions, dim, groups)
        for group in groups:
            results.append({
                "group":     group,
                "dimension": dim,
                "gap":       float(gap),      # explicit float for JSON serialisation
                "threshold": float(threshold), # C1: value from config, not hardcoded
                "pass":      bool(gap <= threshold),
            })
    return results


# ---------------------------------------------------------------------------
# Stderr audit logging — C2
# ---------------------------------------------------------------------------

def log_audit(results: list, threshold: float) -> None:
    """
    Log all group gap values and the threshold to stderr.

    C2: This MUST run on every execution regardless of pass/fail outcome.
    Output goes to stderr only — stdout carries only the machine-readable JSON.
    """
    print(
        f"[fairness-audit] threshold={threshold}",
        file=sys.stderr,
    )
    seen_dims = set()
    for entry in results:
        dim = entry["dimension"]
        if dim not in seen_dims:
            seen_dims.add(dim)
            status = "PASS" if entry["pass"] else "FAIL"
            print(
                f"[fairness-audit] dimension={dim} "
                f"gap={entry['gap']:.6f} "
                f"threshold={threshold} "
                f"status={status}",
                file=sys.stderr,
            )
    # Log each individual group for full audit trail
    for entry in results:
        pass_str = "PASS" if entry["pass"] else "FAIL"
        print(
            f"[fairness-audit]   group={entry['group']} "
            f"dimension={entry['dimension']} "
            f"gap={entry['gap']:.6f} "
            f"status={pass_str}",
            file=sys.stderr,
        )


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

def main() -> int:
    """
    Entry point. Returns exit code.
      0 — all groups pass (gap <= threshold for every dimension)
      1 — one or more groups fail (gap > threshold for at least one dimension)
    """
    parser = argparse.ArgumentParser(
        description