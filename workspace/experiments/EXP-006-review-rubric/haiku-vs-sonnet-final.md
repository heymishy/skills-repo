# Haiku vs Sonnet — Final Comparison Report

**Experiment:** EXP-006-review-rubric
**Models compared:** claude-haiku-4-5 vs claude-sonnet-4-6
**Date:** 2026-05-15
**Corpus:** 5 cases × 2 trials = 10 runs per model (20 total)
**Primary question:** Can Haiku replace Sonnet at the /review gate while maintaining FDR_HIGH = 1.00 and zero phantom HIGH findings?

---

## 1 — FDR_HIGH per case per trial

### FDR_HIGH = fraction of planted HIGH defects correctly identified at HIGH severity

| Case | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|------|----------|----------|-----------|-----------|
| T1 (AC quality HIGH — S2.2) | 1.0 ✓ | 1.0 ✓ | 1.0 ✓ | 1.0 ✓ |
| T2 (Traceability HIGH — S1.2+S2.2) | 1.0 ✓ | 1.0 ✓ | 1.0 ✓ | 1.0 ✓ |
| T3 (Scope HIGH — S5+S6) | 1.0 ✓ | 1.0 ✓ | 1.0 ✓ | 1.0 ✓ |
| T4 (No HIGH; MEDIUM+LOW only) | N/A | N/A | N/A | N/A |
| T5 (Clean baseline; zero findings) | N/A | N/A | N/A | N/A |

**FDR_HIGH aggregate (T1–T3 × 2 trials):**

| Model | Adversarial cases detected | FDR_HIGH (all trials) | Gate threshold met |
|-------|---------------------------|----------------------|-------------------|
| Haiku | 6/6 | **1.00** | ✓ |
| Sonnet | 6/6 | **1.00** | ✓ |

**Phantom HIGH analysis (T4 + T5):**

| | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|--|----------|----------|-----------|-----------|
| T4 — any HIGH raised | 0 | 0 | 0 | 0 |
| T5 — any HIGH raised | 0 | 0 | 0 | 0 |
| D2 categorical fail triggered | No | No | No | No |

**Result: Both models achieve FDR_HIGH = 1.00 with zero phantom HIGHs across all 20 runs.** No differentiation on the primary gate metric.

---

## 2 — Weighted scores compared

| Case | Haiku T1 | Haiku T2 | Sonnet T1 | Sonnet T2 |
|------|----------|----------|-----------|-----------|
| T1 | 0.96 | 0.96 | 0.96 | 0.96 |
| T2 | 0.96 | 0.96 | 0.96 | 0.96 |
| T3 | 0.96 | 0.96 | 0.96 | 0.96 |
| T4 | 1.00 | 1.00 | 1.00 | 1.00 |
| T5 | 1.00 | 1.00 | 1.00 | 1.00 |
| **Average** | **0.98** | **0.98** | **0.98** | **0.98** |

**Weighted score note:** T1/T2/T3 scores of 0.96 reflect the EVAL.md D3 N/A redistribution rounding artifact (documented in spec). Normalised scores are 1.00.

**Result: Identical weighted scores across both models, both trials.** Both models score 1.0 on every active dimension across every case in every trial. The score table distinguishes nothing.

---

## 3 — D5 specificity comparison: Does Sonnet provide more actionable detail?

Both models score **D5 = 1.0 across all 10 cases**. Within the rubric, they are equal. The meaningful distinction is in what D5=1.0 represents at each model's output level.

### Haiku D5 characteristics (from judge files)

- **T1**: Three ACs quoted verbatim. NFR gap named. SKILL.md Category C threshold cited ("violates the Category C HIGH threshold" added in Trial 2). Minimum required specificity satisfied.
- **T2**: Propagation table text quoted. S1.2 and S2.2 named individually. CDE expansion basis stated per story. AC3 `mode: active` quoted.
- **T3**: Out-of-scope text quoted verbatim for S5 and S6. S5 endpoint path named. S6 KiwiSaver fields named.
- **T4**: "None recorded" quoted. Discovery performance requirement referenced. S2.1 AC2 quoted. S2.2 blank effort named.
- **T5**: Zero findings. PASS verdict.

### Sonnet D5 characteristics (from judge files)

- **T1**: Same three ACs quoted verbatim. Same NFR text quoted. Additionally: each AC's specific missing element named ("quickly" → no threshold; "gracefully" → no load level; "promptly" → no alert name). Discovery C3 value (RTO ≤ 4 hours) named as the exact required NFR fix value.
- **T2**: Same S1.2 and S2.2 naming. Same AC3 `mode: active` quote. Additionally: Architecture Constraints list for S1.2 quoted in full (C1 and C3 text verbatim). Per-story causal chain articulated (S1.2 as infrastructure connection creating CDE extension; S2.2 as activation event making standby the live processor — *different* causal chains for different stories). ADR-019 referenced. Correct exclusion reasoning stated for three non-defective stories.
- **T3**: Same discovery out-of-scope quotes. Same endpoint and field names. Additionally: benefit-claim override argument explicitly pre-empted and rejected. Constraint propagation table OAuth path distinction addressed and explained as insufficient for scope approval.
- **T4**: Same "None recorded" quote. Same discovery requirement text. Additionally: downstream impact of absent NFR articulated ("test plan cannot include a timing assertion"). Exact fix NFR text stated ("Report generation must complete within 10 seconds for datasets up to 50,000 rows at p95"). Comparator effort estimates listed for all other stories.
- **T5**: Zero findings. PASS verdict. Additionally: per-criterion positive verification narrative with specific AC, field, and propagation citations — the operator can verify the PASS reasoning without re-reading the story set.

### D5 comparison summary

| Dimension | Haiku | Sonnet |
|-----------|-------|--------|
| Rubric score | D5 = 1.0 (all cases) | D5 = 1.0 (all cases) |
| Finding level | Quoted element + defect class | Quoted element + defect class + causal chain |
| Fix guidance | Implied from finding | Explicit fix text stated |
| Non-issue justification | Not provided | Explicitly stated for adjacent elements |
| Downstream impact | Not provided | Articulated (e.g., test plan consequences) |
| Counter-argument handling | Not provided | Pre-empted and rejected (T3 benefit-claim) |

**Conclusion**: Both models satisfy the D5=1.0 requirement. Sonnet consistently provides an additional layer: causal chain reasoning, downstream impact, explicit fix text, and proactive counter-argument handling. This difference is **not captured by the current rubric** — D5=1.0 is the ceiling for both models.

For a team using /review output as the direct input to story revision, Sonnet outputs reduce the cognitive work required to action the finding: the author receives not just "what is wrong and where" but "why it matters and exactly what to write to fix it."

---

## 4 — Cross-trial consistency comparison

| Model | Trial consistency | Finding text delta | Severity delta |
|-------|-------------------|-------------------|----------------|
| Haiku | Perfect | Word-for-word identical (T2, T3, T4, T5) | Zero |
| Sonnet | Perfect | Word-for-word identical (T2, T3, T4, T5) | Zero |

Both models are fully deterministic at the operationally critical detection tasks. Neither model shows trial-to-trial variation in FDR, severity assignment, or verdict across any of the 20 runs.

---

## 5 — EVAL.md calibration notes

Both scorecards surface the same pre-existing EVAL.md miscalibration:

1. **D1 T2 anchor**: Describes "broken discovery slug" and "missing benefit metric reference" — these do not match the actual T2 corpus defect (C2 propagation table contradiction). The anchor is miscalibrated and should be corrected.
2. **D1 T3 anchor**: References "CSV export AC text" — this does not match the actual T3 corpus (Card Experience API). The anchor is miscalibrated.
3. **D3 anchor (now corrected)**: Was updated before Sonnet runs to describe missing performance NFR Category D (not "should" language Category C). Both Haiku and Sonnet D3 scores were applied against the corrected corpus-accurate criterion.

These miscalibrations do not affect the trial scores — the rubric scoring criteria (1.0=finding-present+defect-named+category-correct) were applied against the actual corpus defects rather than the miscalibrated anchor examples. They should be corrected in EVAL.md before future experiments.

---

## 6 — Routing recommendation

### Gate decision

**Both models: APPROVED for /review gate production use.**

- FDR_HIGH = 1.00 across all 20 runs (10 per model). EVAL.md production gate threshold met.
- Zero phantom HIGH findings across all 20 runs. Categorical fail condition not triggered.
- Zero HIGH escalation on T4 (MEDIUM-only case) across all 20 runs.
- All weighted scores ≥ 0.80.
- Full cross-trial consistency on both models.

### Model selection guidance

The quantitative scores are identical. Selection should be based on operational context:

**Use Haiku when:**
- Running high-volume automated pre-screening across many stories where token cost is a constraint
- The /review gate is a pass/fail filter and the finding text is consumed by another system (not directly by a developer)
- The operator validates findings before handing to a developer
- Stories are straightforward with no complex cross-artefact scope deference patterns (T3-type cases are rare)

**Use Sonnet when:**
- /review output is delivered directly to the story author as the actionable revision instruction
- Stories involve complex adversarial patterns (false propagation tables, multiple-story scope violations) where the extra causal chain reasoning reduces back-and-forth
- Teams value proactive counter-argument handling (T3 benefit-claim rejection, T2 exclusion reasoning) to reduce disputes about findings
- Finding output quality is used as a quality signal on the pipeline itself (e.g., in /improve or /trace analyses)

### Routing policy

```
if context == 'high-volume-pre-screen' or context == 'automated-gate-only':
    model = 'haiku'
elif context == 'direct-author-delivery' or complexity in ['cross-artefact', 'multi-story']:
    model = 'sonnet'
else:
    model = 'haiku'  # default — both qualify; haiku is cheaper
```

### Cost efficiency note

Haiku delivers identical FDR_HIGH performance at lower token cost. For teams running /review across every story in a multi-week feature (e.g. 10–20 stories), Haiku is the cost-optimal choice without sacrificing gate integrity. Sonnet's additional contextual reasoning is valuable but not necessary for the core gate function.

---

## 7 — Experiment summary

| Signal | Value |
|--------|-------|
| Primary question answered | Yes — Haiku matches Sonnet at FDR_HIGH = 1.00 |
| Both models gate-approved | Yes |
| Any D5 meaningful difference | Yes — Sonnet richer, but both = 1.0 on rubric |
| Any determinism difference | No — both word-for-word identical across trials |
| EVAL.md corrections required | D1 T2 anchor, D1 T3 anchor (D3 already corrected) |
| Recommended default | Haiku (equal gate performance, lower cost) |
| Recommended override | Sonnet (complex cases, direct-author delivery) |
| Total runs evaluated | 20 (10 per model) |
| Total categorical fails | 0 |
| Total missed HIGH findings | 0 |
| Total phantom HIGH findings | 0 |
