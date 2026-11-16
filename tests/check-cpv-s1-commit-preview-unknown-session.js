'use strict';
// cpv-s1 -- the commit preview and the commit POST refuse (404) when there is nothing to commit, and the copy says the file goes to the default branch.
// Plain Node script. Run: node tests/check-cpv-s1-commit-preview-unknown-session.js
// Story: artefacts/2026-11-16-commit-preview-unknown-session/stories/cpv-s1-commit-preview-unknown-session.md
// Test plan: artefacts/2026-11-16-commit-preview-unknown-session/test-plans/cpv-s1-test-plan.md

process.env.NODE_ENV = 'test';
process.env.WIRE_SKILL_ADAPTERS = 'true';  // runs server.js's real skill-adapter wiring block
process.env.GITHUB_REPO_OWNER = 'cpv-owner';
process.env.GITHUB_REPO_NAME = 'cpv-repo';
const assert = require('assert');

require('../src/web-ui/server');  // loaded once: the wiring under test happens here
const skills = require('../src/web-ui/routes/skills');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const quiet = () => { const e = console.error; const l = console.log; const i = console.info; console.error = () => {}; console.log = () => {}; console.info = () => {}; return () => { console.error = e; console.log = l; console.info = i; }; };
function makeReq(name, id, extra) { return Object.assign({ method: 'GET', params: { name, id }, headers: {}, session: { accessToken: 'tok', userId: 'u1', login: 'tester', csrfToken: 'c' } }, extra); }
function postReq(name, id) {
  return makeReq(name, id, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' },
    on(event, cb) { if (event === 'data') cb(Buffer.from('_csrf=c')); if (event === 'end') cb(); return this; } });
}
function makeRes() { const r = { statusCode: null, headers: {}, body: '' }; r.writeHead = (c, h) => { r.statusCode = c; Object.keys(h || {}).forEach((k) => { r.headers[k.toLowerCase()] = h[k]; }); }; r.end = (b) => { if (b) r.body += String(b); }; return r; }
async function quietly(fn) { const restore = quiet(); try { return await fn(); } finally { restore(); } }
async function getPreview(name, id) { const res = makeRes(); await quietly(() => skills.handleGetCommitPreviewHtml(makeReq(name, id), res)); return res; }
async function getResult(name, id) { const res = makeRes(); await quietly(() => skills.handleGetResultHtml(makeReq(name, id), res)); return res; }
async function postCommit(name, id) { const res = makeRes(); await quietly(() => skills.handlePostCommitHtml(postReq(name, id), res)); return res; }
const seed = (id, data) => skills._setHtmlSession(id, Object.assign({ skillName: 'discovery' }, data));
const PATH = 'artefacts/2026-01-01-x/discovery.md';
const NOTHING = 'Nothing to commit for this session';

// Replace global.fetch with a recorder for the duration of fn; reply is what each call resolves to.
async function withFetch(reply, fn) {
  const real = global.fetch; const calls = [];
  global.fetch = async (url, opts) => { calls.push({ url: String(url), method: (opts && opts.method) || 'GET' }); return reply; };
  try { await fn(calls); } finally { global.fetch = real; }
}
const OK = { ok: true, status: 200, json: async () => ({ commit: { sha: 's' }, content: { html_url: 'u' } }) };

test('T1 an unknown session\'s preview is a 404 "Nothing to commit" page with no form (AC1)', async () => {
  const r = await getPreview('discovery', 'cpv-t1-unknown');
  assert.strictEqual(r.statusCode, 404, 'answered ' + r.statusCode);
  assert.ok(r.body.indexOf(NOTHING) !== -1, 'message');
  assert.ok(r.body.indexOf('<form') === -1 && r.body.indexOf('Review & commit') === -1, 'no commit form');
});

test('T2 no drafted artefact, or the wrong skill in the URL, gets the same 404 (AC2)', async () => {
  seed('cpv-t2a', {});                                      // no path, no content
  seed('cpv-t2b', { artefactPath: PATH, artefactContent: '' }); // path but empty content
  seed('cpv-t2c', { artefactPath: PATH, artefactContent: '# x' }); // drafted discovery session ...
  for (const [name, id] of [['discovery', 'cpv-t2a'], ['discovery', 'cpv-t2b'], ['ideate', 'cpv-t2c']]) {
    const r = await getPreview(name, id);
    assert.strictEqual(r.statusCode, 404, name + '/' + id + ' answered ' + r.statusCode);
    assert.ok(r.body.indexOf(NOTHING) !== -1, name + '/' + id + ' message');
  }
});

test('T3 a drafted session still previews; copy says default branch; neither page says "new branch" (AC3)', async () => {
  seed('cpv-t3', { artefactPath: PATH, artefactContent: '# x' });
  const p = await getPreview('discovery', 'cpv-t3');
  assert.strictEqual(p.statusCode, 200, 'answered ' + p.statusCode + ' ' + p.body.slice(0, 120));
  assert.ok(p.body.indexOf(PATH) !== -1 && p.body.indexOf('<form') !== -1, 'path and form');
  assert.ok(p.body.indexOf('default branch') !== -1, 'default branch wording');
  assert.ok(p.body.indexOf('new branch') === -1, 'preview must not say new branch');
  seed('cpv-t3b', { artefactPath: PATH, artefactContent: '# x', committedAt: '2026-11-16T00:00:00.000Z' });
  const r = await getResult('discovery', 'cpv-t3b');
  assert.strictEqual(r.statusCode, 200, 'result answered ' + r.statusCode);
  assert.ok(r.body.indexOf('The artefact has been committed.') !== -1, 'result copy');
  assert.ok(r.body.indexOf('new branch') === -1, 'result must not say new branch');
});

test('T4 the commit POST for an unknown or empty session is a 404 and makes no GitHub request (AC4)', async () => {
  seed('cpv-t4b', {});
  await withFetch(OK, async (calls) => {
    for (const id of ['cpv-t4-unknown', 'cpv-t4b']) {
      const r = await postCommit('discovery', id);
      assert.strictEqual(r.statusCode, 404, id + ' answered ' + r.statusCode + ' ' + r.body.slice(0, 120));
    }
    assert.strictEqual(calls.length, 0, 'no outward request, saw ' + JSON.stringify(calls));
  });
});

test('T5 the commit POST for a drafted session makes exactly one PUT and redirects to the result page (AC5)', async () => {
  seed('cpv-t5', { artefactPath: PATH, artefactContent: '# x' });
  await withFetch(OK, async (calls) => {
    const r = await postCommit('discovery', 'cpv-t5');
    assert.strictEqual(r.statusCode, 303, 'answered ' + r.statusCode + ' ' + r.body.slice(0, 120));
    assert.strictEqual(r.headers.location, '/skills/discovery/sessions/cpv-t5/result');
    assert.strictEqual(calls.length, 1, 'exactly one request, saw ' + JSON.stringify(calls));
    assert.strictEqual(calls[0].method, 'PUT');
    assert.ok(calls[0].url.endsWith('/contents/' + PATH), 'url ' + calls[0].url);
  });
});

test('T6 htmlGetPreview is unchanged: an unknown session still gives empty strings (AC6)', () => {
  assert.deepStrictEqual(skills.htmlGetPreview('discovery', 'cpv-t6-unknown'), { artefactContent: '', artefactPath: '' });
});

test('T7 the checked function only ever rejects with the 404 error (NFR)', async () => {
  assert.strictEqual(typeof skills.htmlGetCommitPreviewChecked, 'function', 'exported');
  for (const bad of [undefined, '', 'x'.repeat(300), 42]) {
    let err = null;
    try { await skills.htmlGetCommitPreviewChecked('discovery', bad); } catch (e) { err = e; }
    assert.ok(err, 'rejects for ' + String(bad).slice(0, 10));
    assert.strictEqual(err.status, 404, 'status for ' + String(bad).slice(0, 10) + ' was ' + err.status);
    assert.strictEqual(err.message, NOTHING);
  }
});

(async () => {
  let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('  PASS ' + t.name); }
    catch (e) { failed++; console.log('  FAIL ' + t.name + '\n       ' + (e && e.message)); }
  }
  console.log('\n' + (tests.length - failed) + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
