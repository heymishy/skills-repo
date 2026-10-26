# Test Plan: Move capture execution to a GitHub Actions worker, retiring the in-process Chromium launch

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s9-github-actions-capture-worker.md
**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Test plan author:** Claude (session)
**Date:** 2026-10-26
**Confirmed test runner:** `node scripts/run-all-tests.js` (via `npm test`) for the unit/integration chain — the GitHub Actions dispatch call, the artifact-listing/download call, and Redis itself are all mocked/injected via this repo's established adapter pattern (ADR-018: unit test chain must never invoke real Playwright, and by extension here, never make a real GitHub API call or hit real Redis). AC8 (real end-to-end confirmation) is a manual/live verification step, same convention as `ppc-s8`'s own AC3.

---

## AC Coverage

| AC | Description | Unit | Integration | Manual/live | Risk |
|----|-------------|------|-------------|-------------|------|
| AC1 | Validated request dispatches a workflow (carrying a nonce, never session_id), marks in-progress, returns without blocking | 1 test | 2 tests | — | 🟢 |
| AC2 | Nonce exchanges for session_id exactly once; replay fails; unused nonce expires | 3 tests | — | — | 🟢 |
| AC3 | Workflow uploads a named artifact; never references accessToken | 1 test (workflow script) | — | 1 scenario (real workflow run inspected) | 🟡 |
| AC4 | Result artifact detected on next page load → downloaded, committed via existing commitArtefact, fields updated, normal render | — | 2 tests | — | 🟢 |
| AC5 | Failed/timed-out dispatch clears to a named failure state, not indefinite "in progress" | — | 2 tests | — | 🟢 |
| AC6 | Capture-all dispatches exactly ONE workflow run for the whole group | — | 1 test | — | 🟢 |
| AC7 | Dead code genuinely removed; 6 existing tests migrated, still passing, still verifying real behaviour | — | — | 1 repo-wide grep/file-existence check + the 6 migrated files themselves | 🟡 |
| AC8 | Real production trigger succeeds end-to-end post-merge | — | — | 1 scenario | 🟡 |

---

## Coverage gaps

AC3's "workflow uploads a named artifact" and AC8 cannot be verified by the unit/integration chain alone — a GitHub Actions workflow's own real execution (queueing, runner provisioning, artifact upload) is not something `node scripts/run-all-tests.js` can exercise locally. Both are handled as manual/live verification with real command/run output recorded as evidence, same convention as `ppc-s8`'s own AC1-AC3 Docker-build verification. AC7's dead-code-removal check is a mechanical grep/file-existence check, not a behavioural test, but is still recorded here since it's an explicit AC.

---

## Test Data Strategy

**Source:** Mocked GitHub Actions dispatch/artifact-list/artifact-download calls (injected via a new, D37-compliant adapter — mirroring `artefact-commit-writer.js`'s own `setArtefactCommitAdapter`/stub-throws convention), a fake/in-memory Redis stand-in for the nonce store (confirmed precedent: `tests/check-p3.2-redis-session-adapter.js` — "Uses injectable stub adapter — no real Upstash connection required" — reuse this same injectable-stub shape, do not invent a new one), and the existing fake-Postgres-pool/`journey-store._clearForTesting()` pattern already used by every `ppc-*` route test.
**PCI/sensitivity in scope:** No — all fixtures are synthetic.
**Availability:** Available now.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Notes |
|----|-------------|--------|-------|
| AC1 | A fixture AC with a stored capture target, a mocked GitHub dispatch adapter recording what it was called with | Fixture + mock | Assert the dispatch call's own inputs never contain the real `session_id` value anywhere |
| AC2 | A fake Redis store (get/set/del with TTL tracking), a journey/session fixture | Fixture + mock | Must assert: (a) correct exchange on first use, (b) `null`/error on a second use of the same nonce, (c) `null`/error once the fixture's simulated clock passes the TTL |
| AC3 | The new workflow script's own entrypoint, run directly (not via real GitHub Actions) with a mocked Playwright `chromium` (same injectable-module pattern `session-page-adapter.js`'s own `realGetAuthenticatedPage` used, now relocated) | Fixture + mock | Confirms the script's own logic; the *real* upload-as-artifact step is the one piece requiring live verification (see Coverage gaps) |
| AC4 | A journey fixture with an AC in `capture-in-progress` state, a mocked artifact-list/download adapter returning a fake result | Fixture + mock | Assert `commitArtefact` is called with the exact same arguments shape it already receives today (same tenant token, same owner/repo, same base64 encoding convention) |
| AC5 | A journey fixture with an AC in `capture-in-progress` state, a mocked adapter returning "no artifact found" past a configured wait-window fixture value | Fixture + mock | Assert the failure state is named/distinct, not a silent re-render of "in progress" forever |
| AC6 | A capture-all fixture with 2+ ACs, a mocked dispatch adapter | Fixture + mock | Assert exactly 1 dispatch call, carrying all AC ids in the group |
| AC7 | Direct repo inspection | Real file-existence/grep checks | `test -f src/web-ui/adapters/session-page-adapter.js` must fail (file gone); grep for `chromiumSandbox`/`PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`/`ttf-freefont` across `src/`+`Dockerfile` must return zero matches |
| AC8 | The real deployed app, the real `feature-playback-demo` fixture feature already used throughout `ppc-s8`'s own live verification | Real production environment | Reuses the exact same AC1/dashboard-URL/body-selector target already set during `ppc-s8`'s discovery |

### PCI / sensitivity constraints

None beyond `nfr-profile.md`'s existing classification for this feature.

### Gaps

See Coverage gaps above (AC3's real-upload step, AC8 — both manual/live verification, not unit-testable; AC7's grep/file-existence check is mechanical, recorded as evidence not a `tests/check-*.js` assertion).

---

## Unit Tests

### nonceExchange_singleUse_returnsSessionIdOnceThenFailsOnReplay

- **Verifies:** AC2
- **Setup:** Seed the fake nonce store with `nonce -> {sessionId, expiresAt: future}`. Call the exchange function twice with the same nonce and the correct shared secret.
- **Expected:** First call returns the real `sessionId`. Second call fails (404/expired-equivalent) — the nonce was deleted after first use.

### nonceExchange_expiredNonce_fails

- **Verifies:** AC2
- **Setup:** Seed a nonce with `expiresAt` in the past (fixture clock).
- **Expected:** Exchange fails — an expired-but-never-used nonce is treated identically to a never-existed one.

### nonceExchange_wrongSharedSecret_rejectedRegardlessOfNonceValidity

- **Verifies:** AC2
- **Setup:** A valid, unexpired, unused nonce; an incorrect `x-capture-exchange-secret` header value.
- **Expected:** Rejected (403-equivalent) before the nonce store is even consulted — mirrors `auth-stub.js`'s own double-gate ordering (secret check first).

### captureWorkerScript_neverReferencesAccessToken

- **Verifies:** AC3
- **Setup:** Static/structural check (read the new workflow script's own source) or a runtime check that the script's own dependency graph never imports/receives `accessToken` as a parameter.
- **Expected:** Confirmed absent — the workflow script's own API surface has no parameter or env var named anything resembling `accessToken`/`githubToken` for commit purposes (it may still need a token for its own artifact-upload step, which is GitHub's own `actions/upload-artifact`-equivalent, already authenticated by the run's own context — not a tenant credential).

---

## Integration Tests

### handlePostCaptureTrigger_validatedRequest_dispatchesWorkflowWithNonceNeverRawSessionId

- **Verifies:** AC1
- **Setup:** Existing fixture (DoD-complete journey, capture target set, connected repo). Mock the dispatch adapter to record its own call arguments.
- **Expected:** Response returns promptly (no blocking wait inside the test for a "browser launch"); the journey's AC is marked `capture-in-progress`; the dispatch adapter's own recorded call arguments are inspected and asserted to contain a nonce value, NOT the fixture's own raw session_id string anywhere in the payload.

### handlePostCaptureTrigger_existingValidationUnchanged_csrfRateLimitTargetDodRepo

- **Verifies:** AC1 (regression coverage for everything this task must NOT change)
- **Setup:** Reuses every existing CSRF/rate-limit/target-not-set/DoD-incomplete/no-repo fixture already covering `handlePostCaptureTrigger` today.
- **Expected:** Identical rejection behaviour to today — these checks run before dispatch and are completely unaffected by this story.

### handleGetPlaybackEvidence_resultArtifactFound_commitsViaExistingPathAndRenders

- **Verifies:** AC4
- **Setup:** A journey with an AC in `capture-in-progress` state; mock the artifact-list/download adapter to return a fake zip containing a screenshot + video.
- **Expected:** `commitArtefact` is called (spy) with the real tenant token, owner/repo, base64 encoding — same shape as today's direct call; `journey.captureScreenshots`/`captureVideos` updated; the rendered page shows the normal completed state (same `_renderPlaybackEvidenceHtml` output as before this story, since rendering itself is unchanged).

### handleGetPlaybackEvidence_resultArtifactNotYetFound_showsInProgressState

- **Verifies:** AC4
- **Setup:** Same in-progress fixture; the mocked adapter returns "not found yet."
- **Expected:** Page renders a named "capture in progress" state (no error, no broken element) — not the completed state, not a failure state.

### handleGetPlaybackEvidence_dispatchFailedOrTimedOut_clearsToNamedFailureState

- **Verifies:** AC5
- **Setup:** An in-progress fixture whose dispatch timestamp is older than the configured wait-window fixture value, with the mocked adapter still returning "not found."
- **Expected:** The AC's state clears to a distinct, named failure state (not indistinguishable from "still in progress") — mirrors the existing `captureAllFailed` convention's own shape (a reason, `retry: true`).

### handlePostCaptureAll_group_dispatchesExactlyOneWorkflowRunCoveringAllAcs

- **Verifies:** AC6
- **Setup:** A capture-all fixture with 2+ ACs, mocked dispatch adapter.
- **Expected:** Exactly one dispatch call recorded; its own payload carries all AC ids in the group — mirrors `ppc-s5`'s own "one combined video, not N" assertion shape (`newContextCallCount === 1` analogue: `dispatchCallCount === 1`).

### migrated_check-ppc-s1-playback-evidence-route / check-ppc-s1-ui-layer / check-ppc-s2-capture-all-route / check-ppc-s3-capture-rate-limit / check-ppc-s5-video-capture

- **Verifies:** AC7 (existing-behaviour preservation across the migration)
- **Setup:** Each of these 6 files' own existing mocks (`setSessionPageAdapter`) are replaced with the new dispatch/artifact-check adapter mocks. Every existing assertion in each file is preserved — CSRF, rate-limiting, tenant isolation (`check-ppc-s1-playback-evidence-route.js`), combined-video grouping and the-also-covers note (`check-ppc-s5-video-capture.js`), etc.
- **Expected:** All previously-passing assertions in all 6 files still pass, now exercising the new dispatch-based code path instead of the old in-process one.

---

## Manual / Live Verification

### workflow_uploadsNamedArtifact_realGitHubActionsRun

- **Verifies:** AC3 (the one part no unit test can reach)
- **Steps:** Trigger a real dispatch (via the implemented `handlePostCaptureTrigger`, or directly via `gh workflow run`) against a test fixture target; inspect the real run's own artifact list (`gh api repos/.../actions/artifacts` or the Actions UI) to confirm a correctly-named artifact exists containing real screenshot + video bytes.
- **Pass condition:** Artifact present, named as the design specifies, contains real, non-empty, correctly-formatted files.

### realCapture_succeedsEndToEnd_postMerge

- **Verifies:** AC8
- **Steps:** After merge and deploy, trigger a real capture via the deployed app's own UI against `feature-playback-demo`'s existing AC1 target (dashboard URL / `body` selector — the same target used throughout `ppc-s8`'s own discovery and fast-follow verification).
- **Pass condition:** The page, reloaded after a reasonable wait, shows a real screenshot and video for AC1 — no 500, no indefinite "in progress," no Chromium-launch-flag ever being relevant to the production web server's own logs.

---

## Out of Scope for This Test Plan

- Load/concurrency testing of the new dispatch mechanism under many simultaneous captures — not part of this story's own scope (no stated NFR requiring it yet, pre-launch with no live tenants).
- Testing the 2 alternative compute backends (on-demand Fly Machine, separate suspending Fly app) documented in `decisions.md` but not implemented by this story.

---

## Test Gaps and Risks

| Gap | Gap type | Reason | Mitigation |
|-----|----------|--------|-------------|
| GitHub's `workflow_dispatch` REST endpoint does not return a run id synchronously, so correlating "which run is mine" requires the artifact-name-based approach specified in the story/decisions.md, not a simpler run-id lookup | Implementation risk, not a test-plan gap | A known GitHub API limitation, not something a test plan can design around in advance — verified empirically during implementation against a real dispatch | Covered by the manual/live verification tests above, which exercise the real API shape directly |
| Exact GitHub Actions artifact-listing pagination/retention behaviour at scale is not pre-confirmed | Implementation risk | Low realistic risk at current (pre-launch) volume, but worth noting for the future | Revisit if `ppc-s9`'s own DoD surfaces any real issue once live-tenant volume exists |
