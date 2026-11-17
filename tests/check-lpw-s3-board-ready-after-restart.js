'use strict';
// lpw-s3 T6 and T7 (AC8, issue #1141) -- after a restart or deploy the in-memory session store is empty, but a stage that
// already completed is recorded in the journey (completedStages carries the session id), so the board must still show
// that card as ready and Advance must still work. Plain Node script.
// Run: node tests/check-lpw-s3-board-ready-after-restart.js

const assert = require('assert');
const path = require('path');
const root = path.resolve(__dirname, '..');
const PRODUCTS = path.join(root, 'src', 'web-ui', 'routes', 'products.js');
const JOURNEY = path.join(root, 'src', 'web-ui', 'routes', 'journey.js');
const SKILLS = path.join(root, 'src', 'web-ui', 'routes', 'skills.js');
const STORE = path.join(root, 'src', 'web-ui', 'modules', 'journey-store.js');

function fresh() {
  [PRODUCTS, JOURNEY, SKILLS, STORE].forEach(function (p) { try { delete require.cache[require.resolve(p)]; } catch (_) {} });
  const products = require(PRODUCTS); const journey = require(JOURNEY); const skills = require(SKILLS); const store = require(STORE);
  store._clear();
  return { products: products, journey: journey, skills: skills, store: store };
}

/** A journey at stage `discovery` whose active session is `sid`; `completed` records the stage as completed by that session. */
function seed(store, opts) {
  const j = store.createJourney('lpw-s3-ready-' + Math.random().toString(36).slice(2, 8)); const id = j.journeyId;
  store.setStoryList(id, ['s']); store.setJourneyFields(id, { tenantId: 't1' });
  const sid = 'sid-' + id;
  store.setActiveSession(id, sid, 'discovery');
  if (opts.completed) store.completeStage(id, 'discovery', 'artefacts/e2e-board-seed/x/discovery.md', null, opts.completedSessionId || sid);
  return { id: id, sid: sid };
}
function row(s) { return { journey_id: s.id, feature_slug: 'f-' + s.id.slice(0, 4), stage: 'discovery', active_session_id: s.sid, display_name: null }; }
function cardOf(columns, id) { let c = null; columns.forEach(function (col) { col.cards.forEach(function (k) { if (k.id === id) c = k; }); }); return c; }
function emptyStore(products) { products.setGetHtmlSessionsBulk(function () { return {}; }); }
function mockRes() { return { _status: null, _body: '', writeHead(c) { this._status = c; }, end(b) { this._body += (b || ''); } }; }

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

test('T6a after a restart (no session in memory) a card whose stage was completed by its active session is ready', function () {
  const { products, store } = fresh(); const s = seed(store, { completed: true }); emptyStore(products);
  assert.strictEqual(cardOf(products.buildProductKanbanColumns([row(s)]), s.id).ready, true);
});

test('T6b a card with no completed-stage record is not ready', function () {
  const { products, store } = fresh(); const s = seed(store, { completed: false }); emptyStore(products);
  assert.strictEqual(cardOf(products.buildProductKanbanColumns([row(s)]), s.id).ready, false);
});

test('T6c a live session that is not done (a revision in progress) beats the completed-stage record: not ready', function () {
  const { products, store } = fresh(); const s = seed(store, { completed: true });
  products.setGetHtmlSessionsBulk(function (ids) { const m = {}; (ids || []).forEach(function (i) { if (i === s.sid) m[i] = { done: false }; }); return m; });
  assert.strictEqual(cardOf(products.buildProductKanbanColumns([row(s)]), s.id).ready, false);
});

test('T6d a completed-stage record written by a different session does not make this card ready', function () {
  const { products, store } = fresh(); const s = seed(store, { completed: true, completedSessionId: 'some-other-session' }); emptyStore(products);
  assert.strictEqual(cardOf(products.buildProductKanbanColumns([row(s)]), s.id).ready, false);
});

test('T6e a live session that is done is still ready (unchanged)', function () {
  const { products, store } = fresh(); const s = seed(store, { completed: false });
  products.setGetHtmlSessionsBulk(function (ids) { const m = {}; (ids || []).forEach(function (i) { if (i === s.sid) m[i] = { done: true }; }); return m; });
  assert.strictEqual(cardOf(products.buildProductKanbanColumns([row(s)]), s.id).ready, true);
});

async function advance(env, s, gate) {
  env.journey.handlePostGateConfirm = async function (req, res) { await gate(req, res); };
  const pool = { query: async function (sql) { return { rows: /FROM journeys WHERE journey_id/i.test(sql) ? [{ tenant_id: 't1' }] : [] }; } };
  const req = { session: { tenantId: 't1', accessToken: 'tok', login: 'op', csrfToken: 'c' }, params: { journeyId: s.id } };
  const res = mockRes();
  await env.products.handlePostBoardAdvance(req, res, null, pool, null);
  return res;
}

test('T7a Advance after a restart restores the completed session before confirming, so gate-confirm sees a done session', async function () {
  const env = fresh(); const s = seed(env.store, { completed: true }); emptyStore(env.products);
  let seen = null;
  const res = await advance(env, s, async function (_req, r) {
    seen = env.skills._getHtmlSession(s.sid);
    env.store.setActiveSession(s.id, 'sid-next', 'benefit-metric'); r.writeHead(303, { Location: '/x' }); r.end('');
  });
  assert.ok(seen, 'gate-confirm must find a session for the active session id');
  assert.strictEqual(seen.done, true); assert.strictEqual(seen._stageDone, true);
  assert.strictEqual(seen.journeyId, s.id); assert.strictEqual(seen.skillName, 'discovery');
  assert.strictEqual(seen.artefactPath, 'artefacts/e2e-board-seed/x/discovery.md');
  assert.strictEqual(res._status, 200, res._body);
});

test('T7b Advance when the stage never completed and there is no session is still refused as not-ready (400)', async function () {
  const env = fresh(); const s = seed(env.store, { completed: false }); emptyStore(env.products);
  const res = await advance(env, s, async function () { throw new Error('gate-confirm must not run'); });
  assert.strictEqual(res._status, 400);
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
