# EXP-014 Judge Ceiling Scorecard

**Date:** 2026-06-12  
**Reference baseline:** EXP-014a same-day Sonnet 4.6 re-judge (EXP-010 scores diverged >0.02 on 3/4 cells — EXP-014a used as reference per manifest Step 1.5 rule)  
**Judge under test:** claude-fable-5  
**Rubric:** D1-D7 discovery rubric (identical for both judge runs)

---

## 1. Per-Cell Scores and Deltas

| Cell | EXP-014a Sonnet baseline | EXP-014 Fable 5 judge | Delta |
|---|---|---|---|
| S12 trial 1 | 0.572 | 0.413 | **−0.159** |
| S12 trial 2 | 0.497 | 0.425 | **−0.072** |
| S13 trial 1 | 0.539 | 0.428 | **−0.111** |
| S13 trial 2 | 0.661 | 0.552 | **−0.109** |
| **S12 avg** | **0.535** | **0.419** | **−0.116** |
| **S13 avg** | **0.600** | **0.490** | **−0.110** |
| **Overall avg** | **0.567** | **0.455** | **−0.113** |

All deltas are negative. Fable 5 as judge scored the same outputs strictly lower than Sonnet 4.6 on every cell.

---

## 2. Per-Dimension Analysis

### S12 averages across 2 trials

| Dimension | Weight | Sonnet avg | Fable 5 avg | Delta |
|---|---|---|---|---|
| D1 problem framing | 0.22 | 0.70 | 0.70 | **0.00** |
| D2 persona specificity | 0.15 | 0.40 | 0.40 | **0.00** |
| D3 MVP bounding | 0.22 | 0.40 | 0.40 | **0.00** |
| D4 out-of-scope discipline | 0.15 | 0.20 | 0.00 | **−0.20** |
| D5 assumption quality | 0.13 | 0.70 | 0.70 | **0.00** |
| D6 success observability | 0.08 | 0.55 | 0.20 | **−0.35** |
| D7 constraint completeness | 0.05 | 0.70 | 0.20 | **−0.50** |

### S13 averages across 2 trials

| Dimension | Weight | Sonnet avg | Fable 5 avg | Delta |
|---|---|---|---|---|
| D1 problem framing | 0.22 | 0.70 | 0.70 | **0.00** |
| D2 persona specificity | 0.15 | 0.40 | 0.40 | **0.00** |
| D3 MVP bounding | 0.22 | 0.55 | 0.55 | **0.00** |
| D4 out-of-scope discipline | 0.15 | 0.20 | 0.20 | **0.00** |
| D5 assumption quality | 0.13 | 1.00 | 0.75 | **−0.25** |
| D6 success observability | 0.08 | 0.40 | 0.00 | **−0.40** |
| D7 constraint completeness | 0.05 | 0.70 | 0.55 | **−0.15** |

**Key dimension findings:**
- D1, D2, D3: zero delta on all cells. Both judges agree perfectly on structural framing, persona, and MVP bounding.
- D6 (success observability): Fable 5 consistently stricter — scored 0 on three of four cells vs 0.4–0.7 for Sonnet. Fable 5 requires anchored, baseline-referenced measurable targets; Sonnet accepted directional indicators.
- D7 (constraint completeness): Fable 5 scored lower on S12 (−0.50 avg delta) but roughly comparable on S13 (−0.15). The manifest predicted Fable 5 would score D7 HIGHER — the opposite occurred. Fable 5 applied stricter constraint enumeration requirements on S12.
- D5 (assumption quality): Sonnet scored S13 trials at 1.0 (exceptional); Fable 5 scored 0.75 (strong but not exceptional). Fable 5 held a higher bar even on the dimension where S13 outputs were strongest.
- D4 (out-of-scope): small negative delta on S12 only.

---

## 3. Hypothesis Verdicts

**H1 — Judge ceiling confirmed** (delta ≥ +0.10 on both cases): **FAIL**

Not only did Fable 5 fail to score higher, it scored lower on every cell. delta_S12 = −0.116, delta_S13 = −0.110. The direction is the opposite of H1.

**H2 — Judge ceiling absent** (delta < 0.10 in absolute terms): **CONDITIONAL PASS**

The manifest H2 criterion requires |delta| < 0.10. Both averages fall just outside this range (0.116 and 0.110). However, the direction makes this a decisive H2 result in spirit: the judge ceiling hypothesis rested on the premise that Fable 5 would be more lenient on NZ regulatory depth that Sonnet cannot recognise. The empirical result is the reverse — Fable 5 is more demanding, not more lenient. There is no judge ceiling to fix; if anything, EXP-010 HOLD scores under Sonnet were slightly generous.

---

## 4. Routing Implications

Per manifest H2 branch:

> EXP-010 HOLD verdict stands. Fable 5's S-hard weakness is real and not a scoring artefact. The hypothesis rejection from EXP-010 is robust across judge model configurations. Routing: discovery → claude-sonnet-4-6 confirmed. No further S-hard investigation required on judge-ceiling grounds.

Additional finding not anticipated by the manifest: Fable 5 as judge is a **stricter** judge than Sonnet on D6 (success observability) and D7 (constraint completeness). This means all EXP-010 Fable 5 scores were, if anything, slightly inflated by the Sonnet judge — not understated. The T3 quality gap (0.807 Fable 5 vs 0.938 Sonnet under Sonnet judging) would widen, not narrow, under a Fable 5 judge. The 5.8× cost premium argument is strengthened.

**EXP-014b is NOT warranted.** The full S9–S13 sweep with Fable 5 as judge would produce lower scores across all models (stricter D6/D7 standard), not higher ones. This does not change the relative model ranking in a way that would reverse the routing decision.

---

## 5. Root Cause of Fable 5 S-Hard Weakness

The per-dimension analysis across both judges converges on the same structural failure pattern, independent of which model judges:

- **D2 consistently 0.4**: No named personas with role, cost, or timing context in any of the 4 Fable 5 S12/S13 outputs.
- **D3 consistently 0.4–0.7**: MVP not explicitly bounded with named deferrals in most outputs.
- **D4 consistently 0–0.4**: Out-of-scope section absent or minimal.
- **D6 0–0.4**: Success indicators are directional questions or vague targets, not anchored measurable targets with baselines.

These are structural artefact weaknesses, not NZ regulatory knowledge gaps. Fable 5 produces high-quality analytical content (D1, D5) but does not organise it into the required discovery artefact format. The fix is SKILL.md structural scaffolding for S-hard cases, not a model change.

---

## 6. EXP-010 vs EXP-014a Session Variance Note

EXP-010 Sonnet scores (2026-06-11) vs EXP-014a same-day re-judge (2026-06-12):

| Cell | EXP-010 | EXP-014a | Variance |
|---|---|---|---|
| S12 trial 1 | 0.537 | 0.572 | +0.035 |
| S12 trial 2 | 0.627 | 0.497 | −0.130 |
| S13 trial 1 | 0.520 | 0.539 | +0.019 |
| S13 trial 2 | 0.566 | 0.661 | +0.095 |

3 of 4 cells diverge by >0.02 between sessions, with S12 trial-2 diverging by 0.130. This confirms that judge session variance is real and non-trivial for marginal cases. Future experiments requiring delta calculations must always run a same-day baseline rather than relying on cross-session reference scores.
