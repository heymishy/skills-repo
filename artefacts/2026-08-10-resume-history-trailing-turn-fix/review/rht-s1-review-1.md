## Review: rht-s1 — A completed stage's resumed history silently drops its final assistant message when nothing followed it

**Story:** artefacts/2026-08-10-resume-history-trailing-turn-fix/stories/rht-s1-trailing-assistant-turn-shown-in-history.md
**Reviewer:** Claude (agent), operator-directed — found by the operator directly while live-validating drh-s1
**Date:** 2026-08-10

---

### Category A: Traceability

PASS. Directly traces to the operator's own live confirmation (`#chat-messages` `childCount: 0`, verified by direct DOM inspection on their own real journey), and correctly identifies why the original `dsh-s3` AC5 design choice no longer fully holds: it conflated "don't show a live interactive prompt" with "don't show the message content," when `readOnly: true` already independently handles the former.

### Category B: Scope discipline

PASS. Explicitly scoped to one loop inside one function; explicitly declines to touch `readOnly` suppression, the live chat page, or invent any new heuristic beyond the route's own existing "only reached for completed stages" guard. Correctly distinguishes the still-correct multi-turn pairing case (AC2) from the broken lone-trailing-turn case (AC1), rather than a blanket rewrite.

### Category C: AC quality

PASS. 5 ACs, Given/When/Then, each independently testable. AC3 (mixed paired-then-trailing sequence) is a good edge case proving the fix generalizes, not just patches the single-turn case. AC4 and AC5 are explicit non-regression guards protecting exactly the two properties most at risk of being accidentally broken by a naive fix (interactivity suppression, zero-turns fallback).

### Category D: Completeness

PASS. NFRs correctly frame this as both a correctness fix and a consistency fix (single-shot vs. multi-turn stages should behave the same way), grounded in the operator's own stated expectation ("the history view shows the history") rather than an abstract principle.

### Category E: Architecture compliance

PASS. Reuses the exact existing pattern already used for a lone leading `user` turn (`{question: '', answer: content, modelResponse: ''}`) rather than inventing a new display shape — the minimal, most consistent fix available.

---

### Verdict

**PASS — 0 HIGH findings.** A precisely root-caused, tightly-scoped fix for a real gap found immediately adjacent to `drh-s1`'s own live validation. The AC2/AC4/AC5 regression guards correctly protect every property that was already working. Cleared to proceed to `/test-plan`.
