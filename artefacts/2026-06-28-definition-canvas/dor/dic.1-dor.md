# Definition of Ready: Interactive story cards with inherited/new styling and epic rename guard

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.1.md
**Test plan reference:** artefacts/2026-06-28-definition-canvas/test-plans/dic.1-test-plan.md
**Review reference:** artefacts/2026-06-28-definition-canvas/review/dic.1-review-1.md
**NFR profile:** artefacts/2026-06-28-definition-canvas/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want to drag story cards within their epic column to resequence them, and see clearly which stories were model-generated versus which I added myself / So that I can organise the definition output spatially without re-entering the chat" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC6: 13 unit tests. NFR-A11Y: 2 unit tests + 1 manual scenario. NFR-PERF: manual smoke test. Gaps acknowledged with type and risk |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of scope: phase row locking (dic.2), touch (dic.4), add-story (dic.3), dispatch (dic.5), cross-column drag, inter-phase drag |
| H5 | Benefit linkage field references a named metric | ✅ | MM1 (definition re-instruction turns reduced) and M2 (future-phase guard — drop-target validation logic that dic.2 extends) |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 0 MEDIUM, 1 LOW (pendingReorder schema not named inline in AC2 — test plan cross-references dic.5 schema) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 6 ACs covered. Gaps: real DnD in JSDOM (DOM-behaviour), real AT announcement (AT behaviour), real keyboard focus movement (DOM-behaviour), frame-rate measurement (runtime perf). All gaps acknowledged with type and mitigation |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints: inline script block in skills.js, draggable="true", drag event handlers scoped within-column, session.canvasCards structure, epic rename guard (no contenteditable or input). No Category E HIGH findings |
| H-E2E | If any AC is CSS-layout-dependent AND no E2E tooling configured AND no RISK-ACCEPT recorded — block sign-off | ✅ | AC1 (dashed border) and AC4 (tooltip) have CSS-layout-dependent visual aspects. Classified as RISK-ACCEPT + manual smoke test: visual border style is confirmed by CSS class presence (card--inherited / card--new) in automated tests; actual CSS rendering is manual. No E2E tooling configured. RISK-ACCEPT logged in decisions.md as ADR-DIC-001 and ADR-DIC-002. Manual smoke test step included in test plan |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs: Accessibility (keyboard reorder, WCAG 2.1 AA, epic rename tooltip announcement), Performance (drag debounce / rAF), Regression. NFR profile exists at artefacts/2026-06-28-definition-canvas/nfr-profile.md |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses. Data classification: Public |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile: Public — no PII, no sensitive data |
| H-NFR-profile | If story declares NFRs, artefacts/[feature]/nfr-profile.md must exist | ✅ | Profile exists |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Hamish King — Platform operator / tech lead — 2026-06-28 |
| H-ADAPTER | No injectable adapter introduced without stub-throws + AC + wiring task | ✅ | No injectable adapters in dic.1. (Adapters introduced in dic.2 and dic.5.) |

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | Not triggered |
| W2 | Scope stability is declared | ✅ | — | Not triggered |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | 0 MEDIUM findings. Not triggered |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss DnD edge cases | Hamish King — 2026-06-28 — acknowledged; manual DnD smoke test on real browser required before PR review |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ⚠️ | Real DnD, AT announcement, frame-rate all manual-only | Hamish King — 2026-06-28 — acknowledged; manual scenarios documented in test plan and required before merge |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Interactive story cards with inherited/new styling and epic rename guard — artefacts/2026-06-28-definition-canvas/stories/dic.1.md
Test plan: artefacts/2026-06-28-definition-canvas/test-plans/dic.1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js). No TypeScript. No new npm dependencies without approval.
- All client-side JS is embedded in the inline <script> block in src/web-ui/routes/skills.js. No new JS files.
- Read renderDefinitionMap() in src/web-ui/routes/skills.js in full before modifying. Read the existing canvas init block pattern (established by inc4/iwu.3) before adding initCanvasInteractivity().
- draggable="true" on story card elements. dragstart / dragover / drop event handlers scoped to within-column reorder only. Use dataTransfer to pass the dragged card's epicId; reject drop if target cell's epicId differs.
- session.canvasCards structure: map of cardId → {storyId, origin: 'model'|'operator'}. pendingReorder schema: [{cardId, epicId, phaseId, newIndex}].
- Model-emitted stories: data-origin="model", class="story-card card--inherited", model tag in header.
- Operator-added stories (will be added by dic.3): data-origin="operator", class="story-card card--new", new tag in header.
- Epic rename guard: no contenteditable, no input on epic header. Click shows tooltip with exact text "Epic names are set by the Definition skill — return to the chat to rename." role="alert" on tooltip. Auto-dismiss after 3 seconds (use setTimeout; fake-timer-testable).
- Keyboard reorder: ArrowUp / ArrowDown keydown on focused card moves card one position within its column; records pendingReorder entry.
- HTML-escape any operator-entered content before DOM injection (relevant for dic.3 but establish the escHtml pattern now).
- Write governance tests at tests/check-dic1-story-cards.js. Add to package.json test chain.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- dic.1 is foundational — dic.2 through dic.5 extend it. Do not implement dic.2+ scope.
- Open a draft PR when all tests pass. Do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-28
