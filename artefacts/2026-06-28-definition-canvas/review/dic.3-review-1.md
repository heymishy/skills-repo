# Review Report: Add-story canvas flow — Run 1

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.3.md
**Date:** 2026-06-28
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

**LOW-1:** AC3(f) states new cards are immediately draggable. This depends on whether `initCanvasInteractivity()` uses event delegation (delegated listeners on the table container — new cards are automatically covered) or per-card listener attachment (new cards require explicit re-registration). The story notes this risk in the Complexity Rationale but does not specify which approach is required. The test plan should include an AC3(f) test that verifies a newly-added card is draggable without re-running init.

**LOW-2:** AC5 states unapplied adds are cleared on map re-initialisation. The user experience of losing unapplied adds on refresh is noted as expected behaviour but no user warning is specified. If the operator has 5 pending adds and the model delivers a new turn, those adds silently disappear. Consider a future enhancement: warn before clearing if pendingAdds.length > 0. Out of scope for dic.3 but worth noting for the retrospective.

---

## Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

0 HIGH, 0 MEDIUM, 2 LOW.

**Verdict:** PASS — 2 LOW findings (test plan note + future UX enhancement). dic.3 is ready for /test-plan.

---

### Category A: Traceability — notes

- Epic ref ✓, Discovery ref ✓, Benefit-metric ref ✓
- Benefit linkage names MM1 and M2 with mechanism ("replaces the most common class of add-story re-instruction") ✓
- Phase guard (M2) noted in benefit linkage: add affordance must not appear in locked rows ✓

### Category B: Scope integrity — notes

- Story bounded to: `+` affordance, inline input, new card as `card--new`, `pendingAdds` entry ✓
- Multi-line story description entry, existing story title editing, undo explicitly out of scope ✓
- No overlap with dic.4 (touch): the `+` button tap is via existing click handler, not a new touch path ✓

### Category C: AC quality — notes

- 7 ACs, all in Given/When/Then format ✓
- AC1: `+` button rendering — positional (current-phase only, not locked rows) ✓
- AC2: click opens input, focus fires immediately ✓
- AC3: Enter submits — 6 sub-assertions, all observable (DOM class, tag, border, count, state, draggable) ✓
- AC4: Escape / empty blur dismisses input, restores `+` button, no state change ✓
- AC5: map refresh clears unapplied adds — explicit "NOT preserved" ✓
- AC6: apply-and-refresh transitions origin from `operator` to `model` ✓
- AC7: keyboard navigation for add flow (Tab, Space/Enter) ✓
- LOW-1: AC3(f) draggable assertion — delegation vs per-card ambiguity not resolved in AC

### Category D: Completeness — notes

- User story: As/Want/So ✓; named persona ✓
- Benefit linkage ✓
- Dependencies: upstream (dic.1, dic.2) and downstream (dic.4, dic.5) named ✓
- Out of scope ✓
- NFRs: Accessibility (keyboard, focus trap, `new` tag announcement), Performance (synchronous DOM mutation), Regression ✓
- Complexity 2, Scope stability Stable ✓

### Category E: Architecture compliance — notes

- `+` button as `<button class="add-story-btn" aria-label="...">` — no custom element or framework component ✓
- Inline input pattern matches existing inline script block convention ✓
- `session.canvasCards.pendingAdds` schema: `{cardId, epicId, phaseId, title}` ✓
- `cardId` generation (UUID or timestamp-prefixed) — either acceptable; test plan should pin the format for assertion purposes
- No new JS file ✓
- Artefact-first rule satisfied ✓
