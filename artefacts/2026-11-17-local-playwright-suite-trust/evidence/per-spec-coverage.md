# Per-spec server coverage measurement (lpw-s2, AC2)

Workflow run 44022488529 (`Playwright per-spec coverage (measurement)`, pull request #1139, commit `9ad135c13` plus the port fix). 89 local spec files (the six staging-targeted Scenario A and B specs are not run), each alone on a fresh test server, 28.7 minutes in all. Statements are those of `src/web-ui` that Node's V8 coverage records as executed, read through `c8` 10.1.3.

**An earlier run was not valid and is not used.** Its first attempt (run 44020942136) lost every spec after `design-definition-canvas-render`: that spec waits on a real model session, was killed at the 6-minute backstop, and left its server on port 3999, so every later spec failed to start (recorded as 0 tests). The script now ends a slow spec through Playwright's own 4-minute global limit and frees the port after every spec.

**Findings**
- Together the 89 specs execute 36909 of 57062 statements (64.7%). The `lpw-s1` whole-suite baseline (63.3% of statements in the files the suite loaded) is the same measure on a nearly identical denominator.
- Booting the server alone, which every spec does, executes about 18000 statements (about 32%); the first spec in the greedy order adds 24389 (it also runs most routes), and every later spec adds a few hundred at most. Browser specs differ little in server code, so the choice of core is decided by capability first and by small amounts of unique code second.
- Specs whose results differ from the two `lpw-s1` runs (which ran them together): `bri-s3.6`, `ep2-s2`, `kbsf-s1`, `pnfc-s1`, `s1.2` and `spdr-s2` pass alone but failed or were flaky in the suite, so they depend on state left by other specs (the shared server and tenant). Every spec with a deterministic suite failure either failed alone as well or is listed in the matrix with that reason.
- Files no browser spec touches: 31 of 201 `.js` files under `src/web-ui` (listed at the end; computed from the measurement and the files on disk, since `c8` does not report files the server never loaded). These are the capabilities no browser test reaches at all.

| Spec | Passed | Failed | Skipped | Covered | Only this spec | Order | New when added |
|---|---|---|---|---|---|---|---|
| tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js | 3 | 0 | 0 | 24389 | 64 | 1 | 24389 |
| tests/e2e/ep2-s2-stage-visibility.spec.js | 2 | 0 | 0 | 21804 | 483 | 2 | 2448 |
| tests/e2e/ep1-s4-stage-reorder.spec.js | 2 | 0 | 0 | 20760 | 76 | 3 | 2093 |
| tests/e2e/ep3-s1-regression.spec.js | 0 | 1 | 0 | 22471 | 284 | 4 | 911 |
| tests/e2e/s1.1-board-advance-action.spec.js | 1 | 1 | 0 | 19973 | 0 | 5 | 837 |
| tests/e2e/actr-s2-auto-resolve-live.spec.js | 2 | 0 | 0 | 19349 | 292 | 6 | 710 |
| tests/e2e/bri-s3.3-multi-user-tenant-journey.spec.js | 5 | 0 | 0 | 20695 | 366 | 7 | 686 |
| tests/e2e/ep2-s4-concurrent-merge.spec.js | 2 | 0 | 0 | 19164 | 619 | 8 | 619 |
| tests/e2e/dsa-s6-mobile-responsiveness.spec.js | 4 | 0 | 0 | 19573 | 0 | 9 | 591 |
| tests/e2e/wuce20-artefact-index-html.spec.js | 5 | 0 | 0 | 19264 | 516 | 10 | 520 |
| tests/e2e/ep2-s3-signals-pagination.spec.js | 1 | 0 | 0 | 18727 | 208 | 11 | 510 |
| tests/e2e/dsa-s4-chat-restyle.spec.js | 11 | 0 | 0 | 23844 | 0 | 12 | 262 |
| tests/e2e/dsa-s1-artefact-viewer-restyle.spec.js | 8 | 0 | 0 | 19099 | 106 | 13 | 188 |
| tests/e2e/bri-s3.5-billing-journey.spec.js | 6 | 0 | 0 | 22122 | 179 | 14 | 179 |
| tests/e2e/bmau-s1-bulk-assign-rerender.spec.js | 0 | 1 | 0 | 21251 | 170 | 15 | 171 |
| tests/e2e/dic-canvas.spec.js | 16 | 0 | 0 | 21532 | 137 | 16 | 146 |
| tests/e2e/dsa-s2-dashboard-restyle.spec.js | 6 | 2 | 0 | 19572 | 115 | 17 | 146 |
| tests/e2e/ep2-s3-approval.spec.js | 1 | 0 | 0 | 22610 | 80 | 18 | 141 |
| tests/e2e/wuce25-session-commit-result.spec.js | 7 | 0 | 0 | 18693 | 128 | 19 | 138 |
| tests/e2e/ppc-s5-video-lazy-load.spec.js | 2 | 0 | 0 | 19203 | 123 | 20 | 123 |
| tests/e2e/skill-launcher.spec.js | 6 | 0 | 3 | 18513 | 50 | 21 | 119 |
| tests/e2e/dsh-s6-archived-stage-transparent-render.spec.js | 1 | 0 | 0 | 19812 | 48 | 22 | 114 |
| tests/e2e/annotation.spec.js | 5 | 0 | 0 | 18465 | 88 | 23 | 88 |
| tests/e2e/ep1-s3-launcher-layout.spec.js | 3 | 0 | 0 | 18303 | 0 | 24 | 86 |
| tests/e2e/jcx-s3-emotion-curve.spec.js | 3 | 0 | 0 | 20711 | 6 | 25 | 83 |
| tests/e2e/spdr-s2-metric1-timing.spec.js | 1 | 0 | 0 | 18634 | 52 | 26 | 73 |
| tests/e2e/bri-s3.4-cross-tenant-isolation-journey.spec.js | 2 | 0 | 0 | 24046 | 58 | 27 | 62 |
| tests/e2e/ic-s2-canvas-drag-position.spec.js | 1 | 0 | 0 | 20709 | 0 | 28 | 61 |
| tests/e2e/wnl-s2-journey-gate-sticky.spec.js | 3 | 0 | 0 | 20989 | 57 | 29 | 57 |
| tests/e2e/b1-nav-toggle.spec.js | 2 | 0 | 0 | 19323 | 51 | 30 | 51 |
| tests/e2e/artefact-read.spec.js | 5 | 0 | 0 | 18876 | 49 | 31 | 49 |
| tests/e2e/ep1-s1-pod-creation.spec.js | 0 | 5 | 0 | 18368 | 0 | 32 | 35 |
| tests/e2e/action-queue.spec.js | 4 | 0 | 0 | 18053 | 34 | 33 | 34 |
| tests/e2e/ep1-s4-stage-selector.spec.js | 1 | 2 | 0 | 19078 | 4 | 34 | 32 |
| tests/e2e/csd-s1-data-model-diagram.spec.js | 2 | 0 | 0 | 21327 | 0 | 35 | 29 |
| tests/e2e/iwu2-right-panel-layout.spec.js | 1 | 7 | 0 | 21127 | 26 | 36 | 26 |
| tests/e2e/fpd-s4-caption-sync.spec.js | 0 | 1 | 0 | 18080 | 16 | 37 | 16 |
| tests/e2e/cams-s1-chat-artefact-responsive.spec.js | 4 | 0 | 0 | 24008 | 15 | 38 | 15 |
| tests/e2e/ep2-s1-signals-panel.spec.js | 1 | 0 | 0 | 18546 | 13 | 39 | 13 |
| tests/e2e/wuce24-guided-question-form.spec.js | 4 | 0 | 0 | 18253 | 12 | 40 | 12 |
| tests/e2e/pnfc-s1-new-feature-choice.spec.js | 4 | 0 | 0 | 24233 | 11 | 41 | 11 |
| tests/e2e/sign-off.spec.js | 5 | 0 | 3 | 18158 | 9 | 42 | 9 |
| tests/e2e/feature-navigation.spec.js | 3 | 0 | 0 | 18173 | 6 | 43 | 6 |
| tests/e2e/smoke.spec.js | 3 | 0 | 0 | 18011 | 6 | 44 | 6 |
| tests/e2e/design-definition-canvas-render.spec.js | 0 | 1 | 4 | 23617 | 0 | 45 | 5 |
| tests/e2e/s3.2-within-column-reorder.spec.js | 2 | 1 | 0 | 19963 | 5 | 46 | 5 |
| tests/e2e/psh-s7-org-kanban.spec.js | 1 | 0 | 0 | 18023 | 3 | 47 | 3 |
| tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js | 4 | 0 | 0 | 24088 | 1 | 48 | 1 |
| tests/e2e/a4-module-expand-collapse.spec.js | 0 | 0 | 1 | 18835 | 0 | 49 | 0 |
| tests/e2e/actr-s2-capture-target-fixture.spec.js | 1 | 0 | 0 | 18804 | 0 | 50 | 0 |
| tests/e2e/artefact-preview.spec.js | 1 | 0 | 5 | 17981 | 0 | 51 | 0 |
| tests/e2e/artefact-writeback.spec.js | 1 | 0 | 5 | 17981 | 0 | 52 | 0 |
| tests/e2e/bri-s3.6-auth-journey.spec.js | 4 | 0 | 0 | 19132 | 0 | 53 | 0 |
| tests/e2e/csd-s2-canvas-diagram-rendering.spec.js | 5 | 0 | 0 | 21423 | 0 | 54 | 0 |
| tests/e2e/dsa-s3-landing-restyle.spec.js | 10 | 0 | 0 | 18005 | 0 | 55 | 0 |
| tests/e2e/dsda-s1-default-all-stories.spec.js | 0 | 1 | 0 | 23161 | 0 | 56 | 0 |
| tests/e2e/dsh-s3-breadcrumb-split-view.spec.js | 1 | 0 | 0 | 19790 | 0 | 57 | 0 |
| tests/e2e/ep1-s2-product-default-pod.spec.js | 0 | 2 | 0 | 18955 | 0 | 58 | 0 |
| tests/e2e/ep1-s3-feature-pod-inheritance.spec.js | 0 | 1 | 0 | 18951 | 0 | 59 | 0 |
| tests/e2e/ep1-s3-stage-panel-focus-management.spec.js | 0 | 1 | 0 | 20586 | 0 | 60 | 0 |
| tests/e2e/ep2-s1-presence-sidebar.spec.js | 0 | 1 | 0 | 18951 | 0 | 61 | 0 |
| tests/e2e/ep4-s1-multi-pod-assign.spec.js | 0 | 1 | 0 | 18951 | 0 | 62 | 0 |
| tests/e2e/fpd-s1-walkthrough-capture.spec.js | 1 | 0 | 0 | 18042 | 0 | 63 | 0 |
| tests/e2e/fpd-s2-video-capture.spec.js | 1 | 0 | 0 | 18042 | 0 | 64 | 0 |
| tests/e2e/fpux.1-contrast-ratio.spec.js | 2 | 0 | 0 | 18005 | 0 | 65 | 0 |
| tests/e2e/fpux.1-keyboard-focus.spec.js | 1 | 0 | 0 | 18005 | 0 | 66 | 0 |
| tests/e2e/fpux.1-visual-consistency-theme.spec.js | 1 | 2 | 0 | 18005 | 0 | 67 | 0 |
| tests/e2e/frsr-s1-feature-row-session-resume.spec.js | 0 | 2 | 0 | 21086 | 0 | 68 | 0 |
| tests/e2e/ic-s4-keyboard-node-movement.spec.js | 3 | 0 | 0 | 20680 | 0 | 69 | 0 |
| tests/e2e/jae-s5-delivery-swimlane-grid.spec.js | 2 | 0 | 0 | 20619 | 0 | 70 | 0 |
| tests/e2e/jasb-s1-journey-autofocus-scroll.spec.js | 3 | 0 | 0 | 22511 | 0 | 71 | 0 |
| tests/e2e/jcx-s6-swimlane-grid.spec.js | 3 | 1 | 0 | 20705 | 0 | 72 | 0 |
| tests/e2e/jcx-s7-panel-entry-and-save-feedback.spec.js | 1 | 0 | 0 | 20644 | 0 | 73 | 0 |
| tests/e2e/kbsf-s1-shell-wrapping-visual.spec.js | 1 | 0 | 0 | 19828 | 0 | 74 | 0 |
| tests/e2e/lphf-s1-keyboard-nav.spec.js | 1 | 0 | 0 | 18005 | 0 | 75 | 0 |
| tests/e2e/lphf-s2-responsive.spec.js | 2 | 0 | 0 | 18005 | 0 | 76 | 0 |
| tests/e2e/lphf-s3-responsive.spec.js | 2 | 0 | 0 | 18005 | 0 | 77 | 0 |
| tests/e2e/lphf-s4-responsive.spec.js | 2 | 0 | 0 | 18005 | 0 | 78 | 0 |
| tests/e2e/lphf-s5-responsive.spec.js | 3 | 0 | 0 | 18005 | 0 | 79 | 0 |
| tests/e2e/psh-s4-dashboard-layout.spec.js | 1 | 0 | 0 | 18024 | 0 | 80 | 0 |
| tests/e2e/psh-s6-product-kanban.spec.js | 0 | 1 | 0 | 18024 | 0 | 81 | 0 |
| tests/e2e/rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js | 0 | 1 | 0 | 23617 | 0 | 82 | 0 |
| tests/e2e/reference-upload.spec.js | 0 | 7 | 0 | 22559 | 0 | 83 | 0 |
| tests/e2e/s1.2-not-ready-explanation.spec.js | 1 | 0 | 0 | 19838 | 0 | 84 | 0 |
| tests/e2e/s3.1-drag-to-advance.spec.js | 2 | 1 | 0 | 19973 | 0 | 85 | 0 |
| tests/e2e/session-persistence.spec.js | 1 | 0 | 5 | 18005 | 0 | 86 | 0 |
| tests/e2e/tfhc-s1-seed-journey-fixture.spec.js | 2 | 0 | 0 | 18446 | 0 | 87 | 0 |
| tests/e2e/wuce18-keyboard-nav.spec.ts | 1 | 1 | 0 | 18830 | 0 | 88 | 0 |
| tests/e2e/wuce23-skill-launcher-landing.spec.js | 5 | 0 | 0 | 18307 | 0 | 89 | 0 |

## Files no spec touches (31 of 201)

- src/web-ui/adapters/db-ready.js
- src/web-ui/adapters/decisions-log-writer.js
- src/web-ui/adapters/feature-story-structure.js
- src/web-ui/adapters/pipeline-status.js
- src/web-ui/adapters/session-redis.js
- src/web-ui/adapters/skill-session-redis.js
- src/web-ui/artefacts/artefact-adapter.js
- src/web-ui/modules/reference-reader.js
- src/web-ui/modules/reference-validator.js
- src/web-ui/port-extract/port/src/web-ui/utils/html-shell.js
- src/web-ui/port-extract/port/src/web-ui/views/actions-view.js
- src/web-ui/port-extract/port/src/web-ui/views/artefact-view.js
- src/web-ui/port-extract/port/src/web-ui/views/chat-view.js
- src/web-ui/port-extract/port/src/web-ui/views/commit-view.js
- src/web-ui/port-extract/port/src/web-ui/views/components.js
- src/web-ui/port-extract/port/src/web-ui/views/dashboard-view.js
- src/web-ui/port-extract/port/src/web-ui/views/features-view.js
- src/web-ui/public/approval-modal.js
- src/web-ui/public/artefact-edit-merge.js
- src/web-ui/public/artefact-sidebar.js
- src/web-ui/public/presence-sidebar.js
- src/web-ui/public/stage-list.js
- src/web-ui/utils/annotation-renderer.js
- src/web-ui/utils/definition-artefact-splitter.js
- src/web-ui/utils/review-artefact-splitter.js
- src/web-ui/utils/status-board.js
- src/web-ui/utils/status-export.js
- src/web-ui/utils/token-crypto.js
- src/web-ui/views/actions-view.js
- src/web-ui/views/artefact-view.js
- src/web-ui/views/features-view.js
