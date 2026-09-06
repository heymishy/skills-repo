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
var FETCHER_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-fetcher.js');
var ARTEFACT_LIST_PATH = path.resolve(__dirname, '../src/web-ui/adapters/artefact-list.js');
var PLAIN_LABELS_PATH = path.resolve(__dirname, '../src/web-ui/utils/plain-language-labels.js');

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

console.log('\n[cat-s2] Task 4 -- isKnownSubdir() is true for all 14 known subdirs, false for an unknown one');
{
  test('isKnownSubdir returns true for every one of the 14 recognised subdirs', function() {
    ALL_14_SUBDIRS.forEach(function(subdir) {
      assert.strictEqual(labels.isKnownSubdir(subdir), true, 'expected true for ' + subdir);
    });
  });
  test('isKnownSubdir returns false for an unrecognised subdir', function() {
    assert.strictEqual(labels.isKnownSubdir('not-a-real-subdir'), false);
  });
}

console.log('\n[cat-s2] Task 4 -- listKnownSubdirs() returns exactly the 14 known names');
{
  test('listKnownSubdirs matches ALL_14_SUBDIRS as a set', function() {
    var got = labels.listKnownSubdirs().slice().sort();
    var want = ALL_14_SUBDIRS.slice().sort();
    assert.deepStrictEqual(got, want);
  });
}

console.log('\n[cat-s2] Task 4 -- artefact-fetcher.js\'s ARTEFACT_SUBDIRS is sourced from the canonical table, filtered to its own historical 11-name scope');
{
  var fetcherMod = freshRequire(FETCHER_PATH);
  var EXPECTED_11_SUBDIRS = [
    'stories', 'epics', 'test-plans', 'verification-scripts', 'dor', 'plans',
    'dod', 'trace', 'coverage', 'reference', 'research'
  ];
  test('ARTEFACT_SUBDIRS has exactly the expected 11 names, in the expected order (used as a sequential probe list, not a pure set)', function() {
    assert.deepStrictEqual(fetcherMod.ARTEFACT_SUBDIRS, EXPECTED_11_SUBDIRS);
  });
  test('ARTEFACT_SUBDIRS excludes review, decisions, and spikes (would silently widen the fallback probe otherwise)', function() {
    assert.strictEqual(fetcherMod.ARTEFACT_SUBDIRS.indexOf('review'), -1);
    assert.strictEqual(fetcherMod.ARTEFACT_SUBDIRS.indexOf('decisions'), -1);
    assert.strictEqual(fetcherMod.ARTEFACT_SUBDIRS.indexOf('spikes'), -1);
  });
}

console.log('\n[cat-s2] Task 4 -- the 7 subdirectory names migrated off plain-language-labels.js\'s old LABEL_MAP resolve consistently at the consumer level');
{
  var artefactListMod = freshRequire(ARTEFACT_LIST_PATH);
  var plainLabelsMod = freshRequire(PLAIN_LABELS_PATH);
  var MIGRATED_SUBDIRS = ['test-plans', 'plans', 'dod', 'decisions', 'reference', 'research', 'coverage'];
  MIGRATED_SUBDIRS.forEach(function(subdir) {
    var fileName = 'example-' + subdir + '-file.md';
    var expected = labels.resolveLabel(subdir, fileName);
    test('deriveTypeFromPath(".../' + subdir + '/' + fileName + '") matches canonical resolveLabel', function() {
      var filePath = 'artefacts/some-feature/' + subdir + '/' + fileName;
      assert.strictEqual(artefactListMod.deriveTypeFromPath(filePath), expected);
    });
    test('labelFromPath("' + subdir + '") matches canonical resolveLabel', function() {
      assert.strictEqual(plainLabelsMod.labelFromPath(subdir), expected);
    });
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
      // execFileSync already throws on a non-zero exit code (the real
      // pass/fail signal); this extra check guards against the file's own
      // '✗' (cross-mark) failure marker appearing while it still
      // somehow exits 0, which a bare `typeof result === 'string'`
      // assertion would not catch.
      assert.ok(result.indexOf('✗') === -1, 'expected no failure markers (✗) in output for ' + file);
    });
  });
}

console.log('\n[cat-s2] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
