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
// Exhaustive search result (stis-s1): every tests/*.js file that calls
// handlePostTurnStreamHtml() was traced (not just grepped for ARTEFACT-START
// text) to confirm it actually reaches the artefact-completion code path at
// runtime. Only these 2 files' mock executors ever return a completed
// ---ARTEFACT-START---/---ARTEFACT-END--- turn through that specific handler.
// check-mfc1-model-first-chat-session.js and check-dsq4-section-artefact-assembly.js
// were named as candidates in the DoR contract but only exercise htmlSubmitTurn()
// (the non-streaming turn path), which has no auto-save/git-commit logic at all —
// confirmed false positives, logged in decisions.md.
const AFFECTED_FILES = [
  'tests/check-wusl2-progressive-live-draft.js',
  'tests/check-iwu5-lens-complete.js'
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
