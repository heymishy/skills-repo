# Story: Archive completed features from pipeline-state.json to reduce agent context load

**Epic reference:** Single-story short-track
**Discovery reference:** D8 (workspace/learnings.md) — agent context budget exhaustion identified as root cause of empty PRs
**Benefit-metric reference:** M1 (dashboard fidelity) — unblocks re-dispatch by reducing orientation cost

## User Story

As a **pipeline operator dispatching stories to coding agents**,
I want **completed features archived out of the active pipeline-state.json into a separate file**,
So that **agents orienting from pipeline-state.json read only in-flight work and don't exhaust their context budget on closed features**.

## Benefit Linkage

**Metric moved:** Agent dispatch success rate (D8 gap — currently 0% for GitHub agent dispatches on this repo)
**How:** Reducing pipeline-state.json from ~105 KB to ~15–20 KB removes 63%+ of dead context that agents must parse during orientation, directly reducing the risk of plan-without-execute failures.

## Architecture Constraints

- ADR-003 (Schema-first): any new top-level field (`archive` pointer) must be added to `pipeline-state.schema.json`
- ADR-001 (Single-file viz): `pipeline-viz.html` `loadState()` must merge archive + active at render time — no build step
- Existing skill write paths (every skill's "State update — mandatory final step") must continue to work unchanged against the active file

## Dependencies

- **Upstream:** None — pipeline-state.json structure is self-contained
- **Downstream:** Re-dispatch of p3.3 and p3.13 (unblocked by reduced file size); any future GitHub agent dispatches benefit

## Acceptance Criteria

**AC1:** Given pipeline-state.json contains features with `stage: "definition-of-done"` and `health: "green"`, When the archive script runs, Then those features are moved to `.github/pipeline-state-archive.json` and removed from `.github/pipeline-state.json`.

**AC2:** Given a feature is archived, When pipeline-state.json is read by an agent or skill, Then the active file contains only in-flight features (not archived ones) and the file size is reduced by the byte count of archived features.

**AC3:** Given `.github/pipeline-state-archive.json` exists, When `pipeline-viz.html` loads state, Then the viz merges archived features with active features and displays the complete history — no features are hidden from the dashboard.

**AC4:** Given a feature is archived, When `/record-signal` or `/definition-of-done` targets a metric on an archived feature, Then the skill checks the archive file and updates the metric there (archive is not read-only for signal recording).

**AC5:** Given the active pipeline-state.json after archiving, When `npm test` runs, Then all existing governance checks pass — no test assumes the presence of archived features in the active file.

**AC6:** Given pipeline-state.json, When it is inspected, Then a top-level `"archive"` field points to the relative path of the archive file (`.github/pipeline-state-archive.json`).

**AC7:** Given Phase 3 has 16 DoD-complete stories and 10 in-flight stories, When the archive runs, Then only the 10 in-flight stories remain in the Phase 3 feature block in the active file — DoD-complete stories within an in-flight feature are archived into a separate `completedStories` array on the feature in the archive file.

## Out of Scope

- Automatic archiving on DoD write (manual/scripted for now — automation is a future story)
- Deleting or purging archived data — archive is append-only
- Changing the pipeline-state.schema.json validation to reject completed features in the active file (enforcement is a future story)
- Fleet aggregator changes — fleet reads from squad repos, not this file directly
- Compressing or minifying the archive file

## NFRs

- **Performance:** Archive file must be valid JSON parseable in under 100ms (no lazy loading needed at current scale)
- **Data integrity:** Archive script must validate both files are valid JSON before writing — no partial writes
- **Backwards compatibility:** Skills that write to pipeline-state.json must not need modification — the archive is transparent to writers of in-flight features

## Complexity Rating

**Rating:** 2 (some ambiguity around Phase 3 partial archive and viz merge behaviour)
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
