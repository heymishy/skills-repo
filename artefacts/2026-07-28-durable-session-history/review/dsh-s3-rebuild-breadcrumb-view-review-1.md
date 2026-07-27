# Review Report: Rebuild the breadcrumb "view a completed stage" page into a chat+artefact split view — Run 1

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s3-rebuild-breadcrumb-view.md
**Date:** 2026-07-28
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) — Same recurring gap: ADR-027 applicable, not cited in Architecture Constraints.
  Risk if proceeding: Low — audit-trail completeness only.
  To acknowledge: add the citation, or run /decisions RISK-ACCEPT once (covering all affected stories in this feature rather than repeating per-story).

---

## LOW findings — note for retrospective

- **[1-L1]** Category C (AC quality) — AC4 combines two components' behaviour in one assertion: "the response is 404 (not 403) — the existing cross-tenant guard behaviour, unregressed by this rebuild." The 404-vs-403 distinction and the "unregressed" claim are both really about the pre-existing guard's behaviour, not this story's own new code — a stricter reading would split "the guard still runs" from "the guard still returns 404 not 403" into two ACs, or simply reference the existing regression test (`check-p0.2-journey-guard-wiring.js`) directly rather than restating its assertion here. Not blocking — the AC is still independently testable as written.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW for this story.
**Outcome:** PASS
