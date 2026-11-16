'use strict';
// anf-s1 -- the artefact route answers 404 (not 503) for a link that cannot name an artefact, and an unknown name is not found quickly.
// Plain Node script. Run: node tests/check-anf-s1-artefact-not-found.js
// Story: artefacts/2026-11-16-artefact-not-found/stories/anf-s1-artefact-not-found.md
// Test plan: artefacts/2026-11-16-artefact-not-found/test-plans/anf-s1-test-plan.md

process.env.NODE_ENV = 'test';
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const path = require('path');

const ec = require('../src/web-ui/modules/error-capture');
const server = require('../src/web-ui/server');
const sessions = require('../src/web-ui/middleware/session');
const artefactRoute = require('../src/web-ui/routes/artefact');
const fetcher = require('../src/web-ui/adapters/artefact-fetcher');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
const quiet = () => { const e = console.error; const l = console.log; console.error = () => {}; console.log = () => {}; return () => { console.error = e; console.log = l; }; };
const settle = () => new Promise((res) => setTimeout(res, 30));

function wire() {
  const calls = [];
  ec._resetForTests();
  function Rec() { this.captureException = (err, id, props) => { calls.push({ err, props }); }; this.shutdown = async () => {}; }
  ec.initErrorCapture('production', { POSTHOG_KEY_PROD: 'phc_fake' }, { PostHogClient: Rec, autocapture: false });
  return calls;
}

// Direct handler call: a signed-in request, a recording fetcher, a capturing response.
function makeReq() { return { url: '/artefact/x/y', headers: {}, session: { accessToken: 'tok', userId: 'u1', login: 'u1', tenantId: 't1' } }; }
function makeRes() { const r = { status: null, body: '' }; r.writeHead = (c) => { r.status = c; }; r.end = (b) => { r.body = b || ''; }; return r; }
async function callRoute(slug, type, fetcherImpl) {
  const seen = [];
  artefactRoute.setFetcher(async function () { seen.push(Array.prototype.slice.call(arguments)); return fetcherImpl(); });
  const res = makeRes();
  await artefactRoute.handleArtefactRoute(makeReq(), res, slug, type, null);
  return { res, seen };
}
const neverFetch = () => { throw new Error('the fetcher must not be called'); };
const upstreamDown = () => { throw new fetcher.ArtefactFetchError('GitHub API error: 502', 'bad gateway'); };

test('T1 a reference with a control character, a leftover %, or an empty or over-long part answers 404 without any fetch (AC1)', async () => {
  const calls = wire();
  const pairs = [['%00', '%00'], ['%E0%A4%A', 'discovery'], ['2026-01-01-x', '%E0%A4%A'], ['2026-01-01-x', '\u0000'],
    ['', 'discovery'], ['x'.repeat(300), 'discovery'], ['2026-01-01-x', 'y'.repeat(300)]];
  for (const [slug, type] of pairs) {
    const { res, seen } = await callRoute(slug, type, neverFetch);
    assert.strictEqual(res.status, 404, JSON.stringify([slug.slice(0, 20), type.slice(0, 20)]) + ' answered ' + res.status);
    assert.ok(res.body.indexOf('artefact not found') !== -1, 'the not-found page is shown');
    assert.ok(slug.length < 5 || res.body.indexOf(slug) === -1, 'the input is not echoed');
    assert.strictEqual(seen.length, 0, 'no fetch was attempted');
  }
  await settle(); assert.strictEqual(calls.length, 0, 'no error report');
});

test('T2 a traversal-shaped type or slug answers the same 404 (AC2)', async () => {
  const pairs = [['2026-01-01-x', '../x'], ['2026-01-01-x', 'a/../b'], ['2026-01-01-x', 'a//b'], ['2026-01-01-x', '/a'],
    ['2026-01-01-x', '.hidden'], ['2026-01-01-x', 'a/.hidden'], ['a/b', 'discovery'], ['..', 'discovery']];
  for (const [slug, type] of pairs) {
    const { res, seen } = await callRoute(slug, type, neverFetch);
    assert.strictEqual(res.status, 404, JSON.stringify([slug, type]) + ' answered ' + res.status);
    assert.strictEqual(seen.length, 0, JSON.stringify([slug, type]) + ' reached the fetcher');
  }
});

test('T3a well-formed references still reach the fetcher with the same arguments (AC3)', async () => {
  for (const type of ['discovery', 'dor/psh-s1-dor', 'v1.2-notes']) {
    const { res, seen } = await callRoute('2026-01-01-example-feature', type, upstreamDown);
    assert.strictEqual(seen.length, 1, type + ' must be fetched');
    assert.strictEqual(seen[0][0], '2026-01-01-example-feature'); assert.strictEqual(seen[0][1], type); assert.strictEqual(seen[0][2], 'tok');
    assert.notStrictEqual(res.status, 404, type + ' must not be answered by the validation 404');
  }
});

test('T3b every real artefacts/ directory name passes the slug check (AC3)', () => {
  const root = path.join(__dirname, '..', 'artefacts');
  const names = fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name);
  const archived = path.join(root, 'archived');
  if (fs.existsSync(archived)) fs.readdirSync(archived, { withFileTypes: true }).filter((d) => d.isDirectory()).forEach((d) => names.push(d.name));
  assert.ok(names.length > 50, 'listing found ' + names.length);
  const bad = names.filter((n) => n !== 'archived' && !artefactRoute.isPlausibleArtefactRef(n, 'discovery'));
  assert.deepStrictEqual(bad, [], 'rejected real directories: ' + bad.join(', '));
});

test('T4 the real route table answers 404 for the two reported urls without calling GitHub; unsigned stays 302 (AC4)', async () => {
  const restore = quiet();
  const realFetch = global.fetch; const hits = [];
  global.fetch = async (u) => { hits.push(String(u)); return { status: 404, ok: false, json: async () => ({}) }; };
  const id = crypto.randomBytes(16).toString('hex');
  sessions.seedTestSession(id, { accessToken: 'tok', userId: 'u1', login: 'u1', tenantId: 't1' });
  const app = server.createApp();
  try {
    await new Promise((res) => app.listen(0, '127.0.0.1', res));
    const get = (url, cookie) => new Promise((resolve, reject) => {
      http.get({ host: '127.0.0.1', port: app.address().port, path: url, headers: cookie ? { Cookie: 'session_id=' + id } : {} }, (r) => {
        let b = ''; r.on('data', (c) => { b += c; }); r.on('end', () => resolve({ status: r.statusCode, body: b, location: r.headers.location }));
      }).on('error', reject);
    });
    for (const url of ['/artefact/%00/%00', '/artefact/%E0%A4%A/discovery']) {
      const r = await get(url, true);
      assert.strictEqual(r.status, 404, url + ' answered ' + r.status);
      assert.ok(r.body.indexOf('artefact not found') !== -1);
    }
    assert.deepStrictEqual(hits.filter((u) => u.indexOf('/contents/') !== -1), [], 'GitHub was called');
    const anon = await get('/artefact/2026-01-01-x/discovery', false);
    assert.strictEqual(anon.status, 302); assert.strictEqual(anon.location, '/');
  } finally { global.fetch = realFetch; await new Promise((res) => app.close(res)); restore(); }
});

// ---- fetchArtefact with a stubbed global.fetch ----
function stubGithub(spec, log) {
  // spec: { '<repo path>': { status, delay, content } }; anything absent answers 404 after `defaultDelay`.
  return async (url) => {
    const p = String(url).split('/contents/')[1];
    log.push(p);
    const s = spec.paths[p] || { status: 404 };
    await new Promise((res) => setTimeout(res, s.delay !== undefined ? s.delay : spec.defaultDelay || 0));
    if (s.status === 404) return { status: 404, ok: false, json: async () => ({ message: 'Not Found' }) };
    if (s.status && s.status !== 200) return { status: s.status, ok: false, json: async () => ({ message: 'boom' }) };
    return { status: 200, ok: true, json: async () => ({ content: Buffer.from(s.content || 'x').toString('base64') }) };
  };
}
async function withFetch(spec, fn) {
  const real = global.fetch; const log = []; global.fetch = stubGithub(spec, log);
  try { return await fn(log); } finally { global.fetch = real; }
}

test('T5 an unknown bare name is reported not found in well under the sequential time (AC5)', async () => {
  await withFetch({ paths: {}, defaultDelay: 150 }, async (log) => {
    const t0 = Date.now();
    await assert.rejects(() => fetcher.fetchArtefact('f', 'nope', 'tok'), (e) => e.name === 'ArtefactNotFoundError');
    const ms = Date.now() - t0;
    assert.ok(ms < 1500, 'took ' + ms + ' ms for ' + log.length + ' requests');
  });
});

test('T6 probe priority is kept, an earlier failure still raises, and requests stay at or under 24 (AC6)', async () => {
  // (a) two candidates exist; the later one answers first. The earlier one in priority order wins.
  await withFetch({ paths: { 'artefacts/f/stories/x.md': { status: 200, delay: 200, content: 'FROM-STORIES' }, 'artefacts/f/dor/x.md': { status: 200, delay: 0, content: 'FROM-DOR' } } }, async () => {
    assert.strictEqual(await fetcher.fetchArtefact('f', 'x', 'tok'), 'FROM-STORIES');
  });
  // (b) a 500 at an earlier candidate than the hit still raises, as the sequential loop did.
  await withFetch({ paths: { 'artefacts/f/epics/x.md': { status: 500 }, 'artefacts/f/dor/x.md': { status: 200, content: 'FROM-DOR' } } }, async () => {
    await assert.rejects(() => fetcher.fetchArtefact('f', 'x', 'tok'), (e) => e.name === 'ArtefactFetchError');
  });
  // (c) a hit after a miss resolves, and nothing found stays not found with a bounded request count.
  await withFetch({ paths: { 'artefacts/archived/f/dor/x.md': { status: 200, content: 'FROM-ARCHIVE' } } }, async () => {
    assert.strictEqual(await fetcher.fetchArtefact('f', 'x', 'tok'), 'FROM-ARCHIVE');
  });
  await withFetch({ paths: {} }, async (log) => {
    await assert.rejects(() => fetcher.fetchArtefact('f', 'nope', 'tok'), (e) => e.name === 'ArtefactNotFoundError');
    assert.ok(log.length <= 24 && log.length >= 2, 'requests: ' + log.length);
  });
});

test('T7 a real upstream failure is still answered 503 (AC7)', async () => {
  const { res, seen } = await callRoute('2026-01-01-example-feature', 'discovery', upstreamDown);
  assert.strictEqual(seen.length, 1);
  assert.strictEqual(res.status, 503);
  assert.ok(res.body.indexOf('Unable to load artefact') !== -1);
});

test('T8 the validator never throws and rejects non-strings (NFR)', () => {
  const ok = artefactRoute.isPlausibleArtefactRef;
  for (const v of [undefined, null, 5, {}, [], '\uD800', '\uD800x']) {
    assert.doesNotThrow(() => ok(v, 'discovery')); assert.doesNotThrow(() => ok('2026-01-01-x', v));
    assert.strictEqual(ok(v, 'discovery'), false); assert.strictEqual(ok('2026-01-01-x', v), false);
  }
  assert.strictEqual(ok('2026-01-01-x', 'dor/psh-s1-dor'), true);
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[anf-s1-artefact-not-found] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
