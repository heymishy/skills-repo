# lpw-s3 Definition of Done

Date: 2026-11-17. Story: the board's Advance button and drag-to-advance work, a failed advance is never reported as success, and a completed stage shows as ready after a restart or deploy. Source issues #1140 and #1141, both closed by their pull requests. PR #1142 merged 2026-11-17 08:37 UTC (`c0c9a4622`, closes #1140); PR #1143 merged 09:02 UTC (`fe559409d`, closes #1141). The change touches the board view and handlers, the test server and its seed routes, the capability matrix and the board specs.

## Result: COMPLETE, with AC7 (the live check on staging) waiting for the operator's observation

AC1 to AC6 and AC8 (Acceptance Criteria 1 to 6 and 8) were verified by 29 automated tests, the browser specs and CI before merge. AC7 needs someone to click Advance on the deployed staging board; that has not been recorded yet and is stated as pending, not assumed.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (board script sends the CSRF token) | ✅ | `check-lpw-s3-board-advance-token` (5 tests): the rendered script holds the page token and `_kbTriggerAdvance`, the one call both the button and the drag use, sends it as `_csrf`; the three board handlers pass it; a hostile token cannot break out of the script. Real server: `T4b` moves a card with the page's own token, `T4c` is refused 403 without it | automated | none |
| AC2 (honest status mapping) | ✅ | `check-lpw-s3-advance-status` T2a to T2f: 403 answered 403, a redirect to sign-in 401, an unexpected status 502 `advance-failed`, a real advance 200 with the new stage, a 303 that left the stage unchanged refused (502), finishing the last stage (303 to `/complete`) still a success | automated | added beyond the AC: an advance that did not change the stage is never reported as one |
| AC3 (failure shown and captured) | ✅ | `T3a`, `T3b`: a failed advance captures `board_advance_failed` with the status and an 8-character journey id, and none of the token, the session id or the full journey id; a success captures nothing. The failure bodies carry a `reason`, which the board's existing `_kbAdvanceErrorMessage` already shows through its `alert` | automated | the story first said "existing error element"; the board uses an `alert`, and the story text was corrected. No browser test asserts the alert text itself |
| AC4 (test-mode commit adapter) | ✅ | `check-lpw-s3-test-commit-adapter` T4a: throws outside `NODE_ENV=test`, returns the Contents API shape inside it; T4b: advancing a seeded ready card with the page's token moves it from `discovery` to `benefit-metric`; T4d: without the opt-in `E2E_STUB_ARTEFACT_COMMIT` the throwing default stays (502) | automated (drives the real test server) | needed three more test-server fixes found on the way: the fake pool for `ownerRepoForFeature`, a real artefact path on the seeded journey (under the git-ignored `artefacts/e2e-board-seed/`), and the seed routes' journey sync (below) |
| AC5 (board specs) | ✅ | all 11 board browser specs pass locally alone, including `s1.1` AC1, `s3.1` AC1 and `s3.2` AC3, which clicked Advance; `psh-s6` rewritten (signed in, a real product); `s1.1` and `s3.1` join the core for kanban-interaction; core job green twice on one commit (111 passed, 3 skipped, 0 failed, 37.1 s and 32.6 s) | live (CI) | `s1.2`, `s3.2` and `psh-s6` are lane extended, not core, and their per-test result in the whole-suite job was not read from the report |
| AC6 (matrix reason) | ✅ | `check-lpw-s3-matrix-reason` (3 tests): `ep3-s1-regression` now names #1042 and not a model timeout; the board specs are out of quarantine; kanban-interaction has core specs | automated | none |
| AC7 (Advance works on staging) | ✅ observed in production 2026-11-18 by the operator: a card in the ready state moved from the kanban (note: the operator reported a separate chat-side issue in the same check, tracked apart from this story) | live, operator | none. Earlier state, kept for the record: | #1142 is in production (the "Promote to production" job of run 44048315446 succeeded after the operator's approval) and staging; #1143 is deploying (run 44051958284). The operator's own staging check before the fix reproduced the defect (the card reloaded in the same stage) | live, operator | not yet observed after the fix |
| AC8 (readiness after a restart, #1141) | ✅ | `check-lpw-s3-board-ready-after-restart` T6a to T6e and T7a, T7b: after a restart a card whose stage was completed by its active session is ready; no completed record, a live not-done session, or a record from a different session means not ready; Advance rebuilds the done session before the real gate-confirm; and `T4f` on the real server: the seeded session is evicted from memory, the card still offers Advance and Advance moves it | automated | not covered: older completed-stage records without a session id, and a stage whose commit failed (it shows not ready until its chat is opened) |

## Source Issue Closure

#1140 and #1141 are closed (verified: `gh pr view` `closingIssuesReferences` showed [1140] on #1142 and [1141] on #1143; both issues read CLOSED after merge).

## Observations and follow-ups

- **The first explanations I gave were wrong in two places, both corrected in `decisions.md`.** The kanban specs did not fail because the board "no longer renders `data-journey-id`" (it does); and `ep3-s1-regression` is not a model-session timeout, it is the known regress-back bug #1042.
- **Why the defect lasted three months.** The rcfc-s1 change (2026-08-24) added the CSRF guard to gate-confirm and changed the unit test to send a token directly; the real board script never sent one. No exception was raised (the guard answered 403 inside the request and the advance handler turned it into success), so there was no issue and no PostHog error until the operator saw it.
- **A cross-spec contamination found by bisecting the core run.** The `actr-s2` and `ppc-s5` seed routes replaced the fake-database journey sync with a function that did nothing, so any journey created afterwards never reached the board. Fixed with a shared `_fakeDbSaveJourney`; `T4e` reproduces it.
- **Two process slips of mine, both fixed.** A bookkeeping commit ran `git add artefacts` in the operator's main checkout and published 20 untracked scratch folders (`6bcb7ab5f`), reverted from tracking in `dea3c3c86` with the files left on disk, and recorded as a feedback memory; and a long shell command hung on non-ASCII text, writing nothing (redone with the file tools).
- **Production approvals.** Two stale waiting approvals (`d30308896`, `8601ce643`) remain; they are superseded by later commits and the operator should reject them. The approval for `fe559409d` (#1143) is the operator's.
- **Still quarantined:** 24 spec files (down from 29), review date 2026-12-15, the guard fails the unit suite after that date. Gaps with no passing core spec: pods, reference-and-stories, feature-creation. Follow-up stories: pods (seed a team member so the roster is not empty), model sessions and the `ep2-s2` crash, the three live-feature rewrites, and #1042.

## Scope Deviations

- AC8 was added after the operator's staging check (issue #1141) and shipped as a second pull request.
- The AC3 message is shown through the board's existing `alert`, not an error element.
- `s1.2`, `s3.2` and `psh-s6` are extended, not core.
- `.github/trace-validation.yml` gained a reference folder (`e2e-board-seed`) because completing a seeded stage writes under it.
