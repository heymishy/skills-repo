# Model Evaluation

## What it is

The model evaluation primitive is the framework for empirically measuring skill output quality across model choices. It consists of three components: **corpus cases** (representative inputs), **EVAL.md specs** (evaluation rubrics), and **sweep tooling** (the harness that runs a model against the corpus and scores the results). Together they answer the question: for a given skill, which model produces the best output, and where do gaps remain?

This is distinct from the [eval suite](eval-suite.md), which guards harness behaviour with regression scenarios. The model evaluation primitive measures skill output quality — the quality of the artefacts the platform produces, not the correctness of the platform's own checks.

## Why it exists

Without empirical measurement, model routing decisions are based on anecdote, cost, or familiarity. A team that defaults to the cheapest model may be accepting a significant quality gap on high-stakes skill outputs (discovery, DoR, test plans) without knowing it. A team that always uses the largest model may be paying for capability it does not need on straightforward steps.

The model evaluation primitive makes quality visible. It establishes a baseline for each skill × model combination, identifies which dimensions and tier levels expose gaps, and feeds the improvement cycle with structured signals.

## How it works

**Corpus cases** live in `.github/skills/[skill-name]/corpus/`. Each case is a numbered markdown file (T1–T5 by convention) with a self-contained input scenario. The tiers span the skill's operational range:

- **T1** — basic, well-scoped input. Tests that the model can produce a structurally complete artefact given a clear problem statement.
- **T3** — realistic complexity. Tests structural completeness against a case with domain context, partial ambiguity, and multiple stakeholders.
- **T5** — adversarial or deceptively simple. Tests whether the model proactively identifies hidden constraints, surface-level simplicity masking hard requirements, or missing context that a skilled practitioner would flag.

**EVAL.md specs** live alongside the corpus in each skill directory. Each EVAL.md defines the evaluation rubric for that skill: the scoring dimensions (D1–D7 for discovery, for example), calibration scores for each dimension, a judge prompt used to evaluate the model's output, and the pass threshold (default 0.70 per dimension). Calibration scores anchor the judge and reduce scoring variance across runs.

**Sweep tooling** runs at two layers:

- **Layer 1 (manual):** The operator selects a model in the VS Code model picker, runs the skill against each corpus case using the evaluation prompt prefix, and scores the output using the EVAL.md judge prompt. Documented in [`/model-sweep` skill](../../../.github/skills/model-sweep/SKILL.md).
- **Layer 2 (programmatic):** `scripts/run-model-sweep.js` reads `evaluation:` config from `context.yml` (mode, judge_model, output_path), calls the Anthropic API directly via `getProvider()`, and writes per-case `eval-run-result.json` files under `workspace/experiments/[experiment-id]/results/`. Provider abstraction supports Anthropic, OpenAI-compatible, and local endpoints.

**Improvement agent integration:** `src/improvement-agent/experiment-signals.js` scans experiment result directories for any dimension scoring below 0.70 across 2+ independent runs and emits structured signals. These signals enter the same improvement cycle as delivery trace signals — the agent can propose a SKILL.md update targeting the low-scoring dimension.

**Eval mode guard:** Any artefact file containing `<!-- eval-mode: true -->` is rejected by the trace validation script. Evaluation runs must not contaminate the production artefact store.

## EXP-001 — `/discovery` skill baseline (2026-05-10)

The first experiment evaluated Claude Sonnet 4.6 and Opus 4.6 against the 5 discovery corpus cases (T1–T5, financial services domain).

| Tier | Sonnet 4.6 | Opus 4.6 | Pass threshold |
|------|-----------|---------|----------------|
| T1 (basic framing) | 0.865 | 0.910 | 0.70 ✅ both |
| T3 (structural completeness) | 0.787 | 0.895 | 0.70 ✅ both |
| T5 (hidden constraints) | 0.490 | 0.562 | 0.70 ⚠️ both below |

Key finding: the T5 failure is not a model capability gap. Both models correctly identify the hidden constraints when prompted directly. The primary variable is the skill's section-by-section confirmation gate — which prevents the model from producing a complete, scoreable artefact in a single pass. The recommendation from EXP-001 is to add a first-class `--eval` mode to the discovery skill that bypasses confirmation gates, rather than working around the gate at the corpus level.

EXP-002b evaluated Opus 4.6 on the hidden-constraint dimension in isolation. Maximum T5 score: 0.562 — still below threshold, confirming the gate hypothesis.

EXP-003 (end-to-end pipeline evaluation) is pending.

## What you do with it

To run a Layer 1 manual sweep: open the target skill, switch the VS Code model to your target, run the corpus cases one by one using the evaluation mode prefix, and score each with the EVAL.md judge prompt. Record results in `workspace/experiments/[experiment-id]/`.

To run a Layer 2 programmatic sweep: set `evaluation.mode: true` in `context.yml`, set your Anthropic API key in `ANTHROPIC_API_KEY`, and run `node scripts/run-model-sweep.js --skill [skill-name]`. Results are written to `workspace/experiments/[experiment-id]/results/`.

When the improvement agent surfaces a proposal flagged as sourced from experiment signals, review the low-scoring dimension evidence before approving or rejecting the proposal.

## Further reading

Optional further reading: [Eval suite](eval-suite.md) — the regression suite primitive (distinct from model evaluation).
Optional further reading: [Self-improving harness](../principles/self-improving-harness.md) — how model evaluation signals feed the improvement cycle.
External reference: [`artefacts/2026-05-10-model-evaluation-capability/`](../../../artefacts/2026-05-10-model-evaluation-capability/discovery.md) — discovery and benefit-metric artefacts for the model evaluation capability feature.
