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

console.log('\n[cat-s5] AC3 -- orphaned-registration link is flagged distinctly from a never-registered link');
{
  var tmpRoot = path.join(os.tmpdir(), 'cat-s5-orphan-' + Date.now());
  var featureDir = path.join(tmpRoot, 'artefacts', 'ghost-feature');
  fs.mkdirSync(featureDir, { recursive: true });
  fs.mkdirSync(path.join(tmpRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(tmpRoot, '.github', 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: 'ghost-feature', stories: [{ id: 'ghost-s1', name: 'Ghost Story' }] }]
  }), 'utf8');
  // Deliberately no file matching ghost-s1 anywhere on disk -- an
  // orphaned-registration story per cat-s3's own classification.

  var fetcherMod = freshRequire(FETCHER_PATH);
  var calls = [];
  global.fetch = mockFetchOkPaths([], calls);
  try {
    await fetcherMod.fetchArtefact('ghost-feature', 'ghost-s1-notes', 'tok', undefined, undefined, tmpRoot);
    test('should have thrown', function() { assert.fail('expected ArtefactNotFoundError'); });
  } catch (err) {
    test('throws ArtefactNotFoundError (AC4: same error class, unchanged constructor)', function() {
      assert.strictEqual(err.name, 'ArtefactNotFoundError');
    });
    test('is flagged orphanedRegistration -- distinct from a genuinely never-registered path', function() {
      assert.strictEqual(err.orphanedRegistration, true);
    });
  }

console.log('\n[cat-s5] AC3 (non-conflation) -- a genuinely never-registered path is NOT flagged orphanedRegistration');
  var calls2 = [];
  global.fetch = mockFetchOkPaths([], calls2);
  try {
    await fetcherMod.fetchArtefact('ghost-feature', 'totally-unrelated-name', 'tok', undefined, undefined, tmpRoot);
    test('should have thrown', function() { assert.fail('expected ArtefactNotFoundError'); });
  } catch (err) {
    test('throws ArtefactNotFoundError', function() { assert.strictEqual(err.name, 'ArtefactNotFoundError'); });
    test('is NOT flagged orphanedRegistration -- an operator must be able to tell these two 404 causes apart', function() {
      assert.notStrictEqual(err.orphanedRegistration, true);
    });
  }
}

console.log('\n[cat-s5] AC4 -- ArtefactNotFoundError constructor signature is unchanged');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var err = new fetcherMod.ArtefactNotFoundError('some-slug', 'some-type');
  test('constructor still takes (featureSlug, artefactType) and sets the same properties', function() {
    assert.strictEqual(err.featureSlug, 'some-slug');
    assert.strictEqual(err.artefactType, 'some-type');
    assert.strictEqual(err.name, 'ArtefactNotFoundError');
  });
  test('orphanedRegistration is undefined by default -- an additive property, not a constructor argument', function() {
    assert.strictEqual(err.orphanedRegistration, undefined);
  });
}

console.log('\n[cat-s5] AC3/AC4 (route-level) -- the distinguishing 404 message renders only after postgres-fallback also fails, via handleArtefactRoute\'s real branch');
{
  var routeMod = freshRequire(ARTEFACT_ROUTE_PATH);
  var fetcherModForRoute = require(FETCHER_PATH);
  routeMod.setFetcher(function() {
    var err = new fetcherModForRoute.ArtefactNotFoundError('ghost-feature', 'ghost-s1-notes');
    err.orphanedRegistration = true;
    return Promise.reject(err);
  });
  routeMod.setJourneyStore({
    getJourneyByFeatureSlug: function() { return null; },
    getArtefactsForJourney: function() { return Promise.resolve([]); }
  });
  var body = '';
  var statusCode = null;
  var req = { session: { accessToken: 'tok', userId: 1, login: 'u', tenantId: 't1' } };
  var res = {
    writeHead: function(code) { statusCode = code; },
    end: function(b) { body = b || ''; }
  };
  await routeMod.handleArtefactRoute(req, res, 'ghost-feature', 'ghost-s1-notes', {});
  test('renders a 404 status', function() { assert.strictEqual(statusCode, 404); });
  test('the orphaned-registration message is distinct from the plain "artefact not found" text', function() {
    assert.notStrictEqual(body.indexOf('registered'), -1, 'expected the body to mention the registration, got: ' + body);
  });
}

console.log('\n[cat-s5] AC3/AC4 (route-level, real chain, not stubbed) -- a real orphaned-registration fetchArtefact throw actually reaches the real handleArtefactRoute catch branch and renders the distinguishing message, with postgres-fallback genuinely tried first');
{
  // Task 2's own review finding showed a stubbed-fetcher route test can pass
  // while the real fetchArtefact -> real handleArtefactRoute chain is never
  // actually reachable in production (repoRoot was silently never wired
  // through). The block above (per this plan's own Step 1) only proves
  // handleArtefactRoute's OWN rendering logic given an ALREADY-flagged,
  // stubbed error -- it never proves the real fetchArtefact (this task's new
  // orphaned-registration detection) actually produces that flag, nor that
  // the real, non-stubbed call chain carries it through to the real catch
  // branch. This block closes that gap: real tmpRoot fixture, real
  // buildArtefactTrace-backed fetchArtefact (not a stub), a journey store
  // that genuinely returns no fallback content (so postgres-fallback is
  // exercised and confirmed to run first, then come up empty), and a real,
  // non-stubbed handleArtefactRoute call end to end.
  var tmpRoot2 = path.join(os.tmpdir(), 'cat-s5-orphan-e2e-' + Date.now());
  fs.mkdirSync(path.join(tmpRoot2, 'artefacts', 'ghost-feature-e2e'), { recursive: true });
  fs.mkdirSync(path.join(tmpRoot2, '.github'), { recursive: true });
  fs.writeFileSync(path.join(tmpRoot2, '.github', 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: 'ghost-feature-e2e', stories: [{ id: 'ghost-e2e-s1', name: 'Ghost E2E Story' }] }]
  }), 'utf8');

  var routeMod2 = freshRequire(ARTEFACT_ROUTE_PATH);
  var fetcherModReal = require(FETCHER_PATH);
  var repoRootAdapter2 = require(path.resolve(__dirname, '../src/web-ui/adapters/repo-root'));
  repoRootAdapter2.setRepoRoot(tmpRoot2);

  var calls3 = [];
  global.fetch = mockFetchOkPaths([], calls3); // every candidate path 404s -- file genuinely absent

  var postgresFallbackCalled = false;
  routeMod2.setFetcher(fetcherModReal.fetchArtefact); // NOT stubbed -- the real implementation
  routeMod2.setJourneyStore({
    getJourneyByFeatureSlug: function() {
      postgresFallbackCalled = true;
      return null; // no journey -- postgres-fallback genuinely comes up empty
    },
    getArtefactsForJourney: function() { return Promise.resolve([]); }
  });

  var body2 = '';
  var statusCode2 = null;
  var req2 = { session: { accessToken: 'tok', userId: 1, login: 'u', tenantId: 't1' }, query: {}, headers: {} };
  var res2 = {
    writeHead: function(code) { statusCode2 = code; },
    end: function(b) { body2 = b || ''; }
  };
  var navPool2 = { query: function() { return Promise.resolve({ rows: [] }); } };

  await routeMod2.handleArtefactRoute(req2, res2, 'ghost-feature-e2e', 'ghost-e2e-s1-notes', navPool2);

  repoRootAdapter2.setRepoRoot(null);

  test('postgres-fallback was genuinely attempted before the distinguishing message rendered (AC4: fallback contract unchanged)', function() {
    assert.strictEqual(postgresFallbackCalled, true);
  });
  test('real (non-stubbed) fetchArtefact + real handleArtefactRoute renders a 404 status for the real orphaned-registration case', function() {
    assert.strictEqual(statusCode2, 404);
  });
  test('the real end-to-end chain renders the distinguishing orphaned-registration message, not the generic 404', function() {
    assert.notStrictEqual(body2.indexOf('registered'), -1, 'expected the body to mention the registration, got: ' + body2);
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
