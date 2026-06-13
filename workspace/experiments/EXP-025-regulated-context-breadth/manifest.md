# EXP-025 — Regulated Context Injection Breadth (S9/S11/S12)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-025-regulated-context-breadth |
| experiment_type | model-sweep |
| created | 2026-06-13 |
| operator | Hamish King |
| status | superseded-partial — see EXP-025b |
| motivation | EXP-020 confirmed regulated context injection raises Sonnet S13 score by +0.378 (0.617 → 0.995). S10 was inconclusive due to judge infrastructure failures. The breadth question is unresolved: does context injection produce a similar quality lift on S9, S11, and S12? If confirmed across all four S-hard cases (S10/S13 from EXP-020, S9/S11/S12 from EXP-025), context injection becomes the default for all S-hard regulated discovery — not model-specific. |

## Background

EXP-020 results for context injection:

| Cell | No-context baseline | +context (EXP-020) | Delta |
|------|--------------------|--------------------|-------|
| Sonnet S13 | 0.617 (EXP-010) | 0.995 | +0.378 |
| Sonnet S10 | 0.628 (EXP-010) | judge failure | unresolved |
| Haiku S13 | TBD (EXP-023) | 0.306 NC | TBD |
| Haiku S10 | TBD (EXP-023) | 0.018 NC | TBD |

The S13 context injection delta (+0.378) is large enough to update routing policy for S13 alone. However, the current routing policy documents `context_injection: partial` pending EXP-025 breadth confirmation.

If EXP-025 confirms the lift on S9/S11/S12, the routing policy can be updated to: **all S-hard discovery cases use context-regulated.yml by default**, replacing the current S13-specific entry.

**Dependency:** EXP-025 should run after EXP-021 (Haiku S-series baseline) completes scoring, so that S9/S11/S12 no-context Sonnet baselines from EXP-021 are available for delta computation. If those baselines are not available from EXP-021 (Sonnet was not in EXP-021 — only Haiku was), use EXP-010 scores where available.

**Note:** EXP-010 ran Sonnet on S-series cases but at max-tokens 4096. Comparing EXP-025 (8192 tokens + context) to EXP-010 (4096 tokens, no context) conflates two variables. This is a known caveat — document in scorecard findings. A clean apples-to-apples comparison would require a Sonnet no-context 8192-token run on S9/S11/S12, which EXP-021 does not provide (Haiku only). If precision matters, run a targeted Sonnet no-context 8192-token baseline on S9/S11/S12 before interpreting EXP-025 deltas.

**⚠️ Clarification protocol interaction — EXP-025 superseded for S11/S12:**

EXP-013 hardened the SKILL.md clarification gate: the model asks before artefacting in ambiguous cases. Context injection amplifies this behaviour — regulated context surfaces additional constraint complexity, which the model interprets as requiring operator clarification before proceeding. In batch/eval mode there is no second turn, so a clarification response produces a non-scoreable trial.

This is evidence the EXP-013 clarification protocol is working correctly. It is also evidence that context injection and the clarification protocol need to be co-designed: context injection that surfaces complexity must be paired with an eval-mode directive that suppresses the clarification gate.

`context-regulated.yml` now includes:
```yaml
eval_mode:
  single_turn: true
  clarification_behaviour: surface_as_assumptions
```

This directive instructs the model to produce a complete artefact and surface ambiguities as labelled assumptions rather than holding for clarification. **EXP-025b re-runs S11 and S12 with this directive to confirm it resolves the clarification trigger.** S9 is included in EXP-025b if the original EXP-025 S9 run produced a scoreable artefact; otherwise S9 is re-run as well. Do not draw conclusions about S11/S12 context injection performance from EXP-025 results — those cells may be confounded by the clarification behaviour.

---

## Hypotheses

**H1 — Regulated context injection lifts Sonnet quality on S9/S11/S12**

Sonnet achieves ≥ 0.10 improvement on S9, S11, and S12 with context injection vs no-context baseline (EXP-010, adjusted for token ceiling). Mirrors the +0.378 delta observed on S13 in EXP-020.

*Falsification: If any S9/S11/S12 case shows < 0.05 lift from context injection, context is not a universal quality lever for S-hard regulated cases. S13 may be an outlier due to its specific regulatory structure (SWIFT + dual-AML) that maps directly to the context file content.*

**H2 — Context injection sufficient for all S-hard regulated discovery default**

EXP-025 results + EXP-020 S13 result jointly confirm ≥ 0.10 lift across all tested S-hard cases. This supports updating routing policy to: `context-regulated.yml injection is default for S9-S13 with Sonnet`.

*Falsification: If H1 fails on ≥ 1 case (< 0.05 lift), context injection should remain case-specific, not applied as a blanket default.*

---

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | EXP-020 partial scope — S9/S11/S12 context injection breadth unresolved |
| skills_swept | discovery |
| models_compared | claude-sonnet-4-6 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | S9, S11, S12 |
| context_files | .github/context-regulated.yml |
| max_tokens | 8192 |
| batch_mode | true |

Total cells: 3 cases × 1 model × 2 trials = **6 generation runs + 6 judge calls = 12 API calls**

---

## Data classification check

| Field | Value |
|-------|-------|
| context_files_used | .github/context-regulated.yml |
| contains_internal_system_names | false (context-regulated.yml contains synthetic regulatory scenario context) |
| contains_customer_data | false |
| approved_for_external_api | true |

---

## Run command

```bash
node scripts/run-model-sweep.js \
  --experiment EXP-025-regulated-context-breadth \
  --skills discovery \
  --models claude-sonnet-4-6 \
  --cases S9,S11,S12 \
  --trials 2 \
  --batch \
  --max-tokens 8192 \
  --context-files .github/context-regulated.yml
```

---

## Cost estimate

*Input token estimate: ~5,000 tokens per run (SKILL.md ~1,800 + corpus case ~600 + context-regulated.yml ~1,500 + overhead ~1,100).*
*Output token estimate: ~2,500 tokens per run.*

| Component | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------|------------------|--------------------|-----------|
| Sonnet generation × 6 cells | 6 | ~30,000 | ~15,000 | **~$0.315** |
| Judge (Sonnet) × 6 cells | 6 | ~30,000 | ~3,000 | **~$0.135** |
| **Total** | | | | **~$0.45** |

*Cost ceiling: $2 USD. Estimate $0.45 — within ceiling.*

---

## Matrix definition

| Skill | Case | Model | Context | Trials |
|-------|------|-------|---------|--------|
| discovery | S9 | claude-sonnet-4-6 | context-regulated.yml | 2 |
| discovery | S11 | claude-sonnet-4-6 | context-regulated.yml | 2 |
| discovery | S12 | claude-sonnet-4-6 | context-regulated.yml | 2 |

---

## Scorecard comparison plan

| Case | Sonnet+ctx (EXP-025) | Sonnet no-ctx (EXP-010, 4096) | Delta | H1/H2 verdict |
|------|----------------------|-------------------------------|-------|----------------|
| S9 | TBD | — | TBD | — |
| S11 | TBD | — | TBD | — |
| S12 | TBD | — | TBD | — |
| **EXP-020 reference** | | | | |
| S13 | 0.995 (EXP-020) | 0.617 (EXP-010) | +0.378 | CONFIRMED |
| S10 | judge failure (EXP-020) | 0.628 (EXP-010) | unresolved | PENDING |

**Routing change trigger:**
- H2 confirmed (≥ 0.10 lift on all S9/S11/S12): Update routing-policy-framework.md to set context-regulated.yml as default for all S-hard discovery (S9-S13).
- H1 partial (lift on some cases, not all): Update routing policy to case-specific context injection — note which S-hard cases benefit.
- H1 falsified (< 0.05 lift on all three cases): S13 context lift was case-specific. Remove breadth claim from routing policy. Retain S13 context injection as S13-specific only.

---

## Deviations from template

- **Context files required**: Unlike EXP-021/023/024, this experiment injects `.github/context-regulated.yml`. The `approved_for_external_api` flag is set to true — confirm context file content is synthetic before running.
- **Token ceiling caveat**: Comparison uses EXP-010 Sonnet baselines at 4096 tokens. EXP-025 runs at 8192 tokens. Delta interpretation conflates token ceiling with context injection effect. Document in scorecard. For a clean delta, a no-context 8192-token Sonnet run on S9/S11/S12 is the correct baseline — run as a targeted follow-up only if EXP-025 results are marginal (0.05–0.15 delta range).
- **Judge self-evaluation risk**: Judge model is claude-sonnet-4-6 evaluating claude-sonnet-4-6 outputs. This is the canonical judge configuration; the judge evaluates against the D1-D7 rubric, not by preference. No known bias from same-model judge in prior experiments.
