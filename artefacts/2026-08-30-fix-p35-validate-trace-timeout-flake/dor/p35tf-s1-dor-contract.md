# Contract Proposal: Increase check-p3.5-validate-trace.js's pwsh spawn timeout

**Story reference:** artefacts/2026-08-30-fix-p35-validate-trace-timeout-flake/stories/p35tf-s1-increase-pwsh-spawn-timeout.md
**Assessed by:** Claude (agent)
**Date:** 2026-08-30

---

## What will be built

- In `tests/check-p3.5-validate-trace.js`, add a single named constant near the top of the file (e.g. `const PWSH_SPAWN_TIMEOUT_MS = 90000;`) and replace both hardcoded `timeout: 30000` literals in the two `cp.spawnSync('pwsh', ...)` calls with a reference to it.

## What will NOT be built

- No change to `scripts/validate-trace.ps1` itself.
- No change to `scripts/run-all-tests.js`'s own per-file 120-second `spawnSync` timeout (the outer harness that runs each test file as its own child process) — this story's fix is scoped to the INNER `pwsh` spawn timeout inside `check-p3.5-validate-trace.js` itself, which is well within the outer 120s budget even at the new value.
- No investigation into why `pwsh` cold-start is slow under load — out of scope per the story.

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Read the file's source; assert one named constant, referenced at both call sites, value > 30000 | Unit (source inspection) |
| AC2 | Run `node tests/check-p3.5-validate-trace.js` standalone; assert 5/5 passing | Integration |
| AC3 | Run `node scripts/run-all-tests.js` twice in immediate succession; assert `check-p3.5-validate-trace.js` passes cleanly both times | Manual/operator-run smoke check |

## Assumptions

- 90000ms (90 seconds) is chosen as the new timeout value: 3x the original 30000ms, giving substantial margin over the observed failure mode (a process killed by timeout, not one that failed to ever complete) while staying well within `run-all-tests.js`'s own 120-second per-file outer timeout, so a genuinely hung/broken `pwsh` or `validate-trace.ps1` still fails within a bounded time rather than hanging indefinitely.

## Estimated touch points

Files: `tests/check-p3.5-validate-trace.js` only. Services: none. APIs: none.
