'use strict';

// tests/check-fapg-s1-group-artefacts-by-story.js — fapg-s1
//
// Story 3 of 3 in the feature-artefact-page redesign sequence (aada-s1,
// prlf-s1, fapg-s1). Confirmed via direct investigation of the real
// 2026-04-14-skills-platform-phase3 feature (7 epics, 21 stories) that
// today's artefact page shows every .md file under a feature's directory
// as one flat list, with no indication of which story owns which file.
// Fixed by reading the feature's real story structure directly from the
// connected repo's own local pipeline-state.json (matching ADR-023
// "disk is canonical"), not a Postgres query -- fal-s1's own tenant-scoped
// taxonomy-scan resolver and its NFR-Performance guarantee stay untouched,
// since it answers a different, narrower question (which feature does a
// raw story slug belong to) than this story's own local read (what is
// THIS already-resolved feature's own full story list).

var assert = require('assert');
var fs = require('fs');
var os = require('os');
var path = require('path');
var passed = 0; var failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  [PASS]', name); }
  catch (err) { failed++; console.log('  [FAIL]', name, '--', err.message); }
}
function testAsync(name, fn) {
  return Promise.resolve().then(fn).then(
    function() { passed++; console.log('  [PASS]', name); },
    function(err) { failed++; console.log('  [FAIL]', name, '--', (err && err.message) || err); }
  );
}

var FEATURE_STORY_STRUCTURE_PATH = path.resolve(__dirname, '../src/web-ui/adapters/feature-story-structure.js');
var FEATURES_PATH = path.resolve(__dirname, '../src/web-ui/routes/features.js');
var storyStructureModule = require(FEATURE_STORY_STRUCTURE_PATH);

function freshRequire(modulePath) {
  try { delete require.cache[require.resolve(modulePath)]; } catch (_) {}
  return require(modulePath);
}

function makeRes() {
  var state = { status: 200, body: '' };
  return {
    writeHead: function(code) { state.status = code; },
    end: function(body) { state.body = body || ''; },
    _get: function() { return state; }
  };
}

function makeTempRepoWithPipelineState(pipelineState) {
  var root = fs.mkdtempSync(path.join(os.tmpdir(), 'fapg-s1-'));
  fs.mkdirSync(path.join(root, '.github'), { recursive: true });
  fs.writeFileSync(path.join(root, '.github', 'pipeline-state.json'), JSON.stringify(pipelineState), 'utf8');
  return root;
}

(async function() {
  console.log('\n[fapg-s1] AC3 -- getFeatureStoryStructure reads a multi-story, epic-nested feature from local disk');

  test('getFeatureStoryStructure: real story list extracted, including bare-string shapes', function() {
    var root = makeTempRepoWithPipelineState({
      features: [{
        slug: 'multi-x',
        epics: [
          { slug: 'e1', name: 'Epic One', stories: [{ slug: 'p3.3' }, 'p3.1a'] },
          { slug: 'e2', name: 'Epic Two', stories: ['p3.4'] }
        ]
      }]
    });
    var structure = storyStructureModule.getFeatureStoryStructure(root, 'multi-x');
    assert.ok(structure, 'expected a non-null structure');
    assert.strictEqual(structure.epics.length, 2);
    assert.deepStrictEqual(structure.epics[0].storySlugs, ['p3.3', 'p3.1a'], 'expected object- and bare-string-shaped stories both extracted correctly');
    assert.deepStrictEqual(structure.epics[1].storySlugs, ['p3.4']);
    fs.rmSync(root, { recursive: true, force: true });
  });

  console.log('\n[fapg-s1] AC4 (data-layer) -- getFeatureStoryStructure returns null when pipeline-state.json is absent');

  test('getFeatureStoryStructure: null for a repo with no .github directory (regression guard)', function() {
    var root = fs.mkdtempSync(path.join(os.tmpdir(), 'fapg-s1-nostate-'));
    var structure = storyStructureModule.getFeatureStoryStructure(root, 'any-feature');
    assert.strictEqual(structure, null);
    fs.rmSync(root, { recursive: true, force: true });
  });

  console.log('\n[fapg-s1] AC1 (data-layer) -- groupArtefactsByStory classifies real filenames correctly, no cross-contamination');

  test('groupArtefactsByStory: p3.3/p3.4-style filenames classified against the real slug list', function() {
    var artefacts = [
      { path: 'artefacts/multi-x/discovery.md' },
      { path: 'artefacts/multi-x/benefit-metric.md' },
      { path: 'artefacts/multi-x/stories/p3.3-gate-structural-independence.md' },
      { path: 'artefacts/multi-x/test-plans/p3.3-gate-structural-independence-test-plan.md' },
      { path: 'artefacts/multi-x/stories/p3.4-eval-anti-gaming-controls.md' }
    ];
    var structure = { epics: [{ epicName: 'Platform Structural Integrity', epicSlug: 'e1', storySlugs: ['p3.3', 'p3.4'] }], flatStorySlugs: [] };
    var grouped = storyStructureModule.groupArtefactsByStory(artefacts, structure);
    assert.strictEqual(grouped.featureLevel.length, 2, 'expected exactly the 2 feature-level files');
    var p33 = grouped.epics[0].stories.find(function(s) { return s.slug === 'p3.3'; });
    var p34 = grouped.epics[0].stories.find(function(s) { return s.slug === 'p3.4'; });
    assert.strictEqual(p33.artefacts.length, 2, 'expected p3.3 to own exactly its own 2 files');
    assert.strictEqual(p34.artefacts.length, 1, 'expected p3.4 to own exactly its own 1 file');
  });

  console.log('\n[fapg-s1] AC1 (route-level) -- multi-story feature renders feature-level artefacts once, then an epic/story accordion');

  await testAsync('handleGetFeatureArtefacts: multi-story feature renders the accordion', async function() {
    var root = makeTempRepoWithPipelineState({
      features: [{
        slug: 'multi-x',
        epics: [{ slug: 'e1', name: 'Platform Structural Integrity', stories: ['p3.3', 'p3.4'] }]
      }]
    });
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() {
      return {
        artefacts: [
          { path: 'artefacts/multi-x/discovery.md', type: 'Discovery' },
          { path: 'artefacts/multi-x/stories/p3.3-gate-structural-independence.md', type: 'Stories' },
          { path: 'artefacts/multi-x/stories/p3.4-eval-anti-gaming-controls.md', type: 'Stories' }
        ],
        grouped: {}, noArtefacts: false
      };
    });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'multi-x', displayName: 'Multi X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function(sql, params) {
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      return { rows: [] };
    } };
    var origRepoRoot = require('../src/web-ui/adapters/repo-root').getRepoRoot;
    require('../src/web-ui/adapters/repo-root').setRepoRoot(root);
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'multi-x', pool);
    require('../src/web-ui/adapters/repo-root').setRepoRoot(null);
    var body = res._get().body;
    assert.ok(/discovery\.md/.test(body), 'expected the feature-level artefact to render');
    assert.ok((body.match(/discovery\.md/g) || []).length === 1, 'expected discovery.md to appear exactly once, not duplicated per story');
    // fpux.1: renamed to the shared sw-epic-group/sw-story-row design-system
    // classes (html-shell.js) to eliminate the visual seam against the
    // feature-level .sw-card list above it -- the old bare "epic"/"story-row"
    // classes were page-local and never styled. Behaviour (grouping, content)
    // is unchanged; only the class names changed.
    assert.ok(/class="sw-epic-group"/.test(body), 'expected an epic accordion section');
    assert.ok(/class="sw-story-row"/.test(body), 'expected story-row accordion elements');
    assert.ok(/>p3\.3</.test(body), 'expected a p3.3 story row');
    assert.ok(/>p3\.4</.test(body), 'expected a p3.4 story row');
    fs.rmSync(root, { recursive: true, force: true });
  });

  console.log('\n[fapg-s1] AC2 -- single-story feature renders exactly as it does today (regression guard)');

  await testAsync('handleGetFeatureArtefacts: single-story feature has no accordion', async function() {
    var root = makeTempRepoWithPipelineState({
      features: [{ slug: 'single-x', epics: [{ slug: 'e1', name: 'Only Epic', stories: ['only-story'] }] }]
    });
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() {
      return { artefacts: [{ path: 'artefacts/single-x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false };
    });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'single-x', displayName: 'Single X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function(sql) {
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      return { rows: [] };
    } };
    require('../src/web-ui/adapters/repo-root').setRepoRoot(root);
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'single-x', pool);
    require('../src/web-ui/adapters/repo-root').setRepoRoot(null);
    var body = res._get().body;
    assert.ok(!/class="epic"/.test(body), 'expected no epic accordion for a single-story feature');
    assert.ok(!/class="story-row"/.test(body), 'expected no story-row accordion for a single-story feature');
    fs.rmSync(root, { recursive: true, force: true });
  });

  console.log('\n[fapg-s1] AC4 (route-level) -- pipeline-state.json absent falls back to today\'s flat rendering (regression guard)');

  await testAsync('handleGetFeatureArtefacts: no local pipeline-state.json -- flat rendering, no crash', async function() {
    var root = fs.mkdtempSync(path.join(os.tmpdir(), 'fapg-s1-noloc-'));
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() {
      return { artefacts: [{ path: 'artefacts/no-local-x/discovery.md', type: 'Discovery' }], grouped: {}, noArtefacts: false };
    });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() { return { journeyId: 'jid-1', featureSlug: 'no-local-x', displayName: 'No Local X', completedStages: [], productId: 'product-abc' }; },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function(sql) {
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      return { rows: [] };
    } };
    require('../src/web-ui/adapters/repo-root').setRepoRoot(root);
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    var threw = false;
    try { await routes.handleGetFeatureArtefacts(req, res, 'no-local-x', pool); } catch (e) { threw = true; }
    require('../src/web-ui/adapters/repo-root').setRepoRoot(null);
    assert.ok(!threw, 'expected no thrown exception');
    var body = res._get().body;
    assert.ok(/discovery\.md/.test(body), 'expected the artefact to still render via the flat fallback');
    assert.ok(!/class="epic"/.test(body), 'expected no accordion when pipeline-state.json is absent');
    fs.rmSync(root, { recursive: true, force: true });
  });

  console.log('\n[fapg-s1] AC5 -- resume-conversation links still render wherever they already apply (regression guard)');

  await testAsync('handleGetFeatureArtefacts: feature-level resume link still renders inside the grouped layout', async function() {
    var root = makeTempRepoWithPipelineState({
      features: [{ slug: 'multi-resume-x', epics: [{ slug: 'e1', name: 'Epic One', stories: ['s.1', 's.2'] }] }]
    });
    var routes = freshRequire(FEATURES_PATH);
    routes.setListArtefacts(async function() {
      return {
        artefacts: [
          { path: 'artefacts/multi-resume-x/discovery.md', type: 'Discovery' },
          { path: 'artefacts/multi-resume-x/stories/s.1-story.md', type: 'Stories' },
          { path: 'artefacts/multi-resume-x/stories/s.2-story.md', type: 'Stories' }
        ],
        grouped: {}, noArtefacts: false
      };
    });
    routes.setJourneyStoreModule({
      getJourneyByFeatureSlug: function() {
        return {
          journeyId: 'jid-1', featureSlug: 'multi-resume-x', displayName: 'Multi Resume X', productId: 'product-abc',
          completedStages: [{ skillName: 'discovery', sessionId: 'sess-1', artefactPath: 'artefacts/multi-resume-x/discovery.md' }]
        };
      },
      getArtefactsForJourney: async function() { return []; }
    });
    var pool = { query: async function(sql) {
      if (/SELECT name FROM products WHERE product_id/i.test(sql)) return { rows: [{ name: 'Acme Product' }] };
      return { rows: [] };
    } };
    require('../src/web-ui/adapters/repo-root').setRepoRoot(root);
    var req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' }, headers: { accept: 'text/html' } };
    var res = makeRes();
    await routes.handleGetFeatureArtefacts(req, res, 'multi-resume-x', pool);
    require('../src/web-ui/adapters/repo-root').setRepoRoot(null);
    var body = res._get().body;
    assert.ok(/Resume conversation/.test(body), 'expected the resume-conversation link to still render for the feature-level discovery.md artefact');
    fs.rmSync(root, { recursive: true, force: true });
  });

  console.log('\n[fapg-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
  process.exitCode = failed > 0 ? 1 : 0;
})();
