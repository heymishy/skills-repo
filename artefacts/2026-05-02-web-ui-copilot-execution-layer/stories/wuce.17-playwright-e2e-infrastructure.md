## Story: Playwright E2E test infrastructure for wuce feature

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e4-phase2-guided-ui.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As a **subagent implementing a Wave 4 or later wuce story**,
I want a pre-wired Playwright configuration, auth bypass fixture, and per-story spec file skeleton,
So that I can write E2E tests without any infrastructure setup — and every manual "human smoke test" in a verification script can instead be a deterministic, automated pass/fail signal in CI.

## Benefit Linkage

**Metric moved:** T1 — Agent implementation accuracy (Wave 4 ACs verified automatically rather than by human smoke test)
**How:** Manual human smoke tests in verification scripts wuce.13–16 cover the same scenarios as the unit tests but from the browser's perspective — they are currently unautomated. Moving them to Playwright means each human verification step becomes a CI signal, reducing the human review burden and catching regressions that unit tests miss (rendering, routing, DOM state transitions). This directly improves the confidence level of the wave-4 AC verification pass, which is the trigger for marking stories DoD-complete.

## Architecture Constraints

- ADR-014 (proposed by this story): Playwright is the E2E framework for the wuce feature. All browser-facing AC verification that is currently tagged "human smoke test" must eventually be covered by a Playwright spec in `tests/e2e/`. New stories after wuce.17 must add a spec file to `tests/e2e/` as part of their DoR contract.
- The auth bypass fixture must set the server's session cookie to a known test identity — it must not call GitHub OAuth in test mode. The bypass is enabled exclusively when `NODE_ENV=test` (or an explicit E2E flag). It must be impossible to enable in production by configuration error.
- Playwright is a devDependency only. Zero new production runtime dependencies introduced by this story.
- E2E tests do not replace unit tests — they run as a separate `test:e2e` script. The existing `npm test` (unit + integration) chain is unchanged.
- The E2E CI gate is opt-in via `audit.e2e_tests: true` in `context.yml`. E2E gate failure is non-fatal to PR merge in v1 (same pattern as `audit.ci_attachment` from caa.3). This allows the gate to ramp up as specs are filled in without blocking merge.
- `playwright.config.js` derives `baseURL` from `process.env.E2E_BASE_URL`, defaulting to `http://localhost:3000`. The server is started by Playwright's `webServer` config (not a separate manual step).

## Dependencies

- **Upstream:** wuce.1 (OAuth session cookie — the auth bypass fixture mimics its output); wuce.13 (skill launcher routes — the first real E2E spec targets these)
- **Downstream:** wuce.13–16 E2E coverage stories (subagents fill in the placeholder specs after wuce.17 is merged)

## Acceptance Criteria

**AC1:** Given Playwright is installed as a devDependency and `playwright.config.js` exists, When `npm run test:e2e` is run in a clean checkout (after `npm install`), Then all E2E tests exit 0 — the infrastructure smoke test passes and the Playwright binary is available without a separate install step.

**AC2:** Given the auth bypass fixture at `tests/e2e/fixtures/auth.js`, When any E2E test uses the `withAuth` extended test object, Then the request to the running server is treated as authenticated with a test user (`{ userId: 'e2e-test-user', login: 'e2e-tester' }`) — no real GitHub OAuth redirect occurs. The fixture must only be activatable when `NODE_ENV=test`.

**AC3:** Given `playwright.config.js` at the repo root, When it is loaded by the Playwright runner, Then it exports a valid config with: `testDir: 'tests/e2e'`, `use.baseURL` defaulting to `http://localhost:3000`, `use.headless: true`, and `timeout: 30000`. The `webServer` block starts `src/web-ui/server.js` automatically if no server is already listening on the base URL port.

**AC4:** Given `.github/workflows/e2e.yml` and `audit.e2e_tests: true` in `context.yml`, When a PR is opened, Then the E2E workflow step runs `npm run test:e2e` and reports the result as a non-fatal check — E2E pass/fail is visible in the PR status panel but does not block merge.

**AC5:** Given the placeholder spec files for wuce.13–16 (`tests/e2e/skill-launcher.spec.js`, `tests/e2e/artefact-preview.spec.js`, `tests/e2e/artefact-writeback.spec.js`, `tests/e2e/session-persistence.spec.js`), When a subagent opens any of these files, Then it finds at minimum: one `test.todo()` for each AC from the corresponding story's verification script "human smoke test" steps, and a `test('smoke: server responds 200', ...)` that runs against the base URL — providing a clear entry point to add real assertions without any config work.

## Out of Scope

- Writing real (non-todo) E2E test assertions for wuce.13–16 — those are follow-on stories dispatched to E3/E4 subagents after this infrastructure story is merged
- Visual regression testing (screenshot diffing) — this is explicit tech-debt; Playwright screenshot capabilities are available but screenshot-based tests are not written in this story
- Cross-browser testing (Firefox, WebKit) — Chromium-only in v1; multi-browser is a progressive enhancement
- Mobile viewport testing — out of scope for this story
- E2E coverage for wuce.1–wuce.12 (Phase 1 stories) — the placeholder files cover only wuce.13–16 (Wave 4); prior stories can add specs in follow-up

## NFRs

- **Security:** Auth bypass fixture activatable only in `NODE_ENV=test`. No real credentials or tokens in test fixtures. Test identities clearly labelled as synthetic (e.g. `e2e-test-user`).
- **CI:** E2E workflow must not use `contents: write` permission (ADR-009). Playwright artefacts (traces, screenshots on failure) uploaded via `actions/upload-artifact` with `retention-days: 7`.
- **Developer experience:** `npm run test:e2e` must complete the full suite (smoke + todo stubs) in under 30 seconds from a warm server. `npm run test:e2e:ui` must open the Playwright UI mode for local debugging.
- **No lock-in:** Playwright config must not hardcode feature-specific paths — `testDir: 'tests/e2e'` is the only project-level setting. Individual spec files own their own routing and fixture usage.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable
