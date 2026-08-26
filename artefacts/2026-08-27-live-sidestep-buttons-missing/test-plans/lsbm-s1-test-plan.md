## Test Plan: Show the /clarify and /estimate sub-step buttons live, not only after a page reload

**Story reference:** artefacts/2026-08-27-live-sidestep-buttons-missing/stories/lsbm-s1-live-substep-affordance-injection.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-08-27

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Clarify/estimate buttons appear live on discovery's last turn | 1 test (static source) | — | — | 1 scenario | 🟡 (see note) | 🔴 |
| AC2 | Live clarify button triggers correct side-trip behaviour | 1 test (static source) | — | — | 1 scenario | 🟡 | 🟢 |
| AC3 | Live estimate form triggers correct logging behaviour | 1 test (static source) | — | — | 1 scenario | 🟡 | 🟢 |
| AC4 | Definition's estimate-only button appears live | 1 test (static source) | — | — | — | 🟡 | 🟢 |
| AC5 | Full-render (resume) path output is byte-identical to before | 1 test | — | — | — | — | 🔴 |
| AC6 | No spurious injection for skills with no sub-step affordance | 1 test | — | — | — | — | 🟢 |

---

## Coverage gaps

**Note on the 🟡 gap type (AC1-AC4):** Per this repo's own established precedent (`tests/check-ougl4-journey-aware-chat-button.js`'s T4.1, which explicitly documents this exact limitation for `showCommitLink()`), a plain-Node unit test that renders `handleGetChatHtml`'s output as a string cannot simulate an actual live SSE `done` event firing in a browser and observe real DOM mutation — that requires a real browser (E2E/manual). This test plan follows the same accepted approach: unit tests verify the JS *source* is correct and unconditionally present (the function definitions exist, `SUBSTEP_HTML` is computed correctly, `showCommitLink()`'s source contains the injection call) — proving the mechanism is wired correctly — while the verification script's manual scenarios cover the actual live click-through behaviour a human can observe directly. AC5/AC6 (regression guards on server-rendered, non-live output) are fully covered by ordinary string-content unit tests, no gap.

---

## Test Data Strategy

**Source:** Synthetic — minimal session fixtures, following `tests/check-ougl4-journey-aware-chat-button.js`'s exact `makeSession()`/`freshRequire()`/string-content-assertion pattern.
**PCI/sensitivity in scope:** No
**Availability:** Available now.
**Owner:** Self-contained.

---

## Unit Tests

Tests live in a new file, `tests/check-lsbm-s1-live-substep-injection.js`, reusing `tests/check-ougl4-journey-aware-chat-button.js`'s exact house style (`makeSession`, `freshRequire`, string-content assertions on `handleGetChatHtml`'s rendered body).

### AC1/AC4: `SUBSTEP_HTML` is computed unconditionally, before `session.done` is true

- **Action:** Call `handleGetChatHtml` with `makeSession({ done: false, journeyId: 'j1', skillName: 'discovery' })`. Search the rendered body for a `SUBSTEP_HTML` (or equivalent) JS variable assignment containing the `sw-clarify-btn`/`sw-estimate-btn` markup, appearing in the UNCONDITIONAL script section (i.e., present even though `session.done` is `false`). Repeat with `skillName: 'definition'`, expecting only the estimate button (no clarify) in the computed markup.
- **Expected result:** The markup is present in a `done:false` render — proving it's no longer gated behind the full-render `if (session.done...)` block. Today (pre-fix) this markup is entirely absent when `done:false`.

### AC2/AC3: click-handler functions are defined unconditionally, not nested inside the conditional block

- **Action:** Same `done:false` render. Search for `function swLaunchClarify` / `window.swToggleEstimate` / the estimate-form submit-listener wiring, confirm they appear in the body text OUTSIDE of any `if (session.done...)`-guarded script block (verify by confirming presence in a `done:false` render, matching AC1's approach).
- **Expected result:** The handler functions are present and callable regardless of `session.done`'s value at render time — proving `showCommitLink()`'s later live injection has real functions to attach to and call.

### AC2/AC3 (continued): `showCommitLink()`'s source injects `SUBSTEP_HTML`

- **Action:** Extract `showCommitLink`'s function body from the rendered script (reusing this repo's established `extractFnBody`-style helper pattern). Confirm it references the `SUBSTEP_HTML` variable and performs a DOM insertion of it (e.g., via `insertAdjacentHTML`/`prepend`/similar) before appending the plain gate-confirm form, and that it attaches the estimate form's submit listener to the freshly-inserted element.
- **Expected result:** `showCommitLink`'s source demonstrably wires up the sub-step affordance, not just the plain button. Today (pre-fix) `showCommitLink`'s source has no reference to `SUBSTEP_HTML` at all.

### AC5: full-render (resume) output is byte-identical to before the fix

- **Action:** Render `handleGetChatHtml` with `makeSession({ done: true, journeyId: 'j1', skillName: 'discovery' })` both on the pre-fix baseline (captured once, stored as a golden fixture string, or reconstructed via `git show` of the pre-fix commit during test-writing) and on the post-fix code. Compare the `journeyPanel`/sub-step markup section specifically (not necessarily the whole page, which may have unrelated dynamic timestamps).
- **Expected result:** Identical output — the extraction into a shared function is purely mechanical, same inputs produce the same output.

### AC6: no spurious injection for a skill with no sub-step affordance

- **Action:** Render `handleGetChatHtml` with `makeSession({ done: false, journeyId: 'j1', skillName: 'benefit-metric' })` (or any other skill outside discovery/definition). Confirm `SUBSTEP_HTML` is empty/absent, and `showCommitLink`'s injection logic degrades to a no-op (only the plain button renders).
- **Expected result:** No empty `<div>` or broken markup ever appears for skills with no sub-step affordance, matching today's already-correct behaviour for the plain-button-only case.

---

## Integration Tests

None beyond the existing regression suite confirmed unaffected — `tests/check-ougl4-journey-aware-chat-button.js` must still pass unchanged (it asserts on `GATE_CONFIRM_URL`/`showCommitLink`'s existing behaviour, which this story does not remove or restructure, only extends).

---

## E2E Tests

None added by this story (matches `check-ougl4`'s own precedent of treating true live-SSE-DOM-mutation verification as out of unit-test reach) — see verification-script's manual scenarios for the actual live click-through proof.

---

## NFR Tests

None named — story's own NFR section rates all four categories "None new"/"Negligible"/"No regression".

---

## Out of Scope for This Test Plan

- Disabling the chat input after done — story's own Out of Scope, not tested here.
- Any Playwright/E2E coverage of the actual live SSE-triggered DOM injection — deferred to manual verification, matching this repo's own accepted precedent for this exact code path (`check-ougl4`'s T4.1 comment).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| True live-browser proof of AC1-AC4 | Plain-Node unit tests cannot simulate a real SSE `done` event + browser DOM mutation (established precedent, `check-ougl4`) | Verification script's manual scenarios 1-3 cover the real click-through behaviour a human operator can directly observe on staging/production |
