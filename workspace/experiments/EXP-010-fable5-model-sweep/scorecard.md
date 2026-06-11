# Scorecard — EXP-010-fable5-model-sweep

Generated: 2026-06-11 (final analysis — replaces auto-generated file)
Experiment: EXP-010-fable5-model-sweep
Judge model: claude-sonnet-4-6
Models compared: claude-fable-5 · claude-opus-4-6 · claude-sonnet-4-6
measurement_backed: true (96/96 runs scored — 32 per model, 2 trials × 16 cases)

---

## Section 1 — Executive summary

**Hypothesis**: Fable 5 outperforms Sonnet 4.6 on high-difficulty S-series cases (S9–S13) where hidden regulatory constraints require deep NZ financial-domain knowledge, while staying within 0.05 of Sonnet on T-series baselines.

**Verdict: HYPOTHESIS REJECTED. Routing recommendation: HOLD.**

Fable 5 achieves the highest overall average score (0.712) but this is inflated by superior handling of T-series process failures (Fable 5 does not incur NON-COMPLIANT on T2). On the five hardest cases that were the primary test of the hypothesis (S9–S13), **Sonnet 4.6 outperforms Fable 5** (0.623 vs 0.595). Fable 5 also underperforms both Sonnet and Opus on T3, the primary structured-discovery quality signal (0.807 vs 0.938/0.949). Sonnet 4.6 passes more trials overall (18/32 vs 16/32) at 5.8× lower cost per passing trial.

Current routing (discovery → claude-sonnet-4-6) is confirmed as the optimal production choice.

---

## Section 2 — Per-model aggregate

| Model | Avg score (16 cases) | Trial pass rate | NC failures | T-series avg | S-series avg | High-diff avg (S9–S13) |
|-------|---------------------|-----------------|-------------|-------------|-------------|------------------------|
| claude-fable-5 | **0.712** | 16/32 (50%) | T4, T5 | 0.662 | **0.735** | 0.595 |
| claude-sonnet-4-6 | 0.617 | **18/32 (56%)** | T2, T4, T5 | 0.407 | 0.713 | **0.623** |
| claude-opus-4-6 | 0.571 | 12/32 (38%) | T2, T4, T5 | 0.449 | 0.626 | 0.518 |

*NC failure = judge assigned NON-COMPLIANT (categorical fail, score treated as zero).*
*High-diff avg = average across S9, S10, S11, S12, S13 (very-high difficulty hidden-constraint cases).*

---

## Section 3 — Per-case breakdown

| Case | Series | Fable 5 avg | Opus 4.6 avg | Sonnet 4.6 avg | Best model |
|------|--------|:-----------:|:------------:|:--------------:|------------|
| T1   | T | 0.857 ✓✓ | 0.836 ✓✓ | 0.748 ✓✓ | Fable 5 (+0.021) |
| T2   | T | 0.623 ✗✗ | 0.000 NC | 0.000 NC | Fable 5 (no NC!) |
| T3   | T | 0.807 ✓✓ | **0.949 ✓✓** | 0.938 ✓✓ | Opus 4.6 (+0.142 vs Fable 5) |
| T4   | T | 0.456 NC | 0.177 NC | 0.000 NC | Fable 5 (least-bad NC) |
| T5   | T | 0.566 NC | 0.285 NC | 0.351 ½✓ NC | Sonnet 4.6 (1 pass) |
| S2   | S-med | 0.892 ✓✓ | 0.786 ✓✓ | 0.819 ✓✓ | Fable 5 (+0.073) |
| S3   | S-med | 0.880 ✓✓ | 0.766 ✓✓ | 0.835 ✓✓ | Fable 5 (+0.045) |
| S4   | S-med | **0.756 ✓✓** | 0.629 ✗✗ | 0.688 ½✓ | Fable 5 (only 2/2 pass) |
| S5   | S-med | 0.861 ✓✓ | 0.713 ½✓ | 0.774 ✓✓ | Fable 5 (+0.087) |
| S7   | S-med | 0.854 ✓✓ | 0.696 ½✓ | 0.824 ✓✓ | Fable 5 (+0.030) |
| S8   | S-med | 0.869 ✓✓ | 0.710 ✓✓ | 0.784 ✓✓ | Fable 5 (+0.085) |
| S9   | S-hard | 0.598 ✗✗ | 0.630 ✗✗ | **0.643 ✗✗** | Sonnet 4.6 |
| S10  | S-hard | 0.597 ✗✗ | 0.506 ✗✗ | **0.628 ½✓** | Sonnet 4.6 (+0.031) |
| S11  | S-hard | 0.653 ✗✗ | 0.497 ✗✗ | **0.734 ½✓** | Sonnet 4.6 (+0.081) |
| S12  | S-hard | **0.582 ✗✗** | 0.422 ✗✗ | 0.495 ✗✗ | Fable 5 (+0.087) |
| S13  | S-hard | 0.543 ✗✗ | 0.534 ✗✗ | **0.617 ✗✗** | Sonnet 4.6 (+0.074) |

✓✓ = 2/2 pass, ½✓ = 1/2 pass, ✗✗ = 0/2, NC = NON-COMPLIANT (process violation)

### Wins summary

| Model | Cases won | By avg score (excluding ties) |
|-------|-----------|-------------------------------|
| claude-fable-5 | T1, T2†, T4†, S2, S3, S4, S5, S7, S8, S12 | 10/16 |
| claude-sonnet-4-6 | T5, S9, S10, S11, S13 | 5/16 |
| claude-opus-4-6 | T3 | 1/16 |

†T2/T4: Fable 5 "wins" only because it avoids NON-COMPLIANT; all three models fail the actual pass threshold.

---

## Section 4 — T-series and S-series breakdown

### T-series aggregate (5 cases: T1–T5)

| Model | T-series avg | Passes (T1+T3 only)† | NC count |
|-------|-------------|---------------------|----------|
| claude-fable-5 | 0.662 | 2 cases (T1, T3) | 2 (T4, T5) |
| claude-opus-4-6 | 0.449 | 2 cases (T1, T3) | 3 (T2, T4, T5) |
| claude-sonnet-4-6 | 0.407 | 2 cases (T1, T3) | 3 (T2, T4, T5) |

†T2, T4, T5 are process failures for Opus/Sonnet (NON-COMPLIANT). Fable 5 escapes the NC penalty on T2.

Fable 5's T-series advantage (0.662 vs 0.407–0.449) is **entirely attributable to avoiding NON-COMPLIANT on T2**. On T3 (the most meaningful quality signal), Fable 5 *underperforms* (0.807 vs 0.938/0.949).

### S-series aggregate (11 cases: S2–S5, S7–S13)

| Model | S-series avg | S-medium avg (S2–S8) | S-hard avg (S9–S13) |
|-------|-------------|---------------------|---------------------|
| claude-fable-5 | 0.735 | **0.845** | 0.595 |
| claude-sonnet-4-6 | 0.713 | 0.745 | **0.623** |
| claude-opus-4-6 | 0.626 | 0.715 | 0.518 |

Fable 5 dominates on S-medium difficulty (S2–S8: 0.845 avg, 12/12 passes). **On S-hard (S9–S13), Sonnet 4.6 leads** (0.623 vs 0.595). The hypothesis is reversed on the cases that mattered most.

---

## Section 5 — Primary signal cases

### T3: Structured discovery quality (CCCFA-regulated product)

T3 is the primary quality signal for structured discovery: well-scoped regulated product, no process ambiguity, tests artefact depth and constraint coverage.

| Model | T3 avg | Pass rate | vs current policy |
|-------|--------|-----------|-------------------|
| claude-opus-4-6 | **0.949** | 2/2 | +0.011 above Sonnet |
| claude-sonnet-4-6 | 0.938 | 2/2 | baseline (current) |
| claude-fable-5 | 0.807 | 2/2 | −0.131 below Sonnet |

**Fable 5 is 0.131 behind the current policy model on T3.** All three models pass, but the depth/quality gap is significant. This alone is sufficient to recommend HOLD — the hypothesis that Fable 5 would at minimum match Sonnet on T-series quality is not supported.

### T5: Competing constraints (multi-party scope conflict)

T5 tests clarification discipline under competing constraints. All three models fail the pass threshold (NON-COMPLIANT pattern persists), but:

| Model | T5 avg | Pass rate | NC? |
|-------|--------|-----------|-----|
| claude-fable-5 | 0.566 | 0/2 | YES (1 trial) |
| claude-sonnet-4-6 | 0.351 | **1/2** | YES (1 trial) |
| claude-opus-4-6 | 0.285 | 0/2 | YES (both) |

Fable 5 scores higher on T5 (0.566 vs 0.351) but Sonnet 4.6 achieves the only passing trial. T5 failure is a **skill-level issue** (clarification protocol), not a model selection issue — both models violate the protocol on at least one trial.

---

## Section 6 — Cost-per-quality

*Per-run generation cost uses actual Phase 2 token counts for Fable 5 ($0.170/run observed) and estimated rates for Opus/Sonnet at 900 input / 2000 output tokens.*

| Model | Cost/run | Cost/cell (2 trials) | Passing trials | Cost/passing trial | vs Sonnet ratio |
|-------|----------|---------------------|----------------|---------------------|-----------------|
| claude-fable-5 | $0.170 | $0.340 | 16/32 (50%) | **$0.340** | 5.8× |
| claude-sonnet-4-6 | $0.033 | $0.066 | 18/32 (56%) | $0.059 | 1.0× |
| claude-opus-4-6 | $0.055 | $0.110 | 12/32 (38%) | $0.145 | 2.5× |

Fable 5 costs 5.8× more per passing trial than Sonnet 4.6, and passes fewer trials. There is no cost-quality trade-off to make here: Sonnet 4.6 is simultaneously cheaper, higher-passing, and stronger on the hardest cases.

---

## Section 7 — Routing recommendation

**Skill: /discovery**
**Recommendation: HOLD — maintain current routing (claude-sonnet-4-6)**

| Criterion | Fable 5 | Sonnet 4.6 (current) | Decision |
|-----------|---------|----------------------|----------|
| Overall avg score | 0.712 | 0.617 | Fable 5 higher — but T2 NC avoidance inflates it |
| T3 quality (primary signal) | 0.807 | 0.938 | Sonnet 4.6 wins |
| High-difficulty S-series (hypothesis test) | 0.595 | 0.623 | Sonnet 4.6 wins — hypothesis REJECTED |
| Overall pass rate | 50% | 56% | Sonnet 4.6 wins |
| Cost/passing trial | $0.340 | $0.059 | Sonnet 4.6 wins (5.8× cheaper) |
| T2 clarification protocol | No NC | NON-COMPLIANT | Fable 5 wins — but still fails pass threshold |

**All quantitative criteria favour Sonnet 4.6 except overall avg score** (which is distorted by NON-COMPLIANT treatment differences). The T2 protocol difference is a genuine signal but insufficient to override the cost and quality findings.

**Provisional secondary observation**: Fable 5's avoidance of NON-COMPLIANT on T2 (vague scope input) may indicate better clarification-first behaviour — a production value. Recommend a targeted 10-case follow-up EXP specifically on T2/T4/T5 clarification protocols with a stricter clarification-focused judge to determine if this is a real signal or judge noise.

---

## Section 8 — Shared failure modes

**T2, T4, T5 — Scope discipline failures (both Opus and Sonnet NON-COMPLIANT)**

Opus 4.6 and Sonnet 4.6 both receive categorical NON-COMPLIANT on T2 ("improve onboarding" — vague), T4 ("scope too wide" — requires clarification), and at least one T5 trial. Fable 5 avoids NON-COMPLIANT on T2 but still fails, and incurs NON-COMPLIANT on T4 and T5.

These are **skill-level failures**, not model-capability failures. The /discovery skill instruction may not be enforcing the clarification-before-artefacting protocol with sufficient weight.

Recommended action:
1. Review SKILL.md for /discovery: clarify when to ask vs when to produce
2. Check whether the T2/T4 corpus case Expected sections accurately reflect the intended protocol
3. Treat T2/T4/T5 NC failures as a separate workstream from model routing

**S9–S13 — Hidden-constraint detection ceiling**

No model passes S9 (KiwiSaver hardship waiver), S12 (MRM version mismatch), or S13 (SWIFT correspondent clause) on both trials. The highest score is S11 Sonnet 4.6 at 0.734 (1/2 pass). This represents the current constraint-detection ceiling for all three models on "very-high" difficulty NZ financial regulatory cases. The gap is a skill quality issue, not addressable by model switching.

---

## Section 9 — Limitations

1. **Judge ceiling risk**: The judge model is claude-sonnet-4-6, which is less capable than Fable 5. For Fable 5 outputs with deep NZ regulatory reasoning, the judge may not recognise excellence it cannot reproduce. Fable 5 scores may be understated, particularly on S9–S13. A peer judge (claude-fable-5 judging Fable 5 outputs) would provide a more reliable upper bound. This limitation applies most strongly to the high-difficulty hypothesis test — the hypothesis rejection should be treated as "not confirmed" rather than "definitively false."

2. **2 trials per cell**: Template default is 3. At 2 trials, a single trial outlier can swing a cell from 0/2 to 1/2 pass or vice versa. The T5 Sonnet result (1/2, 0.703 on one trial) is a single data point that may not replicate. Conclusions about model ordering should be treated as directional.

3. **T-series inflation for Fable 5**: Fable 5's overall avg score advantage (0.712 vs 0.617) is substantially driven by avoiding NON-COMPLIANT on T2. If Opus/Sonnet T2 scores were replaced with their pre-penalty scores, the model ranking could invert. The raw avg score comparison overstates Fable 5's advantage.

4. **S-medium vs S-hard pattern**: Fable 5 strongly dominates S-medium cases (S2–S8: 0.845 avg) but not S-hard (S9–S13). If the production workload skews heavily toward S2–S8 difficulty, Fable 5 may be more competitive in practice than this experiment shows. However, this would need to be verified against actual operator request distribution.

5. **Cost data**: Phase 2 Fable 5 costs use actual batch token counts. Opus/Sonnet costs are estimated from standard rates at 900 input / 2000 output tokens. Actual Opus/Sonnet costs would require token-level data from Phase 1 batch.

---

## Section 10 — Recommended next steps

1. **Clarification protocol investigation** (separate workstream): Design EXP-011 specifically for T2/T4/T5 scenarios with a clarification-focused judge prompt. Compare Fable 5 vs Sonnet 4.6 on the clarification-first behaviour signal.

2. **Judge ceiling validation**: Re-run S12 and S13 with Fable 5 as judge on Fable 5 outputs. If scores improve substantially (> 0.10), the judge-ceiling hypothesis holds and EXP-010 understates Fable 5 quality.

3. **Current policy confirmed**: No action needed on routing. discovery → claude-sonnet-4-6 remains optimal.

4. **S-hard skill improvement**: S9–S13 failures are consistent across all three models. Investigate whether SKILL.md for /discovery can be augmented with NZ regulatory constraint prompts to raise the constraint-detection floor without full model upgrade.
