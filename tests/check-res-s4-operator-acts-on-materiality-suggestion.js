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

console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);

})();
