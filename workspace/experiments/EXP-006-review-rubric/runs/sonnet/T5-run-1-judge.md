# Judge — T5 (Clean baseline) — Sonnet Trial 1

**Experiment:** EXP-006-review-rubric
**Case:** T5-clean-baseline
**Model:** claude-sonnet-4-6
**Trial:** 1
**Run file:** T5-run-1.md
**Judge model:** claude-sonnet-4-6 (acting as judge on own prior output)
**Date:** 2026-05-15

---

## Score JSON

```json
{
  "case_id": "T5",
  "model_label": "claude-sonnet-4-6",
  "scores": {
    "d1_high_detection": "N/A",
    "d2_severity_calibration": 1.0,
    "d3_medium_detection": "N/A",
    "d4_category_attribution": 1.0,
    "d5_finding_specificity": 1.0,
    "d6_output_structure": 1.0
  },
  "weighted_score": 1.00,
  "fdr_high_score": "N/A",
  "fdr_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Zero findings of any severity; PASS verdict; D2 categorical fail condition avoided; per-dimension positive verification with specific artefact citations."
}
```

**Weighted score note:** D1 and D3 both N/A — weight redistributed proportionally to D2, D4, D5, D6 (redistribution sums to 1.00 with exact fractions; using 1.00 consistent with Haiku scorecard convention).

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — N/A

T5 is the clean baseline — no planted defect of any severity. D1 weight redistributed.

### D2 — Severity calibration and false-positive suppression — 1.0

**Critical test for T5.** Zero findings produced of any severity (HIGH, MEDIUM, or LOW). The PASS verdict is produced. The D2 categorical fail condition (any HIGH finding on T5 → D2=0.0, compliant=false) was **not triggered**.

The most common phantom finding pattern noted in EVAL.md — a spurious MEDIUM under Category D ("benefit linkage is vague") — was not triggered. The T5 corpus has explicit benefit linkage; the model correctly scores it at 5 rather than raising a phantom concern.

D2 = 1.0. Clean baseline is clean.

### D3 — MEDIUM finding detection — N/A

T5 clean baseline. No MEDIUM expected. D3 weight redistributed.

### D4 — Category attribution — 1.0

No findings raised. The score table has all four criteria at 5 (PASS). D4 = 1.0 — no wrongly attributed findings is trivially correct; the non-trivial part is the correct 5-score assignment confirming the model read each criterion and validated it positively.

### D5 — Finding specificity — 1.0

No findings to assess for specificity in the standard sense. However, the Findings section contains per-criterion positive verification notes with specific artefact citations:

**Traceability check**: Discovery reference cited (path, status Approved, named approvers). Benefit metric cited (Active, M1 and M2 targets). Story-level benefit linkage cited.

**Scope integrity check**: Each story mapped to a specific discovery MVP scope item. Discovery out-of-scope items named and confirmed absent from all stories.

**AC quality check**: S1.3 AC4 timing criterion cited (≤ 10 seconds, 50,000 rows, p95). S2.1 AC2 CSV format and 3-second timing cited explicitly. All ACs confirmed in GWT format with specific measurable outcomes. Absence of "should" language confirmed.

**Completeness check**: S2.2 effort cited as L (5 days) — specifically addressing the gap that existed in T4. C1 and C2 propagation to all four stories confirmed. NFRs confirmed as containing p95/p99 qualifiers and numeric thresholds.

D5 = 1.0. The per-criterion citation structure means the operator can verify the PASS conclusion without re-reading the entire story set — each verification is documented with the specific artefact element that satisfies the criterion.

### D6 — Output structure compliance — 1.0

FINDINGS section present (with explicit "No findings" statement followed by verification narrative). SCORE table present: Traceability=5, Scope=5, AC quality=5, Completeness=5, all PASS. VERDICT last: "PASS — all criteria scored 3 or above." Finding ID format not applicable (no findings). Structure is fully compliant.

---

## Key observations

1. **Clean baseline correctly returned PASS**: Zero phantom findings produced. This is the most important T5 outcome — the model does not hallucinate issues on a well-formed story set.

2. **Verification narrative is proactive and specific**: Rather than simply stating "no findings", the model walks through each check with specific story/AC/field citations confirming why each criterion passes. This provides transparency for downstream operators who want to know *why* the output is PASS, not just that it is.

3. **T4-gap remediation confirmed for T5**: The model explicitly notes S2.2 effort = L (5 days) — the gap that existed in T4 (S2.2 blank effort) is confirmed as resolved in T5. Similarly, S1.3 AC4 timing criterion is explicitly verified — the gap that existed in T4 (S1.3 blank NFR) is confirmed as resolved. This demonstrates the model reads each story against the previous pattern, not in isolation.

4. **Most common phantom pattern not triggered**: EVAL.md notes "vague benefit linkage" as the most common T5 phantom MEDIUM. The model assigned Completeness=5 without raising a concern — benefit linkage in T5 is complete, and the model correctly did not manufacture a phantom finding.
