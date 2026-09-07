'use strict';
// check-cat-s6-regression-verification.js -- cat-s6: explicit regression
// proof that journey.js's gate-confirm flow and export-data-source.js's SaaS
// export both behave identically after cat-s5's changes to fetchArtefact's
// internals. Verification-only -- no production code changes in this story.

var assert = require('assert');
var path = require('path');
var os = require('os');
var fs = require('fs');
var cp = require('child_process');

var JOURNEY_PATH = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var EXPORT_DATA_SOURCE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/export-data-source.js');
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

async function main() {

console.log('\n[cat-s6] AC1 -- journey.js\'s real gate-confirm/stage-view call site (line ~921) resolves via git-fallback exactly as before cat-s5 (real call site, not a reimplemented mock)');
{
  var journey = freshRequire(JOURNEY_PATH);
  var store = freshRequire(JOURNEY_STORE_PATH);

  var tmpRoot = path.join(os.tmpdir(), 'cat-s6-journey-' + Date.now());
  fs.mkdirSync(tmpRoot, { recursive: true });

  var featureSlug = 'cat-s6-journey-test-' + Date.now();
  var skillName = 'review';
  var artefactRelPath = 'artefacts/' + featureSlug + '/' + skillName + '.md';
  var marker = 'CAT-S6-JOURNEY-MARKER-' + Date.now();
  var artefactContent = '# Review\n\n' + marker;

  var journeyObj = store.createJourney(featureSlug);
  var journeyId = journeyObj.journeyId;
  store.setStoryList(journeyId, ['cat-s6-story']);
  var sid = 'sid-cat-s6-' + Date.now();
  store.setActiveSession(journeyId, sid, skillName);

  journey.setJourneyStoreModule(store);
  journey.setRegisterHtmlSession(function() {});
  journey.setLinkSessionToJourney(function() {});
  journey.setRepoRoot(tmpRoot);
  journey.setPipelineStateWriter(function() {});
  journey.setGetHtmlSession(function(s) {
    if (s === sid) {
      return { skillName: skillName, done: true, artefactPath: artefactRelPath, artefactContent: artefactContent, journeyId: journeyId, turns: [], systemPrompt: 'test' };
    }
    return null;
  });

  var eds = freshRequire(EXPORT_DATA_SOURCE_PATH);
  var pool = {
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.indexOf('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS') === 0) {
        return params[0] === featureSlug ? { rows: [{ product_id: 'p1', tenant_id: 't1' }] } : { rows: [] };
      }
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS') === 0) {
        return { rows: [{ repo_owner: 'acme', repo_name: 'widgets' }] };
      }
      return { rows: [] };
    }
  };
  eds.setDbPool(pool);

  // Write the local artefact file first (matching check-das-s1-commit-artefact-git-fallback.js's
  // setupStageSession pattern), so that unlinking it below faithfully simulates a redeploy with
  // no persistent volume -- rather than erroring on a file that was never created.
  var absArtefact = path.join(tmpRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(absArtefact), { recursive: true });
  fs.writeFileSync(absArtefact, artefactContent, 'utf8');

  store.completeStage(journeyId, skillName, artefactRelPath, null, sid);
  // Simulate a redeploy with no persistent volume -- local disk file is gone.
  fs.unlinkSync(path.join(tmpRoot, artefactRelPath));

  var b64 = Buffer.from(artefactContent, 'utf8').toString('base64');
  var originalFetch = global.fetch;
  global.fetch = async function(url) {
    if (url.indexOf('/repos/acme/widgets/contents/' + artefactRelPath) !== -1) {
      return { ok: true, status: 200, json: async function() { return { content: b64, encoding: 'base64' }; } };
    }
    return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
  };

  try {
    var req = { session: { accessToken: 'test-token', userId: 1, login: 'user' }, params: { journeyId: journeyId, stageName: skillName } };
    var res = { _status: null, _body: '', writeHead: function(s) { res._status = s; }, setHeader: function() {}, end: function(b) { res._body += (b || ''); } };
    await journey.handleGetJourneyStageView(req, res);

    test('the real journey.js gate-confirm/stage-view call site (line ~921) still resolves content via git-fallback after cat-s5\'s changes', function() {
      assert.ok(res._body.indexOf(marker) !== -1, 'expected the git-fallback-fetched content to render, got body snippet: ' + res._body.slice(0, 300));
    });
    test('does not fall back to the default "no artefact content found" message', function() {
      assert.strictEqual(res._body.indexOf('No artefact content found'), -1);
    });
  } finally {
    global.fetch = originalFetch;
  }
}

console.log('\n[cat-s6] AC2 -- export-data-source.js\'s real per-tenant repoOverride resolves independently for two different tenants (real call site, cross-tenant isolation NFR)');
{
  var eds2 = freshRequire(EXPORT_DATA_SOURCE_PATH);

  var slugA = 'cat-s6-tenant-a-' + Date.now();
  var slugB = 'cat-s6-tenant-b-' + Date.now();
  var storySlugA = 'story-a';
  var storySlugB = 'story-b';

  var pool2 = {
    query: async function(sql, params) {
      var s = String(sql).replace(/\s+/g, ' ').trim().toUpperCase();
      if (s.indexOf('SELECT PRODUCT_ID, TENANT_ID FROM JOURNEYS') === 0) {
        if (params[0] === slugA) return { rows: [{ product_id: 'product-a', tenant_id: 'tenant-a' }] };
        if (params[0] === slugB) return { rows: [{ product_id: 'product-b', tenant_id: 'tenant-b' }] };
        return { rows: [] };
      }
      if (s.indexOf('SELECT REPO_OWNER, REPO_NAME FROM PRODUCTS') === 0) {
        if (params[0] === 'product-a' && params[1] === 'tenant-a') return { rows: [{ repo_owner: 'owner-a', repo_name: 'repo-a' }] };
        if (params[0] === 'product-b' && params[1] === 'tenant-b') return { rows: [{ repo_owner: 'owner-b', repo_name: 'repo-b' }] };
        return { rows: [] };
      }
      return { rows: [] };
    }
  };
  eds2.setDbPool(pool2);

  function pipelineStateFor(slug, storySlug) {
    return JSON.stringify({
      features: [{
        slug: slug,
        stories: [{ id: storySlug, dorStatus: 'signed-off', dorArtefact: 'artefacts/' + slug + '/dor/' + storySlug + '-dor.md' }]
      }]
    });
  }

  var requestedUrls = [];
  var originalFetch2 = global.fetch;
  global.fetch = async function(url) {
    requestedUrls.push(url);
    if (url.indexOf('/repos/owner-a/repo-a/contents/.github/pipeline-state.json') !== -1) {
      // pipeline-state-fetch-adapter.js's realFetchPipelineState reads the body via res.text()
      // (not res.json()) and JSON.parses it itself -- see check-mtrr-s1-tenant-scoped-repo-resolution.js's
      // createMockGithubFetch for the proven mock shape this mirrors.
      return { ok: true, status: 200, headers: { get: function() { return null; } }, text: async function() { return JSON.stringify({ content: Buffer.from(pipelineStateFor(slugA, storySlugA), 'utf8').toString('base64'), encoding: 'base64' }); } };
    }
    if (url.indexOf('/repos/owner-b/repo-b/contents/.github/pipeline-state.json') !== -1) {
      return { ok: true, status: 200, headers: { get: function() { return null; } }, text: async function() { return JSON.stringify({ content: Buffer.from(pipelineStateFor(slugB, storySlugB), 'utf8').toString('base64'), encoding: 'base64' }); } };
    }
    if (url.indexOf('/repos/owner-a/repo-a/contents/artefacts/' + slugA + '/dor/' + storySlugA + '-dor.md') !== -1) {
      return { ok: true, status: 200, json: async function() { return { content: Buffer.from('# Tenant A DoR', 'utf8').toString('base64') }; } };
    }
    if (url.indexOf('/repos/owner-b/repo-b/contents/artefacts/' + slugB + '/dor/' + storySlugB + '-dor.md') !== -1) {
      return { ok: true, status: 200, json: async function() { return { content: Buffer.from('# Tenant B DoR', 'utf8').toString('base64') }; } };
    }
    return { ok: false, status: 404, json: async function() { return { message: 'Not Found' }; } };
  };

  try {
    var resultA = await eds2.realExportDataSource(slugA, 'token-a');
    var resultB = await eds2.realExportDataSource(slugB, 'token-b');

    test('tenant A resolves tenant A\'s own content', function() {
      assert.strictEqual(resultA.artefactContent, '# Tenant A DoR');
    });
    test('tenant B resolves tenant B\'s own content', function() {
      assert.strictEqual(resultB.artefactContent, '# Tenant B DoR');
    });
    test('tenant A\'s requests never referenced tenant B\'s owner/repo (cross-tenant isolation, mtrr-s1)', function() {
      var aRequestsToB = requestedUrls.filter(function(u) { return u.indexOf('/owner-b/repo-b/') !== -1; });
      // Only tenant B's OWN two calls (pipeline-state + artefact) may reference owner-b/repo-b.
      assert.ok(aRequestsToB.length <= 2, 'expected tenant A\'s own calls to never touch owner-b/repo-b, got: ' + JSON.stringify(aRequestsToB));
    });
    test('tenant B\'s requests never referenced tenant A\'s owner/repo', function() {
      var bRequestsToA = requestedUrls.filter(function(u) { return u.indexOf('/owner-a/repo-a/') !== -1; });
      assert.ok(bRequestsToA.length <= 2, 'expected tenant B\'s own calls to never touch owner-a/repo-a, got: ' + JSON.stringify(bRequestsToA));
    });
  } finally {
    global.fetch = originalFetch2;
  }
}

}

main().then(function() {
  console.log('\n[cat-s6] Results:', passed, 'passed,', failed, 'failed');
  process.exit(failed > 0 ? 1 : 0);
}).catch(function(err) {
  console.log('UNEXPECTED ERROR:', err.stack || err.message);
  process.exit(1);
});
