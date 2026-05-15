# Judge: T3-run-2

**Case ID:** T3  
**Run:** 2  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defect:** Stories S5 (Broker portal read access) and S6 (KiwiSaver balance display) implement features explicitly listed in the discovery out-of-scope section. Expected HIGH on Category B.

---

## Dimension scores

### D1 — HIGH finding detection (weight 0.34 after D3 redistribution)

**Score: 1.0**

Finding `1-H1` present and labelled HIGH. Category B (Scope discipline) attributed. Finding text is word-for-word identical to Run 1: both S5 and S6 named, discovery out-of-scope text quoted verbatim for both, cross-reference to discovery performed, verdict FAIL.

Categorical fail triggered: NO.

### D2 — Severity calibration and false-positive suppression (weight 0.23)

**Score: 1.0**

Exactly one finding (1-H1 HIGH). Identical score table to Run 1 (A=5, B=1, C=5, D=5, E=4). No phantom findings for S1–S4. Clean containment.

### D3 — MEDIUM finding detection

**Score: N/A** — D3 not applicable to T3.

### D4 — Category attribution (weight 0.17)

**Score: 1.0**

"Category B: Scope discipline" — correct. Finding ID `1-H1` present. B scored 1, consistent with HIGH finding. Identical reasoning to Run 1.

### D5 — Finding specificity (weight 0.11)

**Score: 1.0**

Identical specificity to Run 1: full out-of-scope text quoted verbatim for both stories. Fix guidance actionable.

### D6 — Output structure compliance (weight 0.11)

**Score: 1.0**

Identical to Run 1. FINDINGS → SCORE → VERDICT. All criteria in score table. Finding ID present.

---

## Computed scores

```json
{
  "case_id": "T3",
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
  "notes": "Word-for-word identical to Run 1 — discovery cross-reference performed, both out-of-scope stories named with verbatim text; deterministic detection confirmed across runs."
}
```

---

## Consistency with Run 1

Run 2 finding text is identical to Run 1 to the sentence level. Score table is identical. Same observation as T2: for the hardest adversarial case (requiring discovery cross-reference), identical reproduction across independent runs confirms deterministic, rule-grounded behaviour. This is the most important reliability signal for scope-violation detection in a gate context.

---

## Judge verdict

**PASS** — Weighted 0.96 ≥ 0.80. FDR_HIGH = 1.0. Compliant. All dimensions score 1.0.
