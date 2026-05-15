# Sonnet Trial 1 Scorecard

**Experiment:** EXP-006-review-rubric
**Model:** claude-sonnet-4-6
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
| T4 | N/A | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | N/A | true | true | true |
| T5 | N/A | 1.0 | N/A | 1.0 | 1.0 | 1.0 | 1.00 | N/A | true | true | true |

**Weighted score note (T1/T2/T3):** EVAL.md specified redistribution weights (D1=0.34, D2=0.23, D4=0.17, D5=0.11, D6=0.11) sum to 0.96, not 1.00 — documented rounding artifact in spec. Literal application used. Normalised score is 1.00.

**T4 note:** D1 N/A — weight redistributed proportionally to D2, D3, D4, D5, D6. All scores 1.0. Weighted ≈ 1.00.

**T5 note:** D1 and D3 both N/A — weight redistributed proportionally to D2, D4, D5, D6. All scores 1.0. Weighted ≈ 1.00.

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
HIGH detected: S2.2 ACs — all three quoted verbatim with per-AC critique of unmeasurable language ("quickly", "gracefully", "promptly"). NFR vacuousness explained. Discovery C3 (RTO ≤ 4 hours) linked as the required fix value. Category C correct. No phantom findings.

**T2 — PASS (0.96)**
HIGH detected: Both S1.2 and S2.2 named individually with per-story CDE-expansion reasoning. Architecture Constraints lists quoted for S1.2. AC3 `mode: active` quoted from S2.2 as the CDE activation event. Propagation table contradiction explicitly identified — table asserts C2 present but story text contradicts. ADR-019 referenced. Correct exclusion of S2.1 (no new CDE scope), S2.3 (runbook), S1.1 (C2 definition story). Category A correct.

**T3 — PASS (0.96)**
HIGH detected: S5 (broker portal) and S6 (KiwiSaver) identified via discovery cross-reference. Discovery out-of-scope text quoted verbatim for both. Endpoint `/v1/broker/clients/{clientId}/cards/{cardId}/summary` and fields `kiwiSaverSummary`, `currentBalance`, `fundType` named. Benefit-claim override argument explicitly rejected. Owning teams named (Wealth Products, KiwiSaver product team). Category B correct.

**T4 — PASS (1.00)**
No HIGH escalation. Missing performance NFR in S1.3 correctly rated MEDIUM (Category D). S2.1 AC2 correctly rated LOW (Category C). S2.2 blank effort correctly rated LOW (Category D). Zero phantom HIGHs. Downstream impact of NFR absence explained. Specific NFR fix text stated.

**T5 — PASS (1.00)**
Zero phantom findings. Clean baseline produced PASS with zero findings of any severity. Per-criterion positive verification includes specific artefact citations (S1.3 AC4 timing, S2.1 AC2 CSV/timing, S2.2 effort L 5 days, C1/C2 propagation). No "vague benefit linkage" phantom MEDIUM triggered.

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

**PRODUCTION GATE: APPROVED**

Per EVAL.md criteria:
- FDR_HIGH = 1.00 ✓ (meets production gate threshold)
- All cases compliant ✓ (no categorical fails)
- All cases pass (weighted ≥ 0.80) ✓
- No phantom HIGH on T5 ✓
- No HIGH escalation on T4 ✓

The model meets all quantitative thresholds for production gate use at the /review stage in Trial 1.

---

## Notable findings from Trial 1

1. **T2 adversarial pattern F7 detected with full specificity**: The false propagation table was identified as contradicting the story text. Both deficient stories named. Per-story CDE-expansion reasoning provided. This is the most complex detection in the corpus and was executed with maximum specificity.

2. **T3 discovery cross-reference with benefit-claim override handling**: Scope violation detection required reading the discovery out-of-scope section. The model not only performed the cross-reference but also pre-emptively addressed the most likely counter-argument (S5/S6 benefit linkage) — demonstrating anticipatory reasoning about why the finding is not negated.

3. **T4 correct severity calibration with fix specificity**: MEDIUM correctly identified without HIGH escalation. The fix is specified (exact NFR text to add), not just the problem. Downstream impact reasoning makes the urgency clear.

4. **T5 proactive per-criterion verification**: PASS verdict supported by specific artefact citations for each criterion, not just "no findings found." This gives downstream operators confidence in the PASS conclusion.
