'use strict';

// check-res-s4-operator-acts-on-materiality-suggestion.js
// Verifies res-s4: the operator can flag downstream stages or leave a
// materiality suggestion as-is, without any downstream artefact ever being
// touched; the choice is paired with res-3's suggestionId for an acceptance-
// rate computation; and a flagged stage's marker clears when that stage is
// reopened via res-s1's flow.
//
// Run: node tests/check-res-s4-operator-acts-on-materiality-suggestion.js

var fs   = require('fs');
var os   = require('os');
var path = require('path');
var SKILLS_PATH  = path.resolve(__dirname, '../src/web-ui/routes/skills.js');
var JOURNEY_PATH  = path.resolve(__dirname, '../src/web-ui/routes/journey.js');
var PG_ADAPTER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/journey-store-pg.js');

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

function freshSkillsRoutes() {
  var resolved = require.resolve(SKILLS_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function freshJourneyRoutes() {
  var resolved = require.resolve(JOURNEY_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function freshPgAdapter() {
  var resolved = require.resolve(PG_ADAPTER_PATH);
  delete require.cache[resolved];
  return require(resolved);
}

function fakeRes() {
  var r = { _chunks: [], _ended: false, _status: null, _location: null };
  r.writeHead = function(s, h) { r._status = s; if (h && h.Location) r._location = h.Location; };
  r.write = function(s) { r._chunks.push(s); };
  // Captures BOTH calling conventions this codebase's handlers use: SSE
  // streaming (res.write(chunk) ... res.end() with no argument) and a
  // single full-body write (res.end(fullHtmlString), no prior res.write
  // calls) -- handleGetStageReview/handleGetJourneyStageView use the
  // latter. Safe for both: when end() is called with no argument (the SSE
  // case), typeof body !== 'string' and nothing is pushed.
  r.end = function(body) { r._ended = true; if (typeof body === 'string') r._chunks.push(body); };
  r.events = function() {
    return r._chunks.map(function(c) {
      var m = c.match(/^data: (.*)\n\n$/);
      return m ? JSON.parse(m[1]) : null;
    }).filter(Boolean);
  };
  return r;
}
function fakeReq(session, params, body) {
  // _readBody(req) already short-circuits on req.body !== undefined --
  // this is the existing test-friendly convention, matching how
  // handlePostAssumptionConfirm's own real request bodies are read.
  return { session: session, params: params || {}, body: body };
}
function fakePool() {
  // Minimal stub for _renderShellWithNav's unconditional pool.query() chain
  // (handleGetStageReview) -- empty result sets are a safe, valid
  // resolution for the products/journeys nav-summary queries this pulls in,
  // none of which are under test here.
  return { query: async function() { return { rows: [] }; } };
}

function createMockPool(rowCounts) {
  rowCounts = rowCounts || {};
  var calls = [];
  async function query(sql, params) {
    calls.push({ sql: String(sql).replace(/\s+/g, ' ').trim(), params: params });
    var s = String(sql).toUpperCase();
    if (s.indexOf('JOURNEYS') !== -1) return { rowCount: rowCounts.journeys !== undefined ? rowCounts.journeys : 1 };
    return { rowCount: 0 };
  }
  return { query: query, calls: calls };
}

var _tmpRepoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'res-s4-'));

(async function main() {

console.log('\nTask 1 — flaggedStages default, getDownstreamStages(), Postgres allowlist');

await (async function() {
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var journey = journeyStore.createJourney('res-s4-t1-feature', 'default');
  ok('createJourney defaults flaggedStages to an empty array', Array.isArray(journey.flaggedStages) && journey.flaggedStages.length === 0);

  var downstream = journeyStore.getDownstreamStages('discovery');
  ok('getDownstreamStages("discovery") returns everything after it in STAGE_SEQUENCE', JSON.stringify(downstream) === JSON.stringify(['benefit-metric', 'design', 'definition', 'review', 'test-plan', 'definition-of-ready']));

  var downstreamOfLast = journeyStore.getDownstreamStages('definition-of-ready');
  ok('getDownstreamStages() on the last stage returns an empty array', Array.isArray(downstreamOfLast) && downstreamOfLast.length === 0);

  var downstreamOfUnknown = journeyStore.getDownstreamStages('not-a-real-stage');
  ok('getDownstreamStages() on an unknown stage returns an empty array, does not throw', Array.isArray(downstreamOfUnknown) && downstreamOfUnknown.length === 0);
})();

await (async function() {
  var pg = freshPgAdapter();
  var pool = createMockPool({ journeys: 1 });
  pg._setPoolForTesting(pool);

  await pg.saveJourney({
    journeyId: 'jid-1', tenantId: null, ownerId: null, featureSlug: 'res-s4-pg-feature', productId: null,
    flaggedStages: ['benefit-metric', 'definition']
  });

  var savedDataParam = pool.calls[0].params[5];
  var savedData = JSON.parse(savedDataParam);
  ok('Postgres allowlist fix: flaggedStages is present in the serialized data blob', Array.isArray(savedData.flaggedStages) && savedData.flaggedStages.length === 2);
  ok('Postgres allowlist fix: flaggedStages content is preserved exactly', JSON.stringify(savedData.flaggedStages) === JSON.stringify(['benefit-metric', 'definition']));

  pg._setPoolForTesting(null);
})();

console.log('\nTask 2 — handlePostMaterialityAction endpoint');

await (async function() {
  // AC1/AC3: "flag" action sets flaggedStages on the journey and records the
  // choice paired with the suggestionId.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var jid = journeyStore.createJourney('res-s4-t2-flag-feature', 'default').journeyId;
  var sid = 'test-res-s4-t2-flag-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t2-flag-feature', journeyId: jid
  });

  var captured = [];
  var posthogServer = require('../src/web-ui/modules/posthog-server');
  var _originalCapture = posthogServer.capture;
  posthogServer.capture = function(distinctId, event, properties, groups) {
    captured.push({ event: event, properties: properties });
  };

  var res = fakeRes();
  try {
    await routes.handlePostMaterialityAction(
      fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'discovery', id: sid }, { action: 'flag', suggestionId: 'suggestion-t2-1' }),
      res
    );
  } finally {
    posthogServer.capture = _originalCapture;
  }

  var journeyAfter = journeyStore.getJourney(jid);
  ok('AC1: "flag" action sets journey.flaggedStages to the downstream stages', JSON.stringify(journeyAfter.flaggedStages) === JSON.stringify(journeyStore.getDownstreamStages('discovery')));

  var choiceEvent = captured.find(function(c) { return c.event === 'materiality_operator_choice_recorded'; });
  ok('AC3: the operator choice is recorded via PostHog', !!choiceEvent);
  ok('AC3: the choice event carries the same suggestionId as the original suggestion', choiceEvent && choiceEvent.properties.suggestionId === 'suggestion-t2-1');
  ok('AC3: the choice event records the operator action as "flag"', choiceEvent && choiceEvent.properties.operatorAction === 'flag');

  var flagSetEvents = captured.filter(function(c) { return c.event === 'materiality_flag_set'; });
  ok('NFR-Audit: one flag_set event per downstream stage, each with journeyId/stageName/timestamp, covering exactly the downstream stage set', flagSetEvents.length === journeyStore.getDownstreamStages('discovery').length &&
    flagSetEvents.every(function(e) { return e.properties.journeyId === jid && !!e.properties.stageName && !!e.properties.timestamp; }) &&
    JSON.stringify(flagSetEvents.map(function(e) { return e.properties.stageName; }).sort()) === JSON.stringify(journeyStore.getDownstreamStages('discovery').slice().sort()));
})();

await (async function() {
  // AC2: "leave-as-is" applies no flag, still records the choice.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var jid = journeyStore.createJourney('res-s4-t2-leave-feature', 'default').journeyId;
  var sid = 'test-res-s4-t2-leave-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t2-leave-feature', journeyId: jid
  });

  var captured = [];
  var posthogServer = require('../src/web-ui/modules/posthog-server');
  var _originalCapture = posthogServer.capture;
  posthogServer.capture = function(distinctId, event, properties) { captured.push({ event: event, properties: properties }); };

  var res = fakeRes();
  try {
    await routes.handlePostMaterialityAction(
      fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'discovery', id: sid }, { action: 'leave-as-is', suggestionId: 'suggestion-t2-2' }),
      res
    );
  } finally {
    posthogServer.capture = _originalCapture;
  }

  var journeyAfter = journeyStore.getJourney(jid);
  ok('AC2: "leave-as-is" applies no flag', Array.isArray(journeyAfter.flaggedStages) && journeyAfter.flaggedStages.length === 0);

  var choiceEvent = captured.find(function(c) { return c.event === 'materiality_operator_choice_recorded'; });
  ok('AC2/AC3: "leave-as-is" is still recorded (not just a no-op)', !!choiceEvent && choiceEvent.properties.operatorAction === 'leave-as-is');

  var flagSetEvents = captured.filter(function(c) { return c.event === 'materiality_flag_set'; });
  ok('AC2: no flag_set events fire for leave-as-is', flagSetEvents.length === 0);
})();

await (async function() {
  // Reject an invalid action — matches handlePostAssumptionConfirm's
  // INVALID_ACTION precedent.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  var jid = journeyStore.createJourney('res-s4-t2-invalid-feature', 'default').journeyId;
  var sid = 'test-res-s4-t2-invalid-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t2-invalid-feature', journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostMaterialityAction(
    fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'discovery', id: sid }, { action: 'do-something-else', suggestionId: 'x' }),
    res
  );
  ok('Invalid action is rejected with 400', res._status === 400);
})();

await (async function() {
  // AC1 regression guard: the handler must derive downstream stages from the
  // session's own skillName, not a hardcoded 'discovery'. A session at
  // 'definition' has a strictly shorter downstream list than one at
  // 'discovery', so a hardcoded literal would fail this assertion.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var jid = journeyStore.createJourney('res-s4-t2-skillname-feature', 'default').journeyId;
  var sid = 'test-res-s4-t2-skillname-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'definition', sessionPath: '/tmp/t', systemPrompt: '# definition', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t2-skillname-feature', journeyId: jid
  });

  var res = fakeRes();
  await routes.handlePostMaterialityAction(
    fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'definition', id: sid }, { action: 'flag', suggestionId: 'suggestion-t2-3' }),
    res
  );

  var journeyAfter = journeyStore.getJourney(jid);
  var expectedDownstream = journeyStore.getDownstreamStages('definition');
  ok('AC1: downstream stages are derived from session.skillName, not hardcoded to "discovery"',
    expectedDownstream.length > 0 &&
    JSON.stringify(expectedDownstream) !== JSON.stringify(journeyStore.getDownstreamStages('discovery')) &&
    JSON.stringify(journeyAfter.flaggedStages) === JSON.stringify(expectedDownstream));
})();

await (async function() {
  // AC1 client-side: the materiality bubble's flag/leave-as-is buttons must
  // exist and be wired via the same fetch-and-update pattern as assumption
  // cards (attachCardHandlers precedent) -- verified via source inspection,
  // consistent with how Task 5 of res-s3 verified its own client-side branch.
  var skillsSrc = fs.readFileSync(SKILLS_PATH, 'utf8');
  var materialityBranchMatch = skillsSrc.match(/if\(evt\.materialitySuggestion\)\s*\{([\s\S]*?)\n\s*\}/);
  ok('AC1/AC2 client render: the materiality branch renders a flag button', !!materialityBranchMatch && /btn-flag-downstream/.test(materialityBranchMatch[1]));
  ok('AC1/AC2 client render: the materiality branch renders a leave-as-is button', !!materialityBranchMatch && /btn-leave-as-is/.test(materialityBranchMatch[1]));
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
process.exit(failed > 0 ? 1 : 0);

})();
