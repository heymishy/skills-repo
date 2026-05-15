# Judge — T3 (Scope integrity HIGH) — Sonnet Trial 2

**Experiment:** EXP-006-review-rubric
**Case:** T3-scope-high
**Model:** claude-sonnet-4-6
**Trial:** 2
**Run file:** T3-run-2.md
**Judge model:** claude-sonnet-4-6 (acting as judge on own prior output)
**Date:** 2026-05-15

---

## Score JSON

```json
{
  "case_id": "T3",
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
  "notes": "HIGH finding 2-H1 raised for S5 and S6; word-for-word identical to Trial 1 except finding ID prefix; discovery cross-reference and scope-deference logic deterministically reproduced."
}
```

**Weighted score note:** D3 N/A redistribution applied — weights sum to 0.96 (documented rounding artifact in EVAL.md).

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — 1.0

Finding `2-H1` raised at HIGH severity for Stories S5 and S6, Category B (Scope integrity). Substantively identical to Trial 1: same endpoint path cited, same field names, same discovery out-of-scope text quoted verbatim, same owning teams named, same benefit-claim override argument rejected, same exclusion of S1–S4. D1 = 1.0.

### D2 — Severity calibration and false-positive suppression — 1.0

One HIGH finding (`2-H1`) for the legitimate planted defect. No phantom findings on S1–S4.

### D3 — MEDIUM finding detection — N/A

T3 adversarial HIGH case. D3 weight redistributed.

### D4 — Category attribution — 1.0

`2-H1` labelled "HIGH — Category B (Scope integrity)". Finding ID format correct. Score table: Scope integrity=1 (FAIL).

### D5 — Finding specificity — 1.0

Identical specificity to Trial 1: endpoint path, field names, verbatim discovery quotes, owning teams, benefit-claim override logic addressed.

### D6 — Output structure compliance — 1.0

FINDINGS → SCORE → VERDICT order. Finding ID present. Score table complete. No positive preamble.

---

## Trial 1 vs Trial 2 delta

**Finding text:** Word-for-word identical except finding ID prefix (1-H1 → 2-H1). T3 scope violation detection — which requires reading the discovery artefact and cross-referencing against each story — is fully deterministic across independent runs.

**Score table:** Identical — Traceability=4, Scope=1, AC quality=5, Completeness=4.

**Verdict:** Identical — FAIL, 1 criterion below threshold.

**Cross-trial consistency:** Confirmed. Discovery cross-reference for scope violation detection is deterministic at this model. This is the strongest reliability signal in the corpus set — T3 is the hardest case (requires discovery artefact reading), yet it is reproduced word-for-word.
