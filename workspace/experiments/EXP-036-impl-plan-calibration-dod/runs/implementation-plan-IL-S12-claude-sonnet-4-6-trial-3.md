Save path: artefacts/2026-07-01-credit-model-refresh/plans/credit.fairness-eval-1-plan.md

```markdown
# Implementation Plan — credit.fairness-eval-1
## Demographic Parity Evaluation Script

**Feature:** 2026-07-01-credit-model-refresh
**Branch:** `feature/credit.fairness-eval-1`
**Oversight level:** Medium (MRM team reviewer required before merge)
**Test command:** `pytest tests/test_evaluate_fairness.py -v`

---

## Pre-flight Checklist

- [ ] Branch `feature/credit.fairness-eval-1` created from main
- [ ] Existing `scripts/evaluate_model.py` confirmed untouched (out of scope)
- [ ] MRM reviewer added to PR before merge (W1 compliance requirement)
- [ ] `config/fairness-config.json` reviewed by compliance before merge (W1)

---

## Constraints Summary (non-negotiable)

| Constraint | Requirement | Violation consequence |
|------------|-------------|----------------------|
| C1 — FMA Regulatory | `fairness_threshold` MUST be read from `config/fairness-config.json`; numeric threshold constants in script are prohibited | Categorical IP5 fail |
| C2 — Audit Trail | All group gap values and threshold MUST be logged to stderr on every run | MRM audit failure |
| NFR-1 — FMA Formula | `gap = max(group_approval_rate) - min(group_approval_rate)` per dimension; formula must not be substituted | Regulatory non-compliance |
| NFR-2 — Reproducibility | Identical stdout for identical input; deterministic group ordering; no randomness or timestamps in stdout | Audit trail integrity failure |

---

## Files to Create

```
scripts/evaluate_fairness.py        ← main script (CREATE)
tests/test_evaluate_fairness.py     ← test suite  (CREATE)
config/fairness-config.json         ← config file  (CREATE)
```

**File NOT touched:** `scripts/evaluate_model.py`

---

## Task Sequence

Tasks must be executed in the order listed. Tests are written and confirmed
RED before any implementation code is written.

---

### TASK 1 — Create `config/fairness-config.json`

This config file must exist before tests can run (tests import/read it).
It contains no logic and is a data artefact, not implementation code.
It must be created first so test fixtures can reference it.

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

> **W1 — Compliance gate:** This file must be reviewed by the compliance team
> before the PR is merged. Do not merge without compliance sign-off.

---

### TASK 2 — Write failing tests (RED phase)

**File:** `tests/test_evaluate_fairness.py`

Write the complete test file. At this point `scripts/evaluate_fairness.py`
does not exist, so every test must fail (import error or assertion error).
Confirm RED by running `pytest tests/test_evaluate_fairness.py -v` and
verifying all tests fail before proceeding to Task 3.

```python
"""
tests/test_evaluate_fairness.py

Test suite for scripts/evaluate_fairness.py
Coverage: AC1, AC2, AC3, NFR-1, NFR-2, C1, C2

TDD protocol: this file is written and confirmed RED before
scripts/evaluate_fairness.py is created.
"""

import json
import os
import subprocess
import sys
import tempfile

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

SCRIPT = os.path.join(os.path.dirname(__file__), "..", "scripts", "evaluate_fairness.py")


def _write_input(predictions: list, tmp_path) -> str:
    """Write a predictions dict to a temp file and return the path."""
    p = tmp_path / "predictions.json"
    p.write_text(json.dumps({"predictions": predictions}))
    return str(p)


def _run(input_path: str, config_path: str | None = None) -> subprocess.CompletedProcess:
    """Run evaluate_fairness.py as a subprocess and return the result."""
    cmd = [sys.executable, SCRIPT, "--input", input_path]
    env = os.environ.copy()
    if config_path is not None:
        # Override config location via env var so C1 tests can swap config
        env["FAIRNESS_CONFIG_PATH"] = config_path
    return subprocess.run(
        cmd,
        capture_output=True,
        text=True,
        env=env,
    )


def _write_config(threshold: float, tmp_path) -> str:
    """Write a fairness config JSON with the given threshold and return path."""
    cfg = {
        "fairness_threshold": threshold,
        "dimensions": ["gender", "ethnicity"],
        "groups": {
            "gender": ["Male", "Female"],
            "ethnicity": ["Maori", "Pacific", "Other"],
        },
    }
    p = tmp_path / "fairness-config.json"
    p.write_text(json.dumps(cfg))
    return str(p)


# ---------------------------------------------------------------------------
# Fixture: a prediction set where:
#   gender:    Male approval = 0.80, Female approval = 0.60  → gap = 0.20
#   ethnicity: Maori = 0.50, Pacific = 0.70, Other = 0.80   → gap = 0.30
# Both gaps exceed 0.05 threshold → exit 1
# ---------------------------------------------------------------------------

FAILING_PREDICTIONS = (
    [{"approved": True,  "gender": "Male",   "ethnicity": "Maori"}]   * 8 +
    [{"approved": False, "gender": "Male",   "ethnicity": "Other"}]   * 2 +
    [{"approved": True,  "gender": "Female", "ethnicity": "Pacific"}] * 6 +
    [{"approved": False, "gender": "Female", "ethnicity": "Maori"}]   * 4
)

# Prediction set where all gaps are 0.00 → exit 0
PASSING_PREDICTIONS = (
    [{"approved": True,  "gender": "Male",   "ethnicity": "Maori"}]   * 5 +
    [{"approved": False, "gender": "Male",   "ethnicity": "Maori"}]   * 5 +
    [{"approved": True,  "gender": "Female", "ethnicity": "Pacific"}] * 5 +
    [{"approved": False, "gender": "Female", "ethnicity": "Pacific"}] * 5 +
    [{"approved": True,  "gender": "Male",   "ethnicity": "Other"}]   * 5 +
    [{"approved": False, "gender": "Female", "ethnicity": "Other"}]   * 5
)


# ---------------------------------------------------------------------------
# T1 — AC1: stdout JSON schema is correct
# ---------------------------------------------------------------------------

class TestAC1OutputSchema:
    """T1: known rates → assert stdout schema matches contract."""

    def test_output_is_valid_json(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        # Must not raise
        parsed = json.loads(result.stdout)
        assert isinstance(parsed, dict)

    def test_output_has_groups_key(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        assert "groups" in parsed

    def test_each_group_entry_has_required_keys(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        required_keys = {"group", "dimension", "gap", "threshold", "pass"}
        for entry in parsed["groups"]:
            assert required_keys == set(entry.keys()), (
                f"Entry missing keys: {required_keys - set(entry.keys())}"
            )

    def test_group_field_is_string(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        for entry in parsed["groups"]:
            assert isinstance(entry["group"], str)

    def test_dimension_field_is_string(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        for entry in parsed["groups"]:
            assert isinstance(entry["dimension"], str)

    def test_gap_field_is_float(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        for entry in parsed["groups"]:
            assert isinstance(entry["gap"], float)

    def test_threshold_field_is_float(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        for entry in parsed["groups"]:
            assert isinstance(entry["threshold"], float)

    def test_pass_field_is_bool(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        for entry in parsed["groups"]:
            assert isinstance(entry["pass"], bool)

    def test_output_contains_both_dimensions(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        dimensions = {e["dimension"] for e in parsed["groups"]}
        assert "gender" in dimensions
        assert "ethnicity" in dimensions

    def test_output_contains_one_entry_per_dimension(self, tmp_path):
        """Each dimension produces exactly one aggregate gap entry."""
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        dimensions = [e["dimension"] for e in parsed["groups"]]
        assert dimensions.count("gender") == 1
        assert dimensions.count("ethnicity") == 1


# ---------------------------------------------------------------------------
# T2 — AC2: exit code 1 when gap exceeds threshold
# ---------------------------------------------------------------------------

class TestAC2ExitCode1:
    """T2: gap > threshold → exit 1."""

    def test_exit_code_1_when_gap_exceeds_threshold(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        assert result.returncode == 1, (
            f"Expected exit 1 but got {result.returncode}.\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}"
        )

    def test_pass_field_false_for_failing_dimension(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        failing = [e for e in parsed["groups"] if not e["pass"]]
        assert len(failing) >= 1, "Expected at least one failing group entry"

    def test_gap_exceeds_threshold_in_output(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        for entry in parsed["groups"]:
            if not entry["pass"]:
                assert entry["gap"] > entry["threshold"]


# ---------------------------------------------------------------------------
# T3 — AC2 + C2: stderr contains audit log on every run (including failure)
# ---------------------------------------------------------------------------

class TestAC2C2StderrAuditLog:
    """T3: stderr non-empty and contains gap values and threshold."""

    def test_stderr_non_empty_on_failing_run(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        assert result.stderr.strip() != "", "stderr must not be empty (C2 audit trail)"

    def test_stderr_contains_threshold_value(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        # The threshold from config/fairness-config.json is 0.05
        assert "0.05" in result.stderr, (
            "stderr must log the threshold value (C2)"
        )

    def test_stderr_contains_dimension_labels(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        assert "gender" in result.stderr
        assert "ethnicity" in result.stderr

    def test_stderr_contains_gap_values(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        # At least one numeric gap value must appear in stderr
        import re
        numbers = re.findall(r"\d+\.\d+", result.stderr)
        assert len(numbers) >= 1, "stderr must contain gap values (C2)"

    def test_stderr_non_empty_on_passing_run(self, tmp_path):
        """C2: audit log required on EVERY run, including passing runs."""
        path = _write_input(PASSING_PREDICTIONS, tmp_path)
        cfg = _write_config(1.0, tmp_path)  # high threshold → all pass
        result = _run(path, config_path=cfg)
        assert result.stderr.strip() != "", (
            "stderr must be non-empty even when all groups pass (C2)"
        )

    def test_stderr_contains_threshold_on_passing_run(self, tmp_path):
        path = _write_input(PASSING_PREDICTIONS, tmp_path)
        cfg = _write_config(1.0, tmp_path)
        result = _run(path, config_path=cfg)
        assert "1.0" in result.stderr or "threshold" in result.stderr.lower()


# ---------------------------------------------------------------------------
# T4 — AC3: exit code 0 when all gaps within threshold
# ---------------------------------------------------------------------------

class TestAC3ExitCode0:
    """T4: all gaps ≤ threshold → exit 0."""

    def test_exit_code_0_when_all_gaps_within_threshold(self, tmp_path):
        path = _write_input(PASSING_PREDICTIONS, tmp_path)
        cfg = _write_config(1.0, tmp_path)  # threshold=1.0; no gap can exceed this
        result = _run(path, config_path=cfg)
        assert result.returncode == 0, (
            f"Expected exit 0 but got {result.returncode}.\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}"
        )

    def test_all_pass_fields_true_when_within_threshold(self, tmp_path):
        path = _write_input(PASSING_PREDICTIONS, tmp_path)
        cfg = _write_config(1.0, tmp_path)
        result = _run(path, config_path=cfg)
        parsed = json.loads(result.stdout)
        for entry in parsed["groups"]:
            assert entry["pass"] is True, f"Expected pass=True for {entry}"

    def test_exit_0_with_zero_gap_predictions(self, tmp_path):
        """Edge case: identical approval rate across all groups → gap = 0.0."""
        predictions = (
            [{"approved": True,  "gender": "Male",   "ethnicity": "Maori"}]   * 5 +
            [{"approved": False, "gender": "Male",   "ethnicity": "Maori"}]   * 5 +
            [{"approved": True,  "gender": "Female", "ethnicity": "Pacific"}] * 5 +
            [{"approved": False, "gender": "Female", "ethnicity": "Pacific"}] * 5 +
            [{"approved": True,  "gender": "Male",   "ethnicity": "Other"}]   * 5 +
            [{"approved": False, "gender": "Male",   "ethnicity": "Other"}]   * 5
        )
        path = _write_input(predictions, tmp_path)
        cfg = _write_config(0.05, tmp_path)
        result = _run(path, config_path=cfg)
        assert result.returncode == 0


# ---------------------------------------------------------------------------
# T5 — NFR-1: FMA formula verification (max − min per dimension)
# ---------------------------------------------------------------------------

class TestNFR1FMAFormula:
    """
    T5: three-group ethnicity case — verify max-min gap is computed correctly.

    Constructed predictions:
        Maori:   4 approved / 4 total  → rate = 1.00
        Pacific: 1 approved / 4 total  → rate = 0.25
        Other:   2 approved / 4 total  → rate = 0.50

    Expected gap = max(1.00, 0.25, 0.50) - min(1.00, 0.25, 0.50)
                 = 1.00 - 0.25 = 0.75
    """

    KNOWN_PREDICTIONS = (
        [{"approved": True,  "gender": "Male", "ethnicity": "Maori"}]   * 4 +
        [{"approved": True,  "gender": "Male", "ethnicity": "Pacific"}] * 1 +
        [{"approved": False, "gender": "Male", "ethnicity": "Pacific"}] * 3 +
        [{"approved": True,  "gender": "Male", "ethnicity": "Other"}]   * 2 +
        [{"approved": False, "gender": "Male", "ethnicity": "Other"}]   * 2
    )
    # gender gap: Male = 9/12 = 0.583..., Female = N/A (no female predictions)
    # We only test ethnicity gap here

    def test_ethnicity_gap_matches_max_minus_min(self, tmp_path):
        path = _write_input(self.KNOWN_PREDICTIONS, tmp_path)
        cfg = _write_config(0.05, tmp_path)
        result = _run(path, config_path=cfg)
        parsed = json.loads(result.stdout)
        eth_entry = next(e for e in parsed["groups"] if e["dimension"] == "ethnicity")
        expected_gap = round(1.00 - 0.25, 10)  # 0.75
        assert abs(eth_entry["gap"] - expected_gap) < 1e-9, (
            f"Expected ethnicity gap {expected_gap}, got {eth_entry['gap']}"
        )

    def test_known_gender_gap(self, tmp_path):
        """
        Explicit gender gap verification.

        Male: 8 approved / 10 → rate 0.80
        Female: 3 approved / 10 → rate 0.30
        gap = 0.80 - 0.30 = 0.50
        """
        predictions = (
            [{"approved": True,  "gender": "Male",   "ethnicity": "Other"}] * 8 +
            [{"approved": False, "gender": "Male",   "ethnicity": "Other"}] * 2 +
            [{"approved": True,  "gender": "Female", "ethnicity": "Other"}] * 3 +
            [{"approved": False, "gender": "Female", "ethnicity": "Other"}] * 7
        )
        path = _write_input(predictions, tmp_path)
        cfg = _write_config(0.05, tmp_path)
        result = _run(path, config_path=cfg)
        parsed = json.loads(result.stdout)
        gender_entry = next(e for e in parsed["groups"] if e["dimension"] == "gender")
        expected_gap = round(0.80 - 0.30, 10)  # 0.50
        assert abs(gender_entry["gap"] - expected_gap) < 1e-9, (
            f"Expected gender gap {expected_gap}, got {gender_entry['gap']}"
        )

    def test_gap_formula_not_average_deviation(self, tmp_path):
        """
        Ensure the formula is max-min, not mean-deviation or any other metric.
        With rates [0.9, 0.5, 0.1]: max-min = 0.8; mean-deviation would differ.
        """
        predictions = (
            [{"approved": True,  "gender": "Male", "ethnicity": "Maori"}]   * 9 +
            [{"approved": False, "gender": "Male", "ethnicity": "Maori"}]   * 1 +
            [{"approved": True,  "gender": "Male", "ethnicity": "Pacific"}] * 5 +
            [{"approved": False, "gender": "Male", "ethnicity": "Pacific"}] * 5 +
            [{"approved": True,  "gender": "Male", "ethnicity": "Other"}]   * 1 +
            [{"approved": False, "gender": "Male", "ethnicity": "Other"}]   * 9
        )
        path = _write_input(predictions, tmp_path)
        cfg = _write_config(0.05, tmp_path)
        result = _run(path, config_path=cfg)
        parsed = json.loads(result.stdout)
        eth_entry = next(e for e in parsed["groups"] if e["dimension"] == "ethnicity")
        expected_gap = round(0.9 - 0.1, 10)  # 0.8
        assert abs(eth_entry["gap"] - expected_gap) < 1e-9


# ---------------------------------------------------------------------------
# T6 — NFR-2: Deterministic output (identical stdout across two runs)
# ---------------------------------------------------------------------------

class TestNFR2Determinism:
    """T6: two runs same input → identical stdout."""

    def test_two_runs_produce_identical_stdout(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result1 = _run(path)
        result2 = _run(path)
        assert result1.stdout == result2.stdout, (
            "stdout must be identical across runs for the same input (NFR-2)"
        )

    def test_group_ordering_is_stable(self, tmp_path):
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result1 = _run(path)
        result2 = _run(path)
        parsed1 = json.loads(result1.stdout)
        parsed2 = json.loads(result2.stdout)
        dims1 = [e["dimension"] for e in parsed1["groups"]]
        dims2 = [e["dimension"] for e in parsed2["groups"]]
        assert dims1 == dims2, "Group ordering must be deterministic"

    def test_no_timestamp_in_stdout(self, tmp_path):
        """stdout must not contain timestamp-like fields (would break reproducibility)."""
        path = _write_input(FAILING_PREDICTIONS, tmp_path)
        result = _run(path)
        parsed = json.loads(result.stdout)
        # Serialise to string and check for timestamp patterns
        output_str = json.dumps(parsed)
        import re
        timestamp_pattern = re.compile(
            r"\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}"  # ISO datetime
        )
        assert not timestamp_pattern.search(output_str), (
            "stdout must not contain timestamps (NFR-2)"
        )


# ---------------------------------------------------------------------------
# T7 — C1: Threshold is read from config (not hardcoded)
# ---------------------------------------------------------------------------

class TestC1ThresholdFromConfig:
    """
    T7 (C1 critical): Change config threshold → exit code changes.

    Cohort gap = 0.06 (just above 0.05).
    Run 1: config threshold = 0.05 → exit 1
    Run 2: config threshold = 0.10 → exit 0

    A script with hardcoded 0.05 would fail Run 2.
    """

    # Predictions engineered for gap ≈ 0.06
    # Male: 28/40 = 0.70, Female: 32/40 = 0.80  → gender gap = 0.10 (above 0.05)
    # We use a simpler construction: Male 0.56, Female 0.50 → gap = 0.06
    COHORT_PREDICTIONS = (
        [{"approved": True,  "gender": "Male",   "ethnicity": "Other"}] * 56 +
        [{"approved": False, "gender": "Male",   "ethnicity": "Other"}] * 44 +
        [{"approved": True,  "gender": "Female", "ethnicity": "Other"}] * 50 +
        [{"approved": False, "gender": "Female", "ethnicity": "Other"}] * 50
    )
    # gender gap = 0.56 - 0.50 = 0.06

    def test_exit_1_with_threshold_below_gap(self, tmp_path):
        path = _write_input(self.COHORT_PREDICTIONS, tmp_path)
        cfg = _write_config(0.05, tmp_path)   # threshold 0.05 < gap 0.06
        result = _run(path, config_path=cfg)
        assert result.returncode == 1, (
            f"Expected exit 1 (gap 0.06 > threshold 0.05) but got {result.returncode}"
        )

    def test_exit_0_with_threshold_above_gap(self, tmp_path):
        path = _write_input(self.COHORT_PREDICTIONS, tmp_path)
        cfg = _write_config(0.10, tmp_path)   # threshold 0.10 > gap 0.06
        result = _run(path, config_path=cfg)
        assert result.returncode == 0, (
            f"Expected exit 0 (gap 0.06 < threshold 0.10) but got {result.returncode}.\n"
            f"stdout: {result.stdout}\nstderr: {result.stderr}\n"
            "If this fails with exit 1, the threshold is likely hardcoded (C1 violation)."
        )

    def test_threshold_in_stdout_matches_config(self, tmp_path):
        """The threshold field in stdout must reflect the config value, not a constant."""
        path = _write_input(self.COHORT_PREDICTIONS, tmp_path)
        cfg = _write_config(0.42, tmp_path)   # unusual value; hardcoded 0.05 would differ
        result = _run(path, config_path=cfg)
        parsed = json.loads(result.stdout)
        for entry in parsed["groups"]:
            assert abs(entry["threshold"] - 0.42) < 1e-9, (
                f"threshold in stdout was {entry['threshold']}, expected 0.42. "
                "Threshold must be read from config (C1)."
            )

    def test_exit_code_boundary_exactly_at_threshold(self, tmp_path):
        """gap == threshold: contract says pass (gap must EXCEED threshold to fail)."""
        # Male 0.55, Female 0.50 → gap = 0.05 exactly
        predictions = (
            [{"approved": True,  "gender": "Male",   "ethnicity": "Other"}] * 55 +
            [{"approved": False, "gender": "Male",   "ethnicity": "Other"}] * 45 +
            [{"approved": True,  "gender": "Female", "ethnicity": "Other"}] * 50 +
            [{"approved": False, "gender": "Female", "ethnicity": "Other"}] * 50
        )
        path = _write_input(predictions, tmp_path)
        cfg = _write_config(0.05, tmp_path)   # gap == threshold → should pass
        result = _run(path, config_path=cfg)
        assert result.returncode == 0, (
            f"gap == threshold should be a pass (exit 0), got {result.returncode}"
        )
```

> **RED confirmation step:** Run `pytest tests/test_evaluate_fairness.py -v`
> before proceeding. All tests must fail (import/ModuleNotFoundError or
> similar). Do not proceed to Task 3 until RED is confirmed.

---

### TASK 3 — Implement `scripts/evaluate_fairness.py` (GREEN phase)

Write the implementation only after RED is confirmed.

**File:** `scripts/evaluate_fairness.py`

```python
"""
scripts/evaluate_fairness.py

Demographic parity evaluation script.
Feature: 2026-07-01-credit-model-refresh
Story:   credit.fairness-eval-1

Regulatory constraints:
  C1 — Threshold MUST be read from config/fairness-config.json.
       Hardcoding any numeric threshold is prohibited (FMA regulatory).
  C2 — All group gap values and threshold MUST be logged to stderr
       on every run (MRM audit trail requirement).
  NFR-1 — gap = max(group_approval_rate) - min(group_approval_rate)
           per dimension. Formula must not be substituted.
  NFR-2 — Deterministic stdout for identical input.
"""

import argparse
import json
import os
import sys


# ---------------------------------------------------------------------------
# Config loading
# ---------------------------------------------------------------------------

def load_fairness_config() -> dict:
    """
    Load fairness config from FAIRNESS_CONFIG_PATH env var (for testing)
    or the default location config/fairness-config.json.

    C1: The threshold is read here. It must NEVER be hardcoded in this script.
    """
    config_path = os.environ.get(
        "FAIRNESS_CONFIG_PATH",
        os.path.join(os.path.dirname(__file__), "..", "config", "fairness-config.json"),
    )
    with open(config_path) as f:
        return json.load(f)


# ---------------------------------------------------------------------------
# Prediction loading
# ---------------------------------------------------------------------------

def load_predictions(filepath: str) -> list:
    """Load predictions list from JSON file at filepath."""
    with open(filepath) as f:
        data = json.load(f)
    return data["predictions"]


# ---------------------------------------------------------------------------
# Fairness computation (NFR-1)
# ---------------------------------------------------------------------------

def compute_approval_rates(predictions: list, dimension: str, groups: list) -> dict:
    """
    Compute approval rate per group for a given dimension.

    Returns: { group_name: float } — groups with zero predictions are excluded.
    """
    counts: dict = {g: {"approved": 0, "total": 0} for g in groups}
    for pred in predictions:
        group = pred.get(dimension)
        if group in counts:
            counts[group]["total"] += 1
            if pred.get("approved"):
                counts[group]["approved"] += 1

    rates = {}
    for group, c in counts.items():
        if c["total"] > 0:
            rates[group] = c["approved"] / c["total"]
    return rates


def compute_gap(rates: dict) -> float:
    """
    NFR-1 (FMA formula): gap = max(group_approval_rate) - min(group_approval_rate).
    Formula must not be substituted.
    """
    if len(rates) < 2:
        return 0.0
    values = list(rates.values())
    return max(values) - min(values)


def evaluate_dimensions(predictions: list, config: dict, threshold: float) -> list:
    """
    Evaluate each dimension in config["dimensions"].

    Returns list of result dicts in deterministic order (order of config["dimensions"]).