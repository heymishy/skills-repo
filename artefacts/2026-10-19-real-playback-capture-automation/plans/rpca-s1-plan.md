# CLI entrypoint authenticates against staging and captures one real screenshot end to end — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every automatable test in the test plan pass: the path-construction unit test (AC2), the mock-server integration test (AC1's own logic), and the missing-env-var/no-secret-leak unit tests (AC3/AC4). AC1/AC2's own real end-to-end claim is explicitly out of scope for the coding agent — RISK-ACCEPTed, verified manually by the operator with the real secret.
**Branch:** `feature/rpca-s1`
**Worktree:** `.worktrees/rpca-s1`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js`

---

## File map

```
Create:
  tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js  — unit + integration tests

Modify:
  scripts/playback-capture.js  — add buildScreenshotPath, authenticateStagingSession,
                                   runCli entrypoint; export new functions; add the
                                   require.main === module CLI trigger block
```

---

## Task 1: `buildScreenshotPath` — path-construction helper matching the existing convention

**Files:**
- Modify: `scripts/playback-capture.js`
- Create: `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js`

- [ ] **Step 1: Write the failing test**

Create `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js` with this content:

```javascript
'use strict';
// check-rpca-s1-cli-entrypoint-and-first-real-capture.js -- TDD tests for rpca-s1
// (2026-10-19-real-playback-capture-automation).
// Story: artefacts/2026-10-19-real-playback-capture-automation/stories/rpca-s1-cli-entrypoint-and-first-real-capture.md
const assert = require('assert');

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly
(function () {
  const { buildScreenshotPath } = require('../scripts/playback-capture');
  try {
    const result = buildScreenshotPath('f1', 's1', 'AC1');
    assert.strictEqual(result, 'artefacts/f1/playback/s1/screenshots/AC1.png', 'expected the exact existing path convention');
    pass('AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly');
  } catch (e) { fail('AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly', e); }
})();

console.log(`\n[rpca-s1-cli-entrypoint-and-first-real-capture] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
```

Expected output: `TypeError: buildScreenshotPath is not a function`, 1 FAIL.

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`, insert this function immediately before `module.exports = {` (currently line 141):

```javascript
// rpca-s1: path-construction helper matching captureAcScreenshots' own existing
// convention exactly (artefacts/<feature>/playback/<story>/screenshots/<acId>.png).
// A standalone function, not a refactor of captureAcScreenshots itself -- the new
// CLI entrypoint needs this same shape at a new call site.
function buildScreenshotPath(featureSlug, storySlug, acId) {
  return `artefacts/${featureSlug}/playback/${storySlug}/screenshots/${acId}.png`;
}
```

Add `buildScreenshotPath` to `module.exports`:

```javascript
module.exports = {
  checkDodGate, parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets,
  generateWalkthroughMarkdown, captureAcScreenshots, embedScreenshotPaths,
  getPackageStatus, markPackageReviewed,
  captureVideoRecording,
  generateCaptionsForVideo,
  isPackageComplete,
  buildScreenshotPath,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
```

Expected output:
```
  [PASS] AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly

[rpca-s1-cli-entrypoint-and-first-real-capture] Results: 1 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, `0` failed.

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
git commit -m "feat(rpca-s1): add buildScreenshotPath matching the existing convention"
```

---

## Task 2: `authenticateStagingSession` — real auth logic, proven against a local mock server

**Files:**
- Modify: `scripts/playback-capture.js`
- Modify: `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js`

- [ ] **Step 1: Write the failing test**

Append this test block to `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js`, before the final `console.log`:

```javascript
// AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server
await (async function () {
  const http = require('http');
  const { authenticateStagingSession } = require('../scripts/playback-capture');
  const fixtureSecret = 'fixture-secret-value-not-real';
  let receivedHeader = null;
  const server = http.createServer((req, res) => {
    receivedHeader = req.headers['x-e2e-test-endpoint-bypass'];
    res.writeHead(200, { 'Set-Cookie': 'session_id=fixture-session-abc123; HttpOnly; SameSite=Lax; Path=/' });
    res.end(JSON.stringify({ sessionId: 'fixture-session-abc123' }));
  });
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  try {
    const sessionId = await authenticateStagingSession(`http://localhost:${port}`, fixtureSecret);
    assert.strictEqual(receivedHeader, fixtureSecret, 'expected the secret to be sent in the x-e2e-test-endpoint-bypass header');
    assert.strictEqual(sessionId, 'fixture-session-abc123', 'expected the parsed session id from the Set-Cookie header');
    pass('AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server');
  } catch (e) { fail('AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server', e); }
  finally { server.close(); }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
```

Expected output: the new test FAILs with `TypeError: authenticateStagingSession is not a function` (Task 1's own test still PASSes).

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`, insert this function immediately after `buildScreenshotPath`, still before `module.exports`:

```javascript
// rpca-s1: authenticates against a real deployed wuce-staging instance by calling
// its own existing GET /test/session route (src/web-ui/server.js,
// _isTestEndpointAllowed's staging-secret branch) -- confirmed at /clarify that
// tests/e2e/fixtures/auth.js already calls this exact route for every local E2E
// test. No new route, no widened blast radius (ADR-026).
const http = require('http');
const https = require('https');

function authenticateStagingSession(baseUrl, secret) {
  return new Promise((resolve, reject) => {
    const url = new URL('/test/session', baseUrl);
    const client = url.protocol === 'https:' ? https : http;
    const req = client.request(url, {
      method: 'GET',
      headers: { 'x-e2e-test-endpoint-bypass': secret },
    }, (res) => {
      const setCookie = res.headers['set-cookie'];
      if (!setCookie || setCookie.length === 0) {
        reject(new Error('Authentication failed: no Set-Cookie header in /test/session response'));
        return;
      }
      const match = setCookie[0].match(/session_id=([^;]+)/);
      if (!match) {
        reject(new Error('Authentication failed: session_id not found in Set-Cookie header'));
        return;
      }
      res.resume();
      resolve(match[1]);
    });
    req.on('error', reject);
    req.end();
  });
}
```

Add `authenticateStagingSession` to `module.exports`:

```javascript
module.exports = {
  checkDodGate, parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets,
  generateWalkthroughMarkdown, captureAcScreenshots, embedScreenshotPaths,
  getPackageStatus, markPackageReviewed,
  captureVideoRecording,
  generateCaptionsForVideo,
  isPackageComplete,
  buildScreenshotPath, authenticateStagingSession,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
```

Expected output:
```
  [PASS] AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly
  [PASS] AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server

[rpca-s1-cli-entrypoint-and-first-real-capture] Results: 2 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, `0` failed.

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
git commit -m "feat(rpca-s1): add authenticateStagingSession, proven against a local mock server"
```

---

## Task 3: CLI entrypoint — missing secret fails loudly with a named error (AC3)

**Files:**
- Modify: `scripts/playback-capture.js`
- Modify: `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js`

- [ ] **Step 1: Write the failing test**

Append this test block, before the final `console.log`:

```javascript
// AC3 (unit): runCli throws a clear, named error when the secret env var is missing
(function () {
  const { runCli } = require('../scripts/playback-capture');
  const saved = process.env.E2E_STAGING_AUTH_STUB_SECRET;
  delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
  try {
    let threw = null;
    try { runCli(['node', 'playback-capture.js', 'some-feature-slug']); }
    catch (e) { threw = e; }
    assert.ok(threw, 'expected runCli to throw synchronously when the secret is missing');
    assert.ok(threw.message.includes('E2E_STAGING_AUTH_STUB_SECRET'), 'expected the error message to name the missing env var');
    pass('AC3 (unit): runCli throws a clear, named error when the secret env var is missing');
  } catch (e) { fail('AC3 (unit): runCli throws a clear, named error when the secret env var is missing', e); }
  finally { if (saved !== undefined) process.env.E2E_STAGING_AUTH_STUB_SECRET = saved; }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
```

Expected output: the new test FAILs with `TypeError: runCli is not a function` (Tasks 1-2's own tests still PASS).

- [ ] **Step 3: Write minimal implementation**

In `scripts/playback-capture.js`, insert this immediately after `authenticateStagingSession`, still before `module.exports`:

```javascript
// rpca-s1: real CLI entrypoint. argv[2] is the feature slug. Validates the
// required secret env var synchronously, before any async work, so a missing
// secret fails immediately and loudly -- not a confusing auth error surfaced
// later from the staging server itself.
const CAPTURE_SECRET_ENV_VAR = 'E2E_STAGING_AUTH_STUB_SECRET';
const STAGING_BASE_URL = 'https://wuce-staging.fly.dev';

function runCli(argv) {
  const secret = process.env[CAPTURE_SECRET_ENV_VAR];
  if (!secret) {
    throw new Error(
      `Missing required environment variable: ${CAPTURE_SECRET_ENV_VAR}. ` +
      `Set it to the staging auth-stub secret before running this CLI.`
    );
  }
  const featureSlug = argv[2];
  if (!featureSlug) {
    throw new Error('Missing required argument: feature-slug. Usage: node scripts/playback-capture.js <feature-slug>');
  }
  return runCaptureForFeature(featureSlug, secret);
}

// rpca-s1: the real end-to-end capture flow -- authenticates, launches a real
// Playwright browser with the session cookie, navigates to one hand-picked AC's
// own URL (hardcoded for this story; rpca-s2 generalises this), and saves a
// real screenshot. This function's own real-world behaviour is RISK-ACCEPTed
// for automated execution (decisions.md, 2026-10-19) -- it needs a real secret
// and real network access this test suite does not have. Proven manually.
async function runCaptureForFeature(featureSlug, secret) {
  const { chromium } = require('playwright');
  const sessionId = await authenticateStagingSession(STAGING_BASE_URL, secret);
  const browser = await chromium.launch();
  const context = await browser.newContext();
  await context.addCookies([{
    name: 'session_id', value: sessionId, url: STAGING_BASE_URL,
  }]);
  const page = await context.newPage();
  // Hand-picked proof target for this story -- rpca-s2 generalises AC/selector
  // derivation from existing E2E specs instead of this hardcoded pair.
  const targetUrl = `${STAGING_BASE_URL}/playback/${featureSlug}`;
  const targetSelector = '.playback-summary';
  const targetAcId = 'AC1';
  const targetStorySlug = 'rpca-s1-proof';
  await page.goto(targetUrl);
  const relPath = buildScreenshotPath(featureSlug, targetStorySlug, targetAcId);
  await page.screenshot({ path: relPath, selector: targetSelector });
  await browser.close();
  return { acId: targetAcId, path: relPath };
}

if (require.main === module) {
  try {
    runCli(process.argv).then(
      () => { /* success -- real capture completed */ },
      (err) => { console.error(`[playback-capture] ${err.message}`); process.exitCode = 1; }
    );
  } catch (err) {
    console.error(`[playback-capture] ${err.message}`);
    process.exitCode = 1;
  }
}
```

Add `runCli` to `module.exports`:

```javascript
module.exports = {
  checkDodGate, parseDodAcCoverage, parseDodMetricSignal, parseBenefitMetricTargets,
  generateWalkthroughMarkdown, captureAcScreenshots, embedScreenshotPaths,
  getPackageStatus, markPackageReviewed,
  captureVideoRecording,
  generateCaptionsForVideo,
  isPackageComplete,
  buildScreenshotPath, authenticateStagingSession, runCli,
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
```

Expected output:
```
  [PASS] AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly
  [PASS] AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server
  [PASS] AC3 (unit): runCli throws a clear, named error when the secret env var is missing

[rpca-s1-cli-entrypoint-and-first-real-capture] Results: 3 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, `0` failed.

- [ ] **Step 6: Commit**

```bash
git add scripts/playback-capture.js tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
git commit -m "feat(rpca-s1): add runCli entrypoint with a named error for a missing secret"
```

---

## Task 4: The secret value never appears in any output (AC4)

**Files:**
- Modify: `tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js` only — no production code change expected; this task writes the test that *confirms* Task 3's own error-handling already satisfies AC4 (the error message only names the env var, never its value).

- [ ] **Step 1: Write the failing test**

Append this test block, before the final `console.log`:

```javascript
// AC4 (unit): the secret value never appears in captured output, on the failure path
(function () {
  const { runCli } = require('../scripts/playback-capture');
  const fixtureSecret = 'fixture-secret-value-should-never-leak';
  const saved = process.env.E2E_STAGING_AUTH_STUB_SECRET;
  process.env.E2E_STAGING_AUTH_STUB_SECRET = fixtureSecret;
  const originalError = console.error;
  const captured = [];
  console.error = (...args) => { captured.push(args.join(' ')); };
  try {
    // Missing feature-slug argument -- a failure path that still has the
    // secret set, to confirm the secret doesn't leak even when something
    // else goes wrong after the secret check passes.
    let threw = null;
    try { runCli(['node', 'playback-capture.js']); }
    catch (e) { threw = e; }
    assert.ok(threw, 'expected runCli to throw for a missing feature-slug argument');
    const allOutput = captured.join('\n') + (threw ? threw.message : '');
    assert.ok(!allOutput.includes(fixtureSecret), 'expected the secret value to never appear in output or error messages');
    pass("AC4 (unit): the secret value never appears in captured output, on the failure path");
  } catch (e) { fail("AC4 (unit): the secret value never appears in captured output, on the failure path", e); }
  finally {
    console.error = originalError;
    if (saved !== undefined) process.env.E2E_STAGING_AUTH_STUB_SECRET = saved; else delete process.env.E2E_STAGING_AUTH_STUB_SECRET;
  }
})();
```

- [ ] **Step 2: Run test — must fail or pass?**

```bash
node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
```

Expected output: this test should already PASS against Task 3's own implementation (the error messages never interpolate the secret value) — if it fails, it means Task 3's own error-handling accidentally included the secret somewhere, which must be fixed before proceeding. This is the one task in this plan where "the test passes immediately" is the correct, expected RED-phase-skipped outcome, because Task 4 is confirming an already-true property rather than driving new production code.

- [ ] **Step 3: No production code change needed**

If Step 2 passed, no implementation step is required — AC4 is already satisfied by Task 3's own design (error messages interpolate only the env var *name*, never `process.env[CAPTURE_SECRET_ENV_VAR]`'s own value). If Step 2 unexpectedly failed, fix whichever line in `runCli`/`runCaptureForFeature` leaked the value before proceeding.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
```

Expected output:
```
  [PASS] AC2 (unit): buildScreenshotPath matches the existing captureAcScreenshots convention exactly
  [PASS] AC1 (integration): authenticateStagingSession parses a real Set-Cookie response from a local mock server
  [PASS] AC3 (unit): runCli throws a clear, named error when the secret env var is missing
  [PASS] AC4 (unit): the secret value never appears in captured output, on the failure path

[rpca-s1-cli-entrypoint-and-first-real-capture] Results: 4 passed, 0 failed
```

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all files pass, `0` failed.

- [ ] **Step 6: Commit**

```bash
git add tests/check-rpca-s1-cli-entrypoint-and-first-real-capture.js
git commit -m "test(rpca-s1): confirm the secret value never leaks on the failure path (AC4)"
```
