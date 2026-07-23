## Test Plan: Hydrate the ideate canvas from restored session.canvasBlocks on page load/session-resume

**Story reference:** artefacts/2026-07-23-ideate-canvas-resume-hydration-fix/stories/icrh-s1.md
**Epic reference:** None — short-track
**Test plan author:** Claude (agent)
**Date:** 2026-07-23

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Non-empty canvasBlocks -> init script present, matches exactly | 1 | — | — | — | — | 🟢 |
| AC2 | Empty/absent canvasBlocks -> no init script emitted | 1 | — | — | — | — | 🟢 |
| AC3 | Non-ideate session with canvasBlocks set -> no init script (ideate-scoped boundary) | 1 | — | — | — | — | 🟢 |
| AC4 | Inline script hydrates via appendCanvasBlock, once per entry, in order | 1 | — | — | — | — | 🟢 |
| AC5 | Full regression pass, no new baseline failures | — | 1 | — | — | — | 🟢 |
| AC6 | Real staging turn through the real close/reopen flow now shows the canvas | — | — | 1 | — | Deploy-dependent | 🟡 |

---

## Test Data Strategy

**Source:** `_setHtmlSession`/`handleGetChatHtml` (already-exported test seams in `src/web-ui/routes/skills.js`) drive AC1-AC4 directly against the real render function with constructed session fixtures — no new adapter or mock needed. AC5 uses the existing full suite. AC6 reuses the existing, already-written `tests/e2e/a4-ideate-session-resume.spec.js` real-staging spec (no new E2E spec authored by this story — it exists already and is exactly the test that surfaced this defect).
**PCI/sensitivity in scope:** No.
**Availability:** AC1-AC5 available now, fully deterministic, no staging/credits/model dependency. AC6 requires a live `flyctl deploy` to `wuce-staging` within this session — if it cannot complete, reported as not run, not fabricated as passing.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | An ideate session with a 2-entry `canvasBlocks` array | Test-constructed | None | |
| AC2 | An ideate session with `canvasBlocks: []` and a second with the field entirely absent | Test-constructed | None | |
| AC3 | A `definition` session with a `canvasBlocks`-shaped field set (adversarial/boundary case) | Test-constructed | None | |
| AC4 | An ideate session with a 2-entry `canvasBlocks` array in a specific order | Test-constructed | None | |
| AC5 | Full existing suite + `tests/known-baseline-failures.json` | Existing | None | |
| AC6 | Real `wuce-staging`, `tests/e2e/a4-ideate-session-resume.spec.js` (already exists) | Real staging | None | Reuses the exact spec that surfaced this defect in CI run 29996127983 |

### PCI / sensitivity constraints

None.

### Gaps

AC6 depends on a live `flyctl deploy` succeeding within this session, on real `wuce-staging` being reachable/authenticated, on the credits top-up / `e2e-test-admin` provisioning already being in place (per `a4-ideate-session-resume.spec.js`'s own header — this is an existing precondition of that spec, not newly introduced by this story), and on no concurrent deploy from another agent being clobbered. If it cannot complete, it is reported as pending/not-run, not claimed as passing — AC1-AC5 provide full deterministic verification of the fix itself independent of AC6's outcome.

---

## Unit Tests

### UT1 — window.__SW_INITIAL_CANVAS_BLOCKS__ present and matches session.canvasBlocks exactly (AC1)
- **Verifies:** AC1
- **Component:** `_renderChatPage`/`handleGetChatHtml` (`src/web-ui/routes/skills.js`)
- **Action:** Seed a session via `_setHtmlSession` with `skillName: 'ideate'` and a 2-entry `canvasBlocks` array (`cluster-tree` + `text` types). Call `handleGetChatHtml` with a mocked req/res and inspect the response body.
- **Expected result:** Response contains `window.__SW_INITIAL_CANVAS_BLOCKS__=[...]`; the JSON payload parses to an array of length 2 whose `type`/`title` fields match the seeded session's `canvasBlocks` exactly, in the same order.
- **RED against current code:** No `__SW_INITIAL_CANVAS_BLOCKS__` string appears anywhere in the response body — the assertion fails.

### UT2 — no init script emitted when canvasBlocks is empty/absent (AC2)
- **Verifies:** AC2
- **Component:** Same as UT1.
- **Action:** Seed one ideate session with `canvasBlocks: []` and a second with the field entirely absent. Call `handleGetChatHtml` for each.
- **Expected result:** Neither response body contains `window.__SW_INITIAL_CANVAS_BLOCKS__` — proving the fix does not emit empty-array hydration noise on every ideate page load.
- **RED against current code:** N/A (this assertion already passes pre-fix, since no init script is ever emitted at all pre-fix) — included as a regression guard once AC1's fix lands, not as new RED evidence.

### UT3 — non-ideate session with canvasBlocks set does not get the init script (AC3)
- **Verifies:** AC3
- **Component:** Same as UT1.
- **Action:** Seed a `definition` session with a `canvasBlocks`-shaped field set on it (adversarial/boundary case simulating a field collision). Call `handleGetChatHtml`.
- **Expected result:** Response body does not contain `window.__SW_INITIAL_CANVAS_BLOCKS__` — proving the hydration is genuinely `isIdeate`-scoped, not a blanket "any session with this field" behaviour that could leak content into the wrong skill's DOM.
- **RED against current code:** N/A (already passes pre-fix) — included as a boundary regression guard.

### UT4 — inline script hydrates via appendCanvasBlock, once per entry, in array order (AC4)
- **Verifies:** AC4
- **Component:** Same as UT1.
- **Action:** Seed an ideate session with a 2-entry `canvasBlocks` array in a specific order (`First`, `Second`). Call `handleGetChatHtml` and inspect the inline `<script>` source for the hydration call shape (`IS_IDEATE` guard + `__SW_INITIAL_CANVAS_BLOCKS__.forEach(function(block) { appendCanvasBlock(block); })`), and independently confirm the serialized JSON array itself preserves entry order.
- **Expected result:** The hydration call is present, guarded by `IS_IDEATE`; the JSON payload's entry order matches the session's `canvasBlocks` order (which determines DOM order via `appendCanvasBlock`'s always-append behaviour, and therefore which block Playwright's `.first()` selector will match).
- **RED against current code:** No such hydration call exists in the inline script at all — the regex match fails, and the (non-existent) init-script JSON parse yields `null` for both order-check assertions.

---

## Integration Tests

### IT1 — full existing regression suite (AC5)
- **Verifies:** AC5
- **Action:** Run `npm test`.
- **Expected result:** No previously-passing test starts failing; failure count/set matches `tests/known-baseline-failures.json`.

---

## E2E / Manual Tests

### E2E1 — real `wuce-staging` deploy + real close/reopen resume flow (AC6)
- **Verifies:** AC6
- **Components involved:** Real `wuce-staging` Fly app; `tests/e2e/a4-ideate-session-resume.spec.js` (pre-existing spec, unmodified by this story)
- **Precondition:** No concurrent deploy in progress from another agent (checked via `flyctl releases --app wuce-staging` before deploying); this fix is deployed via `flyctl deploy --app wuce-staging`.
- **Action:** Re-run `tests/e2e/a4-ideate-session-resume.spec.js`'s AC2 & AC3 test against real staging (the exact test that surfaced this defect in CI run 29996127983).
- **Expected result:** The resumed session's canvas shows the same blocks (count and first-block title) that existed before closing — the test passes rather than failing at `locator('#canvas-panel .canvas-block').first()`.
- **Contingency:** If deploy cannot complete this session (e.g. a concurrent agent is mid-deploy, or the credits/mock-gateway upstream preconditions this spec already depends on are not met), reported as not run — UT1-UT4 (all deterministic, no staging dependency) remain the always-available verification level for the fix's correctness.

---

## NFR Tests

None beyond IT1 (no new NFR-specific behaviour introduced — this is a rendering-hydration fix, not new application logic; no new attack surface, no new UI/CSS).

---

## Out of Scope for This Test Plan

- Re-verifying `a3-product-feature-ideate-canvas.spec.js`'s separate, independently-tracked AC3 turn-2-render failure (a different bug).
- Any test of `mergeRedisSessionData()`'s own restore correctness (already covered by `tests/check-a4-session-store-state.js`, `tests/check-wusl-s2-full-session-state-restore.js`; unchanged by this fix).
- Any test of the live-SSE canvas rendering path's own internals (already covered by `tests/check-inc4-canvas-panel.js`'s T1-T5; unchanged by this fix).
- Building or testing a true incremental hydration for `/definition`'s story-map canvas (out of scope per the story's Out of Scope section).

---

## Test Gaps and Risks

| Gap | Reason | Mitigation |
|-----|--------|------------|
| E2E1 depends on a live `flyctl deploy` succeeding within this session and no concurrent deploy from another agent | Deploy environment availability and shared-staging concurrency are not guaranteed at test-plan-authoring time | Contingency clause requires explicit "not run" reporting rather than a fabricated pass; UT1-UT4 + IT1 provide full deterministic verification of the fix's correctness independent of E2E1's outcome |
