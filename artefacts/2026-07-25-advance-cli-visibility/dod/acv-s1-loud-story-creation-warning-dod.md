# Definition of Done: `skills advance` warns loudly when it creates a new story record instead of updating an existing one

**PR:** #601 (merge commit `845164046b576828a1430e32a9a47a8e56b7c38d`) | **Merged:** 2026-07-25
**Story:** artefacts/2026-07-25-advance-cli-visibility/stories/acv-s1-loud-story-creation-warning.md
**Assessed by:** Claude (agent) -- retroactive DoD backlog pass, 2026-08-17
**Date:** 2026-08-17

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|------------|----------|----------------------|-----------|
| AC1 (existing-story match → unchanged `stdout`/empty `stderr`) | Yes | AC1a-1/2/3 (flat story) and AC1b-1/2/3 (epic-nested story) in `check-acv-s1-loud-story-creation-warning.js` assert `exitCode===0`, `stdout` starts with `"Advanced: "`, `stderr===''` | Automated test (6 assertions) | None |
| AC2 (no-match → loud `stderr` warning + distinct `stdout` prefix) | Yes | AC2a (record still created), AC2b (stderr names feature slug + story id), AC2c (stderr matches `/warning/i`), AC2d (stdout not plain "Advanced: "), AC2e (stdout contains "Created NEW story record") | Automated test (5 assertions) | None |
| AC3 (no-match case still `exitCode: 0`) | Yes | AC3 assertion: `exitCode === 0` even though a new record was created | Automated test (1 assertion) | None |
| AC4 (feature-only fields never trigger story lookup/warning) | Yes | AC4a (`exitCode 0`), AC4b (`stderr` empty), AC4c (feature field applied), AC4d (no new `feature.stories[]` entry) | Automated test (4 assertions) | None |

All 4 ACs map to real, passing assertions in `tests/check-acv-s1-loud-story-creation-warning.js` (16/16 passing). Source read directly at `src/enforcement/cli-advance.js` lines 166-246 confirms the implementation matches: `storyWasCreated` boolean gates the distinct `stdout`/`stderr` messaging, the write path (atomic temp-file rename) and `exitCode: 0` are untouched.

## Scope Deviations

None. The story's own Out of Scope section flagged a contingent item -- checking whether `cli-gate-advance.js` shares this same silent-creation code path, and extending the fix there if so. `decisions.md` records this was checked (grepped for the silent-creation markers `"Still not found"`, `feature.stories.push`, `story = { id: ... }`) and confirmed `cli-gate-advance.js` does not share the path, so no change was needed there. This is a resolved contingency, not a deferred gap. The other two Out of Scope items (no new `--create`/`--allow-new` flag; no retroactive cleanup of past stray records) were both explicitly declared out of scope in the story text and were honoured as written.

## Test Plan Coverage

`check-acv-s1-loud-story-creation-warning.js`: 16 passed, 0 failed (freshly re-run 2026-08-17). Breakdown: AC1a (3) + AC1b (3) + AC2 (5) + AC3 (1) + AC4 (4) = 16, one-to-one with the 4 story ACs.

## NFR Status

| NFR | Status |
|-----|--------|
| Observability | Met -- the entire point of the story; no-match creation now produces a distinctly-prefixed `stdout` message and an unmissable `stderr` warning line, verified by AC2b/AC2c/AC2e. |
| Backward compatibility | Met -- AC1a/AC1b confirm the existing-story update path's `stdout`/`stderr`/`exitCode` shape is byte-identical to pre-change behaviour. |

## Metric Signal

No benefit-metric artefact is referenced by this story (it is a short-track bug fix that skips discovery through review per CLAUDE.md's short-track rule); no metric signal to report.

## Outcome

**COMPLETE**
**Follow-up actions:** None.

## DoD Observations

Implementation is a minimal, well-scoped change (one boolean flag threaded through existing logic, ~19 lines) exactly matching the story's Complexity Rating of 1. `decisions.md` documents the `cli-gate-advance.js` scope check, which is good practice for a story that explicitly named a contingent out-of-scope check.
