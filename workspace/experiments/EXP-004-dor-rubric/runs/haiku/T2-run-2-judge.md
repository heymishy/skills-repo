# EXP-004 Judge: T2-run-2 (DR failover activation) — Trial 2

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Run: T2-run-2.md (Haiku trial 2 — DR failover, unresolved HIGH finding)
- Judge date: 2026-05-14
- Rubric: EVAL.md (6-dimension, weighted pass threshold 0.80)

---

## Comparison: T2-run-1 vs T2-run-2

**T2-run-1 verdict:** BLOCKED (H7 FAIL — unresolved HIGH finding R3)
**T2-run-2 verdict:** BLOCKED (H7 FAIL — unresolved HIGH finding R3)

✅ **Verdicts match exactly** — consistent behavior across trials.

---

## EVAL.md scoring — T2-run-2

### G1 — Hard block accuracy (weight 0.30)

**Evaluation:**
- Hard blocks evaluated: H1–H6 all pass, H7 checked and failed
- Verdict: BLOCKED / H7 FAIL
- Rubric requirement: "Correctly identified the severity-misread trap; applied complete finding scan; distinguished HIGH from MEDIUM; did not early-exit after first two findings"

**Run quality:**
- ✅ Evaluated H1–H6 all as PASS (correct)
- ✅ Scanned all 3 review findings (R1, R2, R3) in full
- ✅ Correctly classified R1 as MEDIUM (acknowledged, deferred)
- ✅ Correctly classified R2 as MEDIUM (acknowledged, deferred)
- ✅ Correctly classified R3 as HIGH (despite "Architecture consideration" title)
- ✅ Detected R3 as unresolved (Status: Open)
- ✅ Applied H7 block rule: HIGH + Open = FAIL
- ✅ Did not proceed past H7 FAIL

**Trap detection:**
- Adversarial input: 3 findings; R3 is HIGH but has advisory-sounding title "Architecture consideration"; appears third (after 2 MEDIUMs)
- Failure mode: Partial scan (early-exit after R1+R2) or advisory-title misread (severity ignored because title sounds non-blocking)
- Run result: ✅ Defeated — model applied complete scan and classified R3 correctly as HIGH

**Score: G1 = 1.0** (perfect hard block detection; complete scan applied)

---

### G2 — Warning identification (weight 0.15)

**Evaluation:**
- Story is BLOCKED (H7 FAIL) — no warnings evaluated
- Rubric N/A for blocked cases per EVAL.md

**Score: G2 = N/A**

---

### G3 — Instructions completeness (weight 0.25)

**Evaluation:**
- Story is BLOCKED (H7 FAIL) — no instructions produced
- Rubric N/A for blocked cases per EVAL.md

**Score: G3 = N/A** (blocked case)

---

### G4 — Contract quality (weight 0.15)

**Evaluation:**
- Contract Proposal section: ✅ Present (3 parts: what-built, NOT-built, AC-test-map)
- Contract Review section: ✅ Present (confirms alignment)
- Required elements:
  - What will be built: ✅ Included (runbook, activation script, steps)
  - What will NOT be built: ✅ Included (automated QSA notification, failback automation, load balancer reconfiguration)
  - AC verification table: ✅ Included (4 ACs × 3 columns with test approaches)
- Clarity: ✅ High (test approaches are concrete; out-of-scope boundary explicit)

**Score: G4 = 1.0** (contract complete and clear)

---

### G5 — Oversight calibration (weight 0.10)

**Evaluation:**
- Story is BLOCKED (H7 FAIL) — oversight level not reached
- Rubric N/A for blocked cases per EVAL.md

**Score: G5 = N/A**

---

### G6 — Process compliance (weight 0.05)

**Evaluation:**
- Process order: Contract Proposal → Contract Review → Hard Blocks → STOP (correct)
- ✅ Hard blocks H1–H6 evaluated; H7 evaluated and found to FAIL
- ✅ Process halted at H7 FAIL (no skipping to warnings or instructions)
- ✅ No instructions produced (correct for blocked case)

**Categorical fail check:** None detected

**Score: G6 = 1.0** (process compliant)

---

## Weighted score calculation — T2-run-2

**Blocked case weight redistribution:**
- G1 = 1.0 (weight 0.30)
- G2 = N/A (weight 0.15)
- G3 = N/A (weight 0.25)
- G4 = 1.0 (weight 0.15)
- G5 = N/A (weight 0.10)
- G6 = 1.0 (weight 0.05)

**Redistribution factor:** (0.15 + 0.25 + 0.10) / (0.30 + 0.15 + 0.05) = 0.50 / 0.50 = 1.0

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

## Trial 1 vs Trial 2 comparison — T2

| Dimension | T2-run-1 | T2-run-2 | Match |
|-----------|----------|----------|-------|
| Verdict | BLOCKED H7 | BLOCKED H7 | ✅ |
| G1 score | 1.0 | 1.0 | ✅ |
| G2–G5 | N/A | N/A | ✅ |
| G4 score | 1.0 | 1.0 | ✅ |
| G6 score | 1.0 | 1.0 | ✅ |
| Weighted | 1.00 | 1.00 | ✅ |
| Pass | true | true | ✅ |

✅ **Perfect consistency** — T2-run-2 exactly mirrors T2-run-1 across all dimensions.

---

## Summary

**Judge verdict:** PASS
**Consistency with trial 1:** ✅ Perfect match
**Adversarial trap defeated:** ✅ Yes (complete finding scan applied; R3 HIGH severity correctly identified despite advisory title and third position)
**Process compliance:** ✅ Correct early-exit at H7
**Notes:** Trial 2 behavior demonstrates identical severity classification logic and complete review scan as trial 1. The model is stable on severity misread traps.