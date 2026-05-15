# Judge — T2 (Traceability HIGH) — Sonnet Trial 1

**Experiment:** EXP-006-review-rubric
**Case:** T2-traceability-high
**Model:** claude-sonnet-4-6
**Trial:** 1
**Run file:** T2-run-1.md
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
  "notes": "HIGH finding 1-H1 raised for S1.2 and S2.2, both named individually with constraint list quotes; Category A correct; propagation table contradiction explicitly identified."
}
```

**Weighted score note:** D3 N/A redistribution applied — weights D1=0.34, D2=0.23, D4=0.17, D5=0.11, D6=0.11, sum=0.96 (documented rounding artifact in EVAL.md spec).

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — 1.0

Finding `1-H1` raised at HIGH severity for Stories S1.2 and S2.2, Category A (Traceability). The finding correctly identifies the planted defect: C2 (PCI DSS QSA gate) is absent from both CDE-expanding stories despite the propagation table asserting it is present.

The model names both deficient stories individually:

**S1.2**: Named as connecting standby database server to CDE-scoped primary payments database — a CDE perimeter extension. Architecture Constraints section quoted: "C1 ('Replication traffic must be encrypted in transit using TLS 1.2 or above') and C3 ('Replication lag must not exceed 1 hour at any point')" — C2 absent confirmed by absence from this specific list.

**S2.2**: Named as activating standby as live CDE production system. Architecture Constraints: "lists only C3." AC3 quoted: `mode: active` — identified as the CDE activation event that C2 was created to gate.

**Propagation table discrepancy**: Explicitly called out — the table claims C2 is propagated to S1.2 (✓) and S2.2 (✓), but story text in both cases contradicts this. The model notes the table is a false assertion and that story text is authoritative.

**Correct exclusions**: S2.1 excluded with explicit note "No new CDE-scoped systems introduced"; S2.3 excluded as runbook story; S1.1 excluded as the C2 definition story itself. These exclusions demonstrate the model read every story and applied the criterion selectively, not mechanically.

EVAL.md D1 anchor note: The EVAL.md T2 anchor describes "broken discovery slug" and "missing benefit metric reference" — these do not match the actual T2 corpus defect (C2 propagation contradiction). The anchor is miscalibrated. Scoring applied against actual corpus defect: HIGH finding raised for C2 absence from both CDE-expanding stories with correct Category A attribution. D1=1.0 per rubric criterion (finding present + defect named/quoted + category correct).

### D2 — Severity calibration and false-positive suppression — 1.0

Exactly one HIGH finding raised (`1-H1`) for the legitimate planted defect. No spurious findings. No phantom MEDIUM or LOW findings raised beyond the architectural gap.

### D3 — MEDIUM finding detection — N/A

T2 adversarial HIGH case. D3 weight redistributed.

### D4 — Category attribution — 1.0

Finding `1-H1` explicitly labelled "HIGH — Category A (Traceability)". Finding ID follows `[Run]-[Severity]-[Sequence]` format. Score table correctly reduces Traceability to 1 (FAIL). Category A attribution is correct for a missing constraint reference that breaks the architectural constraint propagation chain.

### D5 — Finding specificity — 1.0

The finding operates at three levels of specificity:

1. **Story-level**: Both affected stories named (S1.2 and S2.2), with the CDE-expanding action stated for each.
2. **Field-level**: Architecture Constraints list quoted for S1.2 (exact C1 and C3 text); S2.2 constraints noted as "only C3".
3. **Criterion-level**: AC3 of S2.2 (`mode: active`) quoted as the production CDE activation event — demonstrating AC-level reasoning to establish *why* C2 applies.
4. **Artefact cross-reference**: ADR-019 named; S1.1 propagation instruction quoted verbatim ("All subsequent stories that connect infrastructure to the CDE must include a reference to this QSA gate (ADR-019)").
5. **Fix stated**: "C2 reference + ADR-019 citation" must be added to Architecture Constraints sections of both S1.2 and S2.2, plus propagation table corrected.

This exceeds the minimum D5=1.0 threshold (which requires quoting or naming the specific artefact element). The model surfaces the propagation table discrepancy as an additional specificity signal that Haiku also identified.

### D6 — Output structure compliance — 1.0

FINDINGS section first containing `1-H1`. Score table present with four rows and 1–5 scores with PASS/FAIL labels. VERDICT last. Finding ID `1-H1` correct format. No positive preamble.

---

## Key observations

1. **Adversarial pattern F7 (false propagation table) correctly identified**: The planted defect is not a simple "C2 missing" check — it requires cross-referencing the story text against a summary table that *claims* propagation is complete. The model correctly identifies the table as a false assertion and uses the story text as authoritative. This is the highest-complexity detection required in the T2 corpus.

2. **Per-story reasoning**: The model does not generically note "C2 absent from some stories." It produces a separate argument for each story: S1.2 as infrastructure connection creating CDE perimeter extension; S2.2 as activation event making standby the live processor. Different causal chains for different stories.

3. **Correct exclusion reasoning**: Three stories (S2.1, S2.3, S1.1) are correctly excluded with stated reasons. The ability to exclude correctly is as important as the ability to include — a model that flags all stories would score D1=0.4 (vague, over-inclusive finding).
