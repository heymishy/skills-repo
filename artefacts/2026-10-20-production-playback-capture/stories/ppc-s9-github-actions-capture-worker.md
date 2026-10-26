# Story: Move capture execution to a GitHub Actions worker, retiring the in-process Chromium launch

**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Discovery reference:** artefacts/2026-10-20-production-playback-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-10-20-production-playback-capture/benefit-metric.md
**Domain:** [web-ui, infra]
**Track:** Standard-track architecture correction, scoped within the existing epic (not a new discovery/benefit-metric pass — this redesigns *how* an already-approved capability is delivered, not *what* it delivers). Full story/test-plan/DoR treatment given its architectural significance, per `CLAUDE.md`'s `decisions.md`-mandatory and artefact-first rules.

---

## Background

`ppc-s8` (three merged PRs: #1025, #1026, #1027) fixed the self-service capture mechanism's missing `playwright` dependency, then chased two further Chromium-in-container launch failures (`chromiumSandbox: false`, `--disable-dev-shm-usage`) — and the live hang persisted through all three. A step-back architecture review (`decisions.md`, 2026-10-26 ARCHITECTURE entry, "Superseding decision") found the deeper problem: launching a real, memory-hungry, long-running headless browser **inline inside the production web server's own request path** is against well-established practice (confirmed via research, not assumed) for three independent reasons — blast radius (a hang/crash there can degrade the app for every tenant, not just the one capturing), request-blocking (browser automation legitimately takes 15s-several minutes; HTTP requests should not), and cost (the only way to make it reliable in-process is paying for ~1GB+ of *always-on* memory to support a workload that is inherently bursty).

This story moves the actual browser-automation step into a GitHub Actions `workflow_dispatch` job — reusing this repo's own already-proven Playwright-in-CI infrastructure (the same mechanism the E2E suite already runs successfully) — and retires the in-process Chromium launch entirely, including the `ppc-s8` Dockerfile/dependency changes that existed only to support it.

## User Story

As a **tenant Product Owner**,
I want **"Capture evidence" / "Capture all evidence" to reliably work in production**,
So that **the self-service capture capability this epic was built to deliver actually functions, without the production app itself being at risk of degrading for every tenant every time someone captures evidence**.

## Benefit Linkage

**Metric moved:** m1 (Self-service DoD validation adoption), m3 (Engineer manual-demo load removed) — same linkage as `ppc-s8`, since this story is what actually closes `ppc-s8`'s own still-open AC3. Also protects the product's own baseline reliability/availability (an unstated but real precondition for either metric ever moving at all) by removing a mechanism that could degrade the whole app, not just the capture feature.

## Architecture Constraints

- **Reused unchanged:** `src/utils/capture-video.js`, `src/utils/capture-screenshots.js` (the actual Playwright recording logic — never the problem, stays exactly as-is, just invoked from a different caller). `scripts/playback-capture.js`'s own CLI pattern is the model the new workflow's own script is built on (reuse the established orchestration shape, do not invent a parallel implementation). The entire DB/journey-store model (`journey.captureVideos`/`captureScreenshots`), `commitArtefact`/`artefact-commit-writer.js` (GitHub Contents API PUT, tenant's own `req.session.accessToken`, never a service account — `product/constraints.md` #12, unchanged), and the rendering code in `_renderPlaybackEvidenceHtml` are all unchanged.
- **Credential boundary (the one genuine new security design surface — see `decisions.md` for the full reasoning):** `req.session.accessToken` (the tenant's real GitHub OAuth token) never leaves the server process in the new design either — the GitHub Actions workflow's only output is an uploaded artifact (screenshot + video bytes); the app itself downloads it and calls the existing, unchanged `commitArtefact`. Only `req.sessionId` (the opaque, already-scoped-as-sensitive cookie value) needs new handling, and it must never appear directly in a `workflow_dispatch` input (visible in GitHub's own Actions UI to any repo collaborator). A short-lived, single-use, randomly-generated nonce is exchanged for it via a new internal endpoint, modelled on `auth-stub.js`'s own established shared-secret-header pattern (`crypto.timingSafeEqual`, double-gated by an env var that is never committed), backed by the already-wired `@upstash/redis` (same TTL'd-key pattern `session-redis.js` already uses — `client.set(key, value, { ex: TTL })`).
- **Completion detection stays pull-based, matching the existing UX convention** (today's users already reload the page to see a just-finished synchronous capture) — `handleGetPlaybackEvidence` itself checks, for any AC with an in-progress capture, whether the named result artifact now exists (via GitHub's Actions artifacts API) and finalises it inline (download, extract, `commitArtefact`, update journey fields) before rendering — rather than introducing new client-side polling JS or a webhook receiver, consistent with `web-ui-patterns.md`'s "plain Node, no new npm dependencies" convention.
- **Dead code removal is part of this story's own scope, not a follow-up:** `src/web-ui/adapters/session-page-adapter.js` (the entire module — `getAuthenticatedPage`/`setSessionPageAdapter`/`realGetAuthenticatedPage` — becomes genuinely unused once `_captureOneAc`/`_captureVideoForAcIds` no longer call it; confirmed by grep that nothing else in `src/` references it), its own dedicated test file (`tests/check-ppc-s1-session-page-adapter.js`), the `ppc-s8` Dockerfile changes (Alpine `chromium`/`ca-certificates`/`ttf-freefont` apk install, the explicit `playwright-core` production install step, the `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH` env var), and `_captureOneAc`/`_captureVideoForAcIds`'s own current bodies in `playback-evidence.js` (replaced by dispatch + finalise logic; the actual capture work they orchestrated moves into the new workflow's own script, reusing the same underlying utils).
- **Existing-test migration, not just new-test authorship:** 6 existing test files currently mock `session-page-adapter.js`'s `setSessionPageAdapter` to inject fake browser/page objects (`check-ppc-s1-playback-evidence-route.js`, `check-ppc-s1-ui-layer.js`, `check-ppc-s2-capture-all-route.js`, `check-ppc-s3-capture-rate-limit.js`, `check-ppc-s5-video-capture.js`, plus `check-ppc-s1-session-page-adapter.js` itself) — these must be rewritten against the new dispatch-based flow (mocking the GitHub Actions dispatch call + artifact-check call instead), not left stale or simply deleted wholesale, since several of them assert real, still-applicable behaviour (CSRF, rate-limiting, tenant isolation, combined-video grouping) that must keep being verified under the new design.

## Dependencies

- **Upstream:** `ppc-s8` (all three PRs merged) — the RCA and in-process fixes that led to this redesign. This story supersedes `ppc-s8`'s own remaining AC3 ("a real capture succeeding against the actually-deployed production app") — once this story's own equivalent AC lands, `ppc-s8`'s AC3 is considered satisfied via this story, not independently.
- **Downstream:** None newly blocked. `ppc-s6`/`ppc-s7` (dashboard-shell parity, sign-off recording) are unaffected — neither touches the capture-trigger mechanism.

## Acceptance Criteria

**AC1:** Given a tenant PO triggers single-AC capture, When the request is validated (CSRF, rate-limit, target set, DoD-complete, repo connected — all unchanged from today), Then the server dispatches a GitHub Actions `workflow_dispatch` run carrying a single-use nonce (never the raw `session_id`) and the capture target(s), marks the AC as `capture-in-progress`, and returns immediately — the HTTP request does not block on the browser automation.

**AC2:** Given the dispatched workflow runs, When it needs to authenticate as the tenant's own PO, Then it exchanges the nonce (via the new internal endpoint, shared-secret-authenticated) for the real `session_id` exactly once, the nonce is invalidated immediately after that single use (a replay with the same nonce fails), and the nonce itself expires automatically after a short TTL (10 minutes) if never exchanged.

**AC3:** Given the workflow's capture succeeds, When it finishes, Then it uploads the screenshot + video bytes as a single named GitHub Actions artifact (named deterministically from the dispatch's own correlation id) — no repo commit happens from within the workflow itself, and the tenant's own GitHub OAuth token is never referenced by the workflow at any point.

**AC4:** Given a named result artifact now exists for an in-progress AC, When the tenant PO next loads (or reloads) the playback-evidence page, Then the server detects it, downloads and extracts it, commits the screenshot + video to the tenant's repo via the existing, unchanged `commitArtefact` path, updates `journey.captureScreenshots`/`captureVideos`, and renders the normal completed state — matching today's existing "reload to see the result" UX, not a new polling mechanism.

**AC5:** Given the dispatched workflow fails or never produces a result artifact within a bounded wait window, When the tenant PO reloads the page, Then the AC's `capture-in-progress` state clears to a named failure state (not an indefinite "in progress" forever), mirroring the existing `captureAllFailed` mechanism's own all-or-nothing-per-group semantics for the capture-all case.

**AC6:** Given `handlePostCaptureAll`'s existing multi-AC loop, When capture-all is triggered, Then exactly ONE workflow dispatch covers the whole run (not one per AC) — preserving `ppc-s5`'s own combined-video design intent — and AC4/AC5 apply identically to the whole group.

**AC7:** Given this story is complete, When the full test suite and a real production trigger are both exercised, Then: `session-page-adapter.js` and its own dedicated test file no longer exist in the repo; the `ppc-s8` Dockerfile changes (Alpine chromium/ca-certificates/ttf-freefont, the `playwright-core` production install step, `PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH`) are reverted; and the 6 existing tests that previously mocked `session-page-adapter.js` are rewritten (not deleted) against the new dispatch-based flow, each still verifying the real behaviour it verified before (CSRF, rate-limiting, tenant isolation, combined-video grouping).

**AC8:** Given a real capture is triggered against the deployed production app after this story merges, When it completes, Then it succeeds end-to-end without any Chromium-in-container launch flag ever being relevant to the production web server again — this is the final, real confirmation `ppc-s8`'s own AC3 could never obtain.

## Out of Scope

- Any change to the actual Playwright recording logic itself (`capture-video.js`/`capture-screenshots.js`) — reused as-is.
- Real-time progress UI (a spinner, a websocket push, live percentage) for the in-progress state — a plain "capture in progress, check back shortly" message satisfies AC4/AC5; richer progress UX is a candidate fast-follow, not blocking.
- Choosing between the 3 alternative compute backends researched in `decisions.md` (GitHub Actions vs. on-demand Fly Machine vs. separate suspending Fly app) beyond the GitHub Actions option this story implements — the other two remain documented alternatives for a future revisit if GitHub Actions' own dispatch latency proves unacceptable at real-tenant scale (see `decisions.md`'s own Revisit trigger).
- Retrofitting this same pattern onto any other in-process browser-automation code elsewhere in the repo, if any exists — out of this epic's own scope.

## NFRs

- **Performance:** Dispatch-to-completion latency is expected to be materially higher than the old (when-working) synchronous path — typically 30s-2min for GitHub Actions queue + runner startup + the capture itself, vs. the old ~15-60s in-process figure. This is an explicit, accepted tradeoff for reliability and cost (see `decisions.md`); the AC4 "reload to see result" UX already tolerates this.
- **Security:** No new exposure beyond the nonce-exchange endpoint itself, which is scoped to return exactly one single-use, short-TTL value and nothing else — threat-modelled in Architecture Constraints above. `req.session.accessToken` exposure surface is *reduced* relative to the current design (never referenced outside the server process at all, vs. today where it's already server-side-only but this story makes that guarantee structurally enforced by the new design, not just by convention).
- **Reliability:** Directly improves reliability relative to `ppc-s8`'s own shipped state — removes the blast-radius risk of a hung/crashed Chromium process affecting the whole app's serving capacity for all tenants.
- **Cost:** ~$0-1/mo marginal cost (within existing GitHub Actions minutes), vs. the ~$17.55/mo *always-on* alternative of just resizing the production VM — see `decisions.md`'s full cost comparison.
- **Design system:** N/A — no UI/rendering change beyond the in-progress/failure state text, which reuses existing rendering conventions (no new component).

## Complexity Rating

**Rating:** 3 — genuine architecture change touching multiple files, a new credential-exchange security surface (correctly designed, but new), and migration of 6 existing tests to a new mocking shape. Not a bug fix; a real redesign.
**Scope stability:** Stable — the design itself (dispatch + nonce-exchange + artifact-based completion) is fully specified in this story and `decisions.md`; remaining uncertainty is in exact GitHub Actions API response shapes (artifact-listing pagination, `workflow_dispatch`'s own lack of a returned run id requiring the correlation-by-artifact-name approach specified above), verified empirically during implementation, not assumed.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
