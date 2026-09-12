# Implementation Plan: Batch skill-metadata extraction to close the `--with-outer-loop` performance NFR gap (obpf-s1)

**Story:** artefacts/2026-09-12-outer-loop-bootstrap-perf-fix/stories/obpf-s1-batch-skill-metadata-extraction.md
**Test plan:** artefacts/2026-09-12-outer-loop-bootstrap-perf-fix/test-plans/obpf-s1-test-plan.md
**DoR:** artefacts/2026-09-12-outer-loop-bootstrap-perf-fix/dor/obpf-s1-dor.md

---

## Task 1: Replace per-skill extraction with one batched awk call (AC1, AC2)

**Files:** `scripts/assemble-copilot-instructions.sh`

- Replaced `get_skill_description`/`get_skill_triggers` (2 functions, each spawning awk+sed per call) with `_load_outer_loop_skill_metadata` — one batched awk invocation processing all outer-loop skill files in a single pass, populating `SKILL_DESC`/`SKILL_TRIGGERS` associative arrays.
- Both call sites (progressive-disclosure loop, Core Platform Layer loop) updated to read from the arrays instead of calling the old functions.
- The two downstream `sed`/`tr` reformatting steps (leading-space strip, trigger comma-join) reimplemented in pure bash — zero subprocess spawns.
- **Found during implementation:** the OLD trigger-formatting sed pipeline had a genuine pre-existing double-comma bug (`,, ` instead of `, `), live since `scr-s1` (2026-08-07), unnoticed for over a month, even baked into the unused `tests/fixtures/assembled-copilot-instructions.md` fixture. The new pure-bash reimplementation is correct and does not reproduce it — recorded in `decisions.md`, fixture updated.
- Real, measured result: full `runInit({withOuterLoop:true})` in isolation went from ~5.7s (pre-fix baseline) to ~2.5-3s (post-fix).

**Status:** committed

---

## Task 2: Update obsolete test assertion + add new regression coverage (AC3, AC4)

**Files:** `tests/check-scr-s1-skill-categorization-reconciliation.js` (updated), `tests/check-obpf-s1-batch-skill-metadata-extraction.js` (new)

- `check-scr-s1-...js`'s `getSkillTriggers_calledOnceReusedForBothPurposes` test updated: asserts the new invariant (zero per-skill extraction calls remain, both arrays used) rather than the now-obsolete "called exactly once per skill" detail. New test `skillMetadataExtraction_batchedOncePerScriptRun_notOncePerSkill` added.
- New test file covers: batched-extraction structural presence (T1), byte-parity against the original per-skill awk logic for all 8 real skill files (T2), real isolated timing (T3).
- `tests/check-rb-s3-harness-agnostic-instructions.js` and `tests/check-rb-s5-optional-outer-loop-install.js` re-run unmodified — both pass, including `outerLoopFlagOverheadUnder3Seconds`, which now genuinely passes for the first time (previously RISK-ACCEPTed).

**Status:** committed

---

## State update — mandatory final step

Recorded via `bin/skills advance` after this artefact is committed.
