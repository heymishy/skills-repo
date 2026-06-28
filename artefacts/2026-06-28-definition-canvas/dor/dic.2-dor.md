# Definition of Ready: Phase row model with locked future-phase rows

**Story reference:** artefacts/2026-06-28-definition-canvas/stories/dic.2.md
**Test plan reference:** artefacts/2026-06-28-definition-canvas/test-plans/dic.2-test-plan.md
**Review reference:** artefacts/2026-06-28-definition-canvas/review/dic.2-review-1.md
**NFR profile:** artefacts/2026-06-28-definition-canvas/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-28

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want the story map to display one row per discovery phase, with future-phase rows visually locked and refusing drops / So that I can see the planned phase structure at a glance and cannot accidentally place a current-phase story into a future-phase row" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC7: 15 unit tests. NFR-A11Y: 1 unit test (axe-core) + 1 manual scenario. NFR-PERF: 1 unit test (parse-count assertion). All gaps acknowledged |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of scope: chain forking, cross-column drag, phase editing/renaming on canvas, inter-phase story movement |
| H5 | Benefit linkage field references a named metric | ✅ | M2 (future-phase placement guard holds across all code paths) — dic.2 is the single authoritative point of enforcement |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 0 MEDIUM, 2 LOW (malformed phases section test note; pending-state-cleared-on-refresh note — both addressed in test plan) |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 7 ACs covered. Gaps: hatched CSS visual (CSS rendering — manual visual check), real AT announcement (AT behaviour — axe validates, real announcement manual), keyboard focus not reaching locked row (JSDOM focus model — manual). All acknowledged with mitigation |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints: parsePhaseModel injectable adapter (D37), phase model in DOM data- attribute, no new JS file, no new SSE event, renderDefinitionMap extension. No Category E HIGH findings |
| H-E2E | CSS-layout-dependent ACs: locked row hatching / greying is visual | ✅ | RISK-ACCEPT: CSS rendering of `phase-row--locked` class not automatable in JSDOM. Classified as RISK-ACCEPT + manual visual check in browser on fixture. CSS class presence is automated; actual rendering is manual. No E2E tooling configured. See decisions.md |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs: Accessibility (lock overlay screen reader, keyboard focus), Performance (parse-once, cache), Regression. NFR profile exists |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile: Public |
| H-NFR-profile | If story declares NFRs, nfr-profile.md must exist | ✅ | Profile exists |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Hamish King — Platform operator / tech lead — 2026-06-28 |
| H-ADAPTER | Injectable adapter introduced without stub-throws + AC + wiring task | ✅ | `parsePhaseModel` injectable adapter introduced. AC7 covers stub-throw default and production wiring. D37 rule satisfied: stub throws; DoR includes wiring task in coding agent instructions |

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs identified | ✅ | — | Not triggered |
| W2 | Scope stability declared | ✅ | — | Not triggered |
| W3 | MEDIUM findings acknowledged in /decisions | ✅ | — | 0 MEDIUM findings |
| W4 | Verification script reviewed by domain expert | ⚠️ | Script may miss malformed discovery.md edge cases | Hamish King — 2026-06-28 — acknowledged; malformed-section test case included in test plan |
| W5 | No UNCERTAIN items in test plan gap table | ⚠️ | Hatched CSS visual and keyboard focus are manual-only | Hamish King — 2026-06-28 — acknowledged; manual checks documented |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Phase row model with locked future-phase rows — artefacts/2026-06-28-definition-canvas/stories/dic.2.md
Test plan: artefacts/2026-06-28-definition-canvas/test-plans/dic.2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js). No new JS files. No new npm dependencies without approval.
- parsePhaseModel(discoveryContent) injectable adapter (D37 rule):
    let _parsePhaseModel = () => { throw new Error('Adapter not wired: parsePhaseModel. Call setParsePhaseModel() with a real implementation before use.'); };
    function setParsePhaseModel(fn) { _parsePhaseModel = fn; }
  Wire the real implementation at route initialisation time. Write the production wiring in the same module.
- parsePhaseModel parses the discovery.md content string passed to it. Looks for a `## Phases` section; extracts list items. First item = isCurrent: true; others = isCurrent: false. Falls back to [{name: 'Phase 1 (current)', isCurrent: true}] if section absent or empty — no exception.
- Phase model is serialised into a data- attribute on the story map root element. Cache result in session state; do not re-parse on every drag event.
- renderDefinitionMap extended to accept phaseModel: [{name, isCurrent}]. Renders one <tr class="phase-row"> per phase. Current: data-phase-current="true". Locked: data-phase-current="false" class="phase-row phase-row--locked".
- Lock overlay: <div class="phase-lock-label" role="note">Not yet defined — awaits Phase N's Definition pass</div> where N is the 1-based phase index.
- Drop guard extension to dic.1 drag handler: in dragover, additionally check event.currentTarget.closest('[data-phase-current]')?.dataset.phaseCurrent === 'true'. If not, do NOT call event.preventDefault().
- Map re-init clears session.canvasCards.pendingReorder and pendingAdds; resets pending-changes count to 0.
- Write governance tests at tests/check-dic2-phase-row-model.js. Include: M2 phase guard test (server-side guard is in dic.5; client-side guard is here). Add to package.json test chain.
- Dependency: dic.1 must be merged before implementing dic.2. Read dic.1 implementation in full before extending the drag handler.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when all tests pass. Do not mark ready for review.

Wiring task (separate from handler task):
Wire setParsePhaseModel(defaultParsePhaseModel) in the route initialisation block of src/web-ui/routes/skills.js. Verify wiring with the AC7 production-wiring test.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-28
