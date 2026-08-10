## Definition of Ready: rapp-s1 — Fix three /ideate UX gaps found via live Chrome staging review

**Story:** artefacts/2026-08-10-ideate-resume-panels-and-wrap-up/stories/rapp-s1-resume-panels-and-wrap-up.md
**Test plan:** artefacts/2026-08-10-ideate-resume-panels-and-wrap-up/test-plans/rapp-s1-test-plan.md
**Date:** 2026-08-10

---

### Scope contract

**Files in scope (exact touchpoints):**
- Modified: `src/web-ui/routes/skills.js` — assumption/condition-card resume-hydration init scripts (mirroring `canvasBlocksInitScript`), `done` field added to the `_renderChatView` data object, client-side hydration calls, "Wrap up ideation" button click handler.
- Modified: `src/web-ui/views/chat-view.js` — "Wrap up ideation" button markup (gated `isIdeate && !done`), `#canvas-section` min-height fix (ideate 3-panel layout branch only).
- New: `tests/check-rapp-s1-resume-panels-and-wrap-up.js`.

**Files explicitly out of scope (must not be touched):**
- `mergeRedisSessionData`, the Redis persistence layer, or any other part of the session-restore mechanism — already correct (denylist-based per `wusl-s2`); this story only wires already-correct state into the initial render.
- The real (non-mocked) `/ideate` skill's own system prompt — the button fix resolves the discoverability gap independent of the model's own phrasing.
- `#condition-items`/`#assumption-cards`'s own `max-height` percentages — not touched, per the story's own Out of Scope section.
- `check-mfc2-chat-ux-improvements.js`, `check-iwu2-right-panel-layout.js`, `check-inc2.1-conditions-panel.js`, `check-inc4-canvas-panel.js` — pre-existing, confirmed-unrelated failures; not touched.

### Architecture Constraints

No new architectural decision — mirrors the already-proven `a4` canvas-block resume-hydration pattern for two more fields, and reuses the existing `sendTurn()` turn-submission path for the new button. No ADR required.

### Human oversight

**Medium** — three distinct fixes across real production render/client-JS code (not test fixtures). Each individually well-understood and mirrors an existing pattern, but touches the live chat page's HTML generation and client-side script directly.

### Coding Agent Instructions

1. `src/web-ui/routes/skills.js` and `src/web-ui/views/chat-view.js` — already implemented per the story's three fixes.
2. `tests/check-rapp-s1-resume-panels-and-wrap-up.js` — already written and passing (9/9).
3. Full regression sweep already run and green (see test plan's Regression Tests section) — re-run before merge to confirm no drift: `check-a3-ideate-artefact-disk-match.js`, `check-a4-session-store-state.js`, `check-icv-s1-ideate-canvas-turn2-render-fix.js`, `check-bri-s3.1-mock-llm-gateway.js`, `check-mgtc-s1-turn-index-cycling.js`, `check-isc-s1-ideate-success-lens-cycling.js`, `check-wusl1-chat-streaming.js`, `check-dsh-s3-render-chat-readonly.js`, `check-cmtt-s1-chat-message-text-truncation-fix.js`, `check-cdpl-s1-canvas-panel-layout-fix.js`, `check-iwu1-context-manifest.js`.
4. E2E regression: `tests/e2e/fjcv-s1-full-journey-core-flow-and-resume.spec.js` and `tests/e2e/rdac-s1-resume-shows-diagrams-artefact-conversation.spec.js` — both re-run and passing.
5. After merge and staging deploy: live-verify via Chrome on `wuce-staging.fly.dev` — drive a fresh `/ideate` session, confirm (a) the assumptions/conditions panels survive a page reload mid-session, (b) the "Wrap up ideation" button appears and correctly triggers completion, (c) the canvas panel stays visually usable once conditions/assumptions have real content. This is this story's own completion criterion (not a new Playwright spec, per the test plan's stated gap acceptance).

### Definition of Ready checklist

- [x] Scope contract defined (in-scope and out-of-scope files both named)
- [x] Test plan written, all ACs covered
- [x] Human oversight level set (Medium)
- [x] No CSS-layout-dependent AC left unclassified — AC9 (canvas min-height) is CSS-layout-related but verified via inline-style string assertion (deterministic, not a real-browser rendering check); the actual visual confirmation is explicitly deferred to this story's own live-Chrome completion step (matching the CSS-layout-dependent-AC classification rule: RISK-ACCEPT + manual smoke check, logged here rather than in a separate decisions.md entry given this is a short-track story)

**PROCEED: Yes**
