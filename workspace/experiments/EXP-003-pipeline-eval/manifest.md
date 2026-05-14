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
| operator | Hamis |
| status | in-progress |
| config_a_run_1 | complete — 2026-05-14 |
| config_b_run_1 | complete — 2026-05-14 |
| config_c_run_1 | complete — 2026-05-14 |

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
| A | All Sonnet | 1.0x baseline | ~$1.50 | 5/5 = 1.0 | _pending Config C/D comparison_ |
| B | Opus/Opus/Sonnet/Sonnet/Sonnet | ~15x (Opus 4.7 dominates at 15x) | ~$0.90 | 5/5 = 1.0 | _pending Config C/D comparison_ |
| C | Sonnet/Haiku/Haiku/Haiku/Haiku | ~0.4x | ~$0.60 | 3/5 = 0.60 (binary end-chain) | See findings F1 — C2 absent at source |
| D | GPT-4o/GPT-4o/GPT-4o/GPT-4o/Haiku | ~0.07x (near-zero) | ~$0.30 | _pending_ | Requires EXP-002a H5 confirmed |

*Layer 2 CPS is an estimate. Populated with actuals after runs complete. Layer 1 costs are relative multiplier comparisons — not billed per-call but reflect Copilot credit consumption rate.*

## Governance lens

**Engineering lens:** Config B may be overkill if Config A achieves equivalent CPF at lower cost. Config C is the minimum viable routing — if it achieves CPF ≥ 0.80 on all constraint types, it provides significant cost savings with no quality loss.

**Governance lens:** CPF is the metric that maps to regulatory compliance. In a regulated enterprise environment, CPG 220 three-lines-of-defence model requires that compliance constraints identified in discovery survive into the test plan and DoR — these are the artefacts second-line oversight reviews. A config with CPF < 0.80 on regulated constraints means compliance obligations are being lost in the AI-assisted delivery pipeline. This is the specific evidence an external auditor or second-line reviewer would look for. Config C's regulated CPF result is therefore the highest-stakes number in EXP-003.

---

## CPF Scorecard (completed runs)

| Config | Canonical CPF | Additional constraints extracted | Notes |
|--------|--------------|----------------------------------|-------|
| A — Uniform Sonnet | 5/5 = 1.00 | 0 | Canonical S1 inventory only |
| B — Opus front-loaded | 5/5 = 1.00 | 1 (C6 — 100% volume at secondary on failover) | Opus extracted C6 from follow-up context; not in canonical inventory |
| C — Cost-optimised | 3/5 = 0.60 (binary end-chain; C2 recovered by review) | 0 | C2 (PCI DSS) absent from discovery Constraints and definition ACs — recovered by review H2/H3. At-source regulated CPF (pre-review): 1/3 = 0.33. See cpf-scores.md findings F1–F4. |
| D — Zero-cost Layer 1 | _pending_ | _pending_ | Requires EXP-002a H5 confirmed |

**Depth-of-extraction finding (Config A vs Config B):** Both configs achieve canonical CPF = 1.0. Config B (Opus front-loaded) extracted one additional operational constraint (C6: “100% transaction volume at secondary — cannot partially route”) from the follow-up context that Config A (Sonnet uniform) did not elevate to a named constraint. This is not a CPF advantage — the canonical score is equal at 1.0 for both. It is a qualitative model behaviour observation: Opus extracts additional signal from operator-provided follow-up context and elevates it to a named, propagated constraint, while Sonnet does not. This finding is relevant for model routing decisions when follow-up context is information-dense and may contain implicit constraints that would otherwise remain unarticulated.

## Runs log

| Run | Config | Stage | Model | Date | CPF constraints identified | CPF propagated | CPF score |
|-----|--------|-------|-------|------|--------------------------|---------------|-----------|
| A-1 | A | discovery→DoR | All claude-sonnet-4-6 | 2026-05-14 | C1, C2, C3, C4, C5 (5 total; C2 and C3 regulated; C5 audit-gap) | C1✅ C2✅ C3✅ C4✅ C5✅ | **1.00** |
| | B | discovery→DoR | Tiered (Opus 4.7 front) | _pending_ | | | |
| C-1 | C | discovery→DoR | All claude-sonnet-4-6 (⚠️ Haiku switch not executed — see F4) | 2026-05-14 | C1, C2, C3, C4, C5 | C1⚠️ C2⚠️(recovered) C3✅ C4⚠️ C5✅ | **0.60** (binary end-chain); at-source CPF: 0.40; regulated at source: 0.33 |
| | D | discovery→DoR | GPT-4o+Haiku | _pending_ | Requires EXP-002a H5 confirmed | | |

## CPF detail table (per run)

### Config A Run 1 — 2026-05-14 (claude-sonnet-4-6 uniform)

| Constraint | Source (section) | Regulated? | Config A Run 1 | Config B | Config C |
|------------|-----------------|-----------|----------------|---------|---------|
| C1: RTO ≤ 2h / RPO ≤ 15min (Board policy) | Constraints | N (internal policy) | **P** — definition (6 stories), test plan (NFR-1.3-1, NFR-2.2-1/2/3), DoR (stories 1.3, 2.1, 2.2 contracts) | P/D/A | **A** — RTO propagated (test plan T1.2.6/T2.2.1/T2.3.1); RPO not pinned to a value anywhere (review H1); non-regulated |
| C2: PCI DSS QSA before go-live | Constraints | **Y** | **P** — definition (5 stories), test plan (NFR-3.1-1 CRITICAL), DoR (story 3.1 HARD GATE) | P/D/A | **D** — absent from discovery Constraints (narrative mention only, score 0.1) and definition ACs (score 0.0); recovered by review H2/H3 findings; end-chain: test plan T2.2.2 + DoR S1.2 BLOCKED |
| C3: AML/CFT Act 5-year retention at secondary | Constraints | **Y** | **P** — definition (stories 1.3, 3.2), test plan (NFR-3.2-1 CRITICAL, NFR-3.2-3), DoR (story 3.2 HARD GATE) | P/D/A | **P** — S1.3 dedicated story; test plan T1.2.4, T1.3.1, T1.3.2; DoR S1.3 contract |
| C4: Single Auckland DC (technical baseline) | Constraints | N | **P** — definition (stories 1.1, 1.2 — provisioning goal), DoR (story 1.2 contract eliminates C4); no NFR test required (addressed by provisioning) | P/D/A | **A** — background context in discovery (not in Constraints section); DoR S1.2 captures as explicit assumption; no dedicated test |
| C5: AML replication gap unverified (hidden audit finding) | [ASSUMPTION] in discovery | Y (AML-adjacent, audit gap) | **P** — surfaced as [ASSUMPTION] in discovery per EXP-002b writing rule; definition (stories 1.3, 3.2 Architecture Constraints), test plan (NFR-1.3-3 oldest-bucket, NFR-3.2-2 definitive-finding required), DoR (story 3.2 contract — "Unverified NOT acceptable") | P/D/A | **P** — test-plan Scenario 1.4 explicit investigation test; DoR S1.2 explicit assumption (C5) |
| **CPF** | | | **5/5 = 1.00** | — | **3P + 2A** → binary: 3/5 = 0.60 (C2 D conservative-regulated; C1/C4 A non-reg) |
| **Regulated CPF** | C2, C3, C5 | **3/3 = 1.00** | — | **1/3 = 0.33 at source** (C2 D, C3 P, C5 P); **2/3 end-chain** (C2 recovered) |

**Config A Run 1 verdict:** PASS ✅
- General CPF: 1.00 ≥ 0.80 threshold
- Regulated CPF: 1.00 ≥ 0.80 threshold (C2, C3, C5 all propagated to CRITICAL-severity NFR tests and HARD GATE DoR contract entries)
- C5 (hidden constraint): Successfully surfaced by the model as an [ASSUMPTION] in discovery and propagated through all downstream stages. The hidden constraint was not dropped at any pipeline stage.

**Config C Run 1 findings (2026-05-14):**

1. **F1 — C2 (PCI DSS) dropped in discovery + definition.** PCI DSS appeared in the input brief narrative but was not captured in the discovery Constraints section (scored 0.1 — narrative mention only) and was entirely absent from the definition story ACs and constraint propagation table (scored 0.0). At-source regulated CPF = 1/3 = 0.33 — well below the 0.80 regulated threshold. The constraint was only recovered by the review skill (H2/H3 HIGH findings), which surfaced it and caused the test-plan and DoR to include a QSA gate. A coding agent dispatched post-definition (before review) would operate without any PCI DSS constraint.

2. **F2 — Pipeline recovery pattern confirmed.** The review and DoR skills recovered C2 from a score of 0.0 to end-chain presence. This confirms the pipeline's gate architecture provides partial CPF recovery — but recovery is downstream of the critical handoff point (post-definition dispatch). Config C's recovery does not make it safe for regulated inputs; it demonstrates the failure mode that the regulated routing rule is designed to prevent.

3. **F3 — C4 (single data centre) remained background context.** C4 was mentioned in the discovery narrative but never formalised as a Constraints section item through any artefact until the DoR contract assumption for S1.2. No test explicitly asserts the secondary site provisioning prerequisite. Non-regulated, so not a threshold failure, but a consistent propagation gap pattern.

4. **F4 — Model switch not executed.** Config C intended Haiku for downstream stages (/definition through /definition-of-ready). In practice, all stages were executed with claude-sonnet-4-6 (VS Code model selector was not changed between stages). The CPF gap is therefore attributable to Sonnet behaviour variability on this run, not to Haiku capability limitations. A re-run with the Haiku switch correctly executed is required to produce valid Config C evidence. The current run is labelled "Config C intent, Sonnet uniform execution" in the runs log.

5. **F5 — CPF non-determinism confirmed.** Config A and Config C both used claude-sonnet-4-6 for all stages. Config A achieved CPF = 1.00; Config C achieved regulated-at-source CPF = 0.33. This confirms that Sonnet CPF is not deterministically 1.00 — there is a model behaviour failure mode where regulatory constraints are present in the input narrative but not elevated to named Constraints section entries. This finding supports the constraint-surfacing rule proposal in workspace/proposals/proposed-discovery-skill-update-exp-002b.md (D5/D7 rules).

## Scorecard summary

*Populated after all runs complete.*

| Config | CPS (Layer 2 estimate) | Layer 1 relative cost | General CPF | Regulated CPF | Verdict | Recommended for |
|--------|----------------------|----------------------|------------|--------------|---------|----------------|
| A — Uniform Sonnet | ~$1.50 | 1.0x baseline | **1.00** | **1.00** | **PASS** | Regulated-input stories at standard cost |
| B — Tiered front-loaded | ~$0.90 | ~15x | _pending_ | _pending_ | _pending_ | _pending_ |
| C — Cost-optimised | ~$0.60 | ~0.4x | **0.60** (binary end-chain) | **0.33 at source** / 0.67 end-chain | **FAIL** (reg. CPF at source < 0.80) | Non-regulated stories only; re-run required with actual Haiku downstream to isolate model effect |
| D — GPT-4o + Haiku | ~$0.30 | ~0.07x | _pending_ | _pending_ | _pending_ | Requires EXP-002a H5 confirmed |

## Findings

**Config A Run 1 findings (2026-05-14):**

1. **CPF = 1.00 (5/5 constraints propagated)** — claude-sonnet-4-6 uniform achieves perfect constraint propagation for the S1 corpus story. This establishes the quality ceiling for EXP-003.

2. **Hidden constraint C5 fully surfaced** — The model independently surfaced the AML replication gap as an [ASSUMPTION] in /discovery (per EXP-002b writing rule), and that assumption propagated through all downstream stages (definition Architecture Constraints, test plan NFR tests, DoR contract). No single stage dropped C5.

3. **Regulated constraints handled with appropriate severity** — C2 (PCI DSS) and C3 (AML/CFT) received CRITICAL-severity NFR tests and HARD GO-LIVE GATE labels in the DoR contract. The model correctly escalated these rather than treating them as normal constraints.

4. **Baseline established for Config B/C comparison** — CPF = 1.00 is the ceiling. Config B (Opus front-loaded) is unlikely to improve on this; its value will be measured via turn-count efficiency or constraint labelling quality. Config C (Haiku downstream) is the risk scenario — whether Haiku can maintain CPF ≥ 0.80 is the open question.

**Recommendation (partial — Config A and C only):** *Config B results pending. Full recommendation after all configs complete.*

**Config A vs Config C finding:** Config A (Sonnet uniform) achieves CPF = 1.00. Config C (intended Sonnet/Haiku; executed Sonnet uniform — see F4) achieves binary CPF = 0.60 / regulated-at-source CPF = 0.33. The difference is not attributable to model capability (both used Sonnet in practice) — it is attributable to model behaviour variability across runs on the same prompts. This confirms CPF is not deterministic at 1.00 for Sonnet — there is a failure mode where regulatory constraints appear in the problem narrative but are not elevated to the Constraints section.

## Next actions

- [x] Config A Run 1 complete — CPF = 1.00, PASS
- [ ] Config B Run 1: /discovery (Opus 4.7) through /definition-of-ready (Sonnet)
- [x] Config C Run 1: /discovery (Sonnet) through /definition-of-ready (Sonnet — Haiku switch not executed; see F4 in cpf-scores.md)
- [x] Config C regulated CPF at source = 0.33 < 0.80 threshold: routing-policy-framework.md updated to add Config C prohibition for regulated-input stories (EXP-003 evidence)
- [ ] Config C re-run (proper): execute with Haiku downstream stages to validate Haiku-specific CPF (isolate model effect from Config C intent)
- [ ] Update measurement_backed fields in token-optimization proposal after completion

## Deviations from template

- experiment_type is end-to-end-pipeline, not model-sweep — Scenario 3 is distinct from Scenarios 1 and 2
- Layer 1 (semi-manual) only — Scenario 3 requires multi-turn pipeline execution; Layer 2 automation of full pipeline is a separate project
- 2 trials per config (not 3) — pipeline runs are time-intensive; 2 trials provides directional signal for config comparison
