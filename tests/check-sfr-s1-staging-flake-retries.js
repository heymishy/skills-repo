'use strict';

// check-sfr-s1-staging-flake-retries.js -- TDD tests for sfr-s1
// Story: artefacts/2026-11-21-staging-flake-retries/stories/sfr-s1-staging-steps-retry-once.md
//
// 4 of the 5 staging deploys that ran to completion between 2026-11-19 and 2026-11-21 failed on a flaky assertion (the
// bri-s3.3 AC1 /admin/credits call, the a1 AC1 5-second round-trip) and a single failure blocks the promotion. The three
// staging commands (the @mocked smoke and the two post-deploy confirmations) now retry once, list flaky tests in the step
// summary, and the two flaky tests are in the flake ledger (tracking issue #1181).
//
// S1-S4 read .github/workflows/*.yml and playwright.config.js as text. S5 and S6 read the ledger and the policy and run
// the real scripts/flake-check.js. The staging steps only run on CI after a merge to master.
//
// Run: node tests/check-sfr-s1-staging-flake-retries.js

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); console.log('  [PASS] ' + name); passed++; }
  catch (e) { console.error('  [FAIL] ' + name + ': ' + e.message); failed++; }
}
function read(rel) { return fs.readFileSync(path.join(root, rel), 'utf8').replace(/\r\n/g, '\n'); }

const WORKFLOW = '.github/workflows/staging-deploy.yml';
const steps = read(WORKFLOW).split(/\n      - name: /).slice(1).map((s) => '      - name: ' + s);
function stepWith(needle) {
  const hits = steps.filter((s) => s.indexOf(needle) !== -1 && /\n\s+run: .*playwright test/.test(s));
  assert.strictEqual(hits.length, 1, 'expected exactly one playwright step containing "' + needle + '", found ' + hits.length);
  return hits[0];
}
function jsonName(step) {
  const m = step.match(/PLAYWRIGHT_JSON_OUTPUT_NAME:\s*(\S+)/);
  assert.ok(m, 'the step must set PLAYWRIGHT_JSON_OUTPUT_NAME');
  return m[1].replace(/['"]/g, '');
}

const smoke = () => stepWith('--grep "@mocked"');
const confirmA = () => stepWith('a1-staging-auth-stub.spec.js');
const confirmB = () => stepWith('b1-formed-idea-outer-loop-story-map.spec.js');

console.log('\nAC1 / AC2 -- the three staging commands retry once');
test('S1 the smoke command keeps --grep "@mocked" --workers=1 and adds --retries=1 --reporter=list,json with a report file', () => {
  const s = smoke();
  assert.ok(/--grep "@mocked" --workers=1/.test(s), 'still the @mocked run, serialised');
  assert.ok(/--retries=1\b/.test(s), '--retries=1');
  assert.ok(/--reporter=list,json/.test(s), '--reporter=list,json');
  assert.ok(/\.json$/.test(jsonName(s)), 'a .json report name');
});
test('S2 both post-deploy commands keep their specs and --workers=1 and add --retries=1 --reporter=list,json with their own report files', () => {
  const a = confirmA(), b = confirmB();
  ['a1-staging-auth-stub', 'a2-stripe-test-mode-plan-selection', 'a3-product-feature-ideate-canvas', 'a4-ideate-session-resume', 'dsh-s4-resume-conversation-survives-restart'].forEach((spec) => assert.ok(a.indexOf(spec + '.spec.js') !== -1, 'Scenario A keeps ' + spec));
  assert.ok(a.indexOf('b1-formed-idea') === -1, 'Scenario A does not run b1');
  [a, b].forEach((s) => {
    assert.ok(/--workers=1/.test(s), '--workers=1 kept');
    assert.ok(/--retries=1\b/.test(s) && /--reporter=list,json/.test(s), 'retries and json reporter');
  });
  const names = [jsonName(smoke()), jsonName(a), jsonName(b)];
  assert.strictEqual(new Set(names).size, 3, 'three distinct report files: ' + names.join(', '));
});

console.log('\nAC3 -- retries only there');
test('S3 --retries appears on exactly those three commands; no other workflow and no playwright.config.js retries', () => {
  const wf = read(WORKFLOW);
  assert.strictEqual((wf.match(/--retries/g) || []).length, 3, 'exactly three --retries in staging-deploy.yml');
  fs.readdirSync(path.join(root, '.github', 'workflows')).filter((f) => /\.ya?ml$/.test(f) && f !== 'staging-deploy.yml').forEach((f) => {
    assert.ok(!/--retries/.test(read('.github/workflows/' + f)), f + ' must not use --retries (pull request jobs stay as they are)');
  });
  assert.ok(!/\bretries\b/.test(read('playwright.config.js')), 'playwright.config.js must not set retries');
});

console.log('\nAC4 -- flaky tests are reported, not enforced');
test('S4 each of the three steps is followed by an if: always() flake report on its own file, and --strict is not used', () => {
  const wf = read(WORKFLOW);
  assert.ok(!/--strict/.test(wf), 'no --strict in the deploy workflow');
  [smoke(), confirmA(), confirmB()].forEach((s) => {
    const file = jsonName(s);
    const at = steps.indexOf(s);
    const report = steps.slice(at + 1).find((x) => x.indexOf('flake-check.js --report ' + file) !== -1);
    assert.ok(report, 'a later step must run flake-check.js --report ' + file);
    assert.ok(/\n\s+if: .*always\(\)/.test(report), 'the report step runs even when the tests failed (if: always())');
    assert.ok(/GITHUB_STEP_SUMMARY/.test(report), 'and writes to the step summary');
  });
});

console.log('\nAC5 -- the ledger');
function specTitle(file, re) {
  const m = read('tests/e2e/' + file).match(re);
  assert.ok(m, 'could not find the test title in ' + file);
  return file + ' > ' + m[1];
}
const EXPECTED_TESTS = () => [
  specTitle('bri-s3.3-multi-user-tenant-journey.spec.js', /test\('(AC1: admin \(alice\) succeeds[^']*)'/),
  specTitle('a1-staging-auth-stub.spec.js', /test\('(AC1: GitHub OAuth stub[^']*)'/)
];
test('S5 the ledger has exactly the two flaky tests with owner, tracking issue #1181 and a 14-day review; flake-check passes and shows both as tracked under --strict', () => {
  const ledger = JSON.parse(read('tests/e2e/flake-ledger.json'));
  const expected = EXPECTED_TESTS();
  assert.deepStrictEqual(ledger.entries.map((e) => e.test).sort(), expected.slice().sort(), 'ledger names must equal the spec files and titles');
  ledger.entries.forEach((e) => {
    assert.strictEqual(e.owner, 'heymishy');
    assert.ok(/#1181|issues\/1181/.test(e.issue), 'issue names #1181: ' + e.issue);
    assert.strictEqual(e.firstSeen, '2026-11-21');
    assert.strictEqual(e.reviewBy, '2026-12-05');
    assert.ok(e.note && e.note.length > 40, 'a note with the first failure and how often');
  });
  const chk = spawnSync(process.execPath, [path.join(root, 'scripts', 'flake-check.js'), '--check'], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(chk.status, 0, '--check: ' + chk.stdout + chk.stderr);
  // A Playwright-shaped report in which both tests passed only on retry.
  const mk = (title, file) => ({ title: title, file: file, tests: [{ status: 'flaky', projectName: 'chromium', results: [{ status: 'failed', retry: 0, errors: [{ message: 'first attempt' }] }, { status: 'passed', retry: 1, errors: [] }] }] });
  const report = { suites: expected.map((n) => { const i = n.indexOf(' > '); return { file: n.slice(0, i), specs: [mk(n.slice(i + 3), n.slice(0, i))] }; }) };
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'check-sfr-s1-'));
  const rp = path.join(tmp, 'report.json');
  fs.writeFileSync(rp, JSON.stringify(report));
  const rep = spawnSync(process.execPath, [path.join(root, 'scripts', 'flake-check.js'), '--report', rp, '--strict'], { cwd: root, encoding: 'utf8' });
  fs.rmSync(tmp, { recursive: true, force: true });
  assert.strictEqual(rep.status, 0, '--report --strict must exit 0 when both are in the ledger: ' + rep.stdout + rep.stderr);
  expected.forEach((n) => assert.ok(rep.stdout.indexOf(n) !== -1, 'report lists ' + n));
  assert.ok(!/NOT IN LEDGER/.test(rep.stdout), 'neither is reported as NOT IN LEDGER: ' + rep.stdout);
});

console.log('\nAC6 -- the policy');
test('S6 the policy names the three staging steps as the only place retries are on and the flk-s1 check still passes', () => {
  const text = read('tests/FLAKE-POLICY.md');
  assert.ok(/staging smoke/i.test(text) && /post-deploy/i.test(text), 'names the smoke and the post-deploy steps');
  assert.ok(/--retries=1/.test(text), 'names the setting');
  assert.ok(/are off in this repository, with one exception: the three staging steps in `\.github\/workflows\/staging-deploy\.yml`/.test(text), 'states retries are off everywhere except those three staging steps');
  assert.ok(/does not fail the run/.test(text) && /without `--strict`/.test(text), 'states that the flaky report is not enforced');
  assert.ok(/flake-ledger\.json/.test(text), 'still points to the ledger');
  const chk = spawnSync(process.execPath, [path.join(root, 'tests', 'check-flk-s1-flake-policy.js')], { cwd: root, encoding: 'utf8' });
  assert.strictEqual(chk.status, 0, 'check-flk-s1: ' + chk.stdout.slice(-400) + chk.stderr);
});

console.log('\n[sfr-s1] ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
