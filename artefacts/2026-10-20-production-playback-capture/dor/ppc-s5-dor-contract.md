# DoR Contract Proposal: Self-service video capture, combined across ACs where possible

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s5-video-capture.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s5-test-plan.md
**Date:** 2026-10-26 (revised same day — combined-video redesign before Task 1 started, see `decisions.md` 2026-10-26 DESIGN entry)

---

## What will be built

- `src/utils/capture-video.js` (new) — `captureVideoRecording({ browser, featureSlug, storySlug, clips })`, extracted from `scripts/playback-capture.js`, a plain function (same shape as the existing `src/utils/capture-screenshots.js` — not a D37 adapter; see Background correction in the story itself). Internally opens a new context/page from the given `browser`, records, and cleans up a partial file on failure (mirrors `tests/check-rpca-s3-video-capture-wired-for-real.js`'s own established cleanup behaviour, adapted to the simpler non-caption-bundled path).
- `src/web-ui/routes/playback-evidence.js` (modified):
  - New shared `_captureVideoForAcIds(journey, acIds, ownerRepo, req, browser, baseUrl)` helper — runs ONCE per capture-trigger request (after the existing screenshot loop/single-screenshot capture completes), recording ONE combined video in a single Playwright recording context whose `run()` callback visits every `acId`'s own target URL in sequence (AC1-combined). `_captureOneAc` itself stays screenshot-only, unchanged from `ppc-s1`/`ppc-s2`'s own existing shape.
  - `handlePostCaptureTrigger` calls the helper with a one-element `acIds` array (a combined-video group of one) (AC1)
  - `handlePostCaptureAll` calls the helper once with every `acId` that screenshotted successfully in that run, after its existing loop completes; associates the SAME resulting video path with every `acId` in the group (AC1-combined); on failure, tags every `acId` in the group via the existing `captureAllFailed` mechanism (AC4)
  - New `handleGetCaptureVideo` route, tenant+product+`ACID_RE`-guarded, mirroring `handleGetCaptureScreenshot`'s own existing pattern (AC2)
  - `<video controls preload="none" poster="..." width="..." height="...">` render fragment, plus an "also covers" note when a video is shared across multiple ACs (AC2, AC7)
- `src/web-ui/adapters/journey-store-pg.js` (modified) — add `captureVideos` to `_sanitise()`'s allowlist (fdn-s1 rule), mirroring the existing `captureScreenshots` field
- `tests/check-ppc-s5-video-capture.js` (new) — 22 unit/integration tests
- `tests/e2e/ppc-s5-video-lazy-load.spec.js` (new) — 2 E2E tests (AC6 console-error clause, AC7 eager-download/layout-shift clause)

## What will NOT be built

- No change to `src/web-ui/adapters/session-page-adapter.js` — the existing, already-wired `setSessionPageAdapter` D37 adapter is reused exactly as-is, no new wiring.
- No change to `src/utils/capture-screenshots.js` — screenshot capture is unaffected.
- No captions/transcript generation (`generateCaptionsAndTranscript` is not wired or called) — see `decisions.md` 2026-10-25 DESIGN entry.
- No change to `/playback`'s own route (`playback.js`) — this story only touches `ppc`'s own capture-evidence page.
- No redesign of the evidence-display card/component styling — the `<video>` element matches the existing `<img>` screenshot's own current inline-style convention exactly (see `decisions.md` 2026-10-26 RISK-ACCEPT entry).
- No per-AC timestamp seeking within a combined video — named, planned fast-follow (see `decisions.md` 2026-10-26 DESIGN entry); this story's combined video plays from the start only.
- No UI for manually choosing a custom grouping of ACs into one video — the group is always exactly "whichever ACs were screenshotted together in one capture-all run."

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked `setSessionPageAdapter` returning fake `browser`/`context`/`page`; assert both screenshot and video records persisted for a single-AC trigger | Integration |
| AC1-combined | `handlePostCaptureAll` fixture with 3 ACs; assert `browser.newContext` called exactly once (not 3 times) and the SAME video path is recorded against all 3 `acId`s | Unit + Integration |
| AC2 | Route test for the new tenant-scoped video route (positive + cross-tenant-denied); render-function string-fragment assertion for `<video>` markup and the "also covers" note | Integration |
| AC3 | Spy on `getAuthenticatedPage` call count — exactly once per request, not once per AC | Unit |
| AC4 | Extended `handlePostCaptureAll` fixture with the combined video mocked to throw after the screenshot loop succeeds; assert every AC in the group is tagged in `captureAllFailed` | Integration |
| AC5 | Mocked Playwright page/video object, forced mid-capture failure, assert partial file deleted | Unit (direct mirror of `rpca-s3`'s own AC3 test) |
| AC6 | Render-function test (no `<video>` tag emitted) + Playwright E2E (no console error) | Integration + E2E |
| AC7 | Render-function attribute assertion + Playwright E2E (network/layout-shift check) | Unit + E2E |

## Assumptions

- `captureVideoRecording`'s internal context-creation (from the given `browser`) inherits the same session cookie the outer `getAuthenticatedPage` call already seeded at the browser-context level — this is an implementation detail for `/implementation-plan` to confirm against real Playwright context/cookie-scoping behaviour, not re-litigated at DoR. (Confirmed false at `/implementation-plan` — the clip's own `run()` callback must re-seed the cookie via `page.context().addCookies()`; this is reflected in the plan, not the DoR contract, since it's an implementation detail, not an AC-level constraint.)
- The real video-inclusive capture-all duration (Performance NFR) is unknown until implementation measures it — the test plan's own NFR test produces the number, it doesn't assert against a guessed threshold. Expected to be materially lower than a naive per-AC design, since this design uses one recording context per run, not one per AC.
- "Capturing ACs together in one run" is the only grouping mechanism (no manual grouping UI) — a PO who wants two specific ACs combined simply triggers "Capture all" (or captures them together in whatever subset the existing capture-all mechanism processes) rather than capturing them individually.

## Estimated touch points

**Files:** `src/utils/capture-video.js` (new), `src/web-ui/routes/playback-evidence.js`, `src/web-ui/adapters/journey-store-pg.js`, `src/web-ui/server.js`, `tests/check-ppc-s5-video-capture.js` (new), `tests/e2e/ppc-s5-video-lazy-load.spec.js` (new)
**Services:** None (no external service call introduced)
**APIs:** New internal route `GET /products/:id/playback-evidence/:featureSlug/video/:acId` (or equivalent path, mirroring `handleGetCaptureScreenshot`'s own URL shape)

**Amendment (2026-10-26, `/implementation-plan`):** `src/web-ui/server.js` was missing from the original touch-point list. Confirmed by direct inspection: this repo's raw-http server has an explicit regex-matched route dispatch table (no framework router), and every new route handler — including `handleGetCaptureScreenshot`'s own existing registration at line 3349-3355 — requires its own `else if (pathname.match(...))` block there. The new video-serving route needs an identical registration. `node scripts/check-design-tokens.js src/web-ui/server.js` — PASS, no non-token colors.

**Do not modify:** `src/web-ui/adapters/session-page-adapter.js`, `src/utils/capture-screenshots.js`, `src/web-ui/routes/playback.js`, `src/web-ui/utils/html-shell.js`, `src/web-ui/routes/products.js`

**schemaDepends:** `[]` — this story's dependency on `ppc-s1`/`ppc-s2` is on their shipped code path (`_captureOneAc`, `handlePostCaptureAll`, `getAuthenticatedPage`), not on a specific `pipeline-state.schema.json` field. No cross-story pipeline-state field dependency to declare.
