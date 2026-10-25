# Test Plan: Self-service video capture, combined across ACs where possible

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s5-video-capture.md
**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Test plan author:** Claude (session)
**Date:** 2026-10-26 (revised same day — combined-video redesign, see `decisions.md` 2026-10-26 DESIGN entry)
**Confirmed test runner:** `node scripts/run-all-tests.js` (via `npm test`) — plain Node.js `assert`-based tests discovered from `tests/check-*.js`, per `package.json`'s own `scripts.test` entry. No Jest, no other framework — confirmed by reading `package.json` and `scripts/run-all-tests.js` directly, not assumed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Single-AC trigger: video recorded alongside screenshot via extracted, `src/`-deployed `captureVideoRecording` | 1 test | 1 test | — | — | — | 🟢 |
| AC1-combined | Capture-all: ONE combined video spans every AC successfully screenshotted in the run, single recording context | 1 test | 2 tests | — | — | — | 🟢 |
| AC2 | Native `<video controls>` served through a new tenant-scoped route; "also covers" note when shared with other ACs | — | 4 tests | — | — | — | 🟢 |
| AC3 | Exposure bound identical to screenshot capture (same session-reuse mechanism) | 1 test | — | — | — | — | 🟢 |
| AC4 | A combined video's failure is tracked via `captureAllFailed` for every AC in the group; all-or-nothing for the group; never deletes a succeeded screenshot | — | 2 tests | — | — | — | 🟢 |
| AC5 | Partial/corrupt video cleaned up on mid-capture failure | 2 tests | — | — | — | — | 🟢 |
| AC6 | No video yet → screenshot-only/"not captured" state, no broken `<video>`, no console error | — | 2 tests | 1 test | — | — | 🟡 |
| AC7 | `preload="none"` + `poster` + explicit dimensions; no eager/duplicate download; no layout shift | 1 test | — | 1 test | — | CSS-layout-dependent | 🟡 |

---

## Coverage gaps

AC6's "no console error" clause and AC7's "no layout shift" clause cannot be verified in a DOM-simulation test — both require a real rendered browser. Per Step 3a of `/test-plan`, these are handled as E2E tests using this repo's already-configured Playwright framework (ADR-018), not manual-only — Playwright tooling exists repo-wide (`tests/e2e/dsa-s6-mobile-responsiveness.spec.js` is the direct precedent for the layout-shift/viewport check shape), so there is no E2E-tooling gap to accept. See the Gap table below.

---

## Test Data Strategy

**Source:** Mixed — mocked Playwright browser/context/page objects for capture-logic tests (mirroring `tests/check-rpca-s3-video-capture-wired-for-real.js`'s own established mocking pattern: `{ video: () => ({ path: async () => fixtureVideoPath }) }`), a fake Postgres pool + in-memory `journey-store._clearForTesting()` for route tests (the same pattern `ppc-s1`–`ppc-s4` already use), and real Playwright (headless) for the two E2E tests (AC6, AC7).
**PCI/sensitivity in scope:** No — all fixtures are synthetic, never real tenant data.
**Availability:** Available now — no external dependency.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-------------------|-------|
| AC1 | A fixture AC with a stored capture target `{url, selector}`; a mocked Playwright `browser`/`context`/`page` object whose `page.video().path()` resolves to a fixture `.webm` path | Fixture + mock | None | Mirrors `rpca-s3`'s own AC2 test shape |
| AC1-combined | A feature fixture with 3 captured ACs (3 stored targets, all screenshotted successfully) in one capture-all run; one mocked combined-video recording context | Fixture + mock | None | The clip's own `run()` callback must visit all 3 targets' URLs in sequence within one page |
| AC2 | A persisted `captureScreenshots`/video record for one or more ACs sharing the same video path, two tenant/product fixtures (positive + cross-tenant-denied case) | Fixture | None | Mirrors `ppc-s1`'s own `handleGetCaptureScreenshot` test fixtures |
| AC3 | A fake `req.sessionId`, assertion that the combined-capture helper reuses the SAME authenticated `browser` the screenshot loop already obtained | Fixture | None | Code-level/call-site assertion, not new auth plumbing |
| AC4 | `handlePostCaptureAll`'s existing fixture set, extended with a combined-video recording mocked to throw after the screenshot loop completes | Fixture | None | Extends `ppc-s2`'s own existing capture-all fixture |
| AC5 | A fixture `.webm` file pre-written to the expected path, a mocked `clip.run()` that throws mid-capture | Fixture + mock | None | Direct mirror of `rpca-s3`'s own AC3 test |
| AC6 | A journey/AC combination with no video record; the full rendered page under real Playwright for the console-error check | Fixture (Integration) + real render (E2E) | None | |
| AC7 | A feature fixture with 2+ ACs sharing one combined video rendered on one page, under real Playwright for the layout-shift/network-eagerness check | Fixture (Integration for attributes) + real render (E2E) | None | A shared video referenced by multiple `<video>` elements must not be fetched more than once — browser-level URL caching handles this, confirmed by `preload="none"` bounding the same way regardless of sharing |

### PCI / sensitivity constraints

None.

### Gaps

See Gap table below (AC6, AC7 — CSS-layout-dependent, handled via E2E, not manual-only).

---

## Unit Tests

### captureVideoRecording_extractedToSrc_producesDifferentCorrectPathsForDifferentClips

- **Verifies:** AC1
- **Precondition:** `captureVideoRecording` extracted into `src/utils/capture-video.js` (plain function, same shape as `capture-screenshots.js` — no new D37 adapter, see Background correction), called with the fake `browser`/`context`/`page` returned by a mocked `setSessionPageAdapter` (same seam `ppc-s1`'s own route tests already use for screenshots)
- **Action:** Call it with two different mocked clips (different `interactionSequenceText`/mock video paths)
- **Expected result:** Two different, individually-correct recorded video paths are returned — proves the extracted function's own real logic, not a hollow pass-through
- **Edge case:** No

### captureVideoForAcIds_combinedRun_visitsEveryAcsTargetInOneRecordingContext

- **Verifies:** AC1-combined
- **Precondition:** A shared `_captureVideoForAcIds(journey, acIds, ...)` helper (new, see Architecture Constraints), a mocked `browser.newContext` that is called exactly once regardless of `acIds.length`
- **Action:** Call the helper with 3 `acIds`, each with a stored target
- **Expected result:** `browser.newContext` is called exactly ONCE (not 3 times); the mocked page's `goto` is called 3 times, once per AC's own target URL, in order; a single video path is returned

### captureVideoForAcIds_sessionReuse_usesTheSameAuthenticatedBrowserAsScreenshotCapture

- **Verifies:** AC3
- **Precondition:** `getAuthenticatedPage` (from `session-page-adapter.js`) is spy-able; the screenshot loop already calls it once per request (not per AC) to get `authed.browser`/`authed.page`
- **Action:** Trigger capture-all for 3 ACs
- **Expected result:** `getAuthenticatedPage` is called exactly once for the whole request — the combined video capture reuses the same `authed.browser` the screenshot loop already obtained, it does not call `getAuthenticatedPage` a second time or seed a second, independent session
- **Edge case:** No

### videoCapture_midFailure_leavesNoPartialFileOnDisk

- **Verifies:** AC5
- **Precondition:** A fixture partial `.webm` file written to the expected path before the simulated failure, mocked Playwright `page.video().path()` resolving to it, `clip.run()` throws
- **Action:** Call the extracted `captureVideoRecording` wrapper used by this route
- **Expected result:** The original error propagates unmasked; the partial file no longer exists on disk afterward
- **Edge case:** Direct mirror of `rpca-s3`'s own AC3 test, adapted to the simpler (non-caption-bundled) `captureVideoRecording` path

### videoCapture_midFailure_doesNotDeleteAnAlreadySucceededScreenshotForTheSameAc

- **Verifies:** AC5 (negative-boundary companion to the above)
- **Precondition:** A persisted screenshot record already exists for the same AC; video capture then fails
- **Action:** Same as above
- **Expected result:** The existing screenshot record/file is untouched — only the partial video file is removed

### videoElement_attributes_usePreloadNoneAndPosterAndExplicitDimensions

- **Verifies:** AC7 (attribute-presence half — DOM-testable)
- **Precondition:** A render-function unit test, fixture AC with a captured video
- **Action:** Call the render function that produces the `<video>` markup
- **Expected result:** Output string contains `preload="none"`, a `poster="..."` attribute, and explicit `width`/`height` attributes on the `<video>` tag

---

## Integration Tests

### handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc

- **Verifies:** AC1
- **Components involved:** Route handler, `setSessionPageAdapter` mocked to return a fake `browser`/`context`/`page` (same seam `ppc-s1`'s own route tests already use for screenshots — `captureVideoRecording` itself is not module-mocked, its real logic runs against the fake Playwright objects)
- **Precondition:** A stored capture target for a video-enabled AC
- **Action:** Trigger single-AC capture for that AC
- **Expected result:** Both a screenshot record AND a video record are persisted for the AC (a combined-video group of one)

### handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc

- **Verifies:** AC1-combined
- **Components involved:** `handlePostCaptureAll`, the new shared `_captureVideoForAcIds` helper, `setSessionPageAdapter` mocked once
- **Precondition:** A feature with 3 ACs, all with stored targets, all screenshot successfully
- **Action:** Trigger capture-all
- **Expected result:** `journey.captureVideos` has the SAME video path for all 3 `acId` keys; the mocked `browser.newContext` was called exactly once for the whole run (not 3 times)

### handlePostCaptureAll_combinedVideo_onlyCoversAcsThatScreenshottedSuccessfully

- **Verifies:** AC1-combined (boundary — a screenshot failure excludes that AC from the video group)
- **Components involved:** Same, one of 3 ACs' screenshot mocked to fail
- **Precondition:** Same, but AC2's `page.screenshot` throws
- **Action:** Trigger capture-all
- **Expected result:** The combined video's `run()` callback visits only AC1 and AC3's own target URLs (2 navigations, not 3); `journey.captureVideos` has entries for AC1 and AC3 only

### handleGetCaptureVideo_servesVideo_tenantProductAcidGuarded

- **Verifies:** AC2
- **Components involved:** New tenant-scoped video-serving route, fake pool, `journey-store`
- **Precondition:** A persisted video record for tenant A/product A/AC1
- **Action:** Tenant A requests the video via the new route
- **Expected result:** 200, correct video content-type/body

### handleGetCaptureVideo_crossTenantRequest_isDenied

- **Verifies:** AC2 (ADR-025 regression guard, mirrors `ppc-s1`'s own screenshot cross-tenant test)
- **Components involved:** Same, tenant B attempts tenant A's video
- **Precondition:** Same fixture
- **Action:** Tenant B requests tenant A's video path
- **Expected result:** 403/404 (not the video content), consistent with `handleGetCaptureScreenshot`'s own existing denial behaviour

### handleGetCaptureVideo_neverServedFromUntenantedPlaybackMediaRoute

- **Verifies:** AC2 (negative — confirms the new route, not the existing untenanted `/playback-media/` route, is used)
- **Components involved:** Render-function output
- **Precondition:** Fixture AC with a video
- **Action:** Inspect the rendered `<video src="...">` attribute
- **Expected result:** The `src` path matches the new tenant-scoped route's own URL pattern, never `/playback-media/...`

### renderEvidencePage_combinedVideo_showsAlsoCoversNoteNamingOtherAcs

- **Verifies:** AC2 (the "also covers" note clause)
- **Components involved:** Render function, fixture with 3 ACs sharing the SAME `videoPath`
- **Precondition:** `journey.captureVideos` has the same path for AC1/AC2/AC3
- **Action:** Render the page
- **Expected result:** AC1's own section shows a note naming AC2 and AC3 as also covered (and vice versa for each); an AC whose video is NOT shared with any other AC shows no such note

### handlePostCaptureAll_combinedVideoFailure_trackedForEveryAcInTheGroup_screenshotsUnaffected

- **Verifies:** AC4
- **Components involved:** `handlePostCaptureAll`, `_captureVideoForAcIds` mocked to throw after the screenshot loop succeeds for 3 ACs
- **Precondition:** A feature with 3 ACs, all screenshot successfully; the combined video recording then throws
- **Action:** Trigger capture-all
- **Expected result:** All 3 ACs still show `captured` with their own screenshot path; `captureAllFailed` has an entry for ALL 3 ACs (not just one), each tagged `videoOnly: true`; no screenshot record is deleted or altered

### handlePostCaptureAll_combinedVideoFailure_isAllOrNothingForTheGroup_notPartial

- **Verifies:** AC4 (direct AC text: "all-or-nothing for the video group")
- **Components involved:** Same
- **Precondition:** Same fixture
- **Action:** Same trigger
- **Expected result:** There is no AC in the group that ends up with a video while others in the same group do not — the failure (or success) of the ONE combined recording applies identically to every AC in it

### renderEvidencePage_noVideoYet_showsScreenshotOnlyState_noVideoTagEmitted

- **Verifies:** AC6
- **Components involved:** Render function, fixture AC with a screenshot but no video record
- **Precondition:** None
- **Action:** Render the page
- **Expected result:** Output contains the existing screenshot-only/"not captured" state; output string does NOT contain a `<video` tag for that AC

### renderEvidencePage_mixedVideoAndNoVideoAcs_rendersBothStatesCorrectly

- **Verifies:** AC6 (mixed-state regression guard)
- **Components involved:** Same, feature fixture with 2 ACs — one with video, one without
- **Precondition:** None
- **Action:** Render the page
- **Expected result:** The video-enabled AC renders a `<video>` element; the other AC renders screenshot-only/"not captured", with no cross-contamination between the two

---

## E2E Tests

### video_pageLoad_doesNotEagerlyDownloadAnyClip_noConsoleError

- **Verifies:** AC6 (console-error clause), AC7 (eager-download clause)
- **File:** `tests/e2e/ppc-s5-video-lazy-load.spec.js` (new)
- **Precondition:** A seeded tenant/product/feature fixture with 3 ACs sharing one combined video (mirrors `dsa-s6-mobile-responsiveness.spec.js`'s own `/test/session?sessionId=...&tenantId=...` seeding pattern)
- **Action:** Navigate to the capture-evidence page; capture console messages via Playwright's `page.on('console', ...)`; capture network requests via `page.on('request', ...)`
- **Expected result:** No console error events fired; no network request for the video file's own media bytes occurs before user interaction (consistent with `preload="none"`) — and since all 3 `<video>` elements point at the SAME URL, at most one such request would ever occur even after interaction, not three

### video_viewportNarrowed_noLayoutShift

- **Verifies:** AC7 (layout-shift clause)
- **File:** Same spec file as above, second test
- **Precondition:** Same fixture
- **Action:** Load the page at desktop width, record each video element's `getBoundingClientRect()`, then reload/resize and compare
- **Expected result:** No unexpected shift in surrounding element positions attributable to video loading (e.g. `document.body.scrollWidth` does not exceed viewport width before/after; existing screenshot `<img>` elements' positions are unaffected) — mirrors `DESIGN.md`'s own "Verification bar" convention (real viewport-width check, not DOM-presence alone)

---

## NFR Tests

### videoInclusiveCaptureAll_realDurationMeasured_thresholdConfirmedOrRevised

- **NFR addressed:** Performance (video-inclusive capture-all duration)
- **Measurement method:** Real wall-clock measurement during implementation, recorded as DoD evidence (per the story's own NFR — "must measure real video-inclusive duration... as part of implementation, not assumed either way up front"). This measurement now reflects ONE combined recording context per run, not N — expected to be materially faster than a naive per-AC design would have been.
- **Pass threshold:** Not a fixed threshold yet — this NFR test's job is to produce the real number, not assert against a guessed one
- **Tool:** Manual timing during `/verify-completion`, same as `ppc-s2`'s own AC3/AC4 precedent

### videoPageRender_noEagerDownload_boundedByPreloadNone

- **NFR addressed:** Performance (page-render load, distinct from capture-time — this story's own AC7)
- **Measurement method:** Same as the E2E test above (network request assertion)
- **Pass threshold:** Zero video-byte network requests before interaction
- **Tool:** Playwright (`page.on('request', ...)`)

### videoCapture_noNewExposureSurface_sameSessionBoundAsScreenshot

- **NFR addressed:** Security (AC3)
- **Measurement method:** Code-level assertion (the Unit test `captureVideoForAcIds_sessionReuse_...` above is also the NFR evidence)
- **Pass threshold:** Same authenticated `browser` reference used, no new auth path introduced
- **Tool:** Node `assert`

---

## Out of Scope for This Test Plan

- Real end-to-end video capture against a live staging/production tenant (same class of gap `ppc-s1`'s/`ppc-s2`'s own DoDs already recorded as a Follow-up Action) — tracked as this story's own Follow-up Action at DoD time.
- Captions/transcript testing — not built by this story (see `decisions.md` 2026-10-25 DESIGN entry).
- Per-AC timestamp seeking within a combined video — not built by this story (see `decisions.md` 2026-10-26 DESIGN entry); no test coverage needed for a capability that doesn't exist yet.

---

## Test Gaps and Risks

| Gap | Gap type | Reason | Mitigation |
|-----|----------|--------|-------------|
| AC6's "no console error" and AC7's "no layout shift"/"no eager download" clauses cannot be verified by a DOM-simulation test | CSS-layout-dependent | jsdom does not compute real layout, fire real network requests on `preload`, or surface real console errors from a rendered page | Handled via 2 new Playwright E2E tests (`tests/e2e/ppc-s5-video-lazy-load.spec.js`), not manual-only — E2E tooling is already configured repo-wide (ADR-018), so no RISK-ACCEPT is needed for tooling absence |
| No live staging/production verification yet | Not layout-dependent — environment availability | No test tenant with a connected repo was available this session | Follow-up Action at DoD, matching `ppc-s1`/`ppc-s2`'s own precedent |
