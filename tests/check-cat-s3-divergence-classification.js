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
  var result = mod.classifyDivergence(trace);
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
  var result = mod.classifyDivergence(trace);
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
  var result = mod.classifyDivergence(trace);
  test('orphaned story and unregistered artefact have distinct classification values', function() {
    assert.notStrictEqual(result.stories[0].divergence, result.artefacts[0].divergence);
    assert.strictEqual(result.stories[0].divergence, 'orphaned-registration');
    assert.strictEqual(result.artefacts[0].divergence, 'unregistered');
  });
}

console.log('\n[cat-s3] AC1 -- unregistered document with a matching inferred pattern attaches to that grouping');
{
  var trace = {
    status: 'found',
    epics: [],
    stories: [],
    artefacts: [
      { path: 'phase4-story-3-notes.md', type: 'feature-level', filename: 'phase4-story-3-notes.md', storySlug: null },
      { path: 'phase4-story-3-plan.md', type: 'feature-level', filename: 'phase4-story-3-plan.md', storySlug: null },
      { path: 'phase4-story-9-notes.md', type: 'feature-level', filename: 'phase4-story-9-notes.md', storySlug: null }
    ]
  };
  var result = mod.classifyDivergence(trace);
  test('both phase4-story-3 files are marked unregistered', function() {
    assert.strictEqual(result.artefacts[0].divergence, 'unregistered');
    assert.strictEqual(result.artefacts[1].divergence, 'unregistered');
  });
  test('both phase4-story-3 files share the same inferredGroup', function() {
    assert.ok(result.artefacts[0].inferredGroup, 'expected an inferredGroup to be set');
    assert.strictEqual(result.artefacts[0].inferredGroup, result.artefacts[1].inferredGroup);
  });
  test('phase4-story-9 (no sibling) has no inferredGroup, but is still present and unregistered', function() {
    assert.strictEqual(result.artefacts[2].divergence, 'unregistered');
    assert.strictEqual(result.artefacts[2].inferredGroup, null);
  });
}

console.log('\n[cat-s3] AC1 -- real phase4 fixture: all files unregistered, no crash');
{
  var classified;
  test('does not throw for a large real unregistered fixture', function() {
    classified = mod.classifyDivergence(mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4'));
  });
  test('every one of the real phase4 files is classified unregistered', function() {
    var allUnregistered = classified.artefacts.every(function(a) { return a.divergence === 'unregistered'; });
    assert.ok(allUnregistered, 'expected every phase4 artefact to be unregistered');
  });
}

console.log('\n[cat-s3] AC3 -- not-yet-synced status takes precedence, no per-document classification attempted');
{
  var os = require('os');
  var unsyncedRoot = path.join(os.tmpdir(), 'wuce-unsynced-cat-s3-' + Date.now());
  var result = mod.buildArtefactTrace(unsyncedRoot, 'any-slug');
  test('buildArtefactTrace itself returns not-yet-synced (classification never runs)', function() {
    assert.strictEqual(result.status, 'not-yet-synced');
  });
  test('classifyDivergence passed a not-yet-synced result returns it unchanged', function() {
    var classified = mod.classifyDivergence(result);
    assert.strictEqual(classified.status, 'not-yet-synced');
    assert.strictEqual(classified.artefacts, undefined);
  });
}

console.log('\n[cat-s3] Integration -- buildArtefactTrace now returns pre-classified artefacts directly, no second walk');
{
  var start = process.hrtime.bigint();
  var directResult = mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  test('buildArtefactTrace output already has divergence classification (wired in)', function() {
    assert.ok(directResult.artefacts.length > 0);
    assert.ok(directResult.artefacts.every(function(a) { return a.divergence === 'unregistered'; }));
  });
  test('wiring classification in adds no meaningful overhead (still well under 50ms for 205 files)', function() {
    assert.ok(elapsedMs < 50, 'expected < 50ms, got ' + elapsedMs.toFixed(1) + 'ms');
  });
}

console.log('\n[cat-s3] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
