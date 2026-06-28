# Review Report: Touch tap-to-select / tap-to-place reorder fallback — Run 1

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.4.md
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

**LOW-1:** The story correctly notes that JSDOM does not simulate touch events, meaning the touch interaction path cannot be tested in the existing Node.js unit test suite. The Complexity Rationale names Playwright with touch simulation as the verification path, but the test plan must explicitly classify AC1–AC8 as either automated (Playwright) or manual smoke test. Without this classification, the DoR check will flag them as unverified. The test plan must resolve this explicitly.

**LOW-2:** AC7 asserts that touch state does not activate during mouse drag. This is correct in intent but may be hard to assert in an automated test if the test runner fires both `touchstart` and `mousedown` for simulated touch events. The test plan should note whether this AC is tested via Playwright with touch-only mode or as a manual assertion.

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

**Verdict:** PASS — 2 LOW findings (test classification gap; to be resolved in test plan). dic.4 is ready for /test-plan.

---

### Category A: Traceability — notes

- Epic ref ✓, Discovery ref ✓, Benefit-metric ref ✓
- Benefit linkage names MM1 with mechanism ("without a touch fallback, operators on touch devices cannot use the canvas drag-reorder at all") ✓
- Parity with dic.1 outcome named: same result (reordered card, pending change recorded) via different interaction path ✓

### Category B: Scope integrity — notes

- Story bounded to: `touchstart` card selection, `touchend`/click cell placement, same guards as dic.1/dic.2 applied to touch path ✓
- Pinch-to-zoom, long-press drag mode, and separate touch add-story path explicitly excluded ✓
- `+` button tap delegated to dic.3's click handler — no scope overlap ✓

### Category C: AC quality — notes

- 8 ACs, all in Given/When/Then format ✓
- AC1: touchstart → card--touch-selected + _touchState update ✓
- AC2: second card tapped deselects first ✓
- AC3: placement on same-column current-phase cell — 4 observable assertions (DOM move, pendingReorder, count increment, selection cleared) ✓
- AC4: cross-column rejection — no DOM change, card stays selected ✓
- AC5: locked-row rejection — same as AC4 behaviour ✓
- AC6: re-tap same card deselects — affordance for cancellation ✓
- AC7: mouse drag does not activate touch state — non-interference ✓
- AC8: touch-placed reorder structurally identical to mouse-drag reorder in dispatch ✓
- LOW-1: ACs do not specify Playwright vs manual classification (test plan must resolve)
- LOW-2: AC7 testability ambiguity noted

### Category D: Completeness — notes

- User story: As/Want/So ✓; named persona (touch device user) ✓
- Benefit linkage ✓
- Dependencies: upstream (dic.1, dic.2, dic.3) and downstream (dic.5) named ✓
- Out of scope ✓
- NFRs: Accessibility (aria-selected, cancel affordance), Performance (touchstart must not call preventDefault globally — native scroll preserved) ✓
- Complexity 2, Scope stability Stable ✓

### Category E: Architecture compliance — notes

- `_touchState` as module-level variable in inline script block — no new file ✓
- `touchstart` used (touch-only, not `pointerdown`) — correct choice for avoiding mouse/touch co-firing ✓
- Same phase guard and cross-column guard reused (not re-implemented) from dic.1/dic.2 ✓
- `session.canvasCards.pendingReorder` record format identical to dic.1 — dic.5 makes no distinction ✓
- No new JS file ✓
- Artefact-first rule satisfied ✓
