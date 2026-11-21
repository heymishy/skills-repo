## Test Plan: The first post-deploy auth call gets a cold-start budget, and the /admin/credits call records what it needs to explain its flake

**Story reference:** artefacts/2026-11-21-staging-flake-fixes/stories/sfx-s1-a1-cold-start-and-admin-credits-diagnostics.md
**Epic reference:** None - short-track
**Test plan author:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Test runner (read from package.json):** `npm test` runs `scripts/run-all-tests.js`, which runs `tests/check-*.js`. New check: `tests/check-sfx-s1-staging-flake-fixes.js` (18 assertions, F1 to F18), in the chain automatically. It runs the two fixtures directly (the budget logic and the diagnostics line), reads the two specs as text (their use of the fixtures, and that their assertions are unchanged), reads the ledger and runs `flake-check`. The `a1` spec only runs against staging with a secret; the `bri-s3.3` spec runs against the local test server and is run once by hand (M1).

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Risk |
|----|-------------|------|-------------|-----|--------|------|
| AC1 | `a1` AC1 times a cold and a warm call, judged by `evaluateBudgets` (15000 and 5000 ms), assertions kept, old single check gone, AC2's check unchanged | 6 (F1 constants; F2 slow-cold plus fast-warm passes; F3 cold over; F4 warm over; F5 both over; F6 missing timing) | 3 (F11, F12, F13: spec text) | - | - | 🟢 |
| AC2 | `evaluateBudgets` reports which call and which budget; fails closed | (F3 to F6 above) | - | - | - | 🟢 |
| AC3 | `bri-s3.3` AC1 prints one line per call, rethrows an error, assertions unchanged | 4 (F7 success, F8 gateway error, F9 thrown error, F10 no body) | 3 (F14 three log calls, F15 assertions, F16 rethrow) | - | M1: run the real spec locally | 🟢 |
| AC4 | Ledger note records the occurrence, dates unchanged, existing checks pass | - | 2 (F17, F18) | - | - | 🟢 |
| AC5 | Real spec passes locally and prints the lines; CI green on the final commit | - | - | local run | M1, M2 | 🟡 |

## Red first

Measured on the unchanged repo: F1 to F11, F14, F16 and F17 failed (no fixtures, no cold/warm split, no diagnostics, no ledger note); F13, F15 and F18 passed and pin behaviour that must survive. F12 (the old single check is gone) first passed vacuously because its regex stopped at the `)` inside "(NFR-Performance)"; it was fixed and then failed on the unchanged code as it should. Twelve mutations of the fixtures, the specs and the ledger were then run (see the DoD); eleven were caught at once and one (dropping bob's diagnostics line) was not until F14 was tightened to require all three log calls.

## Manual steps

- **M1:** run the real `bri-s3.3` spec locally (`NODE_ENV=test E2E_LOCAL_SUITE=true npx playwright test tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js`, `COPILOT_REPO_PATH` a native temp folder): 5 passed, with `[bri-s3.3] alice GET /admin/credits: status 200 in 10 ms, 1 tenant row(s)` and the bob line printed.
- **M2:** run the full `npm test` plus `scripts/ci-test-regression-check.js`; read the checks on the final commit; verify the remote head after every push; check master after the merge.
- **M3 (observation):** after the merge, the next `Staging Deploy` smoke log contains the `[bri-s3.3]` lines; the next post-deploy run's `a1` AC1 passes with its cold call over 5 s if a cold start is slow.

## Gaps

The `a1` spec cannot run without the staging secret, so its real behaviour is observed only on a post-deploy run; the cold/warm logic itself is exercised directly. Whether the per-tenant plan lookups cause the `bri-s3.3` flake is not decided by this story; it collects the evidence.
