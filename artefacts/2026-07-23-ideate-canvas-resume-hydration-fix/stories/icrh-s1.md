# Story: Hydrate the ideate canvas from restored session.canvasBlocks on page load/session-resume

**Epic reference:** None — short-track (bounded rendering bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the live-verified defect found by `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2 & AC3 test failing against real `wuce-staging` (CI run 29996127983, job 89170114731, PR #568).
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below, tied honestly to the parent feature's own benefit metric rather than fabricating a new metric artefact.

## User Story

As **an operator using the real `/ideate` chat UI who closes their browser mid-session and reopens it later** (the exact scenario `a4-ideate-session-resume`'s AC2/AC3 test drives against real staging),
I want **the canvas panel to show the same blocks it showed before I closed the browser, immediately on page load**,
So that **I do not lose visible context on the work already produced in my session — a session I already know is durably restorable at the data layer (`mergeRedisSessionData`, `wusl-s2`, already merged) should also visibly look restored, not blank**.

## Benefit Linkage

**Metric moved:** `2026-07-23-e2e-core-journey-coverage`'s own benefit metric (m1 — real, staging-verified E2E coverage of the core product journey, replacing untested/unverified confidence with live-verified confidence). Not a new metric artefact (short-track) — this fix closes a genuine, previously-undetected production defect that `a4-ideate-session-resume`'s own AC2/AC3 test surfaced once its upstream credits/mock-gateway blockers were cleared (PR #566, `a5-ci-gate-scenario-a-blocking`, wired Scenario A as a CI-blocking gate, which is what first exposed this failure in CI).

**How:** CI run 29996127983 (job 89170114731) shows `a4-ideate-session-resume.spec.js`'s AC2/AC3 test failing at `locator('#canvas-panel .canvas-block').first()` — "element(s) not found" — after turn 1 already rendered canvas blocks successfully pre-close (proven by the test reaching this assertion rather than skipping at its `turnBlockedReason()` `test.skip()` gate). `tests/check-a4-session-store-state.js` independently proves the data layer (`mergeRedisSessionData`) already restores `session.canvasBlocks` correctly. Direct code inspection of `src/web-ui/routes/skills.js`'s `_renderChatPage`/`handleGetChatHtml` confirms the gap: no code path reads `session.canvasBlocks` to seed the initial HTML or an initial client-side hydration payload — the `.canvas-block` DOM elements the test selector targets are created ONLY reactively, by the inline script's `appendCanvasBlock`/`renderCanvasBlock` functions, in response to live SSE `canvasBlock` events during an in-progress turn (`handlePostTurnStreamHtml`). A page reload (session resume) is not a live SSE stream, so the canvas silently renders empty regardless of what is correctly restored in `session.canvasBlocks` server-side.

## Architecture Constraints

- **This is additive hydration-wiring only, mirroring an existing, already-shipped precedent in the same file.** `_renderChatPage` already has an analogous "restore from session on page load" pattern for non-ideate skills: `artefactInitScript` sets `window.__SW_INITIAL_ARTEFACT__` server-side, and the inline script's `if(!IS_IDEATE && typeof __SW_INITIAL_ARTEFACT__ !== "undefined" && __SW_INITIAL_ARTEFACT__) { updateDraftPanel(__SW_INITIAL_ARTEFACT__); }` reads it client-side on load. This fix adds the exact same shape for ideate's `canvasBlocks`, using the existing `appendCanvasBlock` function (already used by the live-SSE path) rather than introducing new rendering logic.
- **Do not modify `mergeRedisSessionData()`** (`src/web-ui/routes/skills.js`) — the data-layer restore mechanism is independently proven correct by `tests/check-a4-session-store-state.js` (5/5 passing) and is out of scope for this fix. This story's gap is entirely in what the GET chat-page render does with already-correctly-restored data, not in the restore itself.
- **Do not change the live-SSE canvas rendering path** (`renderCanvasBlock`, `appendCanvasBlock`, the `canvasBlock` SSE event, or `handlePostTurnStreamHtml`'s marker-scanning logic) — this fix only adds a one-time hydration call on page load, using the existing `appendCanvasBlock` function unmodified.
- **No new adapter, no schema change, no change to `parseCanvasBlock`** — `session.canvasBlocks` entries already have the exact `{type, title, content}` shape `appendCanvasBlock`/`renderCanvasBlock` already consume (confirmed by reading `parseCanvasBlock` and the `canvasBlock` SSE event payload construction in `handlePostTurnStreamHtml`).

## Dependencies

- **Upstream:** `wusl-s2` (merged) — `mergeRedisSessionData()`'s denylist-based session restore, already correctly restoring `session.canvasBlocks`. `a5-ci-gate-scenario-a-blocking` (PR #566, merged) — wired Scenario A's E2E specs as a CI-blocking gate, which is what surfaced this defect in CI in the first place.
- **Downstream:** `a4-ideate-session-resume`'s own AC2/AC3 test (`tests/e2e/a4-ideate-session-resume.spec.js`) is the direct consumer of this fix — it is expected to newly pass against real staging once this fix is deployed.

## Acceptance Criteria

**AC1:** Given a session with `isIdeate === true` and a non-empty `session.canvasBlocks` array, When `_renderChatPage` builds the initial HTML for a GET request to the chat page, Then the returned HTML contains a `window.__SW_INITIAL_CANVAS_BLOCKS__` init script whose JSON-serialized value matches `session.canvasBlocks` exactly (same length, same `type`/`title`/`content` per entry).

**AC2:** Given a session with `isIdeate === true` and an empty or absent `session.canvasBlocks`, When `_renderChatPage` builds the initial HTML, Then no `window.__SW_INITIAL_CANVAS_BLOCKS__` init script is emitted (proving the fix does not fabricate empty-array hydration noise on every ideate page load).

**AC3:** Given a non-ideate session (e.g. `skillName === 'definition'`) with a `canvasBlocks`-shaped field set on it (a boundary/adversarial case), When `_renderChatPage` builds the initial HTML, Then no `window.__SW_INITIAL_CANVAS_BLOCKS__` init script is emitted — proving the hydration is genuinely ideate-scoped, not a blanket "any session with this field" behaviour that could leak the wrong panel's content into the wrong skill's DOM.

**AC4:** Given the rendered chat-page HTML for an ideate session with `window.__SW_INITIAL_CANVAS_BLOCKS__` set, When the inline client script runs on page load, Then it calls `appendCanvasBlock` once per entry in `__SW_INITIAL_CANVAS_BLOCKS__`, in array order (matching the `.canvas-block` DOM order the test asserts: `.first()` must be the block that was first before closing).

**AC5:** Given the full existing test suite (`npm test`), When run after this fix, Then no previously-passing test starts failing, and the count/set of pre-existing baseline failures matches `tests/known-baseline-failures.json` (no new regressions introduced).

**AC6:** Given this fix is deployed to real `wuce-staging` (subject to no concurrent deploy in progress from another agent), When `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2 & AC3 test is re-run against real staging, Then it passes (canvas blocks visible and matching pre-close content after the close/reopen round-trip) — reported honestly as observed, including if deploy could not be completed this session.

## Out of Scope

- Any change to `mergeRedisSessionData()` or the Redis session-restore mechanism itself (proven correct, out of scope per CLAUDE.md's explicit guidance for this investigation).
- Any change to the live-SSE canvas rendering path (`renderCanvasBlock`, `appendCanvasBlock`'s own internals, the `canvasBlock` SSE event, or `handlePostTurnStreamHtml`'s marker-scanning).
- Fixing `tests/e2e/a3-product-feature-ideate-canvas.spec.js`'s separate, independently-tracked AC3 turn-2-render failure (a different bug, out of this story's scope — see that spec file's own CI failure in the same run).
- Building a true incremental mid-session hydration for `/definition`'s story-map canvas (that canvas's own cold-reload gap, if any, is a separate, undocumented concern — `b1-formed-idea-outer-loop-story-map.spec.js`'s own AC4 is verified only at the Integration level, not E2E, and is not touched by this fix).
- Any UI/CSS layout change to the canvas panel itself.

## NFRs

- **Performance:** Negligible — one additional `JSON.stringify` of an already-in-memory array per ideate page load, and one client-side `forEach` loop calling an already-existing function. No measurable cost at expected canvasBlocks array sizes (single-digit to low-double-digit blocks per session).
- **Security:** No new attack surface. `session.canvasBlocks` is a server-side-only field (populated exclusively by parsing the model's own streamed output via `parseCanvasBlock`, never from unvalidated request input) serialized the same way `artefactInitScript`/`phaseModelInitScript` already safely serialize session-internal content (HTML-entity-escaping `<`, `>`, `&` before embedding in a `<script>` tag).
- **Accessibility:** No change to the DOM structure or ARIA attributes of `.canvas-block` elements — this fix only changes *when* they are created (on page load in addition to live-SSE), not *what* they render.
- **Audit:** Not applicable — no change to any audited code path.

## Complexity Rating

**Rating:** 1 — well understood; root cause independently confirmed by direct code inspection (comparing the existing, working `__SW_INITIAL_ARTEFACT__` hydration pattern against ideate's canvas, which has no equivalent), fix shape mirrors that existing precedent exactly, and verification approach (unit test on `_renderChatPage`'s output + full regression + real staging redeploy) is already identified.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic
