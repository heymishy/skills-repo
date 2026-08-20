# Definition of Done: Stop the artefact panel squeezing the diagram panel, and fix the dead "maximise canvas" button

**PR:** merge commit `450280e2` | **Merged:** 2026-08-07
**Story:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/stories/cdpl-s1-fix-canvas-panel-squeeze-and-maximise.md
**Test plan:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/test-plans/cdpl-s1-test-plan.md
**Verification script:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/verification-scripts/cdpl-s1-verification.md
**Review:** artefacts/2026-08-07-canvas-diagram-panel-layout-fix/review/cdpl-s1-review-2.md (0 HIGH findings)
**Assessed by:** Claude (agent) — retroactive DoD backlog pass, live Chrome verification, 2026-08-21
**Date:** 2026-08-21

---

## AC Coverage

| AC | Satisfied? | Evidence | Verification method | Deviation |
|----|-----------|----------|---------------------|-----------|
| AC1 — `#artefact-panel` capped at a fixed max-height, independently scrollable | ✅ | `check-cdpl-s1-canvas-panel-layout-fix.js` (15/15, re-run fresh 2026-08-21); story's own AC5 resolution note: covered by a real Playwright test extending `tests/e2e/design-definition-canvas-render.spec.js`, not deferred to manual | Automated test | None |
| AC2 — `#canvas-panel` always receives a minimum usable height | ✅ | Same automated evidence as AC1 | Automated test | None |
| AC3 — new maximise/expand control on the Diagrams section toggles fullscreen | ❌ **BROKEN IN PRODUCTION** | Live-reproduced on `wuce-staging.fly.dev`, a real resumed `/definition` historical conversation: clicking "Maximise diagrams" throws `ReferenceError: swToggleCanvasFs is not defined` in the browser console (confirmed twice, reproducible). `javascript_exec` confirms `typeof window.swToggleCanvasFs === "undefined"` on this page. Root cause: `chat-view.js:156` — `const scriptHtml = data.readOnly ? '' : (...)` — suppresses the entire script block containing `swToggleCanvasFs`/`swExpandCanvas` on any read-only/historical view, but the button markup itself (`chat-view.js:511`) is rendered unconditionally regardless of `readOnly`. | **Live Chrome verification (console + JS inspection), not the automated suite** | Real, currently-open production defect |
| AC4 — ideate layout's pre-existing dead "Maximise canvas" button now works | ⚠️ Same defect applies | Not independently re-tested live (would require a live ideate historical session), but the shared root cause is proven identical: `swExpandCanvas` (line 189) is defined in the exact same `scriptHtml` block suppressed for `readOnly` pages, and its button markup (`sw-expand-canvas`, line 471) is also rendered unconditionally. High confidence this AC has the same live-production gap on historical ideate views. | Code-level inference from the confirmed AC3 root cause | Real, currently-open production defect (inferred, not independently reproduced) |
| AC5 (CSS-layout-dependent) — diagram panel's computed height is at least the AC2 minimum on a real browser | ✅ | Covered by the same dedicated Playwright E2E spec cited for AC1/AC2, per the story's own DoR resolution ("not deferred to manual verification"). My own live check used a short-content mock fixture that did not stress-test the squeeze scenario, so it neither confirms nor disproves this AC — deferring to the existing automated E2E evidence, which is the authoritative source for this AC per the story's own text. | Automated E2E test (not independently re-run live this pass) | None |

---

## Scope Deviations

**AC3/AC4 are broken in production on read-only/historical resumed conversations — a real, currently-open gap, not previously known.** This is the first live-Chrome verification this story has received since merge (2026-08-07); the original 15/15 automated test suite apparently asserts the functions' presence in the concatenated source string / DOM structure without ever executing the button in a real browser against a `readOnly` render path, so it never caught this. This is the same class of gap this repo's own CLAUDE.md warns about for injectable-adapter wiring tests (D37) — a test that proves code exists, not that it behaves correctly when actually exercised — here applying to client-side script emission rather than server-side adapters.

**Important nuance: this defect predates cdpl-s1.** `swToggleArtefactFs` — the pre-existing button/function pair cdpl-s1's own Architecture Constraints explicitly required reusing ("Reuse the existing working fullscreen pattern") — is independently confirmed to have the exact same bug on this same historical page (`typeof window.swToggleArtefactFs === "undefined"`). cdpl-s1 did not introduce this class of defect; it faithfully reused an already-broken pattern, as instructed, without anyone having live-verified that pattern actually worked on historical views. This is a gap in the *reused* mechanism, not a new mistake unique to this story.

---

## Test Plan Coverage

**Tests passing:** 15/15 (`check-cdpl-s1-canvas-panel-layout-fix.js`), re-run fresh 2026-08-21.
**Gaps:** The automated suite does not catch the AC3/AC4 live-production breakage — it verifies the JS functions are defined in the emitted script and that the button markup references them correctly, but does not execute a real `readOnly` page render in a browser to confirm the button actually works end-to-end. This is a real, material test-coverage gap, not just a documentation nuance.

---

## NFR Status

| NFR | Addressed? | Evidence |
|-----|------------|---------|
| Performance: pure CSS/client-JS change, no new network calls | ✅ | By construction |
| Accessibility: `aria-label`/`title` present on the maximise button, matching `.ad-fs-btn` convention | ✅ | Confirmed present in DOM (`title="Maximise diagrams"`, `aria-label="Maximise diagrams"`) even though the button is non-functional on this view — the accessibility markup is correct, the behaviour behind it is not |

---

## Metric Signal

No formal benefit-metric artefact — short-track usability fix. The story's own stated benefit ("read a program-design or data-model diagram instead of it being squeezed... a way to expand it to full screen") is only half-delivered in production: the squeeze fix (AC1/AC2/AC5) works per automated evidence, but the expand-to-fullscreen mechanism (AC3/AC4) does not work when an operator resumes a past conversation to look at the diagram — which is precisely the scenario (reviewing a diagram after the live session ends) the User Story is framed around.

---

## Outcome

**COMPLETE WITH DEVIATIONS**

**Follow-up actions:** A follow-up story is required to fix the `readOnly`-suppressed-script defect for both `swToggleCanvasFs`/`swExpandCanvas` (cdpl-s1's own additions) and `swToggleArtefactFs` (the pre-existing pattern it reused) — likely by moving these three function definitions out of the conditionally-suppressed `scriptHtml` block into a script that always emits regardless of `data.readOnly`, since the buttons that call them are already rendered unconditionally. See the newly-created follow-up story for full scope.

---

## DoD Observations

1. ~2 weeks live in production before this defect was caught — it required a real live-Chrome click on a real resumed conversation to surface; no amount of the existing unit-level "is the function text present in the script" testing would have found it.
2. This is a stronger finding than most in this DoD backlog pass: not a missing test or an already-accepted deviation, but a currently-live, reproducible, user-facing broken control on a real production path (resuming a past `/design` or `/definition` session to view its diagram).
3. Worth flagging as a durable testing-pattern lesson if `/improve` is ever run: any client-side onclick handler wired to a function defined inside a conditionally-suppressed script block needs either (a) a live-browser E2E test that actually clicks it under both `readOnly` and non-`readOnly` render conditions, or (b) the button itself gated behind the same condition as its backing script — asserting "the function text appears in the HTML" is not equivalent to "the button works."
