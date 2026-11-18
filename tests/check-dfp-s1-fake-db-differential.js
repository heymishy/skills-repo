'use strict';
// dfp-s1 -- the fake test database and real Postgres: the normaliser, the result comparison, the schema drift check,
// the skip behaviour when no Postgres is configured, and the shape of the scenario list. Plain Node script.
// The differential itself runs in CI (.github/workflows/fake-db-differential.yml). Run: node tests/check-dfp-s1-fake-db-differential.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const diff = require(path.join(root, 'tests', 'differential', 'run.js'));
const { SCENARIOS } = require(path.join(root, 'tests', 'differential', 'scenarios.js'));
const { SCHEMA } = require(path.join(root, 'tests', 'differential', 'schema.js'));

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('T1 compareResults reports a row-count difference and a value difference, and nothing for equal results', function () {
  const a = { rows: [{ id: 1, email: 'a@x' }] };
  assert.deepStrictEqual(diff.compareResults(a, { rows: [{ id: 1, email: 'a@x' }] }), []);
  assert.ok(diff.compareResults(a, { rows: [] }).some(function (p) { return /row count/.test(p); }));
  assert.ok(diff.compareResults(a, { rows: [{ id: 1, email: 'b@x' }] }).some(function (p) { return /value/.test(p); }));
  assert.ok(diff.compareResults({ error: '23505' }, { rows: [] }).length > 0, 'error against rows is a difference');
  assert.deepStrictEqual(diff.compareResults({ error: '23505' }, { error: '23505' }), []);
});

test('T2 the normaliser maps the fake id and a uuid to one placeholder, and leaves an empty string alone', function () {
  assert.strictEqual(diff.normaliseValue('fake-product-3'), '<id>');
  assert.strictEqual(diff.normaliseValue('7c1d2f3a-1b2c-4d5e-8f90-123456789abc'), '<id>');
  assert.strictEqual(diff.normaliseValue(''), '', 'an empty id must still differ from the placeholder');
  assert.notStrictEqual(diff.normaliseValue(''), diff.normaliseValue('fake-product-1'));
});

test('T3 the schema drift check passes on the committed sources and names a statement that is not in its source', function () {
  const readFile = function (rel) { return fs.readFileSync(path.join(root, rel), 'utf8'); };
  assert.deepStrictEqual(diff.driftCheck(SCHEMA, readFile), [], 'committed schema copy matches its sources');
  const fake = [{ source: 'src/web-ui/server.js', statement: 'CREATE TABLE IF NOT EXISTS nothing_like_this (x INT)' }];
  const problems = diff.driftCheck(fake, readFile);
  assert.ok(problems.some(function (p) { return /nothing_like_this/.test(p) && /src\/web-ui\/server\.js/.test(p); }), JSON.stringify(problems));
});

test('T4a with no Postgres URL and no requirement, the run prints a skip line naming the reason and exits 0', async function () {
  const lines = [];
  const code = await diff.main({ env: {}, log: function (s) { lines.push(s); } });
  assert.strictEqual(code, 0);
  assert.ok(lines.some(function (l) { return /skipped/i.test(l) && /DIFF_DATABASE_URL/.test(l); }), lines.join('\n'));
});

test('T4b with DIFF_REQUIRE_PG=1 and no Postgres URL, the run exits non-zero', async function () {
  const lines = [];
  const code = await diff.main({ env: { DIFF_REQUIRE_PG: '1' }, log: function (s) { lines.push(s); } });
  assert.notStrictEqual(code, 0);
});

test('T5 every scenario is an ordered step with a statement and an array of parameters', function () {
  assert.ok(SCENARIOS.length >= 8, 'at least eight steps across users and products');
  SCENARIOS.forEach(function (s) {
    assert.strictEqual(typeof s.name, 'string');
    assert.strictEqual(typeof s.sql, 'string');
    assert.ok(typeof s.params === 'function' || Array.isArray(s.params), s.name + ' params');
  });
  const names = SCENARIOS.map(function (s) { return s.name; });
  assert.strictEqual(new Set(names).size, names.length, 'step names are unique');
});

// The first CI run found this: two products created in the same millisecond came back oldest first, because the fake
// sorted on a millisecond timestamp and kept insertion order on a tie. Postgres sorts on its own timestamp and returns
// the later insert first.
test('T6 the fake lists products newest first even when two were created in the same millisecond', async function () {
  const db = require(path.join(root, 'src', 'web-ui', 'adapters', 'fake-test-db.js')).createFakeTestDb();
  const insert = function (name) {
    return db.query('INSERT INTO products (tenant_id, name, description, mission, tech_stack, constraints, roadmap, architecture_guardrails, created_by) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING product_id',
      ['tenant-a', name, '', '', '', '', '', '', 'tenant-a']);
  };
  const realNow = Date.now;
  Date.now = function () { return 1700000000000; };           // freeze the clock so both inserts share one millisecond
  try {
    const realDate = global.Date;
    global.Date = class extends realDate { constructor(...a) { if (a.length === 0) { super(1700000000000); } else { super(...a); } } };
    try {
      await insert('Alpha');
      await insert('Beta');
    } finally { global.Date = realDate; }
  } finally { Date.now = realNow; }
  const listed = await db.query('SELECT product_id, name, created_at FROM products WHERE tenant_id = $1 ORDER BY created_at DESC', ['tenant-a']);
  assert.deepStrictEqual(listed.rows.map(function (r) { return r.name; }), ['Beta', 'Alpha']);
});

(async function main() {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); console.log('[dfp-s1] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[dfp-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[dfp-s1] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
