# Judge: T1-run-2

**Case ID:** T1  
**Run:** 2  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defect:** S2.2 — three ACs in untestable "should" language with no GWT structure; sole NFR ("Must comply with RTO requirements") non-specific and unmeasurable. Expected HIGH on Category C.

---

## Dimension scores

### D1 — HIGH finding detection (weight 0.34 after D3 redistribution)

**Score: 1.0**

Finding `1-H1` is present and labelled HIGH. Category C (AC quality) is explicitly stated. All three defective ACs are quoted: "The failover should complete quickly", "The system should handle load gracefully during failover", "Monitoring alerts should fire promptly when failover is activated". The absence of observable, testable outcomes is explicitly stated. The Category C HIGH threshold violation is stated ("'Should' language without Given/When/Then structure and without measurable criteria violates the Category C HIGH threshold"). NFR gap named ("Must comply with RTO requirements" — no specific value). Verdict is FAIL.

Categorical fail triggered: NO. Planted HIGH correctly identified at HIGH severity with correct category.

### D2 — Severity calibration and false-positive suppression (weight 0.23)

**Score: 1.0**

Exactly one finding raised (1-H1 HIGH). No phantom MEDIUM or LOW findings invented. No findings raised for the well-formed stories (S1.1, S1.2, S2.1, S2.3). Clean containment to the single planted defect.

### D3 — MEDIUM finding detection

**Score: N/A** — D3 not applicable to T1.

### D4 — Category attribution (weight 0.17)

**Score: 1.0**

Finding attributed to "Category C: AC quality" — correct per corpus. Finding ID `1-H1` present. Category C score reduced to 2 in score table, consistent with the HIGH finding. Run 2 adds explicit explanation ("S1.1, S1.2, S2.1, S2.3 use GWT format with 3–4 testable ACs each. S2.2 contains 3 non-testable ACs in 'should' language. Triggers HIGH threshold.") confirming correct application of the SKILL.md criterion.

### D5 — Finding specificity (weight 0.11)

**Score: 1.0**

All three "should" ACs quoted verbatim. Absence of measurable criteria stated (e.g., "within X seconds" or "at p99"). NFR text named. Fix guidance specific: "convert all ACs to GWT format with specific, testable outcomes" and "NFR must specify an exact RTO value (e.g., '≤ 4 hours')". Fully actionable without re-reading.

### D6 — Output structure compliance (weight 0.11)

**Score: 1.0**

Output follows FINDINGS → SCORE → VERDICT order. FINDINGS first. Score table with all five criteria and 1–5 scores. VERDICT last with FAIL stated. Finding ID `1-H1` present. No positive opening before findings. Identical structure to Run 1 — consistent instruction-following.

---

## Computed scores

```json
{
  "case_id": "T1",
  "run": 2,
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
  "notes": "Identical detection quality to Run 1 — all three defective ACs quoted, NFR gap named, HIGH threshold logic explained; no phantom findings; consistent output structure."
}
```

**Weighted score note:** EVAL.md specified redistribution weights sum to 0.96 due to rounding artifact. See T1-run-1-judge.md for explanation.

---

## Consistency with Run 1

Run 2 is substantially identical to Run 1 in content: same ACs quoted, same NFR gap identified, same category, same score table values, same verdict. The Run 2 output adds explicit reference to the SKILL.md Category C HIGH threshold logic ("violates the Category C HIGH threshold"). This demonstrates rule-grounded, not pattern-matched, detection — a positive indicator for gate reliability.

---

## Judge verdict

**PASS** — Weighted 0.96 ≥ 0.80. FDR_HIGH = 1.0. Compliant. All dimensions score 1.0.
