# Review Report: Transparently rehydrate an archived stage's turns on read — Run 1

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s6-rehydrate-archived-turns.md
**Date:** 2026-07-28
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) — Same recurring ADR-027 citation gap.
  Risk if proceeding: Low — audit-trail completeness only.
  To acknowledge: add the citation, or run /decisions RISK-ACCEPT once for the whole feature.

---

## LOW findings — note for retrospective

- **[1-L1]** Category C (AC quality) — AC5 combines two components' behaviour in one assertion, same pattern as dsh-s2 AC4 and dsh-s3 AC4: "it returns null (mapped to a 404 by the caller)... the same tenant guard applies to archive reads as hot reads." The function's own return value (null) and the caller's HTTP-status mapping are two different components' responsibilities folded into one AC. Not blocking — independently testable as written — but worth tightening if these ACs are revisited.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW for this story.
**Outcome:** PASS
