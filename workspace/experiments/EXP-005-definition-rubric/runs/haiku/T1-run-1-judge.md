# Judge — T1-run-1 (PCI DSS QSA Explicit, Trial 1)
**Case ID:** T1-explicit-regulated
**Run file:** T1-run-1.md
**Model judged:** claude-haiku-4-5
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a explicitly identifies C2 as "Constraint 1 (C2 — Process Gate):" with all required components:
- Obligation: "PCI DSS"
- Approving authority: "External QSA"
- Gate condition: "SAQ D compliance achieved + QSA sign-off received before production activation"
- Type: "Process gate (hard go-live dependency)"

The model correctly frames C2 as a hard go-live blocker (not just a compliance note), consistent with the 1.0 calibration anchor: "PCI DSS QSA sign-off identified by name, SAQ D compliance and external QSA assessment referenced."

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

Story 5 ("PCI DSS QSA Sign-Off and Go-Live Readiness") AC3:

> "Given the QSA assessment is complete, When the external QSA confirms SAQ D compliance achieved and the tokenisation architecture eliminates PCI scope for the application tier, Then a formal QSA sign-off document is issued, production activation is permitted, and the scope reduction (14 systems → ≤3 in-scope systems) is formally claimed"

C2 is fully elevated to a named, explicit AC in the triggering story. The Architecture Constraints section additionally labels it: "Regulated constraint C2 (PCI DSS QSA sign-off) is an explicit gate in this story's Acceptance Criterion 3 — production activation is not permitted until this AC is satisfied." This exceeds the minimum 1.0 threshold and satisfies Step 4a.2 (trigger assignment) and 4a.3 (Architecture Constraints insertion).

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 5 AC3 names all three required elements:
- **(a) Obligation:** "SAQ D compliance achieved" — SAQ D is PCI DSS-specific language; unambiguous regulatory reference
- **(b) Approving body:** "external QSA (FMA-registered assessor or equivalent PCI DSS-qualified auditor)"
- **(c) Gate condition:** "formal QSA sign-off document is issued, production activation is permitted"

A coding agent can implement a deployment gate test that asserts the QSA sign-off document path/field exists before activating production. All three specificity elements present.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No unsupported process gates in any story ACs or Architecture Constraints fields. The only C2 gate in the output (Story 5 AC3) is grounded in "Constraint 1" of the discovery Constraints section. No GDPR review, SOX sign-off, or other fabricated gate appears anywhere in the output.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four Discovery MVP scope items are covered:
1. ✅ Tokenise PANs at API boundary → Story 2
2. ✅ Integrate with TrustVault → Story 1
3. ✅ Detokenise at point-of-use → Story 3
4. ✅ Audit logging for tokenise/detokenise → Story 4

Scope accumulator completed explicitly. Out-of-scope items (mobile SDK, refunds/chargebacks, merchant portal, bulk PAN migration) correctly excluded. No silent scope expansion observed. Story 5 is correctly scoped as a gate story (not a feature story), consistent with the discovery constraint structure.

---

## Score summary

```json
{
  "case": "T1",
  "run": 1,
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
  "notes": "Clean propagation. C2 identified by name in Step 4a, elevated to Story 5 AC3 with all three specificity elements. No fabricated gates. Full MVP coverage."
}
```

**Weighted score:** 1.0 × 0.30 + 1.0 × 0.30 + 1.0 × 0.20 + 1.0 × 0.10 + 1.0 × 0.10 = **1.0**

**CPF:** 1 C2 constraint in discovery / 1 propagated to story AC = **1.0** ✅

**Verdict: PASS**
