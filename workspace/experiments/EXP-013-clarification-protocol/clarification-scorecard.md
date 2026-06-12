# EXP-013 Phase 2 — CL1-CL4 Clarification Scorecard

**Date:** 2026-06-12  
**Judge:** claude-sonnet-4-6 (blind — model labels withheld during scoring, applied at write time)  
**Rubric:** CL1-CL4 (clarification-protocol rubric, pass threshold ≥ 0.70, CL1=0.0 → fail regardless)  
**Weights:** CL1=0.40, CL2=0.30, CL3=0.20, CL4=0.10  

---

## 1. Per-Dimension Averages by Model

### 1a. Overall (all 9 trials per model)

| Dimension | Fable 5 | Sonnet 4.6 | Delta |
|---|---|---|---|
| CL1 gate compliance | 0.444 | 0.222 | +0.222 |
| CL2 question specificity | 0.556 | 0.333 | +0.222 |
| CL3 gap diagnosis accuracy | 0.556 | 0.333 | +0.222 |
| CL4 protocol discipline | 0.278 | 0.167 | +0.111 |
| **Weighted score (avg)** | **0.483** | **0.272** | **+0.211** |
| **Compliant trials** | **5/9** | **3/9** | — |

### 1b. Per-Case Breakdown

| Case | Model | CL1 | CL2 | CL3 | CL4 | WS avg | Compliant |
|---|---|---|---|---|---|---|---|
| T2 | Fable 5 | 0.333 | 0.333 | 0.333 | 0.167 | 0.317 | 1/3 |
| T2 | Sonnet 4.6 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0/3 |
| T4 | Fable 5 | 0.333 | 0.333 | 0.333 | 0.167 | 0.317 | 1/3 |
| T4 | Sonnet 4.6 | 0.000 | 0.000 | 0.000 | 0.000 | 0.000 | 0/3 |
| T5 | Fable 5 | 0.667 | 1.000 | 1.000 | 0.500 | 0.817 | 3/3 |
| T5 | Sonnet 4.6 | 0.667 | 1.000 | 1.000 | 0.500 | 0.817 | 3/3 |

---

## 2. Per-Trial Results

| File | CL1 | CL2 | CL3 | CL4 | WS | Pass |
|---|---|---|---|---|---|---|
| cl-T2-fable-5-trial-1 | 1.0 | 1.0 | 1.0 | 0.5 | 0.95 | ✓ |
| cl-T2-fable-5-trial-2 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T2-fable-5-trial-3 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T2-sonnet-4-6-trial-1 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T2-sonnet-4-6-trial-2 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T2-sonnet-4-6-trial-3 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T4-fable-5-trial-1 | 1.0 | 1.0 | 1.0 | 0.5 | 0.95 | ✓ |
| cl-T4-fable-5-trial-2 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T4-fable-5-trial-3 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T4-sonnet-4-6-trial-1 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T4-sonnet-4-6-trial-2 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T4-sonnet-4-6-trial-3 | 0.0 | 0.0 | 0.0 | 0.0 | 0.00 | ✗ |
| cl-T5-fable-5-trial-1 | 0.5 | 1.0 | 1.0 | 0.5 | 0.75 | ✓ |
| cl-T5-fable-5-trial-2 | 0.5 | 1.0 | 1.0 | 0.5 | 0.75 | ✓ |
| cl-T5-fable-5-trial-3 | 1.0 | 1.0 | 1.0 | 0.5 | 0.95 | ✓ |
| cl-T5-sonnet-4-6-trial-1 | 0.5 | 1.0 | 1.0 | 0.5 | 0.75 | ✓ |
| cl-T5-sonnet-4-6-trial-2 | 0.5 | 1.0 | 1.0 | 0.5 | 0.75 | ✓ |
| cl-T5-sonnet-4-6-trial-3 | 1.0 | 1.0 | 1.0 | 0.5 | 0.95 | ✓ |

---

## 3. Hypothesis Verdicts

### H1 — Fable 5 CL-compliant on ≥ 4/6 T2 trials

**Criterion:** CL1 > 0.0 on ≥ 4 of the 6 total T2 outputs (both models).  
**Observed:** 1 of 6 T2 outputs with CL1 > 0.0 (Fable 5 trial-1 only).  
**Verdict: FAIL**

### H2 — Fable 5 CL-compliant count > Sonnet on BOTH T4 and T5

**T4:** Fable 5 1/3 vs Sonnet 0/3 → Fable 5 leads ✓  
**T5:** Fable 5 3/3 vs Sonnet 3/3 → Tied, not strictly greater ✗  
**Verdict: FAIL** (T5 tied — both conditions required)

### H3 — Fable 5 CL2 avg ≥ 0.70 on T2 and T4 averaged

**Fable 5 T2 CL2 avg:** 0.333  
**Fable 5 T4 CL2 avg:** 0.333  
**Combined avg:** 0.333  
**Verdict: FAIL** (0.333 < 0.70)

---

## 4. Routing Implication

All three hypotheses fail. Per manifest H1/H2 fail branch:

> Fable 5's EXP-010 T2 behaviour was 2-trial variance. Signal does not replicate. No routing action. SKILL.md clarification protocol improvement remains the correct lever — model selection is not the solution.

Phase 3 (T2/T4 conversation mode) is NOT needed per manifest: "If H1/H2 both fail in Phase 2, Phase 3 is not needed."

---

## 5. D1-D7 Inversion Confirmation

Phase 1 D1-D7 scoring systematically penalised correct clarification behaviour in two distinct ways:

**Issue 1 — Narrow NC trigger:** D1-D7 NC conditions match exact heading strings (e.g. `## STAGE 1` or `## PHASE 1`). Custom formats used by models (e.g. `PHASE 1: Context Setup`, `STAGE 1 — Problem Decomposition`) escape the trigger. This caused D1-D7 to record "0 NC" for T2-ModelA-trial-2 and T2-ModelA-trial-3 even though those responses produced full 7-phase structured pipelines without a single operator question — responses CL1-CL4 correctly scores as 0.0 gate failures.

**Issue 2 — Artefact reward vs clarification reward:** D1-D7 rewards artefact output quality (D3: structured outputs, D4: analytical depth). The correctly compliant trial-1 responses for both T2 and T4 — which produce no artefact because they are waiting for operator input — score low under D1-D7 precisely because they comply with the clarification protocol.

**Empirical confirmation:**
- T2-ModelA-trial-1: CL1-CL4 WS=0.95 (PASS) / D1-D7 avg ~0.55 (FAIL)
- T5-ModelB-trial-1: CL1-CL4 WS=0.75 (PASS) / D1-D7 avg ~0.62 (FAIL)

D1-D7 is not a valid rubric family for T2, T4, or T5 corpus cases. CL1-CL4 must be the authoritative rubric for any case where the correct output is a set of operator questions rather than a structured deliverable.

---

## 6. SKILL.md Fix Recommendations

### For both models

**Fix 1 — Hard gate statement (highest priority):**  
The clarification protocol section of SKILL.md must include an explicit prohibition, not guidance: "Do not produce any structured deliverable — including stages, phases, hypothesis lists, constraint taxonomies, proposed next steps, or frameworks — until at least one operator question has been asked and answered." The current SKILL.md uses advisory language that both models override in favour of their default discovery pipeline instinct.

**Fix 2 — Response-type gating:**  
SKILL.md should specify that T2 (ambiguous product problems) and T4 (technical diagnosis) are clarification-first cases and enumerate the required question types before any artefact is produced.

### Fable 5 specific

- **T2/T4 inconsistency:** Trial-1 of both T2 and T4 shows Fable 5 can comply — the behaviour is in the model's range. Trials 2 and 3 default to pipeline output. The protocol is not stable across temperature variation. A stronger prohibition in SKILL.md is the most likely lever.
- **T4 hypothesis list failure mode:** Trials 2 and 3 both fail on the same pattern — questions present but accompanied by a "hypotheses to test" list. This specific form should be named explicitly in SKILL.md as a prohibited variant.
- **T5 strength:** Enterprise context flag-raising is consistent and strong across all 3 trials (3/3 compliant, WS avg 0.817). No fix needed here; this pattern is working.

### Sonnet 4.6 specific

- **T2/T4 zero compliance:** No T2 or T4 trial produces a compliant response — full artefact output is the default without exception. The discovery framework instinct entirely overrides the clarification protocol. This requires the hardest gate language possible in SKILL.md.
- **T5 strength:** T5 performance matches Fable 5 exactly (3/3 compliant, WS avg 0.817). The enterprise-context recognition pattern is effective and stable. Trial-3 includes explicit spec decline matching the T5 CL1=1.0 criterion.
- **Root cause:** The T2/T4 failure mode is not a subtle edge case — it is the default response pattern. The clarification gate must be stated as a hard rule with no ambiguity, not a preference.
