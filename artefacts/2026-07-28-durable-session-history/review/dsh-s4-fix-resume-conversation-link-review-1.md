# Review Report: Fix "Resume conversation" to always resolve to a real conversation view — Run 1

**Story reference:** artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
**Date:** 2026-07-28
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** Category E (Architecture compliance) — Same recurring ADR-027 citation gap as dsh-s1/s2/s3.
  Risk if proceeding: Low — audit-trail completeness only.
  To acknowledge: add the citation, or run /decisions RISK-ACCEPT once for the whole feature.

---

## LOW findings — note for retrospective

- **[1-L1]** Category C (AC quality) — AC4 embeds a known-limitation admission directly into the AC's own wording: "the page falls back to the artefact-only view... rather than a 404 — this is the one case that remains a gap, but it degrades to 'no conversation shown,' not a broken page." The parenthetical self-assessment ("this is the one case that remains a gap") reads more like a design-limitation note than a strict Given/When/Then assertion. The AC is still independently testable as written, but a cleaner split would move the "remains a gap" framing into the story's Out of Scope or NFR Gaps section rather than inside the AC text itself.

---

## Summary

0 HIGH, 1 MEDIUM, 1 LOW for this story.
**Outcome:** PASS
