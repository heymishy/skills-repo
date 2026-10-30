# Research: Journey-Seed-Endpoint Classification

**Story:** tfhc-s4 — artefacts/2026-10-30-test-fixture-hardening-continuation/stories/tfhc-s4-journey-seed-endpoint-classification.md
**Date:** 2026-10-31
**Method:** Each of the 5 endpoints' real handler code was read directly in `src/web-ui/server.js`, together with every real Playwright E2E spec that calls it, before any verdict was recorded — per this story's own DoR instruction not to classify from endpoint names alone.

## Summary

All 5 journey-related `/test/seed-*` endpoints were read directly, together with every real E2E spec that calls each one. **No endpoint was found redundant with another — no further action required.** Two pairs looked structurally similar at first glance (`seed-board-journey`/`seed-approval-journey`, and `seed-ppc-s5-journey`/`seed-actr-s2-journey`) but in both cases a specific, load-bearing difference — confirmed empirically in the real code and comments, not assumed — makes them genuinely not interchangeable. Detailed below.

## Classification

### 1. `seed-approval-journey` (`src/web-ui/server.js:2663`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/ep2-s3-approval.spec.js`, `tests/e2e/dsa-s2-dashboard-restyle.spec.js`, `tests/e2e/ep2-s4-concurrent-merge.spec.js`, `tests/e2e/fixtures/seed-journey.js` (a shared helper used by multiple specs).

**Reasoning:** Modelled closely on `seed-board-journey` (same journey-store.js-backed real-journey pattern) but with one deliberate, load-bearing difference: `productId` is never set on the journey it creates. `ep2-s3-approval.spec.js`'s own header comment (lines 18-46) documents the investigation that produced this: using `seed-board-journey` for the approval flow was tried first and empirically failed, because `handlePostGateConfirm`'s `acdg-s1` guard (`routes/journey.js`) hard-blocks with a 502 whenever `ownerRepoForFeature` throws (which it always does in this E2E environment, since `DATABASE_URL` is unset) AND `journey.productId` is truthy. `seed-board-journey` always defaults `productId` to a truthy string, so it trips this block; `seed-approval-journey` must omit `productId` entirely to land in `acdg-s1`'s "genuinely no product link" silent-skip branch instead, so gate-confirm completes for real. Swapping either endpoint in for the other would break the calling spec, for a reason unrelated to the spec's own intent — not redundant.

### 2. `seed-board-journey` (`src/web-ui/server.js:2598`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/ep2-s1-signals-panel.spec.js`, `tests/e2e/kbsf-s1-shell-wrapping-visual.spec.js`, `tests/e2e/s1.1-board-advance-action.spec.js`, `tests/e2e/s1.2-not-ready-explanation.spec.js`, `tests/e2e/s3.1-drag-to-advance.spec.js`, `tests/e2e/s3.2-within-column-reorder.spec.js` (6 real callers; `ep2-s3-approval.spec.js` references it only in a header-comment investigation note, not in its test body — see Investigation Note below).

**Reasoning:** The established, precedented mechanism (added for `s1.1`'s kanban board-advance story) for seeding a real journey + real HTML session with a controllable `done` state, used by 6 real specs covering the kanban board surface (drag-to-advance, reorder, not-ready explanation, signals panel, shell wrapping). Its `productId` defaulting to a truthy string is correct and intentional for this surface (the board itself is product-scoped) — that is exactly the feature that makes it unsuitable for `seed-approval-journey`'s purpose, per entry 1 above. Not redundant with `seed-approval-journey`: the two endpoints exist specifically because one could not be substituted for the other.

**Investigation Note:** `ep2-s3-approval.spec.js`'s header comment references `seed-board-journey` only to document the investigation that led to building `seed-approval-journey` instead — the spec's test body itself calls only `seed-approval-journey` (confirmed by grep against the spec file).

### 3. `seed-ppc-s5-journey` (`src/web-ui/server.js:2852`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/ppc-s5-video-lazy-load.spec.js` (sole caller).

**Reasoning:** Seeds a journey that is already DoD-complete (via `completeStage('definition-of-done', ...)` plus a custom `setPgAdapterForTesting` stub serving fixed AC-coverage content), and optionally writes a real video + screenshot fixture file to disk. Purpose is narrow and specific: proving the video lazy-load / no-layout-shift behaviour of the playback-evidence page. No other spec needs a DoD-complete journey with a real on-disk video fixture.

### 4. `seed-actr-s2-journey` (`src/web-ui/server.js:2971`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/actr-s2-auto-resolve-live.spec.js` (sole caller).

**Reasoning:** The endpoint's own header comment (`server.js:2940-2970`) states it "mirrors `/test/seed-ppc-s5-journey` immediately above" — structurally the closest pair of the 5 — but it does three things `seed-ppc-s5-journey` does not: (1) creates a real `products` database row and links it via `repo_owner`/`repo_name`, (2) wires `playback-evidence.js`'s `setFetcherModule` test seam to serve seeded DoD content keyed by `featureSlug`, and (3) writes a real `test-plan.md` fixture directly onto the checkout's own `artefacts/` tree. These exist to drive a genuinely different code path — `_resolveAutoCaptureTarget`'s `storySlugs`-loop branch (via `pipelineStateStorySlugs`), not `ppc-s5`'s own video/screenshot capture-evidence path. Swapping in `seed-ppc-s5-journey` would not create a product row, wire the fetcher, or write a test-plan fixture, so `actr-s2-auto-resolve-live.spec.js` would fail. Not redundant.

### 5. `seed-journey-gate-session` (`src/web-ui/server.js:2431`)

**Verdict:** Legitimately different

**Callers:** `tests/e2e/wnl-s2-journey-gate-sticky.spec.js` (sole caller).

**Reasoning:** The only one of the 5 that does not create a real journey via `journey-store.js` at all — it seeds an HTML chat-session stub directly (via `_setHtmlSession`) with `session.done` and `session.journeyId` both set, parameterised on `skillName`/`turnCount` so the resulting page is taller than the viewport. Purpose is narrow: proving the journey-gate control's own sticky-scroll CSS behaviour on the chat page, unrelated to the kanban board, approval, or playback-evidence surfaces the other 4 endpoints serve. Distinct data shape (no real journey object at all) and distinct purpose.

## Closing statement

**No endpoint was found redundant with another — no further action required.** All 5 endpoints are legitimately different: each serves exactly one real E2E spec (or, for `seed-approval-journey`, a small family of specs sharing one real behavioural need), and the two structurally-closest pairs identified above (`seed-board-journey`/`seed-approval-journey`; `seed-ppc-s5-journey`/`seed-actr-s2-journey`) were each confirmed, by reading the real handler code and the real calling specs, to have a load-bearing difference that makes them genuinely not interchangeable. This closes the "13-endpoint sprawl" assumption's journey-related subset as investigated, not deferred.
