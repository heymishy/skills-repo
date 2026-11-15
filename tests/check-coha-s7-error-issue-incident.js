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
test('U2b recognition declines a mismatching url, a foreign host, an unsafe number and a pull request object', () => {
  const base = mk({ number: 7 });
  assert.strictEqual(lib.recogniseIssue(ev(base.issue), CFG).recognised, true);
  const other = mk({ number: 7, htmlUrl: 'https://github.com/example/repo/issues/9' });
  const r1 = lib.recogniseIssue(ev(other.issue), CFG);
  assert.strictEqual(r1.recognised, false); assert.strictEqual(r1.reason, 'shape');
  const host = mk({ number: 77, htmlUrl: 'https://evil.example/x/y/issues/77' });
  const r2 = lib.recogniseIssue(ev(host.issue), CFG);
  assert.strictEqual(r2.recognised, false); assert.strictEqual(r2.reason, 'shape');
  const big = mk({ number: 1e300 });
  const r3 = lib.recogniseIssue(ev(big.issue), CFG);
  assert.strictEqual(r3.recognised, false); assert.strictEqual(r3.reason, 'shape');
  const huge = mk({ number: 2 ** 53, htmlUrl: 'https://github.com/example/repo/issues/9007199254740992' });
  const r5 = lib.recogniseIssue(ev(huge.issue), CFG);
  assert.strictEqual(r5.recognised, false); assert.strictEqual(r5.reason, 'shape');
  const pr = mk();
  pr.issue.pull_request = { url: 'https://api.github.com/repos/example/repo/pulls/77' };
  const r4 = lib.recogniseIssue(ev(pr.issue), CFG);
  assert.strictEqual(r4.recognised, false); assert.strictEqual(r4.reason, 'pull-request');
});

test('U3b planRecord refuses a declined result or a bad id, and free text never reaches the record plan', () => {
  assert.throws(() => lib.planRecord({ recognised: false }), /not recognised/);
  const m = mk();
  const good = lib.recogniseIssue(ev(m.issue), CFG);
  assert.throws(() => lib.planRecord(Object.assign({}, good, { id: '../x' })), /not recognised/);
  assert.throws(() => lib.planRecord(Object.assign({}, good, { code: 'a\nb' })), /not recognised/);
  assert.throws(() => lib.planRecord(Object.assign({}, good, { issueUrl: 'https://github.com/example/repo/issues/9' })), /not recognised/);
  // matching url, so only the safe-integer rule can reject this one
  assert.throws(() => lib.planRecord(Object.assign({}, good, { issueNumber: 2 ** 53, issueUrl: 'https://github.com/example/repo/issues/9007199254740992' })), /not recognised/);
  // a getter that changes its answer on each read must not slip text past the check
  let reads = 0;
  const sneaky = { id: good.id, issueNumber: good.issueNumber, issueUrl: good.issueUrl, get code() { reads += 1; return reads === 1 ? 'ok' : 'evil\nline'; } };
  let sneakyPlan = null;
  try { sneakyPlan = lib.planRecord(sneaky); } catch (e) { assert.match(e.message, /not recognised/); }
  if (sneakyPlan !== null) assert.strictEqual(sneakyPlan.summary, 'ok');
  reads = 0;
  let sneakyPr = null;
  try { sneakyPr = lib.buildPullRequest(sneaky); } catch (e) { assert.match(e.message, /not recognised/); }
  if (sneakyPr !== null) assert.ok(sneakyPr.title.indexOf('evil') === -1 && sneakyPr.body.indexOf('evil') === -1);
  assert.throws(() => lib.buildPullRequest({ recognised: false }), /not recognised/);
  assert.throws(() => lib.buildPullRequest(Object.assign({}, good, { id: '../x' })), /not recognised/);
  // regression: the object validatePlanForBuild returns has no recognised flag and must be accepted
  const validated = lib.validatePlanForBuild({ action: 'open', id: good.id, code: good.code, issueNumber: good.issueNumber, issueUrl: good.issueUrl });
  assert.strictEqual('recognised' in validated, false);
  assert.deepStrictEqual(lib.planRecord(validated), lib.planRecord(good));
  assert.deepStrictEqual(lib.buildPullRequest(validated), lib.buildPullRequest(good));
  const c = mk({ firstSeen: 'first ' + CANARY, environment: 'env ' + CANARY, link: 'https://us.posthog.com/project/' + CANARY + '/error-tracking/x' });
  const plan = lib.planRecord(lib.recogniseIssue(ev(c.issue), CFG));
  assert.ok(plan.trigger.indexOf(CANARY) === -1);
  assert.ok(plan.summary.indexOf(CANARY) === -1);
  assert.ok(plan.tags.join(',').indexOf(CANARY) === -1);
});

test('U3c validatePlanForBuild never trusts the plan it receives', () => {
  const id = crypto.randomUUID();
  const url = 'https://github.com/example/repo/issues/7';
  const good = { action: 'open', id: id, code: 'my_error', issueNumber: 7, issueUrl: url };
  const bad = (over, re) => assert.throws(() => lib.validatePlanForBuild(Object.assign({}, good, over)), re);
  ['dry-run', 'skip', 'decline'].forEach((a) => bad({ action: a }, /nothing to build/));
  bad({ id: id.toUpperCase() }, /bad id/); bad({ id: '../x' }, /bad id/);
  bad({ issueNumber: '7' }, /bad issue number/); bad({ issueNumber: 7.5 }, /bad issue number/); bad({ issueNumber: 0 }, /bad issue number/);
  // matching url, so only the safe-integer rule can reject this one
  bad({ issueNumber: 2 ** 53, issueUrl: 'https://github.com/example/repo/issues/9007199254740992' }, /bad issue number/);
  bad({ issueUrl: 'https://github.com/example/repo/issues/17' }, /bad issue url/);
  bad({ issueUrl: 'https://evil.example/x/y/issues/7' }, /bad issue url/);
  bad({ code: 'a\nb' }, /bad code/); bad({ code: 'x'.repeat(121) }, /bad code/);
  [null, undefined, 'plan', 7].forEach((p) => assert.throws(() => lib.validatePlanForBuild(p), /bad plan/));
  const out = lib.validatePlanForBuild(Object.assign({}, good, { action: 'rebuild', branch: '../x', record: {} }));
  assert.deepStrictEqual(Object.keys(out).sort(), ['action', 'code', 'id', 'issueNumber', 'issueUrl']);
  assert.strictEqual(out.action, 'rebuild');
});

test('U5 the pull request text holds only the code and the issue number; the hand-off holds only fixed fields', () => {
  const m = mk({ title: 'my_error', firstSeen: CANARY, environment: CANARY, link: 'https://us.posthog.com/project/' + CANARY + '/error-tracking/x' });
  const r = lib.recogniseIssue(ev(m.issue), CFG);
  assert.strictEqual(r.recognised, true);
  const pr = lib.buildPullRequest(r);
  assert.ok(pr.title.indexOf('my_error') !== -1 && pr.title.indexOf('#77') !== -1);
  assert.ok(pr.body.indexOf('my_error') !== -1 && pr.body.indexOf('#77') !== -1);
  assert.ok(pr.title.indexOf(CANARY) === -1 && pr.body.indexOf(CANARY) === -1);
  assert.ok(pr.title.indexOf('\n') === -1 && pr.title.length <= 200);
  assert.ok(JSON.stringify(planOf(m)).indexOf(CANARY) === -1, 'the plan handed to the record job carries none of the free text');
});

test('U14 the idempotency decision and its three distinct reasons', () => {
  const id = crypto.randomUUID();
  const branch = 'incident/posthog-' + id;
  const rec = (tags) => ({ id: 'r', type: 'incident', tags: tags });
  const decide = (f) => lib.decideIdempotency(Object.assign({ id: id, records: [], branches: [], openPullRequests: [] }, f));
  assert.deepStrictEqual(decide({ records: [rec(['production-error', 'posthog:' + id])] }), { action: 'skip', reason: 'already-recorded' });
  assert.strictEqual(decide({ records: [rec(['posthog:' + id + '-x']), rec(['xposthog:' + id])] }).action, 'open');
  assert.deepStrictEqual(decide({ branches: [branch] }), { action: 'skip', reason: 'branch-exists' });
  assert.deepStrictEqual(decide({ openPullRequests: [{ headRefName: branch }] }), { action: 'skip', reason: 'pr-open' });
  assert.strictEqual(decide({ branches: [branch], openPullRequests: [{ headRefName: branch }] }).reason, 'pr-open');
  assert.deepStrictEqual(decide({}), { action: 'open', reason: 'new' });
  assert.strictEqual(new Set(['already-recorded', 'branch-exists', 'pr-open']).size, 3);
  assert.deepStrictEqual(decide({ openPullRequests: [{ headRefName: branch, isCrossRepository: true }] }), { action: 'open', reason: 'new' });
  assert.strictEqual(decide({ openPullRequests: [{ headRefName: branch, isCrossRepository: false }] }).reason, 'pr-open');
  assert.throws(() => decide({ records: 'x' }), /bad facts/);
  assert.throws(() => decide({ branches: {} }), /bad facts/);
  assert.throws(() => decide({ openPullRequests: 'x' }), /bad facts/);
  assert.deepStrictEqual(decide({ records: [null, rec([' PostHog:' + id + ' '])] }), { action: 'skip', reason: 'already-recorded' });
  assert.throws(() => lib.decideIdempotency({ records: [rec(['posthog:undefined'])] }));
  assert.throws(() => lib.decideIdempotency({ id: undefined, records: [rec(['posthog:undefined'])] }));
  const m = mk({ id: id });
  const p = planOf(m, { branches: [branch] });
  assert.strictEqual(p.action, 'skip'); assert.strictEqual(p.reason, 'branch-exists'); assert.strictEqual(p.record, null);
});

test('U14b the rebuild switch lifts only the branch and pull request skips', () => {
  const id = crypto.randomUUID();
  const branch = 'incident/posthog-' + id;
  const decide = (f) => lib.decideIdempotency(Object.assign({ id: id, records: [], branches: [], openPullRequests: [] }, f), { rebuild: true });
  assert.deepStrictEqual(decide({ branches: [branch] }), { action: 'rebuild', reason: 'rebuild' });
  assert.deepStrictEqual(decide({ openPullRequests: [{ headRefName: branch }] }), { action: 'rebuild', reason: 'rebuild' });
  assert.deepStrictEqual(decide({ records: [{ tags: ['posthog:' + id] }], branches: [branch] }), { action: 'skip', reason: 'already-recorded' });
  assert.deepStrictEqual(decide({}), { action: 'open', reason: 'new' });
  assert.deepStrictEqual(decide({ openPullRequests: [{ headRefName: branch, isCrossRepository: true }] }), { action: 'open', reason: 'new' });
  assert.strictEqual(lib.decideIdempotency({ id: id, branches: [branch] }, { rebuild: 'false' }).action, 'skip');
  assert.strictEqual(lib.decideIdempotency({ id: id, branches: [branch] }, { rebuild: 1 }).action, 'skip');
  const m = mk({ id: id });
  const p = planOf(m, { branches: [branch] }, { rebuild: true });
  assert.strictEqual(p.action, 'rebuild'); assert.strictEqual(p.branch, branch); assert.ok(p.pullRequest && p.record);
  const d = planOf(m, { branches: [branch] }, { rebuild: true, dryRun: true });
  assert.strictEqual(d.action, 'dry-run'); assert.strictEqual(d.reason, 'would-rebuild');
});

test('U15 a closed pull request: a gone branch allows a new attempt, a present branch still skips', () => {
  const id = crypto.randomUUID();
  const branch = 'incident/posthog-' + id;
  const m = mk({ id: id });
  assert.strictEqual(planOf(m, { branches: [], openPullRequests: [] }).action, 'open');
  const p = planOf(m, { branches: [branch], openPullRequests: [] });
  assert.strictEqual(p.action, 'skip'); assert.strictEqual(p.reason, 'branch-exists');
});

test('U16 a dry run prints the plan, creates nothing, and with the rebuild switch still changes nothing', () => {
  const m = mk({ title: 'dry_error' });
  const s = cliSetup(m);
  const before = sha(s.incidents);
  const res = run(planArgs(s, ['--dry-run']));
  assert.strictEqual(res.status, 0, res.stderr);
  const lines = resultLines(res);
  assert.strictEqual(lines.length, 1);
  assert.strictEqual(lines[0], 'error-issue-incident: dry-run would-open issue #77');
  const dry = res.stdout.split('\n').find((l) => l.indexOf('error-issue-incident-dry-run: ') === 0);
  const shown = JSON.parse(dry.slice('error-issue-incident-dry-run: '.length));
  assert.strictEqual(shown.record.summary, 'dry_error');
  assert.ok(shown.pullRequest.title.indexOf('dry_error') !== -1);
  assert.strictEqual(readOut(s.out).action, 'dry-run');
  assert.strictEqual(sha(s.incidents), before);
  const s2 = cliSetup(m, { facts: { branches: ['incident/posthog-' + m.id], openPullRequests: [] } });
  const before2 = sha(s2.incidents);
  const res2 = run(planArgs(s2, ['--dry-run', '--rebuild']));
  assert.strictEqual(resultLines(res2)[0], 'error-issue-incident: dry-run would-rebuild issue #77');
  assert.strictEqual(sha(s2.incidents), before2);
});

test('U17 an explicit incident file path is required and the script has no default', () => {
  const m = mk();
  const s = cliSetup(m);
  const noPath = run(['plan', '--event', s.eventFile, '--author', AUTHOR, '--facts', s.factsFile]);
  assert.notStrictEqual(noPath.status, 0);
  assert.ok(noPath.stderr.indexOf('missing incident file path') !== -1);
  assert.ok(resultLines(noPath).length === 0);
  const missing = run(planArgs(Object.assign({}, s, { incidents: path.join(s.dir, 'no', 'such', 'incidents.json') })));
  assert.notStrictEqual(missing.status, 0);
  assert.ok(missing.stderr.indexOf('could not read incident file') !== -1);
  const src = fs.readFileSync(SCRIPT, 'utf8');
  assert.ok(!/workspace/.test(src) && !/DEFAULT_INCIDENTS_FILE/.test(src), 'no code path may fall back to the real incident file');
  // build must refuse without an explicit path (the real recorder would otherwise fall back to the real file)
  run(planArgs(s));
  const openPlan = readOut(s.out).plan;
  const buildNoPath = run(['build', '--plan-env', 'PLAN_JSON'], { PLAN_JSON: openPlan });
  assert.notStrictEqual(buildNoPath.status, 0);
  assert.ok(buildNoPath.stderr.indexOf('missing incident file path') !== -1);
  assert.strictEqual(resultLines(buildNoPath).length, 0);
  // the path check comes before anything else: even a bad plan is not looked at first
  const buildNoPathBadPlan = run(['build', '--plan-env', 'PLAN_JSON'], { PLAN_JSON: '{nope' });
  assert.notStrictEqual(buildNoPathBadPlan.status, 0);
  assert.ok(buildNoPathBadPlan.stderr.indexOf('missing incident file path') !== -1, 'the explicit path check runs first');
});

test('U19 arguments are strict: only known options, one value each, no switch can be overwritten', () => {
  const fresh = () => cliSetup(mk());
  const expectRefused = (res, label) => {
    assert.notStrictEqual(res.status, 0, label);
    assert.ok(res.stderr.indexOf('unexpected argument') !== -1, label + ': ' + res.stderr);
    assert.strictEqual(resultLines(res).length, 0, label);
  };
  let s = fresh();
  expectRefused(run(planArgs(s, ['--command', 'build'])), 'option named command');
  s = fresh();
  expectRefused(run(planArgs(s, ['--dry-run', '--flags', 'x'])), 'option named flags');
  s = fresh();
  expectRefused(run(['plan', '--event', s.eventFile, '--author', '--dry-run', '--facts', s.factsFile, '--incidents', s.incidents, '--github-output', s.out]), 'value that begins with two dashes');
  s = fresh();
  expectRefused(run(planArgs(s, ['--facts', s.factsFile])), 'repeated option');
  s = fresh();
  expectRefused(run(planArgs(s, ['--dryrun'])), 'unknown option');
  s = fresh();
  expectRefused(run(planArgs(s, ['--out'])), 'missing value at the end');
  s = fresh();
  expectRefused(run(planArgs(s, ['--out', ''])), 'empty value for a path option');
  s = fresh();
  expectRefused(run(planArgs(s, ['stray'])), 'stray positional');
  s = fresh();
  const empty = run(planArgs(s, [], ''));
  assert.strictEqual(empty.status, 0, empty.stderr);
  assert.strictEqual(readOut(s.out).action, 'decline');
  assert.strictEqual(readOut(s.out).reason, 'author');
  s = fresh();
  const ok = run(planArgs(s, ['--dry-run']));
  assert.strictEqual(ok.status, 0, ok.stderr);
  assert.strictEqual(readOut(s.out).action, 'dry-run');
});

test('U18 a hostile event run as a real child process executes nothing', () => {
  const dir = tmpDir();
  const sentinel = path.join(dir, 'SENTINEL');
  const titles = ['$(touch ' + sentinel + ')', '`touch ' + sentinel + '`', '; touch ' + sentinel, '"; touch ' + sentinel + '; "', '${{ secrets.X }}'];
  titles.forEach((title) => {
    const m = mk({ title: title });
    m.issue.body = m.issue.body + '\n```\n$(touch ' + sentinel + ')\n`touch ' + sentinel + '`\n```\n';
    const s = cliSetup(m);
    const p = run(planArgs(s));
    assert.strictEqual(p.status, 0, p.stderr);
    const plan = readOut(s.out).plan;
    const b = run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents, '--github-output', s.out + '2'], { PLAN_JSON: plan });
    assert.strictEqual(b.status, 0, b.stderr);
    assert.ok(!fs.existsSync(sentinel), 'nothing was executed for title ' + title);
    const recs = JSON.parse(fs.readFileSync(s.incidents, 'utf8'));
    assert.strictEqual(recs[recs.length - 1].summary, title, 'the text is stored as inert data');
    assert.ok((p.stdout + p.stderr + b.stdout + b.stderr).indexOf('touch') === -1, 'no issue text echoed');
  });
});

test('I1 the real record creation against a temp copy adds exactly one valid record', () => {
  const m = mk({ title: 'real_record_error' });
  const s = cliSetup(m);
  const seedsBefore = JSON.parse(fs.readFileSync(s.incidents, 'utf8'));
  const p = run(planArgs(s));
  assert.strictEqual(p.status, 0, p.stderr);
  assert.deepStrictEqual(JSON.parse(fs.readFileSync(s.incidents, 'utf8')), seedsBefore, 'plan writes nothing');
  const b = run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents, '--github-output', s.out + '2'], { PLAN_JSON: readOut(s.out).plan });
  assert.strictEqual(b.status, 0, b.stderr);
  const after = JSON.parse(fs.readFileSync(s.incidents, 'utf8'));
  assert.strictEqual(after.length, 3);
  assert.deepStrictEqual(after.slice(0, 2), seedsBefore);
  const rec = after[2];
  assert.strictEqual(rec.type, 'incident'); assert.strictEqual(rec.status, 'open');
  assert.strictEqual(rec.summary, 'real_record_error');
  assert.ok(rec.tags.indexOf('production-error') !== -1 && rec.tags.indexOf('posthog:' + m.id) !== -1);
  assert.ok(rec.trigger.indexOf(m.issue.html_url) !== -1 && rec.trigger.indexOf(m.id) !== -1);
  assert.ok(typeof rec.triageSummary === 'string' && rec.triageSummary.length > 0, 'the triage drafter ran');
  assert.doesNotThrow(() => store.validateRecord(rec));
  const o = readOut(s.out + '2');
  assert.strictEqual(o.branch, 'incident/posthog-' + m.id);
  assert.ok(o.pr_title.indexOf('real_record_error') !== -1 && o.pr_body.indexOf('#77') !== -1);
});

test('I5 a hand start applies the same recognition as an automatic run', () => {
  const verdict = (m, author) => { const s = cliSetup(m, { rest: true }); run(planArgs(s, [], author)); return readOut(s.out); };
  assert.strictEqual(verdict(mk()).action, 'open');
  const other = verdict(mk(), 'someone-else'); assert.strictEqual(other.action, 'decline'); assert.strictEqual(other.reason, 'author');
  const noMarker = verdict(mk({ body: 'First seen: t\n' })); assert.strictEqual(noMarker.reason, 'marker');
  const pr = mk(); pr.issue.pull_request = { url: 'x' };
  const prOut = verdict(pr); assert.strictEqual(prOut.action, 'decline'); assert.strictEqual(prOut.reason, 'pull-request');
});

test('I6 the full script flow twice: one plan to open, the second run skips and writes nothing', () => {
  const m = mk();
  const s = cliSetup(m);
  const first = run(planArgs(s));
  assert.strictEqual(resultLines(first)[0], 'error-issue-incident: open new issue #77');
  const planJson = JSON.parse(readOut(s.out).plan);
  assert.strictEqual(planJson.branch, 'incident/posthog-' + m.id);
  assert.strictEqual(run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents, '--github-output', s.out + '2'], { PLAN_JSON: readOut(s.out).plan }).status, 0);
  const afterBuild = sha(s.incidents);
  const facts2 = writeJson(s.dir, 'facts2.json', { branches: ['incident/posthog-' + m.id], openPullRequests: [] });
  const second = run(['plan', '--event', s.eventFile, '--author', AUTHOR, '--facts', facts2, '--incidents', s.incidents, '--github-output', s.out + '3']);
  assert.strictEqual(second.status, 0, second.stderr);
  assert.strictEqual(readOut(s.out + '3').action, 'skip');
  assert.strictEqual(readOut(s.out + '3').reason, 'already-recorded');
  assert.strictEqual(sha(s.incidents), afterBuild, 'the second run changed nothing');
});

test('N1 every outcome prints one result line with a fixed reason and never repeats issue text', () => {
  const extra = 'extra ' + CANARY;
  const variant = (over) => mk(Object.assign({ firstSeen: CANARY, environment: CANARY, link: 'https://us.posthog.com/project/' + CANARY + '/error-tracking/x', body: undefined }, over));
  const noMarkerBody = 'First seen: ' + CANARY + '\nEnvironment: ' + CANARY + '\nPostHog: https://x/' + CANARY + '\n' + extra + '\n';
  const idA = crypto.randomUUID(), idB = crypto.randomUUID();
  const cases = [
    { m: variant({}), extraArgs: [], expect: 'open new' },
    { m: variant({}), facts: 'branch', expect: 'skip branch-exists' },
    { m: variant({}), facts: 'recorded', expect: 'skip already-recorded' },
    { m: variant({ login: 'someone' }), expect: 'decline author' },
    { m: variant({ labels: [] }), expect: 'decline label' },
    { m: variant({ body: noMarkerBody }), expect: 'decline marker' },
    { m: variant({ body: 'PostHog issue id: ' + idA + '\nPostHog issue id: ' + idB + '\n' + extra }), expect: 'decline marker-ambiguous' },
    { m: variant({ markerId: '../' + CANARY }), expect: 'decline id' },
    { m: variant({}), extraArgs: ['--dry-run'], expect: 'dry-run would-open' }
  ];
  const seen = new Set();
  cases.forEach((c) => {
    const s = cliSetup(c.m);
    if (c.facts === 'branch') fs.writeFileSync(s.factsFile, JSON.stringify({ branches: ['incident/posthog-' + c.m.id], openPullRequests: [] }));
    if (c.facts === 'recorded') { const recs = JSON.parse(fs.readFileSync(s.incidents, 'utf8')); recs.push({ id: 'x', type: 'incident', tags: ['production-error', 'posthog:' + c.m.id] }); fs.writeFileSync(s.incidents, JSON.stringify(recs)); }
    const res = run(planArgs(s, c.extraArgs));
    assert.strictEqual(res.status, 0, res.stderr);
    const lines = resultLines(res);
    assert.strictEqual(lines.length, 1, 'one result line for ' + c.expect);
    assert.strictEqual(lines[0], 'error-issue-incident: ' + c.expect + ' issue #77');
    seen.add(lines[0]);
    assert.ok((res.stdout + res.stderr + fs.readFileSync(s.out, 'utf8')).indexOf(CANARY) === -1, 'no issue text for ' + c.expect);
  });
  assert.strictEqual(seen.size, cases.length, 'every outcome has its own line');
});

test('N2 a failed run leaves nothing half done', () => {
  const m = mk();
  const s = cliSetup(m);
  const asDir = run(planArgs(Object.assign({}, s, { incidents: s.dir })));
  assert.notStrictEqual(asDir.status, 0); assert.strictEqual(resultLines(asDir).length, 0);
  const bad = path.join(s.dir, 'bad.json'); fs.writeFileSync(bad, '{not json');
  const before = sha(bad);
  const asBad = run(planArgs(Object.assign({}, s, { incidents: bad })));
  assert.notStrictEqual(asBad.status, 0); assert.strictEqual(sha(bad), before);
  const plan = (() => { run(planArgs(s)); return readOut(s.out).plan; })();
  const buildBad = run(['build', '--plan-env', 'PLAN_JSON', '--incidents', bad], { PLAN_JSON: plan });
  assert.notStrictEqual(buildBad.status, 0); assert.strictEqual(sha(bad), before);
  assert.notStrictEqual(run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents], { PLAN_JSON: '{nope' }).status, 0);
  const skipPlan = JSON.stringify(Object.assign(JSON.parse(plan), { action: 'skip' }));
  assert.notStrictEqual(run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents], { PLAN_JSON: skipPlan }).status, 0);
  const badId = JSON.stringify(Object.assign(JSON.parse(plan), { id: '../x' }));
  const beforeOk = sha(s.incidents);
  assert.notStrictEqual(run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents], { PLAN_JSON: badId }).status, 0);
  assert.strictEqual(sha(s.incidents), beforeOk, 'a bad plan writes nothing');
  // facts the planner cannot accept: fixed message, no result line, no stack trace
  const badFacts = writeJson(s.dir, 'badfacts.json', { branches: 'x', openPullRequests: [] });
  const badOut = s.out + '9';
  const asBadFacts = run(['plan', '--event', s.eventFile, '--author', AUTHOR, '--facts', badFacts, '--incidents', s.incidents, '--github-output', badOut]);
  assert.notStrictEqual(asBadFacts.status, 0);
  assert.ok(asBadFacts.stderr.indexOf('could not plan: the facts or the event are not acceptable') !== -1);
  assert.strictEqual(resultLines(asBadFacts).length, 0);
  assert.ok(asBadFacts.stderr.indexOf('    at ') === -1, 'no stack trace');
  assert.ok(!fs.existsSync(badOut), 'nothing was written for unacceptable facts');
  // a bad output path gives a fixed message, no stack trace and, for plan, no result line
  const missingOut = path.join(s.dir, 'nodir', 'out.txt');
  const planBadOut = run(planArgs(Object.assign({}, s, { out: missingOut })));
  assert.notStrictEqual(planBadOut.status, 0);
  assert.ok(planBadOut.stderr.indexOf('could not write outputs') !== -1);
  assert.ok(planBadOut.stderr.indexOf('    at ') === -1, 'no stack trace');
  assert.strictEqual(resultLines(planBadOut).length, 0);
  const beforeBadOut = sha(s.incidents);
  const buildBadOut = run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents, '--github-output', missingOut], { PLAN_JSON: plan });
  assert.notStrictEqual(buildBadOut.status, 0);
  assert.ok(buildBadOut.stderr.indexOf('    at ') === -1, 'no stack trace');
  assert.strictEqual(sha(s.incidents), beforeBadOut, 'a failed output write leaves the record file unchanged');
  // building the same plan twice never duplicates the record
  const m2 = mk();
  const s2 = cliSetup(m2);
  run(planArgs(s2));
  const plan2 = readOut(s2.out).plan;
  const build1 = run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s2.incidents], { PLAN_JSON: plan2 });
  assert.strictEqual(build1.status, 0, build1.stderr);
  const build2 = run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s2.incidents], { PLAN_JSON: plan2 });
  assert.notStrictEqual(build2.status, 0);
  assert.ok(build2.stderr.indexOf('a record for this id already exists') !== -1);
  const stored = JSON.parse(fs.readFileSync(s2.incidents, 'utf8'));
  assert.strictEqual(stored.filter((r) => Array.isArray(r.tags) && r.tags.indexOf('posthog:' + m2.id) !== -1).length, 1);
  // error messages never repeat issue or plan text
  const badEvent = path.join(s.dir, 'badevent.json'); fs.writeFileSync(badEvent, '{not json ' + CANARY);
  const asBadEvent = run(['plan', '--event', badEvent, '--author', AUTHOR, '--facts', s.factsFile, '--incidents', s.incidents]);
  assert.notStrictEqual(asBadEvent.status, 0);
  assert.ok(asBadEvent.stderr.indexOf(CANARY) === -1 && asBadEvent.stdout.indexOf(CANARY) === -1, 'event text not echoed');
  const badPlanEnv = run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents], { PLAN_JSON: '{nope ' + CANARY });
  assert.notStrictEqual(badPlanEnv.status, 0);
  assert.ok(badPlanEnv.stderr.indexOf(CANARY) === -1 && badPlanEnv.stdout.indexOf(CANARY) === -1, 'plan text not echoed');
});

// ---- product page harness (the same approach as tests/check-itar-s3-web-ui-rendering.js) ----
function freshRequire(p) { delete require.cache[require.resolve(p)]; return require(p); }
const PRODUCTS_ROUTE_PATH = path.join(ROOT, 'src/web-ui/routes/products.js');
const FETCHER_PATH = path.join(ROOT, 'src/web-ui/adapters/artefact-fetcher.js');
const MODULES_ADAPTER_PATH = path.join(ROOT, 'src/web-ui/adapters/modules-adapter.js');
function makePool(owner, repo) {
  return { query: async function (sql) {
    if (/SELECT name, tenant_id, repo_owner, repo_name FROM products/.test(sql)) return { rows: [{ name: 'Acme', tenant_id: 't1', repo_owner: owner, repo_name: repo }] };
    return { rows: [] };
  } };
}
// Note: this leaves the products route's adapters set process-wide (acceptable: no later test in this file depends on the defaults).
async function renderPageWith(rawIncidents) {
  const realFetch = global.fetch;
  global.fetch = async function (url) {
    if (String(url).endsWith('/contents/workspace/incidents.json')) {
      return { status: 200, ok: true, json: async function () { return { type: 'file', encoding: 'base64', content: Buffer.from(rawIncidents, 'utf8').toString('base64').replace(/(.{60})/g, '$1\n') }; } };
    }
    return { status: 404, ok: false, json: async function () { return { message: 'Not Found' }; } };
  };
  try {
    const route = freshRequire(PRODUCTS_ROUTE_PATH);
    const fetcher = require(FETCHER_PATH);
    fetcher.setFetchRepoPath(fetcher.realFetchRepoPath);
    require(MODULES_ADAPTER_PATH).setModulesAdapter({ query: async function () { return { rows: [] }; } });
    let html = null;
    const res = { writeHead: function () {}, end: function (b) { html = b; } };
    const req = { params: { id: 'p1' }, session: { tenantId: 't1', login: 'u', accessToken: 'tok-123' } };
    await route.handleGetProductView(req, res, null, makePool('acme', 'repo'));
    return html;
  } finally { global.fetch = realFetch; }
}
function buildRecord(s) {
  assert.strictEqual(run(planArgs(s)).status, 0);
  assert.strictEqual(run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents, '--github-output', s.out + '2'], { PLAN_JSON: readOut(s.out).plan }).status, 0);
}

test('I2 the product page renders the new record as one distinct item, with its text escaped', async () => {
  const m = mk({ title: 'tenant_admin_bootstrap_failed' });
  const s = cliSetup(m);
  buildRecord(s);
  const html = await renderPageWith(fs.readFileSync(s.incidents, 'utf8'));
  assert.strictEqual((html.match(/data-incident-item/g) || []).length, 3, 'one item per record');
  assert.ok(html.indexOf('tenant_admin_bootstrap_failed') !== -1);
  assert.ok(/Status: open/.test(html));
  const m2 = mk({ title: '<b>x</b>' });
  const s2 = cliSetup(m2);
  buildRecord(s2);
  const html2 = await renderPageWith(fs.readFileSync(s2.incidents, 'utf8'));
  assert.ok(html2.indexOf('&lt;b&gt;x&lt;/b&gt;') !== -1 && html2.indexOf('<b>x</b>') === -1, 'the code appears as plain characters');
});

test('I3 the existing store loads and validates the new record', () => {
  const m = mk();
  const s = cliSetup(m);
  buildRecord(s);
  const loaded = store.loadIncidentRecords(s.incidents);
  assert.strictEqual(loaded.length, 3);
  assert.deepStrictEqual(store.withDefaultType(loaded[2]), loaded[2]);
  loaded.forEach((r) => assert.doesNotThrow(() => store.validateRecord(r)));
  assert.strictEqual(store.loadRecords(s.incidents).length, 3);
});

// Isolated from the developer's git settings and any surrounding git hook environment.
function gitEnv() { const e = Object.assign({}, process.env, { GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: os.devNull, GIT_TERMINAL_PROMPT: '0' }); ['GIT_DIR', 'GIT_INDEX_FILE', 'GIT_WORK_TREE', 'GIT_OBJECT_DIRECTORY', 'GIT_COMMON_DIR'].forEach((k) => { delete e[k]; }); return e; }
function git(cwd, args) { const r = cp.spawnSync('git', args, { cwd: cwd, encoding: 'utf8', env: gitEnv() }); return { status: r.status, out: (r.stdout || '') + (r.stderr || ''), stdout: r.stdout || '' }; }
function gitOk(cwd, args) { const r = git(cwd, args); assert.strictEqual(r.status, 0, 'git ' + args.join(' ') + ': ' + r.out); return r; }

test('I4 two branches from one base conflict; a rebuild from the current master merges cleanly', () => {
  const dir = tmpDir();
  const origin = path.join(dir, 'origin.git');
  const work = path.join(dir, 'work');
  gitOk(dir, ['init', '--bare', origin]);
  gitOk(origin, ['symbolic-ref', 'HEAD', 'refs/heads/master']);
  gitOk(dir, ['clone', origin, work]);
  gitOk(work, ['config', 'core.autocrlf', 'false']); gitOk(work, ['config', 'core.safecrlf', 'false']); gitOk(work, ['config', 'core.hooksPath', tmpDir()]);
  gitOk(work, ['config', 'commit.gpgsign', 'false']); gitOk(work, ['config', 'merge.conflictstyle', 'merge']);
  gitOk(work, ['config', 'user.name', 'test']); gitOk(work, ['config', 'user.email', 'test@example.com']);
  gitOk(work, ['checkout', '-B', 'master']);
  fs.mkdirSync(path.join(work, 'workspace'));
  const file = path.join(work, 'workspace', 'incidents.json');
  fs.copyFileSync(seedFile(tmpDir()), file);
  gitOk(work, ['add', '.']); gitOk(work, ['commit', '-m', 'seed']); gitOk(work, ['push', 'origin', 'master']);

  const recordOn = (m, action, facts) => {
    const branch = 'incident/posthog-' + m.id;
    gitOk(work, ['fetch', 'origin']);
    gitOk(work, ['checkout', '-B', branch, 'origin/master']);
    const plan = lib.planRun({ event: ev(m.issue), config: CFG, facts: Object.assign({ records: [], branches: [], openPullRequests: [] }, facts || {}), options: { rebuild: action === 'rebuild' } });
    assert.strictEqual(plan.action, action);
    assert.strictEqual(run(['build', '--plan-env', 'PLAN_JSON', '--incidents', file], { PLAN_JSON: JSON.stringify(plan) }).status, 0);
    gitOk(work, ['add', 'workspace/incidents.json']); gitOk(work, ['commit', '-m', 'record ' + m.id]);
    return branch;
  };
  const a = mk({ title: 'error_a', number: 11 }), b = mk({ title: 'error_b', number: 12 });
  const branchA = recordOn(a, 'open');
  gitOk(work, ['push', 'origin', 'HEAD:refs/heads/' + branchA]);
  const branchB = recordOn(b, 'open');
  gitOk(work, ['push', 'origin', 'HEAD:refs/heads/' + branchB]);

  gitOk(work, ['checkout', 'master']);
  gitOk(work, ['merge', '--no-ff', '-m', 'merge a', branchA]);
  gitOk(work, ['push', 'origin', 'master']);
  const clash = git(work, ['merge', '--no-ff', '-m', 'merge b', branchB]);
  assert.notStrictEqual(clash.status, 0, 'merging the second record after the first conflicts, which is why a rebuild exists');
  git(work, ['merge', '--abort']);

  const rebuilt = recordOn(b, 'rebuild', { branches: [branchB] });
  assert.strictEqual(rebuilt, branchB);
  // This leg proves git's behaviour that the workflow relies on; the workflow's own push line is checked by tests W5 and W9 in a later task.
  assert.notStrictEqual(git(work, ['push', 'origin', 'HEAD:refs/heads/' + branchB]).status, 0, 'a plain push of the rebuilt branch must be rejected as non-fast-forward, which is why the workflow force-pushes with a lease');
  const push = git(work, ['push', '--force-with-lease', 'origin', 'HEAD:refs/heads/' + branchB]);
  assert.strictEqual(push.status, 0, push.out);
  const remote = gitOk(work, ['ls-remote', '--heads', 'origin', branchB]).stdout.trim().split('\n').filter(Boolean);
  assert.strictEqual(remote.length, 1, 'exactly one branch for B on the origin');
  assert.ok(remote[0].indexOf(gitOk(work, ['rev-parse', 'HEAD']).stdout.trim()) === 0, 'its tip is the rebuilt commit');

  gitOk(work, ['checkout', 'master']);
  gitOk(work, ['merge', '--no-ff', '-m', 'merge rebuilt b', branchB]);
  const final = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.strictEqual(final.length, 4);
  [a, b].forEach((m) => assert.strictEqual(final.filter((r) => r.tags.indexOf('posthog:' + m.id) !== -1).length, 1));
});

// ---- workflow file wiring tests (text based, in the style of tests/check-cif-s1-deploy-concurrency-guard.js) ----
const wf = (fs.existsSync(WORKFLOW) ? fs.readFileSync(WORKFLOW, 'utf8') : '').replace(/\r\n/g, '\n');
const indentOf = (l) => l.length - l.trimStart().length;
function splitJobs(content) {
  const lines = content.split(/\r?\n/);
  const jobsIdx = lines.findIndex((l) => /^jobs:\s*$/.test(l));
  if (jobsIdx === -1) return [];
  const jobs = []; let current = null;
  for (let i = jobsIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (/^\S/.test(line)) break;
    const h = /^  ([A-Za-z0-9_.-]+):\s*$/.exec(line);
    if (h) { if (current) jobs.push(current); current = { id: h[1], lines: [line] }; } else if (current) current.lines.push(line);
  }
  if (current) jobs.push(current);
  return jobs;
}
const jobs = splitJobs(wf);
const jobText = (id) => { const j = jobs.find((x) => x.id === id); return j ? j.lines.join('\n') : ''; };
const topText = wf.split(/^jobs:/m)[0];

// cwt-s1: a Windows checkout (core.autocrlf=true) gives the workflow CRLF endings; the pins below match with ^, $ and \n.
test('cwt_UT1 the workflow text the structural tests read contains no carriage return', () => {
  assert.strictEqual(wf.indexOf('\r'), -1, 'the workflow text must be read with line endings normalised to LF');
});
test('cwt_UT2 normalising line endings keeps the W3 concurrency pin strong', () => {
  const w3 = (text) => /^concurrency:\s*\n  group:\s*(.+)\n  cancel-in-progress:\s*false\s*$/m.test(text.split(/^jobs:/m)[0]);
  const lf = wf.replace(/\r\n/g, '\n');
  assert.ok(w3(lf), 'the real workflow must satisfy the pin');
  assert.ok(w3(lf.replace(/\n/g, '\r\n').replace(/\r\n/g, '\n')), 'a CRLF copy, once normalised, must satisfy the pin');
  assert.ok(!w3(lf.replace('cancel-in-progress: false', 'cancel-in-progress: true')), 'a workflow that cancels in progress must still fail the pin');
});
function jobPermissions(text) {
  const lines = text.split('\n'); const i = lines.findIndex((l) => /^    permissions:\s*$/.test(l));
  const out = {}; if (i === -1) return null;
  for (let k = i + 1; k < lines.length && indentOf(lines[k]) >= 6; k++) { const m = /^\s+([a-z-]+):\s*(\S+)/.exec(lines[k]); if (m) out[m[1]] = m[2]; }
  return out;
}
// The non-blank lines of a top-level block (from its header line to the next top-level key).
function topBlock(content, key) {
  const lines = content.split(/\r?\n/); const i = lines.findIndex((l) => l === key + ':' || l.startsWith(key + ': ') || new RegExp('^' + key + ':\\s*$').test(l));
  if (i === -1) return null;
  const out = [];
  for (let k = i + 1; k < lines.length && !/^\S/.test(lines[k]); k++) if (lines[k].trim() !== '') out.push(lines[k]);
  return out;
}
// The steps of one job, each as { name, text }; a step starts at a line indented six spaces and beginning with '- '.
function stepsOf(id) {
  const lines = jobText(id).split('\n'); const steps = []; let cur = null;
  lines.forEach((l) => {
    if (/^      - /.test(l)) { if (cur) steps.push(cur); cur = { lines: [l] }; } else if (cur) { if (/^ {0,5}\S/.test(l)) { steps.push(cur); cur = null; } else cur.lines.push(l); }
  });
  if (cur) steps.push(cur);
  return steps.map((s) => { const text = s.lines.join('\n'); const m = /^\s+(-\s+)?name:\s*(.+)$/m.exec(text); return { name: m ? m[2].trim() : '', text: text }; });
}
function runBlocks(content) {
  const lines = content.split(/\r?\n/); const blocks = [];
  lines.forEach((line, i) => {
    const m = /^(\s*)(-\s+)?run:\s*(.*)$/.exec(line); if (!m) return;
    const col = m[1].length + (m[2] ? m[2].length : 0); const parts = [];
    if (m[3] && m[3] !== '|' && m[3] !== '>') parts.push(m[3]);
    for (let k = i + 1; k < lines.length && (lines[k].trim() === '' || indentOf(lines[k]) > col); k++) parts.push(lines[k]);
    blocks.push(parts.join('\n'));
  });
  return blocks;
}

test('W1 the trigger is issue opened (types declared) plus a hand start with three inputs', () => {
  assert.ok(/^  issues:\s*\n    types:\s*\[opened\]/m.test(topText), 'types declared explicitly as [opened]');
  assert.ok(!/labeled|edited|reopened|transferred/.test(topText.split(/^permissions:/m)[0]), 'no other issue activity');
  assert.ok(/^  workflow_dispatch:/m.test(topText));
  ['issue_number', 'dry_run', 'rebuild'].forEach((i) => assert.ok(new RegExp('^      ' + i + ':', 'm').test(topText), 'input ' + i));
  const onKeys = (topBlock(wf, 'on') || []).map((l) => /^  ([A-Za-z_]+):/.exec(l)).filter(Boolean).map((m) => m[1]).sort();
  assert.deepStrictEqual(onKeys, ['issues', 'workflow_dispatch'], 'the only triggers are issues and workflow_dispatch');
});

test('W2 least-privilege job permissions', () => {
  assert.ok(/^permissions:\s*\n  contents: read\s*(\n|$)/m.test(topText));
  assert.deepStrictEqual(topBlock(wf, 'permissions'), ['  contents: read'], 'the top-level permissions block is exactly contents: read');
  assert.deepStrictEqual(jobs.map((j) => j.id).sort(), ['recognise', 'record'], 'exactly two jobs');
  assert.deepStrictEqual(jobPermissions(jobText('recognise')), { contents: 'read', issues: 'read', 'pull-requests': 'read' });
  assert.deepStrictEqual(jobPermissions(jobText('record')), { contents: 'write', 'pull-requests': 'write' });
  assert.ok(/needs:\s*recognise/.test(jobText('record')));
  assert.ok(!/write-all|id-token|packages:|actions:/.test(wf));
});

test('W3 the concurrency group is per issue number and never cancels', () => {
  const m = /^concurrency:\s*\n  group:\s*(.+)\n  cancel-in-progress:\s*false\s*$/m.exec(topText);
  assert.ok(m, 'a top-level concurrency block with cancel-in-progress: false');
  assert.ok(m[1].indexOf('github.event.issue.number') !== -1 && m[1].indexOf('inputs.issue_number') !== -1, 'covers both the event number and the dispatch input');
  assert.ok(/incident-record-/.test(m[1]));
});

test('W4 untrusted text never reaches a shell or an expression in a run block', () => {
  const allowed = new Set(['github.repository', 'github.run_id', 'runner.temp']);
  runBlocks(wf).forEach((b) => { (b.match(/\$\{\{\s*[^}]*?\s*\}\}/g) || []).forEach((e) => assert.ok(allowed.has(e.replace(/^\$\{\{\s*|\s*\}\}$/g, '')), 'unexpected expression in a run block: ' + e)); });
  assert.ok(!/github\.event\.(issue\.(title|body|user|labels)|comment|pull_request\.title|head_commit)|github\.head_ref/.test(wf));
  assert.ok(/GITHUB_EVENT_PATH/.test(wf), 'the event is read from the event file');
  assert.ok(runBlocks(wf).some((b) => b.indexOf('"$ISSUE_NUMBER" =~ ^[1-9][0-9]*$') !== -1), 'the hand-start issue number must be a positive number with no leading zero');
  assert.ok(wf.indexOf('^[0-9]+$') === -1, 'the looser number pattern (allows leading zeros) is not used');
});

test('W5 the workflow never pushes to master, merges, approves or marks ready', () => {
  const code = wf.split('\n').filter((l) => !/^\s*#/.test(l));
  code.filter((l) => /\bgit push\b/.test(l)).forEach((l) => {
    assert.ok(/git push --force-with-lease origin "HEAD:refs\/heads\/\$BRANCH"/.test(l), 'only its own validated branch: ' + l.trim());
    assert.ok(!/\b(master|main)\b/.test(l));
  });
  assert.ok(code.some((l) => /\bgit push\b/.test(l)));
  ['gh pr merge', 'gh pr ready', 'gh pr review', '--admin', '--approve'].forEach((c) => assert.ok(!code.some((l) => l.indexOf(c) !== -1), 'forbidden: ' + c));
  code.filter((l) => /gh pr create/.test(l)).forEach((l) => assert.ok(/--base master/.test(l)));
  assert.ok(!/continue-on-error/.test(wf), 'no step or job may ignore its own failure');
  assert.ok(!jobText('record').split('\n').some((l) => /^ {6,}(-\s+)?if:/.test(l)), 'no step-level if: inside the record job');
  const ghApi = code.filter((l) => /\bgh api\b/.test(l));
  assert.ok(ghApi.length >= 1);
  ghApi.forEach((l) => {
    assert.ok(jobText('recognise').indexOf(l) !== -1 && jobText('record').indexOf(l) === -1, 'gh api only in the recognise job: ' + l.trim());
    assert.ok(!/\s(-X|--method|-f|-F|--field|--raw-field|--input)(\s|=|$)/.test(l), 'gh api is a plain read: ' + l.trim());
  });
  const withToken = jobs.map((j) => stepsOf(j.id)).reduce((a, b) => a.concat(b), []).filter((s) => /GH_TOKEN/.test(s.text)).map((s) => s.name).sort();
  assert.deepStrictEqual(withToken, ['Fetch the issue (hand start only)', 'Gather facts (existing branches and open pull requests)', 'Open the pull request if none is open'].sort(), 'GH_TOKEN only in the three steps that call gh');
});

test('W6 the record job runs only for open or rebuild; nothing else pushes or opens a pull request', () => {
  const rec = jobText('record');
  const ifLine = rec.split('\n').find((l) => /^    if:/.test(l)) || '';
  assert.ok(ifLine.indexOf('needs.recognise.outputs.action') !== -1 && ifLine.indexOf("'open'") !== -1 && ifLine.indexOf("'rebuild'") !== -1);
  assert.ok(!/git push|gh pr create/.test(jobText('recognise')));
});

test('W7 checkout of master only, no stored credentials in the recognise job, no pull_request_target', () => {
  assert.ok(/persist-credentials:\s*false/.test(jobText('recognise')));
  assert.ok(!/pull_request_target|workflow_run/.test(wf));
  assert.ok(!/^\s+repository:/m.test(wf), 'no checkout names another repository');
  const recCheckout = stepsOf('record').find((s) => /uses:\s*actions\/checkout@v4/.test(s.text));
  assert.ok(recCheckout && !/persist-credentials/.test(recCheckout.text), 'the record checkout keeps the default credentials it needs to push');
  const checkouts = (wf.match(/uses:\s*actions\/checkout@v4/g) || []).length;
  assert.ok(checkouts >= 2);
  assert.strictEqual((wf.match(/ref:\s*master/g) || []).length, checkouts, 'every checkout names ref: master');
});

test('W8 no third-party actions', () => {
  const uses = wf.split('\n').filter((l) => /^\s*(-\s+)?uses:/.test(l));
  assert.ok(uses.length >= 2);
  uses.forEach((l) => assert.ok(/uses:\s*actions\/checkout@v4\s*$/.test(l), 'only actions/checkout@v4: ' + l.trim()));
});

test('W9 the record branch is reset from the current master and never takes the incident file from the issue', () => {
  const rec = jobText('record');
  assert.ok(rec.indexOf('git checkout -B "$BRANCH" origin/master') !== -1);
  assert.ok(rec.indexOf('--force-with-lease') !== -1);
  assert.ok(!/gh api/.test(rec));
});

test('W10 the bridge author is a workflow variable, never a literal', () => {
  assert.ok(wf.indexOf('vars.ERROR_BRIDGE_AUTHOR') !== -1);
  assert.ok(!/heymishy/i.test(wf) && wf.indexOf(AUTHOR) === -1);
});

test('W11 both jobs are bounded and the plan step prints the result line', () => {
  ['recognise', 'record'].forEach((id) => { const m = /timeout-minutes:\s*(\d+)/.exec(jobText(id)); assert.ok(m && Number(m[1]) <= 15, id + ' has a time limit'); });
  assert.ok(/error-issue-incident\.js/.test(jobText('recognise')));
  assert.ok(/error-issue-incident\.js build/.test(jobText('record')));
  assert.ok(/^defaults:\s*\n  run:\s*\n    shell: bash\s*$/m.test(topText), 'top-level defaults.run.shell is bash (bash -eo pipefail)');
  assert.strictEqual((wf.match(/^\s+shell:/gm) || []).length, 1, 'no step overrides the shell');
});

test('W13 the record job does not count pull requests from forks as already open', () => {
  const lines = jobText('record').split('\n').filter((l) => /gh pr list/.test(l) && /--head/.test(l));
  assert.strictEqual(lines.length, 1, 'one existing pull request check in the record job');
  assert.ok(/--json number,isCrossRepository(\s|$)/.test(lines[0]), 'requests isCrossRepository');
  assert.ok(lines[0].indexOf("--jq '[.[] | select(.isCrossRepository | not)] | length'") !== -1, 'filters cross-repository pull requests out of the count');
});

test('W12 no credential in any new file', () => {
  const pat = new RegExp(['ghp' + '_', 'github' + '_pat_', 'gho' + '_', 'AKIA[0-9A-Z]{8}', '-----BEGIN [A-Z ]*PRIVATE KEY'].join('|'));
  [WORKFLOW, SCRIPT, LIB_FILE, __filename].forEach((f) => { if (fs.existsSync(f)) assert.ok(!pat.test(fs.readFileSync(f, 'utf8')), 'credential-like text in ' + f); });
  assert.ok(wf.indexOf('secrets.GITHUB_TOKEN') !== -1 && !/secrets\.(?!GITHUB_TOKEN)/.test(wf));
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
