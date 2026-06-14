# Scorecard — EXP-006-review-rubric

**Experiment:** Haiku vs Sonnet on /review (gate skill rubric)
**Completed:** 2026-05-15
**Judge model:** claude-sonnet-4-6
**Corpus:** 5 cases × 2 trials = 10 runs per model (20 total)

---

## Results

| Model | Trials | FDR_HIGH | Weighted avg | Phantom HIGHs | Categorical fails |
|-------|--------|----------|--------------|---------------|-------------------|
| claude-haiku-4-5 | 10 | **1.00** | **0.98** | 0 | 0 |
| claude-sonnet-4-6 | 10 | **1.00** | **0.98** | 0 | 0 |

### Per-case FDR_HIGH

| Case | Planted defect | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|------|---------------|----------|----------|-----------|-----------|
| T1 | AC quality HIGH (S2.2) | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T2 | Traceability HIGH (S1.2+S2.2) | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T3 | Scope HIGH (S5+S6) | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ | 1.0 ✅ |
| T4 | MEDIUM+LOW only (no HIGH) | N/A — no phantom ✅ | N/A ✅ | N/A ✅ | N/A ✅ |
| T5 | Clean baseline (zero findings) | N/A — PASS ✅ | N/A ✅ | N/A ✅ | N/A ✅ |

Weighted scores of 0.96 on T1–T3 reflect a D3 N/A redistribution rounding artifact in EVAL.md (normalised score = 1.00). Both models are fully deterministic: word-for-word identical output across trials.

---

## Hypothesis verdict

**H1 — Haiku FDR_HIGH = 1.00 on all adversarial review cases: PASS**

Both models detect all planted HIGH findings, raise zero phantom HIGHs, and produce zero categorical fails across all 20 runs.

---

## Qualitative finding

Sonnet provides richer D5 content (causal chain reasoning, explicit fix text, downstream impact, counter-argument handling) but scores D5=1.0 — same as Haiku — because the rubric ceiling is met by both. The difference matters when /review output goes directly to a story author for revision; for automated gate-only use, Haiku is equivalent.

Two EVAL.md anchor miscalibrations identified (D1 T2, D1 T3 anchors reference wrong corpus) — do not affect scores but should be corrected before future experiments.

---

## Routing recommendation

**Route `/review` → `claude-haiku-4-5`** (approved, measurement-backed, default)  
**Override to Sonnet** for: direct-author delivery, complex cross-artefact scope patterns, multi-story reviews where causal chain reasoning reduces back-and-forth.

**Full comparison:** `haiku-vs-sonnet-final.md`
