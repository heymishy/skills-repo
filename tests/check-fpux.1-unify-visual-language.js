'use strict';
// check-fpux.1-unify-visual-language.js -- fpux.1 originally required
// renderGroupedArtefactIndexHtml/renderStory to emit the shared
// .sw-epic-group/.sw-story-row classes instead of page-local inline
// style="..." attributes. fadm-s1 supersedes that rendering for this route
// with a compact feature-level table + document matrix (an interactively
// approved redesign, not a regression) -- renderStory and its CSS are left
// in place for fpux.1's own dedicated E2E suite, just no longer called by
// renderGroupedArtefactIndexHtml. T1/T2 below now assert the new matrix
// markup; the "no old inline style literal" checks remain valid and are
// kept unchanged, confirming no regression to the pre-fpux.1 hardcoded styles.

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

var grouped = {
  featureLevel: [],
  epics: [
    {
      epicName: 'Phase 0 — Authorization Guard',
      epicSlug: 'phase-0',
      stories: [
        { slug: 'p0.1', artefacts: [{ type: 'dod', path: 'p0.1-dod.md', createdAt: '2026-01-01' }] }
      ]
    }
  ],
  flatStories: []
};

console.log('\n[fpux.1] AC1 -- document matrix (fadm-s1) classes present, old inline styles absent');
{
  var mod = freshRequire(FEATURES_PATH);
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'test-feature', {});

  test('T1: epic divider row has class="doc-matrix__divider"', function() {
    assert.ok(html.indexOf('doc-matrix__divider') !== -1, 'expected doc-matrix__divider class, got: ' + html.slice(0, 200));
  });
  test('T1: epic wrapper does NOT use the old inline style literal', function() {
    assert.ok(html.indexOf('style="margin:8px 0;padding:10px 14px;border:1px solid var(--line);border-radius:10px"') === -1,
      'old inline style literal still present');
  });
  test('T2: story row has class="doc-matrix__story-col"', function() {
    assert.ok(html.indexOf('doc-matrix__story-col') !== -1, 'expected doc-matrix__story-col class, got: ' + html.slice(0, 400));
  });
  test('T2: story row does NOT use the old inline style literal', function() {
    assert.ok(html.indexOf('style="margin:4px 0 4px 16px;padding:6px 10px;border:1px solid var(--line);border-radius:8px"') === -1,
      'old inline style literal still present');
  });
}

console.log('\n[fpux.1] AC5 (regression guard) -- delete-feature button markup unchanged by this story');
{
  var fs = require('fs');
  var src = fs.readFileSync(FEATURES_PATH, 'utf8');
  test('AC5: alrf-s10-delete-feature-btn id still present', function() {
    assert.ok(src.indexOf('alrf-s10-delete-feature-btn') !== -1, 'delete button id missing from features.js');
  });
  test('AC5: delete confirm()/fetch() script block still present', function() {
    assert.ok(src.indexOf('btn.addEventListener("click"') !== -1, 'delete button click handler missing');
    assert.ok(src.indexOf('method:"DELETE"') !== -1, 'DELETE fetch call missing');
  });
}

console.log('\n--- fpux.1 (visual language) Results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
