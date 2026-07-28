'use strict';
// check-dsh-s1-persist-session-turns.js — dsh-s1: persist a stage's session
// turns to Postgres on completion.
// artefacts/2026-07-28-durable-session-history/stories/dsh-s1-persist-session-turns.md

var assert = require('assert');
var path   = require('path');

var MODULE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/session-turns-pg.js');

function freshRequire() {
  try { delete require.cache[require.resolve(MODULE_PATH)]; } catch (_) {}
  return require(MODULE_PATH);
}

var passed = 0;
var failed = 0;
var failures = [];

function test(name, fn) {
  try {
    var result = fn();
    if (result && typeof result.then === 'function') {
      return result.then(
        function() { passed++; console.log('  [PASS]', name); },
        function(err) { failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err); }
      );
    }
    passed++; console.log('  [PASS]', name);
    return Promise.resolve();
  } catch (err) {
    failed++; failures.push({ name: name, err: err }); console.log('  [FAIL]', name, '--', err && err.message || err);
    return Promise.resolve();
  }
}

async function main() {
  // -- AC4: unwired adapter throws instead of silently no-op'ing
  console.log('\n[dsh-s1] AC4 -- unwired adapter throws instead of silently no-op\'ing');
  {
    var mod = freshRequire();
    await test('AC4: writeSessionTurns throws when setSessionTurnsStore has not been called', async function() {
      var threw = false;
      try {
        await mod.writeSessionTurns({ journeyId: 'j1', tenantId: 't1', skillName: 'discovery', turns: [] });
      } catch (err) {
        threw = true;
        assert.strictEqual(err.message, 'Adapter not wired: sessionTurnsStore. Call setSessionTurnsStore() with a real implementation before use.');
      }
      assert.ok(threw, 'expected writeSessionTurns to throw when unwired');
    });
  }

  console.log('\n--- dsh-s1 Results ---');
  console.log('Passed:', passed, ' Failed:', failed);
  if (failures.length) {
    console.log('\nFailures:');
    failures.forEach(function(f) { console.log(' -', f.name, '--', f.err && f.err.message || f.err); });
  }
  process.exit(failed > 0 ? 1 : 0);
}

main();
