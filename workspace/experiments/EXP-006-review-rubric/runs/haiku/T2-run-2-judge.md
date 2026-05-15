# Judge: T2-run-2

**Case ID:** T2  
**Run:** 2  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defect:** C2 (PCI DSS QSA gate) constraint absent from S1.2 and S2.2 Architecture Constraints sections despite both being CDE-expanding stories; constraint propagation summary table falsely claims "C2 present in S1.2 ✓" and "C2 present in S2.2 ✓" (adversarial pattern F7 — false propagation table). Expected HIGH on Category A.

---

## EVAL.md anchor note

See T2-run-1-judge.md. EVAL.md D1 T2 anchor describes a "broken discovery slug" — the actual corpus planted defect is the C2 constraint propagation table contradiction. Scoring proceeds against the actual planted defect.

---

## Dimension scores

### D1 — HIGH finding detection (weight 0.34 after D3 redistribution)

**Score: 1.0**

Finding `1-H1` present and labelled HIGH. Category A (Traceability) attributed. Finding text is word-for-word identical to Run 1, including:
- Verbatim propagation table claims quoted ("C2 present in S1.2 ✓" and "C2 present in S2.2 ✓")
- Both S1.2 and S2.2 named individually with CDE expansion basis
- S2.2 AC3 text quoted: "the standby payment processing service is set to `mode: active`"
- ADR-019 referenced

Verdict is FAIL. Categorical fail triggered: NO.

---

### Focus question: Did Haiku correctly identify the false-positive propagation table and name the specific missing stories?

**YES — Full credit, identical to Run 1.**

Run 2 finding text is identical to Run 1 at the sentence level. This confirms deterministic detection of the adversarial pattern across independent runs. The model:
1. Quotes the false propagation table claims verbatim
2. Names both S1.2 and S2.2 individually
3. States CDE expansion basis for each
4. Quotes AC3 from S2.2
5. Notes S1.1 correctly includes C2 (correctly limits the finding scope)
6. States the traceability consequence

The exact reproduction across two runs is a strong signal that the detection is rule-grounded and reliable, not stochastic.

---

### D2 — Severity calibration and false-positive suppression (weight 0.23)

**Score: 1.0**

Exactly one finding (1-H1 HIGH). Identical score table to Run 1 (A=2, B=5, C=5, D=5, E=4). No phantom findings. Clean containment.

### D3 — MEDIUM finding detection

**Score: N/A** — D3 not applicable to T2.

### D4 — Category attribution (weight 0.17)

**Score: 1.0**

"Category A: Traceability / Broken architectural constraint reference" — correct. Finding ID `1-H1` present. Category A score 2, consistent with HIGH finding. E=4 with note distinguishing table-level error from story-field completeness — identical precise reasoning to Run 1.

### D5 — Finding specificity (weight 0.11)

**Score: 1.0**

Identical specificity to Run 1: propagation table text quoted, both story titles named, C2 named, CDE expansion basis, AC3 from S2.2 quoted, ADR-019 referenced. Fix guidance actionable.

### D6 — Output structure compliance (weight 0.11)

**Score: 1.0**

Identical structure to Run 1. FINDINGS → SCORE → VERDICT. All five criteria in score table. Finding ID present.

---

## Computed scores

```json
{
  "case_id": "T2",
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
  "notes": "Word-for-word identical to Run 1 — adversarial F7 pattern detected with same specificity; confirms deterministic, rule-grounded detection across runs."
}
```

---

## Consistency with Run 1

Run 2 finding text is identical to Run 1 to the sentence level. Score table is identical. This is highly notable for the adversarial T2 case, which requires cross-referencing the propagation table against the individual story texts. Identical reproduction suggests the model is applying a deterministic, rule-grounded check rather than probabilistic generation. This is the most desirable reliability signal for a review gate.

---

## Judge verdict

**PASS** — Weighted 0.96 ≥ 0.80. FDR_HIGH = 1.0. Compliant. All dimensions score 1.0.
