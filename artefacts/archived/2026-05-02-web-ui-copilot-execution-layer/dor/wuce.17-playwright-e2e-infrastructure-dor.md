# Definition of Ready: Playwright E2E test infrastructure

**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Story:** wuce.17 — Playwright E2E test infrastructure
**Epic:** E4 — Phase 2 Guided UI (infrastructure story)
**DoR run date:** 2026-05-06
**Reviewer:** Agent (automated check)

---

## Hard Blocks

| Block | Description | Status | Notes |
|-------|-------------|--------|-------|
| H1 | User story follows As/Want/So that format | PASS | "As a subagent implementing a Wave 4 or later wuce story / I want a pre-wired Playwright configuration, auth bypass fixture, and per-story spec file skeleton / So that I can write E2E tests without any infrastructure setup…" |
| H2 | All ACs written in Given/When/Then with ≥3 ACs | PASS | 5 ACs, all in Given/When/Then format |
| H3 | Every AC has at least one test in the test plan | PASS | 18 tests across T1–T6; each AC covered by at least 2 tests |
| H4 | Out of scope section declared and non-trivial | PASS | Visual regression testing, cross-browser (Firefox/WebKit), mobile viewports, wuce.1–12 E2E coverage, and writing real (non-todo) assertions for wuce.13–16 all explicitly excluded |
| H5 | Benefit linkage names a specific metric | PASS | T1 — Agent implementation accuracy; human smoke tests in verification scripts become automated CI signals, improving Wave 4 AC verification confidence |
| H6 | Complexity rated and scope stability declared | PASS | Complexity 2 / Stable |
| H7 | No HIGH review findings open | PASS | Review run 1 — PASS; highFindings: 0; 3 LOWs all addressed in coding agent instructions below |
| H8 | Every AC is traceable to at least one test | PASS | AC1 → T3 + T6; AC2 → T2; AC3 → T1; AC4 → T5; AC5 → T4 |
| H8-ext | No unresolved schemaDepends declarations | N/A | No pipeline-state.json schema field dependencies declared |
| H9 | Architecture constraints populated and reference guardrails | PASS | Auth bypass activatable only in `NODE_ENV=test` and via Playwright fixture injection (not server-wide middleware); zero production runtime dependencies; E2E tests isolated from unit test chain; ADR-018 (Playwright as the wuce E2E framework) proposed and accepted for this story |
| H-E2E | CSS-layout-dependent ACs have E2E tests | N/A | wuce.17 is the infrastructure story that establishes E2E tooling — it has no CSS-layout-dependent ACs of its own; this block becomes relevant for all wuce stories written after this story is merged |
| H-NFR | NFRs declared for each active category | PASS | Security (NODE_ENV guard, no token storage, fixture-only bypass), CI (non-fatal gate, no `contents: write`), Developer experience (`npm run test:e2e` completes < 30s warm, `test:e2e:ui` for debugging) |
| H-NFR2 | Compliance NFR with regulatory clause has human sign-off | N/A | No regulatory compliance clauses |
| H-NFR3 | Data classification not blank in NFR profile | PASS | NFR profile (nfr-profile.md) covers credential handling; auth bypass guard is a concrete extension of that profile |
| H-NFR-profile | Feature-level NFR profile exists | PASS | artefacts/2026-05-02-web-ui-copilot-execution-layer/nfr-profile.md |
| H-GOV | Discovery approved by named non-engineering approver | PASS | Hamish King (Chief Product Guru) and Jenni Ralph (Chief Product Guru) — 2026-05-02 |

**Hard block result: ALL PASS — proceed to warnings.**

---

## Warnings

| Warning | Description | Status | Notes |
|---------|-------------|--------|-------|
| W1 | New pipeline-state.json fields require schema update first | N/A | No new pipeline-state.json fields introduced |
| W2 | Scope stability is Unstable | N/A | Scope stability is Stable — no warning applicable |
| W3 | MEDIUM review findings acknowledged in /decisions | ✅ | No MEDIUM findings in wuce.17 review run 1 |
| W4 | Verification script reviewed by domain expert | ⚠️ | Verification script exists (wuce.17-playwright-e2e-infrastructure-verification.md); domain expert review not recorded — operator should confirm security gate steps (AC2 auth bypass) before dispatch |
| W5 | No UNCERTAIN items in test plan gap table | ✅ | Test plan gap table contains no UNCERTAIN items |

**Warnings: W4 acknowledged — proceed.**

---

## Oversight Level

**Medium** — Infrastructure story (no production code changes, no user-facing behaviour, Complexity 2 / Stable). However, given the security constraint on the auth bypass fixture, the PR must include a human review of `tests/e2e/fixtures/auth.js` before merge to confirm no real credentials are present. This is the single manual gate for this story.

---

## Coding Agent Instructions

```
Proceed: Yes
Story: Playwright E2E test infrastructure — artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.17-playwright-e2e-infrastructure.md
Test plan: artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.17-playwright-e2e-infrastructure-test-plan.md
Verification script: artefacts/2026-05-02-web-ui-copilot-execution-layer/verification-scripts/wuce.17-playwright-e2e-infrastructure-verification.md

Goal:
Make ALL of the following pass, in order:
  1. node tests/check-wuce17-e2e-infra.js  (T1–T5: 16 assertions, all PASS, exit 0)
  2. NODE_ENV=test npm run test:e2e         (T6: smoke.spec.js 2 tests PASS, todo stubs skipped, exit 0)

Do not add scope beyond what the tests and ACs specify.

--- Architecture constraints ---

Auth bypass (CRITICAL — 17-L1 resolution):
- The auth bypass is a Playwright test fixture (test.extend pattern), NOT a server-side middleware
- The bypass works by injecting a session cookie into each Playwright request context BEFORE the page.goto() call
- The server's existing session middleware (wuce.1) reads and validates this cookie as normal
- There is NO change to src/ files — the bypass lives entirely in tests/e2e/fixtures/auth.js
- The fixture must include: if (process.env.NODE_ENV !== 'test') { throw new Error('auth bypass only available in NODE_ENV=test'); }
- The test identity must be clearly synthetic: { userId: 'e2e-test-user', login: 'e2e-tester' }
- The fixture must NOT contain any string matching /gho_|ghp_|github_pat_/

Playwright devDependency (CRITICAL):
- Add @playwright/test to devDependencies in package.json, NOT dependencies
- The Playwright browser binary is installed via `npx playwright install chromium` — add this as a postinstall script or document it in the PR description
- Zero new entries in dependencies (production runtime)

npm test chain is immutable (CRITICAL):
- The existing npm test script must not be changed (do not add playwright or test:e2e to it)
- Add only: "test:e2e": "playwright test" and "test:e2e:ui": "playwright test --ui" as new scripts
- After implementation, running npm test must produce zero new failures compared to pre-wuce.17 baseline

playwright.config.js:
- File location: repo root (same level as package.json)
- testDir: 'tests/e2e'
- use.baseURL: process.env.E2E_BASE_URL || 'http://localhost:3000'
- use.headless: true
- timeout: 30000
- webServer.command: 'node src/web-ui/server.js' (or equivalent entry point — check src/ for the correct server entry)
- webServer.url: 'http://localhost:3000' (health check URL)
- webServer.reuseExistingServer: !process.env.CI
- webServer.env: { NODE_ENV: 'test' }

CI workflow .github/workflows/e2e.yml:
- Read scripts/ci-attachment-config.js for the opt-in gate pattern (reference: audit.ci_attachment)
- Mirror the same pattern for audit.e2e_tests: true in context.yml
- The Playwright run step must have: continue-on-error: true
- Workflow permissions: { contents: read } — never contents: write (ADR-009)
- Playwright traces and screenshots on failure: upload via actions/upload-artifact, retention-days: 7
- The workflow must install Playwright browsers: run: npx playwright install --with-deps chromium

Placeholder spec files (17-L3 resolution):
Each placeholder spec file must have at least 3 descriptive test.todo() stubs — one per major human smoke test step in the corresponding story's verification script. Stubs must be descriptive, not blank:
  - WRONG: test.todo()
  - RIGHT:  test.todo('AC1: skills list shows all available skills from wuce.11 discovery')
For each placeholder file, include one passing smoke test:
  test('smoke: page loads without error', async ({ page }) => {
    const response = await page.goto('/');
    expect(response.status()).toBe(200);
  });

Check script tests/check-wuce17-e2e-infra.js:
- Use the same async test() helper pattern as all other wuce check scripts in tests/
- Run: node tests/check-wuce17-e2e-infra.js
- 16 test assertions across T1–T5 (config, fixture, scripts, spec files, CI workflow)
- Exit 0 if all pass, exit 1 if any fail (standard wuce check pattern)

--- Constraints ---
- Do NOT modify any file in src/ (the auth bypass is test-layer only)
- Do NOT modify existing test files in tests/ (no changes to check-wuce*.js or *.test.js files already committed)
- Do NOT add @playwright/test to the npm test chain
- Do NOT add any entry to the production dependencies section of package.json
- Read .github/architecture-guardrails.md before implementing — ADR-018 (Playwright as E2E framework) is already in that file as of this PR's merge

--- Open a draft PR when both verification commands exit 0 ---
```
