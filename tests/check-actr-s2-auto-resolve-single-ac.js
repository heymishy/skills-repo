'use strict';
// check-actr-s2-auto-resolve-single-ac.js -- TDD tests for actr-s2
// (2026-10-28-auto-capture-target-resolution).
// Story: artefacts/2026-10-28-auto-capture-target-resolution/stories/actr-s2-auto-resolve-single-ac-capture-target.md
var assert = require('assert');
var passed = 0; var failed = 0; var failures = [];
function test(name, fn) {
  var result;
  try { result = fn(); } catch (err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); return Promise.resolve(); }
  if (result && typeof result.then === 'function') {
    return result.then(function() { passed++; console.log('  PASS: ' + name); }, function(err) { failed++; failures.push({ name: name, err: err }); console.log('  FAIL: ' + name + '\n       ' + (err && err.stack || err)); });
  }
  passed++; console.log('  PASS: ' + name); return Promise.resolve();
}
var queue = [];

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var fetcher = require('../src/web-ui/adapters/artefact-fetcher');
// Task 5: same adapters check-ppc-s3-capture-rate-limit.js and
// check-ppc-s9-capture-dispatch-wiring.js already mock for
// handlePostCaptureTrigger -- copied here rather than guessed, per this
// repo's own CLAUDE.md "Mock-shape verification" rule.
var nonceStore = require('../src/web-ui/adapters/capture-nonce-store');
var captureDispatchAdapter = require('../src/web-ui/adapters/capture-dispatch-adapter');
pe.setJourneyStoreModule(store);

function getStore() { store._clearForTesting(); return store; }
function makeRes() {
  var res = { _status: null, _body: null, _headers: {},
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = (res._body || '') + (body || ''); } };
  return res;
}
var _n = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _n++;
  return Object.assign({ session: { tenantId: tenantId, userId: 'actr-s2-user-' + _n, accessToken: 'test-token', login: 'user' },
    sessionId: 'sid-' + tenantId, params: { productId: productId, featureSlug: featureSlug }, headers: { accept: 'text/html' }, query: {} }, extra || {});
}
function makeMockPool() { return { query: async function() { return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] }; } }; }

// Sets up a GitHub-sync-fallback journey (the storySlugs-loop branch of
// _getDodAcList) -- the only branch Task 1 attaches storySlug to.
function setupPipelineStateJourney(store, storySlugs) {
  var slug = 'actr-s2-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, {
    tenantId: 'tenant-a', productId: 'product-a',
    completedStages: [{ skillName: 'definition-of-done', artefactPath: null, completedAt: new Date().toISOString() }],
    pipelineStateStorySlugs: storySlugs
  });
  return { journeyId: j.journeyId, featureSlug: slug };
}

console.log('\n[actr-s2] Task 1: storySlug attached to DoD AC rows');

queue.push(function() {
  return test('T1 (prerequisite): _getDodAcList attaches storySlug to each AC row in the storySlugs-loop branch', function() {
    pe.setFetcherModule(async function(featureSlug, artefactType) {
      if (artefactType === 'dod/story-one-dod') return '## AC Coverage\n\n| AC | Satisfied? | Evidence |\n|----|----|----|\n| AC1 — First | Yes | x |\n';
      if (artefactType === 'dod/story-two-dod') return '## AC Coverage\n\n| AC | Satisfied? | Evidence |\n|----|----|----|\n| AC1 — Second | Yes | y |\n';
      throw new fetcher.ArtefactNotFoundError(featureSlug, artefactType);
    });
    var store2 = getStore();
    var setup = setupPipelineStateJourney(store2, ['story-one', 'story-two']);
    var journey = store2.getJourneyByTenantProductSlug('tenant-a', 'product-a', setup.featureSlug);
    return pe._getDodAcList(journey, makeReq('tenant-a', 'product-a', setup.featureSlug), makeMockPool()).then(function(acs) {
      pe.setFetcherModule(fetcher.fetchArtefact);
      assert.strictEqual(acs.length, 2);
      assert.strictEqual(acs[0].storySlug, 'story-one', 'first story\'s own AC row must carry its own storySlug');
      assert.strictEqual(acs[1].storySlug, 'story-two', 'second story\'s own AC row must carry ITS storySlug, not the first one\'s');
    }, function(err) { pe.setFetcherModule(fetcher.fetchArtefact); throw err; });
  });
});

console.log('\n[actr-s2] Task 2: E2E spec-file finder');

queue.push(function() {
  return test('T2a: finds the File: path for the AC named in a Verifies: line', function() {
    var content = require('fs').readFileSync('artefacts/2026-10-20-production-playback-capture/test-plans/ppc-s6-test-plan.md', 'utf8');
    var result = pe._findE2eSpecFileForAc(content, 'AC6');
    assert.strictEqual(result, 'tests/e2e/ppc-s6-responsive-summary.spec.js', 'must resolve the real backtick-wrapped File: path from the real ppc-s6 test-plan.md');
  });
});

queue.push(function() {
  return test('T2b: when two blocks both verify the same AC, the FIRST matching block\'s own File: path wins (early return, not nearest-preceding fallback)', function() {
    var content = [
      '## E2E Tests', '',
      '### firstTest',
      '- **Verifies:** AC1',
      '- **File:** `tests/e2e/fixture.spec.js`',
      '',
      '### secondTest',
      '- **Verifies:** AC1',
      '- **File:** Same spec file, second test',
      ''
    ].join('\n');
    var result = pe._findE2eSpecFileForAc(content, 'AC1');
    assert.strictEqual(result, 'tests/e2e/fixture.spec.js', 'the FIRST matching block already has the real path -- confirms the loop returns on first match, not last');
  });
});

queue.push(function() {
  return test('T2c: returns null when the AC is not named in any Verifies: line (manual-only AC, AC4\'s own case)', function() {
    var content = [
      '## E2E Tests', '',
      '### someTest',
      '- **Verifies:** AC9',
      '- **File:** `tests/e2e/fixture.spec.js`',
      ''
    ].join('\n');
    var result = pe._findE2eSpecFileForAc(content, 'AC1');
    assert.strictEqual(result, null);
  });
});

queue.push(function() {
  return test('T2d: returns null (never throws) when the test-plan has no E2E Tests section at all', function() {
    var content = '## Unit Tests\n\nAC1 is covered by a unit test only.\n';
    var result = pe._findE2eSpecFileForAc(content, 'AC1');
    assert.strictEqual(result, null);
  });
});

queue.push(function() {
  return test('T2e: fallback actually returns the PRECEDING block\'s path when the matching block itself has none (not just "first block already has it")', function() {
    var content = [
      '## E2E Tests', '',
      '### otherAcTest',
      '- **Verifies:** AC2',
      '- **File:** `tests/e2e/other-ac-fixture.spec.js`',
      '',
      '### targetAcTest',
      '- **Verifies:** AC1',
      '- **File:** Same spec file, second test',
      ''
    ].join('\n');
    var result = pe._findE2eSpecFileForAc(content, 'AC1');
    assert.strictEqual(result, 'tests/e2e/other-ac-fixture.spec.js', 'AC1\'s own matching block has no real path -- must fall back to the nearest PRECEDING block\'s real path, not return null or the wrong value');
  });
});

console.log('\n[actr-s2] Task 3: _resolveAutoCaptureTarget (AC4, AC5) -- reads via the local repo clone (getRepoRoot), not the GitHub API; see decisions.md 2026-10-29 for why this was corrected post-review');

var repoRootModule = require('../src/web-ui/adapters/repo-root');
var osModule = require('os');
var fsModule = require('fs');
var pathModule = require('path');

function makeFakeJourney(featureSlug) {
  return { featureSlug: featureSlug, productId: 'product-a', tenantId: 'tenant-a' };
}
// Stands in for a connected repo's local clone -- getRepoRoot's own
// setRepoRoot test seam points every getRepoRoot(req) call at this temp
// directory for the duration of a test. Must be paired with clearRepoRoot()
// afterward so later tests (and other test files sharing this same module)
// are unaffected.
function makeTempRepoRoot() {
  var tempDir = fsModule.mkdtempSync(pathModule.join(osModule.tmpdir(), 'actr-s2-fixture-'));
  repoRootModule.setRepoRoot(tempDir);
  return tempDir;
}
function writeFixtureFile(repoRoot, relPath, content) {
  var fullPath = pathModule.join(repoRoot, relPath);
  fsModule.mkdirSync(pathModule.dirname(fullPath), { recursive: true });
  fsModule.writeFileSync(fullPath, content, 'utf8');
}
function clearRepoRoot() { repoRootModule.setRepoRoot(null); }

queue.push(function() {
  return test('T3a (AC resolution, happy path): resolves url+selector via a local test-plan.md + spec file', function() {
    var journey = makeFakeJourney('actr-s2-t3a-feature');
    var repoRoot = makeTempRepoRoot();
    writeFixtureFile(repoRoot, 'artefacts/' + journey.featureSlug + '/test-plans/story-one-test-plan.md',
      ['## E2E Tests', '', '### t', '- **Verifies:** AC1', '- **File:** `tests/e2e/actr-s2-fixture.spec.js`', ''].join('\n'));
    writeFixtureFile(repoRoot, 'tests/e2e/actr-s2-fixture.spec.js',
      '// fixture.spec.js (story-one AC1)\nwithAuth(\'x\', async ({ page }) => {\n  await page.goto(\'/actr-s2-fixture\');\n  const el = page.locator(\'.actr-s2-target\');\n});\n');
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var result = pe._resolveAutoCaptureTarget(req, journey, acRow);
    clearRepoRoot();
    assert.deepStrictEqual(result, { url: '/actr-s2-fixture', selector: '.actr-s2-target', specFile: 'tests/e2e/actr-s2-fixture.spec.js' });
  });
});

queue.push(function() {
  return test('T3b (AC4): no storySlug on the AC row -- returns null, no disk access needed', function() {
    var journey = makeFakeJourney('actr-s2-t3b-feature');
    var acRow = { acId: 'AC1' }; // no storySlug -- the Postgres single-row-branch case
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var result = pe._resolveAutoCaptureTarget(req, journey, acRow);
    assert.strictEqual(result, null);
  });
});

queue.push(function() {
  return test('T3c (AC4): test-plan exists but names no E2E spec for this AC -- returns null, no spec-file lookup attempted', function() {
    var journey = makeFakeJourney('actr-s2-t3c-feature');
    var repoRoot = makeTempRepoRoot();
    writeFixtureFile(repoRoot, 'artefacts/' + journey.featureSlug + '/test-plans/story-one-test-plan.md', '## Unit Tests\n\nAC1 is unit-only.\n');
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var result = pe._resolveAutoCaptureTarget(req, journey, acRow);
    clearRepoRoot();
    assert.strictEqual(result, null);
  });
});

queue.push(function() {
  return test('T3d (AC5): test-plan.md does not exist on disk at all -- returns null, never throws', function() {
    var journey = makeFakeJourney('actr-s2-t3d-feature');
    makeTempRepoRoot(); // empty temp dir -- no test-plan.md written
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var result = pe._resolveAutoCaptureTarget(req, journey, acRow);
    clearRepoRoot();
    assert.strictEqual(result, null);
  });
});

queue.push(function() {
  return test('T3e (AC5): the named spec file does not exist on disk -- returns null, never throws', function() {
    var journey = makeFakeJourney('actr-s2-t3e-feature');
    var repoRoot = makeTempRepoRoot();
    writeFixtureFile(repoRoot, 'artefacts/' + journey.featureSlug + '/test-plans/story-one-test-plan.md',
      ['## E2E Tests', '', '### t', '- **Verifies:** AC1', '- **File:** `tests/e2e/missing.spec.js`', ''].join('\n'));
    // Deliberately do NOT write tests/e2e/missing.spec.js.
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var result = pe._resolveAutoCaptureTarget(req, journey, acRow);
    clearRepoRoot();
    assert.strictEqual(result, null);
  });
});

queue.push(function() {
  return test('T3f (AC5, security): a specFile reference attempting to traverse outside repoRoot is rejected, never read', function() {
    var journey = makeFakeJourney('actr-s2-t3f-feature');
    var repoRoot = makeTempRepoRoot();
    writeFixtureFile(repoRoot, 'artefacts/' + journey.featureSlug + '/test-plans/story-one-test-plan.md',
      ['## E2E Tests', '', '### t', '- **Verifies:** AC1', '- **File:** `../../../etc/passwd.spec.js`', ''].join('\n'));
    var acRow = { acId: 'AC1', storySlug: 'story-one' };
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var result = pe._resolveAutoCaptureTarget(req, journey, acRow);
    clearRepoRoot();
    assert.strictEqual(result, null, 'a path-traversal attempt in the spec file reference must be rejected by the same _resolveSafeShotPath guard screenshot/video serving already uses, never read');
  });
});

queue.push(function() {
  return test('T3g (AC5, review finding): acRow is null -- returns null, never throws', function() {
    var journey = makeFakeJourney('actr-s2-t3g-feature');
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var result = pe._resolveAutoCaptureTarget(req, journey, null);
    assert.strictEqual(result, null, 'acRow: null must return null, not throw');
  });
});

queue.push(function() {
  return test('T3h (AC5, review finding): acRow is undefined -- returns null, never throws', function() {
    var journey = makeFakeJourney('actr-s2-t3h-feature');
    var req = makeReq('tenant-a', 'product-a', journey.featureSlug);
    var result = pe._resolveAutoCaptureTarget(req, journey, undefined);
    assert.strictEqual(result, null, 'acRow: undefined must return null, not throw');
  });
});

console.log('\n[actr-s2] Task 4: render wiring (AC1, AC3)');

function setupSingleAcJourney(store) {
  var slug = 'actr-s2-render-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, {
    tenantId: 'tenant-a', productId: 'product-a',
    completedStages: [{ skillName: 'definition-of-done', artefactPath: null, completedAt: new Date().toISOString() }],
    pipelineStateStorySlugs: ['story-one']
  });
  return { journeyId: j.journeyId, featureSlug: slug };
}
// _getDodAcList's own DoD read is unchanged by the Task 3 redesign -- it
// still goes through _fetchArtefact (GitHub API), so this still needs the
// pe.setFetcherModule mock for the DoD list specifically. Only the
// test-plan.md/spec-file half moved to the local-repo-root fixture.
function installHappyPathFixture(featureSlug) {
  pe.setFetcherModule(async function(fs2, artefactType) {
    if (artefactType === 'dod/story-one-dod') return '## AC Coverage\n\n| AC | Satisfied? | Evidence |\n|----|----|----|\n| AC1 — Shows the thing | Yes | x |\n';
    throw new fetcher.ArtefactNotFoundError(fs2, artefactType);
  });
  var repoRoot = makeTempRepoRoot();
  writeFixtureFile(repoRoot, 'artefacts/' + featureSlug + '/test-plans/story-one-test-plan.md',
    ['## E2E Tests', '', '### t', '- **Verifies:** AC1', '- **File:** `tests/e2e/actr-s2-render-fixture.spec.js`', ''].join('\n'));
  writeFixtureFile(repoRoot, 'tests/e2e/actr-s2-render-fixture.spec.js',
    '// fixture.spec.js (story-one AC1)\nwithAuth(\'x\', async ({ page }) => {\n  await page.goto(\'/actr-s2-render-fixture\');\n  const el = page.locator(\'.actr-s2-render-target\');\n});\n');
}
function restoreHappyPathFixture() { pe.setFetcherModule(fetcher.fetchArtefact); clearRepoRoot(); }

queue.push(function() {
  return test('T4a (AC1): no manual target, resolvable auto-target -- renders auto-detected block, no manual form for that AC', function() {
    var store4 = getStore();
    var setup = setupSingleAcJourney(store4);
    installHappyPathFixture(setup.featureSlug);
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreHappyPathFixture();
      assert.strictEqual(res._status, 200);
      assert.ok(res._body.indexOf('Auto-detected from') !== -1, 'must show the auto-detected block');
      assert.ok(res._body.indexOf('/actr-s2-render-fixture') !== -1, 'must show the resolved url');
      assert.ok(res._body.indexOf('.actr-s2-render-target') !== -1, 'must show the resolved selector');
      assert.ok(res._body.indexOf('name="url"') === -1, 'the manual entry form must NOT be present for this AC when auto-resolved and not overridden');
    }, function(err) { restoreHappyPathFixture(); throw err; });
  });
});

queue.push(function() {
  return test('T4b (AC1): the capture button is available immediately (no manual entry required first)', function() {
    var store4 = getStore();
    var setup = setupSingleAcJourney(store4);
    installHappyPathFixture(setup.featureSlug);
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreHappyPathFixture();
      assert.ok(res._body.indexOf('Capture evidence') !== -1, 'capture button must render for an auto-resolved target, same as a manually-set one');
    }, function(err) { restoreHappyPathFixture(); throw err; });
  });
});

queue.push(function() {
  return test('T4c (AC3): a manually-set target takes priority over a resolvable auto-target', function() {
    var store4 = getStore();
    var setup = setupSingleAcJourney(store4);
    installHappyPathFixture(setup.featureSlug);
    store4.setCaptureTarget(setup.journeyId, 'AC1', '/manually-set-url', '.manually-set-selector');
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreHappyPathFixture();
      assert.ok(res._body.indexOf('/manually-set-url') !== -1, 'the manual value must be shown');
      assert.ok(res._body.indexOf('/actr-s2-render-fixture') === -1, 'the auto-resolved value must NEVER be shown when a manual target already exists');
      assert.ok(res._body.indexOf('Auto-detected from') === -1, 'the auto-detected label must not appear when a manual target wins');
    }, function(err) { restoreHappyPathFixture(); throw err; });
  });
});

console.log('\n[actr-s2] Task 5: dispatch wiring (AC2)');

// Same {set, get, del} fake-nonce-store convention as
// check-ppc-s3-capture-rate-limit.js's installFakeNonceStore and
// check-ppc-s9-capture-dispatch-wiring.js's installFakeNonceStore -- copied
// exactly, not reinvented.
function installFakeNonceStore() {
  var records = {};
  nonceStore.setNonceStoreAdapter({
    set: async function(key, value) { records[key] = value; },
    get: async function(key) { return records[key] === undefined ? null : records[key]; },
    del: async function(key) { delete records[key]; }
  });
  return records;
}

// AC1 known to _getDodAcList (via the DoD-list fetcher mock) but no
// test-plan.md/spec file on disk -- the empty temp repo root reproduces
// T3d's "missing test-plan.md" case against the full request handler.
function installDodOnlyFixture() {
  pe.setFetcherModule(async function(fs2, artefactType) {
    if (artefactType === 'dod/story-one-dod') return '## AC Coverage\n\n| AC | Satisfied? | Evidence |\n|----|----|----|\n| AC1 — Shows the thing | Yes | x |\n';
    throw new fetcher.ArtefactNotFoundError(fs2, artefactType);
  });
  makeTempRepoRoot(); // empty -- no test-plan.md written
}

queue.push(function() {
  return test('T5 (AC2): triggering capture with no manual entry dispatches the auto-resolved target', function() {
    installFakeNonceStore();
    var dispatched = null;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function(args) { dispatched = args; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });
    var store5 = getStore();
    var setup = setupSingleAcJourney(store5);
    installHappyPathFixture(setup.featureSlug);
    // this file's own makeReq (unlike check-ppc-s3/s9's) does not seed
    // session.csrfToken in its base object -- set it explicitly here so
    // csrfGuard's submitted-vs-expected comparison matches.
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug, {
      params: { productId: 'product-a', featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' },
      headers: { accept: 'application/json', host: 'localhost' }
    });
    req.session.csrfToken = 'test-csrf-token';
    var res = makeRes();
    return pe.handlePostCaptureTrigger(req, res, null, makeMockPool()).then(function() {
      restoreHappyPathFixture();
      assert.ok(dispatched, 'dispatchCaptureWorkflow must have been called');
      assert.deepStrictEqual(dispatched.targets, [{ acId: 'AC1', url: '/actr-s2-render-fixture', selector: '.actr-s2-render-target' }]);
      assert.strictEqual(res._status, 200, 'must succeed once the auto-resolved target is used, not 400');
      var body = JSON.parse(res._body);
      assert.strictEqual(body.ok, true);
      assert.strictEqual(body.dispatched, true);
    }, function(err) { restoreHappyPathFixture(); throw err; });
  });
});

queue.push(function() {
  return test('T5 (AC2, regression guard): an AC with genuinely no target at all (no manual, not auto-resolvable either) still 400s exactly as before', function() {
    installDodOnlyFixture();
    installFakeNonceStore();
    var dispatched = null;
    captureDispatchAdapter.setCaptureDispatchAdapter({
      dispatchCaptureWorkflow: async function(args) { dispatched = args; },
      checkCaptureArtifact: async function() { return { found: false }; },
      downloadCaptureArtifact: async function() { return {}; }
    });
    var store5b = getStore();
    var setup = setupSingleAcJourney(store5b);
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug, {
      params: { productId: 'product-a', featureSlug: setup.featureSlug, acId: 'AC1' },
      body: { _csrf: 'test-csrf-token' },
      headers: { accept: 'application/json', host: 'localhost' }
    });
    req.session.csrfToken = 'test-csrf-token';
    var res = makeRes();
    return pe.handlePostCaptureTrigger(req, res, null, makeMockPool()).then(function() {
      restoreHappyPathFixture();
      assert.strictEqual(dispatched, null, 'must never dispatch when no target -- manual or auto -- is resolvable');
      assert.strictEqual(res._status, 400);
      var body = JSON.parse(res._body);
      assert.strictEqual(body.error, 'no capture target set for this AC');
    }, function(err) { restoreHappyPathFixture(); throw err; });
  });
});

console.log('\n[actr-s2] Task 6: Override round-trip (AC6)');

queue.push(function() {
  return test('T6a: ?override=<acId> reveals the manual form even though the target is auto-resolved', function() {
    var store6 = getStore();
    var setup = setupSingleAcJourney(store6);
    installHappyPathFixture(setup.featureSlug);
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug, { query: { override: 'AC1' } });
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreHappyPathFixture();
      assert.ok(res._body.indexOf('Auto-detected from') !== -1, 'the auto-detected info line should still show for context');
      assert.ok(res._body.indexOf('name="url"') !== -1, 'the manual form must now be present because override was requested');
    }, function(err) { restoreHappyPathFixture(); throw err; });
  });
});

queue.push(function() {
  return test('T6b: submitting the override form, then reloading without ?override, shows the overridden value and hides the auto-detected block', function() {
    var store6 = getStore();
    var setup = setupSingleAcJourney(store6);
    installHappyPathFixture(setup.featureSlug);
    store6.setCaptureTarget(setup.journeyId, 'AC1', '/overridden-url', '.overridden-selector');
    var req = makeReq('tenant-a', 'product-a', setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, makeMockPool()).then(function() {
      restoreHappyPathFixture();
      assert.ok(res._body.indexOf('/overridden-url') !== -1, 'the overridden value must now be the active target');
      assert.ok(res._body.indexOf('Auto-detected from') === -1, 'the auto-detected label must be gone -- manual now wins, per AC3\'s own priority rule');
    }, function(err) { restoreHappyPathFixture(); throw err; });
  });
});

// Driver: runs every queued test in order and prints the final summary.
// Added HERE, in Task 1, not at the end of the file -- every later task's
// own RED/GREEN step depends on this actually executing and printing
// PASS/FAIL output. Do NOT add a second copy of this block in any later
// task; each later task's "Step 1: Write the failing tests" instruction
// only means "insert new queue.push(...) blocks ABOVE this runner," never
// duplicate the runner itself. Confirm exactly one `runAll` invocation
// exists in the file before finishing any task.
console.log('\n[actr-s2] Running all queued tests...');
(function runAll(i) {
  if (i >= queue.length) {
    console.log('\n[actr-s2-auto-resolve-single-ac] Results: ' + passed + ' passed, ' + failed + ' failed');
    process.exit(failed > 0 ? 1 : 0);
    return;
  }
  queue[i]().then(function() { runAll(i + 1); });
})(0);
