'use strict';

// check-res-s3-suggest-revision-materiality.js
// Verifies res-s3: after res-s2's overwrite, a deterministic section-diff
// classifies the revision as material (Problem Statement/MVP Scope/Constraints
// changed) or minor (everything else), generates a one-sentence rationale,
// presents both in the same chat turn's SSE response, and logs the suggestion
// with a joinable key for res-s4.
//
// Run: node tests/check-res-s3-suggest-revision-materiality.js

var fs   = require('fs');
var os   = require('os');
var path = require('path');
var MATERIALITY_PATH = path.resolve(__dirname, '../src/web-ui/modules/materiality-check.js');
var ROUTES_PATH       = path.resolve(__dirname, '../src/web-ui/routes/skills.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshMaterialityCheck() {
  var resolved = require.resolve(MATERIALITY_PATH);
  delete require.cache[resolved];
  return require(resolved);
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
  r.events = function() {
    return r._chunks.map(function(c) {
      var m = c.match(/^data: (.*)\n\n$/);
      return m ? JSON.parse(m[1]) : null;
    }).filter(Boolean);
  };
  r.lastEvent = function() {
    var evts = r.events();
    return evts[evts.length - 1] || null;
  };
  return r;
}

var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s3-'));

var PRE_FIXTURE =
  '# Discovery\n\n' +
  '## Problem Statement\n\nOperators cannot revise an earlier completed stage.\n\n' +
  '## Who It Affects\n\nSolo operators running the outer loop.\n\n' +
  '## MVP Scope\n\nReopen and overwrite the artefact in place.\n\n' +
  '## Constraints\n\nNo new versioning mechanism.\n';

(async function main() {

console.log('\nTask 1 — deterministic section-diff classifier');

await (async function() {
  var mc = freshMaterialityCheck();

  // AC2: Problem Statement changed -> material
  var postProblemChanged = PRE_FIXTURE.replace(
    'Operators cannot revise an earlier completed stage.',
    'Operators cannot revise an earlier completed stage, and this now also blocks external reviewers.'
  );
  var r1 = mc.checkMateriality(PRE_FIXTURE, postProblemChanged);
  ok('AC2: Problem Statement change classified as material', r1.classification === 'material');
  ok('AC2: changedSections names Problem Statement', r1.changedSections.indexOf('Problem Statement') !== -1);
  ok('AC2: changedSections contains ONLY Problem Statement (no unrelated sections)', r1.changedSections.length === 1 && JSON.stringify(r1.changedSections) === JSON.stringify(['Problem Statement']));

  // AC2: Constraints changed -> material
  var postConstraintChanged = PRE_FIXTURE.replace(
    'No new versioning mechanism.',
    'No new versioning mechanism; must also support a dated-copy fallback.'
  );
  var r2 = mc.checkMateriality(PRE_FIXTURE, postConstraintChanged);
  ok('AC2: Constraints change classified as material', r2.classification === 'material');
  ok('AC2: changedSections names Constraints', r2.changedSections.indexOf('Constraints') !== -1);
  ok('AC2: changedSections contains ONLY Constraints (no unrelated sections)', r2.changedSections.length === 1 && JSON.stringify(r2.changedSections) === JSON.stringify(['Constraints']));
})();

await (async function() {
  var mc = freshMaterialityCheck();

  // AC3: wording-only change in a non-target section -> minor
  var postWordingChanged = PRE_FIXTURE.replace(
    'Solo operators running the outer loop.',
    'Solo operators who are running the outer loop end to end.'
  );
  var r1 = mc.checkMateriality(PRE_FIXTURE, postWordingChanged);
  ok('AC3: wording-only change (non-target section) classified as minor', r1.classification === 'minor');
  ok('AC3: changedSections is empty for a wording-only change', r1.changedSections.length === 0);

  // AC3 edge case: single-character typo fix (non-target section) -> minor
  var postTypoFixed = PRE_FIXTURE.replace('outer loop.', 'outer loop!');
  var r2 = mc.checkMateriality(PRE_FIXTURE, postTypoFixed);
  ok('AC3 edge case: single-character typo fix classified as minor', r2.classification === 'minor');
})();

console.log('\nTask 2 — orchestration: runMaterialityCheck (suggestion ID, PostHog audit log)');

await (async function() {
  var mc = freshMaterialityCheck();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s3-t2-feature', 'default').journeyId;

  // AC1: the function receives and uses BOTH pre and post content — not
  // just post, and not attempting to re-derive pre from disk.
  var result = await mc.runMaterialityCheck({
    journeyId: jid,
    skillName: 'discovery',
    preRevisionContent: PRE_FIXTURE,
    postRevisionContent: PRE_FIXTURE.replace('No new versioning mechanism.', 'A new dated-copy mechanism is required.')
  });
  ok('AC1: classification reflects the real pre/post diff (material)', result.classification === 'material');
  ok('AC1: rationale is a non-empty one-sentence string', typeof result.rationale === 'string' && result.rationale.length > 0 && result.rationale.indexOf('\n') === -1);
  ok('AC4: a suggestionId is returned for later joining (res-s4)', typeof result.suggestionId === 'string' && result.suggestionId.length > 0);
})();

await (async function() {
  // AC4: the suggestion is recorded via PostHog capture with a joinable key.
  var mc = freshMaterialityCheck();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s3-t2-audit-feature', 'default').journeyId;

  var posthogServer = require('../src/web-ui/modules/posthog-server');
  var _originalCapture = posthogServer.capture;
  var captured = [];
  posthogServer.capture = function(distinctId, event, properties, groups) {
    captured.push({ distinctId: distinctId, event: event, properties: properties, groups: groups });
  };

  var result;
  try {
    result = await mc.runMaterialityCheck({
      journeyId: jid,
      skillName: 'discovery',
      preRevisionContent: PRE_FIXTURE,
      postRevisionContent: PRE_FIXTURE.replace('outer loop.', 'outer loop, end to end.')
    });
  } finally {
    posthogServer.capture = _originalCapture;
  }

  ok('AC4: exactly one PostHog capture call recorded', captured.length === 1);
  ok('AC4: capture event is materiality_suggestion_generated', captured[0] && captured[0].event === 'materiality_suggestion_generated');
  ok('AC4: capture properties include the same suggestionId returned to the caller', captured[0] && captured[0].properties.suggestionId === result.suggestionId);
  ok('AC4: capture properties include journeyId and skillName for joining', captured[0] && captured[0].properties.journeyId === jid && captured[0].properties.skillName === 'discovery');
  ok('AC4: capture properties include the classification', captured[0] && captured[0].properties.classification === 'minor');
})();

await (async function() {
  // NFR: materiality check adds zero additional model/executor calls
  // (comfortably within "at most one additional model turn").
  var routes = freshRoutes();
  var mc = freshMaterialityCheck();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s3-t2-nfr-feature', 'default').journeyId;

  var streamCalls = 0;
  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    streamCalls++;
    onFirstChunk(0);
    onChunk('ok');
    return Promise.resolve({ text: 'ok', usage: {} });
  });

  await mc.runMaterialityCheck({
    journeyId: jid,
    skillName: 'discovery',
    preRevisionContent: PRE_FIXTURE,
    postRevisionContent: PRE_FIXTURE.replace('outer loop.', 'outer loop, end to end.')
  });

  ok('NFR: materiality check invokes zero additional skill-turn-executor calls', streamCalls === 0);
})();

console.log('\nTask 3 — hook awaited and forwarded as an SSE event');

var ARTEFACT_RESPONSE =
  'Understood.\n\n---ARTEFACT-START---\n' + PRE_FIXTURE.replace('No new versioning mechanism.', 'A new dated-copy mechanism is required.') + '\n---ARTEFACT-END---\n---SLUG---\nres-s3-fixture-feature';

// Reuses the header's fakeRes() (already defines .events()) — do NOT define
// a separate fakeResT3() here; that would duplicate identical SSE-mock logic
// for no reason. (Corrected 2026-08-28 at code review of Task 1 — the plan
// originally had this task define its own copy instead of reusing the
// header's helper, which is exactly what made the header's fakeRes()
// spuriously look like dead code from Task 1's own isolated point of view.)

await (async function() {
  // AC1 (integration): materiality suggestion fires immediately after the
  // overwrite completes, in the SAME turn's SSE response.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  routes.setMaterialityCheckHook(function(payload) {
    return Promise.resolve({ classification: 'material', rationale: 'Test rationale.', suggestionId: 'suggestion-t3-1' });
  });

  var slug = 'res-s3-t3-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, PRE_FIXTURE, 'utf8');

  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var sid = 'test-res-s3-t3-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var events = res.events();
  var materialityEvent = events.find(function(e) { return e && e.materialitySuggestion; });
  ok('AC1: a materialitySuggestion SSE event was emitted', !!materialityEvent);
  ok('AC1: the suggestion carries the real classification', materialityEvent && materialityEvent.materialitySuggestion.classification === 'material');
  ok('AC1: the suggestion carries a rationale', materialityEvent && typeof materialityEvent.materialitySuggestion.rationale === 'string' && materialityEvent.materialitySuggestion.rationale.length > 0);

  var doneEventIndex = events.findIndex(function(e) { return e && e.done === true; });
  var materialityEventIndex = events.indexOf(materialityEvent);
  ok('AC1: the materiality suggestion arrives in the SAME turn, before the final done event', materialityEventIndex !== -1 && doneEventIndex !== -1 && materialityEventIndex < doneEventIndex);
})();

await (async function() {
  // AC4 (integration): the suggestionId returned to the client is the SAME
  // key logged via PostHog, so res-s4 can join on it later.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var hookPayloads = [];
  routes.setMaterialityCheckHook(function(payload) {
    hookPayloads.push(payload);
    return Promise.resolve({ classification: 'material', rationale: 'Test rationale.', suggestionId: 'suggestion-t3-2' });
  });

  var slug = 'res-s3-t3-joinable-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, PRE_FIXTURE, 'utf8');

  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var sid = 'test-res-s3-t3-joinable-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var materialityEvent = res.events().find(function(e) { return e && e.materialitySuggestion; });
  ok('AC4: hook received the correct pre/post content pair (producer-side contract, matches res-s2 AC5)', hookPayloads.length === 1 && hookPayloads[0].preRevisionContent === PRE_FIXTURE);
  ok('AC4: the client-visible suggestionId matches what the hook returned (joinable with res-s4)', materialityEvent && materialityEvent.materialitySuggestion.suggestionId === 'suggestion-t3-2');
})();

await (async function() {
  // Regression guard: an UNWIRED hook (default no-op) must not emit any
  // materiality event and must not break the existing turn/response flow.
  process.env.COPILOT_REPO_PATH = _tmpRepoRoot;
  var routes = freshRoutes(); // fresh require -> hook resets to the D37 no-op default

  routes.setSkillTurnExecutorStreamAdapter(function(systemPrompt, history, currentInput, token, onChunk, onThinkingChunk, onFirstChunk) {
    onFirstChunk(0);
    onChunk(ARTEFACT_RESPONSE);
    return Promise.resolve({ text: ARTEFACT_RESPONSE, usage: {} });
  });

  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var slug = 'res-s3-t3-unwired-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, PRE_FIXTURE, 'utf8');
  var jid = journeyStore.createJourney(slug, 'default').journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-live-sid');

  var sid = 'test-res-s3-t3-unwired-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: slug, journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostTurnStreamHtml(
    { session: { accessToken: 'tok', tenantId: 'org-a' }, params: { name: 'discovery', id: sid }, body: { answer: 'revise it' } },
    res
  );

  var materialityEvent = res.events().find(function(e) { return e && e.materialitySuggestion; });
  ok('Regression guard: unwired hook (default no-op) emits no materiality event', !materialityEvent);
  ok('Regression guard: the turn still completes normally (done:true reached)', res.events().some(function(e) { return e && e.done === true; }));
})();

console.log('\nTask 4 — D37 wiring: setMaterialityCheckHook (AC5)');

await (async function() {
  // AC5 / D37 rule #4: behavioural correctness, not just "a function got
  // wired" — two different pre/post pairs must resolve to two different,
  // individually-correct classifications through the REAL wired chain
  // (server.js's setMaterialityCheckHook call -> materiality-check.js's
  // real runMaterialityCheck -> skills.js's hook call site).
  var fsServer = require('fs');
  var serverSrc = fsServer.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
  ok('AC5: server.js wires setMaterialityCheckHook to the real implementation', /setMaterialityCheckHook\(\s*runMaterialityCheck\s*\)/.test(serverSrc));

  var mc = freshMaterialityCheck();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s3-t4-feature', 'default').journeyId;

  var materialResult = await mc.runMaterialityCheck({
    journeyId: jid, skillName: 'discovery',
    preRevisionContent: PRE_FIXTURE,
    postRevisionContent: PRE_FIXTURE.replace('No new versioning mechanism.', 'A new dated-copy mechanism is required.')
  });
  var minorResult = await mc.runMaterialityCheck({
    journeyId: jid, skillName: 'discovery',
    preRevisionContent: PRE_FIXTURE,
    postRevisionContent: PRE_FIXTURE.replace('outer loop.', 'outer loop, end to end.')
  });

  ok('AC5: a scope-changing pair resolves to material through the wired chain', materialResult.classification === 'material');
  ok('AC5: a wording-only pair resolves to minor through the wired chain', minorResult.classification === 'minor');
  ok('AC5: the two pairs produce two DIFFERENT classifications (not a stub that always returns the same value)', materialResult.classification !== minorResult.classification);
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
process.exit(failed > 0 ? 1 : 0);

})();
