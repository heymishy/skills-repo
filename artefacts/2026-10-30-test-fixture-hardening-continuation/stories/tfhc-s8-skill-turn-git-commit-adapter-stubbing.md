## Story: Stub the real git-commit adapter in the 14 remaining skill-turn test files

**Epic reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/epics/fixture-divergence-closure.md
**Discovery reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/discovery.md
**Benefit-metric reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/benefit-metric.md
**Spike reference:** artefacts/2026-10-30-test-fixture-hardening-continuation/spikes/tfhc-s6-output.md (PROCEED-conditional verdict unlocks this story)
**Domain:** [testing]

## User Story

As the **platform maintainer who owns the long-term health of this repo's test infrastructure**,
I want **all 14 test files that genuinely drive an artefact-completing skill turn to stub the real `_skillTurnGitCommit` adapter, the same way the 12 already-safe files do**,
So that **this repo's own test run never fires a real `git add`/`git commit` as a side effect — closing both the standing "skills.js fires a real git commit during tests" junk-commit-contamination bug and the precondition `scripts/run-all-tests.js` parallelization needs before it can be implemented safely**.

## Benefit Linkage

**Metric moved:** Parallelization risk resolution, implementation half (m9)
**How:** `tfhc-s6`'s spike found the real risk mechanism directly (`stis-s1`'s D37 adapter, `_skillTurnGitCommit`, gated by `done && _artefactText` in `handlePostTurnStreamHtml`) and named a precise, small, closeable 14-file list — this story closes that list using the exact mechanical pattern already proven 12 times in this same suite.

## Architecture Constraints

D37 injectable adapter rule (CLAUDE.md "Coding standards") — `setSkillTurnGitCommitAdapter` already exists and is already the established pattern; this story applies it to 14 more call sites, it does not introduce a new adapter.

## Dependencies

- **Upstream:** `tfhc-s6` (spike) — PROCEED-conditional verdict confirmed before this story was written; this story is exactly the condition that verdict named. Not a blocking pipeline dependency now that the spike is closed.
- **Downstream:** `scripts/run-all-tests.js` parallelization implementation itself remains a separate, later story — explicitly gated on this one landing first (per `tfhc-s6`'s own outcome artefact), not bundled with it.

## Acceptance Criteria

**AC1:** Given the 14 files named in `tfhc-s6`'s spike outcome (`check-alrf-s8-journey-slug-priority.js`, `check-mfc1-model-first-chat-session.js`, `check-res-s3-suggest-revision-materiality.js`, `check-defs-revs-s1-wiring-into-turn-completion.js`, `check-wsd-s4-pipeline-state-owner-repo-resolution.js`, `check-wsap-s3-multi-story-commit-and-no-review-rerun.js`, `check-wsap-s1-story-scoped-artefact-paths.js`, `check-rsc-s1-review-split-coverage.js`, `check-res-s2-overwrite-artefact-in-place-on-revision.js`, `check-ral-s1-audit-log-journey-id-and-timestamp.js`, `check-isc-s1-ideate-success-lens-cycling.js`, `check-dsh-s1-persist-session-turns.js`, `check-dcuf-s1-github-commit-real-completion-point.js`, `check-csgc-s1-story-extraction-and-gate-confirm.js`), When each file is modified, Then every one calls `setSkillTurnGitCommitAdapter` with a no-op or assertion-only stub before any test that drives a turn reaching `done && _artefactText`, matching the exact pattern already used in the 12 currently-safe files (e.g. `tests/check-dic1-story-cards.js`).

**AC2:** Given all 14 files are stubbed, When `scripts/check-skill-turn-git-commit-stubbing.js` (new structural check) scans every `tests/*.js` file that calls `handlePostTurnStreamHtml` with an `---ARTEFACT-END---`-bearing fixture response, Then it exits non-zero and names any file missing a `setSkillTurnGitCommitAdapter` stub; run against the repo after AC1, it exits 0 — 0 of 41 calling files unstubbed, down from the 14 `tfhc-s6`'s spike found.

**AC3:** Given the full test suite, When it is run before and after this story's changes, Then it passes with no new failures and no behavioural change to any of the 14 files' own existing assertions — only the adapter stubbing is added, nothing else about the test's logic changes.

**AC4:** Given the standing "skills.js fires a real git commit during tests" junk-commit-contamination bug already logged in `workspace/learnings.md`, When this story's AC1-AC2 are complete, Then the learnings entry is updated to record that its root cause (the 14 unstubbed files found by `tfhc-s6`) is now closed, with a cross-reference to this story.

## Out of Scope

- Implementing `scripts/run-all-tests.js` parallelization itself — a separate, later story, explicitly gated on this one (per `tfhc-s6`'s own outcome artefact's "If PROCEED" conditions).
- Any of the 12 already-stubbed files — no change needed, they already follow the correct pattern.
- The 15 files `tfhc-s6`'s spike found call the handler but never reach the gated branch (0 `ARTEFACT-END` occurrences) — confirmed to carry no real risk, not touched here.

## NFRs

- **Performance:** Not applicable — test-infrastructure-only change, no production code path, no runtime behavioural change to measure.
- **Security:** None identified — closes a risk (uncontrolled real git operations during test runs), does not introduce one.
- **Accessibility:** Not applicable — no UI.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1

<!-- Small, bounded, purely mechanical -- the stubbing pattern itself is already proven 12 times in this exact suite; the only work is applying it 14 more times plus one new structural check mirroring an already-existing precedent shape. -->

**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
