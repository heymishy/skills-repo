'use strict';
// check-bsgm-s1-bare-slug-story-grouping.js -- bsgm-s1: groupArtefactsByStory
// must also match a story's own bare "<slug>.md" definition file into that
// story's own artefacts group, not just files named "<slug>-something.md".
// Fixes a repo-wide UX defect (37 affected features): the story's own file
// was orphaned into the feature-level flat list while every other artefact
// for that story correctly grouped under its own accordion section.

var assert = require('assert');
var path = require('path');
var STRUCTURE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/feature-story-structure.js');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

var mod = freshRequire(STRUCTURE_PATH);

console.log('\n[bsgm-s1] AC1 -- bare <slug>.md groups into its own flat story');
{
  var storyStructure = { epics: [], flatStorySlugs: ['bsgm-x1'] };
  var artefacts = [{ path: 'artefacts/f/stories/bsgm-x1.md' }];
  var result = mod.groupArtefactsByStory(artefacts, storyStructure);
  test('bsgm-x1.md is in flatStories[0].artefacts', function() {
    assert.strictEqual(result.flatStories[0].artefacts.length, 1);
    assert.strictEqual(result.flatStories[0].artefacts[0].path, 'artefacts/f/stories/bsgm-x1.md');
  });
  test('bsgm-x1.md is NOT in featureLevel', function() {
    assert.strictEqual(result.featureLevel.length, 0);
  });
}

console.log('\n[bsgm-s1] AC1 -- bare <slug>.md groups into its own epic-nested story');
{
  var storyStructure = {
    epics: [{ epicName: 'Phase 0', epicSlug: 'phase-0', storySlugs: ['p0.1'] }],
    flatStorySlugs: []
  };
  var artefacts = [{ path: 'artefacts/f/stories/p0.1.md' }];
  var result = mod.groupArtefactsByStory(artefacts, storyStructure);
  test('p0.1.md is in epics[0].stories[0].artefacts', function() {
    assert.strictEqual(result.epics[0].stories[0].artefacts.length, 1);
    assert.strictEqual(result.epics[0].stories[0].artefacts[0].path, 'artefacts/f/stories/p0.1.md');
  });
  test('p0.1.md is NOT in featureLevel', function() {
    assert.strictEqual(result.featureLevel.length, 0);
  });
}

console.log('\n[bsgm-s1] AC2 (regression guard) -- existing descriptive-suffix matching unchanged');
{
  var storyStructure = { epics: [], flatStorySlugs: ['fpux.1'] };
  var artefacts = [{ path: 'artefacts/f/stories/fpux.1-unify-feature-page-visual-language.md' }];
  var result = mod.groupArtefactsByStory(artefacts, storyStructure);
  test('descriptive-suffix filename still groups under its story', function() {
    assert.strictEqual(result.flatStories[0].artefacts.length, 1);
  });
}

console.log('\n[bsgm-s1] AC3 (regression guard) -- p3.1/p3.1a disambiguation preserved for the NEW bare case');
{
  var storyStructure = { epics: [], flatStorySlugs: ['p3.1', 'p3.1a'] };
  var artefacts = [
    { path: 'artefacts/f/stories/p3.1a.md' },
    { path: 'artefacts/f/stories/p3.1.md' }
  ];
  var result = mod.groupArtefactsByStory(artefacts, storyStructure);
  var p31 = result.flatStories.find(function(s) { return s.slug === 'p3.1'; });
  var p31a = result.flatStories.find(function(s) { return s.slug === 'p3.1a'; });
  test('p3.1a.md groups under p3.1a only', function() {
    assert.strictEqual(p31a.artefacts.length, 1);
    assert.strictEqual(p31a.artefacts[0].path, 'artefacts/f/stories/p3.1a.md');
  });
  test('p3.1.md groups under p3.1 only, not cross-contaminated', function() {
    assert.strictEqual(p31.artefacts.length, 1);
    assert.strictEqual(p31.artefacts[0].path, 'artefacts/f/stories/p3.1.md');
  });
}

console.log('\n[bsgm-s1] AC3 (regression guard) -- p3.1/p3.1a disambiguation preserved for the EXISTING hyphenated case');
{
  var storyStructure = { epics: [], flatStorySlugs: ['p3.1', 'p3.1a'] };
  var artefacts = [{ path: 'artefacts/f/stories/p3.1a-review-1.md' }];
  var result = mod.groupArtefactsByStory(artefacts, storyStructure);
  var p31 = result.flatStories.find(function(s) { return s.slug === 'p3.1'; });
  var p31a = result.flatStories.find(function(s) { return s.slug === 'p3.1a'; });
  test('p3.1a-review-1.md groups under p3.1a, not the shorter prefix p3.1', function() {
    assert.strictEqual(p31a.artefacts.length, 1);
    assert.strictEqual(p31.artefacts.length, 0);
  });
}

console.log('\n--- bsgm-s1 Results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
