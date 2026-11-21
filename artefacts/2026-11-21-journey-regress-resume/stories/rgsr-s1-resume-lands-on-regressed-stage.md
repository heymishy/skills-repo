## Story: Resuming a journey lands on the stage the journey is on, so a regressed journey no longer drops the user into a discovery session

**Epic reference:** None - short-track (product defect, GitHub issue #1042, found while repairing the quarantined `ep3-s1-regression.spec.js`)
**Discovery reference:** None - short-track skips discovery. Evidence, measured on 2026-11-21 on master (`946be6131`): `tests/e2e/ep3-s1-regression.spec.js` fails alone, 2 of 2 runs on a fresh journeys root, at `page.waitForURL('**/skills/definition/sessions/**')` (the user is sent to a discovery session). Cause, read in the code and reproduced with the real journey store and disk adapter: `regressToStage` (`modules/journey-store.js`) sets `activeSkill` to the target stage and saves the journey to disk in the store's own shape (`activeSkill` plus `completedStages`, no `currentStage` field). `handleGetJourneyResume` (`routes/journey.js`) then picks the stage to resume with `diskJourney.currentStage || 'discovery'`, reading only the disk record. A journey saved by the store has no `currentStage`, so it always resumes at `discovery`. This is wider than the issue says: any journey saved through the store with no live session resumes at `discovery`, a regressed one or not (test T2 below fails on master for a journey that was never regressed). In a Postgres deployment the handler builds its disk-shaped record from memory with `currentStage: memJourney.activeSkill`, so that deployment is correct; the defect shows in the disk-backed mode used for local development and the E2E harness.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [journeys] [testing]

## User Story

As **a developer or operator running the platform with disk-backed journeys (local development and the E2E harness)**,
I want **resuming a journey to open a session for the stage the journey is on**,
So that **a journey regressed to an earlier stage continues at that stage, and the `ep3-s1` spec can pass for the right reason**.

## Benefit Linkage

**Metric moved:** `ep3-s1` goes from failing in every recorded run (CI and local) to 1 of 1 passing; the E2E failing list on CI drops from 1 (`ep3-s1`) to 0; the quarantine list drops from 1 to 0; issue #1042 closes.
**How:** `handleGetJourneyResume` takes the stage from the journey store's record (`memJourney`, the record the handler already resolves for the access check and the active session) `activeSkill` first, and keeps the disk record's `currentStage` and then `discovery` as fallbacks.

## Architecture Constraints

- Change confined to one line of `src/web-ui/routes/journey.js` (plus a comment), one new node check, one matrix entry (after CI), the one expectation in `tests/check-lpw-s3-matrix-reason.js` that pins `ep3-s1` as quarantined, and artefacts. `src/` changes go through a pull request.
- Fallback order is preserved for every case where the store's record has no active stage: disk `currentStage`, then `discovery`. In disk mode `memJourney` is the saved store-shaped record (from `listJourneys`), and `setActiveSession` does not save to disk, so its `activeSkill` is the stage as of the last save by `completeStage`, `setJourneyFields` or `regressToStage`; that is never less accurate than the disk `currentStage` it replaces, which a store-saved journey does not have at all.
- The Postgres path is unchanged in effect: its synthesised disk record already used `activeSkill` as `currentStage`.
- No journey data is read differently, moved or deleted; no change to `regressToStage`, the disk adapter or the regress handler.
- Preserve the file's existing line endings (`journey.js` is CRLF).

## Dependencies

- **Upstream:** ep3-s1 (the regress-back feature), s0.2 and sec4 (the resume contracts that must keep passing), kcrs-s1 (the done-session path in `handleGetJourneyById`, unchanged).
- **Downstream:** the `ep3-s1` matrix entry leaves quarantine once CI shows it passing; issue #1042 closes with the pull request.

## Acceptance Criteria

**AC1:** Given a journey regressed to `definition` through the real store with the disk adapter wired, When `handleGetJourneyResume` runs for it, Then it answers 303 to a `/skills/definition/sessions/<id>/chat` URL (before the change: `/skills/discovery/...`).
**AC2:** Given a journey saved through the store that was never regressed and whose active stage is `definition`, When it is resumed with no live session, Then the 303 goes to a `definition` session (before: `discovery`).
**AC3:** Given the journey store's record has no active stage, When it is resumed, Then the stage comes from the disk record's `currentStage` when there is one, and from `discovery` when there is nothing anywhere; both are unchanged from today.
**AC4:** Given a fresh journeys root, When `tests/e2e/ep3-s1-regression.spec.js` runs, Then it passes (before: fails in 2 of 2 runs on master), 3 of 3 consecutive runs.
**AC5:** Given the existing resume checks (`check-s0.2-resume-existing-session`, `check-s0.1-resume-guard`, `check-sec4-early-return`, `check-aslr-s1-active-stage-link-resume`, `check-kcrs-s1-kanban-card-resume-session`, `check-frsr-s1-feature-row-session-resume`, `check-def-s1-session-resume`), When `npm test` runs, Then there is no new failure against the known baseline.
**AC6:** Given the pull request's CI run, When the E2E report is read, Then `ep3-s1` passes there; the matrix entry then moves from `quarantined` to `extended` with a rewritten reason, and CI runs on the final commit before the merge is requested; the pull request body carries `Fixes #1042` and the issue is linked as closing.
**AC7:** Given the pull request, When its changed files are listed (and again on master after the merge), Then `src/` contains only `web-ui/routes/journey.js`, and the rest are the new check, the matrix file, `tests/check-lpw-s3-matrix-reason.js` (its T5a expects the `extended` lane) and artefacts.

## Out of Scope

- `loadAllFromDisk` (`modules/journey-store.js`), which rebuilds `activeSkill` from the disk `currentStage` and `completedStages` from the disk `stages` object, the reverse of the same shape mismatch: a store-saved journey reloaded after a restart in disk mode loses its stage and completed list. A separate defect with its own story.
- Changing what `saveJourney` writes, or giving the store's journeys a `currentStage` field (a wider data-shape change).
- The regress handler's path guard failing for a forward-slash `COPILOT_REPO_PATH` on Windows (a local-environment effect; CI is Linux).
- Any move to the blocking `core` lane.

## NFRs

- **Backward compatibility:** a disk-native journey (a `currentStage` on disk, nothing in memory) resumes exactly as before.
- **Security:** no change to access checks, path handling or session handling in the resume handler.

## Complexity Rating

**Rating:** 1
**Scope stability:** Stable
