# esh-s1 Definition of Done

Date: 2026-11-20. Story: five E2E specs that fail on stale selectors and stale pinned colours check what they were written to check. Pull request #1168 merged 2026-11-20 (`b5d25ab64`). No issue.

## Result: COMPLETE. All 7 target tests that failed on CI pass in both CI runs of the pull request; AC7's second clause could not hold literally because the job is noisy (see AC7).

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `ep1-s3-stage-panel-focus-management` takes `.sw-stage-edit:visible` and passes locally and on CI (failed in all six earlier recorded runs and the last master run) | automated (existing spec, repaired) | none |
| AC2 | ✅ | both `frsr-s1-feature-row-session-resume` tests open the collapsed module group first (mouse click on the header in the first, focus and Enter in the second), assert `aria-expanded="true"`, then act on the row link; both pass locally and on CI | automated (existing spec, repaired) | The story's AC2 wording was changed during implementation: the first repair, `:visible` alone, found a link that Playwright counts as visible but that sits clipped in a collapsed group, so the click timed out and the keyboard test passed for the wrong reason. Recorded in `decisions.md` D2 |
| AC3 | ✅ | `jcx-s6-swimlane-grid` AC1 counts `.sw-cx-grid-cell--header:visible` (3); the other three tests in the file still pass, locally and on CI | automated (existing spec, repaired) | none |
| AC4 | ✅ | the three `ep1-s4-stage-selector` scenarios scope to the seeded `journeyId` and pass locally with 138 leftover journeys in the tenant; scenario 2 also asserts the seeded journey's own Discovery dot is found, so a zero count cannot come from a wrong scope; scenario 2 passes on CI (scenarios 1 and 3 already passed there) | automated (existing spec, repaired) | none |
| AC5 | ✅ | `fpux.1-visual-consistency-theme` AC2a and AC2b compare against the page's resolved `--surface` and `--ink`; dark must differ from light for both; AC1 unchanged; all three pass locally and on CI | automated (existing spec, repaired) | none |
| AC6 | ✅ | five deliberate breaks, local only, never committed, each failed as intended (6 targeted tests failed, 7 untouched tests passed): Discovery count 0 instead of 1 (`ep1-s4`); the wrong token `--ink-2` (`fpux.1`); four headers instead of three (`jcx-s6`); a trigger selector that matches nothing (`ep1-s3`); a group selector that matches nothing (`frsr-s1`, both tests) | manual (recorded) | none |
| AC7 | ✅ with deviation | see the table below: all 7 target tests that failed on CI passed in both runs, and no failure involved the five files | CI evidence | The clause "no test that passed on the last master run fails" cannot be met literally: the E2E job is noisy, with a different set of unrelated specs failing on each run (8 failures, then 13, against 16 on master). Met in intent |
| AC8 | ✅ | the pull request changed 8 files: the five specs, and `decisions.md`, the story and the test plan under `artefacts/2026-11-20-e2e-selector-hygiene/` | manual (diff check) | none |

Red first: before the change, on master with the test-mode server, `ep1-s4` x3, `fpux.1` x2 and `jcx-s6` AC1 failed (6 failed, 4 passed); `ep1-s3` and `frsr-s1` were confirmed to take a hidden or clipped first match earlier the same day. After the change the five files together: 13 passed locally. Three `npm test` checks that read these specs (`check-fpux.2-nav-entry-points`, `check-lpw-s1-spec-text`, `check-pfi-s1-panel-focus-fix`) pass.

## AC7 evidence: the CI failing lists

| Run | Failing | Notes |
|---|---|---|
| Master baseline (run 44685372791) | 16 | 253 expected, 22 skipped |
| Pull request, first run (44698298153) | 8 | the 7 target tests pass; also passing this time: `pnfc-s1` AC2 and AC3 (intermittent); one new failure, `jcx-s3-emotion-curve` AC1, a 30 s timeout in a spec not touched |
| Pull request, re-run of the E2E job only | 13 | the 7 target tests pass again; `jcx-s3` passes (so a one-off); seven other specs fail that did not fail in the first run: `ep1-s2`, `ic-s2`, `s1.1`, `s3.2`, `spdr-s2` (all already in the triage's intermittent group), and `ep2-s1`, `jasb-s1` (new to that list) |

- **Still failing in both pull request runs (6):** `bmau-s1`, `dsa-s2` AC7 (two tests), `ep3-s1`, `fpd-s4`, `wuce18`. `dsda-s1` AC3 failed in the first run and passed in the re-run.
- **The local `jcx-s3` check was misleading and is recorded as such:** it failed 3 of 4 repeats in the worktree (`POST /journeys` returned no redirect, most likely because repeated local runs had filled that tenant) and passed 12 of 12 on the master checkout. That local failure was the worktree's own pollution, not evidence about CI.

## Observations and follow-ups

- **Product finding, not fixed (decisions.md D2):** a keyboard user pressing Tab on the product view lands on links and buttons inside collapsed module groups (80 Tab presses: 78 stops, 6 inside `.a4-module-body--collapsed`: row links, rename buttons, pods buttons). Collapsed content that stays in the tab order lets focus disappear into content nobody can see. Suggested follow-up, the operator's call: a short-track bug story that makes collapsed bodies unreachable (`inert` or `visibility: hidden` while collapsed, removed on expand), with a spec that Tabs through the page with groups collapsed. The old `frsr-s1` keyboard test had been passing only because `focus()` works on a clipped link.
- **`ep1-s4` was not the cause the triage assumed:** the triage grouped it with the hidden-duplicate specs; the measurement showed shared state (138 leftover journeys in the `e2e-tester` tenant). Three of the five specs were the hidden-duplicate pattern, one (`frsr-s1`) was a collapsed group on top of it, and two were not selector problems at all (`ep1-s4` shared state, `fpux.1` pinned palette).
- **The job is too noisy to gate a merge:** run-to-run it varied between 8 and 13 failures with no change to the product. The test-isolation story (`dsa-s2`, `s3.2`, `ep1-s2`, `ic-s2`, `s1.1`, `spdr-s2`, `ep2-s1`, `jasb-s1` and the rest of the intermittent group, with `ep1-s4` already independent of it) comes before any decision to drop `continue-on-error`.
- **Remaining consistent failures (6):** `bmau-s1`, `dsa-s2` x2, `ep3-s1`, `fpd-s4`, `wuce18`. Cause unknown for `bmau-s1`, `wuce18`, `ep3-s1` and `fpd-s4`; `dsa-s2` is leakage between tests.
- **Local runs left untracked files in the worktree** (`artefacts/ep1s4-e2e-*`, a copy of `sessions-store/`, `workspace/journeys/`); none was staged, and they go with the worktree.

## Scope Deviations

- None to the files changed. The one change of wording (AC2) is recorded above and in `decisions.md` D2.
