# Contract Proposal: Playwright E2E test infrastructure

**Story:** wuce.17
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-06

---

## Components built by this story

- `playwright.config.js` — Playwright configuration at repo root; `testDir: 'tests/e2e'`; `use.headless: true`; `timeout: 30000`; `webServer` auto-start block; `use.baseURL` from `E2E_BASE_URL` env with `http://localhost:3000` fallback
- `tests/e2e/fixtures/auth.js` — Playwright test fixture (`test.extend` pattern) that injects a synthetic session cookie (`e2e-test-user`) into each test request context; guarded by `NODE_ENV=test` check; no real OAuth tokens
- `tests/e2e/smoke.spec.js` — Two passing smoke tests: server starts and responds HTTP 200 on `/`; root response is HTML not a JSON error
- `tests/e2e/skill-launcher.spec.js` — Placeholder for wuce.13 ACs; ≥3 descriptive `test.todo()` stubs + one passing server smoke test
- `tests/e2e/artefact-preview.spec.js` — Placeholder for wuce.14 ACs; ≥3 descriptive `test.todo()` stubs + one passing server smoke test
- `tests/e2e/artefact-writeback.spec.js` — Placeholder for wuce.15 ACs; ≥3 descriptive `test.todo()` stubs + one passing server smoke test
- `tests/e2e/session-persistence.spec.js` — Placeholder for wuce.16 ACs; ≥3 descriptive `test.todo()` stubs + one passing server smoke test
- `tests/check-wuce17-e2e-infra.js` — Infrastructure validation check script; uses standard wuce `async test()` pattern; 16 assertions across file existence, config content, devDependency declaration, placeholder stub count, and CI workflow content; added to `npm test` chain
- `.github/workflows/e2e.yml` — E2E CI gate workflow; runs `npm run test:e2e` on pull_request events; reads `audit.e2e_tests` from `context.yml` for opt-in gate; `continue-on-error: true` on Playwright step; uploads traces/screenshots via `actions/upload-artifact` (retention: 7 days); permissions: `{ contents: read }`
- `package.json` changes — add `"test:e2e": "playwright test"` and `"test:e2e:ui": "playwright test --ui"` scripts; add `@playwright/test` to `devDependencies`
- `.github/architecture-guardrails.md` — ADR-018 (Playwright as E2E testing framework) is pre-committed to master as part of the artefact chain; no additional edit needed by coding agent

## Components NOT built by this story

- Real (non-todo) E2E test assertions for wuce.13–16 — those are authored by the E3/E4 subagents dispatched after this infrastructure story is merged
- Visual regression / screenshot diffing tests
- Firefox or WebKit browser configuration (Chromium-only in v1)
- Mobile viewport test profiles
- E2E coverage for wuce.1–wuce.12 (Phase 1 stories)
- Changes to any file in `src/` (the auth bypass is test-layer only)
- Changes to any production npm dependency

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | `npm run test:e2e` exits 0 | T3.1 (script exists), T3.2 (invokes playwright), T6.1 + T6.2 (smoke pass) |
| AC2 | Auth bypass fixture; no real OAuth; NODE_ENV=test guard | T2.1 (exists), T2.2 (exports withAuth), T2.3 (no token strings), T2.4 (NODE_ENV guard) |
| AC3 | `playwright.config.js` fields correct | T1.1–T1.5 (existence, testDir, headless, timeout, webServer) |
| AC4 | E2E CI workflow; non-fatal gate; opt-in | T5.1 (exists), T5.2 (invokes test:e2e), T5.3 (no contents: write) |
| AC5 | Placeholder spec files with ≥3 todo stubs each | T4.1–T4.6 (existence of all 4 specs + smoke; stub count ≥3) |

## Assumptions

- `src/web-ui/server.js` is the server entry point (or equivalent) that Playwright's `webServer.command` will start; coding agent must verify the correct entry point from the existing `src/web-ui/` directory before writing `playwright.config.js`
- The server listens on port 3000 by default; if the actual port differs, the coding agent must read `src/web-ui/server.js` to confirm and update `webServer.url` accordingly
- Session cookie set by the auth bypass fixture follows the same name and format as the session cookie set by wuce.1 OAuth flow — the coding agent must read `src/web-ui/routes/auth.js` (or equivalent) to confirm the session cookie name before writing the fixture

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `playwright.config.js` | Create | Playwright runner configuration at repo root |
| `tests/e2e/fixtures/auth.js` | Create | Auth bypass fixture (Playwright test.extend pattern) |
| `tests/e2e/smoke.spec.js` | Create | 2 passing smoke tests |
| `tests/e2e/skill-launcher.spec.js` | Create | wuce.13 placeholder (≥3 todo stubs + smoke) |
| `tests/e2e/artefact-preview.spec.js` | Create | wuce.14 placeholder (≥3 todo stubs + smoke) |
| `tests/e2e/artefact-writeback.spec.js` | Create | wuce.15 placeholder (≥3 todo stubs + smoke) |
| `tests/e2e/session-persistence.spec.js` | Create | wuce.16 placeholder (≥3 todo stubs + smoke) |
| `tests/check-wuce17-e2e-infra.js` | Create | Infrastructure validation check (16 assertions) |
| `.github/workflows/e2e.yml` | Create | E2E CI gate; opt-in; non-fatal |
| `package.json` | Extend | Add test:e2e + test:e2e:ui scripts; add @playwright/test devDependency |
| `.github/architecture-guardrails.md` | Read-only | ADR-018 pre-committed to master; coding agent verifies it exists, does not modify |

## Out-of-scope file touchpoints (must not be modified)

| File | Reason |
|------|--------|
| Any file under `src/` | Auth bypass is test-layer only; no production code changes |
| Existing `tests/*.test.js` or `tests/check-wuce*.js` files | No changes to existing test files |
| Any file under `artefacts/` | Pipeline inputs; read-only for coding agent |
| `.github/skills/`, `.github/templates/` | Platform infrastructure; read-only for coding agent |

## Contract review

**APPROVED** — all components are within story scope. Infrastructure/test-authoring boundary is clean. Auth bypass constraint (test-layer fixture only, NODE_ENV guard, no src/ changes) is explicit and enforced by T2 assertions. Zero production dependency constraint is enforced by T3.3. Unit chain isolation is enforced by T3.4. ADR-018 was pre-committed to architecture-guardrails.md as part of the artefact chain commit; the coding agent does not need to modify that file.
