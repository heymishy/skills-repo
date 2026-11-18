'use strict';
// rvc-s1 -- the review checklist: parsing REVIEW.md, globs, reading a unified-0 diff, matching entries to a diff,
// validating each entry's source against git, and the listing. Plain Node script.
// Run: node tests/check-rvc-s1-review-checklist.js

const assert = require('assert');
const path = require('path');
const childProcess = require('child_process');
const root = path.resolve(__dirname, '..');
const rc = require(path.join(root, 'scripts', 'review-checklist.js'));

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

const FIXTURE = [
  '# fixture',
  '',
  '## Adapter stubs throw',
  '- paths: src/web-ui/**/*.js',
  '- match: function set[A-Z]\\w*\\(',
  '- check: the default stub throws',
  '- source: CLAUDE.md',
  '',
  '## Any change to the session file',
  '- paths: src/web-ui/routes/*.js',
  '- check: read the whole diff of that file',
  '- source: CLAUDE.md',
].join('\n');

const DIFF = [
  'diff --git a/src/web-ui/routes/skills.js b/src/web-ui/routes/skills.js',
  '--- a/src/web-ui/routes/skills.js',
  '+++ b/src/web-ui/routes/skills.js',
  '@@ -10,0 +11,2 @@',
  '+function setFoo(fn) { _foo = fn; }',
  '+var unrelated = 1;',
  'diff --git a/src/web-ui/adapters/a.js b/src/web-ui/adapters/a.js',
  '--- a/src/web-ui/adapters/a.js',
  '+++ b/src/web-ui/adapters/a.js',
  '@@ -1,0 +2 @@',
  '+const quiet = true;',
  'diff --git a/docs/readme.md b/docs/readme.md',
  '--- a/docs/readme.md',
  '+++ b/docs/readme.md',
  '@@ -1,0 +1 @@',
  '+function setNotCode() {}',
  'diff --git a/gone.js b/gone.js',
  '--- a/gone.js',
  '+++ /dev/null',
  '@@ -1 +0,0 @@',
  '-was here',
].join('\n');

test('T1a entries parse with their paths, match, check and source', function () {
  const r = rc.parseChecklist(FIXTURE);
  assert.deepStrictEqual(r.problems, []);
  assert.strictEqual(r.items.length, 2);
  assert.strictEqual(r.items[0].title, 'Adapter stubs throw');
  assert.deepStrictEqual(r.items[0].paths, ['src/web-ui/**/*.js']);
  assert.ok(r.items[0].match instanceof RegExp && r.items[0].match.test('function setFoo(fn) {'));
  assert.strictEqual(r.items[1].match, null);
  assert.strictEqual(r.items[1].source, 'CLAUDE.md');
});

test('T1b an entry missing its check or source is reported by title', function () {
  const r = rc.parseChecklist('## Half done\n- paths: src/*.js\n- source: CLAUDE.md\n');
  assert.ok(r.problems.some(function (p) { return /Half done/.test(p) && /check/.test(p); }), JSON.stringify(r.problems));
});

test('T2 a changed matching file with a matching added line lists the entry with that file and line', function () {
  const { items } = rc.parseChecklist(FIXTURE);
  const triggered = rc.triggeredItems(items, rc.parseDiff(DIFF));
  const hit = triggered.find(function (t) { return t.item.title === 'Adapter stubs throw'; });
  assert.ok(hit, 'entry should be listed');
  assert.strictEqual(hit.hits.length, 1);
  assert.strictEqual(hit.hits[0].path, 'src/web-ui/routes/skills.js');
  assert.strictEqual(hit.hits[0].line, 'function setFoo(fn) { _foo = fn; }');
});

test('T3 a matching file with no matching added line does not list a match entry', function () {
  const { items } = rc.parseChecklist(FIXTURE);
  const triggered = rc.triggeredItems(items, rc.parseDiff(DIFF));
  // src/web-ui/adapters/a.js matches paths but adds no setX( line; docs/readme.md adds one but is outside paths
  assert.ok(!triggered.some(function (t) { return t.item.title === 'Adapter stubs throw' && t.hits.some(function (h) { return h.path === 'src/web-ui/adapters/a.js'; }); }));
  assert.ok(!triggered.some(function (t) { return t.hits.some(function (h) { return h.path === 'docs/readme.md'; }); }));
});

test('T4 an entry without match lists for any changed matching file, with no line', function () {
  const { items } = rc.parseChecklist(FIXTURE);
  const hit = rc.triggeredItems(items, rc.parseDiff(DIFF)).find(function (t) { return t.item.title === 'Any change to the session file'; });
  assert.ok(hit, 'entry should be listed');
  assert.ok(hit.hits.some(function (h) { return h.path === 'src/web-ui/routes/skills.js' && !h.line; }));
});

test('T5 --check reports an entry whose source is not tracked, naming the entry and the path', function () {
  const { items } = rc.parseChecklist(FIXTURE.replace('source: CLAUDE.md', 'source: gone/away.md'));
  const problems = rc.validateChecklist(items, function (p) { return p === 'CLAUDE.md'; });
  assert.ok(problems.some(function (p) { return /Adapter stubs throw/.test(p) && /gone\/away\.md/.test(p); }), JSON.stringify(problems));
});

test('T6 the committed REVIEW.md is valid and every source is tracked in git', function () {
  const r = rc.parseChecklist(require('fs').readFileSync(path.join(root, 'REVIEW.md'), 'utf8'));
  assert.deepStrictEqual(r.problems, []);
  assert.ok(r.items.length >= 8, 'at least eight seeded entries');
  const ls = childProcess.spawnSync('git', ['ls-files'], { cwd: root, encoding: 'utf8' });
  const tracked = new Set(ls.stdout.split('\n').filter(Boolean));
  assert.deepStrictEqual(rc.validateChecklist(r.items, function (p) { return tracked.has(p); }), []);
});

test('T7 a diff that matches no entry gives the no-entry listing', function () {
  const text = rc.formatListing([]);
  assert.ok(/No checklist entry applies/.test(text), text);
});

test('T8 globs: * stays in one segment, ** crosses segments', function () {
  assert.ok(rc.globToRegExp('src/web-ui/*.js').test('src/web-ui/a.js'));
  assert.ok(!rc.globToRegExp('src/web-ui/*.js').test('src/web-ui/x/b.js'));
  assert.ok(rc.globToRegExp('src/**/*.js').test('src/a/b/c.js'));
  assert.ok(rc.globToRegExp('src/**/*.js').test('src/c.js'));
});

test('T9 the diff reader counts added lines only, and skips deleted files', function () {
  const files = rc.parseDiff(DIFF);
  const paths = files.map(function (f) { return f.path; });
  assert.deepStrictEqual(paths, ['src/web-ui/routes/skills.js', 'src/web-ui/adapters/a.js', 'docs/readme.md']);
  assert.deepStrictEqual(files[0].added.map(function (a) { return a.text; }), ['function setFoo(fn) { _foo = fn; }', 'var unrelated = 1;']);
  assert.strictEqual(files[0].added[0].line, 11);
});

(function main() {
  let passed = 0, failed = 0;
  // async-safe: every test here is synchronous
  for (const t of tests) {
    try { t.fn(); console.log('[rvc-s1] PASS: ' + t.name); passed++; }
    catch (e) { console.error('[rvc-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
  }
  console.log('\n[rvc-s1] ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed > 0 ? 1 : 0);
})();
