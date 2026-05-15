# Judge — T3-run-1 (FastPay Scheme Certification Implicit, Trial 1)
**Case ID:** T3-implicit-regulated
**Run file:** T3-run-1.md
**Model judged:** claude-sonnet-4-6
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Implicit constraint extraction from narrative and propagation

C2 (FastPay scheme certification, clause 7.3 of the FX settlement agreement) appears **only in the Background narrative** of the discovery — not in the Constraints section. The Constraints section contains only two technical NFRs (settlement latency SLA, fallback timing). The model must trigger Step 4a on a narrative-only signal and propagate C2 to a story AC before decomposing. This is the hardest CPF test in the suite. EVAL.md calibration expects a maximum of 0.82 for T3 because "extracting an implicit constraint from narrative is harder."

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a leads with a Background narrative scan and an explicit warning flag:

> "⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED"

The model quotes the relevant discovery passage:

> "Our FX settlement agreement with the scheme requires scheme certification before we can route live volume through the new path — this is a contractual obligation, not a technical preference."

It then classifies:
- **Obligation:** "FX settlement agreement with FastPay — clause 7.3 (scheme certification requirement)"
- **Approving authority:** "FastPay technical assurance team"
- **Gate condition:** "FastPay scheme certification obtained AND formal sign-off from FastPay technical assurance team received — live routing of NZD/PHP volume through the new path is not permitted before both conditions are met"
- **Location note:** "Background narrative only — does NOT appear in the Constraints section"
- **Type:** "Process gate — hard go-live dependency; no technical workaround"

The explicit notation that C2 is "Background narrative only — does NOT appear in the Constraints section" demonstrates correct Step 4a trigger logic: the model actively distinguished between Constraints section content and Background narrative and applied the narrative scan path.

The model also states the CPF mandate self-instruction: "C2 MUST propagate to at least one story as an explicit named AC with all three elements named — this is a CPF-critical requirement, not optional."

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

Story 4 ("FastPay Scheme Certification and Go-Live Gate — Implicit C2") AC3 (bold-formatted):

> "Given the FastPay scheme certification process is complete, When the FastPay technical assurance team confirms that the NZD/PHP routing implementation satisfies scheme requirements under clause 7.3 of the FX settlement agreement, Then a formal certification sign-off document is issued and received by the Payments Settlement Engineer, live routing of NZD/PHP payment volume through the FastPay path is permitted, and the sign-off document is stored as a compliance artefact — live routing must not begin before this sign-off is received"

C2 is fully elevated to a named, explicit, testable AC — not merely noted in Architecture Constraints. The Architecture Constraints annotation for Story 4 further states: "Regulated constraint C2 (FastPay certification, clause 7.3) — THIS STORY IS THE C2 GATE. Production NZD/PHP routing through FastPay is NOT permitted until Story 4 AC3 is satisfied."

Architecture Constraints in Stories 1 and 2 also reference C2, establishing the constraint's upstream scope.

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 4 AC3 names all three required elements:
- **(a) Obligation:** "clause 7.3 of the FX settlement agreement" — specific contractual reference including clause number
- **(b) Approving body:** "FastPay technical assurance team" — explicitly named
- **(c) Gate condition:** "formal certification sign-off document is issued and received...live routing must not begin before this sign-off is received" — binary gate, explicitly stated

Matches the T3 D3 calibration anchor: "FastPay scheme certification (obligation) + FastPay technical assurance team (approving body) + certification-before-live-routing (gate condition)."

Note on EVAL.md calibration: EVAL.md sets expected T3 ceiling at 0.82, but Sonnet achieves 1.0. This confirms that the Step 4a narrative-scan instruction in the current SKILL.md is strong enough to produce ceiling-exceeding specificity even for narrative-only inputs. This is consistent with the Haiku T3 result (also 1.0 in both trials), and suggests the 0.82 ceiling was calibrated for older or less-specific SKILL.md instructions.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated gates. The Constraints section technical NFRs (settlement latency ≤4h at p95, fallback within 30s) are correctly treated as technical ACs in Stories 1 and 3 respectively. They are NOT elevated to process gates. The only process gate in the output is the C2 certification gate in Story 4 AC3, extracted directly from the narrative.

Story 3 ("Automatic Fallback Routing") is explicitly noted as "outside FastPay certification scope" — demonstrating the model correctly bounded C2's scope rather than expanding it to every story.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All three discovery MVP scope items are covered:
1. ✅ Programmatic routing engine → Story 1
2. ✅ NZD/PHP via FastPay integration → Story 2
3. ✅ Automatic fallback mechanism → Story 3

Story 4 (certification gate) is mandated by C2. Scope ratio 4/3 = 1.33 — acceptable per SKILL.md. Out-of-scope items (NZD/INR and NZD/VND corridors, FX rate engine) correctly excluded. Scope accumulator confirms 3/3 coverage.

---

## JSON result

```json
{
  "case_id": "T3",
  "trial": 1,
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
  "notes": "Narrative-only C2 (FastPay certification clause 7.3) correctly extracted with explicit ⚠️ flag and Background narrative scan; propagated to Story 4 AC3 naming clause 7.3, FastPay technical assurance team, and certification-before-live-routing gate; exceeds EVAL.md expected T3 ceiling of 0.82; technical SLA constraints correctly treated as NFRs; zero fabricated gates; all three MVP scope items covered."
}
```

---

## Verdict

**PASS — weighted 1.0, CPF = 1.0, compliant = true**

*Note: 1.0 exceeds the EVAL.md T3 expected ceiling of 0.82. This is consistent with Haiku T3 Trial 1 (also 1.0) and indicates Step 4a narrative-scan instructions are sufficiently specific to produce reliable narrative-only constraint extraction regardless of model tier.*
