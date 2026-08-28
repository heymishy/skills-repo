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

console.log('\nTask 3 — flag marker on both step-nav render sites');

await (async function() {
  var journeyRoute = freshJourneyRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(_tmpRepoRoot);
  journeyRoute.setGetHtmlSession(function() { return null; });

  var slug = 'res-s4-t3-feature';
  var journey = journeyStore.createJourney(slug, 'default');
  var jid = journey.journeyId;
  journeyStore.completeStage(jid, 'discovery', 'artefacts/' + slug + '/discovery.md', null, 'sid-discovery');
  journeyStore.completeStage(jid, 'benefit-metric', 'artefacts/' + slug + '/benefit-metric.md', null, 'sid-bm');
  journeyStore.setJourneyFields(jid, { flaggedStages: ['benefit-metric'] });

  var artefactAbsPath = path.join(_tmpRepoRoot, 'artefacts', slug, 'discovery.md');
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery', 'utf8');

  var res = fakeRes();
  await journeyRoute.handleGetJourneyStageView(
    fakeReq({ accessToken: 'tok' }, { journeyId: jid, stageName: 'discovery' }),
    res
  );

  var html = res._chunks.join('');
  ok('AC1: handleGetJourneyStageView renders a flag marker for the flagged stage', /sn-step--flagged/.test(html) && /May need review/.test(html));

  var flaggedStepMatch = html.match(/<li class="sn-step[^"]*sn-step--flagged[^"]*"[\s\S]*?<\/li>/);
  ok('Accessibility: the flag marker includes a text label, not colour alone', !!flaggedStepMatch && /May need review/.test(flaggedStepMatch[0]));
})();

await (async function() {
  // Same fixture, but exercising handleGetStageReview's independent render.
  var journeyRoute = freshJourneyRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(_tmpRepoRoot);

  var slug = 'res-s4-t3-review-feature';
  var journey = journeyStore.createJourney(slug, 'default');
  var jid = journey.journeyId;
  journeyStore.setJourneyFields(jid, { activeSkill: 'definition', activeSessionId: 'sid-active' });
  // Deliberately NOT 'review' -- a fixture flagging the stage that shares its
  // id with this route's own name ("stage review") would still pass even if
  // the implementation hardcoded isFlagged = (s.id === 'review') instead of
  // genuinely reading journey.flaggedStages. 'test-plan' is thematically
  // unrelated to this route, so the marker can only appear on it by actually
  // consulting the flaggedStages data.
  journeyStore.setJourneyFields(jid, { flaggedStages: ['test-plan'] });

  journeyRoute.setGetHtmlSession(function() {
    return { skillName: 'definition', done: true, artefactContent: '# Definition', turns: [] };
  });

  var res = fakeRes();
  await journeyRoute.handleGetStageReview(
    fakeReq({ accessToken: 'tok' }, { journeyId: jid }),
    res,
    fakePool()
  );

  var html = res._chunks.join('');

  // Per-stage isolation: extract each stage's own <li> (same technique as
  // the sibling handleGetJourneyStageView test's flaggedStepMatch above,
  // generalized to select by stage label so we can pinpoint two different
  // stages' <li> elements independently) and prove the marker tracks
  // journey.flaggedStages data rather than a hardcoded stage id -- both that
  // the flagged stage ('test-plan') carries it AND that a different, real,
  // non-flagged stage ('definition', this journey's own activeSkill) does
  // not. This specifically rules out the exact regression the code-quality
  // review identified -- isFlagged = (s.id === 'review'), a hardcode that
  // happens to match this route's own thematic name -- since 'review' is no
  // longer the flagged fixture id, and also rules out an "always flag" (or
  // a hardcode targeting any OTHER single id) regression via the negative
  // control on 'definition'. Note: no single-fixture test can distinguish
  // genuine data-driven flagging from a hardcode that coincidentally targets
  // the exact same id the fixture flags (isFlagged = (s.id === 'test-plan')
  // is pointwise identical to the real logic for this fixture) -- that
  // limitation is inherent to any one-scenario test, not specific to this
  // one, and was confirmed by mutation-testing both cases directly.
  var liRegex = /<li class="sn-step[^"]*">(?:(?!<li class="sn-step)[\s\S])*?<\/li>/g;
  var stepLis = html.match(liRegex) || [];
  var testPlanLi = stepLis.find(function(li) { return /sn-label">Test Plan<\/span>/.test(li); });
  var definitionLi = stepLis.find(function(li) { return /sn-label">Definition<\/span>/.test(li); });
  ok('AC1: handleGetStageReview ALSO renders a flag marker for the flagged stage (both render sites consistent), and NOT for a different real, non-flagged stage (negative control)',
    !!testPlanLi && /sn-step--flagged/.test(testPlanLi) && /May need review/.test(testPlanLi) &&
    !!definitionLi && !/sn-step--flagged/.test(definitionLi) && !/May need review/.test(definitionLi));
})();

console.log('\nTask 4 — flag clears on reopen (AC4)');

await (async function() {
  // Fresh-session-creation path: no live session exists yet.
  var journeyRoute = freshJourneyRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(_tmpRepoRoot);
  journeyRoute.setRegisterHtmlSession(function() {});
  journeyRoute.setLinkSessionToJourney(function() {});
  journeyRoute.setGetHtmlSession(function() { return null; });

  var slug = 'res-s4-t4-fresh-feature';
  var artefactRelPath = 'artefacts/' + slug + '/discovery.md';
  var artefactAbsPath = path.join(_tmpRepoRoot, artefactRelPath);
  fs.mkdirSync(path.dirname(artefactAbsPath), { recursive: true });
  fs.writeFileSync(artefactAbsPath, '# Discovery', 'utf8');

  var journey = journeyStore.createJourney(slug, 'default');
  var jid = journey.journeyId;
  journeyStore.completeStage(jid, 'discovery', artefactRelPath, null, 'old-sid');
  journeyStore.setJourneyFields(jid, { flaggedStages: ['discovery', 'benefit-metric'] });

  var res = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(
    fakeReq({ accessToken: 'tok' }, { journeyId: jid, skillName: 'discovery' }),
    res
  );

  var journeyAfter = journeyStore.getJourney(jid);
  ok('AC4: reopening a flagged stage (fresh-session path) clears its own flag', journeyAfter.flaggedStages.indexOf('discovery') === -1);
  ok('AC4 negative control: an UNRELATED flagged stage remains flagged', journeyAfter.flaggedStages.indexOf('benefit-metric') !== -1);
})();

await (async function() {
  // Early-return path: a live session ALREADY exists for the flagged stage.
  var journeyRoute = freshJourneyRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();
  journeyRoute.setJourneyStoreModule(journeyStore);
  journeyRoute.setRepoRoot(_tmpRepoRoot);
  journeyRoute.setGetHtmlSession(function(sid) { return sid === 'live-sid' ? { skillName: 'discovery' } : null; });

  var slug = 'res-s4-t4-existing-feature';
  var journey = journeyStore.createJourney(slug, 'default');
  var jid = journey.journeyId;
  journeyStore.completeStage(jid, 'discovery', 'artefacts/' + slug + '/discovery.md', null, 'live-sid');
  journeyStore.setJourneyFields(jid, { flaggedStages: ['discovery'] });

  var res = fakeRes();
  await journeyRoute.handleGetJourneyStageReopen(
    fakeReq({ accessToken: 'tok' }, { journeyId: jid, skillName: 'discovery' }),
    res
  );

  ok('AC4: the early-return (existing live session) path also redirects correctly', res._status === 303);
  var journeyAfter = journeyStore.getJourney(jid);
  ok('AC4: the flag clears on the early-return path too, not only the fresh-session path', journeyAfter.flaggedStages.indexOf('discovery') === -1);
})();

console.log('\nTask 5 (corrective) — third render site (F1) + flag-union fix (O1)');

await (async function() {
  // F1: skills.js's _renderChatPage is a THIRD step-nav render site, distinct
  // from journey.js's two (already covered above) -- the final cross-task
  // review found it had no flag-marker treatment at all.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var jid = journeyStore.createJourney('res-s4-t5-chatpage-feature', 'default').journeyId;
  journeyStore.setJourneyFields(jid, { flaggedStages: ['benefit-metric'] });
  var sid = 'test-res-s4-t5-chatpage-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t5-chatpage-feature', journeyId: jid
  });

  var res = fakeRes();
  await routes.handleGetChatHtml(fakeReq({ accessToken: 'tok' }, { name: 'discovery', id: sid }), res);

  var html = res._chunks.join('');
  ok('F1: the chat page\'s own step-nav strip (a third render site) shows the flag marker', /sn-step--flagged/.test(html) && /May need review/.test(html));

  var liRegex = /<li class="sn-step[^"]*">(?:(?!<li class="sn-step)[\s\S])*?<\/li>/g;
  var stepLis = html.match(liRegex) || [];
  var benefitLi = stepLis.find(function(li) { return /sn-label">Benefits<\/span>/.test(li); });
  var discoveryLi = stepLis.find(function(li) { return /sn-label">Discovery<\/span>/.test(li); });
  ok('F1: the marker tracks flaggedStages data (flagged stage carries it, active non-flagged stage does not)',
    !!benefitLi && /sn-step--flagged/.test(benefitLi) &&
    !!discoveryLi && !/sn-step--flagged/.test(discoveryLi));
})();

await (async function() {
  // O1: a second flag action from a LATER stage must not discard an earlier
  // stage's still-unresolved flags.
  var routes = freshSkillsRoutes();
  var journeyStore = require('../src/web-ui/modules/journey-store');
  journeyStore._clear();

  var jid = journeyStore.createJourney('res-s4-t5-union-feature', 'default').journeyId;
  var sid1 = 'test-res-s4-t5-union-a-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid1, {
    skillName: 'discovery', sessionPath: '/tmp/t', systemPrompt: '# discovery', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t5-union-feature', journeyId: jid
  });
  await routes.handlePostMaterialityAction(
    fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'discovery', id: sid1 }, { action: 'flag', suggestionId: 's-a' }),
    fakeRes()
  );

  var afterFirst = journeyStore.getJourney(jid).flaggedStages.slice();
  ok('O1 setup: first flag action (from discovery) sets the full downstream set', afterFirst.indexOf('benefit-metric') !== -1 && afterFirst.indexOf('definition-of-ready') !== -1);

  var sid2 = 'test-res-s4-t5-union-b-' + Math.random().toString(36).slice(2);
  routes._setHtmlSession(sid2, {
    skillName: 'definition-of-ready', sessionPath: '/tmp/t', systemPrompt: '# definition-of-ready', turns: [],
    artefactContent: null, artefactPath: null, done: false, featureSlug: 'res-s4-t5-union-feature', journeyId: jid
  });
  await routes.handlePostMaterialityAction(
    fakeReq({ accessToken: 'tok', tenantId: 'org-a' }, { name: 'definition-of-ready', id: sid2 }, { action: 'flag', suggestionId: 's-b' }),
    fakeRes()
  );

  var afterSecond = journeyStore.getJourney(jid).flaggedStages.slice();
  var expectedUnion = journeyStore.getDownstreamStages('discovery'); // definition-of-ready's own downstream is empty, so union == first call's set
  ok('O1: a second flag action from a LATER stage does NOT discard the first call\'s flags (union, not replace)',
    JSON.stringify(afterSecond.slice().sort()) === JSON.stringify(expectedUnion.slice().sort()));
})();

console.log('\n' + passed + ' passed, ' + failed + ' failed');
fs.rmSync(_tmpRepoRoot, { recursive: true, force: true });
process.exit(failed > 0 ? 1 : 0);

})();
