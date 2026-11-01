# Contract Proposal: Stop the deploy-group concurrency lock from silently cancelling E2E coverage

**Story reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/stories/fhff-s2-ci-deploy-group-concurrency-fix.md
**Test plan reference:** artefacts/2026-11-01-fixture-hardening-fast-follows/test-plans/fhff-s2-test-plan.md
**Date:** 2026-11-01

---

## What will be built

- A new, separately-callable decision function (e.g. `scripts/is-deploy-group-eviction.js`) implementing the cancellation-detection logic — given a run's conclusion/annotation text, decide whether it was evicted by the `deploy-group` concurrency pattern (vs. a genuine failure).
- A new GitHub Actions workflow (e.g. `.github/workflows/deploy-group-recovery.yml`), triggered on `workflow_run` completion, that calls the decision function and, if it matches, reruns the cancelled job via the GitHub Actions rerun API.
- New test file `tests/check-fhff-s2-deploy-group-fix.js` covering AC2 (concurrency-key scoping, read directly from the workflow YAML) and AC3's decision-logic unit test.

## What will NOT be built

- A narrowed, per-ref concurrency key — explicitly rejected, would be a regression (lets two different PRs deploy/E2E-test against the same real `wuce-staging` app concurrently).
- Any Fly.io infrastructure or configuration change — confirmed unnecessary via `/clarify`.
- Per-PR ephemeral staging environments.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Manual — observed on this story's own PR or a subsequent real PR | manual |
| AC2 | Unit test — read the workflow YAML's `concurrency:` value, assert it's still the bare `deploy-group` string | unit |
| AC3 | Unit test (decision-logic function, synthetic annotation strings) + Manual (the real trigger, which can't be forced pre-merge) | unit + manual |
| AC4 | Manual — observed across 2+ subsequent PRs; may be `not-yet-measurable` at this story's own DoD if no qualifying PR exists yet | manual |

## Assumptions

- The GitHub Actions rerun API is callable with a correctly-scoped `GITHUB_TOKEN` (`actions: write` permission) — to be confirmed during implementation. If the default token's permissions don't suffice, a PAT or GitHub App installation token may be needed; this is the story's own genuine open question (Complexity Rating 2).

## Estimated touch points

**Files:** `.github/workflows/e2e.yml`, `.github/workflows/staging-deploy.yml`, a new workflow file (exact name TBD), `scripts/is-deploy-group-eviction.js` (new), `tests/check-fhff-s2-deploy-group-fix.js` (new)
**Services:** GitHub Actions
**APIs:** GitHub Actions REST API (workflow run rerun endpoint)

**schemaDepends:** N/A — Dependencies block is "None."
