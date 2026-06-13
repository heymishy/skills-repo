# EXP-023 — Haiku No-Context Discovery Baseline (S10/S13)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-023-haiku-no-context-baseline |
| experiment_type | model-sweep |
| created | 2026-06-13 |
| operator | Hamish King |
| status | pending |
| motivation | EXP-020 tested Haiku with regulated context on S10 and S13; both runs were NON-COMPLIANT (S10: 0.018, S13: 0.306). The no-context baseline for Haiku on these same cases is unknown. This baseline is required to compute the context injection delta for Haiku — i.e., whether context injection hurts, helps, or makes no difference for Haiku on S-hard regulated cases. |

## Background

EXP-020 (context injection) ran Haiku and Sonnet on S10 and S13 with `.github/context-regulated.yml`. Results:

| Cell | Score | Verdict |
|------|-------|---------|
| Haiku S10 | 0.018 | NON-COMPLIANT |
| Haiku S13 | 0.306 | NON-COMPLIANT |
| Sonnet S10 | — | judge failure (infrastructure artefact) |
| Sonnet S13 | 0.995 | PASS |

EXP-021 runs Haiku no-context across S2-S13 (excluding S1/S6), which will cover S10 and S13 in the sweep. EXP-023 provides a targeted baseline specifically for these two S-hard cases: smaller scope, faster to score, and produces the context delta computation earlier without waiting for the full 22-cell EXP-021 run to complete scoring.

If EXP-021 results for S10 and S13 are available when EXP-023 runs, use EXP-021 as the no-context baseline and skip EXP-023. Run EXP-023 only if EXP-021 S10/S13 cells are missing or inconclusive.

---

## Hypotheses

**H1 — Haiku no-context S-hard baseline lower than Haiku+context**

Haiku no-context scores on S10 and S13 are lower than Haiku+context (EXP-020: S13 0.306, S10 0.018). The context injection delta is negative — context files do not help Haiku on S-hard regulated cases, and may introduce noise (confusing schema elements from context vs SKILL.md).

*Falsification: If Haiku no-context scores are higher than Haiku+context, context injection is actively degrading Haiku performance on S-hard cases. This would indicate a prompt overload failure mode.*

**H2 — Haiku no-context S-hard remains NON-COMPLIANT**

Even without context injection overhead, Haiku scores < 0.70 on S10 and S13. This confirms the NON-COMPLIANT finding from EXP-020 is due to capability gap (not context noise), and supports retaining Sonnet as the S-hard discovery model.

*Falsification: If Haiku passes S10 or S13 without context, this contradicts EXP-020's finding. The EXP-020 context runs would then represent a context injection degradation failure. Requires investigation before any routing change.*

---

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | EXP-020 context delta — Haiku S-hard no-context baseline required |
| skills_swept | discovery |
| models_compared | claude-haiku-4-5 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | S10, S13 |
| context_files | none |
| max_tokens | 8192 |
| batch_mode | true |

Total cells: 2 cases × 1 model × 2 trials = **4 generation runs + 4 judge calls = 8 API calls**

---

## Data classification check

| Field | Value |
|-------|-------|
| context_files_used | none |
| contains_internal_system_names | false (all synthetic) |
| contains_customer_data | false |
| approved_for_external_api | true |

---

## Run command

```bash
node scripts/run-model-sweep.js \
  --experiment EXP-023-haiku-no-context-baseline \
  --skills discovery \
  --models claude-haiku-4-5 \
  --cases S10,S13 \
  --trials 2 \
  --batch \
  --max-tokens 8192
```

---

## Cost estimate

*Input token estimate: ~3,500 tokens per run.*
*Output token estimate: ~2,000 tokens per run.*

| Component | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------|------------------|--------------------|-----------|
| Haiku 4.5 generation × 4 cells | 4 | ~14,000 | ~8,000 | **~$0.054** |
| Judge (Sonnet) × 4 cells | 4 | ~20,000 | ~2,000 | **~$0.090** |
| **Total** | | | | **~$0.14** |

*Cost ceiling: $2 USD. Estimate $0.14 — trivial.*

---

## Matrix definition

| Skill | Case | Model | Context | Trials |
|-------|------|-------|---------|--------|
| discovery | S10 | claude-haiku-4-5 | none | 2 |
| discovery | S13 | claude-haiku-4-5 | none | 2 |

---

## Context injection cross-reference

After running, update this table to compute the context injection delta for Haiku:

| Case | Haiku no-ctx (EXP-023) | Haiku+ctx (EXP-020) | Delta | Interpretation |
|------|------------------------|---------------------|-------|----------------|
| S10 | TBD | 0.018 NC | TBD | — |
| S13 | TBD | 0.306 NC | TBD | — |

**If EXP-021 S10/S13 cells are available:** Use those scores as the no-context baseline instead of running EXP-023 separately. Record EXP-021 run IDs in this table.

---

## Pass criteria and routing implications

**H2 confirmed (both S10/S13 NON-COMPLIANT without context):**
- Haiku capability gap confirmed on S-hard regulated cases — not a context injection artefact
- Routing unchanged: Sonnet remains the S-hard discovery default
- No further Haiku S-hard experiments warranted

**H1 falsified / H2 falsified (Haiku passes without context):**
- EXP-020 context runs were likely introducing context noise or prompt overload for Haiku
- Requires investigation: compare no-context vs context outputs at dimension level
- Do not change S-hard routing based on this finding alone — run 2 additional trials to confirm

---

## Deviations from template

- **Targeted scope**: 2 cases only. Intended to close the EXP-020 known gap as quickly as possible.
- **May be superseded**: If EXP-021 S10/S13 cells complete first, this experiment is redundant. Log as superseded in that case.
