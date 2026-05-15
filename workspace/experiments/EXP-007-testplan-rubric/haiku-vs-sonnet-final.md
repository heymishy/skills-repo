# EXP-007 Haiku vs Sonnet — Final Comparison Report

**Experiment:** EXP-007-testplan-rubric
**Primary question:** Can claude-haiku-4-5 replace claude-sonnet-4-6 at the /test-plan stage with TCF = 1.00 and zero categorical fails?
**Date:** 2026-05-16
**Judge model:** claude-sonnet-4-6 (calibration model)

---

## 1. Aggregate results

### Haiku (claude-haiku-4-5)

| Case | Trial 1 Weighted | Trial 2 Weighted | TCF T1 | TCF T2 | Compliant | Categorical Fail |
|------|-----------------|-----------------|--------|--------|-----------|-----------------|
| T1 — PAY-3.1 | 1.00 | 1.00 | 1.00 | 1.00 | ✅ both | None |
| T2 — SEC-1.2 | 1.00 | 1.00 | 1.00 | 1.00 | ✅ both | None |
| T3 — BL-2.4 | 1.00 | 1.00 | 1.00 | 1.00 | ✅ both | None |
| T4 — FRAUD-1.1 | 1.00 | 1.00 | 1.00 | 1.00 | ✅ both | None |
| T5 — CHK-2.1 | **0.94** | **0.94** | 1.00 | 1.00 | ✅ both | None |
| **Mean** | **0.988** | **0.988** | **1.00** | **1.00** | — | — |

### Sonnet (claude-sonnet-4-6)

| Case | Trial 1 Weighted | Trial 2 Weighted | TCF T1 | TCF T2 | Compliant | Categorical Fail |
|------|-----------------|-----------------|--------|--------|-----------|-----------------|
| T1 — PAY-3.1 | 1.00 | 1.00 | 1.00 | 1.00 | ✅ both | None |
| T2 — SEC-1.2 | 1.00 | 1.00 | 1.00 | 1.00 | ✅ both | None |
| T3 — BL-2.4 | 1.00 | 1.00 | 1.00 | 1.00 | ✅ both | None |
| T4 — FRAUD-1.1 | 1.00 | 1.00 | 1.00 | 1.00 | ✅ both | None |
| T5 — CHK-2.1 | **1.00** | **1.00** | 1.00 | 1.00 | ✅ both | None |
| **Mean** | **1.00** | **1.00** | **1.00** | **1.00** | — | — |

---

## 2. Dimension-level comparison

### D1 — AC Coverage (weight 0.35)

| Case | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 | Δ (Sonnet − Haiku) |
|------|----------|----------|-----------|-----------|---------------------|
| T1 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T2 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T3 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T4 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T5 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |

**Both models score 1.0 on D1 across all cases and trials. No gap.**

### D2 — Test Type Classification (weight 0.25)

| Case | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 | Δ |
|------|----------|----------|-----------|-----------|---|
| T1 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T2 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T3 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T4 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T5 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |

**Both models score 1.0 on D2 across all cases and trials. Critically, both models pass the T3 categorical fail trap (no jsdom/fireEvent for drag-drop ACs) in both trials. No gap.**

Haiku approach to T3: rationale note rejecting fireEvent + Playwright used.
Sonnet approach to T3: dedicated "⚠️ Browser-layout detection" section explicitly rejecting jsdom — arguably more proactive framing.

### D3 — Hallucination Suppression (weight 0.20)

| Case | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 | Δ (Sonnet − Haiku) |
|------|----------|----------|-----------|-----------|---------------------|
| T1 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T2 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T3 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T4 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T5 | **0.7** | **0.7** | **1.0** | **1.0** | **+0.30** |

**This is the only dimension where the models differ. Sonnet scores D3=1.0 on T5 in both trials. Haiku scores D3=0.7 on T5 in both trials.**

Root cause: Haiku consistently adds `expect(mockGateway.processPayment).toHaveBeenCalledWith(...)` inside the NFR-SEC-1 test body — an AC1 assertion (gateway received card data) mixed into a test whose purpose is to verify negative constraints (card data not logged/persisted). This is marginal overreach: the assertion is architecturally grounded in AC1, but it is not the stated observable outcome of NFR-SEC-1.

Sonnet's NFR-SEC-1 test contains only negative log assertions (`capturedLogs not.toContain(testPan/testCvv/testExpiry)`). No positive gateway-call assertion. Scope-mixing pattern absent in both Sonnet trials.

**This is a stable, reproducible model-level difference — not trial variance.** Haiku shows the pattern consistently (both trials), and Sonnet avoids it consistently (both trials).

### D4 — NFR Coverage (weight 0.10)

| Case | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 | Δ |
|------|----------|----------|-----------|-----------|---|
| T1 | N/A | N/A | N/A | N/A | 0.0 |
| T2 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T3 | N/A | N/A | N/A | N/A | 0.0 |
| T4 | N/A | N/A | N/A | N/A | 0.0 |
| T5 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |

**Both models score 1.0 on all applicable NFRs. Both produce correctly calibrated k6 scripts for T2 (p99 < 200ms, 10,000 sessions). No gap.**

### D5 — Dual Output (weight 0.10)

| Case | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 | Δ |
|------|----------|----------|-----------|-----------|---|
| T1 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T2 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T3 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T4 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |
| T5 | 1.0 | 1.0 | 1.0 | 1.0 | 0.0 |

**Both models produce both outputs in all cases. No gap.**

---

## 3. Critical trap summary

| Trap | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|------|----------|----------|-----------|-----------|
| T3 — jsdom/fireEvent for layout AC | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| T3 — uncaveated dragStart assertion | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| T4 — fraudDetectionClient assertion | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| T5 — AES-256/HSM/PCI scope assertion | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |
| T5 — NFR scope-mixing (AC1 in NFR) | ⚠️ Pattern present (D3=0.7) | ⚠️ Pattern present (D3=0.7) | ✅ Clean | ✅ Clean |
| T2 — threshold-calibrated k6 | ✅ PASS | ✅ PASS | ✅ PASS | ✅ PASS |

**No categorical fail triggered by either model in any trial.** The T5 scope-mixing is a marginal quality difference — D3=0.7 is above the categorical fail threshold. However, it is a consistent pattern with a concrete improvement recommendation (see Section 6).

---

## 4. TCF per case per trial

| Case | Haiku TCF T1 | Haiku TCF T2 | Sonnet TCF T1 | Sonnet TCF T2 |
|------|-------------|-------------|--------------|--------------|
| T1 | 1.00 | 1.00 | 1.00 | 1.00 |
| T2 | 1.00 | 1.00 | 1.00 | 1.00 |
| T3 | 1.00 | 1.00 | 1.00 | 1.00 |
| T4 | 1.00 | 1.00 | 1.00 | 1.00 |
| T5 | 1.00 | 1.00 | 1.00 | 1.00 |
| **Overall TCF** | **1.00** | **1.00** | **1.00** | **1.00** |

TCF is 1.00 for both models across all cases and trials. Full AC coverage is achieved by both models without exception.

---

## 5. Summary comparison

| Metric | Haiku | Sonnet | Gap |
|--------|-------|--------|-----|
| Overall TCF (both trials) | 1.00 | 1.00 | None |
| Categorical fails | 0 | 0 | None |
| Cases compliant (both trials) | 10/10 | 10/10 | None |
| Mean weighted score (Trial 1) | 0.988 | 1.000 | +0.012 Sonnet |
| Mean weighted score (Trial 2) | 0.988 | 1.000 | +0.012 Sonnet |
| Min weighted score | 0.94 (T5) | 1.00 | +0.06 Sonnet |
| D3 score on T5 (both trials) | 0.70 | 1.00 | +0.30 Sonnet |
| Trial stability (Δ T1→T2) | 0.00 | 0.00 | Tied |
| D1 score (all cases, all trials) | 1.00 | 1.00 | None |
| D2 score (all cases, all trials) | 1.00 | 1.00 | None |
| D4 score (T2, T5) | 1.00 | 1.00 | None |
| D5 score (all cases) | 1.00 | 1.00 | None |

---

## 6. Answer to the primary experiment question

**Can Haiku replace Sonnet at the /test-plan stage with TCF = 1.00 and zero categorical fails?**

**Answer: YES, with a known and addressable quality gap on PCI-scoped hallucination suppression.**

Both models satisfy the minimum bar: TCF = 1.00, zero categorical fails, weighted score ≥ 0.80 on all 10 runs, compliant = true across all cases.

The only measurable gap is on D3 for T5 (CHK-2.1, PCI DSS context). Haiku consistently adds a positive gateway-call assertion inside the NFR-SEC-1 test body — scope-mixing that earns D3=0.7 vs Sonnet's D3=1.0. This is a marginal overreach, not a dangerous hallucination; no PCI-prohibited assertion appears in either model.

The T5 gap is addressable at the prompt level: adding an explicit /test-plan skill instruction such as "An NFR test must assert only the stated NFR observable outcome. Do not add AC-level assertions (e.g. 'gateway was called') inside an NFR test" would likely resolve Haiku's scope-mixing pattern without requiring Sonnet.

---

## 7. Routing recommendation

### For general stories (T1, T2, T3, T4 profile)
**Route to Haiku.** Performance is identical to Sonnet on all dimensions (D1–D5, TCF, categorical fail avoidance). No quality reason to use Sonnet for stories without PCI/compliance-classified NFRs.

### For PCI DSS or compliance-classified stories (T5 profile)
**Prefer Sonnet OR update /test-plan prompt before routing to Haiku.** Sonnet produces a cleaner NFR-SEC-1 test (D3=1.0 vs 0.7) with no scope-mixing. If the D3=0.7 gap is considered acceptable and the gap is addressed in the /test-plan prompt, Haiku can handle PCI stories. Until the prompt is updated, prefer Sonnet for stories with compliance-classified NFRs.

### Cost-reduction opportunity
Routing all non-PCI stories to Haiku reduces token cost while maintaining identical output quality on TCF, AC coverage, test type classification, NFR calibration, and dual output. The only capability traded off is Sonnet's marginally cleaner NFR test scoping on PCI stories — a gap that is fixable in the prompt.

---

## 8. Improvement recommendation for /test-plan skill

Add the following guidance to the /test-plan SKILL.md NFR test section:

> **NFR test scope rule:** An NFR test must assert only the stated NFR observable outcome. Do not add AC-level assertions (e.g. confirming the gateway was called) inside an NFR test body. NFR tests are negative-constraint or threshold tests. Positive functional assertions belong in AC tests. Mixing an AC assertion into an NFR test conflates two distinct verification goals and produces a test with ambiguous failure semantics.

This addresses the confirmed Haiku T5 D3 pattern across both trials and would bring Haiku to D3=1.0 parity with Sonnet on PCI-scoped stories.

---

## 9. Files produced by this experiment

### Haiku run files and judgements
```
runs/haiku/
  T1-run-1.md  T1-run-1-judge.md
  T1-run-2.md  T1-run-2-judge.md
  T2-run-1.md  T2-run-1-judge.md
  T2-run-2.md  T2-run-2-judge.md
  T3-run-1.md  T3-run-1-judge.md
  T3-run-2.md  T3-run-2-judge.md
  T4-run-1.md  T4-run-1-judge.md
  T4-run-2.md  T4-run-2-judge.md
  T5-run-1.md  T5-run-1-judge.md
  T5-run-2.md  T5-run-2-judge.md
  haiku-trial-1-scorecard.md
  haiku-trial-2-scorecard.md
```

### Sonnet run files and judgements
```
runs/sonnet/
  T1-run-1.md  T1-run-1-judge.md
  T1-run-2.md  T1-run-2-judge.md
  T2-run-1.md  T2-run-1-judge.md
  T2-run-2.md  T2-run-2-judge.md
  T3-run-1.md  T3-run-1-judge.md
  T3-run-2.md  T3-run-2-judge.md
  T4-run-1.md  T4-run-1-judge.md
  T4-run-2.md  T4-run-2-judge.md
  T5-run-1.md  T5-run-1-judge.md
  T5-run-2.md  T5-run-2-judge.md
  sonnet-trial-1-scorecard.md
  sonnet-trial-2-scorecard.md
```

### Final comparison
```
haiku-vs-sonnet-final.md  (this file)
```
