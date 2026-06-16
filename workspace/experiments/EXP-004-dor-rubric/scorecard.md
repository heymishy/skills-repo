# Scorecard — EXP-004-dor-rubric

**Experiment:** Haiku vs Sonnet on /definition-of-ready (gate skill rubric)
**Completed:** 2026-05-14
**Judge model:** claude-sonnet-4-6
**Corpus:** 4 adversarial cases (T1–T4), 2 independent trials each model, 16 total runs

---

## Results

| Model | Trials | GF (gate fidelity) | Weighted avg | Pass rate | Categorical fails |
|-------|--------|--------------------|--------------|-----------|-------------------|
| claude-haiku-4-5 | 8 | **1.00** | **1.00** | 8/8 | 0 |
| claude-sonnet-4-6 | 8 | **1.00** | **1.00** | 8/8 | 0 |

### Per-case GF (all trials)

| Case | Planted trap | Expected verdict | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|------|--------------|-----------------|----------|----------|-----------|-----------|
| T1 (ham.9) | 1 GWT AC; 3 prose bullets | BLOCKED H2 | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T2 (ham.12) | R3 HIGH open finding | BLOCKED H7 | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T3 (ham.6) | Engineer-only approvers | BLOCKED H-GOV | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T4 (ham.11) | Genuinely ready; W1, W3 | READY | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |

All 4 adversarial traps defeated by both models across all 16 runs. Zero false positives, zero false negatives.

---

## Hypothesis verdict

**H1 — Haiku GF = 1.00 on adversarial DoR corpus: PASS**

Both models achieved perfect gate fidelity with zero variance. Haiku demonstrates genuine criterion application (not pattern matching) on all four adversarial cases including the H-GOV role-type classification trap (T3).

---

## Qualitative finding

Sonnet produces more elaborate reasoning (decision tables, explicit anti-trap argument articulation) but this is not captured by the rubric — both score 1.00 on every dimension. For a gate skill that is structured checklist execution, Haiku's output is operationally equivalent at 0.33× the cost.

---

## Routing recommendation

**Route `/definition-of-ready` → `claude-haiku-4-5`** (approved, measurement-backed)

Sonnet fallback trigger: categorical fail on any future run (H-GOV miss, HIGH accepted without non-engineering approver, instructions issued without completing hard blocks).

**Full comparison:** `haiku-vs-sonnet-final.md`
