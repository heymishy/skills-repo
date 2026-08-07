# Definition of Done: Guard skill-turn auto-commit behind a D37 adapter so tests never fire real git commits

**PR:** https://github.com/heymishy/skills-repo/pull/460 | **Merged:** 2026-07-11
**Story:** artefacts/2026-07-12-skill-turn-test-isolation/stories/stis-s1-guard-skill-turn-auto-commit.md
**Test plan:** artefacts/2026-07-12-skill-turn-test-isolation/test-plans/stis-s1-guard-skill-turn-auto-commit-test-plan.md
**DoR artefact:** artefacts/2026-07-12-skill-turn-test-isolation/dor/stis-s1-dor.md
**Assessed by:** Claude (agent) — retroactive DoD, 2026-07-16, per operator decision to require DoD for all short-track stories going forward
**Date:** 2026-07-16

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — git-commit step wired through a D37 injectable adapter; no real git process spawned in test context | ✅ | `src/web-ui/routes/skills.js`'s skill-turn-stream handler's `execSync('git add ...')`/`execSync('git commit ...')` calls extracted behind `setSkillTurnGitCommitAdapter(fn)`. Test-injected stub records the call without touching git. | Automated test (U1-U4, IT1 per plan) | None |
| AC2 — Production default still performs the real commit; "stub must throw" applies only to the test-injected stub, not the production default | ✅ | Default adapter implementation preserves the exact original `execSync` calls and try/catch-swallow behavior for Fly.io environments where git is absent. Explicitly documented in the adapter's own code comment per this AC's own reasoning. | Automated test + code review | None |
| AC3 — Existing tests exercising a completed skill-turn artefact save inject the stub; zero new commits, all existing assertions unchanged | ✅ | Full `tests/` directory searched (not just the one known-affected file) for any test invoking the skill-turn-stream handler with a completed artefact. `tests/check-wusl1-chat-streaming.js` and one other confirmed-affected file updated to inject the stub. | Automated test — `git rev-parse HEAD` before/after comparison | None |
| AC4 — Full suite run twice in a row produces identical commit count/tip both times | ✅ | Confirmed via a full `node scripts/run-all-tests.js` double-run with `git log --oneline` diffed before/after each pass — no new commits either time. | Automated/manual verification during implementation | None |
| AC5 — Pre-existing baseline failure count unchanged by this fix | ✅ | Full suite failing-file list diffed before/after — this story's fix touches test-isolation only, zero change to the ~68-70-file pre-existing baseline count. | Automated diff | None |

## Scope Deviations

None. This story also identified (via its own exhaustive search, task-2 in the implementation plan) an `e2e`/`webServer` gap requiring a no-op stub wired in `server.js` test mode, beyond the two files originally suspected — within the story's own stated AC3 scope ("search the full `tests/` directory... not just the one file already known"), not scope creep.

---

## Test Plan Coverage

**Tests from plan implemented:** 6 / 6 (per pipeline-state's final recorded count)
**Tests passing:** 6 / 6

**Test gaps:** None.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance — none identified | ✅ N/A | Control-flow change only (adapter indirection), no measurable runtime cost difference. |
| Security — closes a minor unintended-write-access surface | ✅ | A test-triggerable code path that wrote to disk and executed shell commands against the real repo is now safely stubbed in test contexts; production behavior (and its `artefact_auto_amended`/`artefact_auto_saved`/`artefact_disk_save_failed` logging) is unchanged. |

---

## Outcome: COMPLETE ✅

ACs satisfied: 5/5
Scope deviations: None
Test gaps: None

**Retroactive DoD note:** This DoD was written 2026-07-16, after the operator decided all short-track stories should retroactively receive a DoD artefact. Notably, this story's own fix (the D37 git-commit adapter) directly addressed the root cause of the recurring junk-commit contamination pattern observed during `pcr-s1`'s own implementation the day before — a good example of a short-track fix-forward closing a real, actively-occurring defect the same session it was discovered.
