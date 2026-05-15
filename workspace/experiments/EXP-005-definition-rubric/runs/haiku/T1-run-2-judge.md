# Judge — T1-run-2 (PCI DSS QSA Explicit, Trial 2)
**Case ID:** T1-explicit-regulated
**Run file:** T1-run-2.md
**Model judged:** claude-haiku-4-5
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a identifies C2 as "Constraint 1 (C2 — Process Gate)" with obligation (PCI DSS), approving authority (External QSA), gate condition (SAQ D compliance + QSA sign-off before production), type ("Hard go-live gate (process gate)"). Identical identification quality to run-1. Consistent with 1.0 calibration anchor.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

Story 5 ("PCI DSS QSA Compliance Assessment and Sign-Off (Go-Live Gate)") AC3:

> "Given the QSA assessment completes, When the external QSA confirms SAQ D compliance and scope elimination, Then a formal QSA sign-off document is issued, production activation is permitted, and the scope reduction claim (14 → ≤3 systems) is formally recognised"

Bold formatting applied to AC3 explicitly highlights the regulated gate. The "Regulated Constraint (C2 — PCI DSS QSA Sign-Off)" annotation in the Architecture Constraints section further confirms the story's gate function. C2 is fully elevated to a named, testable AC.

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 5 AC3 names all three required elements:
- **(a) Obligation:** PCI DSS SAQ D ("external QSA (FMA-registered assessor or PCI DSS-qualified auditor)")
- **(b) Approving body:** "external QSA (PCI DSS-qualified auditor)"
- **(c) Gate condition:** "formal QSA sign-off document is issued, production activation is permitted"

Minor observation: run-2 uses "FMA-registered assessor or PCI DSS-qualified auditor" — combining FMA (AML) and PCI terminology. This is slightly imprecise for a PCI-only scope. The QSA for PCI DSS is a PCI DSS-qualified auditor, not an FMA-registered assessor (which is AML-specific). However, the AC still meets the 1.0 threshold because all three elements are present and a coding agent can implement a gate check. Noted as a minor precision slip with no score impact.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated gates. Only the QSA gate (grounded in discovery Constraint 1) appears. No unsupported compliance authorities added.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four MVP scope items covered:
1. ✅ TrustVault API integration → Story 1
2. ✅ PAN tokenisation at capture → Story 2
3. ✅ Detokenisation at point-of-use → Story 3
4. ✅ Audit logging → Story 4

Scope accumulator present and complete. Out-of-scope items correctly excluded. Run-2 is slightly more condensed than run-1 (shorter ACs) but covers the same scope.

---

## Score summary

```json
{
  "case": "T1",
  "run": 2,
  "model": "claude-haiku-4-5",
  "d1": 1.0,
  "d2": 1.0,
  "d3": 1.0,
  "d4": 1.0,
  "d5": 1.0,
  "weighted_score": 1.0,
  "cpf_c2_score": 1.0,
  "cpf_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Consistent with run-1. Minor precision slip in approving body (FMA vs PCI terminology) — no score impact. Gate correctly propagated. All MVP scope covered."
}
```

**Weighted score:** 1.0 × 0.30 + 1.0 × 0.30 + 1.0 × 0.20 + 1.0 × 0.10 + 1.0 × 0.10 = **1.0**

**CPF:** 1/1 = **1.0** ✅

**Verdict: PASS**
