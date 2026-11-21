'use strict';

// check-ciw-s1-improvement-agent-delivery.js -- TDD tests for ciw-s1
// Story: artefacts/2026-11-16-ci-regression-review/stories/ciw-s1-fix-improvement-agent-dreaming.md
//
// The scheduled improvement agent could not push to master (the ruleset refuses the Actions bot), so every
// scheduled run since 2026-10-19 failed. Its last step now calls scripts/improvement-agent-deliver.js, which pushes a
// bot branch and opens a draft pull request.
//
// T1-T7 drive the real script in a temporary git repository with a bare repository as `origin` and a stand-in for the
// `gh` command line tool (records its arguments, answers `pr list` from a file). No network, no real pull request.
// T8 reads the workflow as text, because the workflow only runs on CI.
//
// Run: node tests/check-ciw-s1-improvement-agent-delivery.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const scriptPath = path.join(root, 'scripts', 'improvement-agent-deliver.js');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log('  [PASS] ' + name); passed++; }
  catch (e) { console.error('  [FAIL] ' + name + ': ' + e.message); failed++; }
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-ciw-s1-'));
let counter = 0;

function git(cwd, args, opts) {
  const r = spawnSync('git', args, Object.assign({ cwd: cwd, encoding: 'utf8' }, opts || {}));
  if (r.status !== 0 && !(opts && opts.allowFail)) throw new Error('git ' + args.join(' ') + ' failed: ' + (r.stderr || r.stdout));
  return (r.stdout || '').trim();
}
function write(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }

// A stand-in for the `gh` command line tool: records every call; answers `pr list` from open-prs.json in FAKE_GH_DIR.
const fakeGh = path.join(tmp, 'fake-gh.js');
write(fakeGh, [
  "const fs = require('fs'); const dir = process.env.FAKE_GH_DIR; const a = process.argv.slice(2);",
  "fs.appendFileSync(dir + '/calls.log', JSON.stringify(a) + '\\n');",
  "if (a[0] === 'pr' && a[1] === 'list') process.stdout.write(fs.readFileSync(dir + '/open-prs.json', 'utf8'));",
  "else if (a[0] === 'pr' && a[1] === 'create') process.stdout.write('https://example.invalid/pull/1\\n');"
].join('\n'));

// A fresh "CI checkout": a bare origin with one commit on master, and a clone of it.
function scenario() {
  const dir = path.join(tmp, 's' + (++counter));
  const remote = path.join(dir, 'origin.git');
  const seed = path.join(dir, 'seed');
  fs.mkdirSync(dir, { recursive: true });
  git(dir, ['init', '--bare', '-q', remote]);
  git(dir, ['init', '-q', seed]);
  git(seed, ['config', 'user.name', 'tester']); git(seed, ['config', 'user.email', 'tester@example.invalid']);
  write(path.join(seed, 'README.md'), 'readme\n');
  write(path.join(seed, 'workspace', 'state.json'), JSON.stringify({ lastDreamRun: null }) + '\n');
  git(seed, ['add', '-A']); git(seed, ['commit', '-q', '-m', 'seed']);
  git(seed, ['branch', '-M', 'master']);
  git(seed, ['remote', 'add', 'origin', remote]);
  git(seed, ['push', '-q', 'origin', 'master']);
  const ghDir = path.join(dir, 'gh'); fs.mkdirSync(ghDir);
  write(path.join(ghDir, 'open-prs.json'), '[]');
  write(path.join(ghDir, 'calls.log'), '');
  return { dir: dir, remote: remote, ghDir: ghDir, work: checkout(dir, remote, 'work') };
}
function checkout(dir, remote, name) {
  const work = path.join(dir, name);
  git(dir, ['clone', '-q', remote, work]);
  git(work, ['config', 'user.name', 'tester']); git(work, ['config', 'user.email', 'tester@example.invalid']);
  return work;
}
function ghCalls(s) {
  return fs.readFileSync(path.join(s.ghDir, 'calls.log'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l));
}
function run(s, work, now) {
  process.env.FAKE_GH_DIR = s.ghDir;
  const mod = require(scriptPath);
  const lines = [];
  const result = mod.deliver({ cwd: work || s.work, gh: [process.execPath, fakeGh], now: now || new Date('2026-11-23T03:17:00Z'), base: 'master', log: (m) => lines.push(m) });
  result.lines = lines;
  return result;
}
function dreamOutputs(work, tag) {
  write(path.join(work, 'workspace', 'proposals', 'proposal-' + tag + '.md'), '# proposal ' + tag + '\n');
  write(path.join(work, 'workspace', 'dream-run-result.json'), JSON.stringify({ run: tag, humanAttentionRequired: true }) + '\n');
  write(path.join(work, 'workspace', 'state.json'), JSON.stringify({ lastDreamRun: '2026-11-23T03:17:00Z', tag: tag }) + '\n');
}
function remoteHeads(s) { return git(s.remote, ['for-each-ref', '--format=%(refname:short) %(objectname)', 'refs/heads']).split('\n').filter(Boolean); }
function remoteMaster(s) { return git(s.remote, ['rev-parse', 'refs/heads/master']); }

console.log('\nAC1 -- a bot branch and a draft pull request, nothing on master');
test('T1 outputs go to improvement-agent/dream-<UTC date and time> as one commit of only the allowed paths, with a draft pull request against master', () => {
  const s = scenario();
  const before = remoteMaster(s);
  dreamOutputs(s.work, 'one');
  const r = run(s);
  assert.strictEqual(r.status, 'delivered');
  assert.strictEqual(r.branch, 'improvement-agent/dream-2026-11-23-0317');
  const heads = remoteHeads(s).map((l) => l.split(' ')[0]);
  assert.ok(heads.indexOf('improvement-agent/dream-2026-11-23-0317') !== -1, 'branch not pushed: ' + heads.join(', '));
  const files = git(s.remote, ['diff', '--name-only', 'master', 'improvement-agent/dream-2026-11-23-0317']).split('\n').sort();
  assert.deepStrictEqual(files, ['workspace/dream-run-result.json', 'workspace/proposals/proposal-one.md', 'workspace/state.json']);
  assert.strictEqual(git(s.remote, ['rev-list', '--count', 'master..improvement-agent/dream-2026-11-23-0317']), '1', 'exactly one commit');
  const create = ghCalls(s).filter((c) => c[0] === 'pr' && c[1] === 'create');
  assert.strictEqual(create.length, 1, 'one pr create call');
  const c = create[0];
  assert.ok(c.indexOf('--draft') !== -1, 'draft');
  assert.strictEqual(c[c.indexOf('--base') + 1], 'master');
  assert.strictEqual(c[c.indexOf('--head') + 1], 'improvement-agent/dream-2026-11-23-0317');
  assert.strictEqual(remoteMaster(s), before, 'master on the remote must not move');
});

console.log('\nAC2 -- nothing to deliver');
test('T2 no changes: no branch, no pull request, exit 0 and "No changes to commit" (also through the command line)', () => {
  const s = scenario();
  const before = remoteHeads(s).join('|');
  const r = run(s);
  assert.strictEqual(r.status, 'no-changes');
  assert.ok(r.lines.join('\n').indexOf('No changes to commit') !== -1);
  assert.strictEqual(remoteHeads(s).join('|'), before, 'no new branch');
  assert.strictEqual(ghCalls(s).filter((c) => c[1] === 'create').length, 0);
  const cli = spawnSync(process.execPath, [scriptPath], { cwd: s.work, encoding: 'utf8', env: Object.assign({}, process.env, { FAKE_GH_DIR: s.ghDir, GH_CMD_JSON: JSON.stringify([process.execPath, fakeGh]) }) });
  assert.strictEqual(cli.status, 0, cli.stdout + cli.stderr);
  assert.ok(/No changes to commit/.test(cli.stdout));
});

console.log('\nAC3 -- only the intended files, fail closed');
test('T3 traces staged by the fetch step are unstaged and never committed', () => {
  const s = scenario();
  dreamOutputs(s.work, 'three');
  for (let i = 0; i < 40; i++) write(path.join(s.work, 'workspace', 'traces', 't' + i + '.json'), '{}\n');
  git(s.work, ['add', '-A', 'workspace/traces']);
  const r = run(s);
  assert.strictEqual(r.status, 'delivered');
  const files = git(s.remote, ['diff', '--name-only', 'master', r.branch]).split('\n');
  assert.ok(!files.some((f) => f.indexOf('workspace/traces/') === 0), 'traces must not be committed: ' + files.join(', '));
  assert.strictEqual(files.length, 3);
});
test('T4 a staged path outside the three allowed paths fails the run and pushes nothing', () => {
  const s = scenario();
  dreamOutputs(s.work, 'four');
  write(path.join(s.work, 'README.md'), 'changed by something else\n');
  git(s.work, ['add', 'README.md']);
  const before = remoteHeads(s).join('|');
  assert.throws(() => run(s), /outside the allowed paths.*README\.md/i);
  assert.strictEqual(remoteHeads(s).join('|'), before, 'nothing may be pushed');
  assert.strictEqual(ghCalls(s).filter((c) => c[1] === 'create').length, 0);
});
test('T5 more than 25 files fails the run and pushes nothing', () => {
  const s = scenario();
  for (let i = 0; i < 26; i++) write(path.join(s.work, 'workspace', 'proposals', 'p' + i + '.md'), 'x\n');
  const before = remoteHeads(s).join('|');
  assert.throws(() => run(s), /more than 25/i);
  assert.strictEqual(remoteHeads(s).join('|'), before);
});

console.log('\nAC4 -- an open dreaming pull request is updated, not duplicated');
test('T6 with an open dreaming pull request the next run adds a commit to its branch by fast-forward and opens no second pull request', () => {
  const s = scenario();
  dreamOutputs(s.work, 'first');
  const first = run(s, null, new Date('2026-11-23T03:17:00Z'));
  const firstHead = git(s.remote, ['rev-parse', 'refs/heads/' + first.branch]);
  write(path.join(s.ghDir, 'open-prs.json'), JSON.stringify([{ number: 7, headRefName: first.branch }, { number: 3, headRefName: 'fix/something-else' }]));
  const fresh = checkout(s.dir, s.remote, 'work2'); // a new CI checkout of master a week later
  dreamOutputs(fresh, 'second');
  const second = run(s, fresh, new Date('2026-11-30T03:15:00Z'));
  assert.strictEqual(second.status, 'updated');
  assert.strictEqual(second.branch, first.branch, 'the same branch');
  const secondHead = git(s.remote, ['rev-parse', 'refs/heads/' + first.branch]);
  assert.notStrictEqual(secondHead, firstHead, 'a new commit');
  const anc = spawnSync('git', ['merge-base', '--is-ancestor', firstHead, secondHead], { cwd: s.remote, encoding: 'utf8' });
  assert.strictEqual(anc.status, 0, 'fast-forward: the earlier head must be an ancestor of the new head (exit ' + anc.status + ')');
  const files = git(s.remote, ['ls-tree', '-r', '--name-only', first.branch]).split('\n');
  assert.ok(files.indexOf('workspace/proposals/proposal-first.md') !== -1 && files.indexOf('workspace/proposals/proposal-second.md') !== -1, 'both proposals on the branch');
  assert.ok(/second/.test(git(s.remote, ['show', first.branch + ':workspace/state.json'])), 'state.json carries the newest run');
  assert.strictEqual(ghCalls(s).filter((c) => c[1] === 'create').length, 1, 'only the first run opened a pull request');
  assert.strictEqual(remoteHeads(s).filter((l) => /improvement-agent\/dream-/.test(l)).length, 1, 'still one dreaming branch');
});

console.log('\nAC1 / AC4 -- never master');
test('T7 the script refuses a base-named target and never moves master (also across the update scenario)', () => {
  const mod = require(scriptPath);
  assert.strictEqual(typeof mod.assertSafeBranch, 'function', 'assertSafeBranch exported');
  assert.throws(() => mod.assertSafeBranch('master', 'master'), /master/i);
  assert.throws(() => mod.assertSafeBranch('main', 'master'), /main|protected/i);
  assert.doesNotThrow(() => mod.assertSafeBranch('improvement-agent/dream-2026-11-23-0317', 'master'));
  const s = scenario();
  const before = remoteMaster(s);
  dreamOutputs(s.work, 'seven');
  run(s);
  assert.strictEqual(remoteMaster(s), before);
  // A forced push that happens to be a fast-forward looks the same as a normal one, so also read the source: no git push may be forced.
  const pushLines = fs.readFileSync(scriptPath, 'utf8').split('\n').filter((l) => /'push'/.test(l));
  assert.ok(pushLines.length >= 2, 'expected the script\'s git push calls, found ' + pushLines.length);
  pushLines.forEach((l) => assert.ok(!/--force|--force-with-lease|'-f'|'\+/.test(l), 'forced push: ' + l.trim()));
});

console.log('\nAC5 -- the workflow');
test('T8 the workflow ends by calling the script, never pushes to master, has the permissions, and keeps its schedule and manual triggers', () => {
  const y = fs.readFileSync(path.join(root, '.github', 'workflows', 'improvement-agent-schedule.yml'), 'utf8');
  assert.ok(/node scripts\/improvement-agent-deliver\.js/.test(y), 'calls the delivery script');
  const code = y.split(/\r?\n/).map((l) => l.replace(/^\s*#.*$/, '').replace(/\s+#\s.*$/, '')).join('\n'); // comments may explain what a step used to do
  assert.ok(!/git push/.test(code), 'the workflow itself must not run git push (the delivery script does, to a bot branch only)');
  assert.ok(!/HEAD:master|origin master|refs\/heads\/master/.test(code), 'no push to master');
  assert.ok(/contents:\s*write/.test(y) && /pull-requests:\s*write/.test(y), 'contents and pull-requests write');
  assert.ok(/schedule:/.test(y) && /workflow_dispatch:/.test(y), 'schedule and manual triggers kept');
  assert.ok(!/^\s*push:/m.test(y), 'no push trigger');
  const steps = y.split(/\n\s+- name: /);
  const lastNamed = steps.filter((st) => /improvement-agent-deliver\.js/.test(st));
  assert.strictEqual(lastNamed.length, 1, 'exactly one step calls the delivery script');
  assert.ok(/GH_TOKEN/.test(lastNamed[0]), 'the delivery step passes GH_TOKEN');
});

console.log('\n[ciw-s1] ' + passed + ' passed, ' + failed + ' failed');
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
process.exit(failed > 0 ? 1 : 0);
