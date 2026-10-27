'use strict';
// check-ppc-s10-repo-freshness-wiring.js — ppc-s10 AC1/AC2. Covers the real
// production gap found during ppc-s9's first live validation: a screenshot
// committed via commitArtefact (confirmed via GitHub API to land on master)
// never became visible on the Playback Evidence page, because
// handleGetPlaybackEvidence/handleGetCaptureScreenshot/handleGetCaptureVideo
// read the local checkout directly and never called the already-existing
// ensureRepoFresh adapter (rclr-s1) that journey.js's own
// _readPipelineFeatures already uses for exactly this purpose.
//
// ensureRepoFresh is mocked via require.cache substitution, installed BEFORE
// playback-evidence.js is first required in this process, so the module-level
// `require('../adapters/repo-freshness')` binding this story adds captures
// the mock -- same technique check-rclr-s1-repo-freshness.js's own T7/T8 use
// against journey.js. This also keeps this story's own tests from spawning a
// real `git pull` subprocess, unlike the handful of pre-existing tests of
// these three handlers (ppc-s1-ui-layer.js etc.), which do not mock it and so
// inherit the same already-accepted "real ensureRepoFresh call during a unit
// test" characteristic journey.js's own tests have lived with since rclr-s1 —
// not a new risk this story introduces, just extended to two more call sites.

var assert = require('assert');
var fs = require('fs');
var path = require('path');
var os = require('os');
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

var freshnessPath = require.resolve('../src/web-ui/adapters/repo-freshness');
var ensureRepoFreshCalls = [];
require.cache[freshnessPath] = {
  id: freshnessPath, filename: freshnessPath, loaded: true,
  exports: {
    ensureRepoFresh: function(repoRoot) { ensureRepoFreshCalls.push(repoRoot); return { pulled: true }; },
    _resetForTesting: function() {}
  }
};

var store = require('../src/web-ui/modules/journey-store');
var pe = require('../src/web-ui/routes/playback-evidence');
pe.setJourneyStoreModule(store);
var repoRootAdapter = require('../src/web-ui/adapters/repo-root');

function getStore() {
  store._clearForTesting();
  ensureRepoFreshCalls.length = 0;
  return store;
}

function makeRes() {
  var res = {
    _status: null, _json: null, _body: null, _headers: {},
    json: function(body) { res._status = res._status || 200; res._json = body; },
    writeHead: function(status, headers) { res._status = status; Object.assign(res._headers, headers || {}); },
    end: function(body) { res._body = (res._body || '') + (body || ''); },
    setHeader: function(k, v) { res._headers[k] = v; }
  };
  res.status = function(code) { res._status = code; return res; };
  return res;
}

var _makeReqCallCount = 0;
function makeReq(tenantId, productId, featureSlug, extra) {
  _makeReqCallCount++;
  return Object.assign({
    session: { tenantId: tenantId, userId: 'ppc-s10-test-user-' + _makeReqCallCount, accessToken: 'test-token', login: 'user', csrfToken: 'test-csrf-token' },
    sessionId: 'sid-' + tenantId,
    params: { productId: productId, featureSlug: featureSlug },
    headers: {}
  }, extra || {});
}

function setupDodCompleteJourney(store, opts) {
  opts = opts || {};
  var slug = opts.featureSlug || ('ppc-s10-' + Date.now() + '-' + Math.random().toString(36).slice(2));
  var j = store.createJourney(slug);
  store.setJourneyFields(j.journeyId, { tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' });
  var dodContent = [
    '## AC Coverage',
    '',
    '| AC | Satisfied? | Evidence |',
    '|----|------------|----------|',
    '| AC1 — Shows the dashboard | Yes | screenshot |'
  ].join('\n');
  store.setPgAdapterForTesting({
    saveJourney: async function() {},
    getArtefactsForJourney: async function() {
      return [{ skill_name: 'definition-of-done', artefact_path: 'artefacts/' + slug + '/dod.md', content: dodContent }];
    }
  });
  store.completeStage(j.journeyId, 'definition-of-done', 'artefacts/' + slug + '/dod.md', null);
  return { journeyId: j.journeyId, featureSlug: slug, tenantId: opts.tenantId || 'tenant-a', productId: opts.productId || 'product-a' };
}

console.log('\n[ppc-s10] Group A -- handleGetPlaybackEvidence calls ensureRepoFresh (AC1)');

queue.push(function() {
  return test('T1 (AC1): handleGetPlaybackEvidence calls ensureRepoFresh exactly once for a found journey', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s10-t1-' + Date.now());
    repoRootAdapter.setRepoRoot(tmpRoot);

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, null).then(function() {
      assert.strictEqual(ensureRepoFreshCalls.length, 1, 'ensureRepoFresh should be called exactly once');
      assert.strictEqual(ensureRepoFreshCalls[0], tmpRoot, 'ensureRepoFresh should be called with this request\'s own resolved repoRoot');
    });
  });
});

queue.push(function() {
  return test('T2 (AC1): ensureRepoFresh is still called when the journey has no in-progress captures', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, null).then(function() {
      assert.strictEqual(ensureRepoFreshCalls.length, 1, 'ensureRepoFresh must not be gated behind _finaliseInProgressCaptures having any work to do');
    });
  });
});

queue.push(function() {
  return test('T3 (AC1): a throwing ensureRepoFresh does not block the page render', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var original = require.cache[freshnessPath].exports.ensureRepoFresh;
    require.cache[freshnessPath].exports.ensureRepoFresh = function() { throw new Error('simulated adapter failure'); };
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug);
    var res = makeRes();
    return pe.handleGetPlaybackEvidence(req, res, null, null).then(function() {
      require.cache[freshnessPath].exports.ensureRepoFresh = original;
      assert.strictEqual(res._status === null || res._status === 200, true, 'the page must still render normally even if ensureRepoFresh throws');
      assert.strictEqual(res._json.acs.length, 1);
    }, function(err) {
      require.cache[freshnessPath].exports.ensureRepoFresh = original;
      throw err;
    });
  });
});

console.log('\n[ppc-s10] Group B -- media-serving handlers call ensureRepoFresh before fs.existsSync (AC2)');

queue.push(function() {
  return test('T4 (AC2): handleGetCaptureScreenshot calls ensureRepoFresh before fs.existsSync, and the real file still serves', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s10-t4-' + Date.now());
    var relShotPath = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png';
    var absShotPath = path.join(tmpRoot, relShotPath);
    fs.mkdirSync(path.dirname(absShotPath), { recursive: true });
    fs.writeFileSync(absShotPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    repoRootAdapter.setRepoRoot(tmpRoot);
    store.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: relShotPath } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' } });
    var res = makeRes();
    return pe.handleGetCaptureScreenshot(req, res).then(function() {
      assert.strictEqual(ensureRepoFreshCalls.length, 1, 'ensureRepoFresh should be called once');
      assert.strictEqual(ensureRepoFreshCalls[0], tmpRoot);
      assert.strictEqual(res._status, 200, 'the real file must still serve correctly after the new refresh call');
      assert.strictEqual(res._headers['Content-Type'], 'image/png');
    });
  });
});

queue.push(function() {
  return test('T5 (AC2): handleGetCaptureVideo calls ensureRepoFresh, and the real file still serves', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s10-t5-' + Date.now());
    var relVidPath = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/video/AC1.webm';
    var absVidPath = path.join(tmpRoot, relVidPath);
    fs.mkdirSync(path.dirname(absVidPath), { recursive: true });
    fs.writeFileSync(absVidPath, Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
    repoRootAdapter.setRepoRoot(tmpRoot);
    store.setJourneyFields(setup.journeyId, { captureVideos: { AC1: relVidPath } });

    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' } });
    var res = makeRes();
    return pe.handleGetCaptureVideo(req, res, null, null).then(function() {
      assert.strictEqual(ensureRepoFreshCalls.length, 1, 'ensureRepoFresh should be called once');
      assert.strictEqual(ensureRepoFreshCalls[0], tmpRoot);
      assert.strictEqual(res._status, 200, 'the real file must still serve correctly after the new refresh call');
      assert.strictEqual(res._headers['Content-Type'], 'video/webm');
    });
  });
});

queue.push(function() {
  return test('T6 (AC2): a throwing ensureRepoFresh does not block screenshot serving', function() {
    var store = getStore();
    var setup = setupDodCompleteJourney(store, {});
    var tmpRoot = path.join(os.tmpdir(), 'ppc-s10-t6-' + Date.now());
    var relShotPath = 'artefacts/' + setup.featureSlug + '/playback/ppc-s1/screenshots/AC1.png';
    var absShotPath = path.join(tmpRoot, relShotPath);
    fs.mkdirSync(path.dirname(absShotPath), { recursive: true });
    fs.writeFileSync(absShotPath, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    repoRootAdapter.setRepoRoot(tmpRoot);
    store.setJourneyFields(setup.journeyId, { captureScreenshots: { AC1: relShotPath } });

    var original = require.cache[freshnessPath].exports.ensureRepoFresh;
    require.cache[freshnessPath].exports.ensureRepoFresh = function() { throw new Error('simulated adapter failure'); };
    var req = makeReq(setup.tenantId, setup.productId, setup.featureSlug, { params: { productId: setup.productId, featureSlug: setup.featureSlug, acId: 'AC1' } });
    var res = makeRes();
    return pe.handleGetCaptureScreenshot(req, res).then(function() {
      require.cache[freshnessPath].exports.ensureRepoFresh = original;
      assert.strictEqual(res._status, 200, 'a working request must not be turned into a failure by an adapter throw');
    }, function(err) {
      require.cache[freshnessPath].exports.ensureRepoFresh = original;
      throw err;
    });
  });
});

console.log('\n[ppc-s10] Group C -- end-to-end: freshly-committed evidence becomes visible (AC1, AC2 integration)');

queue.push(function() {
  return test('T10 (AC1, AC2 integration): a file added to the remote after local clone becomes servable once the REAL ensureRepoFresh pulls it', function() {
    delete require.cache[freshnessPath];
    var realFreshness = require('../src/web-ui/adapters/repo-freshness');
    try {
      var cp = require('child_process');
      var remoteDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-remote-'));
      var seedDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-seed-'));
      var pusherDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-pusher-'));
      var localDir = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-local-'));

      cp.execSync('git init --bare "' + remoteDir + '"');
      cp.execSync('git init "' + seedDir + '"');
      cp.execSync('git -C "' + seedDir + '" config user.email t@t.com');
      cp.execSync('git -C "' + seedDir + '" config user.name t');
      fs.writeFileSync(path.join(seedDir, 'README.md'), 'seed');
      cp.execSync('git -C "' + seedDir + '" add .');
      cp.execSync('git -C "' + seedDir + '" commit -m seed');
      var branchName = cp.execSync('git -C "' + seedDir + '" symbolic-ref --short HEAD').toString().trim();
      cp.execSync('git -C "' + seedDir + '" remote add origin "' + remoteDir + '"');
      cp.execSync('git -C "' + seedDir + '" push origin ' + branchName);

      cp.execSync('git clone "' + remoteDir + '" "' + localDir + '"');

      cp.execSync('git clone "' + remoteDir + '" "' + pusherDir + '"');
      cp.execSync('git -C "' + pusherDir + '" config user.email t@t.com');
      cp.execSync('git -C "' + pusherDir + '" config user.name t');
      var acDir = path.join(pusherDir, 'artefacts', 'x', 'playback', 'ppc-s1', 'screenshots');
      fs.mkdirSync(acDir, { recursive: true });
      fs.writeFileSync(path.join(acDir, 'AC1.png'), 'fake-png-bytes');
      cp.execSync('git -C "' + pusherDir + '" add .');
      cp.execSync('git -C "' + pusherDir + '" commit -m "add screenshot"');
      cp.execSync('git -C "' + pusherDir + '" push origin ' + branchName);

      var localFilePath = path.join(localDir, 'artefacts', 'x', 'playback', 'ppc-s1', 'screenshots', 'AC1.png');
      assert.strictEqual(fs.existsSync(localFilePath), false, 'precondition: local clone must NOT have the file yet');

      var result = realFreshness.ensureRepoFresh(localDir, { ttlMs: 0 });
      assert.strictEqual(result.pulled, true, 'ensureRepoFresh should report a real pull');
      assert.strictEqual(fs.existsSync(localFilePath), true, 'after ensureRepoFresh, the file committed by the "GitHub Actions committer" must now exist locally -- this is the exact handoff that 404d in production');

      fs.rmSync(remoteDir, { recursive: true, force: true });
      fs.rmSync(seedDir, { recursive: true, force: true });
      fs.rmSync(pusherDir, { recursive: true, force: true });
      fs.rmSync(localDir, { recursive: true, force: true });
    } finally {
      require.cache[freshnessPath] = {
        id: freshnessPath, filename: freshnessPath, loaded: true,
        exports: {
          ensureRepoFresh: function(repoRoot) { ensureRepoFreshCalls.push(repoRoot); return { pulled: true }; },
          _resetForTesting: function() {}
        }
      };
    }
  });
});

(async function() {
  console.log('\ncheck-ppc-s10-repo-freshness-wiring.js');
  for (var i = 0; i < queue.length; i++) { await queue[i](); }
  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log('  ' + f.name + ': ' + (f.err && f.err.message || f.err)); });
    process.exit(1);
  }
})();
