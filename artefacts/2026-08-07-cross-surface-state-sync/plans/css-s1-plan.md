# Automatically reflect a CLI-side gate advance on the corresponding web-UI journey — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the test plan pass. Do not add scope, behaviour, or structure beyond what the tests and ACs specify.
**Branch:** `feature/css-s1`
**Worktree:** `.worktrees/css-s1`
**Test command:** `node tests/check-css-s1-journey-sync-client.js` / `node tests/check-css-s1-internal-sync-endpoint.js` / `node tests/check-css-s1-journey-sync-wiring.js` / `node tests/check-css-s1-gate-advance-integration.js` — full suite: `npm test`
**Model routing (`.github/context.yml` `optimization.routing`):** default `balanced`; escalate to `deep-reasoning` for Task 6 and Task 7 (control-flow/async-ification + cross-process wiring).

**Design decision carried over from the file-map review (flag in the PR, per the DoR's own "add a PR comment describing the ambiguity" instruction):** AC3 is underspecified in the DoR/contract — it names the check ("journey's repo doesn't match the feature slug in that repo's pipeline-state.json") but not the mechanism. This plan resolves it as: the resolve response includes the journey's connected `repoOwner`/`repoName` (via the already-shipped products-table lookup), and `syncGateAdvanceToJourney` compares those against this CLI's own `process.env.GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME` (the existing single-repo-identity convention already used in `sign-off.js`'s `handleArtefactRead`) before calling the update endpoint. A mismatch is logged and skipped — zero HTTP write attempted.

---

## File map

```
Create:
  src/sync/journey-sync-client.js                     — CLI-side D37 adapter: resolveJourneyForFeatureSlug, syncGateAdvanceToJourney, real HTTP transport
  src/web-ui/routes/internal-sync.js                   — server-side handlers: handleJourneySyncResolve, handleJourneySyncUpdate
  tests/check-css-s1-journey-sync-client.js            — unit tests: AC1, AC2, AC3, AC4, AC6, NFR-Audit, NFR-Security
  tests/check-css-s1-internal-sync-endpoint.js         — unit tests: AC2 (server-side), AC5
  tests/check-css-s1-journey-sync-wiring.js            — D37 rule 4 behavioural-correctness test (real local HTTP server, no mocks)
  tests/check-css-s1-gate-advance-integration.js       — integration tests: AC1, AC2, NFR-Performance

Modify:
  src/enforcement/cli-gate-advance.js   — wire the real transport (D37 rule 3); make gateAdvance() async and call the sync after a successful discovery-approved advance
  bin/skills                            — await the now-async gateAdvance() before process.exit()
  src/web-ui/server.js                  — mount POST /internal/journey-sync/resolve and POST /internal/journey-sync/update
  .env.example                          — document INTERNAL_SYNC_URL, INTERNAL_SYNC_SECRET
  tests/check-cdg7-gate-advance.js              — await the 6 existing gateAdvance() call sites (now returns a Promise)
  tests/check-gav-s1-gate-advance-validation.js — await the 3 existing gateAdvance() call sites
  tests/check-pcr-s1-pipeline-state-scope.js    — await the 1 existing gateAdvance() call site
```

---

## Task 1: `journey-sync-client.js` — D37 stub/setter + `resolveJourneyForFeatureSlug` (AC2, AC6)

**Files:**
- Create: `src/sync/journey-sync-client.js`
- Test: `tests/check-css-s1-journey-sync-client.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

var client = require('../src/sync/journey-sync-client');

function withEnv(vars, fn) {
  var saved = {};
  Object.keys(vars).forEach(function(k) {
    saved[k] = process.env[k];
    if (vars[k] === null) delete process.env[k];
    else process.env[k] = vars[k];
  });
  return Promise.resolve().then(fn).finally(function() {
    Object.keys(saved).forEach(function(k) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });
}

queue.push(function() {
  return test('journeySyncClient_callsInternalEndpoint_withServiceCredential', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake-internal-sync.test', INTERNAL_SYNC_SECRET: 'test-secret' }, async function() {
      var calls = [];
      client.setJourneySyncClient(async function(op, payload) {
        calls.push({ op: op, payload: payload });
        return { found: true, journey: { journeyId: 'j1', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' } };
      });
      var journey = await client.resolveJourneyForFeatureSlug('test-feature');
      assert.strictEqual(calls.length, 1, 'exactly one transport call expected');
      assert.strictEqual(calls[0].op, 'resolve');
      assert.strictEqual(calls[0].payload.featureSlug, 'test-feature');
      assert.strictEqual(journey.journeyId, 'j1');
      assert.strictEqual(journey.featureSlug, 'test-feature');
    });
  });
});

queue.push(function() {
  return test('journeySyncClient_returnsNull_whenEndpointReportsNoJourney', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake-internal-sync.test', INTERNAL_SYNC_SECRET: 'test-secret' }, async function() {
      client.setJourneySyncClient(async function() { return { found: false }; });
      var journey = await client.resolveJourneyForFeatureSlug('no-such-feature');
      assert.strictEqual(journey, null);
    });
  });
});

queue.push(function() {
  return test('journeySyncClient_noOps_whenSyncEnvNotConfigured', function() {
    return withEnv({ INTERNAL_SYNC_URL: null, INTERNAL_SYNC_SECRET: null }, async function() {
      var calls = 0;
      client.setJourneySyncClient(async function() { calls++; return { found: false }; });
      var journey = await client.resolveJourneyForFeatureSlug('any-feature');
      assert.strictEqual(journey, null);
      assert.strictEqual(calls, 0, 'no HTTP call should be attempted when sync env is not configured');
    });
  });
});

(async function() {
  console.log('\ncheck-css-s1-journey-sync-client.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s1-journey-sync-client.js
```

Expected output: `Error: Cannot find module '../src/sync/journey-sync-client'`

- [ ] **Step 3: Write minimal implementation**

```js
'use strict';

// journey-sync-client.js — css-s1: CLI-side D37 adapter for the CLI -> web-UI
// journey sync direction (resolve + update), reached via a new internal HTTP
// endpoint on the deployed web-UI server (src/web-ui/routes/internal-sync.js)
// -- the CLI has no direct Postgres credential (decisions.md 2026-08-07 ARCH
// entry).
//
// D37: the real HTTP transport is wired separately, never self-wired here --
// the default stub throws so a missing wiring call fails loudly instead of
// silently no-opping. See cli-gate-advance.js for the wiring call (Task 6).

var SYNC_GATE = 'discovery-approved';
var SYNC_STAGE = 'discovery';

var _transport = function() {
  throw new Error('Adapter not wired: journeySyncClient. Call setJourneySyncClient() with a real implementation before use.');
};

function setJourneySyncClient(fn) { _transport = fn; }
function getJourneySyncClient() { return _transport; }

// Mirrors sign-off.js's own _logger convention -- non-throwing default so a
// missing setLogger() call only silences the audit trail, never breaks sync.
var _logger = {
  info: function() {},
  warn: function() {}
};
function setLogger(logger) { _logger = logger; }

/**
 * True only when both new CLI-side env vars are configured. AC6: the common
 * case (solo CLI usage, no web-UI product connected) must never attempt an
 * HTTP call or throw -- same observable outcome as "no journey found" (AC2).
 */
function _syncConfigured() {
  return !!(process.env.INTERNAL_SYNC_URL && process.env.INTERNAL_SYNC_SECRET);
}

/**
 * css-s1 AC1/AC2/AC6 -- resolve a web-UI journey for a pipeline-state.json
 * feature slug via the internal endpoint.
 * @param {string} featureSlug
 * @returns {Promise<{journeyId:string, featureSlug:string, repoOwner:string|null, repoName:string|null}|null>}
 */
async function resolveJourneyForFeatureSlug(featureSlug) {
  if (!_syncConfigured()) return null;
  var transport = getJourneySyncClient();
  var response = await transport('resolve', { featureSlug: featureSlug });
  if (!response || !response.found) return null;
  return response.journey;
}

module.exports = {
  resolveJourneyForFeatureSlug: resolveJourneyForFeatureSlug,
  setJourneySyncClient: setJourneySyncClient,
  getJourneySyncClient: getJourneySyncClient,
  setLogger: setLogger,
  SYNC_GATE: SYNC_GATE,
  SYNC_STAGE: SYNC_STAGE
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s1-journey-sync-client.js
```

Expected output: `3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (baseline 779 files + 1 new = 780, 0 failed)

- [ ] **Step 6: Commit**

```bash
git add src/sync/journey-sync-client.js tests/check-css-s1-journey-sync-client.js
git commit -m "feat(css-s1): add journey-sync-client resolve adapter with D37 throwing stub"
```

---

## Task 2: `journey-sync-client.js` — `syncGateAdvanceToJourney` (AC1, AC3, AC4, NFR-Audit, NFR-Security)

**Files:**
- Modify: `src/sync/journey-sync-client.js`
- Test: `tests/check-css-s1-journey-sync-client.js` (append)

- [ ] **Step 1: Write the failing test** (append before the final IIFE)

```js
// --- AC1/AC3/AC4 + NFR-Audit/Security: syncGateAdvanceToJourney -------------

queue.push(function() {
  return test('syncGateAdvanceToJourney_updatesCompletedStages_forDiscoveryApprovedGate', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var calls = [];
      client.setJourneySyncClient(async function(op, payload) { calls.push({ op: op, payload: payload }); return { updated: true }; });
      var journey = { journeyId: 'j1', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(journey, 'discovery-approved');
      assert.strictEqual(calls.length, 1, 'exactly one write-request call expected');
      assert.strictEqual(calls[0].op, 'update');
      assert.strictEqual(calls[0].payload.journeyId, 'j1');
      assert.strictEqual(calls[0].payload.stage, 'discovery');
    });
  });
});

queue.push(function() {
  return test('syncGateAdvanceToJourney_doesNotAttemptSync_forNonDiscoveryApprovedGate', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var calls = 0;
      client.setJourneySyncClient(async function() { calls++; return { updated: true }; });
      var journey = { journeyId: 'j1', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(journey, 'test-plan-complete');
      assert.strictEqual(calls, 0, 'no sync attempt should be made for a gate other than discovery-approved');
    });
  });
});

queue.push(function() {
  return test('syncGateAdvanceToJourney_logsMismatch_whenJourneyRepoHasNoMatchingFeatureSlug', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var calls = 0;
      client.setJourneySyncClient(async function() { calls++; return { updated: true }; });
      var warnings = [];
      client.setLogger({ info: function() {}, warn: function(event, data) { warnings.push({ event: event, data: data }); } });
      // This journey resolves to a DIFFERENT repo than this CLI's own
      // (process.env.GITHUB_REPO_OWNER/NAME above) -- a cross-repo slug
      // coincidence, not the same feature.
      var journey = { journeyId: 'j2', featureSlug: 'test-feature', repoOwner: 'someone-else', repoName: 'unrelated-repo' };
      await client.syncGateAdvanceToJourney(journey, 'discovery-approved');
      assert.strictEqual(calls, 0, 'no write call should be made on a repo mismatch');
      assert.strictEqual(warnings.length, 1, 'exactly one mismatch log entry expected');
      assert.strictEqual(warnings[0].data.featureSlug, 'test-feature');
      assert.strictEqual(warnings[0].data.journeyId, 'j2');
    });
  });
});

queue.push(function() {
  return test('syncLogEntries_containNoCredentialOrTokenFields', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets', INTERNAL_SYNC_SECRET: 'super-secret-value' }, async function() {
      var logged = [];
      client.setLogger({ info: function(event, data) { logged.push(data); }, warn: function(event, data) { logged.push(data); } });
      client.setJourneySyncClient(async function() { return { updated: true }; });

      var mismatchJourney = { journeyId: 'j3', featureSlug: 'test-feature', repoOwner: 'someone-else', repoName: 'unrelated-repo' };
      await client.syncGateAdvanceToJourney(mismatchJourney, 'discovery-approved');

      var okJourney = { journeyId: 'j4', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(okJourney, 'discovery-approved');

      var serialised = JSON.stringify(logged);
      assert.ok(!serialised.includes('super-secret-value'), 'no log entry may contain the sync secret value');
      assert.ok(!/accessToken|Authorization/i.test(serialised), 'no log entry may contain a token-like field name');
    });
  });
});

queue.push(function() {
  return test('syncAttempts_areLoggedForBothSuccessAndMismatchCases', function() {
    return withEnv({ GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var infoCount = 0; var warnCount = 0;
      client.setLogger({ info: function() { infoCount++; }, warn: function() { warnCount++; } });
      client.setJourneySyncClient(async function() { return { updated: true }; });

      var okJourney = { journeyId: 'j5', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(okJourney, 'discovery-approved');
      assert.strictEqual(infoCount, 1, 'exactly one success log entry expected');

      var mismatchJourney = { journeyId: 'j6', featureSlug: 'test-feature', repoOwner: 'someone-else', repoName: 'unrelated-repo' };
      await client.syncGateAdvanceToJourney(mismatchJourney, 'discovery-approved');
      assert.strictEqual(warnCount, 1, 'exactly one mismatch log entry expected');

      var boundaryJourney = { journeyId: 'j7', featureSlug: 'test-feature', repoOwner: 'acme', repoName: 'widgets' };
      await client.syncGateAdvanceToJourney(boundaryJourney, 'test-plan-complete');
      assert.strictEqual(infoCount, 1, 'the AC4 boundary case (wrong gate) must log nothing -- there was no attempt to log');
      assert.strictEqual(warnCount, 1);
    });
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s1-journey-sync-client.js
```

Expected output: `TypeError: client.syncGateAdvanceToJourney is not a function`

- [ ] **Step 3: Write minimal implementation** (insert into `src/sync/journey-sync-client.js`, after `resolveJourneyForFeatureSlug`, before `module.exports`)

```js
/**
 * css-s1 AC1/AC3/AC4 -- sync a CLI-side gate-advance onto the resolved
 * journey's completedStages. Only the discovery-approved gate is in scope
 * (AC4); every other gate is a no-op boundary, not a gap. AC3: if the
 * resolved journey's own connected repo does not match this CLI's own repo
 * identity (process.env.GITHUB_REPO_OWNER/GITHUB_REPO_NAME -- the same
 * single-repo-identity convention sign-off.js's handleArtefactRead already
 * uses), the slug match is a cross-repo coincidence, not the same feature --
 * log the mismatch for visibility (NFR-Audit) and make no write call at all.
 * @param {{journeyId:string, featureSlug:string, repoOwner:string|null, repoName:string|null}} journey
 * @param {string} gate
 * @returns {Promise<void>}
 */
async function syncGateAdvanceToJourney(journey, gate) {
  if (gate !== SYNC_GATE) return;

  var ownRepoOwner = process.env.GITHUB_REPO_OWNER || null;
  var ownRepoName = process.env.GITHUB_REPO_NAME || null;
  var repoMismatch = !!(journey.repoOwner && journey.repoName && ownRepoOwner && ownRepoName &&
    (journey.repoOwner !== ownRepoOwner || journey.repoName !== ownRepoName));

  if (repoMismatch) {
    _logger.warn('journey-sync-mismatch', {
      featureSlug: journey.featureSlug,
      journeyId: journey.journeyId,
      reason: 'journey repo does not match this CLI\'s own repo identity'
    });
    return;
  }

  var transport = getJourneySyncClient();
  await transport('update', {
    journeyId: journey.journeyId,
    featureSlug: journey.featureSlug,
    stage: SYNC_STAGE
  });
  _logger.info('journey-sync-success', { featureSlug: journey.featureSlug, journeyId: journey.journeyId });
}
```

And add to `module.exports`:

```js
module.exports = {
  resolveJourneyForFeatureSlug: resolveJourneyForFeatureSlug,
  syncGateAdvanceToJourney: syncGateAdvanceToJourney,
  setJourneySyncClient: setJourneySyncClient,
  getJourneySyncClient: getJourneySyncClient,
  setLogger: setLogger,
  SYNC_GATE: SYNC_GATE,
  SYNC_STAGE: SYNC_STAGE
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s1-journey-sync-client.js
```

Expected output: `8 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/sync/journey-sync-client.js tests/check-css-s1-journey-sync-client.js
git commit -m "feat(css-s1): add syncGateAdvanceToJourney with AC3 repo-mismatch guard and audit logging"
```

---

## Task 3: `internal-sync.js` — `handleJourneySyncResolve` (AC2, AC3 data, AC5)

**Files:**
- Create: `src/web-ui/routes/internal-sync.js`
- Test: `tests/check-css-s1-internal-sync-endpoint.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

var internalSync = require('../src/web-ui/routes/internal-sync');
var journeyStore = require('../src/web-ui/modules/journey-store');
var exportDataSource = require('../src/web-ui/adapters/export-data-source');

function makeRes() {
  var res = { _status: null, _headers: {}, _body: null };
  res.writeHead = function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); };
  res.end = function(body) { res._body = body; };
  return res;
}
function makeReq(body) {
  return { headers: {}, body: body };
}
function withSyncSecret(secret, fn) {
  var saved = process.env.INTERNAL_SYNC_SECRET;
  process.env.INTERNAL_SYNC_SECRET = secret;
  return Promise.resolve().then(fn).finally(function() {
    if (saved === undefined) delete process.env.INTERNAL_SYNC_SECRET;
    else process.env.INTERNAL_SYNC_SECRET = saved;
  });
}

queue.push(function() {
  return test('internalEndpoint_rejectsRequest_withMissingOrIncorrectCredential', function() {
    return withSyncSecret('right-secret', async function() {
      journeyStore._clearForTesting();
      var queried = false;
      exportDataSource.setDbPool({ query: async function() { queried = true; return { rows: [] }; } });

      var reqMissing = makeReq({ featureSlug: 'any' });
      var resMissing = makeRes();
      await internalSync.handleJourneySyncResolve(reqMissing, resMissing);
      assert.strictEqual(resMissing._status, 403);

      var reqWrong = makeReq({ featureSlug: 'any' });
      reqWrong.headers['x-internal-sync-secret'] = 'wrong-secret';
      var resWrong = makeRes();
      await internalSync.handleJourneySyncResolve(reqWrong, resWrong);
      assert.strictEqual(resWrong._status, 403);

      assert.strictEqual(queried, false, 'the endpoint must never reach the Postgres client when the credential check fails');
    });
  });
});

queue.push(function() {
  return test('internalEndpoint_acceptsRequest_withCorrectCredential', function() {
    return withSyncSecret('right-secret', async function() {
      journeyStore._clearForTesting();
      var journey = journeyStore.createJourney('css-s1-fixture-feature');
      journeyStore.setJourneyFields(journey.journeyId, { tenantId: 'tenant-1', productId: 'product-1' });
      exportDataSource.setDbPool({ query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } });

      var req = makeReq({ featureSlug: 'css-s1-fixture-feature' });
      req.headers['x-internal-sync-secret'] = 'right-secret';
      var res = makeRes();
      await internalSync.handleJourneySyncResolve(req, res);

      assert.strictEqual(res._status, 200);
      var body = JSON.parse(res._body);
      assert.strictEqual(body.found, true);
      assert.strictEqual(body.journey.repoOwner, 'acme');
      assert.strictEqual(body.journey.repoName, 'widgets');
    });
  });
});

queue.push(function() {
  return test('handleJourneySyncResolve_returnsNotFound_whenNoJourneyMatchesSlug', function() {
    return withSyncSecret('right-secret', async function() {
      journeyStore._clearForTesting();
      var req = makeReq({ featureSlug: 'no-such-feature' });
      req.headers['x-internal-sync-secret'] = 'right-secret';
      var res = makeRes();
      await internalSync.handleJourneySyncResolve(req, res);
      assert.strictEqual(res._status, 200);
      assert.deepStrictEqual(JSON.parse(res._body), { found: false });
    });
  });
});

(async function() {
  console.log('\ncheck-css-s1-internal-sync-endpoint.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s1-internal-sync-endpoint.js
```

Expected output: `Error: Cannot find module '../src/web-ui/routes/internal-sync'`

- [ ] **Step 3: Write minimal implementation**

```js
'use strict';

// internal-sync.js — css-s1: new internal, machine-to-machine web-UI
// endpoint used by the CLI's own gate-advance command to resolve/update a
// journey by pipeline-state.json feature slug. Never a public-facing or
// per-user-authenticated route (ADR-020 does not apply to this direction --
// see decisions.md 2026-08-07 ARCH entry) -- gated by a single shared
// service-level credential only, mirroring auth-stub.js's own constant-time
// secret-header check.

var crypto = require('crypto');
var journeyStore = require('../modules/journey-store');
var exportDataSource = require('../adapters/export-data-source');

/** Mirrors auth-stub.js's _secretMatches -- constant-time, fails closed on any length mismatch or unconfigured secret. */
function _secretMatches(candidate) {
  var expected = process.env.INTERNAL_SYNC_SECRET || '';
  var candidateBuf = Buffer.from(String(candidate || ''));
  var expectedBuf = Buffer.from(expected);
  if (!expected || candidateBuf.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(candidateBuf, expectedBuf);
}

/** Mirrors sign-off.js's own _readBody. */
function _readBody(req) {
  if (req.body !== undefined) return Promise.resolve(req.body);
  return new Promise(function(resolve) {
    var raw = '';
    req.on('data', function(chunk) { raw += chunk; });
    req.on('end', function() {
      try { resolve(JSON.parse(raw)); } catch (_) { resolve(null); }
    });
    req.on('error', function() { resolve(null); });
  });
}

function _rejectUnauthorised(res) {
  res.writeHead(403, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Forbidden' }));
}

/**
 * POST /internal/journey-sync/resolve — css-s1 AC1/AC2/AC3/AC5.
 * Body: { featureSlug }
 * Response: { found: false } | { found: true, journey: { journeyId, featureSlug, repoOwner, repoName } }
 */
async function handleJourneySyncResolve(req, res) {
  var supplied = req.headers && req.headers['x-internal-sync-secret'];
  if (!_secretMatches(supplied)) { _rejectUnauthorised(res); return; }

  var body = await _readBody(req);
  var featureSlug = body && body.featureSlug;
  if (!featureSlug) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'featureSlug is required' }));
    return;
  }

  var journey = journeyStore.getJourneyByFeatureSlug(featureSlug);
  if (!journey) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ found: false }));
    return;
  }

  var repoOwner = null;
  var repoName = null;
  if (journey.productId && journey.tenantId) {
    var pool = exportDataSource.getDbPool();
    if (pool) {
      var result = await pool.query(
        'SELECT repo_owner, repo_name FROM products WHERE product_id = $1 AND tenant_id = $2',
        [journey.productId, journey.tenantId]
      );
      var row = result.rows[0];
      if (row) { repoOwner = row.repo_owner; repoName = row.repo_name; }
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({
    found: true,
    journey: {
      journeyId: journey.journeyId,
      featureSlug: journey.featureSlug,
      repoOwner: repoOwner,
      repoName: repoName
    }
  }));
}

module.exports = {
  handleJourneySyncResolve: handleJourneySyncResolve
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s1-internal-sync-endpoint.js
```

Expected output: `3 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/internal-sync.js tests/check-css-s1-internal-sync-endpoint.js
git commit -m "feat(css-s1): add internal-sync resolve handler with shared-secret gate"
```

---

## Task 4: `internal-sync.js` — `handleJourneySyncUpdate` (AC1, AC5, idempotency)

**Files:**
- Modify: `src/web-ui/routes/internal-sync.js`
- Test: `tests/check-css-s1-internal-sync-endpoint.js` (append)

- [ ] **Step 1: Write the failing test** (append before the final IIFE)

```js
queue.push(function() {
  return test('handleJourneySyncUpdate_addsDiscoveryStage_andIsIdempotent', function() {
    return withSyncSecret('right-secret', async function() {
      journeyStore._clearForTesting();
      var journey = journeyStore.createJourney('css-s1-update-fixture');

      var req1 = makeReq({ journeyId: journey.journeyId, featureSlug: 'css-s1-update-fixture', stage: 'discovery' });
      req1.headers['x-internal-sync-secret'] = 'right-secret';
      var res1 = makeRes();
      await internalSync.handleJourneySyncUpdate(req1, res1);
      assert.strictEqual(res1._status, 200);
      assert.deepStrictEqual(JSON.parse(res1._body), { updated: true });

      var afterFirst = journeyStore.getJourney(journey.journeyId);
      assert.strictEqual(afterFirst.completedStages.filter(function(cs) { return cs.skillName === 'discovery'; }).length, 1);

      // A second call for the same stage must not duplicate the entry.
      var req2 = makeReq({ journeyId: journey.journeyId, featureSlug: 'css-s1-update-fixture', stage: 'discovery' });
      req2.headers['x-internal-sync-secret'] = 'right-secret';
      var res2 = makeRes();
      await internalSync.handleJourneySyncUpdate(req2, res2);
      var afterSecond = journeyStore.getJourney(journey.journeyId);
      assert.strictEqual(afterSecond.completedStages.filter(function(cs) { return cs.skillName === 'discovery'; }).length, 1,
        'a repeated update for the same stage must be idempotent, not duplicate the completedStages entry');
    });
  });
});
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s1-internal-sync-endpoint.js
```

Expected output: `TypeError: internalSync.handleJourneySyncUpdate is not a function`

- [ ] **Step 3: Write minimal implementation** (insert into `src/web-ui/routes/internal-sync.js`, after `handleJourneySyncResolve`)

```js
/**
 * POST /internal/journey-sync/update — css-s1 AC1/AC5.
 * Body: { journeyId, featureSlug, stage }
 * Response: { updated: true } | { updated: false, reason: string }
 */
async function handleJourneySyncUpdate(req, res) {
  var supplied = req.headers && req.headers['x-internal-sync-secret'];
  if (!_secretMatches(supplied)) { _rejectUnauthorised(res); return; }

  var body = await _readBody(req);
  var journeyId = body && body.journeyId;
  var featureSlug = body && body.featureSlug;
  var stage = body && body.stage;
  if (!journeyId || !featureSlug || !stage) {
    res.writeHead(400, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'journeyId, featureSlug and stage are required' }));
    return;
  }

  var journey = journeyStore.getJourney(journeyId);
  if (!journey || journey.featureSlug !== featureSlug) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ updated: false, reason: 'not-found' }));
    return;
  }

  var alreadyComplete = (journey.completedStages || []).some(function(cs) { return cs.skillName === stage; });
  if (!alreadyComplete) {
    journeyStore.completeStage(journey.journeyId, stage, null);
  }

  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ updated: true }));
}
```

And update `module.exports`:

```js
module.exports = {
  handleJourneySyncResolve: handleJourneySyncResolve,
  handleJourneySyncUpdate: handleJourneySyncUpdate
};
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s1-internal-sync-endpoint.js
```

Expected output: `4 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/web-ui/routes/internal-sync.js tests/check-css-s1-internal-sync-endpoint.js
git commit -m "feat(css-s1): add internal-sync update handler with idempotent completedStages write"
```

---

## Task 5: Mount the two new routes in `server.js`

**Files:**
- Modify: `src/web-ui/server.js`

No new unit test — this is pure wiring, verified by Task 7's integration tests and Task 6's wiring test (both exercise the mounted routes over a real HTTP connection).

- [ ] **Step 1: Add the require** (near the existing `auth-stub` require)

Find:
```js
const { handleAuthStubGithub, handleAuthStubAudit }                  = require('./routes/auth-stub');         // a1-staging-safe-auth-stub
```

Add immediately after:
```js
const { handleJourneySyncResolve, handleJourneySyncUpdate }         = require('./routes/internal-sync');     // css-s1
```

- [ ] **Step 2: Mount the routes** (near the existing `/auth/e2e-stub/*` routes, same internal-route cluster)

Find:
```js
  } else if (pathname === '/auth/e2e-stub/audit' && req.method === 'GET') {
    // a1-staging-safe-auth-stub: NFR-Audit read endpoint, same gate as above.
    await handleAuthStubAudit(req, res);

  } else if (pathname === '/sign-off' && req.method === 'POST') {
```

Replace with:
```js
  } else if (pathname === '/auth/e2e-stub/audit' && req.method === 'GET') {
    // a1-staging-safe-auth-stub: NFR-Audit read endpoint, same gate as above.
    await handleAuthStubAudit(req, res);

  } else if (pathname === '/internal/journey-sync/resolve' && req.method === 'POST') {
    // css-s1: machine-to-machine only, gated by INTERNAL_SYNC_SECRET (never a
    // per-user token) -- see routes/internal-sync.js for the full gate.
    await handleJourneySyncResolve(req, res);

  } else if (pathname === '/internal/journey-sync/update' && req.method === 'POST') {
    // css-s1: same gate as /internal/journey-sync/resolve above.
    await handleJourneySyncUpdate(req, res);

  } else if (pathname === '/sign-off' && req.method === 'POST') {
```

- [ ] **Step 3: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 4: Commit**

```bash
git add src/web-ui/server.js
git commit -m "feat(css-s1): mount internal journey-sync resolve/update routes"
```

---

## Task 6: Real HTTP transport + D37 wiring + behavioural-correctness test (D37 rule 3/4)

**Files:**
- Modify: `src/sync/journey-sync-client.js` (add `realJourneySyncTransport`)
- Modify: `src/enforcement/cli-gate-advance.js` (wiring only — the sync call itself is Task 7)
- Modify: `.env.example`
- Test: `tests/check-css-s1-journey-sync-wiring.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
var assert = require('assert');
var http = require('http');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

var client = require('../src/sync/journey-sync-client');
var internalSync = require('../src/web-ui/routes/internal-sync');
var journeyStore = require('../src/web-ui/modules/journey-store');

function startRealServer() {
  var server = http.createServer(function(req, res) {
    var u = new URL(req.url, 'http://localhost');
    if (u.pathname === '/internal/journey-sync/resolve' && req.method === 'POST') {
      internalSync.handleJourneySyncResolve(req, res);
    } else if (u.pathname === '/internal/journey-sync/update' && req.method === 'POST') {
      internalSync.handleJourneySyncUpdate(req, res);
    } else {
      res.writeHead(404); res.end();
    }
  });
  return new Promise(function(resolve) {
    server.listen(0, '127.0.0.1', function() { resolve(server); });
  });
}

queue.push(function() {
  return test('realJourneySyncTransport_wiring_resolvesTwoDifferentFeatureSlugsToTwoDifferentCorrectJourneys', function() {
    return (async function() {
      journeyStore._clearForTesting();
      var journeyA = journeyStore.createJourney('css-s1-wiring-feature-a');
      var journeyB = journeyStore.createJourney('css-s1-wiring-feature-b');

      var server = await startRealServer();
      var port = server.address().port;
      var savedUrl = process.env.INTERNAL_SYNC_URL;
      var savedSecret = process.env.INTERNAL_SYNC_SECRET;
      process.env.INTERNAL_SYNC_URL = 'http://127.0.0.1:' + port;
      process.env.INTERNAL_SYNC_SECRET = 'wiring-test-secret';

      try {
        client.setJourneySyncClient(client.realJourneySyncTransport);

        var resolvedA = await client.resolveJourneyForFeatureSlug('css-s1-wiring-feature-a');
        var resolvedB = await client.resolveJourneyForFeatureSlug('css-s1-wiring-feature-b');

        assert.ok(resolvedA, 'feature-a must resolve to a real journey');
        assert.ok(resolvedB, 'feature-b must resolve to a real journey');
        assert.strictEqual(resolvedA.journeyId, journeyA.journeyId);
        assert.strictEqual(resolvedB.journeyId, journeyB.journeyId);
        assert.notStrictEqual(resolvedA.journeyId, resolvedB.journeyId,
          'two different feature slugs must resolve to two different journey records, not the same one or a hardcoded value');
      } finally {
        process.env.INTERNAL_SYNC_URL = savedUrl;
        process.env.INTERNAL_SYNC_SECRET = savedSecret;
        server.close();
      }
    })();
  });
});

(async function() {
  console.log('\ncheck-css-s1-journey-sync-wiring.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s1-journey-sync-wiring.js
```

Expected output: `TypeError: client.realJourneySyncTransport is not a function`

- [ ] **Step 3a: Write minimal implementation — real transport** (insert into `src/sync/journey-sync-client.js`, after `syncGateAdvanceToJourney`)

```js
/**
 * css-s1 (D37 real implementation) -- the actual network call to the
 * internal web-UI endpoint. Wired via setJourneySyncClient(), from
 * cli-gate-advance.js (D37 rule 3: wiring is a separate task from this
 * function and from the business logic above -- this module never
 * self-wires).
 * @param {'resolve'|'update'} op
 * @param {object} payload
 * @returns {Promise<object>}
 */
async function realJourneySyncTransport(op, payload) {
  var baseUrl = (process.env.INTERNAL_SYNC_URL || '').replace(/\/$/, '');
  var response = await fetch(baseUrl + '/internal/journey-sync/' + op, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-internal-sync-secret': process.env.INTERNAL_SYNC_SECRET
    },
    body: JSON.stringify(payload)
  });
  if (!response.ok) {
    throw new Error('journey-sync ' + op + ' request failed: HTTP ' + response.status);
  }
  return response.json();
}
```

Update `module.exports`:

```js
module.exports = {
  resolveJourneyForFeatureSlug: resolveJourneyForFeatureSlug,
  syncGateAdvanceToJourney: syncGateAdvanceToJourney,
  realJourneySyncTransport: realJourneySyncTransport,
  setJourneySyncClient: setJourneySyncClient,
  getJourneySyncClient: getJourneySyncClient,
  setLogger: setLogger,
  SYNC_GATE: SYNC_GATE,
  SYNC_STAGE: SYNC_STAGE
};
```

- [ ] **Step 3b: Wire it (D37 rule 3 — separate from the handler/business-logic tasks above)** (modify `src/enforcement/cli-gate-advance.js`)

Find:
```js
var { validate } = require('./cli-outer-loop');
var { advance }  = require('./cli-advance');
```

Replace with:
```js
var { validate } = require('./cli-outer-loop');
var { advance }  = require('./cli-advance');
var journeySyncClient = require('../sync/journey-sync-client');

// css-s1 (D37 rule 3): wiring the real HTTP transport is kept separate from
// the sync business logic in journey-sync-client.js and from gateAdvance()'s
// own control flow (Task 7 below) -- this line is the entire "wiring" task.
// The CLI has no long-running server.js-style startup point; this module's
// own load time is the equivalent "once, at startup" moment for a one-shot
// CLI process.
journeySyncClient.setJourneySyncClient(journeySyncClient.realJourneySyncTransport);
```

- [ ] **Step 3c: Document the new env vars** (modify `.env.example`)

Find:
```
# GITHUB_REPO_OWNER=your-org-or-username
# GITHUB_REPO_NAME=your-skills-repo
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=
```

Replace with:
```
# GITHUB_REPO_OWNER=your-org-or-username
# GITHUB_REPO_NAME=your-skills-repo
GITHUB_REPO_OWNER=
GITHUB_REPO_NAME=

# css-s1 -- CLI -> web-UI journey sync (bin/skills gate-advance). Both unset
# is the common case (solo CLI usage, no connected web-UI product) and is a
# silent no-op, never an error.
# INTERNAL_SYNC_URL=https://your-deployed-web-ui.example.com
# INTERNAL_SYNC_SECRET=a-shared-service-level-credential
INTERNAL_SYNC_URL=
INTERNAL_SYNC_SECRET=
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s1-journey-sync-wiring.js
```

Expected output: `1 passed, 0 failed`

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/sync/journey-sync-client.js src/enforcement/cli-gate-advance.js .env.example tests/check-css-s1-journey-sync-wiring.js
git commit -m "feat(css-s1): wire real journey-sync HTTP transport with behavioural-correctness test"
```

---

## Task 7: Integrate sync into `gateAdvance()`, make it async, fix existing callers (AC1, AC2, NFR-Performance)

**Files:**
- Modify: `src/enforcement/cli-gate-advance.js`
- Modify: `bin/skills`
- Modify: `tests/check-cdg7-gate-advance.js`
- Modify: `tests/check-gav-s1-gate-advance-validation.js`
- Modify: `tests/check-pcr-s1-pipeline-state-scope.js`
- Test: `tests/check-css-s1-gate-advance-integration.js`

- [ ] **Step 1: Write the failing test**

```js
'use strict';
var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  PASS: ' + name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); }
      );
    }
    passed++; console.log('  PASS: ' + name); return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve();
  }
}
var queue = [];

var { gateAdvance } = require('../src/enforcement/cli-gate-advance');
var journeySyncClient = require('../src/sync/journey-sync-client');

function makeTempDir() {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'css-s1-gate-advance-it-'));
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  return dir;
}
function writeValidDiscoveryArtefact(dir, featureSlug) {
  var p = path.join(dir, 'artefacts', featureSlug, 'discovery.md');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, [
    '## Problem Statement', 'A problem.', '',
    '## Who It Affects', 'Someone.', '',
    '## Why Now', 'Because.', '',
    '## MVP Scope', 'The MVP.', '',
    '## Out of Scope', 'Nothing relevant.', '',
    '## Approved By', 'Jane Doe — PO — 2026-01-01'
  ].join('\n'));
  return 'artefacts/' + featureSlug + '/discovery.md';
}
function writeState(dir, featureSlug) {
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify({
    schemaVersion: '1',
    features: [{ slug: featureSlug, stories: [{ id: 's1' }] }]
  }, null, 2));
}
function withEnv(vars, fn) {
  var saved = {};
  Object.keys(vars).forEach(function(k) {
    saved[k] = process.env[k];
    if (vars[k] === null) delete process.env[k];
    else process.env[k] = vars[k];
  });
  return Promise.resolve().then(fn).finally(function() {
    Object.keys(saved).forEach(function(k) {
      if (saved[k] === undefined) delete process.env[k];
      else process.env[k] = saved[k];
    });
  });
}

queue.push(function() {
  return test('gateAdvanceCommand_completesSynchronously_withJourneyUpdateIncluded', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake.test', INTERNAL_SYNC_SECRET: 'secret', GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var dir = makeTempDir();
      try {
        var slug = 'css-s1-it-feature';
        var artefactPath = writeValidDiscoveryArtefact(dir, slug);
        writeState(dir, slug);

        var updateCalls = [];
        journeySyncClient.setJourneySyncClient(async function(op, payload) {
          if (op === 'resolve') return { found: true, journey: { journeyId: 'j1', featureSlug: slug, repoOwner: 'acme', repoName: 'widgets' } };
          updateCalls.push(payload);
          return { updated: true };
        });

        var result = await gateAdvance(slug, 's1', 'discovery-approved', artefactPath, ['stage=discovery-approved'], dir);

        assert.strictEqual(result.exitCode, 0, 'Expected exitCode 0: ' + result.stderr);
        assert.strictEqual(updateCalls.length, 1, 'the journey update call must already have happened by the time gateAdvance resolves');
        assert.strictEqual(updateCalls[0].stage, 'discovery');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

queue.push(function() {
  return test('gateAdvanceCommand_completesNormally_whenNoConnectedJourney', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake.test', INTERNAL_SYNC_SECRET: 'secret' }, async function() {
      var dir = makeTempDir();
      try {
        var slug = 'css-s1-it-no-journey';
        var artefactPath = writeValidDiscoveryArtefact(dir, slug);
        writeState(dir, slug);

        journeySyncClient.setJourneySyncClient(async function(op) {
          assert.strictEqual(op, 'resolve');
          return { found: false };
        });

        var result = await gateAdvance(slug, 's1', 'discovery-approved', artefactPath, ['stage=discovery-approved'], dir);
        assert.strictEqual(result.exitCode, 0, 'Expected exitCode 0: ' + result.stderr);
        assert.strictEqual(result.stderr, '', 'no error output expected when no journey is connected');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

queue.push(function() {
  return test('gateAdvanceCommand_addsBoundedDelay_whenJourneySyncEnabled', function() {
    return withEnv({ INTERNAL_SYNC_URL: 'http://fake.test', INTERNAL_SYNC_SECRET: 'secret', GITHUB_REPO_OWNER: 'acme', GITHUB_REPO_NAME: 'widgets' }, async function() {
      var dir = makeTempDir();
      try {
        var slug = 'css-s1-it-timing';
        var artefactPath = writeValidDiscoveryArtefact(dir, slug);
        writeState(dir, slug);

        function delay(ms) { return new Promise(function(resolve) { setTimeout(resolve, ms); }); }

        journeySyncClient.setJourneySyncClient(async function(op) {
          await delay(50); // realistic mocked network round-trip
          if (op === 'resolve') return { found: true, journey: { journeyId: 'j1', featureSlug: slug, repoOwner: 'acme', repoName: 'widgets' } };
          return { updated: true };
        });

        var start = Date.now();
        var result = await gateAdvance(slug, 's1', 'discovery-approved', artefactPath, ['stage=discovery-approved'], dir);
        var elapsed = Date.now() - start;

        assert.strictEqual(result.exitCode, 0);
        assert.ok(elapsed < 500, 'Expected added delay under 500ms, got ' + elapsed + 'ms');
      } finally {
        fs.rmSync(dir, { recursive: true, force: true });
      }
    });
  });
});

(async function() {
  console.log('\ncheck-css-s1-gate-advance-integration.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
```

- [ ] **Step 2: Run test — must fail**

```bash
node tests/check-css-s1-gate-advance-integration.js
```

Expected output: `AssertionError: Expected exitCode 0: ...` (gateAdvance returns a Promise today; `result.exitCode` is `undefined` since the sync call isn't integrated yet — or, once Task 6 lands, the function still isn't `async` yet, so `result` is a plain object with no journey-sync side effect: `updateCalls.length` stays `0`)

- [ ] **Step 3a: Integrate the sync call and make `gateAdvance` async** (modify `src/enforcement/cli-gate-advance.js`)

Find:
```js
function gateAdvance(featureSlug, storyId, gateName, artefactPath, rawFields, repoRoot) {
  // AC3: all four positional args are required
  if (!featureSlug || !storyId || !gateName || !artefactPath) {
    return {
      exitCode: 8,
      stdout: '',
      stderr: 'Missing required argument(s). ' + USAGE +
        '\nRequired positional args: feature-slug, story-id, gate-name, artefact-path',
    };
  }

  // AC1: run the gate validation — if non-zero, propagate and do not touch state
  var valResult = validate(artefactPath, gateName, repoRoot);
  if (valResult.exitCode !== 0) {
    return valResult;
  }

  // AC2: validation passed — advance pipeline-state fields
  return advance(featureSlug, storyId, rawFields || [], repoRoot);
}
```

Replace with:
```js
async function gateAdvance(featureSlug, storyId, gateName, artefactPath, rawFields, repoRoot) {
  // AC3: all four positional args are required
  if (!featureSlug || !storyId || !gateName || !artefactPath) {
    return {
      exitCode: 8,
      stdout: '',
      stderr: 'Missing required argument(s). ' + USAGE +
        '\nRequired positional args: feature-slug, story-id, gate-name, artefact-path',
    };
  }

  // AC1: run the gate validation — if non-zero, propagate and do not touch state
  var valResult = validate(artefactPath, gateName, repoRoot);
  if (valResult.exitCode !== 0) {
    return valResult;
  }

  // AC2: validation passed — advance pipeline-state fields
  var advanceResult = advance(featureSlug, storyId, rawFields || [], repoRoot);

  // css-s1 AC1/AC2/AC3/AC4/AC6: synchronous CLI -> web-UI journey sync,
  // scoped to the discovery-approved gate only. A sync failure (network
  // error, no journey connected, env not configured) never changes
  // gateAdvance's own exit code -- the pipeline-state advance above already
  // succeeded or failed on its own terms.
  if (advanceResult.exitCode === 0 && gateName === journeySyncClient.SYNC_GATE) {
    try {
      var journey = await journeySyncClient.resolveJourneyForFeatureSlug(featureSlug);
      if (journey) {
        await journeySyncClient.syncGateAdvanceToJourney(journey, gateName);
      }
    } catch (err) {
      process.stderr.write('[journey-sync] warning: ' + err.message + '\n');
    }
  }

  return advanceResult;
}
```

- [ ] **Step 3b: Await the now-async call** (modify `bin/skills`)

Find:
```js
} else if (subcommand === 'gate-advance') {
  const [featureSlug, storyId, gateName, artefactPath, ...rawFields] = args;
  const { gateAdvance } = require('../src/enforcement/cli-gate-advance');
  const repoRoot = path.resolve(__dirname, '..');
  const result = gateAdvance(featureSlug, storyId, gateName, artefactPath, rawFields, repoRoot);
  if (result.stdout) process.stdout.write(result.stdout + '\n');
  if (result.stderr) process.stderr.write(result.stderr + '\n');
  process.exit(result.exitCode);
} else if (subcommand === 'init') {
```

Replace with:
```js
} else if (subcommand === 'gate-advance') {
  const [featureSlug, storyId, gateName, artefactPath, ...rawFields] = args;
  const { gateAdvance } = require('../src/enforcement/cli-gate-advance');
  const repoRoot = path.resolve(__dirname, '..');
  gateAdvance(featureSlug, storyId, gateName, artefactPath, rawFields, repoRoot).then((result) => {
    if (result.stdout) process.stdout.write(result.stdout + '\n');
    if (result.stderr) process.stderr.write(result.stderr + '\n');
    process.exit(result.exitCode);
  });
} else if (subcommand === 'init') {
```

- [ ] **Step 3c: Fix the 3 existing test files that call `gateAdvance()` synchronously** — required because `gateAdvance()` now always returns a Promise, even for gates other than `discovery-approved`; without this, every existing assertion on `result.exitCode` in these 3 files breaks (regression).

Modify `tests/check-cdg7-gate-advance.js` — insert the async wrapper start:

Find:
```js
const pipelineStateWriterFactory = require('../src/web-ui/adapters/pipeline-state-writer');

// ── T1 — AC1: validate non-zero blocks gate-advance; state not modified ────────
```

Replace with:
```js
const pipelineStateWriterFactory = require('../src/web-ui/adapters/pipeline-state-writer');

// css-s1: gateAdvance() is now async (it awaits the CLI -> web-UI journey
// sync for discovery-approved advances) -- every call site below is wrapped
// in this async IIFE so assertions and the final Report block still run in
// the correct order.
(async function() {

// ── T1 — AC1: validate non-zero blocks gate-advance; state not modified ────────
```

Then, in the same file, replace every occurrence of `const result = gateAdvance(` with `const result = await gateAdvance(` (6 occurrences — use a global/all-occurrences replace).

Then close the wrapper at the very end of the file. Find:
```js
if (totalFailed > 0) {
  console.error(`[cdg7-gate-advance] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach(function(i) { console.error(i); });
  process.exit(1);
} else {
  console.log(`[cdg7-gate-advance] ${totalPassed} check(s) OK ✓`);
}
```

Replace with:
```js
if (totalFailed > 0) {
  console.error(`[cdg7-gate-advance] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach(function(i) { console.error(i); });
  process.exit(1);
} else {
  console.log(`[cdg7-gate-advance] ${totalPassed} check(s) OK ✓`);
}
})();
```

Modify `tests/check-gav-s1-gate-advance-validation.js` — insert the async wrapper start. Find:
```js
// ── IT2 — gateAdvance end-to-end for test-plan-complete ──────────────────────
console.log('\n[gav-s1] IT2 — gateAdvance end-to-end for test-plan-complete');
```

Replace with:
```js
// css-s1: gateAdvance() is now async -- IT2-IT4 (the only blocks that call
// it) plus Cleanup/Summary below are wrapped in this async IIFE so ordering
// stays correct.
(async function() {

// ── IT2 — gateAdvance end-to-end for test-plan-complete ──────────────────────
console.log('\n[gav-s1] IT2 — gateAdvance end-to-end for test-plan-complete');
```

Then replace every occurrence of `const result = gateAdvance(` with `const result = await gateAdvance(` (3 occurrences — use a global/all-occurrences replace).

Then close the wrapper at the very end. Find:
```js
// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== check-gav-s1-gate-advance-validation results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
```

Replace with:
```js
// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n=== check-gav-s1-gate-advance-validation results: ${passed} passed, ${failed} failed ===\n`);
if (failed > 0) process.exit(1);
})();
```

Modify `tests/check-pcr-s1-pipeline-state-scope.js` — insert the async wrapper start. Find:
```js
// ── U4 — gate-advance() on a story field does not modify the parent feature's updatedAt ─

{
  const T = 'U4-gate-advance-story-field-leaves-feature-updatedAt';
```

Replace with:
```js
// css-s1: gateAdvance() is now async -- U4 (the only block that calls it)
// plus every block after it, including the final Report, are wrapped in
// this async IIFE so ordering stays correct.
(async function() {

// ── U4 — gate-advance() on a story field does not modify the parent feature's updatedAt ─

{
  const T = 'U4-gate-advance-story-field-leaves-feature-updatedAt';
```

Then replace the single call site. Find:
```js
    const result = gateAdvance('test-feat', 's1', 'definition-of-ready', 'artefacts/feat/dor/story-dor.md', ['dorStatus=signed-off'], tmpDir);
```

Replace with:
```js
    const result = await gateAdvance('test-feat', 's1', 'definition-of-ready', 'artefacts/feat/dor/story-dor.md', ['dorStatus=signed-off'], tmpDir);
```

Then close the wrapper at the very end. Find:
```js
if (totalFailed > 0) {
  console.error(`[pcr-s1-pipeline-state-scope] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[pcr-s1-pipeline-state-scope] ${totalPassed} check(s) OK ✓`);
}
```

Replace with:
```js
if (totalFailed > 0) {
  console.error(`[pcr-s1-pipeline-state-scope] FAIL — ${issues.length} issue(s) found:`);
  issues.forEach(i => console.error(i));
  process.exit(1);
} else {
  console.log(`[pcr-s1-pipeline-state-scope] ${totalPassed} check(s) OK ✓`);
}
})();
```

- [ ] **Step 4: Run test — must pass**

```bash
node tests/check-css-s1-gate-advance-integration.js
node tests/check-cdg7-gate-advance.js
node tests/check-gav-s1-gate-advance-validation.js
node tests/check-pcr-s1-pipeline-state-scope.js
```

Expected output: `3 passed, 0 failed` for the new integration file; the 3 existing files report their original pass counts unchanged (no new failures, no new passes/fails — same totals as the branch-setup baseline).

- [ ] **Step 5: Run full suite — no regressions**

```bash
npm test
```

Expected output: all tests passing (baseline 779 files + 4 new css-s1 files = 783, 0 failed)

- [ ] **Step 6: Commit**

```bash
git add src/enforcement/cli-gate-advance.js bin/skills tests/check-css-s1-gate-advance-integration.js tests/check-cdg7-gate-advance.js tests/check-gav-s1-gate-advance-validation.js tests/check-pcr-s1-pipeline-state-scope.js
git commit -m "feat(css-s1): integrate journey sync into async gate-advance; fix existing callers"
```

---

## PR notes (for the human-oversight review, per css-e1's Medium oversight level)

Flag these explicitly in the PR description, per the DoR's own "if you encounter an ambiguity not covered by the ACs or tests, add a PR comment" instruction:

1. **AC3's mechanism is this plan's own interpretation, not specified by the original DoR/contract.** The repo-identity comparison (`journey.repoOwner`/`repoName` vs. `process.env.GITHUB_REPO_OWNER`/`GITHUB_REPO_NAME`) is a reasonable, testable design, but it was not named anywhere in `css-s1-dor-contract.md` — worth a second look before merge.
2. **`gateAdvance()` becoming `async` is a breaking change to its own call contract**, propagated to 3 pre-existing test files and `bin/skills`. No other caller was found repo-wide (`grep -rln "cli-gate-advance"`), but worth a final confirmation before merge.
3. **The idempotency guard on `handleJourneySyncUpdate`** (skip the write if `discovery` is already in `completedStages`) is not named by any AC or test-plan row — added because the alternative (duplicate `completedStages` entries on a re-run) seemed like an obvious latent bug, not scope creep. Flagging in case the reviewer disagrees with adding it unprompted.
