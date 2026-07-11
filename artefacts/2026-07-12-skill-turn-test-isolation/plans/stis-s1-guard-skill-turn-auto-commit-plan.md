# Stop the skill-turn artefact auto-commit from firing real git commits during tests — Implementation Plan

> **For agent execution:** Executed directly in this session (coding agent), following /tdd discipline per task.

**Goal:** Wrap the existing "best-effort" git-commit call inside `skills.js`'s skill-turn-stream artefact-completion handler in a D37-style injectable adapter, so tests can stub it while production behaviour (a real commit on a genuine live server session) is fully preserved.
**Branch:** `feature/stis-s1`
**Worktree:** `.worktrees/stis-s1`
**Test command:** `node scripts/run-all-tests.js` (full suite) / `node tests/check-<file>.js` (single file)

---

## File map

```
Modify:
  src/web-ui/routes/skills.js   — extract the artefact-completion git add/commit block
                                   (currently inline execSync, ~line 4181-4189) into a
                                   D37 injectable adapter: setSkillTurnGitCommitAdapter(fn).
                                   Default implementation performs the real execSync calls,
                                   preserving the existing try/catch swallow-on-failure.
  src/web-ui/server.js          — wire a no-op stub for the adapter inside the existing
                                   NODE_ENV==='test' block. Required because this session's
                                   own exhaustive search (this story's AC3 instruction) found
                                   an affected surface beyond the DoR contract's anticipated
                                   touch points: the shared Playwright e2e webServer
                                   subprocess drives handlePostTurnStreamHtml through
                                   completed mock-gateway artefact turns (discovery/design/
                                   definition/etc. success fixtures all contain
                                   ---ARTEFACT-START---/---ARTEFACT-END--- markers), and an
                                   HTTP-driven Playwright spec has no way to call
                                   setSkillTurnGitCommitAdapter() directly on that subprocess.
                                   Logged as a decisions.md finding (scope expansion beyond
                                   DoR contract, required by AC1's literal text).
  tests/check-wusl2-progressive-live-draft.js       — freshRequire() helper: auto-wire stub
  tests/check-iwu5-lens-complete.js                 — single top-level require: wire stub once

Create:
  tests/check-stis-s1-guard-skill-turn-git-commit.js — new dedicated test file: U1-U4 (unit)
                                                         + IT1 (per-affected-file HEAD check)
```

**Exhaustive search findings (AC3 instruction — do not assume the DoR contract's candidate list is complete):**

**Critical correction found during tracing (not just grepping):** the artefact-completion
auto-save-and-git-commit block (~line 4171-4189) lives *only* inside `handlePostTurnStreamHtml`
(the mfc.3 streaming turn handler). The older, non-streaming `htmlSubmitTurn` function
(used by `handlePostTurnHtml`) independently parses `---ARTEFACT-START---`/`---ARTEFACT-END---`
markers and sets `session.done`/`session.artefactContent`, but never writes to disk and never
shells out to git at all — confirmed by reading its full body (`src/web-ui/routes/skills.js`
line 1912-1980), which has zero `execSync`/`fs.writeFileSync` calls. So a test that produces a
completed-artefact response through `htmlSubmitTurn` is **not** affected by this defect,
regardless of whether it contains ARTEFACT-START/END-looking text. The DoR contract's 6-file
candidate list was built by grepping for marker text, not by tracing which handler function is
actually invoked — it over-included 2 files as a result. The exhaustive search below traces
every `tests/*.js` call site of `handlePostTurnStreamHtml(` (the only function that can reach
the git-commit block) and checks whether its mock executor ever returns a completed artefact.

| File | Calls `handlePostTurnStreamHtml`? | Mock returns completed artefact? | Reaches git-commit path? | Action |
|------|-----------------------------------|-----------------------------------|---------------------------|--------|
| `tests/check-wusl2-progressive-live-draft.js` | Yes | Yes (T2.5/T2.6 send full `---ARTEFACT-START---...---ARTEFACT-END---`) | **Yes** | Fix `freshRequire()` |
| `tests/check-iwu5-lens-complete.js` | Yes | Yes (`ARTEFACT_RESPONSE` const, AC1 test) | **Yes** | Wire stub once at top |
| `tests/check-wusl1-chat-streaming.js` | Yes | No — no executor mock in this file returns ARTEFACT-START/END markers today | No | None. Named in the DoR contract as "the primary trigger" but does not currently reach the completion path — documented as a candidate-list correction. |
| `tests/check-pla-s2-posthog-wiring.js` | Yes | No — mock returns plain `'response text'` | No | None |
| `tests/check-iwu3-assumption-cards.js` | Yes | No — mock returns `MARKER_TEXT` (assumption-card marker only) | No | None |
| `tests/check-inc2.1-conditions-panel.js` | Yes | No — only exercises `CONDITION-JSON` marker | No | None |
| `tests/check-inc4-canvas-panel.js` | Yes | No — only exercises `CANVAS-JSON` marker | No | None |
| `tests/check-mfc1-model-first-chat-session.js` | **No — uses `htmlSubmitTurn` only** | Yes (T5.1-T5.4 send completed artefact + `---SLUG---`) | **No — `htmlSubmitTurn` has no git-commit logic at all** | None. DoR-contract candidate-list correction — confirmed false positive by reading `htmlSubmitTurn`'s full body. |
| `tests/check-dsq4-section-artefact-assembly.js` | **No — uses `htmlSubmitTurn` only** | Yes (`---ARTEFACT-START---`/`---ARTEFACT-END---` markers) | **No — same reason as mfc1** | None. DoR-contract candidate-list correction. |
| `tests/check-sec1-sse-rate-limit.js`, `tests/check-s0.4-resume-redis-session.js` | No — mention `handlePostTurnStreamHtml` only in comments, never call it | N/A | No | None |
| `tests/e2e/bri-s3.2-signup-onboarding-journey.spec.js` (AC3 "pass" path) + other e2e specs sharing the same webServer | Indirectly, via a real server subprocess | Yes — real mock-gateway fixtures (discovery/design/definition/etc. `.success.json`) contain ARTEFACT-START/END | **Yes, indirectly** — no way to stub via HTTP | Fix at `server.js` level (covers all e2e specs sharing the one webServer, not just bri-s3.2) |

**Final affected-file count: 2** (`check-wusl2-progressive-live-draft.js`, `check-iwu5-lens-complete.js`) plus the `server.js`-level e2e/webServer fix — not the 6+ implied by the DoR contract's grep-based candidate list. Both corrections (2 false positives removed, 1 new e2e surface added) are logged to `decisions.md` per the DoR's revisit trigger ("if the implementation deviates meaningfully from the DoR contract's estimated touch points").

---

## Task 1: Extract the git-commit call into a D37 injectable adapter (AC1, AC2, AC4)

**Files:**
- Modify: `src/web-ui/routes/skills.js`

- [x] **Step 1: Write the failing test** (in the new file, written in Task 4 — TDD order here is: write Task 4's U1/U2/U4 first against the *current* inline-execSync code, confirm they fail for the right reason, then do this refactor, then confirm they pass). See Task 4 for the actual test code.

- [x] **Step 2: Confirm current code** (already read in full):
```js
    // Git commit (best-effort — git is not installed in Fly.io containers; failure is not an error)
    try {
      var _cp = require('child_process');
      var _commitMsg = _isAmendment
        ? 'feat: ' + (session.skillName || skillName) + ' artefact (amended)'
        : 'feat: ' + (session.skillName || skillName) + ' artefact';
      _cp.execSync('git add ' + JSON.stringify(session.artefactPath), { cwd: _autoRepoRoot, encoding: 'utf8' });
      _cp.execSync('git commit -m ' + JSON.stringify(_commitMsg), { cwd: _autoRepoRoot, encoding: 'utf8' });
    } catch (_gitErr) { /* git unavailable in production — disk write above is the durable record */ }
```

- [ ] **Step 3: Add the adapter declaration** near the other injectable adapters (next to `_skillTurnExecutorStream` around line 1067):

```js
// stis-s1: D37 injectable adapter for the artefact-completion git commit step.
// Default implementation performs the real `git add`/`git commit` exactly as
// before (production behaviour unchanged — AC2). This is a deliberate,
// documented exception to the D37 "stub must throw" rule: this adapter's
// whole purpose is to fail silently and safely when git is unavailable
// (Fly.io containers) — see story AC2. Tests inject a stub via
// setSkillTurnGitCommitAdapter() so no test run ever spawns a real git
// process (AC1).
let _skillTurnGitCommit = function defaultSkillTurnGitCommit(artefactPath, commitMessage, repoRoot) {
  var _cp = require('child_process');
  _cp.execSync('git add ' + JSON.stringify(artefactPath), { cwd: repoRoot, encoding: 'utf8' });
  _cp.execSync('git commit -m ' + JSON.stringify(commitMessage), { cwd: repoRoot, encoding: 'utf8' });
};
function setSkillTurnGitCommitAdapter(fn) { _skillTurnGitCommit = fn; }
```

- [ ] **Step 4: Replace the call site** (~line 4181-4189) with:

```js
    // Git commit (best-effort — git is not installed in Fly.io containers; failure is not an
    // error). Routed through the D37 adapter (stis-s1) so tests can stub it — see
    // setSkillTurnGitCommitAdapter above.
    try {
      var _commitMsg = _isAmendment
        ? 'feat: ' + (session.skillName || skillName) + ' artefact (amended)'
        : 'feat: ' + (session.skillName || skillName) + ' artefact';
      _skillTurnGitCommit(session.artefactPath, _commitMsg, _autoRepoRoot);
    } catch (_gitErr) { /* git unavailable in production — disk write above is the durable record */ }
```

- [ ] **Step 5: Add to `module.exports`** — insert `setSkillTurnGitCommitAdapter` next to `setSkillTurnExecutorStreamAdapter` in the export list.

- [ ] **Step 6: Run** `node tests/check-stis-s1-guard-skill-turn-git-commit.js` (written in Task 4) — expect PASS for U1/U3/U4; U2 exercises the default and must show a real commit in a disposable temp repo only.

- [ ] **Step 7: Commit**

```bash
git add src/web-ui/routes/skills.js
git commit -m "fix(skills): guard artefact-completion git commit behind a D37 adapter"
```

---

## Task 2: Wire a no-op stub in server.js test mode (AC1 — e2e/webServer gap found by exhaustive search)

**Files:**
- Modify: `src/web-ui/server.js`

- [ ] **Step 1:** Inside the existing `if (process.env.NODE_ENV === 'test') { ... }` block (~line 627, same block that seeds `E2E_SESSION_ID` and wires the fixture artefact fetcher), add near the top:

```js
  // stis-s1: no-op git-commit adapter in test mode. The shared e2e webServer
  // subprocess drives handlePostTurnStreamHtml through completed mock-gateway
  // artefact turns (discovery/design/definition/etc. success fixtures all
  // contain ---ARTEFACT-START---/---ARTEFACT-END--- markers) with no way for
  // an HTTP-driven Playwright spec to call setSkillTurnGitCommitAdapter()
  // directly. Without this, every e2e run that completes a stage would fire
  // a real git commit into this checkout — reproducing the exact defect this
  // story exists to fix. See decisions.md (stis-s1 finding, beyond DoR scope).
  const { setSkillTurnGitCommitAdapter } = require('./routes/skills');
  setSkillTurnGitCommitAdapter(function stisS1NoOpGitCommitTestMode() { /* no-op in test mode */ });
```

- [ ] **Step 2: Run** `node -e "require('./src/web-ui/server.js')"` is not viable (server.js starts listening) — instead confirm via the new test file's static check (Task 4) that this wiring line exists in `server.js`'s NODE_ENV==='test' block.

- [ ] **Step 3: Commit**

```bash
git add src/web-ui/server.js
git commit -m "fix(server): no-op the skill-turn git-commit adapter in test mode"
```

---

## Task 3: Update the 2 confirmed affected existing test files (AC3)

**Files:**
- Modify: `tests/check-wusl2-progressive-live-draft.js`
- Modify: `tests/check-iwu5-lens-complete.js`

- [ ] **Step 1:** In `check-wusl2-progressive-live-draft.js`, update the shared `freshRequire()` helper (single choke point — every `const routes = freshRequire(ROUTES_PATH)` call site in this file goes through it):

```js
function freshRequire(modulePath) {
  const resolved = require.resolve(modulePath);
  delete require.cache[resolved];
  const mod = require(resolved);
  // stis-s1: never let a completed-artefact test turn fire a real git commit
  // into this worktree. Stub records nothing and never touches child_process.
  if (typeof mod.setSkillTurnGitCommitAdapter === 'function') {
    mod.setSkillTurnGitCommitAdapter(function stisS1TestStubGitCommit() { /* test stub — no real git op */ });
  }
  return mod;
}
```

- [ ] **Step 2:** In `check-iwu5-lens-complete.js`, add `setSkillTurnGitCommitAdapter` to the destructured require at the top, and call it once before the first artefact-completing test:

```js
const {
  handlePostTurnStreamHtml,
  handleGetChatHtml,
  _setHtmlSession,
  _getHtmlSession,
  setSkillTurnExecutorStreamAdapter,
  setSkillTurnExecutorAdapter,
  setSkillTurnGitCommitAdapter,
  registerHtmlSession,
  setListSkills,
  setCreateSession,
  buildSystemPrompt
} = require('../src/web-ui/routes/skills');

// stis-s1: stub the git-commit adapter before any artefact-completing test
// runs in this file — this module instance is shared across the whole file
// (no freshRequire cache-busting here), so one call covers every test below.
setSkillTurnGitCommitAdapter(function stisS1TestStubGitCommit() { /* test stub — no real git op */ });
```

- [ ] **Step 3: Run each file standalone, recording `git rev-parse HEAD` before/after each:**

```bash
git rev-parse HEAD
node tests/check-wusl2-progressive-live-draft.js
git rev-parse HEAD
node tests/check-iwu5-lens-complete.js
git rev-parse HEAD
```

Expected output: all `git rev-parse HEAD` values identical; each file's own PASS/FAIL summary unchanged from its pre-fix baseline.

- [ ] **Step 4: Commit**

```bash
git add tests/check-wusl2-progressive-live-draft.js tests/check-iwu5-lens-complete.js
git commit -m "test: stub the skill-turn git-commit adapter in affected artefact-completion tests"
```

---

## Task 4: New dedicated test file for the adapter (AC1, AC2, AC3-partial, AC4-static)

**Files:**
- Create: `tests/check-stis-s1-guard-skill-turn-git-commit.js`

- [ ] **Step 1: Write the failing test file** (fails against current inline-execSync code because `setSkillTurnGitCommitAdapter` does not exist yet):

```js
'use strict';
/**
 * check-stis-s1-guard-skill-turn-git-commit.js
 *
 * Unit + integration tests for stis-s1 — guard the skill-turn-stream
 * artefact-completion handler's git commit behind a D37 injectable adapter
 * so no test run ever spawns a real git process.
 *
 * Run: node tests/check-stis-s1-guard-skill-turn-git-commit.js
 */

const assert = require('assert');
const path   = require('path');
const fs     = require('fs');
const os     = require('os');
const { execSync, spawnSync } = require('child_process');
const cp     = require('child_process');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    const r = fn();
    if (r && typeof r.then === 'function') {
      return r.then(function() { passed++; console.log('  PASS: ' + name); })
        .catch(function(err) {
          failed++;
          failures.push({ name, msg: err && err.message ? err.message : String(err) });
          console.log('  FAIL: ' + name + '\n       ' + (err && err.message ? err.message : err));
        });
    }
    passed++;
    console.log('  PASS: ' + name);
    return Promise.resolve();
  } catch (err) {
    failed++;
    failures.push({ name, msg: err && err.message ? err.message : String(err) });
    console.log('  FAIL: ' + name + '\n       ' + (err && err.message ? err.message : err));
    return Promise.resolve();
  }
}

function freshRequireRoutes() {
  const resolved = require.resolve('../src/web-ui/routes/skills.js');
  delete require.cache[resolved];
  return require(resolved);
}

function makeSseRes() {
  return {
    writtenData: [],
    writeHead: function() {},
    write: function(d) { this.writtenData.push(d); },
    end: function() {}
  };
}

function makeStreamReq(sessionId) {
  return {
    session: { accessToken: 'test-token' },
    params:  { id: sessionId, name: 'discovery' },
    on: function(event, cb) {
      if (event === 'data') { cb(Buffer.from(JSON.stringify({ answer: 'hello' }))); }
      if (event === 'end')  { cb(); }
      if (event === 'error') {}
    }
  };
}

const ARTEFACT_RESPONSE = '---ARTEFACT-START---\n# Stub artefact\nbody\n---ARTEFACT-END---\n---SLUG---\nstis-s1-test-slug';

const queue = [];

// ---------------------------------------------------------------------------
// U1 — setSkillTurnGitCommitAdapter() overrides the default; no real execSync
// git call occurs when a stub is injected (AC1).
// ---------------------------------------------------------------------------
queue.push(function() {
  console.log('\n── U1 — setSkillTurnGitCommitAdapter() overrides default git-commit behaviour');
  return test('U1 (AC1): stubbed adapter is called; no real execSync git call occurs', async function() {
    const routes = freshRequireRoutes();
    const sid = 'stis-s1-u1-' + Math.random().toString(36).slice(2);
    routes._setHtmlSession(sid, {
      skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SYS',
      turns: [], artefactContent: null, artefactPath: null, done: false
    });

    let stubCalled = false;
    let stubArgs = null;
    routes.setSkillTurnGitCommitAdapter(function spyAdapter(artefactPath, commitMessage, repoRoot) {
      stubCalled = true;
      stubArgs = { artefactPath, commitMessage, repoRoot };
    });

    const origExecSync = cp.execSync;
    let realExecSyncCalledWithGit = false;
    cp.execSync = function(cmd) {
      if (typeof cmd === 'string' && cmd.indexOf('git ') === 0) { realExecSyncCalledWithGit = true; }
      return origExecSync.apply(cp, arguments);
    };

    try {
      routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
        onChunk(ARTEFACT_RESPONSE);
        return ARTEFACT_RESPONSE;
      });
      await routes.handlePostTurnStreamHtml(makeStreamReq(sid), makeSseRes());
    } finally {
      cp.execSync = origExecSync;
    }

    assert.ok(stubCalled, 'stub adapter must be called when a completed artefact turn occurs');
    assert.ok(stubArgs.artefactPath, 'stub must receive the artefact path');
    assert.ok(!realExecSyncCalledWithGit, 'no real execSync git call may occur when a stub adapter is injected');
  });
});

// ---------------------------------------------------------------------------
// U2 — default adapter (no override) still performs the real git commit,
// but ONLY against a disposable temp repo — never this real repo (AC2).
// ---------------------------------------------------------------------------
queue.push(function() {
  console.log('\n── U2 — default adapter (unset) still performs a real commit, in a disposable temp repo');
  return test('U2 (AC2): production default adapter fires a real git commit in a throwaway repo only', async function() {
    const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'stis-s1-u2-'));
    execSync('git init', { cwd: tmpRoot, encoding: 'utf8' });
    execSync('git config user.email "test@example.com"', { cwd: tmpRoot, encoding: 'utf8' });
    execSync('git config user.name "Test"', { cwd: tmpRoot, encoding: 'utf8' });
    fs.writeFileSync(path.join(tmpRoot, 'README.md'), 'seed\n', 'utf8');
    execSync('git add README.md', { cwd: tmpRoot, encoding: 'utf8' });
    execSync('git commit -m "seed"', { cwd: tmpRoot, encoding: 'utf8' });
    const beforeLog = execSync('git log --oneline', { cwd: tmpRoot, encoding: 'utf8' }).trim();

    const prevRepoPath = process.env.CLAUDE_REPO_PATH;
    process.env.CLAUDE_REPO_PATH = tmpRoot; // NEVER point this at the real repo checkout

    try {
      const routes = freshRequireRoutes(); // fresh module — adapter is back at its real default
      const sid = 'stis-s1-u2-' + Math.random().toString(36).slice(2);
      routes._setHtmlSession(sid, {
        skillName: 'discovery', sessionPath: '/tmp/test', systemPrompt: 'SYS',
        turns: [], artefactContent: null, artefactPath: null, done: false
      });
      routes.setSkillTurnExecutorStreamAdapter(async function(_s, _h, _i, _t, onChunk) {
        onChunk(ARTEFACT_RESPONSE);
        return ARTEFACT_RESPONSE;
      });
      await routes.handlePostTurnStreamHtml(makeStreamReq(sid), makeSseRes());

      const afterLog = execSync('git log --oneline', { cwd: tmpRoot, encoding: 'utf8' }).trim();
      assert.notStrictEqual(afterLog, beforeLog, 'a real commit must appear in the disposable temp repo when no adapter override is set');
      assert.ok(afterLog.split('\n').length > beforeLog.split('\n').length, 'commit count must increase in the temp repo');
    } finally {
      if (prevRepoPath === undefined) { delete process.env.CLAUDE_REPO_PATH; } else { process.env.CLAUDE_REPO_PATH = prevRepoPath; }
      fs.rmSync(tmpRoot, { recursive: true, force: true });
    }
  });
});

// ---------------------------------------------------------------------------
// U3 — stub adapter records the call without any side effect (pure function).
// ---------------------------------------------------------------------------
queue.push(function() {
  console.log('\n── U3 — stub adapter records the call without touching child_process');
  return test('U3 (AC1): a D37-style test stub records args and never calls child_process', function() {
    const calls = [];
    function stub(artefactPath, commitMessage, repoRoot) {
      calls.push({ artefactPath, commitMessage, repoRoot });
    }
    const origSpawn = cp.execSync;
    let called = false;
    cp.execSync = function() { called = true; return origSpawn.apply(cp, arguments); };
    try {
      stub('artefacts/x/y.md', 'feat: y artefact', '/some/repo');
    } finally {
      cp.execSync = origSpawn;
    }
    assert.strictEqual(calls.length, 1, 'stub must record exactly one call');
    assert.strictEqual(calls[0].artefactPath, 'artefacts/x/y.md');
    assert.ok(!called, 'stub must never invoke child_process');
  });
});

// ---------------------------------------------------------------------------
// U4 — exactly one execSync('git ...') call site remains, inside the default
// adapter, not inline in the handler (proves the refactor replaced the old
// path rather than adding a second one alongside it).
// ---------------------------------------------------------------------------
queue.push(function() {
  console.log('\n── U4 — exactly one execSync git call site remains, inside the default adapter');
  return test('U4 (AC1/AC2): static check — one execSync git call site, inside defaultSkillTurnGitCommit', function() {
    const src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/routes/skills.js'), 'utf8');
    const execSyncGitMatches = src.match(/execSync\(\s*'git /g) || [];
    assert.strictEqual(execSyncGitMatches.length, 2, 'expected exactly 2 execSync(\'git ...\') calls (add + commit), both inside the default adapter; got ' + execSyncGitMatches.length);

    const adapterFnMatch = src.match(/function defaultSkillTurnGitCommit\([^)]*\)\s*\{[\s\S]*?\n\};/);
    assert.ok(adapterFnMatch, 'defaultSkillTurnGitCommit function must exist');
    const adapterBody = adapterFnMatch[0];
    const inAdapter = (adapterBody.match(/execSync\(\s*'git /g) || []).length;
    assert.strictEqual(inAdapter, 2, 'both execSync git calls must be inside defaultSkillTurnGitCommit; found ' + inAdapter);

    // The handler's artefact-completion block must call the adapter, not execSync directly.
    const handlerCallMatch = src.match(/_skillTurnGitCommit\(session\.artefactPath, _commitMsg, _autoRepoRoot\)/);
    assert.ok(handlerCallMatch, 'handler must call _skillTurnGitCommit(...) rather than execSync directly');
  });
});

// ---------------------------------------------------------------------------
// Extra (beyond original test plan) — server.js wires a no-op stub in
// NODE_ENV=test mode, closing the e2e/webServer gap found by this story's
// own exhaustive AC3 search (see plan's File map / decisions.md).
// ---------------------------------------------------------------------------
queue.push(function() {
  console.log('\n── Extra — server.js wires a no-op git-commit stub in NODE_ENV=test mode');
  return test('Extra (AC1, e2e gap): server.js contains the test-mode no-op wiring for setSkillTurnGitCommitAdapter', function() {
    const src = fs.readFileSync(path.resolve(__dirname, '../src/web-ui/server.js'), 'utf8');
    assert.ok(src.includes('setSkillTurnGitCommitAdapter'), 'server.js must wire setSkillTurnGitCommitAdapter in test mode');
    // Must be inside the NODE_ENV==='test' guarded region — approximate check:
    // the wiring line's surrounding block must be gated by NODE_ENV === 'test'.
    const idx = src.indexOf('setSkillTurnGitCommitAdapter(function stisS1NoOpGitCommitTestMode');
    assert.ok(idx > -1, 'the no-op wiring call must be present');
    const preceding = src.slice(0, idx);
    const lastNodeEnvGuardIdx = preceding.lastIndexOf("process.env.NODE_ENV === 'test'");
    assert.ok(lastNodeEnvGuardIdx > -1 && lastNodeEnvGuardIdx < idx, 'wiring must be inside a NODE_ENV===\'test\' guarded block');
  });
});

// ---------------------------------------------------------------------------
// IT1 — running each of the 4 confirmed-affected existing test files
// standalone produces zero new commits (AC1, AC3).
// ---------------------------------------------------------------------------
const AFFECTED_FILES = [
  'tests/check-wusl2-progressive-live-draft.js',
  'tests/check-mfc1-model-first-chat-session.js',
  'tests/check-iwu5-lens-complete.js',
  'tests/check-dsq4-section-artefact-assembly.js'
];

queue.push(function() {
  console.log('\n── IT1 — running each affected file standalone produces zero new commits');
  return test('IT1 (AC1/AC3): HEAD unchanged after running each of the ' + AFFECTED_FILES.length + ' affected files', function() {
    const repoRoot = path.resolve(__dirname, '..');
    AFFECTED_FILES.forEach(function(rel) {
      const before = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
      const result = spawnSync('node', [rel], { cwd: repoRoot, encoding: 'utf8' });
      const after = execSync('git rev-parse HEAD', { cwd: repoRoot, encoding: 'utf8' }).trim();
      assert.strictEqual(after, before, 'HEAD must be unchanged after running ' + rel + '. stdout tail: ' + (result.stdout || '').slice(-500));
    });
  });
});

// ── run ──────────────────────────────────────────────────────────────────────

console.log('\n[check-stis-s1-guard-skill-turn-git-commit]');

queue.reduce(function(p, fn) { return p.then(fn); }, Promise.resolve()).then(function() {
  console.log('\n--- Results ---');
  console.log('  Passed: ' + passed);
  console.log('  Failed: ' + failed);
  if (failures.length) {
    failures.forEach(function(f) { console.log('  FAIL detail: ' + f.name + '\n    ' + f.msg); });
  }
  process.exit(failed > 0 ? 1 : 0);
});
```

- [ ] **Step 2: Run test — must fail** (before Task 1/2/3 land):

```bash
node tests/check-stis-s1-guard-skill-turn-git-commit.js
```

Expected output: `FAIL` — `routes.setSkillTurnGitCommitAdapter is not a function` (U1/U2), and IT1 will show real commits appearing (RED-state proof the bug is real) if run against the unmodified affected files.

- [ ] **Step 3: Complete Tasks 1-3**, then run again — expect all PASS.

- [ ] **Step 4: Run full suite — no regressions**

```bash
node scripts/run-all-tests.js
```

Expected output: same pre-existing baseline failure count (~68-70), this file's own tests all passing, no new commits (verified separately per AC4/IT2 as real verify-completion evidence, not embedded in this file — see plan note on IT2/IT3 below).

- [ ] **Step 5: Commit**

```bash
git add tests/check-stis-s1-guard-skill-turn-git-commit.js
git commit -m "test: add dedicated adapter tests for stis-s1 skill-turn git-commit guard"
```

---

## Note on AC4 (IT2) and AC5 (IT3) — executed as verify-completion evidence, not embedded as permanent automated tests

IT2 ("run the full suite twice, HEAD unchanged both times") and IT3 ("failing-file list unchanged") both operate at the level of `node scripts/run-all-tests.js` itself. Embedding either as a permanent test *inside* a file that is itself discovered and run by `scripts/run-all-tests.js` would mean the full suite recursively re-runs itself from within one of its own test files — impractical runtime cost and a correctness risk (nested suite runs). These two checks are executed for real, with fresh evidence, at `/verify-completion` time (actual `git rev-parse HEAD` before/after two full suite runs, and a real diff of the failing-file list against the documented baseline) rather than committed as self-referential automated tests. This is called out explicitly so it is not mistaken for a skipped AC — see `verify-completion` output for the actual evidence.

---

## Self-review checklist

- [x] Exact file paths (no placeholders)
- [x] Complete code in each step
- [x] Failing test written before implementation (Task 4's file, run before Tasks 1-3 land)
- [x] Expected output for every run command
- [x] Commit messages in imperative mood
- [x] No scope beyond the relevant ACs (server.js change is in-scope per AC1's literal text and this story's own AC3 exhaustive-search instruction; logged as a decisions.md finding since it's beyond the DoR contract's anticipated touch points)
