'use strict';
// coha-s6: alert-to-GitHub-issue bridge. Plain Node check script (npm test discovers tests/check-*.js).
//
// WARNING: COHA_S6_TEST_DATABASE_URL MUST point at a THROWAWAY database. The real-Postgres tests DROP TABLE
// production_error_issues, and P6/P7 boot server.js against it, which creates and migrates other tables.
// NEVER point it at staging or production. freshDb refuses a non-local host unless COHA_S6_ALLOW_REMOTE_DB=1.
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
// WARNING: THROWAWAY database only (tests DROP TABLE and boot server.js against it). Never staging or production.
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
    if (t.startsWith('UPDATE production_error_issues SET updated_at')) {
      const r = p.rows.get(params[0]);
      if (r && r.status === 'pending') { r.claimedMs = p.nowMs - 86400000; return { rows: [], rowCount: 1 }; }
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
  await expectRejected('u2028', body({ code: 'a\u2028b' }), {}, 400);
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
test('U1 a valid production body creates one issue with the code title and the production-error label', async () => {
  const ctx = makeCtx(); const payload = body();
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(ctx.adapter.created.length, 1);
  assert.strictEqual(ctx.adapter.created[0].title, payload.code);
  assert.deepStrictEqual(ctx.adapter.created[0].labels, ['production-error']);
  assert.deepStrictEqual(JSON.parse(res.body), { issue: 101 });
  const row = ctx.pool.rows.get(payload.posthog_issue_id);
  assert.deepStrictEqual([row.status, row.issue_number], ['created', 101]);
});
test('U2 the issue body holds only the fixed fields and the marker line', async () => {
  const ctx = makeCtx(); const payload = body({ extra: CANARY });
  await deliver(payload, ctx);
  const issue = ctx.adapter.created[0];
  assert.strictEqual(issue.body,
    'First seen: ' + payload.first_seen + '\nEnvironment: production\nPostHog: ' + payload.posthog_issue_url +
    '\n\nPostHog issue id: ' + payload.posthog_issue_id + '\n');
  assert.ok(issue.title.indexOf(CANARY) === -1 && issue.body.indexOf(CANARY) === -1);
});
test('U17b environment staging: 200, no issue, no row, its own log line', async () => {
  const ctx = makeCtx(); const res = await deliver(body({ environment: 'staging' }), ctx);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(ctx.adapter.created.length, 0); assert.strictEqual(ctx.pool.rows.size, 0);
  assert.deepStrictEqual(ctx.lines, ['error-bridge: ignored staging']);
});
test('U18 environment empty or absent: 200, no issue, no row, a different log line', async () => {
  for (const payload of [body({ environment: '' }), (() => { const b = body(); delete b.environment; return b; })()]) {
    const ctx = makeCtx(); const res = await deliver(payload, ctx);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(ctx.adapter.created.length, 0); assert.strictEqual(ctx.pool.rows.size, 0);
    assert.deepStrictEqual(ctx.lines, ['error-bridge: ignored environment missing']);
  }
});
test('U19 an unexpected environment value is ignored and not echoed in full', async () => {
  for (const v of ['Production', 'prod', 'x'.repeat(300)]) {
    const ctx = makeCtx(); const res = await deliver(body({ environment: v }), ctx);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(ctx.adapter.created.length, 0); assert.strictEqual(ctx.pool.rows.size, 0);
    assert.strictEqual(ctx.lines[0], 'error-bridge: ignored environment unexpected (length ' + v.length + ')');
  }
});

test('U5 a created duplicate: 200, adapter not called, row unchanged', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.pool.seed(payload.posthog_issue_id, { status: 'created', number: 7 });
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 200); assert.strictEqual(ctx.adapter.created.length, 0);
  assert.strictEqual(ctx.pool.rows.get(payload.posthog_issue_id).issue_number, 7);
});
test('U6 an in-flight duplicate (claimed 30 seconds ago): 200, adapter not called', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.pool.seed(payload.posthog_issue_id, { status: 'pending', agoSec: 30 });
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 200); assert.strictEqual(ctx.adapter.created.length, 0);
});
test('U7 stuck pending taken over, issue not on GitHub: one issue created, row created', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.pool.seed(payload.posthog_issue_id, { status: 'pending', agoSec: 180 });
  await deliver(payload, ctx);
  assert.strictEqual(ctx.adapter.found.length, 1);
  assert.strictEqual(ctx.adapter.found[0], 'PostHog issue id: ' + payload.posthog_issue_id);
  assert.strictEqual(ctx.adapter.created.length, 1);
  assert.deepStrictEqual([ctx.pool.rows.get(payload.posthog_issue_id).status, ctx.pool.rows.get(payload.posthog_issue_id).issue_number], ['created', 101]);
});
test('U8 stuck pending taken over, issue already on GitHub: no create, row created with its number', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.pool.seed(payload.posthog_issue_id, { status: 'pending', agoSec: 180 }); ctx.adapter._find = 42;
  await deliver(payload, ctx);
  assert.strictEqual(ctx.adapter.created.length, 0);
  assert.deepStrictEqual([ctx.pool.rows.get(payload.posthog_issue_id).status, ctx.pool.rows.get(payload.posthog_issue_id).issue_number], ['created', 42]);
});
test('U9 two concurrent takeovers of one stuck row create exactly one issue', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.pool.seed(payload.posthog_issue_id, { status: 'pending', agoSec: 180 });
  await Promise.all([deliver(payload, ctx), deliver(payload, ctx)]);
  assert.strictEqual(ctx.adapter.created.length, 1);
});
test('U9b two simultaneous first deliveries of a new id create exactly one issue', async () => {
  const ctx = makeCtx(); const payload = body();
  await Promise.all([deliver(payload, ctx), deliver(payload, ctx)]);
  assert.strictEqual(ctx.adapter.created.length, 1);
});

test('U20 GitHub failing gives 503 and the row is not created', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.adapter._fail = Object.assign(new Error('github status 500'), { name: 'GithubError' });
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503);
  assert.notStrictEqual(ctx.pool.rows.get(payload.posthog_issue_id).status, 'created');
});
test('U21 GitHub not answering gives 503 within the timeout plus a margin', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.adapter.createIssue = () => new Promise(() => {});
  const t0 = Date.now(); const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503); assert.ok(Date.now() - t0 < 1000);
  assert.notStrictEqual(ctx.pool.rows.get(payload.posthog_issue_id).status, 'created');
});
test('U22 after a failure, a later delivery past the claim window opens exactly one issue', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.adapter._fail = new Error('boom');
  assert.strictEqual((await deliver(payload, ctx)).statusCode, 503);
  ctx.adapter._fail = null; ctx.pool.advance(180);
  assert.strictEqual((await deliver(payload, ctx)).statusCode, 200);
  assert.strictEqual(ctx.adapter.created.length, 1);
  assert.strictEqual(ctx.pool.rows.get(payload.posthog_issue_id).status, 'created');
});
test('U23 the unwired adapter stub throws the exact message', () => {
  const msg = 'Adapter not wired: error-bridge-github. Call setGithubIssueAdapter() with a real implementation before use.';
  assert.throws(() => bridge.unwiredGithubAdapter.createIssue({}), (e) => e.message === msg);
  assert.throws(() => bridge.unwiredGithubAdapter.findIssueByMarker('x'), (e) => e.message === msg);
});
test('U24 the handler with the stub gives 503, logs "not wired", stays alive and creates no row marked created', async () => {
  const ctx = makeCtx(); const payload = body(); delete ctx.deps.github;
  const res = await deliver(payload, ctx, { deps: { github: bridge.unwiredGithubAdapter } });
  assert.strictEqual(res.statusCode, 503);
  assert.ok(ctx.lines.join('\n').indexOf('Adapter not wired: error-bridge-github') !== -1);
  assert.notStrictEqual(ctx.pool.rows.get(payload.posthog_issue_id).status, 'created');
});

// Amendment: release the claim after a definite GitHub failure (not after a timeout or a store failure).
test('store: release makes the next claim a takeover, and never touches a created row', async () => {
  const pool = makeFakePool(); const id = newId();
  assert.strictEqual(await store.claim(pool, id, 120), 'claimed');
  await store.release(pool, id);
  assert.strictEqual(pool.rows.get(id).status, 'pending');
  assert.strictEqual(await store.claim(pool, id, 120), 'takeover');
  await store.markCreated(pool, id, 9);
  await store.release(pool, id);
  assert.deepStrictEqual([pool.rows.get(id).status, pool.rows.get(id).issue_number], ['created', 9]);
  assert.strictEqual(await store.claim(pool, id, 120), 'created');
});
test('U22b a definite GitHub error then an immediate retry (no clock advance) opens exactly one issue after a marker search', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.adapter._fail = Object.assign(new Error('github status 422'), { name: 'GithubError', definite: true });
  assert.strictEqual((await deliver(payload, ctx)).statusCode, 503);
  ctx.adapter._fail = null;
  assert.strictEqual((await deliver(payload, ctx)).statusCode, 200);
  assert.strictEqual(ctx.adapter.created.length, 1);
  assert.strictEqual(ctx.adapter.found.length, 1);
  assert.strictEqual(ctx.pool.rows.get(payload.posthog_issue_id).status, 'created');
});
test('U21b a timeout does not release the claim: an immediate retry is inflight and nothing is created twice', async () => {
  const ctx = makeCtx(); const payload = body(); let calls = 0; ctx.adapter.createIssue = () => { calls++; return new Promise(() => {}); };
  assert.strictEqual((await deliver(payload, ctx)).statusCode, 503);
  assert.ok(ctx.lines.join('\n').indexOf('github timeout for ' + payload.posthog_issue_id) !== -1);
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 200); assert.ok(/duplicate/.test(res.body));
  assert.strictEqual(calls, 1);
});
test('U20b markCreated failing after a successful create gives 503, keeps the row pending, and a retry is inflight', async () => {
  const ctx = makeCtx(); const payload = body(); const realQuery = ctx.pool.query; let thrown = false;
  ctx.pool.query = async (text, params) => {
    if (!thrown && text.replace(/\s+/g, ' ').trim().startsWith('UPDATE production_error_issues SET status')) { thrown = true; throw new Error('db down ' + CANARY); }
    return realQuery(text, params);
  };
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503);
  assert.strictEqual(ctx.lines.length, 1);
  assert.ok(ctx.lines[0].indexOf('created issue #101 but store update failed for ' + payload.posthog_issue_id) !== -1);
  assert.ok(ctx.lines[0].indexOf(CANARY) === -1);
  const row = ctx.pool.rows.get(payload.posthog_issue_id);
  assert.deepStrictEqual([row.status, row.issue_number], ['pending', null]);
  const retry = await deliver(payload, ctx);
  assert.strictEqual(retry.statusCode, 200); assert.strictEqual(ctx.adapter.created.length, 1);
});
test('a failing release is swallowed: still 503, one log line, and it says release failed', async () => {
  const ctx = makeCtx(); const payload = body(); const realQuery = ctx.pool.query;
  ctx.adapter._fail = Object.assign(new Error('github status 422'), { name: 'GithubError', definite: true });
  ctx.pool.query = async (text, params) => {
    if (text.replace(/\s+/g, ' ').trim().startsWith('UPDATE production_error_issues SET updated_at')) throw new Error('db down');
    return realQuery(text, params);
  };
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503);
  assert.strictEqual(ctx.lines.length, 1);
  assert.ok(ctx.lines[0].indexOf('release failed') !== -1);
});
test('the definite-failure log line holds only the PostHog issue id and the error name', async () => {
  const ctx = makeCtx(); const payload = body({ code: 'title-' + CANARY });
  ctx.adapter._fail = Object.assign(new Error('bad creds ' + TOKEN + ' ' + CANARY), { name: 'GithubError', definite: true });
  await deliver(payload, ctx);
  assert.strictEqual(ctx.lines.length, 1);
  const line = ctx.lines[0];
  assert.ok(line.indexOf(payload.posthog_issue_id) !== -1 && line.indexOf('GithubError') !== -1);
  assert.ok(line.indexOf('claim released') !== -1);
  [TOKEN, SECRET, CANARY].forEach((s) => assert.ok(line.indexOf(s) === -1, 'log leaks a secret or payload text'));
});

test('ambiguous create (issue made, then a 502-style error): claim kept, retry is inflight, no duplicate', async () => {
  const ctx = makeCtx(); const payload = body();
  ctx.adapter.createIssue = async (i) => { ctx.adapter.created.push(i); throw Object.assign(new Error('github status 502'), { name: 'GithubError' }); };
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503);
  assert.strictEqual(ctx.lines.length, 1);
  assert.ok(ctx.lines[0].indexOf('outcome unknown, claim kept') !== -1);
  const retry = await deliver(payload, ctx);
  assert.strictEqual(retry.statusCode, 200); assert.ok(/duplicate/.test(retry.body));
  assert.strictEqual(ctx.adapter.created.length, 1);
});
test('search-phase failure releases the claim, creates nothing, and the immediate retry creates exactly one issue', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.pool.seed(payload.posthog_issue_id, { status: 'pending', agoSec: 180 });
  ctx.adapter.findIssueByMarker = async () => { throw Object.assign(new Error('github status 500'), { name: 'GithubError' }); };
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503); assert.strictEqual(ctx.adapter.created.length, 0);
  assert.strictEqual(ctx.lines.length, 1); assert.ok(ctx.lines[0].indexOf('claim released') !== -1);
  ctx.adapter.findIssueByMarker = async () => null;
  assert.strictEqual((await deliver(payload, ctx)).statusCode, 200);
  assert.strictEqual(ctx.adapter.created.length, 1);
});
test('a create result with no integer number gives 503, row not created, claim kept', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.adapter.createIssue = async () => ({});
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503);
  assert.strictEqual(ctx.lines.length, 1); assert.ok(ctx.lines[0].indexOf('bad response') !== -1);
  assert.notStrictEqual(ctx.pool.rows.get(payload.posthog_issue_id).status, 'created');
  const retry = await deliver(payload, ctx);
  assert.strictEqual(retry.statusCode, 200); assert.ok(/duplicate/.test(retry.body));
});
test('a non-integer found number gives 503 with no create and no release', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.pool.seed(payload.posthog_issue_id, { status: 'pending', agoSec: 180 }); ctx.adapter._find = '12abc';
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503); assert.strictEqual(ctx.adapter.created.length, 0);
  assert.ok(ctx.lines[0].indexOf('bad response') !== -1);
  assert.strictEqual((await deliver(payload, ctx)).statusCode, 200);
  assert.strictEqual(ctx.adapter.created.length, 0);
});
test('a marker search resolving undefined is not "absent": 503, no create, claim kept', async () => {
  const ctx = makeCtx(); const payload = body(); ctx.pool.seed(payload.posthog_issue_id, { status: 'pending', agoSec: 180 });
  ctx.adapter.findIssueByMarker = async () => undefined;
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 503); assert.strictEqual(ctx.adapter.created.length, 0);
  assert.ok(ctx.lines[0].indexOf('bad response') !== -1);
  const retry = await deliver(payload, ctx);
  assert.strictEqual(retry.statusCode, 200); assert.ok(/duplicate/.test(retry.body));
  assert.strictEqual(ctx.adapter.created.length, 0);
});
test('the unwired adapter never releases the claim', async () => {
  const ctx = makeCtx(); const payload = body(); delete ctx.deps.github;
  ctx.pool.seed(payload.posthog_issue_id, { status: 'pending', agoSec: 180 });
  await deliver(payload, ctx, { deps: { github: bridge.unwiredGithubAdapter } });
  const row = ctx.pool.rows.get(payload.posthog_issue_id);
  assert.ok(ctx.pool.nowMs - row.claimedMs < 86400000 / 2, 'claim was released');
});

// NFR tests (N1 to N3; N4 is earlier in this file)
test('N1 a valid delivery answers within 2 seconds with fake adapters', async () => {
  const t0 = Date.now(); await deliver(body(), makeCtx()); assert.ok(Date.now() - t0 < 2000);
});
test('N2 no secret, token or payload canary appears in any log line', async () => {
  const ctx = makeCtx();
  const stuck = body(); ctx.pool.seed(stuck.posthog_issue_id, { status: 'pending', agoSec: 180 });
  const failing = makeCtx(); failing.adapter._fail = new Error('upstream said ' + TOKEN + ' ' + CANARY);
  const definite = makeCtx(); definite.adapter._fail = Object.assign(new Error('bad creds ' + TOKEN), { name: 'GithubError', definite: true });
  const timing = makeCtx(); timing.adapter.createIssue = () => new Promise(() => {});
  const cases = [
    [body({ extra: CANARY }), ctx, {}], [body({ environment: 'staging', extra: CANARY }), ctx, {}], [body({ environment: CANARY }), ctx, {}],
    [stuck, ctx, {}], [body({ code: '' }), ctx, {}], ['not json ' + CANARY, ctx, {}], [body(), ctx, { secret: SECRET + 'x' }],
    [body({ code: 'title-' + CANARY }), failing, {}], [body({ code: 'title-' + CANARY }), definite, {}], [body({ code: 'title-' + CANARY }), timing, {}]
  ];
  // Success, duplicate and recovery paths with the canary in the free-text fields.
  const ok = makeCtx(); const canaryFields = () => ({ code: 'title-' + CANARY, posthog_issue_url: 'https://us.posthog.com/project/x/' + CANARY });
  const dupSeeded = body(canaryFields()); ok.pool.seed(dupSeeded.posthog_issue_id, { status: 'created', number: 7 });
  const recov = body(canaryFields()); ok.pool.seed(recov.posthog_issue_id, { status: 'pending', agoSec: 180 });
  const takeCreate = body(canaryFields()); ok.pool.seed(takeCreate.posthog_issue_id, { status: 'pending', agoSec: 180 });
  const okFind = makeCtx(); okFind.adapter._find = 5;
  const recovOk = body(canaryFields()); okFind.pool.seed(recovOk.posthog_issue_id, { status: 'pending', agoSec: 180 });
  cases.push([body(canaryFields()), ok, {}], [dupSeeded, ok, {}], [recovOk, okFind, {}], [takeCreate, ok, {}]);
  for (const [p, c, o] of cases) await deliver(p, c, o);
  assert.ok(okFind.lines.length === 1 && okFind.lines[0].indexOf('recovered') !== -1, 'the recovery path ran');
  assert.ok(ok.lines.some((l) => l.indexOf('created issue') !== -1) && ok.lines.some((l) => l.indexOf('duplicate') !== -1), 'create and duplicate paths ran');
  const all = [ctx, failing, definite, timing, ok, okFind].reduce((acc, c) => acc.concat(c.lines), []);
  assert.ok(all.length >= cases.length, 'every case logged something');
  const joined = all.join('\n');
  [SECRET, TOKEN, CANARY].forEach((s) => assert.ok(joined.indexOf(s) === -1, 'a secret or canary was logged'));
});
test('N3 each outcome logs exactly one distinct line', async () => {
  const seen = new Set(); let cases = 0;
  async function once(payload, mutate, opts) {
    const ctx = makeCtx(); if (mutate) mutate(ctx, payload);
    await deliver(payload, ctx, opts); assert.strictEqual(ctx.lines.length, 1, 'one line per outcome'); seen.add(ctx.lines[0].replace(/[0-9a-f-]{36}|#\d+/g, 'X')); cases++;
  }
  await once(body());
  await once(body(), (c, p) => c.pool.seed(p.posthog_issue_id, { status: 'created', number: 1 }));
  await once(body({ environment: 'staging' }));
  await once(body({ environment: '' }));
  await once(body({ code: '' }));
  await once(body(), null, { secret: 'wrong' });
  await once(body(), (c) => { c.adapter._fail = new Error('x'); });
  await once(body(), (c) => { c.adapter._fail = Object.assign(new Error('x'), { name: 'GithubError', definite: true }); });
  await once(body(), (c) => { c.adapter.createIssue = () => new Promise(() => {}); });
  await once(body(), (c, p) => { c.pool.seed(p.posthog_issue_id, { status: 'pending', agoSec: 180 }); c.adapter._find = 5; });
  await once(body(), (c, p) => c.pool.seed(p.posthog_issue_id, { status: 'pending', agoSec: 30 }));
  assert.strictEqual(cases, 11);
  assert.strictEqual(seen.size, cases, 'every outcome has its own distinct line');
});

function startRawServer(handler) {
  const srv = http.createServer(handler);
  const conns = new Set();
  srv.on('connection', (s) => { conns.add(s); s.on('close', () => conns.delete(s)); });
  srv.stop = () => new Promise((r) => { conns.forEach((s) => s.destroy()); srv.close(() => r()); });
  return new Promise((resolve) => srv.listen(0, '127.0.0.1', () => { srv.base = 'http://127.0.0.1:' + srv.address().port; resolve(srv); }));
}
function adapterFor(base, extra) {
  const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
  return createGithubAdapter(Object.assign({ token: TOKEN, repo: 'o/r', apiBase: base }, extra || {}));
}
// Every error captured from the adapter is checked for a token leak: message, name, stack and every own property value.
function assertNoTokenLeak(e) {
  assert.ok(e instanceof Error, 'a rejection must be an Error');
  const seen = [e.message, e.name, e.stack].concat(Object.getOwnPropertyNames(e).map((k) => String(e[k])));
  seen.forEach((v) => assert.strictEqual(String(v).indexOf(TOKEN), -1, 'token leaked into an adapter error'));
  assert.strictEqual(JSON.stringify(seen).indexOf(TOKEN), -1);
}
const captureErr = (p) => p.then(() => { throw new Error('expected a rejection'); }, (e) => { assertNoTokenLeak(e); return e; });
const NEW_ISSUE = { title: 'T', body: 'B', labels: [] };

test('adapter: createIssue posts to /repos/<repo>/issues with the Bearer token, title, body and labels', async () => {
  const gh = await startFakeGithub();
  try {
    const a = adapterFor(gh.base);
    const out = await a.createIssue({ title: 'T', body: 'B', labels: ['production-error'] });
    assert.ok(Number.isInteger(out.number) && out.number > 0);
    assert.strictEqual(gh.calls[0].method, 'POST'); assert.strictEqual(gh.calls[0].path, '/repos/o/r/issues');
    assert.strictEqual(gh.calls[0].auth, 'Bearer ' + TOKEN);
    assert.deepStrictEqual(gh.calls[0].body, { title: 'T', body: 'B', labels: ['production-error'] });
  } finally { gh.srv.close(); }
});
test('adapter: findIssueByMarker lists labelled issues and returns the number whose body holds the marker line, else exactly null', async () => {
  const gh = await startFakeGithub();
  try {
    const a = adapterFor(gh.base);
    gh.listed = [{ number: 5, body: 'PostHog issue id: other' }, { number: 9, body: 'x\n\nPostHog issue id: abc\n' }];
    assert.strictEqual(await a.findIssueByMarker('PostHog issue id: abc'), 9);
    assert.strictEqual(await a.findIssueByMarker('PostHog issue id: nope'), null);
    assert.strictEqual(gh.calls[0].path, '/repos/o/r/issues?labels=production-error&state=all&per_page=100');
    assert.strictEqual(gh.calls[0].method, 'GET');
  } finally { gh.srv.close(); }
});
test('adapter: a 500 answer throws GithubError "github status 500", definite, with no token or response text in the message', async () => {
  const srv = await startRawServer((req, res) => { req.resume(); res.writeHead(500, { 'x-secret-header': TOKEN }); res.end('leak-' + TOKEN); });
  try {
    const e = await captureErr(adapterFor(srv.base).createIssue(NEW_ISSUE));
    assert.strictEqual(e.name, 'GithubError'); assert.strictEqual(e.message, 'github status 500'); assert.strictEqual(e.definite, true);
  } finally { await srv.stop(); }
});
test('adapter: a 404 answer is definite', async () => {
  const srv = await startRawServer((req, res) => { req.resume(); res.writeHead(404); res.end('{}'); });
  try {
    const e = await captureErr(adapterFor(srv.base).createIssue(NEW_ISSUE));
    assert.strictEqual(e.message, 'github status 404'); assert.strictEqual(e.definite, true);
  } finally { await srv.stop(); }
});
test('adapter: a 408 answer is ambiguous (definite is not true)', async () => {
  const srv = await startRawServer((req, res) => { req.resume(); res.writeHead(408); res.end('{}'); });
  try {
    const e = await captureErr(adapterFor(srv.base).createIssue(NEW_ISSUE));
    assert.strictEqual(e.name, 'GithubError'); assert.strictEqual(e.message, 'github status 408'); assert.notStrictEqual(e.definite, true);
  } finally { await srv.stop(); }
});
test('adapter: a socket destroyed after the request was read is a network error that is not definite', async () => {
  const srv = await startRawServer((req, res) => { req.on('data', () => {}); req.on('end', () => req.socket.destroy()); });
  try {
    const e = await captureErr(adapterFor(srv.base).createIssue(NEW_ISSUE));
    assert.notStrictEqual(e.definite, true); assert.notStrictEqual(e.name, 'GithubTimeout');
  } finally { await srv.stop(); }
});
test('adapter: a closed port (connection refused) is definite, keeps its code, and the message holds no URL or header', async () => {
  const srv = await startRawServer(() => {}); const base = srv.base; await srv.stop();
  const e = await captureErr(adapterFor(base).createIssue(NEW_ISSUE));
  assert.strictEqual(e.definite, true); assert.strictEqual(e.code, 'ECONNREFUSED');
  assert.ok(e.message.indexOf('127.0.0.1') === -1 && e.message.indexOf(TOKEN) === -1 && e.message.indexOf('Bearer') === -1);
});
test('adapter: a 2xx whose body is not JSON is "github bad response" and not definite', async () => {
  const srv = await startRawServer((req, res) => { req.resume(); res.writeHead(201); res.end('<html>not json'); });
  try {
    const e = await captureErr(adapterFor(srv.base).createIssue(NEW_ISSUE));
    assert.strictEqual(e.name, 'GithubError'); assert.strictEqual(e.message, 'github bad response'); assert.notStrictEqual(e.definite, true);
  } finally { await srv.stop(); }
});
test('adapter: a createIssue answer whose number is not an integer is "github bad response" and not definite', async () => {
  for (const bad of ['{"number":"7"}', '{"number":7.5}', '{"number":null}', '{}']) {
    const srv = await startRawServer((req, res) => { req.resume(); res.writeHead(201); res.end(bad); });
    try {
      const e = await captureErr(adapterFor(srv.base).createIssue(NEW_ISSUE));
      assert.strictEqual(e.name, 'GithubError', bad); assert.strictEqual(e.message, 'github bad response', bad); assert.notStrictEqual(e.definite, true, bad);
    } finally { await srv.stop(); }
  }
});
test('adapter: a server that never answers times out as GithubTimeout, not definite', async () => {
  const srv = await startRawServer((req) => { req.resume(); });
  try {
    const e = await captureErr(adapterFor(srv.base, { timeoutMs: 150 }).createIssue(NEW_ISSUE));
    assert.strictEqual(e.name, 'GithubTimeout'); assert.notStrictEqual(e.definite, true);
  } finally { await srv.stop(); }
});
test('adapter: findIssueByMarker throws (never null) when the look fails or the list is not an array', async () => {
  const srv500 = await startRawServer((req, res) => { req.resume(); res.writeHead(500); res.end('{}'); });
  const srvOdd = await startRawServer((req, res) => { req.resume(); res.writeHead(200); res.end('{"message":"x"}'); });
  const srvBad = await startRawServer((req, res) => { req.resume(); res.writeHead(200); res.end('nope'); });
  try {
    const e1 = await captureErr(adapterFor(srv500.base).findIssueByMarker('PostHog issue id: a'));
    assert.strictEqual(e1.message, 'github status 500');
    const e2 = await captureErr(adapterFor(srvOdd.base).findIssueByMarker('PostHog issue id: a'));
    assert.strictEqual(e2.message, 'github bad response');
    const e3 = await captureErr(adapterFor(srvBad.base).findIssueByMarker('PostHog issue id: a'));
    assert.strictEqual(e3.message, 'github bad response');
  } finally { await srv500.stop(); await srvOdd.stop(); await srvBad.stop(); }
});
test('adapter: marker match is an exact whole line (longer id and quoted line do not match; the real line does)', async () => {
  const gh = await startFakeGithub();
  try {
    const a = adapterFor(gh.base);
    gh.listed = [{ number: 11, body: 'PostHog issue id: abcdef' }, { number: 12, body: '> PostHog issue id: abc' }];
    assert.strictEqual(await a.findIssueByMarker('PostHog issue id: abc'), null);
    gh.listed.push({ number: 13, body: 'intro\r\nPostHog issue id: abc\r\nmore' });
    assert.strictEqual(await a.findIssueByMarker('PostHog issue id: abc'), 13);
  } finally { gh.srv.close(); }
});
test('adapter: a pull request carrying the marker line is never returned', async () => {
  const gh = await startFakeGithub();
  try {
    const a = adapterFor(gh.base);
    gh.listed = [{ number: 21, body: 'PostHog issue id: abc', pull_request: { url: 'x' } }];
    assert.strictEqual(await a.findIssueByMarker('PostHog issue id: abc'), null);
    gh.listed.push({ number: 22, body: 'PostHog issue id: abc' });
    assert.strictEqual(await a.findIssueByMarker('PostHog issue id: abc'), 22);
  } finally { gh.srv.close(); }
});
test('adapter: a 307 on createIssue is a definite status error and the redirect target gets zero requests', async () => {
  let hits = 0;
  const target = await startRawServer((req, res) => { hits++; req.resume(); res.writeHead(201); res.end('{"number":1}'); });
  const srv = await startRawServer((req, res) => { req.resume(); res.writeHead(307, { Location: target.base + '/repos/o/r/issues' }); res.end(); });
  try {
    const e = await captureErr(adapterFor(srv.base).createIssue(NEW_ISSUE));
    assert.strictEqual(e.name, 'GithubError'); assert.strictEqual(e.message, 'github status 307'); assert.strictEqual(e.definite, true);
    assert.strictEqual(hits, 0);
  } finally { await srv.stop(); await target.stop(); }
});
test('adapter: a 301 on the findIssueByMarker GET throws a status error and the redirect target gets zero requests', async () => {
  let hits = 0;
  const target = await startRawServer((req, res) => { hits++; req.resume(); res.writeHead(200); res.end('[]'); });
  const srv = await startRawServer((req, res) => { req.resume(); res.writeHead(301, { Location: target.base + '/x' }); res.end(); });
  try {
    const e = await captureErr(adapterFor(srv.base).findIssueByMarker('PostHog issue id: a'));
    assert.strictEqual(e.name, 'GithubError'); assert.strictEqual(e.message, 'github status 301');
    assert.strictEqual(hits, 0);
  } finally { await srv.stop(); await target.stop(); }
});
test('I1 the real handler behind a real HTTP server: 200, 401, 405, 413, 200 and exactly one GitHub request', async () => {
  const gh = await startFakeGithub();
  const ctx = makeCtx(); ctx.deps.github = adapterFor(gh.base);
  const srv = http.createServer((req, res) => bridge.handlePostErrorBridge(req, res, ctx.deps));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port; const H = { 'content-type': 'application/json', [HEADER]: SECRET };
  try {
    const payload = body();
    assert.strictEqual((await httpRequest(base, 'POST', '/webhook/error-alert', H, payload)).status, 200);
    assert.strictEqual((await httpRequest(base, 'POST', '/webhook/error-alert', Object.assign({}, H, { [HEADER]: 'wrong' }), body())).status, 401);
    assert.strictEqual((await httpRequest(base, 'GET', '/webhook/error-alert', H)).status, 405);
    assert.strictEqual((await httpRequest(base, 'POST', '/webhook/error-alert', H, JSON.stringify(body({ code: 'x'.repeat(20 * 1024) })))).status, 413);
    assert.strictEqual((await httpRequest(base, 'POST', '/webhook/error-alert', H, body({ environment: 'staging' }))).status, 200);
    const posts = gh.calls.filter((c) => c.method === 'POST');
    assert.strictEqual(posts.length, 1);
    assert.strictEqual(posts[0].path, '/repos/o/r/issues'); assert.strictEqual(posts[0].auth, 'Bearer ' + TOKEN);
    assert.strictEqual(posts[0].body.title, payload.code); assert.deepStrictEqual(posts[0].body.labels, ['production-error']);
  } finally { srv.close(); gh.srv.close(); }
});
test('I2 GitHub failing then succeeding: first 503, a later delivery past the window opens one issue', async () => {
  const gh = await startFakeGithub(); gh.mode = 'fail';
  const ctx = makeCtx(); ctx.deps.github = adapterFor(gh.base, { timeoutMs: 500 }); ctx.deps.githubTimeoutMs = 1000;
  const srv = http.createServer((req, res) => bridge.handlePostErrorBridge(req, res, ctx.deps));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port; const H = { 'content-type': 'application/json', [HEADER]: SECRET }; const payload = body();
  try {
    assert.strictEqual((await httpRequest(base, 'POST', '/webhook/error-alert', H, payload)).status, 503);
    gh.mode = 'ok'; gh.listed = []; ctx.pool.advance(180);
    assert.strictEqual((await httpRequest(base, 'POST', '/webhook/error-alert', H, payload)).status, 200);
    assert.strictEqual(gh.calls.filter((c) => c.method === 'POST' && c.body && c.body.title === payload.code).length >= 1, true);
    assert.strictEqual(ctx.pool.rows.get(payload.posthog_issue_id).status, 'created');
  } finally { srv.close(); gh.srv.close(); }
});
test('I2b a definite GitHub failure releases the claim: the immediate retry succeeds without advancing the clock', async () => {
  const gh = await startFakeGithub(); gh.mode = 'fail';
  const ctx = makeCtx(); ctx.deps.github = adapterFor(gh.base, { timeoutMs: 500 }); ctx.deps.githubTimeoutMs = 1000;
  const srv = http.createServer((req, res) => bridge.handlePostErrorBridge(req, res, ctx.deps));
  await new Promise((r) => srv.listen(0, '127.0.0.1', r));
  const base = 'http://127.0.0.1:' + srv.address().port; const H = { 'content-type': 'application/json', [HEADER]: SECRET }; const payload = body();
  try {
    assert.strictEqual((await httpRequest(base, 'POST', '/webhook/error-alert', H, payload)).status, 503);
    gh.mode = 'ok'; gh.listed = [];
    assert.strictEqual((await httpRequest(base, 'POST', '/webhook/error-alert', H, payload)).status, 200);
    assert.strictEqual(gh.calls.filter((c) => c.method === 'POST' && c.body && c.body.title === payload.code).length >= 1, true);
    assert.strictEqual(ctx.pool.rows.get(payload.posthog_issue_id).status, 'created');
  } finally { srv.close(); gh.srv.close(); }
});

// Wiring-time validation (Task 9 addition b): createGithubAdapter throws at construction on a bad configuration, so server.js
// keeps the D37 stub in place and the route answers 503 "not wired". No thrown message may contain the token.
function constructErr(opts) {
  const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
  try { createGithubAdapter(opts); } catch (e) { assertNoTokenLeak(e); return e; }
  throw new Error('expected createGithubAdapter to throw for ' + JSON.stringify(opts).split(TOKEN).join('<token>'));
}
test('adapter config: an invalid repo throws at construction and the message holds no token', () => {
  const bad = ['o/r/issues/1/comments?', 'o/r/../../../user', '../../orgs/x', 'o', 'o/', '/r', 'o/r?x=1', 'a/b/c', '../x', 'x/..', './x', 'x/.', '', 'o/r#f', 'o /r', 'o/r\n'];
  bad.forEach((repo) => { constructErr({ token: TOKEN, repo, apiBase: 'https://api.github.com' }); });
  constructErr({ token: TOKEN, apiBase: 'https://api.github.com' });
});
test('adapter config: apiBase must be https unless the host is 127.0.0.1 or localhost', () => {
  const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
  ['http://example.com', 'http://api.github.com', 'ftp://127.0.0.1', 'not a url', 'http://127.0.0.1.example.com'].forEach((apiBase) => { constructErr({ token: TOKEN, repo: 'o/r', apiBase }); });
  ['http://127.0.0.1:1234', 'http://localhost:1234', 'https://api.github.com', 'https://ghe.example.com/api/v3', undefined].forEach((apiBase) => {
    const a = createGithubAdapter({ token: TOKEN, repo: 'o/r', apiBase });
    assert.strictEqual(typeof a.createIssue, 'function'); assert.strictEqual(typeof a.findIssueByMarker, 'function');
  });
});
test('adapter config: apiBase with a query string, a fragment or userinfo throws; a path prefix (GitHub Enterprise /api/v3) is allowed', () => {
  const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
  ['https://api.github.com?x=1', 'https://api.github.com#f', 'https://u:p@api.github.com', 'https://u@api.github.com', 'https://:p@api.github.com',
    'https://ghe.example.com/api/v3?x=1', 'http://127.0.0.1:1234/#f', 'https://' + TOKEN + '@api.github.com', 'https://api.github.com?'].forEach((apiBase) => {
    const e = constructErr({ token: TOKEN, repo: 'o/r', apiBase });
    assert.ok(/^invalid configuration: /.test(e.message), 'a fixed configuration message');
  });
  ['https://ghe.example.com/api/v3', 'https://ghe.example.com/api/v3/', 'http://127.0.0.1:1234/prefix'].forEach((apiBase) => { createGithubAdapter({ token: TOKEN, repo: 'o/r', apiBase }); });
});
test('adapter config: an empty or missing token throws; valid repos with dots, dashes and underscores are accepted', () => {
  const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
  constructErr({ token: '', repo: 'o/r', apiBase: 'https://api.github.com' });
  constructErr({ repo: 'o/r', apiBase: 'https://api.github.com' });
  ['o/r', 'my-org/my.repo', 'Org_1/repo-name_2', 'o/.github', 'o/r..x'].forEach((repo) => { createGithubAdapter({ token: TOKEN, repo }); });
});
test('adapter config: a thrown configuration message never contains the token, even when the token is put in the repo or apiBase', () => {
  constructErr({ token: TOKEN, repo: TOKEN + '/x/y', apiBase: 'https://api.github.com' });
  constructErr({ token: TOKEN, repo: 'o/r', apiBase: 'http://' + TOKEN + '.example.com' });
  constructErr({ token: TOKEN, repo: 'o/r', apiBase: 'not a url ' + TOKEN });
});

// ---- Task 9: production wiring in server.js (W1 always runs; P1 to P7 need COHA_S6_TEST_DATABASE_URL) ----
const { Pool } = DB_URL ? require('pg') : { Pool: null };
// True only for a parseable URL whose host is 127.0.0.1, localhost or ::1 (a throwaway local container).
function isLocalDbUrl(url) {
  let u;
  try { u = new URL(url); } catch (e) { return false; }
  return ['127.0.0.1', 'localhost', '[::1]', '::1'].indexOf(u.hostname) !== -1;
}
async function freshDb() {
  if (!isLocalDbUrl(DB_URL) && process.env.COHA_S6_ALLOW_REMOTE_DB !== '1') {
    throw new Error('refusing to DROP TABLE on a non-local database: COHA_S6_TEST_DATABASE_URL must be a throwaway local database (set COHA_S6_ALLOW_REMOTE_DB=1 to override)');
  }
  const pool = new Pool({ connectionString: DB_URL });
  await pool.query('DROP TABLE IF EXISTS production_error_issues');
  await store.ensureTable(pool);
  return pool;
}
function dbCtx(pool) { const c = makeCtx(); c.deps.pool = pool; return c; }

dbTest('P1 table creation is idempotent and the PostHog issue id is the primary key', async () => {
  const pool = await freshDb();
  try {
    await store.ensureTable(pool); await store.ensureTable(pool);
    const r = await pool.query(`SELECT count(*)::int AS n FROM information_schema.table_constraints WHERE table_name='production_error_issues' AND constraint_type='PRIMARY KEY'`);
    assert.strictEqual(r.rows[0].n, 1);
  } finally { await pool.end(); }
});
// Two concurrent deliveries of one id: both answer 200, exactly one body is {issue: N} (or, for a takeover that recovers,
// {issue: N, recovered: true} when allowRecovered) and the other is exactly {duplicate: true}. A wrong 503 fails here.
function assertOneIssueOneDuplicate(responses, allowRecovered) {
  assert.deepStrictEqual(responses.map((r) => r.statusCode), [200, 200], 'both deliveries answer 200');
  const bodies = responses.map((r) => JSON.parse(r.body));
  const isIssue = (b) => Number.isInteger(b.issue) && (JSON.stringify(b) === JSON.stringify({ issue: b.issue }) || (allowRecovered && JSON.stringify(b) === JSON.stringify({ issue: b.issue, recovered: true })));
  const isDup = (b) => JSON.stringify(b) === JSON.stringify({ duplicate: true });
  assert.strictEqual(bodies.filter(isIssue).length, 1, 'exactly one {issue: N}: ' + JSON.stringify(bodies));
  assert.strictEqual(bodies.filter(isDup).length, 1, 'exactly one {duplicate: true}: ' + JSON.stringify(bodies));
}
function assertDuplicate(res) {
  assert.strictEqual(res.statusCode, 200);
  assert.deepStrictEqual(JSON.parse(res.body), { duplicate: true });
}

// Always-run fake-pool twins of P2 and P3, so the HTTP-outcome assertions above are exercised without a database.
test('P2-fake two simultaneous deliveries of a new id: statuses 200 and 200, one {issue}, one {duplicate:true}', async () => {
  const ctx = makeCtx(); const payload = body();
  const responses = await Promise.all([deliver(payload, ctx), deliver(payload, ctx)]);
  assertOneIssueOneDuplicate(responses, false);
  assert.strictEqual(ctx.adapter.created.length, 1);
});
test('P3-fake a second handler call with a fresh context sharing the same pool is 200 {duplicate:true} and creates nothing', async () => {
  const ctx1 = makeCtx(); const payload = body();
  const first = await deliver(payload, ctx1);
  assert.strictEqual(first.statusCode, 200); assert.ok(Number.isInteger(JSON.parse(first.body).issue));
  const ctx2 = makeCtx(); ctx2.pool = ctx1.pool; ctx2.deps.pool = ctx1.pool;
  assertDuplicate(await deliver(payload, ctx2));
  assert.strictEqual(ctx2.adapter.created.length, 0);
});

dbTest('P2 two simultaneous deliveries open one issue', async () => {
  const pool = await freshDb(); const ctx = dbCtx(pool); const payload = body();
  try {
    const responses = await Promise.all([deliver(payload, ctx), deliver(payload, ctx)]);
    assertOneIssueOneDuplicate(responses, false);
    assert.strictEqual(ctx.adapter.created.length, 1);
    assert.strictEqual((await pool.query('SELECT status FROM production_error_issues WHERE posthog_issue_id=$1', [payload.posthog_issue_id])).rows[0].status, 'created');
  } finally { await pool.end(); }
});
dbTest('P3 a restart between deliveries still treats the second as a duplicate', async () => {
  const payload = body();
  const pool1 = await freshDb();
  try {
    const first = await deliver(payload, dbCtx(pool1));
    assert.strictEqual(first.statusCode, 200); assert.ok(Number.isInteger(JSON.parse(first.body).issue));
  } finally { await pool1.end(); }
  const pool2 = new Pool({ connectionString: DB_URL }); const ctx2 = dbCtx(pool2);
  try {
    assertDuplicate(await deliver(payload, ctx2));
    assert.strictEqual(ctx2.adapter.created.length, 0);
  } finally { await pool2.end(); }
});
dbTest('P4 a stuck pending row older than the window is taken over exactly once', async () => {
  const pool = await freshDb(); const ctx = dbCtx(pool); const payload = body();
  try {
    await pool.query(`INSERT INTO production_error_issues (posthog_issue_id, status, claimed_at) VALUES ($1,'pending', now() - interval '3 minutes')`, [payload.posthog_issue_id]);
    const responses = await Promise.all([deliver(payload, ctx), deliver(payload, ctx)]);
    assertOneIssueOneDuplicate(responses, true);
    assert.strictEqual(ctx.adapter.created.length, 1);
  } finally { await pool.end(); }
});
dbTest('P5 a failed GitHub call leaves the row recoverable and a later delivery opens one issue', async () => {
  const pool = await freshDb(); const ctx = dbCtx(pool); const payload = body();
  try {
    ctx.adapter._fail = new Error('boom'); assert.strictEqual((await deliver(payload, ctx)).statusCode, 503);
    ctx.adapter._fail = null;
    await pool.query(`UPDATE production_error_issues SET claimed_at = now() - interval '3 minutes' WHERE posthog_issue_id=$1`, [payload.posthog_issue_id]);
    const second = await deliver(payload, ctx);
    assert.strictEqual(second.statusCode, 200);
    assert.ok(Number.isInteger(JSON.parse(second.body).issue), 'the later delivery returns {issue: N}');
    assert.strictEqual(ctx.adapter.created.length, 1);
  } finally { await pool.end(); }
});
test('isLocalDbUrl accepts only 127.0.0.1, localhost and ::1; remote hosts and malformed URLs are refused', () => {
  assert.strictEqual(isLocalDbUrl('postgresql://postgres:pw@localhost:55432/coha'), true);
  assert.strictEqual(isLocalDbUrl('postgresql://postgres:pw@127.0.0.1:55432/coha'), true);
  assert.strictEqual(isLocalDbUrl('postgresql://postgres:pw@[::1]:55432/coha'), true);
  assert.strictEqual(isLocalDbUrl('postgresql://u:p@wuce-db.fly.dev:5432/app'), false);
  assert.strictEqual(isLocalDbUrl('postgresql://u:p@ep-cool-name-123.us-east-2.aws.neon.tech/neondb'), false);
  assert.strictEqual(isLocalDbUrl('not a url'), false);
  assert.strictEqual(isLocalDbUrl(undefined), false);
  assert.strictEqual(isLocalDbUrl('postgresql://u:p@127.0.0.1.example.com/app'), false);
});

// W1/P6/P7: the real startup path. server.js runs in a child process (never re-required in-process).
// REQUIRED_ENV: what validateRequiredEnvVars (src/web-ui/config/validate-env.js) needs, with dummy values.
const REQUIRED_ENV = { GITHUB_CLIENT_ID: 'coha-s6-dummy-client-id', GITHUB_CLIENT_SECRET: 'coha-s6-dummy-client-secret', SESSION_SECRET: 'coha-s6-dummy-session-secret-at-least-32-chars' };
// BOOT_ENV: NODE_ENV=test keeps only the server.js blocks guarded by `NODE_ENV !== 'test'` unwired (the outbound GitHub,
// PostHog and similar adapters). WIRE_SKILL_ADAPTERS=true runs the larger adapter block at server.js ~437 (local,
// in-process wiring with no outbound call at boot), which holds the `if (process.env.DATABASE_URL)` pool wiring where the
// error bridge is wired. The child env is built from scratch with no keys, so no real credential from this shell reaches it.
const BOOT_ENV = { NODE_ENV: 'test', WIRE_SKILL_ADAPTERS: 'true' };
function startServer(extraEnv) {
  const net = require('net'); const cp = require('child_process');
  return new Promise((resolve, reject) => {
    const probe = net.createServer(); probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port; probe.close(() => {
        const env = Object.assign({ PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, PORT: String(port) }, REQUIRED_ENV, BOOT_ENV, extraEnv);
        const child = cp.spawn(process.execPath, [path.join(__dirname, '..', 'src', 'web-ui', 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
        let out = ''; let started = false;
        const timer = setTimeout(() => { child.kill(); reject(new Error('server did not start within 30 s: ' + out.slice(-400))); }, 30000);
        const onData = (d) => { out += d; if (!started && /listening on port/.test(out)) { started = true; clearTimeout(timer); resolve({ child, base: 'http://127.0.0.1:' + port, output: () => out }); } };
        child.stdout.on('data', onData); child.stderr.on('data', onData);
        child.on('exit', (code) => { if (!started) { clearTimeout(timer); reject(new Error('server exited before listening (code ' + code + '): ' + out.slice(-400))); } });
        child.on('error', (err) => { if (!started) { clearTimeout(timer); reject(new Error('server child process failed to start: ' + (err && err.code ? err.code : 'error'))); } });
      });
    });
  });
}
// Graceful kill, then after a 5 s grace a hard kill (SIGKILL) with up to 5 more seconds to exit.
function stopServer(srv) {
  const exited = () => srv.child.exitCode !== null || srv.child.signalCode !== null;
  const waitExit = (ms) => new Promise((resolve) => {
    if (exited()) return resolve(true);
    const t = setTimeout(() => { srv.child.removeListener('exit', onExit); resolve(exited()); }, ms);
    function onExit() { clearTimeout(t); resolve(true); }
    srv.child.once('exit', onExit);
  });
  if (exited()) return Promise.resolve();
  srv.child.kill();
  return waitExit(5000).then((done) => {
    if (done) return undefined;
    try { srv.child.kill('SIGKILL'); } catch (e) { /* already gone */ }
    return waitExit(5000).then(() => undefined);
  });
}
async function waitFor(fn, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 100)); } return false; }

test('W1 the real startup path without a database registers /webhook/error-alert and reaches the handler (401, 405, 503 not wired, 200 staging)', async () => {
  const srv = await startServer({ ERROR_BRIDGE_SECRET: SECRET });
  try {
    const J = { 'content-type': 'application/json' };
    const wrongSecret = SECRET.slice(0, -1) + (SECRET.slice(-1) === 'a' ? 'b' : 'a');
    assert.strictEqual((await httpRequest(srv.base, 'POST', '/webhook/error-alert', Object.assign({ [HEADER]: wrongSecret }, J), body())).status, 401, 'wrong secret');
    assert.strictEqual((await httpRequest(srv.base, 'POST', '/webhook/error-alert', J, body())).status, 401, 'no secret header');
    const g = await httpRequest(srv.base, 'GET', '/webhook/error-alert', {});
    assert.strictEqual(g.status, 405); assert.strictEqual(g.headers.allow, 'POST');
    const ok = await httpRequest(srv.base, 'POST', '/webhook/error-alert', Object.assign({ [HEADER]: SECRET }, J), body());
    assert.strictEqual(ok.status, 503, 'no database: the store is not wired');
    assert.ok(await waitFor(() => /Adapter not wired: error-bridge-store/.test(srv.output()), 3000), 'the server logged the store "Adapter not wired" line');
    const st = await httpRequest(srv.base, 'POST', '/webhook/error-alert', Object.assign({ [HEADER]: SECRET }, J), body({ environment: 'staging' }));
    assert.strictEqual(st.status, 200); assert.deepStrictEqual(JSON.parse(st.body), { ignored: 'staging' });
    assert.strictEqual(srv.output().indexOf(SECRET), -1, 'the secret never appears in the server output');
  } finally { await stopServer(srv); }
});

dbTest('P6 the real startup path posts a valid payload and the fake GitHub API receives path, token, title, body and label', async () => {
  const gh = await startFakeGithub(); const pool = await freshDb(); await pool.end();
  const srv = await startServer({ DATABASE_URL: DB_URL, ERROR_BRIDGE_SECRET: SECRET, ERROR_BRIDGE_GITHUB_TOKEN: TOKEN, ERROR_BRIDGE_REPO: 'o/r', ERROR_BRIDGE_GITHUB_API_BASE: gh.base });
  try {
    assert.ok(await waitFor(() => srv.output().indexOf('Error bridge GitHub adapter wired') !== -1, 3000), 'the server logged that the GitHub adapter is wired');
    const payload = body();
    const r = await httpRequest(srv.base, 'POST', '/webhook/error-alert', { 'content-type': 'application/json', [HEADER]: SECRET }, payload);
    assert.strictEqual(r.status, 200);
    const post = gh.calls.find((c) => c.method === 'POST');
    assert.ok(post, 'the fake GitHub API received a POST');
    assert.strictEqual(post.path, '/repos/o/r/issues'); assert.strictEqual(post.auth, 'Bearer ' + TOKEN);
    assert.strictEqual(post.body.title, payload.code); assert.deepStrictEqual(post.body.labels, ['production-error']);
    assert.ok(post.body.body.indexOf('PostHog issue id: ' + payload.posthog_issue_id) !== -1);
    assert.ok(srv.output().indexOf(SECRET) === -1 && srv.output().indexOf(TOKEN) === -1, 'no secret or token in the server output');
  } finally { await stopServer(srv); gh.srv.close(); }
});
dbTest('P7 two different PostHog issue ids through the real startup path give two different issues with their own titles and markers', async () => {
  const gh = await startFakeGithub(); const pool = await freshDb(); await pool.end();
  const srv = await startServer({ DATABASE_URL: DB_URL, ERROR_BRIDGE_SECRET: SECRET, ERROR_BRIDGE_GITHUB_TOKEN: TOKEN, ERROR_BRIDGE_REPO: 'o/r', ERROR_BRIDGE_GITHUB_API_BASE: gh.base });
  try {
    const a = body({ code: 'first_error_code' }); const b = body({ code: 'second_error_code' });
    for (const p of [a, b]) assert.strictEqual((await httpRequest(srv.base, 'POST', '/webhook/error-alert', { 'content-type': 'application/json', [HEADER]: SECRET }, p)).status, 200);
    const posts = gh.calls.filter((c) => c.method === 'POST');
    assert.strictEqual(posts.length, 2);
    assert.deepStrictEqual(posts.map((c) => c.body.title).sort(), ['first_error_code', 'second_error_code']);
    posts.forEach((c) => { const own = c.body.title === a.code ? a : b; assert.ok(c.body.body.indexOf('PostHog issue id: ' + own.posthog_issue_id) !== -1); });
  } finally { await stopServer(srv); gh.srv.close(); }
});

// RUNNER
(async () => {
  let passed = 0, failed = 0, skipped = 0;
  for (const t of tests) {
    if (t.skip) { skipped++; console.log('  SKIPPED (no COHA_S6_TEST_DATABASE_URL) ' + t.name); continue; }
    try { await t.fn(); passed++; console.log('  \u2713 ' + t.name); }
    catch (e) { failed++; console.log('  \u2717 ' + t.name + '\n      ' + (e && e.message)); }
  }
  console.log('[coha-s6-error-bridge] Results: ' + passed + ' passed, ' + failed + ' failed, ' + skipped + ' skipped (real-Postgres tests need COHA_S6_TEST_DATABASE_URL)');
  process.exit(failed ? 1 : 0);
})();
