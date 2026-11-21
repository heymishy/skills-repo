## Test Plan: A production promotion is not refused because of bookkeeping commits that landed after the deployed commit

**Story reference:** artefacts/2026-11-21-promotion-guard-bookkeeping/stories/pgb-s1-promotion-guard-bookkeeping-commits.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-pgb-s1-promotion-bookkeeping.js` (17 assertions, P1 to P11), in the chain automatically. Like `check-spg-s1` it runs the real `scripts/promotion-guard.js` as a child process against a local fake GitHub API over HTTP, so the token header, the compare URL and the exit codes are what is asserted; nothing is mocked inside the script.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | Behind the head by bookkeeping only: exit 0, message, both commits, correct compare request with the bearer token | - | 2 (P1, P1b) | - | - | 🟢 |
| AC2 | Any non-bookkeeping file refused and named: a code file, playback media, the previous name of a rename | - | 3 (P2, P3, P7) | - | - | 🟢 |
| AC3 | Fails closed: 500, no files list, empty answer, status diverged / behind / identical, 300 files, fewer commits than `total_commits` | - | 8 (P4 x3, P5 x3, P6, P6b) | - | - | 🟢 |
| AC4 | Run commit equals the head: exit 0, no compare request | - | 1 (P8) | - | - | 🟢 |
| AC5 | The classifier agrees with the workflow's `paths-ignore` on 15 sample paths | 1 (P9: parses the workflow) | - | - | - | 🟢 |
| AC6 | Unwired adapter refuses; `check-spg-s1` unchanged | 1 (P10) | 1 (P11: runs the existing check) | - | - | 🟢 |
| AC7 | CI green on the final commit; body names this folder | - | - | CI | M1: read the checks on the final commit | 🟢 |

## Red first

Measured on the unchanged guard: P1, P1b, P2, P3, P7 and P10 failed (the old guard refuses everything and does not name a file, and there is no compare adapter); P9 failed until the classifier module existed; P4, P5, P6, P6b, P8 and P11 passed already because they pin refusals and the unchanged behaviour that must survive. Because those pass vacuously on the old guard, eleven mutations of the new guard were run (see the DoD): each weakening was caught by the matching test.

## Manual steps

- **M1:** run `check-pgb-s1-promotion-bookkeeping`, `check-spg-s1-stale-promotion-guard`, the full `npm test` plus `scripts/ci-test-regression-check.js`; read the checks on the final commit; verify the remote head after every push; check master after the merge.
- **M2 (observation, operator's action):** after the merge, the new staging run's promotion can be approved even if bookkeeping commits follow it. The agent holds all master pushes until that promotion is approved; it does not approve anything.

## Gaps

The real GitHub compare API is only exercised by an actual promotion after the merge (the fake API follows the documented response shape: `status`, `ahead_by`, `total_commits`, `commits[]`, `files[]` with `filename`, `previous_filename`). If the real answer differs, the guard fails closed (refuses), which is the safe direction and would show up in the promote job's log.
