# EXP-010 — Fable 5 vs Sonnet 4.6 vs Opus 4.6 Model Sweep (three-model)

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-010-fable5-model-sweep |
| experiment_type | model-sweep |
| created | 2026-06-11 |
| operator | Hamish King |
| status | complete (partial — see scorecard Deviations) |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | new-model-release (Fable 5) |
| skills_swept | discovery |
| models_compared | claude-fable-5, claude-opus-4-6, claude-sonnet-4-6 |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | T1, T2, T3, T4, T5, S2, S3, S4, S5, S7, S8, S9, S10, S11, S12, S13 |

## Hypothesis

Fable 5 is expected to outperform Sonnet 4.6 and Sonnet 3.7 on high-difficulty S-series cases (S10, S12, S13) where hidden regulatory constraints require deep NZ financial-domain knowledge, while remaining within 0.05 weighted score of Sonnet 4.6 on the T-series baseline cases. The primary question is whether the performance premium justifies Fable 5's 3–5× cost difference over Sonnet 4.6 for the /discovery generative outer-loop.

## Token and cost estimate

*Dry-run executed 2026-06-11 — assumes 900 input / 2000 output tokens per candidate run.*

| Component | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------------------|--------------------|-----------|
| Candidate runs: claude-fable-5-20260609 × 32 cells | ~28,800 | ~64,000 | $3.488 |
| Candidate runs: claude-opus-4-6 × 32 cells | ~28,800 | ~64,000 | $1.744 |
| Candidate runs: claude-sonnet-4-6 × 32 cells | ~28,800 | ~64,000 | $1.046 |
| Candidate runs: claude-sonnet-3-7-20250219 × 32 cells | ~28,800 | ~64,000 | $1.046 |
| Judge calls: claude-sonnet-4-6 × 128 | — | — | $1.843 |
| **Total** | | | **$9.167** |

*Cost ceiling: $30 USD. Estimate is $9.17 — within ceiling. Proceeding to batch execution.*

## Matrix definition

| Skill | Corpus cases | Models | Trials |
|-------|-------------|--------|--------|
| discovery | T1, T2, T3, T4, T5, S2, S3, S4, S5, S7, S8, S9, S10, S11, S12, S13 | claude-fable-5, claude-opus-4-6, claude-sonnet-4-6 | 2 |

Total cells: 16 cases × 3 models × 2 trials = **96 generation runs + 96 judge calls = 192 API calls**

## Runs log

*Populated during batch run execution.*

| Run | Skill | Case | Model | Trial | Date | Run file | Result file | Weighted score | Pass |
|-----|-------|------|-------|-------|------|----------|-------------|----------------|------|
| — | — | — | — | — | _pending_ | — | — | — | — |

## Scorecard summary

*Populated after all runs complete. See `scorecard.md` in this experiment directory for full detail.*

| Skill | Model | Avg score | Pass rate | Compliant | Est. cost |
|-------|-------|-----------|-----------|-----------|-----------|
| discovery | claude-fable-5-20260609 | N/A (model error) | 0/32 | — | $0 |
| discovery | claude-opus-4-6 | 0.540 (14 judged) | 5/14 (36%) | yes | $1.59 |
| discovery | claude-sonnet-4-6 | 0.445 (12 judged) | 3/12 (25%) | yes | $1.18 |
| discovery | claude-sonnet-3-7-20250219 | N/A (model error) | 0/32 | — | $0 |

## Findings

*Populated after analysis.*

**Recommendation:** DEFERRED — primary Fable 5 question unanswered due to model string errors. Provisional: Sonnet 4.6 cost-equivalent to Opus 4.6 on /discovery with no evidence of quality deficit. EXP-010b required.

**Evidence:** Experiment ID `EXP-010-fable5-model-sweep` with 2 trials per cell; 64/128 generation runs errored (Fable 5 + Sonnet 3.7); 38/64 judge calls rate-limited. Scorecard at `workspace/experiments/EXP-010-fable5-model-sweep/scorecard.md`.

## Next actions

- [ ] Confirm dry-run cost is within $30 ceiling before executing batch
- [ ] Execute batch run and populate runs log
- [ ] Write scorecard.md with full per-model and per-case breakdown
- [ ] Update status to "complete" and populate Scorecard summary table
- [ ] If routing changes recommended: update `workspace/proposals/proposed-update-token-optimization-measurement.md`
- [ ] If context.yml model_label should change: operator action (model selection is operator-controlled, not automated)

## Deviations from template

- **S6 excluded**: S6 (S6a behavioural clarification trigger, S6b contradiction, S6c scope creep) are behavioural scenarios not scoreable by D1–D7 discovery EVAL.md dimensions. Excluded from --cases flag. Reserved for a future EXP designed around behavioural/clarification metrics.
- **trials_per_cell = 2**: Template default is 3; reduced to 2 to stay comfortably within $30 cost ceiling given 3-model sweep over 16 cases.
- **Fable 5 model string corrected**: Initial run used `claude-fable-5-20260609` (unverified). Confirmed via `GET /v1/models` on 2026-06-11 that the correct string is `claude-fable-5` (no date suffix). PRICING map updated; Fable 5 generation rows re-run as Phase 2 batch after model string fix.
- **Sonnet 3.7 removed**: `claude-sonnet-3-7-20250219` and `claude-3-7-sonnet-20250219` are both absent from `GET /v1/models` for this API account. Sonnet 3.7 removed from the experiment entirely. Experiment is a **three-model comparison**: `claude-fable-5`, `claude-opus-4-6`, `claude-sonnet-4-6`.
- **Judge rate-limit recovery via --judge-only**: Initial batch judging hit org limit (30 000 input tokens/min); 38/64 judge calls returned 429. Fixed by adding `callModelWithRetry` with exponential backoff (retries=5, base=2s) and a 500ms inter-call gap. Re-scored missing results using `--judge-only` flag (Phase 1) without re-generating.
- **S-series corpus files created**: S2–S5, S7–S13 corpus files did not exist prior to this experiment. Created under `.github/skills/discovery/corpus/` to enable programmatic evaluation. T1–T5 corpus files are unchanged (immutable during sweep). `discoverCorpusCases` regex updated from `T\d+|case-` to `T\d+|S\d+|case-` to discover S-series files.
- **S-series cases evaluated at /discovery only**: S2–S13 were designed for full CPF pipeline evaluation (discovery → definition → DoR → DoD). This experiment applies D1–D7 judge scoring to the /discovery stage only. CPF propagation across stages is not measured here.
- **Token ceiling confound (identified post-analysis 2026-06-12)**: Generation calls used `max_tokens=4096` (sweep script default). Post-hoc inspection found 10 result files with judge notes citing truncated or incomplete output. Fable 5 writes more densely than Sonnet 4.6 — on S13 trial-1, Fable 5 produced 34 lines vs Sonnet's 203 lines. The judge explicitly noted truncation and docked marks for missing sections. Fable 5 S-hard scores (S12: 0.582, S13: 0.543) are based on partial outputs; Sonnet S-hard scores are based on substantially complete ones. The HOLD conclusion is directionally valid (T3 deficit and cost gap are unaffected by truncation), but the S12/S13 gap cannot be treated as a clean quality comparison. **Recommended follow-up**: Re-run Fable 5 on S12 and S13 with `--max-tokens 8192` to test whether the gap persists on full outputs. See scorecard Section 9, Limitation 6.
