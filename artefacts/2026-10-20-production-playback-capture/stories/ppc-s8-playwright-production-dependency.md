# Story: Production bug fix — `playwright` module missing from the deployed image, self-service capture has never functioned against a real running instance

**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Discovery reference:** artefacts/2026-10-20-production-playback-capture/discovery.md
**Benefit-metric reference:** artefacts/2026-10-20-production-playback-capture/benefit-metric.md
**Domain:** [web-ui, infra]
**Track:** Short-track (bug fix, bounded) — per `CLAUDE.md`'s own short-track definition, skips discovery through review; starts at test-plan.

---

## Background

First-ever real production validation of `ppc-s5` (triggered manually against `https://skills-framework.fly.dev`, an AC1 single-capture request) returned `500 Internal Server Error`. Production logs (`flyctl logs`) show the real cause: `Error: Cannot find module 'playwright'`, thrown from `session-page-adapter.js`'s `realGetAuthenticatedPage` — the function `handlePostCaptureTrigger`/`handlePostCaptureAll` both call to do a real capture. Full RCA recorded in `decisions.md` (2026-10-26 ARCHITECTURE entry).

Root cause, confirmed by reading `package.json` and `Dockerfile` directly:
1. `package.json` lists `@playwright/test` (the E2E test-runner CLI) as a `devDependency`, but never lists the underlying `playwright` automation library (what `session-page-adapter.js`'s real production code actually `require()`s) as a dependency anywhere. It has only ever worked in dev/CI because `@playwright/test` transitively pulls `playwright` in — and production's `npm ci --omit=dev` never installs `@playwright/test` at all.
2. The production Dockerfile stage additionally runs `npm ci --omit=dev --ignore-scripts` — even once `playwright` is a real dependency, `--ignore-scripts` skips its own `postinstall` hook (which downloads the Chromium browser binary), so `require('playwright')` would resolve but `chromium.launch()` would still fail.
3. Both Dockerfile stages use `node:20-alpine`. Playwright's own bundled Chromium download is built against glibc and is not officially supported on Alpine's musl libc — the standard workaround is installing Alpine's own native `chromium` package (plus its required native libraries) and pointing Playwright at it via `executablePath`, rather than trying to get Playwright's own glibc-built download to run on musl.

**Scope of impact:** Not `ppc-s5`-specific — `handlePostCaptureTrigger` and `handlePostCaptureAll` are affected identically, so this has silently broken the entire self-service capture mechanism (`ppc-s1` onward, screenshots too) since `ppc-s1` first shipped. Every DoD from `ppc-s1` through `ppc-s5` recorded "no live staging/production verification yet" as a carried-forward Follow-up Action, attributing it to "no staging environment with a connected test repo exists" — that framing was accurate as far as it went, but the deeper blocker (only discoverable by actually attempting a real capture against the deployed app, which this session did for the first time) is that the mechanism could never have worked regardless of test-repo availability.

## User Story

As a **tenant Product Owner**,
I want **the "Capture evidence" / "Capture all evidence" actions to actually work when I click them in production**,
So that **the self-service capture capability this epic was built to deliver is real, not a feature that only ever worked in tests and mocks**.

## Benefit Linkage

**Metric moved:** m1 (Self-service DoD validation adoption) and m3 (Engineer manual-demo load removed) — both directly, since neither metric can ever move at all while the mechanism they depend on 500s on every real attempt. This is not a new capability; it is making an already-"shipped" capability (per every prior story's own DoD) actually functional for the first time.

## Architecture Constraints

- ADR-018 is **refined, not reversed**: `@playwright/test` (the E2E test framework / CLI) remains `devDependency`-only — the unit test chain (`npm test`) must still never invoke it, unchanged. This story recognises a previously-conflated, separate concern: `playwright` (the underlying automation library) is a genuine **production runtime dependency** for the self-service capture feature specifically, distinct from the test-framework package.
- Do not switch the production Dockerfile's base image away from `node:20-alpine`. The Alpine-native-`chromium`-package approach is the narrower, better-precedented fix; a base-image swap would be a materially larger change touching the entire production image for an unrelated set of risks (see `decisions.md` 2026-10-26 entry's own Rationale).
- `session-page-adapter.js`'s `realGetAuthenticatedPage` must accept an optional `executablePath` (or resolve one from an env var), defaulting to Playwright's own bundled browser resolution when unset — so local dev and CI E2E runs (Debian-based GitHub Actions runners, not Alpine) are completely unaffected by this change. The production-only Alpine/`executablePath` wiring must be additive, not a replacement of the existing working path.
- `getAuthenticatedPage`/`setSessionPageAdapter`'s existing D37 injectable-adapter wiring is unaffected — this story only fixes `realGetAuthenticatedPage`'s own internals and the surrounding `package.json`/`Dockerfile`, not the adapter boundary itself.

## Dependencies

- **Upstream:** `ppc-s1` (introduced `realGetAuthenticatedPage`) — DoD-complete, but this story corrects a defect in its own shipped code.
- **Downstream:** None directly, but every `ppc` story's own "no live verification yet" Follow-up Action (ppc-s1 through ppc-s5) is effectively blocked on this story landing before any of them can finally be closed out with a real check.

## Acceptance Criteria

**AC1:** Given the production Docker image is built, When `npm ci --omit=dev` runs in the production stage, Then `require('playwright')` resolves successfully inside the built image (verified by running a real command inside the built image, not inferred from `package.json` alone).

**AC2:** Given the production Docker image is built, When `realGetAuthenticatedPage` calls `chromium.launch()` inside that image, Then it successfully launches a real headless browser instance (verified by actually launching it inside the built image — a real `page.goto()` + `page.title()` round trip against a reachable URL, not just confirming the binary exists on disk).

**AC3:** Given a tenant PO triggers a real single-AC or capture-all request against the deployed production app, When the capture completes, Then it succeeds end-to-end (screenshot and video both committed) rather than 500ing — verified by actually triggering a real capture against `https://skills-framework.fly.dev` after deploy and confirming success, mirroring how this story's own bug was first discovered.

**AC4:** Given local development or CI's own Playwright-based E2E test suite (`npm run test:e2e`, Debian-based GitHub Actions runners), When those tests run after this story's changes, Then they continue to pass unmodified — this story's `executablePath` change must be a no-op outside the Alpine production environment.

**AC5:** Given the unit/integration test chain (`npm test` / `scripts/run-all-tests.js`), When it runs after this story's changes, Then it still never invokes a real Playwright browser (ADR-018's own core guarantee, unchanged by this story).

## Out of Scope

- Switching the production base image away from Alpine — explicitly rejected, see Architecture Constraints and `decisions.md`.
- Retroactively re-verifying every prior `ppc` story's own ACs against a real production capture — each story's own DoD Follow-up Action already names this as pending; this story only unblocks it, it does not itself re-run every prior story's own verification.
- Any new capture feature, UI change, or AC beyond making the existing mechanism actually work. This is a bug fix, not new scope.

## NFRs

- **Performance:** Installing Alpine's native `chromium` package adds to the production image size and build time — not quantified ahead of time (no fixed SLA), measured as part of implementation and recorded as DoD evidence (same convention as `ppc-s2`'s own AC3/AC4 precedent).
- **Security:** No new exposure surface — this story fixes a dependency/build gap in an already-reviewed capture mechanism (ADR-018, ADR-025), it does not change what the mechanism can see or do.
- **Reliability:** This is, by definition, a reliability fix — the mechanism currently fails 100% of the time in production.
- **Design system:** N/A — no UI/rendering change.

## Complexity Rating

**Rating:** 3 — Alpine/Chromium native-package compatibility (exact package names, required shared libraries, version skew between Alpine's packaged Chromium and the `playwright` npm package's expected protocol version) carries real, not-fully-predictable risk; verified empirically via a real local Docker build in this story's own implementation, not assumed.
**Scope stability:** Stable — the fix approach itself (Alpine native package + `executablePath`) is well-precedented externally, even though package-version specifics need empirical confirmation.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
