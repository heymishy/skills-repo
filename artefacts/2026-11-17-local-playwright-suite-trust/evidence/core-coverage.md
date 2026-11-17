# Core coverage comparison (lpw-s2, AC4 and AC5)

Measured by the per-spec run recorded in `per-spec-coverage.md` (each spec alone on a fresh server; statements of `src/web-ui`, 57062 in the files the server loaded). The core is the output of `scripts/select-core-specs.js` over that measurement with the failed-before list (the deterministic failures and the flaky spec of the two `lpw-s1` runs, `ci-runs-1-and-2.md`).

| Set | Statements executed | Share of 57062 |
|---|---|---|
| `lpw-s1` whole-suite baseline (all specs, run together, CI) | not comparable in count; same measure: statements 63.3%, lines 63.3%, functions 40.9%, branches 57.8% | 63.3% |
| Union of every spec, passing or failing, run alone | 36909 | 64.68% |
| Union of every currently passing spec (core and extended lanes) | 34812 | 61.01% |
| **Core (27 spec files)** | **34567** | **60.58%** |

**The core reaches 99.30% of what every passing spec reaches together** (the story requires at least 95%), and 93.65% of what all 89 specs reach, including the failing and quarantined ones. The core is 4.10 percentage points of server statements below the all-specs union and below the `lpw-s1` whole-suite baseline of 63.3% (a run in which failing specs also contributed); the last table says exactly which specs hold that difference.

## Capabilities with no passing core spec (gaps)

- **feature-creation**: frsr-s1-feature-row-session-resume (quarantined), pnfc-s1-new-feature-choice (quarantined)
- **kanban-interaction**: s1.1-board-advance-action (quarantined), s1.2-not-ready-explanation (quarantined), s3.1-drag-to-advance (quarantined), s3.2-within-column-reorder (quarantined)
- **pods**: ep1-s1-pod-creation (quarantined), ep1-s2-product-default-pod (quarantined), ep1-s3-feature-pod-inheritance (quarantined), ep4-s1-multi-pod-assign (quarantined)
- **reference-and-stories**: dsda-s1-default-all-stories (quarantined), reference-upload (quarantined)

## Capability map

| Capability | Core spec files | Other specs (lane) |
|---|---|---|
| accessibility-and-responsive | dsa-s4-chat-restyle | cams-s1-chat-artefact-responsive (extended), dsa-s6-mobile-responsiveness (extended), fpux.1-contrast-ratio (extended), fpux.1-keyboard-focus (extended), fpux.1-visual-consistency-theme (quarantined), iwu2-right-panel-layout (quarantined), lphf-s1-keyboard-nav (extended), lphf-s2-responsive (extended), lphf-s3-responsive (extended), lphf-s4-responsive (extended), lphf-s5-responsive (extended), wuce18-keyboard-nav (quarantined) |
| artefact-view | annotation, dsa-s1-artefact-viewer-restyle, wuce20-artefact-index-html | artefact-preview (extended), artefact-read (extended), artefact-writeback (extended), sign-off (extended) |
| billing | bri-s3.5-billing-journey | a2-stripe-test-mode-plan-selection (scenario) |
| dashboard-and-nav | b1-nav-toggle | action-queue (extended), dsa-s2-dashboard-restyle (quarantined), dsa-s3-landing-restyle (extended), feature-navigation (extended), psh-s4-dashboard-layout (extended) |
| definition-canvas | dic-canvas | design-definition-canvas-render (quarantined) |
| diagrams | csd-s1-data-model-diagram | csd-s2-canvas-diagram-rendering (extended) |
| feature-creation | none | frsr-s1-feature-row-session-resume (quarantined), pnfc-s1-new-feature-choice (quarantined) |
| journey-canvas | ep1-s4-stage-reorder, ic-s2-canvas-drag-position, jcx-s3-emotion-curve, tfhc-s1-seed-journey-fixture | ep1-s3-stage-panel-focus-management (quarantined), ic-s4-keyboard-node-movement (extended), jae-s5-delivery-swimlane-grid (extended), jasb-s1-journey-autofocus-scroll (extended), jcx-s6-swimlane-grid (quarantined), jcx-s7-panel-entry-and-save-feedback (extended) |
| kanban-board | psh-s7-org-kanban | bmau-s1-bulk-assign-rerender (quarantined), kbsf-s1-shell-wrapping-visual (quarantined), psh-s6-product-kanban (quarantined) |
| kanban-interaction | none | s1.1-board-advance-action (quarantined), s1.2-not-ready-explanation (quarantined), s3.1-drag-to-advance (quarantined), s3.2-within-column-reorder (quarantined) |
| platform-checks | actr-s2-auto-resolve-live | actr-s2-capture-target-fixture (extended), smoke (extended) |
| pods | none | ep1-s1-pod-creation (quarantined), ep1-s2-product-default-pod (quarantined), ep1-s3-feature-pod-inheritance (quarantined), ep4-s1-multi-pod-assign (quarantined) |
| presence-and-signals | ep2-s3-approval, ep2-s3-signals-pagination, ep2-s4-concurrent-merge | ep2-s1-presence-sidebar (quarantined), ep2-s1-signals-panel (extended), spdr-s2-metric1-timing (extended) |
| reference-and-stories | none | dsda-s1-default-all-stories (quarantined), reference-upload (quarantined) |
| session-flow | dsh-s6-archived-stage-transparent-render, fjcv-s1-full-journey-core-flow-and-resume, wuce25-session-commit-result | a3-product-feature-ideate-canvas (scenario), a4-ideate-session-resume (scenario), a4-module-expand-collapse (extended), b1-formed-idea-outer-loop-story-map (scenario), dsh-s3-breadcrumb-split-view (extended), dsh-s4-resume-conversation-survives-restart (scenario), ep3-s1-regression (quarantined), rdac-s1-resume-shows-diagrams-artefact-conversation (quarantined), session-persistence (extended) |
| signup-and-auth | bri-s3.2-signup-onboarding-journey | a1-staging-auth-stub (scenario), bri-s3.6-auth-journey (quarantined) |
| skill-launch | ep1-s3-launcher-layout, skill-launcher | wuce23-skill-launcher-landing (extended), wuce24-guided-question-form (extended) |
| stage-model | wnl-s2-journey-gate-sticky | ep1-s4-stage-selector (quarantined), ep2-s2-stage-visibility (quarantined) |
| tenant-isolation | bri-s3.3-multi-user-tenant-journey, bri-s3.4-cross-tenant-isolation-journey | - |
| walkthrough-capture | ppc-s5-video-lazy-load | fpd-s1-walkthrough-capture (extended), fpd-s2-video-capture (extended), fpd-s4-caption-sync (quarantined) |

## The core, in selection order

| # | Spec | New statements | Cumulative | Share |
|---|---|---|---|---|
| 1 | fjcv-s1-full-journey-core-flow-and-resume | 24389 | 24389 | 42.74% |
| 2 | ep1-s4-stage-reorder | 2139 | 26528 | 46.49% |
| 3 | bri-s3.3-multi-user-tenant-journey | 1766 | 28294 | 49.58% |
| 4 | b1-nav-toggle | 764 | 29058 | 50.92% |
| 5 | dsa-s4-chat-restyle | 736 | 29794 | 52.21% |
| 6 | actr-s2-auto-resolve-live | 705 | 30499 | 53.45% |
| 7 | wuce20-artefact-index-html | 696 | 31195 | 54.67% |
| 8 | ep2-s4-concurrent-merge | 674 | 31869 | 55.85% |
| 9 | bri-s3.5-billing-journey | 179 | 32048 | 56.16% |
| 10 | dic-canvas | 146 | 32194 | 56.42% |
| 11 | skill-launcher | 123 | 32317 | 56.63% |
| 12 | ppc-s5-video-lazy-load | 123 | 32440 | 56.85% |
| 13 | wnl-s2-journey-gate-sticky | 61 | 32501 | 56.96% |
| 14 | csd-s1-data-model-diagram | 29 | 32530 | 57.01% |
| 15 | psh-s7-org-kanban | 3 | 32533 | 57.01% |
| 16 | bri-s3.2-signup-onboarding-journey | 1 | 32534 | 57.02% |
| 17 | ep2-s3-signals-pagination | 510 | 33044 | 57.91% |
| 18 | dsa-s1-artefact-viewer-restyle | 469 | 33513 | 58.73% |
| 19 | bri-s3.4-cross-tenant-isolation-journey | 321 | 33834 | 59.29% |
| 20 | wuce25-session-commit-result | 134 | 33968 | 59.53% |
| 21 | dsh-s6-archived-stage-transparent-render | 114 | 34082 | 59.73% |
| 22 | ep2-s3-approval | 90 | 34172 | 59.89% |
| 23 | annotation | 88 | 34260 | 60.04% |
| 24 | ep1-s3-launcher-layout | 86 | 34346 | 60.19% |
| 25 | jcx-s3-emotion-curve | 83 | 34429 | 60.34% |
| 26 | tfhc-s1-seed-journey-fixture | 77 | 34506 | 60.47% |
| 27 | ic-s2-canvas-drag-position | 61 | 34567 | 60.58% |

## Statements only specs outside the core execute

Each row counts statements that spec executes and the core does not (a statement can appear under more than one spec). This is what a quarantined or extended spec protects that the core does not.

| Statements | Lane | Spec |
|---|---|---|
| 1119 | quarantined | ep2-s2-stage-visibility |
| 807 | quarantined | bmau-s1-bulk-assign-rerender |
| 648 | quarantined | pnfc-s1-new-feature-choice |
| 637 | quarantined | frsr-s1-feature-row-session-resume |
| 299 | quarantined | ep3-s1-regression |
| 298 | quarantined | s1.1-board-advance-action |
| 298 | quarantined | s3.1-drag-to-advance |
| 288 | quarantined | s3.2-within-column-reorder |
| 221 | quarantined | s1.2-not-ready-explanation |
| 211 | quarantined | kbsf-s1-shell-wrapping-visual |
| 115 | quarantined | dsa-s2-dashboard-restyle |
| 73 | extended | spdr-s2-metric1-timing |
| 54 | quarantined | ep1-s3-feature-pod-inheritance |
| 54 | quarantined | ep2-s1-presence-sidebar |
| 54 | quarantined | ep4-s1-multi-pod-assign |
| 49 | extended | artefact-read |
| 35 | quarantined | ep1-s1-pod-creation |
| 35 | quarantined | ep1-s2-product-default-pod |
| 34 | extended | action-queue |
| 34 | extended | ep2-s1-signals-panel |
| 32 | quarantined | ep1-s4-stage-selector |
| 28 | extended | jasb-s1-journey-autofocus-scroll |
| 26 | extended | dsh-s3-breadcrumb-split-view |
| 26 | quarantined | iwu2-right-panel-layout |
| 20 | quarantined | design-definition-canvas-render |
| 20 | quarantined | rdac-s1-resume-shows-diagrams-artefact-conversation |
| 20 | quarantined | reference-upload |
| 16 | quarantined | fpd-s4-caption-sync |
| 15 | extended | cams-s1-chat-artefact-responsive |
| 12 | extended | wuce24-guided-question-form |
| 9 | extended | sign-off |
| 6 | extended | feature-navigation |
| 6 | extended | smoke |
