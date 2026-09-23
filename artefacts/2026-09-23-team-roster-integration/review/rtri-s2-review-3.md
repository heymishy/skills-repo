# Review Report: Wire pod-manager.html's member picker to the real roster — Run 3

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s2.md
**Date:** 2026-09-24
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

None.

---

## LOW findings — note for retrospective

- **[3-L1]** C — AC5's role-tab-filter treatment ("hidden, disabled, or repurposed... left to `/implementation-plan`") is deliberately left open as an implementation decision rather than fully specified. This is a defensible, explicit choice (the AC states hard constraints — never wrong/stale, never throw — and defers only the cosmetic treatment), not an authoring gap, but it means `/implementation-plan` must make and record this choice rather than discovering it's undecided mid-task.
  Fix: none required now; flag for `/implementation-plan` to explicitly record the chosen treatment.

---

## Summary

0 HIGH, 0 MEDIUM, 1 LOW.
**Outcome:** PASS

---

## Score

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

**Traceability (5):** Unaffected by the AC7 addition — epic/discovery/benefit-metric references unchanged and still accurate; AC7 serves the same "Real pod membership" metric as the rest of the story (a pod can't be created with real members at all without a pod role to store).
**Scope integrity (5):** AC7 is a narrow, bounded addition directly required to make AC1/AC2 actually deliverable against real data — not scope creep. New Out of Scope items (editing pod role post-add; `team_memberships.role` untouched) correctly fence the addition rather than letting it expand further. The operator's own explicit choice among 3 options (see decisions.md) confirms this was a deliberate scope decision, not a unilateral expansion.
**AC quality (4):** AC7 is Given/When/Then, independently testable, states the concrete field written (`pod_members.role_id`) and the concrete source (the selector, never the roster response) — minus 1 point for AC5's now-open-ended implementation treatment (see LOW finding), which is a legitimate deferral but does soften AC5's own testability until `/implementation-plan` resolves it.
**Completeness (5):** Architecture Constraints, NFRs (Accessibility now names AC7's new control explicitly), and Out of Scope all updated consistently — no stale cross-references found on re-read of the full story.
**Architecture compliance (5):** No new architecture-guardrail surface — AC7 introduces a native `<select>` (no innerHTML/XSS surface of its own, since its options are the fixed `VALID_ROLES` literal list, never a rendered identity string) and writes to an existing column (`pod_members.role_id`) via the existing write path (Architecture Constraints, unchanged). MC-SEC-01 (AC6) is unaffected by this addition.
