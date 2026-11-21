# rgsr-s1 Definition of Done

Date: 2026-11-21. Story: resuming a journey lands on the stage the journey is on, so a regressed journey no longer drops the user into a discovery session. Pull request #1176 merged 2026-11-21 (`ceb2d035c`). Issue #1042 closed by the merge.

## Result: COMPLETE. All 7 acceptance criteria met. CI ran on the pull request's final commit (`60ee5b2c0`, the same commit the merge took), and the changed files were checked on master after the merge, including the matrix move.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 | ✅ | `tests/check-rgsr-s1-resume-lands-on-regressed-stage.js` T1 (real store, real disk adapter, real resume handler): a journey regressed to `definition` resumes with a 303 to `/skills/definition/sessions/<id>/chat`. Red first: on master T1 failed with `/skills/discovery/...`; 5 of 5 assertions pass after (re-run on master: 5 passed, 0 failed) | automated | none |
| AC2 | ✅ | same check, T2: a store-saved journey that was never regressed, active stage `definition`, resumes at a `definition` session. Red first: failed on master with `/skills/discovery/...` (this showed the defect is wider than the issue states) | automated | none |
| AC3 | ✅ | same check, T3: with no stage in the store's record, the disk record's `currentStage` is used (`definition`), and with nothing anywhere the journey resumes at `discovery`; both passed before and after the change | automated | none |
| AC4 | ✅ | `ep3-s1-regression.spec.js` on a fresh journeys root: on master 2 of 2 runs failed at `waitForURL('**/skills/definition/sessions/**')`; with the change 3 of 3 passed. In CI it passed 1 of 1 in the E2E reports for both pull-request code commits | automated | none |
| AC5 | ✅ | the seven neighbouring resume checks pass unchanged (`s0.2` 12, `s0.1` 8, `sec4` 9, `aslr-s1` 19, `kcrs-s1` 7, `frsr-s1` 10, `def-s1`); full `npm test` plus the CI regression script showed only the two known local-only failures (`check-pcr-s1-test-runner`, `check-p3.5-validate-trace`), which also fail on the master checkout and are not shown by CI; the runner discovers the new check | automated | none |
| AC6 | ✅ | E2E report from the CI run on the final commit `60ee5b2c0` (PR head and CI commit matched): `ep3-s1` 1 passed, 0 failed; E2E total 296 passed, 0 failed (the first run with no failure); the matrix entry moved from `quarantined` to `extended` with a rewritten reason, and master shows `ep3-s1` `extended`; the pull request body carried `Fixes #1042`, GitHub listed it under closing issues before the merge, and the issue is CLOSED | automated (CI report) + master check | none |
| AC7 | ✅ with deviation | the merge commit changed 4 files: `src/web-ui/routes/journey.js` (the only file under `src/`), the new check, `tests/e2e/capability-matrix.json` and `tests/check-lpw-s3-matrix-reason.js` (145 insertions, 8 deletions) | manual (diff check on master) | `tests/check-lpw-s3-matrix-reason.js` was added to the contract and to AC7 during delivery: its T5a asserted `ep3-s1` is `quarantined`, so the move broke it; the expectation now asserts `extended` and keeps its reason rules |

## CI evidence

All 9 checks passed on the final commit, including `Lint, typecheck, test, build` and the assurance gate. The `Playwright E2E smoke tests` job is `continue-on-error`, so a green job does not prove the specs passed; the evidence above is the `pw-report-json` artefact, read directly. The first CI run (commit `e262831db`) had 8 of 9 passing: the assurance gate failed with "No feature resolved" (see observations), which was fixed before the final commit.

## Observations and follow-ups

- **The issue's diagnosis was one step off.** #1042 pointed at the regress and resume handlers; the regress handler was correct and the defect was the resume handler's stage read, which sent any store-saved journey with no live session to `discovery`, regressed or not. The Postgres deployment is unaffected (it builds its record from `activeSkill`); the defect lived in the disk-backed mode used for local development and the E2E harness.
- **Follow-up, found and not fixed:** `loadAllFromDisk` (`modules/journey-store.js`) rebuilds `activeSkill` from the disk `currentStage` and `completedStages` from the disk `stages` object, so a store-saved journey reloaded after a restart in disk mode loses its stage and completed stages. Same root (two disk shapes, one reader each), separate defect; needs its own story if disk mode matters beyond local development.
- **Process finding (decisions D1):** the assurance gate resolves the feature from the first `artefacts/<folder>` path in the pull request body and looks it up in the pull request branch's own `pipeline-state.json`. A branch cut before the feature is registered on master fails with "No feature resolved"; the earlier fpsr-s1 pull request passed only because its body named an older feature first. Fixed by merging master into the branch (no force-push). For the next short-track story: register the feature on master first, then cut the branch.
- **Local-only effect, unrelated:** with a forward-slash `COPILOT_REPO_PATH` on Windows the regress handler's path guard returns 400 ("Invalid feature slug"), so `ep3-s1` only runs locally with a native path. It cost a misleading first measurement here; CI (Linux) is unaffected.
- **The quarantine list is empty.** Every spec that was quarantined during this run of spec work (`bmau-s1`, `wuce18`, `dsa-s2`, `fpd-s4` and `ep3-s1`, after the earlier lane update that moved eight others) is now `extended`. Lanes on master (97 specs): core 39 (unchanged), extended 52, scenario 6, quarantined 0.
- **Still the operator's decisions:** whether any `extended` spec moves to the blocking `core` lane, and whether to drop `continue-on-error` on the E2E job (the E2E job is now fully green, which is the precondition for both).
- **Process held:** CI was confirmed on the final commit before the merge was requested, the issue link was verified before and after, and master was checked after the merge (all four files, not only the source file).

## Scope Deviations

One addition beyond the original contract: `tests/check-lpw-s3-matrix-reason.js` (T5a), described in AC7.
