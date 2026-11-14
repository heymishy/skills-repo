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
