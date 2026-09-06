'use strict';
// check-cat-s3-divergence-classification.js -- cat-s3: classifies every
// artefact and story in a trace as registered, unregistered, or
// orphaned-registration, plus a feature-level not-yet-synced passthrough.
// Extends cat-s1's artefact-trace.js (ADR-028/029) with one more pass over
// already-collected data -- no second directory walk (Performance NFR).

var assert = require('assert');
var path = require('path');

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

console.log('\n[cat-s3] AC4 -- correctly-matched document is marked registered with no flag');
{
  var trace = {
    status: 'found',
    epics: [],
    stories: [{ slug: 's1', name: 'Story 1' }],
    artefacts: [{ path: 'stories/s1-foo.md', type: 'stories', filename: 's1-foo.md', storySlug: 's1' }]
  };
  var result = mod.classifyDivergence(trace, null);
  test('matched artefact classification is registered', function() {
    assert.strictEqual(result.artefacts[0].divergence, 'registered');
  });
  test('registered story classification is registered', function() {
    assert.strictEqual(result.stories[0].divergence, 'registered');
  });
}

console.log('\n[cat-s3] AC2 -- registered story with zero matching files is orphaned-registration');
{
  var trace = {
    status: 'found',
    epics: [],
    stories: [{ slug: 'ghost-s1', name: 'Ghost Story' }],
    artefacts: []
  };
  var result = mod.classifyDivergence(trace, null);
  test('story with no matching artefacts is orphaned-registration', function() {
    assert.strictEqual(result.stories[0].divergence, 'orphaned-registration');
  });
}

console.log('\n[cat-s3] AC2 (non-conflation) -- orphaned-registration is never the same value as unregistered');
{
  var trace = {
    status: 'found',
    epics: [],
    stories: [{ slug: 'ghost-s1', name: 'Ghost Story' }],
    artefacts: [{ path: 'orphan.md', type: 'feature-level', filename: 'orphan.md', storySlug: null }]
  };
  var result = mod.classifyDivergence(trace, null);
  test('orphaned story and unregistered artefact have distinct classification values', function() {
    assert.notStrictEqual(result.stories[0].divergence, result.artefacts[0].divergence);
    assert.strictEqual(result.stories[0].divergence, 'orphaned-registration');
    assert.strictEqual(result.artefacts[0].divergence, 'unregistered');
  });
}

console.log('\n[cat-s3] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
