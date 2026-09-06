'use strict';
// check-cat-s1-core-trace-builder.js -- cat-s1: single canonical builder for a
// feature's real disk artefact structure, cross-referencing pipeline-state.json
// for epic/story names where registered. Disk is canonical (ADR-029); this
// module walks disk first and treats pipeline-state.json as enrichment only.

var assert = require('assert');
var path = require('path');
var fs = require('fs');
var os = require('os');

var TRACE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-trace.js');
var REPO_ROOT = path.resolve(__dirname, '..');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var mod = freshRequire(TRACE_PATH);

console.log('\n[cat-s1] AC4 -- genuinely nonexistent slug returns a typed not-found result');
{
  var result = mod.buildArtefactTrace(REPO_ROOT, 'definitely-does-not-exist-9f3a');
  test('status is not-found, not null, not thrown', function() {
    assert.ok(result !== null, 'result must not be null');
    assert.strictEqual(result.status, 'not-found');
  });
  test('does not return an empty-but-found shape', function() {
    assert.notStrictEqual(result.status, 'found');
  });
}

console.log('\n[cat-s1] AC5 -- unsynced tenant checkout returns a distinct not-yet-synced result');
{
  var unsyncedRoot = path.join(os.tmpdir(), 'wuce-unsynced-' + Date.now());
  var result = mod.buildArtefactTrace(unsyncedRoot, 'any-slug');
  test('status is not-yet-synced', function() {
    assert.strictEqual(result.status, 'not-yet-synced');
  });
  test('not-yet-synced is never conflated with not-found', function() {
    var notFoundResult = mod.buildArtefactTrace(REPO_ROOT, 'definitely-does-not-exist-9f3a');
    assert.notStrictEqual(result.status, notFoundResult.status);
  });
}

console.log('\n[cat-s1] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
