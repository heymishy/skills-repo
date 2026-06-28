# Definition of Ready: Touch tap-to-select / tap-to-place reorder fallback

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.4.md
**Test plan reference:** artefacts/2026-06-28-definition-canvas/test-plans/dic.4-test-plan.md
**Review reference:** artefacts/2026-06-28-definition-canvas/review/dic.4-review-1.md
**NFR profile:** artefacts/2026-06-28-definition-canvas/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator using a touch device (tablet or touch-enabled laptop) / I want to tap a story card to select it and then tap a target cell to place it at that position / So that I can reorder stories on the canvas without needing mouse drag-and-drop" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 8 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC8: 18 unit tests. All ACs have partial automated coverage (handler function tested directly with synthetic event objects) + manual smoke test scenario. Gaps acknowledged with type and mitigation. JSDOM TouchEvent limitation explicitly documented and classified. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of scope: pinch-to-zoom interference, long-press drag mode, separate touch add-story path |
| H5 | Benefit linkage field references a named metric | ✅ | MM1 (re-instruction turns reduced — touch fallback ensures canvas is usable for touch-device operators) |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 0 MEDIUM, 2 LOW (AC/Playwright classification note; AC7 testability note — both resolved in test plan with explicit JSDOM limitation documentation and manual scenarios) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 8 ACs partially covered by unit tests. Full browser-behaviour gaps: real TouchEvent (JSDOM limitation), touch/mouse co-firing on hybrid device (manual), native scroll not blocked (manual). All gaps acknowledged with type and mitigation. The JSDOM limitation is the primary structural gap — classified as RISK-ACCEPT + required manual smoke test before DoR sign-off |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints: touchstart for touch-only (not pointerdown), _touchState module-level variable, same column and phase guards as dic.1/dic.2 reused, no new JS file. No Category E HIGH findings |
| H-E2E | CSS-layout-dependent ACs: card--touch-selected visual highlight | ✅ | RISK-ACCEPT: CSS rendering of card--touch-selected not automatable. CSS class presence automated; visual rendering manual. See decisions.md |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs: Accessibility (aria-selected, deselect affordance), Performance (touchstart must not call preventDefault globally — native scroll preserved). NFR profile exists |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile: Public |
| H-NFR-profile | nfr-profile.md must exist | ✅ | Profile exists. NFR profile includes explicit gap note: "Touch — JSDOM cannot test TouchEvent — real touch device verification is manual — must complete before dic.4 DoR sign-off" |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Hamish King — Platform operator / tech lead — 2026-06-28 |
| H-ADAPTER | No injectable adapter without stub-throws + AC + wiring task | ✅ | No injectable adapters in dic.4 |

**Required before implementation starts:** The manual touch smoke test scenarios from the test plan (6 scenarios) must be completed on a real touch device (or via Playwright with touch simulation) and the results documented in the PR description before PR review. This is not a post-merge item.

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes — with manual smoke test gate before PR review.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Not triggered |
| W2 | Scope stability declared | ✅ | — | Not triggered |
| W3 | MEDIUM findings acknowledged | ✅ | — | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script cannot cover real touch behaviour | Hamish King — 2026-06-28 — acknowledged; manual smoke test required before PR review as stated above |
| W5 | No UNCERTAIN items in test plan | ⚠️ | All ACs have a real-device gap | Hamish King — 2026-06-28 — acknowledged; manual scenarios documented and required |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Touch tap-to-select / tap-to-place reorder fallback — artefacts/2026-06-28-definition-canvas/stories/dic.4.md
Test plan: artefacts/2026-06-28-definition-canvas/test-plans/dic.4-test-plan.md

Goal:
Make every unit test in the test plan pass. Manually verify the 6 touch smoke test scenarios before opening the PR.

Constraints:
- Language: JavaScript (Node.js). No new JS files. No new npm dependencies without approval.
- Touch state: module-level `_touchState = { selectedCardId: null, selectedCardEl: null }` in the inline script block of skills.js.
- Use touchstart on story cards (not pointerdown). touchstart must call e.stopPropagation() on the card element only — do NOT call e.preventDefault() (that would block native scroll).
- On touchstart of a card:
    1. If _touchState.selectedCardEl === event.currentTarget (same card), deselect: remove card--touch-selected, clear _touchState, return.
    2. If another card was selected, deselect it (remove card--touch-selected from prior selectedCardEl).
    3. Apply card--touch-selected to the new card; set aria-selected="true" on it; update _touchState.
- On touchend or click of a target cell (td in the story map):
    1. If _touchState.selectedCardId is null, do nothing.
    2. Check column guard: target cell's epicId must equal selected card's epicId. If not, return (card stays selected).
    3. Check phase guard: target cell's closest [data-phase-current].dataset.phaseCurrent must be 'true'. If not, return (card stays selected).
    4. Move card DOM element to target cell; record {cardId, epicId, phaseId, newIndex} in session.canvasCards.pendingReorder (same schema as dic.1 drag reorder). Increment pending-changes count.
    5. Clear card--touch-selected; set aria-selected="false"; clear _touchState.
- Mouse drag events (mousedown, dragstart) must NOT set or modify _touchState.
- + button tap is handled by the existing click event from dic.3 — no separate touch path needed.
- Write governance tests at tests/check-dic4-touch-fallback.js. Unit tests call handler functions directly with synthetic event-like objects. Add to package.json test chain.
- Manual smoke test gate: before opening the PR, run the 6 manual scenarios from the test plan on a touch device or Playwright with touch simulation. Document results in the PR description.
- Dependency: dic.1, dic.2, and dic.3 must be merged before implementing dic.4. Read all three in full before modifying.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when unit tests pass AND manual smoke tests are completed. Do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-28
