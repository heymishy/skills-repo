# Definition of Ready: Journey-aware chat page "Save and continue" button (ougl.4)

**Story reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-4-journey-aware-chat-button.md
**Test plan reference:** artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-4-test-plan.md
**Verification script:** artefacts/2026-05-06-web-ui-guided-outer-loop/verification-scripts/ougl-4-verification.md
**Review report:** artefacts/2026-05-06-web-ui-guided-outer-loop/review/ougl-4-review-1.md
**Epic:** artefacts/2026-05-06-web-ui-guided-outer-loop/epics/ougl-epic-2-guided-journey-stages.md
**Assessed by:** GitHub Copilot (/definition-of-ready)
**Date:** 2026-05-14

---

## Contract Proposal

**What will be built:**
Modify `handleGetChatHtml` (and/or its internal render path `_renderChatPage`) in `src/web-ui/routes/skills.js` to inject a gate-confirm form when both conditions are true: `session.journeyId` is non-null AND `session.done === true`. The injected form consists of `<form action="/api/journey/[journeyId]/gate-confirm" method="POST"><button type="submit">Save and continue</button></form>`. The `journeyId` and `skillName` values interpolated into the form must be escaped with `escHtml`. When either condition is false, the form is not injected and the chat HTML is returned unchanged.

**What will NOT be built:**
- Layout/styling of the button
- Back button or progress bar
- Tracking `done: false` state
- Gate-confirm request handler (ougl.5)

**AC verification table:**

| AC | Test | Verification approach |
|----|------|-----------------------|
| AC1 | T4.1 | `done: true`, `journeyId: non-null` → HTML contains `<form action="/api/journey/...` and `<button type="submit">` |
| AC2 | T4.2 | `done: false` → no gate-confirm form in HTML |
| AC3 | T4.3 | `done: true`, `journeyId: null` → no gate-confirm form |
| AC4 | T4.4 | Form action contains correct journey ID |
| AC5 | T4.5 | `journeyId` is `escHtml`-escaped before interpolation into form action |
| AC6 | T4.6 | `skillName` in any text within form is `escHtml`-escaped |
| AC7 | T4.7 | Button element is `<button type="submit">` (not `<a>`) |

**Assumptions:**
- `session.done` is already tracked by existing skills.js logic (set to true when skill signals completion)
- `escHtml` is already defined in skills.js or imported from html-shell.js

---

## Contract Review

✅ **Contract review passed** — conditional HTML injection is purely additive to the render path. AC5/AC6 XSS guards are tested. Form action is server-constructed (no user-supplied state in URL construction beyond the escHtml-escaped session journeyId).

---

## Hard Blocks

| # | Check | Status | Notes |
|---|-------|--------|-------|
| H1 | User story in As/Want/So format | ✅ PASS | "As a **non-engineer operator**" |
| H2 | ≥3 ACs in GWT format | ✅ PASS | 7 ACs, all GWT |
| H3 | Every AC has ≥1 test | ✅ PASS | T4.1–T4.7 |
| H4 | Out-of-scope populated | ✅ PASS | Layout, back button, progress, done:false excluded |
| H5 | Benefit linkage — named metric | ✅ PASS | MM2 (journey completion steps named) |
| H6 | Complexity rated | ✅ PASS | Epic 2: Complexity 2, Stable |
| H7 | No unresolved HIGH findings | ✅ PASS | 0 HIGH, 0 MEDIUM |
| H8 | No uncovered ACs | ✅ PASS | All 7 ACs covered |
| H8-ext | Cross-story schema dep | ✅ PASS | Upstream: ougl.2 (code dep). `schemaDepends: []` |
| H9 | Architecture constraints | ✅ PASS | `escHtml` on journeyId/skillName. Button is `<button type="submit">` (keyboard nav). Gate-confirm form action server-constructed. ADR-019 compliant. |
| H-E2E | CSS-layout ACs | ✅ PASS | AC7 (`<button type="submit">`) is an HTML structure constraint, not a CSS-layout visual test. T4.7 inspects the DOM string. |
| H-NFR | NFR profile | ✅ PASS | NFR-sec-eschtml, NFR-access-button in nfr-profile.md |
| H-NFR2 | Compliance NFRs | ✅ PASS | None |
| H-NFR3 | Data classification | ✅ PASS | Internal tooling, no PII |
| H-NFR-profile | NFR profile exists | ✅ PASS | nfr-profile.md created |
| H-GOV | Approved By | ✅ PASS | Hamis — 2026-05-06 |
| H-ADAPTER | Injectable adapters | ✅ PASS (N/A) | No new injectable adapters. Reads `session.journeyId` directly. |

**Hard block result: 17/17 PASS — no blocks.**

---

## Warnings

| # | Check | Status | Risk | Acknowledged by |
|---|-------|--------|------|-----------------|
| W1 | NFRs identified | ✅ | In nfr-profile.md | — |
| W2 | Scope stability | ✅ | Stable | — |
| W3 | MEDIUM findings | ✅ (N/A) | 0 MEDIUM | — |
| W4 | Verification script reviewed | ✅ | Reviewed by operator (Hamis) | — |
| W5 | UNCERTAIN gaps | ✅ | None | — |

---

## Oversight Level

**Oversight:** Medium (Epic 2 setting)
**Rationale:** Modifies the core chat page render path — regression risk for all existing HTML sessions. 4 of 7 tests already pass at baseline (button injection is the new surface).

⚠️ **Medium oversight** — solo repo: operator self-confirms before dispatch.

---

## Coding Agent Instructions

```
## Coding Agent Instructions

Proceed: Yes
Story: Journey-aware chat page "Save and continue" button — artefacts/2026-05-06-web-ui-guided-outer-loop/stories/ougl-4-journey-aware-chat-button.md
Test plan: artefacts/2026-05-06-web-ui-guided-outer-loop/test-plans/ougl-4-test-plan.md

Goal:
Make every test in tests/check-ougl4-journey-aware-chat-button.js pass.
Current baseline: T4.1, T4.2, T4.3, T4.7 pass; T4.4, T4.5, T4.6 fail.
Do not add scope, behaviour, or structure beyond what the tests and ACs specify.

Constraints:
- Language: Node.js CommonJS. Zero new npm dependencies.
- Only modify src/web-ui/routes/skills.js — specifically the handleGetChatHtml / _renderChatPage render path.
- Inject gate-confirm form ONLY when: session.journeyId is non-null AND session.done === true.
- Form HTML: <form action="/api/journey/[journeyId]/gate-confirm" method="POST">
               <button type="submit">Save and continue</button>
             </form>
  Use escHtml on journeyId. If skillName appears in any text within the form, also escape it.
- Do NOT change behaviour for sessions where journeyId is null or done is false.
- Do NOT import or use journey-store.js in skills.js — the journeyId is already on the session object.
- Read .github/architecture-guardrails.md before implementing.
- Run: node tests/check-ougl4-journey-aware-chat-button.js after each change.
- Run: npm test for full suite regression check.
- Open a draft PR when all tests pass.

Files in scope:
- src/web-ui/routes/skills.js — handleGetChatHtml / _renderChatPage render path only

Files out of scope:
- src/web-ui/routes/journey.js
- src/web-ui/server.js
- Any CSS or HTML template files
- Any test files
- Any artefact files

Oversight level: Medium
```

---

## Sign-off

**Signed off by:** Hamis — 2026-05-14
