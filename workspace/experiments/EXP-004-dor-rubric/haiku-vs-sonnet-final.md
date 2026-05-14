# EXP-004 Final Comparison: claude-haiku-4-5 vs claude-sonnet-4-6

**Experiment:** EXP-004-dor-rubric
**Skill:** /definition-of-ready
**Date:** 2026-05-14
**Corpus:** 4 adversarial cases (T1–T4), 2 independent trials each model, 16 total runs
**Judge model:** claude-sonnet-4-6
**Rubric:** `.github/skills/definition-of-ready/EVAL.md`

---

## Gate fidelity — per case, per trial, both models

| Case | Hidden gap | Expected verdict | Haiku T1 GF | Haiku T2 GF | Sonnet T1 GF | Sonnet T2 GF |
|------|-----------|-----------------|-------------|-------------|--------------|--------------|
| T1 (ham.9) | 1 GWT AC; 3 prose bullets | BLOCKED H2 | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T2 (ham.12) | R3 HIGH Open finding | BLOCKED H7 | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T3 (ham.6) | Engineer-only approvers | BLOCKED H-GOV | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T4 (ham.11) | Genuinely ready; W1, W3 | READY | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |

---

## Overall GF summary

| Model | Trial 1 GF | Trial 2 GF | Combined GF (8 runs) | Variance | Categorical fails |
|-------|-----------|-----------|----------------------|----------|-------------------|
| claude-haiku-4-5 | **1.00** | **1.00** | **1.00** | 0.00 | 0 |
| claude-sonnet-4-6 | **1.00** | **1.00** | **1.00** | 0.00 | 0 |

Both models achieved perfect gate fidelity across all 16 runs. Zero variance, zero categorical fails, zero false positives, zero false negatives.

---

## Weighted rubric score summary

| Model | Trial | T1 | T2 | T3 | T4 | Mean |
|-------|-------|----|----|----|----|------|
| Haiku | 1 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| Haiku | 2 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| Sonnet | 1 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |
| Sonnet | 2 | 1.00 | 1.00 | 1.00 | 1.00 | 1.00 |

Pass threshold per EVAL.md: ≥ 0.80. All 16 runs exceed threshold.

---

## Adversarial trap defeat comparison

| Trap | Trap type | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|------|-----------|---------|---------|---------|---------|
| T1: H2 — prose bullets look like ACs | Format check | ✅ | ✅ | ✅ | ✅ |
| T2: H7 — advisory-sounding HIGH title | Severity misread | ✅ | ✅ | ✅ | ✅ |
| T3: H-GOV — populated section, wrong roles | Presence vs qualification | ✅ | ✅ | ✅ | ✅ |
| T4: G2 — batch or fabricate warnings | Warning discipline | ✅ | ✅ | ✅ | ✅ |

All 4 adversarial traps defeated by both models in both trials. 16/16 (100%).

---

## Qualitative differences

| Dimension | Haiku observations | Sonnet observations |
|-----------|-------------------|---------------------|
| **Process structure** | Explicit numbered step-by-step with section headers for each block | Full 17-block checklist with decision tables and explicit sub-clause citations |
| **Trap reasoning depth** | Named the trap and stated the classification ("Lead Engineer = engineering role") | Articulated the anti-trap logic explicitly ("advisory tone does not change severity classification") |
| **T4 instructions completeness** | All required sections present; active W3 /decisions lookup performed | Slightly more elaborate in T1; T2 was compact but complete; all sections present both runs |
| **H-GOV bidirectional** | Correctly FAIL (T3) and PASS (T4) — "Platform" in title did not trigger false FAIL | Same; explicit positive reasoning for PASS direction in both trials |
| **Inter-trial consistency** | Identical verdicts both trials; 0.00 variance on all dimensions | Identical verdicts both trials; 0.00 variance on all dimensions |
| **Format variation** | Both trials used detailed narrative with explicit classification steps | Trial 2 enhanced with decision tables (T1) and anti-trap naming (T2); slight format improvement |

No qualitative differences that affect gate correctness. Both models demonstrate genuine criterion application (not pattern matching) on all four adversarial cases.

---

## Cost comparison

| Model | Relative cost (per manifest) | GF | Conclusion |
|-------|-----------------------------|----|------------|
| claude-haiku-4-5 | **0.33×** | 1.00 | Equivalent gate fidelity at one-third the cost |
| claude-sonnet-4-6 | 1.00× (baseline) | 1.00 | Equivalent gate fidelity at 3× the cost |

*Cost multiplier from EXP-004 manifest: Haiku estimated at 0.33× Sonnet for equivalent token volume.*

---

## Routing recommendation

**Recommendation: Route `/definition-of-ready` to `claude-haiku-4-5` as the default model.**

**Evidence basis:** EXP-004-dor-rubric (this experiment)
- GF = 1.00 on both trials (8 runs) vs production threshold of 1.00 ✅
- Zero categorical fails across 16 total runs ✅
- Zero variance between trials — consistent, repeatable execution ✅
- All 4 adversarial traps defeated across all 16 runs ✅
- Weighted rubric score 1.00 (above 0.80 pass threshold) on all 16 runs ✅

**Cost rationale:** At 0.33× the cost of Sonnet with statistically indistinguishable gate fidelity (1.00 vs 1.00, zero variance), Haiku is the cost-optimal choice for the /definition-of-ready gate skill. The gate skill is a structured checklist execution task — not open-ended reasoning — and Haiku demonstrates it can execute the 17-block checklist with role-type classification, severity-field reading, and one-at-a-time warning sequencing at full fidelity.

**Fallback rule:** If any future run produces a categorical fail (H-GOV miss on a new corpus case, HIGH oversight signed off without a named non-engineering approver, or instructions produced without completing hard blocks), escalate to Sonnet immediately and re-evaluate at next corpus expansion.

**Haiku approval status: APPROVED for production use on `/definition-of-ready`**
Evidence: EXP-004-dor-rubric, 2 trials × 4 cases × 2 models, all GF 1.00.

---

## Recommended `routing-policy-framework.md` update

Add the following row to the `/definition-of-ready` section:

| Skill | Model | Status | Evidence |
|-------|-------|--------|----------|
| /definition-of-ready | claude-haiku-4-5 | **Approved — default** | EXP-004 GF 1.00, trials 1+2, 0 categorical fails |
| /definition-of-ready | claude-sonnet-4-6 | Fallback (categorical fail trigger only) | EXP-004 GF 1.00, trials 1+2 |