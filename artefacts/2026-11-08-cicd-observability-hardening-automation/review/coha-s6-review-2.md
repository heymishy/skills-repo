# Review Report: Alert-to-GitHub-issue bridge for new production error issues — Run 2

**Story reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md
**Story slug:** coha-s6
**Date:** 2026-11-13
**Categories run:** A, B, C, D, E (F, G, H N/A)
**Outcome:** FAIL

Reviewer note: the same agent drafted the story and its rewrite. Each run 1 fix was re-read for what it leaves undefined, not for whether it exists.

---

## Review Diff — Run 2 vs Run 1

### Resolved since last run
✅ 1-H2 — AC4 needed a mechanism the app lacks — RESOLVED: the incident record moved to a new story (coha-s7) with the write-path decision stated as open.
✅ 1-M1 — environment filter missing — RESOLVED: AC4 and the constraint.
✅ 1-M2 — route security unspecified — RESOLVED: modelled on `/webhook/stripe`, CSRF exemption, 405/413/400 limits, constant-time comparison, wiring AC7.
✅ 1-M3 — real payload needed first — RESOLVED in form: first task stated and the operator's approval recorded; see 2-M1 for what that capture must confirm.
✅ 1-M4 — public repo and fields — RESOLVED: fixed field list, no message or stack, repo from configuration.
✅ 1-L1, 1-L2 — RESOLVED (label and 503/200 semantics stated).
⚠️ 1-H1 — duplicate state location — RESOLVED in form (database table with unique key) but incomplete; see 2-H1.

### New findings this run
🆕 2-H1, 2-M1, 2-L1 (below).

---

## HIGH findings — must resolve before /test-plan

- **[2-H1]** C — AC quality (the table's status handling leaves a duplicate-or-lost window). The story inserts the row first ("a unique-key violation means already seen"), then creates the issue, then marks `created`. Two cases are undefined: (a) the process dies after the insert and before the issue exists: the row stays `pending`, and every later delivery hits the unique violation and is treated as a duplicate, so no issue is ever opened (a lost error); (b) a second delivery arrives while the first is still creating: treating the violation as "seen" is right, but treating a `pending` row as retryable (needed for case a, and for AC5's "a later delivery opens exactly one issue") could open two issues. AC2 and AC5 pull in opposite directions without a stated rule.
  Fix: state the rule. A row with status `created` is a duplicate (return 200, do nothing). A row with status `pending` that is younger than a stated claim window (for example 2 minutes) is in flight (return 200, do nothing). A `pending` row older than the window is claimed with a single conditional update that only one caller can win, and that caller creates the issue (after checking GitHub for the PostHog issue id marker in an existing issue body to avoid a duplicate from case a). Add one test per case: crash-after-insert recovers, concurrent deliveries produce one issue, expired claim recovers.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[2-M1]** A — Traceability / AC quality. AC1 requires the title to be the fixed error code and the body to include `environment`, first-seen time and count, and AC4 filters on `environment`. All of these are assumed to be in PostHog's alert payload. The story does not say the payload-capture first task must confirm it: a new-issue alert payload may carry the issue's name and counts but not the first event's properties, in which case `environment` is absent and AC4 would drop every real alert.
  Risk if proceeding: a bridge that ignores all production errors because the field it filters on is never sent.
  To acknowledge: make the first task's exit condition explicit: confirm the captured payload contains the fixed code, first-seen time, count, the PostHog issue id and URL, and `environment`; if `environment` is absent, decide between filtering in the PostHog alert only, or having the bridge read the issue from the PostHog API.

---

## LOW findings — note for retrospective

- **[2-L1]** C — AC7 holds two independent cases (wired and unwired); split on the next edit so each Given/When/Then stands alone.

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 4 | PASS |
| AC quality | 2 | FAIL (2-H1: pending-row handling undefined; AC2 and AC5 conflict) |
| Completeness | 4 | PASS |

## Summary

1 HIGH, 1 MEDIUM, 1 LOW across 1 story.
**Outcome:** FAIL — one HIGH finding (the lost-or-duplicate window in the table's status handling) must be resolved before /test-plan.
