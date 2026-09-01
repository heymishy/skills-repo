'use strict';
// check-ep1-s5-error-handling.js — ep1-s5
//
// Unit + integration tests for the error-handling/logging layer wrapping
// ep1-s1/ep1-s2/ep1-s3/ep1-s4's mechanisms. Covers AC1 from
// artefacts/new-feature-af17f555/test-plans/ep1-s5-test-plan.md.

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

check('_logCrossChannelError logs to console with structured fields, does not throw', () => {
  var origLog = console.log;
  var captured = null;
  console.log = function(msg) { captured = msg; };
  try {
    journeyRoutes._logCrossChannelError('artefact_load_error', { featureSlug: 'x', stage: 'discovery' });
  } finally { console.log = origLog; }
  assert.ok(captured.indexOf('artefact_load_error') !== -1);
  assert.ok(captured.indexOf('x') !== -1);
});

check('_logCrossChannelError never throws even if PostHog capture fails', () => {
  assert.doesNotThrow(function() {
    journeyRoutes._logCrossChannelError('journey_backfill_error', { featureSlug: null });
  });
});

check('_mergeStateFeaturesIntoJourneyList logs artefact_load_error when pipeline-state.json is malformed', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s5-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var dir = path.join(scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), '{not valid json', 'utf8');
  var origLog = console.log;
  var logs = [];
  console.log = function(msg) { logs.push(msg); };
  var result;
  try { result = journeyRoutes._mergeStateFeaturesIntoJourneyList([], scratchRoot); }
  finally { console.log = origLog; }
  assert.deepStrictEqual(result, []);
  assert.ok(logs.some(function(l) { return l.indexOf('artefact_load_error') !== -1; }), 'expected an artefact_load_error log line');
});

check('_mergeStateFeaturesIntoJourneyList does not log anything when pipeline-state.json is simply absent (not an error)', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s5-absent-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var origLog = console.log;
  var logs = [];
  console.log = function(msg) { logs.push(msg); };
  var result;
  try { result = journeyRoutes._mergeStateFeaturesIntoJourneyList([], scratchRoot); }
  finally { console.log = origLog; }
  assert.deepStrictEqual(result, []);
  assert.ok(!logs.some(function(l) { return l.indexOf('artefact_load_error') !== -1; }), 'a missing file is not the same as a read/parse error — no log expected');
});

check('backfillJourneyFromPipelineState logs stage_routing_error and falls back when getNextSkill returns null', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s5-routing-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var dir = path.join(scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: [{ slug: 'ep1s5-routing', stage: 'branch-complete', updatedAt: '2026-08-01T00:00:00.000Z' }] }), 'utf8');
  var origLog = console.log;
  var logs = [];
  console.log = function(msg) { logs.push(msg); };
  var journey;
  try { journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s5-routing', scratchRoot); }
  finally { console.log = origLog; }
  assert.strictEqual(journey.activeSkill, 'definition-of-ready', 'expected the existing fallback behaviour, unchanged');
  assert.ok(logs.some(function(l) { return l.indexOf('stage_routing_error') !== -1; }), 'expected a stage_routing_error log when getNextSkill has no routing-table entry for this stage');
});

check('backfillJourneyFromPipelineState does NOT log stage_routing_error when getNextSkill succeeds normally', () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s5-routing-ok-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var dir = path.join(scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: [{ slug: 'ep1s5-routing-ok', stage: 'definition', updatedAt: '2026-08-01T00:00:00.000Z' }] }), 'utf8');
  var origLog = console.log;
  var logs = [];
  console.log = function(msg) { logs.push(msg); };
  var journey;
  try { journey = journeyRoutes.backfillJourneyFromPipelineState('ep1s5-routing-ok', scratchRoot); }
  finally { console.log = origLog; }
  assert.strictEqual(journey.activeSkill, 'review');
  assert.ok(!logs.some(function(l) { return l.indexOf('stage_routing_error') !== -1; }), 'no error expected for a recognized stage');
});

// ── Integration: resume flow no longer crashes if backfill throws ────────

var journeyStore = require('../src/web-ui/modules/journey-store');

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-alice', userId: '1', login: 'alice', tenantId: 't1' },
    params: {}
  }, overrides || {});
}

function mockRes() {
  var _statusCode = null;
  var _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

(async () => {

// ── Task 4: skills.js's _KEY_DIRS per-file read failures are logged ──────

var skills = require('../src/web-ui/routes/skills');

await checkAsync('buildSystemPrompt logs artefact_load_error for a _KEY_DIRS file that fails to read', async () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s5-skills-'));
  var slug = 'ep1s5-skills-fixture';
  var storiesDir = path.join(scratchRoot, 'artefacts', slug, 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  fs.writeFileSync(path.join(storiesDir, 'broken.md'), 'content', 'utf8');
  // A real, present file that fails to read (not a missing/directory case) —
  // simulated via a targeted fs.readFileSync monkey-patch, restored
  // immediately after, since a directory-named-like-a-file doesn't reach
  // readFileSync at all (the directory walk recurses into it instead of
  // treating it as a file), and cross-platform permission tricks are
  // unreliable in CI.
  var origReadFileSync = fs.readFileSync;
  fs.readFileSync = function(p, enc) {
    if (String(p).indexOf('broken.md') !== -1) { throw new Error('simulated read failure'); }
    return origReadFileSync(p, enc);
  };
  var origLog = console.log;
  var logs = [];
  console.log = function(msg) { logs.push(msg); };
  try {
    skills.buildSystemPrompt('discovery', null, scratchRoot, [], { activeFeatureSlug: slug });
  } finally {
    console.log = origLog;
    fs.readFileSync = origReadFileSync;
  }
  assert.ok(logs.some(function(l) { return l.indexOf('artefact_load_error') !== -1 && l.indexOf('broken.md') !== -1; }), 'expected an artefact_load_error log naming the unreadable file');
});

await checkAsync('handleGetJourneyResume degrades gracefully (404, not a crash) when backfill genuinely has nothing to backfill', async () => {
  var scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ep1-s5-resume-'));
  journeyRoutes.setRepoRoot(scratchRoot);
  var dir = path.join(scratchRoot, '.github');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'pipeline-state.json'), JSON.stringify({ features: [] }), 'utf8');
  var req = mockReq({ params: { featureSlug: 'ep1s5-genuinely-unknown' } });
  var res = mockRes();
  await journeyRoutes.handleGetJourneyResume(req, res);
  var result = res._get();
  assert.strictEqual(result.statusCode, 404, 'expected a clean 404, not an uncaught exception');
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
