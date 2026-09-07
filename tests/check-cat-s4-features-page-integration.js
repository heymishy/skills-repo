'use strict';
// check-cat-s4-features-page-integration.js -- cat-s4: /features/:slug renders
// from the canonical trace (cat-s1's buildArtefactTrace + cat-s3's
// classifyDivergence + cat-s2's resolveLabel), replacing the independent
// feature-story-structure.js derivation. ADR-028.

var assert = require('assert');
var path = require('path');

var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');
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

var mod = freshRequire(FEATURES_PATH);

console.log('\n[cat-s4] AC1 (foundation) -- _buildGroupedFromTrace reconstructs render-compatible paths and labels');
{
  var fakeTrace = {
    status: 'found',
    epics: [{ slug: 'e1', name: 'Epic One' }],
    stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', divergence: 'registered' }],
    artefacts: [
      { path: 'dor/s1-dor-contract.md', type: 'dor', filename: 's1-dor-contract.md', storySlug: 's1', divergence: 'registered' },
      { path: 'discovery.md', type: 'feature-level', filename: 'discovery.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'test-feature-x');
  test('story artefact path is reconstructed to contain featureSlug/ as a substring', function() {
    var storyArtefact = grouped.epics[0].stories[0].artefacts[0];
    assert.ok(storyArtefact.path.indexOf('test-feature-x/') !== -1, 'expected featureSlug in path, got: ' + storyArtefact.path);
    assert.ok(storyArtefact.path.indexOf('dor/s1-dor-contract.md') !== -1);
  });
  test('story artefact type is resolved to a real label, not the raw subdirectory key', function() {
    var storyArtefact = grouped.epics[0].stories[0].artefacts[0];
    assert.notStrictEqual(storyArtefact.type, 'dor');
    assert.strictEqual(storyArtefact.type, 'Ready Check');
  });
  test('feature-level artefact lands in featureLevel, not attached to any story', function() {
    assert.strictEqual(grouped.featureLevel.length, 1);
    assert.strictEqual(grouped.featureLevel[0].path.indexOf('discovery.md') !== -1, true);
  });
  test('feature-level artefact type is resolved by filename, not the raw "feature-level" sentinel', function() {
    assert.notStrictEqual(grouped.featureLevel[0].type, 'Feature Level');
    assert.strictEqual(grouped.featureLevel[0].type, 'Discovery');
  });
}

console.log('\n[cat-s4] Regression -- feature-level artefact mislabeling bug (found in code review of the initial commit)');
{
  var fakeTraceDecisions = {
    status: 'found',
    epics: [],
    stories: [],
    artefacts: [
      { path: 'decisions.md', type: 'feature-level', filename: 'decisions.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var groupedDecisions = mod._buildGroupedFromTrace(fakeTraceDecisions, 'test-feature-y');
  test('feature-level "decisions.md" resolves to "Decisions" via labelFromPath\'s SUBDIR_LABELS fallback branch', function() {
    assert.strictEqual(groupedDecisions.featureLevel.length, 1);
    assert.notStrictEqual(groupedDecisions.featureLevel[0].type, 'Feature Level');
    assert.strictEqual(groupedDecisions.featureLevel[0].type, 'Decisions');
  });
}

console.log('\n[cat-s4] AC2 -- unregistered document with no inferredGroup gets its own labeled bucket with a visible Unregistered pill');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [
      { path: 'stray-notes.md', type: 'feature-level', filename: 'stray-notes.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'test-feature-y');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'test-feature-y', {});
  test('rendered output contains a visible "Unregistered" pill', function() {
    assert.ok(html.indexOf('Unregistered') !== -1, 'expected "Unregistered" text in rendered output');
    assert.ok(html.indexOf('sw-pill') !== -1, 'expected the pill CSS class to be used');
  });
}

console.log('\n[cat-s4] AC2 -- unregistered artefact with an inferredGroup renders inside that inferred grouping, still flagged');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [
      { path: 'phase4-story-3-notes.md', type: 'feature-level', filename: 'phase4-story-3-notes.md', storySlug: null, divergence: 'unregistered', inferredGroup: 'phase4-story-3' },
      { path: 'phase4-story-3-plan.md', type: 'feature-level', filename: 'phase4-story-3-plan.md', storySlug: null, divergence: 'unregistered', inferredGroup: 'phase4-story-3' }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'phase4-fixture');
  test('both inferred-group artefacts land in the same synthetic story bucket', function() {
    var inferredBucket = grouped.flatStories.find(function(s) { return s.slug === 'phase4-story-3'; });
    assert.ok(inferredBucket, 'expected a synthetic story bucket keyed by the inferredGroup value');
    assert.strictEqual(inferredBucket.artefacts.length, 2);
  });
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'phase4-fixture', {});
  test('rendered output still shows Unregistered for the inferred-group artefacts', function() {
    assert.ok(html.indexOf('Unregistered') !== -1);
  });
}

console.log('\n[cat-s4] AC2 -- unregistered non-feature-level artefact with no story match and no inferredGroup lands in the shared "Unregistered" catch-all bucket');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [
      { path: 'dor/orphan.md', type: 'dor', filename: 'orphan.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'some-slug');
  var catchAllBucket = grouped.flatStories.find(function(s) { return s.slug === 'Unregistered'; });
  test('the orphaned dor/ artefact (not feature-level, no story match, no inferredGroup) lands in a flatStories bucket keyed "Unregistered"', function() {
    assert.ok(catchAllBucket, 'expected a flatStories bucket with slug "Unregistered"');
    assert.strictEqual(catchAllBucket.artefacts.length, 1);
    assert.ok(catchAllBucket.artefacts[0].path.indexOf('dor/orphan.md') !== -1);
  });
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'some-slug', {});
  test('rendered output still shows a visible "Unregistered" pill for the catch-all-bucket artefact', function() {
    assert.ok(html.indexOf('Unregistered') !== -1, 'expected "Unregistered" text in rendered output');
    assert.ok(html.indexOf('sw-pill') !== -1, 'expected the pill CSS class to be used');
  });
}

console.log('\n[cat-s4] Regression -- a "registered" artefact never renders an Unregistered pill');
{
  var fakeTraceRegistered = {
    status: 'found',
    epics: [],
    stories: [{ slug: 'clean-s1', name: 'Clean Story', epicSlug: null, divergence: 'registered' }],
    artefacts: [
      { path: 'dor/clean-s1-dor-contract.md', type: 'dor', filename: 'clean-s1-dor-contract.md', storySlug: 'clean-s1', divergence: 'registered', inferredGroup: null }
    ]
  };
  var groupedRegistered = mod._buildGroupedFromTrace(fakeTraceRegistered, 'clean-feature');
  var htmlRegistered = mod.renderGroupedArtefactIndexHtml(groupedRegistered, 'clean-feature', {});
  test('a divergence:"registered" artefact produces no "Unregistered" pill text anywhere in the rendered output', function() {
    assert.strictEqual(htmlRegistered.indexOf('Unregistered'), -1, 'did not expect "Unregistered" text for a fully-registered fixture, got: ' + htmlRegistered);
  });
  test('a divergence:"registered" artefact produces no sw-pill--neutral markup anywhere in the rendered output', function() {
    assert.strictEqual(htmlRegistered.indexOf('sw-pill--neutral'), -1, 'did not expect sw-pill--neutral class for a fully-registered fixture, got: ' + htmlRegistered);
  });
}

console.log('\n[cat-s4] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
