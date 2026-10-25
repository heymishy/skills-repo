# Definition of Done: Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it

**PR:** https://github.com/heymishy/skills-repo/pull/1021 (originally #1019, auto-closed when its base branch was deleted on #1018's squash-merge — see DoD Observations) | **Merged:** 2026-10-25
**Story:** artefacts/2026-08-07-cross-surface-state-sync/stories/css-s3-detect-and-resolve-cross-surface-conflicts.md
**Test plan:** artefacts/2026-08-07-cross-surface-state-sync/test-plans/css-s3-test-plan.md
**DoR artefact:** artefacts/2026-08-07-cross-surface-state-sync/dor/css-s3-dor.md
**Assessed by:** Claude (session)
**Date:** 2026-10-25

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 | ✅ | `tests/check-css-s3-conflict-resolver.js` (18 tests) — `detectConflict(lastSyncedStage, pipelineStateValue, journeyValue)` returns a real conflict object only when both sides moved away from the last-synced marker to two different values, not merely "apply whichever write happened most recently." Wired into the real write path: `tests/check-css-s3-pipeline-state-conflict-wiring.js` (9 tests) proves `pipeline-state-github-writer.js`'s own `applyStateUpdate` calls `detectConflict` for real, unmocked | `integration-real-code` | None |
| AC2 | ✅ | Both halves implemented. Pipeline-state.json's own side: never overwritten by a losing value (`check-css-s3-pipeline-state-conflict-wiring.js`). The journey's own side: `check-css-s3-journey-correction.js` (4 tests) proves `journey.js`'s `handlePostGateConfirm` reassigns `session.skillName` to the resolved value — added as Task 7 after the final cross-cutting review found this half missing entirely (see DoD Observations), then hardened by a second independent review that found a Critical vocabulary-mismatch bug: the reassignment must only apply when the resolved value is one of the journey's own 8 `STAGE_SEQUENCE` values (`isKnownStage` guard) — without it, a resolved value outside the journey's model could produce a false "journey complete" state or a fabricated trace record | `integration-real-code` | None |
| AC3 | ✅ | `check-css-s3-conflict-resolver.js`'s own `resolveConflict` tests + `sync-log.js`'s `logConflict` (feature slug, both divergent values, resolved winner, timestamp — all present as real `sync_log` columns). Deduped across the writer's own unrelated 409-retry loop via a shared `conflictLogState` object, fixing a Critical review finding (empirically verified 3x duplication before the fix) so one logical conflict never produces duplicate log rows | `integration-real-code` | None |
| AC4 | ✅ | `check-css-s3-conflict-resolver.js`'s own negative-control test (`conflictDetector_doesNotFlagConflict_whenOnlyOneSideChangedSinceLastSync`) plus `check-css-s3-pipeline-state-conflict-wiring.js`'s own integration-level proof that an ordinary single-sided advance produces zero `sync_log` conflict rows | `integration-real-code` | None |

**A deviation is any difference between implemented behaviour and the AC**, even if minor. None recorded for this story — all 4 ACs match their literal wording, though AC2's journey-correction half required a Critical mid-build fix (see below) before it was genuinely complete.

---

## Scope Deviations

None. This story's own build surfaced two Critical defects that were found and fixed **before** this PR merged, not after:
1. AC2's journey-correction half was found entirely missing at the story's own final cross-cutting review (added as Task 7).
2. Task 7's own first implementation assumed the resolved conflict value is always journey-representable — a second independent review found this false, fixed via the `isKnownStage` guard.

Both are documented in `decisions.md`'s css-s3 ARCH entries, not post-merge findings — this story went through 2 independent review rounds beyond the standard per-task cycle specifically because of these.

No out-of-scope item (automatic conflict avoidance/locking, a dedicated conflict-log browsing UI) was implemented. Confirmed via the story's own PR diff scoping to `src/sync/conflict-resolver.js`, `src/web-ui/adapters/sync-log.js`'s `logConflict`, `src/web-ui/adapters/pipeline-state-github-writer.js`'s wiring, `src/web-ui/routes/journey.js`'s Task-7 correction block, `.github/pipeline-state.schema.json`'s `lastSyncedStage` field, and test/artefact files only.

---

## Test Plan Coverage

**Tests from plan implemented:** 5 / 5 (AC1: 2, AC2: 3, AC3: 1, AC4: 1 — matches the test plan's own AC Coverage table) plus Task 7's own additional journey-correction tests, added beyond the original test plan when that gap was found
**Tests passing in CI:** 36 / 36 (18 + 9 + 1 + 4 + 4 across this story's 5 dedicated test files)

| Test | Implemented | Passing | Notes |
|------|-------------|---------|-------|
| AC1 unit (2 tests, per plan) | ✅ | ✅ | Part of `check-css-s3-conflict-resolver.js`'s 18 |
| AC2 unit + integration (3 tests, per plan) | ✅ | ✅ | Part of `check-css-s3-conflict-resolver.js` + `check-css-s3-pipeline-state-conflict-wiring.js` |
| AC3 unit (1 test, per plan) | ✅ | ✅ | Part of `check-css-s3-conflict-resolver.js` |
| AC4 unit (1 test, per plan) | ✅ | ✅ | Part of `check-css-s3-conflict-resolver.js` |
| `lastSyncedStage` bookkeeping (not in original plan, added at build time) | ✅ | ✅ | `check-css-s3-last-synced-bookkeeping.js`, 1 test |
| NFR tests (not in original plan, added at build time) | ✅ | ✅ | `check-css-s3-nfr.js`, 4 tests (performance, security, audit) |
| Journey correction, Task 7 (not in original plan — the AC2 gap found at final review) | ✅ | ✅ | `check-css-s3-journey-correction.js`, 4 tests, including the `isKnownStage` Critical-finding regression test |

**Gaps (tests not implemented):** None. The real final test count (36) exceeds the test plan's own original estimate because of the Task 7 addition — this is a story that genuinely grew during build after a real gap was found, not scope creep.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance (small, bounded conflict-detection overhead) | ✅ | `check-css-s3-nfr.js` |
| Security (no credentials/tokens in conflict log entries) | ✅ | `check-css-s3-nfr.js`; `sync-log.js`'s `logConflict` signature never accepts a token parameter |
| Audit (every genuine conflict logged, zero silent overwrites) | ✅ | This is the story's own core correctness invariant — proven directly by AC1-AC4's own test evidence, not a separate NFR check |
| Accessibility | ✅ N/A | No UI surface in this story |

---

## Metric Signal

**Measurement-ready gate:** Not yet — css-s4 (the epic's final story) was not yet DoD-complete at the time css-s3's own code was written; real multi-surface usage data does not yet exist.

| Metric | Signal | Evidence | Date measured |
|--------|--------|----------|----------------|
| m1: Automatic cross-surface agreement rate | not-yet-measured | css-s3 contributes the conflict-handling half of propagation correctness, but meaningful agreement-rate measurement still requires css-s4 (full vocabulary) to ship, plus real usage over time | null |
| m2: Conflict-resolution correctness (no silent overwrites) | not-yet-measured | **This story is the entire mechanism m2 measures** — the metric itself cannot show a real signal until real conflicts occur under real multi-surface usage; the mechanism's own correctness is proven by AC1-AC4's test evidence, not yet by production data | null |

---

## Outcome

**COMPLETE**

No deviations. No test gaps. No unauthorized scope expansion. This story's own build process is itself evidence of the pipeline's review discipline working as designed: 2 independent review rounds beyond the standard per-task cycle, both finding genuine Critical bugs before merge, not after.

**Follow-up actions:**
1. Owner: Hamish King — m2 (conflict-resolution correctness) remains `not-yet-measured`; the first real signal requires an actual cross-surface conflict to occur in production usage and be correctly resolved/logged — track this opportunistically rather than waiting for it before considering the epic valuable.

---

## DoD Observations

1. `css-s3` is epic-nested (`css-e1-cross-surface-state-sync`). Per CLAUDE.md's epic-nested story state bookkeeping rule, this DoD's state write is applied directly on `master` after confirming the real merge via `gh pr view`.
2. **Merge-sequence complication (worth recording for future epics with stacked branches):** this story's original PR (#1019, `feature/css-s3` → `feature/css-s2`) was auto-closed by GitHub — not merged — when `feature/css-s2` was deleted automatically on PR #1018's squash-merge into `master`. The underlying commits were never at risk (safe on `feature/css-s3` the whole time, which also already contained css-s4's own merged work by that point), but required: a replacement PR (#1021, `feature/css-s3` → `master`), a real merge-conflict resolution (4 files: `sync-log.js`, `journey.js`, `server.js`, one test file — all resolved by taking the evolved/superset side, verified via `git merge-tree` and a throwaway baseline-comparison worktree before any destructive action), and a dependency refresh (`npm ci`) to pick up an unrelated new dependency (`drawflow`) that had landed on `master` from other work in the interim. Full suite confirmed 796/796 clean after resolution, before the replacement PR was merged.
3. css-s3's own "Revisit trigger" (its Task 7 ARCH entry explicitly predicted: "when css-s4 extends sync to additional gate types where the CLI side can genuinely diverge from the journey side, revisit whether `syncGateAdvanceToJourney` needs its own real conflict-branch call") was triggered and resolved exactly as anticipated — css-s4 reused this story's own `conflict-resolver.js` directly for the newly-reachable conflict case on css-s1's own direction, per D37/the "one mechanism, parameterized" NFR, rather than building a second one.

---

## Operator Verification Prompt

```
Review this Definition of Done artefact for Detect a genuine cross-surface conflict, resolve it to pipeline-state.json's value, and log it (css-s3).
Check:
1. Does every AC row have a concrete evidence reference (test name, observable behaviour, or CI run)?
2. Are any ACs marked satisfied with no evidence, or deferred without a recorded trigger?
3. Does the metric signal row name a real measurement event, or just say "TBD"?
4. Are any scope deviations or follow-up actions that should block release not flagged?
5. Is the outcome verdict (COMPLETE / COMPLETE WITH DEVIATIONS / INCOMPLETE) consistent with the AC and deviation rows?
Report findings as HIGH / MEDIUM / LOW.
```
