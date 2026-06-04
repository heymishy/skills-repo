# Definition of Ready: Stream assumption cards from SSE marker events into the #assumption-cards panel

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.3.md
**Test plan reference:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.3-test-plan.md
**Review reference:** artefacts/2026-05-21-ideate-web-ux/review/iwu.3-review-1.md
**NFR profile:** artefacts/2026-05-21-ideate-web-ux/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want each assumption ... to appear as a card in #assumption-cards as it is emitted / So that I can see and act on assumptions at the moment they are relevant" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC6: covered by unit/integration tests. NFR-A11Y: manual gap documented (DOM-behaviour). Total: 14 tests + 1 manual. All gaps acknowledged. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of Scope lists 5 items: confirm/flag interaction (iwu.4), server-side endpoint (iwu.4), nudge bar (iwu.5), #context-manifest (iwu.1), assumptionCardsEnabled default (iwu.6) |
| H5 | Benefit linkage field references a named metric | ✅ | M1 — Assumption card render reliability. M2 — Rework rate reduction. Mechanisms described. |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 0 MEDIUM, 1 LOW |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 6 ACs covered by automated tests. NFR-A11Y manual gap: DOM-behaviour — real AT announcement cannot be automated in Node.js. Gap type and risk documented. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints present: handlePostTurnStreamHtml SSE extension, ADR-018 marker protocol, cardId derivation (sha256), session state (ADR-019), feature flag, XSS guard, accessibility non-colour discriminator. No Category E HIGH findings. |
| H-E2E | If any AC is typed CSS-layout-dependent AND no E2E tooling configured AND no RISK-ACCEPT recorded — block sign-off | ✅ | No CSS-layout-dependent ACs. H-E2E not triggered. |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs declared: Security (XSS escaping), Performance (500ms card latency), Accessibility (WCAG 2.1 AA). Profile exists. |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses. Public data classification. |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile: Public — no PII, no sensitive data. |
| H-NFR-profile | If story declares NFRs, artefacts/[feature]/nfr-profile.md must exist | ✅ | Profile exists at artefacts/2026-05-21-ideate-web-ux/nfr-profile.md. |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Hamish King — Platform operator / tech lead — 2026-06-04. M1 signal recorded. |
| H-ADAPTER | No injectable adapter introduced without stub-throws + AC + wiring task | ✅ | No injectable adapters introduced in this story. |

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | Not triggered |
| W2 | Scope stability is declared | ✅ | — | Not triggered |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | — | 0 MEDIUM findings. Not triggered. |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss edge cases | Hamish King — 2026-06-04 — acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ⚠️ | NFR-A11Y real AT announcement is manual only | Hamish King — 2026-06-04 — acknowledged; manual scenario in verification script |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Stream assumption cards from SSE marker events into the #assumption-cards panel — artefacts/2026-05-21-ideate-web-ux/stories/iwu.3.md
Test plan: artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.3-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js). No TypeScript. No new npm dependencies without approval.
- Extend handlePostTurnStreamHtml in src/web-ui/routes/skills.js to strip ---ASSUMPTION-JSON: {...}--- markers from model output and emit assumptionCard SSE events. Read the function in full before modifying.
- cardId derivation: sha256(sessionId + emittedText)[0:8] — hex, 8 characters.
- Feature flag: when session.assumptionCardsEnabled is false, strip markers silently and do NOT emit assumptionCard events.
- HTML-escape card text before DOM injection — use escHtml from src/web-ui/utils/html-shell.js. No innerHTML with raw model output.
- Card must carry data-card-id attribute. Type tag and risk must have text labels (not colour alone).
- 500ms latency target for AC2: measured in test via performance.now() or equivalent timing assertion.
- Write governance test at tests/check-iwu3-assumption-cards.js. Add to package.json test chain.
- Dependencies: iwu.2 must be merged for the real #assumption-cards DOM section to exist. For unit tests, mock the DOM or test the server-side strip/emit logic in isolation. Document any E2E test dependency on iwu.2 in a PR comment if iwu.2 is not yet merged.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-04
