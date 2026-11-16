## Test Plan: Deprecate the Fleet Aggregation and GitHub Pages workflows so they stop running

**Story reference:** artefacts/2026-11-16-ci-regression-review/stories/ciw-s2-disable-fleet-aggregation-and-resolve-pages.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-16
**Test runner (read from package.json):** `npm test` runs `node scripts/run-all-tests.js`, which globs `tests/check-*.js`; plain Node scripts. New file: `tests/check-ciw-s2-deprecated-workflows.js`. It reads the two workflow files and `dashboards/README.md` as text and extracts the top-level `on:` block with a small parser (no YAML dependency: the block is the lines after `on:` until the next column-0 key). Existing `tests/check-dviz2-pages-workflow.js` is edited at T3 and T4 only; `tests/check-fleet-aggregation.js` is unchanged.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Fleet: workflow_dispatch only, DEPRECATED header | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Pages: workflow_dispatch only, DEPRECATED header with reason | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | dashboards/README.md banner | 1 (T3) | - | - | - | - | 🟢 |
| AC4 | No tabs, jobs and secret references unchanged | 1 (T4) | - | - | - | - | 🟢 |
| AC5 | Existing tests pass with only T3 and T4 of dviz2 changed | - | the full suite | - | - | - | 🟢 |
| AC6 | Live: no new runs | - | - | - | 1 | Live-only | 🟡 |

## Coverage gaps

| Gap | AC | Type | Handling |
|-----|----|------|----------|
| Needs time on the real Actions list | AC6 | Live-only | Verification scenario 6 |

## Tests (new file `tests/check-ciw-s2-deprecated-workflows.js`)

- **T1 (AC1).** `fleet-aggregation.yml`: the `on:` block lists `workflow_dispatch`, does not list `push` or `schedule`, and the file's first non-blank lines are comments containing `DEPRECATED`, `FLEET_PUSH_TOKEN` and `2026-11-16`. Fails today (push and schedule present, no header).
- **T2 (AC2).** `pages.yml`: `on:` lists `workflow_dispatch`, not `push`; header comments contain `DEPRECATED`, `Pages is not enabled` and `pipeline-state.json`. Fails today.
- **T3 (AC3).** `dashboards/README.md` starts (within its first 6 lines) with a line containing `DEPRECATED` and `Pages`. Fails today.
- **T4 (AC4).** Both files have no tab characters; the job names (`aggregate`, `deploy`) and every `uses:` line are unchanged from a recorded list in the test; the set of `secrets.` references equals today's (`FLEET_PUSH_TOKEN` in fleet, none in pages). Passes before the change as an invariant.

AC5 is verified by the full suite (`check-dviz2-pages-workflow` with its two edited assertions, `check-fleet-aggregation` unchanged, and the dashboard tests that read `dashboards/`).

## Test Gaps and Risks
| Gap | Reason | Mitigation |
|-----|--------|------------|
| No YAML parser in the repo | Zero-dependency rule | The small `on:` extractor is covered by feeding it both a current and a synthetic file inside the test |

**Total automated tests:** 4 (T1 to T4) plus the edited dviz2 assertions and AC6 live.
