# Judge — T2-run-2 (AML Competing Constraints, Trial 2)
**Case ID:** T2-competing-regulated
**Run file:** T2-run-2.md
**Model judged:** claude-sonnet-4-6
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Non-eclipsing propagation of two independent regulated constraints

Same input as T2-run-1. Replication trial for non-eclipsing stability.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a identifies both C2 and C3 with full classification and an explicit non-eclipsing table:

**C2 (FMA Model Risk):**
- Obligation: "FMA Model Risk Policy (Financial Markets Authority)"
- Approving authority: "AML Compliance Officer + FMA-registered model risk assessor"
- Gate condition: "Formal sign-off confirming AML screening rule engine validated per FMA Model Risk Policy — issued before production activation"

**C3 (AML/CFT Act s.24):**
- Obligation: "AML/CFT Act section 24 (transaction record retention)"
- Approving authority: "No external sign-off; internal compliance verification"
- Gate condition: "Transaction records in geographically separate store; 5-year retention policy storage-enforced; confirmed before production activation"

Non-eclipsing table:

| Constraint | Propagates to | Story AC |
|-----------|---------------|----------|
| C2 — FMA Model Risk (process gate) | Story 5 | Story 5 AC3 |
| C3 — AML/CFT Act s.24 (retention) | Story 4 | Story 4 AC3 |

"C2 and C3 are independent constraints. C3 is NOT a prerequisite to C2 sign-off in the sense of being the same gate — they address different concerns. Both must propagate independently."

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

**C2 propagation (Story 5 AC3):**

> "Given the FMA model risk validation is complete, When the AML Compliance Officer and an FMA-registered model risk assessor sign off that the rule engine meets FMA Model Risk Policy requirements, Then a formal sign-off document is issued, production activation of the AML screening system is permitted, and the sign-off is recorded in the compliance register — production activation must not occur before this sign-off is received"

**C3 propagation (Story 4 AC3):**

> "Given the retention store is audited, When the AML Compliance Officer confirms: (a) all transaction records (events, screening results, alert dispositions) are replicated to the retention store, (b) the retention store is at a geographically separate physical location from primary storage, (c) the 5-year minimum retention policy is active and storage-enforced, and (d) no record can be deleted before 5 years without a logged and approved exception, Then the AML/CFT Act s.24 retention obligation is confirmed met — this story is a mandatory implementation gate before production activation"

Non-eclipsing: confirmed (C2 → Story 5, C3 → Story 4; distinct ACs; distinct approvers; distinct gate conditions).

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

**C2 (Story 5 AC3)** names all three required elements:
- **(a) Obligation:** "FMA Model Risk Policy" explicitly named
- **(b) Approving body:** "AML Compliance Officer and an FMA-registered model risk assessor" — both named with qualifications
- **(c) Gate condition:** "formal sign-off document is issued...production activation must not occur before this sign-off is received" — binary gate, no ambiguity

Consistent with T2-run-1. Cross-trial stability at D3 = 1.0 confirmed.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated compliance gates. Story 5 AC3 is grounded in C2. Story 4 AC3 is grounded in C3. Technical ACs (latency, alert queue order, rule engine determinism) are treated as technical requirements. No additional regulatory authority invented.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four MVP scope items covered:
1. ✅ Transaction event stream → Story 1
2. ✅ AML screening rule engine → Story 2
3. ✅ Alert queue and analyst workflow → Story 3
4. ✅ Transaction record retention (AML/CFT Act s.24) → Story 4

Story 5 mandated by C2. Scope ratio 5/4 = 1.25. Scope accumulator confirms 4/4 coverage. Structurally consistent with run-1.

---

## JSON result

```json
{
  "case_id": "T2",
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
  "notes": "Both C2 (FMA Model Risk) and C3 (AML/CFT s.24) independently identified; non-eclipsing confirmed via propagation table; Story 5 AC3 names FMA Model Risk Policy, AML Compliance Officer + FMA-registered assessor, sign-off gate; Story 4 AC3 names AML/CFT Act s.24, geographic separation, 5-year retention; consistent with T2-run-1; zero fabricated gates."
}
```

---

## Verdict

**PASS — weighted 1.0, CPF = 2/2 = 1.0, compliant = true**
