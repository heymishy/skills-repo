# CI evidence: two runs of the local Playwright suite on one commit (lpw-s1, AC8)

Pull request #1138, commit `9666e2743`, workflow run 44003688973, attempt 1 and attempt 2 of the `Playwright E2E smoke tests` job. The suite is the local (mocked) suite with the six staging-targeted Scenario A and B specs excluded: 291 tests in 89 spec files.

| | Passed | Failed | Skipped | Time |
|---|---|---|---|---|
| Trial before this story (308 tests, six staging specs included) | 186 | 90 | 32 | 15.7 min |
| Run 1 | 208 | 58 | 25 | 15.2 min |
| Run 2 | 207 | 59 | 25 | 14.9 min |

- **Failed in both runs (deterministic): 58 tests in 29 spec files.** 59 of the 89 spec files had no failing or flaky test in either run (a few of those contain only skipped tests).
- **Flaky (different result between the two runs): 1**: spdr-s2-metric1-timing.spec.js :: Metric 1: filter->sort->dismiss x10 completes correctly and under the regression-guard ceiling (expected then unexpected)
- Scenario A and Scenario B (the required checks, run against the pull request's own server) passed in both attempts.

## Server code coverage baseline (run 1, browser suite only)

Lines 63.3%, functions 40.9%, statements 63.3%, branches 57.83% of `src/web-ui` (170 files), measured by V8 coverage of the test server through `c8` 10.1.3. This is the number `lpw-s2` must not fall below when the required core is chosen. Informational only here.

## Specs with a deterministic failure (failed tests in both runs)

| Spec | Failed tests |
|---|---|
| iwu2-right-panel-layout.spec.js | 7 |
| reference-upload.spec.js | 7 |
| ep1-s1-pod-creation.spec.js | 5 |
| design-definition-canvas-render.spec.js | 4 |
| s3.1-drag-to-advance.spec.js | 3 |
| s3.2-within-column-reorder.spec.js | 3 |
| dsa-s2-dashboard-restyle.spec.js | 2 |
| ep1-s2-product-default-pod.spec.js | 2 |
| ep2-s2-stage-visibility.spec.js | 2 |
| fpux.1-visual-consistency-theme.spec.js | 2 |
| frsr-s1-feature-row-session-resume.spec.js | 2 |
| s1.1-board-advance-action.spec.js | 2 |
| bmau-s1-bulk-assign-rerender.spec.js | 1 |
| bri-s3.6-auth-journey.spec.js | 1 |
| dsda-s1-default-all-stories.spec.js | 1 |
| ep1-s3-feature-pod-inheritance.spec.js | 1 |
| ep1-s3-stage-panel-focus-management.spec.js | 1 |
| ep1-s4-stage-selector.spec.js | 1 |
| ep2-s1-presence-sidebar.spec.js | 1 |
| ep3-s1-regression.spec.js | 1 |
| ep4-s1-multi-pod-assign.spec.js | 1 |
| fpd-s4-caption-sync.spec.js | 1 |
| jcx-s6-swimlane-grid.spec.js | 1 |
| kbsf-s1-shell-wrapping-visual.spec.js | 1 |
| pnfc-s1-new-feature-choice.spec.js | 1 |
| psh-s6-product-kanban.spec.js | 1 |
| rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js | 1 |
| s1.2-not-ready-explanation.spec.js | 1 |
| wuce18-keyboard-nav.spec.ts | 1 |
