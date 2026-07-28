#!/usr/bin/env node
// check-dsh-s3-breadcrumb-split-view.js — unit/integration tests for dsh-s3
// (Task 3): rebuild handleGetJourneyStageView (src/web-ui/routes/journey.js)
// into a chat-left/artefact-right split view when a completed stage's
// conversation turns are durably available, falling back to today's
// artefact-only rendering when they are not.
//
// Story:      artefacts/2026-07-28-durable-session-history/stories/dsh-s3-rebuild-breadcrumb-view.md
// Test plan:  artefacts/2026-07-28-durable-session-history/test-plans/dsh-s3-rebuild-breadcrumb-view-test-plan.md
//
// Coverage:
//   AC1 (unit)        — turns available -> chat panel + artefact panel both render
//   AC2 (unit)        — turns null      -> falls through to today's artefact-only view, unchanged
//   AC3 (integration) — existing handlePostJourneyStageArtefact (unmodified) still saves correctly
//   AC5 (unit)        — AC1 fixture's rendered page has no message-input control
//
// AC4 (cross-tenant 404) is NOT re-implemented here -- it is already covered
// by tests/check-p0.2-journey-guard-wiring.js, which this story re-runs
// standalone as a regression confirmation (see the story's own instruction).

'use strict';

process.env.NODE_ENV = 'test';

var assert = require('assert');
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
var journeyRoutes = require('../src/web-ui/routes/journey');

// ── Scratch repo root — artefact files live under here, never the real tree ──
var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'dsh-s3-'));
journeyRoutes.setRepoRoot(_scratchRoot);

function writeArtefact(relPath, content) {
  var abs = path.join(_scratchRoot, relPath);
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content, 'utf8');
}

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice' },
    params: {},
    body: {},
    url: '/'
  }, overrides || {});
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

// Builds a fresh completed-stage journey fixture, isolated per test.
function makeCompletedJourneyFixture(slug, stageName, artefactRelPath, artefactContent) {
  var journey = journeyStore.createJourney(slug, 'default');
  writeArtefact(artefactRelPath, artefactContent);
  journeyStore.completeStage(journey.journeyId, stageName, artefactRelPath, null, 'seed-sid-1');
  journeyStore.setJourneyFields(journey.journeyId, { activeSkill: 'benefit-metric', activeSessionId: 'seed-sid-2' });
  return journey;
}

var SAMPLE_TURNS = [
  { role: 'assistant', content: 'What problem are we trying to solve?' },
  { role: 'user', content: 'Operators cannot see the historical conversation behind a completed stage.' },
  { role: 'assistant', content: 'Got it, thanks for confirming.' },
  { role: 'user', content: 'Yes, exactly right.' }
];

(async () => {

// ── AC1: durable turns available -> chat panel + artefact panel both render ──
await checkAsync('AC1: non-empty turns -> response has chat panel AND artefact panel content', async () => {
  var journey = makeCompletedJourneyFixture(
    'dsh-s3-ac1-feature', 'discovery', 'artefacts/dsh-s3-ac1-feature/discovery.md',
    '# Discovery\n\nSome discovery artefact content for AC1.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return SAMPLE_TURNS.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('id="chat-messages"') !== -1, 'expected a chat-panel marker (id="chat-messages") in the response');
  assert.ok(result.body.indexOf('sw-chat') !== -1, 'expected the sw-chat split-grid class in the response');
  assert.ok(result.body.indexOf('Operators cannot see the historical conversation behind a completed stage.') !== -1, 'expected a seeded user turn to be rendered');
  assert.ok(result.body.indexOf('What problem are we trying to solve?') !== -1, 'expected a seeded assistant turn to be rendered');
  assert.ok(result.body.indexOf('Some discovery artefact content for AC1.') !== -1, 'expected the artefact panel to contain the real artefact content, not a placeholder');
  // Specifically the artefact-panel placeholder (not the unrelated, always-empty
  // "Diagrams will appear here..." canvas placeholder lower in the same pane,
  // which legitimately still renders since there is no diagram data either way).
  assert.ok(result.body.indexOf('Artefact will appear here as the session progresses.') === -1, 'did not expect the live-page artefact placeholder text to leak into the read-only historical view');
});

// ── AC2: turns unavailable (null) -> falls through to today's unchanged artefact-only view ──
await checkAsync('AC2: null turns -> response matches today\'s existing artefact-only rendering', async () => {
  var journey = makeCompletedJourneyFixture(
    'dsh-s3-ac2-feature', 'discovery', 'artefacts/dsh-s3-ac2-feature/discovery.md',
    '# Discovery\n\nSome discovery artefact content for AC2.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return null; });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('sw-chat"') === -1 && result.body.indexOf('class="sw-chat ') === -1, 'did not expect the chat-split grid to render when turns are null');
  assert.ok(result.body.indexOf('id="chat-messages"') === -1, 'did not expect a chat-panel marker when turns are null');
  assert.ok(result.body.indexOf('sr-paper') !== -1, 'expected today\'s existing artefact-only sr-paper wrapper to render');
  assert.ok(result.body.indexOf('Some discovery artefact content for AC2.') !== -1, 'expected the artefact content to still render');
  assert.ok(result.body.indexOf('Edit artefact') !== -1, 'expected the existing Edit artefact link/action bar to still be present');
});

// Same precondition as AC2, but an empty array (not null) must also fall through --
// the story's AC2 text covers both "not available" shapes explicitly.
await checkAsync('AC2 (edge case): empty-array turns -> also falls through to the artefact-only view', async () => {
  var journey = makeCompletedJourneyFixture(
    'dsh-s3-ac2b-feature', 'discovery', 'artefacts/dsh-s3-ac2b-feature/discovery.md',
    '# Discovery\n\nEmpty-array edge case content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return []; });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('id="chat-messages"') === -1, 'did not expect a chat panel for an empty turns array');
  assert.ok(result.body.indexOf('sr-paper') !== -1, 'expected the artefact-only sr-paper wrapper for an empty turns array');
});

// ── AC5: no message-input control appears in the rendered chat panel ─────────
await checkAsync('AC5: readOnly split view has no input/textarea/submit-button controls', async () => {
  var journey = makeCompletedJourneyFixture(
    'dsh-s3-ac5-feature', 'discovery', 'artefacts/dsh-s3-ac5-feature/discovery.md',
    '# Discovery\n\nAC5 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return SAMPLE_TURNS.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('<input') === -1, 'did not expect any <input> element in the read-only split view');
  assert.ok(result.body.indexOf('<textarea') === -1, 'did not expect any <textarea> element in the read-only split view');
  assert.ok(result.body.indexOf('type="submit"') === -1, 'did not expect any submit button in the read-only split view');
  // renderShell itself legitimately emits its own page-level <script> tags
  // (theme toggling etc.) unrelated to the chat panel, so a blanket "no
  // <script> anywhere on the page" assertion is the wrong scope here -- what
  // AC5 actually requires is no live chat footer/form and no chat-specific
  // client script (renderChat's own scriptHtml, suppressed by readOnly:true).
  // Check for the actual rendered footer *element*, not just the CSS class
  // name (which legitimately still appears once in the page's static <style>
  // block regardless of readOnly, since styles aren't conditionally stripped).
  assert.ok(result.body.indexOf('<footer class="sw-chat-foot"') === -1, 'did not expect the live chat input footer element to render');
  assert.ok(result.body.indexOf('id="chat-form"') === -1, 'did not expect the live chat <form id="chat-form"> to render');
  // Check for the function *definition* (unique to renderChat's own
  // scriptHtml, suppressed when readOnly), not the onclick="...()" call
  // reference on the always-rendered fullscreen-toggle button, which is a
  // separate, harmless no-op unrelated to messaging when its definition is
  // absent -- not a message-input control and out of this story's scope.
  assert.ok(result.body.indexOf('function swToggleArtefactFs') === -1, 'did not expect renderChat\'s own client-side script (suppressed by readOnly) to render');
});

// ── AC3: existing inline artefact-edit flow (handlePostJourneyStageArtefact, unmodified) still works ──
await checkAsync('AC3: existing handlePostJourneyStageArtefact still saves the artefact exactly as before', async () => {
  var journey = makeCompletedJourneyFixture(
    'dsh-s3-ac3-feature', 'discovery', 'artefacts/dsh-s3-ac3-feature/discovery.md',
    '# Discovery\n\nOriginal content before edit.'
  );
  // Render the page first (AC1 path this time, to prove edit still works
  // alongside the new split view, not just the AC2 fallback path).
  journeyRoutes.setGetTurnsForStage(async function () { return SAMPLE_TURNS.slice(); });
  var getReq = mockReq({ params: { journeyId: journey.journeyId, stageName: 'discovery' } });
  var getRes = mockRes();
  await journeyRoutes.handleGetJourneyStageView(getReq, getRes);
  assert.strictEqual(getRes._get().statusCode, 200, 'expected the pre-edit page render to succeed');

  // Submit the existing, unmodified edit-artefact POST handler.
  var postReq = mockReq({
    params: { journeyId: journey.journeyId, stageName: 'discovery' },
    body: { content: 'Updated content via the existing edit flow.' }
  });
  var postRes = mockRes();
  await journeyRoutes.handlePostJourneyStageArtefact(postReq, postRes);
  var postResult = postRes._get();

  assert.strictEqual(postResult.statusCode, 302, 'expected a 302 redirect on successful save, got: ' + postResult.statusCode);
  assert.ok(postResult.headers.Location && postResult.headers.Location.indexOf('/stage/discovery') !== -1, 'expected redirect back to the stage-view page');

  var savedContent = fs.readFileSync(path.join(_scratchRoot, 'artefacts/dsh-s3-ac3-feature/discovery.md'), 'utf8');
  assert.ok(savedContent.indexOf('Updated content via the existing edit flow.') !== -1, 'expected the artefact file on disk to contain the newly saved content');
});

// ── Summary ──────────────────────────────────────────────────────────────────
console.log('\n--- check-dsh-s3-breadcrumb-split-view Results ---');
console.log('Passed: ' + passed + '  Failed: ' + failed);

function cleanup() {
  try { fs.rmSync(_scratchRoot, { recursive: true, force: true }); } catch (_) {}
}
cleanup();

if (failed > 0) process.exitCode = 1;

})().catch(e => { console.error('FATAL:', e.message, e.stack); process.exit(1); });
