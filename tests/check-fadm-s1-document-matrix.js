'use strict';
// check-fadm-s1-document-matrix.js -- fadm-s1: replaces the multi-story
// artefact accordion (.sw-epic-group/.sw-story-row, fpux.1, dedup-fixed by
// sri-s1) with a compact feature-level table and a clickable document
// matrix. Design approved interactively via a live mockup this session
// (real data, 2 rounds of user-driven simplification) before this test
// file was written.

var assert = require('assert');
var path = require('path');

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

var mod = freshRequire(FEATURES_PATH);

console.log('\n[fadm-s1] AC1 -- feature-level documents render as one table, not per-type cards');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [
      { path: 'artefacts/f/discovery.md', type: 'discovery' },
      { path: 'artefacts/f/benefit-metric.md', type: 'benefit-metric' },
      { path: 'artefacts/f/decisions.md', type: 'decisions' },
      { path: 'artefacts/f/nfr-profile.md', type: 'nfr-profile' }
    ],
    epics: [],
    flatStories: [{ slug: 's.1', artefacts: [{ path: 'artefacts/f/stories/s.1.md', type: 'stories' }] }]
  }, 'f', {});
  test('exactly one <table> for the feature-level section', function() {
    var tableCount = (html.match(/<table class="doc-table">/g) || []).length;
    assert.strictEqual(tableCount, 1);
  });
  test('zero .sw-card sections for feature-level types', function() {
    assert.strictEqual((html.match(/sw-section-title">Discovery/g) || []).length, 0);
  });
  test('all 4 feature-level rows present', function() {
    ['discovery.md', 'benefit-metric.md', 'decisions.md', 'nfr-profile.md'].forEach(function(f) {
      assert.ok(html.indexOf(f) !== -1, f + ' missing from output');
    });
  });
}

console.log('\n[fadm-s1] AC1 (regression guard) -- an artefact type outside the 4 known labels is not dropped');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [{ path: 'artefacts/f/reference/some-doc.md', type: 'reference' }],
    epics: [],
    flatStories: [{ slug: 's.1', artefacts: [{ path: 'artefacts/f/stories/s.1.md', type: 'stories' }] }]
  }, 'f', {});
  test('reference document still appears in the feature-level table', function() {
    assert.ok(html.indexOf('reference/some-doc.md') !== -1);
  });
}

console.log('\n[fadm-s1] AC2 -- matrix columns are the union of document kinds actually present');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [],
    epics: [],
    flatStories: [
      { slug: 'a', artefacts: [{ path: 'artefacts/f/dor/a-dor.md' }, { path: 'artefacts/f/dod/a-dod.md' }] },
      { slug: 'b', artefacts: [{ path: 'artefacts/f/dor/b-dor.md' }, { path: 'artefacts/f/plans/b-plan.md' }, { path: 'artefacts/f/test-plans/b-test-plan.md' }] }
    ]
  }, 'f', {});
  test('exactly 4 column headers (dor, dod, plan, test-plan)', function() {
    var headerCount = (html.match(/<th title=/g) || []).length;
    assert.strictEqual(headerCount, 4);
  });
}

console.log('\n[fadm-s1] AC2 -- a story missing a document shows a dash in that column');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [],
    epics: [],
    flatStories: [
      { slug: 'a', artefacts: [{ path: 'artefacts/f/dor/a-dor.md' }, { path: 'artefacts/f/dod/a-dod.md' }] },
      { slug: 'b', artefacts: [{ path: 'artefacts/f/dor/b-dor.md' }, { path: 'artefacts/f/plans/b-plan.md' }, { path: 'artefacts/f/test-plans/b-test-plan.md' }] }
    ]
  }, 'f', {});
  test('story a has at least one dash (missing plan, test-plan)', function() {
    var rowA = html.slice(html.indexOf('>a<'));
    assert.ok((rowA.match(/doc-matrix__dash/g) || []).length >= 2);
  });
}

console.log('\n[fadm-s1] AC2 -- a present document\'s cell is a link to the real document');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [], epics: [],
    flatStories: [{ slug: 'x', artefacts: [{ path: 'artefacts/f/dor/x-dor.md' }] }]
  }, 'f', {});
  test('href decodes to dor/x-dor', function() {
    var m = html.match(/href="([^"]*artefact\/f\/[^"]+)"/);
    assert.ok(m, 'no artefact link found');
    assert.strictEqual(decodeURIComponent(m[1].split('/f/')[1]), 'dor/x-dor');
  });
}

console.log('\n[fadm-s1] AC2 -- epic-nested stories render under a divider row, flat stories do not');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [],
    epics: [{ epicName: 'Epic One', epicSlug: 'e1', stories: [{ slug: 'e1s1', artefacts: [{ path: 'artefacts/f/stories/e1s1.md' }] }] }],
    flatStories: [{ slug: 'flat1', artefacts: [{ path: 'artefacts/f/stories/flat1.md' }] }]
  }, 'f', {});
  test('epic divider row present naming the epic', function() {
    assert.ok(/doc-matrix__divider[^>]*>[\s\S]*?Epic One/.test(html));
  });
  test('a "Stories" divider also present for the flat group (since an epic exists)', function() {
    assert.ok(html.indexOf('>Stories</td>') !== -1);
  });
}

console.log('\n[fadm-s1] AC3 -- dor.md and dor-contract.md occupy two distinct columns');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [], epics: [],
    flatStories: [{ slug: 'x', artefacts: [
      { path: 'artefacts/f/dor/x-dor.md' },
      { path: 'artefacts/f/dor/x-dor-contract.md' }
    ] }]
  }, 'f', {});
  test('2 column headers exist (RC, RCC)', function() {
    assert.strictEqual((html.match(/<th title=/g) || []).length, 2);
  });
  test('both ticks present for story x', function() {
    var rowX = html.slice(html.indexOf('>x<'));
    assert.strictEqual((rowX.match(/doc-matrix__tick/g) || []).length, 2);
  });
}

console.log('\n[fadm-s1] AC3 (regression guard) -- a story with only dor.md (no contract) shows a dash for the contract column');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [], epics: [],
    flatStories: [
      { slug: 'x', artefacts: [{ path: 'artefacts/f/dor/x-dor.md' }, { path: 'artefacts/f/dor/x-dor-contract.md' }] },
      { slug: 'y', artefacts: [{ path: 'artefacts/f/dor/y-dor.md' }] }
    ]
  }, 'f', {});
  test('story y has exactly 1 tick and 1 dash', function() {
    var rowY = html.slice(html.indexOf('>y<'));
    var rowYSlice = rowY.slice(0, rowY.indexOf('</tr>'));
    assert.strictEqual((rowYSlice.match(/doc-matrix__tick/g) || []).length, 1);
    assert.strictEqual((rowYSlice.match(/doc-matrix__dash/g) || []).length, 1);
  });
}

console.log('\n[fadm-s1] AC3 -- the column-derivation helper is independently correct');
{
  test('dor.md -> dor', function() { assert.strictEqual(mod._deriveMatrixColumn('artefacts/f/dor/x-dor.md'), 'dor'); });
  test('dor-contract.md -> dor-contract', function() { assert.strictEqual(mod._deriveMatrixColumn('artefacts/f/dor/x-dor-contract.md'), 'dor-contract'); });
  test('dod.md -> dod', function() { assert.strictEqual(mod._deriveMatrixColumn('artefacts/f/dod/x-dod.md'), 'dod'); });
  test('plan.md -> plan', function() { assert.strictEqual(mod._deriveMatrixColumn('artefacts/f/plans/x-plan.md'), 'plan'); });
  test('review.md -> review', function() { assert.strictEqual(mod._deriveMatrixColumn('artefacts/f/review/x-review-1.md'), 'review'); });
  test('test-plan.md -> test-plan', function() { assert.strictEqual(mod._deriveMatrixColumn('artefacts/f/test-plans/x-test-plan.md'), 'test-plan'); });
  test('verification.md -> verification', function() { assert.strictEqual(mod._deriveMatrixColumn('artefacts/f/verification-scripts/x-verification.md'), 'verification'); });
  test('bare story file -> story', function() { assert.strictEqual(mod._deriveMatrixColumn('artefacts/f/stories/x.md'), 'story'); });
}

console.log('\n[fadm-s1] AC4 -- an epic\'s own document links from its divider row, not a separate row');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [{ path: 'artefacts/f/epics/e1-something.md', type: 'epic' }],
    epics: [{ epicName: 'Epic One', epicSlug: 'e1-something', stories: [
      { slug: 's1', artefacts: [{ path: 'artefacts/f/stories/s1.md' }] },
      { slug: 's2', artefacts: [{ path: 'artefacts/f/stories/s2.md' }] }
    ] }],
    flatStories: []
  }, 'f', {});
  test('epic doc link appears in the divider row', function() {
    assert.ok(/doc-matrix__divider[\s\S]*?doc-matrix__epic-link/.test(html));
  });
  test('epic doc is not a separate matrix row', function() {
    // link is percent-encoded (encodeURIComponent, matching adlr-s1's convention) --
    // count occurrences of the encoded epic-doc href, expect exactly the one in the divider.
    assert.strictEqual((html.match(/epics%2Fe1-something/g) || []).length, 1);
  });
  test('epic doc does not appear in the feature-level table', function() {
    assert.strictEqual((html.match(/doc-table__link[^>]*>artefacts\/f\/epics/g) || []).length, 0);
  });
}

console.log('\n[fadm-s1] AC4 (regression guard) -- an epic with no epic-level document renders cleanly');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [],
    epics: [{ epicName: 'Epic One', epicSlug: 'e1', stories: [{ slug: 's1', artefacts: [{ path: 'artefacts/f/stories/s1.md' }] }] }],
    flatStories: []
  }, 'f', {});
  test('no empty or broken epic-link markup', function() {
    assert.strictEqual((html.match(/doc-matrix__epic-link/g) || []).length, 0);
  });
  test('divider row still names the epic', function() {
    assert.ok(/doc-matrix__divider[^>]*>[\s\S]*?Epic One/.test(html));
  });
}

console.log('\n[fadm-s1] AC5 (regression guard) -- single-story rendering is unchanged (no matrix markup)');
{
  var html = mod.renderArtefactIndexHtml([
    { path: 'artefacts/f/discovery.md', type: 'discovery' },
    { path: 'artefacts/f/stories/f.md', type: 'stories' }
  ], 'f', {});
  test('no doc-matrix markup in single-story output', function() {
    assert.strictEqual(html.indexOf('doc-matrix'), -1);
  });
}

console.log('\n[fadm-s1] AC6 (regression guard) -- resume-conversation affordance preserved for a feature-level document');
{
  var html = mod.renderGroupedArtefactIndexHtml({
    featureLevel: [{ path: 'artefacts/f/discovery.md', type: 'discovery' }],
    epics: [],
    flatStories: [{ slug: 's.1', artefacts: [{ path: 'artefacts/f/stories/s.1.md' }] }]
  }, 'f', { 'artefacts/f/discovery.md': { skillName: 'discovery', sessionId: 'sess-1', journeyId: 'jid-1' } });
  test('Resume conversation link renders', function() {
    assert.ok(/Resume conversation/.test(html));
  });
}

console.log('\n--- fadm-s1 Results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
