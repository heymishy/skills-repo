# Judge — T3-run-2 (FastPay Scheme Certification Implicit, Trial 2)
**Case ID:** T3-implicit-regulated
**Run file:** T3-run-2.md
**Model judged:** claude-haiku-4-5
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Implicit constraint extraction and propagation

Same implicit C2 input as T3-run-1. FastPay certification (clause 7.3) in Background narrative only.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Run-2 uses a slightly different identification framing ("Narrative-only constraint identified (Step 4a trigger):") versus run-1's bold warning flag, but quotes the same background passage and produces the same classification:

- **Constraint 0 (C2 — Process Gate, implicit in narrative):** "FastPay scheme certification (clause 7.3) required before live routing activation"
- Obligation: "FastPay scheme membership agreement (clause 7.3)"
- Approving authority: "FastPay technical assurance team"
- Gate condition: "Scheme certification completed before live routing"
- Location: "Background narrative (NOT in Constraints section)"
- CPF note: "C2 found in narrative; model must surface and propagate to story AC"

The explicit location notation and CPF awareness note confirm Step 4a was triggered correctly. Score: 1.0. Consistent with run-1.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

Story 4 ("FastPay Scheme Certification and Go-Live Readiness (Implicit C2 Gate)") AC3 (bold-formatted):

> "Given the FastPay technical assurance assessment completes, When FastPay's technical assurance team confirms scheme certification passed, Then FastPay issues formal certification sign-off, live NZD/PHP routing through FastPay is permitted, and the routing engine switches to production mode"

C2 is elevated to a named, testable AC. The "Regulated Constraint (C2 — FastPay Scheme Certification, implicit in narrative)" annotation block confirms gate function and CPF attribution. Structurally identical to run-1 at the AC level.

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 4 AC3 names all three required elements:
- **(a) Obligation:** "FastPay scheme membership agreement clause 7.3" — specific contractual reference
- **(b) Approving body:** "FastPay technical assurance team" — explicitly named
- **(c) Gate condition:** "formal certification sign-off issued" + "live NZD/PHP routing through FastPay is permitted"

Annotation confirms: "Approving authority: FastPay technical assurance team per scheme membership agreement clause 7.3" and "Gate condition: Scheme certification assessment completed + formal sign-off document issued."

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated gates. Technical Constraints section items (SLA, fallback timing) correctly translated to technical ACs in Stories 1–3 (not process gates). Only C2 in Story 4 AC3 (grounded in narrative).

**Observed cross-run consistency:** Both runs independently produced the same C2-to-AC mapping from the same implicit narrative source. This is a positive stability signal.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All explicit MVP scope items covered:
1. ✅ Programmatic routing engine → Story 1
2. ✅ NZD/PHP via FastPay → Story 2
3. ✅ Automatic fallback → Story 3
4. ✅ Certification gate (implicit C2) → Story 4

Scope accumulator includes "real-time status tracking (implicit in routing engine)" attributed to Story 1. Same minor over-attribution as run-1 — no score impact as all explicitly named scope items are present and no scope expansion occurs.

---

## Score summary

```json
{
  "case": "T3",
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
  "notes": "Consistent with run-1. Implicit C2 extraction stable across trials. Same clause reference, same approving body, same gate condition. Both trials show stable narrative-C2 extraction behaviour. Minor: same scope accumulator over-attribution as run-1 — no impact."
}
```

**Weighted score:** 1.0 × 0.30 + 1.0 × 0.30 + 1.0 × 0.20 + 1.0 × 0.10 + 1.0 × 0.10 = **1.0**

**CPF:** 1/1 = **1.0** ✅

**Verdict: PASS**
