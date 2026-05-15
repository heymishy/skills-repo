# Sonnet Trial 1 Scorecard — EXP-005-definition-rubric
**Model:** claude-sonnet-4-6
**Trial:** 1 (T1-run-1, T2-run-1, T3-run-1, T4-run-1)
**Compiled by:** claude-sonnet-4-6
**Date:** 2026-05-15
**Experiment:** EXP-005-definition-rubric — Constraint Propagation Fidelity (CPF)

---

## Hypothesis under test

EXP-005 tests whether Constraint Propagation Fidelity is reliable at the Sonnet tier for the same corpus used to evaluate Haiku 4-5. Primary questions: (1) Does Sonnet maintain CPF = 1.0 across all four corpus cases? (2) Does Sonnet exceed or match Haiku on D3 specificity depth? (3) Is T3 narrative extraction equally stable? (4) Does T4 negative control remain clean?

The CPF pass threshold is ≥ 0.80 (hard fail below).

---

## Scores — Trial 1

| Case | C2 Type | D1 | D2 | D3 | D4 | D5 | Weighted | CPF | Pass |
|------|---------|-----|-----|-----|-----|-----|----------|-----|------|
| T1 — PCI DSS QSA (explicit) | Process gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T2 — AML FMA + retention (competing) | Process gate + retention | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T3 — FastPay certification (narrative-only) | Implicit process gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T4 — CI/CD scanner (no regulated constraint) | None (negative control) | 1.0 | N/A | N/A | 1.0 | 1.0 | 1.0 | N/A ✅ | ✅ |

**Trial 1 CPF (T1–T3):** 4/4 C2 constraints correctly propagated (T2 = 2 constraints) = **1.0**
**Trial 1 mean weighted score:** **1.0**
**Trial 1 pass rate:** **4/4**

---

## Per-case observations

### T1 — PCI DSS QSA (explicit)

Step 4a correctly identifies PCI DSS SAQ D as C2 with all three specificity elements at the identification step: obligation (PCI DSS), approving authority (External QSA), gate condition (SAQ D compliance + QSA assessment passed + sign-off issued). Story 5 AC3 elevates C2 to an explicit named AC naming PCI DSS, external QSA, and SAQ D compliance + scope-reduction confirmation as the gate condition. Architecture Constraints annotated in Stories 1–4. The model also includes a self-instruction at Step 4a: "C2 MUST propagate to at least one story as an explicit named AC." Clean propagation. Zero fabricated gates.

### T2 — AML FMA + retention (competing)

Both C2 (FMA Model Risk sign-off) and C3 (5-year geographic retention per AML/CFT Act s.24) identified in Step 4a with a formal non-eclipsing assessment stating: "C2 and C3 are distinct regulated constraints targeting different implementation concerns. C3 must NOT be subsumed into C2." A propagation table maps C2 → Story 5 and C3 → Story 4. End-of-definition verification table confirms non-eclipsing. Story 5 AC3 names FMA Model Risk Policy, AML Compliance Officer + FMA-registered assessor, and sign-off gate. Story 4 AC3 names AML/CFT Act s.24, geographic separation, and 5-year storage-enforced retention. CPF = 2/2 = 1.0.

### T3 — FastPay scheme certification (implicit, narrative-only)

The hardest CPF test. C2 appears only in Background narrative. Step 4a opens with Background narrative scan and an explicit "⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED" flag. The model quotes the relevant discovery passage, identifies clause 7.3 of the FX settlement agreement, names FastPay technical assurance team as approving body, and states the gate condition explicitly. Story 4 AC3 contains all three D3 elements: clause 7.3 FX settlement agreement (obligation), FastPay technical assurance team (approving body), certification sign-off + no live routing before sign-off received (gate condition). Score of 1.0 exceeds the EVAL.md T3 expected ceiling of 0.82 — same outcome as Haiku T3. Technical SLA constraints correctly treated as NFRs.

### T4 — CI/CD scanner (negative control)

Step 4a scans both Constraints section (pipeline timing, cost ceiling) and Background narrative. An explicit absence list documents what was not found: "No regulatory frameworks mentioned (PCI DSS, AML/CFT, GDPR, SOX, HIPAA, FCA, FMA, or similar). No external approval requirements. No certification language. No 'must obtain sign-off' language." Determination: "No regulated constraints detected." All four story ACs are technical and observable — zero compliance sign-offs fabricated. Scope accumulator notes: "No regulated constraint gate story required." Clean negative control.

---

## Trial 1 key findings

**Finding S1-T1-F1 — Step 4a self-instruction pattern:** Sonnet includes an explicit self-instruction at Step 4a: "C2 MUST propagate to at least one story as an explicit named AC with all three elements named — this is a CPF-critical requirement, not optional." This pattern is not present in the Haiku runs. It may indicate Sonnet internalising rubric framing more explicitly. The downstream result is equivalent (both achieve D2 = 1.0), but the explicit self-instruction suggests greater alignment awareness.

**Finding S1-T1-F2 — T3 narrative extraction matches Haiku:** Both models achieve D1/D2/D3 = 1.0 on T3. Sonnet's output uses "FX settlement agreement" where Haiku uses "scheme membership rules" — consistent with the respective corpus input text. Both name clause 7.3 and FastPay technical assurance team. T3 ceiling (0.82) exceeded by both models, indicating Step 4a instruction is sufficient for narrative extraction regardless of tier.

**Finding S1-T1-F3 — T2 non-eclipsing formalism:** Sonnet T2-run-1 includes a formal non-eclipsing propagation table in Step 4a and an end-of-definition verification table — more structured than the Haiku T2-run-1 which included the assessment in narrative form. Both achieve D2 = 1.0 but Sonnet's approach provides a more auditable record.

**Finding S1-T1-F4 — T4 explicit absence list:** Sonnet T4-run-1 explicitly lists the regulatory frameworks it scanned for and confirmed absent. This is a stronger negative-control signal than Haiku T4-run-1's scope accumulator note. Both achieve D4 = 1.0 but Sonnet's approach is more verifiable.

---

## CPF metric result

$$CPF_{Trial 1} = \frac{\text{C2 constraints propagated to story ACs}}{\text{total C2 constraints in discovery}} = \frac{4}{4} = 1.0$$

*(T1: 1 constraint; T2: 2 constraints; T3: 1 constraint = 4 total)*

**Pass threshold (≥ 0.80): ✅ EXCEEDED**

---

## Verdict

**Trial 1: PASS — CPF = 1.0, all 4 cases pass, zero fabrication in negative control**
