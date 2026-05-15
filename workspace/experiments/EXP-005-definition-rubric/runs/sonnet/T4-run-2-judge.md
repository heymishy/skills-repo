# Judge — T4-run-2 (CI/CD Scanner — No Regulated Constraint, Trial 2)
**Case ID:** T4-no-regulated
**Run file:** T4-run-2.md
**Model judged:** claude-sonnet-4-6
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Negative control — correct "no regulated constraint" determination, zero fabrication

Same input as T4-run-1. Replication trial. D2 and D3 are N/A. Weight redistribution: D1 = 0.60, D4 = 0.20, D5 = 0.20.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a scans both sections and documents an explicit absence record:

**Constraints section:** Pipeline timing (≤3 min) and cost ceiling (£3,000/yr) — both technical.

**Background narrative scan (explicit absence list):**

> "No regulatory frameworks (PCI DSS, AML/CFT, GDPR, SOX, HIPAA, FCA, FMA, or similar) referenced. No external approval requirements. No certification language. No sign-off requirement. No mandatory go-live gate."

**Step 4a determination:** "No regulated constraints detected. No gate story required."

Run-2 expresses the absence list in a slightly different order than run-1 but the content is equivalent. Both runs confirm the model actively scanned for regulated content and confirmed its absence — not passively omitted a check.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: N/A**

No C2 exists. Correct.

---

## D3 — C2 AC Specificity and Actionability

**Score: N/A**

No C2 exists. Correct.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

All story ACs are technical and observable:

- **Story 1 (PR Dependency Scan):** ACs cover scanner invocation on PR, CVSS classification, PR annotation — technical
- **Story 2 (Merge Block on High CVSS):** ACs cover block enforcement on CVSS ≥7.0, override with justification, audit log — technical
- **Story 3 (Weekly Digest):** ACs cover scheduled delivery, content (top 10 by severity), acknowledgement mechanism — technical
- **Story 4 (Automated Patch PR):** ACs cover patch availability detection, auto-PR creation, CI trigger — technical

No compliance sign-off, regulatory approval, or external audit gate appears in any AC. The scope accumulator explicitly notes: "4 stories, no regulated constraint gate story, scope = MVP scope exactly." Zero fabrication confirmed.

**Cross-trial comparison:** Run-2 ACs are slightly more concise than run-1 ACs but structurally equivalent. Both produce zero fabrication. T4 negative control stability confirmed across both trials.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four MVP scope items covered:
1. ✅ PR-level vulnerability scanning → Story 1
2. ✅ Merge block enforcement → Story 2
3. ✅ Weekly digest notification → Story 3
4. ✅ Automated patch PR → Story 4

Scope ratio 4/4 = 1.0. No unexplained additions. Consistent with run-1.

---

## Weighted score calculation (T4 redistribution)

| Dimension | Weight | Score | Contribution |
|-----------|--------|-------|-------------|
| D1 (C2 identification — negative control) | 0.60 | 1.0 | 0.60 |
| D2 | N/A | — | 0.00 |
| D3 | N/A | — | 0.00 |
| D4 (no fabrication) | 0.20 | 1.0 | 0.20 |
| D5 (decomposition) | 0.20 | 1.0 | 0.20 |
| **Total** | **1.00** | | **1.0** |

---

## JSON result

```json
{
  "case_id": "T4",
  "trial": 2,
  "model_label": "claude-sonnet-4-6",
  "scores": {
    "d1_c2_identification": 1.0,
    "d2_c2_propagation": "N/A",
    "d3_c2_specificity": "N/A",
    "d4_no_fabrication": 1.0,
    "d5_decomposition_completeness": 1.0
  },
  "weighted_score": 1.0,
  "cpf_c2_score": 1.0,
  "cpf_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Step 4a correctly determined 'No regulated constraints detected' with explicit absence list; zero fabricated compliance gates in all four story ACs; all four MVP scope items covered; consistent with T4-run-1; negative control stable across both trials."
}
```

---

## Verdict

**PASS — weighted 1.0, CPF (negative control) = 1.0, compliant = true**
