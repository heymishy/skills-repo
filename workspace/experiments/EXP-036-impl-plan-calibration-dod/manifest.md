# EXP-036 — Implementation-plan Calibration + DoD Gate (Sonnet 4.6)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-036-impl-plan-calibration-dod |
| experiment_type | model-sweep |
| created | 2026-06-13 |
| operator | Hamish King |
| status | planned |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | new-skill |
| skills_swept | /implementation-plan |
| models_compared | claude-sonnet-4-6 |
| trials_per_cell | 3 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | IL-T1, IL-T3, IL-S3, IL-S5, IL-S12, IL-S13 |
| corpus_path | workspace/experiments/inner-loop-corpus/ |

## Hypothesis

Sonnet 4.6 achieves ≥ 0.75 weighted IP1-IP5 score on LOW and MEDIUM difficulty corpus cases (IL-T1, IL-T3, IL-S3, IL-S5), and scores 0.65–0.75 on HIGH difficulty regulated cases (IL-S12, IL-S13). The primary failure mode on HIGH cases will be IP2 (fabricated scope) and IP5 (NFR inheritance — configurable constants, parallelised screeners).

## Token and cost estimate

Implementation-plan outputs are longer than discovery/definition outputs — estimated 4,000–8,000 output tokens per run.

| Component | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------------------|--------------------|-----------|
| Candidate: Sonnet 4.6 × 18 cells (6 cases × 3 trials) | 18 × 3,000 = 54,000 | 18 × 6,000 = 108,000 | $0.162 + $1.62 = $1.78 |
| Judge: Sonnet 4.6 × 18 evaluations | 18 × 4,000 = 72,000 | 18 × 800 = 14,400 | $0.216 + $0.216 = $0.43 |
| Phase B DoD gate: 18 inputs × DoD evaluation | 18 × 2,000 = 36,000 | 18 × 600 = 10,800 | $0.108 + $0.162 = $0.27 |
| **Total** | | | **~$2.48** |

Pricing: Sonnet 4.6 at $3/M input, $15/M output.

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| /implementation-plan | IL-T1, IL-T3, IL-S3, IL-S5, IL-S12, IL-S13 | claude-sonnet-4-6 | 3 |

## Phase A — Implementation-plan generation and scoring

**Input per run:**
- DoR artefact (B-dor.md)
- Definition artefact (A-definition.md)
- Test plan (C-test-plan.md)
- Codebase context (E-codebase-context.js)
- Evaluation mode: eval=true (use eval bundle, not live repo)

**Operator input prompt template:**

```
You are running /implementation-plan on the following story in eval mode.

DoR artefact:
[contents of B-dor.md]

Definition artefact:
[contents of A-definition.md]

Test plan:
[contents of C-test-plan.md]

Codebase context:
[contents of E-codebase-context.js]

Produce the implementation plan. Write it to artefacts/[feature]/plans/[story-slug]-plan.md.
```

**Judge input template:**

```
[Judge prompt from eval-design-implementation-plan.md]

DoR artefact:
[B-dor.md contents]

Plan output:
[generated plan]
```

**Scoring:** IP1 (0.30) + IP2 (0.25) + IP3 (0.20) + IP4 (0.15) + IP5 (0.10)
**Pass threshold:** ≥ 0.75 weighted score
**Structural gate:** All 4 binary gates must pass

## Phase B — DoD gate on plan output bundles

For each plan that achieves Phase A score ≥ 0.75, run the DoD gate using the corresponding G-dod-bundle.md as input.

**Input:** G-dod-bundle.md (pre-built DoD input bundle from corpus)
**Expected verdicts:**
- IL-T1: COMPLETE
- IL-T3: COMPLETE
- IL-S3: COMPLETE
- IL-S5: COMPLETE
- IL-S12: COMPLETE WITH DEVIATIONS (MRM sign-off pending)
- IL-S13: COMPLETE WITH DEVIATIONS (SWIFT notification pending)

**DoD gate pass:** Verdict matches expected (COMPLETE or COMPLETE WITH DEVIATIONS in correct case)
**DoD gate fail:** INCOMPLETE where expected COMPLETE, or COMPLETE where expected WITH DEVIATIONS (fabricated gate)

## Phase C — Correlation analysis

After all runs complete, compute:
1. Correlation between IP2 score and DoD verdict correctness
2. Correlation between IP5 score and DoD NFR coverage score (D4)
3. Whether HIGH difficulty cases (IL-S12, IL-S13) reliably score below LOW cases

## Runs log

| Run | Case | Model | Trial | Date | Phase A score | Phase B DoD verdict | Pass |
|-----|------|-------|-------|------|--------------|---------------------|------|
| 1 | IL-T1 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 2 | IL-T1 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 3 | IL-T1 | claude-sonnet-4-6 | 3 | _pending_ | | | |
| 4 | IL-T3 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 5 | IL-T3 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 6 | IL-T3 | claude-sonnet-4-6 | 3 | _pending_ | | | |
| 7 | IL-S3 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 8 | IL-S3 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 9 | IL-S3 | claude-sonnet-4-6 | 3 | _pending_ | | | |
| 10 | IL-S5 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 11 | IL-S5 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 12 | IL-S5 | claude-sonnet-4-6 | 3 | _pending_ | | | |
| 13 | IL-S12 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 14 | IL-S12 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 15 | IL-S12 | claude-sonnet-4-6 | 3 | _pending_ | | | |
| 16 | IL-S13 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 17 | IL-S13 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 18 | IL-S13 | claude-sonnet-4-6 | 3 | _pending_ | | | |

## Scorecard summary

*Populated after all runs complete.*

| Case | Difficulty | IP1 | IP2 | IP3 | IP4 | IP5 | Avg score | Pass rate | DoD correct |
|------|-----------|-----|-----|-----|-----|-----|-----------|-----------|-------------|
| IL-T1 | LOW | | | | | | | | |
| IL-T3 | LOW-MED | | | | | | | | |
| IL-S3 | MEDIUM | | | | | | | | |
| IL-S5 | MEDIUM | | | | | | | | |
| IL-S12 | HIGH | | | | | | | | |
| IL-S13 | HIGH | | | | | | | | |

## Findings

*Populated after analysis.*

**Recommendation:** [routing decision for /implementation-plan by difficulty tier]

**Evidence:** EXP-036-impl-plan-calibration-dod, 18 trials. Scorecard at `workspace/experiments/EXP-036-impl-plan-calibration-dod/scorecard.md`.

## Next actions

- [ ] Run all 18 Phase A trials
- [ ] Run Phase B DoD gate on all 18 plan outputs
- [ ] Complete Phase C correlation analysis
- [ ] If IP2 < 0.75 on HIGH cases: update routing-policy-framework.md with HIGH=Sonnet hard rule
- [ ] If Sonnet passes on all 6 cases: confirm EXP-037 Haiku comparison is worth running
- [ ] Archive: set status = "complete"
