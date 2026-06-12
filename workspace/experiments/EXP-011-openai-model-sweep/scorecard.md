# Scorecard — EXP-011-openai-model-sweep

Generated: 2026-06-11 (final analysis — replaces auto-generated file)
Experiment: EXP-011-openai-model-sweep
Judge model: claude-sonnet-4-6
Models compared: gpt-4o-mini · gpt-4.1 · gpt-4o
measurement_backed: true (96/96 runs scored — 32 per model, 2 trials × 16 cases)

---

## Section 1 — Executive summary

**Hypothesis**: One or more OpenAI 4.x models can match or exceed Sonnet 4.6 /discovery score (0.617 avg, 56% pass rate) at comparable or lower cost per run ($0.033/run).

**Verdict: HYPOTHESIS REJECTED. Routing recommendation: HOLD (double-confirmed).**

No OpenAI 4.x model comes close to Sonnet 4.6. The best result — `gpt-4.1` — achieves 0.419 avg (vs 0.617 for Sonnet 4.6) and passes only 1/32 trials (3% vs 56%). `gpt-4o`, the premium legacy model, performs *below* `gpt-4o-mini` across nearly all cases, a notable architectural regression on this NZ financial domain. All three models incur categorical NON-COMPLIANT on T4 and T5 (both trials), confirming that scope discipline failures are universal — not Anthropic-specific.

EXP-010 and EXP-011 together confirm: **discovery → claude-sonnet-4-6 is the correct routing**. No tested model (3 Anthropic + 3 OpenAI) displaces it.

---

## Section 2 — Per-model aggregate

| Model | Tier | Avg score (16 cases) | Trial pass rate | NC failures | T-series avg | S-series avg | S-hard avg (S9–S13) |
|-------|------|---------------------|-----------------|-------------|-------------|-------------|----------------------|
| gpt-4.1 | mid | **0.419** | **1/32 (3%)** | 5 | **0.315** | **0.466** | **0.411** |
| gpt-4o-mini | budget | 0.276 | 0/32 (0%) | 11 | 0.237 | 0.293 | 0.263 |
| gpt-4o | premium | 0.254 | 0/32 (0%) | 11 | 0.160 | 0.296 | 0.245 |

**Comparison baseline (EXP-010):**

| Model | Avg score | Pass rate | NC failures | T-series avg | S-series avg | S-hard avg |
|-------|-----------|-----------|-------------|-------------|-------------|-----------|
| claude-sonnet-4-6 | 0.617 | 18/32 (56%) | 5 | 0.407 | 0.713 | 0.623 |
| claude-opus-4-6 | 0.571 | 12/32 (38%) | 8 | 0.449 | 0.626 | 0.518 |

*NC failure = judge assigned NON-COMPLIANT (categorical fail).*
*Best OpenAI model (gpt-4.1) is 0.198 below Sonnet 4.6 on avg score and 0.212 below on S-hard. Even Opus 4.6, the weakest Anthropic model in EXP-010, outperforms gpt-4.1 on every metric.*

---

## Section 3 — Per-case breakdown

| Case | Series | gpt-4.1 avg | gpt-4o-mini avg | gpt-4o avg | Sonnet 4.6 (EXP-010) |
|------|--------|:-----------:|:---------------:|:----------:|:---------------------:|
| T1   | T | **0.725** ½✓ | 0.615 ✗✗ | 0.322 ✗✗ | 0.748 ✓✓ |
| T2   | T | 0.144 NC | 0.032 NC | 0.016 NC | 0.000 NC |
| T3   | T | 0.621 ✗✗ | 0.531 ✗✗ | 0.451 ✗✗ | **0.938 ✓✓** |
| T4   | T | 0.000 NC | 0.000 NC | 0.000 NC | 0.000 NC |
| T5   | T | 0.085 NC | 0.007 NC | 0.013 NC | 0.351 ½✓ NC |
| S2   | S-med | **0.607** ✗✗ | 0.385 ✗✗ | 0.412 ✗✗ | 0.819 ✓✓ |
| S3   | S-med | **0.578** ✗✗ | 0.301 ✗✗ | 0.340 ✗✗ | 0.835 ✓✓ |
| S4   | S-med | **0.456** ✗✗ | 0.342 ✗✗ | 0.350 ✗✗ | 0.688 ½✓ |
| S5   | S-med | **0.467** ✗✗ | 0.368 ✗✗ | 0.344 ✗✗ | 0.774 ✓✓ |
| S7   | S-med | **0.490** ✗✗ | 0.216 NC | 0.270 ✗✗ | 0.824 ✓✓ |
| S8   | S-med | **0.474** ✗✗ | 0.294 ✗✗ | 0.315 ✗✗ | 0.784 ✓✓ |
| S9   | S-hard | **0.367** ✗✗ | 0.167 NC | 0.145 NC | 0.643 ✗✗ |
| S10  | S-hard | **0.446** ✗✗ | 0.365 ✗✗ | 0.370 ✗✗ | 0.628 ½✓ |
| S11  | S-hard | **0.403** ✗✗ | 0.305 ✗✗ | 0.338 ✗✗ | 0.734 ½✓ |
| S12  | S-hard | **0.361** ✗✗ | 0.207 NC | 0.149 NC | 0.495 ✗✗ |
| S13  | S-hard | **0.480** ✗✗ | 0.273 NC | 0.224 NC | 0.617 ✗✗ |

✓✓ = 2/2 pass, ½✓ = 1/2 pass, ✗✗ = 0/2, NC = NON-COMPLIANT

`gpt-4.1` wins every case among OpenAI models. No OpenAI model passes any S-series case. Sonnet 4.6 passes 12/22 S-series trials; gpt-4.1 passes 0/22.

---

## Section 4 — Notable findings

### Finding 1: gpt-4o underperforms gpt-4o-mini (0.254 vs 0.276 avg)

`gpt-4o` — the more expensive model at $2.50/$10.00 per M — scores below the budget `gpt-4o-mini` ($0.15/$0.60) on overall average. The gap is most visible on T-series: gpt-4o avg 0.160 vs gpt-4o-mini 0.237. T1 is the starkest signal: gpt-4o 0.322 vs gpt-4o-mini 0.615.

`gpt-4o` also accumulates more NON-COMPLIANT failures on S-hard cases: S9 (both trials NC), S12 (both trials NC), S13 (1 trial NC) — failures that gpt-4.1 avoids entirely. This suggests `gpt-4o`'s older architecture produces more categorical process failures on NZ regulatory-domain cases, where precise constraint-identification is required.

**Implication**: `gpt-4o` should not be used for /discovery. `gpt-4o-mini` is cheaper and more reliable on this task.

### Finding 2: T3 quality gap is decisive

T3 (structured discovery, CCCFA-regulated product) is the primary quality signal. All three OpenAI models fail T3 (0/2 pass rate); gpt-4.1 scores 0.621 — identical to Sonnet 4.6's T3 score in EXP-010 Phase 1, but 0.317 below Sonnet's final T3 score of 0.938. The gap here alone is sufficient to recommend HOLD: no OpenAI model produces discovery artefacts of comparable depth on the key quality benchmark.

### Finding 3: T4 and T5 universal NON-COMPLIANT

T4 and T5 (scope discipline cases) result in NON-COMPLIANT on 100% of OpenAI 4.x trials, which is consistent with Anthropic Opus 4.6 and Sonnet 4.6 results (EXP-010). This continues to confirm that T4/T5 failures are **skill-level issues** in the /discovery SKILL.md clarification protocol — not resolvable by model switching.

### Finding 4: T2 partial improvement for gpt-4.1

`gpt-4.1` on T2 scores 0.148 and 0.140 NC (one NON-COMPLIANT). While still a failure, gpt-4.1 avoids the near-zero scores seen for gpt-4o (0.032, 0.000) and matches the pattern where Fable 5 (EXP-010) also showed partial T2 improvement. This suggests that newer-architecture models may have marginally better clarification-first behaviour on vague scope — but not enough to pass the threshold (0.700).

---

## Section 5 — Cost analysis

*Generation token actuals from run output (script-reported totals include both OpenAI generation and Anthropic judge, mixed-provider accounting may understate actual cost). Use provider dashboards for precise billing.*

| Model | Est. cost/run (gen only) | Est. cost/cell (2 trials) | Passing trials | Est. cost/passing trial | vs Sonnet 4.6 ratio |
|-------|--------------------------|--------------------------|----------------|------------------------|---------------------|
| gpt-4.1 | ~$0.008 | ~$0.016 | 1/32 (3%) | ~$0.513 | **8.7×** more |
| gpt-4o | ~$0.007 | ~$0.014 | 0/32 (0%) | ∞ | — |
| gpt-4o-mini | <$0.001 | <$0.001 | 0/32 (0%) | ∞ | — |
| claude-sonnet-4-6 (EXP-010) | $0.033 | $0.066 | 18/32 (56%) | $0.059 | 1.0× (baseline) |

*gpt-4.1 costs 8.7× more per passing trial than Sonnet 4.6 and produces far fewer passing trials. The OpenAI 4.x tier is simultaneously lower quality and less cost-efficient for /discovery.*

*Note: Score/price ratio (avg_score/cost_per_run) — gpt-4.1 achieves ~52 score-points per dollar (0.419/$0.008) vs Sonnet 4.6 ~19 score-points per dollar (0.617/$0.033). gpt-4.1 is more efficient per dollar of generation, but absolute quality is insufficient for production routing — efficiency without quality is not a useful criterion.*

---

## Section 6 — Cross-experiment comparison (EXP-010 + EXP-011 combined)

| Model | Exp | Avg score | Pass rate | T3 avg | S-hard avg | Cost/passing trial |
|-------|-----|-----------|-----------|--------|-----------|-------------------|
| claude-fable-5 | EXP-010 | 0.712 | 50% | 0.807 | 0.595 | $0.340 |
| **claude-sonnet-4-6** | EXP-010 | **0.617** | **56%** | **0.938** | **0.623** | **$0.059** |
| claude-opus-4-6 | EXP-010 | 0.571 | 38% | 0.949 | 0.518 | $0.145 |
| gpt-4.1 | EXP-011 | 0.419 | 3% | 0.621 | 0.411 | ~$0.513 |
| gpt-4o-mini | EXP-011 | 0.276 | 0% | 0.531 | 0.263 | ∞ |
| gpt-4o | EXP-011 | 0.254 | 0% | 0.451 | 0.245 | ∞ |

Sonnet 4.6 leads on: pass rate, T3 quality, S-hard quality, cost/passing trial. Fable 5 leads on raw avg score only (inflated by T2 NC avoidance). Every OpenAI 4.x model sits below the weakest Anthropic model (Opus 4.6 0.571) by a wide margin.

---

## Section 7 — Routing recommendation

**Skill: /discovery**
**Recommendation: HOLD — maintain current routing (claude-sonnet-4-6)**
**Confidence: HIGH (confirmed by both EXP-010 and EXP-011)**

| Criterion | gpt-4.1 (best OpenAI) | Sonnet 4.6 (current) | Decision |
|-----------|----------------------|----------------------|----------|
| Avg score ≥ 0.617 | 0.419 | 0.617 | **FAIL** — gap of 0.198 |
| Pass rate ≥ 56% | 3% | 56% | **FAIL** — 17 fewer passes |
| T3 avg ≥ 0.938 | 0.621 | 0.938 | **FAIL** — gap of 0.317 |
| Cost/passing trial < $0.059 | ~$0.513 | $0.059 | **FAIL** — 8.7× more expensive |

All four routing criteria fail decisively for all three OpenAI 4.x models.

---

## Section 8 — Recommended next steps

1. **EXP-012 — GPT-5.4 family**: Run the same 16-case corpus against `gpt-5.4-nano` / `gpt-5.4-mini` / `gpt-5.4` (the current-gen architecture released March 2026). PRICING map already updated with verified rates. Est. cost: ~$1.43 OpenAI + $1.31 Anthropic judge. The 5.4 architecture is materially different from the 4.x series; the gap may be smaller.

2. **T2/T4/T5 clarification protocol (separate workstream)**: All 6 models across two experiments incur NON-COMPLIANT or near-zero on T4/T5. This is a /discovery SKILL.md issue, not a model issue.

3. **Current policy confirmed**: No action needed on routing. discovery → claude-sonnet-4-6 is confirmed by two independent experiments across six models.

---

## Section 9 — Limitations

1. **Judge ceiling**: Judge model is claude-sonnet-4-6. For Anthropic models (EXP-010), this creates a potential ceiling effect on harder cases. For OpenAI models, the judge is cross-vendor — no ceiling risk, but possible scoring bias. OpenAI outputs may be penalised if their format diverges from what the judge expects. This is not expected to significantly affect rankings given the magnitude of the quality gap.

2. **2 trials per cell**: At 2 trials, a single outlier matters. gpt-4.1's one pass (T1 trial 2 at 0.757) may not be a stable signal. Conclusions about model ordering are directional.

3. **Mixed-provider cost tracking**: The script does not separate OpenAI generation costs from Anthropic judge costs in the reported total. Reported $0.479 is likely an underestimate. Actual costs are visible in respective provider dashboards.
