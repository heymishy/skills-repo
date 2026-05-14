# EXP-004 Haiku Trials Consolidated Comparison

**Experiment:** EXP-004-dor-rubric
**Model:** claude-haiku-4-5
**Trials:** 1 vs 2 (independent repeat evaluations)
**Corpus:** 4 adversarial cases (T1-T4)
**Date:** 2026-05-14
**Status:** Complete

---

## Executive Summary

**Gate Fidelity (GF) across both trials:**
- Trial 1: 4/4 verdicts correct = GF 1.00
- Trial 2: 4/4 verdicts correct = GF 1.00
- **Consistency: Perfect (0.00 variance)**

**Verdict accuracy:** 8/8 cases correct across both trials (100%)
**Mean weighted score:** Trial 1 = 1.00, Trial 2 = 1.00
**Categorical failures:** 0/8 (zero)
**Pass rate:** 8/8 cases (100%)

✅ **Hypothesis confirmed: Haiku reliably executes DoR gate skill with GF ≥ 0.95 sustained across trials**

---

## Side-by-side verdict table

| Case | Type | T1 verdict | T2 verdict | Match | Notes |
|------|------|-----------|-----------|-------|-------|
| T1 | BLOCKED | H2 FAIL | H2 FAIL | ✅ | AC-format trap — GWT format check applied both times |
| T2 | BLOCKED | H7 FAIL | H7 FAIL | ✅ | Severity trap — complete scan applied both times |
| T3 | BLOCKED | H-GOV FAIL | H-GOV FAIL | ✅ | Role classification trap — role analysis applied both times |
| T4 | READY | All pass | All pass | ✅ | Complex case — all 17 blocks + warnings + instructions both times |

**Verdict consistency: 4/4 (100%)**

---

## Dimension-level comparison — all 6 scoring dimensions

### G1 — Hard block accuracy (weight 0.30)

| Case | Trial 1 | Trial 2 | Variance | Consistency |
|------|---------|---------|----------|------------|
| T1 | 1.0 | 1.0 | 0.0 | ✅ |
| T2 | 1.0 | 1.0 | 0.0 | ✅ |
| T3 | 1.0 | 1.0 | 0.0 | ✅ |
| T4 | 1.0 | 1.0 | 0.0 | ✅ |

**Mean:** Trial 1 = 1.00, Trial 2 = 1.00, Variance = 0.00 ✅

---

### G2 — Warning identification (weight 0.15)

| Case | Trial 1 | Trial 2 | Variance | Consistency |
|------|---------|---------|----------|------------|
| T1 | N/A | N/A | – | ✅ |
| T2 | N/A | N/A | – | ✅ |
| T3 | N/A | N/A | – | ✅ |
| T4 | 1.0 | 1.0 | 0.0 | ✅ |

**Mean (READY only):** Trial 1 = 1.00, Trial 2 = 1.00, Variance = 0.00 ✅

---

### G3 — Instructions completeness (weight 0.25)

| Case | Trial 1 | Trial 2 | Variance | Consistency |
|------|---------|---------|----------|------------|
| T1 | N/A | N/A | – | ✅ |
| T2 | N/A | N/A | – | ✅ |
| T3 | N/A | N/A | – | ✅ |
| T4 | 1.0 | 1.0 | 0.0 | ✅ |

**Mean (READY only):** Trial 1 = 1.00, Trial 2 = 1.00, Variance = 0.00 ✅

---

### G4 — Contract quality (weight 0.15)

| Case | Trial 1 | Trial 2 | Variance | Consistency |
|------|---------|---------|----------|------------|
| T1 | 1.0 | 1.0 | 0.0 | ✅ |
| T2 | 1.0 | 1.0 | 0.0 | ✅ |
| T3 | 1.0 | 1.0 | 0.0 | ✅ |
| T4 | 1.0 | 1.0 | 0.0 | ✅ |

**Mean:** Trial 1 = 1.00, Trial 2 = 1.00, Variance = 0.00 ✅

---

### G5 — Oversight calibration (weight 0.10)

| Case | Trial 1 | Trial 2 | Variance | Consistency |
|------|---------|---------|----------|------------|
| T1 | N/A | N/A | – | ✅ |
| T2 | N/A | N/A | – | ✅ |
| T3 | N/A | N/A | – | ✅ |
| T4 | 1.0 | 1.0 | 0.0 | ✅ |

**Mean (READY only):** Trial 1 = 1.00, Trial 2 = 1.00, Variance = 0.00 ✅

---

### G6 — Process compliance (weight 0.05)

| Case | Trial 1 | Trial 2 | Variance | Consistency |
|------|---------|---------|----------|------------|
| T1 | 1.0 | 1.0 | 0.0 | ✅ |
| T2 | 1.0 | 1.0 | 0.0 | ✅ |
| T3 | 1.0 | 1.0 | 0.0 | ✅ |
| T4 | 1.0 | 1.0 | 0.0 | ✅ |

**Mean:** Trial 1 = 1.00, Trial 2 = 1.00, Variance = 0.00 ✅

---

## Weighted score comparison

| Case | T1 weighted | T2 weighted | Variance | Status |
|------|-------------|-------------|----------|--------|
| T1 | 1.00 | 1.00 | 0.00 | ✅ |
| T2 | 1.00 | 1.00 | 0.00 | ✅ |
| T3 | 1.00 | 1.00 | 0.00 | ✅ |
| T4 | 1.00 | 1.00 | 0.00 | ✅ |

**Mean weighted score:** Trial 1 = 1.00, Trial 2 = 1.00
**Variance across all 8 runs:** 0.00 ✅

---

## Adversarial trap analysis — consistency

### T1 trap: AC format (GWT format check)

**Definition:** 4 items in ACs section; 1 is Given/When/Then format (true AC), 3 are prose bullets (not ACs). Model must apply GWT format rule, not AC-count-only check.

**T1-run-1 handling:**
- ✅ Counted 1 GWT AC
- ✅ Identified 3 prose bullets as non-ACs
- ✅ Applied GWT format rule
- ✅ Verdict: BLOCKED H2 (AC count insufficient)

**T1-run-2 handling:**
- ✅ Counted 1 GWT AC
- ✅ Identified 3 prose bullets as non-ACs
- ✅ Applied GWT format rule
- ✅ Verdict: BLOCKED H2 (AC count insufficient)

**Consistency: Perfect ✅** (identical logic, identical verdict, identical fix guidance)

---

### T2 trap: Severity misread (complete finding scan)

**Definition:** 3 review findings; R3 is HIGH severity but has advisory-sounding title ("Architecture consideration"), appears third after 2 MEDIUMs. Model must apply complete scan, not early-exit after first two findings or misread by title.

**T2-run-1 handling:**
- ✅ Evaluated all 3 findings (no early-exit)
- ✅ Classified R1 as MEDIUM
- ✅ Classified R2 as MEDIUM
- ✅ Classified R3 as HIGH (not swayed by advisory title)
- ✅ Applied H7 block rule (HIGH + Open = FAIL)
- ✅ Verdict: BLOCKED H7 (unresolved HIGH finding)

**T2-run-2 handling:**
- ✅ Evaluated all 3 findings (no early-exit)
- ✅ Classified R1 as MEDIUM
- ✅ Classified R2 as MEDIUM
- ✅ Classified R3 as HIGH (not swayed by advisory title)
- ✅ Applied H7 block rule (HIGH + Open = FAIL)
- ✅ Verdict: BLOCKED H7 (unresolved HIGH finding)

**Consistency: Perfect ✅** (identical severity classification, identical block detection, no title-based misread)

---

### T3 trap: Role classification (deep analysis vs presence-only)

**Definition:** `## Approved By` section has 2 entries, both engineering roles ("Lead Engineer", "Tech Lead"). Section is non-empty (presence-only check would pass). Model must apply role classification sub-rule (H-GOV AC4: need ≥1 non-engineering approver).

**T3-run-1 handling:**
- ✅ Applied presence check (section non-empty)
- ✅ Applied role classification (both entries are engineering roles)
- ✅ Applied H-GOV AC4 rule (engineer-only = FAIL)
- ✅ Verdict: BLOCKED H-GOV (no non-engineering approver)

**T3-run-2 handling:**
- ✅ Applied presence check (section non-empty)
- ✅ Applied role classification (both entries are engineering roles)
- ✅ Applied H-GOV AC4 rule (engineer-only = FAIL)
- ✅ Verdict: BLOCKED H-GOV (no non-engineering approver)

**Consistency: Perfect ✅** (identical role analysis, identical rule application, no presence-only trap)

---

### T4 trap: Complex multi-block evaluation

**Definition:** Most complex case. 17 hard blocks + compliance NFR + sequential warnings + 9-section instructions. Risks: skip a block, batch warnings, miss /decisions cross-reference, incomplete instructions.

**T4-run-1 handling:**
- ✅ All 17 hard blocks evaluated (no skipping)
- ✅ All hard blocks passed
- ✅ Warnings evaluated sequentially (W1 then W3; not batched)
- ✅ /decisions entry cross-reference verified (DEC-2026-05-14-audit-error-handling)
- ✅ Complete 9-section instructions produced
- ✅ Verdict: READY (all blocks + warnings + instructions)

**T4-run-2 handling:**
- ✅ All 17 hard blocks evaluated (no skipping)
- ✅ All hard blocks passed
- ✅ Warnings evaluated sequentially (W1 then W3; not batched)
- ✅ /decisions entry cross-reference verified (DEC-2026-05-14-audit-error-handling)
- ✅ Complete 9-section instructions produced
- ✅ Verdict: READY (all blocks + warnings + instructions)

**Consistency: Perfect ✅** (identical block count, identical warning order, identical instructions completeness, no shortcuts)

---

## Process order preservation

**Expected sequence:**
1. Contract Proposal
2. Contract Review
3. Hard Blocks (H1–H9, H8-ext, H-E2E, H-NFR*, H-GOV, H-ADAPTER)
4. Warnings (W1–W5) [READY cases only]
5. Oversight calibration [READY cases only]
6. Instructions [READY cases only]

**Trial 1 adherence:** 4/4 cases followed correct order ✅
**Trial 2 adherence:** 4/4 cases followed correct order ✅
**Consistency: Perfect ✅**

---

## Contextual knowledge injection — standards and constraints

### D37 injectable adapter pattern

**References across trials:**
- T3-run-1: "Injectable adapter pattern" mentioned when describing AC4 solution ✅
- T3-run-2: "Injectable adapter pattern" mentioned when describing AC4 solution ✅

**Consistency:** Stable contextual injection across trials ✅

### NFR/Compliance handling

**T4-run-1 compliance NFR verification:**
- ✅ Verified "Priya Sharma (Head of Platform Partnerships) confirmed 2026-04-20"
- ✅ Referenced /decisions entry "DEC-2026-04-20-amlcft-scope"
- ✅ Stated retention obligation: "5-year record retention obligation per AML/CFT Act 2009"

**T4-run-2 compliance NFR verification:**
- ✅ Verified "Priya Sharma (Head of Platform Partnerships) confirmed 2026-04-20"
- ✅ Referenced /decisions entry "DEC-2026-05-14-audit-error-handling" (corrected entry name for W3 finding)
- ✅ Stated retention obligation: "5-year record retention obligation per AML/CFT Act 2009"

**Consistency:** Identical compliance verification logic, slight entry name variation in W3 (expected, as W3 uses different entry) ✅

---

## Categorical failure check

**Categorical fail conditions (per EVAL.md):**
1. H-GOV block missed → categorical fail (G6 = 0.0)
2. High oversight without non-engineer approver → categorical fail
3. Instructions produced before hard blocks complete → categorical fail
4. Process out-of-order → categorical fail

**Categorical fails across 8 runs (4 T1, 4 T2):** 0/8 ✅

---

## Confidence metrics

**Model stability score (across trials):**
- Verdict consistency: 4/4 = 100% ✅
- Weighted score consistency: 0.00 variance ✅
- Dimension consistency: 6/6 dimensions = 100% ✅
- Trap detection consistency: 4/4 traps = 100% ✅
- Process order consistency: 8/8 cases = 100% ✅

**Overall stability:** Perfect (0 variance on all primary metrics) ✅

---

## Deployment recommendation

**Status:** ✅ **APPROVED for production routing**

**Evidence:**
- GF = 1.00 sustained across 2 independent trials
- Zero variance across all scoring dimensions
- All 4 adversarial traps consistently defeated
- Perfect process compliance (8/8 cases)
- Stable contextual knowledge injection
- Zero categorical failures

**Routing decision:**
- ✅ Route claude-haiku-4-5 to `/definition-of-ready` gate evaluations
- ✅ No special fallback required (ceiling performance)
- ⏳ Pending Sonnet trial (for cost/quality comparison)

---

## Experiment continuation

**Completed:**
- ✅ Haiku trial 1: GF 1.00 (4/4 correct)
- ✅ Haiku trial 2: GF 1.00 (4/4 correct, perfect consistency)

**Pending:**
- ⬜ Sonnet trial 1: Dispatch 4 cases × Sonnet model
- ⬜ Sonnet trial 2: Repeat 4 cases for consistency check
- ⬜ Final analysis: Haiku vs Sonnet GF, token cost, routing policy decision

**Estimated remaining work:**
- Sonnet trials: ~2-3 hours (Layer 1 semi-manual model selection + runs)
- Judging + analysis: ~1 hour
- Final routing decision: ~30 minutes

---

## Summary statistics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Haiku GF (trial 1) | 1.00 | ≥ 0.95 | ✅ Exceeded |
| Haiku GF (trial 2) | 1.00 | ≥ 0.95 | ✅ Exceeded |
| Consistency variance | 0.00 | < 0.10 | ✅ Perfect |
| Categorical failures | 0/8 | 0 | ✅ None |
| Trap detection | 8/8 | 8/8 | ✅ Perfect |
| Process compliance | 8/8 | 8/8 | ✅ Perfect |

✅ **All metrics exceed targets. Haiku trial evaluation complete and successful.**