# Grader Isolation Design

**Status:** Design — not implemented
**Date:** 2026-05-12
**Author:** Session 3 design phase

---

## Purpose

The grader must produce consistent, reproducible scores regardless of how it is invoked — interactively in a VS Code chat session, from the CLI sweep harness, via a GitHub Actions workflow, or by an improvement agent dreaming cycle. Isolation means the grader's inputs and context are fully controlled and do not bleed from session state, operator identity, or prior run outputs.

---

## Isolation per surface

### Chat / VS Code (Layer 1 — manual)

**Risk:** The operator's active conversation context bleeds into the judge prompt. If the operator has been discussing the candidate artefact in the same session, the judge model may have already formed an opinion.

**Isolation mechanism:**
- Layer 1 grading always uses a fresh chat window (no prior messages visible to the judge).
- The operator invokes grading with a slash command or prompt that begins with a context-reset preamble (defined in the sweep runbook).
- The judge receives only: (a) the rubric, (b) the artefact text fenced in triple-backticks, (c) the judge system prompt. No conversational preamble.

**Residual risk:** VS Code chat session memory is not programmatically clearable. This is why Layer 1 is suitable for exploration but not for auditable scored runs.

### CLI sweep harness (Layer 2 — programmatic)

**Risk:** Environment variable leakage (API keys logged), sequential case contamination (judge accumulates context from prior cases in the same run).

**Isolation mechanism:**
- Each case is a separate API call. The messages array is rebuilt from scratch for each case — no carry-over from prior cases.
- The judge model is called with `max_tokens` capped at 1,200 for the verdict pass. This prevents the judge from generating free-form text that references prior cases.
- API keys are read from environment variables at call time and never written to disk, logs, or result files.
- `eval-run-result.json` contains the artefact path (not artefact content) to avoid inadvertent credential or PII inclusion.

**Verification:** The test suite for `scripts/run-model-sweep.js` mocks the API call and asserts that the `messages` array passed to the API contains only the single-case content.

### GitHub Actions workflow (Layer 2 — CI)

**Risk:** Workflow secrets appearing in logs; runner state persisting between jobs; artefact content containing secrets that get uploaded as artefact attachments.

**Isolation mechanism:**
- All API key references in the workflow use `${{ secrets.* }}` — never hardcoded.
- Eval runs are scoped to `workflow_dispatch` or a dedicated `eval` trigger — they do not run on every push.
- `eval-run-result.json` is uploaded as a workflow artefact, not committed to the repo. The committed scorecard (`workspace/experiments/`) contains only aggregate scores, not per-case artefact content.
- The `evaluation.mode: true` flag is set in a temporary `context.yml` override for the eval job only — the base `context.yml` in the repo always has `evaluation.mode: false`.

### Improvement agent dreaming cycle (Layer 3 — autonomous)

**Risk:** The improvement agent grading its own outputs (self-modify problem); the agent accumulating cross-dimension context that biases later dimension scores.

**Isolation mechanism:**
- Self-modify guard: `deriveSkillTarget(experimentId)` returns `improvement-agent` for any EXP that targets the improvement agent skill. The `runExperimentSignals` function blocks signals with `skillTarget === 'improvement-agent'`.
- Cross-dimension isolation: the dreaming cycle scores each dimension in a separate API call (not in a single multi-dimension prompt). This prevents the judge from anchoring on its D1 score when scoring D2.
- The improvement agent writes candidate proposals but never grades its own proposals. Grading of improvement-agent outputs requires human review (enforced by the `humanReviewRequired` flag in the dreaming cycle output).

---

## Failure modes and mitigations

| Failure mode | Detection | Mitigation |
|---|---|---|
| Judge scores 1.0 for all dimensions ("yes-saying") | Corpus calibration check at run-end: T4 (thin adversarial input) must score ≤ 0.60 | Flag run as uncalibrated if T4 > 0.60 |
| Judge scores 0.0 for all dimensions ("no-saying") | Corpus calibration check: T2 (well-bounded MVP) must score ≥ 0.70 | Flag run as uncalibrated if T2 < 0.70 |
| Injection attack in artefact overrides judge instructions | Sanitisation step strips known injection patterns before grading | Sanitised flag in audit trail |
| Judge references prior-case content (context bleed) | Per-run consistency check: same artefact run twice should produce scores within ±0.05 | Automated consistency probe (not yet implemented) |
| API key logged to console | `buildHeaders()` in `getProvider()` never logs the key; test asserts no `Authorization:` substring in stdout | CI lint check for console.log of auth headers |
| Eval-mode artefact committed to repo | `check_no_eval_mode_artefacts` in `validate-trace.sh` and `.ps1` | CI gate blocks PR if eval-mode marker found in `artefacts/` |

---

## Open design questions

1. **Cross-dimension isolation at Layer 2:** Should each dimension be a separate API call (6–7 API calls per case) or a single structured output call? Single call is cheaper but risks anchoring. Separate calls are expensive but cleaner. **Current default: single structured call.** This is a parameter to vary in EXP-002a.

2. **Corpus calibration frequency:** Should calibration cases (T1–T5) run every sweep or only on rubric version change? Running every sweep doubles cost but catches judge drift. **Current default: run on rubric version change only.** Revisit at EXP-003.

3. **Layer 1 isolation limit:** The manual Layer 1 surface (VS Code chat) cannot be fully isolated without a programmatic context reset API that does not exist. This means Layer 1 scores are exploratory only — they do not feed the improvement agent. This constraint should be documented in the sweep runbook and the evaluation mode section of `discovery/SKILL.md`.
