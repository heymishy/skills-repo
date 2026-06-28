# Review Report: Phase row model with locked future-phase rows — Run 1

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.2.md
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

**LOW-1:** AC1 names the phases section format as `## Phases / - Phase 1 (current) / - Phase 2 / - Phase 3` (list-of-items under a heading). The story does not specify what happens if the section uses a different heading level or alternate list syntax. The fallback (AC4) handles absent sections but not malformed ones. The test plan should cover at least one malformed-format case and assert it falls back cleanly.

**LOW-2:** AC6 states pending changes are cleared on map re-initialisation. This is correct per the design but creates an implicit coupling between dic.2 (refresh behaviour) and dic.1/dic.3 (pending state). The test plan should cover the case where a user has pending changes and then triggers a refresh, asserting that the pending state is cleared and the count resets to 0.

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

**Verdict:** PASS — 2 LOW findings (test plan notes only). dic.2 is ready for /test-plan.

---

### Category A: Traceability — notes

- Epic ref ✓, Discovery ref ✓, Benefit-metric ref ✓
- Benefit linkage names M2 explicitly with mechanism ("dic.2 is the single authoritative point of enforcement for future-phase placement") ✓
- Downstream stories (dic.3, dic.4, dic.5) identified as extending rather than re-implementing the guard ✓

### Category B: Scope integrity — notes

- Story is bounded to: phase-row rendering, lock overlay, drop guard extension — no overlap with dic.3 (add-story affordance rendering is mentioned only as a constraint on dic.3, not implemented here) ✓
- Cross-column drag, add-story, touch, dispatch all explicitly excluded via dependency section ✓
- Chain forking and phase editing explicitly out of scope ✓

### Category C: AC quality — notes

- 7 ACs, all in Given/When/Then format ✓
- AC1: observable DOM attributes (`data-phase-current`, `class="phase-row phase-row--locked"`) ✓
- AC2: lock overlay content, visual style, and screen reader announcement all specified ✓
- AC3: negative path (drag to locked row) — rejection behaviour explicit ✓
- AC4: fallback (no phases section) — single row, no error ✓
- AC5: positive path (drag within current phase row not blocked) — regression of dic.1 AC2 ✓
- AC6: re-initialisation behaviour — pending changes cleared ✓
- AC7: injectable adapter wiring — stub-throw and production-wiring tests named ✓
- LOW-1: malformed phases section not covered by ACs
- LOW-2: pending-state-cleared-on-refresh coupling not explicit in ACs (covered by AC6 but not linked to dic.1/dic.3 state)

### Category D: Completeness — notes

- User story: As/Want/So ✓; named persona ✓
- Benefit linkage ✓
- Dependencies: upstream (dic.1) and downstream (dic.3, dic.4, dic.5) named ✓
- Out of scope ✓
- NFRs: Accessibility (lock overlay screen reader, keyboard focus), Performance (parse-once, cache), Regression ✓
- Complexity 2, Scope stability Stable ✓

### Category E: Architecture compliance — notes

- `parsePhaseModel` injectable adapter with stub-throw default named explicitly ✓ (D37 rule)
- Phase model serialised into DOM `data-` attribute — no new API call ✓
- No new JS file ✓
- No new SSE event ✓
- `req.session.accessToken` not touched in dic.2 ✓
- Artefact-first rule satisfied ✓
