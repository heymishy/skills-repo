# Judge — T2-run-1 (AML Competing Constraints, Trial 1)
**Case ID:** T2-competing-regulated
**Run file:** T2-run-1.md
**Model judged:** claude-sonnet-4-6
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Non-eclipsing propagation of two independent regulated constraints

T2 contains two independent regulated constraints: C2 (FMA Model Risk Policy — process gate requiring sign-off before production) and C3 (AML/CFT Act s.24 — technical retention obligation requiring geographic separation and 5-year policy). The CPF test is: do both propagate to separate story ACs without either eclipsing the other? If C2 and C3 are merged into a single story or a single AC, or if one is dropped, D2 fails for the dropped/merged constraint.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a identifies both C2 and C3 as independent constraints with a formal non-eclipsing assessment:

**C2 (FMA Model Risk Policy):**
- Obligation: "FMA (Financial Markets Authority) Model Risk Policy"
- Approving authority: "AML Compliance Officer + FMA-registered model risk assessor"
- Gate condition: "Model validated per FMA Model Risk Policy; formal sign-off document issued to AML Compliance Officer — production activation of AML screening system blocked until sign-off received"
- Type: "Process gate — hard go-live dependency"

**C3 (AML/CFT Act s.24):**
- Obligation: "AML/CFT Act 2009 section 24 — transaction record retention"
- Approving authority: "No external sign-off required — internal compliance confirmation sufficient"
- Gate condition: "Transaction records replicated to geographically separate location; minimum 5-year retention policy active and storage-enforced; confirmed before production activation"
- Type: "Technical compliance requirement (mandatory implementation, not a process gate in the same sense as C2)"

The non-eclipsing assessment states explicitly: "C2 and C3 are distinct regulated constraints targeting different implementation concerns. C3 must NOT be subsumed into C2. Each must propagate to its own story." A propagation table maps C2 → Story 5 and C3 → Story 4.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: 1.0**

**C2 propagation (Story 5 AC3):**

> "Given the FMA model risk validation is complete, When the AML Compliance Officer and an FMA-registered model risk assessor confirm that the AML screening rule engine complies with FMA Model Risk Policy, Then a formal sign-off document is issued to the AML Compliance Officer, production activation of real-time AML screening is permitted, and the sign-off document is recorded in the compliance register — and production activation must not occur before this sign-off is received"

C2 is elevated to an explicit named AC naming: FMA Model Risk Policy (obligation), AML Compliance Officer + FMA-registered model risk assessor (approving body), sign-off before production activation (gate condition).

**C3 propagation (Story 4 AC3):**

> "Given the retention store is inspected for compliance with AML/CFT Act s.24, When the AML Compliance Officer audits the store configuration, Then the audit confirms: (a) all transaction records from Stories 1–3 are replicated, (b) geographic separation is verified at the infrastructure level, (c) minimum 5-year retention policy is active and enforced by storage infrastructure (not application code), and (d) no transaction record can be deleted before the 5-year period expires without a logged exception approved by the AML Compliance Officer"

C3 is also elevated to an explicit named AC. Non-eclipsing confirmed: C2 in Story 5, C3 in Story 4 — independent, separate, non-overlapping.

A final end-of-definition verification table confirms: C2 → Stories 1-4 Architecture Constraints + Story 5 AC3 ✅; C3 → Stories 1-3 Architecture Constraints + Story 4 AC3 ✅.

---

## D3 — C2 AC Specificity and Actionability

**Score: 1.0**

**C2 (Story 5 AC3)** names all three required elements:
- **(a) Obligation:** "FMA Model Risk Policy" — authority and policy explicitly named
- **(b) Approving body:** "AML Compliance Officer and an FMA-registered model risk assessor" — both approvers named with their qualifications
- **(c) Gate condition:** "formal sign-off document is issued...production activation...must not occur before this sign-off is received" — explicit binary gate

**C3 (Story 4 AC3)** also meets D3 criteria for the retention constraint:
- Obligation: "AML/CFT Act s.24" — specific statute and section named
- Constraint details: geographic separation, 5-year retention enforced at storage infrastructure level — all testable ACs

Both constraints achieve full D3 specificity. Note: D3 is evaluated against C2 per EVAL.md, but C3 also achieves full specificity confirming the non-eclipsing quality.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

No fabricated compliance gates. The only process gate in the output (Story 5 AC3) is grounded in C2 from the discovery Constraints section. The only retention obligation (Story 4 AC3) is grounded in C3 from the discovery Constraints section. No additional compliance authority, regulatory framework, or sign-off requirement is invented. Technical ACs (latency, alert queue timing, rule engine determinism) are treated as technical NFRs.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four discovery MVP scope items are covered:
1. ✅ Transaction event stream → Story 1
2. ✅ AML screening rule engine → Story 2
3. ✅ Alert queue and analyst workflow → Story 3
4. ✅ Transaction record retention (AML/CFT Act s.24) → Story 4

Story 5 (FMA validation gate) is mandated by C2, not a scope addition. Scope ratio 5/4 = 1.25. Scope accumulator confirms 4/4 coverage. Benefit coverage matrix maps all metric-contributing stories.

---

## JSON result

```json
{
  "case_id": "T2",
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
  "notes": "Both C2 (FMA Model Risk) and C3 (AML/CFT s.24) independently identified and propagated to separate story ACs; non-eclipsing formally assessed in Step 4a with a propagation table; Story 5 AC3 names FMA, AML Compliance Officer + FMA-registered assessor, sign-off gate; Story 4 AC3 names s.24, geographic separation, 5-year retention; end-of-definition verification table confirms non-eclipsing; zero fabricated gates."
}
```

---

## Verdict

**PASS — weighted 1.0, CPF = 2/2 = 1.0, compliant = true**
