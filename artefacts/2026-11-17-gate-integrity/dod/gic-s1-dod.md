# gic-s1 Definition of Done

Date: 2026-11-18. Story: the required checks take their rules from master, and changes to gate files are visible. Pull request #1144 merged 2026-11-17 17:21 UTC (`7c52ebe96`). It closes no issue; it came from the gate integrity audit (`artefacts/2026-11-17-testing-cicd-audit/spikes/gate-integrity-audit.md`).

## Result: COMPLETE (AC5, the live report, was observed on the next pull request, #1145)

AC1 to AC4 (Acceptance Criteria 1 to 4) were verified by 22 new automated tests and by CI before merge. AC5 asked for the `Gate files changed` report on the story's own pull request; a `pull_request_target` workflow is read from the base branch, so it could not run on the pull request that introduces it. That is stated, not worked around.

## AC Coverage

| AC | Status | Evidence | Class | Deviation |
|---|---|---|---|---|
| AC1 (flags read from the base branch) | ✅ | `check-gic-s1-base-flag` (6 tests, against real temporary git repositories): true on base and false in the working tree reads true; false on base and true in the working tree reads false; absent flag, absent file, another section's flag and a trailing comment handled; an unresolvable ref exits 2 and prints no value; the working tree is never read. `check-gic-s1-workflows` T4a asserts all three jobs call the reader and take the reader itself from the base. In CI, the Core job log printed "Core browser tests gate flag (from the base branch): true" | automated plus live (CI log) | the pull request that introduces the reader had no reader on its base, so its own runs used the checkout's copy and said so in the log; this cannot happen again |
| AC2 (gate-file report, never fails) | ✅ | `check-gic-s1-gate-files` (5 tests): matcher, summary, a hostile path rendered as plain text, the committed list, and every pattern matches a real file. `check-gic-s1-workflows` T4b and T4c: trigger is `pull_request_target` only, no head reference, no install step, permissions only `contents: read` and `pull-requests: write`, no `exit 1` | automated | none |
| AC3 (baseline intersection) | ✅ | `check-gic-s1-baseline-intersection` (5 tests): an added entry is ignored, named in the output and the failing test counts as a new regression; a removed entry is honoured; unchanged cases and the command line; no base baseline means the old behaviour. `T4d`: the unit step fetches master's baseline and passes it as the third argument. Existing `check-ci-test-regression-check`, `check-bfl-s1` and `check-bfl-s2` pass untouched | automated | none |
| AC4 (protected list contents) | ✅ | `.github/gate-files.json`, `mode: observe`, 13 patterns; the test checks each pattern against a real file so the list cannot rot | automated | none |
| AC5 (live report on its own pull request) | ✅ observed on pull request #1145 (not its own, as anticipated) | Required checks `Run assurance gate`, `Scenario A E2E (staging)`, `Scenario B E2E (staging)` and the Core job all passed on the pull request. The `Gate files changed` workflow could not report on it | live (CI) | the ordering caveat the story anticipated: its first real report is the next pull request that touches a gate file |

## Observations and follow-ups

- **AC5 observed (2026-11-18).** On pull request #1145 (lpw-s4) the `Gate files changed` workflow ran from master, posted one comment listing `tests/e2e/capability-matrix.json`, said "Mode: observe", and the job passed. The ordering caveat applied to its own pull request only.
- **Not done, not mine to decide (recorded in `decisions.md`):** enforce mode; a separate GitHub identity for agent pull requests (the agent and the operator share one identity, so any approval step the agent could click is not a control); `CODEOWNERS` with a required review; the assurance gate checking what `governance-gates.yml` says, not only that it exists.
- **The baseline change costs nothing today** because `tests/known-baseline-failures.json` is empty; it matters the first time someone tries to add to it.
- **Still open from the audit:** the remaining findings (capability matrix and trace policy editable by the change they judge) are covered by visibility only, not prevented.
- **Worktree cleanup** done after this record: `.worktrees/gic-s1` removed (its `node_modules` link unlinked first) and the local branch deleted.

## Scope Deviations

- None to the acceptance criteria. The bootstrap fallback to the checkout's reader is a one-time consequence of introducing the reader, documented in the pull request body and `decisions.md`.
