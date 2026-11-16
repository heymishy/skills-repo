## Story: A short-track fix for a GitHub issue closes that issue as a matter of course

**Epic reference:** None - short-track (bounded change to two skills, one script and one schema field, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: 2026-11-16, issue #1121 (opened by the production error chain) stayed open after its fix, PR #1127, merged, because the PR body had no closing keyword (`closingIssuesReferences` was empty; GitHub only cross-referenced it). The operator found it by looking. The agreed process (recorded in `artefacts/2026-11-16-ci-regression-review/decisions.md`, the inc-s2 CORRECTION entry) is that an error issue is resolved as a short-track story whose PR says `Fixes #<issue>`; nothing in the framework made that happen.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [pipeline, skills]
**Operator decision (2026-11-16):** an open source issue at DoD is a recorded deviation with an offer to close, not a hard stop.

## User Story

As **the operator**,
I want **a story that fixes a GitHub issue to carry that issue through the pipeline and close it when its PR merges**,
So that **no resolved issue is left open and I never have to notice and close it by hand**.

## Benefit Linkage

**Metric moved:** None formal. Removes a manual, easily forgotten step and keeps the issue list a true picture of what is still broken.

## Design

1. **Carry it.** A story may name its `Source issue: #N`. `pipeline-state.json` records `sourceIssue` (integer) on the story, set with `bin/skills advance`.
2. **Close it with the PR.** `/branch-complete` (Option 2, the draft PR step) puts `Fixes #N` in the PR body when the story has a source issue, then verifies with `node scripts/check-source-issue-closure.js --pr <number> --issue <N>` that GitHub lists the issue under the PR's closing references before reporting the PR URL.
3. **Check it at DoD.** `/definition-of-done` Step 1 runs the same script's scan for the story: if the source issue is closed it is recorded in the DoD; if it is still open after the PR merged, the DoD gets a deviation row and the skill offers the operator the closing action (a comment naming the PR and the evidence). Closing stays the operator's yes.

## Architecture Constraints

- Skills and scripts change by pull request (platform change policy); ADR-011 (artefact-first) satisfied by this chain.
- The agent never closes an issue on its own: closing is the `Fixes #N` keyword on a merge the operator performs, or an explicit operator-confirmed action at DoD.
- `scripts/check-source-issue-closure.js` has no dependency except the existing `gh` CLI, takes the binary name from `GH_BIN` (default `gh`), and exits 0 with a clear "skipped" message when `gh` cannot be run. Its logic is exported as pure functions with the issue lookup injected, so tests never call GitHub.
- Zero new npm dependencies.

## Acceptance Criteria

**AC1:** Given the `/branch-complete` skill, When it is read, Then its draft-PR step (both the bash and the PowerShell body) puts `Fixes #N` in the PR body for a story with a source issue, and requires the closing-reference check before reporting the PR.

**AC2:** Given the closing-keyword check, When a PR body is tested for issue N, Then `Fixes #N`, `Closes #N` and `Resolves #N` (any case) pass, and a sentence that merely mentions the issue (such as "the operator can close issue #N") fails, and so does a different number that starts with N's digits.

**AC3:** Given merged stories in the state, When the scan runs with an injected issue lookup, Then it returns exactly the merged stories that have a `sourceIssue` whose issue is still open (not stories without one, not stories whose PR is not merged, not closed issues).

**AC4:** Given the `/definition-of-done` skill and its output template, When read, Then Step 1 runs the scan for the story, and the DoD carries a "Source issue closure" row that records closed, or a deviation with the offer to close.

**AC5:** Given `pipeline-state.json` and its schema, When a story has `sourceIssue` (integer), Then both story definitions in the schema accept it, the integrity check passes, and `bin/skills advance <slug> <id> sourceIssue=N` stores it as an integer.

**AC6:** Given the script's command line, When `gh` cannot be run, Then it exits 0 and prints a skipped message (so offline and CI runs are never broken), and when no story has a `sourceIssue` the scan reports none and exits 0.

**AC7 (evidence, after merge):** Given the next real production-error issue, When its fix PR merges, Then the issue closes with the merge and the DoD shows no deviation.

## Out of Scope

- Opening issues, changing the error bridge, closing issues for stories without a source issue, any automatic closing at DoD without operator confirmation, and a CI job (the check runs inside the skills).

## NFRs

- **Safety:** the script only reads (`gh issue view`, `gh pr view`); it never writes to GitHub.
- **Reliability:** an unavailable or failing lookup never fails the pipeline; it reports "skipped" or "unknown".

## Complexity Rating

**Rating:** 2 - two skill edits, one small script, one schema field. **Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
