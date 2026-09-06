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

console.log('\n[cat-s2] AC2 -- dor-contract.md and plain dor.md resolve to two distinct column keys');
{
  var contractKey = labels.resolveColumnKey('dor', 'psh-s1-dor-contract.md');
  var plainKey = labels.resolveColumnKey('dor', 'psh-s1-dor.md');
  test('dor-contract and plain dor resolve to different keys', function() {
    assert.notStrictEqual(contractKey, plainKey);
  });
}

console.log('\n[cat-s2] AC2 -- resolveColumnKey reuses features.js\'s own _deriveMatrixColumn, not a reimplementation');
{
  var featuresMod = freshRequire(FEATURES_PATH);
  test('resolveColumnKey(dor, x-dor-contract.md) agrees with features.js\'s _deriveMatrixColumn for the equivalent path', function() {
    var viaLabels = labels.resolveColumnKey('dor', 'x-dor-contract.md');
    var viaFeatures = featuresMod._deriveMatrixColumn('dor/x-dor-contract.md');
    assert.strictEqual(viaLabels, viaFeatures);
  });
}

console.log('\n[cat-s2] AC4 -- the 3 existing real tests referencing old label tables still pass unchanged');
{
  var { execFileSync } = require('child_process');
  var existingTestFiles = [
    'tests/check-alrf-s4-postgres-artefact-fallback.js',
    'tests/check-wuce20-artefact-index-html.js',
    'tests/check-wuce6-feature-navigation.js'
  ];
  existingTestFiles.forEach(function(file) {
    test(file + ' still exits 0 (all its own assertions pass)', function() {
      var result = execFileSync(process.execPath, [path.resolve(__dirname, '..', file)], { encoding: 'utf8' });
      assert.ok(typeof result === 'string');
    });
  });
}

console.log('\n[cat-s2] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
