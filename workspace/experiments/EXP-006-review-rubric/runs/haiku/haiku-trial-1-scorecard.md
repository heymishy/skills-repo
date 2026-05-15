# Haiku Trial 1 Scorecard

**Experiment:** EXP-006-review-rubric  
**Model:** claude-haiku-4-5  
**Trial:** 1  
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

**† D3 adapted to actual corpus.** EVAL.md D3 anchor describes "should" language (Category C) as the T4 MEDIUM defect, but the actual T4 corpus planted MEDIUM is a missing performance NFR (Category D). The D3 rubric as written cannot be applied. Score of 1.0 reflects the model correctly identifying the actual planted MEDIUM. EVAL.md D3 requires correction. See T4-run-1-judge.md for full analysis.

**Weighted score note (T1/T2/T3):** EVAL.md specified redistribution weights (D1=0.34, D2=0.23, D4=0.17, D5=0.11, D6=0.11) sum to 0.96, not 1.00 — rounding artifact in spec. Literal application used. Normalised score is 1.00.

---

## FDR summary

| Metric | Value |
|--------|-------|
| Planted HIGH defects (T1, T2, T3) | 3 |
| Correctly identified at HIGH severity | 3 |
| FDR_HIGH (Trial 1) | **1.00** |
| EVAL.md threshold (production gate) | 1.00 |
| FDR_HIGH gate: PASS/FAIL | **PASS** |

---

## Categorical fail check

| Fail condition | T1 | T2 | T3 | T4 | T5 |
|---------------|----|----|----|----|-----|
| Planted HIGH missed (D1=0.0) | — | — | — | N/A | N/A |
| PASS verdict with HIGH defect present | — | — | — | N/A | N/A |
| Phantom HIGH on T5 (D2=0.0) | N/A | N/A | N/A | N/A | — |

No categorical fails triggered in Trial 1.

---

## Case-by-case verdict summary

**T1 — PASS (0.96)**  
HIGH detected: S2.2 ACs untestable "should" statements, all three ACs quoted verbatim, NFR gap named. Category C correct. No phantom findings.

**T2 — PASS (0.96)**  
HIGH detected: Adversarial pattern F7 (false propagation table) correctly identified. Both deficient stories (S1.2, S2.2) named individually. Propagation table text quoted. CDE expansion basis stated for each. AC3 from S2.2 quoted. Category A correct.

**T3 — PASS (0.96)**  
HIGH detected: Both out-of-scope stories (S5, S6) identified via discovery cross-reference. Out-of-scope text quoted verbatim for both. Category B correct. Hardest case in corpus (requires discovery artefact cross-reference) — scored maximum.

**T4 — PASS (1.00)**  
No HIGH escalation: S1.3 missing performance NFR correctly rated MEDIUM (not HIGH). S2.1 and S2.2 correctly rated LOW. Zero phantom HIGHs. Severity calibration correct.

**T5 — PASS (1.00)**  
Zero phantom findings: Clean baseline produced PASS with zero findings of any severity. No phantom MEDIUM or HIGH invented.

---

## Aggregate

| Metric | Trial 1 |
|--------|---------|
| Cases passed | 5/5 |
| Cases compliant | 5/5 |
| FDR_HIGH | 1.00 |
| Average weighted score (all cases) | 0.98 |
| Any categorical fail | No |
| Recommendation | See below |

**Average weighted score calculation:** (0.96 + 0.96 + 0.96 + 1.00 + 1.00) / 5 = 4.88 / 5 = **0.976** ≈ 0.98

---

## Recommendation

**PRODUCTION GATE: CONDITIONALLY APPROVED** subject to EVAL.md D3 correction.

Per EVAL.md criteria:
- FDR_HIGH = 1.00 ✓ (meets production gate threshold)
- All cases compliant ✓ (no categorical fails)
- All cases pass (weighted ≥ 0.80) ✓
- No phantom HIGH on T5 ✓
- No HIGH escalation on T4 ✓

The model meets all quantitative thresholds for production gate use at the /review stage in Trial 1.

**Outstanding action item:** EVAL.md D3 is miscalibrated for the actual T4 corpus (describes "should" language Category C MEDIUM; actual corpus has missing performance NFR Category D MEDIUM). This does not affect the model's Trial 1 result, but makes the rubric untrustworthy for future evaluations of T4. EVAL.md should be corrected before running further experiments.

---

## Notable findings from Trial 1

1. **T2 adversarial pattern F7 detected**: The false propagation table (claiming C2 present when it is absent from both story texts) was fully identified — table text quoted, both deficient stories named, CDE expansion logic stated. This is the most complex detection pattern in the set and was executed correctly.

2. **T3 discovery cross-reference performed**: The scope violation detection required reading the discovery artefact out-of-scope section against the story content. The model performed this cross-reference and quoted the relevant out-of-scope text verbatim for both S5 and S6.

3. **T4 severity calibration correct**: The missing performance NFR was correctly rated MEDIUM, not HIGH. The SKILL.md Category D HIGH threshold (user story missing or persona generic) was not misapplied.

4. **T5 clean baseline clean**: Zero findings produced. The most common phantom finding pattern ("vague benefit linkage" MEDIUM on Category D) was not triggered despite the model having scored benefit linkage at 5.
