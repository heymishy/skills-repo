## Story: Five E2E specs that fail on stale selectors and stale pinned colours check what they were written to check

**Epic reference:** None - short-track (test-only repair; follows the E2E triage in `artefacts/2026-11-20-ci-speed/reference/e2e-failing-specs-triage-2026-11-20.md`)
**Discovery reference:** None - short-track skips discovery. Evidence: the triage document, sections "Result", "Update" and "Update 2", plus a second local investigation on 2026-11-20 recorded in `decisions.md` D1. The causes, each read in the page or the source: `ep1-s3-stage-panel-focus-management` and `frsr-s1-feature-row-session-resume` take `.first()` of a selector that also matches a copy inside a `display:none` container; `jcx-s6-swimlane-grid` counts `.sw-cx-grid-cell--header` and gets 6 where 3 are visible, because the hidden delivery grid reuses the class; `ep1-s4-stage-selector` assumes the `/journey` page holds only the journey it just seeded, but the shared `e2e-tester` tenant held 138 journeys (123 visible stage dots, none hidden); `fpux.1-visual-consistency-theme` pins hex values of the old palette (`#18181B`, `#1C1C1A`, `#F4F4F2`) that `src/web-ui/utils/html-shell.js` no longer uses.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [testing] [ci]

## User Story

As **the operator of the platform, who reads the E2E job to learn whether a change broke something**,
I want **the specs that fail on every run because of how they find elements, or which colours they pin, to find the right elements and compare against the live tokens**,
So that **the failing list shrinks to real problems, a new break stands out from the old ones, and the job moves closer to being something that can block a merge**.

## Benefit Linkage

**Metric moved:** the number of E2E tests that fail on every CI run falls by 9 (from 16 in the last run, `44685372791`, to 7 or fewer), with no product code changed.
**How:** each spec keeps every assertion it has; only the way it finds the element (visible match, or scoped to the journey it seeded) or the source of the expected colour (the page's own resolved token) changes.

## Architecture Constraints

- Change confined to five files under `tests/e2e/`: `ep1-s3-stage-panel-focus-management.spec.js`, `frsr-s1-feature-row-session-resume.spec.js`, `jcx-s6-swimlane-grid.spec.js`, `ep1-s4-stage-selector.spec.js`, `fpux.1-visual-consistency-theme.spec.js`, plus artefacts.
- No change under `src/`, to any other spec, to `playwright.config.js`, or to any workflow. `continue-on-error` is not touched; removing it is a separate decision for the operator.
- No assertion is removed or loosened. A selector may become stricter (visible, or scoped to one journey); an expected value may come from the page's own resolved token instead of a literal.
- If a repaired spec still fails after its selector is correct, that is a product finding: stop, record it, and do not weaken the assertion to make it pass. The keyboard-activation half of `frsr-s1` has never been run against the visible link, so this is a live possibility there.
- The specs write real `artefacts/*e2e*` folders into the repository when run locally; any run is bracketed by a snapshot of untracked paths, and only folders the run created are removed.
- Preserve each file's existing line endings.

## Dependencies

- **Upstream:** the triage document; ci-speed `pts-s1` (staging purge), which removed the data backlog that made CI runs slow, and `rrf-s1`, which cleared `bri-s3.6`.
- **Downstream:** a later story to give each spec its own tenant or user (test isolation, `dsa-s2`, `s3.2` and the intermittent group), and the decision whether to drop `continue-on-error` behind a named allowlist.

## Acceptance Criteria

**AC1:** Given the journey page with a stage, When `ep1-s3-stage-panel-focus-management` runs, Then it activates the visible stage Edit link and the whole spec (open with focus in the panel, Tab and Shift+Tab wrap, Escape returns focus to the trigger) passes.
**AC2:** Given a product with one feature, When both tests in `frsr-s1-feature-row-session-resume` run, Then they act on the visible feature row link, and both pass (mouse click and keyboard activation).
**AC3:** Given a journey with three stages in the customer-experience view, When `jcx-s6-swimlane-grid` AC1 runs, Then it counts only the visible header cells (3) and passes, and the other three tests in the file still pass.
**AC4:** Given the `/journey` page in a tenant that already holds other journeys, When the three scenarios of `ep1-s4-stage-selector` run, Then each finds its links through the journey it seeded (using the id the seed endpoint returns), and all three pass regardless of what else is in the tenant.
**AC5:** Given the shell in light and in dark theme, When `fpux.1-visual-consistency-theme` AC2a and AC2b run, Then the expected surface and ink colours are the page's own resolved `--surface` and `--ink` for that theme (not hex literals), the dark values still differ from the light values, and both tests pass; AC1 of that file is unchanged.
**AC6:** Given each changed spec, When a deliberate break is introduced locally (a Benefits dot for the seeded journey; a wrong token; a missing stage), Then the spec fails, so none of them can pass vacuously; the breaks are recorded in the DoD and not committed.
**AC7:** Given the pull request's full E2E run on CI, When it finishes, Then none of the nine repaired tests is in the failing list and no test that passed on the last master run fails.
**AC8:** Given the pull request, When its changed files are listed, Then they are the five spec files and artefacts only.

## Out of Scope

- `bmau-s1`, `wuce18`, `spdr-s2`, `ep3-s1`, `fpd-s4` (cause unknown), and the test-isolation group (`dsa-s2`, `s3.2`, the intermittent specs).
- Cleaning the shared `e2e-tester` tenant, adding a delete endpoint, or giving each spec its own user.
- Removing `continue-on-error`, or adding an allowlist.
- Any product change, including the markup that renders the hidden delivery grid and the hidden stage Edit links.

## NFRs

- **Reliability:** a repaired spec passes with a tenant holding one journey and with a tenant holding hundreds.
- **Safety:** nothing is run against staging or production; local runs use `NODE_ENV=test`.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
