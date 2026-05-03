'use strict';
/**
 * cli-subprocess.test.js — AC verification for wuce.9
 * 23 tests: T1-T5 (unit), IT1-IT3 (integration), NFR1-NFR3
 */
const assert  = require('assert');
const path    = require('path');
const fs      = require('fs');
const { EventEmitter } = require('events');

let passed = 0, failed = 0;
const failures = [];

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  \u2713 ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  \u2717 ' + name + ': ' + err.message);
  }
}

// ── Mock child_process.spawn ──────────────────────────────────────────────────
const childProcess = require('child_process');
let _spawnImpl = null;

const origSpawn = childProcess.spawn;
childProcess.spawn = function mockSpawn(cmd, args, opts) {
  if (_spawnImpl) { return _spawnImpl(cmd, args, opts); }
  return origSpawn.call(childProcess, cmd, args, opts);
};

function makeSpyProcess(opts) {
  opts = opts || {};
  var emitter = new EventEmitter();
  emitter.stdout = new EventEmitter();
  emitter.stderr = new EventEmitter();
  emitter.killed = false;
  emitter.kill = function(signal) {
    emitter.killed = true;
    emitter._killSignal = signal;
    if (opts.onKill) { opts.onKill(signal, emitter); }
  };
  return emitter;
}

function emitAndExit(proc, stdoutData, stderrData, exitCode, delay) {
  delay = delay || 0;
  setTimeout(function() {
    if (stdoutData) { proc.stdout.emit('data', Buffer.from(stdoutData)); }
    if (stderrData) { proc.stderr.emit('data', Buffer.from(stderrData)); }
    proc.emit('close', exitCode);
  }, delay);
}

// Re-require executor after mock is set up
delete require.cache[require.resolve('../src/modules/skill-executor')];
delete require.cache[require.resolve('../src/utils/skill-name-validator')];
const { executeSkill, setLogger } = require('../src/modules/skill-executor');
const { validateSkillName } = require('../src/utils/skill-name-validator');

// Fixtures
const successFixturePath = path.join(__dirname, 'fixtures', 'cli', 'copilot-cli-success.jsonl');
const errorFixturePath   = path.join(__dirname, 'fixtures', 'cli', 'copilot-cli-error-partial.jsonl');
const successFixture = fs.readFileSync(successFixturePath, 'utf8');
const errorFixture   = fs.readFileSync(errorFixturePath,   'utf8');

(async function runTests() {
  // ── T1 — Spawn arguments (AC1) ────────────────────────────────────────────
  console.log('\nT1 — executeSkill spawn arguments (AC1)');

  await test('T1.1 — spawned with shell: false', async () => {
    let capturedOpts = null;
    _spawnImpl = function(cmd, args, opts) {
      capturedOpts = opts;
      var proc = makeSpyProcess(); emitAndExit(proc, '', '', 0, 5); return proc;
    };
    await executeSkill('discovery', 'prompt', 'token', '/tmp/home', { timeoutMs: 1000 });
    _spawnImpl = null;
    assert.strictEqual(capturedOpts.shell, false, 'shell should be false');
  });

  await test('T1.2 — spawned with required flags in args array', async () => {
    let capturedArgs = null;
    _spawnImpl = function(cmd, args, opts) {
      capturedArgs = args;
      var proc = makeSpyProcess(); emitAndExit(proc, '', '', 0, 5); return proc;
    };
    await executeSkill('discovery', 'test prompt', 'token', '/tmp/home', { timeoutMs: 1000 });
    _spawnImpl = null;
    assert.ok(capturedArgs.includes('--output-format=json'), 'should include --output-format=json');
    assert.ok(capturedArgs.includes('--silent'),             'should include --silent');
    assert.ok(capturedArgs.includes('--no-ask-user'),        'should include --no-ask-user');
    assert.ok(capturedArgs.includes('--allow-all'),          'should include --allow-all');
    assert.ok(capturedArgs.includes('-p'),                   'should include -p flag');
    const pIdx = capturedArgs.indexOf('-p');
    assert.strictEqual(capturedArgs[pIdx + 1], 'test prompt', '-p should be followed by prompt');
  });

  await test('T1.3 — COPILOT_GITHUB_TOKEN via env, NOT in args', async () => {
    let capturedArgs = null, capturedEnv = null;
    _spawnImpl = function(cmd, args, opts) {
      capturedArgs = args; capturedEnv = opts.env;
      var proc = makeSpyProcess(); emitAndExit(proc, '', '', 0, 5); return proc;
    };
    await executeSkill('discovery', 'prompt', 'gho_test_token_value', '/tmp/home', { timeoutMs: 1000 });
    _spawnImpl = null;
    assert.ok(!capturedArgs.includes('gho_test_token_value'), 'token should NOT be in args');
    assert.strictEqual(capturedEnv.COPILOT_GITHUB_TOKEN, 'gho_test_token_value', 'token should be in env');
  });

  await test('T1.4 — COPILOT_HOME set to provided homeDir in env', async () => {
    let capturedEnv = null;
    _spawnImpl = function(cmd, args, opts) {
      capturedEnv = opts.env;
      var proc = makeSpyProcess(); emitAndExit(proc, '', '', 0, 5); return proc;
    };
    await executeSkill('discovery', 'prompt', 'token', '/tmp/copilot-sessions/abc123/sess-456', { timeoutMs: 1000 });
    _spawnImpl = null;
    assert.strictEqual(capturedEnv.COPILOT_HOME, '/tmp/copilot-sessions/abc123/sess-456', 'COPILOT_HOME should be set');
  });

  // ── T2 — JSONL parsing (AC2) ──────────────────────────────────────────────
  console.log('\nT2 — JSONL parsing (AC2)');

  await test('T2.1 — success fixture parsed as array of 6 objects (not single JSON.parse)', async () => {
    _spawnImpl = function() {
      var proc = makeSpyProcess(); emitAndExit(proc, successFixture, '', 0, 5); return proc;
    };
    const result = await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 1000 });
    _spawnImpl = null;
    assert.ok(Array.isArray(result.lines), 'lines should be array');
    assert.strictEqual(result.lines.length, 6, 'should parse 6 JSONL lines');
    assert.strictEqual(result.lines[0].type, 'skill_start', 'first line should be skill_start');
  });

  await test('T2.2 — artefact event content is returned', async () => {
    _spawnImpl = function() {
      var proc = makeSpyProcess(); emitAndExit(proc, successFixture, '', 0, 5); return proc;
    };
    const result = await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 1000 });
    _spawnImpl = null;
    assert.ok(result.artefact, 'artefact should be present');
    assert.ok(result.artefact.content.includes('AI-Driven Pipeline Automation'), 'artefact content should match fixture');
  });

  await test('T2.3 — malformed line skipped; valid lines before and after are parsed', async () => {
    _spawnImpl = function() {
      var proc = makeSpyProcess(); emitAndExit(proc, errorFixture, 'fatal: authentication failed\n', 1, 5); return proc;
    };
    try {
      await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 1000 });
      assert.fail('should reject for non-zero exit');
    } catch (err) {
      assert.ok(err.partialLines, 'error should have partialLines');
      assert.ok(err.partialLines.length >= 2, 'should have parsed valid lines (skill_start and question and error event), got: ' + err.partialLines.length);
      assert.strictEqual(err.exitCode, 1, 'exit code should be 1');
    }
    _spawnImpl = null;
  });

  await test('T2.4 — empty stdout handled without throwing', async () => {
    _spawnImpl = function() {
      var proc = makeSpyProcess(); emitAndExit(proc, '', '', 1, 5); return proc;
    };
    try {
      await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 1000 });
    } catch (err) {
      assert.strictEqual(err.exitCode, 1, 'should have exit code 1');
    }
    _spawnImpl = null;
  });

  // ── T3 — Timeout behaviour (AC3) ─────────────────────────────────────────
  console.log('\nT3 — Timeout behaviour (AC3)');

  await test('T3.1 — SIGTERM sent when timeout fires', async () => {
    let killSignal = null;
    _spawnImpl = function() {
      var proc = makeSpyProcess({ onKill: function(sig) { killSignal = sig; } });
      // Process never exits on its own
      return proc;
    };
    const p = executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 50, cliPath: 'fake-copilot' });
    await new Promise(function(resolve) { setTimeout(resolve, 200); });
    _spawnImpl = null;
    assert.strictEqual(killSignal, 'SIGTERM', 'SIGTERM should be sent on timeout');
    p.catch(function() {}); // suppress unhandled rejection
  });

  await test('T3.2 — SIGKILL sent after SIGTERM if process still running', async () => {
    let signals = [];
    _spawnImpl = function() {
      var proc = makeSpyProcess({ onKill: function(sig) { signals.push(sig); } });
      return proc;
    };
    const p = executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 20, cliPath: 'fake-copilot' });
    await new Promise(function(resolve) { setTimeout(resolve, 100); });
    _spawnImpl = null;
    assert.ok(signals.includes('SIGTERM'), 'SIGTERM should be in signals');
    p.catch(function() {}); // suppress unhandled rejection
  });

  await test('T3.3 — rejection error has code: TIMEOUT', async () => {
    _spawnImpl = function() {
      var proc = makeSpyProcess(); return proc; // Never exits
    };
    try {
      await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 30, cliPath: 'fake-copilot' });
      assert.fail('should reject with TIMEOUT');
    } catch (err) {
      assert.strictEqual(err.code, 'TIMEOUT', 'error code should be TIMEOUT');
    } finally { _spawnImpl = null; }
  });

  // ── T4 — Non-zero exit code handling (AC4) ────────────────────────────────
  console.log('\nT4 — Non-zero exit code handling (AC4)');

  await test('T4.1 — rejects with error containing exit code', async () => {
    _spawnImpl = function() {
      var proc = makeSpyProcess();
      emitAndExit(proc, '', 'fatal: authentication failed\ngit credential failed\n', 1, 5);
      return proc;
    };
    try {
      await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 1000 });
      assert.fail('should reject');
    } catch (err) {
      assert.strictEqual(err.exitCode, 1, 'error should have exitCode 1');
    } finally { _spawnImpl = null; }
  });

  await test('T4.2 — error object contains last N stderr lines only', async () => {
    var manyLines = Array.from({ length: 25 }, function(_, i) { return 'line-' + i; }).join('\n') + '\n';
    _spawnImpl = function() {
      var proc = makeSpyProcess();
      emitAndExit(proc, '', manyLines, 2, 5);
      return proc;
    };
    try {
      await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 1000, stderrLines: 10 });
      assert.fail('should reject');
    } catch (err) {
      assert.ok(Array.isArray(err.stderrLines), 'stderrLines should be array');
      assert.ok(err.stderrLines.length <= 10, 'stderrLines should contain at most 10 lines, got: ' + err.stderrLines.length);
    } finally { _spawnImpl = null; }
  });

  // ── T5 — Allowlist validation (AC5) ──────────────────────────────────────
  console.log('\nT5 — Allowlist validation (AC5)');

  await test('T5.1 — skill name with semicolon rejected before spawn', async () => {
    let spawnCalled = false;
    _spawnImpl = function() { spawnCalled = true; return makeSpyProcess(); };
    try {
      await executeSkill('discovery; rm -rf /', 'p', 'tok', '/h', { timeoutMs: 1000 });
      assert.fail('should reject');
    } catch (err) {
      assert.ok(!spawnCalled, 'spawn should NOT be called for invalid skill name');
    } finally { _spawnImpl = null; }
  });

  await test('T5.2 — skill name with backtick rejected', async () => {
    let spawnCalled = false;
    _spawnImpl = function() { spawnCalled = true; return makeSpyProcess(); };
    try {
      await executeSkill('discovery`id`', 'p', 'tok', '/h', { timeoutMs: 1000 });
      assert.fail('should reject');
    } catch (err) {
      assert.ok(!spawnCalled, 'spawn should NOT be called');
    } finally { _spawnImpl = null; }
  });

  await test('T5.3 — valid skill name from allowlist is accepted', async () => {
    let spawnCalled = false;
    _spawnImpl = function() {
      spawnCalled = true;
      var proc = makeSpyProcess(); emitAndExit(proc, '', '', 0, 5); return proc;
    };
    await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 1000 });
    _spawnImpl = null;
    assert.ok(spawnCalled, 'spawn SHOULD be called for valid skill name');
  });

  await test('T5.4 — validateSkillName correctly validates chars', async () => {
    assert.strictEqual(validateSkillName('valid-skill'), true,  'valid-skill should pass');
    assert.strictEqual(validateSkillName('UPPERCASE'),   false, 'uppercase should fail');
    assert.strictEqual(validateSkillName('has space'),   false, 'space should fail');
    assert.strictEqual(validateSkillName('has!bang'),    false, 'bang should fail');
  });

  // ── Integration tests ─────────────────────────────────────────────────────
  console.log('\nIntegration tests');

  const { handleExecuteSkill } = require('../src/web-ui/routes/execute');

  function makeReq(opts) {
    opts = opts || {};
    return {
      method:  'POST',
      params:  opts.params  || { name: 'discovery' },
      session: opts.session !== undefined ? opts.session : { accessToken: 'tok-user', user: { login: 'test-user' } },
      body:    opts.body    !== undefined ? opts.body : { prompt: 'What problem are we solving?', homeDir: '/tmp/test-home' }
    };
  }
  function makeRes() {
    const res = { statusCode: null, headers: {}, body: '',
      writeHead: function(code, h) { this.statusCode = code; this.headers = h || {}; },
      end: function(b) { this.body = b || ''; }
    };
    return res;
  }

  await test('IT1 — valid payload -> 200, executeSkill called with skill name and token', async () => {
    const executorModule = require('../src/modules/skill-executor');
    const origExec = executorModule.executeSkill;
    let calledWith = null;
    executorModule.executeSkill = async function(skill, prompt, token, homeDir) {
      calledWith = { skill, token, homeDir };
      return { lines: [], exitCode: 0, timedOut: false };
    };
    const req = makeReq();
    const res = makeRes();
    await handleExecuteSkill(req, res);
    executorModule.executeSkill = origExec;
    assert.strictEqual(res.statusCode, 200, 'should return 200');
    assert.strictEqual(calledWith.skill, 'discovery', 'should be called with skill name');
    assert.strictEqual(calledWith.token, 'tok-user', 'should use session token');
  });

  await test('IT2 — invalid skill name -> 400, executeSkill NOT called', async () => {
    const executorModule = require('../src/modules/skill-executor');
    const origExec = executorModule.executeSkill;
    let execCalled = false;
    executorModule.executeSkill = async function() { execCalled = true; return {}; };
    const req = makeReq({ params: { name: 'discovery%3B rm -rf /' } });
    const res = makeRes();
    await handleExecuteSkill(req, res);
    executorModule.executeSkill = origExec;
    assert.strictEqual(res.statusCode, 400, 'should return 400 for invalid skill name');
    assert.ok(!execCalled, 'executeSkill should NOT be called');
  });

  await test('IT3 — no session -> 401', async () => {
    const req = makeReq({ session: null });
    const res = makeRes();
    await handleExecuteSkill(req, res);
    assert.strictEqual(res.statusCode, 401, 'should return 401 without session');
  });

  // ── NFR tests ─────────────────────────────────────────────────────────────
  console.log('\nNFR tests');

  await test('NFR1 — audit log includes skillName, exitCode, durationMs; no token', async () => {
    let logEntry = null;
    const executorMod = require('../src/modules/skill-executor');
    executorMod.setLogger({ info: function(evt, data) { logEntry = { evt, data }; }, warn: function() {}, error: function() {} });
    _spawnImpl = function() {
      var proc = makeSpyProcess(); emitAndExit(proc, successFixture, '', 0, 5); return proc;
    };
    await executeSkill('discovery', 'p', 'gho_secret_token', '/h', { timeoutMs: 1000 });
    _spawnImpl = null;
    executorMod.setLogger({ info: function() {}, warn: function() {}, error: function() {} });
    assert.ok(logEntry, 'should have logged');
    assert.ok(logEntry.data.skillName, 'should log skillName');
    assert.ok(typeof logEntry.data.exitCode === 'number', 'should log exitCode');
    assert.ok(typeof logEntry.data.durationMs === 'number', 'should log durationMs');
    assert.ok(!JSON.stringify(logEntry).includes('gho_secret_token'), 'token must not appear in log');
  });

  await test('NFR2 — COPILOT_GITHUB_TOKEN value not in any log call', async () => {
    let anyLog = '';
    const executorMod = require('../src/modules/skill-executor');
    executorMod.setLogger({
      info:  function(e, d) { anyLog += JSON.stringify(d || {}); },
      warn:  function(m)    { anyLog += m; },
      error: function(m)    { anyLog += m; }
    });
    _spawnImpl = function() {
      var proc = makeSpyProcess(); emitAndExit(proc, successFixture, '', 0, 5); return proc;
    };
    await executeSkill('discovery', 'p', 'gho_super_secret_value', '/h', { timeoutMs: 1000 });
    _spawnImpl = null;
    executorMod.setLogger({ info: function() {}, warn: function() {}, error: function() {} });
    assert.ok(!anyLog.includes('gho_super_secret_value'), 'token value must not appear in any log');
  });

  await test('NFR3 — shell: false in all invocation paths (success, timeout, error)', async () => {
    var shellFlags = [];
    // Success path
    _spawnImpl = function(c, a, opts) { shellFlags.push(opts.shell); var p = makeSpyProcess(); emitAndExit(p, successFixture, '', 0, 5); return p; };
    await executeSkill('discovery', 'p', 't', '/h', { timeoutMs: 1000 });
    _spawnImpl = null;
    // Error path
    _spawnImpl = function(c, a, opts) { shellFlags.push(opts.shell); var p = makeSpyProcess(); emitAndExit(p, '', '', 1, 5); return p; };
    try { await executeSkill('discovery', 'p', 't', '/h', { timeoutMs: 1000 }); } catch (e) {}
    _spawnImpl = null;
    assert.ok(shellFlags.every(function(s) { return s === false; }), 'shell should be false in all paths, got: ' + shellFlags.join(','));
  });

  // Restore original spawn
  childProcess.spawn = origSpawn;

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n[wuce9-cli-subprocess] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    failures.forEach(function(f) { console.log('  FAIL: ' + f.name + ': ' + f.err.message); });
    process.exit(1);
  }
})();
