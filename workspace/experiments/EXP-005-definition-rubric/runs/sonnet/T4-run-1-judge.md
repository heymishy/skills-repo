# Judge — T4-run-1 (CI/CD Scanner — No Regulated Constraint, Trial 1)
**Case ID:** T4-no-regulated
**Run file:** T4-run-1.md
**Model judged:** claude-sonnet-4-6
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Negative control — correct "no regulated constraint" determination, zero fabrication

T4 contains no regulated constraints. The Constraints section has only technical/operational constraints (CI pipeline time ≤3 minutes, cost ceiling £3,000/yr). The Background narrative contains engineering rationale but no process gates, no regulatory frameworks, no certification language. The model MUST return "No regulated constraints detected" at Step 4a and must NOT fabricate any compliance gate in story ACs. Categorical fail on D4 (and D1) if any compliance gate is invented.

Note: D2 and D3 are N/A for T4. Weight redistribution per EVAL.md: D1 = 0.60, D4 = 0.20, D5 = 0.20.

---

## D1 — C2 Constraint Identification Accuracy

**Score: 1.0**

Step 4a scans both the Constraints section and the Background narrative. The model explicitly documents what it found and what it did NOT find:

**Constraints section scan:**
- Constraint 1 (Technical): "Pipeline execution time ≤3 minutes for 95% of PR builds"
- Constraint 2 (Technical): "Total tool licensing cost ≤£3,000/year"
- No regulated constraint, no process gate

**Background narrative scan (explicit absence list):**

> "No regulatory frameworks mentioned (PCI DSS, AML/CFT, GDPR, SOX, HIPAA, FCA, FMA, or similar). No external approval requirements. No certification language. No 'must obtain sign-off' language."

**Step 4a determination:** "No regulated constraints detected."

The explicit absence list is notable — the model proactively names what it was looking for and confirms it was not found. This is the correct behaviour for a negative control: an active scan, not a passive omission. The model does not interpret the supplier SLA (Tier 1 support) or the cost ceiling as compliance gates.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: N/A**

No C2 exists. There is nothing to propagate. Correct.

---

## D3 — C2 AC Specificity and Actionability

**Score: N/A**

No C2 exists. No gate AC to evaluate. Correct.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

All story ACs are technical and observable with zero compliance sign-offs fabricated:

- **Story 1 (PR Dependency Scan):** ACs reference scanner timing (≤45s), CVSS score classification, and PR block behaviour — all technical
- **Story 2 (Merge Block on CVSS ≥7.0):** ACs reference merge block by CVSS score threshold, override mechanism, and audit log — all technical
- **Story 3 (Weekly Digest):** ACs reference digest delivery timing, content format, and filtering — all technical
- **Story 4 (Auto-PR Generation):** ACs reference patch availability detection, PR creation, and CI run — all technical

No AC contains language suggesting: "security officer sign-off required," "compliance team review," "regulatory approval before activation," "external audit gate," or any similar fabricated compliance requirement.

The Scope accumulator note explicitly states: "No regulated constraint gate story required. Story count (4) reflects MVP scope only." This self-declaration confirms the model correctly determined the gate story was not needed.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four discovery MVP scope items covered:
1. ✅ PR-level dependency vulnerability scanning → Story 1
2. ✅ Merge block enforcement for CVSS ≥7.0 → Story 2
3. ✅ Weekly digest notification → Story 3
4. ✅ Auto-PR generation for available patches → Story 4

Scope ratio 4/4 = 1.0. No unexplained additions. Out-of-scope items (SAST, container image scanning, historical backfill) correctly excluded. Benefit coverage matrix maps all four stories to M1 (mean-time-to-patch reduction).

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
  "trial": 1,
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
  "notes": "Step 4a correctly determined 'No regulated constraints detected' with explicit absence list enumerating checked frameworks; zero fabricated compliance gates in all four story ACs; all four MVP scope items covered; negative control cleanly passed."
}
```

---

## Verdict

**PASS — weighted 1.0, CPF (negative control) = 1.0, compliant = true**
