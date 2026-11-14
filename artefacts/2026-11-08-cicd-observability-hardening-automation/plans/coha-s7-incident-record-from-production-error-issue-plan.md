# Incident record pull request opened for each bridge-opened production error GitHub issue (coha-s7) — Implementation Plan

> **For agent execution:** Use /subagent-execution (if subagents available) or /tdd per task if executing in this session.

**Goal:** Make every test in the coha-s7 test plan pass: when the coha-s6 bridge opens a `production-error` issue, a GitHub Actions workflow (run on `issues: opened`, or by hand) recognises it safely and opens exactly one pull request that adds one incident record, never pushing to `master`.
**Branch:** `feature/coha-s7-incident-record-from-production-error-issue`
**Worktree:** `C:\Users\Hamis\code\skills repo\.worktrees\coha-s7-incident-record-from-production-error-issue` (run every command from here; before the first Edit or Write of each turn confirm the absolute path contains `.worktrees\coha-s7-incident-record-from-production-error-issue`)
**Test command:** `node tests/check-coha-s7-error-issue-incident.js` (always-run, 39 tests, no database or Docker needed); full suite `npm test`. Put Git Bash first on PATH before the full suite: PowerShell `$env:PATH = "C:\Program Files\Git\bin;" + $env:PATH`. The suite has 3 known baseline failures (acknowledged 2026-11-14, `decisions.md`: `scripts/check-pipeline-state-integrity.js`, `tests/check-pcr-s1-test-runner.js`, `tests/check-p3.5-validate-trace.js`); the regression test is "no new failures".
**Story:** `artefacts/2026-11-08-cicd-observability-hardening-automation/stories/coha-s7-incident-record-from-production-error-issue.md` (9 ACs, review run 5 PASS)
**Test plan:** `artefacts/2026-11-08-cicd-observability-hardening-automation/test-plans/coha-s7-incident-record-from-production-error-issue-test-plan.md` (test ids U1 to U18 plus U14b, I1 to I6, W1 to W12, N1, N2 refer to it)
**DoR and contract:** `artefacts/2026-11-08-cicd-observability-hardening-automation/dor/coha-s7-incident-record-from-production-error-issue-dor.md` and `...-dor-contract.md` (signed off 2026-11-14)

## Rules that apply to every task

- Read `.github/architecture-guardrails.md` and the end of `artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md` (entries dated 2026-11-14) before Task 1.
- **Never read, write or touch `workspace/incidents.json`**, in any test or script run. Tests use temporary copies under the operating system's temp directory. The script must contain no default path to the real file.
- Never edit `.github/pipeline-state.json` or `workspace/state.json` from the worktree. State is advanced on master by the orchestrator.
- Never edit `scripts/create-incident.js`, `src/modules/incident-recorder.js`, `scripts/lib/incident-store.js`, `src/modules/triage-drafter.js`, `src/web-ui/routes/error-bridge.js` or `src/web-ui/routes/products.js`; tests may import or run them.
- The `Edit` tool has twice turned backslash-u escape sequences into literal characters in this repository. Every file written must stay plain ASCII: after any edit that contains a backslash-u sequence, verify with a non-ASCII character count (`[regex]::Matches((Get-Content <file> -Raw), '[^\x00-\x7F]').Count` must be 0).
- Never contact GitHub or any network host. Tests use local temporary directories and real `git` against a local bare repository only.
- Commit only the files a task names, with explicit `git add <path>`. The worktree has unrelated untracked directories and one line-ending-only modified file (`artefacts/test-slug/ideate.md`); leave them alone. Never run `git checkout --`, `git restore`, `git reset` or `git stash`.
- Run every command in the foreground in the same turn and wait for it to return; a subagent has no way to be notified of a background process.
- Fixed names used throughout (the workflow variable is created by the operator after merge and named in the pull request description): workflow `error-issue-incident-record.yml`, variable `ERROR_BRIDGE_AUTHOR`, branch prefix `incident/posthog-`, label `production-error`, marker line `PostHog issue id: <lowercase uuid>`.
- Model routing (from `.github/context.yml` policy): tasks 1 and 7 `fast/cheap`; tasks 2, 3, 4, 5 `balanced`; task 6 (the workflow file and its tests) `deep-reasoning`, with the orchestrator reading the YAML line by line itself.
- **D37 (injectable adapter rule) does not apply:** this design introduces no injectable adapter. If a task finds it needs one, stop and report.
- A design observation to record, not to act on: every record has the tags `production-error` and `posthog:<id>`, so two such records share one of three distinct tags, a Jaccard score of 0.33, just above the triage drafter's provisional 0.3 threshold. Each new error record will therefore be linked to every earlier one by the drafter. That is acceptable for now (they are all production errors) and matters when the threshold is calibrated; the orchestrator logs it in `decisions.md`.

---

## File map

```
Create:
  scripts/lib/error-issue-incident.js            — pure logic: recognise an issue, plan the record, pull request text, idempotency, plan for a run
  scripts/error-issue-incident.js                — command-line script: `plan` and `build`, explicit --incidents path required
  .github/workflows/error-issue-incident-record.yml — recognise job then record job; automatic and hand-started
  tests/check-coha-s7-error-issue-incident.js    — all 39 tests (U1 to U18 and U14b, I1 to I6, W1 to W12, N1, N2)

Modify:
  scripts/run-all-tests.js                       — only if Task 7's measurement shows the new file disturbs timing-sensitive tests
```

---

## Task 1: Test harness and builders

**Files:**
- Create: `tests/check-coha-s7-error-issue-incident.js` (harness only; no tests yet)

- [ ] **Step 1: Write the harness (this exact content; later tasks insert tests above the `// RUNNER` marker)**

```javascript
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
```

- [ ] **Step 2: Verify ASCII and run — must fail**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: `Error: Cannot find module '../scripts/lib/error-issue-incident'` (the logic module does not exist yet). Also confirm the non-ASCII count of the file is 0 (the check marks are written as escapes).

- [ ] **Step 3: Commit**

```powershell
git add tests/check-coha-s7-error-issue-incident.js
git commit -m "test: add coha-s7 incident record test harness and builders"
```

(If a commit hook blocks the commit because the new file cannot load, first create `scripts/lib/error-issue-incident.js` containing only `module.exports = {};`, commit both, and say so in the report; Task 2 replaces it.)

---

## Task 2: Logic module — recognition, record plan, branch name (AC1, AC3, AC4, AC6)

**Files:**
- Create: `scripts/lib/error-issue-incident.js`
- Test: `tests/check-coha-s7-error-issue-incident.js` (U1 to U4, U6 to U13)

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
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
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: module-not-found, or `lib.recogniseIssue is not a function` if the placeholder module exists.

- [ ] **Step 3: Write the module (this task writes recognition, the record plan and the branch name; Task 3 adds the rest to the same file)**

```javascript
'use strict';
// coha-s7: recognise a bridge-opened production error issue and plan its incident record.
// Pure functions over data: no git, no network, no file access. Issue text is untrusted data.

const LABEL = 'production-error';
const MARKER_PREFIX = 'PostHog issue id: ';
const BRANCH_PREFIX = 'incident/posthog-';
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ISSUE_URL_RE = /^https:\/\/github\.com\/[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+\/issues\/[0-9]+$/;
const MAX_CODE = 120;
const CODE_BAD_RE = /[\u0000-\u001f\u007f\u2028\u2029]/;

// The code is the issue title. It is stored as data and shown only inside inline code.
function codeProblem(code) {
  if (typeof code !== 'string' || code.length === 0) return 'empty';
  if (code.length > MAX_CODE) return 'long';
  if (CODE_BAD_RE.test(code)) return 'control';
  return null;
}

// Accepts the event payload ({ issue }) or a bare REST issue object and returns { issue }.
function normaliseEvent(data) {
  if (data && typeof data === 'object' && data.issue && typeof data.issue === 'object') return data;
  return { issue: data };
}

function lineValue(lines, prefix) {
  const l = lines.find((x) => x.indexOf(prefix) === 0);
  return l === undefined ? '' : l.slice(prefix.length);
}

// Returns { recognised: true, ... } or { recognised: false, reason, issueNumber }.
function recogniseIssue(event, config) {
  const issue = normaliseEvent(event).issue;
  const isObj = issue !== null && typeof issue === 'object';
  const number = isObj && Number.isInteger(issue.number) && issue.number > 0 ? issue.number : null;
  const decline = (reason) => ({ recognised: false, reason: reason, issueNumber: number });
  if (!isObj) return decline('shape');
  if (Object.prototype.hasOwnProperty.call(issue, 'pull_request')) return decline('pull-request');

  const expected = config && config.bridgeAuthor;
  if (typeof expected !== 'string' || expected.trim() === '') return decline('author');
  const login = issue.user && issue.user.login;
  if (typeof login !== 'string' || login !== expected) return decline('author');

  const labels = Array.isArray(issue.labels) ? issue.labels : [];
  if (!labels.some((l) => l && l.name === LABEL)) return decline('label');

  const body = typeof issue.body === 'string' ? issue.body : '';
  const lines = body.split(/\r?\n/);
  const candidates = lines.filter((l) => l.indexOf(MARKER_PREFIX) === 0).map((l) => l.slice(MARKER_PREFIX.length));
  if (candidates.length === 0) return decline('marker');
  if (new Set(candidates).size > 1) return decline('marker-ambiguous');
  const id = candidates[0];
  if (!UUID_RE.test(id)) return decline('id');

  if (number === null) return decline('shape');
  if (typeof issue.html_url !== 'string' || !ISSUE_URL_RE.test(issue.html_url)) return decline('shape');
  if (codeProblem(issue.title) !== null) return decline('code');

  return {
    recognised: true,
    issueNumber: number,
    issueUrl: issue.html_url,
    code: issue.title,
    id: id,
    firstSeen: lineValue(lines, 'First seen: '),
    environment: lineValue(lines, 'Environment: '),
    postHogLink: lineValue(lines, 'PostHog: ')
  };
}

function branchNameFor(id) {
  if (typeof id !== 'string' || !UUID_RE.test(id)) throw new Error('invalid id');
  return BRANCH_PREFIX + id;
}

// The record fields handed to the existing incident recorder. Nothing but the fixed fields.
function planRecord(r) {
  return {
    trigger: 'GitHub issue ' + r.issueUrl + ' (PostHog issue id ' + r.id + ')',
    summary: r.code,
    tags: [LABEL, 'posthog:' + r.id]
  };
}

module.exports = {
  LABEL, MARKER_PREFIX, BRANCH_PREFIX, UUID_RE, ISSUE_URL_RE, MAX_CODE,
  codeProblem, normaliseEvent, recogniseIssue, branchNameFor, planRecord
};
```

Task 3 adds `buildPullRequest`, `decideIdempotency`, `planRun` and `validatePlanForBuild`. Until then U13's pull request assertions fail; that is expected, so write Step 1's U13 now but allow its pull request half to stay red until Task 3 (see Step 4).

- [ ] **Step 4: Run — all of U1 to U4 and U6 to U12 must pass; U13 passes except its pull request lines**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: U1, U2, U3, U4, U6, U7, U8, U9, U10, U11, U12 pass; U13 fails with `lib.buildPullRequest is not a function` (fixed in Task 3). If you prefer a green commit, move U13 into Task 3's commit.

- [ ] **Step 5: Commit**

```powershell
git add scripts/lib/error-issue-incident.js tests/check-coha-s7-error-issue-incident.js
git commit -m "feat: recognise a bridge-opened production error issue for the incident record workflow"
```

---

## Task 3: Logic module — pull request text, idempotency, plan for a run (AC1, AC2, AC7, AC8)

**Files:**
- Modify: `scripts/lib/error-issue-incident.js`
- Test: `tests/check-coha-s7-error-issue-incident.js` (U5, U13 pull request lines, U14, U14b, U15)

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
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
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: U5, U13, U14, U14b and U15 fail with `lib.buildPullRequest is not a function` / `lib.decideIdempotency is not a function` / `lib.planRun is not a function`.

- [ ] **Step 3: Add these functions to `scripts/lib/error-issue-incident.js` (before `module.exports`) and extend the export list**

```javascript
// Title and body use only the fixed code (inline code, one line, backticks replaced) and the issue number.
function buildPullRequest(r) {
  const safe = String(r.code).replace(/`/g, "'");
  return {
    title: 'Incident record for `' + safe + '` (issue #' + r.issueNumber + ')',
    body: 'Adds one incident record for `' + safe + '` from issue #' + r.issueNumber + '. It exists only on this pull request until it is merged.'
  };
}

// facts: { id, records, branches, openPullRequests }; options: { rebuild }.
// A record already on master always skips; the rebuild switch lifts only the branch and pull request skips.
function decideIdempotency(facts, options) {
  const f = facts || {};
  const o = options || {};
  const tag = 'posthog:' + f.id;
  const records = Array.isArray(f.records) ? f.records : [];
  if (records.some((r) => r && Array.isArray(r.tags) && r.tags.indexOf(tag) !== -1)) return { action: 'skip', reason: 'already-recorded' };
  const branch = branchNameFor(f.id);
  const branches = Array.isArray(f.branches) ? f.branches : [];
  const prs = Array.isArray(f.openPullRequests) ? f.openPullRequests : [];
  const prOpen = prs.some((p) => p && p.headRefName === branch);
  const branchExists = branches.indexOf(branch) !== -1;
  if (prOpen || branchExists) {
    if (o.rebuild) return { action: 'rebuild', reason: 'rebuild' };
    return { action: 'skip', reason: prOpen ? 'pr-open' : 'branch-exists' };
  }
  return { action: 'open', reason: 'new' };
}

// input: { event, config: { bridgeAuthor }, facts: { records, branches, openPullRequests }, options: { rebuild, dryRun } }
// Returns a plan: { action: decline | skip | open | rebuild | dry-run, reason, issueNumber, id, branch, code, issueUrl, record, pullRequest }.
function planRun(input) {
  const options = input.options || {};
  const r = recogniseIssue(input.event, input.config);
  if (!r.recognised) {
    return { action: 'decline', reason: r.reason, issueNumber: r.issueNumber, id: null, branch: null, code: null, issueUrl: null, record: null, pullRequest: null };
  }
  const facts = input.facts || {};
  const branch = branchNameFor(r.id);
  const common = { issueNumber: r.issueNumber, id: r.id, branch: branch, code: r.code, issueUrl: r.issueUrl };
  const idem = decideIdempotency({ id: r.id, records: facts.records, branches: facts.branches, openPullRequests: facts.openPullRequests }, options);
  if (idem.action === 'skip') return Object.assign({ action: 'skip', reason: idem.reason, record: null, pullRequest: null }, common);
  const record = planRecord(r);
  const pullRequest = buildPullRequest(r);
  if (options.dryRun) return Object.assign({ action: 'dry-run', reason: idem.action === 'rebuild' ? 'would-rebuild' : 'would-open', record: record, pullRequest: pullRequest }, common);
  return Object.assign({ action: idem.action, reason: idem.reason, record: record, pullRequest: pullRequest }, common);
}

// The record job never trusts the plan it receives: it re-checks every field it uses.
function validatePlanForBuild(plan) {
  if (!plan || typeof plan !== 'object') throw new Error('bad plan');
  if (plan.action !== 'open' && plan.action !== 'rebuild') throw new Error('nothing to build');
  if (typeof plan.id !== 'string' || !UUID_RE.test(plan.id)) throw new Error('bad id');
  if (!Number.isInteger(plan.issueNumber) || plan.issueNumber <= 0) throw new Error('bad issue number');
  if (typeof plan.issueUrl !== 'string' || !ISSUE_URL_RE.test(plan.issueUrl)) throw new Error('bad issue url');
  if (codeProblem(plan.code) !== null) throw new Error('bad code');
  return { action: plan.action, id: plan.id, code: plan.code, issueNumber: plan.issueNumber, issueUrl: plan.issueUrl };
}
```

Update the export list to add: `buildPullRequest, decideIdempotency, planRun, validatePlanForBuild`.

- [ ] **Step 4: Run — all Task 2 and Task 3 tests must pass**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: `Results: 16 passed, 0 failed` (U1 to U4, U5, U6 to U13, U14, U14b, U15). Verify the module and test file are still plain ASCII.

- [ ] **Step 5: Commit**

```powershell
git add scripts/lib/error-issue-incident.js tests/check-coha-s7-error-issue-incident.js
git commit -m "feat: plan the pull request, idempotency and run outcome for the incident record"
```

---

## Task 4: Command-line script (AC1, AC2, AC6, AC7, AC8, NFR audit and reliability)

**Files:**
- Create: `scripts/error-issue-incident.js`
- Test: `tests/check-coha-s7-error-issue-incident.js` (U16, U17, U18, I1, I5, I6, N1, N2)

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
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
});
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: the eight new tests fail because `scripts/error-issue-incident.js` does not exist (the child process exits with `Cannot find module`).

- [ ] **Step 3: Write the script**

```javascript
#!/usr/bin/env node
'use strict';

/**
 * error-issue-incident.js (coha-s7)
 *
 *   node scripts/error-issue-incident.js plan  --event <file> --author <login> --facts <file> --incidents <file>
 *        [--dry-run] [--rebuild] [--github-output <file>] [--out <file>]
 *   node scripts/error-issue-incident.js build --plan-env <VAR> --incidents <file> [--github-output <file>]
 *
 * plan:  recognise the issue and decide what to do; writes nothing except the optional output files.
 * build: append one incident record to the given incident file (never a default path) through the real recorder.
 *
 * Issue text is untrusted data: it is read from a JSON file or an environment variable, never from an
 * argument, and never printed. Every run prints exactly one result line starting "error-issue-incident: ".
 */

const fs = require('fs');
const lib = require('./lib/error-issue-incident');
const { recordIncident } = require('../src/modules/incident-recorder');

const FLAGS = ['dry-run', 'rebuild'];

function fail(message) {
  process.stderr.write('error-issue-incident: ' + message + '\n');
  process.exit(1);
}

function parseArgs(argv) {
  const args = { command: argv[0], flags: {} };
  for (let i = 1; i < argv.length; i++) {
    const a = argv[i];
    if (typeof a !== 'string' || a.indexOf('--') !== 0) fail('unexpected argument');
    const name = a.slice(2);
    if (FLAGS.indexOf(name) !== -1) { args.flags[name] = true; continue; }
    args[name] = argv[i + 1];
    i++;
  }
  return args;
}

function readJsonFile(file, what) {
  if (typeof file !== 'string' || file === '') fail('missing ' + what + ' path');
  let raw;
  try { raw = fs.readFileSync(file, 'utf8'); } catch (e) { fail('could not read ' + what); }
  if (raw.trim() === '') return null;
  try { return JSON.parse(raw); } catch (e) { fail(what + ' is not valid JSON'); }
}

function readIncidents(file) {
  const data = readJsonFile(file, 'incident file');
  if (data === null) return [];
  if (!Array.isArray(data)) fail('incident file is not a list');
  return data;
}

function resultLine(plan) {
  return 'error-issue-incident: ' + plan.action + ' ' + plan.reason + (plan.issueNumber ? ' issue #' + plan.issueNumber : '');
}

function writeOutputs(file, pairs) {
  if (!file) return;
  const lines = Object.keys(pairs).map((k) => {
    const v = String(pairs[k]);
    if (/[\r\n]/.test(v)) fail('an output value has a line break');
    return k + '=' + v;
  });
  fs.appendFileSync(file, lines.join('\n') + '\n');
}

function runPlan(args) {
  const event = lib.normaliseEvent(readJsonFile(args.event, 'event file'));
  const factsRaw = readJsonFile(args.facts, 'facts file') || {};
  const records = readIncidents(args.incidents);
  const plan = lib.planRun({
    event: event,
    config: { bridgeAuthor: args.author },
    facts: { branches: factsRaw.branches, openPullRequests: factsRaw.openPullRequests, records: records },
    options: { rebuild: !!args.flags.rebuild, dryRun: !!args.flags['dry-run'] }
  });
  process.stdout.write(resultLine(plan) + '\n');
  if (plan.action === 'dry-run') {
    process.stdout.write('error-issue-incident-dry-run: ' + JSON.stringify({ record: plan.record, pullRequest: plan.pullRequest, branch: plan.branch }) + '\n');
  }
  writeOutputs(args['github-output'], { action: plan.action, reason: plan.reason, branch: plan.branch || '', plan: JSON.stringify(plan) });
  if (args.out) fs.writeFileSync(args.out, JSON.stringify(plan, null, 2) + '\n');
}

function runBuild(args) {
  const name = args['plan-env'];
  if (typeof name !== 'string' || !/^[A-Z_][A-Z0-9_]*$/.test(name)) fail('missing or invalid plan variable name');
  let plan;
  try { plan = JSON.parse(process.env[name] || ''); } catch (e) { fail('plan is not valid JSON'); }
  let checked;
  try { checked = lib.validatePlanForBuild(plan); } catch (e) { fail('plan is not acceptable'); }
  readIncidents(args.incidents); // fails early on an unreadable or damaged file, before anything is written
  const record = lib.planRecord(checked);
  const pr = lib.buildPullRequest(checked);
  try { recordIncident(record, args.incidents); } catch (e) { fail('could not record the incident'); }
  process.stdout.write('error-issue-incident: recorded ' + checked.action + ' issue #' + checked.issueNumber + '\n');
  writeOutputs(args['github-output'], { branch: lib.branchNameFor(checked.id), pr_title: pr.title, pr_body: pr.body });
}

const args = parseArgs(process.argv.slice(2));
if (args.command === 'plan') runPlan(args);
else if (args.command === 'build') runBuild(args);
else fail('unknown command');
```

- [ ] **Step 4: Run — must pass**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: `Results: 24 passed, 0 failed` (16 from Tasks 2 and 3 plus these 8). If the triage drafter's output makes `I1`'s `triageSummary` assertion fail, read `src/modules/triage-drafter.js` (it always writes a non-empty string) and fix the test, not the drafter.

- [ ] **Step 5: Commit**

```powershell
git add scripts/error-issue-incident.js tests/check-coha-s7-error-issue-incident.js
git commit -m "feat: add the command-line script that plans and builds an incident record"
```

---

## Task 5: Integration with the real product page, the real loader and real git (AC5, AC7)

**Files:**
- Test: `tests/check-coha-s7-error-issue-incident.js` (I2, I3, I4); no source file changes expected

- [ ] **Step 1: Write the tests (insert above `// RUNNER`). They should pass at once because the behaviour already exists; each must still be proven able to fail (Step 3).**

```javascript
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
function buildRecord(m, s) {
  assert.strictEqual(run(planArgs(s)).status, 0);
  assert.strictEqual(run(['build', '--plan-env', 'PLAN_JSON', '--incidents', s.incidents, '--github-output', s.out + '2'], { PLAN_JSON: readOut(s.out).plan }).status, 0);
}

test('I2 the product page renders the new record as one distinct item, with its text escaped', async () => {
  const m = mk({ title: 'tenant_admin_bootstrap_failed' });
  const s = cliSetup(m);
  buildRecord(m, s);
  const html = await renderPageWith(fs.readFileSync(s.incidents, 'utf8'));
  assert.strictEqual((html.match(/data-incident-item/g) || []).length, 3, 'one item per record');
  assert.ok(html.indexOf('tenant_admin_bootstrap_failed') !== -1);
  assert.ok(/Status: open/.test(html));
  const m2 = mk({ title: '<b>x</b>' });
  const s2 = cliSetup(m2);
  buildRecord(m2, s2);
  const html2 = await renderPageWith(fs.readFileSync(s2.incidents, 'utf8'));
  assert.ok(html2.indexOf('&lt;b&gt;x&lt;/b&gt;') !== -1 && html2.indexOf('<b>x</b>') === -1, 'the code appears as plain characters');
});

test('I3 the existing store loads and validates the new record', () => {
  const m = mk();
  const s = cliSetup(m);
  buildRecord(m, s);
  const loaded = store.loadIncidentRecords(s.incidents);
  assert.strictEqual(loaded.length, 3);
  assert.deepStrictEqual(store.withDefaultType(loaded[2]), loaded[2]);
  loaded.forEach((r) => assert.doesNotThrow(() => store.validateRecord(r)));
  assert.strictEqual(store.loadRecords(s.incidents).length, 3);
});

function git(cwd, args) { const r = cp.spawnSync('git', args, { cwd: cwd, encoding: 'utf8' }); return { status: r.status, out: (r.stdout || '') + (r.stderr || ''), stdout: r.stdout || '' }; }
function gitOk(cwd, args) { const r = git(cwd, args); assert.strictEqual(r.status, 0, 'git ' + args.join(' ') + ': ' + r.out); return r; }

test('I4 two branches from one base conflict; a rebuild from the current master merges cleanly', () => {
  const dir = tmpDir();
  const origin = path.join(dir, 'origin.git');
  const work = path.join(dir, 'work');
  gitOk(dir, ['init', '--bare', origin]);
  gitOk(origin, ['symbolic-ref', 'HEAD', 'refs/heads/master']);
  gitOk(dir, ['clone', origin, work]);
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
```

- [ ] **Step 2: Run**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: `Results: 27 passed, 0 failed`. If `I4`'s clash assertion fails because git merged the two records cleanly, stop and report: that would change the story's premise (the rebuild may not be needed), and the orchestrator decides.

- [ ] **Step 3: Prove the new tests can fail.** Temporarily (scratch edit, reverted by hand before committing; confirm `git diff` shows only the test file): (a) in `I2` change the expected item count from 3 to 4 and see it fail; (b) in `I4` change the clash assertion to `assert.strictEqual(clash.status, 0)` and see it fail. Report what failed.

- [ ] **Step 4: Commit**

```powershell
git add tests/check-coha-s7-error-issue-incident.js
git commit -m "test: prove the incident record renders, loads and rebuilds with the real page, store and git"
```

---

## Task 6: The workflow file and its wiring tests (AC3, AC4, AC6, AC7, AC8, AC9, NFR security)

**Files:**
- Create: `.github/workflows/error-issue-incident-record.yml`
- Test: `tests/check-coha-s7-error-issue-incident.js` (W1 to W12)

- [ ] **Step 1: Write the failing tests (insert above `// RUNNER`)**

```javascript
// ---- workflow file wiring tests (text based, in the style of tests/check-cif-s1-deploy-concurrency-guard.js) ----
const wf = fs.existsSync(WORKFLOW) ? fs.readFileSync(WORKFLOW, 'utf8') : '';
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
function jobPermissions(text) {
  const lines = text.split('\n'); const i = lines.findIndex((l) => /^    permissions:\s*$/.test(l));
  const out = {}; if (i === -1) return null;
  for (let k = i + 1; k < lines.length && indentOf(lines[k]) >= 6; k++) { const m = /^\s+([a-z-]+):\s*(\S+)/.exec(lines[k]); if (m) out[m[1]] = m[2]; }
  return out;
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
});

test('W2 least-privilege job permissions', () => {
  assert.ok(/^permissions:\s*\n  contents: read\s*(\n|$)/m.test(topText));
  assert.deepStrictEqual(jobPermissions(jobText('recognise')), { contents: 'read', issues: 'read' });
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
});

test('W6 the record job runs only for open or rebuild; nothing else pushes or opens a pull request', () => {
  const rec = jobText('record');
  const ifLine = rec.split('\n').find((l) => /^    if:/.test(l)) || '';
  assert.ok(ifLine.indexOf('needs.recognise.outputs.action') !== -1 && ifLine.indexOf("'open'") !== -1 && ifLine.indexOf("'rebuild'") !== -1);
  assert.ok(!/git push|gh pr create/.test(jobText('recognise')));
});

test('W7 checkout of master only, no stored credentials in the recognise job, no pull_request_target', () => {
  assert.ok(/persist-credentials:\s*false/.test(jobText('recognise')));
  assert.ok(!/pull_request_target/.test(wf));
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
});

test('W12 no credential in any new file', () => {
  const pat = new RegExp(['ghp' + '_', 'github' + '_pat_', 'gho' + '_', 'AKIA[0-9A-Z]{8}', '-----BEGIN [A-Z ]*PRIVATE KEY'].join('|'));
  [WORKFLOW, SCRIPT, LIB_FILE, __filename].forEach((f) => { if (fs.existsSync(f)) assert.ok(!pat.test(fs.readFileSync(f, 'utf8')), 'credential-like text in ' + f); });
  assert.ok(wf.indexOf('secrets.GITHUB_TOKEN') !== -1 && !/secrets\.(?!GITHUB_TOKEN)/.test(wf));
});
```

- [ ] **Step 2: Run — must fail**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: W1 to W12 fail (the workflow file does not exist, so `wf` is empty); everything earlier still passes.

- [ ] **Step 3: Write the workflow `.github/workflows/error-issue-incident-record.yml`**

```yaml
name: Error issue incident record

# coha-s7: when the error bridge (coha-s6) opens a production error issue, prepare one incident record as a
# pull request for the operator to merge. Never pushes to master. One file with two jobs: the ADR-009 deviation
# is accepted (decisions.md, 2026-11-14). Untrusted issue text reaches the script only through the event file
# or env: blocks, never through a run block.

on:
  issues:
    types: [opened]
  workflow_dispatch:
    inputs:
      issue_number:
        description: 'Issue number to record'
        required: true
        type: string
      dry_run:
        description: 'Print the plan and create nothing'
        required: false
        type: boolean
        default: false
      rebuild:
        description: 'Rebuild an existing record branch from the current master'
        required: false
        type: boolean
        default: false

permissions:
  contents: read

concurrency:
  group: incident-record-${{ github.event.issue.number || inputs.issue_number }}
  cancel-in-progress: false

jobs:
  recognise:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    permissions:
      contents: read
      issues: read
    outputs:
      action: ${{ steps.plan.outputs.action }}
      reason: ${{ steps.plan.outputs.reason }}
      plan: ${{ steps.plan.outputs.plan }}
    steps:
      - uses: actions/checkout@v4
        with:
          ref: master
          fetch-depth: 1
          persist-credentials: false

      - name: Fetch the issue (hand start only)
        if: ${{ github.event_name == 'workflow_dispatch' }}
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          ISSUE_NUMBER: ${{ inputs.issue_number }}
        run: |
          if ! [[ "$ISSUE_NUMBER" =~ ^[0-9]+$ ]]; then
            echo "error-issue-incident: the issue number is not a number"
            exit 1
          fi
          gh api "repos/${GITHUB_REPOSITORY}/issues/${ISSUE_NUMBER}" > "$RUNNER_TEMP/event.json"

      - name: Gather facts (existing branches and open pull requests)
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          branches=$(git ls-remote --heads origin 'incident/posthog-*' | awk '{print $2}' | sed 's#refs/heads/##' | jq -R . | jq -s .)
          prs=$(gh pr list --repo "$GITHUB_REPOSITORY" --state open --json headRefName --limit 200)
          jq -n --argjson b "$branches" --argjson p "$prs" '{branches: $b, openPullRequests: $p}' > "$RUNNER_TEMP/facts.json"

      - name: Plan
        id: plan
        env:
          BRIDGE_AUTHOR: ${{ vars.ERROR_BRIDGE_AUTHOR }}
          EVENT_NAME: ${{ github.event_name }}
          DRY_RUN: ${{ inputs.dry_run }}
          REBUILD: ${{ inputs.rebuild }}
        run: |
          if [ "$EVENT_NAME" = "workflow_dispatch" ]; then
            EVENT_FILE="$RUNNER_TEMP/event.json"
          else
            EVENT_FILE="$GITHUB_EVENT_PATH"
          fi
          args=(plan --event "$EVENT_FILE" --author "$BRIDGE_AUTHOR" --facts "$RUNNER_TEMP/facts.json" --incidents workspace/incidents.json --github-output "$GITHUB_OUTPUT")
          if [ "$DRY_RUN" = "true" ]; then args+=(--dry-run); fi
          if [ "$REBUILD" = "true" ]; then args+=(--rebuild); fi
          node scripts/error-issue-incident.js "${args[@]}"

  record:
    needs: recognise
    if: ${{ needs.recognise.outputs.action == 'open' || needs.recognise.outputs.action == 'rebuild' }}
    runs-on: ubuntu-latest
    timeout-minutes: 10
    permissions:
      contents: write
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          ref: master
          fetch-depth: 0

      - name: Build the record in the working copy
        id: build
        env:
          PLAN_JSON: ${{ needs.recognise.outputs.plan }}
        run: |
          node scripts/error-issue-incident.js build --plan-env PLAN_JSON --incidents workspace/incidents.json --github-output "$GITHUB_OUTPUT"

      - name: Commit and push the record branch
        env:
          BRANCH: ${{ steps.build.outputs.branch }}
        run: |
          git config user.name "github-actions[bot]"
          git config user.email "github-actions[bot]@users.noreply.github.com"
          git checkout -B "$BRANCH" origin/master
          git add workspace/incidents.json
          git commit -m "chore: incident record from production error issue"
          git push --force-with-lease origin "HEAD:refs/heads/$BRANCH"

      - name: Open the pull request if none is open
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          BRANCH: ${{ steps.build.outputs.branch }}
          PR_TITLE: ${{ steps.build.outputs.pr_title }}
          PR_BODY: ${{ steps.build.outputs.pr_body }}
        run: |
          open=$(gh pr list --repo "$GITHUB_REPOSITORY" --head "$BRANCH" --state open --json number --jq 'length')
          if [ "$open" = "0" ]; then
            gh pr create --repo "$GITHUB_REPOSITORY" --base master --head "$BRANCH" --title "$PR_TITLE" --body "$PR_BODY"
          else
            echo "error-issue-incident: pull request already open, updated in place"
          fi
```

- [ ] **Step 4: Run — W1 to W12 must pass**

```powershell
node tests/check-coha-s7-error-issue-incident.js
```

Expected: `Results: 39 passed, 0 failed`. If a wiring assertion and the YAML disagree, fix the YAML, or fix the assertion only when it is plainly over-strict against the story's constraints (list every such change in the report). Verify every new file is plain ASCII.

- [ ] **Step 5: Prove the structural tests can fail.** On scratch copies (never committed): (a) add `issues: write` to the record job and see W2 fail; (b) change a `run:` block to contain `${{ github.event.issue.title }}` and see W4 fail; (c) change the push line to `git push origin master` and see W5 fail; (d) change `types: [opened]` to `types: [opened, labeled]` and see W1 fail. Report which test failed for each; confirm `git diff HEAD --stat` shows no edits to the workflow after the experiments.

- [ ] **Step 6: Commit**

```powershell
git add .github/workflows/error-issue-incident-record.yml tests/check-coha-s7-error-issue-incident.js
git commit -m "feat: add the incident record workflow with least-privilege jobs and structural tests"
```

---

## Task 7: Test-runner slot, full suite, and handover

**Files:**
- Modify (only if the measurement says so): `scripts/run-all-tests.js`

- [ ] **Step 1: Measure.** With Git Bash first on PATH and PowerShell 7, run the full suite twice pinned to 2 cores with a two-slot pool, as the coha-s6 decision (`decisions.md`, 2026-11-14) did: processor affinity 3 on the runner process, and a `node --require` shim that makes `os.cpus()` return 4 entries so `getPoolConcurrency()` is 2. Record the total files run, the failing files, and the per-file result of `tests/check-cat-s1-core-trace-builder.js`.

- [ ] **Step 2: The controlled experiment.** Run the timing-sensitive file `tests/check-rb-s3-harness-agnostic-instructions.js` six times each pinned to 2 cores: alone, beside `tests/check-coha-s7-error-issue-incident.js`, and beside `tests/check-coha-s5-error-capture.js` (the control). Record failures out of 6 for each.

- [ ] **Step 3: Decide.** If the new file causes timing-sensitive tests to fail (clearly more failures beside it than alone), add `'tests/check-coha-s7-error-issue-incident.js'` to `SEQUENTIAL_EXCLUSIVE_LIST` in `scripts/run-all-tests.js` and re-run the full suite once. Otherwise leave it. Put the numbers in your report; the orchestrator records the decision.

- [ ] **Step 4: Confirm no new failures.** The failing set of the final full run must be a subset of the three acknowledged baseline files. Then run `node tests/check-coha-s7-error-issue-incident.js` once more and confirm 39 passed, 0 failed.

- [ ] **Step 5: Commit (only if `run-all-tests.js` changed)**

```powershell
git add scripts/run-all-tests.js
git commit -m "chore: run the incident record check in the sequential-exclusive phase"
```

- [ ] **Step 6: Hand over.** Stop here. The orchestrator runs `/verify-completion` and `/branch-complete` (push and open a draft pull request; the operator merges it). The agent never merges, never marks the pull request ready, and never runs the live AC8 or AC9 scenarios (they need the workflow merged, the `ERROR_BRIDGE_AUTHOR` variable set, and the operator's approval immediately before each run).

---

## Coverage check

| AC | Tasks | Tests |
|----|-------|-------|
| AC1 | 2, 3, 4 | U1 to U5, I1, I6 |
| AC2 | 3, 4 | U14, U15, I6 |
| AC3 | 2, 6 | U6 to U8, W10 |
| AC4 | 2, 6 | U9 to U11, W1 |
| AC5 | 4, 5 | I1, I2, I3 |
| AC6 | 2, 4, 6 | U12, U13, U18, W4 |
| AC7 | 3, 4, 5, 6 | U14b, I4, I5, W3, W9 |
| AC8 | 4, 6 | U16, U17, W6 and the live dry run (scenario 8, after merge) |
| AC9 | 6 | W2, W5, W9, I6 and the live real run (scenario 9, after merge) |
| NFRs | 4, 6 | N1, N2, W2, W5, W7, W8, W11, W12 |
