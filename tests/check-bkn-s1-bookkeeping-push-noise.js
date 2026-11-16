'use strict';
// bkn-s1 -- bookkeeping pushes to master start no workflow that adds nothing.
// Parses the workflow files (structure, not text). Plain Node script. Run: node tests/check-bkn-s1-bookkeeping-push-noise.js
// Story: artefacts/2026-11-17-bookkeeping-push-noise/stories/bkn-s1-stop-bookkeeping-push-noise.md
// Test plan: artefacts/2026-11-17-bookkeeping-push-noise/test-plans/bkn-s1-test-plan.md

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const dir = path.join(root, '.github', 'workflows');

// The project declares no YAML parser, so this reads only the top-level `on:` block of a workflow: nested maps,
// `- item` lists (also `- key: value` items), inline `[a, b]` lists, quoted scalars and `#` comments. That is all
// the trigger blocks use.
function stripComment(s) {
  let q = null;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) { if (c === q) q = null; }
    else if (c === '"' || c === "'") q = c;
    else if (c === '#' && (i === 0 || /\s/.test(s[i - 1]))) return s.slice(0, i);
  }
  return s;
}
function scalar(v) {
  v = v.trim();
  if (/^\[.*\]$/.test(v)) return v.slice(1, -1).split(',').map(scalar).filter(function (x) { return x !== ''; });
  if ((v[0] === "'" && v[v.length - 1] === "'") || (v[0] === '"' && v[v.length - 1] === '"')) return v.slice(1, -1);
  return v;
}
function parseNode(lines, state, indent) {
  const first = lines[state.i];
  if (first.text.indexOf('- ') === 0 || first.text === '-') {
    const list = [];
    while (state.i < lines.length && lines[state.i].indent === indent && (lines[state.i].text.indexOf('- ') === 0 || lines[state.i].text === '-')) {
      const item = lines[state.i].text.slice(1).trim();
      if (/^[A-Za-z0-9_.'"-]+:(\s|$)/.test(item)) { lines[state.i] = { indent: indent + 2, text: item }; list.push(parseNode(lines, state, indent + 2)); }
      else { list.push(scalar(item)); state.i++; }
    }
    return list;
  }
  const map = {};
  while (state.i < lines.length && lines[state.i].indent === indent && lines[state.i].text.indexOf('- ') !== 0) {
    const m = /^("[^"]*"|'[^']*'|[^:]+):(?:\s+(.*))?$/.exec(lines[state.i].text);
    if (!m) throw new Error('cannot parse line: ' + lines[state.i].text);
    const key = m[1].replace(/^["']|["']$/g, '');
    const rest = (m[2] || '').trim();
    state.i++;
    if (rest !== '') { map[key] = scalar(rest); continue; }
    const nxt = lines[state.i];
    if (nxt && (nxt.indent > indent || (nxt.indent === indent && nxt.text.indexOf('- ') === 0))) map[key] = parseNode(lines, state, nxt.indent);
    else map[key] = null;
  }
  return map;
}
function load(name) {
  const raw = fs.readFileSync(path.join(dir, name), 'utf8').split(/\r?\n/);
  const at = raw.findIndex(function (l) { return /^("on"|'on'|on):/.test(l); });
  if (at === -1) throw new Error(name + ': no top-level on: block');
  const head = stripComment(raw[at]).replace(/^("on"|'on'|on):/, '').trim();
  if (head !== '') {
    const v = scalar(head);
    const names = Array.isArray(v) ? v : [v];
    return { on: names.reduce(function (o, k) { o[k] = null; return o; }, {}) };
  }
  const body = [];
  for (let i = at + 1; i < raw.length; i++) {
    const t = stripComment(raw[i]);
    if (t.trim() === '') continue;
    if (/^\S/.test(t)) break; // next top-level key
    body.push({ indent: t.length - t.replace(/^ +/, '').length, text: t.trim() });
  }
  if (body.length === 0) throw new Error(name + ': empty on: block');
  return { on: parseNode(body, { i: 0 }, body[0].indent) };
}

// The bookkeeping paths: the same meaning as staging-deploy.yml's paths-ignore.
const BOOKKEEPING = ['workspace/**', 'artefacts/**', '.github/pipeline-state.json'];
// Push workflows allowed to have no bookkeeping exclusion. Starts empty; an entry needs a reason.
const ALLOWED = {};

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

test('T1 Trace Commit ignores bookkeeping paths on a master push (AC1)', function () {
  const { on } = load('trace-commit.yml');
  assert.ok(on.push && (on.push.branches || []).indexOf('master') !== -1, 'trace-commit no longer triggers on master pushes');
  const ig = on.push['paths-ignore'] || [];
  BOOKKEEPING.forEach(function (g) { assert.ok(ig.indexOf(g) !== -1, 'paths-ignore is missing ' + g + ' (has: ' + JSON.stringify(ig) + ')'); });
});

test('T2 Vulnerability Check follows the dependency files, weekly and manually (AC2)', function () {
  const { on } = load('vulnerability-check.yml');
  ['push', 'pull_request'].forEach(function (ev) {
    const p = (on[ev] && on[ev].paths) || [];
    ['package.json', 'package-lock.json'].forEach(function (f) { assert.ok(p.indexOf(f) !== -1, ev + ' paths is missing ' + f + ' (has: ' + JSON.stringify(p) + ')'); });
    assert.ok(!(on[ev] && on[ev]['paths-ignore']), ev + ' mixes paths and paths-ignore');
  });
  assert.ok(Array.isArray(on.schedule) && on.schedule.length === 1 && /^\S+ \S+ \S+ \S+ \S+$/.test(on.schedule[0].cron), 'no weekly schedule');
  assert.ok(Object.prototype.hasOwnProperty.call(on, 'workflow_dispatch'), 'no manual trigger');
});

test('T3 the dreaming workflow has no push trigger, only schedule and manual (AC3)', function () {
  const { on } = load('improvement-agent-schedule.yml');
  assert.ok(!Object.prototype.hasOwnProperty.call(on, 'push'), 'dreaming still triggers on push');
  assert.ok(Array.isArray(on.schedule) && on.schedule.length >= 1, 'dreaming lost its schedule');
  assert.ok(Object.prototype.hasOwnProperty.call(on, 'workflow_dispatch'), 'dreaming lost its manual trigger');
});

test('T4 every workflow that pushes on master excludes bookkeeping (guard) (AC4)', function () {
  const bad = [];
  fs.readdirSync(dir).filter(function (f) { return /\.ya?ml$/.test(f); }).forEach(function (f) {
    const { on } = load(f);
    if (!on.push) return;
    const branches = on.push.branches;
    if (branches && branches.indexOf('master') === -1) return; // never runs on master pushes
    if (ALLOWED[f]) return;
    const ig = on.push['paths-ignore'];
    const paths = on.push.paths;
    const ok = (ig && BOOKKEEPING.every(function (g) { return ig.indexOf(g) !== -1; })) ||
      (paths && paths.length > 0 && !paths.some(function (p) { return /^(workspace|artefacts)\//.test(p) || p === '.github/pipeline-state.json'; }));
    if (!ok) bad.push(f);
  });
  assert.deepStrictEqual(bad, [], 'master push workflows with no bookkeeping exclusion: ' + bad.join(', '));
});

test('T5 every workflow parses and the other tests that read these workflows still pass (AC5)', function () {
  fs.readdirSync(dir).filter(function (f) { return /\.ya?ml$/.test(f); }).forEach(function (f) { load(f); });
  ['tests/check-trace-commit.js', 'tests/check-coha-s3-vulnerability-ci-step.js', 'tests/check-trw1-trace-writer.js'].forEach(function (f) {
    const r = spawnSync(process.execPath, [path.join(root, f)], { cwd: root, encoding: 'utf8', timeout: 90000 });
    assert.strictEqual(r.status, 0, f + ' exited ' + r.status + ': ' + String(r.stdout + r.stderr).slice(-300));
  });
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[bkn-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[bkn-s1] FAIL: ' + t.name + '\n    ' + String(e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[bkn-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
