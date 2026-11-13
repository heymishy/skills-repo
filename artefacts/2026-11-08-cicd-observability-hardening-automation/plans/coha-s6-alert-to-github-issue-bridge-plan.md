# Alert-to-GitHub-issue bridge for new production error issues (coha-s6) — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the coha-s6 test plan pass: a PostHog webhook to `/webhook/error-alert` opens exactly one GitHub issue per new production error, safely, with no duplicates, using only fixed fields.
**Branch:** `feature/coha-s6-alert-to-github-issue-bridge`
**Worktree:** `C:\Users\Hamis\code\skills repo\.worktrees\coha-s6-alert-to-github-issue-bridge` (run every command from here; before the first Edit or Write of each turn confirm the absolute path contains `.worktrees\coha-s6-alert-to-github-issue-bridge`)
**Test command:** `node tests/check-coha-s6-error-bridge.js` (always-run tests); full suite `npm test`. Put Git Bash first on PATH before the full suite: PowerShell `$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH`. The suite has 5 known baseline failures (acknowledged 2026-11-14, `decisions.md`); the regression test is "no new failures".
**Story:** `artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s6-alert-to-github-issue-bridge.md`
**Test plan:** `artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s6-alert-to-github-issue-bridge-test-plan.md` (test names U1 to U24, I1, I2, P1 to P7, N1 to N4 below refer to it)
**DoR contract:** `artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s6-alert-to-github-issue-bridge-dor-contract.md`

## Rules that apply to every task

- Read `.github/architecture-guardrails.md` before Task 1 (ADR-012: the GitHub-specific code stays in the adapter file; the handler and store know nothing about GitHub URLs).
- Never touch `workspace/incidents.json`, `error-capture.js`, `posthog-config.js`, `posthog-server.js` or `routes/billing.js`. Follow `/webhook/stripe` in `server.js` as a pattern only.
- Never send traffic to the real GitHub or PostHog. Never print, log or write a real credential; tests use generated values.
- Never re-require `server.js` in a test process; start it in a child process.
- Do not edit `.github/pipeline-state.json` or `workspace/state.json` from the worktree. State is advanced on master by the orchestrator.
- Fixed decisions the plan makes where the story left a choice: secret header is `x-error-bridge-secret`; the marker line in the issue body is exactly `PostHog issue id: <uuid>`; a code over 120 characters or containing a newline gets 400 (not a cut title); an unset `ERROR_BRIDGE_SECRET` makes every request 401 (fail closed); the handler bounds each GitHub call with its own timeout (8 seconds by default) as well as the adapter's own HTTP timeout; the GitHub-side marker search lists the 100 most recent issues carrying the `production-error` label in any state (a known limit, recorded in the PR description).
- Model routing (from `.github/context.yml` policy): tasks 1, 2, 7, 10 `fast/cheap`; tasks 3, 4, 5, 6, 8 `balanced`; task 9 (production wiring and real-database tests) `balanced` with the orchestrator checking the `server.js` diff itself.

---

## File map

```
Create:
  src/web-ui/routes/error-bridge.js          — handler handlePostErrorBridge, injectable GitHub adapter (stub throws), store pool setter
  src/web-ui/modules/error-bridge-store.js   — production_error_issues table: ensureTable, claim, markCreated
  src/web-ui/modules/error-bridge-github.js  — real GitHub adapter createGithubAdapter (createIssue, findIssueByMarker)
  tests/check-coha-s6-error-bridge.js        — all 37 automated tests (30 always-run, 7 real-Postgres gated)
  tests/fixtures/coha-s6-bridge-payload.json — the rendered PostHog body from the reference fixture

Modify:
  src/web-ui/server.js                       — route registration, boot migration, pool and adapter wiring (Task 9 only)
  scripts/run-all-tests.js                   — only if Task 10's measurement shows the new file starves timing-sensitive tests
```

---

## Task 1: Fixture and test harness

**Files:**
- Create: `tests/fixtures/coha-s6-bridge-payload.json`
- Create: `tests/check-coha-s6-error-bridge.js` (harness only; no tests yet)

- [ ] **Step 1: Write the fixture file**

```json
{
  "schema": "coha-s6/v1",
  "posthog_issue_id": "00000000-0000-4000-8000-0000c0a56005",
  "code": "tenant_admin_bootstrap_failed",
  "environment": "production",
  "first_seen": "2026-11-13T07:30:00.000Z",
  "posthog_issue_url": "https://us.posthog.com/project/10908/error-tracking/00000000-0000-4000-8000-0000c0a56005"
}
```

- [ ] **Step 2: Write the harness (this exact content; tests are appended in later tasks above the `// RUNNER` marker)**

```javascript
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
```

- [ ] **Step 3: Run — must fail**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: `Error: Cannot find module '../src/web-ui/routes/error-bridge'` (the module does not exist yet).

- [ ] **Step 4: Commit the fixture and harness**

```powershell
git add tests/fixtures/coha-s6-bridge-payload.json tests/check-coha-s6-error-bridge.js
git commit -m "test: add coha-s6 bridge fixture and test harness"
```

(The pre-commit hooks may run the suite; a failing new file is expected until Task 3 creates the modules. If a hook blocks this commit, create empty `module.exports = {};` placeholders for the two modules in this task, commit, and replace them in Tasks 2 and 3.)

---

## Task 2: Store module (table, claim, mark created)

**Files:**
- Create: `src/web-ui/modules/error-bridge-store.js`
- Test: `tests/check-coha-s6-error-bridge.js`

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
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
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: module-not-found error for `error-bridge-store` (or, with the placeholder, `store.claim is not a function`).

- [ ] **Step 3: Write the implementation**

```javascript
'use strict';
// coha-s6: duplicate state for the alert-to-GitHub-issue bridge.
// A row per PostHog issue id. status is 'pending' (claimed, issue not yet confirmed) or 'created'.
// The primary key on posthog_issue_id is what makes two simultaneous deliveries unable to both claim.

const CLAIM_WINDOW_SECONDS = 120;

const TABLE_SQL = `CREATE TABLE IF NOT EXISTS production_error_issues (
  posthog_issue_id VARCHAR PRIMARY KEY,
  status           VARCHAR NOT NULL DEFAULT 'pending',
  issue_number     INTEGER,
  claimed_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
)`;

async function ensureTable(pool) {
  await pool.query(TABLE_SQL);
}

// Returns 'claimed' (this call owns creation), 'takeover' (a stuck pending row older than the window was taken over by
// this call alone), 'created' (already done) or 'inflight' (another delivery holds a live claim).
async function claim(pool, id, windowSeconds) {
  const win = typeof windowSeconds === 'number' ? windowSeconds : CLAIM_WINDOW_SECONDS;
  const ins = await pool.query(
    `INSERT INTO production_error_issues (posthog_issue_id, status, claimed_at) VALUES ($1, 'pending', now())
     ON CONFLICT (posthog_issue_id) DO NOTHING RETURNING posthog_issue_id`, [id]);
  if (ins.rowCount === 1) return 'claimed';
  const take = await pool.query(
    `UPDATE production_error_issues SET claimed_at = now(), updated_at = now()
     WHERE posthog_issue_id = $1 AND status = 'pending' AND claimed_at < now() - make_interval(secs => $2)
     RETURNING posthog_issue_id`, [id, win]);
  if (take.rowCount === 1) return 'takeover';
  const cur = await pool.query('SELECT status FROM production_error_issues WHERE posthog_issue_id = $1', [id]);
  return cur.rows[0] && cur.rows[0].status === 'created' ? 'created' : 'inflight';
}

async function markCreated(pool, id, issueNumber) {
  await pool.query(
    `UPDATE production_error_issues SET status = 'created', issue_number = $2, updated_at = now() WHERE posthog_issue_id = $1`,
    [id, issueNumber]);
}

module.exports = { CLAIM_WINDOW_SECONDS, TABLE_SQL, ensureTable, claim, markCreated };
```

- [ ] **Step 4: Run — must pass the three store tests**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: `3 passed, 0 failed, 0 skipped`.

- [ ] **Step 5: Commit**

```powershell
git add src/web-ui/modules/error-bridge-store.js tests/check-coha-s6-error-bridge.js
git commit -m "feat: add production_error_issues store for the error bridge"
```

---

## Task 3: Handler — method, secret, body limit, shape (AC3)

**Files:**
- Create: `src/web-ui/routes/error-bridge.js`
- Test: `tests/check-coha-s6-error-bridge.js` (U3, U4, U10 to U16, N4)

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
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
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: `Cannot find module '../src/web-ui/routes/error-bridge'` (or `handlePostErrorBridge is not a function`).

- [ ] **Step 3: Write the handler up to (not including) the claim step, plus the injectable setters and the throwing stub**

```javascript
'use strict';
// coha-s6: PostHog -> GitHub issue bridge. POST /webhook/error-alert.
// Pattern follows /webhook/stripe in server.js (native http, no body parser, own verification); nothing is copied from it.
const crypto = require('crypto');
const store = require('../modules/error-bridge-store');

const MAX_BODY_BYTES = 16 * 1024;
const SECRET_HEADER = 'x-error-bridge-secret';
const SCHEMA = 'coha-s6/v1';
const LABEL = 'production-error';
const POSTHOG_URL_PREFIX = 'https://us.posthog.com/project/';
const MAX_TITLE = 120;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FIELDS = ['code', 'environment', 'first_seen', 'posthog_issue_id', 'posthog_issue_url'];

// D37: the stub MUST throw. server.js wires the real adapter (Task 9).
const NOT_WIRED_GITHUB = 'Adapter not wired: error-bridge-github. Call setGithubIssueAdapter() with a real implementation before use.';
const unwiredGithubAdapter = {
  createIssue() { throw new Error(NOT_WIRED_GITHUB); },
  findIssueByMarker() { throw new Error(NOT_WIRED_GITHUB); }
};
let _github = unwiredGithubAdapter;
let _pool = null;
function setGithubIssueAdapter(adapter) { _github = adapter; }
function setStorePool(pool) { _pool = pool; }

function send(res, status, obj, headers) {
  res.writeHead(status, Object.assign({ 'Content-Type': 'application/json' }, headers || {}));
  res.end(JSON.stringify(obj));
}

function secretOk(provided, expected) {
  if (!expected || typeof provided !== 'string' || !provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) { crypto.timingSafeEqual(b, b); return false; }
  return crypto.timingSafeEqual(a, b);
}

function readBody(req, cap) {
  return new Promise((resolve) => {
    const chunks = [];
    let n = 0;
    let done = false;
    const finish = (r) => { if (done) return; done = true; req.removeListener('data', onData); resolve(r); };
    const onData = (c) => {
      const b = Buffer.isBuffer(c) ? c : Buffer.from(c);
      n += b.length;
      if (n > cap) { finish({ tooLarge: true }); req.resume(); return; }
      chunks.push(b);
    };
    req.on('data', onData);
    req.on('end', () => finish({ buf: Buffer.concat(chunks) }));
    req.on('error', () => finish({ buf: Buffer.alloc(0) }));
  });
}

function withTimeout(fn, ms) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(Object.assign(new Error('github timeout'), { name: 'GithubTimeout' })), ms);
    Promise.resolve().then(fn).then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}

// Only the "not wired" message is logged verbatim; any other error is logged by name so no upstream text or credential can leak.
function describe(e) {
  if (e && typeof e.message === 'string' && e.message.indexOf('Adapter not wired') === 0) return e.message;
  return (e && e.name) || 'error';
}

function buildBody(f, marker) {
  return 'First seen: ' + f.first_seen + '\nEnvironment: ' + f.environment + '\nPostHog: ' + f.posthog_issue_url + '\n\n' + marker + '\n';
}

async function handlePostErrorBridge(req, res, deps) {
  const d = Object.assign({
    log: (line) => console.log(line),
    secret: process.env.ERROR_BRIDGE_SECRET,
    github: _github,
    pool: _pool,
    githubTimeoutMs: 8000,
    claimWindowSeconds: store.CLAIM_WINDOW_SECONDS
  }, deps || {});
  const reject = (status, line) => { d.log('error-bridge: rejected ' + line); return send(res, status, { error: status === 413 ? 'payload too large' : 'bad request' }); };

  if (req.method !== 'POST') { d.log('error-bridge: rejected method'); return send(res, 405, { error: 'method not allowed' }, { Allow: 'POST' }); }
  if (!secretOk(req.headers && req.headers[SECRET_HEADER], d.secret)) {
    d.log(d.secret ? 'error-bridge: rejected unauthorised' : 'error-bridge: rejected secret not configured');
    return send(res, 401, { error: 'unauthorised' });
  }
  if (Number(req.headers['content-length']) > MAX_BODY_BYTES) { req.resume(); return reject(413, 'too large'); }
  const read = await readBody(req, MAX_BODY_BYTES);
  if (read.tooLarge) return reject(413, 'too large');

  let parsed;
  try { parsed = JSON.parse(read.buf.toString('utf8')); } catch (e) { return reject(400, 'not json'); }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return reject(400, 'shape');
  if (parsed.schema !== SCHEMA) return reject(400, 'schema');
  const nonString = FIELDS.filter((k) => parsed[k] !== undefined && typeof parsed[k] !== 'string');
  if (nonString.length) return reject(400, 'non-string fields: ' + nonString.join(','));
  const f = {};
  FIELDS.forEach((k) => { f[k] = parsed[k] === undefined ? '' : parsed[k]; });

  // ENVIRONMENT_GATE (Task 4 inserts the environment checks here, before the empty-field check below)

  const empty = FIELDS.filter((k) => f[k] === '');
  if (empty.length) return reject(400, 'empty fields: ' + empty.join(','));
  if (!UUID_RE.test(f.posthog_issue_id)) return reject(400, 'issue id');
  if (f.posthog_issue_url.indexOf(POSTHOG_URL_PREFIX) !== 0 || f.posthog_issue_url.length > 512 || /\s/.test(f.posthog_issue_url)) return reject(400, 'link');
  if (f.code.length > MAX_TITLE || /[\r\n]/.test(f.code)) return reject(400, 'code');
  if (f.first_seen.length > 64 || /[\r\n]/.test(f.first_seen)) return reject(400, 'first seen');

  // CLAIM_AND_CREATE (Tasks 4, 5 and 6 add the issue creation here)
  return send(res, 200, { ok: true });
}

module.exports = {
  handlePostErrorBridge, setGithubIssueAdapter, setStorePool, unwiredGithubAdapter,
  _internals: { LABEL, buildBody, withTimeout, describe, UUID_RE }
};
```

- [ ] **Step 4: Run — must pass**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: all U3, U3b, U4, U10 to U16, N4 and store tests pass; 0 failed.

- [ ] **Step 5: Commit**

```powershell
git add src/web-ui/routes/error-bridge.js tests/check-coha-s6-error-bridge.js
git commit -m "feat: add error bridge handler with auth, size and shape checks"
```

---

## Task 4: Environment gate and issue content (AC1, AC4)

**Files:**
- Modify: `src/web-ui/routes/error-bridge.js`
- Test: `tests/check-coha-s6-error-bridge.js` (U1, U2, U17, U18, U19)

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
test('U1 a valid production body creates one issue with the code title and the production-error label', async () => {
  const ctx = makeCtx(); const payload = body();
  const res = await deliver(payload, ctx);
  assert.strictEqual(res.statusCode, 200);
  assert.strictEqual(ctx.adapter.created.length, 1);
  assert.strictEqual(ctx.adapter.created[0].title, payload.code);
  assert.deepStrictEqual(ctx.adapter.created[0].labels, ['production-error']);
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
test('U17 environment staging: 200, no issue, no row, its own log line', async () => {
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
    assert.ok(/ignored environment unexpected/.test(ctx.lines[0]));
    assert.ok(ctx.lines[0].indexOf(v) === -1 || v.length < 20, 'a long value must not be echoed');
  }
});
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: U1, U2, U17, U18 and U19 fail (no issue is created; the gate does not exist).

- [ ] **Step 3: Implement. Replace the `ENVIRONMENT_GATE` comment line with:**

```javascript
  if (f.environment === '') { d.log('error-bridge: ignored environment missing'); return send(res, 200, { ignored: 'environment missing' }); }
  if (f.environment === 'staging') { d.log('error-bridge: ignored staging'); return send(res, 200, { ignored: 'staging' }); }
  if (f.environment !== 'production') {
    d.log('error-bridge: ignored environment unexpected (length ' + f.environment.length + ')');
    return send(res, 200, { ignored: 'environment' });
  }
```

Then replace the `CLAIM_AND_CREATE` comment and the final `return send(res, 200, { ok: true });` with the creation path below (duplicate handling and failures come in Tasks 5 and 6, but the claim call is needed now so the row exists):

```javascript
  const id = f.posthog_issue_id;
  const marker = 'PostHog issue id: ' + id;
  let outcome;
  try {
    if (!d.pool) throw new Error('Adapter not wired: error-bridge-store. Call setStorePool() with a real implementation before use.');
    outcome = await store.claim(d.pool, id, d.claimWindowSeconds);
  } catch (e) { d.log('error-bridge: store failed ' + describe(e)); return send(res, 503, { error: 'unavailable' }); }

  // DUPLICATES (Task 5 adds the created / in-flight early return here)

  try {
    // TAKEOVER (Task 5 adds the marker search here)
    const issue = await withTimeout(() => d.github.createIssue({ title: f.code, body: buildBody(f, marker), labels: [LABEL] }), d.githubTimeoutMs);
    await store.markCreated(d.pool, id, issue.number);
    d.log('error-bridge: created issue #' + issue.number + ' for ' + id);
    return send(res, 200, { issue: issue.number });
  } catch (e) {
    // FAILURE (Task 6 refines this)
    d.log('error-bridge: github failed ' + describe(e) + ' for ' + id);
    return send(res, 503, { error: 'upstream unavailable' });
  }
```

In the same file, make `buildBody`, `withTimeout` and `describe` reachable (they are already top-level functions, so nothing else changes).

- [ ] **Step 4: Run — must pass**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: 0 failed.

- [ ] **Step 5: Commit**

```powershell
git add src/web-ui/routes/error-bridge.js tests/check-coha-s6-error-bridge.js
git commit -m "feat: error bridge opens an issue for production errors only"
```

---

## Task 5: Duplicates, concurrency and stuck-pending takeover (AC2, fake pool)

**Files:**
- Modify: `src/web-ui/routes/error-bridge.js`
- Test: `tests/check-coha-s6-error-bridge.js` (U5 to U9)

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
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
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: U5, U6, U9, U9b fail (a second issue is created); U7 and U8 fail (no marker search).

- [ ] **Step 3: Implement. Replace the `DUPLICATES` comment line with:**

```javascript
  if (outcome === 'created' || outcome === 'inflight') {
    d.log('error-bridge: duplicate ' + id + ' (' + outcome + ')');
    return send(res, 200, { duplicate: true });
  }
```

Replace the `TAKEOVER` comment line (inside the `try`) with:

```javascript
    if (outcome === 'takeover') {
      const existing = await withTimeout(() => d.github.findIssueByMarker(marker), d.githubTimeoutMs);
      if (existing) {
        await store.markCreated(d.pool, id, existing);
        d.log('error-bridge: recovered issue #' + existing + ' for ' + id);
        return send(res, 200, { issue: existing, recovered: true });
      }
    }
```

- [ ] **Step 4: Run — must pass**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: 0 failed.

- [ ] **Step 5: Commit**

```powershell
git add src/web-ui/routes/error-bridge.js tests/check-coha-s6-error-bridge.js
git commit -m "feat: error bridge never opens a second issue for the same PostHog issue"
```

---

## Task 6: GitHub failure, timeout and the unwired adapter (AC5, AC8)

**Files:**
- Modify: `src/web-ui/routes/error-bridge.js` (comment cleanup only if the tests already pass)
- Test: `tests/check-coha-s6-error-bridge.js` (U20 to U24)

- [ ] **Step 1: Write the tests (insert above `// RUNNER`)**

```javascript
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
```

- [ ] **Step 2: Run**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: these tests should pass already, because Tasks 3 to 5 built the stub and the failure path. If any fails, fix the handler (not the test) until all five pass. This task exists so each acceptance criterion has a named, committed set of tests.

- [ ] **Step 3: Replace the `// FAILURE (Task 6 refines this)` comment with `// A failed or timed-out GitHub call leaves the row pending; a later delivery past the claim window takes it over.`**

- [ ] **Step 4: Run — must pass, then commit**

```powershell
node tests/check-coha-s6-error-bridge.js
git add src/web-ui/routes/error-bridge.js tests/check-coha-s6-error-bridge.js
git commit -m "test: cover GitHub failure, timeout and unwired adapter for the error bridge"
```

Expected: 0 failed.

---

## Task 7: NFR tests (N1 to N3)

**Files:**
- Test: `tests/check-coha-s6-error-bridge.js`

- [ ] **Step 1: Write the tests (insert above `// RUNNER`)**

```javascript
test('N1 a valid delivery answers within 2 seconds with fake adapters', async () => {
  const t0 = Date.now(); await deliver(body(), makeCtx()); assert.ok(Date.now() - t0 < 2000);
});
test('N2 no secret, token or payload canary appears in any log line', async () => {
  const ctx = makeCtx(); ctx.deps.log = (l) => ctx.lines.push(String(l));
  const stuck = body(); ctx.pool.seed(stuck.posthog_issue_id, { status: 'pending', agoSec: 180 });
  const failing = makeCtx(); failing.adapter._fail = new Error('upstream said ' + TOKEN);
  const cases = [
    [body({ extra: CANARY }), ctx, {}], [body({ environment: 'staging', extra: CANARY }), ctx, {}], [body({ environment: CANARY }), ctx, {}],
    [stuck, ctx, {}], [body({ code: '' }), ctx, {}], ['not json ' + CANARY, ctx, {}], [body(), ctx, { secret: SECRET + 'x' }],
    [body(), failing, {}]
  ];
  for (const [p, c, o] of cases) await deliver(p, c, o);
  const all = ctx.lines.concat(failing.lines).join('\n');
  [SECRET, TOKEN, CANARY].forEach((s) => assert.ok(all.indexOf(s) === -1, 'a secret or canary was logged'));
});
test('N3 each outcome logs exactly one distinct line', async () => {
  const seen = new Set();
  async function once(payload, mutate, opts) {
    const ctx = makeCtx(); if (mutate) mutate(ctx, payload);
    await deliver(payload, ctx, opts); assert.strictEqual(ctx.lines.length, 1, 'one line per outcome'); seen.add(ctx.lines[0].replace(/[0-9a-f-]{36}|#\d+/g, 'X'));
  }
  await once(body());
  await once(body(), (c, p) => c.pool.seed(p.posthog_issue_id, { status: 'created', number: 1 }));
  await once(body({ environment: 'staging' }));
  await once(body({ environment: '' }));
  await once(body({ code: '' }));
  await once(body(), null, { secret: 'wrong' });
  await once(body(), (c) => { c.adapter._fail = new Error('x'); });
  assert.strictEqual(seen.size, 7);
});
```

- [ ] **Step 2: Run, fix any real defect in the handler, then commit**

```powershell
node tests/check-coha-s6-error-bridge.js
git add tests/check-coha-s6-error-bridge.js
git commit -m "test: add performance, security and audit tests for the error bridge"
```

Expected: 0 failed. If N2 fails because a log line contains payload or secret text, fix the handler's logging, not the test.

---

## Task 8: Real GitHub adapter and the real-HTTP integration tests (AC1, AC3, AC4, AC5: I1, I2)

**Files:**
- Create: `src/web-ui/modules/error-bridge-github.js`
- Test: `tests/check-coha-s6-error-bridge.js` (I1, I2, adapter shape tests)

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
test('adapter: createIssue posts to /repos/<repo>/issues with the Bearer token, title, body and labels', async () => {
  const gh = await startFakeGithub();
  try {
    const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
    const a = createGithubAdapter({ token: TOKEN, repo: 'o/r', apiBase: gh.base });
    const out = await a.createIssue({ title: 'T', body: 'B', labels: ['production-error'] });
    assert.ok(out.number > 0);
    assert.strictEqual(gh.calls[0].method, 'POST'); assert.strictEqual(gh.calls[0].path, '/repos/o/r/issues');
    assert.strictEqual(gh.calls[0].auth, 'Bearer ' + TOKEN);
    assert.deepStrictEqual(gh.calls[0].body, { title: 'T', body: 'B', labels: ['production-error'] });
  } finally { gh.srv.close(); }
});
test('adapter: findIssueByMarker lists labelled issues and returns the number whose body holds the marker line', async () => {
  const gh = await startFakeGithub();
  try {
    const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
    const a = createGithubAdapter({ token: TOKEN, repo: 'o/r', apiBase: gh.base });
    gh.listed = [{ number: 5, body: 'PostHog issue id: other' }, { number: 9, body: 'x\n\nPostHog issue id: abc\n' }];
    assert.strictEqual(await a.findIssueByMarker('PostHog issue id: abc'), 9);
    assert.strictEqual(await a.findIssueByMarker('PostHog issue id: nope'), null);
    assert.ok(/^\/repos\/o\/r\/issues\?labels=production-error&state=all&per_page=100/.test(gh.calls[0].path));
  } finally { gh.srv.close(); }
});
test('adapter: a non-2xx answer throws an error whose message holds no token', async () => {
  const gh = await startFakeGithub(); gh.mode = 'fail';
  try {
    const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
    const a = createGithubAdapter({ token: TOKEN, repo: 'o/r', apiBase: gh.base });
    await assert.rejects(() => a.createIssue({ title: 'T', body: 'B', labels: [] }), (e) => e.message.indexOf(TOKEN) === -1 && /500/.test(e.message));
  } finally { gh.srv.close(); }
});
test('I1 the real handler behind a real HTTP server: 200, 401, 405, 413, 200 and exactly one GitHub request', async () => {
  const gh = await startFakeGithub();
  const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
  const ctx = makeCtx(); ctx.deps.github = createGithubAdapter({ token: TOKEN, repo: 'o/r', apiBase: gh.base });
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
  const { createGithubAdapter } = require('../src/web-ui/modules/error-bridge-github');
  const ctx = makeCtx(); ctx.deps.github = createGithubAdapter({ token: TOKEN, repo: 'o/r', apiBase: gh.base, timeoutMs: 500 }); ctx.deps.githubTimeoutMs = 1000;
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
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: `Cannot find module '../src/web-ui/modules/error-bridge-github'` in the adapter, I1 and I2 tests.

- [ ] **Step 3: Write the adapter**

```javascript
'use strict';
// coha-s6: the only file that knows GitHub's HTTP shape (ADR-012). The handler and store never see a URL.
const http = require('http');
const https = require('https');

const LABEL = 'production-error';

function createGithubAdapter(opts) {
  const token = opts.token;
  const repo = opts.repo; // "owner/name"
  const apiBase = (opts.apiBase || 'https://api.github.com').replace(/\/+$/, '');
  const timeoutMs = opts.timeoutMs || 8000;

  function call(method, pathname, payload) {
    return new Promise((resolve, reject) => {
      const u = new URL(apiBase + pathname);
      const data = payload === undefined ? null : Buffer.from(JSON.stringify(payload));
      const headers = {
        Authorization: 'Bearer ' + token,
        Accept: 'application/vnd.github+json',
        'User-Agent': 'skills-framework-error-bridge',
        'X-GitHub-Api-Version': '2022-11-28'
      };
      if (data) { headers['Content-Type'] = 'application/json'; headers['Content-Length'] = data.length; }
      const lib = u.protocol === 'http:' ? http : https;
      const req = lib.request({ method, hostname: u.hostname, port: u.port || undefined, path: u.pathname + u.search, headers }, (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(c));
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          if (res.statusCode < 200 || res.statusCode >= 300) {
            // The message carries the status only: never the response text, never a header.
            return reject(Object.assign(new Error('github status ' + res.statusCode), { name: 'GithubError' }));
          }
          try { resolve(text ? JSON.parse(text) : {}); } catch (e) { reject(Object.assign(new Error('github bad json'), { name: 'GithubError' })); }
        });
      });
      req.setTimeout(timeoutMs, () => { req.destroy(Object.assign(new Error('github timeout'), { name: 'GithubTimeout' })); });
      req.on('error', (e) => reject(e && e.name ? e : new Error('github request failed')));
      if (data) req.write(data);
      req.end();
    });
  }

  return {
    async createIssue(issue) {
      const out = await call('POST', '/repos/' + repo + '/issues', { title: issue.title, body: issue.body, labels: issue.labels });
      return { number: out.number };
    },
    // Lists the 100 most recent issues carrying the label (any state) and returns the number whose body holds the marker line, or null.
    async findIssueByMarker(markerLine) {
      const list = await call('GET', '/repos/' + repo + '/issues?labels=' + LABEL + '&state=all&per_page=100');
      const hit = (Array.isArray(list) ? list : []).find((i) => typeof i.body === 'string' && i.body.split(/\r?\n/).indexOf(markerLine) !== -1);
      return hit ? hit.number : null;
    }
  };
}

module.exports = { createGithubAdapter };
```

- [ ] **Step 4: Run — must pass**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: 0 failed (always-run set complete: 30 plus the extra store, adapter and sub-case tests; the seven P tests print SKIPPED).

- [ ] **Step 5: Commit**

```powershell
git add src/web-ui/modules/error-bridge-github.js tests/check-coha-s6-error-bridge.js
git commit -m "feat: add the real GitHub adapter for the error bridge"
```

---

## Task 9: Production wiring in `server.js` and the real-Postgres tests (AC2, AC5, AC7, D37 separate wiring task)

This task is deliberately separate from Tasks 3 to 8 (CLAUDE.md D37). It touches `server.js` only for registration, the boot migration and the two wirings.

**Files:**
- Modify: `src/web-ui/server.js`
- Test: `tests/check-coha-s6-error-bridge.js` (P1 to P7)

- [ ] **Step 1: Read before writing.** In `src/web-ui/server.js` read (a) the `if (process.env.DATABASE_URL) { const { Pool } = require('pg'); const _creditsPool = ...` block (about lines 517 to 575) and note where `credit_audit_log`'s migration ends; (b) the `/webhook/stripe` branch (about line 4237); (c) `validateRequiredEnvVars` and `createApp`, and confirm no middleware runs before the route dispatch that would require a session or CSRF token for an unknown path (csrfGuard is called per route in this file; the new route must not call it, because PostHog cannot hold a CSRF token); (d) `tests/check-ddft-s3-real-telemetry-signal-feed.js`, which already starts `server.js` in a child process, to copy how it supplies the required environment variables and waits for startup. Write down the minimal environment set P6 needs.

- [ ] **Step 2: Write the failing tests (insert above `// RUNNER`)**

```javascript
const { Pool } = DB_URL ? require('pg') : { Pool: null };
async function freshDb() {
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
dbTest('P2 two simultaneous deliveries open one issue', async () => {
  const pool = await freshDb(); const ctx = dbCtx(pool); const payload = body();
  try {
    await Promise.all([deliver(payload, ctx), deliver(payload, ctx)]);
    assert.strictEqual(ctx.adapter.created.length, 1);
    assert.strictEqual((await pool.query('SELECT status FROM production_error_issues WHERE posthog_issue_id=$1', [payload.posthog_issue_id])).rows[0].status, 'created');
  } finally { await pool.end(); }
});
dbTest('P3 a restart between deliveries still treats the second as a duplicate', async () => {
  const pool1 = await freshDb(); const ctx1 = dbCtx(pool1); const payload = body();
  await deliver(payload, ctx1); await pool1.end();
  const pool2 = new Pool({ connectionString: DB_URL }); const ctx2 = dbCtx(pool2);
  try { await deliver(payload, ctx2); assert.strictEqual(ctx2.adapter.created.length, 0); } finally { await pool2.end(); }
});
dbTest('P4 a stuck pending row older than the window is taken over exactly once', async () => {
  const pool = await freshDb(); const ctx = dbCtx(pool); const payload = body();
  try {
    await pool.query(`INSERT INTO production_error_issues (posthog_issue_id, status, claimed_at) VALUES ($1,'pending', now() - interval '3 minutes')`, [payload.posthog_issue_id]);
    await Promise.all([deliver(payload, ctx), deliver(payload, ctx)]);
    assert.strictEqual(ctx.adapter.created.length, 1);
  } finally { await pool.end(); }
});
dbTest('P5 a failed GitHub call leaves the row recoverable and a later delivery opens one issue', async () => {
  const pool = await freshDb(); const ctx = dbCtx(pool); const payload = body();
  try {
    ctx.adapter._fail = new Error('boom'); assert.strictEqual((await deliver(payload, ctx)).statusCode, 503);
    ctx.adapter._fail = null;
    await pool.query(`UPDATE production_error_issues SET claimed_at = now() - interval '3 minutes' WHERE posthog_issue_id=$1`, [payload.posthog_issue_id]);
    assert.strictEqual((await deliver(payload, ctx)).statusCode, 200);
    assert.strictEqual(ctx.adapter.created.length, 1);
  } finally { await pool.end(); }
});

// P6/P7: the real startup path. server.js runs in a child process (never re-required in-process).
function startServer(extraEnv) {
  const net = require('net'); const cp = require('child_process');
  return new Promise((resolve, reject) => {
    const probe = net.createServer(); probe.listen(0, '127.0.0.1', () => {
      const port = probe.address().port; probe.close(() => {
        // REQUIRED_ENV: add the minimal variables validateRequiredEnvVars needs (found in Step 1), with dummy values.
        const env = Object.assign({ PATH: process.env.PATH, SystemRoot: process.env.SystemRoot, PORT: String(port) }, REQUIRED_ENV, extraEnv);
        const child = cp.spawn(process.execPath, [path.join(__dirname, '..', 'src', 'web-ui', 'server.js')], { env, stdio: ['ignore', 'pipe', 'pipe'] });
        let out = '';
        const timer = setTimeout(() => { child.kill(); reject(new Error('server did not start: ' + out.slice(-400))); }, 30000);
        const onData = (d) => { out += d; if (/listening on port/.test(out)) { clearTimeout(timer); resolve({ child, base: 'http://127.0.0.1:' + port, output: () => out }); } };
        child.stdout.on('data', onData); child.stderr.on('data', onData);
      });
    });
  });
}
const REQUIRED_ENV = {};
async function waitFor(fn, ms) { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await fn()) return true; await new Promise((r) => setTimeout(r, 100)); } return false; }

dbTest('P6 the real startup path posts a valid payload and the fake GitHub API receives path, token, title, body and label', async () => {
  const gh = await startFakeGithub(); const pool = await freshDb(); await pool.end();
  const srv = await startServer({ DATABASE_URL: DB_URL, ERROR_BRIDGE_SECRET: SECRET, ERROR_BRIDGE_GITHUB_TOKEN: TOKEN, ERROR_BRIDGE_REPO: 'o/r', ERROR_BRIDGE_GITHUB_API_BASE: gh.base });
  try {
    const payload = body();
    const r = await httpRequest(srv.base, 'POST', '/webhook/error-alert', { 'content-type': 'application/json', [HEADER]: SECRET }, payload);
    assert.strictEqual(r.status, 200);
    const post = gh.calls.find((c) => c.method === 'POST');
    assert.ok(post, 'the fake GitHub API received a POST');
    assert.strictEqual(post.path, '/repos/o/r/issues'); assert.strictEqual(post.auth, 'Bearer ' + TOKEN);
    assert.strictEqual(post.body.title, payload.code); assert.deepStrictEqual(post.body.labels, ['production-error']);
    assert.ok(post.body.body.indexOf('PostHog issue id: ' + payload.posthog_issue_id) !== -1);
    assert.ok(srv.output().indexOf(SECRET) === -1 && srv.output().indexOf(TOKEN) === -1, 'no secret or token in the server output');
  } finally { srv.child.kill(); gh.srv.close(); }
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
  } finally { srv.child.kill(); gh.srv.close(); }
});
```

Fill `REQUIRED_ENV` (the empty object above) with the variables found in Step 1.

- [ ] **Step 3: Run without a database — the P tests must print SKIPPED and never count as passed**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: `... 0 failed, 7 skipped`.

- [ ] **Step 4: Start a throwaway Postgres (Docker must be running) and run the P tests — they must fail first**

```powershell
docker run --rm -d --name coha-s6-pg -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=coha -p 55432:5432 postgres:16
# wait ~5 seconds for it to accept connections, then in the SAME shell only:
$env:COHA_S6_TEST_DATABASE_URL = "postgresql://postgres:pw@127.0.0.1:55432/coha"
node tests/check-coha-s6-error-bridge.js
```

Expected: P1 to P5 pass (they use only the store and handler); P6 and P7 fail (the route is not registered in `server.js`; the fake GitHub API receives nothing).

- [ ] **Step 5: Implement the wiring in `server.js` — four small edits**

1. Next to the other route requires (near line 79) add:

```javascript
const { handlePostErrorBridge, setGithubIssueAdapter, setStorePool } = require('./routes/error-bridge'); // coha-s6
const { createGithubAdapter } = require('./modules/error-bridge-github'); // coha-s6
const _errorBridgeStore = require('./modules/error-bridge-store'); // coha-s6
```

2. Inside the `if (process.env.DATABASE_URL) {` block, after the `credit_audit_log` migration `.catch(...)` statement, add:

```javascript
    // coha-s6 -- error bridge: store pool, boot migration, and the real GitHub adapter (D37 wiring, own task).
    // The adapter is wired only when its token and repo are configured; otherwise the route answers 503 "not wired".
    setStorePool(_creditsPool);
    _errorBridgeStore.ensureTable(_creditsPool)
      .then(function() { console.log('production_error_issues table ready'); })
      .catch(function(err) { console.error('production_error_issues table migration failed:', err.message); });
    if (process.env.ERROR_BRIDGE_GITHUB_TOKEN && process.env.ERROR_BRIDGE_REPO) {
      setGithubIssueAdapter(createGithubAdapter({
        token: process.env.ERROR_BRIDGE_GITHUB_TOKEN,
        repo: process.env.ERROR_BRIDGE_REPO,
        apiBase: process.env.ERROR_BRIDGE_GITHUB_API_BASE // test-only override; unset in production
      }));
      console.log('Error bridge GitHub adapter wired');
    } else {
      console.warn('Error bridge GitHub adapter NOT wired: set ERROR_BRIDGE_GITHUB_TOKEN and ERROR_BRIDGE_REPO');
    }
```

3. Immediately after the `/webhook/stripe` branch (before `/billing/checkout`), add:

```javascript
  } else if (pathname === '/webhook/error-alert') {
    // coha-s6 -- PostHog error-tracking alert -> GitHub issue. Own shared-secret verification; no session, no CSRF
    // (PostHog cannot hold either). Any method reaches the handler so it can answer 405 itself.
    await handlePostErrorBridge(req, res);

```

4. Do not log either secret anywhere in `server.js` (the wired-adapter log lines above print no value).

- [ ] **Step 6: Run — P1 to P7 must now pass against the real database**

```powershell
node tests/check-coha-s6-error-bridge.js
```

Expected: `... 0 failed, 0 skipped` with the P tests listed as passing. If the container is not reachable or Docker is not running, stop and report a blocker; do not report the P tests as passed.

- [ ] **Step 7: Stop the container and clear the variable, then run the grep checks**

```powershell
docker stop coha-s6-pg
Remove-Item Env:COHA_S6_TEST_DATABASE_URL
Select-String -Path src/web-ui/server.js -Pattern "ERROR_BRIDGE_SECRET|ERROR_BRIDGE_GITHUB_TOKEN" | ForEach-Object { $_.Line.Trim() }
```

Expected: the only `server.js` lines mentioning the secret or token are the two `process.env.ERROR_BRIDGE_GITHUB_TOKEN` reads in the wiring block; none is inside a `console.*` call.

- [ ] **Step 8: Commit**

```powershell
git add src/web-ui/server.js tests/check-coha-s6-error-bridge.js
git commit -m "feat: wire the error bridge route, table and GitHub adapter in server.js"
```

---

## Task 10: Test-runner slot, full suite, and handover

**Files:**
- Modify (only if the measurement says so): `scripts/run-all-tests.js`

- [ ] **Step 1: Measure.** `scripts/run-all-tests.js` caps its concurrent pool from the CPU count (read `getConcurrency` or the function the file's comment on `SEQUENTIAL_EXCLUSIVE_LIST` points to, and any environment override). Run the full suite twice with the cap forced to 2 (use the file's own override if it has one, otherwise run it under a `node --require` shim that makes `os.cpus().length` return 2), with Git Bash first on PATH:

```powershell
$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH
npm test
```

Record: total files run, failures, and the per-file time of `tests/check-cat-s1-core-trace-builder.js` (its hard 50 ms assertion is what coha-s5's file starved).

- [ ] **Step 2: Decide.** If `check-cat-s1-core-trace-builder.js` or any other timing-sensitive file fails or slows because of `check-coha-s6-error-bridge.js` in either run, add `'tests/check-coha-s6-error-bridge.js'` to `SEQUENTIAL_EXCLUSIVE_LIST` and re-run once. If neither run shows any effect, leave the list unchanged. Either way, write the evidence (the two runs' numbers) into the PR description.

- [ ] **Step 3: Confirm no new failures.** The failing set must be a subset of the five acknowledged baseline files (`scripts/check-pipeline-state-integrity.js` for `tfhc-s1`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p4-enf-second-line.js`, `tests/check-p3.5-validate-trace.js`, `tests/check-rtvap-s1-archived-test-plan-coverage.js`; the last three clear when Git Bash and PowerShell 7 are used). Then run `node scripts/ci-test-regression-check.js` if present and confirm it passes.

- [ ] **Step 4: Commit (only if `run-all-tests.js` changed)**

```powershell
git add scripts/run-all-tests.js
git commit -m "chore: run the error bridge check in the sequential-exclusive phase"
```

- [ ] **Step 5: Hand over.** Stop here. The orchestrator then runs `/verify-completion` (all nine ACs, including the manual live scenarios which need operator approval) and `/branch-complete` (push and open a draft PR; the user merges). The agent never merges and never runs the live PostHog scenario.

---

## Coverage check

| AC | Tasks | Tests |
|----|-------|-------|
| AC1 | 4, 8 | U1, U2, U3, U4, I1, adapter shape tests |
| AC2 | 2, 5, 9 | U5 to U9, U9b, P1 to P4 |
| AC3 | 3, 8 | U10 to U16, I1 |
| AC4 | 4, 8 | U17 to U19, I1 |
| AC5 | 6, 8, 9 | U20 to U22, I2, P5 |
| AC6 | none (manual, operator-approved live run at verify time) | verification script scenario 6 |
| AC7 | 9 | P6, P7 |
| AC8 | 3, 6 | U23, U24 |
| AC9 | none (production-observed after merge, RISK-ACCEPT) | verification script scenario 9 |
| NFRs | 7 | N1 to N4 |
