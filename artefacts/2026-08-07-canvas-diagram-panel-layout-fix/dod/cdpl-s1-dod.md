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
| AC3 — new maximise/expand control on the Diagrams section toggles fullscreen | ✅ **Fixed 2026-08-22 by `cmba-s1`, re-verified 2026-09-12** (was: ❌ BROKEN IN PRODUCTION) | Originally live-reproduced on `wuce-staging.fly.dev` 2026-08-21: clicking "Maximise diagrams" threw `ReferenceError: swToggleCanvasFs is not defined`. `cmba-s1` (PR #752, merged 2026-08-22) moved `swToggleCanvasFs`/`swExpandCanvas`/`swToggleArtefactFs` out of the `readOnly`-suppressed script block. Re-verified 2026-09-12: driving the real `handleGetJourneyStageView` handler end-to-end with real diagram content and actually *executing* the real rendered `<script>` output (`vm.runInContext`, not just checking the text is present) confirms all 3 functions are real, callable functions with no `ReferenceError` — see DoD Observation #4 for the full method and why a live Chrome click-through could not be performed | Direct production-handler execution + real script compile/run (integration-level, not a live Chrome click — see Observation #4) | None remaining for this AC |
| AC4 — ideate layout's pre-existing dead "Maximise canvas" button now works | ✅ **Fixed 2026-08-22 by `cmba-s1`, re-verified 2026-09-12** (was: ⚠️ same defect, inferred not confirmed) | Same fix and same re-verification as AC3 — `swExpandCanvas` is defined by the identical code path now proven to execute without error | Direct production-handler execution + real script compile/run | None remaining for this AC |
| AC5 (CSS-layout-dependent) — diagram panel's computed height is at least the AC2 minimum on a real browser | ✅ | Covered by the same dedicated Playwright E2E spec cited for AC1/AC2, per the story's own DoR resolution ("not deferred to manual verification"). My own live check used a short-content mock fixture that did not stress-test the squeeze scenario, so it neither confirms nor disproves this AC — deferring to the existing automated E2E evidence, which is the authoritative source for this AC per the story's own text. | Automated E2E test (not independently re-run live this pass) | None |

---

## Scope Deviations

**AC3/AC4's original defect (see DoD Observation #4) is now closed as of 2026-09-12.** The section below is kept as the original, accurate historical account of what was found at the time — not retroactively erased.

**AC3/AC4 were broken in production on read-only/historical resumed conversations — a real, currently-open gap, not previously known, at the time this was originally written.** This is the first live-Chrome verification this story has received since merge (2026-08-07); the original 15/15 automated test suite apparently asserts the functions' presence in the concatenated source string / DOM structure without ever executing the button in a real browser against a `readOnly` render path, so it never caught this. This is the same class of gap this repo's own CLAUDE.md warns about for injectable-adapter wiring tests (D37) — a test that proves code exists, not that it behaves correctly when actually exercised — here applying to client-side script emission rather than server-side adapters.

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

**COMPLETE**

**Follow-up actions:**
1. ~~A follow-up story is required to fix the `readOnly`-suppressed-script defect...~~ — done, `cmba-s1` (PR #752, merged 2026-08-22), re-verified 2026-09-12. See DoD Observation #4.
2. **New finding, not part of this story's own scope (see DoD Observation #5):** no real historical journey checked on `wuce-staging.fly.dev` (6 checked, spanning 2026-07-23 to 2026-09-11) currently has durably-persisted `session_turns` for any completed stage, meaning `dsh-s3`'s own chat-split read-only view — the exact view this whole AC3/AC4 defect lives inside — appears to never actually render for real users in practice today. Worth a dedicated investigation as its own story; not chased further here since it's outside `cdpl-s1`'s own scope.

---

## DoD Observations

1. ~2 weeks live in production before this defect was caught — it required a real live-Chrome click on a real resumed conversation to surface; no amount of the existing unit-level "is the function text present in the script" testing would have found it.
2. This is a stronger finding than most in this DoD backlog pass: not a missing test or an already-accepted deviation, but a currently-live, reproducible, user-facing broken control on a real production path (resuming a past `/design` or `/definition` session to view its diagram).
3. Worth flagging as a durable testing-pattern lesson if `/improve` is ever run: any client-side onclick handler wired to a function defined inside a conditionally-suppressed script block needs either (a) a live-browser E2E test that actually clicks it under both `readOnly` and non-`readOnly` render conditions, or (b) the button itself gated behind the same condition as its backing script — asserting "the function text appears in the HTML" is not equivalent to "the button works."
4. **Backfilled 2026-09-12, following a wider stocktake for web-UI stories lacking real evidence of cohesion.** `cmba-s1`'s own fix (moving the 3 functions out of the `readOnly`-suppressed block) was itself only unit-tested at merge time — nobody had actually confirmed it live since. Attempted a live Chrome re-verification first: checked 6 real historical journeys on `wuce-staging.fly.dev` spanning almost 7 weeks of real usage (`2026-07-23-b1-story-map-stage-sequence-fix`, `2026-07-25-code-shape-diagrams`, `2026-08-11-web-ui-guardrails-standards-surface`, `2026-08-27-active-stage-link-stale-session-dead-end`, `2026-09-09-doc-matrix-column-bugs`, `2026-09-10-journey-autofocus-scroll-trap`) — every single one fell back to the plain, non-interactive markdown artefact view (no `#chat-messages`, no maximise button of any kind) rather than the `dsh-s3` chat-split view this whole defect lives inside. See Observation #5 for why. Given a real click-through genuinely isn't reachable today, verified instead by driving the real, unmodified production handler (`handleGetJourneyStageView` in `journey.js`, calling the real `renderChat` in `chat-view.js`) end-to-end with a real diagram marker in the turns payload (stubbing only the Postgres turns-read, via the same `setGetTurnsForStage` seam `drh-s1`'s own test file already establishes as the correct D37 stub point — everything downstream is 100% real production code). Confirmed: `sw-canvas-fs-btn` renders, a real diagram block renders, and — critically, going beyond `cmba-s1`'s own unit tests — the actual rendered `<script>` block was extracted and *executed* (Node's `vm.runInContext`, not just string-matched) with a minimal DOM/`localStorage` shim, confirming `swToggleCanvasFs`/`swExpandCanvas`/`swToggleArtefactFs` are real, callable functions with zero `ReferenceError` — the exact failure class originally found. This is stronger evidence than "the function text is present in the HTML" (what the existing unit tests check) without requiring a real browser, since no real page to click currently exists in this deployment's own history.
5. **New finding, not part of this story's own scope:** the reason no live Chrome click-through was possible is itself worth investigating separately — `dsh-s1`/`dsh-s2`/`dsh-s3` (2026-07-28) built durable `session_turns` persistence and the chat-split read-only view specifically so operators could review a completed stage's real conversation, but across 6 real journeys sampled from 2026-07-23 through 2026-09-11, none had non-empty turns for any completed stage — every one silently fell back to the pre-`dsh-s3` plain artefact view. Either `session_turns` writes aren't actually firing in real (non-test) usage, or something else prevents `_getTurnsForStageFn` from finding them. Recommend a dedicated short-track investigation story.
