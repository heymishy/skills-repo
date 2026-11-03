## Implementation Plan: Stop the deploy-group concurrency lock from silently cancelling E2E coverage

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s2-ci-deploy-group-concurrency-fix.md
**Test plan reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s2-test-plan.md

## File map

```
Create:
  scripts/lib/is-deploy-group-eviction.js          — pure decision function (AC3)
  tests/check-fhff-s2-deploy-group-eviction.js     — unit tests (AC2 static YAML check + AC3 decision logic)
  .github/workflows/deploy-group-auto-rerun.yml    — new workflow: listens for e2e.yml/staging-deploy.yml cancellations, reruns only true deploy-group evictions

Unmodified (confirmed intentionally, per AC2/Out of Scope):
  .github/workflows/e2e.yml                        — concurrency: deploy-group stays bare, unchanged
  .github/workflows/staging-deploy.yml              — concurrency: deploy-group stays bare, unchanged
```

## Task 1: `isDeployGroupEviction()` decision function + unit tests — ✅ COMPLETE

**Status: COMPLETE** — spec compliance ✅, code quality ✅ (1 Minor DRY issue found and fixed: test re-typed the eviction-text literal instead of importing the module's own exported constant). Ending SHA: `5e251dd9`.

**Verifies:** AC2 (static YAML scoping check), AC3's decision-logic half.

- Create `scripts/lib/is-deploy-group-eviction.js` exporting `isDeployGroupEviction(annotationText)`. Returns `true` only when `annotationText` matches the real GitHub Actions cancellation pattern for this concurrency group — the exact text already confirmed live on PR #633 and documented in `.github/workflows/e2e.yml`'s own historical comments: `"Canceling since a higher priority waiting request for deploy-group exists"`. Returns `false` for anything else (including genuine failure messages like `"Process completed with exit code 1"`), so the mechanism never attempts to rerun a run that failed for a real reason.
- Create `tests/check-fhff-s2-deploy-group-eviction.js` (same plain-Node convention as every other `check-*.js` file, run via `scripts/run-all-tests.js`):
  - AC2 test: read `.github/workflows/e2e.yml` and `.github/workflows/staging-deploy.yml` as text, assert both jobs' `concurrency:` value is the bare string `deploy-group` — not a templated expression incorporating `github.ref`/`github.head_ref`/any per-branch variable.
  - AC3 test: call `isDeployGroupEviction()` with (a) the real annotation text → expect `true`, (b) a genuine failure message → expect `false` (the edge case proving the mechanism doesn't mask real failures as recoverable).

## Task 2: Auto-rerun workflow + real verification — ✅ COMPLETE (implementation; real-environment verification still pending, see below)

**Status: COMPLETE (implementation)** — spec compliance ✅. Code quality: 1 Important issue found and fixed (silent `gh api` failure in the per-job annotation fetch loop could mask a real eviction as "not an eviction" — now fails loudly), 1 Minor fixed (`contents: read` added for `actions/checkout@v4`), re-reviewed ✅. Ending SHA: `bbdb01c3`.

**Critical correctness finding during independent verification (not from either reviewer — found via live `gh api` calls against this repo's real history):** the original implementation fetched the cancelled run's `/actions/runs/{id}/jobs` response and fed its text to `isDeployGroupEviction()` — but that endpoint never carries the cancellation annotation text (confirmed empty `steps: []` against real job id `124773105599`, PR #1049). The real annotation text only lives at `GET /repos/{owner}/{repo}/check-runs/{job_id}/annotations`. As originally wired, the auto-rerun would never have fired for a real eviction — the exact scenario AC1/AC3 require it to handle. Fixed at SHA `7911e916` to fetch from the correct endpoint; re-verified by replaying both the old and new approaches against the real historical API responses: new approach → `true` (correctly detects the real eviction), old approach → `false` (confirms the bug was real). See `scripts/lib/is-deploy-group-eviction.js` (unchanged, correct in isolation) and `.github/workflows/deploy-group-auto-rerun.yml`.

**Verifies:** AC1, AC3 (trigger half), AC4 — real-environment manual checks per the test plan's own Honest scoping note; NFR Security (least-privilege permissions).

- Create `.github/workflows/deploy-group-auto-rerun.yml`:
  - Trigger: `on: workflow_run: workflows: ["E2E Tests (Playwright)", "Staging Deploy"], types: [completed]` (the two real workflow `name:` values confirmed in `e2e.yml` line 1 and `staging-deploy.yml` line 34 — both share the `deploy-group` concurrency key).
  - Gate: `if: github.event.workflow_run.conclusion == 'cancelled'`.
  - Permissions: minimal — `permissions: { actions: write }` only (NFR requires least-privilege; no broader scope needed to call the rerun API).
  - Step: fetch the cancelled run's job annotation text via `gh api repos/${{ github.repository }}/actions/runs/${{ github.event.workflow_run.id }}/jobs`, pass it through `isDeployGroupEviction()` (invoked via a small inline `node -e` call or a thin wrapper script requiring `scripts/lib/is-deploy-group-eviction.js`), and if `true`, call `gh run rerun ${{ github.event.workflow_run.id }}`. If `false`, do nothing — leave the real failure visible.
- Real verification (manual, per Honest scoping note — cannot be simulated pre-merge):
  - AC1/AC3 trigger half: observe this story's own PR for any real concurrency-group collision (the pattern that already occurred 3+ times this session); confirm the auto-rerun workflow fires and the job resolves to a real pass/fail, not silently skipped.
  - AC4: cannot be fully measured until 2+ subsequent PRs land after merge — record as `not-yet-measured` at this story's own `/definition-of-done` with a follow-up re-check, consistent with how `fhff-s1`/this epic already treats forward-looking metrics.
  - NFR Security: confirm the `permissions:` block requests only `actions: write`, nothing broader — checked at `/definition-of-ready` and `/review`.

## Out of scope (unchanged from story)

- Per-PR ephemeral staging environments.
- Narrowing the concurrency key to per-ref.
- Any Fly.io infra/config change.
