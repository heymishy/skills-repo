# workspace/experiments/

This directory holds performance capture data from active instrumentation experiments.
Each experiment is a structured comparison of model outputs across skill runs.

## Directory structure

```
workspace/experiments/
  [experiment-id]/          ← named after instrumentation.experiment_id in context.yml
    manifest.md             ← experiment-level metadata and comparison notes
    [model-label]-[date]/   ← one subdirectory per model run
      artefacts/            ← copies of artefacts produced during this run
```

### Naming conventions

- `[experiment-id]` must match exactly the value set in `instrumentation.experiment_id` in `.github/context.yml` (or `contexts/personal.yml` before copying). Example: `2026-04-18-model-comparison`.
- Per-run subdirectory names use the format `[model-label]-[YYYY-MM-DD]`, e.g. `claude-sonnet-4-6-2026-04-18`.
- The `artefacts/` subfolder within each run directory holds the output files produced during that run.

### Three-way consistency rule

The `experiment_id` value must be consistent across three locations:
1. The directory name under `workspace/experiments/`
2. `instrumentation.experiment_id` in `.github/context.yml`
3. The `experiment_id` field in any `## Capture Block` recorded during the experiment

If these three values diverge, experiment data cannot be correlated automatically.

## manifest.md template

Copy this template into each `[experiment-id]/manifest.md` before starting runs.

```markdown
# Experiment manifest

<!-- DO NOT include API keys, access tokens, or any credentials in this file (MC-SEC-02). -->

experiment_id: ""           # must match directory name and instrumentation.experiment_id
scenario_description: ""    # what this experiment is testing/comparing
comparison_notes: ""        # high-level observations after all runs are complete

runs:
  - model_label: ""         # descriptive string only — no API keys (MC-SEC-02)
    run_date: ""            # ISO 8601 date, e.g. 2026-04-18
    artefact_paths:         # list of files produced in this run's artefacts/ subfolder
      - ""
    cost_tier: ""           # standard | premium
```

## Security

The `model_label` field is a descriptive string only (e.g. `"claude-sonnet-4-6"`). Never include API keys, access tokens, or any form of credentials in any file under this directory (MC-SEC-02).
