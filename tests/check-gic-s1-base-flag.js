'use strict';
// gic-s1 T1 (AC1) -- scripts/read-base-flag.js reads an opt-in flag from the BASE branch's .github/context.yml, so a
// pull request cannot switch a required check off by editing the file it owns. Uses real temporary git repositories.
// Plain Node script. Run: node tests/check-gic-s1-base-flag.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(__dirname, '..');
const SCRIPT = path.join(root, 'scripts', 'read-base-flag.js');

const tests = [];
function test(name, fn) { tests.push({ name: name, fn: fn }); }

function git(cwd, args) {
  const r = spawnSync('git', ['-c', 'user.email=t@example.com', '-c', 'user.name=t', '-c', 'commit.gpgsign=false'].concat(args), { cwd: cwd, encoding: 'utf8' });
  if (r.status !== 0) throw new Error('git ' + args.join(' ') + ': ' + r.stderr);
  return r.stdout;
}
/** A repo whose base commit (branch "base") has `baseText` as .github/context.yml and whose working tree has `headText`. */
function repoWith(baseText, headText) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'gic-s1-'));
  git(dir, ['init', '-q']);
  git(dir, ['symbolic-ref', 'HEAD', 'refs/heads/base']); // not `init -b`: older git has no such switch
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  if (baseText !== null) fs.writeFileSync(path.join(dir, '.github', 'context.yml'), baseText);
  else fs.writeFileSync(path.join(dir, 'README.md'), 'x');
  git(dir, ['add', '-A']); git(dir, ['commit', '-q', '-m', 'base']);
  if (headText !== null) fs.writeFileSync(path.join(dir, '.github', 'context.yml'), headText);
  return dir;
}
function read(dir, key, extra) {
  return spawnSync(process.execPath, [SCRIPT, key, '--ref', 'base'].concat(extra || []), { cwd: dir, encoding: 'utf8' });
}
const ON = 'audit:\n  ci_platform: github-actions   # adapter\n  staging_e2e_scenario_a: true  # opt-in\n  other_flag: false\n';
const OFF = 'audit:\n  ci_platform: github-actions\n  staging_e2e_scenario_a: false\n  other_flag: false\n';

test('T1a true on the base and false in the working tree (a pull request switching it off) reads true', function () {
  const r = read(repoWith(ON, OFF), 'audit.staging_e2e_scenario_a');
  assert.strictEqual(r.status, 0, r.stderr); assert.strictEqual(r.stdout.trim(), 'true');
});

test('T1b false on the base and true in the working tree (a pull request switching it on) reads false', function () {
  const r = read(repoWith(OFF, ON), 'audit.staging_e2e_scenario_a');
  assert.strictEqual(r.status, 0, r.stderr); assert.strictEqual(r.stdout.trim(), 'false');
});

test('T1c a flag missing on the base, a missing file on the base, and a trailing comment are all handled', function () {
  assert.strictEqual(read(repoWith('audit:\n  x: true\n', ON), 'audit.staging_e2e_scenario_a').stdout.trim(), 'false');
  assert.strictEqual(read(repoWith(null, ON), 'audit.staging_e2e_scenario_a').stdout.trim(), 'false');
  assert.strictEqual(read(repoWith(ON, ON), 'audit.staging_e2e_scenario_a').stdout.trim(), 'true');
  assert.strictEqual(read(repoWith('audit:\n  staging_e2e_scenario_a: yes\n', null), 'audit.staging_e2e_scenario_a').stdout.trim(), 'false');
});

test('T1d a flag in another section with the same name does not count', function () {
  const text = 'other:\n  staging_e2e_scenario_a: true\naudit:\n  something: false\n';
  assert.strictEqual(read(repoWith(text, null), 'audit.staging_e2e_scenario_a').stdout.trim(), 'false');
});

test('T1e a base ref that does not exist fails closed (non-zero, nothing printed as a value)', function () {
  const r = spawnSync(process.execPath, [SCRIPT, 'audit.staging_e2e_scenario_a', '--ref', 'no-such-ref'], { cwd: repoWith(ON, ON), encoding: 'utf8' });
  assert.notStrictEqual(r.status, 0); assert.ok(!/^(true|false)\s*$/m.test(r.stdout), 'must not print a value: ' + r.stdout);
});

test('T1f it never reads the working tree: a changed working file changes nothing', function () {
  const dir = repoWith(ON, ON);
  fs.writeFileSync(path.join(dir, '.github', 'context.yml'), 'garbage: [\n');
  assert.strictEqual(read(dir, 'audit.staging_e2e_scenario_a').stdout.trim(), 'true');
});

let passed = 0; let failed = 0;
tests.forEach(function (t) {
  try { t.fn(); console.log('[gic-s1] PASS: ' + t.name); passed++; }
  catch (e) { console.error('[gic-s1] FAIL: ' + t.name + '\n    ' + String(e && e.message).split('\n').join('\n    ')); failed++; }
});
console.log('\n[gic-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
