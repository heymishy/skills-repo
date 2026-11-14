'use strict';
// coha-s7: incident record pull request for a bridge-opened production error issue.
// Plain Node check script (npm test discovers tests/check-*.js). Needs git on PATH.
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const cp = require('child_process');

const bridge = require('../src/web-ui/routes/error-bridge'); // the REAL producer of the issue body (coha-s6)
const store = require('../scripts/lib/incident-store');
const lib = require('../scripts/lib/error-issue-incident');

const ROOT = path.resolve(__dirname, '..');
const SCRIPT = path.join(ROOT, 'scripts', 'error-issue-incident.js');
const LIB_FILE = path.join(ROOT, 'scripts', 'lib', 'error-issue-incident.js');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'error-issue-incident-record.yml');
const AUTHOR = 'Example-Bot'; // made up; never the real account
const CFG = { bridgeAuthor: AUTHOR };
const CANARY = 'canary-' + crypto.randomBytes(8).toString('hex');

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// Temporary directories made by this run; removed at the end (they are created here, so deleting them is safe).
const dirs = [];
function tmpDir() { const d = fs.mkdtempSync(path.join(os.tmpdir(), 'coha-s7-')); dirs.push(d); return d; }
function writeJson(dir, name, obj) { const f = path.join(dir, name); fs.writeFileSync(f, JSON.stringify(obj)); return f; }
function sha(file) { return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'); }

// A temporary incident file seeded with two synthetic records (written the way the store writes them).
function seedFile(dir) {
  const f = path.join(dir, 'incidents.json');
  const recs = [
    store.createIncidentRecord({ trigger: 'seed one', summary: 'one', tags: ['seed'] }),
    store.createIncidentRecord({ trigger: 'seed two', summary: 'two', tags: ['seed'] })
  ];
  fs.writeFileSync(f, JSON.stringify(recs, null, 2) + '\n');
  return f;
}

// An issue exactly as the real coha-s6 bridge makes it: title is the code, body from the REAL buildBody.
function mk(over) {
  over = over || {};
  const id = over.id || crypto.randomUUID();
  const number = over.number || 77;
  const fields = {
    first_seen: over.firstSeen || '2026-11-13T07:30:00.000Z',
    environment: over.environment || 'production',
    posthog_issue_url: over.link || ('https://us.posthog.com/project/10908/error-tracking/' + id)
  };
  const marker = 'PostHog issue id: ' + (over.markerId !== undefined ? over.markerId : id);
  const body = over.body !== undefined ? over.body : bridge._internals.buildBody(fields, marker);
  const issue = {
    number: number,
    html_url: over.htmlUrl || ('https://github.com/example/repo/issues/' + number),
    title: over.title !== undefined ? over.title : 'tenant_admin_bootstrap_failed',
    body: body,
    user: over.noUser ? undefined : { login: over.login !== undefined ? over.login : AUTHOR },
    labels: over.labels !== undefined ? over.labels : [{ name: 'production-error' }]
  };
  return { issue: issue, id: id, number: number };
}
function ev(issue) { return { action: 'opened', issue: issue, repository: { full_name: 'example/repo' } }; }
function planOf(m, facts, options) {
  return lib.planRun({ event: ev(m.issue), config: CFG, facts: Object.assign({ records: [], branches: [], openPullRequests: [] }, facts || {}), options: options || {} });
}

// Command-line helpers.
function run(args, env) { return cp.spawnSync(process.execPath, [SCRIPT].concat(args), { encoding: 'utf8', env: Object.assign({}, process.env, env || {}) }); }
function readOut(file) { const o = {}; fs.readFileSync(file, 'utf8').split('\n').filter(Boolean).forEach((l) => { const i = l.indexOf('='); o[l.slice(0, i)] = l.slice(i + 1); }); return o; }
function cliSetup(m, opts) {
  opts = opts || {};
  const dir = tmpDir();
  return {
    dir: dir,
    incidents: seedFile(dir),
    eventFile: writeJson(dir, 'event.json', opts.rest ? m.issue : ev(m.issue)),
    factsFile: writeJson(dir, 'facts.json', opts.facts || { branches: [], openPullRequests: [] }),
    out: path.join(dir, 'out.txt')
  };
}
function planArgs(s, extra, author) {
  return ['plan', '--event', s.eventFile, '--author', author === undefined ? AUTHOR : author, '--facts', s.factsFile, '--incidents', s.incidents, '--github-output', s.out].concat(extra || []);
}
function resultLines(res) { return res.stdout.split('\n').filter((l) => /^error-issue-incident: /.test(l)); }

// ---- TESTS APPENDED BELOW THIS LINE (insert new tests above the RUNNER marker) ----

test('U1 the fixed fields are read from the real coha-s6 issue body', () => {
  const m = mk({ title: 'some_error_code' });
  const r = lib.recogniseIssue(ev(m.issue), CFG);
  assert.strictEqual(r.recognised, true);
  assert.strictEqual(r.code, 'some_error_code');
  assert.strictEqual(r.firstSeen, '2026-11-13T07:30:00.000Z');
  assert.strictEqual(r.environment, 'production');
  assert.strictEqual(r.postHogLink, 'https://us.posthog.com/project/10908/error-tracking/' + m.id);
  assert.strictEqual(r.id, m.id);
  assert.strictEqual(r.issueNumber, 77);
  assert.strictEqual(r.issueUrl, m.issue.html_url);
});

test('U2 the id and the branch name', () => {
  const m = mk();
  const r = lib.recogniseIssue(ev(m.issue), CFG);
  assert.strictEqual(r.id, m.id);
  assert.strictEqual(lib.branchNameFor(r.id), 'incident/posthog-' + m.id);
  assert.throws(() => lib.branchNameFor('../x'));
});

test('U3 the record plan: summary, tags, size limit', () => {
  const m = mk({ title: 'my_error' });
  const plan = lib.planRecord(lib.recogniseIssue(ev(m.issue), CFG));
  assert.strictEqual(plan.summary, 'my_error');
  assert.ok(plan.tags.indexOf('production-error') !== -1);
  assert.ok(plan.tags.indexOf('posthog:' + m.id) !== -1);
  assert.ok(plan.tags.every((t) => t === t.toLowerCase()));
  assert.ok(plan.tags.join(',').length <= 200);
});

test('U4 the trigger names the issue link and the PostHog id', () => {
  const m = mk();
  const plan = lib.planRecord(lib.recogniseIssue(ev(m.issue), CFG));
  assert.ok(plan.trigger.indexOf(m.issue.html_url) !== -1);
  assert.ok(plan.trigger.indexOf(m.id) !== -1);
});

test('U6 an issue from any other author is declined, even when everything else matches', () => {
  const m = mk({ login: 'someone-else' });
  const r = lib.recogniseIssue(ev(m.issue), CFG);
  assert.strictEqual(r.recognised, false);
  assert.strictEqual(r.reason, 'author');
  const p = planOf(m);
  assert.strictEqual(p.action, 'decline'); assert.strictEqual(p.reason, 'author'); assert.strictEqual(p.branch, null);
});

test('U7 an unset or empty bridge author recognises nothing', () => {
  const m = mk();
  [undefined, '', '   '].forEach((v) => {
    const r = lib.recogniseIssue(ev(m.issue), { bridgeAuthor: v });
    assert.strictEqual(r.recognised, false); assert.strictEqual(r.reason, 'author');
  });
  assert.strictEqual(lib.recogniseIssue(ev(m.issue), undefined).recognised, false);
  const noUser = mk({ noUser: true });
  assert.strictEqual(lib.recogniseIssue(ev(noUser.issue), { bridgeAuthor: '' }).recognised, false);
  const emptyLogin = mk({ login: '' });
  assert.strictEqual(lib.recogniseIssue(ev(emptyLogin.issue), { bridgeAuthor: '' }).recognised, false);
});

test('U8 the login comparison is exact, letter case included', () => {
  const verdict = (login) => lib.recogniseIssue(ev(mk({ login: login }).issue), CFG).recognised;
  assert.strictEqual(verdict('Example-Bot'), true);
  assert.strictEqual(verdict('example-bot'), false);
  assert.strictEqual(verdict('Example-Bot '), false);
  assert.strictEqual(verdict('Example-Bo'), false);
});

test('U9 the label is required at opening and must match exactly', () => {
  const verdict = (labels) => lib.recogniseIssue(ev(mk({ labels: labels }).issue), CFG);
  [[], null, [{ name: 'production-errors' }], [{ name: 'Production-Error' }], [{ name: 'production_error' }]].forEach((l) => {
    const r = verdict(l); assert.strictEqual(r.recognised, false); assert.strictEqual(r.reason, 'label');
  });
  assert.strictEqual(verdict([{ name: 'bug' }, { name: 'production-error' }]).recognised, true);
});

test('U10 the marker must be a whole line starting at the beginning of a line', () => {
  const id = crypto.randomUUID();
  const head = ['First seen: t', 'Environment: production', 'PostHog: https://us.posthog.com/project/1/error-tracking/' + id, ''];
  const body = (marker, nl) => head.concat([marker, '']).join(nl);
  const verdict = (b) => lib.recogniseIssue(ev(mk({ body: b }).issue), CFG);
  const bad = [
    head.join('\n'),
    body('see PostHog issue id: ' + id + ' here', '\n'),
    body('> PostHog issue id: ' + id, '\n'),
    body('  PostHog issue id: ' + id, '\n'),
    body('PostHog issue id:' + id, '\n')
  ];
  bad.forEach((b) => { const r = verdict(b); assert.strictEqual(r.recognised, false); assert.strictEqual(r.reason, 'marker'); });
  assert.strictEqual(verdict(body('PostHog issue id: ' + id, '\n')).recognised, true);
  assert.strictEqual(verdict(body('PostHog issue id: ' + id, '\r\n')).recognised, true);
});

test('U11 two different markers are ambiguous; the same marker twice is one', () => {
  const a = crypto.randomUUID(), b = crypto.randomUUID();
  const two = 'x\nPostHog issue id: ' + a + '\nPostHog issue id: ' + b + '\n';
  const same = 'x\nPostHog issue id: ' + a + '\nPostHog issue id: ' + a + '\n';
  const r = lib.recogniseIssue(ev(mk({ body: two }).issue), CFG);
  assert.strictEqual(r.recognised, false); assert.strictEqual(r.reason, 'marker-ambiguous');
  assert.strictEqual(lib.recogniseIssue(ev(mk({ body: same }).issue), CFG).recognised, true);
});

test('U12 an id that is not a lowercase UUID is declined and creates no branch', () => {
  const good = crypto.randomUUID();
  const bad = ['../x', 'a b', good.toUpperCase(), good.slice(0, 35), good + '0', good + ';rm', ''];
  bad.forEach((b) => {
    const m = mk({ markerId: b });
    const r = lib.recogniseIssue(ev(m.issue), CFG);
    assert.strictEqual(r.recognised, false, 'id "' + b + '" must be declined');
    assert.strictEqual(r.reason, 'id');
    if (b) assert.ok(String(r.reason).indexOf(b) === -1);
    const p = planOf(m);
    assert.strictEqual(p.action, 'decline'); assert.strictEqual(p.branch, null);
  });
});

test('U13 hostile text stays inert data; control characters and over-long codes are declined', () => {
  const hostile = ['`touch x`', '$(touch x)', '"; touch x; "', '${{ secrets.X }}', '<img src=x onerror=alert(1)>', '@everyone', 'a`b', 'x'.repeat(120)];
  hostile.forEach((title) => {
    const r = lib.recogniseIssue(ev(mk({ title: title }).issue), CFG);
    assert.strictEqual(r.recognised, true, 'title accepted as data: ' + title);
    assert.strictEqual(lib.planRecord(r).summary, title);
    const pr = lib.buildPullRequest(r);
    assert.ok(pr.title.indexOf('\n') === -1 && pr.body.indexOf('\n') === -1);
    const outsideCode = (pr.title + ' ' + pr.body).replace(/`[^`]*`/g, '');
    assert.ok(outsideCode.indexOf('@') === -1, 'no mention outside inline code: ' + title);
    assert.ok(outsideCode.indexOf(title) === -1 || title.length < 3);
  });
  assert.ok(lib.buildPullRequest(lib.recogniseIssue(ev(mk({ title: 'a`b' }).issue), CFG)).title.indexOf("`a'b`") !== -1);
  ['x'.repeat(121), 'two\nlines', 'bell\u0007', ''].forEach((title) => {
    const r = lib.recogniseIssue(ev(mk({ title: title }).issue), CFG);
    assert.strictEqual(r.recognised, false); assert.strictEqual(r.reason, 'code');
  });
});
// RUNNER
(async () => {
  let passed = 0, failed = 0;
  for (const t of tests) {
    try { await t.fn(); passed++; console.log('  \u2713 ' + t.name); }
    catch (e) { failed++; console.log('  \u2717 ' + t.name + '\n      ' + (e && e.message)); }
  }
  dirs.forEach((d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* best effort */ } });
  console.log('[coha-s7-error-issue-incident] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed ? 1 : 0);
})();
