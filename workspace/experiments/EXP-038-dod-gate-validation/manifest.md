# EXP-038 — DoD Gate Validation on Inner-Loop Corpus (Haiku vs Sonnet)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-038-dod-gate-validation |
| experiment_type | model-sweep |
| created | 2026-06-14 |
| operator | Hamish King |
| status | planned |
| predecessor | EXP-036 (Sonnet IP baseline), EXP-037 (Haiku IP frontier) |

## Purpose

EXP-036 Phase B: validate that the DoD gate skill correctly assesses the same stories
used in the IP calibration corpus. Two questions:

1. **Gate fidelity:** Does Haiku (and Sonnet) correctly determine COMPLETE vs COMPLETE
   WITH DEVIATIONS for all 6 IL corpus cases? Threshold: GF = 6/6 (100%).
2. **Correlation:** Do the fabricated-gate traps (IL-T3, IL-S13) and the deviation
   detection case (IL-S12) discriminate correctly — i.e., are these the hard cases?

This closes the inner-loop pipeline integrity check: EXP-036/037 confirmed the IP skill
produces compliant plans; EXP-038 confirms the DoD skill correctly gates those stories.

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | phase-B-pipeline-validation |
| skills_swept | /definition-of-done |
| models_compared | claude-haiku-4-5, claude-sonnet-4-6 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | IL-T1, IL-T3, IL-S3, IL-S5, IL-S12, IL-S13 |
| corpus_path | .github/skills/definition-of-done/corpus/ |
| max_tokens | 4096 |

## Hypothesis

Haiku achieves GF = 6/6 on the IL DoD corpus (all verdicts correct), matching or
near-matching Sonnet. The fabricated-gate traps (IL-T3: FCA sign-off; IL-S13:
SWIFT/AUSTRAC/DIA) are the discriminating hard cases — lower-quality models will
add phantom deviations. IL-S12 (COMPLETE WITH DEVIATIONS) tests deviation detection
accuracy: the APRA config comment must be specifically named.

**Expected per-case results:**

| Case | Expected verdict | Key discriminator |
|------|-----------------|-------------------|
| IL-T1 | COMPLETE | No NFRs; M1 not-yet-measurable |
| IL-T3 | COMPLETE | Fabricated FCA audit-format gate trap (W1 acknowledged in DoR) |
| IL-S3 | COMPLETE | Performance NFR evidenced; 9,500ms buffer must not be flagged |
| IL-S5 | COMPLETE | Non-configurable thresholds (C4) must NOT be flagged as missing |
| IL-S12 | COMPLETE WITH DEVIATIONS | APRA config comment specifically named as deviation |
| IL-S13 | COMPLETE | No SWIFT/AUSTRAC/FX/DIA fabricated gates |

## Token and cost estimate

DoD outputs are shorter than IP outputs — estimated 1,500–2,500 output tokens per run.

| Component | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------------------|--------------------|-----------|
| Haiku × 12 cells (6 cases × 2 trials) | 12 × 2,000 = 24,000 | 12 × 2,000 = 24,000 | $0.036 + $0.048 = $0.084 |
| Sonnet × 12 cells (6 cases × 2 trials) | 12 × 2,000 = 24,000 | 12 × 2,000 = 24,000 | $0.072 + $0.36 = $0.432 |
| Judge: Sonnet × 24 evaluations | 24 × 3,500 = 84,000 | 24 × 600 = 14,400 | $0.252 + $0.216 = $0.468 |
| **Total** | | | **~$0.98** |

Pricing: Haiku at $1.50/M in + $2.00/M out; Sonnet at $3/M in + $15/M out.

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| /definition-of-done | IL-T1, IL-T3, IL-S3, IL-S5, IL-S12, IL-S13 | claude-haiku-4-5, claude-sonnet-4-6 | 2 |

## Run command

```bash
node scripts/run-model-sweep.js \
  --experiment EXP-038-dod-gate-validation \
  --skills definition-of-done \
  --models claude-haiku-4-5,claude-sonnet-4-6 \
  --cases IL-T1,IL-T3,IL-S3,IL-S5,IL-S12,IL-S13 \
  --trials 2 \
  --max-tokens 4096
```

## Pass criteria

| Metric | Haiku target | Sonnet target |
|--------|-------------|---------------|
| Gate fidelity (GF) — correct verdicts | 6/6 (100%) | 6/6 (100%) |
| Weighted score (D1-D6) | ≥ 0.80 all cells | ≥ 0.80 all cells |
| Compliant (no categorical fail) | 12/12 | 12/12 |

**Routing decision:** If Haiku achieves GF = 6/6 with no categorical fails, confirm
`definition-of-done → claude-haiku-4-5` in context-enterprise-nz.yml (already set).
If GF < 6/6 on Haiku but Sonnet passes, flag for routing escalation review.

## Runs log

| Run | Case | Model | Trial | Date | Weighted score | GF correct | Verdict |
|-----|------|-------|-------|------|----------------|------------|---------|
| 1 | IL-T1 | claude-haiku-4-5 | 1 | _pending_ | | | |
| 2 | IL-T1 | claude-haiku-4-5 | 2 | _pending_ | | | |
| 3 | IL-T3 | claude-haiku-4-5 | 1 | _pending_ | | | |
| 4 | IL-T3 | claude-haiku-4-5 | 2 | _pending_ | | | |
| 5 | IL-S3 | claude-haiku-4-5 | 1 | _pending_ | | | |
| 6 | IL-S3 | claude-haiku-4-5 | 2 | _pending_ | | | |
| 7 | IL-S5 | claude-haiku-4-5 | 1 | _pending_ | | | |
| 8 | IL-S5 | claude-haiku-4-5 | 2 | _pending_ | | | |
| 9 | IL-S12 | claude-haiku-4-5 | 1 | _pending_ | | | |
| 10 | IL-S12 | claude-haiku-4-5 | 2 | _pending_ | | | |
| 11 | IL-S13 | claude-haiku-4-5 | 1 | _pending_ | | | |
| 12 | IL-S13 | claude-haiku-4-5 | 2 | _pending_ | | | |
| 13 | IL-T1 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 14 | IL-T1 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 15 | IL-T3 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 16 | IL-T3 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 17 | IL-S3 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 18 | IL-S3 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 19 | IL-S5 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 20 | IL-S5 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 21 | IL-S12 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 22 | IL-S12 | claude-sonnet-4-6 | 2 | _pending_ | | | |
| 23 | IL-S13 | claude-sonnet-4-6 | 1 | _pending_ | | | |
| 24 | IL-S13 | claude-sonnet-4-6 | 2 | _pending_ | | | |

## Scorecard summary

*Populated after all runs complete.*

| Case | Difficulty | Haiku score avg | Haiku GF | Sonnet score avg | Sonnet GF |
|------|-----------|-----------------|----------|------------------|-----------|
| IL-T1 | LOW | | | | |
| IL-T3 | LOW-MED | | | | |
| IL-S3 | MEDIUM | | | | |
| IL-S5 | MEDIUM | | | | |
| IL-S12 | HIGH | | | | |
| IL-S13 | HIGH | | | | |

## Findings

*Populated after analysis.*

**Routing recommendation:** [confirm or revise definition-of-done → claude-haiku-4-5]

**Evidence:** EXP-038-dod-gate-validation, 24 trials. Scorecard at `workspace/experiments/EXP-038-dod-gate-validation/scorecard.md`.

## Correlation with EXP-036/037

After EXP-038 completes, cross-reference:
- EXP-037 Haiku IP score per case vs EXP-038 Haiku DoD GF per case
- Hypothesis: IL-S12 lower IP score (0.925 avg, IP5 hardcoded threshold) predicts harder
  DoD case (deviation detection — APRA config comment); IL-S13 perfect IP score predicts
  correct COMPLETE DoD verdict

## Next actions

- [ ] Run 24 trials (command above in interactive terminal with ANTHROPIC_API_KEY set)
- [ ] Verify GF = 6/6 for Haiku; confirm DoD routing decision
- [ ] Populate runs log and scorecard
- [ ] If GF < 6/6: investigate failing cases; determine if corpus or model issue
- [ ] Archive: set status = "complete"
