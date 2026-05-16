# Eval Programme Roadmap

**Purpose:** Full evaluation programme sequence, dependencies, and what each experiment enables for routing policy decisions.

**Last updated:** 2026-05-16

---

## Current state (as of 2026-05-16)

| Experiment | Status | Routing decision unlocked |
|------------|--------|---------------------------|
| EXP-001 — discovery isolated sweep | Complete | Sonnet/Opus T1–T4 baseline |
| EXP-002a — cross-provider discovery | Complete | GPT-4o disqualified (H5 disproved); Haiku qualified at 5/6 T1+T3; Sonnet approved as primary discovery model |
| EXP-002b — context-loaded discovery | Pending (EXP-002a gating removed — see note below) | T5 context gap vs model gap diagnosis |
| EXP-003 — end-to-end CPF pipeline | In progress — Config C run 3 pending (Step 4a fix validation) | Config A (Sonnet uniform) ✅; Config B (Opus front-loaded) ✅; Config C (Haiku downstream) ⚠️ FAIL — regulated CPF 0.675 |
| EXP-004 — /definition-of-ready rubric | Complete | Haiku approved for DoR (GF 1.00 all trials) |
| EXP-005 — /definition rubric | Complete | Haiku approved for definition in isolation (CPF 1.00 all trials); E2E validation pending via EXP-003 Config C run 3 |
| EXP-006 — /review rubric | Complete | Haiku approved for review (FDR_HIGH 1.00; 0.33× cost) |
| EXP-007 — /test-plan rubric | Complete | Haiku approved for test-plan (TCF 1.00 all cases) |
| EXP-007R — /test-plan NFR fix validation | Complete | Haiku D3 scope-mixing eliminated by NFR scope rule (commit a8e09c8); PCI/compliance override removed |

**Open action:** EXP-003 Config C run 3 (full pipeline with Step 4a SKILL.md fix + confirmed Haiku model switch). Until complete, regulated-story /definition override applies — see `proposals/routing-policy-framework.md` caveats section.

**Note on EXP-002b:** EXP-002a confirmed GPT-4o fails discovery (H5 disproved), making the cross-provider shortlisting function of EXP-002a complete. EXP-002b (Scenario 2 context-loading) remains useful for T5 proactivity diagnosis but is no longer a hard prerequisite for any pending experiment.

---

## Programme overview

The eval programme is a measurement-first approach to model routing: no routing policy is updated without experiment evidence backing the change. Each experiment in the sequence unblocks specific routing decisions.

```
EXP-001 ──► EXP-002a ──► EXP-002b ──► EXP-003 ──► EXP-004 ──► EXP-005
                │                          │
                │                          └──────► EXP-006
                │                          │
                │                          └──────► EXP-007
                │                          │
                │                          └──────► EXP-008
                │                          │
                │                          └──────► EXP-009
                │
                └──────────────────────────────────────────────► EXP-LOCAL-001
```

**Phase 1 (complete):** EXP-001/002a — discovery baseline; cross-provider qualification
**Phase 2 (complete):** EXP-003 (partial) + EXP-004 — CPF measurement; DoR rubric
**Phase 3 (complete):** EXP-005/006/007/007R — definition, review, test-plan rubrics
**Phase 4 (in progress):** EXP-003 Config C run 3 — E2E CPF validation of Haiku routing with Step 4a fix
**Phase 5 (next):** EXP-002b — T5 context gap diagnosis; EXP-008/009 — /benefit-metric and /improve rubrics
**Phase 6 (deferred):** /improve — human-reviewed via challenger pre-check only; EXP-LOCAL-001 — local model tier classification

---

## EXP-001 — Discovery skill isolated sweep (Scenario 1)

**Status:** Complete

**What was tested:** Discovery skill, 2 models (Sonnet, Opus), 5 corpus cases (T1–T5), Scenario 1 (no context injection), Layer 1 + Layer 2

**What EXP-001 established:**
- T1–T4: Both Sonnet and Opus pass at ≥ 0.70. Opus leads by 0.04–0.11 on T1 and T3.
- T5: Both fail (0.49) — hidden constraint surfacing does not occur in Scenario 1 without explicit context
- T3 D7 (constraint completeness): Both score 1.0 — but only Pass 1 collected; Pass 2 (Finacle architectural revelation) not run for either model
- T5 failure diagnosis: EXP-001 T5 had a confound (batch bypass instruction conflicted with T5 criterion) — confirmed structural issue, not model issue alone

**Routing policy unlocked:** Tier assessment for Sonnet and Opus on Scenario 1. Sonnet is sufficient for T1–T4. Opus is preferred for T3. Neither is sufficient for T5 without context loading.

**Decisions enabled:**
- Sonnet as default model for structured/checklist skills is justified
- Opus is justified for /discovery and /definition on complex inputs
- T5 proactivity gap requires further investigation before any model can be recommended for regulated discovery inputs without SKILL.md intervention

---

## EXP-002a — Cross-provider isolated sweep (Scenario 1)

**Status:** Complete — see `workspace/experiments/EXP-002a-cross-provider-discovery/`

**Entry condition (was):** `getProvider()` function implemented + `OPENAI_API_KEY` available — both satisfied

**What will be tested:** Discovery skill, 5 models (haiku-4-5, sonnet-4-6, opus-4-6, gpt-4o, gpt-4o-mini), Scenario 1, Layer 2

**Carry-forward rule:** Sonnet and Opus T1–T4 results from EXP-001 run-3b carry forward if byte-identical corpus inputs + same evaluation_mode + no EVAL.md changes. T5 must be re-run for all models (confound corrected).

**What EXP-002a will establish:**
- GPT-4o and GPT-4o-mini Scenario 1 performance vs Anthropic models
- Haiku-4-5 qualification assessment (does it meet L1 tier minimum?)
- T5 baseline without batch bypass confound for all 5 models
- Which models are worth the context-loading cost in EXP-002b (Scenario 2 only justified for models that pass Scenario 1)

**Routing policy unlocked:**
- GPT models can be added to routing policy if they meet tier thresholds
- Haiku tier classification (L1, L2, or insufficient for any production use)
- Model shortlist for EXP-002b (Scenario 2 runs only for models that passed EXP-002a)

**Decisions enabled:**
- Multi-provider routing feasibility (can GPT models substitute for Anthropic models at equivalent quality?)
- Cost-efficient tier routing: if Haiku meets L1, structured gate skills can use Haiku on all inputs
- T5 proactivity baseline for all models without confound

---

## EXP-002b — Context-loaded discovery sweep (Scenario 2)

**Status:** Planned — requires EXP-002a complete

**Entry condition:** EXP-002a complete; models shortlisted for Scenario 2

**What will be tested:** Discovery skill, Sonnet + Opus (shortlist from EXP-002a), Scenario 2 (context injection), 2 passes (Pass 1: standard context, Pass 2: explicit regulatory injection), Layer 1 + 2

**What EXP-002b will establish:**
- Is the T5 failure a context gap (model can surface constraints when given context files) or a model gap (model cannot surface them regardless)?
- Does explicit regulatory injection framing in the system prompt fix T5 proactivity?
- Does context loading improve T3 D7 (constraint completeness) beyond Scenario 1 baseline?

**Routing policy unlocked:**
- If context gap confirmed: fix is context file enrichment, not model upgrade
- If model gap confirmed: fix requires SKILL.md structural change (mandatory constraint surfacing step)
- If regulatory injection fixes it (Pass 2): pipeline needs explicit regulatory framing in system context for regulated-input runs

**Decisions enabled:**
- Whether `constraints.md` and `architecture-guardrails.md` enrichment is the correct intervention for T5 proactivity
- Whether a SKILL.md change is required for `/discovery` to address model gap
- Whether Scenario 2 (context loading) justifies the additional token cost per run for non-regulated inputs

---

## EXP-003 — End-to-end pipeline eval (Scenario 3)

**Status:** In progress — Configs A and B complete (PASS); Config C run 1 invalid (model switch not executed); Config C run 2 FAIL (regulated CPF 0.675); fix-validation (Step 4a) complete in isolation; **Config C run 3 pending** (full pipeline with Step 4a SKILL.md fix). Config D formally cancelled — EXP-002a disproved H5 (GPT-4o T1+T3 avg 0.467, below 0.70 threshold).

**Entry condition (was):** EXP-002a and EXP-002b complete; `evaluation_mode` field implemented in sweep harness for Scenario 3 tracking — EXP-002a complete; EXP-002b gating removed (see current state note); `evaluation_mode` tracking added

**What will be tested:** Full pipeline (/discovery → /definition → /review → /test-plan → /DoR), 3 configs (A: uniform Sonnet, B: tiered front-loaded, C: cost-optimised), Scenario 3, Layer 1

**What EXP-003 will establish:**
- Constraint propagation fidelity (CPF) for each config — do constraints survive from discovery artefact through to DoR contract and test plan?
- CPF on regulated constraints specifically (PCI DSS, AML/CFT, RTO/RPO Board policy)
- Cost per story (CPS) for each config
- Whether Config C (cost-optimised, heavy Haiku usage) achieves acceptable CPF

**Routing policy unlocked:**
- Whether Config C is safe for regulated-input stories (if CPF < 0.80 on regulated constraints: prohibited)
- Whether Config B front-loaded Opus is justified vs Config A uniform Sonnet (if CPF is equivalent: Config A preferred for cost)
- CPF evidence for routing policy document (`proposals/routing-policy-framework.md`)

**Decisions enabled:**
- Default pipeline routing configuration recommendation (which config to recommend as default)
- Regulated-input routing requirement (which config is mandatory for regulated stories)
- Whether the pipeline requires a post-discovery constraint audit step before definition

---

## EXP-LOCAL-001 — Local model discovery eval (Scenario 1)

**Status:** Planned — independent of EXP-002b and EXP-003; requires local model infrastructure

**Entry condition:** Local model infrastructure available (Ollama or equivalent) + EXP-002a complete (establishes Scenario 1 baseline for comparison) + readiness checklist completed for target model

**What will be tested:** Discovery skill, ≥1 local model from each of L1/L2/L3 candidate tier, Scenario 1, Layer 1

**What EXP-LOCAL-001 will establish:**
- Tier classification for tested local models
- Whether any local model achieves L3 threshold (T3 ≥ 0.70 + D7 ≥ 0.60)
- Baseline for local model CPF in future EXP-LOCAL-002 (Scenario 3)

**Routing policy unlocked:**
- Which local models are approved for which skill categories
- Whether local models can substitute for Sonnet on non-regulated structured skills (L1 established → DoR/DoD/benefit-metric can use local model)
- Data classification routing: local models confirmed for context files with `approved_for_external_api: false`

---

## Dependency summary

| Experiment | Depends on | Enables |
|------------|-----------|---------|
| EXP-001 | None | Complete — T1–T4 Sonnet/Opus baseline; T5 gap identified |
| EXP-002a | `getProvider()` (now implemented) | Complete — GPT-4o disqualified; Haiku qualified; Sonnet discovery routing approved |
| EXP-002b | EXP-002a | Pending — context gap vs model gap; T5 intervention decision |
| EXP-003 | EXP-002a | In progress — Configs A+B PASS; Config C run 3 pending |
| EXP-004 | EXP-003 (was gating dep) | Complete — DoR Haiku approved; GF 1.00 |
| EXP-005 | EXP-003 (was gating dep) | Complete — definition Haiku approved in isolation; E2E validation via Config C run 3 |
| EXP-006 | EXP-003 (was gating dep) | Complete — review Haiku approved; FDR_HIGH 1.00 |
| EXP-007 | EXP-003 (was gating dep) | Complete — test-plan Haiku approved; TCF 1.00 |
| EXP-007R | EXP-007 | Complete — D3 NFR scope-mixing fixed; PCI/compliance override removed |
| EXP-LOCAL-001 | Local infra + EXP-002a | Pending — local model tier classification |

---

## Implementation prerequisites before any experiment runs

| Prerequisite | Required for | Status |
|-------------|-------------|--------|
| `getProvider()` in `run-model-sweep.js` | EXP-002a, EXP-002b, EXP-003 | **Implemented** (Anthropic, OpenAI, Copilot, local providers) |
| `OPENAI_API_KEY` available | EXP-002a (GPT models) | Used in EXP-002a (complete) |
| EXP-002b context-injection-spec harness support | EXP-002b | Not yet implemented |
| `evaluation_mode` field in sweep harness | EXP-003 tracking | **Implemented** |
| Local model infrastructure (Ollama or equivalent) | EXP-LOCAL-001 | Operator action |
| `run-model-sweep.js` HTTP vs HTTPS protocol switch for local models | EXP-LOCAL-001 | Not yet implemented |

---

## Cost model — GitHub Copilot AI Credits (Layer 1)

All experiments can be run via Layer 1 (GitHub Copilot subscription, VS Code model selector) or Layer 2 (direct API via `run-model-sweep.js`). Cost basis differs materially. Every cost estimate must state which layer it applies to.

### Layer 1 multipliers (verified 2026-05-12)

| Model | Multiplier | Implication |
|-------|------------|-------------|
| Claude Opus 4.7 | 15x | Reserve for highest-stakes regulated inputs only |
| Claude Sonnet 4.6 | 1x | Baseline — current default |
| Claude Haiku 4.5 | 0.33x | Preferred for gate skills and high-volume stages |
| GPT-4o | 0x | Free — preferred for non-regulated generative stages if quality threshold met |
| GPT-4.1 | 0x | Free — evaluate in EXP-002a |
| GPT-5 mini | 0x | Free — evaluate in EXP-002a |
| GPT-5.4 | 1x (Medium) | Same cost as Sonnet — add to EXP-002a if operator decides |
| GPT-5.5 | 7.5x | See D2 in cost-model-decisions.md — not recommended without hypothesis |
| Gemini 2.5 Pro | 1x | See D1 in cost-model-decisions.md — deferred |
| Gemini 3 Flash Preview | 0.33x | See D1 in cost-model-decisions.md — deferred |
| Auto | 10% discount | Prohibited for eval runs — model selection uncontrolled |

**Note on Opus version:** Layer 1 shows Claude Opus 4.7 only — claude-opus-4-6 is no longer available in the Copilot model selector. Layer 2 (direct API) model string `claude-opus-4-7` needs operator verification before running. All experiment manifests use `claude-opus-4-7`. See D3 in `cost-model-decisions.md`.

### Key implications

**GPT-4o at 0x changes the routing recommendation hypothesis:** If GPT-4o scores ≥ 0.70 on T1 and T3 in EXP-002a, it becomes the recommended model for non-regulated generative stages regardless of quality differential with Sonnet — zero cost dominates any quality-per-dollar calculation where both models pass threshold.

**Opus at 15x is only justifiable when:** Input is T3-class (AML, regulatory) AND Opus D7 score exceeds Sonnet D7 by ≥ 0.15 AND the story has a regulatory NFR that maps to a specific compliance clause.

**Haiku at 0.33x is preferred for all gate skills (DoR, DoD, review structural checks).** EXP-001 did not eval gate skill quality — this assumption requires validation via a future gate-skill eval experiment before it can be marked `measurement_backed: true`.

---

## Routing policy update protocol

After each experiment completes:

1. Evaluate whether results meet the `measurement_backed` threshold for a routing policy change
2. If yes: draft a routing policy update in `proposals/routing-policy-framework.md`
3. Raise a pipeline story for the routing policy update (via `/discovery` → /DoR)
4. PR for the `token-optimization` SKILL.md change must cite the `experiment_id` that backs the change
5. Platform team review required before merge (per platform change policy)

Routing policy changes without experiment_id citations are out-of-process.

---

## EVAL.md coverage gap — full pipeline rubric programme (Phase 2+)

**Recorded: 2026-05-13**

EXP-001 through EXP-003 run without per-skill EVAL.md rubrics for most pipeline stages. The full outer loop has eight skills that need eval coverage. The current state:

| Skill | EVAL.md | Corpus | Status |
|-------|---------|--------|--------|
| /discovery | ✅ | T1–T5 | Done — EXP-001/002a |
| /definition-of-ready | ✅ | T1–T4 | Done — EXP-004 (Haiku approved; GF 1.00 all trials) |
| /definition | ✅ | T1–T4 | Done — EXP-005 (Haiku approved in isolation; E2E validation pending EXP-003 Config C run 3) |
| /review | ✅ | T1–T5 | Done — EXP-006 (Haiku approved; FDR_HIGH 1.00 all adversarial cases) |
| /test-plan | ✅ | T1–T5 | Done — EXP-007 + EXP-007R (Haiku approved including PCI/compliance stories; NFR scope rule fix validated) |
| /benefit-metric | ❌ | None | Not started — Provisional Sonnet |
| /definition-of-done | ❌ | None | Not started — Provisional Sonnet |
| /improve | ❌ | None | Not started — may never be fully automated |

**Why this is tolerable for EXP-003:** EXP-003 measures CPF (constraint propagation fidelity) — whether constraints survive the full pipeline chain. This does not require per-skill EVAL.md rubrics. A finding like "Config C drops regulatory constraints between discovery and DoR" is valid evidence even without a /test-plan EVAL.md. EXP-003 runs now with CPF as the primary metric.

**Updated programme sequence (full EVAL.md coverage):**

```
EXP-003 (CPF, no per-skill rubrics needed)
    ↓
EXP-004: /definition-of-ready corpus (gate skill — T1-T4 cases: missing ACs, unresolved PROCEED-BLOCKED, vague NFRs, genuinely ready story)
    ↓
EXP-005: /definition-of-done corpus (gate skill — same pattern)
    ↓
EXP-006: /definition (hardest generative skill after /discovery — slicing strategy, constraint propagation)
    ↓
EXP-007: /benefit-metric (baseline probing, measurement method quality)
    ↓
EXP-008: /review (Category E architecture gap detection, Category C AC completeness)
    ↓
EXP-009: /test-plan (AC-to-test coverage, edge case generation)
```

**Why gate skills first (EXP-004/005):** /definition-of-ready and /definition-of-done are binary gate skills — their failure mode is a false positive (signing off a story that isn't ready), which is a governance failure. EVAL.md dimensions for these should weight correctness over depth. Corpus cases should be adversarial: stories that look ready but have a hidden gap.

**Why /improve is last (or never):** /improve's output is proposals and learnings, not artefacts. Evaluating whether a proposed SKILL.md change is correct requires human judgement about platform design intent. The challenger pre-check process is the current quality gate for /improve output — this likely stays human-reviewed rather than automated.

**Estimated scope:** One experiment per skill, roughly one month of background work spread across sessions while delivery continues. Corpus case design is the hard part for each skill — model sweep infrastructure is already in place.

**Updated dependency summary (full programme):**

| Experiment | Depends on | Enables |
|------------|-----------|---------|
| EXP-001 | None (complete) | T1–T4 Sonnet/Opus baseline; T5 gap identified |
| EXP-002a | `getProvider()` (complete) | Multi-provider tier classification; Haiku L1 check |
| EXP-002b | EXP-002a (complete) | Context gap vs model gap; SKILL.md proposal |
| EXP-003 | EXP-002a + EXP-002b | CPF evidence; config recommendation |
| EXP-004 | EXP-003 | /definition-of-ready rubric + corpus; gate skill routing |
| EXP-005 | EXP-004 | /definition-of-done rubric + corpus; gate skill routing |
| EXP-006 | EXP-003 | /definition rubric + corpus; generative skill routing |
| EXP-007 | EXP-003 | /benefit-metric rubric + corpus |
| EXP-008 | EXP-003 | /review rubric + corpus; Category E gap-detection baseline |
| EXP-009 | EXP-003 | /test-plan rubric + corpus |
| EXP-LOCAL-001 | Local infra + EXP-002a | Local model tier classification |
