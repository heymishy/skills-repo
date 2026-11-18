## Test Plan: A flake is a tracked, owned, time-limited entry in one ledger, and a rerun that passes is not a result until it is recorded

**Story reference:** artefacts/2026-11-18-flake-policy/stories/flk-s1-flake-ledger-and-rerun-rule.md
**Epic reference:** None - short-track
**Test plan author:** Claude Haiku 5.5
**Date:** 2026-11-18
**Test runner (read from package.json):** `npm test` runs `tests/check-*.js`. New file: `tests/check-flk-s1-flake-policy.js`, plain Node, using fixture ledgers and fixture Playwright reports, and an injected check date.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Policy states the required rules | 1 (T1: the policy file contains the four rules, by key phrase) | - | - | - | - | 🟢 |
| AC2 | Incomplete or over-long entries are named | 2 (T2a missing owner and issue; T2b reviewBy past 14 days) | - | - | - | - | 🟢 |
| AC3 | Overdue entry is reported and exits 1 | 1 (T3, injected check date) | - | - | - | - | 🟢 |
| AC4 | Flaky tests listed as file > title | 1 (T4, fixture report) | - | - | - | - | 🟢 |
| AC5 | Strict mode names an untracked flake and exits 1; tracked flake exits 0 | 2 (T5a, T5b) | - | - | - | - | 🟢 |
| AC6 | Committed ledger and policy pass on master | 1 (T6, real files) | - | - | - | - | 🟢 |

## Red-first plan

The test file requires `scripts/flake-check.js`. Before it exists, `node tests/check-flk-s1-flake-policy.js` fails at `require`; that is the recorded red state.
