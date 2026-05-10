# Discovery: Model Evaluation Capability for the Skills Platform

<!--
  USAGE: Produced by the /discovery skill. The structured outcome of early exploration —
  what problem we're solving, for whom, and what success looks like at the edges.

  Status must be "Approved" before /benefit-metric can proceed.
  MVP scope and out-of-scope fields are the primary review targets.
-->

**Status:** Draft — awaiting approval
**Created:** 2026-05-10
**Approved by:** Pending
**Author:** Copilot (/discovery)

---

## Problem Statement

The skills platform makes model routing decisions — which Claude model handles which skill tier — based on convention and intuition, not measurement. There is no rubric defining what "good output" looks like for any skill, no corpus of test inputs, and no automated harness to sweep models against tasks and produce a quality-per-dollar comparison.

When a new model is released or pricing changes, the platform operator cannot quantify the tradeoff. The `token-optimization` SKILL and the `context.yml` model routing policy pre-date any systematic measurement. The practical cost: model routing decisions that feel reasonable may be either over-spending (using Opus-class models where Sonnet suffices) or under-serving (using Sonnet where Opus materially improves output quality for gated skills). There is no mechanism to know which.

The gap is structural: no `EVAL.md` rubric files exist in any skill directory, no `corpus/` of test inputs exists, the experiment scaffolding (`workspace/experiments/`) has an EXP-001 manifest that was defined but never executed, and there is no sweep harness SKILL. Anthropic's `rightmodel` workshop (`github.com/anthropics/cwc-workshops/rightmodel/`) provides a reference pattern for this capability, but it has not been adapted to this repo's conventions.

---

## Who It Affects

**Platform maintainer (primary):** Owns the skill library and model routing policy. Currently makes routing decisions without measurement evidence. Cannot verify that a new model release improves or degrades output quality on governed skill tasks. Bears the reputational risk of a policy that is stated with confidence but backed by no data.

**Tech lead / squad lead (secondary):** Trusts that the model assigned to each skill tier is appropriate for the governance function. Has no way to verify. Would benefit from knowing that gate skill outputs (DoR, review) have been verified to produce correct structured judgements across model variants.

**The improvement loop itself (secondary):** `/improve` extracts learnings from delivery signal but has no pathway to evaluate whether the delivery machinery (model + prompt) is performing well. A model evaluation capability closes this loop — bad model choices become visible before they compound into delivery debt.

---

## Why Now

Three triggers align:

1. **New models with different capability/cost profiles** — Claude Sonnet 4.6 and Opus 4.6 are now the active models. The platform's routing policy was written for earlier generations. No measurement exists to confirm the routing is still appropriate.

2. **Reference implementation available** — Anthropic's `rightmodel` workshop provides a working SKILL pattern for model sweeps: discover eval files, load dimensions and test cases, sweep models × parameters, score with a judge, compute quality-per-dollar. Adapting an existing pattern is substantially less expensive than designing from scratch.

3. **Experiment scaffolding exists but is stalled** — EXP-001 has a manifest but was never run. The infrastructure to record and compare runs exists; what's missing is the rubric layer (EVAL.md) and the sweep harness. The EXP-001 stall signals that the current approach (manually-instrumented capture blocks) is insufficient — a more structured sweep mechanism is needed.

---

## MVP Scope

The minimum viable set that produces a working model sweep with a quality-per-dollar scorecard:

1. **`EVAL.md` for `/discovery`** — grading dimensions derived from the actual `/discovery` SKILL.md (not invented), 3–5 test cases with inputs from existing artefacts, a judge prompt returning structured JSON scores, and a pass threshold.

2. **`EVAL.md` for one gate skill** — either `/review` or `/definition-of-ready` (whichever has richer measurable criteria), same structure as above. Gate skills weight correctness more heavily than generative skills.

3. **`/model-sweep` SKILL** — a SKILL.md at `.github/skills/model-sweep/SKILL.md` that: reads `context.yml` for the active routing policy, discovers all skills with an `EVAL.md` dynamically, builds a sweep matrix (models × inference parameters), runs each cell against each test case, scores with claude-sonnet-4-6 as judge, computes quality-per-dollar, and commits a scorecard to `workspace/experiments/EXP-XXX-model-sweep-[date]/` in the existing EXP-xxx manifest format.

4. **`EXP-TEMPLATE-model-sweep.md`** — a reusable experiment manifest template for sweep experiments, backward-compatible with the existing EXP-001 format but extended with sweep-specific fields (matrix definition, per-cell results, scorecard summary).

5. **Workspace proposal for `token-optimization`** — a governed proposal at `workspace/proposals/proposed-update-token-optimization-measurement.md` to tag model routing tiers as `measurement-backed: false` until a sweep has been run, with a pathway to flip to `measurement-backed: true` referencing the experiment artefact.

6. **`rightmodel` integration summary** — a written record at `workspace/experiments/rightmodel-integration-summary.md` documenting what was built, the gap analysis findings, the fit assessment, and open questions.

---

## Out of Scope

- **All skills other than `/discovery` and one gate skill in the initial EVAL.md set** — adding EVAL.md files for every skill is a Phase 2 activity; the MVP proves the pattern on two representative skills and defers the rest.

- **CI integration of sweep results** — connecting sweep scorecard to the governance gate (e.g. blocking a PR if model quality drops below threshold) is a subsequent capability; the MVP scorecard is informational only.

- **Multi-repo sweeping** — sweeping across consuming team repositories rather than just the platform repo is out of scope; the sweep harness runs against this repo's own skills only.

- **Human review workflow for scorecard approval** — the scorecard is produced and committed; no approval gate or pull-request flow is required in MVP. A human reads it and acts on it.

- **Direct edits to any existing SKILL.md** — per platform constraint 4 (human approval gate non-negotiable for instruction set changes), all proposed changes to existing skills go through `workspace/proposals/`, not direct file edits.

- **Corpus/` directories with large input sets** — the MVP defines test cases inline in each EVAL.md or with minimal corpus files; a full `corpus/` directory structure with versioned inputs is a follow-on.

---

## Assumptions and Risks

**Assumptions:**
- The `rightmodel` workshop's SKILL pattern is compatible enough with this repo's SKILL.md conventions to adapt rather than rebuild from scratch. If the workshop uses patterns incompatible with how Claude Code reads SKILL files, adaptation time increases.
- Claude Sonnet 4.6 is an acceptable judge model — cost-efficient, sufficient quality. There is an inherent self-preference bias risk when Sonnet scores Sonnet outputs against Opus outputs; this is acknowledged and accepted at MVP scope.
- Existing artefacts in `artefacts/` are diverse enough to seed 3–5 representative test cases per EVAL.md without manufacturing synthetic inputs.
- EXP-001's stall is a rubric/harness gap, not an infrastructure gap — the `workspace/experiments/` directory structure and manifest format are sound and can be extended.
- Current Anthropic pricing: Sonnet 4.6 at $3/$15 per million tokens (input/output), Opus 4.6 at $15/$75 per million tokens. These must be verified via web search before hardcoding in the sweep SKILL — pricing changes between release cycles.

**Risks:**
- A poorly-designed EVAL.md rubric produces misleading quality-per-dollar scores. Mitigation: dimensions must be derived from SKILL.md content, not invented; a review step before running the sweep is recommended.
- The sweep SKILL's judge loop may produce inconsistent scores across runs (LLM non-determinism). Mitigation: fixed temperature settings, multiple-run averaging noted as a follow-on improvement.
- rightmodel's reference SKILL may assume Claude Code tool access patterns that differ from this repo's agent execution environment. Mitigation: read the rightmodel SKILL before building; note all adaptation decisions explicitly.

---

## Directional Success Indicators

- A platform maintainer can invoke the model sweep by saying "run a model sweep" in Claude Code agent mode with no additional configuration — the SKILL discovers EVAL.md files, builds the matrix, and runs it.
- After the first sweep run, a scorecard exists in `workspace/experiments/` that shows quality scores and cost-per-quality for at least two models on at least one skill.
- The `token-optimization` model routing policy tiers are explicitly tagged with a `measurement-backed` flag, creating a named link between policy and evidence.
- The `/improve` loop gains a clear pathway: when a model is changed or a new model is released, the operator runs the sweep → reviews the scorecard → updates the routing policy proposal if warranted.
- At least one finding from the gap analysis (e.g. "Opus materially outperforms Sonnet on DoR correctness" or "Sonnet is sufficient for discovery generative tasks") is captured as a concrete recommendation.

---

## Constraints

- **Judge model:** claude-sonnet-4-6 only — cost constraint. claude-opus-4-6 is used only as a cell in the sweep matrix being evaluated, never as judge.
- **No direct SKILL.md edits:** All proposed changes to existing SKILL.md files go through `workspace/proposals/` per platform constraint 4 (human approval gate required for instruction set changes).
- **Sweep must run in Claude Code agent mode** — no external dependencies beyond the Anthropic API and standard file operations (no npm packages, no Python dependencies, no shell scripts not already in the repo).
- **Artefact naming conventions:** timestamped feature slug `YYYY-MM-DD-{slug}`, working files in `workspace/`, skill files in `.github/skills/`.
- **Pricing:** Sonnet 4.6 at $3/$15/M tokens, Opus 4.6 at $15/$75/M tokens — verify current pricing via Anthropic pricing page before hardcoding in sweep SKILL.
- **EXP-001 format compatibility:** new experiment manifests must be backward-compatible with the format defined in `workspace/experiments/README.md`.

---

## Architecture / Technical Context

**Current state:**
- `workspace/experiments/EXP-001-discovery-phase4-5/manifest.md` — defined but never run (run 1 still shows `_pending_`)
- `workspace/experiments/README.md` — experiment manifest format defined; three-way consistency rule documented
- No `EVAL.md` files exist anywhere under `.github/skills/`
- No `corpus/` directories exist under any skill directory
- `workspace/experiment-sonnet-vs-opus-phase4.md` — ad-hoc comparison notes (not structured sweeps)
- `.github/skills/token-optimization/SKILL.md` — model routing policy exists but is convention-based, not measurement-backed

**rightmodel reference** (`github.com/anthropics/cwc-workshops/rightmodel/`): A SKILL.md that, when invoked in Claude Code, reads an eval suite, sweeps models × inference parameters, scores outputs with a judge, and produces a quality-per-dollar scorecard. This is the primary reference implementation to adapt.

**No EA registry blast-radius data** — this feature does not touch any system registered in an EA registry (EA registry authoritative: not configured). No blast-radius check required.

---

## Clarification Answers (2026-05-10)

These answers were resolved during the build session and are recorded here for future traceability.

**Q: What is the execution model for the sweep? Can Claude orchestrate its own evaluation?**

A: **Option C + B** — two layers. Option A (same model orchestrates its own evaluation) was rejected as it cannot produce meaningful model comparison data.

- **Layer 1 (semi-manual, operator runbook):** The operator opens corpus cases from `.github/skills/[skill]/corpus/`, invokes the skill in VS Code Copilot Chat with each case's "Operator input" section, switches the model via the VS Code model selector, and saves outputs. The operator then runs the judge prompt from `EVAL.md` to score each output. Time: ~30–60 minutes per skill × 2 models. Cost: $0 (Copilot subscription, not pay-per-token). Runbook: `.github/skills/model-sweep/SKILL.md` Layer 1 section.

- **Layer 2 (programmatic, API-direct):** `scripts/run-model-sweep.js` calls the Anthropic API directly (`ANTHROPIC_API_KEY` environment variable required). Dynamically discovers all `.github/skills/*/EVAL.md` files and corpus cases. Runs the sweep matrix and judges outputs programmatically. Estimated cost: ~$9 per full two-model sweep. Usage: `node scripts/run-model-sweep.js --experiment EXP-XXX`.

**Q: Which experiment should be the pilot run for Layer 1?**

A: **EXP-001** (`workspace/experiments/EXP-001-discovery-phase4-5/manifest.md`) is the designated pilot. It has been a stub since 2026-04-19 — now that corpus cases (T1–T5) and a judge prompt (`discovery/EVAL.md`) exist, EXP-001 can be executed. The operator should: update `context.yml` `instrumentation.experiment_id` to `EXP-001-discovery-phase4-5`, run Layer 1 against T1–T5 with Sonnet 4.6 and one other model, record scores in the manifest, and use the result to drive the first measurement-backed routing recommendation.

**Q: Is context.yml stale and does it block anything?**

A: `context.yml` currently shows `experiment_id: "exp-phase4-sonnet-vs-opus-20260419"` and `model_label: "claude-sonnet-4-6"` — set during Phase 4 (April 2026) and never updated. This is a **low-priority cleanup item, not a blocker.** Model selection is always an operator action (VS Code model selector); the `model_label` field in context.yml is a telemetry label only, not a routing mechanism. Action required when starting EXP-001: operator updates `context.yml.instrumentation.experiment_id` to `EXP-001-discovery-phase4-5` to satisfy the three-way consistency rule.

---

## Contributors

- Hamish King — Platform operator / initiator (email brief, 2026-05-10)
- Copilot (/discovery) — Artefact author (2026-05-10)

## Reviewers

- Pending

## Approved By

Pending

---

**Next step:** Human review and approval → /benefit-metric
