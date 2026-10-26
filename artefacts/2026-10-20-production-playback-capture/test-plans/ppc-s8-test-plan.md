# Test Plan: Production bug fix — `playwright` module missing from the deployed image

**Story reference:** artefacts/2026-10-20-production-playback-capture/stories/ppc-s8-playwright-production-dependency.md
**Epic reference:** artefacts/2026-10-20-production-playback-capture/epics/ppc-self-service-capture.md
**Test plan author:** Claude (session)
**Date:** 2026-10-26
**Confirmed test runner:** `node scripts/run-all-tests.js` (via `npm test`) for the unit/integration chain. Docker-build verification (AC1/AC2) requires a real local `docker build` + `docker run`, not expressible as a `tests/check-*.js` file — recorded as a manual verification step with real command output as evidence, same convention as `ppc-s2`'s own real-timing NFR evidence.

---

## AC Coverage

| AC | Description | Unit | Integration | Docker-build (manual, real command output) | Risk |
|----|-------------|------|-------------|----------------------------------------------|------|
| AC1 | `require('playwright')` resolves inside the built production image | — | — | 1 real command | 🟡 |
| AC2 | `chromium.launch()` + real page round trip succeeds inside the built production image | — | — | 1 real command | 🟡 |
| AC3 | A real capture against the deployed production app succeeds end-to-end | — | — | 1 real browser-triggered capture, post-deploy | 🟡 |
| AC4 | Existing Playwright E2E suite (`npm run test:e2e`) unaffected | — | — | Full E2E suite re-run | 🟢 |
| AC5 | Unit/integration chain still never invokes real Playwright | 1 test (existing ADR-018 regression coverage, re-run unmodified) | — | — | 🟢 |

---

## Coverage gaps

AC1/AC2/AC3 cannot be verified by a unit or integration test — they are specifically about the production Docker image's own runtime environment, which `node scripts/run-all-tests.js` never builds or runs. Per `CLAUDE.md`'s own CSS-layout-dependent-AC precedent (applied here by the same underlying logic: some claims are only true or false about a specific real runtime, not about code in the abstract), these are handled as manual verification with real command output recorded as evidence — not skipped, not assumed.

---

## Test Data Strategy

**Source:** The real `Dockerfile` and `package.json` in this repo, built locally via `docker build --target production`. AC3 uses the real, already-deployed `skills-framework.fly.dev` app and the `feature-playback-demo` feature already used to discover this bug (real tenant: the Platform Owner's own account, same session that discovered the 500).
**PCI/sensitivity in scope:** No — AC1/AC2 touch no tenant data at all (pure runtime-environment checks). AC3 touches the same real tenant data classification already recorded in `nfr-profile.md` (Confidential), unchanged by this story.
**Availability:** Available now — Docker is available locally (confirmed in-session); production access was already used to discover this bug.
**Owner:** Self-contained.

### Data requirements per AC

| AC | Data needed | Source | Notes |
|----|-------------|--------|-------|
| AC1 | A built production-stage Docker image | Local `docker build --target production .` | |
| AC2 | The same built image, running | `docker run` the built image, or `docker run --rm <image> node -e "..."` against the image directly without needing the full server to be up | A reachable URL for the test `page.goto()` — use `https://example.com` or `about:blank`, not a real tenant page, since this check is about the browser launching, not about capture content |
| AC3 | The real deployed app, a real authenticated session (already available from the discovery session) | `https://skills-framework.fly.dev`, the `feature-playback-demo` feature, AC1's own already-set capture target (dashboard URL / `body` selector) from the discovery session | Reuses the exact same target already set during discovery — no new tenant data touched |
| AC4 | Existing `tests/e2e/*.spec.js` suite | Unchanged | |
| AC5 | Existing ADR-018 regression test(s) already in the unit/integration chain | Unchanged — re-run, not rewritten | |

### PCI / sensitivity constraints

None beyond what `nfr-profile.md` already classifies for this feature.

### Gaps

See Coverage gaps above (AC1-AC3, Docker-build/manual verification, not unit-testable).

---

## Docker-build Tests (manual, real command output required as evidence)

### playwright_module_resolves_insideProductionImage

- **Verifies:** AC1
- **Command:** `docker build --target production -t ppc-s8-verify . && docker run --rm ppc-s8-verify node -e "require('playwright'); console.log('OK: playwright resolved')"`
- **Pass condition:** Prints `OK: playwright resolved`, exit code 0. A `MODULE_NOT_FOUND` error (today's actual failure) is the explicit negative case this test must flip.

### chromium_launches_andNavigates_insideProductionImage

- **Verifies:** AC2
- **Command:** `docker run --rm ppc-s8-verify node -e "const { chromium } = require('playwright'); (async () => { const b = await chromium.launch({ executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH }); const p = await b.newPage(); await p.goto('about:blank'); console.log('OK: launched and navigated'); await b.close(); })();"`
- **Pass condition:** Prints `OK: launched and navigated`, exit code 0, no unhandled rejection.

### realCapture_succeeds_againstDeployedProduction

- **Verifies:** AC3
- **Steps:** After deploy, in a real authenticated browser session against `https://skills-framework.fly.dev`, trigger "Capture evidence" for AC1 on the `feature-playback-demo` feature (same target already set: dashboard URL / `body` selector).
- **Pass condition:** No 500; the page reloads showing a real screenshot and video for AC1, not an error page. Record the real response status and a screenshot of the result as DoD evidence.

### e2eSuite_unaffected_byExecutablePathChange

- **Verifies:** AC4
- **Command:** `npm run test:e2e`
- **Pass condition:** Same pass/fail profile as before this story's changes — no new failures introduced by the `executablePath` wiring (which must resolve to `undefined`/unset outside the production Alpine environment, letting Playwright's own default browser resolution apply unchanged).

### unitChain_stillNeverInvokesRealPlaywright

- **Verifies:** AC5
- **Command:** `node scripts/run-all-tests.js`
- **Pass condition:** All existing tests pass unmodified; the existing ADR-018 regression test(s) (`check-ppc-s2-capture-all-route.js`'s own `NFR-SEC (ADR-018)` test and equivalents) still pass, confirming the unit/integration chain's own guarantee is untouched.

---

## Out of Scope for This Test Plan

- Re-verifying every prior `ppc` story's own ACs against a real production capture — out of this story's own scope (see story's Out of Scope section).
- Load/performance testing of the production capture mechanism under concurrent use — not part of this bug fix.

---

## Test Gaps and Risks

| Gap | Gap type | Reason | Mitigation |
|-----|----------|--------|-------------|
| Exact Alpine package names/versions for a working Chromium + Playwright pairing are not yet confirmed | Implementation risk, not a test-plan gap | Alpine's own packaged Chromium version and the `playwright` npm package's expected browser-protocol version can drift; this is a known, ongoing external compatibility surface, not something a test plan can pre-verify before implementation | Verified empirically via the Docker-build tests above during implementation, not assumed; `decisions.md`'s own Revisit trigger names the fallback (Debian base image) if this proves unworkable |
