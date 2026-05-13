# rightmodel Integration Summary

**Date:** 2026-05-10
**Author:** Copilot (session — model-evaluation-capability discovery)
**Related discovery:** `artefacts/2026-05-10-model-evaluation-capability/discovery.md`

---

## What was built

This session delivered the foundational layer of a systematic model evaluation capability for the skills platform. The following files were created:

| File | Purpose |
|------|---------|
| `.github/skills/discovery/corpus/T1-well-formed-input.md` | Corpus: green path — well-formed discovery input |
| `.github/skills/discovery/corpus/T2-vague-input-clarification.md` | Corpus: vague input — model must ask, not fabricate |
| `.github/skills/discovery/corpus/T3-solution-masquerades-as-problem.md` | Corpus: solution-framed input — model must reframe |
| `.github/skills/discovery/corpus/T4-scope-too-wide.md` | Corpus: unbounded MVP — model must bound scope |
| `.github/skills/discovery/corpus/T5-hidden-constraints.md` | Corpus: good input with hidden constraints to surface |
| `.github/skills/discovery/EVAL.md` | Evaluation spec for /discovery (7 dimensions, calibrated) |
| `.github/skills/definition-of-ready/EVAL.md` | Evaluation spec for /definition-of-ready (6 dimensions, gate-skill thresholds) |
| `.github/skills/model-sweep/SKILL.md` | Operator runbook (Layer 1) + script documentation (Layer 2) |
| `scripts/run-model-sweep.js` | Programmatic sweep script (Node.js, Anthropic API) |
| `workspace/experiments/EXP-TEMPLATE-model-sweep.md` | Manifest template for sweep experiments |
| `workspace/proposals/proposed-update-token-optimization-measurement.md` | Proposal to add measurement-backed field to token-optimization |

**NOT built (out of scope for this session):**
- Corpus cases for `/definition-of-ready` — requires full story+test-plan+review-report bundles; deferred to first sweep run (EXP-002)
- EVAL.md files for other skills — discovery and DoR are the first two; others follow as needed
- Execution of any sweep — the infrastructure is built; EXP-001 remains the pilot run

---

## Gap analysis findings

### Gap 1 — No EVAL.md files existed anywhere (critical gap)
**Status before:** Zero. No skill had a formal evaluation specification. The `/token-optimization` SKILL.md defined model routing tiers ("deep reasoning", "standard", "mechanical") with no measurement to back them.
**Status after:** EVAL.md files exist for `/discovery` and `/definition-of-ready`. Infrastructure is in place for others.

### Gap 2 — EXP-001 was a stub, never executed (high risk)
**Status before:** `workspace/experiments/EXP-001-discovery-phase4-5/manifest.md` was created on 2026-04-19. Run 1 shows `_pending_`. No outputs, no scores, no learnings in the 3 weeks since creation.
**Status after:** EXP-001 is still pending but now has corpus cases (T1–T5) and a judge prompt (in `discovery/EVAL.md`) to run against. EXP-001 becomes the natural pilot for Layer 1 (operator runbook).
**Recommended action:** Run Layer 1 (semi-manual via VS Code model selector) against T1–T5 for Sonnet 4.6 and one other model. Update the manifest with run dates and scores.

### Gap 3 — No runnable harness (architectural constraint)
**Status before:** Skills are SKILL.md prompt instruction sets — not callable functions. `rightmodel` assumes an existing eval harness with a `run_eval()` entry point. This repo has none.
**Status after:** The gap is resolved via two-layer execution model:
- Layer 1: VS Code Copilot model selector (operator-controlled, subscription-funded, no API key)
- Layer 2: `scripts/run-model-sweep.js` (direct Anthropic API, ANTHROPIC_API_KEY required)

### Gap 4 — context.yml is stale (low priority cleanup)
**Status before:** `context.yml` shows `experiment_id: "exp-phase4-sonnet-vs-opus-20260419"` and `model_label: "claude-sonnet-4-6"`. This was set during Phase 4 (April 2026) and was never updated.
**Status after:** Not changed. Document as cleanup item only. The three-way consistency rule (experiment_id must match directory name + context.yml + capture blocks) requires the operator to update context.yml when starting a new experiment. This is an operator action — the model selector in VS Code is what actually controls model routing.
**Recommended action:** When running EXP-001 pilot, update `context.yml.instrumentation.experiment_id` to `EXP-001-discovery-phase4-5` to match the manifest directory name.

---

## rightmodel fit assessment

**Reference:** `anthropics/cwc-workshops/rightmodel/.claude/skills/eval-audit-and-sweep/SKILL.md` + `references/audit.md` + `references/sweep.md`

### What fits
- **Phase 2 sweep grid:** The rightmodel sweep grid (model × thinking × effort, 3 trials averaged, per-cell metrics: pass_rate, cost_per_task, cost_per_success) maps cleanly to this repo's matrix. `scripts/run-model-sweep.js` implements the same structure.
- **Judge bias documentation:** rightmodel documents position bias, verbosity bias, and self-preference (Sonnet judging Sonnet). The fixed judge model (claude-sonnet-4-6 as canonical judge) addresses self-preference. Position bias should be addressed in future corpus case ordering.
- **Metric framing:** rightmodel's `cost_per_success` framing is more useful than raw pass_rate — a model that passes 8/10 at $0.10/run beats one that passes 9/10 at $1.00/run. The scorecard template includes estimated cost; full `cost_per_success` calculation is a Layer 2 enhancement.

### What does not fit
- **Phase 1 eval health audit:** rightmodel's Phase 1 assumes an existing eval harness with structured pass/fail output. This repo has no such harness — skills produce free-text artefacts, not programmatic outputs. The EVAL.md judge prompt approach replaces Phase 1.
- **Thinking parameter sweep:** rightmodel sweeps `thinking: [off, adaptive]` and `effort: [low, medium, high]`. These are Anthropic API parameters. Layer 2 (run-model-sweep.js) could expose `--thinking` and `--effort` flags in a future iteration; not in the current build.
- **"rightmodel ships no runnable code"** (confirmed): Every snippet in rightmodel is illustrative. The harness code, judge code, and aggregation code all had to be written from scratch for this repo's Node.js/SKILL.md architecture.

### Fit verdict
**Partial fit — rightmodel is a conceptual framework, not a drop-in tool.** The measurement philosophy (reproducible corpus, multi-trial averaging, cost-adjusted scoring, fixed judge) is directly applicable. The implementation required ground-up authoring to match this repo's architecture.

---

## Files created (complete list)

```
.github/skills/discovery/corpus/
  T1-well-formed-input.md
  T2-vague-input-clarification.md
  T3-solution-masquerades-as-problem.md
  T4-scope-too-wide.md
  T5-hidden-constraints.md
.github/skills/discovery/
  EVAL.md
.github/skills/definition-of-ready/
  EVAL.md
  corpus/                    ← directory created, no cases yet (see Gap analysis #1)
.github/skills/model-sweep/
  SKILL.md
scripts/
  run-model-sweep.js
workspace/experiments/
  EXP-TEMPLATE-model-sweep.md
workspace/proposals/
  proposed-update-token-optimization-measurement.md
artefacts/2026-05-10-model-evaluation-capability/
  discovery.md               ← updated with clarification answers
```

---

## Files proposed for update

| File | Change | Via |
|------|--------|-----|
| `.github/skills/token-optimization/SKILL.md` | Add `measurement-backed` flag to routing tiers | `workspace/proposals/proposed-update-token-optimization-measurement.md` |
| `.github/context.yml` | Update `experiment_id` to `EXP-001-discovery-phase4-5` when pilot runs | Operator action (not a PR) |
| `workspace/experiments/EXP-001-discovery-phase4-5/manifest.md` | Populate Run 1 with actual results from Layer 1 pilot | Operator action after running pilot |

---

## Recommended next experiment to run

**EXP-001 — discovery pilot (Layer 1, semi-manual)**

1. Use the existing `workspace/experiments/EXP-001-discovery-phase4-5/manifest.md`
2. Open corpus cases T1–T5 from `.github/skills/discovery/corpus/`
3. In VS Code Copilot Chat, invoke `/discovery` with each case's "Operator input" section
4. Run once with Sonnet 4.6, once with a second model (Haiku 3.5 for cost comparison, or Opus 4.6 for quality ceiling)
5. Judge each output using the judge prompt in `.github/skills/discovery/EVAL.md`
6. Record scores in the manifest and derive the first measurement-backed routing recommendation

Estimated time: 30–60 minutes. Estimated cost: $0 (uses Copilot subscription, not API pay-per-token).

**After EXP-001:** Run EXP-002 with Layer 2 (`scripts/run-model-sweep.js --experiment EXP-002`) for the programmatic baseline. EXP-002 should extend to `/definition-of-ready` using real DoR artefacts from the repo as corpus cases.

---

## Open questions

1. **DoR corpus cases:** Real story bundles (story + test plan + review report) make better DoR corpus cases than synthetic ones. Which stories from the archive should be used? Candidates: `ougl.5` (complex, E2E + path-traversal NFR), `ilc.1` (with injectable adapter H-ADAPTER). Operator to confirm.

2. **Extended thinking sweep:** Should the Layer 2 script expose `--thinking adaptive` as a parameter? rightmodel documents this as a key variable for quality-vs-cost tradeoffs. Not built now; log as a proposal for EXP-003.

3. **context.yml stale state:** The `experiment_id` in `context.yml` is locked to `exp-phase4-sonnet-vs-opus-20260419`. Should this be updated to a neutral value (e.g. `"none"`) between experiments, or left as the last-run experiment ID? The three-way consistency rule flags drift; having a stale ID is a low-grade hygiene issue. Operator to decide policy.

4. **Judge bias mitigation for T2:** Corpus case T2 (vague input) expects a clarifying question, not an artefact. The judge prompt must correctly score "good clarifying question" as a pass. Verify calibration by running the judge against a known-good T2 response before trusting automated scores.
