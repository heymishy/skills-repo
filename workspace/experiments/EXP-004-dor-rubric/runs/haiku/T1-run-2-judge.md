# EXP-004 Judge: T1-run-2 (Payment webhook) — Trial 2

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Run: T1-run-2.md (Haiku trial 2 — payment webhook, missing ACs)
- Judge date: 2026-05-14
- Rubric: EVAL.md (6-dimension, weighted pass threshold 0.80)

---

## Comparison: T1-run-1 vs T1-run-2

**T1-run-1 verdict:** BLOCKED (H2 FAIL — 1 GWT AC + 3 prose bullets)
**T1-run-2 verdict:** BLOCKED (H2 FAIL — 1 GWT AC + 3 prose bullets)

✅ **Verdicts match exactly** — consistent behavior across trials.

---

## EVAL.md scoring — T1-run-2

### G1 — Hard block accuracy (weight 0.30)

**Evaluation:**
- Hard block evaluated: H2 (AC format check)
- Verdict: BLOCKED / FAIL
- Rubric requirement: "Correctly identified the AC-format trap; applied GWT check; distinguished 1 true AC from 3 prose bullets"

**Run quality:**
- ✅ Applied GWT format check
- ✅ Counted 1 Given/When/Then AC
- ✅ Identified 3 prose bullets as non-AC requirements
- ✅ Explicitly stated the fix: "rewrite as AC2, AC3, AC4 in GWT format"
- ✅ Did not proceed past H2 FAIL (correct early-exit)

**Trap detection:**
- Adversarial input: 4 items in story ACs section; 1 is GWT format, 3 are bullets
- Failure mode: AC-count-only check (would misread as "4 ACs present")
- Run result: ✅ Defeated — model applied deeper GWT format check

**Score: G1 = 1.0** (perfect hard block detection)

---

### G2 — Warning identification (weight 0.15)

**Evaluation:**
- Story is BLOCKED (H2 FAIL) — no warnings evaluated
- Rubric N/A for blocked cases per EVAL.md

**Score: G2 = N/A**

---

### G3 — Instructions completeness (weight 0.25)

**Evaluation:**
- Story is BLOCKED (H2 FAIL) — no instructions produced
- Rubric N/A for blocked cases per EVAL.md
- No score assigned

**Score: G3 = N/A** (blocked case — not evaluated)

---

### G4 — Contract quality (weight 0.15)

**Evaluation:**
- Contract Proposal section: ✅ Present (3 parts: what-built, NOT-built, AC-test-map)
- Contract Review section: ✅ Present (confirms alignment)
- Required elements:
  - What will be built: ✅ Included
  - What will NOT be built: ✅ Included
  - AC verification table: ✅ Included (4 ACs × 3 columns)
- Clarity: ✅ High (test approaches are concrete; out-of-scope items explicit)

**Score: G4 = 1.0** (contract complete and clear)

---

### G5 — Oversight calibration (weight 0.10)

**Evaluation:**
- Story is BLOCKED (H2 FAIL) — oversight level not reached
- Rubric N/A for blocked cases per EVAL.md

**Score: G5 = N/A**

---

### G6 — Process compliance (weight 0.05)

**Evaluation:**
- Process order: Contract Proposal → Contract Review → Hard Blocks → STOP (correct)
- ✅ Hard blocks evaluated in standard sequence (H1, H2, …)
- ✅ Process halted at H2 FAIL (no skipping ahead to warnings)
- ✅ No instructions produced (correct for blocked case)

**Categorical fail check:** None detected

**Score: G6 = 1.0** (process compliant)

---

## Weighted score calculation — T1-run-2

**Blocked case weight redistribution:**
- G1 = 1.0 (weight 0.30) → redistributed
- G2 = N/A (weight 0.15)
- G3 = N/A (weight 0.25) ← largest redistribution
- G4 = 1.0 (weight 0.15)
- G5 = N/A (weight 0.10)
- G6 = 1.0 (weight 0.05)

**Redistribution logic:**
N/A weights (0.15 + 0.25 + 0.10 = 0.50) redistributed proportionally to active scores (G1, G4, G6 = 0.30 + 0.15 + 0.05 = 0.50).

Redistribution factor = 0.50 / 0.50 = 1.0 (no net change; sum of active weights already = remaining capacity)

**Redistributed weights:**
- G1: 0.30 × (1.0 / 0.50) = 0.60
- G4: 0.15 × (1.0 / 0.50) = 0.30
- G6: 0.05 × (1.0 / 0.50) = 0.10
- Sum: 0.60 + 0.30 + 0.10 = 1.00 ✅

**Weighted score:**
= 1.0 × 0.60 + 1.0 × 0.30 + 1.0 × 0.10
= 0.60 + 0.30 + 0.10
= **1.00**

---

## Pass gate

**Weighted score:** 1.00
**Threshold:** 0.80
**Categorical fails:** None
**Pass condition:** weighted ≥ 0.80 AND no categorical fails

✅ **PASS** (1.00 ≥ 0.80 and no categorical fails)

---

## Trial 1 vs Trial 2 comparison — T1

| Dimension | T1-run-1 | T1-run-2 | Match |
|-----------|----------|----------|-------|
| Verdict | BLOCKED H2 | BLOCKED H2 | ✅ |
| G1 score | 1.0 | 1.0 | ✅ |
| G2–G5 | N/A | N/A | ✅ |
| G4 score | 1.0 | 1.0 | ✅ |
| G6 score | 1.0 | 1.0 | ✅ |
| Weighted | 1.00 | 1.00 | ✅ |
| Pass | true | true | ✅ |

✅ **Perfect consistency** — T1-run-2 exactly mirrors T1-run-1 across all dimensions.

---

## Summary

**Judge verdict:** PASS
**Consistency with trial 1:** ✅ Perfect match
**Adversarial trap defeated:** ✅ Yes (GWT format check applied)
**Process compliance:** ✅ Correct early-exit at H2
**Notes:** Trial 2 behavior is indistinguishable from trial 1. Model demonstrates stable, repeatable judgment on the AC-format trap case.