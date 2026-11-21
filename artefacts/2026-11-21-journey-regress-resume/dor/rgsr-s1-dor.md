## Definition of Ready: Resuming a journey lands on the stage the journey is on, so a regressed journey no longer drops the user into a discovery session

**Story reference:** artefacts/2026-11-21-journey-regress-resume/stories/rgsr-s1-resume-lands-on-regressed-stage.md
**Test plan reference:** artefacts/2026-11-21-journey-regress-resume/test-plans/rgsr-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `src/web-ui/routes/journey.js` (AC1, AC2, AC3): in `handleGetJourneyResume`, `var currentStage = (memJourney && memJourney.activeSkill) || diskJourney.currentStage || 'discovery';` with a comment saying why; nothing else in the file changes.
- `tests/check-rgsr-s1-resume-lands-on-regressed-stage.js` (T1 to T3), the `ep3-s1` entry in `tests/e2e/capability-matrix.json` (AC6, only after CI shows the spec passing), and T5a in `tests/check-lpw-s3-matrix-reason.js`, which asserts the entry's lane and must follow the move (`quarantined` becomes `extended`; its reason rules stay).
- `decisions.md` and a DoD.
- Not built: no change to `regressToStage`, `saveJourney`, `loadAllFromDisk`, the disk adapter, the regress handler, `handleGetJourneyById` or any spec; no migration; no `core` move.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test, an existing spec run, a set of existing checks, or a recorded manual step. `routes/journey.js` is a required touchpoint and appears in no exclusion list; the files in the exclusion list (`modules/journey-store.js`, `modules/journey-disk.js`, `server.js`, the spec) have no assertion against them (T1 to T3 call the store and the disk adapter as they are and assert where the handler redirects).

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. `src/` changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | developer or operator on disk-backed journeys |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC4 and AC6 are spec runs and a CI read, AC5 existing checks, AC7 a diff check |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no adapter is added or changed; the test wires the existing store and disk adapter and asserts behaviour (where the user is sent), not a function reference |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | Disk-mode only: the Postgres deployment already builds its record from `activeSkill`, so there is nothing to observe there. The defect is wider than the issue (a never-regressed store-saved journey also resumed at `discovery`), and the fix covers both; recorded in the story. |
| W2 | Accepted | `loadAllFromDisk` has the reverse mismatch (a restart in disk mode loses a store-saved journey's stage); found, not fixed, recorded as a follow-up (decisions D1). |
| W3 | Accepted | Locally, `ep3-s1` needs a native Windows `COPILOT_REPO_PATH`; a forward-slash root makes the regress handler's path guard return 400 (an unrelated local effect). CI (Linux) is the authoritative measurement. |
| W4 | Accepted | The agent runs the full `npm test` and the CI regression script before pushing, confirms CI ran on the final commit (including the matrix commit) before the merge is requested, checks master after the merge, puts `Fixes #1042` in the pull request body and verifies the closing link. |
| W5 | Accepted | Local E2E runs create real `artefacts/*e2e*` and `workspace/journeys` entries; the agent works in a worktree, removes it afterwards (junction first) and stages exact paths only. |

## Oversight level
**Low** - one line in the resume handler. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-journey-regress-resume/stories/rgsr-s1-resume-lands-on-regressed-stage.md
Test plan: artefacts/2026-11-21-journey-regress-resume/test-plans/rgsr-s1-test-plan.md
Goal: write the node check first and confirm T1 and T2 fail on master (T3 passes); then change the one currentStage line in handleGetJourneyResume; run the new check, the neighbouring resume checks, the full npm test with the regression script, and ep3-s1 three times on a fresh journeys root; open a draft pull request with Fixes #1042; move the ep3-s1 matrix entry only after CI shows it passing, then wait for CI on the final commit.
Constraints: routes/journey.js (that one line and its comment), the new check and the matrix only; preserve CRLF in journey.js; stage exact paths.
```
