# Judge — T4 (MEDIUM + LOW only) — Sonnet Trial 1

**Experiment:** EXP-006-review-rubric
**Case:** T4-medium-low-only
**Model:** claude-sonnet-4-6
**Trial:** 1
**Run file:** T4-run-1.md
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
  "notes": "No HIGH raised; MEDIUM correctly produced for missing performance NFR in S1.3 (Category D) with discovery source quoted; both LOWs produced; D2 categorical fail condition avoided."
}
```

**Weighted score note:** D1 N/A — weight redistributed proportionally to D2, D3, D4, D5, D6 (redistribution sums to 1.00 with exact fractions; minor rounding variation noted as in Haiku scorecard convention — using 1.00).

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — N/A

T4 has no planted HIGH defect. D1 weight redistributed to remaining dimensions.

### D2 — Severity calibration and false-positive suppression — 1.0

**Critical test for T4.** Zero HIGH findings produced. The model raised `1-M1` (MEDIUM) and `1-L1` / `1-L2` (LOW). The MEDIUM defect (missing performance NFR in S1.3) was not escalated to HIGH. This confirms the model correctly applies the SKILL.md Category D severity calibration: a blank NFR section maps to MEDIUM, not HIGH. The HIGH threshold in Category D requires a missing user story or generic persona — conditions not present in T4.

The categorical fail condition (any HIGH finding on T4 → D2=0.0) was **not triggered**. D2 = 1.0.

### D3 — MEDIUM finding detection — 1.0

Finding `1-M1` raised at MEDIUM severity for Story S1.3, Category D (Completeness). The finding:
- Names S1.3 explicitly as the story with the blank NFR section.
- Quotes the S1.3 NFR field: "None recorded."
- Quotes the discovery scope item 2 verbatim: "report generation shall complete within 10 seconds for datasets up to 50,000 rows."
- Explains the downstream impact: "A test plan written against this story cannot include a timing assertion, because no timing threshold exists in the story. The discovery performance target becomes invisible to the implementation."
- Correctly calibrates severity: "not a fundamental story defect — it is a missing NFR that must be added before /test-plan."
- Attributes Category D.

This satisfies the EVAL.md D3=1.0 criterion: MEDIUM finding raised + S1.3 named + missing performance NFR cited + discovery source referenced + Category D. D3 = 1.0.

**Note on EVAL.md D3 calibration status:** The EVAL.md D3 section was updated prior to these Sonnet runs to correctly describe the actual T4 corpus planted MEDIUM (missing performance NFR Category D, not "should" language Category C). This run validates that correction — the model correctly identifies the Category D MEDIUM that the corrected spec describes.

### D4 — Category attribution — 1.0

All three findings correctly attributed:
- `1-M1` → Category D (Completeness) ✓ — S1.3 blank NFR maps to Category D MEDIUM.
- `1-L1` → Category C (AC quality) ✓ — S2.1 AC2 underprecise maps to Category C LOW.
- `1-L2` → Category D (Completeness) ✓ — S2.2 blank effort estimate maps to Category D LOW.

Finding IDs follow `[Run]-[Severity]-[Sequence]` format: `1-M1`, `1-L1`, `1-L2`. D4 = 1.0.

Note: EVAL.md D4 corpus anchor for T4 reads "Category C(MEDIUM)+D(LOW)" — this reflects the pre-correction EVAL.md D3 description. After the D3 correction, the correct attribution is D(MEDIUM) + C(LOW) + D(LOW). The Sonnet run matches the corrected attribution.

### D5 — Finding specificity — 1.0

All three findings cite specific artefact elements:

**1-M1**: Quotes "None recorded" from S1.3 NFR. Quotes the exact discovery performance requirement text. Explains why the absence breaks downstream test plan writing. Provides the exact NFR text to add: "Report generation must complete within 10 seconds for datasets up to 50,000 rows at p95."

**1-L1**: Quotes S2.1 AC2 verbatim: "Given the user clicks Download, when the file is ready, then the report downloads successfully." Names both missing elements: (1) CSV format specification, (2) 3-second timing criterion from discovery scope item 2. Correctly notes AC2 is not *wrong*, just underprecise.

**1-L2**: Names S2.2 as the story with blank effort. Lists all other stories' effort estimates for comparison: S1.1 (L 4d), S1.3 (L 4d), S2.1 (S 2d). This comparative context makes the gap immediately visible.

D5 = 1.0. Additionally: for `1-M1`, the downstream impact reasoning ("test plan can't include a timing assertion") and specific NFR text to add exceed the minimum D5=1.0 requirement — Sonnet provides fix specification, not just defect description.

### D6 — Output structure compliance — 1.0

FINDINGS section first with `1-M1`, `1-L1`, `1-L2`. SCORE table present: Traceability=5, Scope=5, AC quality=3, Completeness=2 (FAIL). VERDICT last. Finding IDs in correct format. No positive preamble.

---

## Key observations

1. **D2 categorical fail avoided**: The most critical test for T4 is that no HIGH finding is raised. This model correctly applied SKILL.md Category D severity rules — a blank NFR is MEDIUM, not HIGH. Zero HIGH findings produced.

2. **D3 MEDIUM detection with downstream impact reasoning**: Finding `1-M1` goes beyond identifying the absence — it explains why the absence matters (test plan cannot include timing assertions) and specifies the exact fix. This is the most actionable of all 10 runs' findings.

3. **Both LOWs detected with comparison context**: `1-L2` (blank effort) provides the comparator stories' estimates alongside the gap — making the gap quantitatively visible. Most models that find a blank effort field note the absence; providing the comparison list is an additional step.

4. **Completeness score correctly reduced**: Score table shows Completeness=2 (FAIL) — the MEDIUM gap on S1.3 and LOW gap on S2.2 together bring completeness below threshold. The model correctly applies the "one MEDIUM in completeness → criterion scores 2" logic.
