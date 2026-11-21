## Definition of Ready: A single transient failure in the staging smoke or post-deploy confirmation steps no longer blocks the promotion to production

**Story reference:** artefacts/2026-11-21-staging-flake-retries/stories/sfr-s1-staging-steps-retry-once.md
**Test plan reference:** artefacts/2026-11-21-staging-flake-retries/test-plans/sfr-s1-test-plan.md
**Assessed by:** Claude Sonnet 5.5
**Date:** 2026-11-21
**Track:** short

## Contract Proposal
- `.github/workflows/staging-deploy.yml` (AC1 to AC4): `--retries=1 --reporter=list,json` and a `PLAYWRIGHT_JSON_OUTPUT_NAME` on the smoke command and the two post-deploy commands; after each, an `if: always()` step that appends `node scripts/flake-check.js --report <file>` to the step summary (non-strict; a missing report writes a one-line note).
- `tests/e2e/flake-ledger.json` (AC5): two entries, names in the `flake-check --report` format, `owner` heymishy, `issue` #1181, `firstSeen` 2026-11-21, `reviewBy` 2026-12-05, notes with the first failure's message and counts.
- `tests/FLAKE-POLICY.md` (AC6): the retry sentence names the three staging steps; every rule `check-flk-s1` asserts stays.
- `tests/check-sfr-s1-staging-flake-retries.js` (S1 to S6), `decisions.md` and a DoD.
- Not built: no change to `playwright.config.js`, `e2e.yml`, any spec, the pull request jobs or the promotion gate; no `--strict`; no fix of either flake's cause.

## Contract Review
Contract review passed. All 7 acceptance criteria map to a named test, an existing check or a recorded manual step. The workflow, the ledger and the policy are required touchpoints (AC1 to AC6) and appear in no exclusion list; `e2e.yml`, `playwright.config.js` and the specs are excluded and the new check only asserts the absence of `--retries` there (AC3), which is a read, not a change. `check-bri-s2.6` asserts `/playwright test/` on the smoke step and is unaffected.

## Short-track entry-condition note
Short-track (`/test-plan -> /definition-of-ready -> coding agent`); H7 and H-GOV vacuously satisfied. Workflow and policy changes go through a pull request.

## Hard Blocks
| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | As / Want / So with persona | Pass | the operator who approves promotions |
| H2 | At least 3 ACs in Given / When / Then | Pass | 7 ACs |
| H3 | Every AC has a test | Pass | AC7 is the existing checks plus CI |
| H4 | Out of scope populated | Pass | |
| H5 | Benefit linkage | Pass (short-track) | |
| H6 | Complexity rated | Pass | 1, Stable |
| H7 | No unresolved HIGH review findings | Pass (vacuous) | |
| H8 / H8-ext | No uncovered ACs; schema dependency | Pass | no pipeline-state schema change |
| H9 | Architecture Constraints populated | Pass | |
| H-E2E | CSS-layout AC without E2E tooling | Pass (N/A) | no layout AC |
| H-NFR, H-NFR2, H-NFR3 | NFRs | Pass | visibility and bounded cost stated |
| H-ADAPTER | Injectable adapter (D37) | Pass (N/A) | no adapter |
| H-GOV, H-INF, H-MIG | N/A or vacuous | Pass | |
| H-DESIGN | Design-token gate | Pass (N/A) | no UI |

**Hard blocks: all passed.**

## Warnings
| # | Status | Note |
|---|--------|------|
| W1 | Accepted | A retry can hide a real intermittent bug if the ledger is not reviewed. Mitigation: both tests are in the ledger with an owner and a 14-day review date, and every flaky pass is listed in the step summary. A test that fails twice still fails the run. |
| W2 | Accepted | **Time-dated consequence:** from 2026-12-06 `check-flk-s1` T6 fails (the unit chain goes red on every pull request) unless the two ledger entries are fixed, removed or re-dated with a reason. This is the policy's own rule; it is stated in the story, the pull request and the DoD so it is not a surprise. |
| W3 | Accepted | The unattributed run 44583170710 may be a third flaky test; it is not in the ledger because its test could not be identified from the saved logs. If a new flaky test appears, the step summary lists it as NOT IN LEDGER. |
| W4 | Accepted | The pull request Scenario A and B jobs (required checks) run the same specs against staging without retries and could see the same flakes; out of scope here, noted in the DoD. |
| W5 | Accepted | The tracking issue #1181 was created with the operator's approval on 2026-11-21 ("Create one tracking issue"). The agent does not create further issues. |
| W6 | Accepted | Register-before-branch, remote head verified after every push, CI on the final commit, master checked after the merge, exact paths staged, worktree removed junction-first. A merge supersedes the waiting production promotion; the agent asks before merging while one is waiting. |

## Oversight level
**Medium** - a change to the deploy pipeline's test steps. The operator reviews the pull request and merges.

## Coding Agent Instructions

```
Proceed: Yes
Story: artefacts/2026-11-21-staging-flake-retries/stories/sfr-s1-staging-steps-retry-once.md
Test plan: artefacts/2026-11-21-staging-flake-retries/test-plans/sfr-s1-test-plan.md
Goal: write the node check first and confirm S1 to S6 fail on master; then edit the three staging commands and add their report steps, add the two ledger entries and the policy sentence; mutation-check the check; run the new check, the eight guard checks and the full npm test with the regression script; open a draft pull request; wait for CI on the final commit.
Constraints: the workflow, ledger, policy, new check and artefacts only; preserve CRLF in staging-deploy.yml; stage exact paths; verify the remote head after every push; do not create further GitHub issues; do not approve any production promotion.
```
