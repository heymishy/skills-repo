'use strict';
// check-das-s1-commit-artefact-git-fallback.js
// TDD tests for das-s1: commit completed-stage artefacts to the product's
// connected repo (dual-write), with git-fallback on "Resume conversation".
// Tests AC1-AC5 per
// artefacts/2026-08-06-durable-artefact-storage/test-plans/das-s1-test-plan.md
//
// Session terminology: "HTML session" = the journey-store session object
// retrieved by getGetHtmlSession()(sid). Not the same as req.session (auth).

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');

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

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var EXPORT_DATA_SOURCE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/export-data-source.js');
var ARTEFACT_COMMIT_WRITER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-commit-writer.js');

function freshRequireJourney() {
  try { delete require.cache[require.resolve(JOURNEY_PATH)]; } catch (_) {}
  try { delete require.cache[require.resolve(JOURNEY_STORE_PATH)]; } catch (_) {}
  return require(JOURNEY_PATH);
}

function getStore() {
  return require(JOURNEY_STORE_PATH);
}

function getExportDataSource() {
  return require(EXPORT_DATA_SOURCE_PATH);
}

function getArtefactCommitWriter() {
  return require(ARTEFACT_COMMIT_WRITER_PATH);
}

function makeRes() {
  var res = {
    _status: null,
    _headers: {},
    _body: '',
    writeHead: function(status, headers) {
      res._status = status;
      Object.assign(res._headers, headers || {});
    },
    setHeader: function(k, v) { res._headers[k] = v; },
    end: function(body) { res._body += (body || ''); }
  };
  return res;
}

function authReq(extra) {
  return Object.assign({
    session: { accessToken: 'test-token', userId: 1, login: 'user' },
    params: {},
    body: {}
  }, extra || {});
}

// Shared tmp root for all tests
var tmpRoot = path.join(os.tmpdir(), 'das-s1-tests-' + Date.now());
fs.mkdirSync(tmpRoot, { recursive: true });

/**
 * Minimal hand-rolled mock pg-Pool-shaped object, scoped to exactly the two
 * query shapes ownerRepoForFeature issues -- mirrors
 * check-mtrr-s1-tenant-scoped-repo-resolution.js's own createMockPool.
 */
function createMockPool(journeyRows, productRows) {
  async function query(sql, params) {
    var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
    if (s.startsWith('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS WHERE FEATURE_SLUG')) {
      var slug = params[0];
      var match = journeyRows.filter(function(r) { return r.feature_slug === slug; });
      return { rows: match.map(function(r) { return { product_id: r.product_id, tenant_id: r.tenant_id }; }) };
    }
    if (s.startsWith('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS WHERE PRODUCT_ID') && s.includes('TENANT_ID')) {
      var productId = params[0], tenantId = params[1];
      var pmatch = productRows.filter(function(r) { return r.product_id === productId && r.tenant_id === tenantId; });
      return { rows: pmatch.map(function(r) { return { repo_owner: r.repo_owner, repo_name: r.repo_name }; }) };
    }
    return { rows: [] };
  }
  return { query: query };
}

/** Sets up a journey + HTML session for gate-confirm, and returns { journeyId, sid, featureSlug, artefactRelPath }. */
function setupStageSession(journey, store, opts) {
  opts = opts || {};
  var featureSlug = opts.featureSlug || ('test-feature-das-s1-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var skillName = opts.skillName || 'review';
  var artefactRelPath = opts.artefactRelPath || ('artefacts/' + featureSlug + '/' + skillName + '.md');
  var artefactContent = opts.artefactContent || ('# ' + skillName + ' artefact for ' + featureSlug);

  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  store.setStoryList(journeyId, ['das-s1-story']);
  var sid = 'sid-das-s1-' + Date.now() + '-' + Math.random();
  store.setActiveSession(journeyId, sid, skillName);

  if (opts.writeArtefact !== false) {
    var absArtefact = path.join(tmpRoot, artefactRelPath);
    fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
    fs.writeFileSync(absArtefact, artefactContent, 'utf8');
  }

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(tmpRoot);
  journey.setPipelineStateWriter(function() {});

  journey.setGetHtmlSession(function(s) {
    if (s === sid) {
      return {
        skillName: skillName,
        done: true,
        artefactPath: artefactRelPath,
        artefactContent: artefactContent,
        journeyId: journeyId,
        turns: [],
        systemPrompt: 'test'
      };
    }
    return null;
  });

  return { journeyId: journeyId, sid: sid, featureSlug: featureSlug, artefactRelPath: artefactRelPath, artefactContent: artefactContent, skillName: skillName };
}

var queue = [];

// ---------------------------------------------------------------------------
// AC1 (unit) — dual-write: git commit + local disk both happen
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('completedStage_withConnectedRepo_commitsToGitAndDisk', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var pool = createMockPool(
      [{ feature_slug: 'placeholder', product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    );
    var setup = setupStageSession(journey, store, {});
    // Re-seed the pool's journey row with the real featureSlug now known.
    pool = createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    );
    eds.setDbPool(pool);

    var commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo) {
      commitCalls.push({ artefactPath: artefactPath, content: content, token: token, owner: owner, repo: repo });
      return { ok: true };
    });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(commitCalls.length, 1, 'commit adapter must be called exactly once');
    assert.strictEqual(commitCalls[0].artefactPath, setup.artefactRelPath, 'commit path must match the artefacts/<slug>/<stage>.md convention');
    assert.strictEqual(commitCalls[0].owner, 'acme');
    assert.strictEqual(commitCalls[0].repo, 'widgets');
    assert.strictEqual(commitCalls[0].content, setup.artefactContent, 'committed content must match the artefact content');

    var diskPath = path.join(tmpRoot, setup.artefactRelPath);
    assert.ok(fs.existsSync(diskPath), 'local disk file must still be written (dual-write, not a replacement)');
    assert.strictEqual(fs.readFileSync(diskPath, 'utf8'), setup.artefactContent);
  });
});

// ---------------------------------------------------------------------------
// AC1 (D37 wiring test) — two products resolve to two different repos
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('artefactCommitAdapter_twoProductsResolveToTwoDifferentRepos', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setupA = setupStageSession(journey, store, { featureSlug: 'das-s1-product-a-' + Date.now() });
    var setupB = setupStageSession(journey, store, { featureSlug: 'das-s1-product-b-' + Date.now() });

    var pool = createMockPool(
      [
        { feature_slug: setupA.featureSlug, product_id: 'product-a-id', tenant_id: 'tenant-a' },
        { feature_slug: setupB.featureSlug, product_id: 'product-b-id', tenant_id: 'tenant-b' }
      ],
      [
        { product_id: 'product-a-id', tenant_id: 'tenant-a', repo_owner: 'owner-a', repo_name: 'repo-a' },
        { product_id: 'product-b-id', tenant_id: 'tenant-b', repo_owner: 'owner-b', repo_name: 'repo-b' }
      ]
    );
    eds.setDbPool(pool);

    var commitCalls = [];
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token, owner, repo) {
      commitCalls.push({ owner: owner, repo: repo });
      return { ok: true };
    });

    // Product A's completion
    journey.setGetHtmlSession(function(s) {
      if (s === setupA.sid) {
        return { skillName: setupA.skillName, done: true, artefactPath: setupA.artefactRelPath, artefactContent: setupA.artefactContent, journeyId: setupA.journeyId, turns: [], systemPrompt: 'test' };
      }
      if (s === setupB.sid) {
        return { skillName: setupB.skillName, done: true, artefactPath: setupB.artefactRelPath, artefactContent: setupB.artefactContent, journeyId: setupB.journeyId, turns: [], systemPrompt: 'test' };
      }
      return null;
    });

    var resA = makeRes();
    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setupA.journeyId } }), resA);

    var resB = makeRes();
    await journey.handlePostGateConfirm(authReq({ params: { journeyId: setupB.journeyId } }), resB);

    assert.strictEqual(commitCalls.length, 2, 'commit adapter must be called once per product');
    assert.strictEqual(commitCalls[0].owner, 'owner-a');
    assert.strictEqual(commitCalls[0].repo, 'repo-a');
    assert.strictEqual(commitCalls[1].owner, 'owner-b');
    assert.strictEqual(commitCalls[1].repo, 'repo-b');
    assert.notStrictEqual(commitCalls[0].owner, commitCalls[1].owner, 'two different products must resolve to two different owners');
    assert.notStrictEqual(commitCalls[0].repo, commitCalls[1].repo, 'two different products must resolve to two different repos');
  });
});

// ---------------------------------------------------------------------------
// AC2 (unit) — commit failure blocks stage completion, surfaces clear error
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('gitCommitFailure_stageNotMarkedComplete', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, {});
    var pool = createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    );
    eds.setDbPool(pool);
    acw.setArtefactCommitAdapter(async function() {
      throw new Error('simulated GitHub API failure (rate limit)');
    });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(res._status >= 400, 'expected an error status, got ' + res._status);
    assert.ok(res._body && res._body.length > 0, 'response body must contain an actionable error message');

    var journeyObj = store.getJourney(setup.journeyId);
    var stageEntry = (journeyObj.completedStages || []).find(function(s) { return s.skillName === setup.skillName; });
    assert.strictEqual(stageEntry, undefined, 'stage must NOT be marked complete when the git commit fails');
  });
});

// ---------------------------------------------------------------------------
// AC3 (unit) — missing local file + successful git fetch -> renders content
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('missingLocalFile_gitFallbackRendersContent', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();

    var marker = 'DAS-S1-GIT-FALLBACK-MARKER-' + Date.now();
    var setup = setupStageSession(journey, store, { artefactContent: '# Review\n\n' + marker });
    var pool = createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    );
    eds.setDbPool(pool);

    // Mark the stage complete (so completedStages has an entry for stage-view to find)
    store.completeStage(setup.journeyId, setup.skillName, setup.artefactRelPath, null, setup.sid);

    // Simulate a redeploy: delete the local file
    fs.unlinkSync(path.join(tmpRoot, setup.artefactRelPath));

    var b64 = Buffer.from(setup.artefactContent, 'utf8').toString('base64');
    var originalFetch = global.fetch;
    global.fetch = async function(url) {
      if (url.includes('/repos/acme/widgets/contents/' + setup.artefactRelPath)) {
        return { ok: true, status: 200, json: async function() { return { content: b64, encoding: 'base64' }; } };
      }
      return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
    };

    try {
      var req = authReq({ params: { journeyId: setup.journeyId, stageName: setup.skillName } });
      var res = makeRes();
      await journey.handleGetJourneyStageView(req, res);

      assert.ok(res._body.includes(marker), 'stage-view must render content fetched from git when local file is missing');
      assert.ok(!res._body.includes('No artefact content found'), 'must not show the default not-found message when git-fallback succeeds');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

// ---------------------------------------------------------------------------
// AC4 (unit, regression guard) — no connected repo -> unchanged behaviour
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('noConnectedRepo_localDiskWriteOnlyUnchanged', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, {});
    // Pool has no matching journey/product row at all -- ownerRepoForFeature throws ExportNotFoundError.
    var pool = createMockPool([], []);
    eds.setDbPool(pool);

    var commitCalled = false;
    acw.setArtefactCommitAdapter(async function() {
      commitCalled = true;
      return { ok: true };
    });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.ok(!commitCalled, 'commit adapter must NEVER be called for a repo-less product');
    assert.ok(res._status === null || res._status < 400, 'no error should be surfaced for a repo-less product, got status ' + res._status);

    var diskPath = path.join(tmpRoot, setup.artefactRelPath);
    assert.ok(fs.existsSync(diskPath), 'local disk write must proceed exactly as today');

    var journeyObj = store.getJourney(setup.journeyId);
    var stageEntry = (journeyObj.completedStages || []).find(function(s) { return s.skillName === setup.skillName; });
    assert.ok(stageEntry, 'stage must be marked complete exactly as before this story for repo-less products');
  });
});

// ---------------------------------------------------------------------------
// AC5 (unit) — both local and git missing -> honest error message
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('bothLocalAndGitMissing_honestErrorMessage', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();

    var setup = setupStageSession(journey, store, {});
    var pool = createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    );
    eds.setDbPool(pool);
    store.completeStage(setup.journeyId, setup.skillName, setup.artefactRelPath, null, setup.sid);
    fs.unlinkSync(path.join(tmpRoot, setup.artefactRelPath));

    var originalFetch = global.fetch;
    global.fetch = async function() {
      return { ok: false, status: 500, json: async function() { return { message: 'Internal Server Error' }; } };
    };

    try {
      var req = authReq({ params: { journeyId: setup.journeyId, stageName: setup.skillName } });
      var res = makeRes();
      await journey.handleGetJourneyStageView(req, res);

      assert.ok(res._body.toLowerCase().includes('could not be retrieved'), 'must show an honest "could not be retrieved" message. Got body snippet: ' + res._body.slice(0, 400));
      assert.ok(res._body.length > 0, 'panel must not be blank');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

// ---------------------------------------------------------------------------
// Integration test — full dual-write then resume-conversation read-back
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('stageCompletionEndToEnd_dualWriteThenResumeConversation', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var owner = 'acme-it', repo = 'widgets-it';
    var setup = setupStageSession(journey, store, { artefactContent: '# Review\n\nReal committed content for the IT test.' });
    var pool = createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: owner, repo_name: repo }]
    );
    eds.setDbPool(pool);

    // A minimal, faithful GitHub Contents API double: PUT writes into an
    // in-memory files map, later GETs (used by the git-fallback read path)
    // reflect what was actually committed -- proving the commit made during
    // completion is genuinely readable back, not just that a spy was called.
    var files = {};
    var originalFetch = global.fetch;
    global.fetch = async function(url, options) {
      if (url.endsWith('/user')) {
        return { ok: true, status: 200, json: async function() { return { login: 'octocat', name: 'Octo Cat', email: 'octocat@example.com' }; } };
      }
      var m = url.match(/\/repos\/([^/]+)\/([^/]+)\/contents\/(.+)$/);
      if (m) {
        var reqOwner = m[1], reqRepo = m[2], filePath = m[3];
        if (reqOwner !== owner || reqRepo !== repo) {
          return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
        }
        if (!options || !options.method || options.method === 'GET') {
          if (files[filePath] == null) {
            return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
          }
          return { ok: true, status: 200, json: async function() { return { content: Buffer.from(files[filePath], 'utf8').toString('base64'), sha: 'fakesha', encoding: 'base64' }; } };
        }
        if (options.method === 'PUT') {
          var body = JSON.parse(options.body);
          files[filePath] = Buffer.from(body.content, 'base64').toString('utf8');
          return { ok: true, status: 200, json: async function() { return { content: { sha: 'newsha' } }; } };
        }
      }
      return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
    };

    acw.setArtefactCommitAdapter(acw.realCommitArtefact);

    try {
      var req1 = authReq({ params: { journeyId: setup.journeyId } });
      var res1 = makeRes();
      await journey.handlePostGateConfirm(req1, res1);
      assert.ok(res1._status === null || res1._status < 400, 'stage completion must succeed, got status ' + res1._status);
      assert.ok(files[setup.artefactRelPath], 'the artefact must actually have been committed to the mock repo');

      // Simulate a redeploy -- local disk is wiped
      fs.unlinkSync(path.join(tmpRoot, setup.artefactRelPath));

      var req2 = authReq({ params: { journeyId: setup.journeyId, stageName: setup.skillName } });
      var res2 = makeRes();
      await journey.handleGetJourneyStageView(req2, res2);

      assert.ok(res2._body.includes('Real committed content for the IT test'), 'stage-view must render the content that was actually committed during completion, read back through the fallback path');
      assert.ok(!res2._body.includes('No artefact content found'), 'must not fall back to the not-found default when the real commit is genuinely readable');
    } finally {
      global.fetch = originalFetch;
    }
  });
});

// ---------------------------------------------------------------------------
// NFR — git commit latency adds no more than ~2 seconds
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('gitCommitLatency_underTwoSeconds', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, {});
    var pool = createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    );
    eds.setDbPool(pool);
    acw.setArtefactCommitAdapter(function() {
      return new Promise(function(resolve) { setTimeout(function() { resolve({ ok: true }); }, 300); });
    });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    var res = makeRes();
    var start = Date.now();
    await journey.handlePostGateConfirm(req, res);
    var elapsed = Date.now() - start;

    assert.ok(elapsed < 2000, 'stage-completion with a ~300ms commit round-trip took ' + elapsed + 'ms -- expected under 2000ms');
  });
});

// ---------------------------------------------------------------------------
// NFR — commit author is always the operator's own session-derived token
// ---------------------------------------------------------------------------
queue.push(function() {
  return test('commitAuthor_neverServiceAccount', async function() {
    var journey = freshRequireJourney();
    var store = getStore();
    var eds = getExportDataSource();
    var acw = getArtefactCommitWriter();

    var setup = setupStageSession(journey, store, {});
    var pool = createMockPool(
      [{ feature_slug: setup.featureSlug, product_id: 'p1', tenant_id: 't1' }],
      [{ product_id: 'p1', tenant_id: 't1', repo_owner: 'acme', repo_name: 'widgets' }]
    );
    eds.setDbPool(pool);

    var seenToken = null;
    acw.setArtefactCommitAdapter(async function(artefactPath, content, token) {
      seenToken = token;
      return { ok: true };
    });

    var req = authReq({ params: { journeyId: setup.journeyId } });
    req.session.accessToken = 'operator-own-oauth-token-xyz';
    var res = makeRes();
    await journey.handlePostGateConfirm(req, res);

    assert.strictEqual(seenToken, 'operator-own-oauth-token-xyz', 'commit adapter must be called with the operator\'s own session-derived token, never a hardcoded/service-account credential');
  });
});

// ---------------------------------------------------------------------------
// Run all tests
// ---------------------------------------------------------------------------
(async function() {
  console.log('\ncheck-das-s1-commit-artefact-git-fallback.js');
  for (var i = 0; i < queue.length; i++) {
    await queue[i]();
  }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) {
      console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err));
    });
    process.exit(1);
  }
})();
