# Definition of Ready: sob-s4 — journey.js DRY completion + sw-pill--neutral tone

**Track:** Short-track
**Test plan:** artefacts/2026-09-08-session-origin-badge/test-plans/sob-s4-test-plan.md
**Complexity:** 1 (well understood, clear path — both changes are one-line-per-call-site edits with existing precedent in the same codebase)
**Human oversight:** Low

## Readiness checks

- [x] Scope is testable without ambiguity — T1-T4 above.
- [x] Out of scope declared.
- [x] No dependency on an incomplete upstream story — sob-s1/sob-s2/sob-s3 are all merged and DoD-complete.
- [x] NFRs identified — CSS/visual classified per B2 (see test-plan's NFR note): automated DOM-attribute assertion, not Playwright visual regression, plus a live post-merge smoke-check this session can execute directly.
- [x] H-ADAPTER check: no adapter changes in this scope — N/A.

## Coding Agent Instructions

1. `journey.js` line ~257-264 (`_renderJourneyHome`'s card-mapping closure): replace the inline `_sobLabelMap`/`_sobGlyphMap` object literals with a call to `require('./features.js').sessionOriginBadgeMeta(_sobOrigin)` (already top-level-required in this file as `deriveSessionOrigin` — reuse the same require, don't add a second one), mirroring `products.js` line ~404's own already-converted call site exactly.
2. In all 3 call sites (`products.js` ~404, `journey.js` ~264, `kanban-view.js` ~366), add `sw-pill--neutral` to the `class` attribute: `"sw-pill sw-pill--nodot sw-pill--neutral"`.
3. Add T4's class-attribute assertions to each story's existing test file (`check-sob-s1-product-list-integration.js`, `check-sob-s2-journey-dashboard-integration.js`, `check-sob-s3-org-kanban-integration.js`) rather than a new file — these changes are additive to already-existing, already-passing test suites for the same rendering paths.
4. Run the full suite; confirm no regressions beyond the already-documented pre-existing flakes.

## Sign-off

**Proceed:** Yes — signed off directly (short-track, complexity 1, low oversight, continuing already-DoD'd scope per `decisions.md`'s own deferred-work tracking).
