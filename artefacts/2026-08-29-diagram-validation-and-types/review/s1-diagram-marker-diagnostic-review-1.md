# Review Report: Structured diagnostic for a malformed canvas diagram marker — Run 1

**Story reference:** artefacts/2026-08-29-diagram-validation-and-types/stories/s1-diagram-marker-diagnostic.md
**Date:** 2026-08-29
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** AC quality — AC3's retry mechanism ("the model's next attempt at the same diagram") does not specify WHETHER the retry is a same-turn (mid-stream) correction or a next-turn (following user message) correction. These are materially different implementation approaches — a same-turn retry requires pausing/resuming the LLM stream mid-generation; a next-turn retry only requires surfacing the diagnostic as context for the following turn. Two engineers could reasonably implement this differently and both claim AC3 is satisfied.
  Risk if proceeding: `/design` or `/implementation-plan` picks an interpretation without it being an explicit, reviewed decision — worth resolving as a named design choice rather than an implicit one.
  To acknowledge: run /decisions, category RISK-ACCEPT, or resolve explicitly at `/design`.

- **[1-M2]** AC quality — AC1 hedges its observable outcome: "emitted via the SSE stream (or an equivalent surfaced record)." An AC should assert one specific, falsifiable mechanism, not offer an escape hatch. As written, a test could satisfy AC1 via any mechanism at all, making it unfalsifiable.
  Risk if proceeding: the AC provides no real constraint on implementation, and a test-plan writer has no single mechanism to write a test against.
  To acknowledge: run /decisions, category RISK-ACCEPT, or tighten the AC to name the SSE stream specifically before `/test-plan`.

---

## LOW findings — note for retrospective

- **[1-L1]** AC quality — AC3 combines two distinct Given/When/Then scenarios (a successful retry, and a terminal failure after a second consecutive attempt) into a single AC. Per `templates/story.md`'s own rule ("Edge cases get their own AC, not a sub-bullet"), these should be split into two separate ACs (e.g. AC3 for the successful-retry case, AC4 for the terminal-failure case, renumbering AC4 to AC5).

---

## Summary

0 HIGH, 2 MEDIUM, 1 LOW.
**Outcome:** PASS

**Scores:** Traceability 5 — clean references, real benefit-linkage mechanism sentence. Scope integrity 5 — stays within discovery/epic MVP, out-of-scope items are real. AC quality 3 — the retry-timing ambiguity (1-M1) and hedge language (1-M2) are addressable via AC rewording, not story rework. Completeness 5 — all template fields populated with real content. Architecture compliance 4 — ADR-026 and the testing-standards domain both correctly referenced in Architecture Constraints; no violations found.
