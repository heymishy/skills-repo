# Judge — T1-run-1 (PCI DSS QSA Explicit, Trial 1)
**Case ID:** T1-explicit-regulated
**Run file:** T1-run-1.md
**Model judged:** claude-sonnet-4-6
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Explicit regulated constraint identification and propagation

C2 (PCI DSS QSA sign-off — SAQ D compliance) appears in the Constraints section of the discovery. The model must identify it, classify it as a process gate, and propagate it to at least one story AC naming obligation, approving body, and gate condition.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a identifies the constraint with full classification:

> "Constraint 1 (C2 — Process Gate): 'PCI DSS QSA sign-off required before production go-live — the tokenisation system must achieve SAQ D compliance and pass an external QSA assessment prior to production activation.'"

All three required elements are named at identification time:
- **Obligation:** "PCI DSS (Payment Card Industry Data Security Standard)"
- **Approving authority:** "External QSA (Qualified Security Assessor — PCI SSC-certified auditor)"
- **Gate condition:** "SAQ D compliance achieved AND external QSA assessment passed AND formal sign-off document issued — production activation not permitted until all three conditions met"
- **Type:** "Process gate — hard go-live dependency with no technical workaround"

The CPF mandate is also stated explicitly: "C2 must propagate to at least one story as an explicit named AC (not only an architecture note) naming PCI DSS, external QSA, and SAQ D compliance." This self-instruction demonstrates the model understands the SKILL.md requirement for elevation to AC.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

Story 5 ("PCI DSS QSA Compliance Assessment and Go-Live Gate") AC3 (bold-formatted):

> "Given the external QSA assessment is complete, When the QSA confirms that the tokenisation architecture achieves SAQ D compliance and that the application tier has achieved PCI DSS scope elimination (≤3 in-scope systems), Then a formal QSA sign-off document is issued to the Compliance Officer, production activation of the tokenised payment flow is permitted, and the scope reduction claim (from 14 to ≤3 in-scope systems) is formally documented in the QSA report — and not before"

C2 is elevated to a named, explicit AC (not merely noted in Architecture Constraints). The Story 5 Architecture Constraints field further states: "Regulated constraint C2 (PCI DSS QSA — HARD GATE): This story IS the regulated process gate. Production activation of the tokenised architecture is explicitly blocked until AC3 below is satisfied. No exception, no interim production use, no shadow-mode bypass of this constraint."

C2 also appears in Architecture Constraints of Stories 1–4, correctly identifying all stories within the PCI DSS CDE scope.

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 5 AC3 names all three required elements:
- **(a) Regulation/obligation:** "PCI DSS" and "SAQ D compliance" — specific standard and questionnaire type named
- **(b) Approving body/role:** "QSA" — external Qualified Security Assessor; also named as "QSA firm" in Story 5 AC1 context
- **(c) Gate condition:** "formal QSA sign-off document is issued to the Compliance Officer, production activation of the tokenised payment flow is permitted...and not before" — explicit, binary gate

The scope reduction component also adds precision: "scope reduction claim (from 14 to ≤3 in-scope systems) is formally documented in the QSA report" — this directly ties the gate condition to the benefit metric (M1).

Matches the T1 calibration anchor: "PCI DSS QSA AC names all three elements; QSA gate is a HARD blocker before production activation."

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated gates in any story. Technical constraints (latency ≤200ms, no PAN in logs) are correctly treated as NFR notes in Stories 2 and 3. They appear as "NFR (Constraint 2)" and "NFR (Constraint 3)" annotations — not as process gates. The only process gate in the output is the QSA gate in Story 5 AC3, which is directly grounded in the discovery Constraints section.

No GDPR review, SOX sign-off, or other unsupported compliance gate appears anywhere in the output.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four discovery MVP scope items are covered:
1. ✅ Tokenise PAN at capture → Story 2
2. ✅ TrustVault API integration → Story 1
3. ✅ Detokenise at point of use → Story 3
4. ✅ Audit logging → Story 4

Story 5 (QSA gate) is mandated by C2, not a scope addition. Scope ratio 5/4 = 1.25 — acceptable per SKILL.md. Out-of-scope items (mobile SDK, bulk migration, ongoing QSA cadence) correctly excluded. Scope accumulator note confirms 4/4 coverage with no unexplained additions.

---

## JSON result

```json
{
  "case_id": "T1",
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
  "notes": "C2 (PCI DSS QSA — SAQ D) correctly identified in Step 4a with all three elements; elevated to Story 5 AC3 as explicit hard go-live gate naming PCI DSS, external QSA, and SAQ D compliance; Architecture Constraints annotated in Stories 1–4; no fabricated gates; all four MVP scope items covered."
}
```

---

## Verdict

**PASS — weighted 1.0, CPF = 1.0, compliant = true**
