# Definition of Ready: a2ccf-s1 — Serialize the "Scenario A E2E (staging)" CI job's real-staging specs

**Story:** artefacts/2026-07-23-a2-stripe-ci-checkout-flake/stories/a2ccf-s1.md
**Test plan:** artefacts/2026-07-23-a2-stripe-ci-checkout-flake/test-plans/a2ccf-s1-test-plan.md
**Date:** 2026-07-23
**Human oversight level:** High (solo-operator default, per CLAUDE.md's estimation model — no parent epic to inherit from; short-track story)

---

## Pre-check

- [x] ACs are testable without ambiguity (AC1-AC6, all binary pass/fail or direct log inspection)
- [x] Out of scope declared (story's "Out of Scope" section)
- [x] Benefit linkage written (tied to `2026-07-23-e2e-core-journey-coverage`'s m1, honestly not fabricated as a new metric)
- [x] Complexity rated (1 — well understood; root cause independently confirmed, see story)
- [x] No dependency on an incomplete upstream story (this story is authored on top of `a5-ci-gate-scenario-a-blocking`, PR #563, itself open/draft — see Contract note below on why this is acceptable for a fix-forward)
- [x] NFRs identified (Performance/Security/Accessibility/Audit — see story)
- [x] Root cause investigation completed and recorded (decisions.md) ahead of implementation — local `--workers=1` vs. default comparison performed and recorded before the fix was written, functioning as this CI-config fix's equivalent of a RED/GREEN cycle (there is no application code to unit-test; the "RED" state is the reproducible/non-reproducible CI-environment flake itself, not a failing assertion)

## Contract

**In scope:**
- `.github/workflows/e2e.yml`: add `--workers=1` to the `scenario-a-staging-e2e` job's `npx playwright test ...` command (the "Run Scenario A E2E (A1-A4) against real wuce-staging" step) only. Add `always() &&` to the same job's "Upload Playwright traces and screenshots on failure" step's `if:` condition (AC6, bundled secondary fix — same file, directly discovered by this investigation, needed for any future failure of this exact job to be diagnosable).
- `artefacts/2026-07-23-a2-stripe-ci-checkout-flake/`: story, test plan, this DoR, decisions.md.
- `.github/pipeline-state.json`: new flat `feature.stories[]` entry for `a2ccf-s1`.
- `workspace/capture-log.md`: appended entry (source: agent-auto).

**Out of scope (MUST NOT touch):**
- `playwright.config.js` — no global `workers` change (AC2).
- `tests/e2e/a2-stripe-test-mode-plan-selection.spec.js` and its fixtures — no assertion, timeout, or checkout-flow-logic change.
- The pre-existing, non-blocking `e2e` job in the same workflow file — its `run:` command and its own upload-artifact step are untouched.
- Any application source under `src/`.

**Cross-check against test plan (B1/D1, CLAUDE.md):** The test plan's required touchpoint is `.github/workflows/e2e.yml` (AC1/AC2/AC6/E2E3 all assert its content or a CI run of it directly) and `playwright.config.js` (AC2, asserting it is UNCHANGED). Neither file appears in the contract's out-of-scope list as excluded from being read/verified — `playwright.config.js` is explicitly in scope to verify it stays unchanged, which is a slightly different framing from "must not touch" but is not a contradiction: the contract's own out-of-scope list already states this precisely (no global `workers` change), so there is no conflict between contract and test plan.

**Note on branching from an open/draft upstream PR:** this fix targets a job (`scenario-a-staging-e2e`) that only exists on the still-open `a5-ci-gate-scenario-a-blocking` branch (PR #563), not on `master`. Per this session's task framing, the fix branch is created directly from `origin/a5-ci-gate-scenario-a-blocking` (not from `master`) so the fix can be verified against a real CI run of the actual job it fixes. This is an explicit, narrow exception to strictly requiring a merged upstream dependency — justified because the alternative (waiting for PR #563 to merge first) is not possible here: PR #563 cannot merge until this exact flake is fixed, since "Scenario A E2E (staging)" is itself a required status check on the master ruleset. The two PRs are expected to be reconciled (this fix rebased onto master, or merged into PR #563's own branch) before either merges — noted as a Coding Agent Instruction below.

## Coding Agent Instructions

1. Implement both workflow-file changes exactly as scoped above (`--workers=1` on the one `run:` line; `always() &&` on the one `if:` line) — do not touch `playwright.config.js` or any spec file.
2. Run `npm test`; compare failure set against `tests/known-baseline-failures.json` — zero new regressions required (AC5). Expected to be a clean no-op confirmation since this fix touches no code path `npm test` exercises.
3. Run the exact fixed command locally against real `wuce-staging` (`npx playwright test tests/e2e/a1-staging-auth-stub.spec.js tests/e2e/a2-stripe-test-mode-plan-selection.spec.js tests/e2e/a3-product-feature-ideate-canvas.spec.js tests/e2e/a4-ideate-session-resume.spec.js --workers=1`) and confirm `a2`'s 3 tests pass (AC3). Report any unrelated `a1`/`a3`/`a4` skip/fail honestly, not silently.
4. Commit, push to `fix-forward-a2-stripe-ci-checkout-flake`, open a **draft PR** referencing PR #563 (never mark ready for review).
5. Wait for the real "Scenario A E2E (staging)" CI check on this new PR to complete; inspect its log directly to confirm `a2`'s 3 tests are not among any failures (AC4) — this is the verification that actually matters. If the check fails for a DIFFERENT, unrelated reason (e.g. the already-documented credits-upsert gap surfacing as a hard failure now that the job genuinely blocks), report that honestly as a separate, pre-existing finding, not as this story's own fix failing.
6. Update `.github/pipeline-state.json` with a new flat `feature.stories[]` entry for `a2ccf-s1`.
7. Append a `workspace/capture-log.md` entry (source: agent-auto) recording the root cause and fix.
8. Note in the PR description that this branch must be reconciled with PR #563 (rebase this fix onto master after #563 merges, or merge this fix's commit into #563's branch) before either can land, since `scenario-a-staging-e2e` does not exist on master yet.

## Sign-off

**Proceed:** Yes
**Rationale:** Root cause independently confirmed via real CI log analysis (no 429s, pure UI-interaction timeouts/assertion-mismatches, all 3 failures traced to one shared interaction never completing) plus a controlled local comparison (default worker count vs. `--workers=1`, same command, same real staging app, same session) that isolates worker concurrency as the differentiating variable. Fix is a single, narrowly-scoped CLI flag on one `run:` line, with a bundled, directly-related diagnostic fix (AC6) discovered during the same investigation. No change to application code, spec assertions, or global Playwright configuration.
