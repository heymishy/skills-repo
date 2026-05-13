# Session Summary — Evaluation Programme, Session 3 (Phase 2)

**Date:** 2026-05-12
**Branch:** feat/model-evaluation-capability
**PR:** #348 (draft)
**Commits this session:** `147337f` (Pieces 1+2), `2294182` (Pieces 3+4)

---

## What was built (Pieces 1 and 2)

### evaluation_mode infrastructure

| File | Change |
|---|---|
| `.github/context.yml` | `evaluation:` block — `mode`, `judge_model`, `output_path` |
| `.github/skills/discovery/SKILL.md` | `## Evaluation mode` section — non-interactive contract, eval-mode marker spec, `eval-run-result.json` schema |
| `scripts/run-model-sweep.js` | `readEvaluationConfig()`, `getProvider()` (Anthropic/OpenAI/local), `callModel()`, `writeEvalRunResult()` |
| `scripts/validate-trace.sh` | `check_no_eval_mode_artefacts` — rejects eval-mode marker in `artefacts/` |
| `scripts/validate-trace.ps1` | `Check-NoEvalModeArtefacts` — parity with sh |

Key architectural decision: `getProvider()` abstracts the three API surfaces (Anthropic, OpenAI, local) into a common `{ buildHeaders, buildBody, parseResponse }` interface. This means adding a new provider (Gemini, Bedrock) requires one new `else if` branch in `getProvider()` and no changes elsewhere.

Bug fixed in this piece: OpenAI system prompt was passed as a top-level field (not valid for the OpenAI chat completions API); corrected to messages-array injection.

### experiment-signals dimension (improvement agent)

| File | Change |
|---|---|
| `src/improvement-agent/experiment-signals.js` | New module — scans `workspace/experiments/*/results/` for dimensions below 0.70 across 2+ runs |
| `src/improvement-agent/index.js` | 4th dimension registered; `experimentSignalsDetected`/`experimentSignalDetails` in dream-run-result; interval guard null-`lastDreamRun` bug fixed |

Bug fixed in this piece: the interval guard used `if (lastDreamRun)` which treats `null` (first ever run, no prior state) as a "skip" condition. Changed to explicit `!== null && !== undefined` so the first run always proceeds.

---

## What was designed (Pieces 3 and 4)

### Outcomes grader design (4 docs in `workspace/design/`)

| File | Content |
|---|---|
| `outcomes-grader-design.md` | Architecture, self-correction loop (3-pass max), grader isolation, prompt injection sanitisation, RBNZ audit trail mapping, token budget |
| `skill-rubric-schema.md` | Full YAML schema for D1–D7 rubric — weights (sum=1.0), categorical fail semantics (D3 MVP bounding, D7 constraint completeness), corpus calibration anchors |
| `grader-isolation-design.md` | Isolation per surface (chat/CLI/CI/dreaming), failure modes table, open design questions |
| `outcomes-rbnz-framing.md` | Existence vs quality distinction, CPG 220 mapping, empirical 0.70 threshold derivation from EXP-001 scores, advisory-only v1 rationale |

### Orchestration scope (1 doc)

| File | Content |
|---|---|
| `orchestration-scope.md` | Problem 1: parallel eval runs across squads (EXP-003 context) — co-ordination problems + candidate pull model; Problem 2: CPF metric (Constraint Propagation Fidelity) — cross-artefact signal, regulatory significance; sequencing recommendation |

---

## Concept status

| Concept | Status | Next action |
|---|---|---|
| Dreaming architecture | ✅ Implemented (Session 2) | Monitor first scheduled run |
| Evaluation mode flag | ✅ Implemented | Wire into sweep harness CLI arg |
| Provider abstraction | ✅ Implemented | Add Gemini provider when needed |
| Experiment-signals dimension | ✅ Implemented | Needs first real result files to exercise |
| Outcomes grader | 📐 Designed | Implement rubric YAML + grader function in EXP-002a |
| Skill rubric schema | 📐 Designed | Implement schema validator |
| Grader isolation | 📐 Designed | Address open question 1 (single vs separate API calls) in EXP-002a |
| CPF metric | 📐 Scoped | Implement after grader v1 ships |
| Multi-squad orchestration (EXP-003) | 📐 Scoped | Implement after EXP-002b complete |

---

## EXP-002a readiness

EXP-002a can begin when:
1. `rubric.yml` is created at `.github/skills/discovery/rubric.yml` (schema defined in `skill-rubric-schema.md`)
2. A `gradeArtefact(artefactPath, rubricPath, judgeModel)` function is implemented in `scripts/` (architecture defined in `outcomes-grader-design.md`)
3. The sweep harness calls the grader after candidate model runs and writes results to the standard path

**Estimated EXP-002a setup time:** 1 focused session (grader implementation + rubric file + 1 test run on T1–T5).

---

## Highest-leverage next action

Implement the single-artefact grader (`scripts/grade-artefact.js` or equivalent) using the rubric schema and isolation design. This unlocks:
- Automated quality scores on every sweep run
- Improvement agent signals based on quality, not just existence
- A defensible audit trail for regulated enterprise contexts

The design work this session has fully specified the grader — implementation is the only remaining gap.

---

## Phase 5 prerequisites (before closing PR #348)

- [ ] `npm test` passes with zero failures (currently blocked on `wucp4` pre-existing failure — unrelated to this PR)
- [ ] `validate-trace.sh --ci` passes on the branch
- [ ] EXP-001 scorecard committed to `workspace/experiments/EXP-001-discovery-phase4-5/` with all run-3 files scored
- [ ] `pipeline-state.json` updated to reflect `mec.1` through `mec.4` story statuses

---

## Sessions in this programme

| Session | Date | Key output |
|---|---|---|
| Session 1 | 2026-05-10 | Corpus T1–T5, EVAL.md, run-model-sweep.js, EXP-001 manifest |
| Session 2 | 2026-05-11 | Dreaming architecture, proposal bridge, scheduled workflow |
| Session 3 (this) | 2026-05-12 | evaluation_mode, provider abstraction, experiment-signals, outcomes grader design, orchestration scope |
