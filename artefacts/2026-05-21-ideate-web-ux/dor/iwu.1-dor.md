# Definition of Ready: Render context manifest panel with chip layout in the /ideate session shell

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.1.md
**Test plan reference:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.1-test-plan.md
**Review reference:** artefacts/2026-05-21-ideate-web-ux/review/iwu.1-review-1.md
**NFR profile:** artefacts/2026-05-21-ideate-web-ux/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want to see ... chips in a #context-manifest panel / So that I can identify missing context before the first lens runs" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 5 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC4: unit/integration covered. AC5: manual gap explicitly documented in verification script — gap type DOM-behaviour (real AT announcement cannot be automated in Node.js). Gap acknowledged and risk rated 🟡. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of Scope lists 5 items: assumption cards, right panel layout, draft content, real-time manifest updates, filtering/sorting |
| H5 | Benefit linkage field references a named metric | ✅ | M2 — Rework rate from invisible assumptions. Mechanism described: context gaps visible at session open before any lens runs |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 0 MEDIUM, 0 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | AC5 manual gap documented; gap type DOM-behaviour; verified by manual scenario in verification script. All other ACs have automated coverage. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints present: #context-manifest pattern, chip layout, XSS guardrail, accessibility guardrail (non-colour discriminator), ADR-011 artefact-first rule. No Category E HIGH findings. |
| H-E2E | If any AC is typed CSS-layout-dependent AND no E2E tooling configured AND no RISK-ACCEPT recorded — block sign-off | ✅ | No CSS-layout-dependent ACs in this story's test plan. H-E2E: not triggered. |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs declared: Security (XSS escaping), Accessibility (WCAG 2.1 AA). artefacts/2026-05-21-ideate-web-ux/nfr-profile.md exists. |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses. Data classification: Public. No named sign-off required. |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile declares: Public — no PII, no sensitive data. In-memory session only, no disk persistence. |
| H-NFR-profile | If story declares NFRs, artefacts/[feature]/nfr-profile.md must exist | ✅ | Story declares NFRs (Security, Accessibility). Profile exists at artefacts/2026-05-21-ideate-web-ux/nfr-profile.md. |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Approved By: Hamish King — Platform operator / tech lead — 2026-06-04. Role is tech lead (engineering). M1 signal recorded: approver role not confirmed as non-engineering. Delivery proceeds. |
| H-ADAPTER | No injectable adapter introduced without stub-throws + AC + wiring task | ✅ | No injectable adapters introduced in this story. |

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | Not triggered |
| W2 | Scope stability is declared | ✅ | — | Not triggered |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | Review: 0 MEDIUM findings. Not triggered. |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Verification script may miss edge cases; agent may verify against wrong criteria | Hamish King — 2026-06-04 — acknowledged; solo repo pattern |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ⚠️ | AC5 AT announcement gap cannot be automated; manual scenario mitigates risk | Hamish King — 2026-06-04 — acknowledged; manual verification scenario documents expected behaviour |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Render context manifest panel with chip layout in the /ideate session shell — artefacts/2026-05-21-ideate-web-ux/stories/iwu.1.md
Test plan: artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.1-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js). No TypeScript. No new npm dependencies without approval.
- Implement #context-manifest as a named panel section within the existing handleGetChatHtml / renderChat session shell. Read src/web-ui/routes/skills.js and src/web-ui/views/chat-view.js before implementing. No new server routes.
- Sanitise all artefact path display values before DOM injection — use escHtml from src/web-ui/utils/html-shell.js. No innerHTML with unsanitised content.
- chip-ok and chip-warn must each carry a non-colour discriminator (label, icon, or aria-label) in addition to colour.
- Implement chip styles against the existing src/web-ui stylesheet pattern (inline <style> in chat-view.js or the existing CSS block). Do not replicate mockup CSS. Do not add a new CSS file.
- Write the governance test at tests/check-iwu1-context-manifest.js and add it to the npm test chain in package.json.
- Architecture standards: read .github/architecture-guardrails.md before implementing. Do not introduce patterns listed as anti-patterns or violate named mandatory constraints or Active ADRs.
- Open a draft PR when tests pass — do not mark ready for review.
- If you encounter an ambiguity not covered by the ACs or tests: add a PR comment describing the ambiguity and do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required (not a blocking gate — proceed after noting)
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-04
