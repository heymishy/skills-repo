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
  test('feature-level artefact type is resolved by filename, not the raw "feature-level" sentinel', function() {
    assert.notStrictEqual(grouped.featureLevel[0].type, 'Feature Level');
    assert.strictEqual(grouped.featureLevel[0].type, 'Discovery');
  });
}

console.log('\n[cat-s4] Regression -- feature-level artefact mislabeling bug (found in code review of the initial commit)');
{
  var fakeTraceDecisions = {
    status: 'found',
    epics: [],
    stories: [],
    artefacts: [
      { path: 'decisions.md', type: 'feature-level', filename: 'decisions.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var groupedDecisions = mod._buildGroupedFromTrace(fakeTraceDecisions, 'test-feature-y');
  test('feature-level "decisions.md" resolves to "Decisions" via labelFromPath\'s SUBDIR_LABELS fallback branch', function() {
    assert.strictEqual(groupedDecisions.featureLevel.length, 1);
    assert.notStrictEqual(groupedDecisions.featureLevel[0].type, 'Feature Level');
    assert.strictEqual(groupedDecisions.featureLevel[0].type, 'Decisions');
  });
}

console.log('\n[cat-s4] AC2 -- unregistered document with no inferredGroup gets its own labeled bucket with a visible Unregistered pill');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [
      { path: 'stray-notes.md', type: 'feature-level', filename: 'stray-notes.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'test-feature-y');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'test-feature-y', {});
  test('rendered output contains a visible "Unregistered" pill', function() {
    assert.ok(html.indexOf('Unregistered') !== -1, 'expected "Unregistered" text in rendered output');
    assert.ok(html.indexOf('sw-pill') !== -1, 'expected the pill CSS class to be used');
  });
}

console.log('\n[cat-s4] AC2 -- unregistered artefact with an inferredGroup renders inside that inferred grouping, still flagged');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [
      { path: 'phase4-story-3-notes.md', type: 'feature-level', filename: 'phase4-story-3-notes.md', storySlug: null, divergence: 'unregistered', inferredGroup: 'phase4-story-3' },
      { path: 'phase4-story-3-plan.md', type: 'feature-level', filename: 'phase4-story-3-plan.md', storySlug: null, divergence: 'unregistered', inferredGroup: 'phase4-story-3' }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'phase4-fixture');
  test('both inferred-group artefacts land in the same synthetic story bucket', function() {
    var inferredBucket = grouped.flatStories.find(function(s) { return s.slug === 'phase4-story-3'; });
    assert.ok(inferredBucket, 'expected a synthetic story bucket keyed by the inferredGroup value');
    assert.strictEqual(inferredBucket.artefacts.length, 2);
  });
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'phase4-fixture', {});
  test('rendered output still shows Unregistered for the inferred-group artefacts', function() {
    assert.ok(html.indexOf('Unregistered') !== -1);
  });
}

console.log('\n[cat-s4] AC2 -- unregistered non-feature-level artefact with no story match and no inferredGroup lands in the shared "Unregistered" catch-all bucket');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [
      { path: 'dor/orphan.md', type: 'dor', filename: 'orphan.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'some-slug');
  var catchAllBucket = grouped.flatStories.find(function(s) { return s.slug === 'Unregistered'; });
  test('the orphaned dor/ artefact (not feature-level, no story match, no inferredGroup) lands in a flatStories bucket keyed "Unregistered"', function() {
    assert.ok(catchAllBucket, 'expected a flatStories bucket with slug "Unregistered"');
    assert.strictEqual(catchAllBucket.artefacts.length, 1);
    assert.ok(catchAllBucket.artefacts[0].path.indexOf('dor/orphan.md') !== -1);
  });
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'some-slug', {});
  test('rendered output still shows a visible "Unregistered" pill for the catch-all-bucket artefact', function() {
    assert.ok(html.indexOf('Unregistered') !== -1, 'expected "Unregistered" text in rendered output');
    assert.ok(html.indexOf('sw-pill') !== -1, 'expected the pill CSS class to be used');
  });
}

console.log('\n[cat-s4] Regression -- a "registered" artefact never renders an Unregistered pill');
{
  var fakeTraceRegistered = {
    status: 'found',
    epics: [],
    stories: [{ slug: 'clean-s1', name: 'Clean Story', epicSlug: null, divergence: 'registered' }],
    artefacts: [
      { path: 'dor/clean-s1-dor-contract.md', type: 'dor', filename: 'clean-s1-dor-contract.md', storySlug: 'clean-s1', divergence: 'registered', inferredGroup: null }
    ]
  };
  var groupedRegistered = mod._buildGroupedFromTrace(fakeTraceRegistered, 'clean-feature');
  var htmlRegistered = mod.renderGroupedArtefactIndexHtml(groupedRegistered, 'clean-feature', {});
  test('a divergence:"registered" artefact produces no "Unregistered" pill text anywhere in the rendered output', function() {
    assert.strictEqual(htmlRegistered.indexOf('Unregistered'), -1, 'did not expect "Unregistered" text for a fully-registered fixture, got: ' + htmlRegistered);
  });
  test('a divergence:"registered" artefact produces no sw-pill--neutral markup anywhere in the rendered output', function() {
    assert.strictEqual(htmlRegistered.indexOf('sw-pill--neutral'), -1, 'did not expect sw-pill--neutral class for a fully-registered fixture, got: ' + htmlRegistered);
  });
}

console.log('\n[cat-s4] AC3 -- orphaned-registration story shows a distinct gap state, not silently dropped');
{
  var fakeTrace = {
    status: 'found', epics: [],
    stories: [{ slug: 'ghost-s1', name: 'Ghost Story', divergence: 'orphaned-registration' }],
    artefacts: []
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'ghost-feature');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'ghost-feature', {});
  test('orphaned-registration story still appears in the rendered output', function() {
    assert.ok(html.indexOf('ghost-s1') !== -1, 'expected the orphaned story slug to appear');
  });
  test('orphaned-registration gap marker is distinct from the Unregistered pill text', function() {
    assert.ok(html.indexOf('Registered, but no files found') !== -1,
      'expected the exact gap-state message "Registered, but no files found", got HTML with no recognisable gap marker');
  });
}

console.log('\n[cat-s4] AC3 -- combined fixture: orphaned-registration gap state and Unregistered pill are textually distinguishable side by side');
{
  var fakeCombinedTrace = {
    status: 'found', epics: [],
    stories: [
      { slug: 'ghost-s2', name: 'Ghost Story Two', divergence: 'orphaned-registration' },
      { slug: 'clean-s2', name: 'Clean Story Two', divergence: 'registered' }
    ],
    artefacts: [
      { path: 'dor/clean-s2-dor-contract.md', type: 'dor', filename: 'clean-s2-dor-contract.md', storySlug: 'clean-s2', divergence: 'unregistered', inferredGroup: null }
    ]
  };
  var groupedCombined = mod._buildGroupedFromTrace(fakeCombinedTrace, 'combined-feature');
  var htmlCombined = mod.renderGroupedArtefactIndexHtml(groupedCombined, 'combined-feature', {});
  test('combined fixture renders both the orphaned-registration gap message and the Unregistered pill, using distinct, non-overlapping text', function() {
    assert.ok(htmlCombined.indexOf('Registered, but no files found') !== -1, 'expected the orphaned-registration gap message');
    assert.ok(htmlCombined.indexOf('Unregistered') !== -1, 'expected the Unregistered pill text');
    assert.strictEqual('Registered, but no files found'.indexOf('Unregistered'), -1, 'the two marker strings must not overlap as substrings');
  });
  test('combined fixture still shows both story slugs', function() {
    assert.ok(htmlCombined.indexOf('ghost-s2') !== -1, 'expected the orphaned story slug to appear');
    assert.ok(htmlCombined.indexOf('clean-s2') !== -1, 'expected the registered story slug to appear');
  });
}

console.log('\n[cat-s4] AC5 -- not-yet-synced feature shows a clear message, not a crash or empty page');
{
  var os = require('os');
  var unsyncedRoot = path.join(os.tmpdir(), 'wuce-unsynced-cat-s4-' + Date.now());
  var trace = mod._traceForRoute ? mod._traceForRoute(unsyncedRoot, 'any-slug') : require('../src/web-ui/adapters/artefact-trace').buildArtefactTrace(unsyncedRoot, 'any-slug');
  test('buildArtefactTrace itself returns not-yet-synced for this fixture', function() {
    assert.strictEqual(trace.status, 'not-yet-synced');
  });
}

console.log('\n[cat-s4] AC4 -- fully-registered, non-divergent feature renders byte-identical to the pre-cat-s4 golden fixture');
{
  var traceMod = require('../src/web-ui/adapters/artefact-trace');
  var trace = traceMod.buildArtefactTrace(REPO_ROOT, '2026-09-06-feature-artefact-document-matrix');
  var grouped = mod._buildGroupedFromTrace(trace, '2026-09-06-feature-artefact-document-matrix');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, '2026-09-06-feature-artefact-document-matrix', {});
  var fs = require('fs');
  var goldenPath = path.resolve(__dirname, 'fixtures', 'cat-s4-golden-fadm-output.html');
  test('golden fixture file exists (captured in Step 1 before this task changed anything)', function() {
    assert.ok(fs.existsSync(goldenPath), 'expected the golden fixture captured in Step 1 at ' + goldenPath);
  });
  test('current output matches the golden pre-cat-s4 fixture byte-for-byte', function() {
    if (!fs.existsSync(goldenPath)) return; // already flagged by the previous test
    var golden = fs.readFileSync(goldenPath, 'utf8');
    assert.strictEqual(html, golden);
  });
}

console.log('\n[cat-s4] NFR -- page render for phase4-scale (205 files) does not regress beyond the walk+classify budget');
{
  var traceMod = require('../src/web-ui/adapters/artefact-trace');
  var start = process.hrtime.bigint();
  var trace = traceMod.buildArtefactTrace(REPO_ROOT, '2026-04-19-skills-platform-phase4');
  var grouped = mod._buildGroupedFromTrace(trace, '2026-04-19-skills-platform-phase4');
  mod.renderGroupedArtefactIndexHtml(grouped, '2026-04-19-skills-platform-phase4', {});
  var elapsedMs = Number(process.hrtime.bigint() - start) / 1e6;
  test('walk + classify + adapt + render completes well under 100ms for 205 files (measured: ' + elapsedMs.toFixed(1) + 'ms)', function() {
    assert.ok(elapsedMs < 100, 'expected < 100ms, got ' + elapsedMs.toFixed(1) + 'ms');
  });
}

console.log('\n[cat-s4] NFR -- Unregistered indicator never relies on color alone (MC-A11Y-02)');
{
  var fakeTrace = {
    status: 'found', epics: [], stories: [],
    artefacts: [{ path: 'x.md', type: 'feature-level', filename: 'x.md', storySlug: null, divergence: 'unregistered', inferredGroup: null }]
  };
  var grouped = mod._buildGroupedFromTrace(fakeTrace, 'a11y-check');
  var html = mod.renderGroupedArtefactIndexHtml(grouped, 'a11y-check', {});
  test('the Unregistered pill carries visible text, not a color-only indicator', function() {
    assert.ok(/sw-pill[^>]*>[^<]*Unregistered/.test(html), 'expected visible "Unregistered" text inside the pill markup');
  });
}

console.log('\n[cat-s4] Results:', passed, 'passed,', failed, 'failed');
if (failed > 0) process.exit(1);
