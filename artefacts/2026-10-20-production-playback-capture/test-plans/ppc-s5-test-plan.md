# Test Plan: Self-service video capture per AC

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s5-video-capture.md
**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Test plan author:** Claude (session)
**Date:** 2026-10-26
**Confirmed test runner:** `node scripts/run-all-tests.js` (via `npm test`) — plain Node.js `assert`-based tests discovered from `tests/check-*.js`, per `package.json`'s own `scripts.test` entry. No Jest, no other framework — confirmed by reading `package.json` and `scripts/run-all-tests.js` directly, not assumed.

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Video recorded alongside screenshot via extracted, `src/`-deployed `captureVideoRecording` | 1 test | 2 tests | — | — | — | 🟢 |
| AC2 | Native `<video controls>` served through a new tenant-scoped route mirroring `handleGetCaptureScreenshot` | — | 3 tests | — | — | — | 🟢 |
| AC3 | Exposure bound identical to screenshot capture (same session-reuse mechanism) | 1 test | — | — | — | — | 🟢 |
| AC4 | Video included in `handlePostCaptureAll`'s loop; per-AC failure tracked, doesn't abort run or delete a succeeded screenshot | — | 2 tests | — | — | — | 🟢 |
| AC5 | Partial/corrupt video cleaned up on mid-capture failure | 2 tests | — | — | — | — | 🟢 |
| AC6 | No video yet → screenshot-only/"not captured" state, no broken `<video>`, no console error | — | 2 tests | 1 test | — | — | 🟡 |
| AC7 | `preload="none"` + `poster` + explicit dimensions; no eager download; no layout shift | 1 test | — | 1 test | — | CSS-layout-dependent | 🟡 |

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
| AC2 | A persisted `captureScreenshots`/video record for one AC, two tenant/product fixtures (positive + cross-tenant-denied case) | Fixture | None | Mirrors `ppc-s1`'s own `handleGetCaptureScreenshot` test fixtures |
| AC3 | A fake `req.sessionId`, assertion that the same session-seeding helper (`_captureOneAc`'s own cookie-seeding call) is reused, not duplicated | Fixture | None | Code-level/call-site assertion, not new auth plumbing |
| AC4 | `handlePostCaptureAll`'s existing fixture set, extended with one video-enabled AC whose mocked video capture throws | Fixture | None | Extends `ppc-s2`'s own existing capture-all fixture |
| AC5 | A fixture `.webm` file pre-written to the expected path, a mocked `clip.run()` that throws mid-capture | Fixture + mock | None | Direct mirror of `rpca-s3`'s own AC3 test |
| AC6 | A journey/AC combination with no video record; the full rendered page under real Playwright for the console-error check | Fixture (Integration) + real render (E2E) | None | |
| AC7 | A feature fixture with 2+ video-enabled ACs rendered on one page, under real Playwright for the layout-shift/network-eagerness check | Fixture (Integration for attributes) + real render (E2E) | None | |

### PCI / sensitivity constraints

None.

### Gaps

See Gap table below (AC6, AC7 — CSS-layout-dependent, handled via E2E, not manual-only).

---

## Unit Tests

### captureVideoRecording_extractedToSrc_isWiredBehaviorallyCorrect

- **Verifies:** AC1 (D37 wiring correctness — CLAUDE.md's rule: assert an observable, differentiating outcome, not just that a reference was assigned)
- **Precondition:** `captureVideoRecording` extracted into `src/` and wired via an injectable setter in `playback-evidence.js`, mirroring `ppc-s1`'s own Task 0 extraction of `captureAcScreenshots`
- **Action:** Call the wired adapter with two different mocked clips (different `interactionSequenceText`/mock video paths)
- **Expected result:** Two different, individually-correct recorded video paths are returned — not merely that the setter was called once
- **Edge case:** No

### captureVideoRecording_sessionReuse_callsSameCookieSeedingHelperAs_captureOneAc

- **Verifies:** AC3
- **Precondition:** `_captureOneAc`'s existing cookie-seeding helper is exported/spy-able
- **Action:** Trigger video capture for an AC
- **Expected result:** The same cookie-seeding helper function reference is called (same identity, not a re-implementation) — proven via a source-level/reference-identity assertion, mirroring `s3.1`'s own `dragAndClickShareTheSameAdvanceAndErrorFunctions` precedent for proving shared-mechanism reuse
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

### handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forVideoEnabledAc

- **Verifies:** AC1
- **Components involved:** Route handler, injected (mocked) `captureVideoRecording` (mirroring `ppc-s1`'s own `captureAcScreenshots` injection convention)
- **Precondition:** A stored capture target for a video-enabled AC
- **Action:** Trigger capture for that AC
- **Expected result:** Both a screenshot record AND a video record are persisted for the AC; the mocked `captureVideoRecording` call receives the same `{url, selector}` the screenshot capture used

### handlePostCaptureTrigger_videoEnabled_usesExtractedSrcVersion_notScriptsVersion

- **Verifies:** AC1 (deployment-boundary regression guard)
- **Components involved:** Route handler module resolution
- **Precondition:** None
- **Action:** Static/source-level assertion that `playback-evidence.js` requires `captureVideoRecording` from a `src/` path, never from `scripts/`
- **Expected result:** Import path resolves under `src/`; mirrors `ppc-s1`'s own Task 0 regression guard for `captureAcScreenshots`

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

### handlePostCaptureAll_includesVideoInTheSameLoop_oneAcVideoFailureDoesNotAbortRun

- **Verifies:** AC4
- **Components involved:** `handlePostCaptureAll`, mocked `captureVideoRecording` (one AC's mock rejects, others resolve)
- **Precondition:** A feature with 3 video-enabled ACs, one mocked to throw
- **Action:** Trigger capture-all
- **Expected result:** The run completes for all 3 ACs; the failing AC is recorded in `captureAllFailed`; the other 2 ACs' video AND screenshot records are both present

### handlePostCaptureAll_videoFailure_doesNotDeleteTheSameAcsAlreadySucceededScreenshot

- **Verifies:** AC4 (direct AC text: "does not delete a screenshot that already succeeded for the same AC")
- **Components involved:** Same
- **Precondition:** Same fixture, inspect the failing AC's own screenshot record specifically
- **Action:** Same trigger
- **Expected result:** The failing AC's screenshot record (captured earlier in the same loop iteration) is still present after its video capture fails

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

### ppc-s6-dashboard... (not applicable here — see ppc-s6's own test plan)

### video_pageLoad_doesNotEagerlyDownloadAnyClip_noConsoleError

- **Verifies:** AC6 (console-error clause), AC7 (eager-download clause)
- **File:** `tests/e2e/ppc-s5-video-lazy-load.spec.js` (new)
- **Precondition:** A seeded tenant/product/feature fixture with 3 video-enabled ACs (mirrors `dsa-s6-mobile-responsiveness.spec.js`'s own `/test/session?sessionId=...&tenantId=...` seeding pattern)
- **Action:** Navigate to the capture-evidence page; capture console messages via Playwright's `page.on('console', ...)`; capture network requests via `page.on('request', ...)`
- **Expected result:** No console error events fired; no network request for any video file's own media bytes occurs before user interaction (consistent with `preload="none"`)

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
- **Measurement method:** Real wall-clock measurement during implementation, recorded as DoD evidence (per the story's own NFR — "must measure real video-inclusive duration... as part of implementation, not assumed either way up front")
- **Pass threshold:** Not a fixed threshold yet — this NFR test's job is to produce the real number, not assert against a guessed one
- **Tool:** Manual timing during `/verify-completion`, same as `ppc-s2`'s own AC3/AC4 precedent

### videoPageRender_noEagerDownload_boundedByPreloadNone

- **NFR addressed:** Performance (page-render load, distinct from capture-time — this story's own AC7)
- **Measurement method:** Same as the E2E test above (network request assertion)
- **Pass threshold:** Zero video-byte network requests before interaction
- **Tool:** Playwright (`page.on('request', ...)`)

### videoCapture_noNewExposureSurface_sameSessionBoundAsScreenshot

- **NFR addressed:** Security (AC3)
- **Measurement method:** Code-level assertion (the Unit test `captureVideoRecording_sessionReuse_...` above is also the NFR evidence)
- **Pass threshold:** Same cookie-seeding helper function reference used, no new auth path introduced
- **Tool:** Node `assert`

---

## Out of Scope for This Test Plan

- Real end-to-end video capture against a live staging/production tenant (same class of gap `ppc-s1`'s/`ppc-s2`'s own DoDs already recorded as a Follow-up Action) — tracked as this story's own Follow-up Action at DoD time.
- Captions/transcript testing — not built by this story (see `decisions.md` 2026-10-25 DESIGN entry).

---

## Test Gaps and Risks

| Gap | Gap type | Reason | Mitigation |
|-----|----------|--------|-------------|
| AC6's "no console error" and AC7's "no layout shift"/"no eager download" clauses cannot be verified by a DOM-simulation test | CSS-layout-dependent | jsdom does not compute real layout, fire real network requests on `preload`, or surface real console errors from a rendered page | Handled via 2 new Playwright E2E tests (`tests/e2e/ppc-s5-video-lazy-load.spec.js`), not manual-only — E2E tooling is already configured repo-wide (ADR-018), so no RISK-ACCEPT is needed for tooling absence |
| No live staging/production verification yet | Not layout-dependent — environment availability | No test tenant with a connected repo was available this session | Follow-up Action at DoD, matching `ppc-s1`/`ppc-s2`'s own precedent |
