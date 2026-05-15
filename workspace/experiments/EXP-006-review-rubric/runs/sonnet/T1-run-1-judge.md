# Judge — T1 (AC quality HIGH) — Sonnet Trial 1

**Experiment:** EXP-006-review-rubric
**Case:** T1-ac-quality-high
**Model:** claude-sonnet-4-6
**Trial:** 1
**Run file:** T1-run-1.md
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
  "notes": "HIGH finding 1-H1 raised for S2.2 with all three ACs quoted verbatim and NFR vacuousness explained; Category C correct; no spurious findings."
}
```

**Weighted score note:** D3 N/A weight redistribution applied per EVAL.md spec — D1=0.34, D2=0.23, D4=0.17, D5=0.11, D6=0.11. These sum to 0.96, not 1.00 — documented rounding artifact in spec. Literal application used.

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — 1.0

Finding `1-H1` raised at HIGH severity for Story S2.2, attributed to Category C (AC quality). The finding correctly identifies the planted defect: all three ACs lack Given/When/Then structure and contain unmeasurable "should" language. The model names each AC individually:

- AC1: "The failover should complete quickly." — "Quickly" is not a measurable criterion; no precondition or triggering action.
- AC2: "The system should handle load gracefully during failover." — "Handle load gracefully" is untestable; no load level or behaviour specified.
- AC3: "Monitoring alerts should fire promptly when failover is activated." — "Promptly" is not a measurable criterion; no alert name, threshold, or timing value.

The finding also notes the vacuous NFR: "Must comply with RTO requirements" — naming no RTO value and unverifiable independently. The NFR gap is linked to Discovery constraint C3 (RTO ≤ 4 hours).

EVAL.md D1 T1 anchor: "HIGH finding in Category C naming the AC count (fewer than 3) or the absence of Given/When/Then structure; verdict FAIL" — fully satisfied. Verdict correctly FAIL.

### D2 — Severity calibration and false-positive suppression — 1.0

Exactly one HIGH finding raised (`1-H1`), which is the legitimate planted defect. No spurious HIGH or MEDIUM findings beyond the legitimate one. No phantom findings of any kind.

### D3 — MEDIUM finding detection — N/A

T1 is an adversarial HIGH case. D3 weight (0.15) redistributed proportionally to remaining dimensions.

### D4 — Category attribution — 1.0

Finding `1-H1` explicitly labelled "HIGH — Category C (AC quality)". Finding ID follows `[Run]-[Severity]-[Sequence]` format. The score table correctly reduces AC quality to 1 (FAIL). Category attribution is correct and unambiguous.

### D5 — Finding specificity — 1.0

All three AC texts quoted verbatim. NFR text quoted verbatim. The discovery constraint C3 (RTO ≤ 4 hours) is named as the value the NFR must carry. The fix is actionable without re-reading the story: "rewrite ACs in GWT format with specific measurable outcomes; update NFR to state RTO ≤ 4 hours." Maximum specificity within the D5 rubric.

Additional note for D5 comparison: Sonnet also explains per-AC *why* each fails (no precondition, no load level, no alert name) — this contextual reasoning per failing element goes beyond the minimum "AC quoted + defect class named" level that satisfies D5=1.0.

### D6 — Output structure compliance — 1.0

Output begins with the FINDINGS section containing finding `1-H1`. Score table present with four rows (Traceability, Scope integrity, AC quality, Completeness), each with a 1–5 score and PASS/FAIL label. VERDICT appears last. Finding ID format `1-H1` is correct. No positive summary before findings.

---

## Key observations

1. **Per-AC granularity**: Each of the three failing ACs is quoted and critiqued individually. The model does not summarise the defect as "ACs lack GWT" — it names the specific unmeasurable word in each AC ("quickly", "gracefully", "promptly") and explains what element is missing from each. This specificity exceeds the D5=1.0 anchor requirement.

2. **NFR linkage to discovery**: The NFR gap is not merely noted as "incomplete" — the exact discovery constraint value (RTO ≤ 4 hours) is named as the required fix. This demonstrates discovery cross-referencing on a completeness sub-issue within a T1 AC-quality case.

3. **Scope exclusion correct**: The model correctly states the defect is "localised to S2.2" and notes all other stories (S1.1, S1.2, S2.1, S2.3) have well-formed GWT ACs. No false-positive scope concern raised on correct stories.
