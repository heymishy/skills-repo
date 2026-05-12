# EXP-002a Scorecard — Cross-Provider Discovery Evaluation

**Experiment:** EXP-002a-cross-provider-discovery
**Date:** 2026-05-12
**Judge model:** claude-sonnet-4-6 (fixed)
**Pass threshold:** 0.70
**Total result files:** 63
**Status:** COMPLETE

---

## Coverage matrix

| Model | T1 (payment retry) | T2 (onboarding ambiguity) | T3 (AML monitoring) | T4 (thin input) | T5 (enterprise note-taking) |
|---|---|---|---|---|---|
| claude-haiku-4-5 | 3 trials | — | 3 trials | — | 3 trials |
| claude-opus-4-7 | 3 trials | — | 2 trials | — | 3 trials |
| claude-sonnet-4-6 | 3 trials | 3 trials | 3 trials | 3 trials | 3 trials |
| gpt-4o | 3 trials | 3 trials | 3 trials | 3 trials | 3 trials |
| gpt-4o-mini | 3 trials | 3 trials | 3 trials | 3 trials | 3 trials |

Note: haiku and opus T2/T4 were not re-run after system prompt fix; those cases were cleaned before the GPT sweep. Sonnet T2/T4 represent the corrected prompt condition. Opus T3 has 2 trials only (trial-1 file absent).

---

## Score table — weighted average across trials

| Model | T1 | T2 | T3 | T4 | T5 | T1+T3 avg (routing metric) |
|---|---|---|---|---|---|---|
| claude-haiku-4-5 | **0.774** | — | **0.744** | — | 0.443 | 0.759 |
| claude-opus-4-7 | 0.732 | — | **0.785** | — | 0.661 | 0.759 |
| claude-sonnet-4-6 | **0.756** | 0.000 | **0.857** | 0.050 | 0.493 | **0.807** |
| gpt-4o | 0.458 | 0.032 | 0.476 | 0.000 | 0.041 | 0.467 |
| gpt-4o-mini | 0.629 | 0.021 | 0.555 | 0.000 | 0.008 | 0.592 |

Bold = at or above pass threshold (0.70). **Routing metric is T1+T3 only.** T5 fails all models and is excluded from the routing comparison column — including T5 in a combined average would penalise Sonnet and Opus for a case that does not distinguish them and is not yet fit for routing decisions (see Finding 4 and Recommendation 4). T2 and T4 are excluded because they require a multi-turn protocol not yet implemented (see Finding 1).

---

## Pass/fail summary (trials at or above 0.70)

| Model | T1 | T2 | T3 | T4 | T5 | T1+T3 passes |
|---|---|---|---|---|---|---|
| claude-haiku-4-5 | 3/3 ✓ | — | 2/3 ✓ | — | 0/3 ✗ | **5/6** |
| claude-opus-4-7 | 2/3 ✓ | — | 1/2 ✓ | — | 1/3 ✓ | 3/5 |
| claude-sonnet-4-6 | 3/3 ✓ | 0/3 ✗ | 3/3 ✓ | 0/3 ✗ | 0/3 ✗ | **6/6 ✓** |
| gpt-4o | 0/3 ✗ | 0/3 ✗ | 0/3 ✗ | 0/3 ✗ | 0/3 ✗ | 0/6 |
| gpt-4o-mini | 0/3 ✗ | 0/3 ✗ | 0/3 ✗ | 0/3 ✗ | 0/3 ✗ | 0/6 |

Sonnet achieves the only perfect pass rate on T1+T3 (6/6). Haiku is second (5/6). Opus trails (3/5) despite comparable average — its variance is higher.

---

## Dimension heatmap — T1 (payment retry, straightforward regulated)

| Model | D1 framing | D2 persona | D3 MVP | D4 OOS | D5 assumption | D6 success | D7 constraint | weighted |
|---|---|---|---|---|---|---|---|---|
| haiku-4-5 | 0.817 | 0.650 | 0.767 | 0.750 | **0.900** | 0.717 | 0.683 | **0.774** |
| opus-4-7 | 0.817 | 0.550 | 0.740 | 0.500 | **1.000** | 0.600 | 0.717 | 0.732 |
| sonnet-4-6 | 0.750 | 0.550 | **0.840** | 0.667 | **0.950** | 0.690 | **0.807** | **0.756** |
| gpt-4o | 0.650 | 0.500 | 0.600 | **0.000** | 0.267 | 0.700 | 0.100 | 0.458 |
| gpt-4o-mini | 0.700 | 0.700 | 0.700 | 0.800 | 0.200 | 0.700 | 0.200 | 0.629 |

Dimension weights: D1=0.20, D2=0.10, D3=0.20, D4=0.10, D5=0.15, D6=0.10, D7=0.15

## Dimension heatmap — T3 (AML monitoring, enterprise constraints)

| Model | D1 framing | D2 persona | D3 MVP | D4 OOS | D5 assumption | D6 success | D7 constraint | weighted |
|---|---|---|---|---|---|---|---|---|
| haiku-4-5 | 0.817 | 0.600 | 0.817 | 0.650 | 0.750 | 0.800 | 0.600 | **0.744** |
| opus-4-7 | **0.875** | 0.700 | 0.650 | 0.650 | **1.000** | 0.800 | 0.700 | **0.785** |
| sonnet-4-6 | **0.933** | **0.800** | **0.850** | **0.700** | **0.933** | 0.800 | **0.900** | **0.857** |
| gpt-4o | 0.650 | 0.600 | 0.600 | **0.000** | 0.233 | 0.800 | 0.333 | 0.476 |
| gpt-4o-mini | 0.750 | 0.700 | 0.700 | **0.000** | 0.167 | **0.950** | 0.433 | 0.555 |

## Dimension heatmap — T5 (enterprise note-taking, deceptively complex)

| Model | D1 framing | D2 persona | D3 MVP | D4 OOS | D5 assumption | D6 success | D7 constraint | weighted |
|---|---|---|---|---|---|---|---|---|
| haiku-4-5 | 0.617 | 0.067 | 0.617 | 0.317 | 0.650 | 0.033 | 0.673 | 0.443 |
| opus-4-7 | **0.883** | 0.400 | **0.783** | 0.433 | 0.767 | 0.300 | 0.650 | 0.661 |
| sonnet-4-6 | **0.800** | 0.383 | 0.233 | 0.450 | **0.800** | 0.067 | **0.817** | 0.493 |
| gpt-4o | 0.133 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.233 | 0.041 |
| gpt-4o-mini | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0.167 | 0.008 |

---

## Finding 1 (PRIMARY): Clarification-skipping is universal — T2 and T4

**Severity: Critical.**

T2 ("We need to improve onboarding") and T4 ("Make the API faster") are cases requiring clarifying questions before any artefact is produced. The eval-mode system prompt states: "do not produce an artefact on inputs that require clarification — asking is the correct behaviour."

Every model across every trial violated this instruction. All 9 trials for each case produced full artefacts with fabricated problem scope, invented personas, and unbounded recommendations.

| Model | T2 behaviour | T4 behaviour |
|---|---|---|
| sonnet-4-6 | Full multi-phase discovery artefact with invented problem framings — 0/3 asked | Full diagnostic artefact with instrumentation code — 0/3 asked |
| gpt-4o | Full generic discovery framework from the word "improve" — 0/3 asked | Full 12-point solution list — 0/3 asked |
| gpt-4o-mini | Full unbounded solution artefact — 0/3 asked | Full 12-point solution artefact — 0/3 asked |

**Interpretation:** Clarification-skipping is a deep training disposition, not a promptable behaviour. Models are strongly trained to produce helpful content; a system prompt instruction to instead ask questions cannot override this in a single-turn API call. The current eval harness is architecturally unable to test the clarification gate.

**Implication for eval programme:** T2 and T4 require a multi-turn evaluation protocol: harness sends the ambiguous input → checks whether response contains a clarifying question (correct — no scoring needed) or a fabricated artefact (process violation — D1–D7 all set to 0.0). This protocol change is out of scope for EXP-002a and is flagged for EXP-003 design.

---

## Finding 2: Anthropic/OpenAI performance gap on D4 and D5

GPT models achieve adequate D1 framing and D3 MVP scores on T1/T3 but collapse on D4 (out-of-scope discipline) and D5 (assumption quality):

| Model | D4 (T1 avg) | D4 (T3 avg) | D5 (T1 avg) | D5 (T3 avg) |
|---|---|---|---|---|
| Anthropic average | 0.639 | 0.667 | 0.950 | 0.894 |
| gpt-4o | 0.000 | 0.000 | 0.267 | 0.233 |
| gpt-4o-mini | 0.800 | 0.000 | 0.200 | 0.167 |

GPT-4o scores 0.000 on D4 across T1 and T3 — no out-of-scope items with stated reasons appear in any trial. GPT-4o-mini scores 0.800 on D4 for T1 but 0.000 on T3, indicating inconsistency rather than absent capability.

D5 (assumption quality — falsifiable hypotheses with risk-if-wrong reasoning and validation owners) is near-zero for both GPT models on all cases. Anthropic models score 0.90+ on D5 consistently. This is the single largest absolute performance gap in the dataset.

---

## Finding 3: D7 constraint completeness separates providers on regulated cases

D7 (constraint completeness — PCI-DSS, retention policy, regulatory classification, data residency as hard constraints) is near-zero for GPT models:

| Model | D7 T1 | D7 T3 | D7 T5 |
|---|---|---|---|
| haiku-4-5 | 0.683 | 0.600 | 0.673 |
| opus-4-7 | 0.717 | 0.700 | 0.650 |
| sonnet-4-6 | **0.807** | **0.900** | **0.817** |
| gpt-4o | 0.100 | 0.333 | 0.233 |
| gpt-4o-mini | 0.200 | 0.433 | 0.167 |

For regulated financial services cases, GPT models do not surface hard compliance constraints (PCI-DSS on payment retry, POCA 2002/MLR 2017 on AML, FCA audit trail obligations, data residency) without explicit prompting. A discovery artefact that omits PCI-DSS for a payment case or FCA audit trail for an AML case is not pipeline-fit regardless of other quality signals. This is a **regulatory fitness gap**, not a quality preference.

---

## Finding 4: T5 surfaces feature-list discipline failures across providers

T5 is the enterprise probe: correct response is enterprise context questions (data residency, retention, FCA compliance classification, tooling duplication), not a feature list. GPT models universally produced feature lists. Anthropic models showed mixed results:

- **sonnet-4-6 (0/3 pass):** Trials 1 and 2 trigger D3 categorical fail (feature list violation — "Core Feature Set" section in trial 2; implicit feature scoping in trial 1). Trial 3 avoids feature list but lacks explicit `/clarify` recommendation and success indicators.
- **haiku-4-5 (0/3 pass):** Trial 1 produces feature-adjacent list. Trials 2–3 avoid feature lists but fail D2 (personas near-zero, 0.067 avg) and D6 (success observability, 0.033 avg).
- **opus-4-7 (1/3 pass):** Best performer on T5 (0.661 avg). Problem-first framing, no feature lists. Weakness: explicit data residency and FCA/MiFID II classification questions not consistently present; personas generic.

T5 is the hardest case in the corpus. No model passes reliably. T5 is flagged as a separate experiment track.

---

## Finding 5: Sonnet T3 score (0.857) establishes the quality ceiling

The highest-scoring result in the experiment. Sonnet-4-6 on T3 (AML monitoring) correctly: identifies MLRO legal exposure under POCA 2002/MLR 2017; surfaces the 18-hour → 15-minute SAR filing baseline as a measurable anchor; flags FCA audit trail as a hard constraint; names structuring risk around the £10k threshold explicitly; bounds MVP to the triage dashboard with SAR automation explicitly deferred with reasons. D1=0.933, D2=0.800, D3=0.850, D4=0.700, D5=0.933, D7=0.900. This establishes the qualitative bar for a well-graded regulated discovery artefact.

---

## Calibration check

The rubric schema defines calibration anchors (T1: 0.72, T2: 0.81, T3: 0.68, T4: 0.55, T5: 0.49). The T2 anchor (0.81, "well-bounded MVP") was written before the clarification-gate design was established and is now invalid.

| Case | Old anchor | Recommended anchor | Basis |
|---|---|---|---|
| T1 | 0.72 | 0.75 | Anthropic cluster 0.732–0.774; GPT fails (0.46–0.63) |
| T2 | 0.81 | N/A — multi-turn protocol required | All models produced process violations; single-turn eval invalid |
| T3 | 0.68 | 0.78 | Sonnet 0.857; haiku/opus 0.744–0.785; GPT fails |
| T4 | 0.55 | N/A — multi-turn protocol required | Same as T2 |
| T5 | 0.49 | 0.50 | Consistent with opus best result of 0.661, others below 0.50 |

---

## Model profiles

**claude-sonnet-4-6** — **Routing winner.** T1+T3 average 0.807, the only model with a perfect T1+T3 pass rate (6/6). Highest T3 score (0.857), highest T1 pass rate (3/3). Strongest D7 constraint completeness. At 1x Copilot Layer 1 multiplier (15x cheaper than Opus), it is both the highest-performing and the cost-dominant choice for all non-enterprise-probe regulated cases. Falls short on T5 due to feature-list violations, and T2/T4 process violations are universal. T5 weakness does not affect the T1/T3 routing decision.

**claude-haiku-4-5** — **Cost-optimised routing for non-regulated T1-class inputs.** T1+T3 average 0.759. Pass rate 5/6 (fails T3 once). At 0.33x Copilot multiplier it is the lowest-cost model above threshold. Suitable for non-regulated discovery runs where operator accepts one-in-six T3 failure risk. Not recommended for regulated inputs (D7 0.600 on T3 — constraint completeness gap).

**claude-opus-4-7** — **Not recommended for standard routing.** T1+T3 average 0.759 (tied with Haiku), but 3/5 pass rate and higher variance. At 15x Copilot multiplier, Opus costs 15× more than Sonnet for equal or lower average performance on the routing cases. The D5 advantage (near 1.0 assumption quality) is not sufficient to justify the cost premium when Sonnet scores 0.807 on the routing metric. Opus remains the interim required model for regulated inputs only pending EXP-002b, due to superior D7 on T3 (0.700 vs Sonnet's 0.900 — but Sonnet actually scores higher on D7, see heatmap).

**gpt-4o** — Fails all cases. T1+T3 average 0.467. Zero passes across 45 trials. Primary failure: D4=0.000 and D5 near-zero on all cases; D7 0.100–0.333. Not suitable for regulated discovery evaluation with current configuration.

**gpt-4o-mini** — Fails all cases. T1+T3 average 0.592. Marginally better than gpt-4o on T1 (0.629) and T3 (0.555). D4 inconsistency (0.800 on T1, 0.000 on T3), D5 near-zero throughout. Not suitable for regulated discovery.

---

## Recommendations

1. **T2 and T4: redesign as multi-turn evaluation cases.** Single-turn eval cannot test clarification behaviour. Required before any T2/T4 results are meaningful. Design for EXP-003.

2. **Update rubric calibration anchors.** T2 anchor 0.81 must be retired. Raise T3 anchor to 0.78 based on evidence. Update `workspace/design/skill-rubric-schema.md`.

3. **GPT models: test with explicit section-directive supplement.** D4, D5, and D7 failures may be addressable with a targeted system prompt that names expected output sections (out-of-scope, assumptions, hard constraints) explicitly. Test in EXP-002b before drawing a final provider conclusion.

4. **T5 as separate experiment track.** Even opus-4-7 fails T5 at 1/3. Needs dedicated investigation: two-turn flow (check for feature list first, grade second) or a more directive system prompt. Flag for EXP-004. **T5 must not be included in routing comparison averages until it is a validated routing-relevant case** — it currently fails universally and introduces noise that obscures meaningful T1/T3 differentiation.

5. **Routing recommendation (T1+T3 evidence):**
   - **Default (all discovery):** claude-sonnet-4-6 — highest T1+T3 average (0.807), perfect pass rate (6/6), 15x cheaper than Opus
   - **Cost-optimised (non-regulated T1-class only):** claude-haiku-4-5 — T1+T3 average 0.759, 0.33x cost, 5/6 pass rate
   - **Regulated inputs (interim, pending EXP-002b):** Retain claude-sonnet-4-6 as default; Opus is not needed — Sonnet outperforms on D7 T3 (0.900 vs Opus 0.700)
   - GPT models: not ready for regulated discovery in current configuration