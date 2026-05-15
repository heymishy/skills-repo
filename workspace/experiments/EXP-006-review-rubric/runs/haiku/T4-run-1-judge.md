# Judge: T4-run-1

**Case ID:** T4  
**Run:** 1  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defects:**
- S1.3: Performance NFR specified in discovery ("report generation shall complete within 10 seconds for datasets up to 50,000 rows") absent from NFR section → MEDIUM, Category D
- S2.1 AC2: Functional but omits CSV format and 3-second timing from discovery scope → LOW, Category C
- S2.2: Estimated effort field blank → LOW, Category D

**Expected:** FAIL, 1 MEDIUM + 2 LOW, zero HIGH findings.

---

## ⚠ EVAL.md D3 miscalibration — critical note

The EVAL.md D3 anchor states: "T4 contains two planted defects: (a) ACs use 'should' language throughout (MEDIUM under Category C) and (b) the complexity rating is absent (LOW under Category D)."

**The actual T4 corpus does NOT contain "should" language as a planted defect.** The actual planted defects (confirmed by reading `T4-medium-low-only.md` corpus case metadata) are:
- MEDIUM: missing performance NFR in S1.3 (Category D)
- LOW: vague AC2 in S2.1 (Category C)
- LOW: missing effort estimate in S2.2 (Category D)

The EVAL.md D3 anchor was written for a different version of T4 than the corpus that exists. The D3 rubric as written (looking for "should" language in Category C MEDIUM) cannot be applied to this corpus case. Scoring:
- **D3 as written in EVAL.md: N/A** (the defect it measures does not exist in this corpus)
- **D3 adapted to actual corpus: 1.0** (model correctly identified the actual planted MEDIUM)

This miscalibration is a gap in the EVAL.md that should be corrected. The EVAL.md D3 calibration scores, D3 anchor descriptions, and T4 corpus anchors need to be updated to reflect the actual corpus. Category D (missing performance NFR) is the correct MEDIUM for T4.

For this judge file: weighted score is computed with D3_adapted = 1.0 and a separate note on the EVAL.md gap.

---

## Dimension scores

### D1 — HIGH finding detection

**Score: N/A** — No planted HIGH in T4. D1 weight (0.30) redistributed to scored dimensions.

### D2 — Severity calibration and false-positive suppression

**Score: 1.0**

---

### Focus question: Did Haiku correctly rate findings as MEDIUM and LOW without escalating to HIGH?

**YES — Full credit.**

The model raises:
- `1-M1` labelled MEDIUM (not HIGH) for S1.3 missing performance NFR
- `1-L1` labelled LOW for S2.1 AC2 vague outcome
- `1-L2` labelled LOW for S2.2 missing effort estimate

Zero HIGH findings are present. The EVAL.md calibration note states: "A model that escalates S1.3 missing NFR to HIGH has misread the SKILL.md Category D threshold." The model did not escalate. The Category D HIGH threshold (user story missing or persona generic) is correctly not triggered by a missing NFR. Severity calibration is correct.

The model's category D score of 3 (not 1 or 2, which would indicate a HIGH trigger) is consistent with the MEDIUM+LOW interpretation.

---

### D3 — MEDIUM finding detection (adapted to actual corpus)

**Score: 1.0** (adapted — see EVAL.md miscalibration note above)

The model raises `1-M1` MEDIUM for "S1.3 NFR section states 'None recorded', but the discovery explicitly specifies a performance requirement: 'Report generation shall complete within 10 seconds for datasets up to 50,000 rows.'" The actual planted MEDIUM (missing performance NFR, Category D) is correctly identified at MEDIUM severity. Discovery performance requirement quoted verbatim. The finding is Category D, not Category C as the EVAL.md D3 anchor expects — but Category D is correct per the actual corpus.

If scored strictly against EVAL.md D3 (looking for "should" language MEDIUM in Category C): 0.0 (the defect does not exist in the corpus). This would be an unfair penalisation of the model for not inventing a phantom finding. Judge uses adapted scoring.

### D4 — Category attribution

**Score: 1.0**

All three findings attributed to the correct categories per actual corpus:
- `1-M1`: "Category D: Completeness / Missing performance NFR" — correct (actual corpus: MEDIUM, Category D)
- `1-L1`: "Category C: AC quality / Vague outcome" — correct (actual corpus: LOW, Category C)
- `1-L2`: "Category D: Completeness / Missing effort estimate" — correct (actual corpus: LOW, Category D)

Finding IDs `1-M1`, `1-L1`, `1-L2` present and follow the `[Run]-[Severity][Sequence]` format.

Note: EVAL.md D4 anchor for T4 states "C(MEDIUM)+D(LOW)" — this is wrong per the actual corpus (the actual MEDIUM is Category D, not C). Judge scores D4 against actual corpus, not EVAL.md anchor.

### D5 — Finding specificity

**Score: 1.0**

- `1-M1`: Names "S1.3", quotes "None recorded" in NFR section, quotes discovery performance requirement verbatim ("Report generation shall complete within 10 seconds for datasets up to 50,000 rows"), states consequence ("ACs do not test against this performance constraint")
- `1-L1`: Names "S2.1 AC2", quotes the full AC text ("Given the user clicks Download, When the file is ready, Then the report downloads successfully"), names the missing specifics (format and 3-second timing from discovery scope)
- `1-L2`: Names "S2.2", notes all other stories have estimates ("L, L, S"), characterises the impact ("prevents capacity planning")

All findings cite specific artefact elements. Fix actions are derivable without re-reading.

### D6 — Output structure compliance

**Score: 1.0**

Output follows FINDINGS → SCORE → VERDICT order. FINDINGS section first with three findings using correct severity-prefix IDs (`1-M1`, `1-L1`, `1-L2`). Score table with all five criteria and 1–5 scores. VERDICT last with FAIL stated and corrective action. No positive opening before findings.

---

## Computed scores

Weighted score computation (D1=N/A, D3=1.0 adapted, redistributed D1 weight 0.30 across D2/D3/D4/D5/D6 proportionally from original weights 0.20/0.15/0.15/0.10/0.10=0.70):

- D2 effective weight: 0.20/0.70 = 0.286
- D3 effective weight: 0.15/0.70 = 0.214
- D4 effective weight: 0.15/0.70 = 0.214
- D5 effective weight: 0.10/0.70 = 0.143
- D6 effective weight: 0.10/0.70 = 0.143

Weighted score = (1.0 × 0.286) + (1.0 × 0.214) + (1.0 × 0.214) + (1.0 × 0.143) + (1.0 × 0.143) = **1.00**

```json
{
  "case_id": "T4",
  "run": 1,
  "model_label": "claude-haiku-4-5",
  "scores": {
    "d1_high_detection": "N/A",
    "d2_severity_calibration": 1.0,
    "d3_medium_detection": "1.0 (adapted to actual corpus; EVAL.md D3 anchor is miscalibrated)",
    "d4_category_attribution": 1.0,
    "d5_finding_specificity": 1.0,
    "d6_output_structure": 1.0
  },
  "weighted_score": 1.00,
  "fdr_high_score": "N/A",
  "fdr_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "MEDIUM correctly calibrated (missing NFR, not escalated to HIGH); all three findings (1M+2L) correctly identified with specific element citations; EVAL.md D3 anchor is miscalibrated for this corpus case — see judge note."
}
```

---

## EVAL.md update recommendation

The following EVAL.md sections should be updated to align with the actual T4 corpus:
1. D3 description: change from "'should' language throughout (MEDIUM under Category C)" to "missing performance NFR in S1.3 (MEDIUM under Category D)"
2. D3 corpus anchor T4→1.0: update to cite "None recorded" NFR text and discovery performance requirement
3. D4 T4 anchor: change from "C(MEDIUM)+D(LOW)" to "D(MEDIUM)+C(LOW)+D(LOW)"
4. Calibration target note: update "should language is explicitly listed as MEDIUM" to "missing performance NFR does not meet Category D HIGH threshold (user story missing or persona generic)"

---

## Judge verdict

**PASS** — Weighted 1.00 ≥ 0.80. FDR_HIGH = N/A. Compliant. No HIGH escalation. MEDIUM correctly identified. All dimensions score 1.0.
