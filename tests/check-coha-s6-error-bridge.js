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
