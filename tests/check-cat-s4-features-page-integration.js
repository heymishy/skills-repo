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
}

console.log('\n[cat-s4] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
