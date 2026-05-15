# Judge: T3-run-1

**Case ID:** T3  
**Run:** 1  
**Model:** claude-haiku-4-5  
**Judge model:** claude-sonnet-4-6  
**Judge date:** 2026-05-15  
**Planted defect:** Stories S5 (Broker portal read access) and S6 (KiwiSaver balance display) implement features explicitly listed in the discovery out-of-scope section. Expected HIGH on Category B.

---

## Dimension scores

### D1 — HIGH finding detection (weight 0.34 after D3 redistribution)

**Score: 1.0**

Finding `1-H1` is present and labelled HIGH. Category B (Scope discipline) is explicitly attributed. Both out-of-scope stories are named individually:

- S5 (Broker portal read access): discovery out-of-scope text quoted verbatim — "Broker portal integration: access for financial advisers and brokers to view client card data via the broker portal is a separate initiative managed by the Wealth Products team. No broker portal authentication paths or adviser-facing data views are in scope for this API."
- S6 (KiwiSaver balance display): discovery out-of-scope text quoted verbatim — "KiwiSaver account integration: displaying KiwiSaver balances or account summaries alongside card data is owned by the KiwiSaver product team. No KiwiSaver data fields, endpoints, or account linkage are in scope for this API phase."

The cross-reference to the discovery artefact out-of-scope section is correctly made. Verdict is FAIL.

Categorical fail triggered: NO. T3 requires cross-referencing the discovery artefact — the scope violation is not detectable from the story in isolation. The model performed the cross-reference and correctly identified both violations.

### D2 — Severity calibration and false-positive suppression (weight 0.23)

**Score: 1.0**

Exactly one finding raised (1-H1 HIGH). No phantom findings raised for S1–S4 (which are within scope). The model correctly observes that "Both stories implement deferred functionality with well-formed ACs and complete fields, but both directly violate the agreed MVP scope boundary" — precisely identifying that the quality of the stories (ACs, completeness) does not redeem the scope violation. No spurious findings invented.

### D3 — MEDIUM finding detection

**Score: N/A** — D3 not applicable to T3.

### D4 — Category attribution (weight 0.17)

**Score: 1.0**

Finding attributed to "Category B: Scope discipline" — correct per corpus. Finding ID `1-H1` present. Scope integrity (B) scored 1 in score table, consistent with the HIGH finding triggering the lowest possible B score. The model's note ("Two stories (S5, S6) implement features explicitly deferred in discovery out-of-scope section. This triggers HIGH threshold for Category B") demonstrates understanding of the SKILL.md criterion.

### D5 — Finding specificity (weight 0.11)

**Score: 1.0**

Full out-of-scope text quoted verbatim for both S5 and S6. Story titles cited. Discovery out-of-scope section as the ground-truth reference is explicitly invoked (not just asserted). Fix guidance is specific: "Stories S5 and S6 must be removed from the epic or the MVP scope boundary must be formally updated in the discovery and approved before these stories proceed to /test-plan." Fully actionable without re-reading.

### D6 — Output structure compliance (weight 0.11)

**Score: 1.0**

Output follows FINDINGS → SCORE → VERDICT order. FINDINGS section first. Score table with all five criteria and 1–5 scores. VERDICT last with FAIL stated. Finding ID `1-H1` present. No positive opening before findings.

---

## Computed scores

```json
{
  "case_id": "T3",
  "run": 1,
  "model_label": "claude-haiku-4-5",
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
  "notes": "Discovery cross-reference performed correctly — both S5 and S6 identified, out-of-scope text quoted verbatim for each, correct category; discovery artefact cross-reference is the hardest check in the corpus and was executed correctly."
}
```

---

## Notable observation

T3 is the hardest adversarial case in the corpus (EVAL.md notes floor 0.82 vs 0.85 for T1/T2) because it requires cross-referencing the discovery artefact — the stories themselves do not expose the conflict. A model reviewing stories in isolation would miss both S5 and S6. The model performed the cross-reference, quoted the relevant out-of-scope text verbatim, and produced a fully specific finding. This is the most demanding detection task in the set, and the model scored maximum marks.

---

## Judge verdict

**PASS** — Weighted 0.96 ≥ 0.80. FDR_HIGH = 1.0. Compliant. All dimensions score 1.0.
