'use strict';
// wfe-s1 T1 to T4 (AC1 to AC4, issue #1146) -- a feature the web app records in pipeline-state.json for the first time
// carries every field the schema requires, so the repository's own integrity check, trace validation and
// check-bfl-s2 no longer fail on every pull request. Drives the github writer through its stubbed Contents API (as
// check-wsd-s2 does) and the local-fs writer in a temporary git checkout, and runs the real integrity script against
// the result. Plain Node script. Run: node tests/check-wfe-s1-complete-feature-entries.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const githubWriterFactory = require(path.join(root, 'src', 'web-ui', 'adapters', 'pipeline-state-github-writer'));
const localWriterFactory = require(path.join(root, 'src', 'web-ui', 'adapters', 'pipeline-state-writer'));
const schema = JSON.parse(fs.readFileSync(path.join(root, '.github', 'pipeline-state.schema.json'), 'utf8'));
const REQUIRED = schema.properties.features.items.required;

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

function b64(obj) { return Buffer.from(JSON.stringify(obj, null, 2) + '\n', 'utf8').toString('base64'); }
function jsonResponse(status, body) { return { ok: status >= 200 && status < 300, status: status, json: async function () { return body; } }; }
function baseState() {
  return { schemaVersion: '1', features: [
    { slug: 'old-feat', id: 'old-feat', name: 'An old feature', track: 'short', stage: 'review', health: 'green', updatedAt: 'T0', stories: [] }
  ] };
}

/** Runs the github writer once against a stubbed Contents API and returns the state it would PUT. */
async function githubWrite(slug, update) {
  const state = baseState();
  let putBody = null;
  const original = global.fetch;
  global.fetch = async function (url, opts) {
    if (/\/user$/.test(url)) return jsonResponse(200, { login: 'octocat', name: 'The Octocat', email: 'o@example.com' });
    if (/\/git\/blobs\//.test(url)) return jsonResponse(200, { content: b64(state), encoding: 'base64' });
    if (/\/contents\//.test(url) && opts && opts.method === 'PUT') { putBody = JSON.parse(opts.body); return jsonResponse(200, {}); }
    if (/\/contents\//.test(url)) return jsonResponse(200, { sha: 'sha-1' });
    throw new Error('Unhandled fetch call: ' + url);
  };
  try {
    await githubWriterFactory()(slug, null, update, { token: 'tok', owner: 'acme', repo: 'proj' });
  } finally { global.fetch = original; }
  assert.ok(putBody, 'the writer must PUT the state');
  return JSON.parse(Buffer.from(putBody.content, 'base64').toString('utf8'));
}
function feature(state, slug) { return state.features.filter(function (f) { return f.slug === slug; })[0]; }

test('T1a a new feature is created with every required field and the update\'s own fields', async function () {
  const out = await githubWrite('new-feature-aaaa1111', { discoveryStatus: 'complete', artefact: 'artefacts/new-feature-aaaa1111/discovery.md' });
  const f = feature(out, 'new-feature-aaaa1111');
  assert.ok(f, 'the feature must be created');
  assert.strictEqual(f.id, 'new-feature-aaaa1111');
  assert.strictEqual(f.name, 'new-feature-aaaa1111');
  assert.strictEqual(f.track, 'standard');
  assert.strictEqual(f.stage, 'discovery');
  assert.strictEqual(f.health, 'green');
  assert.strictEqual(f.discoveryStatus, 'complete');
  assert.strictEqual(f.artefact, 'artefacts/new-feature-aaaa1111/discovery.md');
});

test('T1b an update that names its own stage, health and name keeps them; a non-string name is ignored', async function () {
  const named = feature(await githubWrite('new-feature-bbbb2222', { stage: 'benefit-metric', health: 'amber', name: 'A named feature' }), 'new-feature-bbbb2222');
  assert.strictEqual(named.stage, 'benefit-metric'); assert.strictEqual(named.health, 'amber'); assert.strictEqual(named.name, 'A named feature');
  const odd = feature(await githubWrite('new-feature-cccc3333', { name: { not: 'a string' }, discoveryStatus: 'complete' }), 'new-feature-cccc3333');
  assert.strictEqual(odd.name, 'new-feature-cccc3333', 'a non-string name must fall back to the slug');
});

test('T1c every field in the schema\'s required list is present on the new feature (the case that was #1146)', async function () {
  const f = feature(await githubWrite('new-feature-dddd4444', { discoveryStatus: 'complete' }), 'new-feature-dddd4444');
  const missing = REQUIRED.filter(function (k) { return f[k] === undefined; });
  assert.deepStrictEqual(missing, [], 'missing required fields: ' + missing.join(', '));
});

test('T2 an existing feature is not touched by the defaults', async function () {
  const out = await githubWrite('old-feat', { health: 'red' });
  const f = feature(out, 'old-feat');
  assert.strictEqual(f.health, 'red');
  assert.strictEqual(f.track, 'short'); assert.strictEqual(f.stage, 'review'); assert.strictEqual(f.name, 'An old feature');
  assert.strictEqual(out.features.length, 1, 'no second feature may be created');
});

test('T3a the real integrity script reports no failure for the state the writer produces', async function () {
  const out = await githubWrite('new-feature-eeee5555', { discoveryStatus: 'complete', artefact: 'artefacts/new-feature-eeee5555/discovery.md' });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wfe-s1-'));
  fs.mkdirSync(path.join(dir, 'scripts')); fs.mkdirSync(path.join(dir, '.github'));
  fs.copyFileSync(path.join(root, 'scripts', 'check-pipeline-state-integrity.js'), path.join(dir, 'scripts', 'check-pipeline-state-integrity.js'));
  fs.copyFileSync(path.join(root, '.github', 'pipeline-state.schema.json'), path.join(dir, '.github', 'pipeline-state.schema.json'));
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify(out, null, 2));
  const r = spawnSync(process.execPath, [path.join(dir, 'scripts', 'check-pipeline-state-integrity.js')], { cwd: dir, encoding: 'utf8' });
  const text = (r.stdout || '') + (r.stderr || '');
  assert.ok(!/FAIL \[C(11|15|16)\]/.test(text), 'the integrity script flagged the new feature:\n' + text.split('\n').filter(function (l) { return /FAIL/.test(l); }).join('\n'));
});

test('T3b every feature in the produced state has every schema-required field', async function () {
  const out = await githubWrite('new-feature-ffff6666', { discoveryStatus: 'complete' });
  out.features.forEach(function (f) {
    const missing = REQUIRED.filter(function (k) { return f[k] === undefined; });
    assert.deepStrictEqual(missing, [], f.slug + ' missing ' + missing.join(', '));
  });
});

test('T4 the local file-system writer creates the same complete entry', function () {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'wfe-s1-local-'));
  fs.mkdirSync(path.join(dir, '.git')); fs.mkdirSync(path.join(dir, '.github'));
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify(baseState(), null, 2));
  localWriterFactory(dir)('new-feature-gggg7777', null, { discoveryStatus: 'complete' });
  const state = JSON.parse(fs.readFileSync(path.join(dir, '.github', 'pipeline-state.json'), 'utf8'));
  const f = feature(state, 'new-feature-gggg7777');
  assert.ok(f, 'the feature must be created');
  const missing = REQUIRED.filter(function (k) { return f[k] === undefined; });
  assert.deepStrictEqual(missing, [], 'missing required fields: ' + missing.join(', '));
  assert.strictEqual(f.track, 'standard'); assert.strictEqual(f.stage, 'discovery'); assert.strictEqual(f.health, 'green');
});

(async function () {
  let passed = 0; let failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[wfe-s1] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[wfe-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[wfe-s1] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
