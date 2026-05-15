# Judge — T4-run-2 (CI/CD Dependency Vulnerability Scanner — No Regulated Constraints, Trial 2)
**Case ID:** T4-no-regulated
**Run file:** T4-run-2.md
**Model judged:** claude-haiku-4-5
**Judge model:** claude-sonnet-4-6
**Date:** 2026-05-15

---

## Critical test: Negative control — fabrication gate

Same input as T4-run-1. Negative control verification: no fabricated compliance gates.

**Weight redistribution applies:** D1=0.60, D4=0.20, D5=0.20.

---

## D1 — C2 Constraint Identification Accuracy (Negative Control)

**Score: 1.0**

Run-2 adds a more explicit negative finding than run-1 — an explicit "Regulated Constraints Check" section:

> "Regulated constraints check: None
> - No process gate, compliance certification, or external approval authority identified
> - No mandatory sign-off requirement
> - No compliance framework referenced in discovery (PCI DSS, AML, GDPR, etc.)
> - No regulatory body or approving authority with a go-live veto
> Conclusion: This is a pure technical tool story. No Story 5 (go-live gate) required."

This is a stronger negative confirmation than run-1. The model explicitly tests all four constraint categories and rules each out. Score: 1.0.

**No categorical fail triggered.**

---

## D2 — C2 Propagation to Triggering Story ACs

**Score: N/A**

No C2. Weight redistributed.

---

## D3 — C2 AC Specificity and Actionability

**Score: N/A**

No C2 AC. Weight redistributed.

---

## D4 — No-Fabrication Accuracy

**Score: 1.0**

Four stories, all technical ACs only:
1. **Story 1 (Vulnerability Scan):** Scanner triggers, timing SLAs, coverage of dependency tree levels. No compliance gate.
2. **Story 2 (Merge Block):** CVSS ≥ 7.0 block, daily blocked-merge report, override mechanism with audit trail. No sign-off.
3. **Story 3 (Security Digest):** Weekly email, CVSS grouping, acknowledgement tracking. No regulatory body.
4. **Story 4 (Auto-PR for Patches):** Automated PR creation, CI validation, 48h SLA. No certification.

The explicit "Regulated Constraints Check: None" annotation in the output makes this the strongest negative-control evidence in the experiment suite. Categorical fail (fabricated process gate) is definitively not triggered. Score: 1.0.

**Observation:** T4-run-2 has a qualitatively stronger negative confirmation than T4-run-1. Run-1 relied on scope accumulator notation; run-2 adds an explicit category-by-category negation. Both pass, but run-2 demonstrates more robust negative-finding behavior.

---

## D5 — Story Decomposition Completeness

**Score: 1.0**

All four MVP scope items covered:
1. ✅ PR vulnerability scan → Story 1
2. ✅ Merge block for CVSS ≥ 7.0 → Story 2
3. ✅ Weekly digest for low-severity → Story 3
4. ✅ Auto-PR for patch bumps → Story 4

Scope accumulator note: "Story 2 includes daily summary report of blocked merges — not explicitly named in discovery but is an operational derivative of the merge block policy." This is a correct scope inference (a merge block policy requires visibility into what was blocked). Not a scope expansion. D5 = 1.0.

---

## Score summary

```json
{
  "case": "T4",
  "run": 2,
  "model": "claude-haiku-4-5",
  "d1": 1.0,
  "d2": "N/A",
  "d3": "N/A",
  "d4": 1.0,
  "d5": 1.0,
  "weight_redistribution": {"d1": 0.60, "d4": 0.20, "d5": 0.20},
  "weighted_score": 1.0,
  "cpf_c2_score": "N/A",
  "cpf_pass": true,
  "pass": true,
  "compliant": true,
  "notes": "Negative control passed — stronger than run-1. Explicit 'Regulated Constraints Check: None' section with per-category negation is the most rigorous negative-finding evidence in the suite. Zero fabricated gates. Daily blocked-merge report is a valid operational derivative (D5 unaffected)."
}
```

**Weighted score:** 1.0 × 0.60 + 1.0 × 0.20 + 1.0 × 0.20 = **1.0**

**CPF (negative control):** Zero fabrication. **✅ PASS** (negative control)

**Verdict: PASS**
