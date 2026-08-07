# Definition of Done: Reduce merge-conflict hotspots (test chain, pipeline-state updatedAt, decisions.md union merge)

**PR:** https://github.com/heymishy/skills-repo/pull/455 | **Merged:** 2026-07-11
**Story:** artefacts/2026-07-11-pipeline-conflict-reduction/stories/pcr-s1-reduce-merge-conflict-hotspots.md
**Test plan:** artefacts/2026-07-11-pipeline-conflict-reduction/test-plans/pcr-s1-reduce-merge-conflict-hotspots-test-plan.md
**DoR artefact:** artefacts/2026-07-11-pipeline-conflict-reduction/dor/pcr-s1-dor.md
**Assessed by:** Claude (agent) — retroactive DoD, 2026-07-16, per operator decision to require DoD for all short-track stories going forward
**Date:** 2026-07-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `package.json`'s `scripts.test` reduced to a single runner-script invocation, same pass/fail verdict as the old chain | ✅ | `scripts/run-all-tests.js` created (globs `tests/check-*.js` + a 16-file grandfather list). `package.json`'s `scripts.test` is now `"node scripts/run-all-tests.js"`. Confirmed live on master. | Automated test + live confirmation on merged master | Bonus discovery, not a deviation: the old `&&`-chain's short-circuit-on-first-failure had been masking the suite's true state — the new runner surfaced 65 previously-invisible pre-existing failures (62/65 confirmed pre-existing on a clean baseline, 3 unrelated hangs). Logged as a follow-up triage need, resolved by the later `tst-s1` short-track story. |
| AC2 — Two stories adding test files to different branches merge with zero `package.json` conflict | ✅ | Confirmed structurally: nothing remains in `scripts.test` for two branches to collide on. Validated in practice across this session's own Wave 2/3 rebases — no further `package.json` test-chain conflicts occurred after this story merged. | Structural + live regression-free observation across ~10 subsequent PRs | None |
| AC3 — Per-story pipeline-state writes no longer bump the parent feature's `updatedAt` unless it's a genuine feature-level milestone | ✅ | `src/enforcement/cli-advance.js` updated to split `feature.<field>=...`-prefixed keys (bump `feature.updatedAt`) from plain story-scoped keys (only bump `story.updatedAt`). Verified live: used the fixed command mid-implementation and confirmed `feature.updatedAt` stayed frozen while the story's own field changed. | Automated test + live self-verification during implementation | A regression was caught during this story's own broader test sweep and fixed same-session: an explicitly-passed `updatedAt` value was initially always being overwritten; corrected to auto-stamp only when the caller omits it (commit `8290593d`). |
| AC4 — Two stories in the same feature advancing concurrently produce zero pipeline-state conflict | ✅ | Direct consequence of AC3's fix — confirmed no further feature-level `updatedAt` collisions occurred across this session's subsequent parallel-wave PRs. | Structural + live regression-free observation | None |
| AC5 — `decisions.md` union-merge auto-resolves two independent branch appends | ✅ | `.gitattributes` updated with `artefacts/**/decisions.md merge=union`. Verified via a real three-way git merge test (two branches each appending an independent entry, merged in sequence, zero conflict markers, both entries present). | Automated scripted merge test | None |

## Scope Deviations

None from the story's own defined scope. One environment-stability issue surfaced during implementation, unrelated to the story's content: the coding agent's worktree was contaminated with junk `"feat: discovery artefact (amended)"` commits twice during this story's own implementation, correlating with agent stalls — recovered cleanly both times (`git reset --hard` to last known-good, cherry-pick real work, re-verify). Root cause was found and fixed by the later `stis-s1` short-track story (an unconditional `execSync` git-commit call in `skills.js`'s skill-turn-stream handler, firing during test runs).

---

## Test Plan Coverage

**Tests from plan implemented:** 12 / 12
**Tests passing:** 12 / 12

All test blocks (U1-U6, IT1-IT5, N1 per the test plan) implemented and passing, confirmed both at merge time and via this session's later full-suite re-runs (no regression in `tests/check-pcr-s1-test-runner.js`, `tests/check-pcr-s1-pipeline-state-scope.js`, `tests/check-pcr-s1-decisions-merge.js`).

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — new runner must not meaningfully increase `npm test` wall-clock time | ✅ | No adverse runtime reported; the runner's per-file `spawnSync` overhead matches the prior chain's per-command overhead. |
| Security — none identified | ✅ N/A | No new external input, no new attack surface. |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None from story scope (one unrelated environment-stability issue found and separately resolved by `stis-s1`)
Test gaps: None

**Retroactive DoD note:** This DoD was written 2026-07-16, after the operator decided all short-track stories (previously stopping at `branch-complete` once merged) should retroactively receive a DoD artefact. All evidence above was independently re-confirmed against the merged code on `origin/master`, not assumed from the original PR description.
