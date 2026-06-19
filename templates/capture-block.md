# Capture Block Template

<!-- Copy this block into any artefact produced during an active instrumentation experiment.
     Fill in all fields. DO NOT include API keys or credentials in any field (MC-SEC-02). -->

## Capture Block

### Metadata

| Field | Value |
|-------|-------|
| experiment_id | |
| model_label | |
| cost_tier | |
| skill_name | |
| artefact_path | |
| run_timestamp | |

> **Security note:** `model_label` is a descriptive string only (e.g. "claude-sonnet-4-6").
> Never include API keys, access tokens, or any credentials in this block (MC-SEC-02).

### Structural metrics

| Metric | Value |
|--------|-------|
| turn_count | |
| constraints_inferred_count | |
| intermediates_prescribed | |
| intermediates_produced | |

**files_referenced:**

- <!-- list each file path read or written during this skill run -->

### Fidelity self-report

<!-- Rate how accurately the skill output matches the story ACs and DoR contract. -->
<!-- DO NOT include credential or API key evidence here (MC-SEC-02). -->

| Dimension | Score (1–5) | Notes |
|-----------|-------------|-------|
| AC coverage | | |
| Scope adherence | | |
| Context utilisation | | |

### Backward references

<!-- List each artefact or decision referenced during this run. Mark whether the reference was accurate. -->

- target: <!-- artefact path or decision ID -->
  accurate: <!-- yes | no -->

### Operator review

| Field | Value |
|-------|-------|
| context_score | |
| linkage_score | |
| notes | |
| reviewed_by | |
