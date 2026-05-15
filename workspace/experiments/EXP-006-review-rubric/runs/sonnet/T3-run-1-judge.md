# Judge — T3 (Scope integrity HIGH) — Sonnet Trial 1

**Experiment:** EXP-006-review-rubric
**Case:** T3-scope-high
**Model:** claude-sonnet-4-6
**Trial:** 1
**Run file:** T3-run-1.md
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
  "notes": "HIGH finding 1-H1 raised for S5 and S6 with discovery out-of-scope sections quoted verbatim; specific endpoint path and field names cited; benefit-claim override logic addressed; Category B correct."
}
```

**Weighted score note:** D3 N/A redistribution applied — weights sum to 0.96 (documented rounding artifact in EVAL.md).

---

## Dimension-by-dimension analysis

### D1 — HIGH finding detection — 1.0

Finding `1-H1` raised at HIGH severity for Stories S5 and S6, Category B (Scope integrity). The finding correctly identifies the planted defect: both stories implement features that the discovery artefact explicitly defers to other teams.

**Story S5 (Broker portal read access)**: The specific endpoint `/v1/broker/clients/{clientId}/cards/{cardId}/summary` is named. The `role: adviser` OAuth path is named. The discovery out-of-scope section is quoted verbatim: "Broker portal integration: access for financial advisers and brokers to view client card data via the broker portal is a separate initiative managed by the Wealth Products team. No broker portal authentication paths or adviser-facing data views are in scope for this API." The owning team (Wealth Products) is named.

**Story S6 (KiwiSaver balance display)**: The specific fields `kiwiSaverSummary`, `currentBalance`, `fundType` are named. The discovery out-of-scope section is quoted verbatim: "KiwiSaver account integration: displaying KiwiSaver balances or account summaries alongside card data is owned by the KiwiSaver product team. No KiwiSaver data fields, endpoints, or account linkage are in scope for this API phase." The owning team (KiwiSaver product team) is named.

The model also addresses a common false-positive suppressor: S5's and S6's benefit linkage claims alignment with M1, but the model correctly states "scope deference in a discovery artefact is not overridden by a benefit claim — this requires a formal scope change approved by the discovery approvers." This demonstrates understanding of why the finding is not negated by the stories' stated justifications.

EVAL.md D1 anchor note: EVAL.md T3 anchor refers to "CSV export AC text" — this does not match the actual T3 corpus (Card Experience API). The anchor is miscalibrated for T3. D1=1.0 applied per rubric criterion: HIGH finding present, both defective elements named and quoted, Category B correct.

### D2 — Severity calibration and false-positive suppression — 1.0

Exactly one HIGH finding (`1-H1`) for the two out-of-scope stories. No spurious findings on S1–S4. The finding notes "Stories S1–S4 are well-formed and all within scope. The defect is localised to the Epic 3 stories." No phantom MEDIUM or LOW raised on the in-scope stories.

### D3 — MEDIUM finding detection — N/A

T3 adversarial HIGH case. D3 weight redistributed.

### D4 — Category attribution — 1.0

Finding `1-H1` explicitly labelled "HIGH — Category B (Scope integrity)". Finding ID `1-H1` correct format. Score table correctly reduces Scope integrity to 1 (FAIL). Category B is the correct attribution for discovering that a story implements something in the discovery out-of-scope section.

### D5 — Finding specificity — 1.0

The finding cites specifics at four levels:

1. **Story-level**: S5 and S6 named as the defective stories.
2. **Implementation-level**: Exact endpoint path (`/v1/broker/clients/{clientId}/cards/{cardId}/summary`), OAuth role (`role: adviser`), and KiwiSaver fields (`kiwiSaverSummary`, `currentBalance`, `fundType`) named — these are the concrete implementation artefacts that cross the scope boundary.
3. **Discovery-level**: Both discovery out-of-scope sections quoted verbatim, with owning team names.
4. **Override-logic addressed**: The benefit claim override argument is explicitly rejected with reasoning ("scope deference is not overridden by a benefit claim").
5. **Fix path stated**: "Stories S5 and S6 must be removed from this feature or a formal scope change must be approved — including sign-off from the original discovery approvers — and a scope note added to the definition artefact referencing the revised discovery boundary."

The fix is actionable and complete: the author knows exactly what to remove, what approval process is needed, and what documentary evidence is required.

### D6 — Output structure compliance — 1.0

FINDINGS section first, finding `1-H1`, SCORE table present (Traceability=4, Scope=1, AC quality=5, Completeness=4), VERDICT last. Finding ID format correct. No positive preamble.

---

## Key observations

1. **Discovery cross-reference performed**: T3 is the hardest case in the corpus because the scope violation is not visible within the story alone — it requires cross-referencing the discovery out-of-scope section. The model successfully performed this cross-reference, quoting the relevant discovery text verbatim for both stories.

2. **Benefit-claim override logic rejected correctly**: S5 and S6 both include benefit linkage claiming alignment with M1. The model explicitly addresses this and correctly states that benefit claims do not override a discovery out-of-scope deference. This is a subtle false-positive suppressor and the model handled it correctly.

3. **Owning teams named**: The model names the Wealth Products team (S5) and the KiwiSaver product team (S6) as the authorised owners of the deferred work. This detail is directly from the discovery out-of-scope text and demonstrates faithful artefact reading.

4. **Constraint propagation table addressed**: The model notes the constraint propagation table shows S5 and S6 implementing C2 (OAuth), but correctly states this "does not constitute scope approval" since the OAuth paths are distinct from the cardholder-facing C2 scope.
