# Judge: T1-run-1

**Case ID:** T1  
**Run:** 1  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defect:** S2.2 — three ACs in untestable "should" language with no GWT structure; sole NFR ("Must comply with RTO requirements") non-specific and unmeasurable. Expected HIGH on Category C.

---

## Dimension scores

### D1 — HIGH finding detection (weight 0.34 after D3 redistribution)

**Score: 1.0**

Finding `1-H1` is present and labelled HIGH. Category C (AC quality) is explicitly stated. All three defective ACs are quoted verbatim: "The failover should complete quickly", "The system should handle load gracefully during failover", "Monitoring alerts should fire promptly when failover is activated". The absence of GWT structure is stated. The NFR gap ("Must comply with RTO requirements") is named and the absence of a specific time value is cited. Verdict is FAIL.

Categorical fail triggered: NO. Planted HIGH correctly identified at HIGH severity with correct category.

### D2 — Severity calibration and false-positive suppression (weight 0.23)

**Score: 1.0**

No phantom findings raised beyond the legitimate HIGH. No inflation of other findings to MEDIUM or HIGH. The output contains exactly one finding (1-H1 HIGH). All other criteria scored without spurious additional issues being invented.

### D3 — MEDIUM finding detection

**Score: N/A** — D3 not applicable to T1.

### D4 — Category attribution (weight 0.17)

**Score: 1.0**

Finding attributed to "Category C: AC quality" — correct per corpus. Finding ID `1-H1` is present and follows the `[Run]-[Severity][Sequence]` format. Category C score reduced to 2 in the score table, consistent with the HIGH finding.

### D5 — Finding specificity (weight 0.11)

**Score: 1.0**

All three "should" ACs are quoted verbatim (not paraphrased). The absence of GWT structure is explicitly stated. The NFR deficiency is cited with the exact NFR text ("Must comply with RTO requirements") and the missing specific value is noted. Fix guidance is actionable without re-reading the artefact.

### D6 — Output structure compliance (weight 0.11)

**Score: 1.0**

Output follows FINDINGS → SCORE → VERDICT order. FINDINGS section is first. Score table present with all five criteria (A through E) and 1–5 scores. VERDICT is last with PASS/FAIL stated. Finding ID `1-H1` is present. No positive opening before findings.

---

## Computed scores

```json
{
  "case_id": "T1",
  "run": 1,
  "model_label": "claude-haiku-4-5",
  "scores": {
    "d1_high_detection": 1.0,
    "d2_severity_calibration": 1.0,
    "d3_medium_detection": "N/A",
    "d4_category_attribution": 1.0,
    "d5_finding_specificity": 1.0,
    "d6_output_structure": 1.0
  },
  "weighted_score": 0.96,
  "fdr_high_score": 1.0,
  "fdr_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Perfect HIGH detection — all three defective ACs quoted verbatim, NFR gap named, correct category and severity; no phantom findings."
}
```

**Weighted score note:** EVAL.md specified redistribution weights (D1=0.34, D2=0.23, D4=0.17, D5=0.11, D6=0.11) sum to 0.96, not 1.00 — rounding artifact in spec. Literal application yields 0.96; normalised to 1.00 if scores are all 1.0. Reported as 0.96 per spec.

---

## Specific focus questions

**T1 is not a T2/T4/T5 focus question case.** No special sub-question applies.

---

## Judge verdict

**PASS** — Weighted 0.96 ≥ 0.80. FDR_HIGH = 1.0. Compliant. All dimensions score 1.0.
