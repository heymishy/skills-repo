## Test Plan: A production promotion refuses any commit that is not the head of master, and superseded waiting promotions are cancelled

**Story reference:** artefacts/2026-11-19-promotion-safety/stories/spg-s1-stale-promotion-guard.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-19
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New file: `tests/check-spg-s1-stale-promotion-guard.js`, plain Node, with injected API functions and no network. New scripts: `scripts/promotion-guard.js` and `scripts/cancel-superseded-promotions.js`.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Commit differs from master head: guard exits non-zero, prints both | 1 (T1) | - | - | - | - | 🟢 |
| AC2 | Commit equals master head: guard exits 0 | 1 (T2) | - | - | - | - | 🟢 |
| AC3 | Head unreadable (error, non-200, no commit): guard fails closed | 3 (T3, T4, T5) | - | - | - | - | 🟢 |
| AC4 | Guard step order in promote-to-prod; needs, environment kept; no if: | 1 (T6, reads the workflow) | - | - | - | - | 🟢 |
| AC5 | Cancel script cancels exactly waiting, older Staging Deploy runs; a failing cancel is non-fatal | 2 (T7, T8) | - | - | - | - | 🟢 |
| AC6 | Cancel job runs after deploy-staging, actions: write on that job only, scripts wired to the real token | 1 (T9, reads the workflow) | - | - | - | - | 🟢 |
| Baseline | The existing promote-gate check still passes | 1 (T10, runs `tests/check-bri-s2.6-smoke-test-promote-gate.js`) | - | - | - | - | 🟢 |

## Red-first plan

T1 to T9 fail before the change because the scripts and the workflow steps do not exist. T10 passes before and after and guards the existing promote gate. The injected adapter defaults throw `Adapter not wired`, asserted in T3 (a call with no injected function must throw, not return a head).

## Manual step

After merge, the operator watches the first Staging Deploy run: the cancel job should cancel the older waiting runs, and the newest promote job should pass its guard. Recorded in the DoD.
