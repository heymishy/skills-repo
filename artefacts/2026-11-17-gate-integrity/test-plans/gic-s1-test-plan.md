## Test Plan: Required checks take their rules from master, and changes to gate files are visible

**Story reference:** artefacts/2026-11-17-gate-integrity/stories/gic-s1-required-checks-read-rules-from-master.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New files: `tests/check-gic-s1-base-flag.js`, `tests/check-gic-s1-gate-files.js`, `tests/check-gic-s1-baseline-intersection.js`, `tests/check-gic-s1-workflows.js`; new scripts `scripts/read-base-flag.js`, `scripts/gate-files-changed.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Flags of the three required jobs read from the base branch | 2 (T1, T4) | real temporary git repositories (T1) | the pull request's own CI | - | - | 🟡 |
| AC2 | Gate-files-changed workflow, observe mode, no head checkout | 2 (T2, T4) | - | first real report is the next pull request | - | Live-only for the live report | 🟡 |
| AC3 | Unit baseline: additions ignored and reported, removals honoured | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Protected list content, and no pattern that matches nothing | 1 (T2) | - | - | - | - | 🟢 |
| AC5 | This pull request's own CI | - | - | CI | 1 | Live | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| A `pull_request_target` workflow is read from master, so it cannot report on the pull request that adds it | AC2, AC5 | Live-only | Stated in the story and the Definition of Done; its first real report is the next pull request, which is checked then |
| That a flag set to false on a pull request no longer skips a required job cannot be shown without a throwaway pull request | AC1 | Live | T1 proves the reader against real git repositories; the workflow-text checks prove the jobs call it; the live proof is the first later pull request that touches `context.yml` |

## Tests

- **T1 (AC1).** `scripts/read-base-flag.js <key> [--base <ref>] [--file <path>]` prints `true` or `false`. Against temporary git repositories: flag `true` on the base ref and `false` in the working tree prints `true`; `false` on base and `true` in the working tree prints `false`; absent on base prints `false`; a missing base ref exits non-zero (fail closed). It reads only `git show <ref>:<path>`, never the working tree.
- **T2 (AC2, AC4).** `findGateFileChanges(changedPaths, protectedPatterns)` returns the changed paths that match: exact paths, `dir/**` globs, and a path outside the list not matching; the committed `.github/gate-files.json` parses, has `mode: "observe"`, names the paths in AC4, and every pattern matches at least one file in the repository.
- **T3 (AC3).** `ci-test-regression-check.js`'s decision function given a pull-request baseline and a base baseline: an added entry is ignored (the failing test counts as new) and listed; a removed entry is honoured (its test, if now passing, is not a stale entry); identical baselines are unchanged; no base baseline given is unchanged.
- **T4 (AC1, AC2).** Workflow text: `Scenario A E2E (staging)`, `Scenario B E2E (staging)` and `Core browser tests` call `scripts/read-base-flag.js` and do not run `yq e` or `grep` against the checkout's `.github/context.yml` for their flag; `gate-files-changed.yml` triggers on `pull_request_target` only, has `permissions` of `contents: read` and `pull-requests: write` only, contains no `actions/checkout` with a head `ref`, no `github.head_ref` and no `github.event.pull_request.head`, and no step that exits non-zero on a match.
- **E2E (CI).** The three required checks pass on this pull request; the existing `check-a5-ci-gate-config` and `check-b2-ci-gate-config` guards still pass (or are updated in this pull request, visibly).

## Out of scope for this plan

Enforce mode, the ruleset, a separate agent identity, the assurance gate's content check.
