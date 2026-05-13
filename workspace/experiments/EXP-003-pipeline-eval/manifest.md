# EXP-003-pipeline-eval

## Purpose

End-to-end pipeline evaluation across three model orchestration configurations. Measures constraint propagation fidelity (CPF) — whether constraints captured in the discovery artefact survive intact through definition, review, test plan, and DoR. Tests three configs at different cost/quality trade-off points. Uses a synthetic story specifically designed for unambiguous CPF measurement.

This is a Scenario 3 experiment. Scenario 3 measures constraint propagation across the full pipeline — it answers a different question than EXP-001 (model capability) or EXP-002a/b (context loading). Results from EXP-002a and EXP-002b are prerequisites — they establish which models pass Scenario 1/2 and therefore belong in the EXP-003 config matrix.

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-003-pipeline-eval |
| experiment_type | end-to-end-pipeline |
| created | 2026-05-12 |
| operator | [operator name] |
| status | planned |

## Data classification check

| Field | Value |
|-------|-------|
| context_files_used | architecture-guardrails.md, product/constraints.md, product/mission.md, product/tech-stack.md |
| contains_internal_system_names | false (current context files — re-evaluate if updated with enterprise content before running) |
| contains_customer_data | false |
| approved_for_external_api | true (current content) — re-evaluate before each run |
| if_not_approved | Run with local-* model only. Do not use cloud API. See local-model-scaffolding/provider-spec.md |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 1 (semi-manual via VS Code — Scenario 3 requires operator-driven multi-turn execution) |
| trigger | EXP-002a and EXP-002b complete |
| scenario | Scenario 3 — End-to-end pipeline eval |
| skills_swept | /discovery, /definition, /review, /test-plan, /definition-of-ready |
| story_corpus | S1 (synthetic, financial services domain — see corpus/S1-pipeline-eval-story.md) |
| trials_per_config | 2 (Layer 1 — semi-manual; cost and time per run are significant) |
| judge_model | claude-sonnet-4-6 (locked) |
| pass_threshold_cpf | 0.80 (general constraints); 0.80 (regulated constraints — tightened from general 0.60 floor) |

## Orchestration configurations

### Config A — Uniform Sonnet (baseline)

| Stage | Model |
|-------|-------|
| /discovery | claude-sonnet-4-6 |
| /definition | claude-sonnet-4-6 |
| /review | claude-sonnet-4-6 |
| /test-plan | claude-sonnet-4-6 |
| /definition-of-ready | claude-sonnet-4-6 |

**Rationale:** Clean baseline. All stages at the same capability level — any CPF gaps are attributable to pipeline structure, not model transitions.

### Config B — Tiered front-loaded (quality-optimised)

| Stage | Model | Rationale |
|-------|-------|-----------|
| /discovery | claude-opus-4-7 | Highest constraint capture fidelity (EXP-001 evidence) |
| /definition | claude-opus-4-7 | Story decomposition propagates discovery constraints — needs highest fidelity |
| /review | claude-sonnet-4-6 | Review is structured + checklist-driven — Sonnet sufficient |
| /test-plan | claude-sonnet-4-6 | Test plan follows ACs mechanically — Sonnet sufficient |
| /definition-of-ready | claude-sonnet-4-6 | Gate application is structured — Sonnet sufficient |

**Rationale:** Front-load quality at the stages where constraints are discovered and decomposed. Downstream stages apply structure — less reasoning depth required.

### Config C — Cost-optimised

| Stage | Model | Rationale |
|-------|-------|-----------|
| /discovery | claude-sonnet-4-6 | Lowest cost that passes EXP-001 thresholds |
| /definition | claude-haiku-4-5 | Structural decomposition — test whether Haiku maintains constraint propagation |
| /review | claude-haiku-4-5 | Checklist application — Haiku candidate |
| /test-plan | claude-haiku-4-5 | AC-to-test mapping — structured task |
| /definition-of-ready | claude-haiku-4-5 | Gate check — pass/fail criteria well-defined |

**Rationale:** Minimum cost config. Config C is the worst-case CPF risk scenario — four Haiku stages handling constraint propagation. CPF results here set the lower bound.

**Note:** Config C should NOT be used for regulated-constraint stories unless EXP-003 CPF evidence demonstrates Haiku maintains CPF ≥ 0.80 on regulated constraints. This experiment produces that evidence.

### Config D — Zero-cost Layer 1 (GPT-4o + Haiku)

| Stage | Model | Layer 1 multiplier | Rationale |
|-------|-------|-------------------|-----------|
| /discovery | GPT-4o | 0x | Free on Layer 1; quality to be confirmed by EXP-002a H5 |
| /definition | GPT-4o | 0x | Free on Layer 1 |
| /review | GPT-4o | 0x | Free on Layer 1; structured/checklist-driven |
| /test-plan | GPT-4o | 0x | Free on Layer 1; AC-to-test mapping |
| /definition-of-ready | claude-haiku-4-5 | 0.33x | Gate check — lowest cost Anthropic model; Haiku sufficient for structured pass/fail criteria |

**Rationale:** Minimum Layer 1 cost config. GPT-4o at 0x multiplier + Haiku at 0.33x = near-zero Copilot credit spend. Layer 2 API costs still apply if running via `run-model-sweep.js`.

**Prerequisite:** Config D requires EXP-002a H5 confirmed (GPT-4o ≥ 0.70 on T1 and T3) before running. Do not run Config D unless H5 is confirmed.

**Note:** Config D Layer 2 CPS is estimated based on GPT-4o rates. Verify current pricing before running.

## Corpus: S1 synthetic story

**Story file:** `corpus/S1-pipeline-eval-story.md`

The corpus story is the controlled input for `/discovery` in each config run. It is not a produced artefact — it is the input brief that gets sent to `/discovery`. Designed to have:
- ≥ 2 regulatory constraints (clear and named, so CPF is unambiguous)
- ≥ 2 technical constraints (specific to the enterprise stack context)
- 3–5 ACs (bounded, not complex)
- 1 hidden constraint element (tests whether T5-pattern surfacing propagates)

## Constraint propagation fidelity (CPF) metric — definition

### What counts as a "constraint" in the discovery artefact

1. Any item in the **Constraints** section of the discovery artefact
2. Any item in the **Assumptions** section flagged as a hard dependency (i.e. the assumption is framed as: "if this assumption is wrong, the feature cannot proceed" or equivalent)

Items in the MVP scope or Out-of-Scope sections do not count as constraints for CPF purposes.

### What counts as "propagated"

A constraint is considered propagated if it appears (by name or by clear unambiguous reference) in EITHER of:
- The DoR contract's scope section (the "will be built" or "scope boundary" section)
- The test plan's NFR (non-functional requirements) section or acceptance test section

Either suffices — the constraint does not need to appear in both.

**Ambiguous propagation:** If a constraint is paraphrased with no loss of meaning, count as propagated. If a constraint is paraphrased with material detail omitted (e.g. "data must be stored securely" instead of "data must be stored within [jurisdiction] per [regulation]"), count as dropped.

### What counts as "dropped"

A constraint is dropped if it is absent from both the DoR contract scope section AND the test plan NFR/acceptance section.

### CPF formula

```
CPF = propagated_count / total_constraints_in_discovery
```

Where `total_constraints_in_discovery` = count of Constraints section items + count of hard-dependency Assumptions.

### Thresholds

| Threshold | Value | Applies to |
|-----------|-------|-----------|
| Warning | CPF < 0.80 | All constraints |
| Failure | CPF < 0.60 | General (non-regulated) constraints |
| Failure — regulated | CPF < 0.80 | Any constraint referencing prudential banking regulation, payment card industry standards, anti-money-laundering requirements, or data residency obligations |

**The regulated failure threshold (0.80) is the same as the general warning threshold.** For regulated constraints, there is no "warning" — any CPF below 0.80 is a failure. A configuration with CPF < 0.80 on regulated constraints must not be recommended for production use on regulated-input stories regardless of cost savings.

### CPF measurement procedure

For each config run:
1. Identify all constraints in the discovery artefact produced (Constraints section + hard-dependency Assumptions)
2. Number them C1, C2, ... Cn for this run
3. For each constraint, check the DoR contract scope section and test plan NFR/AC section
4. Record: propagated (P), dropped (D), or ambiguous (A — resolve conservatively as dropped for regulated constraints)
5. Calculate CPF = P / (P + D)
6. Record in the CPF table in the runs log

## Cost per story (CPS) methodology

### Layer 1 (VS Code Copilot — semi-manual)

Cost = $0 per run (subscription cost, not per-call billing).

Record for each stage:
- Turn count (operator inputs to complete the stage)
- Approximate wall-clock time per stage (minutes)
- Approximate token estimate per stage (from capture block data if enabled)

Use this to project Layer 2 cost.

### Layer 2 (programmatic, if automated)

```
CPS = sum over all stages of (
  (input_tokens × input_price_per_M / 1_000_000) +
  (output_tokens × output_price_per_M / 1_000_000)
)
```

Use current published pricing at time of run. Record pricing snapshot in run metadata.

### CPS comparison

| Config | Stage models | Layer 1 relative cost | Projected Layer 2 CPS | CPF | Recommended? |
|--------|-------------|----------------------|----------------------|-----|--------------|
| A | All Sonnet | 1.0x baseline | ~$1.50 | _pending_ | _pending_ |
| B | Opus/Opus/Sonnet/Sonnet/Sonnet | ~15x (Opus 4.7 dominates at 15x) | ~$0.90 | _pending_ | _pending_ |
| C | Sonnet/Haiku/Haiku/Haiku/Haiku | ~0.4x | ~$0.60 | _pending_ | _pending_ |
| D | GPT-4o/GPT-4o/GPT-4o/GPT-4o/Haiku | ~0.07x (near-zero) | ~$0.30 | _pending_ | Requires EXP-002a H5 confirmed |

*Layer 2 CPS is an estimate. Populated with actuals after runs complete. Layer 1 costs are relative multiplier comparisons — not billed per-call but reflect Copilot credit consumption rate.*

## Governance lens

**Engineering lens:** Config B may be overkill if Config A achieves equivalent CPF at lower cost. Config C is the minimum viable routing — if it achieves CPF ≥ 0.80 on all constraint types, it provides significant cost savings with no quality loss.

**Governance lens:** CPF is the metric that maps to regulatory compliance. In a regulated enterprise environment, CPG 220 three-lines-of-defence model requires that compliance constraints identified in discovery survive into the test plan and DoR — these are the artefacts second-line oversight reviews. A config with CPF < 0.80 on regulated constraints means compliance obligations are being lost in the AI-assisted delivery pipeline. This is the specific evidence an external auditor or second-line reviewer would look for. Config C's regulated CPF result is therefore the highest-stakes number in EXP-003.

## Runs log

| Run | Config | Stage | Model | Date | CPF constraints identified | CPF propagated | CPF score |
|-----|--------|-------|-------|------|--------------------------|---------------|-----------|
| | A | discovery→DoR | All Sonnet | _pending_ | | | |
| | B | discovery→DoR | Tiered (Opus 4.7 front) | _pending_ | | | |
| | C | discovery→DoR | Cost-opt | _pending_ | | | |
| | D | discovery→DoR | GPT-4o+Haiku | _pending_ | Requires EXP-002a H5 confirmed | | |

## CPF detail table (per run)

*Template — populate for each run.*

| Constraint | Source (section) | Regulated? | Config A | Config B | Config C |
|------------|-----------------|-----------|---------|---------|---------|
| C1: [name] | Constraints | [Y/N] | P/D/A | P/D/A | P/D/A |
| C2: [name] | Constraints | [Y/N] | P/D/A | P/D/A | P/D/A |
| C3: [name] | Assumptions (hard dep) | [Y/N] | P/D/A | P/D/A | P/D/A |
| **CPF** | | **Regulated CPF** | — | — | — |

## Scorecard summary

*Populated after all runs complete.*

| Config | CPS (Layer 2 estimate) | Layer 1 relative cost | General CPF | Regulated CPF | Recommended for |
|--------|----------------------|----------------------|------------|--------------|----------------|
| A — Uniform Sonnet | _pending_ | 1.0x baseline | _pending_ | _pending_ | _pending_ |
| B — Tiered front-loaded | _pending_ | ~15x | _pending_ | _pending_ | _pending_ |
| C — Cost-optimised | _pending_ | ~0.4x | _pending_ | _pending_ | _pending_ |
| D — GPT-4o + Haiku | _pending_ | ~0.07x | _pending_ | _pending_ | Requires EXP-002a H5 confirmed |

## Findings

*Populated after analysis.*

**Recommendation:** *pending*

## Next actions

- [ ] EXP-002a and EXP-002b must complete first
- [ ] Verify data_classification_check before running (re-evaluate if context files updated)
- [ ] Run Config A first — establishes baseline CPF
- [ ] Run Config B — establishes quality ceiling for tiered routing
- [ ] Run Config C — establishes cost floor; scrutinise regulated CPF
- [ ] If Config C regulated CPF < 0.80: update routing-policy-framework.md to prohibit Config C for regulated-input stories
- [ ] Update measurement_backed fields in token-optimization proposal after completion

## Deviations from template

- experiment_type is end-to-end-pipeline, not model-sweep — Scenario 3 is distinct from Scenarios 1 and 2
- Layer 1 (semi-manual) only — Scenario 3 requires multi-turn pipeline execution; Layer 2 automation of full pipeline is a separate project
- 2 trials per config (not 3) — pipeline runs are time-intensive; 2 trials provides directional signal for config comparison
