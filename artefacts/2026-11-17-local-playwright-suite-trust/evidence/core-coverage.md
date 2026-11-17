# Core coverage comparison (lpw-s2, AC4 and AC5)

Measured by the per-spec run recorded in `per-spec-coverage.md` (each spec alone on a fresh server; statements of `src/web-ui`, 57062 in the files the server loaded). The core is the output of `scripts/select-core-specs.js` over that measurement with the failed-before list from `ci-runs-1-and-2.md`.

| Set | Statements executed | Share of 57062 |
|---|---|---|
| `lpw-s1` whole-suite baseline (all specs, run together, CI) | not comparable in count; same measure: statements 63.3%, lines 63.3%, functions 40.9%, branches 57.8% | 63.3% |
| Union of every spec, passing or failing, run alone | 36909 | 64.68% |
| Union of every currently passing spec (core and extended lanes) | 36162 | 63.37% |
| **Core (29 spec files)** | **35857** | **62.84%** |

**The core reaches 99.16% of what every passing spec reaches together** (the story requires at least 95%), and 97.15% of what all 89 specs reach, including the failing ones. The whole-suite baseline of 63.3% was measured over the loaded files of a run in which failing specs also contributed; the core is 1.84 percentage points below the all-specs union, and the table below says exactly which specs hold that difference.

## Capabilities with no passing spec (gaps)

- **pods**: all four pod specs are quarantined (the Available roster now comes from `GET /api/team/members`; the specs search for a hardcoded "Hamish").
- **reference-and-stories**: `reference-upload` and `dsda-s1` are quarantined (the chat flow they test has changed).
- **kanban-interaction** (advance, drag, reorder) has no passing spec either; its four specs are quarantined (the board no longer carries `data-journey-id`). The board itself still renders in `psh-s7`, `kbsf-s1` and the dashboard specs.

## Capability map

| Capability | Core spec files | Other specs (lane) |
|---|---|---|
| accessibility-and-responsive | dsa-s4-chat-restyle | cams-s1-chat-artefact-responsive (extended), dsa-s6-mobile-responsiveness (extended), fpux.1-contrast-ratio (extended), fpux.1-keyboard-focus (extended), fpux.1-visual-consistency-theme (quarantined), iwu2-right-panel-layout (quarantined), lphf-s1-keyboard-nav (extended), lphf-s2-responsive (extended), lphf-s3-responsive (extended), lphf-s4-responsive (extended), lphf-s5-responsive (extended), wuce18-keyboard-nav (quarantined) |
| artefact-view | annotation, dsa-s1-artefact-viewer-restyle, wuce20-artefact-index-html | artefact-preview (extended), artefact-read (extended), artefact-writeback (extended), sign-off (extended) |
| billing | bri-s3.5-billing-journey | a2-stripe-test-mode-plan-selection (scenario) |
| dashboard-and-nav | b1-nav-toggle | action-queue (extended), dsa-s2-dashboard-restyle (quarantined), dsa-s3-landing-restyle (extended), feature-navigation (extended), psh-s4-dashboard-layout (extended) |
| definition-canvas | dic-canvas | design-definition-canvas-render (quarantined) |
| diagrams | csd-s1-data-model-diagram | csd-s2-canvas-diagram-rendering (extended) |
| feature-creation | pnfc-s1-new-feature-choice | frsr-s1-feature-row-session-resume (quarantined) |
| journey-canvas | ep1-s4-stage-reorder, ic-s2-canvas-drag-position, jcx-s3-emotion-curve, tfhc-s1-seed-journey-fixture | ep1-s3-stage-panel-focus-management (quarantined), ic-s4-keyboard-node-movement (extended), jae-s5-delivery-swimlane-grid (extended), jasb-s1-journey-autofocus-scroll (extended), jcx-s6-swimlane-grid (quarantined), jcx-s7-panel-entry-and-save-feedback (extended) |
| kanban-board | kbsf-s1-shell-wrapping-visual | bmau-s1-bulk-assign-rerender (quarantined), psh-s6-product-kanban (quarantined), psh-s7-org-kanban (extended) |
| kanban-interaction | s1.2-not-ready-explanation | s1.1-board-advance-action (quarantined), s3.1-drag-to-advance (quarantined), s3.2-within-column-reorder (quarantined) |
| platform-checks | actr-s2-auto-resolve-live | actr-s2-capture-target-fixture (extended), smoke (extended) |
| pods | none | ep1-s1-pod-creation (quarantined), ep1-s2-product-default-pod (quarantined), ep1-s3-feature-pod-inheritance (quarantined), ep4-s1-multi-pod-assign (quarantined) |
| presence-and-signals | ep2-s3-approval, ep2-s3-signals-pagination, ep2-s4-concurrent-merge | ep2-s1-presence-sidebar (quarantined), ep2-s1-signals-panel (extended), spdr-s2-metric1-timing (extended) |
| reference-and-stories | none | dsda-s1-default-all-stories (quarantined), reference-upload (quarantined) |
| session-flow | dsh-s6-archived-stage-transparent-render, fjcv-s1-full-journey-core-flow-and-resume, wuce25-session-commit-result | a3-product-feature-ideate-canvas (scenario), a4-ideate-session-resume (scenario), a4-module-expand-collapse (extended), b1-formed-idea-outer-loop-story-map (scenario), dsh-s3-breadcrumb-split-view (extended), dsh-s4-resume-conversation-survives-restart (scenario), ep3-s1-regression (quarantined), rdac-s1-resume-shows-diagrams-artefact-conversation (quarantined), session-persistence (extended) |
| signup-and-auth | bri-s3.2-signup-onboarding-journey | a1-staging-auth-stub (scenario), bri-s3.6-auth-journey (extended) |
| skill-launch | ep1-s3-launcher-layout, skill-launcher | wuce23-skill-launcher-landing (extended), wuce24-guided-question-form (extended) |
| stage-model | ep2-s2-stage-visibility | ep1-s4-stage-selector (quarantined), wnl-s2-journey-gate-sticky (extended) |
| tenant-isolation | bri-s3.3-multi-user-tenant-journey, bri-s3.4-cross-tenant-isolation-journey | - |
| walkthrough-capture | ppc-s5-video-lazy-load | fpd-s1-walkthrough-capture (extended), fpd-s2-video-capture (extended), fpd-s4-caption-sync (quarantined) |

## The core, in selection order

| # | Spec | New statements | Cumulative | Share |
|---|---|---|---|---|
| 1 | fjcv-s1-full-journey-core-flow-and-resume.spec.js | 24389 | 24389 | 42.74% |
| 2 | ep2-s2-stage-visibility.spec.js | 2448 | 26837 | 47.03% |
| 3 | ep1-s4-stage-reorder.spec.js | 2093 | 28930 | 50.7% |
| 4 | b1-nav-toggle.spec.js | 764 | 29694 | 52.04% |
| 5 | dsa-s4-chat-restyle.spec.js | 738 | 30432 | 53.33% |
| 6 | actr-s2-auto-resolve-live.spec.js | 688 | 31120 | 54.54% |
| 7 | bri-s3.3-multi-user-tenant-journey.spec.js | 684 | 31804 | 55.74% |
| 8 | ep2-s4-concurrent-merge.spec.js | 674 | 32478 | 56.92% |
| 9 | wuce20-artefact-index-html.spec.js | 520 | 32998 | 57.83% |
| 10 | s1.2-not-ready-explanation.spec.js | 296 | 33294 | 58.35% |
| 11 | bri-s3.5-billing-journey.spec.js | 179 | 33473 | 58.66% |
| 12 | dic-canvas.spec.js | 146 | 33619 | 58.92% |
| 13 | skill-launcher.spec.js | 123 | 33742 | 59.13% |
| 14 | ppc-s5-video-lazy-load.spec.js | 123 | 33865 | 59.35% |
| 15 | csd-s1-data-model-diagram.spec.js | 29 | 33894 | 59.4% |
| 16 | pnfc-s1-new-feature-choice.spec.js | 12 | 33906 | 59.42% |
| 17 | kbsf-s1-shell-wrapping-visual.spec.js | 5 | 33911 | 59.43% |
| 18 | bri-s3.2-signup-onboarding-journey.spec.js | 1 | 33912 | 59.43% |
| 19 | ep2-s3-signals-pagination.spec.js | 510 | 34422 | 60.32% |
| 20 | dsa-s1-artefact-viewer-restyle.spec.js | 469 | 34891 | 61.15% |
| 21 | bri-s3.4-cross-tenant-isolation-journey.spec.js | 243 | 35134 | 61.57% |
| 22 | wuce25-session-commit-result.spec.js | 134 | 35268 | 61.81% |
| 23 | dsh-s6-archived-stage-transparent-render.spec.js | 114 | 35382 | 62.01% |
| 24 | annotation.spec.js | 88 | 35470 | 62.16% |
| 25 | ep1-s3-launcher-layout.spec.js | 86 | 35556 | 62.31% |
| 26 | jcx-s3-emotion-curve.spec.js | 83 | 35639 | 62.46% |
| 27 | ep2-s3-approval.spec.js | 80 | 35719 | 62.6% |
| 28 | tfhc-s1-seed-journey-fixture.spec.js | 77 | 35796 | 62.73% |
| 29 | ic-s2-canvas-drag-position.spec.js | 61 | 35857 | 62.84% |

## Statements only specs outside the core execute

Each row counts statements that spec executes and the core does not (a statement can appear under more than one spec). This is what a quarantined or extended spec protects that the core does not.

| Statements | Lane | Spec |
|---|---|---|
| 299 | quarantined | ep3-s1-regression.spec.js |
| 170 | quarantined | bmau-s1-bulk-assign-rerender.spec.js |
| 115 | quarantined | dsa-s2-dashboard-restyle.spec.js |
| 77 | quarantined | s3.2-within-column-reorder.spec.js |
| 73 | extended | spdr-s2-metric1-timing.spec.js |
| 72 | quarantined | s1.1-board-advance-action.spec.js |
| 72 | quarantined | s3.1-drag-to-advance.spec.js |
| 57 | extended | wnl-s2-journey-gate-sticky.spec.js |
| 49 | extended | artefact-read.spec.js |
| 35 | quarantined | ep1-s1-pod-creation.spec.js |
| 35 | quarantined | ep1-s2-product-default-pod.spec.js |
| 35 | quarantined | ep1-s3-feature-pod-inheritance.spec.js |
| 35 | quarantined | ep2-s1-presence-sidebar.spec.js |
| 35 | quarantined | ep4-s1-multi-pod-assign.spec.js |
| 34 | extended | action-queue.spec.js |
| 34 | extended | ep2-s1-signals-panel.spec.js |
| 32 | quarantined | ep1-s4-stage-selector.spec.js |
| 28 | extended | jasb-s1-journey-autofocus-scroll.spec.js |
| 26 | extended | dsh-s3-breadcrumb-split-view.spec.js |
| 26 | quarantined | iwu2-right-panel-layout.spec.js |
| 20 | quarantined | design-definition-canvas-render.spec.js |
| 20 | quarantined | rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js |
| 20 | quarantined | reference-upload.spec.js |
| 16 | quarantined | fpd-s4-caption-sync.spec.js |
| 15 | extended | cams-s1-chat-artefact-responsive.spec.js |
| 12 | extended | wuce24-guided-question-form.spec.js |
| 9 | extended | sign-off.spec.js |
| 6 | extended | feature-navigation.spec.js |
| 6 | extended | smoke.spec.js |
| 3 | extended | psh-s7-org-kanban.spec.js |
