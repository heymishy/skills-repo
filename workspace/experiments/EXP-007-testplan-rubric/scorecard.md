# Scorecard — EXP-007-testplan-rubric

**Experiment:** Haiku vs Sonnet on /test-plan (gate skill rubric)
**Completed:** 2026-05-16
**Judge model:** claude-sonnet-4-6
**Corpus:** 5 cases × 2 trials = 10 runs per model (20 total)

---

## Results

| Model | Trials | TCF (test coverage fidelity) | Weighted avg | Categorical fails | D3 gap |
|-------|--------|------------------------------|--------------|-------------------|--------|
| claude-haiku-4-5 | 10 | **1.00** | **0.988** | 0 | T5 D3=0.70 |
| claude-sonnet-4-6 | 10 | **1.00** | **1.000** | 0 | — |

### Per-case weighted scores

| Case | Story type | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|------|-----------|----------|----------|-----------|-----------|
| T1 — PAY-3.1 | Payments | 1.00 | 1.00 | 1.00 | 1.00 |
| T2 — SEC-1.2 | Security / NFR | 1.00 | 1.00 | 1.00 | 1.00 |
| T3 — BL-2.4 | UI / layout | 1.00 | 1.00 | 1.00 | 1.00 |
| T4 — FRAUD-1.1 | Fraud detection | 1.00 | 1.00 | 1.00 | 1.00 |
| T5 — CHK-2.1 | PCI DSS / compliance | **0.94** | **0.94** | 1.00 | 1.00 |

---

## Hypothesis verdict

**H1 — Haiku TCF = 1.00 with zero categorical fails: PASS (with known D3 gap on PCI)**

Both models achieve TCF = 1.00 across all 10 runs. The only measurable difference is D3 (hallucination suppression) on T5: Haiku consistently mixes an AC-level gateway assertion into the NFR-SEC-1 test body (scope-mixing pattern, stable across both trials). This earns D3=0.70, not a categorical fail, but a concrete quality gap vs Sonnet D3=1.00.

---

## Finding

**Haiku T5 D3 gap:** NFR-SEC-1 test body contains `expect(mockGateway.processPayment).toHaveBeenCalledWith(...)` — an AC1 assertion inside an NFR-only test. Not a dangerous hallucination; no PCI-prohibited assertion. Addressable by adding explicit NFR scope rule to SKILL.md.

**Status:** Fix validated in EXP-007R — adding the NFR scope rule to SKILL.md resolves Haiku T5 D3 to 1.00.

---

## Routing recommendation

**Route `/test-plan` → `claude-haiku-4-5`** conditional on SKILL.md NFR scope rule fix (confirmed in EXP-007R).  
**Sonnet not required** for any /test-plan story type including PCI/compliance stories after SKILL.md update.

**Full comparison:** `haiku-vs-sonnet-final.md`
