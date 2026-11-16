## Test Plan: Bookkeeping pushes to master stop starting workflows that add nothing

**Story reference:** artefacts/2026-11-17-bookkeeping-push-noise/stories/bkn-s1-stop-bookkeeping-push-noise.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-17
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-bkn-s1-bookkeeping-push-noise.js`. It parses the workflow files with `js-yaml` (already a dependency of the repo's other checks) so it asserts structure, not text.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Trace Commit ignores bookkeeping paths | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Vulnerability Check follows dependency files, weekly and manual | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Dreaming has no push trigger | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | Every master push workflow excludes bookkeeping (guard) | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Other tests pass, YAML valid | 1 (T5) | the full suite | - | - | - | 🟢 |
| AC6 | Live: bookkeeping push starts nothing | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs a real master push | AC6 | Live-only | Observed on this story's own post-merge bookkeeping commit with `gh run list --commit <sha>` |

## Tests (new file `tests/check-bkn-s1-bookkeeping-push-noise.js`)

- **T1 (AC1).** `trace-commit.yml` parsed: `on.push.branches` includes `master`, `on.push['paths-ignore']` includes `workspace/**`, `artefacts/**` and `.github/pipeline-state.json`. Fails today (no `paths-ignore`).
- **T2 (AC2).** `vulnerability-check.yml`: `on.push.paths` and `on.pull_request.paths` both include `package-lock.json` and `package.json`; `on.schedule` has one entry; `on.workflow_dispatch` is present. Fails today.
- **T3 (AC3).** `improvement-agent-schedule.yml`: `on.push` undefined, `on.schedule` present, `on.workflow_dispatch` present. Fails today.
- **T4 (AC4).** Over every `.github/workflows/*.yml`: any `on.push` whose branches include `master` (or has no branches) must have `paths-ignore` covering all three bookkeeping globs, or `paths` that contain none of the three bookkeeping roots; allow-list `[]`. Fails today (three workflows).
- **T5 (AC5).** Every workflow file parses; the existing `check-trace-commit.js`, `check-coha-s3-vulnerability-ci-step.js` and `check-trw1-trace-writer.js` exit 0.

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| A parsed YAML test cannot prove GitHub's path matching | GitHub evaluates the globs | AC6 observes it on a real push |
| `attestation-publisher.yml` triggers on branch `main` | It never runs on master pushes | T4 reads its branches and exempts non-master triggers |

**Total automated tests:** 5 (T1 to T5) plus AC6 live.
