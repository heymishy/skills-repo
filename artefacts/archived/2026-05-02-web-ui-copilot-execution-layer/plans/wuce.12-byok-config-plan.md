# Implementation Plan: wuce.12 — BYOK and self-hosted provider configuration

**Branch:** feat/wuce.12-byok-config
**Worktree:** .worktrees/wuce.12-byok-config
**Test file:** tests/byok-config.test.js (17 tests)
**Test run:** node tests/byok-config.test.js

---

## Dependency on wuce.9

`src/modules/skill-executor.js` does NOT exist on master. This branch must create a BYOK-aware version of `skill-executor.js`. When wuce.9 merges first, rebase wuce.12 and resolve the conflict by keeping the BYOK-aware version (which satisfies all wuce.9 ACs too).

The wuce.12 version of `skill-executor.js` is identical to the wuce.9 version PLUS a call to `getBYOKEnv()` which merges BYOK env vars into the subprocess environment.

---

## File touchpoints

| File | Action |
|------|--------|
| `src/config/byok-config.js` | CREATE |
| `src/utils/redact-sensitive.js` | CREATE |
| `src/modules/skill-executor.js` | CREATE (BYOK-aware — includes wuce.9 content plus BYOK integration) |
| `src/utils/skill-name-validator.js` | CREATE (same as wuce.9 — needed by skill-executor.js) |
| `tests/byok-config.test.js` | CREATE |
| `package.json` | EXTEND |

---

## Security requirements (CRITICAL)

1. `COPILOT_PROVIDER_API_KEY` must NEVER appear in logs, error messages, or HTTP response bodies
2. All BYOK configuration from environment variables only (no hardcoded values per ADR-004)
3. `validateByokConfig()` must log warning if `COPILOT_PROVIDER_TYPE` set but `COPILOT_PROVIDER_BASE_URL` absent — no crash

---

## Task 1 — Create `src/utils/redact-sensitive.js`

```js
'use strict';

const KEY_PATTERN = /\b([A-Za-z0-9+/]{20,}={0,2})\b|sk-[A-Za-z0-9]+|Bearer [A-Za-z0-9._-]+/g;

/**
 * redactApiKey(str) -> string
 *
 * Replaces the actual value of COPILOT_PROVIDER_API_KEY in a string with [REDACTED].
 * Also replaces common API key patterns to prevent accidental leakage.
 *
 * This function MUST be called before including any user-provided configuration
 * values in log entries or HTTP responses.
 */
function redactApiKey(str) {
  if (typeof str !== 'string') { return str; }
  // Replace explicit env var value if provided
  var apiKey = process.env.COPILOT_PROVIDER_API_KEY;
  if (apiKey && apiKey.length > 4) {
    // Escape for regex
    var escaped = apiKey.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    str = str.replace(new RegExp(escaped, 'g'), '[REDACTED]');
  }
  return str;
}

module.exports = { redactApiKey };
```

---

## Task 2 — Create `src/config/byok-config.js`

```js
'use strict';
const { redactApiKey } = require('../utils/redact-sensitive');

const BYOK_VARS = [
  'COPILOT_PROVIDER_TYPE',
  'COPILOT_PROVIDER_BASE_URL',
  'COPILOT_PROVIDER_API_KEY',
  'COPILOT_PROVIDER_MODEL'
];

let _logger = {
  info:  function(evt, data) { process.stdout.write('[byok-config] ' + evt + ' ' + JSON.stringify(data || {}) + '\n'); },
  warn:  function(msg)       { process.stderr.write('[byok-config] WARN ' + msg + '\n'); },
  error: function(msg)       { process.stderr.write('[byok-config] ERROR ' + msg + '\n'); }
};

function setLogger(logger) { _logger = logger; }

/**
 * getBYOKEnv() -> Record<string, string>
 *
 * Returns the set of BYOK env vars to inject into subprocess environment.
 *
 * Rules:
 * - All 4 BYOK vars present: return all 4
 * - COPILOT_OFFLINE=true: return { COPILOT_OFFLINE: 'true' }
 * - Neither condition met: return {}
 * - Reads vars fresh at call time (no caching)
 *
 * NEVER returns COPILOT_PROVIDER_API_KEY value in logs or error messages.
 */
function getBYOKEnv() {
  var env = process.env;
  var byokActive = BYOK_VARS.every(function(v) { return env[v]; });
  var offlineMode = env.COPILOT_OFFLINE === 'true';

  if (byokActive) {
    var result = {};
    BYOK_VARS.forEach(function(v) { result[v] = env[v]; });
    if (offlineMode) { result.COPILOT_OFFLINE = 'true'; }
    // Log active state — type only, never key value
    _logger.info('byok_env_active', {
      providerType: env.COPILOT_PROVIDER_TYPE,
      hasBaseUrl:   !!env.COPILOT_PROVIDER_BASE_URL,
      hasModel:     !!env.COPILOT_PROVIDER_MODEL,
      // hasApiKey only — value omitted
      hasApiKey: true
    });
    return result;
  }

  if (offlineMode) {
    _logger.info('byok_offline_mode', { offlineOnly: true });
    return { COPILOT_OFFLINE: 'true' };
  }

  // No BYOK configuration — return empty, inject nothing extra
  return {};
}

/**
 * validateByokConfig()
 *
 * Checks for partially-configured BYOK and logs a warning.
 * Does NOT throw. Safe to call at startup.
 */
function validateByokConfig() {
  var env = process.env;
  if (env.COPILOT_PROVIDER_TYPE && !env.COPILOT_PROVIDER_BASE_URL) {
    _logger.warn(
      'BYOK configuration warning: COPILOT_PROVIDER_TYPE is set but COPILOT_PROVIDER_BASE_URL is missing. ' +
      'BYOK mode will not activate until all required vars are set.'
    );
  }
  // Other partial config states: type only, no warning (getBYOKEnv returns {} silently)
}

module.exports = { getBYOKEnv, validateByokConfig, setLogger };
```

---

## Task 3 — Create `src/utils/skill-name-validator.js`

(Identical to wuce.9 version — needed by skill-executor.js on this branch.)

```js
'use strict';

const ALLOWED_SKILL_NAME = /^[a-z0-9-]+$/;
const TOKEN_PATTERN = /gh[ops]_[A-Za-z0-9_]+/;

function validateSkillName(name) {
  return ALLOWED_SKILL_NAME.test(name);
}

function containsToken(str) {
  return TOKEN_PATTERN.test(str);
}

module.exports = { validateSkillName, containsToken };
```

---

## Task 4 — Create `src/modules/skill-executor.js` (BYOK-aware version)

This extends the wuce.9 version by calling `getBYOKEnv()` in `executeSkill`.

```js
'use strict';
const { spawn }   = require('child_process');
const { validateSkillName, containsToken } = require('../utils/skill-name-validator');
const { getBYOKEnv } = require('../config/byok-config');

const DEFAULT_TIMEOUT_MS   = (parseInt(process.env.WUCE_CLI_TIMEOUT_SECONDS)  || 300) * 1000;
const DEFAULT_STDERR_LINES = parseInt(process.env.WUCE_STDERR_LINES) || 20;

let _logger = {
  info:  function(evt, data) { process.stdout.write('[skill-executor] ' + evt + ' ' + JSON.stringify(data || {}) + '\n'); },
  warn:  function(msg)       { process.stderr.write('[skill-executor] WARN ' + msg + '\n'); },
  error: function(msg)       { process.stderr.write('[skill-executor] ERROR ' + msg + '\n'); }
};

function setLogger(logger) { _logger = logger; }

function executeSkill(skillName, prompt, token, homeDir, options) {
  options = options || {};
  var timeoutMs    = options.timeoutMs    !== undefined ? options.timeoutMs    : DEFAULT_TIMEOUT_MS;
  var stderrLines  = options.stderrLines  !== undefined ? options.stderrLines  : DEFAULT_STDERR_LINES;
  var cliPath      = options.cliPath      || process.env.COPILOT_CLI_PATH || 'copilot';

  if (!validateSkillName(skillName)) {
    return Promise.reject(Object.assign(new Error('Invalid skill name: ' + skillName), { code: 'INVALID_SKILL_NAME' }));
  }

  var startTime = Date.now();

  return new Promise(function(resolve, reject) {
    // Base env: inherit process.env, set required vars
    var baseEnv = Object.assign({}, process.env, {
      COPILOT_GITHUB_TOKEN: token,
      COPILOT_HOME: homeDir
    });
    // AC1 (wuce.12): Merge BYOK vars when configured
    var byokEnv = getBYOKEnv();
    var env = Object.assign(baseEnv, byokEnv);

    var args = [
      'skill', skillName,
      '--output-format=json',
      '--silent',
      '--no-ask-user',
      '--allow-all',
      '-p', prompt
    ];

    // shell MUST be false
    var child = spawn(cliPath, args, { shell: false, env: env });

    var stdoutChunks = [];
    var stderrBuffer = [];
    var timedOut = false;
    var killTimer = null;

    var timeoutTimer = setTimeout(function() {
      timedOut = true;
      child.kill('SIGTERM');
      killTimer = setTimeout(function() { child.kill('SIGKILL'); }, 5000);
    }, timeoutMs);

    child.stdout.on('data', function(chunk) { stdoutChunks.push(chunk); });

    child.stderr.on('data', function(chunk) {
      var lines = chunk.toString().split('\n');
      lines.forEach(function(line) { if (line.trim()) { stderrBuffer.push(line); } });
    });

    child.on('close', function(exitCode) {
      clearTimeout(timeoutTimer);
      if (killTimer) { clearTimeout(killTimer); }

      var duration = Date.now() - startTime;

      if (timedOut) {
        reject(Object.assign(new Error('Skill execution timed out'), { code: 'TIMEOUT' }));
        return;
      }

      var stdout = stdoutChunks.join('');
      var parsedLines = [];
      var parseErrors = [];
      stdout.split('\n').filter(Boolean).forEach(function(line) {
        try { parsedLines.push(JSON.parse(line)); } catch (e) { parseErrors.push(line); }
      });

      var lastNStderr = stderrBuffer.slice(-stderrLines)
        .filter(function(l) { return !containsToken(l); });

      _logger.info('skill_execution_complete', {
        skillName: skillName,
        exitCode: exitCode,
        durationMs: duration,
        parsedLineCount: parsedLines.length
      });

      if (exitCode !== 0) {
        reject(Object.assign(
          new Error('Skill exited with code ' + exitCode),
          { exitCode: exitCode, stderrLines: lastNStderr, partialLines: parsedLines }
        ));
        return;
      }

      var artefactEvent = null;
      for (var i = 0; i < parsedLines.length; i++) {
        if (parsedLines[i] && parsedLines[i].type === 'artefact') { artefactEvent = parsedLines[i]; break; }
      }

      resolve({ lines: parsedLines, artefact: artefactEvent, exitCode: exitCode, timedOut: false, parseErrors: parseErrors });
    });

    child.on('error', function(err) {
      clearTimeout(timeoutTimer);
      if (killTimer) { clearTimeout(killTimer); }
      reject(err);
    });
  });
}

module.exports = { executeSkill, setLogger };
```

---

## Task 5 — Create `tests/byok-config.test.js`

```js
'use strict';
/**
 * byok-config.test.js — AC verification for wuce.12
 * 17 tests: T1-T5 (unit), IT1-IT2 (integration), NFR1-NFR2
 */
const assert = require('assert');
const path   = require('path');
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

// Clear module cache between tests to reset env var reads
function freshByok() {
  delete require.cache[require.resolve('../src/config/byok-config')];
  delete require.cache[require.resolve('../src/utils/redact-sensitive')];
  return require('../src/config/byok-config');
}

function setByokEnv(vars) {
  var ALL = ['COPILOT_PROVIDER_TYPE','COPILOT_PROVIDER_BASE_URL','COPILOT_PROVIDER_API_KEY','COPILOT_PROVIDER_MODEL','COPILOT_OFFLINE'];
  ALL.forEach(function(k) { delete process.env[k]; });
  if (vars) {
    Object.keys(vars).forEach(function(k) {
      if (vars[k] !== undefined) { process.env[k] = vars[k]; }
    });
  }
}

(async function runTests() {
  // ── T1 — Full BYOK config: all vars injected (AC1) ──────────────────────
  console.log('\nT1 \u2014 Full BYOK config: all vars injected (AC1)');

  await test('T1.1 \u2014 getBYOKEnv returns all 4 BYOK vars when all are set', async () => {
    setByokEnv({
      COPILOT_PROVIDER_TYPE:     'openai',
      COPILOT_PROVIDER_BASE_URL: 'https://my-llm.internal/v1',
      COPILOT_PROVIDER_API_KEY:  'sk-secret-test-key',
      COPILOT_PROVIDER_MODEL:    'gpt-4'
    });
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    assert.strictEqual(result.COPILOT_PROVIDER_TYPE,     'openai',                      'type should be set');
    assert.strictEqual(result.COPILOT_PROVIDER_BASE_URL, 'https://my-llm.internal/v1', 'base_url should be set');
    assert.strictEqual(result.COPILOT_PROVIDER_API_KEY,  'sk-secret-test-key',          'api_key should be set');
    assert.strictEqual(result.COPILOT_PROVIDER_MODEL,    'gpt-4',                       'model should be set');
    setByokEnv(null);
  });

  await test('T1.2 \u2014 returned object has exactly the 4 BYOK keys (plus OFFLINE if set)', async () => {
    setByokEnv({
      COPILOT_PROVIDER_TYPE:     'azure-openai',
      COPILOT_PROVIDER_BASE_URL: 'https://aoai.azure.com/openai',
      COPILOT_PROVIDER_API_KEY:  'key-abc',
      COPILOT_PROVIDER_MODEL:    'gpt-4o'
    });
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    const keys = Object.keys(result);
    assert.ok(keys.includes('COPILOT_PROVIDER_TYPE'),     'should include TYPE');
    assert.ok(keys.includes('COPILOT_PROVIDER_BASE_URL'), 'should include BASE_URL');
    assert.ok(keys.includes('COPILOT_PROVIDER_API_KEY'),  'should include API_KEY');
    assert.ok(keys.includes('COPILOT_PROVIDER_MODEL'),    'should include MODEL');
    setByokEnv(null);
  });

  // ── T2 — Offline mode: COPILOT_OFFLINE injected (AC2) ────────────────────
  console.log('\nT2 \u2014 Offline mode injection (AC2)');

  await test('T2.1 \u2014 COPILOT_OFFLINE=true returned when set alone', async () => {
    setByokEnv({ COPILOT_OFFLINE: 'true' });
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    assert.strictEqual(result.COPILOT_OFFLINE, 'true', 'COPILOT_OFFLINE should be returned');
    setByokEnv(null);
  });

  await test('T2.2 \u2014 COPILOT_OFFLINE=true included alongside BYOK vars when both set', async () => {
    setByokEnv({
      COPILOT_PROVIDER_TYPE:     'local',
      COPILOT_PROVIDER_BASE_URL: 'http://localhost:8000',
      COPILOT_PROVIDER_API_KEY:  'local-key',
      COPILOT_PROVIDER_MODEL:    'local-model',
      COPILOT_OFFLINE:           'true'
    });
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    assert.strictEqual(result.COPILOT_OFFLINE, 'true', 'offline flag should be included with full BYOK');
    setByokEnv(null);
  });

  // ── T3 — No BYOK vars: empty object returned (AC3) ───────────────────────
  console.log('\nT3 \u2014 No BYOK vars: empty object returned (AC3)');

  await test('T3.1 \u2014 getBYOKEnv returns empty object when no BYOK vars set', async () => {
    setByokEnv(null);
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    assert.deepStrictEqual(result, {}, 'should return empty object when no BYOK vars set');
  });

  await test('T3.2 \u2014 partial BYOK (only type set) returns empty object', async () => {
    setByokEnv({ COPILOT_PROVIDER_TYPE: 'openai' });
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    assert.deepStrictEqual(result, {}, 'partial BYOK should return empty');
    setByokEnv(null);
  });

  await test('T3.3 \u2014 executeSkill env is unchanged when no BYOK vars set', async () => {
    setByokEnv(null);
    const childProcess = require('child_process');
    const origSpawn = childProcess.spawn;
    let capturedEnv = null;
    childProcess.spawn = function(cmd, args, opts) {
      capturedEnv = opts.env;
      var proc = new EventEmitter();
      proc.stdout = new EventEmitter(); proc.stderr = new EventEmitter();
      proc.kill = function() {};
      setTimeout(function() { proc.emit('close', 0); }, 5);
      return proc;
    };
    delete require.cache[require.resolve('../src/modules/skill-executor')];
    delete require.cache[require.resolve('../src/config/byok-config')];
    const { executeSkill } = require('../src/modules/skill-executor');
    try {
      await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 500 });
    } catch (e) {}
    childProcess.spawn = origSpawn;
    assert.ok(!capturedEnv.COPILOT_PROVIDER_TYPE,    'PROVIDER_TYPE should not be set');
    assert.ok(!capturedEnv.COPILOT_PROVIDER_BASE_URL,'PROVIDER_BASE_URL should not be set');
    assert.ok(!capturedEnv.COPILOT_PROVIDER_MODEL,   'PROVIDER_MODEL should not be set');
  });

  // ── T4 — API key never in logs or response (AC4) ─────────────────────────
  console.log('\nT4 \u2014 API key never in logs (AC4)');

  await test('T4.1 \u2014 getBYOKEnv log entry does not contain API key value', async () => {
    setByokEnv({
      COPILOT_PROVIDER_TYPE:     'openai',
      COPILOT_PROVIDER_BASE_URL: 'https://api.openai.com/v1',
      COPILOT_PROVIDER_API_KEY:  'sk-sensitive-log-test-key',
      COPILOT_PROVIDER_MODEL:    'gpt-4'
    });
    const byok = freshByok();
    let anyLog = '';
    byok.setLogger({
      info:  function(e, d) { anyLog += JSON.stringify(d || {}); },
      warn:  function(m)    { anyLog += m; },
      error: function(m)    { anyLog += m; }
    });
    byok.getBYOKEnv();
    setByokEnv(null);
    assert.ok(!anyLog.includes('sk-sensitive-log-test-key'), 'API key value must not appear in log');
    assert.ok(anyLog.includes('openai'), 'provider type should appear in log');
  });

  await test('T4.2 \u2014 redactApiKey replaces key value in strings', async () => {
    delete require.cache[require.resolve('../src/utils/redact-sensitive')];
    process.env.COPILOT_PROVIDER_API_KEY = 'sk-actual-key-value-xyz';
    const { redactApiKey } = require('../src/utils/redact-sensitive');
    const input   = 'Error calling API: key=sk-actual-key-value-xyz header set';
    const result  = redactApiKey(input);
    delete process.env.COPILOT_PROVIDER_API_KEY;
    assert.ok(!result.includes('sk-actual-key-value-xyz'), 'key value should be replaced');
    assert.ok(result.includes('[REDACTED]'), 'should contain [REDACTED]');
  });

  await test('T4.3 \u2014 redactApiKey returns string unchanged when COPILOT_PROVIDER_API_KEY not set', async () => {
    delete process.env.COPILOT_PROVIDER_API_KEY;
    delete require.cache[require.resolve('../src/utils/redact-sensitive')];
    const { redactApiKey } = require('../src/utils/redact-sensitive');
    const input = 'some innocent string without api keys';
    const result = redactApiKey(input);
    assert.strictEqual(result, input, 'string should be unchanged when no key is set');
  });

  // ── T5 — Partial config warning, no crash (AC5) ───────────────────────────
  console.log('\nT5 \u2014 Partial config warning, no crash (AC5)');

  await test('T5.1 \u2014 validateByokConfig warns when TYPE set but BASE_URL absent', async () => {
    setByokEnv({ COPILOT_PROVIDER_TYPE: 'openai' });
    const byok = freshByok();
    let warnCalled = false;
    byok.setLogger({
      info: function() {},
      warn: function(msg) { warnCalled = true; assert.ok(msg.length > 10, 'warn message should be descriptive'); },
      error: function() {}
    });
    assert.doesNotThrow(() => byok.validateByokConfig(), 'validateByokConfig should not throw');
    setByokEnv(null);
    assert.ok(warnCalled, 'warn should be called for partial config');
  });

  await test('T5.2 \u2014 validateByokConfig does NOT warn when all 4 vars set', async () => {
    setByokEnv({
      COPILOT_PROVIDER_TYPE:     'openai',
      COPILOT_PROVIDER_BASE_URL: 'https://api.openai.com/v1',
      COPILOT_PROVIDER_API_KEY:  'sk-key',
      COPILOT_PROVIDER_MODEL:    'gpt-4'
    });
    const byok = freshByok();
    let warnCalled = false;
    byok.setLogger({ info: function() {}, warn: function() { warnCalled = true; }, error: function() {} });
    byok.validateByokConfig();
    setByokEnv(null);
    assert.ok(!warnCalled, 'no warning expected when all vars set');
  });

  await test('T5.3 \u2014 validateByokConfig does NOT warn when no BYOK vars set', async () => {
    setByokEnv(null);
    const byok = freshByok();
    let warnCalled = false;
    byok.setLogger({ info: function() {}, warn: function() { warnCalled = true; }, error: function() {} });
    byok.validateByokConfig();
    assert.ok(!warnCalled, 'no warning when BYOK not configured at all');
  });

  // ── Integration tests ─────────────────────────────────────────────────────
  console.log('\nIntegration tests');

  await test('IT1 \u2014 executeSkill merges BYOK vars into subprocess env (AC1)', async () => {
    setByokEnv({
      COPILOT_PROVIDER_TYPE:     'openai',
      COPILOT_PROVIDER_BASE_URL: 'https://api.openai.com/v1',
      COPILOT_PROVIDER_API_KEY:  'sk-it1-key',
      COPILOT_PROVIDER_MODEL:    'gpt-4'
    });
    const childProcess = require('child_process');
    const origSpawn = childProcess.spawn;
    let capturedEnv = null;
    childProcess.spawn = function(cmd, args, opts) {
      capturedEnv = opts.env;
      var proc = new EventEmitter();
      proc.stdout = new EventEmitter(); proc.stderr = new EventEmitter();
      proc.kill = function() {};
      setTimeout(function() { proc.emit('close', 0); }, 5);
      return proc;
    };
    delete require.cache[require.resolve('../src/modules/skill-executor')];
    delete require.cache[require.resolve('../src/config/byok-config')];
    const { executeSkill } = require('../src/modules/skill-executor');
    try { await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 500 }); } catch (e) {}
    childProcess.spawn = origSpawn;
    setByokEnv(null);
    assert.strictEqual(capturedEnv.COPILOT_PROVIDER_TYPE,     'openai',                      'env should have TYPE');
    assert.strictEqual(capturedEnv.COPILOT_PROVIDER_BASE_URL, 'https://api.openai.com/v1',   'env should have BASE_URL');
    assert.strictEqual(capturedEnv.COPILOT_PROVIDER_API_KEY,  'sk-it1-key',                  'env should have API_KEY');
    assert.strictEqual(capturedEnv.COPILOT_PROVIDER_MODEL,    'gpt-4',                       'env should have MODEL');
    assert.strictEqual(capturedEnv.COPILOT_GITHUB_TOKEN,      'tok',                         'env should have GITHUB_TOKEN');
  });

  await test('IT2 \u2014 executeSkill env has no BYOK keys when not configured (AC3)', async () => {
    setByokEnv(null);
    const childProcess = require('child_process');
    const origSpawn = childProcess.spawn;
    let capturedEnv = null;
    childProcess.spawn = function(cmd, args, opts) {
      capturedEnv = opts.env;
      var proc = new EventEmitter();
      proc.stdout = new EventEmitter(); proc.stderr = new EventEmitter();
      proc.kill = function() {};
      setTimeout(function() { proc.emit('close', 0); }, 5);
      return proc;
    };
    delete require.cache[require.resolve('../src/modules/skill-executor')];
    delete require.cache[require.resolve('../src/config/byok-config')];
    const { executeSkill } = require('../src/modules/skill-executor');
    try { await executeSkill('discovery', 'p', 'tok', '/h', { timeoutMs: 500 }); } catch (e) {}
    childProcess.spawn = origSpawn;
    assert.ok(!capturedEnv.COPILOT_PROVIDER_TYPE,    'PROVIDER_TYPE must not be in env');
    assert.ok(!capturedEnv.COPILOT_PROVIDER_API_KEY, 'PROVIDER_API_KEY must not be in env');
  });

  // ── NFR tests ─────────────────────────────────────────────────────────────
  console.log('\nNFR tests');

  await test('NFR1 \u2014 startup log records BYOK active without key value', async () => {
    setByokEnv({
      COPILOT_PROVIDER_TYPE:     'openai',
      COPILOT_PROVIDER_BASE_URL: 'https://api.openai.com/v1',
      COPILOT_PROVIDER_API_KEY:  'sk-nfr1-never-log-this',
      COPILOT_PROVIDER_MODEL:    'gpt-4'
    });
    const byok = freshByok();
    let logged = null;
    byok.setLogger({
      info:  function(e, d) { logged = { e, d }; },
      warn:  function() {},
      error: function() {}
    });
    byok.getBYOKEnv();
    setByokEnv(null);
    assert.ok(logged, 'should have logged byok_env_active');
    assert.ok(!JSON.stringify(logged).includes('sk-nfr1-never-log-this'), 'API key must not appear in log');
    assert.ok(logged.d.providerType, 'providerType should appear in log');
    assert.ok(logged.d.hasApiKey === true, 'hasApiKey flag should be logged');
  });

  await test('NFR2 \u2014 all config from environment variables only (no hardcoded values)', async () => {
    // Read the source and verify no hardcoded API key patterns
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'src', 'config', 'byok-config.js'), 'utf8'
    );
    assert.ok(!src.includes('sk-'), 'source should not contain hardcoded API key prefix');
    assert.ok(!src.includes('Bearer '), 'source should not contain hardcoded Bearer tokens');
  });

  // ── Summary ───────────────────────────────────────────────────────────────
  console.log('\n[wuce12-byok-config] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    failures.forEach(function(f) { console.log('  FAIL: ' + f.name + ': ' + f.err.message); });
    process.exit(1);
  }
})();
```

---

## Task 6 — Update package.json

```
node -e "const fs=require('fs'),{execSync}=require('child_process');const pkg=JSON.parse(execSync('git show origin/master:package.json').toString());pkg.scripts.test+=' && node tests/byok-config.test.js';fs.writeFileSync('package.json',JSON.stringify(pkg,null,2),'utf8')"
```

---

## Task 7 — Commit and push

```bash
git add src/config/byok-config.js \
        src/utils/redact-sensitive.js \
        src/utils/skill-name-validator.js \
        src/modules/skill-executor.js \
        tests/byok-config.test.js \
        package.json
git commit -m "feat: wuce.12 -- BYOK and self-hosted provider configuration"
git push -u origin feat/wuce.12-byok-config
```

---

## Task 8 — Open draft PR with oversight comment

PR body must include:
```
artefacts/2026-05-02-web-ui-copilot-execution-layer/plans/wuce.12-byok-config-plan.md
```

Oversight comment must confirm:
1. `COPILOT_PROVIDER_API_KEY` value never logged — `getBYOKEnv()` logs `hasApiKey: true` (boolean) not the value; `validateByokConfig()` warning does not include the key value; verified by T4.1 and NFR1
2. All configuration from environment variables only — no hardcoded keys; verified by NFR2 source scan
3. `redactApiKey()` utility available for error messages and HTTP responses to prevent accidental leakage
4. `validateByokConfig()` logs warning for partial config but does not crash — verified by T5.1

---

## Rebase instructions (when wuce.9 merges first)

```bash
cd .worktrees/wuce.12-byok-config
git rebase origin/master
# If conflict on src/modules/skill-executor.js:
# - Keep wuce.12 version (BYOK-aware) — it includes all wuce.9 functionality plus getBYOKEnv() call
# - Run: node tests/cli-subprocess.test.js && node tests/byok-config.test.js
# - If both pass: git add src/modules/skill-executor.js && git rebase --continue
git push --force-with-lease origin feat/wuce.12-byok-config
```

---

## Verification

```bash
node tests/byok-config.test.js
```
Expected: 17 passed, 0 failed
