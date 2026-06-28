# Definition of Ready: Add-story canvas flow

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.3.md
**Test plan reference:** artefacts/2026-06-28-definition-canvas/test-plans/dic.3-test-plan.md
**Review reference:** artefacts/2026-06-28-definition-canvas/review/dic.3-review-1.md
**NFR profile:** artefacts/2026-06-28-definition-canvas/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want to add a new story directly on the canvas by clicking a + affordance in an empty current-phase cell, entering a title inline, and seeing it immediately appear as a 'new' card in the pending changes set / So that I can extend the definition output without re-entering the chat" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC7: 18 unit tests. NFR-A11Y: 2 unit tests + 1 manual. All gaps acknowledged |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of scope: multi-line description entry, existing story title editing, undo |
| H5 | Benefit linkage field references a named metric | ✅ | MM1 (definition re-instruction turns reduced) and M2 (future-phase placement guard — no add affordance in locked rows) |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 0 MEDIUM, 2 LOW (AC3(f) draggable delegation note; unapplied-add silent-clear UX note — both addressed in test plan) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged) | ✅ | All 7 ACs covered. Gaps: real DnD of new card (DOM-behaviour — manual), focus trap on Tab (JSDOM focus model — manual), real AT announcement (AT behaviour — axe validates, real is manual). All acknowledged |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints: + button as <button class="add-story-btn">, inline input pattern, session.canvasCards.pendingAdds schema, cardId generation, no new JS file. No Category E HIGH findings |
| H-E2E | CSS-layout-dependent ACs: card--new solid border, + button visibility | ✅ | RISK-ACCEPT: CSS rendering of card--new and + button visibility not automatable in JSDOM. CSS class presence is automated; actual rendering is manual smoke test. See decisions.md |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs: Accessibility (keyboard, focus trap, new tag announcement), Performance (synchronous DOM mutation), Regression. NFR profile exists |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile: Public |
| H-NFR-profile | nfr-profile.md must exist | ✅ | Profile exists |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Hamish King — Platform operator / tech lead — 2026-06-28 |
| H-ADAPTER | No injectable adapter introduced without stub-throws + AC + wiring task | ✅ | No injectable adapters in dic.3 |

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Not triggered |
| W2 | Scope stability declared | ✅ | — | Not triggered |
| W3 | MEDIUM findings acknowledged | ✅ | — | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script may miss event-delegation vs per-card listener edge case | Hamish King — 2026-06-28 — acknowledged; manual smoke test: add card, immediately drag it |
| W5 | No UNCERTAIN items in test plan | ⚠️ | Draggable without re-init, focus trap, AT announcement all manual-only | Hamish King — 2026-06-28 — acknowledged |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Add-story canvas flow — artefacts/2026-06-28-definition-canvas/stories/dic.3.md
Test plan: artefacts/2026-06-28-definition-canvas/test-plans/dic.3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js). No new JS files. No new npm dependencies without approval.
- + button: <button class="add-story-btn" aria-label="Add story to [epic name]">+</button>. Render only in empty current-phase row cells. No + button in locked rows (data-phase-current="false" cells).
- Click handler: replace + button with <input type="text" class="add-story-input" placeholder="Story title…">; focus input immediately.
- On Enter with non-empty value: replace input with a new card. Card must have: data-origin="operator", class="story-card card--new", draggable="true". Header must include a "new" tag element.
- On Escape or blur with empty value: remove input, restore + button. No state change.
- HTML-escape operator-entered title before setting card text content. Use escHtml from src/web-ui/utils/html-shell.js (or equivalent established in dic.1). No innerHTML with raw input.
- cardId: generate a unique id per add. Use a UUID function or `Date.now() + '-' + Math.random().toString(36).slice(2)`. cardId must be non-empty and unique per add operation.
- session.canvasCards.pendingAdds schema: [{cardId, epicId, phaseId, title}]. Add entry on each submit.
- Pending-changes count: pendingReorder.length + pendingAdds.length. Update "Apply changes (N pending)" button label synchronously after each add.
- Map re-init (already handled in dic.2): confirms that pendingAdds is cleared on re-init. Do not re-implement this — it is already handled.
- Event delegation: attach the + button click listener to the story map container (not per-button), so new buttons added dynamically are covered. Confirm dic.1's drag listener approach before choosing delegation vs per-card — use the same pattern for consistency.
- Dependency: dic.1 AND dic.2 must be merged before implementing dic.3. Read both in full before modifying.
- Write governance tests at tests/check-dic3-add-story.js. Add to package.json test chain.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when all tests pass. Do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-28
