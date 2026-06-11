# EXP-012 — OpenAI GPT-5.4 Family Sweep (3-tier: nano / mini / standard)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-012-gpt54-model-sweep |
| experiment_type | model-sweep |
| created | 2026-06-11 |
| operator | Hamish King |
| status | complete |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | cross-provider comparison — GPT-5.4 architecture vs Anthropic baseline on /discovery |
| skills_swept | discovery |
| models_compared | gpt-5.4-nano, gpt-5.4-mini, gpt-5.4 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | T1, T2, T3, T4, T5, S2, S3, S4, S5, S7, S8, S9, S10, S11, S12, S13 |
| run_mode | live (no --batch — Anthropic batch API is Anthropic-only) |

## Hypothesis

The GPT-5.4 architecture (released 2026) represents a material capability step-up over the 4.x series. One or more GPT-5.4 tier models can match or exceed Sonnet 4.6's /discovery score (0.617 avg, 56% pass rate) at comparable or lower cost-per-run ($0.033/run for Sonnet 4.6).

Secondary hypothesis: `gpt-5.4` (standard tier, $2.50/$15.00 per M) is competitive with `gpt-4.1` on average score but shows stronger S-hard performance due to architectural improvements in instruction-following and constraint identification.

**Comparison baseline (from EXP-010 + EXP-011):**
| Metric | Sonnet 4.6 (current policy) | Best OpenAI 4.x (gpt-4.1) |
|--------|-----------------------------|---------------------------|
| Avg score (16 cases) | 0.617 | 0.419 |
| Trial pass rate | 18/32 (56%) | 1/32 (3%) |
| T3 quality signal | 0.938 | 0.621 |
| S-hard avg (S9–S13) | 0.623 | 0.411 |
| Cost/run (est.) | $0.033 | ~$0.008 |
| Cost/passing trial | $0.059 | ~$0.513 |

## Caching implementation

**Anthropic judge calls (all 96):** `extractJudgeRubric` now passes the full EVAL.md grading-dimensions section (~3000 tokens, above the 1024-token Anthropic cache minimum) as a cached system prompt to every judge call via `cache_control: {type: 'ephemeral'}`. After the first judge call, the rubric is cached and subsequent calls pay the 90%-discounted read rate. This will show `cache_read_input_tokens > 0` in the Anthropic dashboard.

**OpenAI generation calls (all 96):** OpenAI automatic caching applies to prompts with a 1024+ token common prefix. Current generation system prompt (`EVALUATION MODE ACTIVE...`) is ~60 tokens; user message preamble is ~50 tokens. Combined constant prefix is well below the 1024-token threshold — OpenAI auto-caching will NOT trigger for these calls. This is a known limitation of the current eval mode prompt structure; no code changes made as adding SKILL.md to the generation prompt would change evaluation methodology vs EXP-010/011.

## Token and cost estimate

*Assumes 900 input / 2000 output tokens per candidate generation run.*
*Judge: ~3096 input (now includes ~3000-token rubric system prompt) + ~289 output per judge call.*
*Judge rubric caching: first call pays write rate, calls 2–96 pay 90%-discounted read rate.*

| Component | Model | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|-------|------|------------------|--------------------|-----------|
| Candidate runs | gpt-5.4-nano | 32 | ~28,800 | ~64,000 | **$0.086** (OpenAI) |
| Candidate runs | gpt-5.4-mini | 32 | ~28,800 | ~64,000 | **$0.310** (OpenAI) |
| Candidate runs | gpt-5.4 | 32 | ~28,800 | ~64,000 | **$1.032** (OpenAI) |
| Judge calls (with rubric cache) | claude-sonnet-4-6 | 96 | ~494,784 | ~27,744 | **~$1.45** (Anthropic, ~$0.74 after caching) |
| **Total OpenAI (generation)** | | | | | **$1.428** |
| **Total Anthropic (judge)** | | | | | **~$1.45 gross / ~$0.74 net** |
| **All-in** | | | | | **~$2.17** |

*Note: Judge cost with caching — first call full price (~$0.016), calls 2–96 at discounted rate (~$0.0077/call). Net Anthropic cost ~$0.74 vs ~$0.65 without rubric. Small premium for enabling dashboard visibility and correct caching infrastructure.*

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| discovery | T1, T2, T3, T4, T5, S2, S3, S4, S5, S7, S8, S9, S10, S11, S12, S13 | gpt-5.4-nano, gpt-5.4-mini, gpt-5.4 | 2 |

Total cells: 16 cases × 3 models × 2 trials = **96 generation runs + 96 judge calls = 192 API calls**

Matrix confirmed by dry-run 2026-06-11.

## Model tier rationale

| Tier | Model | Input/M | Output/M | Rationale |
|------|-------|---------|----------|-----------|
| Budget | gpt-5.4-nano | $0.20 | $1.25 | Cheapest 5.4-architecture model; 12.5× cheaper than standard |
| Mid | gpt-5.4-mini | $0.75 | $4.50 | Mid-tier 5.4 architecture; 3.3× cheaper than standard |
| Standard | gpt-5.4 | $2.50 | $15.00 | Full 5.4 architecture; comparable input price to Sonnet 4.6 ($3.00/M) |

## Run commands

### Dry-run (no API calls, no keys required)
```powershell
node scripts/run-model-sweep.js --experiment EXP-012-gpt54-model-sweep --skills discovery --models gpt-5.4-nano,gpt-5.4-mini,gpt-5.4 --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2 --dry-run
```

### Live run (all 3 models — requires both keys)
Both `ANTHROPIC_API_KEY` (for judge) and `OPENAI_API_KEY` (for generation) must be set.
Do NOT use `--provider openai` — auto-detection routes gpt-* to OpenAI and the claude-* judge to Anthropic correctly.

```powershell
# Set keys as inline env vars in the same command (MC-SEC-02: never write keys to file)
! OPENAI_API_KEY="sk-..." ANTHROPIC_API_KEY="sk-ant-..." node scripts/run-model-sweep.js --experiment EXP-012-gpt54-model-sweep --skills discovery --models gpt-5.4-nano,gpt-5.4-mini,gpt-5.4 --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2
```

### If interrupted mid-run (rejudge + scorecard only)
```powershell
node scripts/run-model-sweep.js --experiment EXP-012-gpt54-model-sweep --judge-only
```

### Per-model runs (safer — run one model at a time)
```powershell
# Tier 1 — budget
node scripts/run-model-sweep.js --experiment EXP-012-gpt54-model-sweep --skills discovery --models gpt-5.4-nano --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2

# Tier 2 — mid
node scripts/run-model-sweep.js --experiment EXP-012-gpt54-model-sweep --skills discovery --models gpt-5.4-mini --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2

# Tier 3 — standard
node scripts/run-model-sweep.js --experiment EXP-012-gpt54-model-sweep --skills discovery --models gpt-5.4 --cases T1,T2,T3,T4,T5,S2,S3,S4,S5,S7,S8,S9,S10,S11,S12,S13 --trials 2

# After all 3 complete — regenerate combined scorecard
node scripts/run-model-sweep.js --experiment EXP-012-gpt54-model-sweep --judge-only
```

## Primary evaluation criteria

Routing will change from Sonnet 4.6 **only if** a GPT-5.4 model satisfies all of:
1. Avg score ≥ 0.617 (match or beat Sonnet 4.6 baseline)
2. Trial pass rate ≥ 18/32 (≥ 56%)
3. T3 avg ≥ 0.938 (primary quality signal — must not regress)
4. Cost/passing trial < $0.059 (must be more cost-efficient than Sonnet 4.6)

**Score/price ratio** (avg_score / cost_per_run) is the secondary ranking metric for models that don't clear the threshold.

## Scorecard summary

*Populated after all runs complete.*

| Skill | Model | Tier | Avg score | Pass rate | T3 avg | S-hard avg | Cost/run | Cost/passing trial | vs Sonnet 4.6 |
|-------|-------|------|-----------|-----------|--------|-----------|----------|-------------------|---------------|
| discovery | gpt-5.4-nano | budget | — | — | — | — | $0.003 est. | — | — |
| discovery | gpt-5.4-mini | mid | — | — | — | — | $0.010 est. | — | — |
| discovery | gpt-5.4 | standard | — | — | — | — | $0.032 est. | — | — |

## Findings

*Populated after analysis.*

## Deviations from template

- **Live mode only**: `--batch` uses Anthropic's `/v1/messages/batches` API, which is Anthropic-specific. OpenAI models require live mode.
- **Dual-provider run**: Generation uses `OPENAI_API_KEY` (OpenAI API); judging uses `ANTHROPIC_API_KEY` (Anthropic API). Both keys must be set. `--provider` flag is intentionally omitted — auto-detection handles per-model routing.
- **Judge caching enabled**: `extractJudgeRubric` provides ~3000-token rubric as cached system prompt to all judge calls. Judge `providerOverride` fixed to `null` (was incorrectly passing `effectiveProvider` which broke cross-provider sweeps).
- **OpenAI auto-caching**: Will NOT trigger — generation prompts are ~110 tokens, below the 1024-token OpenAI auto-cache threshold. No code change made; documented limitation.
- **S6 excluded**: Same as EXP-010/011 — behavioural scenarios not scoreable by D1–D7.
- **trials_per_cell = 2**: Matches EXP-010/011; maintains comparability with baselines.
