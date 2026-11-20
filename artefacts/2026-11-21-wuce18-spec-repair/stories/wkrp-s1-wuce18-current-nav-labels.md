## Story: The keyboard-navigation E2E spec checks the nav links the sidebar has today, so it passes instead of timing out

**Epic reference:** None - short-track (test repair; one of the quarantined specs left after the E2E failure triage)
**Discovery reference:** None - short-track skips discovery. Evidence, measured on 2026-11-21 on master (`7ff0618ff`): `tests/e2e/wuce18-keyboard-nav.spec.ts` test 1 ("keyboard user can reach all nav links via Tab") waits 30 seconds for `nav a.sw-nav-item:has-text("Run a Skill")` and times out; test 2 (visible focus outline) passes. The spec's label list is `['Journeys', 'Run a Skill', 'Org board']`. pan-s1 removed the "Run a Skill" row from `NAV_ITEMS` on purpose (the comment above `NAV_ITEMS` in `src/web-ui/utils/html-shell.js` says so; the route `/skills` still exists, only the nav entry went), and the main section of the sidebar now holds Org board, Pod Manager, Signals and Journeys (account-section entries are separate; the admin-only ones are hidden from the test user). The spec was last edited in a fix that added `withAuth` and `locator.focus()`, before pan-s1.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [testing] [web-ui-test-support]

## User Story

As **the operator of the platform, who reads the E2E jobs to learn whether a change broke something**,
I want **the keyboard-navigation spec to check the nav links that exist**,
So that **the failing list loses a spec that fails for a stale expectation, and keyboard reachability of the real nav links is covered again**.

## Benefit Linkage

**Metric moved:** `wuce18` goes from one failing test of two in every recorded CI E2E run to both passing alone in at least three of three local runs and in the pull request's CI run; the E2E failing list on CI loses `wuce18`.
**How:** the spec's label list becomes the four main-section links the sidebar renders today (Org board, Pod Manager, Signals, Journeys).

## Architecture Constraints

- Change confined to `tests/e2e/wuce18-keyboard-nav.spec.ts` and, once the repaired spec has passed on CI, its entry in `tests/e2e/capability-matrix.json`. No `src/` change: removing the "Run a Skill" row was a deliberate product decision (pan-s1), not a defect.
- The spec's mechanism is unchanged (`locator.focus()` then the focused element's text contains the label), and its second test is untouched.
- Preserve each file's existing line endings (this file is CRLF).

## Dependencies

- **Upstream:** wuce.18 (the spec), pan-s1 (removed the row), pmnv-s1, sptu-s1 and ep4-s2 (added the Pod Manager, Signals and Journeys rows).
- **Downstream:** none.

## Acceptance Criteria

**AC1:** Given the repaired spec, When it runs alone, Then both tests pass, in at least three of three consecutive local runs (before: test 1 timed out after 30 s waiting for the "Run a Skill" link, measured on master).
**AC2:** Given the repaired spec, Then its label list is exactly the main-section nav labels `NAV_ITEMS` renders for a non-admin user (Org board, Pod Manager, Signals, Journeys), so a link that is later removed or renamed fails the spec instead of being skipped.
**AC3:** Given the repaired spec, Then the focus mechanism, the assertion that the focused element's text contains the label, and the second test (visible focus outline) are unchanged.
**AC4:** Given the pull request's CI run, When the E2E report is read, Then `wuce18` passes there (both tests); the matrix entry moves from `quarantined` to `extended` with a rewritten reason only after that, and CI runs on the final commit before the pull request is marked ready.
**AC5:** Given the pull request, When its changed files are listed, Then they are the spec and `tests/e2e/capability-matrix.json` only (plus artefacts).

## Out of Scope

- Any change to the nav, to `NAV_ITEMS`, or to the account-section links (Settings and the admin-only entries).
- Keyboard coverage of the Products section or the product rows.
- The other quarantined specs (`dsa-s2`, `ep3-s1`, `fpd-s4`).
- Moving the spec to the blocking `core` lane (the operator's call).

## NFRs

- **Test honesty:** the repair must not weaken the spec; each listed link must be found and focused, or the test fails.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
