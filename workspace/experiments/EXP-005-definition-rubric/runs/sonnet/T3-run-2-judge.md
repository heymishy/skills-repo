# Judge — T3-run-2 (FastPay Scheme Certification Implicit, Trial 2)
**Case ID:** T3-implicit-regulated
**Run file:** T3-run-2.md
**Model judged:** claude-sonnet-4-6
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Implicit constraint extraction from narrative and propagation

Same implicit C2 input as T3-run-1. FastPay certification (clause 7.3 of FX settlement agreement) in Background narrative only. Replication trial for narrative extraction stability.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a opens with a Background narrative scan section and an explicit warning flag:

> "⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED"

Same passage from the discovery background is quoted, and C2 is classified:
- **Obligation:** "FX settlement agreement with the FastPay scheme — clause 7.3 (scheme certification requirement)"
- **Approving authority:** "FastPay technical assurance team"
- **Gate condition:** "FastPay scheme certification completed AND formal sign-off from FastPay technical assurance team issued — live NZD/PHP routing through FastPay is not permitted before sign-off is received"
- **Location note:** "Background narrative only — NOT in the Constraints section"

The classification is functionally identical to run-1. The CPF mandate self-instruction is also repeated: "C2 must propagate to a dedicated gate story as an explicit named AC with all three elements."

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

Story 4 ("FastPay Scheme Certification and Go-Live Gate — Implicit C2") AC3 (bold-formatted):

> "Given the FastPay scheme certification process is complete, When the FastPay technical assurance team confirms requirements under clause 7.3 of the FX settlement agreement are satisfied, Then formal certification sign-off is issued to the Payments Settlement Engineer, live routing of NZD/PHP volume through FastPay is permitted, and the sign-off document is archived as a compliance record — live routing must not begin before this sign-off is received"

Structurally identical to run-1 at the AC level. Architecture Constraints in Story 4 state: "Regulated constraint C2 (FastPay certification per clause 7.3 of FX settlement agreement) — this story IS the C2 gate. No live routing before Story 4 AC3 is satisfied."

Architecture Constraints in Stories 1 and 2 reference C2, confirming constraint scope.

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 4 AC3 names all three required elements:
- **(a) Obligation:** "clause 7.3 of the FX settlement agreement" — specific contractual reference
- **(b) Approving body:** "FastPay technical assurance team" — explicitly named
- **(c) Gate condition:** "formal certification sign-off is issued...live routing must not begin before this sign-off is received" — binary gate

**Cross-trial comparison for T3:**
Both trials produce functionally equivalent C2 extraction and AC3 formulation. Differences are cosmetic (minor phrasing variation). D1/D2/D3 = 1.0 is stable across trials. This is noteworthy because EVAL.md calibrated a T3 ceiling of 0.82 based on the assumption that narrative extraction is inconsistent — the Sonnet results (and Haiku results) show the Step 4a narrative-scan instruction produces reliable 1.0-level extraction.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated gates. Technical NFRs (settlement latency, fallback timing) treated as technical ACs in Stories 1 and 3. The only process gate is Story 4 AC3, extracted from narrative. Story 3 explicitly annotated as "outside FastPay certification scope." Zero compliance sign-offs fabricated.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All three MVP scope items covered:
1. ✅ Programmatic routing engine → Story 1
2. ✅ NZD/PHP via FastPay integration → Story 2
3. ✅ Automatic fallback → Story 3

Story 4 mandated by C2. Scope ratio 4/3 = 1.33. Out-of-scope items correctly excluded. Consistent with run-1.

---

## JSON result

```json
{
  "case_id": "T3",
  "trial": 2,
  "model_label": "claude-sonnet-4-6",
  "scores": {
    "d1_c2_identification": 1.0,
    "d2_c2_propagation": 1.0,
    "d3_c2_specificity": 1.0,
    "d4_no_fabrication": 1.0,
    "d5_decomposition_completeness": 1.0
  },
  "weighted_score": 1.0,
  "cpf_c2_score": 1.0,
  "cpf_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Narrative-only C2 extraction consistent with T3-run-1; ⚠️ flag triggered; clause 7.3 and FastPay technical assurance team named; Story 4 AC3 explicit gate; zero fabricated gates; all three MVP scope items covered; cross-trial stability at D1=D2=D3=1.0 confirmed."
}
```

---

## Verdict

**PASS — weighted 1.0, CPF = 1.0, compliant = true**
