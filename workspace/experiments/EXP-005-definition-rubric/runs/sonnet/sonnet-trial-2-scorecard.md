# Sonnet Trial 2 Scorecard — EXP-005-definition-rubric
**Model:** claude-sonnet-4-6
**Trial:** 2 (T1-run-2, T2-run-2, T3-run-2, T4-run-2)
**Compiled by:** claude-sonnet-4-6
**Date:** 2026-05-15
**Experiment:** EXP-005-definition-rubric — Constraint Propagation Fidelity (CPF)

---

## Hypothesis under test

Trial 2 is a stability replication of Trial 1. Two trials are required to distinguish consistent behaviour from a single run fluke. If CPF = 1.0 holds in both trials, the evidence supports a conclusion that Sonnet 4-6 + current SKILL.md Step 4a instruction produces reliable constraint propagation.

---

## Scores — Trial 2

| Case | C2 Type | D1 | D2 | D3 | D4 | D5 | Weighted | CPF | Pass |
|------|---------|-----|-----|-----|-----|-----|----------|-----|------|
| T1 — PCI DSS QSA (explicit) | Process gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T2 — AML FMA + retention (competing) | Process gate + retention | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T3 — FastPay certification (narrative-only) | Implicit process gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T4 — CI/CD scanner (no regulated constraint) | None (negative control) | 1.0 | N/A | N/A | 1.0 | 1.0 | 1.0 | N/A ✅ | ✅ |

**Trial 2 CPF (T1–T3):** 4/4 C2 constraints correctly propagated = **1.0**
**Trial 2 mean weighted score:** **1.0**
**Trial 2 pass rate:** **4/4**

---

## Per-case observations

### T1 — PCI DSS QSA (explicit)

Consistent with run-1. Run-2's Step 4a identifies a three-part gate condition (SAQ D compliance achieved; no unresolved findings; written sign-off issued), more granular than run-1's formulation. Story 5 AC3 mirrors this three-part structure in the When clause. Architecture Constraints in Stories 1–4 annotate PCI DSS scope. Zero fabricated gates.

### T2 — AML FMA + retention (competing)

Consistent with run-1. Non-eclipsing confirmed via propagation table. C2 in Story 5 AC3 names FMA Model Risk Policy, AML Compliance Officer + FMA-registered assessor, and sign-off before production. C3 in Story 4 AC3 names AML/CFT Act s.24, geographic separation, and 5-year storage-enforced retention. CPF = 2/2 = 1.0. Cross-trial stability at T2 confirmed.

### T3 — FastPay scheme certification (implicit, narrative-only)

Consistent with run-1. Step 4a opens with "⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED" flag. Background narrative quoted, clause 7.3 identified, FastPay technical assurance team named. Story 4 AC3 contains all three D3 elements. Score of 1.0 exceeds the EVAL.md T3 expected ceiling of 0.82 — same as Trial 1 and both Haiku T3 trials. Cross-trial stability at T3 confirmed.

### T4 — CI/CD scanner (negative control)

Consistent with run-1. Step 4a documents explicit absence list: "No regulatory frameworks (PCI DSS, AML/CFT, GDPR, SOX, HIPAA, FCA, FMA, or similar) referenced. No external approval requirements. No certification language. No sign-off requirement. No mandatory go-live gate." Determination: "No regulated constraints detected." All four story ACs technical. Zero fabrication. Scope accumulator: "4 stories, no regulated constraint gate story." T4 negative control stable across both trials.

---

## Cross-trial comparison

| Case | Trial 1 CPF | Trial 2 CPF | Δ | Stability |
|------|------------|------------|---|-----------|
| T1 | 1.0 | 1.0 | 0.0 | Stable ✅ |
| T2 | 1.0 | 1.0 | 0.0 | Stable ✅ |
| T3 | 1.0 | 1.0 | 0.0 | Stable ✅ |
| T4 (neg) | PASS | PASS | — | Stable ✅ |

Zero variation across all dimensions, all cases, both trials.

---

## Trial 2 key findings

**Finding S1-T2-F1 — CPF = 1.0 stable across trials:** Trial 2 replicates Trial 1 exactly. The 1.0 CPF result is not a single-run artefact. Combined evidence (8 runs, 4 cases, 2 trials) supports a conclusion that Sonnet 4-6 + current SKILL.md Step 4a produces consistent CPF ≥ 0.80 for this corpus.

**Finding S1-T2-F2 — T1 run-2 three-part gate condition:** T1-run-2's Step 4a explicitly decomposes the gate condition into three parts ((1) SAQ D assessment; (2) no unresolved findings; (3) sign-off document). This refined granularity carries through to Story 5 AC3. No score impact (both runs are 1.0), but run-2 provides more actionable audit evidence.

**Finding S1-T2-F3 — T3 narrative extraction stable:** Both trials correctly extracted the implicit FastPay clause 7.3 C2 from Background narrative. Stable cross-trial evidence that the ⚠️ NARRATIVE-ONLY flag path in Step 4a is reliable. This is the highest-risk CPF failure mode in regulated systems.

**Finding S1-T2-F4 — T4 negative control consistent:** Both trials produce zero fabrication. Both document explicit absence lists. This confirms the model does not drift towards fabrication under negative-control conditions, even at the Sonnet tier where more "eager" constraint inference was a hypothetical risk.

---

## Overall Sonnet 4-6 CPF verdict (Trial 1 + Trial 2 combined)

$$CPF_{overall} = \frac{8}{8} = 1.0$$

**Across all 8 runs:**
- 8/8 runs pass
- 8/8 regulated C2 constraints (T1×2, T2×4, T3×2) correctly propagated to story ACs
- 4/4 negative control runs (T4×2) produce zero fabrication
- 0 categorical fails triggered

---

## CPF metric result

$$CPF_{Trial 2} = \frac{4}{4} = 1.0$$

**Pass threshold (≥ 0.80): ✅ EXCEEDED**

---

## Verdict

**Trial 2: PASS — CPF = 1.0, all 4 cases pass, zero fabrication in negative control**

**Combined (Trial 1 + 2): PASS — CPF = 1.0 (8/8), 8/8 runs pass, stable cross-trial**
