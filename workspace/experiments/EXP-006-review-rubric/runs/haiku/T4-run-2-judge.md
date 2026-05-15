# Judge: T4-run-2

**Case ID:** T4  
**Run:** 2  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defects:**
- S1.3: Performance NFR absent → MEDIUM, Category D
- S2.1 AC2: Vague AC (missing CSV format and timing) → LOW, Category C
- S2.2: Missing effort estimate → LOW, Category D

**Expected:** FAIL, 1 MEDIUM + 2 LOW, zero HIGH findings.

---

## ⚠ EVAL.md D3 miscalibration

See T4-run-1-judge.md for full explanation. The EVAL.md D3 anchor describes "should" language (Category C) as the planted MEDIUM, but the actual corpus planted MEDIUM is missing performance NFR (Category D). D3 scored as adapted to actual corpus.

---

## Dimension scores

### D1 — HIGH finding detection

**Score: N/A** — No planted HIGH in T4.

### D2 — Severity calibration and false-positive suppression

**Score: 1.0**

---

### Focus question: Did Haiku correctly rate findings as MEDIUM and LOW without escalating to HIGH?

**YES — Full credit, identical to Run 1.**

Three findings raised: `1-M1` MEDIUM, `1-L1` LOW, `1-L2` LOW. Zero HIGH findings. Severity calibration identical to Run 1. Category D score 3 in score table consistent with MEDIUM+LOW interpretation, not HIGH escalation.

---

### D3 — MEDIUM finding detection (adapted to actual corpus)

**Score: 1.0** (adapted — see EVAL.md miscalibration note)

Finding `1-M1` MEDIUM for S1.3 missing performance NFR. Discovery performance requirement quoted: "Report generation shall complete within 10 seconds for datasets up to 50,000 rows." Identical finding to Run 1. Correct severity (MEDIUM), correct element (S1.3 NFR), correct category (D).

### D4 — Category attribution

**Score: 1.0**

All three findings correctly attributed per actual corpus:
- `1-M1`: Category D (Completeness / Missing performance NFR) ✓
- `1-L1`: Category C (AC quality / Vague outcome) ✓
- `1-L2`: Category D (Completeness / Missing effort estimate) ✓

Finding IDs `1-M1`, `1-L1`, `1-L2` present.

### D5 — Finding specificity

**Score: 1.0**

Run 2 findings are substantively identical to Run 1 with minor phrasing differences:
- `1-M1`: S1.3 named, "None recorded" quoted, discovery performance requirement quoted verbatim
- `1-L1`: S2.1 AC2 named, AC text quoted: "Given the user clicks Download, when the file is ready, then the report downloads successfully" (lowercase "when" — minor style variation), missing specifics named
- `1-L2`: S2.2 named, other story estimates listed, impact stated

All findings cite specific artefact elements. Slightly more concise phrasing than Run 1 but equally actionable.

### D6 — Output structure compliance

**Score: 1.0**

Identical structure to Run 1. FINDINGS → SCORE → VERDICT. Finding IDs `1-M1`, `1-L1`, `1-L2`. Score table with all five criteria. VERDICT last with FAIL stated. No positive opening.

---

## Computed scores

Weighted score (D1=N/A, D3=1.0 adapted, same redistribution as Run 1: D2=0.286, D3=0.214, D4=0.214, D5=0.143, D6=0.143):

Weighted = (1.0 × 0.286) + (1.0 × 0.214) + (1.0 × 0.214) + (1.0 × 0.143) + (1.0 × 0.143) = **1.00**

```json
{
  "case_id": "T4",
  "run": 2,
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
  "notes": "Identical severity calibration to Run 1 — MEDIUM not escalated to HIGH, all three findings correctly identified; confirms deterministic severity calibration across runs."
}
```

---

## Consistency with Run 1

Finding content is substantively identical to Run 1 with minor phrasing differences (lowercase "when" in AC2 quote). Score table is identical. Severity assignments are identical. This confirms that T4's severity calibration (MEDIUM threshold for missing NFR, not HIGH) is deterministic across runs. This is an important reliability signal: the model does not stochastically escalate severity across runs.

---

## Judge verdict

**PASS** — Weighted 1.00 ≥ 0.80. FDR_HIGH = N/A. Compliant. No HIGH escalation. MEDIUM correctly identified. All dimensions score 1.0.
