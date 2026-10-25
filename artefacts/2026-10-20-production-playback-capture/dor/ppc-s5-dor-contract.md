# DoR Contract Proposal: Self-service video capture per AC

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s5-video-capture.md
**Test plan reference:** artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s5-test-plan.md
**Date:** 2026-10-26

---

## What will be built

- `src/utils/capture-video.js` (new) — `captureVideoRecording({ browser, featureSlug, storySlug, clips })`, extracted from `scripts/playback-capture.js`, a plain function (same shape as the existing `src/utils/capture-screenshots.js` — not a D37 adapter; see Background correction in the story itself). Internally opens a new context/page from the given `browser`, records, and cleans up a partial file on failure (mirrors `tests/check-rpca-s3-video-capture-wired-for-real.js`'s own established cleanup behaviour, adapted to the simpler non-caption-bundled path).
- `src/web-ui/routes/playback-evidence.js` (modified):
  - `_captureOneAc`/`handlePostCaptureAll` call `captureVideoRecording` using the SAME `authed.browser` already obtained via `getAuthenticatedPage` for the screenshot (AC3 — no second session, no new auth path)
  - New `handleGetCaptureVideo` route, tenant+product+`ACID_RE`-guarded, mirroring `handleGetCaptureScreenshot`'s own existing pattern (AC2)
  - `<video controls preload="none" poster="..." width="..." height="...">` render fragment (AC2, AC7)
  - `captureAllFailed` extended to track per-AC video failures without deleting an already-succeeded screenshot (AC4)
- `src/web-ui/adapters/journey-store-pg.js` (modified) — add `captureVideos` to `_sanitise()`'s allowlist (fdn-s1 rule), mirroring the existing `captureScreenshots` field
- `tests/check-ppc-s5-video-capture.js` (new) — 17 unit/integration tests
- `tests/e2e/ppc-s5-video-lazy-load.spec.js` (new) — 2 E2E tests (AC6 console-error clause, AC7 eager-download/layout-shift clause)

## What will NOT be built

- No change to `src/web-ui/adapters/session-page-adapter.js` — the existing, already-wired `setSessionPageAdapter` D37 adapter is reused exactly as-is, no new wiring.
- No change to `src/utils/capture-screenshots.js` — screenshot capture is unaffected.
- No captions/transcript generation (`generateCaptionsAndTranscript` is not wired or called) — see `decisions.md` 2026-10-25 DESIGN entry.
- No change to `/playback`'s own route (`playback.js`) — this story only touches `ppc`'s own capture-evidence page.
- No redesign of the evidence-display card/component styling — the `<video>` element matches the existing `<img>` screenshot's own current inline-style convention exactly (see `decisions.md` 2026-10-26 RISK-ACCEPT entry).

## How each AC will be verified

| AC | Test approach | Type |
|----|---------------|------|
| AC1 | Mocked `setSessionPageAdapter` returning fake `browser`/`context`/`page`; assert both screenshot and video records persisted | Integration |
| AC2 | Route test for the new tenant-scoped video route (positive + cross-tenant-denied); render-function string-fragment assertion for `<video>` markup | Integration |
| AC3 | Spy on `getAuthenticatedPage` call count — exactly once per AC, not twice | Unit |
| AC4 | Extended `handlePostCaptureAll` fixture with one AC's video mocked to throw | Integration |
| AC5 | Mocked Playwright page/video object, forced mid-capture failure, assert partial file deleted | Unit (direct mirror of `rpca-s3`'s own AC3 test) |
| AC6 | Render-function test (no `<video>` tag emitted) + Playwright E2E (no console error) | Integration + E2E |
| AC7 | Render-function attribute assertion + Playwright E2E (network/layout-shift check) | Unit + E2E |

## Assumptions

- `captureVideoRecording`'s internal context-creation (from the given `browser`) inherits the same session cookie the outer `getAuthenticatedPage` call already seeded at the browser-context level — this is an implementation detail for `/implementation-plan` to confirm against real Playwright context/cookie-scoping behaviour, not re-litigated at DoR.
- The real video-inclusive capture-all duration (Performance NFR) is unknown until implementation measures it — the test plan's own NFR test produces the number, it doesn't assert against a guessed threshold.

## Estimated touch points

**Files:** `src/utils/capture-video.js` (new), `src/web-ui/routes/playback-evidence.js`, `src/web-ui/adapters/journey-store-pg.js`, `tests/check-ppc-s5-video-capture.js` (new), `tests/e2e/ppc-s5-video-lazy-load.spec.js` (new)
**Services:** None (no external service call introduced)
**APIs:** New internal route `GET /products/:id/playback-evidence/:featureSlug/video/:acId` (or equivalent path, mirroring `handleGetCaptureScreenshot`'s own URL shape)

**Do not modify:** `src/web-ui/adapters/session-page-adapter.js`, `src/utils/capture-screenshots.js`, `src/web-ui/routes/playback.js`, `src/web-ui/utils/html-shell.js`, `src/web-ui/routes/products.js`

**schemaDepends:** `[]` — this story's dependency on `ppc-s1`/`ppc-s2` is on their shipped code path (`_captureOneAc`, `handlePostCaptureAll`, `getAuthenticatedPage`), not on a specific `pipeline-state.schema.json` field. No cross-story pipeline-state field dependency to declare.
