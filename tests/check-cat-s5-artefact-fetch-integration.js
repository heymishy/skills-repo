'use strict';
// check-cat-s5-artefact-fetch-integration.js -- cat-s5: /artefact/:slug/:type
// resolves through cat-s1's buildArtefactTrace instead of independent logic,
// for the cases adlr-s1's own static ARTEFACT_SUBDIRS probe cannot reach.
// ADR-028, ADR-029.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var os = require('os');

var FETCHER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-fetcher.js');
var ARTEFACT_ROUTE_PATH = path.resolve(__dirname, '../src/web-ui/routes/artefact.js');
var REPO_ROOT = path.resolve(__dirname, '..');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

function mockFetchOkPaths(okPaths, calls) {
  return function(url) {
    calls.push(url);
    var matched = okPaths.some(function(p) { return url.indexOf(p) !== -1; });
    if (matched) {
      var body = { content: Buffer.from('content for ' + url, 'utf8').toString('base64') };
      return Promise.resolve({ status: 200, ok: true, json: function() { return Promise.resolve(body); } });
    }
    return Promise.resolve({ status: 404, ok: false, json: function() { return Promise.resolve({}); } });
  };
}

// All test bodies run inside this async function, awaited in sequence, so
// the final Results/exit-code logic at the bottom of the file only runs
// after every async assertion has actually executed -- future tasks in this
// story append MORE `await`-based blocks inside this same function, never a
// new unawaited top-level `.then()` chain (a dangling `.then()` here would
// let the Results line print, and the exit-code gate evaluate, before the
// promise resolves -- silently making this whole file's pass/fail reporting
// and CI gating meaningless, since `failed` would still read 0 at that
// point no matter what the async assertions actually found).
async function main() {

console.log('\n[cat-s5] AC1 -- correctly-encoded existing link resolves identically with repoRoot supplied (regression guard)');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/2026-07-05-product-stds-hierarchy/dor/psh-s1-dor.md'], calls);
  var content = await fetcherMod.fetchArtefact('2026-07-05-product-stds-hierarchy', 'dor/psh-s1-dor', 'tok', undefined, undefined, REPO_ROOT);
  test('content resolved, byte-identical to the no-repoRoot case', function() {
    assert.ok(content.indexOf('content for') === 0);
  });
  test('exactly 1 fetch call -- repoRoot supplied does not change the slash-containing direct-path case', function() {
    assert.strictEqual(calls.length, 1);
  });
}

console.log('\n[cat-s5] AC2 -- bare legacy link to a real spikes/ file resolves via the trace, not the old excluded-subdirectory probe');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  // spikes/ is in NOT_PROBED_AS_FALLBACK -- the OLD static probe can never
  // find this file no matter how many subdirectories it tries. Confirm this
  // file is real on disk first, so the test fixture is grounded in fact.
  var realSpikeFile = path.join(REPO_ROOT, 'artefacts', 'archived', '2026-04-19-skills-platform-phase4', 'spikes', 'spike-a-output.md');
  test('fixture precondition: the real spikes/ file exists on disk', function() {
    assert.ok(fs.existsSync(realSpikeFile), 'expected ' + realSpikeFile + ' to exist');
  });
  global.fetch = mockFetchOkPaths(['artefacts/archived/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md'], calls);
  var content = await fetcherMod.fetchArtefact('2026-04-19-skills-platform-phase4', 'spike-a-output', 'tok', undefined, undefined, REPO_ROOT);
  test('content resolved via the trace, not a 404', function() {
    assert.ok(content.indexOf('content for') === 0);
  });
  test('resolved in a single confident attempt, not a multi-subdirectory probe', function() {
    assert.strictEqual(calls.length, 1);
  });
}

console.log('\n[cat-s5] AC2 (structural check) -- trace-based match takes priority over the static probe for a bare name the trace can resolve');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/archived/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md'], calls);
  await fetcherMod.fetchArtefact('2026-04-19-skills-platform-phase4', 'spike-a-output', 'tok', undefined, undefined, REPO_ROOT);
  test('no probe attempts against any OTHER known subdirectory were made', function() {
    var nonSpikeProbes = calls.filter(function(u) { return u.indexOf('/spikes/') === -1; });
    assert.strictEqual(nonSpikeProbes.length, 0, 'expected zero non-spikes probe attempts, got: ' + JSON.stringify(nonSpikeProbes));
  });
}

console.log('\n[cat-s5] AC2 (fall-through) -- trace has no match falls through to the existing static probe unchanged');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/2026-07-05-product-stds-hierarchy/dor/x-dor.md'], calls);
  var content2 = await fetcherMod.fetchArtefact('2026-07-05-product-stds-hierarchy', 'x-dor', 'tok', undefined, undefined, REPO_ROOT);
  test('resolves via the old static probe when the trace has no filename match', function() {
    assert.ok(content2.indexOf('content for') === 0);
  });
}

console.log('\n[cat-s5] AC2 (fall-through) -- no repoRoot supplied behaves exactly as adlr-s1 always has (regression guard)');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths(['artefacts/archived/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md'], calls);
  try {
    await fetcherMod.fetchArtefact('2026-04-19-skills-platform-phase4', 'spike-a-output', 'tok');
    test('should have thrown -- spikes/ is excluded from the old static probe and no repoRoot was supplied', function() {
      assert.fail('expected ArtefactNotFoundError');
    });
  } catch (err) {
    test('throws ArtefactNotFoundError exactly as it did before this story, when repoRoot is omitted', function() {
      assert.strictEqual(err.name, 'ArtefactNotFoundError');
    });
  }
}

console.log('\n[cat-s5] Task 2 review-fixup -- handleArtefactRoute actually wires repoRoot into fetchArtefact end-to-end (real route, real content)');
{
  var routeMod = freshRequire(ARTEFACT_ROUTE_PATH);
  var fetcherModForWiring = require(FETCHER_PATH);
  var repoRootAdapter = require(path.resolve(__dirname, '../src/web-ui/adapters/repo-root'));
  repoRootAdapter.setRepoRoot(REPO_ROOT);

  // Same real fixture Task 2 already uses -- spikes/ is excluded from the
  // old static probe, so this only resolves at all if repoRoot genuinely
  // reaches fetchArtefact through handleArtefactRoute's real call chain.
  var realSpikeFile = path.join(REPO_ROOT, 'artefacts', 'archived', '2026-04-19-skills-platform-phase4', 'spikes', 'spike-a-output.md');
  var realSpikeContent = fs.readFileSync(realSpikeFile, 'utf8');

  var calls = [];
  // Mock the GitHub Contents API response with the REAL file's own content
  // (not a synthetic "content for <url>" placeholder) -- the assertion below
  // must prove real content actually rendered through the real route, not
  // just that some mocked text made it through.
  global.fetch = function(url) {
    calls.push(url);
    if (url.indexOf('artefacts/archived/2026-04-19-skills-platform-phase4/spikes/spike-a-output.md') !== -1) {
      var body = { content: Buffer.from(realSpikeContent, 'utf8').toString('base64') };
      return Promise.resolve({ status: 200, ok: true, json: function() { return Promise.resolve(body); } });
    }
    return Promise.resolve({ status: 404, ok: false, json: function() { return Promise.resolve({}); } });
  };

  // Deliberately NOT stubbing the fetcher -- routeMod's default _fetchArtefact
  // is the real fetchArtefact (from artefact-fetcher.js), so this exercises
  // the real handleArtefactRoute -> fetchArtefact call chain exactly as a
  // genuine HTTP request would, not a mocked-fetcher unit test like Task 2's
  // own 4 tests above.
  routeMod.setFetcher(fetcherModForWiring.fetchArtefact);
  routeMod.setJourneyStore({
    getJourneyByFeatureSlug: function() { return null; },
    getArtefactsForJourney: function() { return Promise.resolve([]); }
  });

  var req = { session: { accessToken: 'tok', userId: 1, login: 'u', tenantId: 't1' }, query: {}, headers: {} };
  var statusCode = null;
  var body = '';
  var res = {
    writeHead: function(code) { statusCode = code; },
    end: function(b) { body = b || ''; }
  };
  var navPool = { query: function() { return Promise.resolve({ rows: [] }); } };

  await routeMod.handleArtefactRoute(req, res, '2026-04-19-skills-platform-phase4', 'spike-a-output', navPool);

  repoRootAdapter.setRepoRoot(null);

  test('route-level request for the bare spikes/ link resolves (200, not a 404) -- proves repoRoot actually reached fetchArtefact', function() {
    assert.strictEqual(statusCode, 200);
  });
  test('resolved in a single confident trace-based attempt through the real route, not the old excluded-subdirectory probe', function() {
    assert.strictEqual(calls.length, 1);
  });
  test('rendered response body contains real content from the real spikes/ file, not mocked/synthetic text', function() {
    assert.notStrictEqual(body.indexOf('Governance Logic Extractability'), -1, 'expected body to contain real file content, got length ' + body.length);
  });
}

}

main().then(function() {
  console.log('\n[cat-s5] Results:', passed, 'passed,', failed, 'failed');
  process.exit(failed > 0 ? 1 : 0);
}).catch(function(err) {
  console.log('UNEXPECTED ERROR:', err.stack || err.message);
  process.exit(1);
});
