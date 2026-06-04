# Review Report: Stream assumption cards from SSE marker events into the right panel — Run 1

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.3.md
**Date:** 2026-06-04
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

- **[1-L1]** Traceability / Completeness — Benefit Linkage section header names only M1 ("Metric moved: M1 — Assumption card render reliability") but the user story "So that" clause and the benefit-metric coverage matrix both attribute M2 (Rework rate reduction) to this story. The mechanism for M2 is clear (surfacing assumption cards mid-session reduces the invisible-assumption re-run cause) but is not stated in the Benefit Linkage section. Add "and M2 — Rework rate reduction" to the Metric moved line and add one sentence explaining how assumption card visibility at generation time reduces M2 re-runs.

---

## Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 4 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

0 HIGH, 0 MEDIUM, 1 LOW.

**Verdict:** PASS — all criteria scored 3 or above. The LOW finding is a benefit linkage completeness note — no rework required before /test-plan.

---

### Category A: Traceability — notes

- Epic ref ✓ (iwu-web-session-surface.md)
- Discovery ref ✓
- Benefit-metric ref ✓
- "So that" names both M1 and M2 ✓
- Benefit linkage mechanism sentence explains M1 contribution ("Without this story, M1 is structurally 0%") ✓
- Metric moved header lists only M1; coverage matrix attributes both M1 and M2 to iwu.3 — LOW finding 1-L1

### Category B: Scope integrity — notes

- Story implements SSE streaming, marker stripping, and card DOM injection only ✓
- Out-of-scope section explicitly excludes confirm/flag buttons and endpoint (iwu.4), nudge bar (iwu.5), context manifest (iwu.1), and feature flag default change to true (iwu.6) ✓
- No epic out-of-scope violations ✓

### Category C: AC quality — notes

- 6 ACs, all in Given/When/Then format ✓
- All use observable behaviour language ("is stripped", "emits", "appends", "renders", "appears", "are present") ✓
- AC4 specifies HTML injection payload literally (`<script>alert('xss')</script>`, `&amp;`) — best-in-class testability ✓
- AC5 handles unknown type value (renders as-is, not dropped) — edge case has its own AC ✓
- AC6 tests card ordering and unique `data-card-id` — multi-card edge case covered ✓
- Performance constraint in AC2 (card appended within 500ms) is measurable in Playwright ✓

### Category D: Completeness — notes

- User story: As/Want/So ✓; named persona "platform operator (primary)" ✓
- Benefit linkage: M1 mechanism well-explained; M2 not stated in header (LOW finding 1-L1) ✓
- Out of scope populated ✓
- NFRs: Security (HTML-escape, cardId uniqueness), Performance (500ms), Accessibility (WCAG 2.1 AA non-colour card state) ✓
- Complexity 2, Scope stability Stable ✓

### Category E: Architecture compliance — notes

- ADR-018 (marker protocol) referenced and marker format specified ✓
- ADR-019 (session TTL) referenced for feature flag guard ✓
- HTML-escape requirement aligns with mandatory security guardrail ("No user-supplied content injected into innerHTML without sanitisation") ✓
- Accessibility: non-colour discriminators required for card states — aligns with mandatory accessibility guardrail ✓
- No anti-patterns ✓
