# Judge: T2-run-1

**Case ID:** T2  
**Run:** 1  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defect:** C2 (PCI DSS QSA gate) constraint absent from S1.2 and S2.2 Architecture Constraints sections despite both being CDE-expanding stories; constraint propagation summary table falsely claims "C2 present in S1.2 ✓" and "C2 present in S2.2 ✓" (adversarial pattern F7 — false propagation table). Expected HIGH on Category A.

---

## EVAL.md anchor note

The EVAL.md D1 T2 anchor states: "HIGH finding in Category A naming the broken discovery slug or the missing benefit metric reference." The actual T2 corpus planted defect is the C2 constraint propagation table contradiction — not a broken discovery slug. The EVAL.md anchor is misaligned with the actual corpus case. Scoring proceeds against the actual planted defect using the D1 rubric criteria directly (HIGH present, defective element named, category correct), not against the anchor description.

---

## Dimension scores

### D1 — HIGH finding detection (weight 0.34 after D3 redistribution)

**Score: 1.0**

Finding `1-H1` is present and labelled HIGH. Category A (Traceability) is explicitly attributed. The specific adversarial pattern is correctly identified: the model states "The constraint propagation summary table claims 'C2 present in S1.2 ✓' and 'C2 present in S2.2 ✓', but neither story contains a C2 reference in its Architecture Constraints section." Both missing stories are named individually:

- S1.2: "Primary-to-standby database replication pipeline" — CDE expansion basis stated, Architecture Constraints lists "C1 and C3 only", C2 absence noted.
- S2.2: "Automated failover activation" — CDE expansion basis stated, Architecture Constraints lists "C3 only", C2 absence noted. S2.2 AC3 text quoted: "the standby payment processing service is set to `mode: active`".

Adversarial pattern F7 (false propagation table) correctly detected: the model explicitly states "the propagation table contradicts the story text." Verdict is FAIL.

Categorical fail triggered: NO. Planted HIGH correctly identified at HIGH severity with correct category.

---

### Focus question: Did Haiku correctly identify the false-positive propagation table and name the specific missing stories?

**YES — Full credit.**

Run 1 explicitly:
1. Quotes the false propagation table claims verbatim ("C2 present in S1.2 ✓" and "C2 present in S2.2 ✓")
2. Names both deficient stories individually (S1.2 and S2.2)
3. Identifies the basis for C2 applicability in each story (CDE expansion)
4. Contrasts with the correctly propagated story (S1.1 correctly includes C2)
5. Names the specific constraint (C2 = PCI DSS QSA gate)
6. States the traceability consequence: "if CDE-expanding stories (S1.2 and S2.2) lack C2 references, the C2 constraint is not fully propagated"

This is the highest-quality detection possible for this case. The model not only found the defect but identified the propagation logic, the adversarial mismatch between table and story text, and correctly excluded S1.1 from the finding.

---

### D2 — Severity calibration and false-positive suppression (weight 0.23)

**Score: 1.0**

Exactly one finding raised (1-H1 HIGH). No phantom findings raised for the well-formed stories (S1.3, S2.1, S2.3). The score table correctly scores A=2 (reflecting the broken traceability) and other criteria at 4–5. No spurious MEDIUM or LOW findings invented.

### D3 — MEDIUM finding detection

**Score: N/A** — D3 not applicable to T2.

### D4 — Category attribution (weight 0.17)

**Score: 1.0**

Finding attributed to "Category A: Traceability / Broken architectural constraint reference" — correct per corpus and per SKILL.md (broken constraint propagation is a traceability failure). Finding ID `1-H1` present. Category A score reduced to 2 in score table. "Architecture compliance" (E) scored 4 with a careful note: "Constraint propagation data is internally inconsistent, but individual story fields are complete" — distinguishing the table error from the individual story field completeness. This demonstrates precise understanding of the failure locus.

### D5 — Finding specificity (weight 0.11)

**Score: 1.0**

Specific elements cited throughout:
- Propagation table text quoted verbatim ("C2 present in S1.2 ✓")
- Both story titles named (S1.2, S2.2)
- C2 identified by name (PCI DSS QSA gate)
- CDE expansion basis stated for each story
- AC3 text from S2.2 quoted: "the standby payment processing service is set to `mode: active`"
- ADR-019 referenced as the basis for C2 applicability

Fix guidance is actionable: "constraint propagation summary table must be corrected: C2 is not present in S1.2 and S2.2, or those stories must include C2 references in their Architecture Constraints sections."

### D6 — Output structure compliance (weight 0.11)

**Score: 1.0**

Output follows FINDINGS → SCORE → VERDICT order. FINDINGS section first. Score table with all five criteria and 1–5 scores. VERDICT last with FAIL stated and corrective action. Finding ID `1-H1` present. No positive opening before findings.

---

## Computed scores

```json
{
  "case_id": "T2",
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
  "notes": "Adversarial pattern F7 (false propagation table) fully detected — table text quoted, both deficient stories (S1.2 and S2.2) named individually with CDE expansion basis and AC text cited."
}
```

---

## Judge verdict

**PASS** — Weighted 0.96 ≥ 0.80. FDR_HIGH = 1.0. Compliant. All dimensions score 1.0. Strongest possible detection of the F7 adversarial pattern.
