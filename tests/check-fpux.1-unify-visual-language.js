'use strict';
// check-fpux.1-unify-visual-language.js -- fpux.1: renderGroupedArtefactIndexHtml
// and renderStory must emit the shared .sw-epic-group/.sw-story-row classes
// (html-shell.js) instead of the old page-local inline style="..." attributes,
// eliminating the visual seam against the .sw-card feature-level list above it.

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

console.log('\n[fpux.1] AC1 -- sw-epic-group/sw-story-row classes present, old inline styles absent');
{
  var mod = freshRequire(FEATURES_PATH);
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'test-feature', {});

  test('T1: epic wrapper has class="sw-epic-group"', function() {
    assert.ok(html.indexOf('class="sw-epic-group"') !== -1, 'expected sw-epic-group class, got: ' + html.slice(0, 200));
  });
  test('T1: epic wrapper does NOT use the old inline style literal', function() {
    assert.ok(html.indexOf('style="margin:8px 0;padding:10px 14px;border:1px solid var(--line);border-radius:10px"') === -1,
      'old inline style literal still present');
  });
  test('T2: story row has class="sw-story-row"', function() {
    assert.ok(html.indexOf('class="sw-story-row"') !== -1, 'expected sw-story-row class, got: ' + html.slice(0, 400));
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
