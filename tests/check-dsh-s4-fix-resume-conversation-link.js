#!/usr/bin/env node
// check-dsh-s4-fix-resume-conversation-link.js — unit tests for dsh-s4 (Task 1):
// repoint the "Resume conversation" link (src/web-ui/routes/features.js) at
// dsh-s3's rebuilt durable stage-view route (/journey/:journeyId/stage/:stageName)
// instead of the raw, evictable /skills/:skillName/sessions/:sessionId/chat route.
//
// Story:      artefacts/2026-07-28-durable-session-history/stories/dsh-s4-fix-resume-conversation-link.md
// Test plan:  artefacts/2026-07-28-durable-session-history/test-plans/dsh-s4-fix-resume-conversation-link-test-plan.md
// Plan:       artefacts/2026-07-28-durable-session-history/plans/dsh-s4-fix-resume-conversation-link-plan.md (Task 1)
//
// Coverage:
//   AC1 (unit) — the rendered "Resume conversation" <a> tag's href matches
//                /journey/:journeyId/stage/:stageName exactly, not the old
//                /skills/:skillName/sessions/:sessionId/chat route.
//   AC3 (unit) — the new href, followed through to dsh-s3's real
//                handleGetJourneyStageView, actually renders (200) for a
//                stage whose conversation turns are available (the
//                still-resident-in-memory case) — proving the repointed
//                link and dsh-s3's already-built destination compose
//                correctly end-to-end, not just that the string looks right.
//
// AC2 (real-staging restart survival) and AC4 (edge-case fallback) are out of
// scope for this unit test file per the test plan: AC2 is covered by a
// Playwright E2E spec against real staging (Task 3); AC4 reuses dsh-s3's own
// AC2 test coverage unmodified. This file does not touch journey.js.

'use strict';

process.env.NODE_ENV = 'test';

var assert = require('assert');
var crypto = require('crypto');
var fs = require('fs');
var os = require('os');
var path = require('path');

var passed = 0;
var failed = 0;

function check(name, fn) {
  try {
    fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

async function checkAsync(name, fn) {
  try {
    await fn();
    console.log('PASS:', name);
    passed++;
  } catch (e) {
    console.error('FAIL:', name, '—', e.message);
    failed++;
    process.exitCode = 1;
  }
}

var journeyStore = require('../src/web-ui/modules/journey-store');
var features = require('../src/web-ui/routes/features');
var journeyRoutes = require('../src/web-ui/routes/journey');

// ── Scratch repo root — artefact files live under here, never the real tree ──
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-s4-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function writeArtefact(relPath, content) {
  var abs = path.join(_scratchRoot, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

features.setJourneyStoreModule(journeyStore);

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice' },
    headers: { accept: 'text/html' },
    params: {},
    body: {},
    url: '/'
  }, overrides || {});
}

// pncg-s1: handleGetFeatureArtefacts now threads a `pool` param (4th
// positional, after featureSlug) through to renderShellWithNav's own
// getProductsNavSummary(pool, tenantId) call -- this mock only needs to
// satisfy that query shape (empty rows is fine, these tests don't assert
// on the Products nav section itself).
function mockNavPool() {
  return { query: async function() { return { rows: [] }; } };
}

function mockRes() {
  var _statusCode = null;
  var _headers = {};
  var _body = '';
  return {
    writeHead: function (code, headers) { _statusCode = code; Object.assign(_headers, headers || {}); return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, headers: _headers, body: _body }; }
  };
}

// Builds a fresh feature with one completed, resumable stage.
function makeFeatureWithResumableStage(slug, stageName, artefactRelPath, artefactContent) {
  var journey = journeyStore.createJourney(slug, 'default');
  writeArtefact(artefactRelPath, artefactContent);
  var sessionId = crypto.randomUUID();
  journeyStore.completeStage(journey.journeyId, stageName, artefactRelPath, null, sessionId);
  return { journey: journeyStore.getJourney(journey.journeyId), sessionId: sessionId };
}

(async () => {

// ── AC1: the rendered "Resume conversation" href matches the new route exactly ──
await checkAsync('AC1: Resume conversation href points at /journey/:journeyId/stage/:stageName, not the old chat route', async () => {
  var slug = 'dsh-s4-ac1-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var fixture = makeFeatureWithResumableStage(slug, 'discovery', artefactRelPath, '# Discovery\n\nAC1 fixture content.');

  features.setListArtefacts(async function () {
    return {
      artefacts: [{ type: 'discovery', createdAt: '2026-07-28', path: artefactRelPath }],
      grouped: {},
      noArtefacts: false
    };
  });

  var req = mockReq();
  var res = mockRes();
  await features.handleGetFeatureArtefacts(req, res, slug, mockNavPool());
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);

  var expectedHref = '/journey/' + encodeURIComponent(fixture.journey.journeyId) + '/stage/' + encodeURIComponent('discovery');
  var linkMatch = result.body.match(/<a class="artefact-list__resume-link" href="([^"]+)">Resume conversation<\/a>/);
  assert.ok(linkMatch, 'expected a Resume conversation <a> tag in the rendered page');
  assert.strictEqual(linkMatch[1], expectedHref, 'expected the resume link href to exactly match ' + expectedHref + ', got: ' + linkMatch[1]);

  // Explicitly confirm the old, evictable route is gone from this link.
  var oldHrefFragment = '/skills/discovery/sessions/' + fixture.sessionId + '/chat';
  assert.ok(result.body.indexOf(oldHrefFragment) === -1, 'did not expect the old /skills/.../sessions/.../chat href to appear anywhere in the rendered page');
});

// ── AC3: the new href composes correctly end-to-end with dsh-s3's real route, for the in-memory case ──
await checkAsync('AC3: following the new href reaches dsh-s3\'s real handleGetJourneyStageView and renders 200 with real content, for a stage still resident in memory', async () => {
  var slug = 'dsh-s4-ac3-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var fixture = makeFeatureWithResumableStage(slug, 'discovery', artefactRelPath, '# Discovery\n\nAC3 fixture content, unique marker DSH_S4_AC3_ARTEFACT.');

  features.setListArtefacts(async function () {
    return {
      artefacts: [{ type: 'discovery', createdAt: '2026-07-28', path: artefactRelPath }],
      grouped: {},
      noArtefacts: false
    };
  });

  var listReq = mockReq();
  var listRes = mockRes();
  await features.handleGetFeatureArtefacts(listReq, listRes, slug, mockNavPool());
  var listResult = listRes._get();
  assert.strictEqual(listResult.statusCode, 200, 'expected the artefact-index page to render, got: ' + listResult.statusCode);

  var linkMatch = listResult.body.match(/<a class="artefact-list__resume-link" href="([^"]+)">Resume conversation<\/a>/);
  assert.ok(linkMatch, 'expected a Resume conversation <a> tag in the rendered page');
  var hrefMatch = linkMatch[1].match(/^\/journey\/([^/]+)\/stage\/([^/]+)$/);
  assert.ok(hrefMatch, 'expected the href to match /journey/:journeyId/stage/:stageName, got: ' + linkMatch[1]);
  var linkedJourneyId = decodeURIComponent(hrefMatch[1]);
  var linkedStageName = decodeURIComponent(hrefMatch[2]);

  // Simulate the "still resident in memory" case: the stage's conversation
  // turns are available (dsh-s3's chat-split branch), the same technique
  // check-dsh-s3-breadcrumb-split-view.js uses via setGetTurnsForStage.
  journeyRoutes.setGetTurnsForStage(async function () {
    return [
      { role: 'assistant', content: 'DSH_S4_AC3_UNIQUE_QUESTION' },
      { role: 'user', content: 'DSH_S4_AC3_UNIQUE_ANSWER' }
    ];
  });

  // Follow the link: drive a request to the destination route directly,
  // using the journeyId/stageName parsed out of the href produced above —
  // this is the real proof that the repointed link and dsh-s3's already-built
  // route compose correctly, not just a string-shape assertion.
  var stageReq = mockReq({ params: { journeyId: linkedJourneyId, stageName: linkedStageName } });
  var stageRes = mockRes();
  await journeyRoutes.handleGetJourneyStageView(stageReq, stageRes);
  var stageResult = stageRes._get();

  assert.strictEqual(stageResult.statusCode, 200, 'expected the destination stage-view page to render 200, got: ' + stageResult.statusCode);
  assert.ok(stageResult.body.indexOf('DSH_S4_AC3_UNIQUE_QUESTION') !== -1, 'expected the in-memory conversation turn to render on the destination page');
  assert.ok(stageResult.body.indexOf('DSH_S4_AC3_UNIQUE_ANSWER') !== -1, 'expected the full in-memory conversation to render on the destination page');
  assert.ok(stageResult.body.indexOf('DSH_S4_AC3_ARTEFACT') !== -1, 'expected the real artefact content to also render on the destination page');
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n--- check-dsh-s4-fix-resume-conversation-link Results ---');
console.log('Passed: ' + passed + '  Failed: ' + failed);

function cleanup() {
  try { fs.rmSync(_scratchRoot, { recursive: true, force: true }); } catch (_) {}
}
cleanup();

if (failed > 0) process.exitCode = 1;

})().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
