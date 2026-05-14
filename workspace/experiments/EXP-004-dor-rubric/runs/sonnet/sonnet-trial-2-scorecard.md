# EXP-004 Scorecard: claude-sonnet-4-6 — Trial 2

**Experiment:** EXP-004-dor-rubric
**Model:** claude-sonnet-4-6
**Trial:** 2
**Date:** 2026-05-14
**Rubric:** `.github/skills/definition-of-ready/EVAL.md`
**Judge model:** claude-sonnet-4-6

---

## Gate fidelity summary

| Case | Expected verdict | Actual verdict | Match |
|------|-----------------|----------------|-------|
| T1 (ham.9 — missing ACs) | BLOCKED H2 | BLOCKED H2 | ✅ |
| T2 (ham.12 — HIGH finding) | BLOCKED H7 | BLOCKED H7 | ✅ |
| T3 (ham.6 — engineer-only GOV) | BLOCKED H-GOV | BLOCKED H-GOV | ✅ |
| T4 (ham.11 — genuinely ready) | READY | READY | ✅ |

**Gate fidelity (GF): 4/4 = 1.00**

---

## Dimension scores

| Case | G1 | G2 | G3 | G4 | G5 | G6 | Weighted |
|------|----|----|----|----|----|----|---------|
| T1 | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 |
| T2 | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 |
| T3 | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 |
| T4 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 |
| **Mean** | **1.00** | **1.00** | **1.00** | **1.00** | **1.00** | **1.00** | **1.00** |

*G3 and G5 are N/A for BLOCKED cases (T1, T2, T3). Weights redistributed proportionally to G1, G4, G6 per EVAL.md.*

---

## Pass/fail per case

| Case | Weighted score | Pass threshold | Pass | Compliant | Categorical fails |
|------|---------------|----------------|------|-----------|-------------------|
| T1 | 1.00 | 0.80 | ✅ | ✅ | None |
| T2 | 1.00 | 0.80 | ✅ | ✅ | None |
| T3 | 1.00 | 0.80 | ✅ | ✅ | None |
| T4 | 1.00 | 0.80 | ✅ | ✅ | None |

---

## Trial summary

| Metric | Value |
|--------|-------|
| Gate fidelity (GF) | **1.00** |
| Mean weighted score | **1.00** |
| Cases passed | 4/4 |
| Cases compliant | 4/4 |
| Categorical fails | 0 |
| False positives | 0 |
| False negatives | 0 |

**Trial 2 result: PASS** (GF = 1.00, mean = 1.00, all cases pass threshold ≥ 0.80)

---

## Notable observations

**T1:** Enhanced over trial 1 — used a 3-column decision table to classify each AC-section item (Item / Format / Counts as AC?). Proposed full GWT rewrites for AC2–AC4 in the fix section, confirming the criterion was understood rather than just applied. Two independent detection paths (contract review + H2 checklist) both confirmed the block.

**T2:** Made the advisory-title trap analysis most explicit of the two trials: the verdict block contains "The advisory tone of the heading does not change the severity classification" as an explicit statement. This is the anti-trap reasoning at its clearest.

**T3:** Run-2 sharpened the H-GOV analysis with: "the requirement is about role type, not about the section being populated" — a precise articulation of the presence-vs-qualification distinction. H-ADAPTER correctly noted as not reached rather than silently omitted.

**T4:** Slightly more compact instructions block than trial 1, but all required sections present. W1 and W3 surfaced sequentially; W3 /decisions cross-reference verified. H-GOV and H-ADAPTER both evaluated with explicit positive reasoning.

---

## Trial 1 vs Trial 2 consistency

| Metric | Trial 1 | Trial 2 | Delta |
|--------|---------|---------|-------|
| GF | 1.00 | 1.00 | 0.00 |
| Mean weighted score | 1.00 | 1.00 | 0.00 |
| All verdicts match T1 | — | ✅ yes | — |
| G1 mean | 1.00 | 1.00 | 0.00 |
| G2 mean | 1.00 | 1.00 | 0.00 |
| G3 mean (READY cases only) | 1.00 | 1.00 | 0.00 |
| G4 mean | 1.00 | 1.00 | 0.00 |
| G5 mean (READY cases only) | 1.00 | 1.00 | 0.00 |
| G6 mean | 1.00 | 1.00 | 0.00 |

**Variance: 0.00 across all dimensions and both trials.** Perfect consistency.

---

## Comparison to pass threshold

Pass threshold: GF = 1.00 (required for production recommendation per EXP-004 manifest).
Trial 2 result: **1.00** — meets threshold.

Both trials meet the production recommendation threshold. Zero variance between trials confirms stable, reliable execution of the /definition-of-ready gate skill.