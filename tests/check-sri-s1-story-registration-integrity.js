'use strict';
// check-sri-s1-story-registration-integrity.js -- sri-s1: getFeatureStoryStructure
// must exclude a flat story slug that is already a member of an epic (the
// schema-documented "Phase 3+ style" where a slug can legitimately appear
// as a bare-string epic reference AND a full flat tracking object at the
// same time) -- otherwise groupArtefactsByStory renders that story's
// accordion twice. Also asserts the real pipeline-state.json data fix:
// 4 features' previously-unregistered stories are now correctly registered.

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');

var STRUCTURE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/feature-story-structure.js');
var REAL_STATE_PATH = path.resolve(__dirname, '../.github/pipeline-state.json');

function freshRequire(p) {
  try { delete require.cache[require.resolve(p)]; } catch (_) {}
  return require(p);
}

var passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}

function makeTempRepoWithPipelineState(feature) {
  var dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sri-s1-'));
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  fs.writeFileSync(
    path.join(dir, '.github', 'pipeline-state.json'),
    JSON.stringify({ features: [feature] })
  );
  return dir;
}

function slugOf(s) { return typeof s === 'string' ? s : (s && (s.slug || s.id)); }

var mod = freshRequire(STRUCTURE_PATH);

console.log('\n[sri-s1] AC1 -- getFeatureStoryStructure excludes a flat slug already present in an epic');
{
  var repoRoot = makeTempRepoWithPipelineState({
    slug: 'f',
    epics: [{ name: 'Epic X', slug: 'epic-x', stories: ['x.1'] }],
    stories: [{ id: 'x.1', name: 'Story x.1' }]
  });
  var structure = mod.getFeatureStoryStructure(repoRoot, 'f');
  test('epics[0].storySlugs contains x.1', function() {
    assert.deepStrictEqual(structure.epics[0].storySlugs, ['x.1']);
  });
  test('flatStorySlugs does NOT contain x.1 (deduped against epic membership)', function() {
    assert.strictEqual(structure.flatStorySlugs.indexOf('x.1'), -1);
  });
}

console.log('\n[sri-s1] AC1 -- groupArtefactsByStory renders a dual-registered story once, under its epic');
{
  var storyStructure = { epics: [{ epicName: 'Epic X', epicSlug: 'epic-x', storySlugs: ['x.1'] }], flatStorySlugs: [] };
  var artefacts = [{ path: 'artefacts/f/stories/x.1-something.md' }];
  var result = mod.groupArtefactsByStory(artefacts, storyStructure);
  test('artefact appears under epics[0].stories[0]', function() {
    assert.strictEqual(result.epics[0].stories[0].artefacts.length, 1);
  });
  test('flatStories is empty -- no duplicate group', function() {
    assert.strictEqual(result.flatStories.length, 0);
  });
}

console.log('\n[sri-s1] AC2 (regression guard) -- a flat-only slug with no epic membership is unaffected');
{
  var repoRoot = makeTempRepoWithPipelineState({
    slug: 'f',
    epics: [{ name: 'Epic X', slug: 'epic-x', stories: ['x.1'] }],
    stories: [{ id: 'x.1' }, { id: 'y.1' }]
  });
  var structure = mod.getFeatureStoryStructure(repoRoot, 'f');
  test('flatStorySlugs contains y.1 (no epic membership, unaffected)', function() {
    assert.notStrictEqual(structure.flatStorySlugs.indexOf('y.1'), -1);
  });
  test('flatStorySlugs does not contain x.1 (deduped)', function() {
    assert.strictEqual(structure.flatStorySlugs.indexOf('x.1'), -1);
  });
}

console.log('\n[sri-s1] AC3 -- real pipeline-state.json registers all 30 previously-missing story slugs');
{
  var state = JSON.parse(fs.readFileSync(REAL_STATE_PATH, 'utf8'));

  function epicSlugs(featureSlug, epicSlug) {
    var f = state.features.find(function(x) { return x.slug === featureSlug; });
    var e = f && (f.epics || []).find(function(x) { return x.slug === epicSlug; });
    return e ? (e.stories || []).map(slugOf) : [];
  }
  function flatSlugs(featureSlug) {
    var f = state.features.find(function(x) { return x.slug === featureSlug; });
    return f ? (f.stories || []).map(slugOf) : [];
  }
  function allEpicSlugsForFeature(featureSlug) {
    var f = state.features.find(function(x) { return x.slug === featureSlug; });
    return (f.epics || []).reduce(function(acc, e) { return acc.concat((e.stories || []).map(slugOf)); }, []);
  }

  test('phase3: e1-governance-chain-integrity contains p3.18-p3.22', function() {
    var slugs = epicSlugs('2026-04-14-skills-platform-phase3', 'e1-governance-chain-integrity');
    ['p3.18', 'p3.19', 'p3.20', 'p3.21', 'p3.22'].forEach(function(s) {
      assert.notStrictEqual(slugs.indexOf(s), -1, s + ' missing from e1');
    });
  });

  test('phase4-opus: all 4 epics collectively register all 23 story slugs', function() {
    var expected = [
      'record-enforcement-adr', 'spike-a-governance-extractability', 'spike-b1-cli-mcp-enforcement',
      'spike-b2-orchestration-schema-enforcement', 'synthesise-enforcement-recommendation',
      'design-package-manifest', 'implement-context-yml-seeding', 'implement-lockfile-hash-verification',
      'implement-sync-command', 'implement-zero-commit-install', 'spike-c-distribution-model',
      'validate-install-sync-e2e',
      'implement-teams-bot-scaffold', 'implement-teams-dor-approval', 'implement-teams-governance-output',
      'implement-teams-pipeline-health', 'spike-d-teams-c7-fidelity', 'validate-teams-e2e-session',
      'design-readable-governance-format', 'implement-gate-verdict-narrative', 'implement-second-line-audit-export',
      'implement-trace-plain-language', 'validate-readable-output-review'
    ];
    var slugs = allEpicSlugsForFeature('2026-04-19-skills-platform-phase4-opus');
    expected.forEach(function(s) {
      assert.notStrictEqual(slugs.indexOf(s), -1, s + ' missing from phase4-opus epics');
    });
  });

  test('mfc: flat stories[] contains an entry with id mfc.2', function() {
    var slugs = flatSlugs('2026-05-05-web-ui-model-first-chat');
    assert.notStrictEqual(slugs.indexOf('mfc.2'), -1);
  });

  test('wfp: wfp-planning-dashboard contains wfp.11', function() {
    var slugs = epicSlugs('2026-05-26-bsr-workforce-planner', 'wfp-planning-dashboard');
    assert.notStrictEqual(slugs.indexOf('wfp.11'), -1);
  });
}

console.log('\n--- sri-s1 Results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);
