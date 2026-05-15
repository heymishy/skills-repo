# Judge — T2-run-2 (AML C2 + C3 Competing, Trial 2)
**Case ID:** T2-competing-regulated
**Run file:** T2-run-2.md
**Model judged:** claude-haiku-4-5
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Non-eclipsing constraint propagation

Same dual-constraint input as T2-run-1. Both C2 (FMA sign-off) and C3 (5-year retention) must propagate to separate stories.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a identifies both constraints with identical precision to run-1:

- **C2:** "AML Compliance Officer sign-off required under FMA Model Risk Policy — model must pass independent validation by FMA-registered assessor before live screening." Obligation, authority, and gate condition all named. Type: "Hard activation gate."

- **C3:** "All transaction records retained at geographically separate location for minimum 5 years per AML/CFT Act s.24(1)." Separate classification as "Technical/regulatory retention requirement."

Constraint propagation plan in Step 4a explicitly assigns C2 → Story 5 and C3 → Story 4, with rationale: "C2 and C3 in separate stories due to distinct concerns."

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

**C2 → Story 5 AC3 (bold-formatted):**

> "Given the FMA assessment completes, When the FMA-registered assessor confirms model risk validation passed, Then the assessor issues a formal validation sign-off, the AML Compliance Officer authorizes activation of automated screening rules in production, and real-time screening is activated"

Plus the "Regulated Constraint (C2 — FMA Model Risk Sign-Off)" annotation block: "This story contains the hard go-live gate: AC 3 must be satisfied (FMA sign-off document received) before production deployment of automated screening."

**C3 → Story 4 ACs:** Same three ACs as run-1 (replication within 24h, 5-year integrity, recovery from primary region failure).

**Non-eclipsing verdict:** ✅ Identical story separation to run-1. Run-2 is more condensed but structurally identical. C2 in Story 5, C3 in Story 4, neither absorbed by the other.

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 5 AC3 names all three required elements:
- **(a) Obligation:** "FMA Model Risk Policy" — named
- **(b) Approving body:** "FMA-registered independent assessor" + "AML Compliance Officer" — both named
- **(c) Gate condition:** "formal validation sign-off issued" + "AML Compliance Officer authorizes activation" before screening activates

Annotation block explicitly states: "Gate condition: Model risk validation completed + formal sign-off document issued."

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated gates. Scope accumulator confirms: C2 → Story 5 AC3, C3 → Story 4 ACs. No additional compliance authorities added beyond those in the discovery input.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four MVP scope items covered:
1. ✅ Real-time event stream → Story 1
2. ✅ Configurable rule set → Story 2
3. ✅ Alert queue + workflow → Story 3
4. ✅ Full audit trail (retention) → Story 4

Run-2 is more concise than run-1 (shorter ACs, less elaboration) but scope coverage is identical. Scope accumulator present with same check. Out-of-scope correctly excluded.

---

## Score summary

```json
{
  "case": "T2",
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
  "notes": "Consistent with run-1. Non-eclipsing confirmed. Run-2 more concise but same structural quality. C2 in Story 5 AC3, C3 in Story 4 ACs. No fabricated gates."
}
```

**Weighted score:** 1.0 × 0.30 + 1.0 × 0.30 + 1.0 × 0.20 + 1.0 × 0.10 + 1.0 × 0.10 = **1.0**

**CPF (C2 only):** 1/1 = **1.0** ✅

**Verdict: PASS**
