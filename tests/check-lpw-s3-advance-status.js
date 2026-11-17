'use strict';
// lpw-s3 T2 and T3 (AC2, AC3) -- handlePostBoardAdvance reports what gate-confirm really did (issue #1140), and a
// failed advance is captured without secrets. Plain Node script. Run: node tests/check-lpw-s3-advance-status.js

const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '..');
const PRODUCTS = path.join(root, 'src', 'web-ui', 'routes', 'products.js');
const JOURNEY = path.join(root, 'src', 'web-ui', 'routes', 'journey.js');
const STORE = path.join(root, 'src', 'web-ui', 'modules', 'journey-store.js');

function fresh() {
  [PRODUCTS, JOURNEY, STORE].forEach(function (p) { try { delete require.cache[require.resolve(p)]; } catch (_) {} });
  const products = require(PRODUCTS); const journey = require(JOURNEY); const store = require(STORE);
  store._clear();
  return { products: products, journey: journey, store: store };
}
function mockRes() {
  return { _status: null, _body: '', writeHead(c) { this._status = c; }, end(b) { this._body += (b || ''); }, json() {} };
}
function parse(res) { try { return JSON.parse(res._body); } catch (_) { return {}; } }

/** Seed one ready journey and run the handler against a fake gate-confirm. */
async function run(gate, posthog) {
  const { products, journey, store } = fresh();
  const j = store.createJourney('lpw-s3-feature'); const id = j.journeyId;
  store.setStoryList(id, ['s']); store.setJourneyFields(id, { tenantId: 't1' });
  const sid = 'sid-' + id; store.setActiveSession(id, sid, 'discovery');
  products.setGetHtmlSessionsBulk(function (ids) { const m = {}; (ids || []).forEach(function (x) { if (x === sid) m[x] = { done: true }; }); return m; });
  journey.handlePostGateConfirm = async function (req, res) { await gate({ store: store, id: id }, req, res); };
  const pool = { query: async function (sql) { return { rows: /FROM journeys WHERE journey_id/i.test(sql) ? [{ tenant_id: 't1' }] : [] }; } };
  const req = { session: { tenantId: 't1', accessToken: 'secret-access-token', login: 'op', csrfToken: 'secret-csrf-token', id: 'secret-session-id-0123456789' }, params: { journeyId: id } };
  const res = mockRes();
  await products.handlePostBoardAdvance(req, res, null, pool, posthog || null);
  return { res: res, body: parse(res), id: id };
}

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

test('T2a a 403 from gate-confirm is answered 403 with an error, never advanced: true', async function () {
  const r = await run(async function (_c, _q, res) { res.writeHead(403, { 'Content-Type': 'text/plain' }); res.end('Forbidden'); });
  assert.strictEqual(r.res._status, 403);
  assert.ok(r.body.error, 'must carry an error'); assert.ok(r.body.advanced !== true);
});

test('T2b a redirect to sign-in is answered 401', async function () {
  const r = await run(async function (_c, _q, res) { res.writeHead(302, { Location: '/auth/github' }); res.end(''); });
  assert.strictEqual(r.res._status, 401); assert.ok(r.body.advanced !== true);
});

test('T2c an unexpected status is answered 502 advance-failed', async function () {
  const r = await run(async function (_c, _q, res) { res.writeHead(409, {}); res.end('conflict'); });
  assert.strictEqual(r.res._status, 502); assert.strictEqual(r.body.error, 'advance-failed');
});

test('T2d a real advance (303 and the stage moved) is answered 200 advanced: true with the new stage', async function () {
  const r = await run(async function (c, _q, res) { c.store.setActiveSession(c.id, 'sid-next', 'benefit-metric'); res.writeHead(303, { Location: '/skills/benefit-metric/sessions/sid-next/chat' }); res.end(''); });
  assert.strictEqual(r.res._status, 200); assert.strictEqual(r.body.advanced, true); assert.strictEqual(r.body.stage, 'benefit-metric');
});

test('T2e a 303 that left the stage unchanged is not reported as an advance', async function () {
  const r = await run(async function (_c, _q, res) { res.writeHead(303, { Location: '/somewhere' }); res.end(''); });
  assert.strictEqual(r.res._status, 502); assert.ok(r.body.advanced !== true);
});

test('T2f finishing the last stage (303 to /complete) is still a success', async function () {
  const r = await run(async function (c, _q, res) { res.writeHead(303, { Location: '/journey/' + c.id + '/complete' }); res.end(''); });
  assert.strictEqual(r.res._status, 200); assert.strictEqual(r.body.advanced, true);
});

test('T3a a failed advance is captured as board_advance_failed with the status and a short journey id, and no secrets', async function () {
  const calls = [];
  const ph = { capture: function (distinctId, event, props) { calls.push({ distinctId: distinctId, event: event, props: props }); } };
  const r = await run(async function (_c, _q, res) { res.writeHead(403, {}); res.end('Forbidden'); }, ph);
  const hit = calls.filter(function (c) { return c.event === 'board_advance_failed'; })[0];
  assert.ok(hit, 'board_advance_failed must be captured; got ' + JSON.stringify(calls.map(function (c) { return c.event; })));
  assert.strictEqual(hit.props.status, 403);
  assert.strictEqual(hit.props.journeyIdPrefix, r.id.slice(0, 8));
  const blob = JSON.stringify(hit);
  ['secret-access-token', 'secret-csrf-token', 'secret-session-id-0123456789', r.id].forEach(function (s) { assert.ok(blob.indexOf(s) === -1, 'capture must not contain ' + s); });
});

test('T3b a successful advance captures nothing', async function () {
  const calls = [];
  const ph = { capture: function (_d, event) { calls.push(event); } };
  await run(async function (c, _q, res) { c.store.setActiveSession(c.id, 'sid-next', 'benefit-metric'); res.writeHead(303, { Location: '/x' }); res.end(''); }, ph);
  assert.ok(calls.indexOf('board_advance_failed') === -1);
});

(async function () {
  let passed = 0; let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[lpw-s3] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[lpw-s3] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[lpw-s3] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
