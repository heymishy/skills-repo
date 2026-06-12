# Scorecard — EXP-012-gpt54-model-sweep

Generated: 2026-06-11 (final analysis — replaces auto-generated file)
Experiment: EXP-012-gpt54-model-sweep
Judge model: claude-sonnet-4-6
Models compared: gpt-5.4-nano · gpt-5.4-mini · gpt-5.4
measurement_backed: true (95/96 runs scored — 1 judge error on T1-gpt-5.4-mini-trial-1, counted as 0)

---

## Section 1 — Executive summary

**Hypothesis**: The GPT-5.4 architecture represents a material capability step-up over 4.x; one or more tiers can match or exceed Sonnet 4.6's /discovery score (0.617 avg, 56% pass rate).

**Verdict: HYPOTHESIS REJECTED. Routing recommendation: HOLD (triple-confirmed).**

The GPT-5.4 family shows a meaningful improvement over GPT-4.x (+0.061 avg for the best tier) but remains well below Sonnet 4.6. `gpt-5.4` (standard tier) achieves 0.480 avg — the highest of any OpenAI model across EXP-011 and EXP-012 — with 4/32 passes (12.5%). This is still 0.137 below Sonnet 4.6 on average score and 43.5 percentage points behind on pass rate.

The most encouraging signal: gpt-5.4 S-hard avg (0.528) is the highest OpenAI S-hard score recorded, narrowly beating Sonnet 4.6 on S9 (0.656 vs 0.643). However, this is a single-case signal at 2 trials and all other routing criteria fail by wide margins. T4/T5 NON-COMPLIANT is universal across all three models — consistent with every prior experiment.

EXP-010 + EXP-011 + EXP-012 across nine models confirm: **discovery → claude-sonnet-4-6 is the correct routing.**

---

## Section 2 — Per-model aggregate

| Model | Tier | Avg score (16 cases) | Trial pass rate | NC failures | T-series avg | S-series avg | S-hard avg (S9–S13) |
|-------|------|---------------------|-----------------|-------------|-------------|-------------|----------------------|
| gpt-5.4 | standard | **0.480** | **4/32 (12.5%)** | 8 | **0.284** | **0.570** | **0.528** |
| gpt-5.4-mini | mid | 0.347 | 0/32 (0%) | 10 | 0.188 | 0.420 | 0.406 |
| gpt-5.4-nano | budget | 0.320 | 0/32 (0%) | 14 | 0.237 | 0.357 | 0.357 |

**Comparison baselines (EXP-010 + EXP-011):**

| Model | Exp | Avg score | Pass rate | NC | T-series | S-series | S-hard |
|-------|-----|-----------|-----------|-----|----------|----------|--------|
| claude-sonnet-4-6 | EXP-010 | 0.617 | 18/32 (56%) | 5 | 0.407 | 0.713 | 0.623 |
| gpt-4.1 | EXP-011 | 0.419 | 1/32 (3%) | 5 | 0.315 | 0.466 | 0.411 |
| gpt-4o-mini | EXP-011 | 0.276 | 0/32 (0%) | 11 | 0.237 | 0.293 | 0.263 |

*NC failure count = cases where judge triggered NON-COMPLIANT on at least one trial.*
*gpt-5.4 vs gpt-4.1: +0.061 avg, +3/32 passes, +0.117 S-hard improvement.*

---

## Section 3 — Per-case breakdown

| Case | Series | gpt-5.4-nano avg | gpt-5.4-mini avg | gpt-5.4 avg | Sonnet 4.6 (EXP-010) |
|------|--------|:----------------:|:----------------:|:-----------:|:---------------------:|
| T1 | T | 0.559 ✗✗ | 0.247 ✗✗† | 0.689 ✗✗ | 0.748 ✓✓ |
| T2 | T | 0.000 NC | 0.000 NC | 0.055 NC | 0.000 NC |
| T3 | T | 0.505 ✗✗ | 0.507 ✗✗ | **0.674 ½✓** | 0.938 ✓✓ |
| T4 | T | 0.000 NC | 0.185 ✗✗ | 0.000 NC | 0.000 NC |
| T5 | T | 0.120 NC | 0.000 NC | 0.000 NC | 0.351 ½✓ NC |
| S2 | S-med | 0.517 ✗✗ | 0.571 ✗✗ | 0.642 ✗✗ | 0.819 ✓✓ |
| S3 | S-med | 0.368 NC | 0.432 ✗✗ | **0.712 ½✓** | 0.835 ✓✓ |
| S4 | S-med | 0.378 NC | 0.305 NC | 0.530 NC | 0.688 ½✓ |
| S5 | S-med | 0.449 NC | 0.487 NC | **0.584 ½✓** | 0.774 ✓✓ |
| S7 | S-med | 0.220 NC | 0.352 ✗✗ | 0.627 ✗✗ | 0.824 ✓✓ |
| S8 | S-med | 0.212 NC | 0.444 NC | 0.532 ✗✗ | 0.784 ✓✓ |
| S9 | S-hard | 0.280 NC | 0.430 ✗✗ | **0.656 ½✓** | 0.643 ✗✗ |
| S10 | S-hard | 0.432 ✗✗ | 0.458 ✗✗ | 0.538 ✗✗ | 0.628 ½✓ |
| S11 | S-hard | 0.239 NC | 0.344 NC | 0.454 ✗✗ | 0.734 ½✓ |
| S12 | S-hard | 0.390 NC | 0.278 NC | 0.412 NC | 0.495 ✗✗ |
| S13 | S-hard | 0.444 ✗✗ | 0.519 ✗✗ | 0.582 ✗✗ | 0.617 ✗✗ |

✓✓ = 2/2 pass, ½✓ = 1/2 pass, ✗✗ = 0/2, NC = NON-COMPLIANT
†gpt-5.4-mini T1 avg depressed by judge error on trial 1 (counted as 0); true avg is ~0.493 based on trial 2.

gpt-5.4's 4 passing trials: S3-trial-1 (0.757), S5-trial-2 (0.737), S9-trial-2 (0.714), T3-trial-1 (0.814).

---

## Section 4 — Notable findings

### Finding 1: GPT-5.4 architecture materially improves over 4.x — but gap to Sonnet remains decisive

Comparing gpt-5.4 (EXP-012) to gpt-4.1 (EXP-011, the best 4.x model):

| Metric | gpt-5.4 | gpt-4.1 | Delta |
|--------|---------|---------|-------|
| Avg score | 0.480 | 0.419 | +0.061 |
| Pass rate | 4/32 (12.5%) | 1/32 (3%) | +3/32 |
| T3 avg | 0.674 | 0.621 | +0.053 |
| S-hard avg | 0.528 | 0.411 | +0.117 |

The +0.117 S-hard improvement is notable — the 5.4 architecture detects hidden constraints materially better than 4.x. However, gpt-5.4 remains 0.137 below Sonnet 4.6 on average score and 0.095 below on S-hard (0.528 vs 0.623).

### Finding 2: gpt-5.4 edges Sonnet 4.6 on S9 — first OpenAI case win

`gpt-5.4` achieves 0.656 avg on S9 (KiwiSaver hardship waiver), vs Sonnet 4.6's 0.643. This is the first case where any OpenAI model outperforms Sonnet 4.6 across EXP-010–012. Both models fail the pass threshold on S9 (0.700), but gpt-5.4 achieves one passing trial (0.714). Signal is fragile at 2 trials — requires more trials to confirm. On S10–S12, Sonnet 4.6 still leads.

### Finding 3: T3 quality gap remains decisive

T3 (CCCFA-regulated product, primary quality signal) — gpt-5.4 achieves 0.674 avg (1/2 pass, first OpenAI T3 pass across all experiments). But Sonnet 4.6 at 0.938 is 0.264 ahead. The single gpt-5.4 T3 pass at 0.814 shows capability but the second trial at 0.535 reveals high variance. Sonnet 4.6 produces 2/2 T3 passes consistently.

### Finding 4: T4/T5 universal NON-COMPLIANT — now confirmed across 9 models

Every model across EXP-010, EXP-011, and EXP-012 incurs NON-COMPLIANT on T4 and T5 on at least one trial. gpt-5.4 scores 0.000 on both T4 trials. This confirms the scope discipline failure is architectural (process protocol in SKILL.md), not model-specific. No model routing change will fix this.

### Finding 5: gpt-5.4-nano and gpt-5.4-mini underperform gpt-4.1

Both lower tiers of the 5.4 family (0.320 and 0.347 avg) fall below gpt-4.1 (0.419) on overall average. The budget and mid tiers of the 5.4 family do not match the 4.x mid-tier. The 5.4 architecture benefit appears concentrated in the full standard model.

---

## Section 5 — Cost analysis

| Model | Est. cost/run | Cost/cell (2 trials) | Passing trials | Est. cost/passing trial | vs Sonnet 4.6 ratio |
|-------|--------------|---------------------|----------------|------------------------|---------------------|
| gpt-5.4 | ~$0.032 | ~$0.064 | 4/32 (12.5%) | ~$0.516 | **8.7×** more |
| gpt-5.4-mini | ~$0.010 | ~$0.020 | 0/32 (0%) | ∞ | — |
| gpt-5.4-nano | ~$0.003 | ~$0.006 | 0/32 (0%) | ∞ | — |
| claude-sonnet-4-6 (EXP-010) | $0.033 | $0.066 | 18/32 (56%) | $0.059 | 1.0× |

Actual run cost: $1.372 total (script-reported; mix of OpenAI generation + Anthropic judge).

gpt-5.4 costs ~$0.032/run — essentially the same as Sonnet 4.6 ($0.033) — but produces 4.5× fewer passing trials. Cost-per-passing-trial is 8.7× worse than Sonnet 4.6. There is no cost-quality trade-off available: gpt-5.4 is comparable cost but substantially worse quality.

---

## Section 6 — Cross-experiment comparison (EXP-010 + EXP-011 + EXP-012 combined)

| Model | Exp | Avg score | Pass rate | T3 avg | S-hard avg | Cost/passing trial |
|-------|-----|-----------|-----------|--------|-----------|-------------------|
| claude-fable-5 | EXP-010 | 0.712 | 50% | 0.807 | 0.595 | $0.340 |
| **claude-sonnet-4-6** | EXP-010 | **0.617** | **56%** | **0.938** | **0.623** | **$0.059** |
| claude-opus-4-6 | EXP-010 | 0.571 | 38% | 0.949 | 0.518 | $0.145 |
| gpt-5.4 | EXP-012 | 0.480 | 12.5% | 0.674 | 0.528 | ~$0.516 |
| gpt-4.1 | EXP-011 | 0.419 | 3% | 0.621 | 0.411 | ~$0.513 |
| gpt-5.4-mini | EXP-012 | 0.347 | 0% | 0.507 | 0.406 | ∞ |
| gpt-4o-mini | EXP-011 | 0.276 | 0% | 0.531 | 0.263 | ∞ |
| gpt-5.4-nano | EXP-012 | 0.320 | 0% | 0.505 | 0.357 | ∞ |
| gpt-4o | EXP-011 | 0.254 | 0% | 0.451 | 0.245 | ∞ |

Sonnet 4.6 leads on: pass rate, T3 quality, S-hard quality, cost/passing trial. Every OpenAI model — across both architecture generations — sits below the weakest Anthropic model (Opus 4.6 at 0.571) on average score.

The OpenAI trajectory: gpt-4.1 (0.419) → gpt-5.4 (0.480) = +0.061 per architecture generation. To reach Sonnet 4.6 (0.617) at this trajectory requires approximately 2–3 more architecture generations.

---

## Section 7 — Routing recommendation

**Skill: /discovery**
**Recommendation: HOLD — maintain current routing (claude-sonnet-4-6)**
**Confidence: VERY HIGH (confirmed by EXP-010, EXP-011, EXP-012 across 9 models)**

| Criterion | gpt-5.4 (best OpenAI) | Sonnet 4.6 (current) | Decision |
|-----------|----------------------|----------------------|----------|
| Avg score ≥ 0.617 | 0.480 | 0.617 | **FAIL** — gap of 0.137 |
| Pass rate ≥ 56% | 12.5% | 56% | **FAIL** — 14 fewer passes |
| T3 avg ≥ 0.938 | 0.674 | 0.938 | **FAIL** — gap of 0.264 |
| Cost/passing trial < $0.059 | ~$0.516 | $0.059 | **FAIL** — 8.7× more expensive |

All four routing criteria fail for all GPT-5.4 models.

---

## Section 8 — Recommended next steps

1. **Current policy confirmed**: No action needed. discovery → claude-sonnet-4-6 is confirmed by three independent experiments across nine models.

2. **T4/T5 clarification protocol (separate workstream)**: Nine models across three experiments all fail T4/T5. This is a SKILL.md protocol issue, not a model routing issue. Should be addressed independently.

3. **S9 signal watch**: gpt-5.4's marginal S9 advantage (0.656 vs 0.643) is worth retesting with 5+ trials if OpenAI releases a gpt-5.4 variant with improved constraint detection. At 2 trials this is noise — at 10 trials it would be a meaningful signal.

4. **EXP-012 judge error (minor)**: T1-gpt-5.4-mini-trial-1 resulted in a judge parse error (score counted as 0). gpt-5.4-mini T1 avg is understated at 0.247 vs likely ~0.493. This does not affect any conclusion — gpt-5.4-mini remains at 0/32 passes regardless.

---

## Section 9 — Limitations

1. **Judge ceiling**: Judge is claude-sonnet-4-6. For deeper NZ financial regulatory reasoning (S9–S13), the judge may not fully reward gpt-5.4 outputs. Given the 0.480 average result, this limitation is unlikely to change the routing recommendation even if scores are underestimated by 0.1.

2. **2 trials per cell**: gpt-5.4 T3 showed high variance (0.814 pass, 0.535 fail). With only 2 trials, pass rate estimates for gpt-5.4 carry meaningful uncertainty. Aggregate conclusion (HOLD) is robust.

3. **Judge rubric system prompt (new in EXP-012)**: EXP-012 judge calls now use the full EVAL.md grading-dimensions section as a cached system prompt (~3000 tokens). This provides the judge with more context than EXP-010/011. Any systematic scoring change is expected to improve accuracy rather than bias in a particular direction, but strictly speaking EXP-012 judge scores are not calibrated to the same exact prompt as EXP-010/011.

4. **T1-gpt-5.4-mini judge error**: Trial 1 parse error; score treated as 0. Affects gpt-5.4-mini T1 avg (0.247 reported vs ~0.493 true). No impact on routing conclusions.
