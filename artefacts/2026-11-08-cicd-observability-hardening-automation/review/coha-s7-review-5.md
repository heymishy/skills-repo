# Review Report: Incident record pull request opened for each bridge-opened production error GitHub issue — Run 5

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Story slug:** coha-s7
**Date:** 2026-11-14
**Categories run:** A, B, C, D, E (F, G, H N/A: no journey, skills or journeys test file in scope)
**Outcome:** PASS

Reviewer note: re-review after the edits made in response to run 4 (FAIL, 1 HIGH). The story was re-read in full. GitHub's documentation for workflow trigger events (docs.github.com, events-that-trigger-workflows) was fetched this run and confirms that `issues` activity types are separate values (`opened`, `labeled`, `unlabeled`, `edited` and others), that each can be listed under `types`, and that omitting `types` triggers the workflow on all of them. So subscribing only to `opened` is right and adding a label later starts nothing, but only if the workflow declares `types: [opened]` explicitly (see 5-L1). The same page confirms `workflow_dispatch` supports boolean inputs and up to 25 inputs, so the three-input design is within limits. The test plan is still being updated in parallel and is not held against the story.

---

## Review Diff — Run 5 vs Run 4

### Resolved since last run
✅ 4-H1 — AC8 and AC9 setup fired the live trigger — RESOLVED: the test issue is now opened without the label and the label added afterwards; the automatic run declines it with a logged reason (author and marker present, label absent), which AC8 names as evidence; adding a label starts no run (verified against GitHub's event documentation); AC9 reuses the same issue after AC8's dry run created nothing, so the sequence is coherent.
✅ 4-M1 — hand start had no input, recognition source or permission — RESOLVED: the "Dry run and hand start" constraint defines the three `workflow_dispatch` inputs (issue number, dry-run switch, rebuild switch); recognition fetches author, label names, title and body through the API; the `recognise` job has `contents: read` and `issues: read`; the current-label difference is stated and the author check and marker are named as the anchor.
✅ 4-M2 — "serialised" NFR contradicted the per-issue group — RESOLVED: the NFR now says runs for different issues are independent.
✅ 4-M3 — rebuild versus idempotency skips — RESOLVED: the idempotency constraint says the branch-exists and open-pull-request skips are lifted only by the rebuild switch on a hand start and a record on `master` always skips; the concurrency constraint defines the reset from current `master`, a force push limited to that one `incident/posthog-` branch, an in-place update of the open pull request, and a new pull request only if the old one was closed; AC7 now tests exactly that.
✅ 4-L2 — AC9 cleanup was an action list — RESOLVED: AC9 states the outcome (no `incident/posthog-` branch for the test id and no open pull request remains) and uses the fake id `00000000-0000-4000-8000-000000000009`.
✅ 4-L3 — unset-variable and inline-code assertions missing — RESOLVED: AC3 and AC6 now carry them. (The case-exact fail-safe note is in the constraint.)
✅ 4-L4 (second half, stale dry-run text) — RESOLVED: the constraint now reads as the first of two live checks.

### Acknowledged / still open
- 4-M4 — ACKNOWLEDGED, substantially resolved: the known-friction text now says the checks are "expected not to run", cites GitHub's approval-required behaviour, makes AC9 observe it and record it in `decisions.md`, and names approving the checks as an alternative to the bypass. Two stale phrasings remain (5-L2).
- 4-L1 — ACKNOWLEDGED: concurrency semantics were verified in run 4; the story's reasoning is correct and needs no change.
- 4-L4 (first half, AC1 compound) — STILL OPEN, carried to the test plan: split AC1 into separate assertions there.

### New findings this run
Four LOW, none from a new contradiction of substance, below. Specific checks asked for:
- Label-at-open rule versus a hand start reading current labels: coherent. The constraint states the difference openly. A hand start can record an issue that the automatic run declined for the label reason (that is what AC8 and AC9 do), but the constraint says "author, marker or id" and those three are applied identically, so the sentence is accurate. Residual exposure is only that a person with write access can label an issue the operator authored; that same person could also start the workflow, so no new trust is granted.
- Hand start cannot bypass author, marker or UUID checks: stated explicitly and consistent with AC3, AC4 and AC6.
- Force push versus idempotency and AC2: coherent. The force push is possible only with the rebuild switch, only on a UUID-validated `incident/posthog-` branch name, never on `master`; a record on `master` still skips, so AC2's "after the record is already on `master`" holds. AC2 does not mention the rebuild carve-out (5-L3).
- AC9 second start without the rebuild switch: the branch exists, so the idempotency skip fires and nothing is created, as AC2 requires. Consistent.
- AC8 automatic-run reason visible in a log: the run exists (the issue was opened) and the decline reason is a logged audit line per the Audit NFR, so it is visible in the run log without echoing body text.

---

## HIGH findings — must resolve before /test-plan sign-off

None.

## MEDIUM findings — resolve or acknowledge in /decisions

None new. (4-M4 acknowledged above.)

## LOW findings — note for retrospective

- **[5-L1]** E — The wiring test and the trigger constraint should assert `types: [opened]` explicitly under `issues`. GitHub's documentation says omitting `types` triggers on every activity type, including `labeled` and `edited`, and this story's AC8 and AC9 setups rely on a later label starting nothing. Also assert that the concurrency group expression covers both the issue event's number and the dispatch input's number (the two sources differ), so an automatic run and a hand start for the same issue share one group.
- **[5-L2]** C — Stale wording remains: Architecture Constraints, "Permission separation" says a branch push or pull request made with the workflow token "starts no other workflow", while the friction constraint now allows approval-required runs for `pull_request` events (the loop claim stays true because this workflow does not listen to `pull_request`; say that); the Dependencies line "the required check does not run on it" should read "is expected not to run on it"; and the Status line at the top still describes the run 4 state ("three refinements ... reviewed in review-4"), so update it to say run 5 passed after the run 4 edits.
- **[5-L3]** C — AC2 says a second run for the same id creates no second branch or pull request; a rebuild-switch run on an open pull request legitimately updates the branch in place. Add "without the rebuild switch" to AC2 so the two criteria don't read as conflicting, and state that the rebuild switch combined with the dry-run switch behaves as dry (prints, pushes nothing). AC7's rebuild clause is not `live-verified`, so the test plan must cover the reset and force-push against a local git fixture.
- **[5-L4]** E — Two small specification gaps. The issues API also returns pull requests: the hand-start fetch should decline a number whose payload carries a `pull_request` key. And the `recognise` job's outputs carry the title and body to the `record` job, which has no `issues` permission and so cannot refetch; say they pass as job outputs consumed only through `env:` (never in a `run:` expression) or as an uploaded JSON file, and mind output size and multiline limits.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |

AC quality is a 4: nine ACs, all Given/When/Then and testable; AC1 stays compound (carried to the test plan), AC2 lacks the rebuild carve-out (5-L3), and AC7 to AC9 depend on hand starts but their setup order and cleanup are now explicit.

## Summary

0 HIGH, 0 MEDIUM, 4 LOW new across 1 story; run 4's HIGH and four MEDIUM findings are resolved or acknowledged.
**Outcome:** PASS — no HIGH findings remain. `/test-plan` can be finalised for AC9 and the amended constraints. The five LOW edits (5-L1 to 5-L4 and the carried AC1 split) are cheap wording and test-plan changes that can be made before or at `/definition-of-ready`. DoR still needs the bridge author variable confirmed and the live AC9 approval arranged for after merge.
