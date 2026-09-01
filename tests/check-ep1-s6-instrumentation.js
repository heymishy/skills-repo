'use strict';
// check-ep1-s6-instrumentation.js — ep1-s6
//
// Tests for the shared cross-channel instrumentation layer: the 6 named
// success events (feature discovered, feature selected, journey backfilled,
// artefact loaded, session started from CLI-progressed feature, stage
// navigation) plus ep1-s5's 3 error events, unified under one shape.
// Covers AC1 from artefacts/new-feature-af17f555/test-plans/ep1-s6-test-plan.md.

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

var journeyRoutes = require('../src/web-ui/routes/journey');
var skills = require('../src/web-ui/routes/skills');
var journeyStore = require('../src/web-ui/modules/journey-store');
var posthogServer = require('../src/web-ui/modules/posthog-server');

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' },
    params: {}
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _headers = {};
  var _body = '';
  return {
    writeHead: function (code, headers) { _statusCode = code; _headers = headers || {}; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, headers: _headers, body: _body }; }
  };
}

function withCapturedLogs(fn) {
  var origLog = console.log;
  var logs = [];
  console.log = function(msg) { logs.push(msg); };
  try { fn(logs); } finally { console.log = origLog; }
  return logs;
}

async function withCapturedLogsAsync(fn) {
  var origLog = console.log;
  var logs = [];
  console.log = function(msg) { logs.push(msg); };
  try { await fn(logs); } finally { console.log = origLog; }
  return logs;
}

function crossChannelLines(logs) {
  return logs.filter(function(l) { return String(l).indexOf('[cross-channel] ') === 0; });
}

function parseCrossChannelLine(line) {
  return JSON.parse(String(line).slice('[cross-channel] '.length));
}

(async () => {

// ── 1. All 6 named event types + ep1-s5's error events use the [cross-channel] prefix ──

await checkAsync('all 6 named success event types are logged with the [cross-channel] prefix and base fields', async () => {
  var slug = 'ep1s6-allsix';
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s6-allsix-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  fs.mkdirSync(path.join(scratchRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(scratchRoot, '.github', 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: slug, stage: 'definition', updatedAt: '2026-09-01T00:00:00.000Z' }]
  }), 'utf8');

  var req = mockReq({ params: { featureSlug: slug } });
  var res = mockRes();
  var logs = await withCapturedLogsAsync(async function() {
    // feature_discovered
    journeyRoutes._mergeStateFeaturesIntoJourneyList([], scratchRoot);
    // feature_selected, journey_backfilled, session_started_from_cli_progressed_feature
    await journeyRoutes.handleGetJourneyResume(req, res);
  });

  var byType = {};
  crossChannelLines(logs).forEach(function(l) {
    var parsed = parseCrossChannelLine(l);
    byType[parsed.eventType] = parsed;
  });

  ['feature_discovered', 'feature_selected', 'journey_backfilled', 'session_started_from_cli_progressed_feature'].forEach(function(evt) {
    assert.ok(byType[evt], 'expected a ' + evt + ' log line');
    assert.strictEqual(byType[evt].featureSlug, slug);
    assert.ok(byType[evt].timestamp, evt + ' missing timestamp');
  });
});

await checkAsync('artefact_loaded event type is logged with the [cross-channel] prefix and base fields', async () => {
  var slug = 'ep1s6-artload';
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s6-artload-'));
  var storiesDir = path.join(scratchRoot, 'artefacts', slug, 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  fs.writeFileSync(path.join(storiesDir, 'foo.md'), 'content', 'utf8');

  var logs = withCapturedLogs(function() {
    skills.buildSystemPrompt('review', null, scratchRoot, [], { activeFeatureSlug: slug });
  });
  var line = crossChannelLines(logs).find(function(l) { return parseCrossChannelLine(l).eventType === 'artefact_loaded'; });
  assert.ok(line, 'expected an artefact_loaded log line');
  var parsed = parseCrossChannelLine(line);
  assert.strictEqual(parsed.featureSlug, slug);
  assert.strictEqual(parsed.stage, 'review');
});

check('stage_navigation event type is logged with the [cross-channel] prefix and base fields', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s6-stagenav-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var journey = journeyStore.createJourney('ep1s6-stagenav-feature', 'default');
  journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/ep1s6-stagenav-feature/discovery.md');
  journeyStore.setJourneyFields(journey.journeyId, { activeSkill: 'benefit-metric' });

  var req = mockReq({ params: { journeyId: journey.journeyId, skillName: 'discovery' } });
  var res = mockRes();
  var logs = withCapturedLogs(function() {
    // handleGetJourneyStageReopen is async but its cross-channel emit happens
    // synchronously before the redirect -- fire-and-forget, no await needed
    // to observe the log line.
    journeyRoutes.handleGetJourneyStageReopen(req, res);
  });
  var line = crossChannelLines(logs).find(function(l) { return parseCrossChannelLine(l).eventType === 'stage_navigation'; });
  assert.ok(line, 'expected a stage_navigation log line');
});

// ── 2. PostHog events include base fields plus event-specific details ──

check('PostHog event for artefact_loaded includes base fields plus artefactCount/loadTimeMs', () => {
  var slug = 'ep1s6-phspecific';
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s6-phspecific-'));
  var storiesDir = path.join(scratchRoot, 'artefacts', slug, 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  fs.writeFileSync(path.join(storiesDir, 'foo.md'), 'content', 'utf8');
  fs.writeFileSync(path.join(storiesDir, 'bar.md'), 'content', 'utf8');

  var origKey = process.env.POSTHOG_KEY;
  var origCapture = posthogServer.capture;
  var captured = null;
  process.env.POSTHOG_KEY = 'test-key';
  posthogServer.capture = function(distinctId, event, properties) {
    if (event === 'artefact_loaded') { captured = properties; }
  };
  try {
    skills.buildSystemPrompt('review', null, scratchRoot, [], { activeFeatureSlug: slug });
  } finally {
    posthogServer.capture = origCapture;
    if (origKey === undefined) { delete process.env.POSTHOG_KEY; } else { process.env.POSTHOG_KEY = origKey; }
  }
  assert.ok(captured, 'expected a captured artefact_loaded PostHog event');
  assert.strictEqual(captured.featureSlug, slug);
  assert.strictEqual(captured.stage, 'review');
  assert.strictEqual(captured.eventType, 'artefact_loaded');
  assert.ok(captured.timestamp);
  assert.strictEqual(captured.artefactCount, 2);
  assert.strictEqual(typeof captured.loadTimeMs, 'number');
});

// ── 3. operatorId present when available, cleanly absent when not ──

check('operatorId is included when available, omitted (not null-padded) when not', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s6-opid-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  fs.mkdirSync(path.join(scratchRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(scratchRoot, '.github', 'pipeline-state.json'), JSON.stringify({
    features: [
      { slug: 'ep1s6-opid-with', stage: 'definition', updatedAt: '2026-09-01T00:00:00.000Z' },
      { slug: 'ep1s6-opid-without', stage: 'definition', updatedAt: '2026-09-01T00:00:00.000Z' }
    ]
  }), 'utf8');

  var logsWith = withCapturedLogs(function() {
    journeyRoutes.backfillJourneyFromPipelineState('ep1s6-opid-with', scratchRoot, 'alice');
  });
  var logsWithout = withCapturedLogs(function() {
    journeyRoutes.backfillJourneyFromPipelineState('ep1s6-opid-without', scratchRoot);
  });

  var lineWith = crossChannelLines(logsWith).find(function(l) { return parseCrossChannelLine(l).eventType === 'journey_backfilled'; });
  var lineWithout = crossChannelLines(logsWithout).find(function(l) { return parseCrossChannelLine(l).eventType === 'journey_backfilled'; });
  assert.ok(lineWith && lineWithout, 'expected journey_backfilled log lines in both cases');
  assert.strictEqual(parseCrossChannelLine(lineWith).operatorId, 'alice');
  assert.ok(lineWith.indexOf('"operatorId"') !== -1, 'expected operatorId key present when available');
  assert.ok(lineWithout.indexOf('"operatorId"') === -1, 'expected operatorId key cleanly absent, not null-padded, for a background/system-triggered backfill');
});

// ── 4. ep1-s5's 3 error event types are covered by this story's same shape ──

check("ep1-s5's 3 error event types are covered by this story's same logging shape", () => {
  var logs = withCapturedLogs(function() {
    journeyRoutes._logCrossChannelError('artefact_load_error', { featureSlug: 'x', stage: 'discovery' });
    journeyRoutes._logCrossChannelError('journey_backfill_error', { featureSlug: 'x', stage: 'discovery' });
    journeyRoutes._logCrossChannelError('stage_routing_error', { featureSlug: 'x', stage: 'discovery' });
  });
  var lines = crossChannelLines(logs);
  assert.strictEqual(lines.length, 3);
  lines.forEach(function(l) {
    var parsed = parseCrossChannelLine(l);
    assert.ok(['artefact_load_error', 'journey_backfill_error', 'stage_routing_error'].indexOf(parsed.eventType) !== -1);
    assert.strictEqual(parsed.featureSlug, 'x');
    assert.strictEqual(parsed.stage, 'discovery');
    assert.ok(parsed.timestamp, 'expected the same base-field shape (featureSlug/stage/eventType/timestamp) as the 6 success-path events');
  });
});

// ── 5. PostHog call failure does not throw or block the calling code ──

check('PostHog call failure does not throw or block; the stdout log still succeeds independently', () => {
  var origCapture = posthogServer.capture;
  posthogServer.capture = function() { throw new Error('simulated PostHog outage'); };
  var logs;
  try {
    assert.doesNotThrow(function() {
      logs = withCapturedLogs(function() {
        journeyRoutes._logCrossChannelEvent('journey_backfilled', { featureSlug: 'x', stage: 'discovery' });
      });
    });
  } finally {
    posthogServer.capture = origCapture;
  }
  assert.strictEqual(crossChannelLines(logs).length, 1, 'stdout log must still succeed even though PostHog threw');
});

// ── 6. Server logs are structured JSON, not free-text interpolation ──

check('server logs are structured JSON, not free-text interpolation', () => {
  var logs = withCapturedLogs(function() {
    journeyRoutes._logCrossChannelEvent('journey_backfilled', { featureSlug: 'x', stage: 'discovery' });
  });
  var line = crossChannelLines(logs)[0];
  assert.ok(line, 'expected a captured [cross-channel] log line');
  var parsed;
  assert.doesNotThrow(function() { parsed = parseCrossChannelLine(line); }, 'the line after the [cross-channel] prefix must parse as valid JSON');
  assert.strictEqual(parsed.eventType, 'journey_backfilled');
  assert.strictEqual(parsed.featureSlug, 'x');
  assert.strictEqual(parsed.stage, 'discovery');
  assert.ok(parsed.timestamp);
});

// ── 7. Stage navigation event captures both from-stage and to-stage ──

check('stage navigation event captures both the from-stage and the to-stage', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s6-fromto-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var journey = journeyStore.createJourney('ep1s6-fromto-feature', 'default');
  journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/ep1s6-fromto-feature/discovery.md');
  journeyStore.setJourneyFields(journey.journeyId, { activeSkill: 'benefit-metric' });

  var req = mockReq({ params: { journeyId: journey.journeyId, skillName: 'discovery' } });
  var res = mockRes();
  var logs = withCapturedLogs(function() {
    journeyRoutes.handleGetJourneyStageReopen(req, res);
  });
  var line = crossChannelLines(logs).find(function(l) { return parseCrossChannelLine(l).eventType === 'stage_navigation'; });
  assert.ok(line);
  var parsed = parseCrossChannelLine(line);
  assert.strictEqual(parsed.fromStage, 'benefit-metric', 'expected the stage navigated FROM');
  assert.strictEqual(parsed.toStage, 'discovery', 'expected the stage navigated TO');
});

// ── Integration: full session lifecycle emits the expected event sequence ──

await checkAsync('a full session lifecycle emits the expected event sequence: feature discovered -> feature selected -> journey backfilled -> artefact loaded -> session started from CLI-progressed feature', async () => {
  var slug = 'ep1s6-lifecycle';
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s6-lifecycle-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  fs.mkdirSync(path.join(scratchRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(scratchRoot, '.github', 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: slug, stage: 'definition', updatedAt: '2026-09-01T00:00:00.000Z' }]
  }), 'utf8');
  fs.mkdirSync(path.join(scratchRoot, 'artefacts', slug, 'stories'), { recursive: true });
  fs.writeFileSync(path.join(scratchRoot, 'artefacts', slug, 'stories', 's1.md'), 'content', 'utf8');

  // registerHtmlSession (called inside handleGetJourneyResume) invokes
  // buildSystemPrompt with an explicit repoRoot of `undefined`, which falls
  // back to skills.js's own _getRepoPath() -- CLAUDE_REPO_PATH is the only
  // seam into that fallback, so it's pointed at the scratch root for the
  // duration of this one end-to-end test and restored immediately after.
  var origRepoPathEnv = process.env.CLAUDE_REPO_PATH;
  process.env.CLAUDE_REPO_PATH = scratchRoot;

  var req = mockReq({ params: { featureSlug: slug } });
  var res = mockRes();
  var logs;
  try {
    logs = await withCapturedLogsAsync(async function() {
      journeyRoutes._mergeStateFeaturesIntoJourneyList([], scratchRoot);
      await journeyRoutes.handleGetJourneyResume(req, res);
    });
  } finally {
    if (origRepoPathEnv === undefined) { delete process.env.CLAUDE_REPO_PATH; } else { process.env.CLAUDE_REPO_PATH = origRepoPathEnv; }
  }

  var expectedOrder = ['feature_discovered', 'feature_selected', 'journey_backfilled', 'artefact_loaded', 'session_started_from_cli_progressed_feature'];
  var lines = crossChannelLines(logs);
  var firstIndexOf = {};
  var countOf = {};
  lines.forEach(function(l, i) {
    var evt = parseCrossChannelLine(l).eventType;
    if (!(evt in firstIndexOf)) { firstIndexOf[evt] = i; }
    countOf[evt] = (countOf[evt] || 0) + 1;
  });

  expectedOrder.forEach(function(evt) {
    assert.ok(evt in firstIndexOf, 'expected ' + evt + ' to fire during the lifecycle');
    assert.strictEqual(countOf[evt], 1, evt + ' should fire exactly once, not duplicated');
  });
  for (var i = 1; i < expectedOrder.length; i++) {
    assert.ok(firstIndexOf[expectedOrder[i - 1]] < firstIndexOf[expectedOrder[i]],
      expectedOrder[i - 1] + ' should fire before ' + expectedOrder[i]);
  }
});

// ── Integration: instrumentation does not alter the behaviour it observes ──

await checkAsync('instrumentation does not alter the behaviour it observes -- routing decision and journey record are unaffected', async () => {
  var slug = 'ep1s6-noalter';
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s6-noalter-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  fs.mkdirSync(path.join(scratchRoot, '.github'), { recursive: true });
  fs.writeFileSync(path.join(scratchRoot, '.github', 'pipeline-state.json'), JSON.stringify({
    features: [{ slug: slug, stage: 'definition', updatedAt: '2026-09-01T00:00:00.000Z' }]
  }), 'utf8');

  var req = mockReq({ params: { featureSlug: slug } });
  var res = mockRes();
  // Instrumentation has no injectable on/off seam (none was called for by
  // this story's architecture constraints) -- this asserts the routing/
  // session outcome is exactly what ep1-s4's own getNextSkill contract
  // predicts, independent of the new logging calls layered around it, which
  // demonstrates the wiring is purely additive rather than literally toggling
  // instrumentation off and diffing.
  await journeyRoutes.handleGetJourneyResume(req, res);
  var result = res._get();
  assert.strictEqual(result.statusCode, 303);
  assert.ok(String(result.headers.Location).indexOf('/skills/review/sessions/') === 0, 'expected routing to review, matching getNextSkill(\'definition\') unchanged by instrumentation');

  var memJourney = journeyStore.getJourneyByFeatureSlug(slug);
  assert.ok(memJourney);
  assert.strictEqual(memJourney.activeSkill, 'review');
  assert.strictEqual(memJourney.completedStages.length, 5, 'BACKFILL_STAGE_SEQUENCE up to and including definition is 5 stages');
  assert.ok(memJourney.cliAdoptionTimestamp, 'CLI-adoption bookkeeping unaffected by instrumentation');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
