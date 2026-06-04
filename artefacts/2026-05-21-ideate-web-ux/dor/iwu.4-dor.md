# Definition of Ready: Confirm and flag assumption cards via interactive panel buttons

**Story reference:** artefacts/2026-05-21-ideate-web-ux/stories/iwu.4.md
**Test plan reference:** artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.4-test-plan.md
**Review reference:** artefacts/2026-05-21-ideate-web-ux/review/iwu.4-review-1.md
**NFR profile:** artefacts/2026-05-21-ideate-web-ux/nfr-profile.md
**Assessed by:** Copilot (GitHub Copilot — Claude Sonnet 4.6)
**Date:** 2026-06-04

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story is in As / Want / So format with a named persona | ✅ | "As a platform operator (primary) / I want to confirm or flag each assumption card using inline buttons / So that I can distinguish assumptions I agree with from ones I want to examine further" — named persona present |
| H2 | At least 3 ACs in Given / When / Then format | ✅ | 7 ACs all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | ✅ | AC1–AC7: covered by unit/integration tests. NFR-A11Y: axe-core + manual. Total: 13 tests + 1 manual. All gaps documented. |
| H4 | Out-of-scope section is populated — not blank or N/A | ✅ | Out of Scope lists 5 items: nudge bar (iwu.5), lensComplete trigger (iwu.5/iwu.6), SKILL.md (iwu.6), bulk confirm, server-side persistence beyond in-memory session |
| H5 | Benefit linkage field references a named metric | ✅ | M2 — Rework rate reduction. Mechanism described. |
| H6 | Complexity is rated | ✅ | Complexity 2, Scope stability: Stable |
| H7 | No unresolved HIGH findings from the review report | ✅ | Review: 0 HIGH, 1 MEDIUM. MEDIUM finding: "AC2 and Out of Scope inconsistent on whether confirmed is terminal state" — RESOLVED by story update (commit 49a5557). Story now clearly states confirmed state is non-terminal (operator can re-click flag). No unresolved HIGH findings. |
| H8 | Test plan has no uncovered ACs (or gaps explicitly acknowledged in /decisions) | ✅ | All 7 ACs covered. NFR-A11Y AT announcement depth manual only. Path traversal test (AC6) — dedicated test required and specified. All gaps acknowledged. |
| H9 | Architecture Constraints field populated; no Category E HIGH findings | ✅ | Architecture constraints present: POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm endpoint, session TTL (ADR-019 — 30 min, HTTP 404 on expiry), cardId path traversal guard (path.resolve + boundary assert + HTTP 400), session state not in error bodies. No Category E HIGH findings. |
| H-E2E | If any AC is typed CSS-layout-dependent AND no E2E tooling configured AND no RISK-ACCEPT recorded — block sign-off | ✅ | No CSS-layout-dependent ACs. H-E2E not triggered. |
| H-NFR | NFR section populated; NFR profile exists | ✅ | NFRs declared: Security (path traversal guard, HTML escaping, no session state in 400 body), Accessibility (WCAG 2.1 AA). Profile exists. |
| H-NFR2 | No regulatory compliance clause with missing sign-off | ✅ | No regulatory clauses. Public data classification. |
| H-NFR3 | Data classification declared in NFR profile | ✅ | NFR profile: Public — no PII, no sensitive data. |
| H-NFR-profile | If story declares NFRs, artefacts/[feature]/nfr-profile.md must exist | ✅ | Profile exists at artefacts/2026-05-21-ideate-web-ux/nfr-profile.md. |
| H-GOV | Discovery Approved By has ≥1 non-blank named entry | ✅ PASS | Hamish King — Platform operator / tech lead — 2026-06-04. M1 signal recorded. |
| H-ADAPTER | No injectable adapter introduced without stub-throws + AC + wiring task | ✅ | No injectable adapters introduced in this story. Session store accesses existing _sessionStore pattern. |

**Overall: ALL HARD BLOCKS PASS. Proceed: Yes.**

---

## Warnings

| # | Check | Status | Risk if proceeding | Acknowledged by |
|---|-------|--------|--------------------|-----------------|
| W1 | NFRs are identified (or explicitly "None — confirmed") | ✅ | — | Not triggered |
| W2 | Scope stability is declared | ✅ | — | Not triggered |
| W3 | MEDIUM review findings acknowledged in /decisions | ⚠️ | MEDIUM finding (AC2 terminal state inconsistency) was resolved by story update (commit 49a5557) rather than recorded in decisions.md. No decisions.md exists for this feature. | Hamish King — 2026-06-04 — acknowledged; fix is in story artefact and will not recur in implementation |
| W4 | Verification script reviewed by a domain expert | ⚠️ | Script may miss edge cases | Hamish King — 2026-06-04 — acknowledged |
| W5 | No UNCERTAIN items in test plan gap table left unaddressed | ⚠️ | NFR-A11Y AT announcement depth manual only | Hamish King — 2026-06-04 — acknowledged |

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Confirm and flag assumption cards via interactive panel buttons — artefacts/2026-05-21-ideate-web-ux/stories/iwu.4.md
Test plan: artefacts/2026-05-21-ideate-web-ux/test-plans/iwu.4-test-plan.md

Goal:
Make every test in the test plan pass. Do not add scope, behaviour, or
structure beyond what the tests and ACs specify.

Constraints:
- Language: JavaScript (Node.js). No TypeScript. No new npm dependencies without approval.
- New route: POST /api/skills/:name/sessions/:id/assumption/:cardId/confirm — register in src/web-ui/server.js, implement handler in src/web-ui/routes/skills.js.
- cardId path traversal guard (MANDATORY — OWASP requirement): use path.resolve(cardId) and assert the resolved value matches /^[0-9a-f]{8}$/ — return HTTP 400 if not. Do not log the raw cardId value in error responses.
- Session TTL: _sessionStore uses ADR-019 30-minute TTL. Return HTTP 404 when session not found. Return HTTP 404 when cardId not found in session.assumptionCards[]. Do not include session state in error response bodies.
- Body field: { action: "confirm" | "flag" } — validated with a JSON body parser. Return HTTP 400 on missing/invalid action.
- State update: mutate session.assumptionCards[] entry — set status to "confirmed" or "flagged". Non-terminal: operator can re-confirm or re-flag.
- Client-side: the POST button in the card DOM (added by iwu.3) must call this endpoint on click. Update card visual state (CSS class and aria-label) on success. On non-2xx: show a transient error message inside the card (do not use alert()).
- Write governance test at tests/check-iwu4-confirm-flag.js. Add to package.json test chain.
- SECURITY: Path traversal test is mandatory in the governance test file. Assert HTTP 400 response AND that no file was written to disk (N/A for this endpoint — but assert response only).
- Architecture standards: read .github/architecture-guardrails.md before implementing.
- Open a draft PR when tests pass — do not mark ready for review.

Oversight level: Medium
```

---

## Sign-off

**Oversight level:** Medium
**Sign-off required:** Engineering lead awareness required
**Signed off by:** Hamish King — Platform operator / tech lead — 2026-06-04
