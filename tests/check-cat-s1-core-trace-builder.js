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

console.log('\n[cat-s1] AC3 -- resolves a feature present only under artefacts/archived/');
{
  var fixtureRoot = path.join(os.tmpdir(), 'cat-s1-archived-fixture-' + Date.now());
  var archivedFeatureDir = path.join(fixtureRoot, 'artefacts', 'archived', 'archived-only-feature');
  fs.mkdirSync(archivedFeatureDir, { recursive: true });
  fs.writeFileSync(path.join(archivedFeatureDir, 'discovery.md'), '# Discovery\n');

  var result = mod.buildArtefactTrace(fixtureRoot, 'archived-only-feature');
  test('resolves via the archived/ fallback', function() {
    assert.strictEqual(result.status, 'found');
  });
  test('finds the file under the archived path', function() {
    var found = result.artefacts.some(function(a) { return a.path.indexOf('discovery.md') !== -1; });
    assert.ok(found, 'discovery.md should be present in artefacts[]');
  });

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('\n[cat-s1] AC2 -- zero-registration feature returns every real file, none dropped');
{
  var phase4Result = mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  test('status is found', function() {
    assert.strictEqual(phase4Result.status, 'found');
  });
  // 205 is the real, measured file count of this fixture as of 2026-09-06 -- re-count with a fresh find/Get-ChildItem if the fixture changes intentionally
  test('returns all 205 real files', function() {
    assert.strictEqual(phase4Result.artefacts.length, 205);
  });
  test('does not throw despite zero pipeline-state.json registration', function() {
    assert.doesNotThrow(function() {
      mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
    });
  });
}

console.log('\n[cat-s1] AC1 -- fully-registered feature attributes every epic, story, and artefact correctly');
{
  // Substituted fixture: '2026-09-06-feature-artefact-document-matrix' was
  // checked first per the implementation plan but its pipeline-state.json
  // registration has only a flat feature-level stories[] array with no
  // epics[] at all, so it cannot satisfy the "at least one epic" assertion.
  // '2026-07-01-landing-auth-billing' is used instead: it exists at the
  // PRIMARY (non-archived) artefacts path, is registered with 3 epics each
  // containing multiple stories, and its stories/ files follow the
  // <story-slug>-<description>.md naming convention the prefix-match logic
  // depends on (e.g. lab-s1.1-auth-tech-spike.md).
  var registeredResult = mod.buildArtefactTrace(REPO_ROOT, '2026-07-01-landing-auth-billing');
  test('status is found', function() {
    assert.strictEqual(registeredResult.status, 'found');
  });
  test('at least one epic is attributed', function() {
    assert.ok(registeredResult.epics.length > 0, 'expected at least one epic');
  });
  test('at least one story is attributed', function() {
    assert.ok(registeredResult.stories.length > 0, 'expected at least one story');
  });
  test('artefacts include a story-scoped file with a resolved storySlug', function() {
    var storyFile = registeredResult.artefacts.find(function(a) {
      return a.type === 'stories';
    });
    assert.ok(storyFile, 'expected at least one stories/ artefact');
    assert.ok(storyFile.storySlug, 'expected storySlug to be resolved, got: ' + storyFile.storySlug);
  });
}

console.log('\n[cat-s1] AC1 (regression guard) -- prefix-colliding story slugs do not cross-attribute');
{
  var fixtureRoot = path.join(os.tmpdir(), 'cat-s1-prefix-fixture-' + Date.now());
  var slug = 'prefix-fixture';
  var storiesDir = path.join(fixtureRoot, 'artefacts', slug, 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  fs.writeFileSync(path.join(storiesDir, 'cat-s10-foo.md'), '# cat-s10\n');
  var stateDir = path.join(fixtureRoot, '.github');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'pipeline-state.json'), JSON.stringify({
    features: [{
      slug: slug,
      epics: [{ slug: 'e1', name: 'Epic', stories: [
        { slug: 'cat-s1', name: 'Story 1' },
        { slug: 'cat-s10', name: 'Story 10' }
      ] }]
    }]
  }));

  var result = mod.buildArtefactTrace(fixtureRoot, slug);
  test('cat-s10-foo.md attributes to cat-s10, never cat-s1', function() {
    var file = result.artefacts.find(function(a) { return a.filename === 'cat-s10-foo.md'; });
    assert.ok(file, 'fixture file should be present');
    assert.strictEqual(file.storySlug, 'cat-s10');
  });

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('\n[cat-s1] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
