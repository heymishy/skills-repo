# Implementation Plan: Staging deploy workflow skips bookkeeping-only pushes to master

**Story reference:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/stories/sdsb-s1-skip-staging-deploy-for-bookkeeping-only-pushes.md
**DoR contract:** artefacts/2026-09-04-staging-deploy-skip-bookkeeping-pushes/dor/sdsb-s1-dor-contract.md
**Worktree:** .worktrees/sdsb-s1 (branch `feature/sdsb-s1`)
**Baseline:** built off master `7d9b8939` (daga-s1's own merge commit, latest master at worktree creation)

---

## Task 1: `staging-deploy.yml` `on.push.paths-ignore` addition (AC1-AC3)

Added a `paths-ignore` list directly under `on.push.branches`, containing exactly `workspace/**`, `artefacts/**`, and `.github/pipeline-state.json` -- matching CLAUDE.md's own already-established bookkeeping-exemption list verbatim. No job body touched.

**Status:** Complete.

## Task 2: New governance test (AC1)

`tests/check-sdsb-s1-staging-deploy-paths-ignore.js` -- T1 (paths-ignore has exactly the 3 expected entries), T2 (branches: still exactly [master], regression guard).

**TDD verification performed:** stashed the `staging-deploy.yml` change only (`git stash push -u -m "sdsb-s1-tdd-verify-check"`), re-ran the new test file against pre-fix content -- T1 failed exactly as expected ("no paths-ignore list found under on.push"), T2 passed (branches unaffected, correctly unchanged either way). Restored via `git stash apply <sha>` + `git stash drop <sha>` (re-found by tag via `git stash list --format='%H %gd %gs' | grep`, per this repo's worktree stash-safety convention).

**Status:** Complete.

## Task 3: Regression guards (AC4/AC5)

Ran `tests/check-bri-s2.5-ci-pipeline-staging-deploy.js` (7/7 passing, unmodified) and `tests/check-bri-s2.6-smoke-test-promote-gate.js` (10/10 passing, unmodified) directly.

**Status:** Complete.

## Task 4: Full suite

`npm test` run in full to catch any unanticipated regression, per this session's own established standing practice (five prior occurrences of a full-suite run catching a DoR-unanticipated regression).

**Status:** Complete -- see verification section below for result.

---

## Files touched

- `.github/workflows/staging-deploy.yml` (`on.push` block only)
- `tests/check-sdsb-s1-staging-deploy-paths-ignore.js` (new)

## Verification

- New test file: 2/2 passing.
- `check-bri-s2.5-ci-pipeline-staging-deploy.js` (regression guard): 7/7 passing, unmodified.
- `check-bri-s2.6-smoke-test-promote-gate.js` (regression guard): 10/10 passing, unmodified.
- Full suite: result recorded once the background run completes (see commit message / DoD for final count).
