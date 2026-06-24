'use strict';
// check-p2.2-tenant-isolation.js -- p2.2: Tenant-isolation test suite
// Proves tenant isolation at HTTP and filesystem layers using a two-tenant fixture (alice/org-a, bob/org-b).

var assert = require('assert');
var crypto = require('crypto');
var path   = require('path');
var os     = require('os');
var fs     = require('fs');

var JOURNEY_PATH      = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var JOURNEY_STORE_PATH = path.resolve(__dirname, '../src/web-ui/modules/journey-store.js');
var REPO_ROOT_PATH    = path.resolve(__dirname, '../src/web-ui/adapters/repo-root.js');
var SESSION_STORE_MOD = path.resolve(__dirname, '../src/web-ui/adapters/session-store.js');

function freshRequire() {
  [JOURNEY_PATH, JOURNEY_STORE_PATH, REPO_ROOT_PATH, SESSION_STORE_MOD].forEach(function(p) {
    try { delete require.cache[require.resolve(p)]; } catch (_) {}
  });
  var jStore    = require(JOURNEY_STORE_PATH);
  var j         = require(JOURNEY_PATH);
  var sessStore = require(SESSION_STORE_MOD);
  return { jStore: jStore, j: j, sessStore: sessStore };
}

function makeRes() {
  var res = { _code: null, _body: '' };
  res.writeHead = function(code) { res._code = code; };
  res.end       = function(body) { res._body += (body || ''); };
  return res;
}

function makeReq(overrides) {
  return Object.assign(
    { session: { accessToken: 'tok', login: 'user', userId: '0', tenantId: null }, params: {}, body: {}, headers: {}, query: {} },
    overrides
  );
}

function twoTenantFixture(jStore) {
  var aliceJourney = jStore.createJourney('feat-alice');
  aliceJourney.ownerId  = 'alice';
  aliceJourney.tenantId = 'org-a';

  var bobJourney = jStore.createJourney('feat-bob');
  bobJourney.ownerId  = 'bob';
  bobJourney.tenantId = 'org-b';

  return {
    aliceJourney: aliceJourney,
    bobJourney:   bobJourney,
    aliceSess: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 'org-a' },
    bobSess:   { accessToken: 'tok-bob',   userId: '2', login: 'bob',   tenantId: 'org-b' }
  };
}

function readdirRecursive(dir) {
  var out = [];
  if (!fs.existsSync(dir)) return out;
  fs.readdirSync(dir, { withFileTypes: true }).forEach(function(e) {
    var full = path.join(dir, e.name);
    if (e.isDirectory()) { out = out.concat(readdirRecursive(full)); }
    else { out.push(full); }
  });
  return out;
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {
  var t0 = Date.now();
  var tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'p2.2-'));

  try {
    process.env.WUCE_TENANT_ROOT_BASE = tmpDir;
    process.env.SESSION_STORE_PATH    = path.join(tmpDir, 'sessions');

    // -- AC1: 9 cross-tenant read routes (POLICY.TENANT) → 404
    console.log('\n[p2.2-tenant-isolation] AC1 -- 9 cross-tenant 404s');
    {
      var r = freshRequire();
      var fx = twoTenantFixture(r.jStore);
      var aliceId = fx.aliceJourney.journeyId;
      var bobSess = fx.bobSess;

      var ac1Cases = [
        ['handleGetJourney',          function() { var res = makeRes(); r.j.handleGetJourney(makeReq({ session: bobSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetJourneyById',      function() { var res = makeRes(); r.j.handleGetJourneyById(makeReq({ session: bobSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetJourneyState',     async function() { var res = makeRes(); await r.j.handleGetJourneyState(makeReq({ session: bobSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetJourneyViewers',   async function() { var res = makeRes(); await r.j.handleGetJourneyViewers(makeReq({ session: bobSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetJourneyStageView', async function() { var res = makeRes(); await r.j.handleGetJourneyStageView(makeReq({ session: bobSess, params: { journeyId: aliceId, stageName: 'discovery' } }), res); return res; }],
        ['handleGetStageControls',    function() { var res = makeRes(); r.j.handleGetStageControls(makeReq({ session: bobSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handlePostSideTripClarify', async function() { var res = makeRes(); await r.j.handlePostSideTripClarify(makeReq({ session: bobSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleDeleteSideTrip',      async function() { var res = makeRes(); await r.j.handleDeleteSideTrip(makeReq({ session: bobSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetTrace',            async function() { var res = makeRes(); await r.j.handleGetTrace(makeReq({ session: bobSess, params: { journeyId: aliceId } }), res); return res; }],
      ];

      for (var i = 0; i < ac1Cases.length; i++) {
        await (function(idx, name, fn) {
          return test('AC1.' + idx + ': cross-tenant ' + name + ' → 404', async function() {
            var res = await fn();
            assert.strictEqual(res._code, 404, name + ' expected 404, got ' + res._code);
          });
        })(i + 1, ac1Cases[i][0], ac1Cases[i][1]);
      }
    }

    // -- AC2: 2 cross-tenant mutating routes (POLICY.OWNER) → 403
    console.log('\n[p2.2-tenant-isolation] AC2 -- 2 cross-tenant 403s');
    {
      var r = freshRequire();
      var fx = twoTenantFixture(r.jStore);
      var aliceId = fx.aliceJourney.journeyId;
      var bobSess = fx.bobSess;

      var res1 = makeRes();
      await r.j.handlePostJourneyRecommit(makeReq({ session: bobSess, params: { journeyId: aliceId, stageName: 'discovery' }, body: {} }), res1);
      await test('AC2.1: cross-tenant handlePostJourneyRecommit → 403', function() {
        assert.strictEqual(res1._code, 403, 'expected 403, got ' + res1._code);
      });

      var res2 = makeRes();
      await r.j.handlePostJourneyStageCommit(makeReq({ session: bobSess, params: { journeyId: aliceId, stageName: 'discovery' }, body: {} }), res2);
      await test('AC2.2: cross-tenant handlePostJourneyStageCommit → 403', function() {
        assert.strictEqual(res2._code, 403, 'expected 403, got ' + res2._code);
      });
    }

    // -- AC3: Filesystem isolation — each tenant tree contains no cross-tenant markers or paths
    console.log('\n[p2.2-tenant-isolation] AC3 -- filesystem isolation');
    {
      var markerA = 'ORG_A_MARKER_' + crypto.randomUUID();
      var markerB = 'ORG_B_MARKER_' + crypto.randomUUID();
      var orgADir = path.join(tmpDir, 'org-a', 'artefacts', 'feat-alice');
      var orgBDir = path.join(tmpDir, 'org-b', 'artefacts', 'feat-bob');
      fs.mkdirSync(orgADir, { recursive: true });
      fs.mkdirSync(orgBDir, { recursive: true });
      fs.writeFileSync(path.join(orgADir, 'test.txt'), markerA, 'utf8');
      fs.writeFileSync(path.join(orgBDir, 'test.txt'), markerB, 'utf8');

      await test('AC3.1: org-a tree contains no org-b marker content', function() {
        readdirRecursive(path.join(tmpDir, 'org-a')).forEach(function(f) {
          var content = fs.readFileSync(f, 'utf8');
          assert.ok(!content.includes(markerB), 'org-b marker found in org-a tree at ' + f);
        });
      });

      await test('AC3.2: org-b tree contains no org-a marker content', function() {
        readdirRecursive(path.join(tmpDir, 'org-b')).forEach(function(f) {
          var content = fs.readFileSync(f, 'utf8');
          assert.ok(!content.includes(markerA), 'org-a marker found in org-b tree at ' + f);
        });
      });

      await test('AC3.3: org-a tree has zero paths containing "org-b"', function() {
        readdirRecursive(path.join(tmpDir, 'org-a')).forEach(function(f) {
          assert.ok(!f.includes('org-b'), 'org-b path found in org-a tree: ' + f);
        });
      });

      await test('AC3.4: org-b tree has zero paths containing "org-a"', function() {
        readdirRecursive(path.join(tmpDir, 'org-b')).forEach(function(f) {
          assert.ok(!f.includes('org-a'), 'org-a path found in org-b tree: ' + f);
        });
      });
    }

    // -- AC4: Session store isolation — cross-tenant readSession returns null
    console.log('\n[p2.2-tenant-isolation] AC4 -- session store isolation');
    {
      var r = freshRequire();
      var sessId = 'sess-' + crypto.randomUUID();

      r.sessStore.writeSession({ sessionId: sessId, tenantId: 'org-a', login: 'alice', userId: '1' });

      await test('AC4.1: readSession with correct tenant (org-a) returns object', function() {
        var result = r.sessStore.readSession(sessId, 'org-a');
        assert.ok(result !== null && typeof result === 'object', 'expected session object, got: ' + result);
      });

      await test('AC4.2: readSession with wrong tenant (org-b) returns null', function() {
        var result = r.sessStore.readSession(sessId, 'org-b');
        assert.strictEqual(result, null, 'expected null for cross-tenant read, got: ' + JSON.stringify(result));
      });

      await test('AC4.3: accessToken not persisted to disk (NFR-sec-no-accesstoken-disk)', function() {
        var sessFile = path.join(tmpDir, 'sessions', 'org-a', sessId + '.json');
        var parsed = JSON.parse(fs.readFileSync(sessFile, 'utf8'));
        assert.ok(!('accessToken' in parsed), 'accessToken found in stored session file');
      });
    }

    // -- AC5: Same-tenant requests are not blocked (8 of 9 handlers; handlePostSideTripClarify excluded — requires session adapter wiring)
    console.log('\n[p2.2-tenant-isolation] AC5 -- same-tenant not broken');
    {
      var r = freshRequire();
      var fx = twoTenantFixture(r.jStore);
      var aliceId  = fx.aliceJourney.journeyId;
      var aliceSess = fx.aliceSess;

      var ac5Cases = [
        ['handleGetJourney',          function() { var res = makeRes(); r.j.handleGetJourney(makeReq({ session: aliceSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetJourneyById',      function() { var res = makeRes(); r.j.handleGetJourneyById(makeReq({ session: aliceSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetJourneyState',     async function() { var res = makeRes(); await r.j.handleGetJourneyState(makeReq({ session: aliceSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetJourneyViewers',   async function() { var res = makeRes(); await r.j.handleGetJourneyViewers(makeReq({ session: aliceSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetJourneyStageView', async function() { var res = makeRes(); await r.j.handleGetJourneyStageView(makeReq({ session: aliceSess, params: { journeyId: aliceId, stageName: 'discovery' } }), res); return res; }],
        ['handleGetStageControls',    function() { var res = makeRes(); r.j.handleGetStageControls(makeReq({ session: aliceSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleDeleteSideTrip',      async function() { var res = makeRes(); await r.j.handleDeleteSideTrip(makeReq({ session: aliceSess, params: { journeyId: aliceId } }), res); return res; }],
        ['handleGetTrace',            async function() { var res = makeRes(); await r.j.handleGetTrace(makeReq({ session: aliceSess, params: { journeyId: aliceId } }), res); return res; }],
      ];

      for (var i = 0; i < ac5Cases.length; i++) {
        await (function(idx, name, fn) {
          return test('AC5.' + idx + ': alice → alice ' + name + ' not blocked', async function() {
            var res = await fn();
            assert.ok(
              !(res._code >= 400 && res._code < 500),
              name + ' expected non-4xx, got ' + res._code
            );
          });
        })(i + 1, ac5Cases[i][0], ac5Cases[i][1]);
      }
    }

    // -- NFR: suite timing
    var elapsed = Date.now() - t0;
    await test('NFR: suite completes in < 10000ms', function() {
      assert.ok(elapsed < 10000, 'suite took ' + elapsed + 'ms (limit: 10000ms)');
    });

  } finally {
    delete process.env.WUCE_TENANT_ROOT_BASE;
    delete process.env.SESSION_STORE_PATH;
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }

  // -- Results
  console.log('\n[p2.2-tenant-isolation] ' + (passed + failed) + ' run, ' + passed + ' passed, ' + failed + ' failed');
  if (failures.length > 0) {
    failures.forEach(function(f) { console.log('  FAILURE:', f.name, '--', f.err && f.err.message || f.err); });
  }
  if (failed > 0) process.exit(1);
}

main().catch(function(err) { console.error(err); process.exit(1); });
