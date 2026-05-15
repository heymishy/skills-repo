# Haiku Trial 2 Scorecard — EXP-005-definition-rubric
**Model:** claude-haiku-4-5
**Trial:** 2 (T1-run-2, T2-run-2, T3-run-2, T4-run-2)
**Compiled by:** claude-sonnet-4-6
**Date:** 2026-05-15
**Experiment:** EXP-005-definition-rubric — Constraint Propagation Fidelity (CPF)

---

## Hypothesis under test

Trial 2 is a stability replication of Trial 1. Two trials are required to distinguish consistent behaviour from a single run fluke. If CPF = 1.0 holds in both trials, the evidence supports a conclusion that Haiku 4-5 + current SKILL.md Step 4a instruction produces reliable constraint propagation.

---

## Scores — Trial 2

| Case | C2 Type | D1 | D2 | D3 | D4 | D5 | Weighted | CPF | Pass |
|------|---------|-----|-----|-----|-----|-----|----------|-----|------|
| T1 — PCI DSS QSA (explicit) | Process gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T2 — AML FMA + retention (competing) | Process gate + retention | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T3 — FastPay certification (narrative-only) | Implicit process gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T4 — CI/CD scanner (no regulated constraint) | None (negative control) | 1.0 | N/A | N/A | 1.0 | 1.0 | 1.0 | N/A ✅ | ✅ |

**Trial 2 CPF (T1–T3):** 3/3 = **1.0**
**Trial 2 mean weighted score:** **1.0**
**Trial 2 pass rate:** **4/4**

---

## Per-case observations

### T1 — PCI DSS QSA (explicit)

Consistent with run-1. QSA gate in Story 5 AC3 with same structure. Minor terminology note: run-2 combines "FMA-registered assessor or PCI DSS-qualified auditor" — mixing AML and PCI terminology. This is a precision imprecision with no functional impact on the CPF evaluation (the gate condition is correct). Noted for rubric refinement.

### T2 — AML FMA + retention (competing)

Consistent with run-1. Non-eclipsing confirmed in second trial: C2 in Story 5, C3 in Story 4. Run-2 is slightly more concise (shorter ACs) but identical structural quality. Two trials now confirm stable non-eclipsing decomposition for competing constraint inputs.

### T3 — FastPay scheme certification (implicit, narrative-only)

Consistent with run-1. Same extraction path: narrative-only flag triggered, clause 7.3 referenced, FastPay technical assurance team named as approving body, certification-before-routing as gate condition. Both trials confirm stable narrative-C2 extraction behaviour. This is the single most important stability finding: the narrative-only path is not a one-run artefact.

### T4 — CI/CD scanner (negative control)

Run-2 is qualitatively stronger than run-1. An explicit "Regulated Constraints Check: None" section with per-category negation (no process gate, no compliance framework, no external approval authority, no mandatory sign-off) replaces the simpler scope accumulator notation in run-1. Two negative control trials now confirm zero fabrication rate across T4 inputs.

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

**Finding T2-F1 — CPF = 1.0 stable across trials:** Trial 2 replicates Trial 1 exactly. The 1.0 CPF result is not a single-run artefact. Combined evidence (8 runs, 4 cases, 2 trials) supports a conclusion that Haiku 4-5 + current SKILL.md Step 4a produces consistent CPF ≥ 0.80 for this corpus.

**Finding T2-F2 — T3 narrative extraction stable:** Both trials correctly extracted the implicit FastPay clause 7.3 C2 from Background narrative. Stable cross-trial evidence that Step 4a narrative-scan instruction is sufficient to surface narrative-only constraints. This is the highest-risk CPF failure mode in regulated systems (discovery authors frequently embed constraints in prose rather than formal sections).

**Finding T2-F3 — T4 negative control improves between trials:** Run-2 added explicit category-by-category negation vs. run-1's simpler scope accumulator note. This suggests the model may have variability in negative-control articulation quality even when the final answer is the same. However, both produce zero fabrication — the outcome is consistent.

**Finding T2-F4 — T1 run-2 terminology imprecision:** FMA-registered assessor mixed with PCI DSS-qualified auditor. Both are C2-related approval bodies from different corpus cases. This suggests Haiku 4-5 may carry some cross-case context bleed in some runs. No impact on D3 score (gate is correct), but worth monitoring in a larger sweep.

---

## Overall Haiku 4-5 CPF verdict (Trial 1 + Trial 2 combined)

$$CPF_{overall} = \frac{6}{6} = 1.0$$

**Across all 8 runs:**
- 8/8 runs pass
- 6/6 regulated C2 constraints (T1×2, T2×2, T3×2) propagated to story ACs
- 4/4 negative control runs (T4×2) produce zero fabrication
- 0 categorical fails triggered

**Hypothesis verdict:** EXP-003's "Haiku drops C2" finding is **not reproduced** in EXP-005. The most likely explanations are (1) model version improvement (3.5 → 4-5) or (2) SKILL.md Step 4a specificity sufficient for reliable extraction. A controlled version comparison (re-running T3 with Haiku 3.5 if available) would disambiguate.

---

## CPF metric result

$$CPF_{Trial 2} = \frac{3}{3} = 1.0$$

**Pass threshold (≥ 0.80): ✅ EXCEEDED**

---

## Verdict

**Trial 2: PASS — CPF = 1.0, all 4 cases pass, zero fabrication in negative control**

**Combined (Trial 1 + 2): PASS — CPF = 1.0 (6/6), 8/8 runs pass, stable cross-trial**
