# Review Report: Archive turns older than 60 days out of the hot table — Run 1

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s5-archive-job.md
**Date:** 2026-07-28
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category C (AC quality) — AC3 describes an implementation approach, not observable behaviour: "Given the archive job is deployed, When it executes, Then it runs as a scheduled GitHub Actions workflow (cron trigger) — not a persistent process." This asserts *which mechanism* is used (GitHub Actions specifically) rather than a testable *outcome*. `templates/story.md`'s own AC rule states: "ACs describe observable behaviour, not implementation approach."
  Risk if proceeding: A future implementer could satisfy the letter of this AC by literally using GitHub Actions while missing the actual intent (bounded, non-persistent execution) if the mechanism ever changes (e.g. to a different scheduler) — the AC would then read as failing even though the real requirement (no persistent process) is still met.
  To acknowledge: reword as an observable/behavioural assertion — e.g. "Given the archive job is triggered on its schedule, When it runs to completion, Then no process remains running afterward (the job exits cleanly between runs)" — which is testable regardless of the specific scheduler used, while the "GitHub Actions" detail moves to Architecture Constraints where mechanism choices belong. Or run /decisions RISK-ACCEPT if keeping the AC as-is is preferred.

- **[1-M2]** Category E (Architecture compliance) — Same recurring ADR-027 citation gap.
  Risk if proceeding: Low — audit-trail completeness only.
  To acknowledge: add the citation, or run /decisions RISK-ACCEPT once for the whole feature.

---

## LOW findings — note for retrospective

None for this story specifically.

---

## Summary

0 HIGH, 2 MEDIUM, 0 LOW for this story.
**Outcome:** PASS
