'use strict';
// scr-s1 -- the commit result page shows "Committed." for a committed skill session instead of a 500 ("Adapter not wired: getCommitResult").
// Plain Node script. Run: node tests/check-scr-s1-commit-result-page.js
// Story: artefacts/2026-11-16-commit-result-page/stories/scr-s1-commit-result-page.md
// Test plan: artefacts/2026-11-16-commit-result-page/test-plans/scr-s1-test-plan.md

process.env.NODE_ENV = 'test';
process.env.WIRE_SKILL_ADAPTERS = 'true';  // runs server.js's real skill-adapter wiring block (the switch playwright.local.config.js uses)
const assert = require('assert');
const path = require('path');
const { execFileSync } = require('child_process');

require('../src/web-ui/server');  // loaded once: the wiring under test happens here
const skills = require('../src/web-ui/routes/skills');
const skillsAdapter = require('../src/web-ui/adapters/skills');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const quiet = () => { const e = console.error; const l = console.log; const i = console.info; console.error = () => {}; console.log = () => {}; console.info = () => {}; return () => { console.error = e; console.log = l; console.info = i; }; };
function makeReq(id, extra) { return Object.assign({ method: 'GET', params: { name: 'discovery', id }, headers: {}, session: { accessToken: 'tok', userId: 'u1', login: 'tester', csrfToken: 'c' } }, extra); }
function makeRes() { const r = { statusCode: null, headers: {}, body: '' }; r.writeHead = (c, h) => { r.statusCode = c; Object.keys(h || {}).forEach((k) => { r.headers[k.toLowerCase()] = h[k]; }); }; r.end = (b) => { if (b) r.body += String(b); }; return r; }
async function getResult(id) { const res = makeRes(); const restore = quiet(); try { await skills.handleGetResultHtml(makeReq(id), res); } finally { restore(); } return res; }
const seed = (id, data) => skills._setHtmlSession(id, Object.assign({ skillName: 'discovery' }, data));
const A = 'artefacts/2026-01-01-example-one/dor/ex1-s1-dor.md';
const B = 'artefacts/2026-02-02-example-two/discovery.md';

test('T1 the real wiring returns the committed session\'s own data (AC1)', async () => {
  seed('scr-t1', { artefactPath: A, committedAt: '2026-11-16T00:00:00.000Z' });
  const r = await skillsAdapter.getCommitResult('discovery', 'scr-t1', 'tok');
  assert.strictEqual(r.artefactPath, A);
  assert.strictEqual(r.featureSlug, '2026-01-01-example-one');
  assert.strictEqual(r.artefactType, 'dor/ex1-s1-dor');
});

test('T2 slug and type are derived for nested and root-level artefacts (AC2)', async () => {
  seed('scr-t2a', { artefactPath: A, committedAt: 'x' }); seed('scr-t2b', { artefactPath: B, committedAt: 'x' });
  seed('scr-t2c', { artefactPath: 'artefacts/archived/2026-03-03-old/discovery.md', committedAt: 'x' });
  const a = await skills.htmlGetCommitResult('discovery', 'scr-t2a'); const b = await skills.htmlGetCommitResult('discovery', 'scr-t2b');
  assert.deepStrictEqual([a.featureSlug, a.artefactType], ['2026-01-01-example-one', 'dor/ex1-s1-dor']);
  assert.deepStrictEqual([b.featureSlug, b.artefactType], ['2026-02-02-example-two', 'discovery']);
  const c = await skills.htmlGetCommitResult('discovery', 'scr-t2c');
  assert.strictEqual(c.artefactPath, 'artefacts/archived/2026-03-03-old/discovery.md');
});

test('T3 the page answers 200 "Committed." with its own path and link; two sessions give two results (AC3)', async () => {
  seed('scr-t3a', { artefactPath: A, committedAt: 'x' }); seed('scr-t3b', { artefactPath: B, committedAt: 'x' });
  const ra = await getResult('scr-t3a'); const rb = await getResult('scr-t3b');
  assert.strictEqual(ra.statusCode, 200, 'a answered ' + ra.statusCode + ' ' + ra.body.slice(0, 120));
  assert.ok(ra.body.indexOf('Committed.') !== -1);
  assert.ok(ra.body.indexOf(A) !== -1 && ra.body.indexOf('/artefact/2026-01-01-example-one/dor/ex1-s1-dor') !== -1, 'path and link for a');
  assert.ok(ra.body.indexOf(B) === -1, 'a must not show b\'s path');
  assert.strictEqual(rb.statusCode, 200);
  assert.ok(rb.body.indexOf(B) !== -1 && rb.body.indexOf('/artefact/2026-02-02-example-two/discovery') !== -1, 'path and link for b');
  assert.ok(rb.body.indexOf(A) === -1, 'b must not show a\'s path');
});

test('T4 an unknown, uncommitted or pathless session answers 404 and never shows "Committed." (AC4)', async () => {
  seed('scr-t4b', { artefactPath: A });                       // drafted, not committed
  seed('scr-t4c', { committedAt: 'x' });                       // committed but no path
  for (const id of ['scr-t4-unknown', 'scr-t4b', 'scr-t4c']) {
    const r = await getResult(id);
    assert.strictEqual(r.statusCode, 404, id + ' answered ' + r.statusCode);
    assert.ok(r.body.indexOf('Commit result not found') !== -1, id + ' message');
    assert.ok(r.body.indexOf('Committed.') === -1, id + ' must not claim a commit');
  }
});

test('T5 commit POST then the redirect ends on the 200 result page (AC5)', async () => {
  seed('scr-t5', { artefactPath: B });
  skills.setCommitSession(async () => ({ artefactPath: B }));
  const bodyStr = '_csrf=c';
  const req = makeReq('scr-t5', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on(event, cb) { if (event === 'data') cb(Buffer.from(bodyStr)); if (event === 'end') cb(); return this; } });
  const res = makeRes(); const restore = quiet();
  try { await skills.handlePostCommitHtml(req, res); } finally { restore(); }
  assert.strictEqual(res.statusCode, 303);
  assert.strictEqual(res.headers.location, '/skills/discovery/sessions/scr-t5/result');
  const after = await getResult('scr-t5');
  assert.strictEqual(after.statusCode, 200, 'result answered ' + after.statusCode + ' ' + after.body.slice(0, 120));
  assert.ok(after.body.indexOf('Committed.') !== -1 && after.body.indexOf(B) !== -1);
});

test('T6 an unwired adapter still throws (AC6)', () => {
  const adapterPath = path.join(__dirname, '..', 'src', 'web-ui', 'adapters', 'skills.js');
  const out = execFileSync(process.execPath, ['-e',
    "require(" + JSON.stringify(adapterPath) + ").getCommitResult('a','b','c').then(function(){console.log('NO-THROW')},function(e){console.log(e.message)})"]).toString();
  assert.ok(out.indexOf('Adapter not wired: getCommitResult') !== -1, 'got: ' + out);
});

test('T7 the derivation never throws an unexpected error on a malformed path (NFR)', async () => {
  let n = 0;
  for (const p of ['', 'x', 'artefacts/', 'artefacts//x.md', 'artefacts/a', 42, null]) {
    seed('scr-t7-' + n, { artefactPath: p, committedAt: 'x' });
    await assert.rejects(() => skills.htmlGetCommitResult('discovery', 'scr-t7-' + n), (e) => e.status === 404 && e.message === 'Commit result not found', 'path ' + JSON.stringify(p));
    n++;
  }
});

(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  ok   ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + ' -- ' + (e && e.message)); }
  }
  console.log('[scr-s1-commit-result-page] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
