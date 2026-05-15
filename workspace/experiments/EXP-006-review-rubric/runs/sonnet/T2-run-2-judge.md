# Judge — T2 (Traceability HIGH) — Sonnet Trial 2

**Experiment:** EXP-006-review-rubric
**Case:** T2-traceability-high
**Model:** claude-sonnet-4-6
**Trial:** 2
**Run file:** T2-run-2.md
**Judge model:** claude-sonnet-4-6 (acting as judge on own prior output)
**Date:** 2026-05-15

---

## Score JSON

```json
{
  "case_id": "T2",
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
  "notes": "HIGH finding 2-H1 raised for S1.2 and S2.2; word-for-word identical to Trial 1 except finding ID prefix; propagation table contradiction, per-story reasoning, and correct exclusions all reproduced."
}
```

**Weighted score note:** D3 N/A redistribution applied — weights sum to 0.96 (documented rounding artifact in EVAL.md).

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — 1.0

Finding `2-H1` raised at HIGH severity for Stories S1.2 and S2.2, Category A (Traceability). The finding text is word-for-word identical to Trial 1 except for the finding ID prefix (1-H1 → 2-H1). Both stories named individually, constraint lists quoted for S1.2, AC3 `mode: active` quoted from S2.2, ADR-019 referenced, propagation table contradiction explicitly stated, correct exclusions of S2.1/S2.3/S1.1 with reasons. D1 = 1.0 per rubric criterion.

### D2 — Severity calibration and false-positive suppression — 1.0

Exactly one HIGH finding (`2-H1`) for the legitimate planted defect. No phantom findings.

### D3 — MEDIUM finding detection — N/A

T2 adversarial HIGH case. D3 weight redistributed.

### D4 — Category attribution — 1.0

`2-H1` labelled "HIGH — Category A (Traceability)". Finding ID format correct. Score table: Traceability=1 (FAIL), matching the planted defect criterion.

### D5 — Finding specificity — 1.0

Identical specificity to Trial 1: story-level naming, constraint-list quoting, AC3 `mode: active` quote, ADR-019 reference, propagation table discrepancy called out, exclusion reasoning stated. Fix actionable without re-reading.

### D6 — Output structure compliance — 1.0

FINDINGS → SCORE → VERDICT order maintained. Finding ID present. Score table complete. No positive preamble.

---

## Trial 1 vs Trial 2 delta

**Finding text:** Word-for-word identical except finding ID prefix. The T2 adversarial pattern F7 detection is fully deterministic across independent runs.

**Score table:** Identical — Traceability=1, Scope=5, AC quality=5, Completeness=4.

**Verdict:** Identical — FAIL, 1 criterion below threshold.

**Cross-trial consistency:** Confirmed. Detection of a false propagation table with per-story constraint-list analysis is reproduced identically, indicating rule-based rather than probabilistic detection mode.
