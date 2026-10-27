#!/usr/bin/env node
// check-ppc-s10-playback-link.js — ppc-s10 AC3/AC4. The DoD stage view
// (handleGetJourneyStageView, reached by clicking a completed "definition-of-done"
// stage) renders the raw DoD artefact with no link onward to the feature's
// own Playback Evidence page -- an operator validating ppc-s9 live in
// production had to hand-construct that URL. This dispatches real pathnames
// through the ACTUAL exported router (not a direct handler call), mirroring
// check-jsvr-s1-wire-stage-view-route.js's own established convention for
// testing this exact handler.

'use strict';

process.env.NODE_ENV             = 'test';
process.env.SESSION_SECRET       = 'test-session-secret-minimum32chars!!';
process.env.GITHUB_CLIENT_ID     = 'test-client-id';
process.env.GITHUB_CLIENT_SECRET = 'test-secret';
process.env.GITHUB_CALLBACK_URL  = 'http://localhost:3000/auth/github/callback';
delete process.env.POSTHOG_KEY;
delete process.env.DATABASE_URL;

var passed = 0;
var failed = 0;

function check(label, ok) {
  if (ok) { console.log('  ✓ ' + label); passed++; }
  else { console.error('  ✗ ' + label); failed++; }
}

var os = require('os');
var path = require('path');
var fs = require('fs');

var router, seedTestSession, journeyStore, journeyRoutes;
try {
  router = require('../src/web-ui/server').router;
  seedTestSession = require('../src/web-ui/middleware/session').seedTestSession;
  journeyStore = require('../src/web-ui/modules/journey-store');
  journeyRoutes = require('../src/web-ui/routes/journey');
} catch (e) {
  console.error('FATAL: could not load server.js / session middleware / journey-store:', e.message);
  process.exit(1);
}

journeyStore._clearForTesting();

var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ppc-s10-link-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function mockReq(overrides) {
  return Object.assign({ headers: {}, method: 'GET', url: '/' }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _headers = {};
  var _chunks = [];
  return {
    writeHead: function(code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    setHeader: function(k, v) { _headers[k] = v; },
    end: function(body) { if (body != null) _chunks.push(body); },
    _get: function() { return { statusCode: _statusCode, headers: _headers, body: _chunks.join('') }; }
  };
}

function seedSession(sessionId, fields) {
  seedTestSession(sessionId, Object.assign({
    accessToken: 'tok-' + sessionId,
    userId: 1,
    login: 'alice',
    tenantId: 'e2e-tester'
  }, fields || {}));
}

function writeDodArtefact(slug) {
  var relPath = 'artefacts/' + slug + '/dod/' + slug + '-dod.md';
  var absPath = path.join(_scratchRoot, relPath);
  fs.mkdirSync(path.dirname(absPath), { recursive: true });
  fs.writeFileSync(absPath, '## AC Coverage\n\n| AC | Satisfied? | Evidence |\n|----|----|----|\n| AC1 | Yes | real |\n');
  return relPath;
}

async function main() {
  console.log('\n[ppc-s10] Group D -- Playback evidence link rendering (AC3, AC4)');

  // ── T7 (AC3): productId set + stageName='definition-of-done' -> link present ──
  await (async function() {
    var slug = 'ppc-s10-link-t7';
    var journey = journeyStore.createJourney(slug);
    journeyStore.setJourneyFields(journey.journeyId, { productId: 'prod-123', featureSlug: slug });
    var relPath = writeDodArtefact(slug);
    journeyStore.completeStage(journey.journeyId, 'definition-of-done', relPath, null, 'seed-sid-t7');

    seedSession('aaaa7777', {});
    var req = mockReq({ url: '/journey/' + journey.journeyId + '/stage/definition-of-done', headers: { cookie: 'session_id=aaaa7777' } });
    var res = mockRes();
    await router(req, res);
    var result = res._get();
    var expectedHref = '/products/prod-123/playback-evidence/' + slug;
    check('T7 (AC3): DoD stage view renders a Playback evidence link when productId is set', result.statusCode === 200 && result.body.indexOf(expectedHref) !== -1);
  })();

  // ── T8 (AC3 negative): non-DoD stage -> no link ──
  await (async function() {
    var slug = 'ppc-s10-link-t8';
    var journey = journeyStore.createJourney(slug);
    journeyStore.setJourneyFields(journey.journeyId, { productId: 'prod-123', featureSlug: slug });
    var relPath = 'artefacts/' + slug + '/discovery.md';
    fs.mkdirSync(path.dirname(path.join(_scratchRoot, relPath)), { recursive: true });
    fs.writeFileSync(path.join(_scratchRoot, relPath), '## Problem statement\n\nSomething.');
    journeyStore.completeStage(journey.journeyId, 'discovery', relPath, null, 'seed-sid-t8');

    seedSession('bbbb8888', {});
    var req = mockReq({ url: '/journey/' + journey.journeyId + '/stage/discovery', headers: { cookie: 'session_id=bbbb8888' } });
    var res = mockRes();
    await router(req, res);
    var result = res._get();
    check('T8 (AC3 negative): no Playback evidence link rendered for a non-DoD stage', result.statusCode === 200 && result.body.indexOf('/playback-evidence/') === -1);
  })();

  // ── T9 (AC4): DoD stage, but productId unset -> no link ──
  await (async function() {
    var slug = 'ppc-s10-link-t9';
    var journey = journeyStore.createJourney(slug);
    journeyStore.setJourneyFields(journey.journeyId, { featureSlug: slug }); // no productId
    var relPath = writeDodArtefact(slug);
    journeyStore.completeStage(journey.journeyId, 'definition-of-done', relPath, null, 'seed-sid-t9');

    seedSession('cccc9999', {});
    var req = mockReq({ url: '/journey/' + journey.journeyId + '/stage/definition-of-done', headers: { cookie: 'session_id=cccc9999' } });
    var res = mockRes();
    await router(req, res);
    var result = res._get();
    check('T9 (AC4): no Playback evidence link rendered when journey.productId is unset', result.statusCode === 200 && result.body.indexOf('/playback-evidence/') === -1);
  })();

  console.log('\n[ppc-s10] Group E -- rendered link matches the real route table (AC3 integration)');

  // ── T11 (AC3 integration): the href pattern matches a route server.js actually registers ──
  await (async function() {
    var serverSrc = fs.readFileSync(require.resolve('../src/web-ui/server.js'), 'utf8');
    check('T11 (AC3 integration): server.js registers a route containing "playback-evidence"', /playback-evidence/.test(serverSrc));
  })();

  console.log('\n--- check-ppc-s10-playback-link Results ---');
  console.log('Passed: ' + passed + '  Failed: ' + failed);
  if (failed > 0) process.exitCode = 1;
}

function cleanup() {
  try { fs.rmSync(_scratchRoot, { recursive: true, force: true }); } catch (_) {}
}

main()
  .then(cleanup)
  .catch(function(err) {
    cleanup();
    console.error('FATAL:', err.message, err.stack);
    process.exit(1);
  });
