# Definition of Ready: Restructure right panel into two named sections for assumption cards and artefact draft coexistence

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.2.md
**Test plan reference:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.2-test-plan.md
**Review reference:** artefacts/2026-05-21-ideate-web-ux/review/iwu.2-review-1.md
**NFR profile:** artefacts/2026-05-21-ideate-web-ux/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want the right panel to be pre-structured as two named sections / So that subsequent stories can inject cards and draft content into the correct sections" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC3: unit/integration. AC4: Playwright E2E (CSS-layout-dependent; E2E tooling configured). AC5: manual gap (DOM-behaviour; AT announcement cannot be automated in Node.js). All gaps documented. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of Scope lists 4 items: populating #assumption-cards, populating #draft-content, #context-manifest (iwu.1), lens track topbar indicator (deferred) |
| H5 | Benefit linkage field references a named metric | ✅ | M3 — Session completion rate. Mechanism described: prevents context-switch cost from layout collision, enables M3 measurement |
| H6 | Complexity is rated | ✅ | Complexity 1, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 0 MEDIUM, 1 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | AC4 CSS-layout-dependent gap handled by Playwright E2E at tests/e2e/iwu2-right-panel-layout.spec.js. AC5 manual gap documented with DOM-behaviour classification. All gaps acknowledged and risk rated. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints present: no new routes, flex layout spec (#assumption-cards 42% max-height, #draft-content flex:1), both sections DOM-present on initial render, existing stylesheet only. No Category E HIGH findings. |
| H-E2E | If any AC is typed CSS-layout-dependent AND no E2E tooling configured AND no RISK-ACCEPT recorded — block sign-off | ✅ | AC4 IS CSS-layout-dependent (#assumption-cards max-height 42% + scroll; #draft-content flex:1). E2E TOOLING IS CONFIGURED: Playwright established via wuce stories (8 specs at tests/e2e/wuce18–wuce25; playwright.config.js present; withAuth fixture available). E2E spec: tests/e2e/iwu2-right-panel-layout.spec.js (to be written during implementation). H-E2E: PASSES — tooling configured. |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs declared: Accessibility (WCAG 2.1 AA), Performance (static HTML/CSS — no runtime cost). Profile exists at artefacts/2026-05-21-ideate-web-ux/nfr-profile.md. |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses. Data classification: Public. No named sign-off required. |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile declares: Public — no PII, no sensitive data. |
| H-NFR-profile | If story declares NFRs, artefacts/[feature]/nfr-profile.md must exist | ✅ | Profile exists at artefacts/2026-05-21-ideate-web-ux/nfr-profile.md. |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Approved By: Hamish King — Platform operator / tech lead — 2026-06-04. M1 signal recorded (role is tech lead — engineering role). |
| H-ADAPTER | No injectable adapter introduced without stub-throws + AC + wiring task | ✅ | No injectable adapters introduced in this story. |

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | Not triggered |
| W2 | Scope stability is declared | ✅ | — | Not triggered |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | 0 MEDIUM findings in review. Not triggered. |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script may miss edge cases | Hamish King — 2026-06-04 — acknowledged; solo repo pattern |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ⚠️ | AC5 AT section boundary announcement: manual only; AC4 E2E depends on Playwright run succeeding | Hamish King — 2026-06-04 — acknowledged; AC4 E2E spec path confirmed in DoR contract; AC5 manual scenario documented |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Restructure right panel into two named sections for assumption cards and artefact draft coexistence — artefacts/2026-05-21-ideate-web-ux/stories/iwu.2.md
Test plan: artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.2-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js) for server; Playwright (@playwright/test) for E2E.
- Modify the right panel HTML in handleGetChatHtml / renderChat to add two named sections: #assumption-cards (flex: 0 0 auto; max-height: 42%; overflow-y: auto) and #draft-content (flex: 1 1 auto; overflow-y: auto). Right panel container: display: flex; flex-direction: column.
- Both sections MUST be present in the initial DOM render even when empty — each shows a placeholder message.
- Implement layout styles against the existing src/web-ui stylesheet pattern (inline <style> block). Do not add a new CSS file.
- Write the governance test at tests/check-iwu2-right-panel-layout.js. Write the Playwright E2E test at tests/e2e/iwu2-right-panel-layout.spec.js following the existing wuce spec pattern (use withAuth() fixture; see tests/e2e/fixtures/auth.js and any existing wuce spec for pattern).
- Add tests/check-iwu2-right-panel-layout.js to the npm test chain in package.json (Playwright E2E is run separately via npx playwright test — do not add it to the npm test chain unless it is already established there).
- Read src/web-ui/routes/skills.js and src/web-ui/views/chat-view.js before implementing.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-04
