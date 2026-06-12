# EXP-011 — OpenAI Model Sweep (3-tier: budget / mid / premium)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-011-openai-model-sweep |
| experiment_type | model-sweep |
| created | 2026-06-11 |
| operator | Hamish King |
| status | complete |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | cross-provider comparison — find best score/price on /discovery |
| skills_swept | discovery |
| models_compared | gpt-4o-mini, gpt-4.1, gpt-4o |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | T1, T2, T3, T4, T5, S2, S3, S4, S5, S7, S8, S9, S10, S11, S12, S13 |
| run_mode | live (no --batch — Anthropic batch API is Anthropic-only) |

## Hypothesis

OpenAI models at one or more price tiers can match or exceed Sonnet 4.6's /discovery score (0.617 avg, 56% pass rate) at comparable or lower cost-per-run ($0.033/run for Sonnet 4.6). The primary question is whether the OpenAI efficiency frontier intersects or beats the current Anthropic routing at any tier.

Secondary hypothesis: `gpt-4.1` (mid-tier, $2.00/$8.00 per M) outperforms `gpt-4o` (premium-legacy, $2.50/$10.00 per M) due to its newer architecture, making it the dominant choice if OpenAI is viable at all.

**Comparison baseline (from EXP-010):**
| Metric | Sonnet 4.6 (current policy) |
|--------|-----------------------------|
| Avg score (16 cases) | 0.617 |
| Trial pass rate | 18/32 (56%) |
| T3 quality signal | 0.938 |
| S-hard avg (S9–S13) | 0.623 |
| Cost/run (est.) | $0.033 |
| Cost/passing trial | $0.059 |

## Token and cost estimate

*Dry-run confirmed 2026-06-11 — assumes 900 input / 2000 output tokens per candidate run.*
*Judge token actuals from EXP-010 Phase 2: ~3096 input / 289 output per judge call.*

| Component | Model | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|-------|------|------------------|--------------------|-----------|
| Candidate runs | gpt-4o-mini | 32 | ~28,800 | ~64,000 | **$0.043** (OpenAI) |
| Candidate runs | gpt-4.1 | 32 | ~28,800 | ~64,000 | **$0.570** (OpenAI) |
| Candidate runs | gpt-4o | 32 | ~28,800 | ~64,000 | **$0.712** (OpenAI) |
| Judge calls | claude-sonnet-4-6 | 96 | ~297,216 | ~27,744 | **$1.308** (Anthropic) |
| **Total OpenAI (generation)** | | | | | **$1.325** |
| **Total Anthropic (judge)** | | | | | **$1.308** |
| **All-in** | | | | | **$2.633** |

*OpenAI budget: $4.91 available. Est. OpenAI spend $1.33 — 73% headroom.*
*Anthropic budget: ~$19.07 remaining of $30 ceiling. Est. Anthropic judge $1.31 — within ceiling.*

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| discovery | T1, T2, T3, T4, T5, S2, S3, S4, S5, S7, S8, S9, S10, S11, S12, S13 | gpt-4o-mini, gpt-4.1, gpt-4o | 2 |

Total cells: 16 cases × 3 models × 2 trials = **96 generation runs + 96 judge calls = 192 API calls**

Matrix confirmed by dry-run 2026-06-11.

## Model tier rationale

| Tier | Model | Input/M | Output/M | Rationale |
|------|-------|---------|----------|-----------|
| Budget | gpt-4o-mini | $0.15 | $0.60 | Cheapest capable OpenAI model; 16× cheaper than mid |
| Mid | gpt-4.1 | $2.00 | $8.00 | Current-gen architecture (released 2025-04); better instruction-following than gpt-4o |
| Premium | gpt-4o | $2.50 | $10.00 | Established premium baseline; slightly costlier but well-characterised |

## Run commands

### Dry-run (no API calls, no keys required)
```powershell
node scripts/run-model-sweep.js --experiment EXP-011-openai-model-sweep --skills discovery --models gpt-4o-mini,gpt-4.1,gpt-4o --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2 --dry-run
```

### Live run (all 3 models — requires both keys)
Both `ANTHROPIC_API_KEY` (for judge) and `OPENAI_API_KEY` (for generation) must be set.
Do NOT use `--provider openai` — auto-detection routes gpt-* to OpenAI and the claude-* judge to Anthropic correctly.

```powershell
# Set keys in session first (MC-SEC-02: never write keys to file)
$env:OPENAI_API_KEY = "sk-..."
# ANTHROPIC_API_KEY should already be set

node scripts/run-model-sweep.js --experiment EXP-011-openai-model-sweep --skills discovery --models gpt-4o-mini,gpt-4.1,gpt-4o --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2
```

### If interrupted mid-run (rejudge + scorecard only)
```powershell
node scripts/run-model-sweep.js --experiment EXP-011-openai-model-sweep --judge-only
```

### Per-model runs (safer — run one model at a time)
```powershell
# Tier 1 — budget
node scripts/run-model-sweep.js --experiment EXP-011-openai-model-sweep --skills discovery --models gpt-4o-mini --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2

# Tier 2 — mid
node scripts/run-model-sweep.js --experiment EXP-011-openai-model-sweep --skills discovery --models gpt-4.1 --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2

# Tier 3 — premium
node scripts/run-model-sweep.js --experiment EXP-011-openai-model-sweep --skills discovery --models gpt-4o --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2

# After all 3 complete — regenerate combined scorecard
node scripts/run-model-sweep.js --experiment EXP-011-openai-model-sweep --judge-only
```

## Primary evaluation criteria

Routing will change from Sonnet 4.6 **only if** an OpenAI model satisfies all of:
1. Avg score ≥ 0.617 (match or beat Sonnet 4.6 baseline)
2. Trial pass rate ≥ 18/32 (≥ 56%)
3. T3 avg ≥ 0.938 (primary quality signal — must not regress)
4. Cost/passing trial < $0.059 (must be more cost-efficient than Sonnet 4.6)

**Score/price ratio** (avg_score / cost_per_run) is the secondary ranking metric for ordering models that don't clear the threshold.

## Scorecard summary

*Populated after all runs complete.*

| Skill | Model | Tier | Avg score | Pass rate | T3 avg | S-hard avg | Cost/run | Cost/passing trial | vs Sonnet 4.6 |
|-------|-------|------|-----------|-----------|--------|-----------|----------|-------------------|---------------|
| discovery | gpt-4o-mini | budget | — | — | — | — | $0.001 est. | — | — |
| discovery | gpt-4.1 | mid | — | — | — | — | $0.018 est. | — | — |
| discovery | gpt-4o | premium | — | — | — | — | $0.022 est. | — | — |

## Findings

*Populated after analysis.*

## Deviations from template

- **Live mode only**: `--batch` uses Anthropic's `/v1/messages/batches` API, which is Anthropic-specific. OpenAI models require live mode.
- **Dual-provider run**: Generation uses `OPENAI_API_KEY` (OpenAI API); judging uses `ANTHROPIC_API_KEY` (Anthropic API). Both keys must be set. `--provider` flag is intentionally omitted — auto-detection handles per-model routing.
- **S6 excluded**: Same as EXP-010 — behavioural scenarios not scoreable by D1–D7.
- **trials_per_cell = 2**: Matches EXP-010; maintains comparability with Anthropic baseline.
- **S-series cases**: S2–S13 corpus files created during EXP-010. Used unchanged here.
