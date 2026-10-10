# Review Report: Keyboard-accessible node movement (WCAG 2.1 AA) — Run 1

**Story reference:** artefacts/2026-10-10-infinite-canvas/stories/ic-s4.md
**Date:** 2026-10-10
**Categories run:** A — Traceability / B — Scope / C — AC quality / D — Completeness / E — Architecture compliance
**Outcome:** PASS

---

## HIGH findings — must resolve before /test-plan

None.

---

## MEDIUM findings — resolve or acknowledge in /decisions

- **[1-M1]** AC quality / Completeness — AC1 says *"the operator presses Tab to focus it (or otherwise focuses it)"* — this assumes canvas nodes are keyboard-focusable without stating how. drawflow's own node elements are plain `<div class="drawflow-node">` wrappers — not natively focusable like a `<button>` or `<a>`. Neither this AC, the Architecture Constraints, nor the NFRs specify that each node must be given `tabindex="0"` and a visible `:focus` indicator. Without an explicit requirement, a coding agent could reasonably ship nodes that are never actually reachable by Tab at all — which would make this entire story's own WCAG-AA purpose fail silently. Fix: add an explicit AC (or Architecture Constraint) requiring `tabindex="0"` on each node and a visible focus style, not an assumption that focusability "just happens."
  Risk if proceeding: the story's stated purpose (WCAG 2.1 AA conformance) could be unmet despite AC3's own conformance check passing on a node the implementer happened to make focusable by accident, while not being specified as a requirement future changes could regress silently.
  To acknowledge: run /decisions, category RISK-ACCEPT (not recommended — this is cheap to fix directly in the story).

---

## LOW findings — note for retrospective

None.

---

## Summary

0 HIGH, 1 MEDIUM, 0 LOW across 1 story.
**Outcome:** PASS

---

## Score Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 4 | PASS |
| Completeness | 3 | PASS |
| Architecture compliance | 5 | PASS |

**Verdict:** PASS — all criteria scored 3 or above. The MEDIUM finding (1-M1) is a cheap, specific fix (add a `tabindex`/focus-indicator requirement) recommended before `/definition-of-ready` rather than carried as a RISK-ACCEPT.
