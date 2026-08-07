# DoR Contract: Hydrate the ideate canvas from restored session.canvasBlocks on page load/session-resume

**Story reference:** artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/stories/icrh-s1.md
**Test plan reference:** artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/test-plans/icrh-s1-test-plan.md

---

## Contract Proposal

**What will be built:**
1. In `src/web-ui/routes/skills.js`'s `_renderChatPage`, a new `canvasBlocksInitScript` variable, populated only `if (isIdeate && Array.isArray(session.canvasBlocks) && session.canvasBlocks.length)`, serializing `session.canvasBlocks` into `window.__SW_INITIAL_CANVAS_BLOCKS__=[...]`, escaped the same way `artefactInitScript`/`phaseModelInitScript` already are. Included in `bodyContent`'s existing composition.
2. In the inline client `<script>`, a hydration block immediately after the existing `__SW_INITIAL_ARTEFACT__` hydration check: `if(IS_IDEATE && typeof __SW_INITIAL_CANVAS_BLOCKS__ !== "undefined" && __SW_INITIAL_CANVAS_BLOCKS__ && __SW_INITIAL_CANVAS_BLOCKS__.length) { __SW_INITIAL_CANVAS_BLOCKS__.forEach(function(block) { appendCanvasBlock(block); }); }` — reusing the existing `appendCanvasBlock` function unmodified.
3. New test file `tests/check-icrh-s1-ideate-canvas-resume-hydration.js` — UT1 (AC1, non-empty canvasBlocks -> exact init-script match), UT2 (AC2, empty/absent -> no init script), UT3 (AC3, non-ideate boundary -> no init script), UT4 (AC4, hydration call shape + order preservation).
4. Written RED first against current code (5 of 9 assertions fail across UT1/UT4, demonstrating the exact live defect; UT2/UT3's negative-space assertions already pass pre-fix as expected), then GREEN after the fix (15/15 passing).
5. Attempt a real `flyctl deploy` to `wuce-staging` (after checking for concurrent deploy activity), then re-run `tests/e2e/a4-ideate-session-resume.spec.js` against real staging and report the observed outcome honestly.

**What will NOT be built:**
- No change to `mergeRedisSessionData()` or the Redis session-restore mechanism.
- No change to `renderCanvasBlock`, `appendCanvasBlock`'s own internals, the `canvasBlock` SSE event, or `handlePostTurnStreamHtml`'s marker-scanning logic.
- No new adapter, no schema change to `session.canvasBlocks`'s shape.
- No fix to `a3-product-feature-ideate-canvas.spec.js`'s separate turn-2-render defect.

**How each AC will be verified:**

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | UT1 | unit |
| AC2 | UT2 | unit |
| AC3 | UT3 | unit |
| AC4 | UT4 | unit |
| AC5 | IT1 (full regression pass) | integration |
| AC6 | E2E1 (real staging turn through the real close/reopen flow, deploy-dependent) | e2e |

**Assumptions:**
- `flyctl` may or may not be available/authenticated when this story is dispatched — a deploy is attempted; if it fails, cannot complete, or a concurrent agent is mid-deploy (checked via `flyctl releases --app wuce-staging` before deploying), AC6 is reported as a pending follow-up, not a false success.
- `tests/e2e/a4-ideate-session-resume.spec.js`'s own existing upstream preconditions (credits top-up succeeding, `e2e-test-admin` provisioning) are assumed already satisfied on real staging, since the CI run that surfaced this defect (29996127983) shows turn 1 rendering canvas content successfully (i.e. the test reached the AC2/AC3 assertion rather than skipping at its `turnBlockedReason()` gate) — this story does not need to re-solve those separate, already-resolved preconditions.

**Estimated touch points:**
Files: `src/web-ui/routes/skills.js`, `tests/check-icrh-s1-ideate-canvas-resume-hydration.js` (new)
Services: `wuce-staging` (Fly.io) — deploy only, no schema/config change
APIs: None

---

## Contract Review

Reviewed against all 6 story ACs and the test plan's AC Coverage table:

- AC1 ↔ verified by UT1 — ✅ aligned.
- AC2 ↔ verified by UT2 — ✅ aligned.
- AC3 ↔ verified by UT3 — ✅ aligned.
- AC4 ↔ verified by UT4 — ✅ aligned.
- AC5 ↔ verified by IT1 — ✅ aligned.
- AC6 ↔ verified by E2E1 (real-world, deploy-dependent) — ✅ aligned.

No mismatches found between proposed implementation and stated ACs. No file named as out-of-scope in the story's Architecture Constraints (`mergeRedisSessionData`, `renderCanvasBlock`/`appendCanvasBlock` internals, `handlePostTurnStreamHtml`'s marker-scanning) appears in the test plan's required touchpoints — confirmed no B1/D1-style contract/test-plan contradiction. `src/web-ui/routes/skills.js` is a required touchpoint (both `_renderChatPage`'s server-side render and its inline client script live there) and is correctly listed as an estimated touch point, not excluded.

✅ **Contract review passed** — proposed implementation aligns with all ACs.

---

## Hard Blocks

(See `icrh-s1-dor.md` for the full table — duplicated here per template convention.)

**All hard blocks pass**, with H-NFR/H-NFR-profile and H-GOV recorded as RISK-ACCEPTs, consistent with this repo's established short-track precedent.

---

## Sign-off

**Oversight level:** High.
**Scope confirmation:** This fix is scoped narrowly to `_renderChatPage`'s server-side render (one new init-script variable, following the existing `artefactInitScript` pattern exactly) and the inline client script (one new hydration block, reusing the existing `appendCanvasBlock` function unmodified) — it is explicitly not a broader canvas-rendering rewrite, does not touch the live-SSE path, and does not touch the data-layer restore mechanism.
**Sign-off required:** No — matches this repo's established short-track precedent.
**Signed off by:** Claude (agent, autonomous, short-track), 2026-07-23 — root cause independently confirmed by reading `src/web-ui/routes/skills.js` (`_renderChatPage`, `handleGetChatHtml`, `handlePostTurnStreamHtml`, the inline client script's `renderCanvasBlock`/`appendCanvasBlock`/`updateDraftPanel` functions in full), `src/web-ui/views/chat-view.js`, CI run 29996127983's failure log, and `tests/check-a4-session-store-state.js`'s passing output confirming the data layer is not the defect.
