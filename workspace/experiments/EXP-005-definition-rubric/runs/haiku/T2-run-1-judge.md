# Judge — T2-run-1 (AML C2 + C3 Competing, Trial 1)
**Case ID:** T2-competing-regulated
**Run file:** T2-run-1.md
**Model judged:** claude-haiku-4-5
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Non-eclipsing constraint propagation

This case has two regulated constraints — C2 (FMA Model Risk sign-off, process gate) and C3 (5-year retention, AML/CFT Act). The key evaluation question is whether one constraint eclipses the other in the decomposition. **Non-eclipsing means both must appear in separate stories with distinct ACs.**

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a identifies both constraints clearly and with distinct classifications:

- **C2 (Process Gate):** "AML Compliance Officer sign-off required under FMA Model Risk Policy before activation of automated screening rules — the model must pass independent validation by an FMA-registered assessor." Obligation (FMA Model Risk Policy), approving authority (AML Compliance Officer + FMA-registered assessor), gate condition (validation completed before screening rules activated), type (hard activation dependency).

- **C3 (Retention Rule):** "All transaction records and all screening decisions must be retained at a geographically separate location for a minimum of 5 years per AML/CFT Act s.24(1)." Correctly classified as a separate retention constraint with its own trigger story.

Both identified with distinct types. Neither eclipses the other at identification stage.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

**C2 → Story 5 AC3:**

> "Given the FMA assessment is complete, When the FMA-registered assessor confirms model risk validation passed, Then the assessor issues a formal validation sign-off, the AML Compliance Officer authorizes activation of automated screening rules in production, and real-time screening is activated"

AC3 bold-formatted, with explicit Architecture Constraints annotation: "Regulated constraint C2 (FMA Model Risk sign-off) is an explicit gate in this story's Acceptance Criterion 3 — production activation is not permitted until this AC is satisfied."

**C3 → Story 4 ACs (three distinct ACs):**
- AC1: geographic replication within 24 hours
- AC2: 5-year historical record availability with integrity verification
- AC3: recovery from primary region unavailability

**Non-eclipsing verdict:** ✅ C2 and C3 are in separate stories (5 and 4 respectively). Neither constraint's story absorbs or replaces the other. Constraint propagation plan in Step 4a explicitly states "C2 and C3 are in separate stories because they address different concerns (process gate vs. data engineering)."

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

Story 5 AC3 names all three required elements:
- **(a) Obligation:** "FMA Model Risk Policy" — explicitly named
- **(b) Approving body:** "FMA-registered assessor" (validation) AND "AML Compliance Officer" (activation authorization) — both roles named
- **(c) Gate condition:** "formal validation sign-off" issued + "AML Compliance Officer authorizes activation" before "real-time screening is activated"

Matches the 1.0 calibration anchor exactly: "FMA Model Risk Policy (obligation), AML Compliance Officer / FMA-registered assessor (approving body), independent validation completed before activation (gate condition)."

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated gates. Only C2 (FMA sign-off) and C3 (AML/CFT retention) appear, both grounded in discovery Constraints. No "FATF sign-off," no "OFAC certification," no other invented compliance gate present anywhere in the output.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four Discovery MVP scope items covered:
1. ✅ Real-time event stream → Story 1
2. ✅ Configurable rule set → Story 2
3. ✅ Alert queue + compliance workflow → Story 3
4. ✅ Full audit trail (implicit in retention requirement) → Story 4

Correctly excluded: SAR filing automation, upstream payment origination changes, watchlist management UI, historical re-screening. Scope accumulator complete.

---

## Score summary

```json
{
  "case": "T2",
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
  "notes": "Non-eclipsing test passes: C2 in Story 5 AC3, C3 in Story 4 ACs. Both constraints fully propagated to separate stories. FMA obligation, approving authority, and gate condition all named. No fabricated gates."
}
```

**Weighted score:** 1.0 × 0.30 + 1.0 × 0.30 + 1.0 × 0.20 + 1.0 × 0.10 + 1.0 × 0.10 = **1.0**

**CPF (C2 only):** 1/1 C2 process gate propagated = **1.0** ✅

**Verdict: PASS**
