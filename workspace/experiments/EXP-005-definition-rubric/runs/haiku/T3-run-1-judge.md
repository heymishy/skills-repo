# Judge — T3-run-1 (FastPay Scheme Certification Implicit, Trial 1)
**Case ID:** T3-implicit-regulated
**Run file:** T3-run-1.md
**Model judged:** claude-haiku-4-5
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Implicit constraint extraction and propagation

The C2 (FastPay scheme certification, clause 7.3) appears **only in the Background narrative** of the discovery — not in the Constraints section. The model must trigger Step 4a on a narrative-only signal and still propagate C2 to a story AC. This is the hardest CPF test in the suite.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

The model explicitly triggers the Step 4a narrative scan path with a bold warning flag:

> "⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED (Step 4a trigger):"

It then quotes the relevant discovery passage verbatim and classifies:
- **Constraint 0 (C2 — Process Gate, implicit in narrative):** "FastPay scheme certification (clause 7.3 of scheme membership rules) required before live routing activation"
- Obligation: "FastPay scheme membership agreement (clause 7.3)"
- Approving authority: "FastPay technical assurance team"
- Gate condition: "Scheme certification completed before live routing activation"
- Type: "Process gate (hard go-live dependency)"
- Location note: "Background narrative (NOT in Constraints section)" — explicit awareness of why this is a special case

This exceeds the 1.0 calibration anchor floor for T3 ("0.7 minimum if model extracts from narrative"). The model not only extracts correctly but classifies as C2 with full three-element specification.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

Story 4 ("FastPay Scheme Certification and Go-Live Readiness (Implicit C2 Gate)") AC3 (bold-formatted):

> "Given the FastPay technical assurance assessment is complete, When FastPay's technical assurance team confirms scheme certification passed, Then FastPay issues a formal certification sign-off, live NZD/PHP routing through FastPay is permitted, and the routing engine is switched to production mode for NZD/PHP payments"

C2 is fully elevated to a named, explicit AC — not merely noted in Architecture Constraints. The Architecture Constraints annotation further states: "Regulatory constraint C2 (FastPay scheme certification per clause 7.3) is an explicit gate in this story's Acceptance Criterion 3 — production NZD/PHP routing through FastPay is not permitted until this AC is satisfied; the bank cannot go live regardless of technical readiness."

This exceeds the T3 D2 floor of 0.7 (appears in Architecture Constraints) — C2 is elevated to a full AC. Score: 1.0.

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 4 AC3 names all three required elements:
- **(a) Obligation:** "FastPay scheme membership agreement clause 7.3" — specific contractual reference including clause number
- **(b) Approving body:** "FastPay technical assurance team" — explicitly named
- **(c) Gate condition:** "formal certification sign-off" issued + "live NZD/PHP routing through FastPay is permitted" and "routing engine is switched to production mode"

Matches the 1.0 calibration anchor: "FastPay scheme certification (obligation) + FastPay technical assurance team (approving body) + certification-before-live-routing (gate condition)."

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated gates. The Constraints section of the discovery had only technical constraints (SLA, fallback timing) — the model correctly leaves these as technical ACs, not process gates. The only C2 gate in the output (Story 4 AC3) is the scheme certification extracted from the narrative. No other compliance authority or approval gate invented.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All three explicit MVP scope items covered:
1. ✅ Programmatic routing engine → Story 1
2. ✅ NZD/PHP via FastPay → Story 2
3. ✅ Automatic fallback → Story 3

Plus the implicit C2 gate story (Story 4) — correctly scoped as a gate not a feature. Scope accumulator lists "real-time status tracking (implicit in routing engine)" as covered by Story 1. This is a minor over-attribution (real-time status tracking was not a named scope item in the discovery), but it is attributed to an existing story (no scope expansion), and all explicitly stated MVP scope items are present. Out-of-scope correctly excluded (NZD/INR, NZD/VND, FX rate engine, merchant portal UI).

---

## Score summary

```json
{
  "case": "T3",
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
  "notes": "Critical CPF test passed. Implicit C2 extracted from narrative with explicit Step 4a trigger flag. Elevated to Story 4 AC3 with clause reference, approving body, and gate condition. No fabrication of technical Constraints section into process gates. Minor: scope accumulator attributes 'real-time status tracking' to Story 1 — minor over-inference but no score impact."
}
```

**Weighted score:** 1.0 × 0.30 + 1.0 × 0.30 + 1.0 × 0.20 + 1.0 × 0.10 + 1.0 × 0.10 = **1.0**

**CPF:** 1/1 narrative C2 propagated to story AC = **1.0** ✅

**Verdict: PASS**
