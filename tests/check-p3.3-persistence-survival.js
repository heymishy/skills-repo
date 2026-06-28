'use strict';

// check-p3.3-persistence-survival.js
// Verifies p3.3: restart-survival and concurrent-session isolation.
// Uses injectable stub adapters — no real DB or Redis connections.
//
// Run: node tests/check-p3.3-persistence-survival.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── stub adapters ─────────────────────────────────────────────────────────────

function makePgStub() {
  var _store = {};
  return {
    _store: _store,
    saveJourney: async function(journey) {
      var safe = Object.assign({}, journey);
      delete safe.accessToken;
      _store[journey.journeyId] = safe;
    },
    listJourneys: async function() {
      return Object.values(_store);
    }
  };
}

function makeRedisStub() {
  var _store = {};
  return {
    _store: _store,
    writeSession: async function(id, data) {
      var safe = Object.assign({}, data);
      delete safe.accessToken;
      _store[id] = safe;
    },
    deleteSession: async function(id) {
      delete _store[id];
    },
    loadAllSessions: async function() {
      return Object.keys(_store).map(function(k) { return { id: k, data: Object.assign({}, _store[k]) }; });
    }
  };
}

// ── load modules ──────────────────────────────────────────────────────────────

var journeyStore = require('../src/web-ui/modules/journey-store');
var session      = require('../src/web-ui/middleware/session');
var SESSION_TTL  = require('../src/web-ui/adapters/session-redis').SESSION_TTL_SECONDS;

// ── AC1: journey persists across simulated restart ────────────────────────────

console.log('\nAC1 — journey persists across simulated restart');
(async function() {
  journeyStore._clearForTesting();
  var pgStub = makePgStub();
  journeyStore.setPgAdapterForTesting(pgStub);

  var j = journeyStore.createJourney('ac1-feature');
  journeyStore.setJourneyFields(j.journeyId, { tenantId: 'org-a' });
  await new Promise(function(r) { setImmediate(r); });

  journeyStore._clearForTesting();
  ok('journey absent from memory before reload', !journeyStore.getJourney(j.journeyId));

  await journeyStore.loadAllFromPg();
  var reloaded = journeyStore.getJourney(j.journeyId);
  ok('journey reloaded from PG stub after restart',   !!reloaded);
  ok('featureSlug preserved across restart',          reloaded && reloaded.featureSlug === 'ac1-feature');
})().then(function() {

// ── AC2: journey field update persists ────────────────────────────────────────

console.log('\nAC2 — journey field update persists across simulated restart');
return (async function() {
  journeyStore._clearForTesting();
  var pgStub = makePgStub();
  journeyStore.setPgAdapterForTesting(pgStub);

  var j = journeyStore.createJourney('ac2-feature');
  journeyStore.setJourneyFields(j.journeyId, { completedStages: [{ skillName: 'discovery' }] });
  await new Promise(function(r) { setImmediate(r); });

  journeyStore._clearForTesting();
  await journeyStore.loadAllFromPg();

  var r2 = journeyStore.getJourney(j.journeyId);
  ok('journey reloaded',                !!r2);
  ok('completedStages preserved',       r2 && Array.isArray(r2.completedStages) && r2.completedStages.length === 1);
  ok('stage skillName is discovery',    r2 && r2.completedStages[0] && r2.completedStages[0].skillName === 'discovery');
})();

}).then(function() {

// ── AC3: session persists across simulated restart ────────────────────────────

console.log('\nAC3 — session persists across simulated restart');
return (async function() {
  session._clearForTesting();
  var redisStub = makeRedisStub();
  session.setRedisAdapterForTesting(redisStub);

  var r = session.createSession();
  Object.assign(r.session, { login: 'alice', tenantId: 'org-a' });
  session.persistSession(r.id);
  await new Promise(function(r2) { setImmediate(r2); });

  session._clearForTesting();
  ok('session absent before reload', !session.getSession(r.id));

  await session.loadSessionsFromRedis();
  var reloaded = session.getSession(r.id);
  ok('session reloaded from Redis stub after restart', !!reloaded);
  ok('tenantId preserved',                             reloaded && reloaded.tenantId === 'org-a');
})();

}).then(function() {

// ── AC4: accessToken absent from both PG and Redis ───────────────────────────

console.log('\nAC4 — accessToken absent from PG and Redis stub records');
return (async function() {
  journeyStore._clearForTesting();
  session._clearForTesting();
  var pgStub    = makePgStub();
  var redisStub = makeRedisStub();
  journeyStore.setPgAdapterForTesting(pgStub);
  session.setRedisAdapterForTesting(redisStub);

  var j = journeyStore.createJourney('ac4-feature');
  journeyStore.setJourneyFields(j.journeyId, { accessToken: 'should-never-land', tenantId: 'org-x' });
  await new Promise(function(r) { setImmediate(r); });

  var sr = session.createSession();
  Object.assign(sr.session, { accessToken: 'also-secret', login: 'user-x', tenantId: 'org-x' });
  session.persistSession(sr.id);
  await new Promise(function(r) { setImmediate(r); });

  var pgRow = pgStub._store[j.journeyId];
  ok('accessToken absent from PG journey row',    pgRow && pgRow.accessToken === undefined);
  var redisEntry = redisStub._store[sr.id];
  ok('accessToken absent from Redis session entry', redisEntry && redisEntry.accessToken === undefined);
})();

}).then(function() {

// ── AC5: concurrent tenant sessions do not share journey data ─────────────────

console.log('\nAC5 — two concurrent tenant sessions do not share journey data');
return (async function() {
  journeyStore._clearForTesting();
  var pgStub = makePgStub();
  journeyStore.setPgAdapterForTesting(pgStub);

  // Concurrent creates
  var [ja, jb] = await Promise.all([
    Promise.resolve(journeyStore.createJourney('feature-a')),
    Promise.resolve(journeyStore.createJourney('feature-b'))
  ]);
  journeyStore.setJourneyFields(ja.journeyId, { tenantId: 'tenant-a' });
  journeyStore.setJourneyFields(jb.journeyId, { tenantId: 'tenant-b' });
  await new Promise(function(r) { setImmediate(r); });

  var all = journeyStore.listJourneys();
  var forA = all.filter(function(j) { return j.tenantId === 'tenant-a'; });
  var forB = all.filter(function(j) { return j.tenantId === 'tenant-b'; });
  ok('tenant-a has exactly 1 journey',            forA.length === 1);
  ok('tenant-b has exactly 1 journey',            forB.length === 1);
  ok('tenant-a journey is the correct one',       forA[0] && forA[0].featureSlug === 'feature-a');
  ok('tenant-b journey is the correct one',       forB[0] && forB[0].featureSlug === 'feature-b');
  ok('tenant-a filter excludes tenant-b journey', !forA.find(function(j) { return j.tenantId === 'tenant-b'; }));
})();

}).then(function() {

// ── AC6: session TTL is 86400 ─────────────────────────────────────────────────

console.log('\nAC6 — session TTL constant is 86400 and key prefix is session:');
(function() {
  ok('SESSION_TTL_SECONDS is 86400',  SESSION_TTL === 86400);
  var KEY_PREFIX = require('../src/web-ui/adapters/session-redis').KEY_PREFIX;
  ok('KEY_PREFIX is "session:"',      KEY_PREFIX === 'session:');
})();

}).then(finish).catch(function(err) {
  console.error('Unexpected error:', err);
  failed++;
  finish();
});

function finish() {
  journeyStore._clearForTesting();
  journeyStore.setPgAdapterForTesting(null);
  session._clearForTesting();
  session.setRedisAdapterForTesting(null);
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
}
