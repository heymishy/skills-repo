# Review Report: Client-org lightweight collaboration — comments only — Run 1

**Story reference:** artefacts/2026-07-30-agency-client-organisations/stories/story-5-client-agency-comments.md
**Date:** 2026-07-30
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Completeness — AC4 says a qualifying comment thread "is counted as satisfying" Metric 2's minimum validation signal, but doesn't say how or where the count is actually surfaced (a dashboard query? a PostHog event fired on comment creation, matching Metric 2's own stated measurement method in `benefit-metric.md`?). The benefit-metric artefact's measurement method (PostHog event) isn't referenced anywhere in this story's ACs or NFRs — the story defines the data (a comment exists) but not the instrumentation event benefit-metric.md says will be used to measure it.
  Risk if proceeding: the feature could ship fully functional commenting with no actual telemetry wired up, silently failing to produce Metric 2's own defined measurement signal.
  To acknowledge: add an AC or NFR line requiring the PostHog comment-thread event named in `benefit-metric.md`'s Metric 2 measurement method, or acknowledge in /decisions that instrumentation is deferred to a follow-up.

---

## LOW findings — note for retrospective

- **[1-L1]** AC quality — AC3 says the Agency-org user "can reply with their own comment" but doesn't have its own explicit assertion that the Agency's reply is itself visible to the Client-org user (only that the Agency can see the Client's comments, per the AC's own framing). Likely implied by "comment thread" being bidirectional, but worth a one-line explicit assertion given this is exactly the observable behaviour Metric 2 counts on.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Category Scores

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 3 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** The clearest possible metric linkage in the epic — the story's own AC4 directly names the metric's minimum validation signal.

**Scope integrity (5):** Correctly excludes editing/deleting, real-time push, moderation, and comments on non-shared resources — no overlap with anything else in the epic or discovery's out-of-scope list.

**AC quality (4):** 4 ACs, Given/When/Then, testable. LOW-1 noted above (implicit bidirectional visibility).

**Completeness (3):** MEDIUM-1 above — the story defines the behaviour but not the instrumentation event that connects it back to the metric it exists to serve.

**Architecture compliance (5):** Correctly reuses Story 2's grant-check guard rather than introducing a parallel access-control path (directly addresses the exact anti-pattern this codebase's own guardrails file warns against — ad hoc access logic scattered across route handlers), and correctly cites ADR-026 (confirmed no existing commenting mechanism to duplicate) and ADR-025 (comment is additive, not an edit-access grant).

**Verdict:** PASS — no HIGH findings. The MEDIUM finding (missing instrumentation linkage) should be resolved before this story reaches /definition-of-done, since it's the exact measurement this story's benefit linkage claims to serve.
