# EXP-037 — Implementation-plan Haiku 4.5 Frontier + DoD Gate

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-037-impl-plan-haiku-frontier-dod |
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
| models_compared | claude-haiku-4-5-20251001 |
| baseline_experiment | EXP-036-impl-plan-calibration-dod |
| trials_per_cell | 3 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | IL-T1, IL-T3, IL-S3, IL-S5, IL-S12, IL-S13 |
| corpus_path | workspace/experiments/inner-loop-corpus/ |

**Dependency:** EXP-036 must be complete before this experiment is analysed. EXP-037 can run in parallel with EXP-036 to save time, but its findings only become actionable after Sonnet baseline scores from EXP-036 are known.

## Hypothesis

Haiku 4.5 achieves ≥ 0.75 on LOW difficulty cases (IL-T1, IL-T3), scores 0.65–0.75 on MEDIUM cases (IL-S3, IL-S5), and scores < 0.65 on HIGH difficulty regulated cases (IL-S12, IL-S13). The expected failure modes for HIGH cases are:
- IP2 = 0.0: Haiku fabricates out-of-scope governance gate (e.g. CCCFA affordability in IL-S12, FX reporting in IL-S13)
- IP5 = 0.0: Haiku makes compiled-in constants configurable (C4/C6/C7)

If confirmed, the routing policy becomes: Haiku for LOW, Sonnet for MEDIUM/HIGH (with the option to test MEDIUM re-routing separately).

## Token and cost estimate

| Component | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------------------|--------------------|-----------|
| Candidate: Haiku 4.5 × 18 cells (6 cases × 3 trials) | 18 × 3,000 = 54,000 | 18 × 5,000 = 90,000 | $0.043 + $0.450 = $0.49 |
| Judge: Sonnet 4.6 × 18 evaluations | 18 × 4,000 = 72,000 | 18 × 800 = 14,400 | $0.216 + $0.216 = $0.43 |
| Phase B DoD gate: 18 inputs | 18 × 2,000 = 36,000 | 18 × 600 = 10,800 | $0.108 + $0.162 = $0.27 |
| **Total** | | | **~$1.19** |

Note: Haiku 4.5 output tokens are estimated slightly lower than Sonnet (5,000 vs 6,000) — Haiku tends to produce more concise plans. If output is truncated or incomplete, this is flagged in IP3 (executability).

Pricing: Haiku 4.5 at $0.80/M input, $5.00/M output (claude-haiku-4-5-20251001).

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| /implementation-plan | IL-T1, IL-T3, IL-S3, IL-S5, IL-S12, IL-S13 | claude-haiku-4-5-20251001 | 3 |

## Phase A — Implementation-plan generation and scoring

**Input per run:** Same as EXP-036 (B-dor.md, A-definition.md, C-test-plan.md, E-codebase-context.js, eval mode).

**Operator input prompt template:** Identical to EXP-036. The model string in the API call is the only change.

**Scoring:** IP1 (0.30) + IP2 (0.25) + IP3 (0.20) + IP4 (0.15) + IP5 (0.10)
**Pass threshold:** ≥ 0.75 weighted score

## Phase B — DoD gate on plan output bundles

Same as EXP-036. Expected verdicts unchanged (determined by corpus, not model).

## Phase C — Comparison against EXP-036 baseline

For each case and dimension, compute:
- `haiku_score - sonnet_score` per IP dimension
- Whether Haiku achieves ≥ 0.75 pass on LOW/MEDIUM cases
- Whether Haiku fails on HIGH cases as hypothesised (IP2 and IP5 failure modes)
- Cost savings if Haiku routed for LOW: `(haiku_cost / sonnet_cost)` ratio

**Routing decision rule:**
- If Haiku pass rate ≥ 80% on IL-T1/T3 (LOW) AND no IP2=0.0 cases: Haiku → LOW difficulty routing approved
- If Haiku pass rate ≥ 80% on IL-S3/S5 (MEDIUM) with same constraint: Haiku → MEDIUM routing approved
- HIGH cases (IL-S12/S13): Haiku route only if pass rate = 100% — no exceptions for regulated cases

## Runs log

| Run | Case | Model | Trial | Date | Phase A score | IP2 | IP5 | Phase B DoD verdict | Pass |
|-----|------|-------|-------|------|--------------|-----|-----|---------------------|------|
| 1 | IL-T1 | claude-haiku-4-5-20251001 | 1 | _pending_ | | | | | |
| 2 | IL-T1 | claude-haiku-4-5-20251001 | 2 | _pending_ | | | | | |
| 3 | IL-T1 | claude-haiku-4-5-20251001 | 3 | _pending_ | | | | | |
| 4 | IL-T3 | claude-haiku-4-5-20251001 | 1 | _pending_ | | | | | |
| 5 | IL-T3 | claude-haiku-4-5-20251001 | 2 | _pending_ | | | | | |
| 6 | IL-T3 | claude-haiku-4-5-20251001 | 3 | _pending_ | | | | | |
| 7 | IL-S3 | claude-haiku-4-5-20251001 | 1 | _pending_ | | | | | |
| 8 | IL-S3 | claude-haiku-4-5-20251001 | 2 | _pending_ | | | | | |
| 9 | IL-S3 | claude-haiku-4-5-20251001 | 3 | _pending_ | | | | | |
| 10 | IL-S5 | claude-haiku-4-5-20251001 | 1 | _pending_ | | | | | |
| 11 | IL-S5 | claude-haiku-4-5-20251001 | 2 | _pending_ | | | | | |
| 12 | IL-S5 | claude-haiku-4-5-20251001 | 3 | _pending_ | | | | | |
| 13 | IL-S12 | claude-haiku-4-5-20251001 | 1 | _pending_ | | | | | |
| 14 | IL-S12 | claude-haiku-4-5-20251001 | 2 | _pending_ | | | | | |
| 15 | IL-S12 | claude-haiku-4-5-20251001 | 3 | _pending_ | | | | | |
| 16 | IL-S13 | claude-haiku-4-5-20251001 | 1 | _pending_ | | | | | |
| 17 | IL-S13 | claude-haiku-4-5-20251001 | 2 | _pending_ | | | | | |
| 18 | IL-S13 | claude-haiku-4-5-20251001 | 3 | _pending_ | | | | | |

## Scorecard summary

*Populated after all runs complete. Compare against EXP-036 Sonnet baseline.*

| Case | Difficulty | Haiku avg score | Sonnet avg score | Delta | Haiku pass rate | Routing recommendation |
|------|-----------|----------------|-----------------|-------|-----------------|----------------------|
| IL-T1 | LOW | | | | | |
| IL-T3 | LOW-MED | | | | | |
| IL-S3 | MEDIUM | | | | | |
| IL-S5 | MEDIUM | | | | | |
| IL-S12 | HIGH | | | | | |
| IL-S13 | HIGH | | | | | |

## Findings

*Populated after analysis.*

**Recommendation:** [Haiku routing approval by difficulty tier, with cost saving estimate]

**Evidence:** EXP-037-impl-plan-haiku-frontier-dod, 18 trials. Baseline: EXP-036. Scorecard at `workspace/experiments/EXP-037-impl-plan-haiku-frontier-dod/scorecard.md`.

## Next actions

- [ ] Confirm EXP-036 Sonnet baseline complete before finalising EXP-037 routing recommendation
- [ ] If Haiku passes LOW (IL-T1/T3): update routing-policy-framework.md — LOW difficulty implementation-plan → Haiku
- [ ] If Haiku fails HIGH (expected): update routing-policy-framework.md — HIGH regulated → Sonnet required
- [ ] Archive: set status = "complete"
