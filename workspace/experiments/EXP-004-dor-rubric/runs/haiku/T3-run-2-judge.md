# EXP-004 Judge: T3-run-2 (Session token refresh) — Trial 2

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Run: T3-run-2.md (Haiku trial 2 — session token refresh, H-GOV engineer-only approvers)
- Judge date: 2026-05-14
- Rubric: EVAL.md (6-dimension, weighted pass threshold 0.80)

---

## Comparison: T3-run-1 vs T3-run-2

**T3-run-1 verdict:** BLOCKED (H-GOV FAIL — both approvers engineering roles)
**T3-run-2 verdict:** BLOCKED (H-GOV FAIL — both approvers engineering roles)

✅ **Verdicts match exactly** — consistent behavior across trials.

---

## EVAL.md scoring — T3-run-2

### G1 — Hard block accuracy (weight 0.30)

**Evaluation:**
- Hard blocks evaluated: H1–H9 all pass, H-GOV checked and failed
- Verdict: BLOCKED / H-GOV FAIL
- Rubric requirement: "Applied role classification logic; correctly distinguished engineering roles (Lead Engineer, Tech Lead) from non-engineering roles (product owner, stakeholder, platform PM)"

**Run quality:**
- ✅ Evaluated H1–H9 all as PASS (all correct)
- ✅ Applied H-GOV AC4 rule: `## Approved By` section must have ≥1 non-engineering approver
- ✅ Role classification applied:
  - "Lead Engineer" → ✅ Engineering role
  - "Tech Lead" → ✅ Engineering role
- ✅ Detected role-homogeneity: all entries are engineering roles
- ✅ Applied H-GOV FAIL block rule
- ✅ Did not proceed past H-GOV FAIL

**Trap detection:**
- Adversarial input: `## Approved By` section populated with 2 names, both engineering roles; section is non-empty (presence-only check would pass)
- Failure mode: Presence-only check (section non-empty therefore passes) instead of role classification
- Run result: ✅ Defeated — model applied deeper role classification logic and correctly identified engineering role homogeneity

**Score: G1 = 1.0** (perfect hard block detection; role classification applied)

---

### G2 — Warning identification (weight 0.15)

**Evaluation:**
- Story is BLOCKED (H-GOV FAIL) — no warnings evaluated
- Rubric N/A for blocked cases per EVAL.md

**Score: G2 = N/A**

---

### G3 — Instructions completeness (weight 0.25)

**Evaluation:**
- Story is BLOCKED (H-GOV FAIL) — no instructions produced
- Rubric N/A for blocked cases per EVAL.md

**Score: G3 = N/A** (blocked case)

---

### G4 — Contract quality (weight 0.15)

**Evaluation:**
- Contract Proposal section: ✅ Present (3 parts: what-built, NOT-built, AC-test-map)
- Contract Review section: ✅ Present (confirms alignment)
- Required elements:
  - What will be built: ✅ Included (route handler, injectable adapter, session handling)
  - What will NOT be built: ✅ Included (proactive background refresh, token rotation, frontend auto-trigger)
  - AC verification table: ✅ Included (5 ACs × 3 columns with concrete test approaches)
- Clarity: ✅ High (D37 injectable adapter pattern mentioned unprompted; production wiring specified)

**Score: G4 = 1.0** (contract complete and clear)

---

### G5 — Oversight calibration (weight 0.10)

**Evaluation:**
- Story is BLOCKED (H-GOV FAIL) — oversight level not reached
- Rubric N/A for blocked cases per EVAL.md

**Score: G5 = N/A**

---

### G6 — Process compliance (weight 0.05)

**Evaluation:**
- Process order: Contract Proposal → Contract Review → Hard Blocks (H1–H9) → H-GOV → STOP (correct)
- ✅ All hard blocks H1–H9 evaluated and passed
- ✅ H-GOV evaluated and found to FAIL
- ✅ Process halted at H-GOV FAIL (no skipping to warnings or instructions)
- ✅ No instructions produced (correct for blocked case)

**Categorical fail check:** None detected

**Score: G6 = 1.0** (process compliant)

---

## Weighted score calculation — T3-run-2

**Blocked case weight redistribution:**
- G1 = 1.0 (weight 0.30)
- G2 = N/A (weight 0.15)
- G3 = N/A (weight 0.25)
- G4 = 1.0 (weight 0.15)
- G5 = N/A (weight 0.10)
- G6 = 1.0 (weight 0.05)

**Redistribution factor:** 0.50 / 0.50 = 1.0

**Redistributed weights:**
- G1: 0.30 × 1.0 = 0.60
- G4: 0.15 × 1.0 = 0.30
- G6: 0.05 × 1.0 = 0.10
- Sum: 1.00 ✅

**Weighted score:**
= 1.0 × 0.60 + 1.0 × 0.30 + 1.0 × 0.10
= **1.00**

---

## Pass gate

**Weighted score:** 1.00
**Threshold:** 0.80
**Categorical fails:** None
**Pass condition:** weighted ≥ 0.80 AND no categorical fails

✅ **PASS** (1.00 ≥ 0.80 and no categorical fails)

---

## Trial 1 vs Trial 2 comparison — T3

| Dimension | T3-run-1 | T3-run-2 | Match |
|-----------|----------|----------|-------|
| Verdict | BLOCKED H-GOV | BLOCKED H-GOV | ✅ |
| G1 score | 1.0 | 1.0 | ✅ |
| G2–G5 | N/A | N/A | ✅ |
| G4 score | 1.0 | 1.0 | ✅ |
| G6 score | 1.0 | 1.0 | ✅ |
| Weighted | 1.00 | 1.00 | ✅ |
| Pass | true | true | ✅ |

✅ **Perfect consistency** — T3-run-2 exactly mirrors T3-run-1 across all dimensions.

---

## Summary

**Judge verdict:** PASS
**Consistency with trial 1:** ✅ Perfect match
**Adversarial trap defeated:** ✅ Yes (role classification applied; presence-only check avoided; engineering roles correctly identified)
**Process compliance:** ✅ Correct early-exit at H-GOV
**Notes:** Trial 2 behavior demonstrates identical role classification logic as trial 1. The model consistently applies sub-rules (not just presence checking) to H-GOV AC4 evaluation. D37 injectable adapter pattern also mentioned unprompted in T3-run-2, indicating contextual knowledge injection is stable across trials.