'use strict';

// check-dqw-s1-quiet-weeks.js -- TDD tests for dqw-s1
// Story: artefacts/2026-11-21-dreaming-quiet-weeks/stories/dqw-s1-quiet-weeks-open-no-pull-request.md
//
// The first live run of the improvement-agent workflow (run 44869526822) opened a draft pull request although the agent
// found nothing to review: the agent rewrites state.json and dream-run-result.json on every run. The operator chose:
// open a pull request only when there are proposals. These tests drive the real scripts/improvement-agent-deliver.js in
// a temporary git repository with a bare `origin` and a stand-in `gh` (scaffolding copied from the ciw-s1 check).
//
// Run: node tests/check-dqw-s1-quiet-weeks.js

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

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-dqw-s1-'));
let counter = 0;

function git(cwd, args, opts) {
  const r = spawnSync('git', args, Object.assign({ cwd: cwd, encoding: 'utf8' }, opts || {}));
  if (r.status !== 0 && !(opts && opts.allowFail)) throw new Error('git ' + args.join(' ') + ' failed: ' + (r.stderr || r.stdout));
  return (r.stdout || '').trim();
}
function write(file, text) { fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text); }

const fakeGh = path.join(tmp, 'fake-gh.js');
write(fakeGh, [
  "const fs = require('fs'); const dir = process.env.FAKE_GH_DIR; const a = process.argv.slice(2);",
  "fs.appendFileSync(dir + '/calls.log', JSON.stringify(a) + '\\n');",
  "if (a[0] === 'pr' && a[1] === 'list') process.stdout.write(fs.readFileSync(dir + '/open-prs.json', 'utf8'));",
  "else if (a[0] === 'pr' && a[1] === 'create') process.stdout.write('https://example.invalid/pull/1\\n');"
].join('\n'));

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
  write(path.join(seed, 'workspace', 'dream-run-result.json'), JSON.stringify({ runAt: 'earlier', humanAttentionRequired: false }) + '\n');
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
function ghCalls(s) { return fs.readFileSync(path.join(s.ghDir, 'calls.log'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)); }
function creates(s) { return ghCalls(s).filter((c) => c[0] === 'pr' && c[1] === 'create').length; }
function run(s, work, now) {
  process.env.FAKE_GH_DIR = s.ghDir;
  const lines = [];
  const result = require(scriptPath).deliver({ cwd: work || s.work, gh: [process.execPath, fakeGh], now: now || new Date('2026-11-23T03:17:00Z'), base: 'master', log: (m) => lines.push(m) });
  result.lines = lines;
  return result;
}
function remoteHeads(s) { return git(s.remote, ['for-each-ref', '--format=%(refname:short) %(objectname)', 'refs/heads']).split('\n').filter(Boolean).join('|'); }
function stagedNow(work) { return git(work, ['diff', '--cached', '--name-only']); }

// What the agent writes on a quiet week: only timestamps, the interval state and the experiment-signal list.
function quietOutputs(work, extra) {
  write(path.join(work, 'workspace', 'state.json'), JSON.stringify({ lastDreamRun: '2026-11-23T03:17:00Z' }) + '\n');
  const result = Object.assign({ runAt: '2026-11-23T03:17:00Z', proposalsGenerated: 0, proposalPaths: [], humanAttentionRequired: false, attentionReason: null, experimentSignalsDetected: 69, skipped: false }, extra || {});
  write(path.join(work, 'workspace', 'dream-run-result.json'), JSON.stringify(result) + '\n');
}
function proposal(work, tag) { write(path.join(work, 'workspace', 'proposals', 'proposal-' + tag + '.md'), '# proposal ' + tag + '\n'); }

console.log('\nAC1 / AC2 -- a quiet week');
test('Q1 only state and result changed, attention false: no branch, commit or pull request; "Nothing to review this week"; exit 0 (also CLI); nothing left staged', () => {
  const s = scenario();
  const before = remoteHeads(s);
  quietOutputs(s.work);
  const r = run(s);
  assert.strictEqual(r.status, 'quiet');
  assert.ok(r.lines.join('\n').indexOf('Nothing to review this week') !== -1, 'message: ' + r.lines.join(' / '));
  assert.strictEqual(remoteHeads(s), before, 'no new branch');
  assert.strictEqual(creates(s), 0);
  assert.strictEqual(stagedNow(s.work), '', 'nothing may stay staged');
  const cli = spawnSync(process.execPath, [scriptPath], { cwd: s.work, encoding: 'utf8', env: Object.assign({}, process.env, { FAKE_GH_DIR: s.ghDir, GH_CMD_JSON: JSON.stringify([process.execPath, fakeGh]) }) });
  assert.strictEqual(cli.status, 0, cli.stdout + cli.stderr);
  assert.ok(/Nothing to review this week/.test(cli.stdout));
});
test('Q2 a skipped run (the interval guard) is a quiet week', () => {
  const s = scenario();
  quietOutputs(s.work, { skipped: true, skippedReason: 'Interval guard: last run was 1h ago (minimum: 23h)' });
  const r = run(s);
  assert.strictEqual(r.status, 'quiet');
  assert.strictEqual(creates(s), 0);
});

console.log('\nAC3 -- fail closed on a missing or malformed result');
test('Q3 no proposals and no dream-run-result.json: fails naming the file, pushes nothing', () => {
  const s = scenario();
  quietOutputs(s.work);
  fs.unlinkSync(path.join(s.work, 'workspace', 'dream-run-result.json'));
  git(s.work, ['add', '-A', 'workspace']);
  const before = remoteHeads(s);
  assert.throws(() => run(s), /dream-run-result\.json/);
  assert.strictEqual(remoteHeads(s), before);
  assert.strictEqual(creates(s), 0);
});
test('Q4 no proposals and a malformed dream-run-result.json: fails naming the file, pushes nothing', () => {
  const s = scenario();
  quietOutputs(s.work);
  write(path.join(s.work, 'workspace', 'dream-run-result.json'), '{ not json');
  const before = remoteHeads(s);
  assert.throws(() => run(s), /dream-run-result\.json/);
  assert.strictEqual(remoteHeads(s), before);
});

console.log('\nAC4 -- proposals and attention still deliver');
test('Q5 proposal files staged but the result says attention false: a pull request is still opened (proposals win)', () => {
  const s = scenario();
  quietOutputs(s.work);
  proposal(s.work, 'five');
  const r = run(s);
  assert.strictEqual(r.status, 'delivered');
  assert.strictEqual(creates(s), 1);
});
test('Q6 no proposal files but the result asks for attention: a pull request is opened', () => {
  const s = scenario();
  quietOutputs(s.work, { humanAttentionRequired: true, attentionReason: 'needs a look' });
  const r = run(s);
  assert.strictEqual(r.status, 'delivered');
  assert.strictEqual(creates(s), 1);
});

test('Q9 a deleted proposal file is not a proposal: with attention false it is still a quiet week', () => {
  const s = scenario();
  // An earlier proposal exists on master; this week's run removes it and finds nothing new.
  proposal(s.work, 'old');
  git(s.work, ['add', '-A']); git(s.work, ['commit', '-q', '-m', 'an earlier proposal']); git(s.work, ['push', '-q', 'origin', 'master']);
  const fresh = checkout(s.dir, s.remote, 'work-del');
  fs.unlinkSync(path.join(fresh, 'workspace', 'proposals', 'proposal-old.md'));
  quietOutputs(fresh);
  const before = remoteHeads(s);
  const r = run(s, fresh);
  assert.strictEqual(r.status, 'quiet', 'a deleted proposal must not trigger a pull request');
  assert.strictEqual(remoteHeads(s), before);
  assert.strictEqual(creates(s), 0);
});

console.log('\nAC5 -- an open dreaming pull request is left alone on a quiet week');
test('Q7 open dreaming pull request plus a quiet week: its branch head is unchanged and no pull request is created', () => {
  const s = scenario();
  proposal(s.work, 'first');
  quietOutputs(s.work, { humanAttentionRequired: true });
  const first = run(s);
  const headBefore = git(s.remote, ['rev-parse', 'refs/heads/' + first.branch]);
  const createsBefore = creates(s);
  write(path.join(s.ghDir, 'open-prs.json'), JSON.stringify([{ number: 7, headRefName: first.branch }]));
  const fresh = checkout(s.dir, s.remote, 'work2');
  quietOutputs(fresh);
  const r = run(s, fresh, new Date('2026-11-30T03:15:00Z'));
  assert.strictEqual(r.status, 'quiet');
  assert.strictEqual(git(s.remote, ['rev-parse', 'refs/heads/' + first.branch]), headBefore, 'the open branch must not move');
  assert.strictEqual(creates(s), createsBefore, 'no new pull request');
});

console.log('\nAC6 -- still fail closed');
test('Q8 a stray staged path in an otherwise quiet week still fails the run', () => {
  const s = scenario();
  quietOutputs(s.work);
  write(path.join(s.work, 'README.md'), 'changed by something else\n');
  git(s.work, ['add', 'README.md']);
  const before = remoteHeads(s);
  assert.throws(() => run(s), /outside the allowed paths.*README\.md/i);
  assert.strictEqual(remoteHeads(s), before);
});

console.log('\n[dqw-s1] ' + passed + ' passed, ' + failed + ' failed');
try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
process.exit(failed > 0 ? 1 : 0);
