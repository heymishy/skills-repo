## Definition of Ready: Five E2E specs that fail on stale selectors and stale pinned colours check what they were written to check

**Story reference:** artefacts/2026-11-20-e2e-selector-hygiene/stories/esh-s1-stale-selectors-and-pinned-values.md
**Test plan reference:** artefacts/2026-11-20-e2e-selector-hygiene/test-plans/esh-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-20
**Track:** short

## Contract Proposal
- `tests/e2e/ep1-s3-stage-panel-focus-management.spec.js`, `frsr-s1-feature-row-session-resume.spec.js`, `jcx-s6-swimlane-grid.spec.js`, `ep1-s4-stage-selector.spec.js`, `fpux.1-visual-consistency-theme.spec.js` (AC1 to AC5): the selector or expected-value repairs listed in the test plan, no assertion removed or loosened.
- `decisions.md` D1 and a DoD, with the deliberate-break results (AC6) and the CI failing-list comparison (AC7).
- Not built: nothing under `src/`, no other spec, no `playwright.config.js`, no workflow, no `continue-on-error` change, no data cleanup.

## Contract Review
Contract review passed. All 8 acceptance criteria map to a repaired spec, a recorded manual step, or the CI run. The five spec files are the required touchpoints and appear in no exclusion list; the files in the exclusion list (`src/`, workflows, other specs) have no assertions in the plan.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. The specs are outside the `npm test` chain; the pull request is for review, and the operator merges.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator of the platform |
| H2 | At least 3 ACs in Given / When / Then | Pass | 8 ACs |
| H3 | Every AC has a test | Pass | AC6 and AC8 are recorded manual steps; AC7 is the CI run |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | the specs are the E2E tooling; no CSS-layout AC is added |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | none added or changed |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI change; the story reads tokens, it does not define them |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | The keyboard-activation half of `frsr-s1` has never been run against the visible link. If it fails with a correct selector, it is a possible keyboard-accessibility defect: stop, record it in the DoD and the PR, and do not weaken the assertion. |
| W2 | Accepted | CI runs see far fewer leftover journeys than the local tenant (the newest CI run found 2 stray Benefits links in `ep1-s4` scenario 2, the local run found 8), so a green CI run is weaker evidence for AC4 than the local run with the full tenant. Both are recorded. |
| W3 | Accepted | `fpux.1` stops pinning the palette. A deliberate palette change will no longer fail it; the colour values themselves are the design system's concern (`scripts/check-design-tokens.js`, DESIGN.md), not this spec's. |
| W4 | Accepted | Local runs create real `artefacts/*e2e*` folders in the repository. The agent snapshots untracked paths first and removes only what the run created, by exact path, never with a directory-wide add or delete. |
| W5 | Accepted | Nine of 16 failing tests are addressed. Seven remain (`bmau-s1`, `wuce18`, `spdr-s2`, `ep3-s1`, `fpd-s4`, and the test-isolation group), so the job still cannot gate a merge. |

## Oversight level
**Low** - test-only, no product code. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-20-e2e-selector-hygiene/stories/esh-s1-stale-selectors-and-pinned-values.md
Test plan: artefacts/2026-11-20-e2e-selector-hygiene/test-plans/esh-s1-test-plan.md
Goal: in a worktree, repair the five specs as listed in the test plan, run them locally against the test-mode server, record the deliberate-break results, open a draft PR, and compare the PR's CI failing list with master's.
Constraints:
- Touch only the five spec files in tests/e2e/ and artefacts.
- Do not change src/, any other spec, playwright.config.js, any workflow, or continue-on-error.
- Do not remove or loosen any assertion; a selector may become stricter, an expected value may come from a resolved token.
- If a repaired spec still fails, report it as a finding; do not change its assertion to pass.
- Snapshot untracked paths before any local run; remove only folders that run created, by exact path.
- Deliberate breaks (AC6) are local only and never committed.
- Preserve each file's existing line endings.
- Check the absolute path contains .worktrees/esh-s1/ before every edit.
```
