# EXP-022 — OpenAI Format-Neutral Discovery

## Experiment metadata

| Field | Value |
|-------|-------|
| experiment_id | EXP-022-openai-format-neutral |
| experiment_type | model-sweep (format-neutral variant) |
| created | 2026-06-13 |
| operator | Hamish King |
| status | pending |
| motivation | GPT models scored 0/32 pass in EXP-011 using the Claude-specific SKILL.md. Judge notes cite D4 and D5 failures consistent with prompt format mismatch. At 0x Layer 1 (GitHub Copilot) cost, any positive pass rate changes the routing frontier for non-regulated discovery. |

## Background

EXP-011 and EXP-012 tested GPT-4.x and GPT-5.4 models on /discovery using the same SKILL.md as Claude models. Results:
- gpt-4.1: avg 0.419, 1/32 pass, $0.513/passing trial
- gpt-5.4: avg 0.480, 4/32 pass (13%), $0.516/passing trial
- gpt-4o, gpt-4o-mini: 0/32 pass

The key open question: is the failure caused by format incompatibility (Claude-specific output structure expectations, persona-driven instructions, "I will" vs "The model will" framing) or by fundamental capability gaps on D4 (out-of-scope discipline) and D5 (assumption quality)?

EXP-011 scorecard cited D4/D5/D7 collapse. However, these dimensions are calibrated against Claude-style outputs. A GPT model that produces a structurally different but semantically equivalent discovery artefact might score well under a format-neutral rubric or prompt.

**Layer 1 cost implication:** GPT models are 0x under GitHub Copilot AI Credits — free to run in Layer 1 mode. If any GPT model achieves pass rate >0 on T-easy cases with a format-neutral prompt, it becomes the cost frontier for Layer 1 non-regulated discovery. This is a significant commercial implication — every pilot project that runs discovery via VS Code Copilot would default to GPT at zero incremental cost.

---

## Prerequisite: SKILL-format-neutral.md

**Required before this experiment runs:** Create `.github/skills/discovery/SKILL-format-neutral.md`.

This file must:
1. Remove Claude-specific framing ("I will...", "As the discovery facilitator, I...") → neutral third-person or procedural framing
2. Remove output structure instructions that assume Claude's default formatting conventions (e.g., `##` heading styles hardcoded)
3. Preserve the D1-D7 rubric requirements (problem framing, persona specificity, MVP bounding, out-of-scope discipline, assumption quality, success observability, constraint completeness) — these are content requirements, not format requirements
4. Preserve the clarification protocol gates (T2/T4 hard gate: no artefact before clarifying question)
5. Use provider-neutral instruction phrasing
6. Document which SKILL.md sections were changed and why, as a comment at the top of the file

**Prerequisite validation:** Before running EXP-022, manually review a dry-run output from each GPT model on S1 to confirm the format-neutral SKILL.md is being read correctly and the model is not reverting to its default behaviours.

**If SKILL-format-neutral.md is not ready when this experiment is due to run:** Do not run EXP-022. Log as blocked in the manifest. The prerequisite cannot be skipped — running with the current SKILL.md would replicate EXP-011/012 findings without new information.

---

## Hypotheses

**H1 — Format was the constraint (positive)**

At least one GPT model achieves pass rate >0 on T-easy cases (S1, S3, S5) under the format-neutral prompt. This indicates format compatibility was a meaningful barrier in EXP-011/012.

*Falsification: If all GPT models score 0/n pass on S1/S3/S5, format is not the constraint. The D4/D5/D7 failure pattern in EXP-011 is a fundamental capability gap, not a prompt engineering artefact.*

**H2 — gpt-5.4-mini is viable at T-easy**

gpt-5.4-mini achieves weighted score ≥ 0.70 on ≥ 1 of {S1, S3, S5} under format-neutral prompt. At $0.75/$4.50 per M tokens, this would place gpt-5.4-mini at ~$0.008/run — comparable to gpt-4.1 pricing with better architecture.

**H3 — gpt-4.1 shows improved D4/D5 under format-neutral**

gpt-4.1's D4 (out-of-scope discipline) and D5 (assumption quality) scores improve measurably vs EXP-011 baseline. Even without reaching pass threshold, a D4/D5 improvement confirms format is a partial contributor.

---

## Sweep configuration

| Field | Value |
|-------|-------|
| layer | 2 (programmatic) |
| trigger | Cost-performance frontier analysis — closes 0x Layer 1 routing gap |
| skills_swept | discovery (format-neutral variant) |
| models_compared | gpt-4.1, gpt-5.4, gpt-5.4-mini |
| trials_per_cell | 2 |
| judge_model | claude-sonnet-4-6 |
| corpus_cases | S1, S3, S5, S8 |
| context_files | none |
| max_tokens | 4096 (GPT models — standard; adjust if truncation observed) |
| batch_mode | true |
| skill_file_override | .github/skills/discovery/SKILL-format-neutral.md |

Total cells: 4 cases × 3 models × 2 trials = **24 generation runs + 24 judge calls = 48 API calls**

**Case selection rationale:**
- S1 (easy): baseline case; any competent model should pass
- S3 (easy-medium): introduces stakeholder persona requirement (D2)
- S5 (medium): introduces constraint complexity (D7)
- S8 (medium-hard): tests D4 out-of-scope discipline under competing requirements pressure

S-hard cases (S9-S13) are excluded from this initial format-neutral validation. If H1 is confirmed on S1-S8, a follow-up sweep on S-hard with format-neutral prompt can be designed.

---

## Run command

```bash
node scripts/run-model-sweep.js \
  --experiment EXP-022-openai-format-neutral \
  --skills discovery \
  --models gpt-4.1,gpt-5.4,gpt-5.4-mini \
  --cases S1,S3,S5,S8 \
  --trials 2 \
  --batch
```

**Note:** The `--skill-file` flag or equivalent is required to point to `SKILL-format-neutral.md` instead of `SKILL.md`. If the sweep script does not support a skill-file override flag, add it before running this experiment. Alternatively, swap `SKILL.md` and `SKILL-format-neutral.md` temporarily (document the swap in the runs log). Do NOT permanently replace `SKILL.md` — Claude routing must remain on the original.

---

## Cost estimate

*Input token estimate: ~3,000 tokens per GPT run (SKILL-format-neutral.md ~1,500 tokens + corpus case ~600 tokens + system overhead ~900 tokens).*
*Output token estimate: ~1,500 tokens per run (expected; GPT models tend to be more concise than Claude on structured output).*

| Component | Runs | Est. input tokens | Est. output tokens | Est. cost |
|-----------|------|------------------|--------------------|-----------|
| gpt-4.1 generation × 8 cells | 8 | ~24,000 | ~12,000 | **~$0.144** |
| gpt-5.4 generation × 8 cells | 8 | ~24,000 | ~12,000 | **~$0.240** |
| gpt-5.4-mini generation × 8 cells | 8 | ~24,000 | ~12,000 | **~$0.072** |
| Judge (Sonnet) × 24 cells | 24 | ~120,000 | ~12,000 | **~$0.540** |
| **Total** | | | | **~$1.00** |

*Cost ceiling: $2 USD. Estimate $1.00 — within ceiling. Actual cost may vary based on GPT output token counts.*

*Layer 1 cost: 0x AI Credits for all GPT generation runs. Judge calls are Sonnet at 1× — these are programmatic eval calls, not tracked under Layer 1.*

---

## Matrix definition

| Skill | Case | Model | Format | Trials |
|-------|------|-------|--------|--------|
| discovery | S1 | gpt-4.1 | format-neutral | 2 |
| discovery | S1 | gpt-5.4 | format-neutral | 2 |
| discovery | S1 | gpt-5.4-mini | format-neutral | 2 |
| discovery | S3 | gpt-4.1 | format-neutral | 2 |
| discovery | S3 | gpt-5.4 | format-neutral | 2 |
| discovery | S3 | gpt-5.4-mini | format-neutral | 2 |
| discovery | S5 | gpt-4.1 | format-neutral | 2 |
| discovery | S5 | gpt-5.4 | format-neutral | 2 |
| discovery | S5 | gpt-5.4-mini | format-neutral | 2 |
| discovery | S8 | gpt-4.1 | format-neutral | 2 |
| discovery | S8 | gpt-5.4 | format-neutral | 2 |
| discovery | S8 | gpt-5.4-mini | format-neutral | 2 |

---

## Scorecard comparison plan

Primary comparison: EXP-022 GPT format-neutral vs EXP-011/012 GPT with Claude SKILL.md.

| Model | Case | EXP-011/012 avg | EXP-022 avg | Delta | Pass? |
|-------|------|-----------------|-------------|-------|-------|
| gpt-4.1 | S1 | — | TBD | TBD | TBD |
| gpt-4.1 | S3 | — | TBD | TBD | TBD |
| gpt-4.1 | S5 | — | TBD | TBD | TBD |
| gpt-4.1 | S8 | — | TBD | TBD | TBD |
| gpt-5.4 | S1 | — | TBD | TBD | TBD |
| gpt-5.4 | S3 | — | TBD | TBD | TBD |
| gpt-5.4 | S5 | — | TBD | TBD | TBD |
| gpt-5.4 | S8 | — | TBD | TBD | TBD |
| gpt-5.4-mini | S1 | (untested) | TBD | — | TBD |
| gpt-5.4-mini | S3 | (untested) | TBD | — | TBD |
| gpt-5.4-mini | S5 | (untested) | TBD | — | TBD |
| gpt-5.4-mini | S8 | (untested) | TBD | — | TBD |

**Per-dimension comparison (D4/D5/D7 focus):**
EXP-011/012 identified D4 out-of-scope discipline and D5 assumption quality as the primary failure dimensions. Report per-dimension scores for each EXP-022 cell and compare to EXP-011/012 averages for the same models on the same cases (where available). If D4/D5 improve but D7 (constraint completeness) remains low, the format-neutral prompt fixed the structural issue but not the knowledge gap.

---

## Pass criteria and routing implications

**H1 confirmed (any GPT model passes S1 or S3):**
- Update `routing-policy-framework.md` Multi-provider routing section
- Add row for confirmed GPT model under `/discovery (non-regulated, Layer 1, T-easy)`
- Add note: format-neutral SKILL.md required (cite EXP-022 experiment_id)
- Schedule EXP-022b: expand to S5-S8 and S-hard cases if S1/S3 pass

**H1 falsified (all GPT models 0 pass on all cases):**
- Confirm in routing policy: GPT models remain unapproved for /discovery regardless of SKILL.md format
- Note: D4/D5/D7 failure is a capability gap, not a format artefact
- No further GPT discovery experiments warranted unless new architectural changes (e.g., GPT-6)

---

## Deviations from template

- **Format-neutral SKILL.md prerequisite**: This experiment cannot run until `SKILL-format-neutral.md` exists. Standard experiments use the canonical SKILL.md. Blocked status must be logged if prerequisite not met.
- **No Claude model control**: No Claude baseline included in this sweep. Compare against EXP-011/012 (historical baseline) and, if needed, EXP-021 Haiku (S1-S8 cases) for within-corpus-date comparison.
- **Provider mismatch**: Judge is claude-sonnet-4-6 evaluating GPT outputs. This is the canonical judge configuration. If GPT outputs use structurally different section conventions than Claude, the judge may penalise format. This is intentional — the rubric evaluates output quality, not format preference. If judge notes show format-only penalisation, flag in scorecard findings.
- **gpt-5.4-mini**: New model, not tested in EXP-011/012. No historical comparison for this model.
- **S-hard excluded**: This experiment focuses on format validation, not capability limits. S-hard cases (S9-S13) require regulated constraint reasoning — if format was not the constraint there, the finding would be confounded by domain knowledge gaps. Extend to S-hard only after H1 confirmation.
