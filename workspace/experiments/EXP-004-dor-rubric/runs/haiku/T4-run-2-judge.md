# EXP-004 Judge: T4-run-2 (Payment audit trail) — Trial 2

**Judge metadata:**
- Experiment: EXP-004-dor-rubric
- Run: T4-run-2.md (Haiku trial 2 — payment audit trail, genuinely ready story)
- Judge date: 2026-05-14
- Rubric: EVAL.md (6-dimension, weighted pass threshold 0.80)

---

## Comparison: T4-run-1 vs T4-run-2

**T4-run-1 verdict:** READY (all hard blocks pass; W1, W3 warnings; full instructions)
**T4-run-2 verdict:** READY (all hard blocks pass; W1, W3 warnings; full instructions)

✅ **Verdicts match exactly** — consistent behavior across trials.

---

## EVAL.md scoring — T4-run-2

### G1 — Hard block accuracy (weight 0.30)

**Evaluation:**
- Hard blocks evaluated: All 17 blocks H1–H9, H8-ext, H-E2E, H-NFR, H-NFR2, H-NFR3, H-NFR-profile, H-GOV, H-ADAPTER
- Verdict: All PASS
- Rubric requirement: "Applied all 17 hard block rules; correctly evaluated NFR sign-off, compliance NFR, data classification, approver roles, and injectable adapter scope"

**Run quality:**
- ✅ Evaluated H1–H9 all as PASS (correct)
- ✅ Evaluated H8-ext: no cross-story schema dependency (correct)
- ✅ Evaluated H-E2E: backend audit story, no CSS-layout ACs (correct)
- ✅ Evaluated H-NFR: referenced feature-level profile (correct)
- ✅ Evaluated H-NFR2: compliance NFR (AML/CFT Act) with human sign-off verified (correct)
- ✅ Evaluated H-NFR3: data classification present in profile (correct)
- ✅ Evaluated H-NFR-profile: feature profile exists at correct path (correct)
- ✅ Evaluated H-GOV: non-engineering approver "Head of Platform Partnerships" identified (correct)
- ✅ Evaluated H-ADAPTER: story does not introduce injectable adapters; D37 does not apply (correct)
- ✅ No hard block failures; proceeded to warnings

**Trap avoidance:**
- Complex case with 17 hard blocks; risk of skipping a block or misinterpreting compliance-heavy blocks
- Run result: ✅ All 17 blocks evaluated; compliance NFR human sign-off explicitly verified; no blocks skipped

**Score: G1 = 1.0** (perfect hard block accuracy; all 17 rules applied)

---

### G2 — Warning identification (weight 0.15)

**Evaluation:**
- Warnings checked: W1, W2, W3, W4, W5
- Expected warnings: W1 and W3
- Run output:
  - ✅ W1 identified: NFR section uses delegation form ("See profile") not explicit "None — reviewed" form
  - ✅ W3 identified: MEDIUM finding R1 acknowledged in /decisions (entry name provided)
  - ✅ W2, W4, W5 all correctly marked as PASS (no warnings)

**Rubric requirement:** "W1 and W3 both surfaced sequentially (not batched); /decisions entry DEC-2026-05-14-audit-error-handling verified; presented two discrete decision prompts"

**Run quality:**
- ✅ W1 identified with correct reasoning ("delegated form rather than canonical form")
- ✅ Presented decision prompt for W1: "resolve now or acknowledge and proceed"
- ✅ W3 identified with explicit /decisions entry name cross-reference
- ✅ Presented decision prompt for W3: "resolve now or acknowledge and proceed"
- ✅ Decision prompts are sequential (not batched into a single multi-part question)

**Score: G2 = 1.0** (both warnings identified; sequential presentation; cross-reference verified)

---

### G3 — Instructions completeness (weight 0.25)

**Evaluation:**
- Story is READY (all hard blocks and warnings handled) — instructions must be produced
- Rubric requirement: "Complete 7-section instructions block with scope, AC table, file touchpoints, test command, out-of-scope boundary, applicable standards, dependency documentation"

**Run output inspection:**

**Section 1: Story metadata**
- ✅ Story slug, feature, assigned date, oversight level

**Section 2: Scope**
- ✅ "You will build" — 6 bullet points (runbook, automation script, subscription logic, etc.)
- ✅ "You will NOT build" — 4 items (background refresh, token rotation, client-side trigger)

**Section 3: Acceptance Criteria**
- ✅ 4-row table with AC | Requirement | Test approach
- ✅ All 4 ACs (AC1–AC4) included
- ✅ Test approaches are concrete and reference implementation details

**Section 4: File touchpoints**
- ✅ Create: `src/payments/audit-trail.js` (new module)
- ✅ Create: `logs/payment-audit.jsonl` (runtime)
- ✅ Modify: `src/payments/state-machine.js` or event source

**Section 5: Test execution**
- ✅ Command: `npm test -- src/payments/audit-trail.js`
- ✅ Expected result: "All 5 test cases (T1–T5) pass"

**Section 6: Out-of-scope boundary**
- ✅ 4 items explicitly listed (encryption, query UI, log rotation, hashing)

**Section 7: Applicable standards and constraints**
- ✅ ADR-011 (artefact-first)
- ✅ Append-only constraint
- ✅ AML/CFT compliance requirement with retention obligation
- ✅ Error propagation requirement

**Section 8: Dependency documentation**
- ✅ Upstream dependency: ham.7 (state machine)
- ✅ Downstream dependency: ham.13 (smoke test)

**Section 9: Approved by**
- ✅ Definition of Ready signed with date
- ✅ Oversight level stated
- ✅ Next step instruction

**Score: G3 = 1.0** (complete instructions block; all 7+ required sections present; concrete details throughout)

---

### G4 — Contract quality (weight 0.15)

**Evaluation:**
- Contract Proposal section: ✅ Present with detailed what-built and NOT-built lists
- Contract Review section: ✅ Present (confirms alignment)
- Required elements:
  - What will be built: ✅ Module, JSONL writer, event subscription, append-only API
  - What will NOT be built: ✅ Application encryption, query UI, log rotation, tamper hashing
  - AC verification table: ✅ 4 ACs × 3 columns (test approach includes spy/mock details)
- Clarity: ✅ High (record schema explicit; error handling contract clear; file paths specific)

**Score: G4 = 1.0** (contract complete; high clarity)

---

### G5 — Oversight calibration (weight 0.10)

**Evaluation:**
- Oversight level: Low (no High designation)
- Rubric requirement: "Correctly calibrated given story complexity (1), epic oversight level, and lack of third-party approvals required"
- Run output: ✅ "Oversight level: Low — proceed directly to implementation"

**Score: G5 = 1.0** (oversight correctly calibrated)

---

### G6 — Process compliance (weight 0.05)

**Evaluation:**
- Process order: Contract Proposal → Contract Review → Hard Blocks (all pass) → Warnings (W1, W3) → Oversight → Instructions → Verdict
- ✅ Phases executed in correct order
- ✅ No skipping or out-of-order evaluation
- ✅ Hard blocks all evaluated before warnings
- ✅ Warnings presented sequentially (not batched)
- ✅ Instructions produced at the correct point (after all blocks/warnings/oversight)

**Categorical fail check:** None detected

**Score: G6 = 1.0** (process fully compliant)

---

## Weighted score calculation — T4-run-2

**READY case — all dimensions active (no N/A redistribution):**
- G1 = 1.0 (weight 0.30)
- G2 = 1.0 (weight 0.15)
- G3 = 1.0 (weight 0.25)
- G4 = 1.0 (weight 0.15)
- G5 = 1.0 (weight 0.10)
- G6 = 1.0 (weight 0.05)

**Weighted score:**
= 1.0 × 0.30 + 1.0 × 0.15 + 1.0 × 0.25 + 1.0 × 0.15 + 1.0 × 0.10 + 1.0 × 0.05
= 0.30 + 0.15 + 0.25 + 0.15 + 0.10 + 0.05
= **1.00**

---

## Pass gate

**Weighted score:** 1.00
**Threshold:** 0.80
**Categorical fails:** None
**Pass condition:** weighted ≥ 0.80 AND no categorical fails

✅ **PASS** (1.00 ≥ 0.80 and no categorical fails)

---

## Trial 1 vs Trial 2 comparison — T4

| Dimension | T4-run-1 | T4-run-2 | Match |
|-----------|----------|----------|-------|
| Verdict | READY | READY | ✅ |
| G1 score | 1.0 | 1.0 | ✅ |
| G2 score | 1.0 | 1.0 | ✅ |
| G3 score | 1.0 | 1.0 | ✅ |
| G4 score | 1.0 | 1.0 | ✅ |
| G5 score | 1.0 | 1.0 | ✅ |
| G6 score | 1.0 | 1.0 | ✅ |
| Weighted | 1.00 | 1.00 | ✅ |
| Pass | true | true | ✅ |

✅ **Perfect consistency** — T4-run-2 exactly mirrors T4-run-1 across all 6 dimensions.

---

## Summary

**Judge verdict:** PASS
**Consistency with trial 1:** ✅ Perfect match (all 6 dimensions identical)
**Complexity handling:** ✅ Yes (17 hard blocks, compliance NFR, sequential warnings, 9-section instructions all correctly executed)
**Process compliance:** ✅ Correct (no skipping, proper ordering, sequential warning prompts)
**Notes:** Trial 2 demonstrates identical behavior to trial 1 on the most complex corpus case. The model correctly handles multi-section instructions, compliance-heavy blocks, sequential warnings, and 17-block evaluation with zero errors. This is the "gold standard" case for process compliance and instructions completeness.