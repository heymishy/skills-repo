# EXP-TEMPLATE-model-sweep

This is the manifest template for model sweep experiments. Copy this file to `workspace/experiments/EXP-XXX-[description]/manifest.md` and fill in all fields before running.

The `experiment_id` value here must match: (1) the directory name, (2) the `instrumentation.experiment_id` field in `.github/context.yml` if capture blocks are enabled. This is the three-way consistency rule defined in `workspace/experiments/README.md`.

---

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-XXX-[description] |
| experiment_type | model-sweep |
| created | YYYY-MM-DD |
| operator | [name] |
| status | planned \| in-progress \| complete |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 1 (semi-manual) \| 2 (programmatic) |
| trigger | [new-model-release \| skill-regression \| new-skill \| quarterly \| billing-change] |
| skills_swept | [comma-separated skill names with EVAL.md, or "all"] |
| models_compared | [e.g. claude-sonnet-4-6, claude-opus-4-6] |
| trials_per_cell | [default: 3] |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | [e.g. T1, T2, T3, T4, T5 for /discovery] |

## Hypothesis

[One or two sentences: what do you expect to find, and why does it matter?]

Example: "We expect Sonnet 4.6 to perform equivalently to Opus 4.6 on /discovery (within 0.05 weighted score) at 5× lower cost, supporting downgrading to Sonnet as the default for generative outer-loop skills."

## Token and cost estimate

| Component | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------------------|--------------------|-----------|
| Candidate runs: [model A] × [N cells] | | | |
| Candidate runs: [model B] × [N cells] | | | |
| Judge calls: sonnet-4-6 × [N total] | | | |
| **Total** | | | **$TBD** |

Pricing reference: Sonnet 4.6 at $3/$15/M, Opus 4.6 at $15/$75/M (verify at https://www.anthropic.com/pricing).

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| [skill-name] | [T1, T2, ...] | [model-a, model-b] | [3] |

## Runs log

| Run | Skill | Case | Model | Trial | Date | Run file | Result file | Weighted score | Pass |
|-----|-------|------|-------|-------|------|----------|-------------|----------------|------|
| 1 | | | | 1 | _pending_ | | | | |

## Scorecard summary

*Populated after all runs complete. See `scorecard.md` in this experiment directory for full detail.*

| Skill | Model | Avg score | Pass rate | Compliant | Est. cost |
|-------|-------|-----------|-----------|-----------|-----------|
| | | | | | |

## Findings

*Populated after analysis.*

**Recommendation:** [downgrade / upgrade / keep / mixed — with skill-specific detail]

**Evidence:** Experiment ID `EXP-XXX-[description]` with [N] trials per cell. Scorecard at `workspace/experiments/EXP-XXX-[description]/scorecard.md`.

## Next actions

- [ ] If routing changes recommended: update `workspace/proposals/proposed-update-token-optimization-measurement.md`
- [ ] If context.yml model_label should change: operator action (model selection is operator-controlled, not automated)
- [ ] Archive experiment: move status to "complete"

## Deviations from template

*Note any deviations from the standard sweep protocol here (e.g. "only ran 2 trials due to cost" or "T4 skipped — corpus case under revision").*
