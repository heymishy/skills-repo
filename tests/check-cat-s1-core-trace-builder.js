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
  var phase4Result;
  test('does not throw despite zero pipeline-state.json registration', function() {
    phase4Result = mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  });
  test('status is found', function() {
    assert.strictEqual(phase4Result.status, 'found');
  });
  // 205 is the real, measured file count of this fixture as of 2026-09-06 -- re-count with a fresh find/Get-ChildItem if the fixture changes intentionally
  test('returns all 205 real files', function() {
    assert.strictEqual(phase4Result.artefacts.length, 205);
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

console.log('\n[cat-s1] AC1 -- flat feature.stories[] shape (no epics[]) still attributes stories and storySlug');
{
  // '2026-09-06-feature-artefact-document-matrix' is the flat-shape case
  // ruled out for the epics[] test above: it is registered with only a
  // feature-level stories[] array and no epics[] at all. That is exactly
  // the shape this test needs to exercise the flat-shape branch.
  var flatResult = mod.buildArtefactTrace(REPO_ROOT, '2026-09-06-feature-artefact-document-matrix');
  test('status is found', function() {
    assert.strictEqual(flatResult.status, 'found');
  });
  test('at least one story is attributed via the flat feature.stories[] branch', function() {
    assert.ok(flatResult.stories.length > 0, 'expected at least one story');
  });
  test('at least one artefact resolves a storySlug via the flat-shape path', function() {
    var storyFile = flatResult.artefacts.find(function(a) { return a.storySlug; });
    assert.ok(storyFile, 'expected at least one artefact with a resolved storySlug, got none among ' + flatResult.artefacts.length + ' artefacts');
  });
}

console.log('\n[cat-s1] AC1 (regression guard) -- hyphen-delimited prefix boundary: cat-s10-foo.md never attributes to cat-s1');
{
  // This guards the hyphen-delimited boundary check itself (artefact.filename.indexOf(story.slug + '-') === 0):
  // without the trailing '-', a naive substring match would let 'cat-s1' incorrectly
  // match 'cat-s10-foo.md' since 'cat-s10' starts with the characters 'cat-s1'.
  // Note: this case does NOT depend on sort order -- 'cat-s1-' is never a literal
  // prefix of 'cat-s10-foo.md' (index 6 is '0', not '-'), so cat-s1 was never a
  // viable match regardless of array order. The sort-dependent case is covered
  // separately below.
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

console.log('\n[cat-s1] AC1 (regression guard) -- nested-hyphen story slugs use longest-prefix match, not insertion order');
{
  // This is the case the longest-prefix sort actually exists to protect against:
  // two story slugs where one is a hyphen-extension of the other ('cat-s1' and
  // 'cat-s1-extra') are BOTH literal hyphen-delimited prefixes of the same
  // filename ('cat-s1-extra-foo.md'). Without sorting by descending slug length
  // first, Array.prototype.find returns whichever candidate appears first in
  // insertion order -- here 'cat-s1' (registered first) -- which is the wrong,
  // shorter match. Verified manually: temporarily commenting out the
  // `.sort(...)` call in artefact-trace.js makes this assertion fail
  // (storySlug resolves to 'cat-s1' instead of 'cat-s1-extra'); restoring the
  // sort makes it pass again.
  var fixtureRoot = path.join(os.tmpdir(), 'cat-s1-nested-hyphen-fixture-' + Date.now());
  var slug = 'nested-hyphen-fixture';
  var storiesDir = path.join(fixtureRoot, 'artefacts', slug, 'stories');
  fs.mkdirSync(storiesDir, { recursive: true });
  fs.writeFileSync(path.join(storiesDir, 'cat-s1-extra-foo.md'), '# cat-s1-extra\n');
  var stateDir = path.join(fixtureRoot, '.github');
  fs.mkdirSync(stateDir, { recursive: true });
  fs.writeFileSync(path.join(stateDir, 'pipeline-state.json'), JSON.stringify({
    features: [{
      slug: slug,
      epics: [{ slug: 'e1', name: 'Epic', stories: [
        { slug: 'cat-s1', name: 'Story 1' },
        { slug: 'cat-s1-extra', name: 'Story 1 Extra' }
      ] }]
    }]
  }));

  var result = mod.buildArtefactTrace(fixtureRoot, slug);
  test('cat-s1-extra-foo.md attributes to cat-s1-extra (longest match), never cat-s1', function() {
    var file = result.artefacts.find(function(a) { return a.filename === 'cat-s1-extra-foo.md'; });
    assert.ok(file, 'fixture file should be present');
    assert.strictEqual(file.storySlug, 'cat-s1-extra');
  });

  fs.rmSync(fixtureRoot, { recursive: true, force: true });
}

console.log('\n[cat-s1] AC1 (regression guard) -- bare <slug>.md story files (no hyphen suffix) resolve their own storySlug');
{
  // Real repo fixture, not synthetic: '2026-09-02-product-dashboard-triage' is
  // one of the 37 features named in bsgm-s1's own original audit of this bug
  // (170 story files repo-wide silently falling through to feature-level
  // grouping because they have a bare <slug>.md filename with no hyphen
  // suffix, e.g. 'pdt-s1.md' rather than 'pdt-s1-something.md').
  // feature-story-structure.js's existing attribution logic (line ~105) has
  // a `|| basename === slug + '.md'` match arm for exactly this case;
  // artefact-trace.js's independent attribution logic must match the same
  // behaviour per AC1 ("matching what getFeatureStoryStructure/
  // groupArtefactsByStory already produce"). Confirmed on disk before use:
  // primary path exists, and stories/ contains pdt-s1.md .. pdt-s4.md with
  // no hyphen suffix; pipeline-state.json registers epics[0].stories with
  // matching slugs pdt-s1 .. pdt-s4.
  var bareSlugResult = mod.buildArtefactTrace(REPO_ROOT, '2026-09-02-product-dashboard-triage');
  test('status is found', function() {
    assert.strictEqual(bareSlugResult.status, 'found');
  });
  test('bare pdt-s1.md resolves storySlug to its own slug, not null', function() {
    var file = bareSlugResult.artefacts.find(function(a) { return a.filename === 'pdt-s1.md'; });
    assert.ok(file, 'expected pdt-s1.md to be present in artefacts[]');
    assert.strictEqual(file.storySlug, 'pdt-s1');
  });
  test('all four bare-slug story files (pdt-s1..pdt-s4) resolve their own storySlug', function() {
    ['pdt-s1', 'pdt-s2', 'pdt-s3', 'pdt-s4'].forEach(function(slug) {
      var file = bareSlugResult.artefacts.find(function(a) { return a.filename === slug + '.md'; });
      assert.ok(file, 'expected ' + slug + '.md to be present in artefacts[]');
      assert.strictEqual(file.storySlug, slug, slug + '.md should resolve storySlug ' + slug + ', got ' + file.storySlug);
    });
  });
}

console.log('\n[cat-s1] NFR -- directory walk completes within 50ms for phase4-scale directory (205 files)');
{
  var start = process.hrtime.bigint();
  mod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  test('walk completes in under 50ms (measured: ' + elapsedMs.toFixed(1) + 'ms)', function() {
    assert.ok(elapsedMs < 50, 'expected < 50ms, got ' + elapsedMs.toFixed(1) + 'ms');
  });
}

console.log('\n[cat-s1] NFR -- no new unvalidated input surface (source review)');
{
  var src = fs.readFileSync(TRACE_PATH, 'utf8');
  test('module never requires child_process (no shell-out surface introduced)', function() {
    assert.ok(!/require\(\s*['"]child_process['"]\s*\)/.test(src),
      'artefact-trace.js must not require(\'child_process\') -- no shell-out surface should exist');
  });
}

console.log('\n[cat-s1] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
