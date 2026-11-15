'use strict';
// sps-s1 -- the login token is stored encrypted in Redis so a signed-in session survives a deploy.
// Plain Node script. Run: node tests/check-sps-s1-encrypted-session-token.js
// Story: artefacts/2026-11-16-session-persistence/stories/sps-s1-persist-login-across-deploys.md
// Test plan: artefacts/2026-11-16-session-persistence/test-plans/sps-s1-test-plan.md
//
// Uses the REAL session-redis adapter over a recording double of the @upstash/redis client (the adapter's own calls:
// client.set(key, string, { ex }), client.get(key), client.del(key), client.scan(cursor, { match, count })), the REAL
// sessionMiddleware, and the REAL authGuard. Keys and tokens here are random test values, never real secrets.

process.env.NODE_ENV = 'test';
const assert = require('assert');
const crypto = require('crypto');

const adapter = require('../src/web-ui/adapters/session-redis');
const session = require('../src/web-ui/middleware/session');
const { authGuard } = require('../src/web-ui/routes/auth');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const KEY_ENV = 'SESSION_ENCRYPTION_KEY';
const newKey = () => crypto.randomBytes(32).toString('base64');
const CANARY = 'gho_canary_' + crypto.randomBytes(8).toString('hex');

function makeClient() {
  const store = new Map(); const ttls = new Map(); const dels = [];
  return {
    store, ttls, dels,
    set: async (k, v, opts) => { store.set(k, v); ttls.set(k, opts && opts.ex); return 'OK'; },
    get: async (k) => (store.has(k) ? store.get(k) : null),
    del: async (k) => { dels.push(k); store.delete(k); return 1; },
    scan: async (_cursor, opts) => { const prefix = String(opts.match).replace('*', ''); return ['0', [...store.keys()].filter((k) => k.startsWith(prefix))]; }
  };
}
function setup(key) {
  const client = makeClient();
  adapter._setClientForTesting(client);
  if (key === null) { delete process.env[KEY_ENV]; } else { process.env[KEY_ENV] = key; }
  return client;
}
function teardown() { adapter._setClientForTesting(null); delete process.env[KEY_ENV]; session.setRedisAdapterForTesting(null); session._clearForTesting(); }

// Capture every console line so T8 can prove no secret is ever logged.
const logged = [];
const realConsole = { log: console.log, warn: console.warn, error: console.error, info: console.info };
function captureConsole() { ['log', 'warn', 'error', 'info'].forEach((m) => { console[m] = (...a) => { logged.push(a.map(String).join(' ')); }; }); }
function restoreConsole() { Object.assign(console, realConsole); }

test('T1 with a key the stored value has accessTokenEnc and no plaintext token (AC1)', async () => {
  const key = newKey(); const client = setup(key);
  try {
    await adapter.writeSession('sid1', { login: 'u', tenantId: 't' }, CANARY);
    const raw = client.store.get(adapter.KEY_PREFIX + 'sid1');
    assert.strictEqual(typeof raw, 'string', 'the adapter stores a JSON string');
    const stored = JSON.parse(raw);
    assert.ok(typeof stored.accessTokenEnc === 'string' && stored.accessTokenEnc.indexOf('v1.') === 0, 'accessTokenEnc with v1 prefix');
    assert.strictEqual(stored.accessToken, undefined, 'no plaintext accessToken key');
    assert.strictEqual(stored.login, 'u'); assert.strictEqual(stored.tenantId, 't');
    assert.ok(raw.indexOf(CANARY) === -1, 'the token text appears nowhere in the stored value');
    assert.strictEqual(client.ttls.get(adapter.KEY_PREFIX + 'sid1'), adapter.SESSION_TTL_SECONDS);
    await adapter.writeSession('sid1', { login: 'u', tenantId: 't' }, CANARY);
    assert.notStrictEqual(JSON.parse(client.store.get(adapter.KEY_PREFIX + 'sid1')).accessTokenEnc, stored.accessTokenEnc, 'a fresh nonce on every write');
  } finally { teardown(); }
});

test('T2 read and load-all restore the token and every other field (AC2)', async () => {
  const key = newKey(); setup(key);
  try {
    await adapter.writeSession('sid2', { login: 'octocat', userId: 42, tenantId: 't' }, CANARY);
    const one = await adapter.readSession('sid2');
    assert.strictEqual(one.accessToken, CANARY); assert.strictEqual(one.login, 'octocat'); assert.strictEqual(one.userId, 42);
    assert.strictEqual(one.accessTokenEnc, undefined, 'the ciphertext field is not exposed on read');
    const all = await adapter.loadAllSessions();
    const entry = all.find((e) => e.id === 'sid2');
    assert.ok(entry); assert.strictEqual(entry.data.accessToken, CANARY); assert.strictEqual(entry.data.accessTokenEnc, undefined);
  } finally { teardown(); }
});

test('T3 a ciphertext moved to another session id yields no token (AC3)', async () => {
  const key = newKey(); const client = setup(key);
  try {
    await adapter.writeSession('sidA', { login: 'a' }, CANARY);
    client.store.set(adapter.KEY_PREFIX + 'sidB', client.store.get(adapter.KEY_PREFIX + 'sidA'));
    const b = await adapter.readSession('sidB');
    assert.strictEqual(b.accessToken, undefined, 'bound to the session id');
    assert.strictEqual(b.login, 'a', 'other fields still restored');
  } finally { teardown(); }
});

test('T4 wrong key, corruption, tampering, unknown version and bad key length yield no token and never throw (AC4)', async () => {
  const key = newKey(); const client = setup(key);
  try {
    await adapter.writeSession('sid4', { login: 'u' }, CANARY);
    const good = JSON.parse(client.store.get(adapter.KEY_PREFIX + 'sid4'));
    const parts = good.accessTokenEnc.split('.');
    const flip = (s) => (s[0] === 'A' ? 'B' : 'A') + s.slice(1);
    const variants = {
      corrupt: Object.assign({}, good, { accessTokenEnc: parts[0] + '.' + parts[1] + '.' + parts[2] + '.' + flip(parts[3]) }),
      truncated: Object.assign({}, good, { accessTokenEnc: good.accessTokenEnc.slice(0, 12) }),
      tamperedTag: Object.assign({}, good, { accessTokenEnc: parts[0] + '.' + parts[1] + '.' + flip(parts[2]) + '.' + parts[3] }),
      unknownVersion: Object.assign({}, good, { accessTokenEnc: 'v2.' + parts.slice(1).join('.') }),
      notAString: Object.assign({}, good, { accessTokenEnc: 12345 })
    };
    for (const name of Object.keys(variants)) {
      client.store.set(adapter.KEY_PREFIX + 'v-' + name, JSON.stringify(variants[name]));
      const r = await adapter.readSession('v-' + name);
      assert.strictEqual(r.accessToken, undefined, name + ' must yield no token'); assert.strictEqual(r.login, 'u', name + ' keeps other fields');
    }
    process.env[KEY_ENV] = newKey();
    assert.strictEqual((await adapter.readSession('sid4')).accessToken, undefined, 'a rotated or wrong key yields no token');
    for (const bad of [crypto.randomBytes(16).toString('base64'), '', 'not base64 !!']) {
      process.env[KEY_ENV] = bad;
      const r = await adapter.readSession('sid4');
      assert.strictEqual(r.accessToken, undefined, 'an invalid key (' + bad.length + ' chars) yields no token'); assert.strictEqual(r.login, 'u');
      await adapter.writeSession('sid4b', { login: 'u' }, CANARY);
      const raw = client.store.get(adapter.KEY_PREFIX + 'sid4b');
      assert.ok(raw.indexOf(CANARY) === -1 && raw.indexOf('accessTokenEnc') === -1, 'an invalid key never stores the token');
    }
    const all = await adapter.loadAllSessions();
    assert.ok(all.length >= 1, 'load-all does not throw or drop sessions');
  } finally { teardown(); }
});

test('T5 with no key the token is stripped as today and one warning is logged (AC5)', async () => {
  const client = setup(null);
  try {
    await adapter.writeSession('sid5', { login: 'u' }, CANARY);
    const raw = client.store.get(adapter.KEY_PREFIX + 'sid5');
    assert.ok(raw.indexOf(CANARY) === -1 && raw.indexOf('accessToken') === -1, 'neither accessToken nor accessTokenEnc is stored');
    assert.strictEqual(JSON.parse(raw).login, 'u');
    const lines = []; const log = { warn: (m) => lines.push(String(m)) };
    adapter.logKeyStatus(log); adapter.logKeyStatus(log);
    assert.strictEqual(lines.length, 1, 'exactly one warning line, even if asked twice');
    assert.ok(/SESSION_ENCRYPTION_KEY/.test(lines[0]), 'names the setting');
    process.env[KEY_ENV] = newKey();
    const quiet = []; adapter._resetKeyWarningForTesting(); adapter.logKeyStatus({ warn: (m) => quiet.push(m) });
    assert.strictEqual(quiet.length, 0, 'no warning when a valid key is set');
  } finally { teardown(); adapter._resetKeyWarningForTesting(); }
});

function makeRes() { const r = { statusCode: 0, headers: {}, ended: false }; r.setHeader = (k, v) => { r.headers[k] = v; }; r.writeHead = (s, h) => { r.statusCode = s; Object.assign(r.headers, h || {}); }; r.end = () => { r.ended = true; }; return r; }
async function loginThenRestart(client) {
  session._clearForTesting(); session.setRedisAdapterForTesting(adapter);
  const req1 = { headers: {} }; await session.sessionMiddleware(req1, makeRes());
  Object.assign(req1.session, { login: 'octocat', userId: 7, tenantId: 't1', accessToken: CANARY });
  await session.persistSession(req1.sessionId);
  session._clearForTesting(); // the process "restarts": the in-memory map is gone, only Redis remains
  const req2 = { headers: { cookie: 'session_id=' + req1.sessionId }, url: '/dashboard', method: 'GET' };
  const res2 = makeRes();
  await session.sessionMiddleware(req2, res2);
  return { id: req1.sessionId, req2, res2 };
}

test('T6a a session survives a simulated restart and the real authGuard lets it through, with a key (AC6)', async () => {
  const client = setup(newKey());
  try {
    const { req2, res2 } = await loginThenRestart(client);
    assert.strictEqual(req2.session.accessToken, CANARY, 'token restored from Redis');
    assert.strictEqual(req2.session.login, 'octocat');
    let reached = false;
    await authGuard(req2, res2, () => { reached = true; });
    assert.strictEqual(reached, true, 'authGuard let the signed-in request through');
    assert.ok(res2.statusCode !== 302, 'no redirect to sign in');
  } finally { teardown(); }
});

test('T6b with no key the restored session has no token and the real authGuard redirects (AC6)', async () => {
  const client = setup(null);
  try {
    const { req2, res2 } = await loginThenRestart(client);
    assert.strictEqual(req2.session.accessToken, undefined);
    assert.strictEqual(req2.session.login, 'octocat', 'identity is still restored, as today');
    let reached = false;
    await authGuard(req2, res2, () => { reached = true; });
    assert.strictEqual(reached, false, 'authGuard must not let a token-less session through');
    assert.strictEqual(res2.statusCode, 302);
  } finally { teardown(); }
});

test('T7 logout deletes the Redis key and the old cookie is then signed out (AC7)', async () => {
  const client = setup(newKey());
  try {
    const { id } = await loginThenRestart(client);
    assert.ok(client.store.has(adapter.KEY_PREFIX + id), 'the session is in Redis before logout');
    session.destroySession(id);
    await new Promise((r) => setImmediate(r));
    assert.ok(client.dels.indexOf(adapter.KEY_PREFIX + id) !== -1, 'Redis del called for the session key');
    assert.strictEqual(client.store.has(adapter.KEY_PREFIX + id), false);
    session._clearForTesting();
    const req = { headers: { cookie: 'session_id=' + id } }; await session.sessionMiddleware(req, makeRes());
    assert.notStrictEqual(req.sessionId, id, 'a fresh session, not the destroyed one');
    assert.strictEqual(req.session.accessToken, undefined);
  } finally { teardown(); }
});

test('T8 the token, the key and any ciphertext never appear in any log line (NFR)', async () => {
  const key = newKey(); const client = setup(key);
  captureConsole();
  try {
    await adapter.writeSession('sid8', { login: 'u' }, CANARY);
    const enc = JSON.parse(client.store.get(adapter.KEY_PREFIX + 'sid8')).accessTokenEnc;
    client.store.set(adapter.KEY_PREFIX + 'bad8', JSON.stringify({ login: 'u', accessTokenEnc: enc.slice(0, 20) }));
    await adapter.readSession('sid8'); await adapter.readSession('bad8'); await adapter.loadAllSessions();
    process.env[KEY_ENV] = 'x'; await adapter.writeSession('sid8b', {}, CANARY); adapter.logKeyStatus(console);
    restoreConsole();
    const text = logged.join('\n');
    for (const secret of [CANARY, key, Buffer.from(key, 'base64').toString('latin1'), enc, enc.split('.')[3]]) {
      assert.ok(secret && text.indexOf(secret) === -1, 'a secret appeared in the logs');
    }
  } finally { restoreConsole(); teardown(); adapter._resetKeyWarningForTesting(); }
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { restoreConsole(); failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[sps-s1-encrypted-session-token] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
