# DoR Contract: Define `context.yml` instrumentation config schema

**Story:** spc.1-context-yml-instrumentation-config
**Feature:** 2026-04-18-skill-performance-capture
**Approved:** 2026-04-18

---

## What will be built

An `instrumentation:` YAML block added to `contexts/personal.yml` — commented out by default, with four fields documented inline: `enabled` (boolean, default false), `experiment_id` (string), `model_label` (string), `cost_tier` (string, one of standard | premium). Each field has a type annotation and explanatory comment. A usage comment explains the enable workflow. A comment references `workspace/experiments/[experiment-id]/` as the output directory.

## What will NOT be built

- No validation logic for model_label or cost_tier allowed values
- No modifications to any SKILL.md file
- No reading of the instrumentation block in any skill (owned by spc.3)
- No experiment workspace directories (owned by spc.4)

## AC verification mapping

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read contexts/personal.yml, assert instrumentation: block has all 4 field names | Unit (file inspection) |
| AC2 | Parse YAML from contexts/personal.yml, assert 4 keys accessible | Unit (YAML parse) |
| AC3 | Inspect schema, assert experiment_id declared with detectable absence | Unit (schema inspection) |
| AC4 | Manual session scenario — deferred to spc.3 (RISK-ACCEPT 1-M1) | Manual |
| AC5 | Read file, assert comment text explaining enable workflow is present | Unit (comment text inspection) |

## Assumptions

- `contexts/personal.yml` is the target file (not .github/context.yml directly)
- YAML inline comments are the correct documentation vehicle for this file

## schemaDepends

`schemaDepends: []` — no upstream story dependencies declared; no pipeline-state.json fields affected.

## Estimated touch points

Files: `contexts/personal.yml` (additive YAML block only). Services: none. APIs: none.
