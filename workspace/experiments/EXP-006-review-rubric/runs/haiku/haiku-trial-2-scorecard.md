# Haiku Trial 2 Scorecard

**Experiment:** EXP-006-review-rubric  
**Model:** claude-haiku-4-5  
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
| T4 | N/A | 1.0 | 1.0† | 1.0 | 1.0 | 1.0 | 1.00 | N/A | true | true | true |
| T5 | N/A | 1.0 | N/A | 1.0 | 1.0 | 1.0 | 1.00 | N/A | true | true | true |

**† D3 adapted to actual corpus.** See T4-run-2-judge.md and T4-run-1-judge.md for full explanation of EVAL.md D3 miscalibration.

**Weighted score note (T1/T2/T3):** EVAL.md redistribution weights sum to 0.96 due to rounding. Literal application used.

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
HIGH detected: S2.2 ACs untestable, all three ACs quoted, NFR gap named. Category C correct. Run 2 adds explicit SKILL.md threshold logic: "violates the Category C HIGH threshold." No phantom findings.

**T2 — PASS (0.96)**  
HIGH detected: Adversarial pattern F7 detected — findings text identical to Run 1. Both S1.2 and S2.2 named. Propagation table text quoted. CDE expansion basis stated. Category A correct. Word-for-word reproduction confirms deterministic detection.

**T3 — PASS (0.96)**  
HIGH detected: Both S5 and S6 identified via discovery cross-reference. Out-of-scope text quoted verbatim. Findings text identical to Run 1 — discovery cross-reference is deterministic. Category B correct.

**T4 — PASS (1.00)**  
No HIGH escalation: Findings identical to Run 1 (MEDIUM + 2 LOW). Severity calibration deterministic across runs. Zero phantom HIGHs.

**T5 — PASS (1.00)**  
Zero phantom findings: Findings section output word-for-word identical to Run 1. Clean baseline returns PASS deterministically.

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
| T1 | 0.96 | 0.96 | 0 | Substantially identical | Identical |
| T2 | 0.96 | 0.96 | 0 | Word-for-word identical | Identical |
| T3 | 0.96 | 0.96 | 0 | Word-for-word identical | Identical |
| T4 | 1.00 | 1.00 | 0 | Substantively identical (minor phrasing) | Identical |
| T5 | 1.00 | 1.00 | 0 | Word-for-word identical | Identical |

**Trial consistency: perfect.** Zero delta across all five cases. This is the strongest possible consistency result: not merely the same verdict and FDR, but the same finding text and score table values across independent runs. For T2 and T3 (adversarial cross-reference cases), word-for-word reproduction indicates the model is applying a deterministic rule-based check, not probabilistic generation. This is the ideal reliability signal for a review gate.

---

## Recommendation

**PRODUCTION GATE: CONDITIONALLY APPROVED** (consistent with Trial 1 recommendation).

Per EVAL.md criteria:
- FDR_HIGH = 1.00 ✓ (meets production gate threshold)
- All cases compliant ✓ (no categorical fails)
- All cases pass (weighted ≥ 0.80) ✓
- No phantom HIGH on T5 ✓
- No HIGH escalation on T4 ✓

The Trial 2 result is identical to Trial 1 in every measurable dimension. Cross-trial consistency is confirmed. The model is suitable for production gate use at the /review stage.

**Outstanding action item (carried from Trial 1):** EVAL.md D3 is miscalibrated for the actual T4 corpus. Requires correction before further experiments. See T4-run-1-judge.md and T4-run-2-judge.md.

---

## Cross-trial reliability summary

| Reliability signal | Result |
|-------------------|--------|
| FDR_HIGH Trial 1 | 1.00 |
| FDR_HIGH Trial 2 | 1.00 |
| FDR_HIGH consistency | ✓ 2/2 runs, 6/6 adversarial cases |
| Phantom HIGH on T5 (either trial) | 0 occurrences |
| HIGH escalation on T4 (either trial) | 0 occurrences |
| Finding text reproducibility (T2, T3) | Word-for-word identical |
| Severity assignment reproducibility | Identical across all 10 runs |

**Overall assessment:** The model demonstrates production-grade determinism at the /review gate across both trials. The zero-delta consistency result, combined with FDR_HIGH = 1.00 on adversarial cases and zero phantom findings on the clean baseline, places this model in the strongest possible position for /review gate use subject only to the EVAL.md D3 correction.
