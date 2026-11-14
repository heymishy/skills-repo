# Review Report: Incident record pull request opened for each bridge-opened production error GitHub issue — Run 4

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Story slug:** coha-s7
**Date:** 2026-11-14
**Categories run:** A, B, C, D, E (F, G, H N/A: no journey, skills or journeys test file in scope)
**Outcome:** FAIL

Reviewer note: re-review after the four operator amendments of 2026-11-14 (per-issue concurrency group, exact author comparison, inline-code pull request text, new AC9). The test plan predates the amendments and is being updated in parallel, so it is not held against the story. Platform facts were checked this run: GitHub's concurrency documentation (docs.github.com, using-concurrency) and the GITHUB_TOKEN documentation (docs.github.com, concepts/security/github_token) were fetched, and `gh api repos/heymishy/skills-repo/actions/permissions/workflow` returned `{"default_workflow_permissions":"read","can_approve_pull_request_reviews":true}`, matching the 2026-11-13 and 2026-11-14 readings in the story. One HIGH finding is an internal sequencing contradiction between AC8, AC9 and the trigger.

---

## Review Diff — Run 4 vs Run 3

### Resolved since last run
✅ 3-M1 and 3-M2 — remain resolved (check names cited; UUID validation and AC6 non-UUID case present).
✅ 3-L3 — AC1 is still compound; carried forward unchanged as 4-L4 (the test plan is the place to split it).

### Still open from run 3 (unchanged)
3-L1 (admin-bypass friction each time) and 3-L2 (adjacency to discovery's triage out-of-scope line) stand, but see 4-M4: the friction premise itself is now doubtful.

### New findings this run
One HIGH, four MEDIUM, four LOW, below. The amendments are directionally correct: the per-issue group is right, the exact author match is fail-safe, and AC9 closes a real gap (no other AC exercises the real push and pull request creation).

---

## HIGH findings — must resolve before /test-plan sign-off

- **[4-H1]** C / B — AC8 and AC9 cannot be set up as written without the trigger already firing live. Both start from "a test issue opened by hand by the bridge's account with the `production-error` label and the marker line" (AC9: "the same kind of issue as AC8"). The constraints say the workflow is triggered on `issues: opened` and that the account's own hand-opened labelled issue with the marker "qualifies". So the moment the operator opens that issue, the workflow runs live (not dry) and, if the repository is in the state AC1 describes, creates the branch and pull request before AC8's dry run is ever started. Consequences: AC8's "no branch and no pull request is created" and "real incident file unchanged" are false from the start; AC9's "exactly one branch" is satisfied by the automatic run rather than by the manual start, so the "started by hand without the dry-run switch" step is a no-op that only exercises the skip path; and the story can't tell which run produced the evidence. Fix by stating the setup in the ACs, for example: open the test issue first without the label (so the opened-event run declines with a logged reason, which is also a useful evidence line), add the label afterward, then run AC8 then AC9 by hand; or state plainly that AC9's first run is the automatic one and drop "started by hand" for the first run. Either way, say which and how recognition treats the label at manual start (see 4-M1).

## MEDIUM findings — resolve or acknowledge in /decisions

- **[4-M1]** E — The manual start has no defined input or recognition source. The constraint says "The workflow reads author and labels from the event payload, not from the issue text", but AC7 (rebuild), AC8 and AC9 all use a hand start (`workflow_dispatch`), which carries no issue payload; the recognition must fetch the issue by number through the API. The `recognise` job is declared `contents: read` only, so it cannot be specified to read an issue as written, and "label at the moment it is opened" has no meaning for a hand start (it would see the current labels, which a person with triage rights can change). Add: the dispatch input (issue number), that recognition fetches author, labels and body from the API using fields not text, the `issues: read` permission on the `recognise` job (the `record` job still gets none), and that the author check, not the label, is the trust anchor for a hand start.
- **[4-M2]** C — The NFR "concurrent runs serialised and a conflicted record rebuildable (AC7)" contradicts the amended constraint: with a per-issue group, runs for different issues are deliberately not serialised (they run in parallel, "never wait behind or cancel each other"). Only same-issue runs queue. Reword the NFR to "runs for different issues are independent; runs for the same issue do not duplicate".
- **[4-M3]** C — The "rebuild by hand start" is not coherent with the idempotency rule. The rebuild is meant to replace a conflicted pull request's branch, but the idempotency constraint says the workflow skips when the branch `incident/posthog-<id>` already exists or a pull request for it is open, which is exactly the state a conflicted record is in. State the rebuild mode (a dispatch input, or detect conflict) and exactly what it does to the existing branch and pull request (force-update the branch in place, or close the old pull request and open a new one), and that it still never creates a second open pull request. AC7's second clause cannot be tested until this is defined.
- **[4-M4]** E — The "known friction" premise is stated too absolutely. GitHub's current GITHUB_TOKEN documentation says events triggered by the token do not create new workflow runs except `workflow_dispatch`/`repository_dispatch` and `pull_request` events of type `opened`, `synchronize` or `reopened`, which create runs in an approval-required state that a user with write access can start via "Approve workflows to run". The story says the three required checks "will not run on it". So either the checks are available behind one approval click (then the bypass may be avoidable, and AC9's "pull request opened with the workflow token starts nothing" should be re-verified live), or the checks are skipped for another reason (for example staging secrets); check this at AC9 and record the observed behaviour in `decisions.md`. The loop-safety conclusion (a token-made branch push or pull request cannot trigger a self-loop) still holds, because the workflow listens to `issues: opened` only. The 2026-11-13 and 2026-11-14 settings readings (`read`, `can_approve_pull_request_reviews: true`) were confirmed this run.

## LOW findings — note for retrospective

- **[4-L1]** C — The concurrency claim was verified against GitHub's documentation: at most one running and one pending run per group, and a newer arrival cancels the existing pending run. The docs do not say `cancel-in-progress: false` changes that; it only stops cancellation of the running one. So the story's "repeat run for the same issue is replaced harmlessly" is correct (a newer pending run replaces an older pending one, and both are the same issue, so one survives and the idempotency check covers the other). The story's wording that a shared group "would lose a record" is also correct. Note the docs now describe a `queue: max` option; not needed here, but a reviewer should not read the story as relying on `cancel-in-progress: false` for the pending behaviour.
- **[4-L2]** C — AC9's cleanup ("closes the test pull request without merging it, deletes its branch and closes the test issue") is in the AC, as asked, but it is an action list rather than an observable outcome. Add an assertion that afterwards no `incident/posthog-<test id>` branch and no open pull request remain, and name that the test uses a clearly fake UUID that cannot match a real PostHog issue, so a leftover cannot cause a real record to be skipped by the idempotency check.
- **[4-L3]** C — Two amended constraints have no direct AC or named test: an unset or empty author variable recognises nothing, and the pull request text carries the code only in one-line inline code formatting with backticks replaced. AC6 covers metacharacters and backticks but doesn't assert inline-code formatting; AC3 doesn't assert the unset-variable case. Add both as explicit assertions in the test plan (or fold into AC3 and AC6). Also note that GitHub logins are case-insensitive while the match is exact: this is fail-safe (an unmatched case declines, never over-accepts) but the variable must hold the login exactly as the event payload reports it.
- **[4-L4]** C — AC1 is still compound (3-L3). The Dry run constraint text still says the switch lets the live check run "without touching the repository"; it should now read as the first of two live checks (AC8 dry, AC9 live).

## Consistency checks requested (answers)

- AC9 against AC1, AC2, AC7, AC8: fields match AC1; the "second start creates nothing" matches AC2 and the idempotency rule; independent of AC8 only once 4-H1 is fixed.
- AC9 independently testable: yes after 4-H1; it is explicitly live-only, runs once after merge, and names the operator approval immediately before the run, the data-only pull request in a public repository and the cleanup. Safety is adequate given those; it needs the 4-L2 assertion.
- Per-issue concurrency covers "two issues at once" (AC7 first clause): yes. The rebuild clause is not coherent until 4-M3.
- Idempotency text versus per-issue group: not contradictory; the group does not need to prevent duplicate same-issue runs because the idempotency check does.
- Exact author compare, inline-code text and per-issue group are consistent with each other and with the security NFR.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 2 | FAIL |
| Completeness | 3 | PASS |

AC quality is a 2: AC8 and AC9 as written cannot both be performed against the trigger the story defines (4-H1, the line "a test issue opened by hand by the bridge's account with the `production-error` label and the marker line"), and AC7's rebuild clause conflicts with the idempotency skip (4-M3). Completeness is a 3 because the hand-start input and permission are unspecified (4-M1) and the NFR line is stale (4-M2).

## Summary

1 HIGH, 4 MEDIUM, 4 LOW across 1 story.
**Outcome:** FAIL — one HIGH finding (4-H1) remains: the AC8 and AC9 setup fires the live trigger before the manual runs. It is a small wording fix to the ACs, plus defining the hand-start input and rebuild behaviour (4-M1, 4-M3); a quick run 5 should pass. Needed edits (not made, per instruction): fix the AC8 and AC9 setup sequence; add the dispatch input and `issues: read` on the `recognise` job; reword the "serialised" NFR; define the rebuild mode against the idempotency skip; make AC9's cleanup an observable outcome with a fake UUID; correct the "checks will not run" statement or verify it at AC9.
