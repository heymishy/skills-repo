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
  console.log('\nT1 — Full BYOK config: all vars injected (AC1)');

  await test('T1.1 — getBYOKEnv returns all 4 BYOK vars when all are set', async () => {
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

  await test('T1.2 — returned object has the 4 BYOK keys (plus OFFLINE if set)', async () => {
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

  console.log('\nT2 — Offline mode injection (AC2)');

  await test('T2.1 — COPILOT_OFFLINE=true returned when set alone', async () => {
    setByokEnv({ COPILOT_OFFLINE: 'true' });
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    assert.strictEqual(result.COPILOT_OFFLINE, 'true', 'COPILOT_OFFLINE should be returned');
    setByokEnv(null);
  });

  await test('T2.2 — COPILOT_OFFLINE=true included alongside BYOK vars when both set', async () => {
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

  console.log('\nT3 — No BYOK vars: empty object returned (AC3)');

  await test('T3.1 — getBYOKEnv returns empty object when no BYOK vars set', async () => {
    setByokEnv(null);
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    assert.deepStrictEqual(result, {}, 'should return empty object when no BYOK vars set');
  });

  await test('T3.2 — partial BYOK (only type set) returns empty object', async () => {
    setByokEnv({ COPILOT_PROVIDER_TYPE: 'openai' });
    const { getBYOKEnv } = freshByok();
    const result = getBYOKEnv();
    assert.deepStrictEqual(result, {}, 'partial BYOK should return empty');
    setByokEnv(null);
  });

  await test('T3.3 — executeSkill env is unchanged when no BYOK vars set', async () => {
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
    assert.ok(!capturedEnv.COPILOT_PROVIDER_TYPE,    'PROVIDER_TYPE should not be set');
    assert.ok(!capturedEnv.COPILOT_PROVIDER_BASE_URL,'PROVIDER_BASE_URL should not be set');
    assert.ok(!capturedEnv.COPILOT_PROVIDER_MODEL,   'PROVIDER_MODEL should not be set');
  });

  console.log('\nT4 — API key never in logs (AC4)');

  await test('T4.1 — getBYOKEnv log entry does not contain API key value', async () => {
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

  await test('T4.2 — redactApiKey replaces key value in strings', async () => {
    delete require.cache[require.resolve('../src/utils/redact-sensitive')];
    process.env.COPILOT_PROVIDER_API_KEY = 'sk-actual-key-value-xyz';
    const { redactApiKey } = require('../src/utils/redact-sensitive');
    const input   = 'Error calling API: key=sk-actual-key-value-xyz header set';
    const result  = redactApiKey(input);
    delete process.env.COPILOT_PROVIDER_API_KEY;
    assert.ok(!result.includes('sk-actual-key-value-xyz'), 'key value should be replaced');
    assert.ok(result.includes('[REDACTED]'), 'should contain [REDACTED]');
  });

  await test('T4.3 — redactApiKey returns string unchanged when COPILOT_PROVIDER_API_KEY not set', async () => {
    delete process.env.COPILOT_PROVIDER_API_KEY;
    delete require.cache[require.resolve('../src/utils/redact-sensitive')];
    const { redactApiKey } = require('../src/utils/redact-sensitive');
    const input = 'some innocent string without api keys';
    const result = redactApiKey(input);
    assert.strictEqual(result, input, 'string should be unchanged when no key is set');
  });

  console.log('\nT5 — Partial config warning, no crash (AC5)');

  await test('T5.1 — validateByokConfig warns when TYPE set but BASE_URL absent', async () => {
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

  await test('T5.2 — validateByokConfig does NOT warn when all 4 vars set', async () => {
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

  await test('T5.3 — validateByokConfig does NOT warn when no BYOK vars set', async () => {
    setByokEnv(null);
    const byok = freshByok();
    let warnCalled = false;
    byok.setLogger({ info: function() {}, warn: function() { warnCalled = true; }, error: function() {} });
    byok.validateByokConfig();
    assert.ok(!warnCalled, 'no warning when BYOK not configured at all');
  });

  console.log('\nIntegration tests');

  await test('IT1 — executeSkill merges BYOK vars into subprocess env (AC1)', async () => {
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

  await test('IT2 — executeSkill env has no BYOK keys when not configured (AC3)', async () => {
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

  console.log('\nNFR tests');

  await test('NFR1 — startup log records BYOK active without key value', async () => {
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

  await test('NFR2 — all config from environment variables only (no hardcoded values)', async () => {
    const src = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'src', 'config', 'byok-config.js'), 'utf8'
    );
    assert.ok(!src.includes('sk-'), 'source should not contain hardcoded API key prefix');
    assert.ok(!src.includes('Bearer '), 'source should not contain hardcoded Bearer tokens');
  });

  console.log('\n[wuce12-byok-config] ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) {
    failures.forEach(function(f) { console.log('  FAIL: ' + f.name + ': ' + f.err.message); });
    process.exit(1);
  }
})();
