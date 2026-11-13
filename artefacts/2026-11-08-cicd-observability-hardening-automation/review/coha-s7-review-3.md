# Review Report: Incident record pull request opened for each bridge-opened production error GitHub issue — Run 3

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md
**Story slug:** coha-s7
**Date:** 2026-11-13
**Categories run:** A, B, C, D, E (F, G, H N/A: no journey, skills or journeys test file in scope)
**Outcome:** PASS

Reviewer note: same agent as the author, third pass, on a design that changed after run 2 failed on a false premise. Runs 1 and 2 reviewed earlier designs and are superseded. This time the facts the design leans on were read from GitHub before scoring: the `master` ruleset covers only `refs/heads/master` (and a second ruleset only `traces`), so a branch such as `incident/posthog-<id>` is unprotected; the repository setting that lets Actions create pull requests is on; and the three checks the ruleset requires are `Run assurance gate`, `Scenario A E2E (staging)` and `Scenario B E2E (staging)`. The findings below were fixed in the story before this report was closed and should be re-checked at `/definition-of-ready`.

---

## Review Diff — Run 3 vs Run 2

### Resolved since last run
✅ 2-H1 — the chosen mechanism rested on a path-based ruleset bypass that does not exist — RESOLVED BY REPLACEMENT: delivery is now a pull request per record, which needs no bypass; the constraint states the ruleset facts as read and the operator's choice (decisions.md 2026-11-13).
✅ 2-M1 — concurrent runs and a push to `master` — RESOLVED: no push to `master`; AC7 now covers two pull requests and a rebuild from the current `master` after the first is merged.
✅ 2-M2 — ADR-010 reasoning if the outcome is a pull request — RESOLVED: the constraint says ADR-010 is met once the operator merges and that the record exists only on its pull request until then.

### New findings this run
Two MEDIUM, one LOW, below.

---

## HIGH findings — must resolve before /test-plan

None.

## MEDIUM findings — resolve or acknowledge in /decisions

- **[3-M1]** A — The story's first draft named the wrong required check ("the required status check `PR Checks`"). The ruleset requires `Run assurance gate`, `Scenario A E2E (staging)` and `Scenario B E2E (staging)`; `PR Checks` is a workflow, not a required context. The conclusion was right (a pull request opened with `GITHUB_TOKEN` starts no other workflow, so none of the required checks runs and the operator must merge with the admin bypass) but the cited fact was wrong. RESOLVED IN REVISION: the constraint and the out-of-scope line now name the three real checks and cite the read date.
- **[3-M2]** E — Input validation was missing: the PostHog issue id is read from the issue body's marker line and was going to be used in a branch name (`incident/posthog-<id>`), a tag and the idempotency lookup. Issue text is untrusted, and a crafted marker such as `../x` or a value with spaces could produce a malformed ref or an unintended name. RESOLVED IN REVISION: a constraint requires the id to match the UUID pattern before any use, anything else declines with a logged reason and creates no branch, and AC6 now covers a non-UUID marker.

## LOW findings — note for retrospective

- **[3-L1]** C — Every record needs a conscious admin-bypass merge because the required checks do not run on a workflow-created pull request. The story and the decision accept this; if incidents become frequent the friction recurs each time (decision revisit trigger). Recorded so the cost is visible.
- **[3-L2]** B — Creating an incident record is adjacent to the discovery's out-of-scope "Production-defect triage, write-up, and response" line; it is the input to triage, not triage itself, so not a breach (unchanged since run 1).
- **[3-L3]** C — AC1 combines "exactly one pull request", the branch name, the file's single added record and the record's contents in one criterion. Each is checkable in one test; the test plan should list them as separate assertions so a failure names which part broke.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 3 | PASS |
| Completeness | 4 | PASS |

AC quality is a 3: eight ACs, all Given/When/Then and independently testable, but AC1 is compound (3-L3) and AC8 is live-only.

## Summary

0 HIGH, 2 MEDIUM (both resolved in revision, re-check at DoR), 3 LOW across 1 story.
**Outcome:** PASS — no HIGH findings remain. `/test-plan` can start; its tests build on coha-s6's issue-content fixture, which does not exist as a real issue until coha-s6 is implemented, so the test plan uses a fixture derived from coha-s6's story text and states that. DoR needs the operator to confirm that the setting letting Actions create pull requests stays on, to accept merging with the admin bypass each time, and to accept or reject the one-file deviation from ADR-009.
