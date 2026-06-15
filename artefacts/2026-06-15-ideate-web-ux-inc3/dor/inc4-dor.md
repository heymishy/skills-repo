# Definition of Ready: inc4 — Canvas output panel

**Story:** inc4
**Feature:** 2026-06-15-ideate-web-ux-inc3
**DoR status:** BLOCKED — design gate not yet cleared
**Design gate:** `/frontend-design` artefact required at `artefacts/2026-06-15-ideate-web-ux-inc3/design/inc4-canvas-design.md`

---

## H1–H9 checklist

H1 ✅ User story format present (see stories/inc4.md)
H2 ✅ 7 ACs defined (AC1–AC7)
H3 ✅ Test plan written (test-plans/inc4-test-plan.md) — test file deferred until design gate cleared
H4 ✅ Out of scope: no change to existing SKILL.md, iwu tests
H5 ✅ Benefit linkage: M2 (canvas render fidelity)
H6 ✅ Complexity 3 — new marker type, client canvas renderer, HTML/CSS design
H7 ✅ Review PASS, 0 HIGH (4-M1 design gate accepted, 4-L1/4-L2 deferred to design artefact)
H8 ✅ No uncovered ACs at this stage
H9 ⏸ Architecture constraints partially defined — full constraints require design artefact

---

## Design gate requirements

The `/frontend-design` artefact must specify:
1. Canvas panel position (replaces `#draft-content`, augments it, or is a new fourth panel section)
2. Block type allowlist (`cluster-tree`, `table`, `text` — confirm and extend if needed)
3. Visual rendering spec for each block type (HTML/CSS structure, node shape, nesting behaviour)
4. Keyboard navigation model
5. Impact on iwu2 right-panel tests (if `#draft-content` is removed or moved, AC8 of iwu2 test must be reassessed)

---

## Coding Agent Instructions

BLOCKED. Do not implement until:
1. Design artefact exists at `artefacts/2026-06-15-ideate-web-ux-inc3/design/inc4-canvas-design.md`
2. inc3 is at definition-of-done
3. This DoR is re-opened and signed off after design gate is cleared

At that point, update this DoR with full architecture constraints and re-sign off.
