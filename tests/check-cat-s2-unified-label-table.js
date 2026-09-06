'use strict';
// check-cat-s2-unified-label-table.js -- cat-s2: one canonical label/subdirectory
// table (src/web-ui/utils/artefact-labels.js), replacing 5 independently-
// maintained ones (this file's own TYPE_LABELS/getLabel, plain-language-labels.js's
// LABEL_MAP, artefact-list.js's SUBDIR_TYPE_MAP, artefact-fetcher.js's
// ARTEFACT_SUBDIRS, features.js's inline SUBDIR_KEY inside _deriveMatrixColumn).
// ADR-028: one canonical builder per derived structure.

var assert = require('assert');
var path = require('path');

var LABELS_PATH = path.resolve(__dirname, '../src/web-ui/utils/artefact-labels.js');
var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var labels = freshRequire(LABELS_PATH);

var ALL_14_SUBDIRS = [
  'stories', 'epics', 'test-plans', 'verification-scripts', 'dor', 'plans',
  'dod', 'trace', 'coverage', 'reference', 'research', 'review', 'decisions', 'spikes'
];

console.log('\n[cat-s2] AC1 -- all 14 recognised subdirectories resolve to a non-generic label');
ALL_14_SUBDIRS.forEach(function(subdir) {
  test('resolveLabel(' + subdir + ", 'example.md') is not the raw filename", function() {
    var label = labels.resolveLabel(subdir, 'example.md');
    assert.ok(label, 'expected a defined label for ' + subdir);
    assert.notStrictEqual(label, 'example.md');
  });
});

console.log('\n[cat-s2] AC1 (specific regression guard) -- spikes/ resolves to a real label');
{
  test('spikes/ is not an unrecognised fallback', function() {
    var label = labels.resolveLabel('spikes', 'phase4-spike-1.md');
    assert.ok(label);
    assert.notStrictEqual(label, 'phase4-spike-1.md');
  });
}

console.log('\n[cat-s2] AC1 (specific regression guard) -- review/, decisions/, research/ are distinct from each other');
{
  var reviewLabel = labels.resolveLabel('review', 'x.md');
  var decisionsLabel = labels.resolveLabel('decisions', 'x.md');
  var researchLabel = labels.resolveLabel('research', 'x.md');
  test('review, decisions, and research all resolve to distinct labels', function() {
    assert.notStrictEqual(reviewLabel, decisionsLabel);
    assert.notStrictEqual(decisionsLabel, researchLabel);
    assert.notStrictEqual(reviewLabel, researchLabel);
  });
}

console.log('\n[cat-s2] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
