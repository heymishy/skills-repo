# EXP-002b-context-loaded-discovery

## Purpose

Context-loaded isolated model sweep for the `/discovery` skill. Scenario 2 conditions: same T1–T5 corpus as EXP-001, but organisational context files are loaded into the model's context window before the skill prompt. Tests whether the T5 hidden-constraint failure observed in EXP-001 is a **model gap** (model cannot surface constraints regardless of context) or a **context gap** (model can surface constraints when the context files actually contain them).

The primary question: does the T5 proactivity failure disappear when the model reads `constraints.md` and `architecture-guardrails.md` before receiving the operator input?

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-002b-context-loaded-discovery |
| experiment_type | model-sweep |
| created | 2026-05-12 |
| operator | [operator name] |
| status | complete |

## Data classification check

| Field | Value |
|-------|-------|
| context_files_used | architecture-guardrails.md, product/constraints.md, product/mission.md, product/tech-stack.md |
| contains_internal_system_names | false (current repo context files reference the skills platform only — no internal enterprise system names) |
| contains_customer_data | false (must always be false — never use real customer data) |
| approved_for_external_api | true (current context files do not contain regulated enterprise data — this changes if context files are replaced with real enterprise context files before running) |
| if_not_approved | Run with local-* model only. Do not use cloud API. See local-model-scaffolding/provider-spec.md |

**⚠️ Important:** This check must be repeated before each run. If context files are updated with real enterprise content (internal system names, regulated architecture details, network topology), re-evaluate `approved_for_external_api`. When in doubt, use a local model.

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | EXP-002a complete |
| scenario | Scenario 2 — Context-loaded skill eval (full organisational context injected before skill prompt) |
| skills_swept | discovery |
| models_compared | claude-sonnet-4-6, claude-opus-4-7 |
| trials_per_cell | 3 (T3, T5 full scoring); 1 (T1, T2, T4 sanity check only) |
| judge_model | claude-sonnet-4-6 (locked) |
| corpus_cases | T1, T2, T3, T4, T5 |
| pass_threshold | 0.70 (generative skill) |
| evaluation_passes | Pass 1 (standard Scenario 2), Pass 2 (explicit regulatory context injection) |

## Hypothesis

**Core question:** Is the T5 constraint proactivity failure (0/4 in EXP-001) a model gap or a context gap?

- **H1 (context gap):** T5 proactivity score improves from 0/4 in EXP-001 to ≥ 2/4 in EXP-002b Pass 1. Interpretation: the fix is enriching the organisational context files (add explicit regulatory framing) or adding a mandatory constraint checklist step to the `/discovery` SKILL.md. The model has the capability — it wasn't given the information.
- **H2 (model gap):** T5 proactivity score remains 0/4 or 1/4 in EXP-002b Pass 1 despite full context. Interpretation: the SKILL.md needs a structural change (explicit constraint surfacing step, checklist, or a mandatory question about regulated data before accepting any domain input).
- **H3 (regulatory injection fix):** T5 proactivity score improves in Pass 2 (explicit regulatory injection) but NOT in Pass 1. Interpretation: the context files currently lack explicit regulatory framing — they need to include mandatory reference to the applicable regulatory regime before models will surface constraints unprompted.
- **H4:** T3 D7 (constraint completeness) improves with context loading for both models. The regulatory obligations are named in `constraints.md` — a context-loaded model should reference them more precisely.

## Models

Sonnet and Opus only. No need to sweep all five models for Scenario 2 until Scenario 1 (EXP-002a) establishes which models are worth the context-loading cost.

## Context injection protocol

See `context-injection-spec.md` in this directory for the full specification.

### Context injection order (summary)

1. `architecture-guardrails.md` — constraints and non-negotiables first (most salient position)
2. `product/constraints.md` — hard product constraints
3. `product/mission.md` — purpose and personas
4. `product/tech-stack.md` — implementation context

### Two evaluation passes

**Pass 1 — Standard Scenario 2:**
Context files injected in the order above. No additional framing in the system prompt beyond what the context files contain. System prompt = context files + standard skill prompt.

**Pass 2 — Explicit regulatory injection:**
Same context files, but the system prompt additionally includes:

> "This platform serves a regulated financial enterprise subject to prudential banking regulation and anti-money-laundering requirements. All discovery artefacts must explicitly surface: data residency requirements, retention policy constraints (including statutory retention periods), access control boundaries where the problem domain involves customer data, and any applicable regulatory filing obligations. Where the input domain involves financial transactions or customer data, name the applicable regulatory regime before writing the problem statement."

If Pass 1 improves T5 proactivity: Pass 2 is confirmatory (expected further improvement).
If Pass 1 does NOT improve T5 proactivity: Pass 2 is diagnostic (does explicit injection fix it?).

## Scoring protocol

### T3 and T5 — Full D1–D7, 3 trials per cell, both passes

Primary signal cases. Score all 7 dimensions. Average over 3 trials. Record D7 delta vs EXP-001 baseline (Scenario 1) as the primary output metric.

**T5 evaluation protocol — no batch bypass:**
Same protocol as EXP-002a T5. Do NOT use batch bypass instruction. If model asks questions, answer with the enterprise-context follow-up. Score the artefact produced after the follow-up. If model produces a feature list without asking, categorical fail + record D1–D7 for diagnostic value.

### T1, T2, T4 — 1 trial sanity check only

These cases are unlikely to change with context loading. Run one trial per cell per model to confirm no regression. If regression detected (previously categorical PASS → FAIL), escalate to 3 trials.

## Key delta metrics to track

| Metric | Baseline (EXP-001, Scenario 1) | Target |
|--------|-------------------------------|--------|
| T5 proactivity score (enterprise context questions asked) | 0/4 (Sonnet), 0/4 (Opus) | ≥ 2/4 for H1 confirmation |
| T5 weighted score | 0.49 (both) | ≥ 0.70 for pass |
| T3 D7 (constraint completeness) | 1.0 (both — Pass 1 only) | Maintained or improved |
| T3 D5 (assumption quality) | 0.4 Sonnet / 0.7 Opus | No regression |
| T3 D2 (persona specificity) | 0.7 Sonnet / 1.0 Opus | No regression |

## Governance lens

**Engineering lens:** a context gap finding means the fix is cheap (update context files, re-run). A model gap finding means a SKILL.md change is required — higher effort, requires PR review.

**Governance lens:** in a regulated enterprise, `architecture-guardrails.md` and `constraints.md` are the machine-readable policy layer. If these files contain the regulatory constraints and models still don't surface them, the pipeline has a structural fidelity gap — constraints exist in the repo but don't reach the produced artefacts. EXP-002b measures this gap with a specific, repeatable protocol.

## Runs log

| Run | Pass | Case | Model | Trial | Date | Run file | D7 | T5 proactivity | Weighted score | Pass |
|-----|------|------|-------|-------|------|----------|------|---------------|----------------|------|
| | | | | | _pending_ | | | | | |

## Scorecard summary

*Populated after all runs complete. Full detail in `scorecard.md`.*

| Model | Pass | T3 D7 | T5 proactivity | T5 score | T5 pass | Gap diagnosis |
|-------|------|-------|---------------|---------|---------|--------------|
| claude-sonnet-4-6 | 1 | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
| claude-sonnet-4-6 | 2 | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
| claude-opus-4-7 | 1 | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |
| claude-opus-4-7 | 2 | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ |

## Findings

*Populated after analysis.*

**Recommendation:** *pending — see decision tree in gap diagnosis column above*

**Evidence:** Experiment ID `EXP-002b-context-loaded-discovery`.

## Next actions

- [ ] EXP-002a must complete first — need to know which models pass Scenario 1 before Scenario 2 cost is justified
- [ ] Verify `data_classification_check` before running — re-evaluate if context files updated with enterprise content
- [ ] Run Pass 1 (standard context injection) for T3 and T5
- [ ] Evaluate T5 proactivity delta vs EXP-001 baseline
- [ ] If H2 (model gap) confirmed: raise SKILL.md change story via pipeline for `/discovery` mandatory constraint surfacing step
- [ ] If H1 (context gap) confirmed: raise story to enrich `product/constraints.md` and `architecture-guardrails.md` with explicit regulatory framing
- [ ] Run Pass 2 (explicit regulatory injection) and compare delta

## Deviations from template

- Two evaluation passes (Pass 1, Pass 2) within the same experiment — non-standard; justified by the diagnostic purpose
- T1, T2, T4 use 1 trial (sanity check only) rather than standard 3 trials
- T5 evaluation protocol differs from EXP-001 (no batch bypass) — corrects EXP-001 confound
