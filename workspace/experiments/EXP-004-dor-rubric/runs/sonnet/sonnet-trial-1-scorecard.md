# EXP-004 Scorecard: claude-sonnet-4-6 — Trial 1

**Experiment:** EXP-004-dor-rubric
**Model:** claude-sonnet-4-6
**Trial:** 1
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

**Trial 1 result: PASS** (GF = 1.00, mean = 1.00, all cases pass threshold ≥ 0.80)

---

## Notable observations

**T1:** The contract review phase independently detected the prose-bullet issue before the H2 hard block check ran — two convergent signals. This is an indicator of genuine comprehension rather than a keyword match on "Given/When/Then."

**T2:** R3's advisory-sounding title ("Architecture consideration") was correctly read through to its severity (HIGH) and resolution status (Open). The model did not treat the heading as a category signal.

**T3:** The "Approved By section is populated with full entries" trap was correctly navigated. H-GOV AC4 triggered correctly based on role-type evaluation, not presence detection.

**T4:** All 17 hard blocks evaluated in full. W1 and W3 surfaced sequentially with acknowledgement prompts. W3 /decisions cross-reference verified before acknowledging. H-GOV PASS direction (Priya Sharma as non-engineering) and H-ADAPTER N/A (no injectable adapter) both handled with explicit positive reasoning.

---

## Comparison to pass threshold

Pass threshold: GF = 1.00 (required for production recommendation per EXP-004 manifest).
Trial 1 result: **1.00** — meets threshold.

*Note: GF threshold = 1.00 for this experiment (gate-skill-rubric type). A model scoring GF < 1.00 would not be recommended for production use on this gate without further evaluation.*