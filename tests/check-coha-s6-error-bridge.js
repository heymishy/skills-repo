'use strict';
// coha-s6: alert-to-GitHub-issue bridge. Plain Node check script (npm test discovers tests/check-*.js).
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');
const { Readable } = require('stream');

const bridge = require('../src/web-ui/routes/error-bridge');
const store = require('../src/web-ui/modules/error-bridge-store');

const FIXTURE = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'coha-s6-bridge-payload.json'), 'utf8'));
const SECRET = 'gen-secret-' + crypto.randomBytes(12).toString('hex');
const TOKEN = 'gen-token-' + crypto.randomBytes(12).toString('hex');
const CANARY = 'canary-' + crypto.randomBytes(8).toString('hex');
const DB_URL = process.env.COHA_S6_TEST_DATABASE_URL;
const HEADER = 'x-error-bridge-secret';

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
// Real-Postgres tests run only when COHA_S6_TEST_DATABASE_URL is set; otherwise they are counted as skipped, never as passed.
function dbTest(name, fn) { tests.push(DB_URL ? { name, fn } : { name, skip: true }); }

const newId = () => crypto.randomUUID();
const body = (over) => Object.assign({}, FIXTURE, { posthog_issue_id: newId() }, over || {});

function makeReq(payload, opts) {
  opts = opts || {};
  const buf = Buffer.isBuffer(payload) ? payload : Buffer.from(typeof payload === 'string' ? payload : JSON.stringify(payload));
  const req = Readable.from(buf.length ? [buf] : []);
  req.method = opts.method || 'POST';
  req.url = '/webhook/error-alert';
  req.headers = Object.assign({}, opts.secret === null ? {} : { [HEADER]: opts.secret || SECRET }, opts.headers || {});
  return req;
}

function makeRes() {
  const res = { statusCode: null, headers: {}, body: '' };
  res.done = new Promise((resolve) => { res._done = resolve; });
  res.setHeader = (k, v) => { res.headers[k.toLowerCase()] = v; };
  res.writeHead = (code, h) => { res.statusCode = code; Object.keys(h || {}).forEach((k) => { res.headers[k.toLowerCase()] = h[k]; }); };
  res.end = (b) => { res.body = b || ''; res._done(); };
  return res;
}

// In-memory stand-in for the few SQL shapes the store uses. The store's SQL must start with exactly these prefixes.
function makeFakePool() {
  const p = { rows: new Map(), nowMs: Date.now(), queries: [] };
  p.seed = (id, o) => { o = o || {}; p.rows.set(id, { status: o.status || 'pending', issue_number: o.number || null, claimedMs: p.nowMs - (o.agoSec || 0) * 1000 }); };
  p.advance = (sec) => { p.nowMs += sec * 1000; };
  p.query = async (text, params) => {
    const t = text.replace(/\s+/g, ' ').trim();
    p.queries.push(t);
    if (t.startsWith('CREATE TABLE')) return { rows: [], rowCount: 0 };
    if (t.startsWith('INSERT INTO production_error_issues')) {
      const id = params[0];
      if (p.rows.has(id)) return { rows: [], rowCount: 0 };
      p.rows.set(id, { status: 'pending', issue_number: null, claimedMs: p.nowMs });
      return { rows: [{ posthog_issue_id: id }], rowCount: 1 };
    }
    if (t.startsWith('UPDATE production_error_issues SET claimed_at')) {
      const r = p.rows.get(params[0]);
      if (r && r.status === 'pending' && p.nowMs - r.claimedMs > params[1] * 1000) { r.claimedMs = p.nowMs; return { rows: [{ posthog_issue_id: params[0] }], rowCount: 1 }; }
      return { rows: [], rowCount: 0 };
    }
    if (t.startsWith('UPDATE production_error_issues SET status')) {
      const r = p.rows.get(params[0]);
      if (r) { r.status = 'created'; r.issue_number = params[1]; }
      return { rows: [], rowCount: r ? 1 : 0 };
    }
    if (t.startsWith('SELECT status FROM production_error_issues')) {
      const r = p.rows.get(params[0]);
      return { rows: r ? [{ status: r.status }] : [], rowCount: r ? 1 : 0 };
    }
    throw new Error('fake pool: unexpected SQL: ' + t);
  };
  return p;
}

// Per-test context: fake pool, fake adapter, captured log lines.
function makeCtx() {
  const lines = [];
  const pool = makeFakePool();
  const adapter = { created: [], found: [], _find: null, _fail: null };
  adapter.createIssue = async (i) => { if (adapter._fail) throw adapter._fail; adapter.created.push(i); return { number: 100 + adapter.created.length }; };
  adapter.findIssueByMarker = async (m) => { adapter.found.push(m); return adapter._find; };
  return { lines, pool, adapter, deps: { log: (l) => lines.push(String(l)), pool, github: adapter, secret: SECRET, githubTimeoutMs: 200 } };
}

async function deliver(payload, ctx, opts) {
  const req = makeReq(payload, opts);
  const res = makeRes();
  await bridge.handlePostErrorBridge(req, res, Object.assign({}, ctx.deps, (opts && opts.deps) || {}));
  await res.done;
  return res;
}

// Local fake GitHub API: records method, path, Authorization and parsed JSON body.
function startFakeGithub() {
  const fake = { calls: [], mode: 'ok', listed: [] };
  fake.srv = http.createServer((req, res) => {
    let b = '';
    req.on('data', (c) => { b += c; });
    req.on('end', () => {
      fake.calls.push({ method: req.method, path: req.url, auth: req.headers.authorization, body: b ? JSON.parse(b) : null });
      if (fake.mode === 'fail') { res.writeHead(500); return res.end('{}'); }
      if (req.method === 'POST') { res.writeHead(201, { 'content-type': 'application/json' }); return res.end(JSON.stringify({ number: 700 + fake.calls.length })); }
      if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end(JSON.stringify(fake.listed)); }
      res.writeHead(404); res.end();
    });
  });
  return new Promise((resolve) => fake.srv.listen(0, '127.0.0.1', () => { fake.base = 'http://127.0.0.1:' + fake.srv.address().port; resolve(fake); }));
}

function httpRequest(base, method, pathname, headers, payload) {
  return new Promise((resolve, reject) => {
    const u = new URL(base + pathname);
    const req = http.request({ method, hostname: u.hostname, port: u.port, path: u.pathname, headers: headers || {} }, (res) => {
      let b = ''; res.on('data', (c) => { b += c; }); res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: b }));
    });
    req.on('error', reject);
    if (payload !== undefined) req.write(typeof payload === 'string' ? payload : JSON.stringify(payload));
    req.end();
  });
}

// ---- TESTS APPENDED BELOW THIS LINE (insert new tests above the RUNNER marker) ----

test('store: claim of a new id inserts a pending row and reports claimed', async () => {
  const pool = makeFakePool(); const id = newId();
  assert.strictEqual(await store.claim(pool, id, 120), 'claimed');
  assert.strictEqual(pool.rows.get(id).status, 'pending');
});
test('store: markCreated sets status created and the issue number', async () => {
  const pool = makeFakePool(); const id = newId();
  await store.claim(pool, id, 120); await store.markCreated(pool, id, 42);
  assert.deepStrictEqual([pool.rows.get(id).status, pool.rows.get(id).issue_number], ['created', 42]);
  assert.strictEqual(await store.claim(pool, id, 120), 'created');
});
test('store: ensureTable issues one CREATE TABLE IF NOT EXISTS with a primary key on the PostHog issue id', async () => {
  const pool = makeFakePool(); await store.ensureTable(pool);
  assert.ok(/CREATE TABLE IF NOT EXISTS production_error_issues/.test(pool.queries[0]));
  assert.ok(/posthog_issue_id VARCHAR PRIMARY KEY/.test(pool.queries[0]));
});

async function expectRejected(name, payload, opts, status) {
  const ctx = makeCtx();
  const res = await deliver(payload, ctx, opts);
  assert.strictEqual(res.statusCode, status, name + ': status');
  assert.strictEqual(ctx.pool.rows.size, 0, name + ': nothing inserted');
  assert.strictEqual(ctx.adapter.created.length, 0, name + ': adapter not called');
  return { res, ctx };
}

test('U10 missing secret header gives 401 with no hint', async () => {
  const { res } = await expectRejected('missing', body(), { secret: null }, 401);
  assert.ok(!/secret|header|length|mismatch/i.test(res.body));
});
test('U10b unset configured secret fails closed with 401', async () => {
  await expectRejected('unset', body(), { deps: { secret: '' } }, 401);
});
test('U11 wrong secret of the same length gives 401', async () => {
  await expectRejected('same-length', body(), { secret: SECRET.replace(/.$/, SECRET.endsWith('0') ? '1' : '0') }, 401);
});
test('U12 wrong secret of a different length gives 401 without throwing', async () => {
  await expectRejected('short', body(), { secret: 'x' }, 401);
  await expectRejected('long', body(), { secret: SECRET + SECRET }, 401);
});
test('U13 the comparison uses crypto.timingSafeEqual', async () => {
  const orig = crypto.timingSafeEqual; let calls = 0;
  crypto.timingSafeEqual = function () { calls++; return orig.apply(this, arguments); };
  try { await deliver(body({ environment: 'staging' }), makeCtx()); } finally { crypto.timingSafeEqual = orig; }
  assert.ok(calls >= 1);
});
test('U14 non-POST gives 405 with Allow: POST', async () => {
  const { res } = await expectRejected('get', '', { method: 'GET' }, 405);
  assert.strictEqual(res.headers.allow, 'POST');
});
test('U15 body over 16 KB gives 413 before parsing', async () => {
  const big = JSON.stringify(body({ code: 'x'.repeat(20 * 1024) }));
  const orig = JSON.parse; let parsedBig = false;
  JSON.parse = function (s) { if (typeof s === 'string' && s.length > 16 * 1024) parsedBig = true; return orig.apply(this, arguments); };
  try { await expectRejected('big', big, {}, 413); } finally { JSON.parse = orig; }
  assert.strictEqual(parsedBig, false);
});
[
  ['not json', 'this is not json'],
  ['json array', '[1,2,3]'],
  ['missing schema', JSON.stringify(Object.assign(body(), { schema: undefined }))],
  ['wrong schema', JSON.stringify(body({ schema: 'other/v9' }))],
  ['non-string field', JSON.stringify(body({ code: 12345 }))]
].forEach(([name, payload]) => {
  test('U16 malformed body gives 400: ' + name, async () => { await expectRejected(name, payload, {}, 400); });
});
test('U4 a PostHog link outside https://us.posthog.com/project/ gives 400', async () => {
  await expectRejected('url', body({ posthog_issue_url: 'https://evil.example/project/1' }), {}, 400);
  await expectRejected('url-newline', body({ posthog_issue_url: 'https://us.posthog.com/project/1\nx' }), {}, 400);
});
test('U3 an over-long or multiline code gives 400, never a cut title', async () => {
  await expectRejected('long', body({ code: 'a'.repeat(500) }), {}, 400);
  await expectRejected('multiline', body({ code: 'line1\nline2' }), {}, 400);
});
test('U3b a non-UUID issue id or an over-long first_seen gives 400', async () => {
  await expectRejected('id', body({ posthog_issue_id: '../x' }), {}, 400);
  await expectRejected('first_seen', body({ first_seen: 'z'.repeat(200) }), {}, 400);
});
test('N4 empty fields are named in the log without their values, and the response is 400', async () => {
  const { ctx } = await expectRejected('empty', body({ first_seen: '', code: '' }), {}, 400);
  const line = ctx.lines.join('\n');
  assert.ok(/code/.test(line) && /first_seen/.test(line));
});

test('U4b a PostHog link with markdown, a query string or other characters after the prefix gives 400; the fixture link passes', async () => {
  await expectRejected('md', body({ posthog_issue_url: 'https://us.posthog.com/project/1[click](https://evil.example)' }), {}, 400);
  await expectRejected('query', body({ posthog_issue_url: 'https://us.posthog.com/project/1/error_tracking/abc?x=1' }), {}, 400);
  const res = await deliver(body({ environment: 'staging' }), makeCtx());
  assert.strictEqual(res.statusCode, 200);
});
test('U3c first_seen must be a timestamp: mentions and markdown give 400; both timestamp forms pass the shape check', async () => {
  await expectRejected('mention', body({ first_seen: '@everyone [x](https://evil.example)' }), {}, 400);
  const a = await deliver(body({ environment: 'staging', first_seen: '2026-11-13T07:30:00.000Z' }), makeCtx());
  const b = await deliver(body({ environment: 'staging', first_seen: '2026-11-13 07:30:00' }), makeCtx());
  assert.strictEqual(a.statusCode, 200);
  assert.strictEqual(b.statusCode, 200);
});
test('U3d a code with a control character or a Unicode line separator gives 400', async () => {
  await expectRejected('u2028', body({ code: 'a b' }), {}, 400);
  await expectRejected('bell', body({ code: 'a\u0007b' }), {}, 400);
});
test('U17 early rejections 401 and 413 close the connection', async () => {
  const r401 = await expectRejected('401', body(), { secret: 'x' }, 401);
  assert.strictEqual(r401.res.headers.connection, 'close');
  const r413 = await expectRejected('413', JSON.stringify(body({ code: 'x'.repeat(20 * 1024) })), {}, 413);
  assert.strictEqual(r413.res.headers.connection, 'close');
});
test('U15b a declared Content-Length over 16 KB gives 413 before the body is read or parsed', async () => {
  const orig = JSON.parse; let parsed = false;
  JSON.parse = function (s) { if (typeof s === 'string' && s.indexOf('posthog_issue_id') !== -1) parsed = true; return orig.apply(this, arguments); };
  try {
    const { res } = await expectRejected('cl', body(), { headers: { 'content-length': '20000' } }, 413);
    assert.strictEqual(res.headers.connection, 'close');
  } finally { JSON.parse = orig; }
  assert.strictEqual(parsed, false);
});

// RUNNER
(async () => {
  let passed = 0, failed = 0, skipped = 0;
  for (const t of tests) {
    if (t.skip) { skipped++; console.log('  SKIPPED (no COHA_S6_TEST_DATABASE_URL) ' + t.name); continue; }
    try { await t.fn(); passed++; console.log('  ✓ ' + t.name); }
    catch (e) { failed++; console.log('  ✗ ' + t.name + '\n      ' + (e && e.message)); }
  }
  console.log('[coha-s6-error-bridge] Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped (real-Postgres tests need COHA_S6_TEST_DATABASE_URL)');
  process.exit(failed ? 1 : 0);
})();
