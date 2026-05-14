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
| config_b_run_2 | complete — 2026-05-14 |
| config_c_run_1 | complete — 2026-05-14 |
| config_c_run_2 | complete — 2026-05-14 |

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
| B — Opus front-loaded | 5/5 = 1.00 | Run 1: 1 (C6 — 100% volume at secondary on failover); Run 2: 0 | Run 2 (genuine full-pipeline run): canonical 5/5 = 1.00, no additional non-canonical constraints. Run 1 (partial — disc+def only): C6 extracted by Opus from follow-up context; not in canonical inventory |
| C — Cost-optimised | 3/5 = 0.60 (binary end-chain; C2 recovered by review) | 0 | C2 (PCI DSS) absent from discovery Constraints and definition ACs — recovered by review H2/H3. At-source regulated CPF (pre-review): 1/3 = 0.33. See cpf-scores.md findings F1–F4. |
| D — Zero-cost Layer 1 | _pending_ | _pending_ | Requires EXP-002a H5 confirmed |

**Depth-of-extraction finding (Config A vs Config B):** Both configs achieve canonical CPF = 1.0. Config B run 1 (Opus front-loaded, partial: discovery+definition only) extracted one additional operational constraint (C6: "100% transaction volume at secondary — cannot partially route") from the follow-up context that Config A (Sonnet uniform) did not elevate to a named constraint. Config B run 2 (full pipeline genuine run) detected two non-canonical constraints (NC1: NZ data residency; NC2: High oversight level) — both well-propagated but outside the canonical inventory. Neither additional extraction counts toward canonical CPF — the canonical score is equal at 1.0 across Config A, Config B run 1, and Config B run 2. The qualitative observation stands: Opus extracts additional signal and elevates it to named, propagated constraints, while Sonnet uniform does not. Relevant for model routing decisions when follow-up context is information-dense and may contain implicit constraints.

## Runs log

| Run | Config | Stage | Model | Date | CPF constraints identified | CPF propagated | CPF score |
|-----|--------|-------|-------|------|--------------------------|---------------|-----------|
| A-1 | A | discovery→DoR | All claude-sonnet-4-6 | 2026-05-14 | C1, C2, C3, C4, C5 (5 total; C2 and C3 regulated; C5 audit-gap) | C1✅ C2✅ C3✅ C4✅ C5✅ | **1.00** |
| B-1 | B | discovery+definition (partial) | Opus 4.7 (discovery+def only) | 2026-05-14 | C1, C2, C3, C4, C5 + C6(NC) | C1✅ C2✅ C3✅ C4✅ C5✅ | **1.00** (partial — see B-2) |
| B-2 | B | discovery→DoR (full pipeline) | Opus 4.7 (disc+def) + Sonnet (review+tp+dor) | 2026-05-14 | C1, C2, C3, C4, C5 | C1✅ C2✅ C3✅ C4✅ C5✅ | **1.00** |
| C-1 | C | discovery→DoR | All claude-sonnet-4-6 (⚠️ Haiku switch not executed — see F4) | 2026-05-14 | C1, C2, C3, C4, C5 | C1⚠️ C2⚠️(recovered) C3✅ C4⚠️ C5✅ | **0.60** (binary end-chain); at-source CPF: 0.40; regulated at source: 0.33 |
| C-2 | C | discovery→DoR | claude-sonnet-4-6 (disc+def) + claude-haiku-4-5 (review+tp+dor) | 2026-05-14 | C1, C2, C3, C4, C5 | C1⚠️ C2❌(chain 0.35) C3✅ C4⚠️ C5⚠️ | **Chain 0.68 FAIL**; final-stage 0.76; regulated chain 0.675 FAIL; C3 chain 1.00 |
| | D | discovery→DoR | GPT-4o+Haiku | _pending_ | Requires EXP-002a H5 confirmed | | |

## CPF detail table (per run)

### Config A Run 1 — 2026-05-14 (claude-sonnet-4-6 uniform)

| Constraint | Source (section) | Regulated? | Config A Run 1 | Config B | Config C |
|------------|-----------------|-----------|----------------|---------|---------|
| C1: RTO ≤ 2h / RPO ≤ 15min (Board policy) | Constraints | N (internal policy) | **P** — definition (6 stories), test plan (NFR-1.3-1, NFR-2.2-1/2/3), DoR (stories 1.3, 2.1, 2.2 contracts) | **P** — definition Epic 1 all 7 stories reference C1 NFRs; test plan NFR-RTO + NFR-RPO; DoR Coding Agent Instructions C1 directive | **A** — RTO propagated (test plan T1.2.6/T2.2.1/T2.3.1); RPO not pinned to a value anywhere (review H1); non-regulated |
| C2: PCI DSS QSA before go-live | Constraints | **Y** | **P** — definition (5 stories), test plan (NFR-3.1-1 CRITICAL), DoR (story 3.1 HARD GATE) | **P** — definition Epic 2 S5+S7 QSA gates; test plan NFR-PCI (CI lint); DoR S5/S7 HARD GATE + H-NFR2 warning | **D** — absent from discovery Constraints (narrative mention only, score 0.1) and definition ACs (score 0.0); recovered by review H2/H3 findings; end-chain: test plan T2.2.2 + DoR S1.2 BLOCKED |
| C3: AML/CFT Act 5-year retention at secondary | Constraints | **Y** | **P** — definition (stories 1.3, 3.2), test plan (NFR-3.2-1 CRITICAL, NFR-3.2-3), DoR (story 3.2 HARD GATE) | **P** — definition S2 AC3 + S6 dedicated AML story; test plan NFR-AML + UNIT-S6-01 (50 synthetic records, leap-year boundary); DoR S2/S6 contracts | **P** — S1.3 dedicated story; test plan T1.2.4, T1.3.1, T1.3.2; DoR S1.3 contract |
| C4: Single Auckland DC (technical baseline) | Constraints | N | **P** — definition (stories 1.1, 1.2 — provisioning goal), DoR (story 1.2 contract eliminates C4); no NFR test required (addressed by provisioning) | **P** — definition S1 (secondary provisioning goal); test plan INT-S1-01/02; DoR S1 contract; no separate NFR test (addressed by provisioning) | **A** — background context in discovery (not in Constraints section); DoR S1.2 captures as explicit assumption; no dedicated test |
| C5: AML replication gap unverified (hidden audit finding) | [ASSUMPTION] in discovery | Y (AML-adjacent, audit gap) | **P** — surfaced as [ASSUMPTION] in discovery per EXP-002b writing rule; definition (stories 1.3, 3.2 Architecture Constraints), test plan (NFR-1.3-3 oldest-bucket, NFR-3.2-2 definitive-finding required), DoR (story 3.2 contract — "Unverified NOT acceptable") | **P** — surfaced as [ASSUMPTION] in discovery; definition S2+S6 Architecture Constraints; test plan NFR-AML retention gap verification; DoR Coding Agent Instructions explicit C5 directive | **P** — test-plan Scenario 1.4 explicit investigation test; DoR S1.2 explicit assumption (C5) |
| **CPF** | | | **5/5 = 1.00** | **5/5 = 1.00** | **3P + 2A** → binary: 3/5 = 0.60 (C2 D conservative-regulated; C1/C4 A non-reg) |
| **Regulated CPF** | C2, C3, C5 | **3/3 = 1.00** | **3/3 = 1.00** | **1/3 = 0.33 at source** (C2 D, C3 P, C5 P); **2/3 end-chain** (C2 recovered) |

**Config A Run 1 verdict:** PASS ✅
- General CPF: 1.00 ≥ 0.80 threshold
- Regulated CPF: 1.00 ≥ 0.80 threshold (C2, C3, C5 all propagated to CRITICAL-severity NFR tests and HARD GATE DoR contract entries)
- C5 (hidden constraint): Successfully surfaced by the model as an [ASSUMPTION] in discovery and propagated through all downstream stages. The hidden constraint was not dropped at any pipeline stage.

**Config B Run 2 verdict (2026-05-14):** PASS ✅
- General CPF: 1.00 ≥ 0.80 threshold
- Regulated CPF: 1.00 ≥ 0.80 threshold (C2 in Epic 2 S5/S7 HARD GATE + NFR-PCI; C3 in S6 dedicated story + UNIT-S6-01 + DoR contract; C5 explicitly named in Coding Agent Instructions)
- C5 (hidden constraint): Surfaced as [ASSUMPTION] in discovery; definition closed it within MVP via dedicated story S6; DoR Coding Agent Instructions includes explicit C5 directive preventing agent deferral.
- DoR production verdict: BLOCKED (H-GOV — Approved By = Pending, expected for synthetic corpus input). Eval verdict: CONDITIONAL PROCEED.

**Config C Run 1 findings (2026-05-14):**

1. **F1 — C2 (PCI DSS) dropped in discovery + definition.** PCI DSS appeared in the input brief narrative but was not captured in the discovery Constraints section (scored 0.1 — narrative mention only) and was entirely absent from the definition story ACs and constraint propagation table (scored 0.0). At-source regulated CPF = 1/3 = 0.33 — well below the 0.80 regulated threshold. The constraint was only recovered by the review skill (H2/H3 HIGH findings), which surfaced it and caused the test-plan and DoR to include a QSA gate. A coding agent dispatched post-definition (before review) would operate without any PCI DSS constraint.

2. **F2 — Pipeline recovery pattern confirmed.** The review and DoR skills recovered C2 from a score of 0.0 to end-chain presence. This confirms the pipeline's gate architecture provides partial CPF recovery — but recovery is downstream of the critical handoff point (post-definition dispatch). Config C's recovery does not make it safe for regulated inputs; it demonstrates the failure mode that the regulated routing rule is designed to prevent.

3. **F3 — C4 (single data centre) remained background context.** C4 was mentioned in the discovery narrative but never formalised as a Constraints section item through any artefact until the DoR contract assumption for S1.2. No test explicitly asserts the secondary site provisioning prerequisite. Non-regulated, so not a threshold failure, but a consistent propagation gap pattern.

4. **F4 — Model switch not executed.** Config C intended Haiku for downstream stages (/definition through /definition-of-ready). In practice, all stages were executed with claude-sonnet-4-6 (VS Code model selector was not changed between stages). The CPF gap is therefore attributable to Sonnet behaviour variability on this run, not to Haiku capability limitations. A re-run with the Haiku switch correctly executed is required to produce valid Config C evidence. The current run is labelled "Config C intent, Sonnet uniform execution" in the runs log.

5. **F5 — CPF non-determinism confirmed.** Config A and Config C both used claude-sonnet-4-6 for all stages. Config A achieved CPF = 1.00; Config C achieved regulated-at-source CPF = 0.33. This confirms that Sonnet CPF is not deterministically 1.00 — there is a model behaviour failure mode where regulatory constraints are present in the input narrative but not elevated to named Constraints section entries. This finding supports the constraint-surfacing rule proposal in workspace/proposals/proposed-discovery-skill-update-exp-002b.md (D5/D7 rules).

**Config C Run 2 findings (2026-05-14 — Sonnet disc+def, Haiku review+tp+dor):**

1. **Chain CPF = 0.68 FAIL; regulated chain CPF = 0.675 FAIL.** C2 (PCI DSS) chain score = 0.35 — catastrophic weakening at Definition. C3 (AML/CFT) chain score = 1.00 — only constraint with perfect propagation. Full per-constraint per-stage scores in runs/config-C-run-2/cpf-scores.md.

2. **C2 drop is a slicing strategy effect, not pure variability (F6).** Config C run 2 Sonnet chose vertical-slice framing with no regulatory risk rationale. Config A Sonnet chose risk-first, explicitly naming C2 and C5 as motivation ("most likely to expand scope or block go-live"). With risk-first: a dedicated Epic 3 for regulatory compliance was created, forcing C2 into every story's Architecture Constraints that depends on it. With vertical-slice: C2 was assigned to preparation stories (S1.1/S1.3) only, and architectural-change stories (S1.2 replication implementation; S2.2 failover automation) had no PCI DSS AC or NFR. The slicing strategy choice is itself stochastic, but once made, the downstream CPF outcome follows deterministically.

3. **Self-check false positive in definition.md propagation table (F7).** Sonnet produced a "Constraint Propagation Analysis" table that self-assessed C2 as "Named in S1.1 AC5 (QSA pre-engagement); S1.3 includes Compliance team validation" and declared "ALL FIVE CONSTRAINTS PROPAGATED." This was a false positive. The table validated "constraint appears somewhere in the feature" not "constraint appears in every story that makes an architectural change within the constraint's scope." S1.2 and S2.2 — the stories requiring a QSA gate — had no C2 mention. The model's summary was internally inconsistent with the story bodies it had just written.

4. **Haiku downstream recovery consistent and correct.** Review (Haiku) correctly identified H2 (C2 absent from story ACs/NFRs) as a HIGH finding. Test-plan (Haiku) added T2.2.2 (QSA architectural assessment gate test for S2.2). DoR (Haiku) added explicit PCI DSS prerequisites in S1.2 and S2.2 contracts. C2 recovered from 0.35 (definition) to 0.60 (DoR) through four Haiku-produced stages. Haiku's stage contributions are consistently correct and additive.

5. **Config C run 2 is a valid Config C run.** Unlike run 1 (where Haiku switch was not executed), run 2 correctly used Sonnet for discovery+definition and Haiku for review+test-plan+DoR. CPF = FAIL at chain and regulated thresholds. This confirms Config C is not safe for regulated-constraint stories. Re-run required if the intent is to isolate Haiku-only definition behaviour (run 2 attributes the definition failure to Sonnet, not Haiku).

## Scorecard summary

*Populated after all runs complete.*

| Config | CPS (Layer 2 estimate) | Layer 1 relative cost | General CPF | Regulated CPF | Verdict | Recommended for |
|--------|----------------------|----------------------|------------|--------------|---------|----------------|
| A — Uniform Sonnet | ~$1.50 | 1.0x baseline | **1.00** | **1.00** | **PASS** | Regulated-input stories at standard cost |
| B — Tiered front-loaded | ~$0.90 | ~15x | **1.00** | **1.00** | **PASS** | Regulated-input stories at lower Layer 2 cost than Config A; depth-of-extraction finding (Opus surfaces additional operational constraints beyond canonical inventory) |
| C — Cost-optimised | ~$0.60 | ~0.4x | Run 1: **0.60** (binary end-chain) / Run 2: **0.68** (chain avg) | Run 1: **0.33 at source** / Run 2: **0.675 chain FAIL** | **FAIL** (reg. chain CPF < 0.80 both runs) | Non-regulated stories only; Config C run 2 confirms Sonnet (not Haiku) is the definition failure driver; re-run with Haiku definition required to isolate Haiku CPF |
| D — GPT-4o + Haiku | ~$0.30 | ~0.07x | _pending_ | _pending_ | _pending_ | Requires EXP-002a H5 confirmed |

## Findings

**Config A Run 1 findings (2026-05-14):**

1. **CPF = 1.00 (5/5 constraints propagated)** — claude-sonnet-4-6 uniform achieves perfect constraint propagation for the S1 corpus story. This establishes the quality ceiling for EXP-003.

2. **Hidden constraint C5 fully surfaced** — The model independently surfaced the AML replication gap as an [ASSUMPTION] in /discovery (per EXP-002b writing rule), and that assumption propagated through all downstream stages (definition Architecture Constraints, test plan NFR tests, DoR contract). No single stage dropped C5.

3. **Regulated constraints handled with appropriate severity** — C2 (PCI DSS) and C3 (AML/CFT) received CRITICAL-severity NFR tests and HARD GO-LIVE GATE labels in the DoR contract. The model correctly escalated these rather than treating them as normal constraints.

4. **Baseline established for Config B/C comparison** — CPF = 1.00 is the ceiling. Config B (Opus front-loaded) is unlikely to improve on this; its value will be measured via turn-count efficiency or constraint labelling quality. Config C (Haiku downstream) is the risk scenario — whether Haiku can maintain CPF ≥ 0.80 is the open question.

**Config B Run 2 findings (2026-05-14):**

1. **CPF = 1.00 (5/5 constraints propagated)** — Opus 4.7 front-loaded (discovery+definition) + Sonnet (review+test-plan+DoR) achieves perfect canonical CPF across all 5 skills. All constraint-test-gate triples intact: C2 QSA → NFR-PCI → HARD GATE DoR; C3 AML → UNIT-S6-01 → DoR contract; C5 gap → NFR-AML retention verification → Coding Agent Instructions directive.

2. **C5 (hidden AML replication gap) surfaced and closed within MVP.** Opus elevated C5 to an explicit [ASSUMPTION] and dedicated full story S6 to its closure — not deferred to a post-MVP epic. DoR Coding Agent Instructions block includes an explicit C5 directive preventing agent deferral.

3. **Non-canonical constraints detected (quality findings only).** NC1 (NZ data residency — well-propagated through NFR-RESIDENCY test and DoR infrastructure constraints) and NC2 (High oversight level — payment DR + PCI DSS + AML). Neither is in the canonical inventory; neither counts toward canonical CPF. NC1 is a positive signal: Opus surfaced an additional real-world constraint not present in the input brief.

4. **Config B vs Config A comparison.** Both achieve canonical CPF = 1.0. Config B provides a qualitative depth-of-extraction advantage: it surfaces additional operational constraints (C6 in run 1; NC1 in run 2) beyond the canonical inventory. No canonical CPF advantage over Config A.

5. **DoR H-GOV block expected and correct.** `## Approved By` = Pending across all 7 stories — expected for synthetic corpus input. H-GOV is a governance process gate, not a CPF failure.

**Recommendation (partial — Config A, B, and C):** *Config D results and Config C proper re-run (actual Haiku downstream) pending. Interim finding: Config A and Config B both achieve canonical CPF = 1.00. Config B offers lower Layer 2 CPS (~$0.90 vs ~$1.50) with depth-of-extraction advantage. Config C regulated CPF at source = 0.33 — not safe for regulated-input stories regardless of end-chain recovery.*

**Config A vs Config C finding:** Config A (Sonnet uniform) achieves CPF = 1.00. Config C (intended Sonnet/Haiku; executed Sonnet uniform — see F4) achieves binary CPF = 0.60 / regulated-at-source CPF = 0.33. The difference is not attributable to model capability (both used Sonnet in practice) — it is attributable to model behaviour variability across runs on the same prompts. This confirms CPF is not deterministic at 1.00 for Sonnet — there is a failure mode where regulatory constraints appear in the problem narrative but are not elevated to the Constraints section.

## Next actions

- [x] Config A Run 1 complete — CPF = 1.00, PASS
- [x] Config B Run 2 complete — 2026-05-14. CPF = 1.00 (5/5 canonical), regulated CPF = 1.00. Genuine full-pipeline run (all 5 skills: Opus 4.7 for discovery+definition, Sonnet for review+test-plan+dor). See runs/config-B-run-2/. (Run 1 = partial: discovery+definition with Opus, C6 depth-of-extraction finding recorded.)
- [x] Config C Run 1: /discovery (Sonnet) through /definition-of-ready (Sonnet — Haiku switch not executed; see F4 in cpf-scores.md)
- [x] Config C regulated CPF at source = 0.33 < 0.80 threshold: routing-policy-framework.md updated to add Config C prohibition for regulated-input stories (EXP-003 evidence)
- [x] Config C Run 2: /discovery+/definition (Sonnet) + /review+/test-plan+/DoR (Haiku) — complete 2026-05-14. Chain CPF = 0.68 FAIL; regulated chain CPF = 0.675 FAIL. Key finding: Sonnet vertical-slice choice suppresses C2 propagation (F6); self-check false positive in propagation table (F7). See runs/config-C-run-2/cpf-scores.md.
- [ ] Config C re-run (proper — Haiku for /definition): execute with Haiku at /definition stage to isolate Haiku definition CPF. Run 2 attributes the definition failure to Sonnet's slicing strategy choice — a Haiku-definition run would determine whether Haiku independently propagates regulated constraints or also drops them.
- [ ] Update measurement_backed fields in token-optimization proposal after completion

## Deviations from template

- experiment_type is end-to-end-pipeline, not model-sweep — Scenario 3 is distinct from Scenarios 1 and 2
- Layer 1 (semi-manual) only — Scenario 3 requires multi-turn pipeline execution; Layer 2 automation of full pipeline is a separate project
- 2 trials per config (not 3) — pipeline runs are time-intensive; 2 trials provides directional signal for config comparison
