# Playback Walkthrough: 2026-10-20-production-playback-capture

<!-- story: ppc-s1 -->
## AC1 — AC1

`handleGetPlaybackEvidence` resolves via `getJourneyByTenantProductSlug` (tenant_id + product_id, never the unscoped `getJourneyByFeatureSlug`); `isDodComplete` gates the list.

<!-- story: ppc-s1 -->
## AC2 — AC2

`handlePostCaptureTarget` → `setCaptureTarget`, CSRF-guarded, round-trip-through-read-path tested, crafted-`acId` rejection tested.

<!-- story: ppc-s1 -->
## AC3 — AC3

`handlePostCaptureTrigger` seeds the Playwright cookie from `req.sessionId`, navigates, captures, commits via `commitArtefact`.

<!-- story: ppc-s1 -->
## AC4 — AC4

"Capture target not set" literal text, `targetSet: false`.

<!-- story: ppc-s1 -->
## AC5 — AC5

`handleGetCaptureScreenshot` (new, tenant-scoped, not `/playback-media/`) serves the real file; `<img>` tag points at it.

<!-- story: ppc-s1 -->
## AC6 — AC6

Real `feature_slug` collision between two tenants: each sees only its own capture target/screenshot, full-body string search confirms no leak.

<!-- story: ppc-s1 -->
## AC7 — AC7

Guessed URL to a real other tenant's feature → 404, `{error:'not found'}` exactly, no slug/secret leak; mismatched tenant+product pair also tested with the same full-body/exact-shape assertions.

<!-- story: ppc-s1 -->
## AC8 — AC8

New D37 adapter: throwing stub until wired (`0327e984`), wired as a separate commit (`90817c69`), behavioural wiring test proves two sessions produce two distinct, correctly-isolated pages (fake chromium, real cookie-seeding logic).

<!-- story: ppc-s2 -->
## AC1 — AC1

`handlePostCaptureAll`'s sequential loop reuses `_captureOneAc` (the same single-AC mechanism `ppc-s1` established) across every AC returned by `buildCaptureAllList`, using one authenticated page for the whole run.

<!-- story: ppc-s2 -->
## AC2 — AC2

`capture-all-lock.js` rejects a second `tryAcquireLock` while one is held (real, unmocked lock module); `_renderCaptureAllProgress` emits `aria-live="polite"` progress markup; wiring tests confirm the button/progress markup toggle correctly when a lock is/isn't held.

<!-- story: ppc-s2 -->
## AC3 — AC3

`measureCaptureDuration` is called with real, unmocked `Date.now()` values around the real capture loop (test plan's own integration test asserts a positive, non-hardcoded duration); `captureAllDuration`/`captureAllCompletedAt` are persisted.

<!-- story: ppc-s2 -->
## AC4 — AC4

`checkTimingThreshold` correctly flags `>60000ms` (strictly greater-than, boundary-tested) without failing the run; `decisionsLogWriter.appendScopeNote` is called with a SCOPE-note payload when the threshold is exceeded, using `fetchRepoPath`/`realCommitArtefact` against the tenant's own connected repo.

<!-- story: ppc-s2 -->
## AC5 — AC5

A mid-loop capture failure is caught per-AC (`try`/`catch` inside the loop) and does not abort the run; `captured`/`failed` arrays are independent; `captureAllFailed` persists the failure keyed by `acId` and is cleared on a successful retry.

<!-- story: ppc-s2 -->
## AC6 — AC6

`buildCaptureAllList` returns untargeted ACs in a separate `skipped` list with a named reason (`"no capture target set"`); the JSON API response (non-form callers) returns this list verbatim.

<!-- story: ppc-s3 -->
## AC1 — AC1

`tests/check-ppc-s3-capture-rate-limit.js`: "the second trigger within 60s is rejected with a clear rate-limit message" and the cross-endpoint test "the rate-limit bucket is shared across single-AC capture and capture-all -- triggering one blocks the other for the same user"

<!-- story: ppc-s3 -->
## AC2 — AC2

`tests/check-ppc-s3-capture-rate-limit.js`: "two different Product Owners in the same tenant are rate-limited independently -- user B is never blocked by user A's usage"

<!-- story: ppc-s3 -->
## AC3 — AC3

`tests/check-ppc-s3-capture-rate-limit.js`: window-expiry test, real `Date.now` monkeypatch with `finally`-restore (not skipped, not mocked-only)

<!-- story: ppc-s3 -->
## NFR-Accessibility — NFR-Accessibility

Unit tests confirm `role="alert"` HTML for form submissions and a parsed JSON error body for API callers (`tests/check-ppc-s3-capture-rate-limit.js`); independently confirmed `live-verified` during `/verify-completion` via a real Chrome session against the exact production HTML string, inspecting both the rendered page and its accessibility tree

<!-- story: ppc-s4 -->
## AC1 — AC1

`tests/check-ppc-s4-pipeline-state-dod-fallback.js` — "no existing journey, flat stories all dodStatus:complete -> 200 with non-empty acs", "epic-nested stories shape also resolves via the fallback", "a GitHub fetch failure is treated as not-found (404), not a crash"

<!-- story: ppc-s4 -->
## AC2 — AC2

"second request for the same product/feature reuses the provisioned journey, no second GitHub fetch" (call-count assertion), "the provisioned journey is tenant/product-scoped with a definition-of-done completedStages entry"

<!-- story: ppc-s4 -->
## AC3 — AC3

"one flat story not dodStatus:complete -> still 404", "one epic-nested story not dodStatus:complete -> still 404"

<!-- story: ppc-s4 -->
## AC4 — AC4

"product has no connected repo -> 404, identical body to pre-fix behaviour", "the products query itself failing -> 404, no unhandled rejection"

<!-- story: ppc-s4 -->
## AC5 — AC5

"tenant B cannot reach a feature that is only DoD-complete in tenant A's repo", "same featureSlug DoD-complete in two different products never cross-matches journeys" — mirrors `ppc-s1`'s own AC6/AC7 regression shape directly

<!-- story: ppc-s4 -->
## AC6 — AC6

"`_getDodAcList` falls back to GitHub content when no Postgres artefact rows exist", "aggregates AC rows across every DoD-complete story, not just the first"

<!-- story: ppc-s5 -->
## AC1 — AC1

`captureVideoRecording_extractedToSrc_producesDifferentCorrectPathsForDifferentClips`; `handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc`

<!-- story: ppc-s5 -->
## AC1-combined — AC1-combined

`handlePostCaptureAll_combinedVideo_coversEveryScreenshottedAc` (strengthened during Task 7 review to a real 2-AC fixture — the original 1-AC version could not distinguish "one context for the group" from "one context per AC")

<!-- story: ppc-s5 -->
## AC2 — AC2

`handleGetCaptureVideo_servesVideo_tenantProductAcidGuarded`; `handleGetCaptureVideo_crossTenantRequest_isDenied`; `renderEvidencePage_combinedVideo_showsAlsoCoversNoteNamingOtherAcs` (strengthened to assert the actual sibling AC id, not a bare substring); `renderEvidencePage_soloVideo_showsNoAlsoCoversNote`; E2E `page.locator('video')).toHaveCount(1)` against a real rendered page

<!-- story: ppc-s5 -->
## AC3 — AC3

`handlePostCaptureTrigger_recordsVideoAlongsideScreenshot_forSingleAc` asserts the video context's re-seeded cookie carries the same `req.sessionId`; `_captureVideoForAcIds` only ever receives the already-authenticated `authed.browser`, never re-authenticates

<!-- story: ppc-s5 -->
## AC4 — AC4

`handlePostCaptureAll_combinedVideoFailure_trackedForEveryAcInTheGroup_screenshotsUnaffected` (strengthened to a 2-AC fixture asserting both ACs land in `captureAllFailed`, both tagged `videoOnly: true`, both screenshots intact — covers the test plan's separately-named "all-or-nothing, not partial" scenario in the same test)

<!-- story: ppc-s5 -->
## AC5 — AC5

`captureVideoRecording_midCaptureFailure_deletesPartialFileAndRethrowsOriginalErrorEvenWhenContextCloseAlsoThrows`; `videoCapture_midFailure_leavesNoPartialFileOnDisk`

<!-- story: ppc-s5 -->
## AC6 — AC6

`renderEvidencePage_noVideoYet_showsScreenshotOnlyState_noVideoTagEmitted`; E2E `page.on('console')` zero-errors assertion against a real rendered page

<!-- story: ppc-s5 -->
## AC7 — AC7

`videoElement_attributes_usePreloadNoneAndPosterAndExplicitDimensions`; E2E zero media-byte-request assertion + `document.body.scrollWidth` check at a real 375px viewport

<!-- story: ppc-s6 -->
## AC1 — page wrapped via `renderShellWithNav` (nav, product context, Products sidebar)

`check-ppc-s6-dashboard-shell-parity.js` T1 (asserts `sw-app`/`sw-sidebar` markup present); **re-verified 2026-10-27 against real `wuce-staging` deployment** (commit `992ea3f`/PR #1030) via a screenshot of `/products/<id>/playback-evidence/2026-05-24-governance-platform-architecture` (a different, fully DoD-complete feature, used to exercise this story's shared shell/summary code since `ppc-s6`'s own feature can't auto-provision a journey until `ppc-s7` also completes — see Note below) — nav sidebar, top nav, product context all visible

<!-- story: ppc-s6 -->
## AC2 — Scope/Benefit sections render tenant-scoped `discovery.md`/`benefit-metric.md` via `fetchArtefact`, `escHtml()`-escaped

T3 (asserts fetched content renders and is escaped — `<see>` → `&lt;see&gt;`); **re-verified 2026-10-27 on real `wuce-staging`** — screenshot shows real GitHub-sourced Scope/Benefit content (actual discovery text and M1-M5 metric targets fetched live from `heymishy/skills-repo`)

<!-- story: ppc-s6 -->
## AC3 — at-a-glance coverage line, reusing `renderCoverageSummaryHtml`/`computeAcCoverageSummary` as-is

T5 (full coverage case), T6 (0-of-N case); **re-verified 2026-10-27 on real `wuce-staging`** — screenshot shows "0 of 5 ACs have captured evidence yet." above the AC list

<!-- story: ppc-s6 -->
## AC4 — missing `discovery.md`/`benefit-metric.md` shows a named "not found" state, rest of page unaffected

T4 (discovery.md-missing case); **re-verified 2026-10-27 locally** (correct test harness, `DATABASE_URL` unset) — both `discovery.md` and `benefit-metric.md` independently showed their own named "not found in the connected repo" message, confirming the symmetric code path works for both files, not just the tested one

<!-- story: ppc-s6 -->
## AC5 — existing capture forms still submit correctly, no client-side JS required, after the shell wrap

T2 (form markup + `method="POST"` present); **re-verified 2026-10-27 on real `wuce-staging`** — 6 forms present on the live page

<!-- story: ppc-s6 -->
## AC6 — Scope/Benefit cards stack to a single column at ≤768px

T7 (asserts the `@media (max-width: 768px)` rule and the desktop `grid-template-columns:1fr 1fr` are both present); **re-verified 2026-10-27 on real `wuce-staging`** — confirmed desktop state is a real two-column render (`grid-template-columns: 510.5px 510.5px` at 1368px viewport, via a real screenshot) and that the browser's own parsed CSSOM contains `@media (max-width: 768px) { .ppc-summary-grid { grid-template-columns: 1fr; } }`, correctly scoped to the same selector

<!-- story: ppc-s7 -->
## AC1 — sign-off area shows Approve (primary)/Needs changes (destructive) buttons + optional comment field, plain `<form>`

T1 (unit); real local browser check — seeded test session + journey, screenshot confirmed both buttons with correct variant styling and the comment textarea

<!-- story: ppc-s7 -->
## AC2 — decision written to `journeys.data.signOff` with correct identity/timestamp/coverage snapshot, tenant-scoped

T4 (write correctness), T5 (identity regression guard), T6 (coverage snapshot); real browser check — clicked Approve through the actual form, confirmed real identity (`e2e-tester`) and a real ISO timestamp on reload

<!-- story: ppc-s7 -->
## AC3 — recorded decision renders as a status badge with escaped who/when/comment/coverage text

T2 (XSS escaping), T7 (success badge), T7b (danger badge); real browser check — the submitted decision rendered correctly as an "Approved" badge with the comment text visible

<!-- story: ppc-s7 -->
## AC4 — a stale decision (recorded against fewer ACs than currently captured) stays visible, always labelled with the originally-recorded snapshot

T8 (original snapshot shown), T9 (never a bare unqualified "Approved")

<!-- story: ppc-s7 -->
## AC5 — sign-off write passes the same tenant/product access-control check as every other `ppc` write

T11 (cross-tenant request denied, no write occurs) — reuses `_resolveJourney`'s existing guard, no new access-control code

<!-- story: ppc-s7 -->
## AC6 — empty state reads "No decision recorded yet", distinct from the Approved badge

T3 (unit); real browser check — confirmed before any decision was submitted

<!-- story: ppc-s8 -->
## AC1 — `require('playwright')` resolves inside the built production image

The original failure (`Error: Cannot find module 'playwright'`) never recurred in any of the two subsequent fast-follow production attempts — both later failures were a different symptom (an indefinite hang, not a module-resolution error), confirming the `dependencies`/Dockerfile fix from PR #1025 held

<!-- story: ppc-s8 -->
## AC2 — `chromium.launch()` + a real page round trip succeeds inside the built production image

Partial: the launch call was reached past the module-resolution fix, but the exact point of the eventual hang (sandbox setup vs. the subsequent navigate/capture step) was never cleanly isolated before the mechanism was abandoned in favour of `ppc-s9`'s architecture — `decisions.md`'s own fast-follow entries describe "a matched CSRF guard check logged, then total silence," consistent with the hang occurring inside or shortly after `chromium.launch()`, not before it, but this was never confirmed via an isolated `page.title()` round trip against a reachable URL as the test plan's own AC2 verification step specified

<!-- story: ppc-s8 -->
## AC3 — A real capture against the deployed production app succeeds end-to-end

Confirmed NOT satisfied. Three consecutive live production attempts across all 3 PRs: (1) PR #1025 fixed the module-resolution 500 but then hung indefinitely; (2) PR #1026 (`chromiumSandbox: false`) still hung identically; (3) PR #1027 (`--disable-dev-shm-usage`) **also failed to resolve the hang** — `decisions.md`'s own 2026-10-26 "Superseding decision" entry states this explicitly as the trigger for the architecture review that produced `ppc-s9`. This AC was never achieved by this story's own approach.

<!-- story: ppc-s8 -->
## AC4 — Existing Playwright E2E suite unaffected

Each of the 3 PRs' own decisions.md entries confirms "full suite verified passing" / "full suite passes unmodified" before merge

<!-- story: ppc-s8 -->
## AC5 — Unit/integration chain still never invokes real Playwright (ADR-018)

Same full-suite-passing confirmation as AC4; unchanged since this story touched only production-only, env-gated code paths

<!-- story: ppc-s9 -->
## AC1 — AC1

`handlePostCaptureTrigger returns immediately (never waits for the dispatched workflow to finish)`; `handlePostCaptureTrigger returns 502 (never a bare 500) when dispatch itself fails, and nothing is marked in-progress`; existing CSRF/rate-limit/target/DoD/repo-connected regression fixtures preserved via the 5 migrated test files (`check-ppc-s1-playback-evidence-route.js` 21/21, `check-ppc-s2-capture-all-route.js` 17/17, `check-ppc-s3-capture-rate-limit.js` 6/6)

<!-- story: ppc-s9 -->
## AC2 (nonce exchange, D37 adapter) — AC2 (nonce exchange, D37 adapter)

`check-ppc-s9-capture-nonce-store.js`: single-use exchange, replay fails, expired nonce fails, D37 stub-throws, two sessions issue two distinct nonces; `check-ppc-s9-capture-worker-auth.js`: `handleCaptureExchange` 403 on wrong secret, 404 on already-used nonce (no session_id echoed), 400 on missing nonce (store never consulted), 200 with sessionId on success

<!-- story: ppc-s9 -->
## AC3 (worker uploads a named artifact, never references accessToken) — AC3 (worker uploads a named artifact, never references accessToken)

`captureWorkerScript_neverReferencesAccessToken`; `captureWorkerScript_outputDir_containsRealScreenshotAndVideoBytes_notJustAManifest`; `captureWorkerScript_closesBrowserInFinally_*` (2 tests) confirm the script's own logic and that `outputDir` is populated with real bytes before `upload-artifact` runs. **The actual real-GitHub-Actions upload step itself has not been live-verified** — the test plan's own `workflow_uploadsNamedArtifact_realGitHubActionsRun` manual/live scenario requires triggering a real dispatch against the deployed app, which has not happened yet (no production deploy has occurred since merge — see AC8).

<!-- story: ppc-s9 -->
## AC4 — AC4

`handleGetPlaybackEvidence, artifact found -- commits screenshot+video via the exact real tenant token/owner/repo/base64 shape, updates journey fields, clears captureInProgress, renders the normal completed state`; `..., artifact not found but still within the wait window -- renders the in-progress fragment, makes no commitArtefact call`; `..., artifact not found past the wait window -- writes the EXACT captureAllFailed timeout shape` (all in `check-ppc-s9-capture-dispatch-wiring.js`)

<!-- story: ppc-s9 -->
## AC5 — AC5

Same timeout-to-named-failure-state tests as AC4, plus the two spec-compliance-fix regression tests (`...stays in-progress (not failed, not silently cleared) while still within the wait window`; `...is bounded by CAPTURE_WAIT_WINDOW_MS, not retried forever`) added after the unbounded-retry bug (see DoD Observations) was found and fixed

<!-- story: ppc-s9 -->
## AC6 — AC6

`handlePostCaptureAll dispatches exactly ONE dispatchCaptureWorkflow call covering every AC in the group`; `...releases the capture-all lock even on a dispatch failure`; `a capture-all-shaped captureInProgress with 2 acIds sharing ONE correlationId calls checkCaptureArtifact exactly once for that correlationId, not once per acId`; `a found capture-all group with 2 ACs commits EACH AC its OWN distinct screenshot buffer from result.screenshots -- not the same buffer twice` (the multi-screenshot-overwrite bug fix — see DoD Observations)

<!-- story: ppc-s9 -->
## AC7 — AC7

Directly re-confirmed on `master` post-merge: `test -f src/web-ui/adapters/session-page-adapter.js` → absent; `test -f tests/check-ppc-s1-session-page-adapter.js` → absent; `grep -rl "chromiumSandbox\

<!-- story: ppc-s9 -->
## AC8 — AC8

Not yet performed. This story's own test plan and `ppc-s8`'s precedent both scope this as manual/live-only, post-merge, post-deploy verification — and no production deploy has occurred since PR #1028 merged (this repo's own `staging-deploy.yml` is the only deploy workflow present; production promotion is a separate, explicitly gated human action per `decisions.md`'s own "Platform Owner approved the promote-to-prod gate" precedent from `ppc-s8`).

<!-- story: ppc-s10 -->
## AC1 — `handleGetPlaybackEvidence` calls `ensureRepoFresh` before reading committed capture evidence

`check-ppc-s10-repo-freshness-wiring.js` T1-T3 (call-order + failure-swallowing assertions against the real handler + journey-store) and T10 (a real `git init`/clone/push/pull reproducing the exact commit-to-serve handoff that 404d in production, using the real, unmocked `ensureRepoFresh`)

<!-- story: ppc-s10 -->
## AC2 — `handleGetCaptureScreenshot`/`handleGetCaptureVideo` call `ensureRepoFresh` before `fs.existsSync`

`check-ppc-s10-repo-freshness-wiring.js` T4-T6, T10 (same real git-clone/pull integration evidence as AC1)

<!-- story: ppc-s10 -->
## AC3 — Playback evidence link rendered when a product is connected, on the DoD stage view

`check-ppc-s10-playback-link.js` T7 (real router-dispatch, asserts the exact `href` string in the response HTML) and T11 (asserts the rendered path matches `server.js`'s own real route registration)

<!-- story: ppc-s10 -->
## AC4 — No link rendered when `journey.productId` is unset

`check-ppc-s10-playback-link.js` T9 (real router-dispatch, asserts no `/playback-evidence/` substring in the response HTML)

## Metric Signal

- **Metric 1 — Self-service DoD validation adoption**:  —  (measured )
- **Metric 3 — Engineer manual-demo load removed**:  —  (measured )
- **Metric 1 — Self-service DoD validation adoption**:  —  (measured )
- **Metric 2 — Time to DoD sign-off**:  —  (measured )
- **Metric 3 — Engineer manual-demo load removed**:  —  (measured )
- **Metric 1 — Self-service DoD validation adoption**:  —  (measured )
- **m1: Self-service DoD validation adoption**: not-yet-measured — This story removes a structural blocker (a false 404 for CLI-delivered DoD-complete features) that would have suppressed adoption regardless of real usage — but the metric itself still requires real tenant usage data, which does not exist yet (pre-launch beta, same as `ppc-s1`/`ppc-s2`'s own DoDs record) (measured null)
- **m3: Engineer manual-demo load removed**: not-yet-measured — Same reasoning — the blocker this story removes was structural, but the metric requires real adoption to measure (measured null)
- **m1 — Self-service DoD validation adoption**:  —  (measured )
- **m3 — Engineer manual-demo load removed**:  —  (measured )