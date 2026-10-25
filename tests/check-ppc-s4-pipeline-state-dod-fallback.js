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

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
var pipelineStateFetchAdapter = require('../src/web-ui/adapters/pipeline-state-fetch-adapter');
pe.setJourneyStoreModule(store);

function getStore() {
  store._clearForTesting();
  return store;
}

function makeRes() {
  var res = {
    _status: null, _json: null, _body: null,
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status) { res._status = status; },
    end: function(body) { res._body = body; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}

var _makeReqCallCount = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _makeReqCallCount++;
  return Object.assign({
    session: { tenantId: tenantId, userId: 'ppc-s4-test-user-' + _makeReqCallCount, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug }
  }, extra || {});
}

// A fake pool matching _resolveOwnerRepo's own query shape -- does not need
// to parse SQL text since it's injected directly by the test, unlike
// fake-test-db.js's string-matched approach used by real server.js dispatch.
function fakePool(reposByProductId) {
  return {
    query: async function(sql, params) {
      var productId = params[0];
      var row = reposByProductId[productId];
      return { rows: row ? [row] : [] };
    }
  };
}

function b64(obj) {
  return Buffer.from(JSON.stringify(obj)).toString('base64');
}

function wirePipelineState(pipelineState) {
  pipelineStateFetchAdapter.setPipelineStateFetchAdapter(async function() {
    return { content: b64(pipelineState), size: Buffer.byteLength(JSON.stringify(pipelineState)), sha: 'fake-sha' };
  });
  pipelineStateFetchAdapter.setPipelineStateBlobFetchAdapter(async function() {
    throw new Error('blob fallback should not be needed for these small fixtures');
  });
}

function flatCompleteFixture(featureSlug, overrides) {
  return Object.assign({
    features: [{
      slug: featureSlug,
      stories: [
        { slug: 'fx-s1', dodStatus: 'complete' },
        { slug: 'fx-s2', dodStatus: 'complete' }
      ]
    }]
  }, overrides || {});
}

function epicNestedCompleteFixture(featureSlug) {
  return {
    features: [{
      slug: featureSlug,
      epics: [{
        slug: 'fx-epic',
        stories: [
          { slug: 'fx-s1', dodStatus: 'complete' },
          { slug: 'fx-s2', dodStatus: 'complete' }
        ]
      }],
      stories: []
    }]
  };
}

function stubFetchArtefactByStory(contentByStorySlug) {
  pe.setFetcherModule(async function(featureSlug, artefactType /*, token, repoOverride*/) {
    var m = /^dod\/(.+)-dod$/.exec(artefactType);
    var storySlug = m && m[1];
    if (storySlug && contentByStorySlug[storySlug]) return contentByStorySlug[storySlug];
    var err = new Error('not found: ' + artefactType);
    err.name = 'ArtefactNotFoundError';
    throw err;
  });
}

function dodMarkdown(acRows) {
  var lines = ['## AC Coverage', '', '| AC | Satisfied? | Evidence |', '|----|------------|----------|'];
  acRows.forEach(function(r) { lines.push('| ' + r + ' — something | Yes | screenshot |'); });
  return lines.join('\n');
}

// ── AC1: no journey, pipeline-state.json shows all stories complete → 200 ──

queue.push(function() {
  return test('AC1: no existing journey, flat stories all dodStatus:complete -> 200 with non-empty acs', async function() {
    getStore();
    var slug = 'ppc-s4-feature-flat-' + Date.now();
    wirePipelineState(flatCompleteFixture(slug));
    stubFetchArtefactByStory({ 'fx-s1': dodMarkdown(['AC1']), 'fx-s2': dodMarkdown(['AC2']) });
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, pool);

    assert.strictEqual(res._status === null || res._status === 200, true);
    assert.ok(res._json.acs.length > 0, 'acs must be non-empty');
  });
});

queue.push(function() {
  return test('AC1: epic-nested stories shape also resolves via the fallback', async function() {
    getStore();
    var slug = 'ppc-s4-feature-epic-' + Date.now();
    wirePipelineState(epicNestedCompleteFixture(slug));
    stubFetchArtefactByStory({ 'fx-s1': dodMarkdown(['AC1']), 'fx-s2': dodMarkdown(['AC2']) });
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, pool);

    assert.strictEqual(res._status === null || res._status === 200, true);
    assert.ok(res._json.acs.length > 0, 'acs must be non-empty');
  });
});

queue.push(function() {
  return test('AC1: a GitHub fetch failure is treated as not-found (404), not a crash', async function() {
    getStore();
    var slug = 'ppc-s4-feature-fetcherr-' + Date.now();
    pipelineStateFetchAdapter.setPipelineStateFetchAdapter(async function() { throw new Error('network error'); });
    pipelineStateFetchAdapter.setPipelineStateBlobFetchAdapter(async function() { throw new Error('network error'); });
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, pool);

    assert.strictEqual(res._status, 404);
  });
});

// ── AC2: second request reuses the auto-provisioned journey ────────────────

queue.push(function() {
  return test('AC2: second request for the same product/feature reuses the provisioned journey, no second GitHub fetch', async function() {
    getStore();
    var slug = 'ppc-s4-feature-reuse-' + Date.now();
    var fetchCalls = 0;
    pipelineStateFetchAdapter.setPipelineStateFetchAdapter(async function() {
      fetchCalls++;
      var fixture = flatCompleteFixture(slug);
      return { content: b64(fixture), size: Buffer.byteLength(JSON.stringify(fixture)), sha: 'fake-sha' };
    });
    pipelineStateFetchAdapter.setPipelineStateBlobFetchAdapter(async function() { throw new Error('unused'); });
    stubFetchArtefactByStory({ 'fx-s1': dodMarkdown(['AC1']), 'fx-s2': dodMarkdown(['AC2']) });
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req1 = makeReq('tenant-a', 'product-a', slug);
    var res1 = makeRes();
    await pe.handleGetPlaybackEvidence(req1, res1, null, pool);
    assert.strictEqual(res1._status === null || res1._status === 200, true);

    var req2 = makeReq('tenant-a', 'product-a', slug);
    var res2 = makeRes();
    await pe.handleGetPlaybackEvidence(req2, res2, null, pool);
    assert.strictEqual(res2._status === null || res2._status === 200, true);

    assert.strictEqual(fetchCalls, 1, 'pipeline-state fetch must only happen once across both requests');
  });
});

queue.push(function() {
  return test('AC2: the provisioned journey is tenant/product-scoped with a definition-of-done completedStages entry', async function() {
    var s = getStore();
    var slug = 'ppc-s4-feature-scoped-' + Date.now();
    wirePipelineState(flatCompleteFixture(slug));
    stubFetchArtefactByStory({ 'fx-s1': dodMarkdown(['AC1']), 'fx-s2': dodMarkdown(['AC2']) });
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, pool);

    var journey = s.getJourneyByTenantProductSlug('tenant-a', 'product-a', slug);
    assert.ok(journey, 'a journey must now exist, scoped to tenant-a/product-a');
    assert.strictEqual(s.isDodComplete(journey), true);
  });
});

// ── AC3: partial completion never triggers the fallback ─────────────────────

queue.push(function() {
  return test('AC3: one flat story not dodStatus:complete -> still 404', async function() {
    getStore();
    var slug = 'ppc-s4-feature-partial-flat-' + Date.now();
    var fixture = flatCompleteFixture(slug);
    fixture.features[0].stories[1].dodStatus = 'in-progress';
    wirePipelineState(fixture);
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, pool);

    assert.strictEqual(res._status, 404);
  });
});

queue.push(function() {
  return test('AC3: one epic-nested story not dodStatus:complete -> still 404', async function() {
    getStore();
    var slug = 'ppc-s4-feature-partial-epic-' + Date.now();
    var fixture = epicNestedCompleteFixture(slug);
    fixture.features[0].epics[0].stories[1].dodStatus = 'in-progress';
    wirePipelineState(fixture);
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, pool);

    assert.strictEqual(res._status, 404);
  });
});

// ── AC4: no connected repo / query failure -> 404, no leak ──────────────────

queue.push(function() {
  return test('AC4: product has no connected repo -> 404, identical body to pre-fix behaviour', async function() {
    getStore();
    var slug = 'ppc-s4-feature-norepo-' + Date.now();
    var pool = fakePool({ 'product-a': { repo_owner: null, repo_name: null } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, pool);

    assert.strictEqual(res._status, 404);
    assert.deepStrictEqual(res._json, { error: 'not found' });
  });
});

queue.push(function() {
  return test('AC4: the products query itself failing -> 404, no unhandled rejection', async function() {
    getStore();
    var slug = 'ppc-s4-feature-queryerr-' + Date.now();
    var pool = { query: async function() { throw new Error('connection reset'); } };

    var req = makeReq('tenant-a', 'product-a', slug);
    var res = makeRes();
    await pe.handleGetPlaybackEvidence(req, res, null, pool);

    assert.strictEqual(res._status, 404);
  });
});

// ── AC5: tenant/product isolation holds for the fallback path ──────────────

queue.push(function() {
  return test('AC5: tenant B cannot reach a feature that is only DoD-complete in tenant A\'s repo', async function() {
    getStore();
    var slug = 'ppc-s4-shared-slug-' + Date.now();
    // Only product-a's repo reports this feature as complete.
    pipelineStateFetchAdapter.setPipelineStateFetchAdapter(async function(owner, repo) {
      var fixture = (owner === 'acme') ? flatCompleteFixture(slug) : { features: [] };
      return { content: b64(fixture), size: Buffer.byteLength(JSON.stringify(fixture)), sha: 'fake-sha' };
    });
    pipelineStateFetchAdapter.setPipelineStateBlobFetchAdapter(async function() { throw new Error('unused'); });
    stubFetchArtefactByStory({ 'fx-s1': dodMarkdown(['AC1']), 'fx-s2': dodMarkdown(['AC2']) });
    var pool = fakePool({
      'product-a': { repo_owner: 'acme', repo_name: 'widgets' },
      'product-b': { repo_owner: 'other-org', repo_name: 'other-repo' }
    });

    var reqB = makeReq('tenant-b', 'product-b', slug);
    var resB = makeRes();
    await pe.handleGetPlaybackEvidence(reqB, resB, null, pool);
    assert.strictEqual(resB._status, 404, 'tenant B must not see tenant A\'s DoD-complete feature');

    var reqA = makeReq('tenant-a', 'product-a', slug);
    var resA = makeRes();
    await pe.handleGetPlaybackEvidence(reqA, resA, null, pool);
    assert.strictEqual(resA._status === null || resA._status === 200, true, 'tenant A must still succeed independently');
  });
});

queue.push(function() {
  return test('AC5: same featureSlug DoD-complete in two different products never cross-matches journeys', async function() {
    var s = getStore();
    var slug = 'ppc-s4-collision-slug-' + Date.now();
    pipelineStateFetchAdapter.setPipelineStateFetchAdapter(async function() {
      var fixture = flatCompleteFixture(slug);
      return { content: b64(fixture), size: Buffer.byteLength(JSON.stringify(fixture)), sha: 'fake-sha' };
    });
    pipelineStateFetchAdapter.setPipelineStateBlobFetchAdapter(async function() { throw new Error('unused'); });
    stubFetchArtefactByStory({ 'fx-s1': dodMarkdown(['AC1']), 'fx-s2': dodMarkdown(['AC2']) });
    var pool = fakePool({
      'product-a': { repo_owner: 'acme', repo_name: 'widgets' },
      'product-b': { repo_owner: 'other-org', repo_name: 'other-repo' }
    });

    var reqA = makeReq('tenant-a', 'product-a', slug);
    await pe.handleGetPlaybackEvidence(reqA, makeRes(), null, pool);
    var reqB = makeReq('tenant-b', 'product-b', slug);
    await pe.handleGetPlaybackEvidence(reqB, makeRes(), null, pool);

    var journeyA = s.getJourneyByTenantProductSlug('tenant-a', 'product-a', slug);
    var journeyB = s.getJourneyByTenantProductSlug('tenant-b', 'product-b', slug);
    assert.ok(journeyA && journeyB, 'both journeys must exist');
    assert.notStrictEqual(journeyA.journeyId, journeyB.journeyId, 'each tenant/product pair must get its own journey');
    assert.strictEqual(s.getJourneyByTenantProductSlug('tenant-b', 'product-a', slug), null, 'tenant B must never resolve under product A');
  });
});

// ── AC6: AC rows fetched from real GitHub content, aggregated across stories ─

queue.push(function() {
  return test('AC6: _getDodAcList falls back to GitHub content when no Postgres artefact rows exist', async function() {
    getStore();
    var slug = 'ppc-s4-feature-acfallback-' + Date.now();
    wirePipelineState(flatCompleteFixture(slug));
    stubFetchArtefactByStory({ 'fx-s1': dodMarkdown(['AC1']), 'fx-s2': dodMarkdown(['AC2']) });
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var journey = await pe._resolveViaPipelineState(req, pool, 'tenant-a', 'product-a', slug);
    assert.ok(journey, 'fallback must provision a journey');

    var acs = await pe._getDodAcList(journey, req, pool);
    assert.ok(acs.length > 0, 'ac rows must come from the stubbed GitHub content, not be empty');
  });
});

queue.push(function() {
  return test('AC6: aggregates AC rows across every DoD-complete story, not just the first', async function() {
    getStore();
    var slug = 'ppc-s4-feature-aggregate-' + Date.now();
    wirePipelineState(flatCompleteFixture(slug));
    stubFetchArtefactByStory({ 'fx-s1': dodMarkdown(['AC1']), 'fx-s2': dodMarkdown(['AC2']) });
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });

    var req = makeReq('tenant-a', 'product-a', slug);
    var journey = await pe._resolveViaPipelineState(req, pool, 'tenant-a', 'product-a', slug);
    var acs = await pe._getDodAcList(journey, req, pool);

    var ids = acs.map(function(a) { return a.acId; });
    assert.ok(ids.indexOf('AC1') !== -1, 'must include fx-s1\'s AC1');
    assert.ok(ids.indexOf('AC2') !== -1, 'must include fx-s2\'s AC2 too, not only the first story fetched');
  });
});

// ── Unit tests for the pure _featureDodStatus helper ────────────────────────

queue.push(function() {
  return test('_featureDodStatus: all-complete flat shape returns allComplete:true with story slugs', function() {
    var slug = 'unit-flat';
    var result = pe._featureDodStatus(flatCompleteFixture(slug), slug);
    assert.strictEqual(result.allComplete, true);
    assert.deepStrictEqual(result.storySlugs, ['fx-s1', 'fx-s2']);
  });
});

queue.push(function() {
  return test('_featureDodStatus: all-complete epic-nested shape returns allComplete:true with story slugs', function() {
    var slug = 'unit-epic';
    var result = pe._featureDodStatus(epicNestedCompleteFixture(slug), slug);
    assert.strictEqual(result.allComplete, true);
    assert.deepStrictEqual(result.storySlugs, ['fx-s1', 'fx-s2']);
  });
});

queue.push(function() {
  return test('_featureDodStatus: one incomplete story returns allComplete:false', function() {
    var slug = 'unit-partial';
    var fixture = flatCompleteFixture(slug);
    fixture.features[0].stories[1].dodStatus = 'in-progress';
    var result = pe._featureDodStatus(fixture, slug);
    assert.strictEqual(result.allComplete, false);
  });
});

queue.push(function() {
  return test('_featureDodStatus: unknown feature slug returns null', function() {
    var result = pe._featureDodStatus(flatCompleteFixture('some-other-slug'), 'not-this-one');
    assert.strictEqual(result, null);
  });
});

// ── NFR: fallback never resolves by featureSlug alone ───────────────────────

queue.push(function() {
  return test('NFR-SEC: _resolveViaPipelineState returns null when tenantId or productId is missing', async function() {
    var req = makeReq(undefined, 'product-a', 'some-slug');
    var pool = fakePool({ 'product-a': { repo_owner: 'acme', repo_name: 'widgets' } });
    var result1 = await pe._resolveViaPipelineState(req, pool, undefined, 'product-a', 'some-slug');
    assert.strictEqual(result1, null);

    var result2 = await pe._resolveViaPipelineState(req, pool, 'tenant-a', undefined, 'some-slug');
    assert.strictEqual(result2, null);
  });
});

(async function run() {
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
