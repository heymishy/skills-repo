# EXP-025b — Regulated Context Injection with eval_mode Directive (S11/S12)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-025b-regulated-context-eval-mode |
| experiment_type | model-sweep |
| created | 2026-06-13 |
| operator | Hamish King |
| status | pending |
| parent | EXP-025-regulated-context-breadth |
| motivation | EXP-025 S11/S12 cells likely produced clarification responses rather than scoreable discovery artefacts. The EXP-013 clarification gate (hardened SKILL.md) and context injection interact: regulated context surfaces constraint complexity that the model reads as requiring clarification before proceeding. In batch eval mode, clarification = non-scoreable trial. EXP-025b re-runs S11 and S12 with `eval_mode: single_turn: true` added to context-regulated.yml, confirming the directive resolves the interaction. |

## Background and co-design implication

EXP-013 hardened the SKILL.md clarification protocol: the model asks a scoped clarifying question before producing a discovery artefact when the brief is genuinely ambiguous. This is correct behaviour for interactive sessions — the operator is present and can answer.

In eval mode (batch API, no second turn), the same behaviour means the trial produces a clarification question rather than a scoreable artefact. Context injection amplifies the trigger because `context-regulated.yml` surfaces regulatory constraints the brief did not mention — the model correctly identifies that these constraints require confirming the project scope before committing to a full discovery artefact.

This is **not a model failure**. It is evidence that:
1. The EXP-013 clarification protocol is working as designed
2. Context injection and the clarification protocol are not independent workstreams — they interact at the SKILL.md level, and must be co-designed

The fix is `eval_mode: single_turn: true, clarification_behaviour: surface_as_assumptions` in `context-regulated.yml`. This tells the model: in this eval context, treat the run as single-turn and fold ambiguities into labelled assumptions rather than surfacing them as clarification requests.

**Implication for SKILL.md design:** Any future change to the clarification gate must be evaluated against context-injection eval runs, not just interactive runs. The clarification gate and the eval_mode directive are now a matched pair — changes to one require re-validation of the other.

---

## Hypotheses

**H1 — eval_mode directive resolves clarification trigger on S11/S12**

With `eval_mode: single_turn: true` in context-regulated.yml, Sonnet produces a complete scoreable discovery artefact on S11 and S12 on both trials (no clarification-only responses). The eval_mode directive is sufficient to suppress the clarification gate in eval context.

*Falsification: If Sonnet still produces clarification responses on S11 or S12 after the directive is added, the eval_mode directive is not being read or applied — investigate whether the context file injection position in the system prompt places it after the SKILL.md clarification instruction (latter wins).*

**H2 — Context injection lift confirmed on S11/S12 with eval_mode active**

With clarification trigger resolved, Sonnet+context scores on S11 and S12 replicate the EXP-020 S13 pattern: ≥ 0.10 improvement vs no-context baseline. Context injection is confirmed as a quality lever for S11/S12 regulated cases, not just S13.

*Falsification: If Sonnet+context scores on S11/S12 are below no-context baseline even with eval_mode active, context injection is not universally beneficial for S-hard cases — the S13 lift may be specific to S13's constraint structure (SWIFT + dual-AML).*

---

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | EXP-025 clarification interaction — S11/S12 re-run with eval_mode directive |
| skills_swept | discovery |
| models_compared | claude-sonnet-4-6 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | S11, S12 |
| context_files | .github/context-regulated.yml |
| max_tokens | 8192 |
| batch_mode | true |

Total cells: 2 cases × 1 model × 2 trials = **4 generation runs + 4 judge calls = 8 API calls**

**Change vs EXP-025:** `context-regulated.yml` now contains `eval_mode: single_turn: true, clarification_behaviour: surface_as_assumptions`. This is the only variable that differs from EXP-025. If EXP-025 S11/S12 runs produced scoreable artefacts (clarification was not triggered), EXP-025b results will be indistinguishable from EXP-025 — which is the correct outcome.

---

## Data classification check

| Field | Value |
|-------|-------|
| context_files_used | .github/context-regulated.yml |
| contains_internal_system_names | false (all synthetic) |
| contains_customer_data | false |
| approved_for_external_api | true |

---

## Run command

```bash
node scripts/run-model-sweep.js \
  --experiment EXP-025b-regulated-context-eval-mode \
  --skills discovery \
  --models claude-sonnet-4-6 \
  --cases S11,S12 \
  --trials 2 \
  --batch \
  --max-tokens 8192 \
  --context-files .github/context-regulated.yml
```

---

## Cost estimate

| Component | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------|------------------|--------------------|-----------|
| Sonnet generation × 4 cells | 4 | ~20,000 | ~10,000 | **~$0.210** |
| Judge (Sonnet) × 4 cells | 4 | ~20,000 | ~2,000 | **~$0.090** |
| **Total** | | | | **~$0.30** |

*Cost ceiling: $2 USD. Estimate $0.30 — trivial.*

---

## Matrix definition

| Skill | Case | Model | Context | Trials |
|-------|------|-------|---------|--------|
| discovery | S11 | claude-sonnet-4-6 | context-regulated.yml + eval_mode | 2 |
| discovery | S12 | claude-sonnet-4-6 | context-regulated.yml + eval_mode | 2 |

---

## Pass criteria

**H1 confirmed (all 4 cells produce scoreable artefacts):**
- eval_mode directive resolves the clarification interaction
- EXP-025 S11/S12 results are invalid (clarification confound) — superseded by EXP-025b
- Proceed to interpret H2 (context injection quality lift)
- Update context-regulated.yml documentation to note eval_mode as required for batch eval runs

**H1 falsified (≥1 cell still produces clarification response):**
- eval_mode directive is not suppressing the clarification gate
- Investigate context file injection order: if SKILL.md clarification instruction loads after context-regulated.yml, it overrides the eval_mode directive
- Fix: move eval_mode directive language into a system prompt wrapper rather than context file, OR add an explicit eval-mode override to SKILL.md itself

**H2 confirmed (≥0.10 lift vs no-context baseline on both cases):**
- Context injection is confirmed as a quality lever for S11 and S12
- Combined with EXP-020 S13 result: regulated context injection is a broadly applicable S-hard quality lever
- Update routing policy: `context-regulated.yml` injection is default for S9–S13 (pending S9 confirmation)

**H2 falsified (< 0.10 lift or degradation on ≥1 case):**
- Context injection lift is S13-specific — S13's SWIFT+dual-AML constraint structure maps directly to context-regulated.yml content; S11/S12 do not benefit in the same way
- Routing policy remains S13-specific; do not generalise to all S-hard cases

---

## Deviations from template

- **Sub-experiment**: EXP-025b is a targeted re-run of EXP-025 S11/S12 cells. It is not independent — results must be interpreted in conjunction with EXP-025 S9 results and EXP-020 S13 results.
- **Single variable change**: Only `eval_mode` directive added to context-regulated.yml vs EXP-025. All other parameters identical.
- **Co-design note**: This experiment is evidence that SKILL.md clarification gate changes and context injection changes must be validated together. Log in the eval programme roadmap under "cross-workstream dependencies."
