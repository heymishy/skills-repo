# Review Report: Alert-to-GitHub-issue bridge for new production error issues — Run 5

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Story slug:** coha-s6
**Date:** 2026-11-13
**Categories run:** A, B, C, D, E (F, G, H N/A: no journey, skills or journeys test file in scope)
**Outcome:** PASS

Reviewer note: same agent as the author, fifth pass. This run reviews the run-3 bridge design reinstated after the native-route detour. Run 4 (`coha-s6-review-4.md`) reviewed a different design and is superseded, so only the run-3 findings are carried forward. Facts the story relies on were checked against the repo and GitHub rather than read for intent: the `/webhook/stripe` route is at `src/web-ui/server.js:4237` and the `credit_audit_log` table is created at boot at `server.js:561`, so the two patterns the story copies exist. The two MEDIUM findings were fixed in the story before this report was closed and should be re-checked at `/definition-of-ready`.

---

## Review Diff — Run 5 vs Run 3 (the last review of this design)

### Carried forward unchanged
The run-3 resolutions stand (pending-row rule, explicit payload fields, split wired/unwired ACs). The run-3 LOW 3-L1 (claim window not derived from PostHog's retry timing) still applies and is repeated as 5-L1.

### Changed since run 3
- First task no longer captures a payload through a throwaway receiver; the body is a template we define, rendered by a simulated destination invocation.
- Occurrence count dropped from the issue body and AC1.
- AC4 now requires a distinct log line for a missing environment.
- New AC9, production-observed.
- The token's scope is now a stated constraint (issue read and write on one repo), and the PostHog GitHub App is out of scope.

---

## HIGH findings — must resolve before /test-plan

None.

## MEDIUM findings — resolve or acknowledge in /decisions

- **[5-M1]** E — Architecture Constraints did not reference ADR-012 (platform-agnostic architecture) although the route sits between a vendor-specific source (PostHog) and a vendor-specific sink (GitHub). RESOLVED IN REVISION: a constraint states the route reads a body of our own design (a generic authenticated webhook), PostHog-specific knowledge lives only in the destination's body template, and the GitHub call is behind the injectable adapter.
- **[5-M2]** C — Mock-shape risk (CLAUDE.md "mock-shape verification"): the fixture the tests and AC6 use is rendered from a sample event we supply, so it proves our template and our route agree with each other, not that a real `$error_tracking_issue_created` event fills the template's fields. If `exception_timestamp`, `$exception_values[1]` or `environment` render empty on a real event, every production error would be rejected or silently ignored while all tests pass. AC9 is the only check that closes this, and it may be absent at merge. RESOLVED IN REVISION as far as it can be: the Audit NFR now requires a body with empty or missing fields to be logged with the field names (never values) so a template that works on the sample but not on real events is visible after the first real error, and AC4 already separates "environment missing" from "staging" in the log. The residual risk (a silent miss until the first real production error) is real; DoR must record it in the AC9 RISK-ACCEPT.

## LOW findings — note for retrospective

- **[5-L1]** E — The 2-minute claim window is a chosen value, not derived from PostHog's retry timing (undocumented); revisit after the live check records how PostHog retries.
- **[5-L2]** C — AC2 combines three delivery cases (repeat, simultaneous, restart) plus the stuck-pending case in one criterion. Each is independently testable and it passed run 3 on that basis, but a failure will need a reader to say which case failed; the test plan should name one test per case.
- **[5-L3]** D — Scope stability is "Unstable" until the first task and AC6 are done; fine, but the story cannot be estimated tighter until then.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 4 | PASS |
| Completeness | 4 | PASS |

## Summary

0 HIGH, 2 MEDIUM (both resolved in revision, re-check at DoR), 3 LOW across 1 story.
**Outcome:** PASS — no HIGH findings remain. `/test-plan` can start; its first deliverable is the simulated-invocation fixture. Operator prerequisites before DoR: the shared secret, a GitHub token limited to issues on one repo (with its expiry noted) and approval for the live destination and one test run.
