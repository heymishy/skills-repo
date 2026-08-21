## Story: Backfill missing test-plan artefacts for 11 already-shipped stories

**Epic reference:** None — short-track, found while investigating trace validation failure on PR #750 (lrtc-s1)
**Discovery reference:** None — short-track (bounded documentation backfill)
**Benefit-metric reference:** None — short-track
**Domain:** [governance]

## User Story

As a **platform maintainer relying on `/trace`'s traceability chain to reflect reality**,
I want **every already-shipped story that genuinely lacks a test-plan artefact to either have one backfilled or be explicitly exempted**,
So that **`/trace`'s `test_plan_coverage` check reports a true positive rate of 100%, and CI failures on unrelated PRs stop being caused by pre-existing gaps they didn't introduce**.

## Benefit Linkage

**Metric moved:** None formally tracked (short-track governance-debt cleanup) — closes the residual 11-item gap found 2026-08-21 while diagnosing why `lrtc-s1`'s (unrelated) PR #750 failed `/trace`'s traceability CI gate.
**How:** Restores traceability-chain accuracy for 4 already-shipped features; removes a standing, repo-wide false-CI-failure risk that will otherwise resurface on every future PR until resolved.

## Background (found during lrtc-s1's PR review, 2026-08-21)

PR #750 (`lrtc-s1`) failed `/trace`'s `test_plan_coverage` check with 21 "MISSING" test-plan entries. Investigation split these into two distinct root causes:

1. **10 false positives** (already fixed, commit `3348c3d2` on master, 2026-08-21): these stories' `pipeline-state.json` entries never recorded `testPlan.artefact`, so the checker's fallback guessed an expected filename from the story's full slug instead of using the real, shorter filename actually on disk. Both the file and the story entry were always correct — only the artefact-path link was missing. Fixed by populating `testPlan.artefact` for: `fps-s1`, `spv-s1`, `dss-s1`, `dsn-s1`, `ftcg-s1`, `acv-s1`, `pss-s1`, `rlcc-s1`, `nis-s1`, `bjs-s1`.
2. **11 genuine gaps** (this story's scope): these stories have no test-plan file anywhere, under any naming convention. All are already shipped (`prStatus: merged` or `dodStatus: complete` where checked) across 4 features:
   - `2026-07-25-code-shape-diagrams`: `alrf-s9`
   - `2026-07-26-canvas-render-and-story-extraction-fix`: `r-canvas-render-and-story-extraction-fix` (the feature's own top-level story), `alrf-s1`, `alrf-s2`, `alrf-s4`
   - `2026-07-26-storage-drift-audit`: `alrf-s3`
   - `2026-07-26-function-level-audit`: `alrf-s5`, `alrf-s6`, `alrf-s8`, `alrf-s10`, `alrf-s11`

## Architecture Constraints

- Use `templates/retrospective-story.md`'s pattern (already exists in this repo for exactly this "work landed without a full artefact chain" case) — but since the SOURCE is missing a test-plan, not a whole story, apply it narrowly: for each of the 11 items, either (a) write a genuine test plan reconstructed from the shipped code's actual test coverage (read the story's `dod/` artefact and the real test files referenced there — most `alrf-*` stories are expected to already have real tests committed under `tests/`, just never had a formal test-plan artefact written), or (b) if no real test coverage exists for a given item, flag it as a genuine test-coverage gap (not just a missing-artefact gap) and route it to `/test-plan` properly.
- Do not re-verify or re-implement the underlying features — confirmed already shipped and stable; this is a documentation/traceability backfill only.
- Once each test-plan artefact is written, update the corresponding `pipeline-state.json` story entry's `testPlan.artefact` field (same fix pattern as the 10 already resolved) so future `/trace` runs find it directly rather than falling back to guessing.

## Dependencies

- **Upstream:** None — all 11 source features are already merged.
- **Downstream:** None. Unblocks `/trace`'s `test_plan_coverage` check from firing on unrelated future PRs.

## Acceptance Criteria

**AC1:** Given each of the 11 identified stories, When its shipped code and `dod/` artefact are reviewed, Then a determination is made per-story: real test coverage exists (write the test-plan artefact reconstructing it) or a genuine test-coverage gap exists (route to `/test-plan` for real, not retrospective, test authoring).

**AC2:** Given all 11 test-plan artefacts are written (or genuine gaps are separately routed), When `/trace`'s `test_plan_coverage` check is run, Then it reports 0 MISSING entries for these 11 stories.

**AC3:** Given each backfilled test-plan artefact, When `pipeline-state.json` is updated, Then the corresponding story's `testPlan.artefact` field points to the new file, preventing future filename-guessing false positives for these same 11 stories.

## Out of Scope

- The 10 false-positive stories already fixed in commit `3348c3d2` — not part of this story.
- Re-implementing, re-testing, or re-verifying the underlying shipped features themselves.
- A broader audit of `/trace`'s checker logic for other classes of false positive beyond the `testPlan.artefact` fallback-guessing pattern already found and fixed.

## NFRs

- **Security:** None identified — documentation/traceability backfill only.
- **Performance:** None identified.
- **Accessibility:** Not applicable.
- **Audit:** None new.

## Complexity Rating

**Rating:** 2 — mechanical for the items with real existing test coverage to reconstruct from; genuinely unknown complexity for any item that turns out to be a real test-coverage gap (won't know until each is reviewed).
**Scope stability:** Stable in scope (11 named items), but individual item effort is unstable until reviewed.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
