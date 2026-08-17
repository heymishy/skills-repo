## Story: Backfill rpc-s1's missing accessibility test and jrf-s1's narrower-than-required regression pass

**Epic reference:** None — short-track, closing two self-documented, unrelated gaps bundled for delivery efficiency
**Discovery reference:** None — short-track
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As a **platform maintainer**,
I want **`rpc-s1`'s promised automated accessibility test written, and `jrf-s1`'s regression verification widened to match what its own DoR contract required**,
So that **two small, already-diagnosed verification gaps found during the DoD backlog pass are closed rather than left as permanent undocumented debt**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track gap-closure) — closes two gaps found while writing retroactive DoDs (2026-08-17/18):
1. `rpc-s1`'s test plan promised a dedicated automated NFR-Accessibility test, but the shipped suite (`check-rpc-s1-connect-repo.js`) contains none — manual code review during the DoD pass confirmed the underlying markup (labels/aria-labels) is already compliant, so this is a coverage gap, not a known defect.
2. `jrf-s1`'s AC4 regression test (`check-jrf-s1-new-feature-redirect.js`, IT5) only calls the fixed handler twice in isolation, rather than running the full existing suite against the documented 67/345 baseline the DoR contract's Coding Agent Instructions explicitly required.

**How:** Both are narrow, already-diagnosed, low-risk fixes — writing the missing test and widening the regression scope closes each gap directly.

## Architecture Constraints

- For `rpc-s1`: add the accessibility test to the existing `tests/check-rpc-s1-connect-repo.js` file, matching this repo's existing NFR-Accessibility test conventions elsewhere (e.g. label/aria-label presence assertions against rendered markup) — do not introduce a new testing framework or pattern.
- For `jrf-s1`: widen `check-jrf-s1-new-feature-redirect.js`'s IT5 to actually run the full regression suite against the documented 67/345 baseline (or the current equivalent count, re-baselined if the suite has grown since), per the DoR contract's original Coding Agent Instructions — do not just add more isolated calls to the fixed handler.

## Dependencies

- **Upstream:** `rpc-s1` (merged, PR #508+#510) and `jrf-s1` (merged) — this story closes test-coverage gaps in each story's own delivered scope. The two upstream stories are unrelated to each other; bundled here only because both are small, already-diagnosed test-coverage backfills found in the same DoD backlog pass.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `rpc-s1`'s repo-connection UI, When the new automated accessibility test runs, Then it asserts the labels/aria-labels already confirmed present via manual review during the DoD pass, closing the test-plan-promised-but-missing gap.

**AC2:** Given `jrf-s1`'s IT5 regression test, When widened, Then it actually runs the full regression suite (or a clearly-scoped, correctly-baselined subset matching the DoR contract's original intent) rather than two isolated calls to the fixed handler, and the result is compared against a real, current baseline count.

**AC3:** Given both AC1 and AC2, When the respective test files are run, Then all assertions pass with no new regressions introduced by this story's own changes.

## Out of Scope

- Any change to `rpc-s1`'s or `jrf-s1`'s actual production code — both stories' underlying fixes are already confirmed correct (per their own DoDs); this story only backfills verification coverage.
- Broader audit for other stories with similarly incomplete verification — scoped to these two specific, already-diagnosed gaps.

## NFRs

- **Accessibility:** Core purpose of AC1 — closes a real test-coverage gap for an already-compliant UI.
- **Performance:** None identified.
- **Security:** None identified.
- **Audit:** None new.

## Complexity Rating

**Rating:** 1 — both fixes are narrow, already-diagnosed, and scoped to a single existing test file each.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
