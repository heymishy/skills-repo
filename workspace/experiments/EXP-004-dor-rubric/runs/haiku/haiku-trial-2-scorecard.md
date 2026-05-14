# EXP-004 Trial 2 Scorecard — Haiku aggregate results and consistency analysis

**Experiment:** EXP-004-dor-rubric
**Model:** claude-haiku-4-5
**Trial:** 2 (independent repeat evaluation)
**Date range:** 2026-05-14
**Judge date:** 2026-05-14
**Status:** Complete

---

## Trial 2 Results Table — All 4 cases

| Case | Verdict | G1 | G2 | G3 | G4 | G5 | G6 | Weighted | Pass | Compliant |
|------|---------|----|----|----|----|----|----|----------|------|-----------|
| T1 | BLOCKED H2 | 1.0 | N/A | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| T2 | BLOCKED H7 | 1.0 | N/A | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| T3 | BLOCKED H-GOV | 1.0 | N/A | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| T4 | READY | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | ✅ | ✅ |

**Trial 2 Gate Fidelity (GF):** 4/4 correct verdicts = **1.00** (100%)
**Trial 2 Mean weighted score:** (1.00 + 1.00 + 1.00 + 1.00) / 4 = **1.00**
**Categorical fails:** 0/4 (zero)
**Pass rate:** 4/4 cases passed (100%)

---

## Trial 1 vs Trial 2 — Consistency analysis

### Verdict comparison (all 4 cases)

| Case | T1 verdict | T2 verdict | Match | Notes |
|------|-----------|-----------|-------|-------|
| T1 | BLOCKED H2 | BLOCKED H2 | ✅ | AC-format trap: both detected GWT format check |
| T2 | BLOCKED H7 | BLOCKED H7 | ✅ | Severity misread trap: both completed full scan, identified R3 as HIGH |
| T3 | BLOCKED H-GOV | BLOCKED H-GOV | ✅ | Role classification trap: both applied sub-rule, not presence-only check |
| T4 | READY | READY | ✅ | Complex full evaluation: both executed all 17 blocks + warnings + instructions |

✅ **Verdict consistency: 4/4 (100%)**

---

### Gate Fidelity comparison

| Metric | Trial 1 | Trial 2 | Variance |
|--------|---------|---------|----------|
| GF (correct verdicts / 4) | 1.00 | 1.00 | 0.00 |
| Mean weighted score | 1.00 | 1.00 | 0.00 |
| Categorical fails | 0 | 0 | 0 |
| Adversarial traps defeated | 4/4 | 4/4 | 0 |

✅ **GF sustained at 1.00 across both trials**
✅ **Zero variance on all primary metrics**

---

### Per-dimension scoring comparison

**Dimension G1 (Hard block accuracy):**

| Case | T1-G1 | T2-G1 | Match |
|------|-------|-------|-------|
| T1 | 1.0 | 1.0 | ✅ |
| T2 | 1.0 | 1.0 | ✅ |
| T3 | 1.0 | 1.0 | ✅ |
| T4 | 1.0 | 1.0 | ✅ |

**Mean G1:** Trial 1 = 1.00, Trial 2 = 1.00 | Variance = 0.00 ✅

---

**Dimension G2 (Warning identification):**

| Case | T1-G2 | T2-G2 | Match |
|------|-------|-------|-------|
| T1 | N/A | N/A | ✅ |
| T2 | N/A | N/A | ✅ |
| T3 | N/A | N/A | ✅ |
| T4 | 1.0 | 1.0 | ✅ |

**Mean G2 (READY cases only):** Trial 1 = 1.00, Trial 2 = 1.00 | Variance = 0.00 ✅

---

**Dimension G3 (Instructions completeness):**

| Case | T1-G3 | T2-G3 | Match |
|------|-------|-------|-------|
| T1 | N/A | N/A | ✅ |
| T2 | N/A | N/A | ✅ |
| T3 | N/A | N/A | ✅ |
| T4 | 1.0 | 1.0 | ✅ |

**Mean G3 (READY cases only):** Trial 1 = 1.00, Trial 2 = 1.00 | Variance = 0.00 ✅

---

**Dimension G4 (Contract quality):**

| Case | T1-G4 | T2-G4 | Match |
|------|-------|-------|-------|
| T1 | 1.0 | 1.0 | ✅ |
| T2 | 1.0 | 1.0 | ✅ |
| T3 | 1.0 | 1.0 | ✅ |
| T4 | 1.0 | 1.0 | ✅ |

**Mean G4:** Trial 1 = 1.00, Trial 2 = 1.00 | Variance = 0.00 ✅

---

**Dimension G5 (Oversight calibration):**

| Case | T1-G5 | T2-G5 | Match |
|------|-------|-------|-------|
| T1 | N/A | N/A | ✅ |
| T2 | N/A | N/A | ✅ |
| T3 | N/A | N/A | ✅ |
| T4 | 1.0 | 1.0 | ✅ |

**Mean G5 (READY cases only):** Trial 1 = 1.00, Trial 2 = 1.00 | Variance = 0.00 ✅

---

**Dimension G6 (Process compliance):**

| Case | T1-G6 | T2-G6 | Match |
|------|-------|-------|-------|
| T1 | 1.0 | 1.0 | ✅ |
| T2 | 1.0 | 1.0 | ✅ |
| T3 | 1.0 | 1.0 | ✅ |
| T4 | 1.0 | 1.0 | ✅ |

**Mean G6:** Trial 1 = 1.00, Trial 2 = 1.00 | Variance = 0.00 ✅

---

## Adversarial trap summary — both trials

| Trap | Nature | T1 result | T2 result | Consistency |
|------|--------|-----------|-----------|------------|
| **AC format trap (T1)** | 1 GWT AC + 3 prose bullets; model must apply GWT format check, not AC-count-only | ✅ Defeated | ✅ Defeated | ✅ Perfect |
| **Severity misread trap (T2)** | 3 findings; HIGH finding has advisory title, appears third; model must complete full scan | ✅ Defeated | ✅ Defeated | ✅ Perfect |
| **Role classification trap (T3)** | Section non-empty but engineer-only; model must apply role classification, not presence-only check | ✅ Defeated | ✅ Defeated | ✅ Perfect |
| **Complex multi-block trap (T4)** | 17 hard blocks + compliance NFR + sequential warnings + 9-section instructions; model must not skip blocks or batch warnings | ✅ Defeated | ✅ Defeated | ✅ Perfect |

✅ **All 4 adversarial traps defeated in both trials with perfect consistency**

---

## Standards and constraints consistency

### Contextual knowledge injection

**D37 injectable adapter pattern:**
- T1-run-1: Referenced unprompted in contract quality ✅
- T1-run-2: Referenced unprompted in contract quality ✅
- T3-run-1: Referenced unprompted when mentioning production wiring ✅
- T3-run-2: Referenced unprompted when mentioning production wiring ✅

**Pattern:** Model consistently injects D37 context when relevant to story design. Behavior is stable across trials.

### NFR/Compliance block handling

**H-NFR2 (compliance NFR sign-off):**
- T4-run-1: "Priya Sharma (Head of Platform Partnerships) confirmed 2026-04-20. Sign-off recorded in /decisions entry DEC-2026-04-20-amlcft-scope" ✅
- T4-run-2: "Priya Sharma (Head of Platform Partnerships) confirmed 2026-04-20. Sign-off recorded in /decisions entry DEC-2026-04-20-amlcft-scope" ✅

**Consistency:** Identical reference extraction and verification logic across trials.

### Process order preservation

**Phase sequence (all trials):**
1. Contract Proposal ✅
2. Contract Review ✅
3. Hard Blocks (H1–H9, H8-ext, H-E2E, H-NFR*, H-GOV, H-ADAPTER) ✅
4. Warnings (W1–W5) ✅ [READY cases only]
5. Oversight calibration ✅ [READY cases only]
6. Instructions ✅ [READY cases only]

**Consistency:** Process order preserved identically across all 8 runs (4 T1, 1 T2 + 3 judges).

---

## Hypothesis confirmation

**Hypothesis:** Claude-Haiku-4-5 can reliably execute the /definition-of-ready gate skill with GF ≥ 0.95 sustained across independent trials, with zero categorical failures.

**Trial 1 result:** GF = 1.00 ✅ (supports)
**Trial 2 result:** GF = 1.00 ✅ (confirms)
**Consistency:** Perfect (0.00 variance across all metrics) ✅

**Hypothesis status:** ✅ **STRONGLY SUPPORTED**

The model demonstrated:
- ✅ Perfect verdict accuracy (4/4 in each trial)
- ✅ All 4 adversarial traps defeated in both trials
- ✅ Correct hard block evaluation (all 17 blocks applied)
- ✅ Correct warning identification and sequential presentation (W1, W3)
- ✅ Correct process order (no skipping or out-of-order phases)
- ✅ Complete instructions production (9 sections, all required elements)
- ✅ Zero process compliance violations
- ✅ Stable contextual knowledge injection (D37, standards)
- ✅ Perfect consistency across trials (zero variance)

---

## Recommendation

**Model routing decision:** ✅ **APPROVED for DoR gate evaluation**

**Evidence:**
- GF = 1.00 sustained across 2 independent trials
- Zero categorical failures
- Zero variance on all scoring dimensions
- All adversarial traps defeated in both trials
- Perfect process compliance
- Stable contextual knowledge injection

**Deployment recommendation:**
- Route claude-haiku-4-5 to `/definition-of-ready` skill evaluations
- No special fallback needed (gate fidelity at ceiling)
- Continue monitoring for downstream Sonnet trial (for comparison)

---

## Next steps

1. ✅ Haiku trial 1: Complete (GF = 1.00, 4/4 correct)
2. ✅ Haiku trial 2: Complete (GF = 1.00, 4/4 correct, perfect consistency)
3. ⬜ Sonnet trial 1: Ready to dispatch (4 cases × Sonnet, same corpus)
4. ⬜ Sonnet trial 2: Ready to dispatch (4 cases × Sonnet, consistency check)
5. ⬜ Final analysis: Compare Haiku vs Sonnet; token cost analysis; routing policy decision