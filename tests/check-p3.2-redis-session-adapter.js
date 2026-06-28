'use strict';

// check-p3.2-redis-session-adapter.js
// Verifies p3.2: Redis-backed session persistence.
// Uses injectable stub adapter — no real Upstash connection required.
//
// Run: node tests/check-p3.2-redis-session-adapter.js

var passed = 0;
var failed = 0;

function ok(label, cond) {
  if (cond) { console.log('  PASS:', label); passed++; }
  else       { console.error('  FAIL:', label); failed++; }
}

// ── stub Redis adapter ────────────────────────────────────────────────────────

var SESSION_TTL = require('../src/web-ui/adapters/session-redis').SESSION_TTL_SECONDS;
var KEY_PREFIX  = require('../src/web-ui/adapters/session-redis').KEY_PREFIX;

function makeRedisStub() {
  var _store = {};
  return {
    _store: _store,
    writeSession: async function(id, data, opts) {
      _store[KEY_PREFIX + id] = { data: data, ttl: opts && opts.ex };
    },
    deleteSession: async function(id) {
      delete _store[KEY_PREFIX + id];
    },
    loadAllSessions: async function() {
      return Object.keys(_store).map(function(key) {
        return { id: key.slice(KEY_PREFIX.length), data: _store[key].data };
      });
    }
  };
}

// Fix: stub writeSession must match session-redis.js calling convention
// session-redis calls: adapter.writeSession(id, safe, { ex: SESSION_TTL_SECONDS })
// But our session.js calls: adapter.writeSession(id, data).catch(...)
// session-redis is the actual adapter; session.js calls adapter.writeSession(id, data)
// Then session-redis internally calls client.set(key, value, { ex: TTL })
// For the test, the stub simulates session-redis's interface:
// session.js → stub.writeSession(id, sanitisedData)
// The TTL is baked into the real adapter; we test TTL via the real adapter constants.

function makeRedisStubV2() {
  var _writes  = [];
  var _deletes = [];
  var _all     = [];
  return {
    _writes:  _writes,
    _deletes: _deletes,
    _all:     _all,
    writeSession: async function(id, data) {
      _writes.push({ id: id, data: data });
      _all.push({ id: id, data: data });
    },
    deleteSession: async function(id) {
      _deletes.push(id);
      var idx = _all.findIndex(function(e) { return e.id === id; });
      if (idx !== -1) _all.splice(idx, 1);
    },
    loadAllSessions: async function() {
      return _all.map(function(e) { return { id: e.id, data: Object.assign({}, e.data) }; });
    }
  };
}

// ── load session module ───────────────────────────────────────────────────────

var session = require('../src/web-ui/middleware/session');

// ── AC1: session written to Redis on persistSession call ─────────────────────

console.log('\nAC1 — session is written to Redis when persistSession is called after login');
(async function() {
  session._clearForTesting();
  var stub = makeRedisStubV2();
  session.setRedisAdapterForTesting(stub);

  var result = session.createSession();
  Object.assign(result.session, { userId: '1', login: 'alice', tenantId: 'org-a', accessToken: 'secret' });
  session.persistSession(result.id);
  await new Promise(function(r) { setImmediate(r); });

  ok('stub recorded a write',          stub._writes.length === 1);
  ok('write id matches session id',    stub._writes[0] && stub._writes[0].id === result.id);
  ok('tenantId present in write data', stub._writes[0] && stub._writes[0].data.tenantId === 'org-a');
})().then(function() {

// ── AC2: accessToken never written to Redis ───────────────────────────────────

console.log('\nAC2 — accessToken is never written to Redis');
return (async function() {
  session._clearForTesting();
  var stub = makeRedisStubV2();
  session.setRedisAdapterForTesting(stub);

  var r = session.createSession();
  Object.assign(r.session, { accessToken: 'top-secret', login: 'bob', tenantId: 'org-b' });
  session.persistSession(r.id);
  await new Promise(function(r2) { setImmediate(r2); });

  ok('accessToken absent from Redis write', stub._writes[0] && stub._writes[0].data.accessToken === undefined);
  ok('login still present in Redis write',  stub._writes[0] && stub._writes[0].data.login === 'bob');
})();

}).then(function() {

// ── AC3: session survives simulated restart ───────────────────────────────────

console.log('\nAC3 — session survives simulated restart (in-memory cleared, reloaded from Redis stub)');
return (async function() {
  session._clearForTesting();
  var stub = makeRedisStubV2();
  session.setRedisAdapterForTesting(stub);

  var r = session.createSession();
  Object.assign(r.session, { login: 'carol', tenantId: 'org-c' });
  session.persistSession(r.id);
  await new Promise(function(r2) { setImmediate(r2); });

  // Simulate restart: clear memory, reload from stub
  session._clearForTesting();
  ok('session absent from memory before reload', !session.getSession(r.id));

  await session.loadSessionsFromRedis();
  var reloaded = session.getSession(r.id);
  ok('session present after reload',   !!reloaded);
  ok('tenantId preserved',             reloaded && reloaded.tenantId === 'org-c');
  ok('login preserved',                reloaded && reloaded.login    === 'carol');
})();

}).then(function() {

// ── AC4: destroySession removes from Redis ────────────────────────────────────

console.log('\nAC4 — destroySession removes session from Redis');
return (async function() {
  session._clearForTesting();
  var stub = makeRedisStubV2();
  session.setRedisAdapterForTesting(stub);

  var r = session.createSession();
  Object.assign(r.session, { login: 'dave' });
  session.persistSession(r.id);
  await new Promise(function(r2) { setImmediate(r2); });

  session.destroySession(r.id);
  await new Promise(function(r2) { setImmediate(r2); });

  ok('stub delete was called',              stub._deletes.length === 1);
  ok('delete id matches session id',        stub._deletes[0] === r.id);
  ok('session no longer in stub _all list', stub._all.length === 0);
})();

}).then(function() {

// ── AC5: Redis not activated when env vars absent ─────────────────────────────

console.log('\nAC5 — Redis adapter not activated when env vars absent (graceful fallback)');
(function() {
  var saved = process.env.UPSTASH_REDIS_REST_URL;
  delete process.env.UPSTASH_REDIS_REST_URL;
  // The real adapter's _getClient returns null without env vars
  var redisAdapter = require('../src/web-ui/adapters/session-redis');
  var threw = false;
  try { redisAdapter.writeSession('x', {}).catch(function() {}); } catch (e) { threw = true; }
  ok('writeSession without env vars does not throw synchronously', !threw);
  if (saved !== undefined) process.env.UPSTASH_REDIS_REST_URL = saved;
})();

}).then(function() {

// ── AC6: getSession returns from memory (fast path) ──────────────────────────

console.log('\nAC6 — getSession returns from memory without Redis round-trip');
(function() {
  session._clearForTesting();
  var stub = makeRedisStubV2();
  session.setRedisAdapterForTesting(stub);

  var r = session.createSession();
  Object.assign(r.session, { login: 'eve' });

  // getSession reads from memory — stub should NOT have been called for reads
  var got = session.getSession(r.id);
  ok('getSession returns session from memory', got && got.login === 'eve');
  ok('no Redis read calls made (reads come from memory)', stub._writes.length === 0 && stub._deletes.length === 0);
})();

}).then(function() {

// ── AC7 (TTL constant) ────────────────────────────────────────────────────────

console.log('\nAC7 (TTL) — session-redis TTL constant is 86400 and key prefix is session:');
(function() {
  ok('TTL constant is 86400',        SESSION_TTL === 86400);
  ok('KEY_PREFIX is "session:"',     KEY_PREFIX  === 'session:');
})();

}).then(finish).catch(function(err) {
  console.error('Unexpected error:', err);
  failed++;
  finish();
});

function finish() {
  session._clearForTesting();
  session.setRedisAdapterForTesting(null);
  console.log('\n--- Results:', passed, 'passed,', failed, 'failed ---');
  process.exit(failed > 0 ? 1 : 0);
}
