'use strict';
// check-dsh-s3-seed-durable-stage.js -- dsh-s3 Task 2
// Story: artefacts/2026-07-28-durable-session-history/stories/dsh-s3-rebuild-breadcrumb-view.md
// Plan:  artefacts/2026-07-28-durable-session-history/plans/dsh-s3-rebuild-breadcrumb-view-plan.md
//
// Covers:
//   - the gap-closing wiring: session-turns-pg.js's D37 adapter is bridged to
//     the same in-memory fake-test-db that journey-store's setPgAdapter uses,
//     in NODE_ENV=test with no DATABASE_URL (server.js + adapters/fake-test-db.js)
//   - the new POST /test/seed-durable-stage endpoint: creates a journey,
//     marks a stage complete with a real on-disk artefact, and persists turns
//     ONLY via the durable session_turns store -- with NO in-memory HTML
//     session ever created.
//
// Testing approach: server.js is a monolithic dispatch file with no
// per-route export for /test/* routes (see
// tests/check-dss-s1-staging-safe-test-endpoint-gate.js and
// tests/check-wuce4-docker-deployment.js for the established precedent of
// testing it this way). /test/seed-durable-stage is defined inline in
// server.js's request-handling router, not as a standalone exported handler
// function, so the most faithful test is a real HTTP integration test against
// server.js's own createApp()-produced http.Server (the same pattern
// check-wuce4-docker-deployment.js's IT1 uses for GET /health), rather than a
// synthetic fake-req/fake-res direct call, which would not exercise the
// actual routing/body-parsing code added to server.js. server.js is
// require()'d exactly ONCE in this process -- re-requiring it repeatedly is a
// known hang risk (its DB/Redis-wiring modules leak across re-requires); a
// single require + a real listening server avoids that entirely.
//
// getTurnsForStage itself (the durable-read path) is called directly rather
// than through another HTTP round trip -- it's the already-built function
// under test in dsh-s1/dsh-s2, and calling it directly proves the write path
// (via the HTTP-seeded endpoint) and the read path agree without needing a
// second route.

process.env.NODE_ENV = 'test';
delete process.env.DATABASE_URL; // the wiring under test (fake-test-db bridge) only applies when unset
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-session-secret-minimum32chars!!';

var assert = require('assert');
var http = require('http');
var fs = require('fs');
var os = require('os');
var path = require('path');

// Route repoRoot resolution (adapters/repo-root.js) at a disposable tmp dir,
// so the artefact this test seeds never lands inside the real repo tree.
var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-s3-seed-'));
delete process.env.CLAUDE_REPO_PATH; // takes precedence over COPILOT_REPO_PATH in repo-root.js
process.env.COPILOT_REPO_PATH = _tmpRepoRoot;

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

function postJson(port, urlPath, body) {
  return new Promise(function(resolve, reject) {
    var payload = JSON.stringify(body || {});
    var req = http.request({
      hostname: '127.0.0.1',
      port: port,
      path: urlPath,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) }
    }, function(res) {
      var chunks = '';
      res.on('data', function(c) { chunks += c; });
      res.on('end', function() {
        var parsed = null;
        try { parsed = JSON.parse(chunks); } catch (_) {}
        resolve({ status: res.statusCode, body: parsed, raw: chunks });
      });
    });
    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

(async function main() {
  var { createApp } = require('../src/web-ui/server');
  var { getTurnsForStage } = require('../src/web-ui/adapters/session-turns-pg');
  var journeyStore = require('../src/web-ui/modules/journey-store');
  var routesSkills = require('../src/web-ui/routes/skills');

  var server = createApp();
  await new Promise(function(resolve) { server.listen(0, '127.0.0.1', resolve); });
  var port = server.address().port;

  try {
    var seedTurns = [
      { role: 'user', content: 'What is the durable read path?' },
      { role: 'assistant', content: 'It reads from session_turns when no live session exists.' }
    ];
    var seedBody = {
      featureSlug: 'dsh-s3-check-feature',
      tenantId: 'dsh-s3-tenant',
      ownerId: 'dsh-s3-owner',
      stageName: 'discovery',
      artefactContent: '# dsh-s3 seeded artefact\n\nHello from the seed endpoint.\n',
      turns: seedTurns
    };

    var seedResult;

    await test('POST /test/seed-durable-stage returns 200 with journeyId, stageName, artefactPath', async function() {
      var res = await postJson(port, '/test/seed-durable-stage', seedBody);
      assert.strictEqual(res.status, 200, 'expected 200, got ' + res.status + ' body: ' + res.raw);
      assert.ok(res.body && res.body.journeyId, 'expected a journeyId in the response');
      assert.strictEqual(res.body.stageName, 'discovery');
      assert.ok(res.body.artefactPath, 'expected an artefactPath in the response');
      seedResult = res.body;
    });

    await test('seeded journey has tenantId/ownerId set and the stage marked complete', function() {
      var journey = journeyStore.getJourney(seedResult.journeyId);
      assert.ok(journey, 'expected the seeded journey to exist in the in-memory store');
      assert.strictEqual(journey.tenantId, 'dsh-s3-tenant');
      assert.strictEqual(journey.ownerId, 'dsh-s3-owner');
      var stage = (journey.completedStages || []).find(function(s) { return s.skillName === 'discovery'; });
      assert.ok(stage, 'expected a completed "discovery" stage entry');
      assert.strictEqual(stage.artefactPath, seedResult.artefactPath);
    });

    await test('the artefact file was actually written to disk at the resolved artefact path', function() {
      var absPath = path.resolve(path.join(_tmpRepoRoot, seedResult.artefactPath));
      var content = fs.readFileSync(absPath, 'utf8');
      assert.ok(content.indexOf('dsh-s3 seeded artefact') !== -1, 'expected seeded artefact content on disk, got: ' + content);
    });

    await test('NO in-memory HTML session was created for the seeded journey/stage', function() {
      var liveEntry = routesSkills._listHtmlSessions().find(function(entry) {
        return entry.session.journeyId === seedResult.journeyId && entry.session.skillName === 'discovery';
      });
      assert.strictEqual(liveEntry, undefined, 'expected zero in-memory session for the seeded journey/stage');
    });

    await test('getTurnsForStage (durable-read path) returns exactly the seeded turns, with no in-memory session backing it', async function() {
      var turns = await getTurnsForStage(seedResult.journeyId, 'discovery', {
        accessToken: 'tok',
        login: 'dsh-s3-owner',
        tenantId: 'dsh-s3-tenant'
      });
      assert.deepStrictEqual(turns, seedTurns, 'expected the durable-read path to return exactly the seeded turns');
    });

    await test('getTurnsForStage still enforces the cross-tenant guard for a non-owner, different-tenant caller', async function() {
      var turns = await getTurnsForStage(seedResult.journeyId, 'discovery', {
        accessToken: 'tok',
        login: 'someone-else',
        tenantId: 'a-different-tenant'
      });
      assert.strictEqual(turns, null, 'expected null for a non-owner, cross-tenant caller');
    });

  } finally {
    server.close();
  }

  console.log('\n--- dsh-s3 seed-durable-stage Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
  process.exit(failed > 0 ? 1 : 0);
})().catch(function(err) {
  console.error('[dsh-s3] Unexpected error:', err && err.stack || err);
  process.exit(1);
});
