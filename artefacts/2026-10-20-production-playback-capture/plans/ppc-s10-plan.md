# ppc-s10 — Repo-freshness wiring for capture serving + Playback Evidence nav link — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available)
> or /tdd per task if executing in this session.

**Goal:** Capture evidence committed via `commitArtefact` becomes visible in the UI without an app redeploy, and operators can reach the Playback Evidence page from the existing DoD stage view instead of hand-constructing the URL.
**Branch:** `feature/ppc-s10`
**Worktree:** `.worktrees/ppc-s10`
**Test command:** `node scripts/run-all-tests.js` (full suite); individual file: `node tests/check-ppc-s10-repo-freshness-wiring.js` / `node tests/check-ppc-s10-playback-link.js`

---

## File map

```
Create:
  tests/check-ppc-s10-repo-freshness-wiring.js  — AC1/AC2 unit + integration tests for ensureRepoFresh wiring in playback-evidence.js
  tests/check-ppc-s10-playback-link.js           — AC3/AC4 unit + integration tests for the DoD stage view's Playback evidence link

Modify:
  src/web-ui/routes/playback-evidence.js  — add ensureRepoFresh import + 3 call sites (handleGetPlaybackEvidence, handleGetCaptureScreenshot, handleGetCaptureVideo)
  src/web-ui/routes/journey.js            — handleGetJourneyStageView renders a conditional "Playback evidence" link
```

---

## Task 1: Wire `ensureRepoFresh` into `handleGetPlaybackEvidence` (AC1)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s10-repo-freshness-wiring.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
}

var repoRootPath = require.resolve('../src/web-ui/adapters/repo-root');
var freshnessPath = require.resolve('../src/web-ui/adapters/repo-freshness');
var pbePath = require.resolve('../src/web-ui/routes/playback-evidence');

function mockFreshness(onCall) {
  require.cache[freshnessPath] = {
    id: freshnessPath, filename: freshnessPath, loaded: true,
    exports: {
      ensureRepoFresh: function(repoRoot) { onCall(repoRoot); return { pulled: true }; },
      _resetForTesting: function() {}
    }
  };
}

console.log('\n[ppc-s10] Group A -- handleGetPlaybackEvidence calls ensureRepoFresh (AC1)');

test('T1 (AC1): handleGetPlaybackEvidence calls ensureRepoFresh before building the acs array', function() {
  var calls = [];
  mockFreshness(function(root) { calls.push(root); });
  delete require.cache[repoRootPath];
  require.cache[repoRootPath] = {
    id: repoRootPath, filename: repoRootPath, loaded: true,
    exports: { getRepoRoot: function() { return '/fake/repo'; }, setRepoRoot: function() {}, slugifyTenantId: function(x) { return x; } }
  };
  delete require.cache[pbePath];
  var pbe = require('../src/web-ui/routes/playback-evidence');

  // _resolveJourney will fail fast (no pool/journey) -- that's fine, we only
  // need to observe whether ensureRepoFresh was called before the function
  // gives up. If the real _resolveJourney needs a pool, this test instead
  // asserts via the exported handler's own early-journey-not-found 404 path
  // still having invoked ensureRepoFresh first -- update once Task 1's real
  // call site is written, matching whichever shape it actually takes.
  var req = { params: {}, session: { tenantId: 't1' }, headers: {} };
  var res = { writeHead: function() {}, end: function() {} };
  return pbe.handleGetPlaybackEvidence(req, res, null, null).then(function() {
    assert.ok(calls.length >= 1, 'ensureRepoFresh should have been called at least once');
  });
});

console.log('\n[ppc-s10] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failures.length) { failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); }); }
process.exitCode = failed > 0 ? 1 : 0;
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s10-repo-freshness-wiring.js
```

Expected output: `[FAIL] T1 (AC1): handleGetPlaybackEvidence calls ensureRepoFresh before building the acs array -- ensureRepoFresh should have been called at least once`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/playback-evidence.js`, add the import near the existing `getRepoRoot` import (line 16):

```javascript
const { getRepoRoot } = require('../adapters/repo-root');
const { ensureRepoFresh } = require('../adapters/repo-freshness');
```

In `handleGetPlaybackEvidence` (starts line 546), immediately after the journey-not-found check and before `_getDodAcList`:

```javascript
async function handleGetPlaybackEvidence(req, res, _next, pool) {
  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  // ppc-s10 (AC1): refresh the local checkout before reading committed
  // capture evidence off disk -- mirrors journey.js's own _readPipelineFeatures
  // call shape exactly (rclr-s1's ensureRepoFresh never throws).
  try { ensureRepoFresh(getRepoRoot(req)); } catch (_) {}

  var acRows = await _getDodAcList(journey, req, pool);
  ...
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s10-repo-freshness-wiring.js
```

Expected output: `[PASS] T1 (AC1): handleGetPlaybackEvidence calls ensureRepoFresh before building the acs array`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (no new failures beyond this repo's already-documented pre-existing flakes)

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s10-repo-freshness-wiring.js
git commit -m "feat(ppc-s10): refresh local checkout before reading playback evidence page (AC1)"
```

---

## Task 2: Wire `ensureRepoFresh` into the two media-serving handlers (AC2)

**Files:**
- Modify: `src/web-ui/routes/playback-evidence.js`
- Test: `tests/check-ppc-s10-repo-freshness-wiring.js` (same file, append to Group A)

- [ ] **Step 1: Write the failing test**

Append to `tests/check-ppc-s10-repo-freshness-wiring.js`, before the `console.log('\n[ppc-s10] Results...')` line:

```javascript
console.log('\n[ppc-s10] Group B -- media-serving handlers call ensureRepoFresh before fs.existsSync (AC2)');

test('T2 (AC2): handleGetCaptureScreenshot calls ensureRepoFresh before fs.existsSync', function() {
  var order = [];
  mockFreshness(function() { order.push('ensureRepoFresh'); });
  var fsPath = require.resolve('fs');
  var realExistsSync = require('fs').existsSync;
  require('fs').existsSync = function(p) { order.push('existsSync'); return realExistsSync(p); };
  delete require.cache[pbePath];
  var pbe = require('../src/web-ui/routes/playback-evidence');
  var req = { params: { acId: 'AC1' }, session: { tenantId: 't1' } };
  var res = { writeHead: function() {}, end: function() {} };
  return pbe.handleGetCaptureScreenshot(req, res, null, null).then(function() {
    require('fs').existsSync = realExistsSync;
    var efIdx = order.indexOf('ensureRepoFresh');
    var exIdx = order.indexOf('existsSync');
    assert.ok(efIdx !== -1, 'ensureRepoFresh should have been called');
    if (exIdx !== -1) assert.ok(efIdx < exIdx, 'ensureRepoFresh must be called before fs.existsSync');
  }).catch(function(e) { require('fs').existsSync = realExistsSync; throw e; });
});

test('T3 (AC2): handleGetCaptureVideo calls ensureRepoFresh before fs.existsSync', function() {
  var order = [];
  mockFreshness(function() { order.push('ensureRepoFresh'); });
  var realExistsSync = require('fs').existsSync;
  require('fs').existsSync = function(p) { order.push('existsSync'); return realExistsSync(p); };
  delete require.cache[pbePath];
  var pbe = require('../src/web-ui/routes/playback-evidence');
  var req = { params: { acId: 'AC1' }, session: { tenantId: 't1' } };
  var res = { writeHead: function() {}, end: function() {} };
  return pbe.handleGetCaptureVideo(req, res, null, null).then(function() {
    require('fs').existsSync = realExistsSync;
    var efIdx = order.indexOf('ensureRepoFresh');
    var exIdx = order.indexOf('existsSync');
    assert.ok(efIdx !== -1, 'ensureRepoFresh should have been called');
    if (exIdx !== -1) assert.ok(efIdx < exIdx, 'ensureRepoFresh must be called before fs.existsSync');
  }).catch(function(e) { require('fs').existsSync = realExistsSync; throw e; });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s10-repo-freshness-wiring.js
```

Expected output: `[FAIL] T2 ... ensureRepoFresh should have been called` and same for T3.

- [ ] **Step 3: Write minimal implementation**

In `handleGetCaptureScreenshot` (line 610) and `handleGetCaptureVideo` (line 636), add the same call immediately after the journey-not-found/acId-validity checks and before the `fs.existsSync`/`fs.readFileSync` block:

```javascript
async function handleGetCaptureScreenshot(req, res, _next, pool) {
  var journey = await _resolveJourney(req, pool);
  if (!journey) { _notFound(res); return; }

  var acId = req.params && req.params.acId;
  if (!ACID_RE.test(acId || '')) { _notFound(res); return; }

  // ppc-s10 (AC2): same refresh as handleGetPlaybackEvidence -- a direct
  // <img src> request must not 404 on a stale local checkout even when the
  // HTML page itself wasn't what triggered the refresh.
  try { ensureRepoFresh(getRepoRoot(req)); } catch (_) {}

  var screenshots = journey.captureScreenshots || {};
  ...
```

Repeat identically in `handleGetCaptureVideo`, right after its own `acId`/`ACID_RE` check and before the `var videos = journey.captureVideos || {};` line.

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s10-repo-freshness-wiring.js
```

Expected output: `[PASS]` for T1, T2, T3.

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/playback-evidence.js tests/check-ppc-s10-repo-freshness-wiring.js
git commit -m "feat(ppc-s10): refresh local checkout before serving screenshot/video media (AC2)"
```

---

## Task 3: Integration test — a freshly-committed screenshot becomes visible without a restart (AC1, AC2)

**Files:**
- Test: `tests/check-ppc-s10-repo-freshness-wiring.js` (same file, append final group)

- [ ] **Step 1: Write the integration test**

Append before the Results block:

```javascript
console.log('\n[ppc-s10] Group C -- end-to-end: freshly-committed evidence becomes visible (AC1, AC2 integration)');

test('T10 (AC1, AC2 integration): a file added to the remote after local clone becomes servable once ensureRepoFresh pulls it', function() {
  var os = require('os'); var path = require('path'); var fs = require('fs');
  var cp = require('child_process');
  var remoteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-remote-'));
  var localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-local-'));
  cp.execSync('git init --bare', { cwd: remoteDir });
  var seedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-seed-'));
  cp.execSync('git init', { cwd: seedDir });
  cp.execSync('git config user.email t@t.com && git config user.name t', { cwd: seedDir });
  fs.writeFileSync(path.join(seedDir, 'README.md'), 'seed');
  cp.execSync('git add . && git commit -m seed', { cwd: seedDir });
  cp.execSync('git remote add origin ' + remoteDir, { cwd: seedDir });
  cp.execSync('git push origin master:master 2>&1 || git push origin main:main 2>&1 || true', { cwd: seedDir });
  cp.execSync('git clone ' + remoteDir + ' ' + localDir.replace(/\\/g, '/'), { cwd: os.tmpdir() });

  // Simulate a second clone (the "GitHub Actions committer") pushing a new
  // file that the first clone (the "Fly app's own local checkout") does not
  // yet have on disk.
  var pusherDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-pusher-'));
  cp.execSync('git clone ' + remoteDir + ' ' + pusherDir.replace(/\\/g, '/'), { cwd: os.tmpdir() });
  cp.execSync('git config user.email t@t.com && git config user.name t', { cwd: pusherDir });
  var acDir = path.join(pusherDir, 'artefacts', 'x', 'playback', 'ppc-s1', 'screenshots');
  fs.mkdirSync(acDir, { recursive: true });
  fs.writeFileSync(path.join(acDir, 'AC1.png'), 'fake-png-bytes');
  cp.execSync('git add . && git commit -m "add screenshot"', { cwd: pusherDir });
  cp.execSync('git push origin HEAD:master 2>&1 || git push origin HEAD:main 2>&1', { cwd: pusherDir });

  var localFilePath = path.join(localDir, 'artefacts', 'x', 'playback', 'ppc-s1', 'screenshots', 'AC1.png');
  assert.strictEqual(fs.existsSync(localFilePath), false, 'precondition: local clone must NOT have the file yet');

  delete require.cache[freshnessPath];
  var freshness = require('../src/web-ui/adapters/repo-freshness');
  var result = freshness.ensureRepoFresh(localDir, { ttlMs: 0 });
  assert.strictEqual(result.pulled, true, 'ensureRepoFresh should report a real pull');
  assert.strictEqual(fs.existsSync(localFilePath), true, 'after ensureRepoFresh, the file committed by the "GitHub Actions committer" must now exist locally -- this is the exact handoff that 404d in production');

  fs.rmSync(remoteDir, { recursive: true, force: true });
  fs.rmSync(localDir, { recursive: true, force: true });
  fs.rmSync(seedDir, { recursive: true, force: true });
  fs.rmSync(pusherDir, { recursive: true, force: true });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s10-repo-freshness-wiring.js
```

Expected output (before Task 1/2 land this should already pass once `repo-freshness.js` itself works — this test targets the adapter directly, not the route handlers, so it is a true regression-proof for the underlying mechanism rather than the new wiring; run it after Tasks 1/2 to confirm the whole chain holds together): `[PASS] T10 ...`. If the local git client on CI has no `master`/`main` default-branch ambiguity issues, both `|| true` fallbacks are defensive, not expected to fire.

- [ ] **Step 3: N/A — this task tests existing adapter + Task 1/2's wiring together, no new production code**

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s10-repo-freshness-wiring.js
```

Expected output: `[PASS] T10 (AC1, AC2 integration): ...`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add tests/check-ppc-s10-repo-freshness-wiring.js
git commit -m "test(ppc-s10): integration-prove the full commit-to-serve handoff (AC1, AC2)"
```

---

## Task 4: Render a "Playback evidence" link on the DoD stage view when a product is connected (AC3)

**Files:**
- Modify: `src/web-ui/routes/journey.js`
- Test: `tests/check-ppc-s10-playback-link.js`

- [ ] **Step 1: Write the failing test**

```javascript
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
}

console.log('\n[ppc-s10] Group D -- Playback evidence link rendering (AC3, AC4)');

// NOTE for the implementing agent: wire this test using the SAME mocking
// pattern this file's sibling journey.js test suites already use to call
// handleGetJourneyStageView directly (check e.g. check-jsvr-s1-wire-stage-view-route.js
// or check-dsh-s4-fix-resume-conversation-link.js for the established
// journey-store/session/pool mock shape before filling this in) -- do not
// invent a new mocking convention for this one test file.

test('T7 (AC3): DoD stage view renders a Playback evidence link when productId is set', function() {
  // Arrange a journey with productId set and a completed 'definition-of-done'
  // stage with real artefact content, call handleGetJourneyStageView, and
  // assert the response HTML contains:
  //   href="/products/" + encodeURIComponent(productId) + "/playback-evidence/" + encodeURIComponent(featureSlug)
  // Fill in using this file's established mock shape (see NOTE above).
  assert.fail('not yet implemented -- see NOTE above for the mocking pattern to follow');
});

test('T8 (AC3 negative): no Playback evidence link rendered for a non-DoD stage', function() {
  // Same journey, stageName = 'discovery' instead. Assert the response HTML
  // contains NO '/playback-evidence/' substring.
  assert.fail('not yet implemented -- see NOTE above for the mocking pattern to follow');
});

test('T9 (AC4): no Playback evidence link rendered when journey.productId is unset', function() {
  // Same journey but productId: null, stageName = 'definition-of-done'.
  // Assert the response HTML contains NO '/playback-evidence/' substring.
  assert.fail('not yet implemented -- see NOTE above for the mocking pattern to follow');
});

console.log('\n[ppc-s10] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failures.length) { failures.forEach(function(f) { console.error('  FAIL:', f.name, '--', f.err && f.err.stack || f.err); }); }
process.exitCode = failed > 0 ? 1 : 0;
```

**Implementing-agent note:** the three tests above are deliberately stubbed with `assert.fail(...)` rather than guessed mock wiring, because `handleGetJourneyStageView` has a large, specific dependency surface (`_journeyStore.getJourney`, `requireJourneyAccess`, `_getTurnsForStageFn`, `_getProductsNavSummary`, etc.) that this plan's author did not fully trace. Before writing real assertions, read one of this file's own sibling test files for `handleGetJourneyStageView` (e.g. `check-jsvr-s1-wire-stage-view-route.js`, `check-dsh-s4-fix-resume-conversation-link.js`, `check-dsh-s3-breadcrumb-split-view.js`) and copy its exact mock/fixture shape — do not invent a new one. This keeps T7-T9 consistent with how this specific handler is already tested elsewhere in this codebase.

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s10-playback-link.js
```

Expected output: `[FAIL] T7 ... not yet implemented` / `[FAIL] T8 ...` / `[FAIL] T9 ...`

- [ ] **Step 3: Write minimal implementation**

In `src/web-ui/routes/journey.js`'s `handleGetJourneyStageView` (starts line 873), add a new variable just before the `body = [...]` assembly (line 1468) and reference it inside that array, between the `<p class="sv-sub">...</p>` line (1496) and `mainPanel,` (1497):

```javascript
  // ppc-s10 (AC3, AC4): link to this feature's Playback Evidence page when
  // one is reachable -- only when a product is connected (playback-evidence.js's
  // own AC7 tenant-isolation gate would otherwise 403/404 a dead link), and
  // only on the DoD stage view, where an operator is most likely to want it.
  var playbackEvidenceLinkHtml = (stageName === 'definition-of-done' && journey.productId)
    ? '<p class="sv-sub"><a href="/products/' + encodeURIComponent(journey.productId) + '/playback-evidence/' + encodeURIComponent(journey.featureSlug) + '">Playback evidence</a></p>'
    : '';

  body = [
    '<style>',
    ... (unchanged)
    '</style>',
    navigatorHtml,
    '<div class="sv-page">',
      '<p class="sv-eyebrow">' + escHtml(stageLabel) + ' — artefact</p>',
      '<h1 class="sv-title">' + featureName + '</h1>',
      (_stageCostUsd != null ? '<p class="sv-cost-meta">...' : ''),
      '<p class="sv-sub">Viewing completed stage document. ' + (isEdit ? 'Edit below and save.' : 'Click <strong>Edit</strong> to make changes.') + '</p>',
      playbackEvidenceLinkHtml,
      mainPanel,
    '</div>',
    ... (unchanged)
  ].join('');
```

(Only the one new `var playbackEvidenceLinkHtml = ...` block and the one new `playbackEvidenceLinkHtml,` array entry are additions — every other line shown above is existing code, reproduced only for placement context. Do not retype the full function; apply this as a targeted diff.)

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s10-playback-link.js
```

Expected output: `[PASS]` for T7, T8, T9 (once Step 1's `assert.fail` stubs are replaced with real assertions per the implementing-agent note).

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing.

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/journey.js tests/check-ppc-s10-playback-link.js
git commit -m "feat(ppc-s10): add Playback evidence link to the DoD stage view (AC3, AC4)"
```

---

## Task 5: Integration test — the rendered link resolves to a real, reachable route (AC3)

**Files:**
- Test: `tests/check-ppc-s10-playback-link.js` (same file, append)

- [ ] **Step 1: Write the integration test**

```javascript
console.log('\n[ppc-s10] Group E -- rendered link matches the real route table (AC3 integration)');

test('T11 (AC3 integration): the href pattern rendered by T7 matches a route server.js actually registers', function() {
  var fs = require('fs');
  var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
  // Assert server.js has a route registration whose pathname pattern matches
  // /products/:productId/playback-evidence/:featureSlug (however this repo's
  // own router expresses params -- confirm the exact string/regex shape by
  // reading server.js directly before writing this assertion, do not guess).
  assert.ok(/playback-evidence/.test(serverSrc), 'server.js should register a route containing "playback-evidence"');
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-ppc-s10-playback-link.js
```

Expected output: this specific assertion should already PASS once written correctly (it is a regression-proof against route drift, not new functionality) — if it fails, `server.js`'s own route registration for `playback-evidence.js` has changed shape and this test's pattern needs updating to match reality, not the other way around.

- [ ] **Step 3: N/A — no production code change, this task only adds a route-drift regression test**

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-ppc-s10-playback-link.js
```

Expected output: `[PASS] T11 ...`

- [ ] **Step 5: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: all tests passing (803+ files, 0 new failures).

- [ ] **Step 6: Commit**

```bash
git add tests/check-ppc-s10-playback-link.js
git commit -m "test(ppc-s10): guard the Playback evidence link against route drift (AC3)"
```

---

**After all 5 tasks:** run `/verify-completion` to confirm all 4 ACs are verified end-to-end (including a walkthrough of `verification-scripts/ppc-s10-verification.md`'s 4 scenarios against a real running server), then `/branch-complete` to open the draft PR.
