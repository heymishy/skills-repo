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
