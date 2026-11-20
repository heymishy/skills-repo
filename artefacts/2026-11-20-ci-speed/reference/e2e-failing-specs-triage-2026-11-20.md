# E2E smoke job: triage of the failing specs (2026-11-20)

Read-only investigation. Nothing in `src/`, `tests/` or the workflows was changed. It follows section 2 of `purge-and-e2e-tail-diagnosis-2026-11-20.md`, which found that the "Playwright E2E smoke tests" job hides failing specs behind `continue-on-error: true`.

## Method

The Playwright JSON report (`pw-report-json` artefact) of the six most recent E2E runs on pull requests (44474260052, 44475721583, 44580666379, 44581765692, 44591354884, 44597141322, 2026-11-19), counting per test how often it failed. The error messages come from the newest run (44597141322: 249 passed, 17 failed, 25 skipped, 155 s). A claim is marked **confirmed** only where the cause was read in the source; everything else is a **hypothesis** from the error text and needs a look at the spec and the page.

## Result: 24 distinct tests fail at least once in six runs, and they fall into two groups

**Failing in all six runs (13 tests, consistent, so not flakes):** these are broken, not intermittent.

| Spec | What fails | Cause | Confidence |
|---|---|---|---|
| `fpux.1-visual-consistency-theme` AC2a, AC2b | Expected light ink `rgb(24, 24, 27)` and dark surface `rgb(28, 28, 26)`; the page renders `rgb(20, 23, 26)` and `rgb(14, 16, 19)` | Test rot. The spec pins the old palette (`--ink` `#18181B`, dark `--surface` `#1C1C1A`); `src/web-ui/utils/html-shell.js` lines 460 and 480 now define `--ink: #14171A` and dark `--surface: #0E1013`. | **Confirmed** |
| `fpd-s4-caption-sync` | `.playback-ac__video` not found (no element at all) | Test rot or a removed feature: the selector matches nothing. | Hypothesis |
| `jcx-s6-swimlane-grid` AC1 | Expected 3 `.sw-cx-grid-cell--header`, found 6 | The header markup is emitted from two places in `src/web-ui/routes/journeys.js` (lines 981 and 1277), so a second grid or a duplicated render matches the selector. Either the spec is stale or the page renders the grid twice. | Hypothesis, needs a look |
| `ep1-s4-stage-selector` scenario 2 | Expected 0 "Move back to Benefits" links, found 2 | A second copy of the stage navigation (for example a mobile or secondary nav) matches the selector, or the disabled state no longer removes the link. | Hypothesis |
| `ep1-s3-stage-panel-focus-management` | `#sw-stage-panel` keeps class `sw-stage-panel` and `aria-hidden="true"` after the open action | The panel does not open: either the trigger no longer opens it (a real defect in a keyboard-accessibility feature) or the trigger changed. | Hypothesis, possible real defect |
| `frsr-s1-feature-row-session-resume` (2 tests) | `a.pvc-item-link` is found but is **hidden** | The row link exists but is not visible. One of the two tests is "keyboard-activatable (not mouse-only)", so a hidden link may be a real accessibility regression, or the restyle made the link a visually hidden overlay. | Hypothesis, possible real defect |
| `bri-s3.6-auth-journey` AC1 | First-time GitHub login lands on `/dashboard`, expected `/welcome` | Either the first-login detection changed (a behaviour defect) or the test user already exists in the shared database so it is no longer a first login. | Hypothesis, possible real defect |
| `bmau-s1-bulk-assign-rerender` | 30 s test timeout | Not known. | Unknown |
| `wuce18-keyboard-nav` | 30 s test timeout on "keyboard user can reach all nav links via Tab" | Not known; may be linked to the duplicated navigation seen in `ep1-s4`. | Unknown |
| `spdr-s2-metric1-timing` | Expected 10 completed filter, sort and dismiss rounds, got 9, in all six runs | A performance guard that counts rounds; consistently 9, so not random. | Hypothesis |
| `ep3-s1-regression` | `waitForURL('**/skills/definition/sessions/**')` times out after 10 s | The flow no longer navigates to that URL after the form submit. | Hypothesis |

**Failing in 5 of 6 runs (3 tests):** `dsa-s2-dashboard-restyle` AC7 (both tests) and `s3.2-within-column-reorder` AC3. The dashboard greeting reads `3 in-progress sessions` where the test expects 2, and `1 in-progress session` where it expects 0. Both counts are off by the same kind of amount, which points to **leakage between tests** (the same `e2e-tester` user sees journeys created by other specs) rather than to a defect in the count. Hypothesis.

**Failing in 1 to 3 of 6 runs (8 tests, intermittent):** `ep1-s2-product-default-pod` (3), `dsa-s1-artefact-viewer-restyle` AC8, `ic-s4-keyboard-node-movement`, `pnfc-s1-new-feature-choice` AC2 (2 each), `s1.1-board-advance-action` (2), `ic-s2-canvas-drag-position`, `jae-s5-delivery-swimlane-grid`, `pnfc-s1` AC3 (1 each). Likely ordering, timing or shared-state flakes; not investigated.

## What this means

1. **The job gives no signal today.** About 17 tests fail on every run and the step is `continue-on-error`, so a new break in any of these 24 tests cannot be told from the existing ones. The reliability of the other 249 passing tests is unaffected.
2. **Most of the consistent failures look like specs that were not updated when the UI changed** (the design-system restyle changed colours, markup and the number of nav copies). One cause is confirmed (`fpux.1`).
3. **Three failures could be real defects in keyboard accessibility or first-login behaviour** (`ep1-s3`, `frsr-s1`, `bri-s3.6`). They are the ones worth looking at first because a user could be affected, not just a test.
4. **Time cost is small now.** With 17 failures the whole job takes about 155 s, the step median is about 165 s; the old 880 s tail came from a period with 56 to 59 failures. Fixing these will save little time; the value is the signal.

## Suggested stories (each is the operator's call; none is started)

- **E2E triage 1, restore the signal for the confirmed rot:** update `fpux.1` to the current tokens (read them from the CSS, or assert on the variable names, not hex values); decide per spec whether `fpd-s4` is still a feature.
- **E2E triage 2, the three possible real defects** (`ep1-s3`, `frsr-s1`, `bri-s3.6`): open each page, decide defect or stale spec, and write a bug story for any defect.
- **E2E triage 3, test isolation** (`dsa-s2` counts, `s3.2`, and the intermittent group): give each spec its own user or clean its data.
- **E2E gate, later:** once the list is short, move the known-failing specs into a named allowlist and drop `continue-on-error`, so a new failure turns the job red. This is the step that makes the job a gate; it needs the operator's agreement because it changes what blocks a merge.
