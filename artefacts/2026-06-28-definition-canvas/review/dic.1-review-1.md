# Review Report: Interactive story cards with inherited/new styling and epic rename guard — Run 1

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.1.md
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

**LOW-1:** AC2 specifies that `session.canvasCards.pendingReorder` is updated on drop, but does not name the record schema (fields: cardId, epicId, phaseId, newIndex). The schema is implied from dic.5's request body. Naming it explicitly in AC2 would make the test plan easier to write. No blocking issue — the schema is defined in dic.5 and the test plan can cross-reference it.

---

## Summary

| Criterion | Score | Pass/Fail |
|-----------|-------|-----------|
| Traceability | 5 | PASS |
| Scope integrity | 5 | PASS |
| AC quality | 5 | PASS |
| Completeness | 5 | PASS |
| Architecture compliance | 5 | PASS |

0 HIGH, 0 MEDIUM, 1 LOW.

**Verdict:** PASS — 1 LOW finding (non-blocking; schema cross-reference). dic.1 is ready for /test-plan.

---

### Category A: Traceability — notes

- Epic ref ✓ (discovery.md)
- Discovery ref ✓
- Benefit-metric ref ✓
- Benefit linkage names MM1 and M2 explicitly with mechanism sentence ("The drag-and-drop interaction within an epic column directly replaces chat re-instruction turns") ✓
- dic.1 identified as foundational story; downstream stories (dic.2–dic.5) named ✓

### Category B: Scope integrity — notes

- Story is bounded to: drag-within-column, inherited/new styling, epic rename guard — no overlap with dic.2 (phase rows), dic.3 (add-story), dic.4 (touch), dic.5 (dispatch) ✓
- Out-of-scope section explicitly names dic.2–dic.5 scope items ✓
- Cross-column drag, phase row locking, add-story, canvas-edit dispatch all explicitly excluded ✓

### Category C: AC quality — notes

- 6 ACs, all in Given/When/Then format ✓
- AC1: observable attribute + class check ✓
- AC2: drop position update + pendingReorder state update — two assertions, both observable ✓
- AC3: negative path (cross-column drop rejection) with explicit "no state change" assertion ✓
- AC4: epic rename guard with tooltip text specified and auto-dismiss timing named (3 seconds) ✓
- AC5: origin distinction survives map refresh — session-reload persistence explicitly tested ✓
- AC6: regression guard for existing tests — concrete names given (check-mfc1, check-mfc2, check-ougl) ✓
- LOW-1: AC2 pendingReorder record schema not named inline (cross-reference to dic.5 required in test plan)

### Category D: Completeness — notes

- User story: As/Want/So ✓; named persona "platform operator (primary)" ✓
- Benefit linkage populated ✓
- Dependencies: upstream (none) and downstream (dic.2–dic.5) named ✓
- Out of scope populated ✓
- NFRs: Accessibility (keyboard reorder, WCAG 2.1 AA), Performance (requestAnimationFrame / debounce), Regression ✓
- Complexity 2, Scope stability Stable ✓

### Category E: Architecture compliance — notes

- All client JS in inline script block in skills.js — no new file ✓ (architecture constraint)
- `draggable="true"` on story card elements named ✓
- `session.canvasCards` structure named; cardId → {storyId, origin} ✓
- Epic rename guard: no contenteditable, no input; pointer-events explicit ✓
- Injectable adapter pattern not introduced in dic.1 (no new adapters needed at this layer) ✓
- `req.session.accessToken` field not touched in dic.1 (correct — no token access in this story) ✓
- Artefact-first rule satisfied — story artefact present before implementation ✓
