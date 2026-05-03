# Test Plan: wuce.17 — Playwright E2E test infrastructure

**Story:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.17-playwright-e2e-infrastructure.md
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Epic:** wuce-e4 (Phase 2 guided UI — infrastructure story)
**Frameworks:** Node.js assertion script (`tests/check-wuce17-e2e-infra.js`) for T1–T5; Playwright (`npm run test:e2e`) for T6
**Test data strategy:** No fixtures required — all T1–T5 checks are static file inspection; T6 uses Playwright's built-in `webServer` auto-start
**Written:** 2026-05-06
**Status:** Failing (TDD — no implementation exists)

---

## Summary

| Category | Count |
|----------|-------|
| Infrastructure validation (check script) | 16 |
| End-to-end smoke (Playwright) | 2 |
| **Total** | **18** |

---

## Key constraint: two distinct test runners

T1–T5 run via `node tests/check-wuce17-e2e-infra.js` — a Node.js file inspection script using the same `async function test(name, fn)` helper pattern as all other wuce check scripts. These tests validate the infrastructure files exist and contain the correct content. They run in the standard `npm test` chain.

T6 runs via `npm run test:e2e` — Playwright executing `tests/e2e/smoke.spec.js`. This is the first live Playwright run and proves the whole stack is wired. It is intentionally separate from the `npm test` chain (per AC1 / NFR). `npm run test:e2e` must exit 0 once implementation is complete.

**Important:** The coding agent must make T1–T5 pass in `check-wuce17-e2e-infra.js` AND make `npm run test:e2e` exit 0 (T6). Both checks must pass before the PR is opened.

---

## AC mapping

| AC | Summary | Test group |
|----|---------|-----------|
| AC1 | `npm run test:e2e` exits 0 from clean install | T3, T6 |
| AC2 | Auth bypass fixture injects test identity; no real OAuth; only active when `NODE_ENV=test` | T2 |
| AC3 | `playwright.config.js` exports `testDir`, `baseURL`, `headless: true`, `timeout: 30000`, `webServer` | T1 |
| AC4 | `.github/workflows/e2e.yml` runs E2E tests as non-fatal gate, reads `audit.e2e_tests` | T5 |
| AC5 | Placeholder spec files exist for wuce.13–16; each has ≥3 `test.todo()` stubs | T4 |

---

## Test groups

### T1 — Playwright config file

Module under test: `playwright.config.js` at repo root

**T1.1** — `playwright.config.js` exists
```javascript
const path = require('path');
const assert = require('assert');
const fs = require('fs');
const configPath = path.join(__dirname, '..', 'playwright.config.js');
assert.ok(fs.existsSync(configPath), 'playwright.config.js must exist at repo root');
```
Expected: FAIL

**T1.2** — Config exports `testDir: 'tests/e2e'`
```javascript
const config = require('../playwright.config.js');
const cfg = config.default || config;
assert.strictEqual(cfg.testDir, 'tests/e2e', "testDir must be 'tests/e2e'");
```
Expected: FAIL

**T1.3** — Config has `use.headless: true`
```javascript
const config = require('../playwright.config.js');
const cfg = config.default || config;
assert.strictEqual(cfg.use && cfg.use.headless, true, 'use.headless must be true');
```
Expected: FAIL

**T1.4** — Config has `timeout` ≤ 30 seconds
```javascript
const config = require('../playwright.config.js');
const cfg = config.default || config;
assert.ok(typeof cfg.timeout === 'number' && cfg.timeout <= 30000,
  'timeout must be a number ≤ 30000 ms');
```
Expected: FAIL

**T1.5** — Config has `webServer` block with `command` and `url` fields
```javascript
const config = require('../playwright.config.js');
const cfg = config.default || config;
assert.ok(cfg.webServer && typeof cfg.webServer.command === 'string',
  'webServer.command must be set');
assert.ok(cfg.webServer && typeof cfg.webServer.url === 'string',
  'webServer.url must be set (health check URL for the started server)');
```
Expected: FAIL

---

### T2 — Auth bypass fixture

Module under test: `tests/e2e/fixtures/auth.js`

**T2.1** — `tests/e2e/fixtures/auth.js` exists
```javascript
const fixturePath = path.join(__dirname, '..', 'tests', 'e2e', 'fixtures', 'auth.js');
assert.ok(fs.existsSync(fixturePath), 'tests/e2e/fixtures/auth.js must exist');
```
Expected: FAIL

**T2.2** — Fixture exports a `withAuth` property (Playwright test.extend pattern)
```javascript
const auth = require('../tests/e2e/fixtures/auth.js');
assert.ok(auth.withAuth !== undefined, 'auth.js must export a withAuth extended test object');
```
Expected: FAIL

**T2.3** — Fixture source does NOT contain real token patterns (`gho_` or `ghp_`)
```javascript
const authSource = fs.readFileSync(
  path.join(__dirname, '..', 'tests', 'e2e', 'fixtures', 'auth.js'), 'utf8');
assert.ok(!authSource.includes('gho_'), 'auth fixture must not contain real GitHub OAuth token prefix');
assert.ok(!authSource.includes('ghp_'), 'auth fixture must not contain real personal access token prefix');
```
Expected: FAIL (file doesn't exist yet, so readFileSync throws — also counts as failure)

**T2.4** — Fixture guards activation with `NODE_ENV === 'test'` check
```javascript
const authSource = fs.readFileSync(
  path.join(__dirname, '..', 'tests', 'e2e', 'fixtures', 'auth.js'), 'utf8');
assert.ok(
  authSource.includes("NODE_ENV") && authSource.includes("test"),
  "auth fixture must guard bypass with NODE_ENV === 'test' check"
);
```
Expected: FAIL

---

### T3 — npm scripts and devDependency declaration

Module under test: `package.json`

**T3.1** — `package.json` has a `test:e2e` script
```javascript
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.ok(typeof pkg.scripts['test:e2e'] === 'string', 'package.json must have a test:e2e script');
```
Expected: FAIL

**T3.2** — `test:e2e` script invokes `playwright test` (not jest, mocha, or node)
```javascript
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.ok(
  pkg.scripts['test:e2e'].includes('playwright test'),
  "test:e2e script must invoke 'playwright test'"
);
```
Expected: FAIL

**T3.3** — `@playwright/test` is in `devDependencies`, NOT `dependencies`
```javascript
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.ok(
  pkg.devDependencies && pkg.devDependencies['@playwright/test'],
  '@playwright/test must be in devDependencies'
);
assert.ok(
  !pkg.dependencies || !pkg.dependencies['@playwright/test'],
  '@playwright/test must NOT be in production dependencies'
);
```
Expected: FAIL

**T3.4** — `test:e2e` does NOT appear in the `test` script chain (unit chain is uncontaminated)
```javascript
const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
assert.ok(
  !pkg.scripts.test.includes('test:e2e') && !pkg.scripts.test.includes('playwright'),
  'npm test (unit chain) must not include test:e2e or playwright'
);
```
Expected: FAIL (actually might PASS if Playwright not yet added — but T3.1 will fail first)

---

### T4 — Placeholder spec files

Module under test: `tests/e2e/*.spec.js`

**T4.1** — `tests/e2e/skill-launcher.spec.js` exists
```javascript
assert.ok(
  fs.existsSync(path.join(__dirname, '..', 'tests', 'e2e', 'skill-launcher.spec.js')),
  'tests/e2e/skill-launcher.spec.js must exist'
);
```
Expected: FAIL

**T4.2** — `tests/e2e/artefact-preview.spec.js` exists
```javascript
assert.ok(
  fs.existsSync(path.join(__dirname, '..', 'tests', 'e2e', 'artefact-preview.spec.js')),
  'tests/e2e/artefact-preview.spec.js must exist'
);
```
Expected: FAIL

**T4.3** — `tests/e2e/artefact-writeback.spec.js` exists
```javascript
assert.ok(
  fs.existsSync(path.join(__dirname, '..', 'tests', 'e2e', 'artefact-writeback.spec.js')),
  'tests/e2e/artefact-writeback.spec.js must exist'
);
```
Expected: FAIL

**T4.4** — `tests/e2e/session-persistence.spec.js` exists
```javascript
assert.ok(
  fs.existsSync(path.join(__dirname, '..', 'tests', 'e2e', 'session-persistence.spec.js')),
  'tests/e2e/session-persistence.spec.js must exist'
);
```
Expected: FAIL

**T4.5** — Each spec file contains at least 3 `test.todo(` stubs (one per major human smoke test step)
```javascript
const specFiles = [
  'tests/e2e/skill-launcher.spec.js',
  'tests/e2e/artefact-preview.spec.js',
  'tests/e2e/artefact-writeback.spec.js',
  'tests/e2e/session-persistence.spec.js'
];
for (const f of specFiles) {
  const src = fs.readFileSync(path.join(__dirname, '..', f), 'utf8');
  const count = (src.match(/test\.todo\(/g) || []).length;
  assert.ok(count >= 3, `${f} must contain at least 3 test.todo() stubs, found ${count}`);
}
```
Expected: FAIL

**T4.6** — `tests/e2e/smoke.spec.js` exists
```javascript
assert.ok(
  fs.existsSync(path.join(__dirname, '..', 'tests', 'e2e', 'smoke.spec.js')),
  'tests/e2e/smoke.spec.js must exist'
);
```
Expected: FAIL

---

### T5 — CI workflow

Module under test: `.github/workflows/e2e.yml`

**T5.1** — `.github/workflows/e2e.yml` exists
```javascript
assert.ok(
  fs.existsSync(path.join(__dirname, '..', '.github', 'workflows', 'e2e.yml')),
  '.github/workflows/e2e.yml must exist'
);
```
Expected: FAIL

**T5.2** — Workflow source contains `npm run test:e2e`
```javascript
const workflow = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'e2e.yml'), 'utf8');
assert.ok(
  workflow.includes('npm run test:e2e'),
  'e2e.yml must contain "npm run test:e2e"'
);
```
Expected: FAIL

**T5.3** — Workflow does NOT declare `contents: write` permission
```javascript
const workflow = fs.readFileSync(
  path.join(__dirname, '..', '.github', 'workflows', 'e2e.yml'), 'utf8');
assert.ok(
  !workflow.includes('contents: write'),
  'e2e.yml must not use contents: write permission (ADR-009)'
);
```
Expected: FAIL (file doesn't exist yet)

---

### T6 — End-to-end smoke (Playwright runner)

These tests are written in `tests/e2e/smoke.spec.js` and are executed by `npm run test:e2e` (Playwright, not the check script). They are listed here for traceability.

**T6.1** — Smoke: server starts and responds HTTP 200 on `/`

```javascript
// tests/e2e/smoke.spec.js
const { test, expect } = require('@playwright/test');

test('smoke: server starts and responds 200 on /', async ({ page }) => {
  const response = await page.goto('/');
  expect(response.status()).toBe(200);
});
```
Expected: FAIL (Playwright not installed, config not present)

**T6.2** — Smoke: server response is HTML (not JSON error payload)

```javascript
test('smoke: root response is HTML not a JSON error', async ({ page }) => {
  await page.goto('/');
  const contentType = await page.evaluate(() =>
    document.contentType || document.querySelector('html') ? 'html' : 'other'
  );
  expect(contentType).toBe('html');
});
```
Expected: FAIL (Playwright not installed)

---

## Gap table

| Gap | Risk | Mitigation |
|-----|------|------------|
| Auth bypass fixture is not tested by a real Playwright request in this story — T2 only checks file existence and source content | Medium | Follow-on story wuce.18+ should add an auth integration test; T2.4 guards against the most critical misuse (token storage) |
| CI E2E gate opt-in flag (`audit.e2e_tests`) is checked via workflow source inspection, not by running the workflow | Low | Workflow syntax is validated by `.github/workflows/` YAML linting in CI |
| `webServer` graceful skip (if port already in use) is not asserted | Low | Playwright's built-in `reuseExistingServer: true` handles this; no custom test needed |
