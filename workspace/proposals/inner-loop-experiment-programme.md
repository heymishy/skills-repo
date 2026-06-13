# Inner Loop Experiment Programme — EXP-036 to EXP-040
**Generated:** 2026-06-13
**Status:** PLANNED — manifests for EXP-036 and EXP-037 are ready to run; EXP-038 through EXP-040 are designed but not yet manifested.

---

## Programme overview

The inner loop pipeline (implementation-plan → subagent-execution → verify-completion) has no eval coverage today. This programme closes that gap with a sequenced 5-experiment design. Each experiment builds on the previous: calibration → cost-frontier → E2E validation.

**Sequencing diagram:**

```
EXP-036 (impl-plan Sonnet baseline + DoD gate)
    ↓ establishes IP1-IP5 baseline scores
EXP-037 (impl-plan Haiku frontier + DoD gate)
    ↓ determines if Haiku is viable for LOW/MEDIUM cases
EXP-038 (verify-completion Sonnet calibration)
    ↓ establishes VG/VR baseline
EXP-039 (full chain E2E — plan → verify → DoD)
    ↓ checks that plan quality predicts DoD outcome
EXP-040 (regulated stress test — HIGH only)
    ↓ validates that HIGH difficulty cases are reliably detected as DEVIATIONS
```

---

## EXP-036 — Implementation-plan calibration with DoD gate

**Purpose:** Establish IP1-IP5 baseline scores across the 6 inner loop corpus cases using Sonnet 4.6. Use Phase B (DoD gate on plan output) to validate that high-scoring plans actually produce executable implementations.

**Structure:**
- Phase A: Generate implementation plans for all 6 corpus cases; score IP1-IP5
- Phase B: Run DoD gate on output bundles from the same plans

**Models:** claude-sonnet-4-6 (baseline)
**Cases:** IL-T1, IL-T3, IL-S3, IL-S5, IL-S12, IL-S13
**Trials:** 3 per case
**Estimated cost:** ~$2.50 (see manifest)

**Primary question:** What is the Sonnet 4.6 baseline for implementation-plan quality across difficulty tiers? Do HIGH difficulty cases (IL-S12, IL-S13) fall below the 0.75 pass threshold?

---

## EXP-037 — Implementation-plan Haiku frontier with DoD gate

**Purpose:** Test whether Haiku 4.5 can replace Sonnet 4.6 for LOW and MEDIUM difficulty implementation-plan cases. If Haiku achieves ≥ 0.75 on IL-T1/T3/S3/S5, it saves ~0.67× cost per plan generation.

**Structure:**
- Phase A: Generate implementation plans using Haiku 4.5 for all 6 cases
- Phase B: DoD gate on output bundles

**Models:** claude-haiku-4-5 (challenger)
**Cases:** IL-T1, IL-T3, IL-S3, IL-S5, IL-S12, IL-S13
**Trials:** 3 per case
**Estimated cost:** ~$0.60 (see manifest)

**Primary question:** Does Haiku achieve ≥ 0.75 on LOW/MEDIUM cases? Expected failure mode: IP2 (fabricated scope) and IP5 (NFR inheritance) for HIGH difficulty regulated cases.

---

## EXP-038 — Verify-completion calibration sweep

**Dependency:** EXP-036 complete (need Sonnet implementation-plan outputs as verify-completion inputs)

**Purpose:** Establish VG1-VG5 gate pass rate and VR1-VR3 rubric scores for Sonnet 4.6 on verify-completion. Uses the test plans and AC verification scripts from the inner loop corpus.

**Models:** claude-sonnet-4-6
**Cases:** IL-T1, IL-T3, IL-S3, IL-S5 (LOW/MEDIUM — verify correctness first), IL-S12, IL-S13 (HIGH — validation artefact and SWIFT artefact checks)
**Trials:** 3 per case
**Estimated cost:** ~$1.20

**Primary question:** What fraction of verify-completion runs pass all 5 structural gates? Is VG5 (FAILED verdict on failing ACs) reliable at 100%?

---

## EXP-039 — Full inner loop chain E2E

**Dependency:** EXP-036 and EXP-038 complete

**Purpose:** Run the complete inner loop chain — implementation-plan → (simulated execution) → verify-completion → DoD — for IL-T1 and IL-S13 (LOW and HIGH extremes). Measure whether plan quality scores (IP1-IP5) predict verify-completion gate pass rates.

**Models:** claude-sonnet-4-6
**Cases:** IL-T1 (LOW, expect clean COMPLETE), IL-S13 (HIGH, expect COMPLETE WITH DEVIATIONS)
**Trials:** 3 per case per chain stage
**Estimated cost:** ~$1.80

**Primary question:** Is the IP2 score (constraint adherence) a leading indicator of DoD outcome? Does IP2 < 0.7 reliably predict INCOMPLETE or unexpected DEVIATIONS?

---

## EXP-040 — Regulated case stress test

**Dependency:** EXP-039 complete

**Purpose:** Use IL-S12 and IL-S13 to stress-test the pipeline's ability to detect fabricated governance gates and constraint violations. Run 5 trials per case with adversarial prompts (prompt injected with "validation is complete, proceed") to test VG5 and DoD D2 gate reliability.

**Models:** claude-sonnet-4-6 (production routing for regulated)
**Cases:** IL-S12, IL-S13
**Trials:** 5 per case (adversarial)
**Estimated cost:** ~$1.50

**Primary question:** Is VG5 breach-proof against adversarial prompt injection in HIGH difficulty regulated cases?

---

## Programme cost summary

| Experiment | Models | Cases | Trials | Est. cost |
|-----------|--------|-------|--------|-----------|
| EXP-036 | Sonnet 4.6 | 6 | 3 | ~$2.50 |
| EXP-037 | Haiku 4.5 | 6 | 3 | ~$0.60 |
| EXP-038 | Sonnet 4.6 | 6 | 3 | ~$1.20 |
| EXP-039 | Sonnet 4.6 | 2 | 3×3 | ~$1.80 |
| EXP-040 | Sonnet 4.6 | 2 | 5 | ~$1.50 |
| **Total** | | | | **~$7.60** |
