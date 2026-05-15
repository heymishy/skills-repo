# Judge: T5-run-2

**Case ID:** T5  
**Run:** 2  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defect:** None. T5 is the clean baseline. Expected: PASS with zero findings.

---

## Dimension scores

### D1 — HIGH finding detection

**Score: N/A** — No planted HIGH in T5.

### D2 — Severity calibration and false-positive suppression

**Score: 1.0**

---

### Focus question: Did Haiku invent any findings on the clean baseline?

**NO — Zero findings produced. Full credit.**

Findings section states: "None. The definition artefact is complete and correct."

Run 2 output is word-for-word identical to Run 1. No phantom findings of any severity (HIGH, MEDIUM, or LOW) were produced in either run. The most common phantom finding patterns (spurious MEDIUM for "vague benefit linkage" under Category D, spurious LOW for missing scope note) are absent in both runs.

Categorical fail triggered: NO. D2 = 1.0.

---

### D3 — MEDIUM finding detection

**Score: N/A** — D3 not applicable to T5.

### D4 — Category attribution

**Score: 1.0**

No findings to attribute. Score table all 5s with substantive justifications (identical to Run 1).

### D5 — Finding specificity

**Score: 1.0**

No findings produced. Correct.

### D6 — Output structure compliance

**Score: 1.0**

Identical structure to Run 1. FINDINGS explicitly states "None". Score table with all criteria. VERDICT last with PASS.

---

## Computed scores

Weighted score (D1=N/A, D3=N/A; D2=0.364, D4=0.273, D5=0.182, D6=0.182):

Weighted = (1.0 × 0.364) + (1.0 × 0.273) + (1.0 × 0.182) + (1.0 × 0.182) = **1.00**

```json
{
  "case_id": "T5",
  "run": 2,
  "model_label": "claude-haiku-4-5",
  "scores": {
    "d1_high_detection": "N/A",
    "d2_severity_calibration": 1.0,
    "d3_medium_detection": "N/A",
    "d4_category_attribution": 1.0,
    "d5_finding_specificity": 1.0,
    "d6_output_structure": 1.0
  },
  "weighted_score": 1.00,
  "fdr_high_score": "N/A",
  "fdr_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Word-for-word identical to Run 1 — zero phantom findings; confirms deterministic false-positive suppression on clean baseline across independent runs."
}
```

---

## Consistency with Run 1

Run 2 output is word-for-word identical to Run 1 in both the findings and score sections. This confirms that on the clean baseline, the model produces a deterministically clean output — no stochastic phantom finding generation. This is the highest-confidence false-positive suppression result possible: not just zero findings on average, but zero findings on every individual run.

---

## Judge verdict

**PASS** — Weighted 1.00 ≥ 0.80. FDR_HIGH = N/A. Compliant. Zero phantom findings across both runs. Clean baseline correctly and deterministically returned PASS.
