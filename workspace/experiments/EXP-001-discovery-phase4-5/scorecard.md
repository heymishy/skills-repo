# EXP-001-discovery-phase4-5 — Final Scorecard

**Compiled:** 2026-05-12
**Judge model:** claude-sonnet-4-6 (locked per EVAL.md)
**Experiment:** Comparative model evaluation — `/discovery` skill — claude-sonnet-4-6 vs claude-opus-4-6

---

## Verdict table (10-cell, 5 cases × 2 models)

| Case | Type | Sonnet score | Sonnet pass | Sonnet compliant | Opus score | Opus pass | Opus compliant | Winner |
|------|------|-------------|-------------|-----------------|------------|-----------|----------------|--------|
| T1 — Green path (payment retry) | Structured domain input | **0.865** | ✅ | ✅ | **0.910** | ✅ | ✅ | Opus (+0.045) |
| T2 — Ambiguous input (onboarding) | Clarification case | N/A | ✅ | ✅ | N/A | ✅ | ✅ | Tie |
| T3 — AML threshold alerts | Solution masquerades as problem | **0.787** †| ✅ | ✅ | **0.895** †| ✅ | ✅ | Opus (+0.108) |
| T4 — "Make the API faster" | Adversarially thin | N/A | ✅ | ✅ | N/A | ✅ | ✅ | Tie |
| T5 — Note-taking app | Hidden enterprise constraints | **0.49** | ❌ | ❌ | **0.49** | ❌ | ❌ | Tie (both fail) |

† T3 scored from Pass 1 artefact only — Pass 2 (Finacle follow-up answers) was not collected in this session.

---

## Dimension-level breakdown

### T1 — Green path

| Dimension | Weight | Sonnet | Opus | Delta |
|-----------|--------|--------|------|-------|
| D1 Problem framing | 0.22 | 1.0 | 1.0 | 0 |
| D2 Persona specificity | 0.15 | 0.7 | 1.0 | +0.3 Opus |
| D3 MVP bounding | 0.22 | 0.7 | 0.7 | 0 |
| D4 Out-of-scope discipline | 0.15 | 1.0 | 1.0 | 0 |
| D5 Assumption quality | 0.13 | 1.0 | 1.0 | 0 |
| D6 Success observability | 0.08 | 0.7 | 0.7 | 0 |
| D7 Constraint completeness | 0.05 | 1.0 | 1.0 | 0 |
| **Weighted total** | | **0.865** | **0.910** | **+0.045** |

**T1 differentiator:** Opus D2=1.0 — includes all 4 personas (ops engineers, merchants, end cardholders, **finance/reconciliation team**). Sonnet D2=0.7 — missing finance/reconciliation team. Opus also adds a novel D5 insight: "the success rate of a retry has NOT been measured" and "hidden manual-triage value risk — the manual shift may be catching fraud signals beyond retryable failures."

### T3 — AML threshold alerts (Pass 1 only)

| Dimension | Weight | Sonnet | Opus | Delta |
|-----------|--------|--------|------|-------|
| D1 Problem framing | 0.22 | 0.7 | 0.7 | 0 |
| D2 Persona specificity | 0.15 | 0.7 | 1.0 | +0.3 Opus |
| D3 MVP bounding | 0.22 | 1.0 | 1.0 | 0 |
| D4 Out-of-scope discipline | 0.15 | 1.0 | 1.0 | 0 |
| D5 Assumption quality | 0.13 | 0.4 | 0.7 | +0.3 Opus |
| D6 Success observability | 0.08 | 0.7 | 1.0 | +0.3 Opus |
| D7 Constraint completeness | 0.05 | 1.0 | 1.0 | 0 |
| **Weighted total** | | **0.787** | **0.895** | **+0.108** |

**T3 differentiators:**
- D2: Opus names MLRO (Money Laundering Reporting Officer) with SYSC 6.3 accountability; Sonnet has 5 personas but weaker role specificity.
- D5: Opus acknowledges "product-specific lower thresholds may apply" and names "aggregation and structuring rules" explicitly in OOS — closer to the structuring risk the corpus checks for. Sonnet treats £10K as the regulatory floor with no structuring mention.
- D6: Opus has "detection lag median drops from 18+ hours to under 5 minutes; p99 stays inside regulator-implied 'prompt' window" — baseline + target + statistical precision. Sonnet has specific targets but no p99.
- D7 (both 1.0): Opus cites MLR 2017 in the **problem statement** (not just constraints), which is a stronger placement.

**4-signal regulatory check (T3-Opus, Pass 1):**

| Signal | Present? | Evidence |
|--------|---------|---------|
| MLR 2017 citation | ✅ | Problem statement: "reportable control failure under the Money Laundering Regulations 2017" |
| SAR filing obligation named explicitly | ✅ | Persona: "files SARs to the National Crime Agency (NCA) within statutory windows" |
| Structuring risk as a named assumption | ❌ | Named in OOS context as "aggregation and structuring rules" — not surfaced as D5 assumption |
| Finacle batch lag surfaced | N/A | Finacle information not provided in Pass 1; Pass 2 not collected |

**Key T3 observation:** Opus assumption 1 ("core-banking event stream emits a settlement event reliably within seconds of posting") is precisely the assumption that the Finacle nightly batch revelation would violate if Pass 2 had been run. Opus is primed for the structural revelation; it has set itself up to correctly reframe in Pass 2. Whether it does is unresolved — Pass 2 not collected.

### T5 — Hidden enterprise constraints

| Dimension | Weight | Sonnet | Opus | Delta |
|-----------|--------|--------|------|-------|
| D1 Problem framing | 0.22 | 0.4 | 0.4 | 0 |
| D2 Persona specificity | 0.15 | 0.7 | 0.7 | 0 |
| D3 MVP bounding | 0.22 | **0.0** | **0.0** | 0 |
| D4 Out-of-scope discipline | 0.15 | 1.0 | 1.0 | 0 |
| D5 Assumption quality | 0.13 | 0.7 | 0.7 | 0 |
| D6 Success observability | 0.08 | 0.7 | 0.7 | 0 |
| D7 Constraint completeness | 0.05 | **0.0** | **0.0** | 0 |
| **Weighted total** | | **0.49** | **0.49** | **0** |

**T5 note:** Both models fail identically. Both produced a full feature-list artefact without surfacing enterprise constraints. Sonnet's artefact is technically stronger (6 vs 5 OOS items, time-bound success indicators, no [Assumption] markers, confident prose tone) but fails on identical categorical grounds. Opus's use of [Assumption] markers was epistemically closer to T5's expected probing behaviour even though neither artefact passed. Both read `context.yml meta.regulated: false` and closed the enterprise-context inquiry.

---

## Hypothesis assessment

**Hypothesis:** "claude-opus-4-6 will produce higher-quality discovery artefacts on complex and ambiguous inputs (T2, T3, T5) while both models will perform similarly on structured inputs (T1) and thin adversarial inputs (T4)."

| Sub-claim | Result | Evidence |
|-----------|--------|---------|
| Opus better on complex inputs (T2, T3, T5) | PARTIAL | T3: confirmed (+0.108); T5: not confirmed (identical fail); T2: categorical tie |
| Both models similar on T1 (structured) | NOT CONFIRMED | Opus beats Sonnet on T1 too (+0.045) — Opus D2 advantage applies to all cases |
| Both models similar on T4 (thin adversarial) | CONFIRMED | Both categorical PASS |

**Revised conclusion:** Opus is consistently stronger than Sonnet across all scored cases (T1, T3). The advantage is largest on T3 (complex, regulatory, AML context). The hypothesis was partially correct: Opus is better on complex inputs, but it is also better on structured inputs. The T5 failure is not a model differentiation finding — both models fail T5 in batch bypass mode.

---

## Structural finding: T5 evaluation design confound

**Finding:** The batch bypass instruction (`"Produce the complete discovery artefact in one pass without stopping for operator confirmation"`) directly conflicts with T5's evaluation criterion. T5 tests whether the model RESISTS one-pass feature-list generation in favour of asking enterprise-context questions. The batch bypass instruction forces both models to produce artefacts, guaranteeing the T5 categorical fail pattern regardless of model capability.

**Implication:** T5 scores from run-3b cannot be used to assess model capability for enterprise constraint proactivity. T5 needs a different evaluation protocol — either:
1. No batch bypass instruction (test whether the model voluntarily asks questions)
2. A two-turn protocol: first turn = operator sends input without bypass; second turn = if model asks Qs, provide context; score on whether the artefact AFTER the context answers passes T5

T1, T2, T3, T4 batch bypass does NOT create this confound — those tests are about artefact quality (T1), not about whether to produce an artefact at all (T5).

---

## Metadata defect pattern

All **claude-opus-4-6 run-3b files** have `model_label: claude-sonnet-4-6` in the capture block. This is a systematic metadata defect — the instrument captures whatever `context.yml` says the experiment model is, and the context file was not updated for Opus runs. Affects: T1-opus-run-3b, T3-opus-run-3b, T5-opus-run-3b (confirmed). Does not affect scoring validity — model identity was clear from the run file header. Recommend fixing the capture block template or the batch evaluation procedure to use the actual model run for `model_label`.

---

## Pass/fail summary

| | Sonnet | Opus |
|--|--------|------|
| T1 PASS | ✅ | ✅ |
| T2 PASS (categorical) | ✅ | ✅ |
| T3 PASS | ✅ | ✅ |
| T4 PASS (categorical) | ✅ | ✅ |
| T5 PASS | ❌ | ❌ |
| **Cases passed** | **4/5** | **4/5** |
| **Overall PASS rate** | 80% | 80% |

---

## Recommendations

1. **T5 re-run without batch bypass** — the current T5 scores are a protocol artefact, not a model quality signal. Run T5 without the batch bypass instruction to get the real enterprise-context proactivity measurement.

2. **T3 Pass 2 collection** — the Finacle structural revelation (nightly batch → cannot fix detection lag with alerting layer alone) is the highest-value signal in T3. Both models produced good Pass 1 artefacts; the differentiating question is whether they identify the architecture problem in Pass 2. This should be collected before finalising T3 scores.

3. **Opus for regulated/complex discovery** — for discovery sessions involving regulatory context, multiple personas with accountability roles, or complex domain assumptions, Opus produces materially better artefacts (+0.108 on T3, +0.045 on T1). The gap is primarily in D2 (persona specificity) and D5 (assumption quality with genuine uncertainties) and D6 (success observability with statistical precision).

4. **Fix capture block model_label** — the batch evaluation procedure should use the actual model name in the run file, not the context.yml default. All Opus run-3b files have mislabelled capture blocks.
