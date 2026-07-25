'use strict';

// tests/check-dsn-s1-deploy-config-safety-net.js -- dsn-s1
// Story: artefacts/2026-07-25-deploy-safety-net/stories/dsn-s1-deploy-config-safety-net.md
// Test plan: artefacts/2026-07-25-deploy-safety-net/test-plans/dsn-s1-test-plan.md
//
// Covers:
//   AC1: hardcoded correct flyctl deploy flags
//   AC2: post-deploy config check runs and parses correctly
//   AC3: missing/wrong MOCK_LLM_GATEWAY -> loud error, exit non-zero
//   AC4: correct MOCK_LLM_GATEWAY -> success
//   AC5: workflow calls the wrapper script, not raw flyctl
//   AC6: package.json has deploy:staging script

var assert = require('assert');
var path = require('path');
var fs = require('fs');

var passed = 0;
var failed = 0;

function test(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS] ' + name); },
    function(err) { failed++; console.log('  [FAIL] ' + name + ' -- ' + (err && err.message || err)); }
  );
}

var DEPLOY_SCRIPT_PATH = path.resolve(__dirname, '../scripts/deploy-staging.js');

function freshRequire(p) {
  delete require.cache[require.resolve(p)];
  return require(p);
}

(async function() {
  // ===========================================================================
  // AC1 -- hardcoded correct deploy flags
  // ===========================================================================
  await test('deployCommandUsesCorrectHardcodedFlags (AC1)', async function() {
    var script = freshRequire(DEPLOY_SCRIPT_PATH);
    var calls = [];
    script.setCommandRunner(async function(cmd, args) {
      calls.push({ cmd: cmd, args: args });
      if (calls.length === 1) return { status: 0, stdout: '', stderr: '' };
      return { status: 0, stdout: JSON.stringify({ env: { MOCK_LLM_GATEWAY: 'true' } }), stderr: '' };
    });
    await script.deployAndVerify();
    assert.strictEqual(calls[0].cmd, 'flyctl');
    assert.deepStrictEqual(calls[0].args, ['deploy', '--remote-only', '--config', 'fly.staging.toml', '--app', 'wuce-staging']);
  });

  // ===========================================================================
  // AC2 -- post-deploy check runs and parses correctly
  // ===========================================================================
  await test('postDeployCheckParsesConfigCorrectly (AC2)', async function() {
    var script = freshRequire(DEPLOY_SCRIPT_PATH);
    var calls = [];
    script.setCommandRunner(async function(cmd, args) {
      calls.push({ cmd: cmd, args: args });
      if (calls.length === 1) return { status: 0, stdout: '', stderr: '' };
      return { status: 0, stdout: JSON.stringify({ env: { MOCK_LLM_GATEWAY: 'true', PORT: '3000' } }), stderr: '' };
    });
    var result = await script.deployAndVerify();
    assert.strictEqual(calls.length, 2, 'expected exactly 2 commands: deploy, then config show');
    assert.deepStrictEqual(calls[1].args, ['config', 'show', '--app', 'wuce-staging']);
    assert.strictEqual(result.ok, true);
  });

  // ===========================================================================
  // AC3 -- missing/wrong flag fails loudly
  // ===========================================================================
  await test('missingMockGatewayFlagFailsLoudly (AC3)', async function() {
    var script = freshRequire(DEPLOY_SCRIPT_PATH);
    script.setCommandRunner(async function(cmd, args, i) {
      if (args[0] === 'deploy') return { status: 0, stdout: '', stderr: '' };
      return { status: 0, stdout: JSON.stringify({ env: { PORT: '3000' } }), stderr: '' };
    });
    var result = await script.deployAndVerify();
    assert.strictEqual(result.ok, false);
    assert.ok(result.message.indexOf('MOCK_LLM_GATEWAY') !== -1, 'expected the error to name MOCK_LLM_GATEWAY');
    assert.ok(result.message.indexOf('missing entirely') !== -1);
  });

  await test('wrongMockGatewayValueFailsLoudly (AC3)', async function() {
    var script = freshRequire(DEPLOY_SCRIPT_PATH);
    script.setCommandRunner(async function(cmd, args) {
      if (args[0] === 'deploy') return { status: 0, stdout: '', stderr: '' };
      return { status: 0, stdout: JSON.stringify({ env: { MOCK_LLM_GATEWAY: 'false' } }), stderr: '' };
    });
    var result = await script.deployAndVerify();
    assert.strictEqual(result.ok, false);
    assert.ok(result.message.indexOf('MOCK_LLM_GATEWAY') !== -1);
    assert.ok(result.message.indexOf('"false"') !== -1);
  });

  await test('deployCommandFailureItselfReportedClearly (AC3, bonus)', async function() {
    var script = freshRequire(DEPLOY_SCRIPT_PATH);
    script.setCommandRunner(async function(cmd, args) {
      if (args[0] === 'deploy') return { status: 1, stdout: '', stderr: 'some flyctl error' };
      return { status: 0, stdout: '{}', stderr: '' };
    });
    var result = await script.deployAndVerify();
    assert.strictEqual(result.ok, false);
    assert.ok(result.message.indexOf('flyctl deploy failed') !== -1);
  });

  // ===========================================================================
  // AC4 -- correct config succeeds
  // ===========================================================================
  await test('correctConfigSucceeds (AC4)', async function() {
    var script = freshRequire(DEPLOY_SCRIPT_PATH);
    script.setCommandRunner(async function(cmd, args) {
      if (args[0] === 'deploy') return { status: 0, stdout: '', stderr: '' };
      return { status: 0, stdout: JSON.stringify({ env: { MOCK_LLM_GATEWAY: 'true' } }), stderr: '' };
    });
    var result = await script.deployAndVerify();
    assert.strictEqual(result.ok, true);
    assert.ok(result.message.indexOf('confirmed') !== -1);
  });

  // ===========================================================================
  // AC5 -- workflow calls the wrapper script
  // ===========================================================================
  await test('workflowCallsWrapperScript (AC5)', function() {
    var workflowSrc = fs.readFileSync(path.resolve(__dirname, '../.github/workflows/staging-deploy.yml'), 'utf8');
    assert.ok(/run:\s*node scripts\/deploy-staging\.js/.test(workflowSrc), 'expected the deploy step to run node scripts/deploy-staging.js');
    assert.ok(!/run:\s*flyctl deploy --remote-only --config fly\.staging\.toml --app wuce-staging\s*$/m.test(workflowSrc), 'expected no remaining raw inline flyctl deploy line for wuce-staging');
  });

  // ===========================================================================
  // AC6 -- package.json has the deploy:staging script
  // ===========================================================================
  await test('packageJsonHasDeployScript (AC6)', function() {
    var pkg = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../package.json'), 'utf8'));
    assert.strictEqual(pkg.scripts['deploy:staging'], 'node scripts/deploy-staging.js');
  });

  console.log('\n[dsn-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  if (failed > 0) process.exit(1);
})();
