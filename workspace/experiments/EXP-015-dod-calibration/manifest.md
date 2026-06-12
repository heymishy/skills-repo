# EXP-015 — /definition-of-done Calibration Sweep

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-015-dod-calibration |
| skill | /definition-of-done |
| experiment_type | calibration-sweep |
| created | 2026-06-12 |
| operator | Hamish King |
| status | planned |
| prerequisite_experiments | none (DoD does not use clarification protocol; no hard dependency) |

## Background and motivation

The DoD skill is currently provisionally routed to Sonnet 4.6 with no empirical calibration. EXP-004 showed Haiku 4.5 achieved GF 1.00 on the DoR gate skill. DoD is similarly a gate skill (correctness-weighted, threshold 0.80). If Haiku can match Sonnet on DoD, it saves 0.67× per DoD call across the full pipeline.

The primary risk in DoD is false positives: marking a story COMPLETE when at least one AC has no evidence in the PR. D1 (AC coverage accuracy) has a categorical fail for this. Any model that produces a D1=0.0 on a planted-defect case (T1, T2, T3) is disqualified from routing consideration.

## Hypotheses

**H1 — Haiku matches Sonnet on gate correctness**
Haiku achieves D1 ≥ 0.90 on all three planted-defect cases (T1, T2, T3) AND D4 ≥ 0.90 on T4 (no false negatives on clean case). Routing implication: DoD → claude-haiku-4-5.

**H2 — Sonnet required for gate correctness**
Haiku misses ≥ 1 planted defect (D1 < 0.50 on T1, T2, or T3) or produces false negatives on T4. Routing implication: DoD → claude-sonnet-4-6 confirmed. Note specific failure mode for corpus design improvement.

## Corpus cases

| Case | File | Type | Planted defect |
|------|------|------|----------------|
| T1 | T1-webhook-sla-ac-gap.md | Defect: AC gap | Webhook SLA AC has zero PR evidence — must surface as ❌ INCOMPLETE |
| T2 | T2-profile-scope-creep.md | Defect: out-of-scope | Dark mode implementation not in story scope — must flag as deviation |
| T3 | T3-api-key-nfr-gap.md | Defect: NFR gap | API key rotation NFR not addressed in PR — must surface as gap |
| T4 | T4-filter-complete.md | Clean baseline | All ACs evidenced, no deviations — must NOT produce false positive |

## Models under test

| Model | Role | Rationale |
|-------|------|-----------|
| claude-sonnet-4-6 | Baseline | Current provisional routing |
| claude-haiku-4-5 | Challenger | EXP-004 GF 1.00 on DoR — test if gate-skill Haiku approval extends to DoD |

## Run procedure

### Step 1 — Run the sweep

```powershell
# From repo root — uses context.yml evaluation.mode and judge settings
ANTHROPIC_API_KEY="sk-ant-..." node scripts/run-model-sweep.js \
  --experiment EXP-015-dod-calibration \
  --skills definition-of-done \
  --models claude-sonnet-4-6,claude-haiku-4-5 \
  --trials 3
```

Or with batch mode (recommended for cost efficiency):
```powershell
ANTHROPIC_API_KEY="sk-ant-..." node scripts/run-model-sweep.js \
  --experiment EXP-015-dod-calibration \
  --skills definition-of-done \
  --models claude-sonnet-4-6,claude-haiku-4-5 \
  --trials 3 \
  --batch
```

Expected output: 24 runs (4 cases × 2 models × 3 trials) + 24 judge calls.

### Step 2 — Review scorecard

Read `workspace/experiments/EXP-015-dod-calibration/scorecard.md` after the run completes. Check:
- D1 scores on T1/T2/T3 for each model (defect detection)
- D4 scores on T4 for each model (false-positive suppression)
- Any `compliant=false` results — these are categorical gate failures

### Step 3 — Apply routing decision

See pass criteria below.

---

## Token and cost estimate

| Component | Model | Calls | Est. input tokens | Est. output tokens | Est. cost |
|-----------|-------|-------|------------------|--------------------|-----------|
| Generation (4 cases × 3 trials) | claude-sonnet-4-6 | 12 | ~7,200 | ~9,600 | **~$0.22** |
| Generation (4 cases × 3 trials) | claude-haiku-4-5 | 12 | ~7,200 | ~9,600 | **~$0.07** |
| Judge calls (24 total) | claude-sonnet-4-6 | 24 | ~120,000 | ~6,000 | **~$0.44** |
| **Total** | | | | | **~$0.73** |

Cost ceiling: $5 USD.

---

## Scoring methodology

DoD rubric dimensions and weights (from EVAL.md):

| Dimension | Weight | What it measures |
|-----------|--------|-----------------|
| D1 — AC coverage accuracy | 0.30 | Correct AC verdict (✅/⚠️/❌) with evidence requirement |
| D2 — Deviation detection | 0.20 | Out-of-scope and test gap surfacing |
| D3 — NFR verification quality | 0.20 | NFR coverage and verification evidence |
| D4 — False-positive suppression | 0.15 | Clean case must NOT produce INCOMPLETE verdict |
| D5 — Metric signal quality | 0.15 | Measurement readiness assessment |

**Pass threshold:** ≥ 0.80 (gate skill — higher than generative skill threshold of 0.70)

**Categorical fail:** D1 = 0.0 on any planted-defect case = `compliant=false` regardless of weighted score.

---

## Pass criteria and routing implications

**H1 confirmed — DoD → Haiku:**
Haiku D1 avg ≥ 0.90 on T1/T2/T3 AND Haiku D4 avg ≥ 0.90 on T4 AND no `compliant=false` on any Haiku trial. Routing update: `definition-of-done → claude-haiku-4-5`. Update routing policy in the workspace proposals.

**H1 partially confirmed — investigate failure mode:**
Haiku passes T4 (no false negatives) but misses one of T1/T2/T3. Determine which defect type was missed (AC gap, scope creep, or NFR gap) and note as a SKILL.md improvement target. Routing remains Sonnet. Recommend targeted Haiku improvement and re-test in EXP-020.

**H2 confirmed — DoD → Sonnet:**
Haiku misses ≥ 1 defect case (D1 < 0.50 or `compliant=false`). DoD → claude-sonnet-4-6 confirmed. Note specific failure mode.

**Both models fail ≥ 1 defect case:**
Unexpected finding. DoD SKILL.md and EVAL.md require review. Check whether the planted defect in the failing case is well-specified in the corpus case file. May indicate corpus design issue rather than model weakness.

---

## Run 1 — INVALID (corpus extraction bug)

Run 1 completed (batch `msgbatch_01DjR8ByaGJBVqed61y9n88U`, 2026-06-12) but all 24 trials failed with 0.0–0.5 weighted scores and the majority NON-COMPLIANT. Root cause: **corpus extraction bug**, not model weakness.

Two bugs combined to truncate the operator input before the model received the full artefact bundle:

1. **Level-2 headings inside `## Operator input`** — The corpus files used `## Story:`, `## Acceptance Criteria`, `## Out of Scope`, `## NFRs`, `## Complexity` (level-2 headings) inside the operator input section. `extractOperatorInput` broke on the first `## Story:` heading and cut off all AC/test-plan/PR content. The model received only the Story ID/Feature/Epic stub.

2. **No code-fence tracking** — Even after fixing story headings to `###`, the PR description sections contain `## Summary`, `## Changes`, `## Test results` inside fenced code blocks (` ``` `). Without code-fence awareness, `extractOperatorInput` also broke on these.

### Fixes applied (2026-06-12, before Run 2)

- **Corpus files** (`T1`–`T4`): Changed `## Story:`, `## Acceptance Criteria`, `## Out of Scope`, `## NFRs`, `## Complexity` → `###` in all 4 corpus files.
- **`scripts/run-model-sweep.js` `extractOperatorInput`**: Added `inCodeFence` state variable; break condition guarded by `!inCodeFence`.
- **DoD SKILL.md**: Added `## Eval mode (inline artefacts)` section instructing models to use inline content rather than looking for files on disk.

Run 1 results are invalid and will be overwritten by Run 2.

---

## Scorecard summary (to be populated after Run 2)

| Case | Trial | Sonnet WS | Sonnet D1 | Sonnet compliant | Haiku WS | Haiku D1 | Haiku compliant |
|------|-------|-----------|-----------|-----------------|----------|----------|-----------------|
| T1 | avg | — | — | — | — | — | — |
| T2 | avg | — | — | — | — | — | — |
| T3 | avg | — | — | — | — | — | — |
| T4 | avg | — | — | — | — | — | — |

## Findings

*Populated after Run 2 analysis.*

## Deviations from template

Run 1 invalid due to corpus extraction bugs — see above. Run 2 is the valid sweep.
