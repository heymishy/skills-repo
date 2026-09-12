'use strict';

// check-ral-s1-audit-log-journey-id-and-timestamp.js — ral-s1
//
// Verifies ral-s1: the artefact_auto_amended/artefact_auto_saved and
// materiality_check_hook_failed audit log events (src/web-ui/routes/skills.js)
// carry an explicit journeyId field (session.journeyId || null) and an
// explicit ISO-8601 timestamp field, closing res-s2's own DoD-recorded
// audit-logging NFR gap. No new events, no change to console method choice.
//
// Run: node tests/check-ral-s1-audit-log-journey-id-and-timestamp.js

var fs   = require('fs');
var os   = require('os');
var path = require('path');
var ROUTES_PATH = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

var ISO_8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshRoutes() {
  var resolved = require.resolve(ROUTES_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function fakeRes() {
  var r = { _chunks: [], _ended: false };
  r.writeHead = function() {};
  r.write = function(s) { r._chunks.push(s); };
  r.end = function() { r._ended = true; };
  return r;
}

function parseJsonCalls(calls) {
  return calls.map(function(m) {
    try { return JSON.parse(m); } catch (_) { return null; }
  }).filter(Boolean);
}

var ARTEFACT_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n# Discovery\n\nRevised content.\n---ARTEFACT-END---\n---SLUG---\nral-s1-fixture-feature';

var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ral-s1-'));

(async function main() {

console.log('\nAC1 — amendment (overwrite) logs journeyId + timestamp');

await (async function() {
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var slug = 'ral-s1-amend-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nOriginal.', 'utf8');

  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var infoCalls = [];
  var _originalInfo = console.info;
  console.info = function(msg) { infoCalls.push(msg); };

  var sid = 'test-ral-s1-t1-amend-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    fakeRes()
  );

  console.info = _originalInfo;

  var events = parseJsonCalls(infoCalls);
  var amendEvent = events.find(function(e) { return e.event === 'artefact_auto_amended'; });

  ok('AC1: artefact_auto_amended event fired', !!amendEvent);
  ok('AC1: journeyId matches the session\'s journeyId', amendEvent && amendEvent.journeyId === jid);
  ok('AC1: timestamp is a valid ISO-8601 string', amendEvent && ISO_8601_RE.test(amendEvent.timestamp));
})();

console.log('\nAC2 — first-time save logs journeyId + timestamp (symmetry with AC1)');

await (async function() {
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var slug = 'ral-s1-first-save-feature';
  var jid = journeyStore.createJourney(slug, 'default').journeyId;

  var infoCalls = [];
  var _originalInfo = console.info;
  console.info = function(msg) { infoCalls.push(msg); };

  var sid = 'test-ral-s1-t2-firstsave-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'go' } },
    fakeRes()
  );

  console.info = _originalInfo;

  var events = parseJsonCalls(infoCalls);
  var savedEvent = events.find(function(e) { return e.event === 'artefact_auto_saved'; });

  ok('AC2: artefact_auto_saved event fired', !!savedEvent);
  ok('AC2: journeyId matches the session\'s journeyId', savedEvent && savedEvent.journeyId === jid);
  ok('AC2: timestamp is a valid ISO-8601 string', savedEvent && ISO_8601_RE.test(savedEvent.timestamp));
})();

console.log('\nAC3 — no journeyId on the session logs journeyId: null, does not throw');

await (async function() {
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var slug = 'ral-s1-no-journey-feature';

  var infoCalls = [];
  var _originalInfo = console.info;
  console.info = function(msg) { infoCalls.push(msg); };

  var sid = 'test-ral-s1-t3-nojourney-' + Math.random().toString(36).slice(2);
  // Deliberately no journeyId — standalone /skills or CLI usage.
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug
  });

  var res = fakeRes();
  var threw = false;
  try {
    await routes.handlePostTurnStreamHtml(
      { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'go' } },
      res
    );
  } catch (_) { threw = true; }

  console.info = _originalInfo;

  var events = parseJsonCalls(infoCalls);
  var savedEvent = events.find(function(e) { return e.event === 'artefact_auto_saved' || e.event === 'artefact_auto_amended'; });

  ok('AC3: no journeyId on the session does not throw', !threw);
  ok('AC3: save event still fired', !!savedEvent);
  ok('AC3: journeyId field is null, not omitted or undefined', savedEvent && savedEvent.journeyId === null);
})();

console.log('\nAC4 — materiality-check hook failure logs journeyId + timestamp');

await (async function() {
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setMaterialityCheckHook(function() { throw new Error('simulated materiality-check failure'); });

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var slug = 'ral-s1-hook-failure-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery\n\nPre-revision text.', 'utf8');
  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid-4');

  var warnCalls = [];
  var _originalWarn = console.warn;
  console.warn = function(msg) { warnCalls.push(msg); };

  var sid = 'test-ral-s1-t4-hookfail-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    fakeRes()
  );

  console.warn = _originalWarn;

  var events = parseJsonCalls(warnCalls);
  var failEvent = events.find(function(e) { return e.event === 'materiality_check_hook_failed'; });

  ok('AC4: materiality_check_hook_failed event fired', !!failEvent);
  ok('AC4: journeyId matches the session\'s journeyId', failEvent && failEvent.journeyId === jid);
  ok('AC4: timestamp is a valid ISO-8601 string', failEvent && ISO_8601_RE.test(failEvent.timestamp));

  routes.setMaterialityCheckHook(function() { return undefined; });
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);

})();
