# Judge — T4 (MEDIUM + LOW only) — Sonnet Trial 2

**Experiment:** EXP-006-review-rubric
**Case:** T4-medium-low-only
**Model:** claude-sonnet-4-6
**Trial:** 2
**Run file:** T4-run-2.md
**Judge model:** claude-sonnet-4-6 (acting as judge on own prior output)
**Date:** 2026-05-15

---

## Score JSON

```json
{
  "case_id": "T4",
  "model_label": "claude-sonnet-4-6",
  "scores": {
    "d1_high_detection": "N/A",
    "d2_severity_calibration": 1.0,
    "d3_medium_detection": 1.0,
    "d4_category_attribution": 1.0,
    "d5_finding_specificity": 1.0,
    "d6_output_structure": 1.0
  },
  "weighted_score": 1.00,
  "fdr_high_score": "N/A",
  "fdr_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Word-for-word identical to Trial 1 except finding ID prefix; no HIGH raised; MEDIUM and both LOWs reproduced; D2 categorical fail condition avoided; D3 = 1.0."
}
```

**Weighted score note:** D1 N/A — weight redistributed proportionally to remaining dimensions (sums to 1.00 with exact fractions).

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — N/A

T4 has no planted HIGH defect. D1 weight redistributed.

### D2 — Severity calibration and false-positive suppression — 1.0

Zero HIGH findings produced. Finding `2-M1` correctly labelled MEDIUM (not HIGH). The D2 categorical fail condition (any HIGH finding → D2=0.0) was not triggered. D2 = 1.0.

### D3 — MEDIUM finding detection — 1.0

Finding `2-M1` raised at MEDIUM severity for S1.3, Category D. Substantively identical to Trial 1: S1.3 named, "None recorded" quoted from NFR field, discovery scope item 2 quoted verbatim, downstream impact explained, specific fix NFR text stated. D3 = 1.0.

### D4 — Category attribution — 1.0

All three findings correctly attributed:
- `2-M1` → Category D (Completeness) ✓
- `2-L1` → Category C (AC quality) ✓
- `2-L2` → Category D (Completeness) ✓

Finding IDs `2-M1`, `2-L1`, `2-L2` in correct `[Run]-[Severity]-[Sequence]` format.

### D5 — Finding specificity — 1.0

Identical specificity to Trial 1 across all three findings. "None recorded" quoted, discovery text quoted, S2.1 AC2 quoted verbatim, comparator effort estimates listed.

### D6 — Output structure compliance — 1.0

FINDINGS → SCORE → VERDICT order. Score table: Traceability=5, Scope=5, AC quality=3, Completeness=2 (FAIL). Finding IDs present.

---

## Trial 1 vs Trial 2 delta

**Finding text:** Word-for-word identical except finding ID prefix (1-M1/1-L1/1-L2 → 2-M1/2-L1/2-L2).

**Score table:** Identical across both trials.

**Verdict:** Identical — FAIL, Completeness below threshold.

**Cross-trial consistency:** Confirmed. Severity calibration on T4 is fully deterministic — the model applies the same MEDIUM/LOW thresholds across independent runs without fluctuation. Zero HIGH escalation observed in either trial, confirming D2 reliability for gate use.
