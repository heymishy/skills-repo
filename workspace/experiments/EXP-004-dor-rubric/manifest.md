# EXP-004 — /definition-of-ready rubric experiment

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-004-dor-rubric |
| experiment_type | gate-skill-rubric |
| created | 2026-05-14 |
| operator | heymishy |
| status | complete |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 1 (semi-manual, VS Code model selector) |
| trigger | new-skill-rubric — DoR corpus cases newly created, first eval run |
| skills_swept | definition-of-ready |
| models_compared | claude-haiku-4-5, claude-sonnet-4-6 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | T1, T2, T3, T4 |

## Hypothesis

Haiku (0.33× cost) can replace Sonnet as the default model for /definition-of-ready while achieving ≥0.80 weighted score with zero categorical fails on all four adversarial corpus cases. If confirmed, gate skills route to Haiku. If Haiku produces any categorical fail (H-GOV miss, High oversight signed off without approver, or instructions produced without running hard blocks), Sonnet remains the required model for DoR regardless of weighted score.

This is the first evidence-backed test of the claim in `routing-policy-framework.md` that "gate skills can use Haiku." Without this experiment, that claim is `measurement_backed: false`.

## Corpus design

The four cases are adversarial: each looks plausible but contains a specific hidden gap that triggers a hard block. A model that processes the bundle quickly without following the H1–H-GOV checklist will produce a false positive (signing off a blocked story).

| Case | Label | Hidden gap | Expected verdict | Expected H-blocks |
|------|-------|-----------|-----------------|-------------------|
| T1 | Payment webhook — missing ACs | Story has 1 GWT AC; H2 requires ≥3 | BLOCKED | H2 FAIL |
| T2 | DR failover activation — open HIGH | Review has 1 unresolved HIGH finding (H7) | BLOCKED | H7 FAIL |
| T3 | Session token refresh — H-GOV engineer-only | Discovery Approved By lists engineer roles only | BLOCKED | H-GOV FAIL (AC4) |
| T4 | Payment audit trail — genuinely ready | All blocks pass; W3 warning to surface | READY | All pass; W3 surfaced |

**Corpus location:** `.github/skills/definition-of-ready/corpus/`

## Primary metric: gate fidelity (GF)

$$GF = \frac{\text{correct verdicts}}{4 \text{ cases}}$$

A correct verdict requires:
1. Correct BLOCKED / READY outcome for the case
2. For BLOCKED cases: the expected H-block is explicitly named in the output
3. For T4: instructions block produced AND W3 surfaced before proceeding

GF threshold: 1.00 (all 4 cases) for any model to be recommended for production gate use.

**Secondary metric:** Weighted rubric score (from EVAL.md judge, averaged across all 4 cases).
Pass threshold per EVAL.md: ≥ 0.80 weighted, zero categorical fails.

## Token and cost estimate (Layer 1 — AI Credits)

| Component | Cases | Models | Trials | Multiplier | Est. credits |
|-----------|-------|--------|--------|------------|--------------|
| Candidate runs: haiku-4-5 | 4 | 1 | 2 | 0.33× | ~8 credits |
| Candidate runs: sonnet-4-6 | 4 | 1 | 2 | 1× | ~24 credits |
| Judge calls: sonnet-4-6 | 16 total | 1 | 1 | 1× | ~16 credits |
| **Total** | | | | | **~48 credits** |

Estimates are rough (DoR bundles are large inputs ~2–3k tokens each; judge runs against full output).

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| definition-of-ready | T1, T2, T3, T4 | haiku-4-5, sonnet-4-6 | 2 each |

Total cells: 4 cases × 2 models × 2 trials = 16 runs.

## How to run (Layer 1)

1. Select the target model in the VS Code GitHub Copilot model picker.
2. Start a new chat. Paste the SKILL.md prompt header (the role/context block from the top of `.github/skills/definition-of-ready/SKILL.md`).
3. Paste the corpus case bundle from `.github/skills/definition-of-ready/corpus/T[N]-[label]/bundle.md`.
4. Record the full model output in the run file (see runs directory).
5. Switch to sonnet-4-6. Paste the judge prompt from `.github/skills/definition-of-ready/EVAL.md`, substituting `{STORY_CONTENT}`, `{TEST_PLAN_SUMMARY}`, `{REVIEW_REPORT}`, and `{OUTPUT}` with the relevant bundle sections and the model output.
6. Record the judge JSON result in the run file.
7. Repeat for each case and model.

**Run file naming:** `workspace/experiments/EXP-004-dor-rubric/runs/[case]-[model]-trial[N].md`

## Runs log

| Run | Case | Model | Trial | Date | Run file | G1 | G2 | G3 | G4 | G5 | G6 | Weighted | Pass | GF correct |
|-----|------|-------|-------|------|----------|----|----|----|----|----|-----|---------|------|-----------|
| 1 | T1 | haiku-4-5 | 1 | 2026-05-14 | runs/haiku/T1-run-1.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 2 | T1 | haiku-4-5 | 2 | 2026-05-14 | runs/haiku/T1-run-2.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 3 | T1 | sonnet-4-6 | 1 | 2026-05-14 | runs/sonnet/T1-run-1.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 4 | T1 | sonnet-4-6 | 2 | 2026-05-14 | runs/sonnet/T1-run-2.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 5 | T2 | haiku-4-5 | 1 | 2026-05-14 | runs/haiku/T2-run-1.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 6 | T2 | haiku-4-5 | 2 | 2026-05-14 | runs/haiku/T2-run-2.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 7 | T2 | sonnet-4-6 | 1 | 2026-05-14 | runs/sonnet/T2-run-1.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 8 | T2 | sonnet-4-6 | 2 | 2026-05-14 | runs/sonnet/T2-run-2.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 9 | T3 | haiku-4-5 | 1 | 2026-05-14 | runs/haiku/T3-run-1.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 10 | T3 | haiku-4-5 | 2 | 2026-05-14 | runs/haiku/T3-run-2.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 11 | T3 | sonnet-4-6 | 1 | 2026-05-14 | runs/sonnet/T3-run-1.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 12 | T3 | sonnet-4-6 | 2 | 2026-05-14 | runs/sonnet/T3-run-2.md | 1.0 | 1.0 | N/A | 1.0 | N/A | 1.0 | 1.00 | ✅ | ✅ |
| 13 | T4 | haiku-4-5 | 1 | 2026-05-14 | runs/haiku/T4-run-1.md | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | ✅ | ✅ |
| 14 | T4 | haiku-4-5 | 2 | 2026-05-14 | runs/haiku/T4-run-2.md | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | ✅ | ✅ |
| 15 | T4 | sonnet-4-6 | 1 | 2026-05-14 | runs/sonnet/T4-run-1.md | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | ✅ | ✅ |
| 16 | T4 | sonnet-4-6 | 2 | 2026-05-14 | runs/sonnet/T4-run-2.md | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.0 | 1.00 | ✅ | ✅ |

## Scorecard summary

*Populated after all runs complete.*

| Model | T1 GF | T2 GF | T3 GF | T4 GF | Overall GF | Avg weighted | Pass rate | Compliant | Verdict |
|-------|-------|-------|-------|-------|-----------|-------------|-----------|-----------|---------|
| haiku-4-5 | | | | | | | | | |
| sonnet-4-6 | | | | | | | | | |

## Findings

*Populated after analysis.*

**Primary question:** Can Haiku achieve GF = 1.00 (all 4 cases correct) with zero categorical fails?

**Routing policy implication:**
- If Haiku GF = 1.00 and zero categorical fails: update `routing-policy-framework.md` — mark `measurement_backed: true` for DoR Haiku routing. Confirm with two-trial evidence.
- If Haiku misses any BLOCKED case (false positive): Haiku is prohibited for DoR gate decisions on regulated stories. Sonnet required.
- If Haiku correctly identifies blocks but produces incomplete instructions (G3 weak): conditional approval possible (use Haiku for block detection; Sonnet for instructions generation when story passes).

## Final results — 2026-05-14

**Hypothesis outcome: CONFIRMED.** Haiku achieves GF = 1.00 with zero categorical fails across all 4 adversarial cases and both trials.

| Model | Trial 1 GF | Trial 2 GF | Combined GF | Mean weighted | Categorical fails | Decision |
|-------|-----------|-----------|-------------|---------------|-------------------|----------|
| claude-haiku-4-5 | 1.00 | 1.00 | **1.00** | 1.00 | 0 | **APPROVED — default** |
| claude-sonnet-4-6 | 1.00 | 1.00 | **1.00** | 1.00 | 0 | Fallback (categorical fail trigger only) |

All 4 adversarial traps defeated by both models in all 16 runs.
Routing policy updated in `workspace/proposals/routing-policy-framework.md` — measurement_backed: true, EXP-004-dor-rubric.
Full comparison: `workspace/experiments/EXP-004-dor-rubric/haiku-vs-sonnet-final.md`

## Next actions

- [x] Run all 16 cells (see matrix above)
- [x] Score with judge prompt from EVAL.md
- [x] Populate scorecard
- [x] Update routing-policy-framework.md based on results
- [x] Mark measurement_backed: true for DoR Haiku routing claim
- [x] Archive experiment: update status to "complete"

## Deviations from template

- experiment_type is `gate-skill-rubric` (not `model-sweep`) — DoR is a gate skill evaluated for correctness, not generative quality. The primary metric is GF (gate fidelity) rather than weighted score alone.
- No Opus runs in this sweep — Opus is not a candidate for cost-efficient gate routing. Opus is the reference upper bound if a disputed result needs benchmarking.
