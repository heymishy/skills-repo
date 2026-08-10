#!/usr/bin/env node
// check-rht-s1-trailing-assistant-turn.js — unit/integration tests for rht-s1
// (a completed stage's resumed history view silently dropped a trailing,
// unanswered assistant turn -- handleGetJourneyStageView's _priorQA-building
// loop discarded it entirely instead of displaying it as the skill's actual
// final recorded message).
//
// Story:      artefacts/2026-08-10-resume-history-trailing-turn-fix/stories/rht-s1-trailing-assistant-turn-shown-in-history.md
// Test plan:  artefacts/2026-08-10-resume-history-trailing-turn-fix/test-plans/rht-s1-test-plan.md
//
// Coverage:
//   AC1 (integration) — lone trailing assistant turn displays as a message
//   AC2 (integration) — existing paired assistant+user case unchanged
//   AC3 (integration) — mixed paired-then-trailing sequence, nothing dropped
//   AC4 (integration) — no interactive controls, any scenario
//   AC5 (integration) — zero-turns fallback path unchanged (re-run of dsh-s3's own AC2 edge case)

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

var _scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'rht-s1-'));
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

function makeCompletedJourneyFixture(slug, stageName, artefactRelPath, artefactContent) {
  var journey = journeyStore.createJourney(slug, 'default');
  writeArtefact(artefactRelPath, artefactContent);
  journeyStore.completeStage(journey.journeyId, stageName, artefactRelPath, null, 'seed-sid-1');
  journeyStore.setJourneyFields(journey.journeyId, { activeSkill: 'benefit-metric', activeSessionId: 'seed-sid-2' });
  return journey;
}

var TURNS_LONE_TRAILING_ASSISTANT = [
  { role: 'assistant', content: 'Producing the full definition now.' }
];

var TURNS_PAIRED = [
  { role: 'assistant', content: 'Q1' },
  { role: 'user', content: 'A1' }
];

var TURNS_PAIRED_THEN_TRAILING = [
  { role: 'assistant', content: 'Q1' },
  { role: 'user', content: 'A1' },
  { role: 'assistant', content: 'Final summary' }
];

(async () => {

// ── AC1: lone trailing assistant turn displays as a message ──
await checkAsync('AC1: handleGetJourneyStageView_loneTrailingAssistantTurn_displaysAsMessage', async () => {
  var journey = makeCompletedJourneyFixture(
    'rht-s1-ac1-feature', 'definition', 'artefacts/rht-s1-ac1-feature/definition.md',
    '# Definition\n\nAC1 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_LONE_TRAILING_ASSISTANT.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('id="chat-messages"') !== -1, 'expected the chat panel to render');
  assert.ok(result.body.indexOf('Producing the full definition now.') !== -1, 'expected the lone trailing assistant turn\'s content to appear, not be silently dropped');
  assert.ok(result.body.indexOf('sw-chat-msg--assistant') !== -1, 'expected the message to render under the assistant/"Skill" bubble, not the user/"You" bubble');
});

// ── AC2: existing paired assistant+user case unchanged ──
await checkAsync('AC2: handleGetJourneyStageView_pairedAssistantUser_unchangedFromToday', async () => {
  var journey = makeCompletedJourneyFixture(
    'rht-s1-ac2-feature', 'definition', 'artefacts/rht-s1-ac2-feature/definition.md',
    '# Definition\n\nAC2 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_PAIRED.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('Q1') !== -1, 'expected the question to appear');
  assert.ok(result.body.indexOf('A1') !== -1, 'expected the answer to appear');
});

// ── AC3: mixed paired-then-trailing sequence, nothing dropped ──
await checkAsync('AC3: handleGetJourneyStageView_pairedThenTrailingAssistant_bothDisplay', async () => {
  var journey = makeCompletedJourneyFixture(
    'rht-s1-ac3-feature', 'definition', 'artefacts/rht-s1-ac3-feature/definition.md',
    '# Definition\n\nAC3 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_PAIRED_THEN_TRAILING.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('Q1') !== -1, 'expected the paired question to appear');
  assert.ok(result.body.indexOf('A1') !== -1, 'expected the paired answer to appear');
  assert.ok(result.body.indexOf('Final summary') !== -1, 'expected the trailing assistant-only turn to also appear, not dropped');
});

// ── AC4: no interactive controls, any scenario ──
await checkAsync('AC4: handleGetJourneyStageView_trailingAssistantTurn_stillNoInteractiveControls', async () => {
  var journey = makeCompletedJourneyFixture(
    'rht-s1-ac4-feature', 'definition', 'artefacts/rht-s1-ac4-feature/definition.md',
    '# Definition\n\nAC4 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return TURNS_LONE_TRAILING_ASSISTANT.slice(); });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('<input') === -1, 'did not expect any <input> element');
  assert.ok(result.body.indexOf('<textarea') === -1, 'did not expect any <textarea> element');
  assert.ok(result.body.indexOf('type="submit"') === -1, 'did not expect any submit button');
});

// ── AC5: zero-turns fallback path unchanged ──
await checkAsync('AC5: handleGetJourneyStageView_zeroTurns_unchangedArtefactOnlyFallback', async () => {
  var journey = makeCompletedJourneyFixture(
    'rht-s1-ac5-feature', 'definition', 'artefacts/rht-s1-ac5-feature/definition.md',
    '# Definition\n\nAC5 fixture content.'
  );
  journeyRoutes.setGetTurnsForStage(async function () { return []; });

  var req = mockReq({ params: { journeyId: journey.journeyId, stageName: 'definition' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyStageView(req, res);
  var result = res._get();

  assert.strictEqual(result.statusCode, 200, 'expected 200, got: ' + result.statusCode);
  assert.ok(result.body.indexOf('id="chat-messages"') === -1, 'did not expect a chat panel for an empty turns array');
  assert.ok(result.body.indexOf('sr-paper') !== -1, 'expected the artefact-only sr-paper wrapper for an empty turns array');
  assert.ok(result.body.indexOf('AC5 fixture content.') !== -1, 'expected the artefact content to still render');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
