# Review Report: Expired invites (past 24 hours) are rejected cleanly — Run 1

**Story reference:** artefacts/2026-08-14-wuce-self-serve-invites/stories/wsi-s3-invite-expiry.md
**Date:** 2026-08-15
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** A (Traceability) — `benefit-metric.md`'s Metric Coverage Matrix does not list `wsi-s3` as a story that moves either metric, even though this story's own Benefit Linkage section explicitly claims it moves "Time from invite creation to invitee access" (as the security bound that keeps the metric meaningful — an unbounded invite window would let the metric be gamed by a very late acceptance). The same gap applies to `wsi-s4` (checked separately in that story's own review).
  Risk if proceeding: The coverage matrix under-represents this story's real contribution, and a future `/trace` run comparing the matrix against actual story linkage would flag this as a drift finding after the fact rather than catching it now, at the cheaper point.
  To acknowledge: run /decisions, category RISK-ACCEPT — or update `benefit-metric.md`'s coverage matrix to add `wsi-s3` (and `wsi-s4`) as indirect contributors before /test-plan.

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW.
**Outcome:** PASS

---

## Scores

| Criterion | Score | Justification |
|-----------|-------|----------------|
| Traceability | 4 | Epic/discovery/benefit-metric referenced, Benefit Linkage mechanism is honest and specific — but see 1-M1 (coverage matrix doesn't reflect this story). Not severe enough to fail on its own. |
| Scope integrity | 5 | 2 explicit out-of-scope items, both specific (extending an expired invite; configurable duration), correctly deferring to the epic's own no-management-UI stance. |
| AC quality | 5 | 3 ACs, all Given/When/Then, testable, cover the rejection path, the non-redemption guarantee, and a regression guarantee for the unaffected within-window case. |
| Completeness | 5 | All fields populated with real content; correctly states "no new table or column" rather than fabricating an Architecture Constraint where none is needed; complexity rated 1, consistent with the story's genuinely small scope. |

**Verdict:** PASS — all criteria scored 3 or above.

---

## Category E: Architecture compliance

- Architecture Constraints field populated: ✓ — correctly minimal (2 bullets), accurately describing this as a refinement of `wsi-s2`'s own logic rather than inventing new architecture.
- Implementation path doesn't violate a named approved pattern: ✓
- No listed anti-pattern used: ✓
- Applicable repo-level ADRs referenced: N/A — this story doesn't independently touch tenant-scoped data in a new way; inherits `wsi-s2`'s own ADR-025 compliance. Reasonable omission, not a gap.
- Story NFRs align with mandatory constraints: ✓ — Security NFR explicitly addresses the expiry/redemption race condition.

No Category E findings.
