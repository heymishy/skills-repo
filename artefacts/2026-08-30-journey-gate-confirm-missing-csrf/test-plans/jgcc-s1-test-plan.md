## Test Plan: Add the missing CSRF field to the in-chat gate-confirm button

**Story reference:** artefacts/2026-08-30-journey-gate-confirm-missing-csrf/stories/jgcc-s1-add-missing-csrf-field-to-chat-gate-confirm-button.md
**Test plan author:** Claude (agent)
**Date:** 2026-08-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Gate-confirm form includes a `_csrf` field matching the session's token | 1 test | — | — | — | — | 🟢 |
| AC2 | A submission with that field passes `csrfGuard` | 1 test | — | — | — | — | 🟢 |
| AC3 | `definition-of-ready`'s plain link is unaffected | 1 test | — | — | — | — | 🟢 |
| AC4 | 5 existing chat-page-adjacent test files unaffected | — | 1 run (×5 files) | — | — | — | 🟢 |

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic (reuses the established `journeyStore.createJourney(...)` + `routes._setHtmlSession(...)` fixture pattern from `check-res-s4-operator-acts-on-materiality-suggestion.js`)
**PCI/sensitivity in scope:** No
**Availability:** Available now
**Owner:** Self-contained

### Gaps

None.

---

## Unit Tests

### gateConfirmFormIncludesMatchingCsrfField

- **Verifies:** AC1
- **Precondition:** A journey-linked, `done: true` session for a non-`definition-of-ready` skill (e.g. `discovery`).
- **Action:** Render the chat page via `handleGetChatHtml`.
- **Expected result:** The rendered HTML's gate-confirm `<form>` (matching `action="/api/journey/.../gate-confirm"`) contains a hidden `input[name="_csrf"]` whose value equals `req.session.csrfToken`.
- **Edge case:** No.

### gateConfirmSubmissionPassesCsrfGuard

- **Verifies:** AC2
- **Precondition:** The rendered form's `_csrf` value from the test above.
- **Action:** Call `handlePostGateConfirm` (or `csrfGuard` directly) with a request body containing that exact `_csrf` value and the same `req.session`.
- **Expected result:** `csrfGuard` returns `true` (or the equivalent "request may proceed" signal) — no 403.
- **Edge case:** No.

### definitionOfReadyLinkUnaffected

- **Verifies:** AC3
- **Precondition:** A journey-linked, `done: true` session for skill `definition-of-ready`.
- **Action:** Render the chat page via `handleGetChatHtml`.
- **Expected result:** The rendered HTML contains the plain `<a href="/journey/.../complete">` link, unchanged, with no `_csrf` field added to it (it's not a form at all).
- **Edge case:** Yes — the one branch that must NOT change.

---

## Integration Tests

### existingChatPageAdjacentTestsUnaffected

- **Verifies:** AC4
- **Precondition:** None.
- **Action:** Run `check-dic1-story-cards.js`, `check-mfc2-chat-ux-improvements.js`, `check-icv-s1-ideate-canvas-turn2-render-fix.js`, `check-icrh-s1-ideate-canvas-resume-hydration.js`, and `check-res-s4-operator-acts-on-materiality-suggestion.js`.
- **Expected result:** All pass unchanged — none of them call `_renderChatPage` directly with a signature affected by this fix (`_renderChatPage_forTest`, destructured in `check-dic1-story-cards.js`, is confirmed dead/unused — not actually exported by `skills.js`, never invoked).
- **Edge case:** No.

---

## NFR Tests

None beyond the AC-mapped tests above — this is a single missing form field, no new performance/security/accessibility/audit surface beyond what AC1/AC2 already cover (closing an existing, unused CSRF-protection gap).

---

## Out of Scope for This Test Plan

- A broader audit of every other form in this codebase for the same missing-CSRF-field pattern — declared out of scope by the story itself; worth a `/capture` entry, not this test plan.
- Live re-reproduction on staging — already done manually during root-cause investigation; the post-merge smoke test (verification script Scenario 4) covers the live confirmation.

---

## Test Gaps and Risks

None — all 4 ACs have full automated coverage.
