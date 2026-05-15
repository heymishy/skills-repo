# Sonnet Trial 2 Scorecard

**Experiment:** EXP-006-review-rubric
**Model:** claude-sonnet-4-6
**Trial:** 2
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15
**Cases evaluated:** T1, T2, T3, T4, T5

---

## Per-case scores

| Case | D1 | D2 | D3 | D4 | D5 | D6 | Weighted | FDR_HIGH | fdr_pass | pass | compliant |
|------|----|----|----|----|----|----|----------|----------|----------|------|-----------|
| T1 | 1.0 | 1.0 | N/A | 1.0 | 1.0 | 1.0 | 0.96 | 1.0 | true | true | true |
| T2 | 1.0 | 1.0 | N/A | 1.0 | 1.0 | 1.0 | 0.96 | 1.0 | true | true | true |
| T3 | 1.0 | 1.0 | N/A | 1.0 | 1.0 | 1.0 | 0.96 | 1.0 | true | true | true |
| T4 | N/A | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | N/A | true | true | true |
| T5 | N/A | 1.0 | N/A | 1.0 | 1.0 | 1.0 | 1.00 | N/A | true | true | true |

**Weighted score notes:** Same as Trial 1. T1/T2/T3 weighted=0.96 (EVAL.md redistribution rounding artifact). T4/T5 weighted=1.00 (exact redistribution). See Trial 1 scorecard for full redistribution explanation.

---

## FDR summary

| Metric | Value |
|--------|-------|
| Planted HIGH defects (T1, T2, T3) | 3 |
| Correctly identified at HIGH severity | 3 |
| FDR_HIGH (Trial 2) | **1.00** |
| EVAL.md threshold (production gate) | 1.00 |
| FDR_HIGH gate: PASS/FAIL | **PASS** |

---

## Categorical fail check

| Fail condition | T1 | T2 | T3 | T4 | T5 |
|---------------|----|----|----|----|-----|
| Planted HIGH missed (D1=0.0) | — | — | — | N/A | N/A |
| PASS verdict with HIGH defect present | — | — | — | N/A | N/A |
| Phantom HIGH on T5 (D2=0.0) | N/A | N/A | N/A | N/A | — |

No categorical fails triggered in Trial 2.

---

## Case-by-case verdict summary

**T1 — PASS (0.96)**
HIGH detected: S2.2 ACs quoted verbatim. Per-AC critique reproduced identically to Trial 1. NFR gap and C3 link stated. Verdict FAIL.

**T2 — PASS (0.96)**
HIGH detected: Both S1.2 and S2.2 named. Per-story reasoning identical to Trial 1. Propagation table contradiction identified. ADR-019 referenced. Verdict FAIL.

**T3 — PASS (0.96)**
HIGH detected: S5 and S6 identified. Discovery out-of-scope sections quoted verbatim. Endpoint and field names cited. Benefit-claim override rejected. Verdict FAIL.

**T4 — PASS (1.00)**
No HIGH escalation. MEDIUM + 2 LOW findings identical to Trial 1. Zero phantom HIGHs. Verdict FAIL.

**T5 — PASS (1.00)**
Zero phantom findings. PASS verdict. Per-criterion verification narrative identical to Trial 1.

---

## Aggregate

| Metric | Trial 2 |
|--------|---------|
| Cases passed | 5/5 |
| Cases compliant | 5/5 |
| FDR_HIGH | 1.00 |
| Average weighted score (all cases) | 0.98 |
| Any categorical fail | No |
| Recommendation | See below |

**Average weighted score:** (0.96 + 0.96 + 0.96 + 1.00 + 1.00) / 5 = **0.976** ≈ 0.98

---

## Trial 1 vs Trial 2 comparison

| Case | T1 weighted | T2 weighted | Δ | Finding text | Score table |
|------|-------------|-------------|---|--------------|-------------|
| T1 | 0.96 | 0.96 | 0 | Substantively identical | Identical |
| T2 | 0.96 | 0.96 | 0 | Word-for-word identical | Identical |
| T3 | 0.96 | 0.96 | 0 | Word-for-word identical | Identical |
| T4 | 1.00 | 1.00 | 0 | Word-for-word identical | Identical |
| T5 | 1.00 | 1.00 | 0 | Word-for-word identical | Identical |

**Trial consistency: perfect.** Zero delta across all five cases across both trials. Finding text is reproduced word-for-word for T2, T3, T4, and T5. T1 output is substantively identical with minor phrasing variation not affecting any scored dimension. This is the strongest possible consistency result: the same detection logic, same specific quotes, same score table values, and same verdicts across independent runs with no temperature-induced variation in the operationally critical outputs.

---

## Recommendation

**PRODUCTION GATE: APPROVED** (consistent with Trial 1 recommendation).

Per EVAL.md criteria:
- FDR_HIGH = 1.00 ✓ (meets production gate threshold)
- All cases compliant ✓ (no categorical fails)
- All cases pass (weighted ≥ 0.80) ✓
- No phantom HIGH on T5 ✓
- No HIGH escalation on T4 ✓

The Trial 2 result is identical to Trial 1 in every measurable dimension. Cross-trial consistency is confirmed.

---

## Cross-trial reliability summary

| Reliability signal | Result |
|-------------------|--------|
| FDR_HIGH Trial 1 | 1.00 |
| FDR_HIGH Trial 2 | 1.00 |
| FDR_HIGH consistency | ✓ 2/2 runs, 6/6 adversarial cases |
| Phantom HIGH on T5 (either trial) | 0 occurrences |
| HIGH escalation on T4 (either trial) | 0 occurrences |
| Finding text reproducibility (T2, T3, T4, T5) | Word-for-word identical |
| Severity assignment reproducibility | Identical across all 10 runs |

**Overall assessment:** Production-grade determinism across both trials. Zero delta in adversarial detection, severity calibration, and clean-baseline suppression. The model applies rule-based criterion checks rather than probabilistic generation for the core detection tasks — indicated by word-for-word reproduction on T2 and T3 (the artefact cross-reference cases), which are the most complex patterns in the corpus.
