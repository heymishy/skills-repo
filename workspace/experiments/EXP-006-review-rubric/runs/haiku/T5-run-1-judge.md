# Judge: T5-run-1

**Case ID:** T5  
**Run:** 1  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defect:** None. T5 is the clean baseline — a fully complete Staff Report Export Tool artefact with all template fields populated, all ACs in GWT format, all NFRs with specific measurable values, all effort estimates present, all constraints correctly propagated. Expected: PASS with zero findings.

---

## Dimension scores

### D1 — HIGH finding detection

**Score: N/A** — No planted HIGH in T5. Absence of phantom HIGH captured in D2.

### D2 — Severity calibration and false-positive suppression

**Score: 1.0**

---

### Focus question: Did Haiku invent any findings on the clean baseline?

**NO — Zero findings produced. Full credit.**

The FINDINGS section states: "None. The definition artefact is complete and correct."

No HIGH findings: 0 (categorical pass)  
No MEDIUM findings: 0  
No LOW findings: 0

The EVAL.md D2 calibration note identifies the most common phantom finding pattern on clean stories as "a spurious MEDIUM under Category D ('benefit linkage is vague')." The T5 corpus has explicit benefit linkage sentences. The model produced no phantom finding of this type.

The EVAL.md D2 also notes that "surfacing [the one genuine LOW-tier signal present]... is correct but not required for D2 = 1.0." The model found no such LOW either. This is within the 1.0 range — it is not required to find the optional LOW.

Categorical fail triggered: NO (no phantom HIGH on T5). D2 = 1.0.

---

### D3 — MEDIUM finding detection

**Score: N/A** — D3 not applicable to T5.

### D4 — Category attribution

**Score: 1.0**

No findings to attribute. Trivially correct — no mislabelled categories exist because no findings exist. Score table categories all scored 5 with substantive justifications, not generic boilerplate.

### D5 — Finding specificity

**Score: 1.0**

No findings produced. Trivially correct at the specificity dimension — a finding that does not exist cannot be incorrectly specified. The verdict (PASS) is consistent with the absence of findings.

### D6 — Output structure compliance

**Score: 1.0**

Output follows FINDINGS → SCORE → VERDICT order. FINDINGS section explicitly states "None. The definition artefact is complete and correct." — correctly marking the section as intentionally empty rather than omitting it. Score table present with all five criteria and 1–5 scores (all 5). VERDICT last with PASS and ✅ stated. No finding IDs (none needed). No positive opening before findings.

---

## Computed scores

Weighted score (D1=N/A, D3=N/A; remaining dimensions: D2=0.20, D4=0.15, D5=0.10, D6=0.10 = 0.55; normalised):

- D2 effective weight: 0.20/0.55 = 0.364
- D4 effective weight: 0.15/0.55 = 0.273
- D5 effective weight: 0.10/0.55 = 0.182
- D6 effective weight: 0.10/0.55 = 0.182

Weighted = (1.0 × 0.364) + (1.0 × 0.273) + (1.0 × 0.182) + (1.0 × 0.182) = **1.00**

```json
{
  "case_id": "T5",
  "run": 1,
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
  "notes": "Zero findings on clean baseline — no phantom HIGH, no phantom MEDIUM, no phantom LOW; findings section explicitly states None; no false-positive generation observed."
}
```

---

## Judge verdict

**PASS** — Weighted 1.00 ≥ 0.80. FDR_HIGH = N/A. Compliant. Zero phantom findings. Clean baseline correctly returned PASS.
