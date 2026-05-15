# Haiku Trial 1 Scorecard — EXP-005-definition-rubric
**Model:** claude-haiku-4-5
**Trial:** 1 (T1-run-1, T2-run-1, T3-run-1, T4-run-1)
**Compiled by:** claude-sonnet-4-6
**Date:** 2026-05-15
**Experiment:** EXP-005-definition-rubric — Constraint Propagation Fidelity (CPF)

---

## Hypothesis under test

EXP-003 found that a Haiku-class model dropped C2 process gates in downstream story output. EXP-005 tests whether this is systemic (repeatable across diverse input cases) or was an isolated EXP-003 artefact. The CPF pass threshold is ≥ 0.80 (hard fail below; no warning band for regulated inputs).

---

## Scores — Trial 1

| Case | C2 Type | D1 | D2 | D3 | D4 | D5 | Weighted | CPF | Pass |
|------|---------|-----|-----|-----|-----|-----|----------|-----|------|
| T1 — PCI DSS QSA (explicit) | Process gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T2 — AML FMA + retention (competing) | Process gate + retention | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T3 — FastPay certification (narrative-only) | Implicit process gate | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | ✅ |
| T4 — CI/CD scanner (no regulated constraint) | None (negative control) | 1.0 | N/A | N/A | 1.0 | 1.0 | 1.0 | N/A ✅ | ✅ |

**Trial 1 CPF (T1–T3):** 3/3 C2 constraints correctly propagated = **1.0**
**Trial 1 mean weighted score:** **1.0**
**Trial 1 pass rate:** **4/4**

---

## Per-case observations

### T1 — PCI DSS QSA (explicit)

Step 4a correctly identified PCI DSS SAQ D as C2 with obligation, approving authority (external QSA), and gate condition. Story 5 AC3 names all three specificity elements. Clean propagation with no fabricated gates. Architecture Constraints annotation clearly labels the AC as the regulated gate.

### T2 — AML FMA + retention (competing)

Both C2 (FMA Model Risk sign-off) and C3 (5-year retention) identified in Step 4a. Non-eclipsing test passed: C2 in Story 5, C3 in Story 4 — separate stories, separate dependencies, distinct personas. Constraint propagation plan explicitly documents the separation rationale ("C2 and C3 address different concerns: process gate vs. data engineering"). FMA obligation, approving body, and gate condition all present in Story 5 AC3.

### T3 — FastPay scheme certification (implicit, narrative-only)

Critical CPF test. The model triggered Step 4a from the Background narrative with an explicit "⚠️ NARRATIVE-ONLY CONSTRAINT IDENTIFIED" flag. Extracted clause 7.3 reference and classified as C2 — Process Gate. Elevated to Story 4 AC3 with all three specificity elements (obligation: clause 7.3; approving body: FastPay technical assurance team; gate condition: certification + sign-off before live routing). EVAL.md calibration anchor minimum for T3 was 0.7 (if extracted from narrative); model achieved 1.0 by framing as hard go-live gate and elevating to AC.

### T4 — CI/CD scanner (negative control)

Step 4a correctly returned "No regulated constraints detected." Zero fabricated process gates across all four stories. All ACs reference only technical constraints (scanner timing, CVSS thresholds, PR automation). Scope accumulator explicitly notes "No Story 5 required." The negative-control gate cleanly confirms the model does not hallucinate compliance requirements into technical-only discoveries.

---

## Trial 1 key findings

**Finding T1-F1 — EXP-003 hypothesis not confirmed:** EXP-003 found Haiku dropped C2. Trial 1 shows Haiku 4-5 achieves CPF = 1.0 across all three regulated cases. The EXP-003 failure is not reproducible in this corpus.

**Possible explanations for the discrepancy:**
1. Model version: EXP-003 may have used Haiku 3.5; EXP-005 uses Haiku 4-5. A capability improvement between versions may explain the gap.
2. SKILL.md Step 4a specificity: The Step 4a instruction in the current SKILL.md is highly explicit — it instructs the model to scan all four discovery sections, trigger on narrative-only signals, and produce a named Constraint 0/1 classification. If EXP-003 used an earlier SKILL.md version, the instruction may have been less prescriptive.
3. Corpus design: EXP-005 corpus cases are carefully constructed with clear implicit/explicit constraint signals. EXP-003's input may have been more ambiguous.

**Finding T1-F2 — Narrative extraction is stable:** T3 is the hardest case (constraint in Background narrative only). The model correctly triggered Step 4a and propagated C2 to Story 4 AC3 with full specificity. This is the most important positive finding for regulated use cases where discovery authors may not always place constraints in the formal Constraints section.

**Finding T1-F3 — No fabrication detected:** T4 negative control confirmed the model does not invent compliance gates when none exist. This is critical — overly cautious models that hallucinate compliance requirements would generate false positive C2 gates, causing unnecessary go-live stories and downstream confusion.

---

## CPF metric result

$$CPF_{Trial 1} = \frac{\text{C2 constraints propagated to story ACs}}{\text{total C2 constraints in discovery}} = \frac{3}{3} = 1.0$$

**Pass threshold (≥ 0.80): ✅ EXCEEDED**

---

## Verdict

**Trial 1: PASS — CPF = 1.0, all 4 cases pass, zero fabrication in negative control**
