# Definition of Ready: Display a review-nudge bar when a lens completes with unconfirmed assumption cards

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.5.md
**Test plan reference:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.5-test-plan.md
**Review reference:** artefacts/2026-05-21-ideate-web-ux/review/iwu.5-review-1.md
**NFR profile:** artefacts/2026-05-21-ideate-web-ux/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want to see a review-nudge bar when a lens completes / So that I am reminded to confirm or flag unreviewed assumption cards before the session proceeds" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 6 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC6: covered by unit/integration tests. NFR-A11Y: axe-core + manual. Total: 14 tests + 1 manual. All gaps documented. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of Scope lists 5 items: lensComplete trigger from SKILL.md (iwu.6), blocking the session when unconfirmed cards exist, bulk confirm, server-side persistence of nudge bar state, lensComplete timing optimisation |
| H5 | Benefit linkage field references a named metric | ✅ | M2 — Rework rate reduction. M3 — Session completion rate. Mechanisms described: reduces unreviewed assumption carry-over into session summary; decreases interruption risk that causes session abandonment. |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 1 MEDIUM. MEDIUM finding: "M3 and MM2 not in benefit linkage" — RESOLVED by story update (commit adc6b5c). No unresolved HIGH findings. |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 6 ACs covered. NFR-A11Y AT manual only. Focus guard (AC3 — "only if chat input not focused") tested with mock focus state. All gaps acknowledged. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints present: lensComplete is a new named SSE event type (not alias or re-use of existing type), client-only nudge bar, scroll to first unconfirmed card (focus guard), auto-dismiss when last confirmed, no server round-trip for nudge bar state. No Category E HIGH findings. |
| H-E2E | If any AC is typed CSS-layout-dependent AND no E2E tooling configured AND no RISK-ACCEPT recorded — block sign-off | ✅ | No CSS-layout-dependent ACs. H-E2E not triggered. |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs declared: Accessibility (WCAG 2.1 AA; nudge bar role=alert for announcement), Performance (client-only — no added latency). Profile exists. |
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
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | MEDIUM finding (M3/MM2 benefit linkage) resolved by story update rather than decisions.md. No decisions.md for this feature. | Hamish King — 2026-06-04 — acknowledged |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss edge cases | Hamish King — 2026-06-04 — acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ⚠️ | NFR-A11Y real AT announcement manual only; focus guard depends on test mock fidelity | Hamish King — 2026-06-04 — acknowledged |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Display a review-nudge bar when a lens completes with unconfirmed assumption cards — artefacts/2026-05-21-ideate-web-ux/stories/iwu.5.md
Test plan: artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.5-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js). No TypeScript. No new npm dependencies without approval.
- Add lensComplete SSE event type to handlePostTurnStreamHtml. This is a new named event (data: { type: 'lensComplete' }) — do not reuse or alias an existing event type.
- Client-side: listen for lensComplete SSE event. On receipt: count unconfirmed cards (session.assumptionCards[] where status !== 'confirmed'). If ≥1: show #nudge-bar (role=alert; contains "N assumption card(s) unreviewed. Review now." and a "Review now" button). If 0: do not show nudge bar.
- "Review now" button: scroll to first unconfirmed card (Element.scrollIntoView) and move focus to it — ONLY IF document.activeElement is NOT the chat text input. If chat input is focused, do not steal focus (focus guard per AC3).
- Auto-dismiss nudge bar: when the last unconfirmed card is confirmed (via iwu.4 interaction), check count and hide #nudge-bar. Observer pattern or event-based — do not poll.
- lensComplete real trigger will come from iwu.6 SKILL.md instruction emission. For unit/integration tests, dispatch a synthetic SSE event.
- Write governance test at tests/check-iwu5-lens-complete.js. Add to package.json test chain.
- Dependencies: iwu.2 (#assumption-cards section), iwu.3 (card DOM), iwu.4 (status tracking) must all be merged for full E2E. Unit tests use synthetic events and mocked DOM state.
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-04
