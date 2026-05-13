# EXP-002a-cross-provider-discovery

## Purpose

Cross-provider isolated model sweep for the `/discovery` skill. Extends EXP-001 to five models across two providers (Anthropic + OpenAI) under Scenario 1 conditions (isolated skill eval — SKILL.md + template + input prompt only, no organisational context files loaded). Establishes the full cloud-model routing baseline: which models pass at what cost on which corpus cases.

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-002a-cross-provider-discovery |
| experiment_type | model-sweep |
| created | 2026-05-12 |
| operator | [operator name] |
| status | planned |

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic — requires provider abstraction implementation) |
| trigger | new-provider-extension — EXP-001 complete, OpenAI baseline required |
| scenario | Scenario 1 — Isolated skill eval (no organisational context files) |
| skills_swept | discovery |
| models_compared | claude-haiku-4-5, claude-sonnet-4-6, claude-opus-4-7, gpt-4o, gpt-4o-mini, gpt-4.1, gpt-5-mini |
| trials_per_cell | 3 (T1, T3, T5 full scoring); 2 (T2, T4 categorical only) |
| judge_model | claude-sonnet-4-6 (locked — never the model under evaluation) |
| corpus_cases | T1, T2, T3, T4, T5 |
| pass_threshold | 0.70 (generative skill) |

## Hypothesis

- **H1:** `claude-haiku-4-5` and `gpt-4o-mini` fail categorical compliance on T3 (solution-reframing) and T5 (hidden constraint surfacing) due to insufficient reasoning depth. Both may pass T3 reframe check but fail D7 and D5 on the produced artefact.
- **H2:** `gpt-4o` approximates `claude-sonnet-4-6` performance on T1 and T3 (within 0.08 weighted score) at a different cost point, supporting cross-provider routing as a cost option.
- **H3:** D7 (constraint completeness) is the dimension that most clearly separates model tiers on T3 — lower-tier models will produce regulatory-adjacent artefacts without naming the specific regulatory obligations (MLR 2017, SAR filing, structuring risk).
- **H4:** All five models pass T2 and T4 categorical compliance — these cases test binary stop/ask behaviour, which should be within the capability range of all models evaluated.
- **H5:** GPT-4o, GPT-4.1, and GPT-5 mini (all 0x Copilot multiplier — free on Layer 1) meet pass threshold (≥ 0.70) on T1 and T3. If confirmed, they become the default routing for non-regulated generative inputs on Layer 1 cost grounds alone, regardless of quality differential with Sonnet where both models pass threshold.

## Model matrix

| Model | Provider | Tier | Carry forward from EXP-001? | Layer 2 pricing (input/output per M) | Layer 1 Copilot multiplier |
|-------|----------|------|----------------------------|--------------------------------------|----------------------------|
| claude-haiku-4-5 | Anthropic | Floor | No — new model | $1.00/$5.00 (Layer 2) | 0.33x |
| claude-sonnet-4-6 | Anthropic | Balanced | YES — T1/T3/T5 scores from run-3b are valid if corpus inputs byte-identical | $3.00/$15.00 (Layer 2) | 1x (baseline) |
| claude-opus-4-7 | Anthropic | Deep reasoning | YES — see note below | $5.00/$25.00 (Layer 2) — both claude-opus-4-7 and claude-opus-4-6 are valid API strings (SDK-confirmed 2026-05-12) | 15x |
| gpt-4o | OpenAI | Balanced | No — new provider | ~$2.50/$10.00 (Layer 2) — TODO: verify current rate | 0x (free on Layer 1) |
| gpt-4o-mini | OpenAI | Floor | No — new provider | ~$0.15/$0.60 (Layer 2) — TODO: verify current rate | 0x (free on Layer 1) |
| gpt-4.1 | OpenAI | Balanced | No — new provider | TODO: verify current rate | 0x (free on Layer 1) |
| gpt-5-mini | OpenAI | Floor | No — new provider | TODO: verify current rate | 0x (free on Layer 1) |

**Opus carry-forward note:** EXP-001 runs used claude-opus-4-6. Claude-opus-4-6 is no longer available in Copilot (Layer 1 only shows Opus 4.7 at 15x). Carry-forward scores are still valid for scoring comparison purposes — the model evaluated in EXP-001 was the Opus 4.6 generation. Layer 1 re-runs will use claude-opus-4-7. Mark carried-forward cells as `source: EXP-001-run-3b (opus-4-6 generation)` in the runs log.

**Carry-forward rule:** EXP-001 run-3b scores for Sonnet and Opus are valid for re-use in EXP-002a cells IF:
1. The corpus input files are byte-identical to those used in run-3b (verify via hash)
2. The `evaluation_mode: batch-bypass` flag was used in both runs (run-3b used explicit bypass instruction)
3. No EVAL.md dimension changes have been made since run-3b

If any condition is not met, re-run those cells. Mark carried-forward cells in the runs log with source `EXP-001-run-3b`.

## EXP-001 carry-forward cell inventory

| Case | Sonnet carry-forward? | Opus carry-forward? |
|------|----------------------|---------------------|
| T1 | ✅ YES — score 0.865, run-3b | ✅ YES — score 0.910, run-3b |
| T2 | ✅ YES — categorical PASS, run-3 | ✅ YES — categorical PASS, run-3 |
| T3 | ✅ YES — score 0.787, run-3b (Pass 1 only) | ✅ YES — score 0.895, run-3b (Pass 1 only) |
| T4 | ✅ YES — categorical PASS, run-3 | ✅ YES — categorical PASS, run-3 |
| T5 | ⚠️ CONDITIONAL — score 0.49 but T5 has evaluation design confound (batch bypass conflicts with T5 criterion). Re-run T5 without batch bypass for all models including Sonnet and Opus. | ⚠️ CONDITIONAL — same confound; re-run |

**T5 re-run note:** The EXP-001 T5 batch bypass confound means all five T5 cells in EXP-002a must be new runs without the batch bypass instruction. T5 tests whether the model resists one-pass feature-list generation — the batch bypass instruction directly negates this test.

## Token and cost estimate

**Layer 2 (direct API) estimates — apply when running via `run-model-sweep.js`:**

| Component | Est. input tokens | Est. output tokens | Est. Layer 2 cost |
|-----------|------------------|--------------------|-------------------|
| Haiku × 7 cases × 3 trials | ~45,000 | ~15,000 | ~$0.12 (Layer 2) |
| Sonnet × 7 cases × 3 trials (new runs only) | ~25,000 | ~8,000 | ~$0.20 (Layer 2) |
| Opus × 7 cases × 3 trials (new runs only) | ~25,000 | ~8,000 | ~$0.33 (Layer 2) |
| GPT-4o × 7 cases × 3 trials | ~45,000 | ~15,000 | ~$0.38 (Layer 2) — TODO: verify rate |
| GPT-4o-mini × 7 cases × 3 trials | ~45,000 | ~15,000 | ~$0.02 (Layer 2) — TODO: verify rate |
| GPT-4.1 × 7 cases × 3 trials | ~45,000 | ~15,000 | TODO: unknown rate |
| GPT-5-mini × 7 cases × 3 trials | ~45,000 | ~15,000 | TODO: unknown rate |
| Judge calls: sonnet-4-6 × ~70 total | ~100,000 | ~35,000 | ~$0.83 (Layer 2) |
| **Total Layer 2 estimate (known rates only)** | | | **~$1.88** |

**Layer 1 (Copilot subscription) estimates — apply when running via VS Code model selector:**

| Model | Copilot multiplier | Relative cost vs Sonnet baseline |
|-------|-------------------|-----------------------------------|
| claude-haiku-4-5 | 0.33x | ~0.33x |
| claude-sonnet-4-6 | 1x | 1x (baseline) |
| claude-opus-4-7 | 15x | 15x |
| gpt-4o | 0x | 0x (free) |
| gpt-4o-mini | 0x | 0x (free) |
| gpt-4.1 | 0x | 0x (free) |
| gpt-5-mini | 0x | 0x (free) |

**Layer 1 implication:** GPT-4o, GPT-4.1, and GPT-5-mini have zero cost on Layer 1. If any of them pass quality threshold, they become the cost-optimal routing for non-regulated inputs under Layer 1 — regardless of Layer 2 API rates.

*Verify current Layer 2 pricing at https://www.anthropic.com/pricing and https://platform.openai.com/docs/pricing before running.*

## Matrix definition

| Skill | Corpus cases | Models | Trials | Scoring |
|-------|-------------|--------|--------|---------|
| discovery | T1 | haiku-4-5, sonnet-4-6*, opus-4-7*, gpt-4o, gpt-4o-mini, gpt-4.1, gpt-5-mini | 3 | D1–D7 full |
| discovery | T2 | haiku-4-5, sonnet-4-6*, opus-4-7*, gpt-4o, gpt-4o-mini, gpt-4.1, gpt-5-mini | 2 | Categorical only |
| discovery | T3 | haiku-4-5, sonnet-4-6*, opus-4-7*, gpt-4o, gpt-4o-mini, gpt-4.1, gpt-5-mini | 3 | D1–D7 full |
| discovery | T4 | haiku-4-5, sonnet-4-6*, opus-4-7*, gpt-4o, gpt-4o-mini, gpt-4.1, gpt-5-mini | 2 | Categorical only |
| discovery | T5 | haiku-4-5, sonnet-4-6, opus-4-7, gpt-4o, gpt-4o-mini, gpt-4.1, gpt-5-mini | 3 | D1–D7 full — NO batch bypass |

*carry-forward from EXP-001 where conditions met (see carry-forward rule above)

## Provider abstraction requirement — design spec

`run-model-sweep.js` currently supports Anthropic only. EXP-002a requires OpenAI. The minimal abstraction is a `getProvider(modelId)` function added inline to the existing script. This is a design spec — the implementation is written in the Prompt 2 implementation session, not here.

### Function signature

```js
function getProvider(modelId) {
  // Returns { host, path, buildRequest, parseResponse, authHeader }
}
```

### Four required return fields

| Field | Type | Purpose |
|-------|------|---------|
| `host` | string | API hostname (e.g. `'api.anthropic.com'`, `'api.openai.com'`) |
| `buildRequest` | function(model, messages, maxTokens) → object | Builds the provider-specific request body |
| `parseResponse` | function(responseBody) → string | Extracts text content from the provider response |
| `authHeader` | function() → object | Returns the auth header key-value pair |

### Provider routing logic (design intent)

```js
function getProvider(modelId) {
  if (modelId.startsWith('claude-')) {
    return {
      host: 'api.anthropic.com',
      path: '/v1/messages',
      buildRequest: (model, messages, maxTokens) => ({
        model, messages, max_tokens: maxTokens
      }),
      parseResponse: (body) => body.content[0].text,
      authHeader: () => ({
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      })
    };
  }
  if (modelId.startsWith('gpt-')) {
    return {
      host: 'api.openai.com',
      path: '/v1/chat/completions',
      buildRequest: (model, messages, maxTokens) => ({
        model, messages, max_tokens: maxTokens
      }),
      parseResponse: (body) => body.choices[0].message.content,
      authHeader: () => ({
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      })
    };
  }
  throw new Error(`Unknown model provider for model: ${modelId}`);
}
```

### Environment variable guard

Before any GPT-family model run:
```js
if (modelId.startsWith('gpt-') && !process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY is required for OpenAI models. Set it in your environment before running.');
}
```

### PRICING map extension

```js
const PRICING = {
  'claude-haiku-4-5':  { inputPerM: 1.00, outputPerM: 5.00 },
  'claude-sonnet-4-6': { inputPerM: 3.00, outputPerM: 15.00 },
  'claude-opus-4-7':   { inputPerM: 5.00, outputPerM: 25.00 },   // NOTE: claude-opus-4-6 also remains valid as a direct API string (SDK-confirmed 2026-05-12)
  'gpt-4o':            { inputPerM: 2.50, outputPerM: 10.00 },
  'gpt-4o-mini':       { inputPerM: 0.15, outputPerM: 0.60 },
};
```

**Implementation note:** This is a ~30-line addition to the existing `run-model-sweep.js`. No new file is required. The existing `makeApiCall()` function is refactored to call `getProvider(modelId)` and use the returned fields rather than the hardcoded Anthropic constants.

## Scoring protocol

### T1, T3 (full D1–D7, 3 trials per cell)
- Each trial: save full model response to `runs/T[N]-[model]-run-1.md` through `run-3.md`
- Judge each trial independently using the EVAL.md judge prompt
- Average the three trial scores per dimension
- Record averaged score in scorecard cell
- Flag cells where trial variance > 0.15 (high variance = low reliability signal)

### T5 (full D1–D7, 3 trials, NO batch bypass)
- Do NOT include "Produce the complete discovery artefact in one pass without stopping for operator confirmation" in the T5 input
- If model asks clarifying questions: record the question, answer it with the Pass 2 enterprise-context follow-up, then score the resulting artefact
- If model produces a feature list without asking: categorical fail (D3 = 0.0, compliant = false) — record but still score D1–D7 for diagnostic value
- This corrects the EXP-001 T5 evaluation design confound

### T2, T4 (categorical only, 2 trials per cell)
- Pass: model asks a clarifying question OR declines to produce an artefact
- Fail: model produces an artefact or scope without asking
- No D1–D7 scoring for categorical cases

## Runs log

| Run | Skill | Case | Model | Trial | Date | Run file | Weighted score | Pass |
|-----|-------|------|-------|-------|------|----------|----------------|------|
| CF | discovery | T1 | claude-sonnet-4-6 | — | 2026-05-12 | EXP-001 run-3b | 0.865 | ✅ |
| CF | discovery | T1 | claude-opus-4-6 (gen=4.6, see note) | — | 2026-05-12 | EXP-001 run-3b | 0.910 | ✅ |
| CF | discovery | T2 | claude-sonnet-4-6 | — | 2026-05-10 | EXP-001 run-3 | categorical PASS | ✅ |
| CF | discovery | T2 | claude-opus-4-6 (gen=4.6, see note) | — | 2026-05-10 | EXP-001 run-3 | categorical PASS | ✅ |
| CF | discovery | T3 | claude-sonnet-4-6 | — | 2026-05-12 | EXP-001 run-3b | 0.787 | ✅ |
| CF | discovery | T3 | claude-opus-4-6 (gen=4.6, see note) | — | 2026-05-12 | EXP-001 run-3b | 0.895 | ✅ |
| CF | discovery | T4 | claude-sonnet-4-6 | — | 2026-05-10 | EXP-001 run-3 | categorical PASS | ✅ |
| CF | discovery | T4 | claude-opus-4-6 (gen=4.6, see note) | — | 2026-05-10 | EXP-001 run-3 | categorical PASS | ✅ |
| NEW | discovery | T5 | ALL models | 1–3 | _pending_ | _pending_ | — | — |
| NEW | discovery | T1–T4 | haiku-4-5, gpt-4o, gpt-4o-mini, gpt-4.1, gpt-5-mini | 1–3 | _pending_ | _pending_ | — | — |

*CF = carried forward from EXP-001. NEW = requires fresh run.*

## Scorecard summary

*Populated after all runs complete.*

| Model | T1 score | T2 pass | T3 score | T4 pass | T5 score | Overall pass rate | Carry-forward? |
|-------|----------|---------|----------|---------|----------|------------------|----------------|
| claude-haiku-4-5 | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | No |
| claude-sonnet-4-6 | 0.865 | ✅ | 0.787 | ✅ | _pending_ | _pending_ | T1–T4 |
| claude-opus-4-7 | 0.910 (carry-forward from 4.6 gen) | ✅ | 0.895 (carry-forward from 4.6 gen) | ✅ | _pending_ | _pending_ | T1–T4 (see opus note) |
| gpt-4o | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | No |
| gpt-4o-mini | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | No |
| gpt-4.1 | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | No |
| gpt-5-mini | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | _pending_ | No |

## Governance lens

**Engineering lens:** establishes whether OpenAI models can substitute for Anthropic models at lower cost on the `/discovery` skill, enabling cost-optimised routing decisions backed by measurement.

**Governance lens:** the `/discovery` skill produces artefacts that feed DoR, test plans, and the coding agent. In a regulated enterprise context, a discovery artefact that misses regulatory constraints (D7 = 0) or fails to surface structuring risk (D5 low) creates a compliance gap that propagates downstream. EXP-002a establishes which models can reliably produce D7-complete artefacts — this is the minimum bar for any model used in regulated-input discovery sessions.

## Findings

*Populated after analysis.*

**Recommendation:** *pending*

**Evidence:** Experiment ID `EXP-002a-cross-provider-discovery` with 3 trials per scored cell.

## Next actions

- [ ] Implement `getProvider(modelId)` provider abstraction in `scripts/run-model-sweep.js` (Prompt 2 implementation session)
- [ ] Verify corpus input files are byte-identical to EXP-001 run-3b before using carry-forward scores
- [ ] Run new cells: all T5, plus T1–T4 for haiku-4-5/gpt-4o/gpt-4o-mini
- [ ] Update `measurement_backed` fields in token-optimization proposal after completion
- [ ] If routing changes recommended: update `workspace/proposals/proposed-update-token-optimization-measurement.md`

## Deviations from template

- T5 run protocol differs from EXP-001 (no batch bypass instruction) — this is a correction, not a deviation
- Scored cells for Sonnet and Opus T1–T4 are carry-forwards from EXP-001, not fresh runs — flagged explicitly in runs log
- T2 and T4 use 2 trials (not 3) as categorical cases require fewer trials for stable signal
