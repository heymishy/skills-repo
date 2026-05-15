# Judge — T1 (AC quality HIGH) — Sonnet Trial 2

**Experiment:** EXP-006-review-rubric
**Case:** T1-ac-quality-high
**Model:** claude-sonnet-4-6
**Trial:** 2
**Run file:** T1-run-2.md
**Judge model:** claude-sonnet-4-6 (acting as judge on own prior output)
**Date:** 2026-05-15

---

## Score JSON

```json
{
  "case_id": "T1",
  "model_label": "claude-sonnet-4-6",
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
  "notes": "HIGH finding 2-H1 raised for S2.2 with all three ACs quoted verbatim and NFR vacuousness explained; Category C correct; no spurious findings. Output word-for-word identical to Trial 1 except finding ID prefix."
}
```

**Weighted score note:** D3 N/A redistribution applied — weights D1=0.34, D2=0.23, D4=0.17, D5=0.11, D6=0.11, sum=0.96 (documented rounding artifact in EVAL.md spec).

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — 1.0

Finding `2-H1` raised at HIGH severity for Story S2.2, Category C (AC quality). Substantively identical to Trial 1 finding — same three ACs quoted verbatim, same per-AC critique of unmeasurable language, same NFR gap identified. The finding correctly attributes the FAIL verdict.

### D2 — Severity calibration and false-positive suppression — 1.0

Exactly one HIGH finding raised (`2-H1`), the legitimate planted defect. No phantom or spurious findings.

### D3 — MEDIUM finding detection — N/A

T1 adversarial HIGH case. D3 weight redistributed.

### D4 — Category attribution — 1.0

Finding `2-H1` explicitly labelled "HIGH — Category C (AC quality)". Finding ID `2-H1` follows `[Run]-[Severity]-[Sequence]` format (trial 2, HIGH severity, sequence 1). Score table reduces AC quality to 1 (FAIL).

### D5 — Finding specificity — 1.0

All three AC texts quoted verbatim. NFR text quoted. Discovery C3 value (RTO ≤ 4 hours) named. Per-AC explanation of specific missing element included. Same specificity level as Trial 1.

### D6 — Output structure compliance — 1.0

FINDINGS → SCORE table → VERDICT order maintained. Finding ID present. Score table complete. No positive opening.

---

## Trial 1 vs Trial 2 delta

**Finding text:** Substantively identical. The model applies the same criterion-based reasoning to produce the same quoted AC texts and the same per-AC analysis. Finding IDs differ only by prefix (1-H1 vs 2-H1).

**Score table:** Identical — Traceability=4, Scope=5, AC quality=1, Completeness=3.

**Verdict:** Identical — FAIL, 1 criterion below threshold.

**Cross-trial consistency:** Confirmed. T1 detection is deterministic across independent runs at this model.
