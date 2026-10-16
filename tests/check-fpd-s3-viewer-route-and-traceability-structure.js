'use strict';
// check-fpd-s3-viewer-route-and-traceability-structure.js -- TDD tests for fpd-s3
// (2026-10-07-feature-playback-demo-with-video-and-or-screens-).
// Story: artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s3-viewer-route-and-traceability-structure.md
const assert = require('assert');
const path = require('path');

function makeRes() {
  const state = { status: 200, body: '' };
  return {
    writeHead: function (code) { state.status = code; },
    end: function (body) { state.body = body || ''; },
    _get: function () { return state; },
  };
}

let passed = 0; let failed = 0;
function pass(name) { console.log(`  [PASS] ${name}`); passed++; }
function fail(name, err) { console.error(`  [FAIL] ${name}: ${err.message || err}`); failed++; }

(async function () {

// AC1 (unit) + AC5 (unit): viewer lists only DoD-validated features with a playback package
(function () {
  const { listPlaybackFeatures } = require('../src/web-ui/routes/playback');
  const state = {
    features: [
      { slug: 'has-package', name: 'Has Package' },
      { slug: 'no-package', name: 'No Package' },
    ],
  };
  const fakeExistsSync = (p) => p.includes('has-package') && p.includes('walkthrough.md');
  try {
    const result = listPlaybackFeatures('/repo', state, fakeExistsSync);
    assert.strictEqual(result.length, 1, 'expected exactly 1 feature listed');
    assert.strictEqual(result[0].slug, 'has-package');
    pass('AC1+AC5 (unit): viewer lists only DoD-validated features with a playback package');
  } catch (e) { fail('AC1+AC5 (unit): viewer lists only DoD-validated features with a playback package', e); }
})();

// AC2 (unit): review page opens with the scope/benefit summary, not re-authored
(function () {
  const { extractMarkdownSection } = require('../src/web-ui/routes/playback');
  const { parseBenefitMetricTargets } = require('../scripts/playback-capture');
  const discoveryContent = [
    '# Discovery: Thing', '', '## Problem statement', '', 'Engineers waste time doing X by hand.', '',
    '## Who it affects', '', 'Everyone.',
  ].join('\n');
  const benefitMetricContent = [
    '### Metric 1: Widget load time', '', '| Field | Value |', '|----|----|', '| **Target** | ≤500ms p95 |',
    '### Metric 2: Setup time', '', '| Field | Value |', '|----|----|', '| **Target** | ≤10min |',
  ].join('\n');
  try {
    const problemStatement = extractMarkdownSection(discoveryContent, 'Problem statement');
    assert.strictEqual(problemStatement, 'Engineers waste time doing X by hand.');
    const targets = parseBenefitMetricTargets(benefitMetricContent);
    assert.strictEqual(targets['Widget load time'], '≤500ms p95');
    assert.strictEqual(targets['Setup time'], '≤10min');
    pass('AC2 (unit): review page scope/benefit summary sourced verbatim, not re-authored');
  } catch (e) { fail('AC2 (unit): review page scope/benefit summary', e); }
})();

// AC3 (unit) + AC4 (unit): per-story AC sections, sourced from the DoD table, real epic/story order
(function () {
  const { buildFeaturePlaybackStructure } = require('../src/web-ui/routes/playback');
  const path = require('path');
  const store = {};
  // Fixture: 2 epics, story slugs chosen so alphabetical order would differ
  // from pipeline-state.json's own real array order (AC4's own deliberate check).
  const state = {
    features: [{
      slug: 'f1',
      epics: [
        { slug: 'epic-z', name: 'Epic Z (first in real order)', stories: [{ slug: 'story-z', name: 'Story Z' }] },
        { slug: 'epic-a', name: 'Epic A (second in real order)', stories: [{ slug: 'story-a', name: 'Story A' }] },
      ],
    }],
  };
  store[path.join('/repo', '.github', 'pipeline-state.json')] = JSON.stringify(state);
  const dodZ = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — Z does a thing | ✅ | Z evidence | Automated test | None |'].join('\n');
  const dodA = ['## AC Coverage', '', '| AC | Satisfied? | Evidence | Verification method | Deviation |', '|----|----|----|----|----|',
    '| AC1 — A does a thing | ✅ | A evidence | Automated test | None |'].join('\n');
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 'story-z-dod.md')] = dodZ;
  store[path.join('/repo', 'artefacts', 'f1', 'dod', 'story-a-dod.md')] = dodA;
  const fakeFs = {
    existsSync: (p) => p === '/repo' || Object.prototype.hasOwnProperty.call(store, p) || p === path.join('/repo', 'artefacts', 'f1'),
    readdirSync: (dir, opts) => {
      if (dir === path.join('/repo', 'artefacts', 'f1')) return [{ name: 'dod', isDirectory: () => true, isFile: () => false }];
      if (dir === path.join('/repo', 'artefacts', 'f1', 'dod')) return [
        { name: 'story-z-dod.md', isDirectory: () => false, isFile: () => true },
        { name: 'story-a-dod.md', isDirectory: () => false, isFile: () => true },
      ];
      return [];
    },
    readFileSync: (p) => {
      if (store[p] !== undefined) return store[p];
      throw new Error('ENOENT: ' + p);
    },
  };
  try {
    const structure = buildFeaturePlaybackStructure('/repo', 'f1', fakeFs);
    assert.strictEqual(structure.stories.length, 2, 'expected 2 stories');
    assert.strictEqual(structure.stories[0].slug, 'story-z', 'expected story-z first -- real pipeline-state.json order, not alphabetical');
    assert.strictEqual(structure.stories[1].slug, 'story-a', 'expected story-a second');
    assert.strictEqual(structure.stories[0].acRows[0].description, 'Z does a thing', 'expected AC text sourced verbatim from the DoD table');
    assert.strictEqual(structure.stories[1].acRows[0].description, 'A does a thing');
    pass('AC3+AC4 (unit): per-story AC sections from the DoD table, real epic/story order preserved');
  } catch (e) { fail('AC3+AC4 (unit): per-story AC sections', e); }
})();

// ADR-028 compliance (integration): one canonical traversal, reused not re-derived
(function () {
  const fsNode = require('fs');
  try {
    const source = fsNode.readFileSync(require.resolve('../src/web-ui/routes/playback'), 'utf8');
    assert.ok(/require\(['"]\.\.\/adapters\/artefact-trace['"]\)/.test(source), 'expected playback.js to call buildArtefactTrace, not re-derive its own feature/epic/story traversal');
    assert.ok(!/\(feature\.epics\s*\|\|\s*\[\]\)\.forEach/.test(source), 'expected no second independent epics[].forEach traversal in playback.js');
    pass('ADR-028 compliance (integration): playback.js reuses buildArtefactTrace, no second derivation');
  } catch (e) { fail('ADR-028 compliance (integration)', e); }
})();

// Rendering (unit): list HTML and review-page HTML contain the expected content
(function () {
  const { renderPlaybackListHtml, renderPlaybackReviewHtml } = require('../src/web-ui/routes/playback');
  try {
    const listHtml = renderPlaybackListHtml([{ slug: 'f1', name: 'Feature One' }]);
    assert.ok(listHtml.includes('Feature One'), 'expected feature name in list HTML');
    assert.ok(listHtml.includes('/playback/f1'), 'expected a link to the review page');

    const reviewHtml = renderPlaybackReviewHtml('f1', 'Engineers waste time doing X.', { 'Widget load time': '≤500ms p95' }, {
      epics: [{ slug: 'e1', name: 'Epic One' }],
      stories: [{ slug: 's1', name: 'Story One', epicSlug: 'e1', acRows: [{ acId: 'AC1', description: 'Thing works', evidence: 'proof' }] }],
    });
    assert.ok(reviewHtml.includes('Engineers waste time doing X.'), 'expected verbatim problem statement in review HTML');
    assert.ok(reviewHtml.includes('≤500ms p95'), 'expected verbatim metric target in review HTML');
    assert.ok(reviewHtml.includes('Story One'), 'expected story section');
    assert.ok(reviewHtml.includes('Thing works'), 'expected AC text from the DoD table');
    pass('Rendering (unit): list and review-page HTML contain expected content');
  } catch (e) { fail('Rendering (unit): list and review-page HTML', e); }
})();

// Route/handler E2E coverage check (verify-completion mandatory): dispatch-
// level integration test exercising the REAL handleGetPlaybackList/
// handleGetPlaybackReview handlers (auth-free here -- authGuard wraps auth
// at server.js dispatch, not inside the handler, so this does not need to
// re-test authGuard itself) against a synthetic-but-real repoRoot written to
// disk under os.tmpdir() -- the same precedent cat-s4's own AC5 route-level
// test established for handleGetFeatureArtefacts. This feature's own real
// repo has no feature with an actual playback/walkthrough.md yet (fpd-s1's
// own capture was never really run, only unit-tested -- same D5 gap), so a
// synthetic root with real files is the only way to exercise the real file-
// reading code paths without depending on production data that doesn't
// exist. Proves the whole real pipeline (real pipeline-state.json -> real
// buildArtefactTrace -> real DoD file -> real parseDodAcCoverage -> real
// renderShellWithNav with a stubbed pool) end to end, in-process, with no
// live Postgres required.
await (async function () {
  const fsNode = require('fs');
  const os = require('os');
  const routes = require('../src/web-ui/routes/playback');
  const repoRootModule = require('../src/web-ui/adapters/repo-root');
  const FEATURE_SLUG = 'fpd-s3-route-fixture';
  const tmpRoot = fsNode.mkdtempSync(path.join(os.tmpdir(), 'fpd-s3-route-test-'));
  const featureDir = path.join(tmpRoot, 'artefacts', FEATURE_SLUG);
  fsNode.mkdirSync(path.join(tmpRoot, '.github'), { recursive: true });
  fsNode.mkdirSync(path.join(featureDir, 'playback'), { recursive: true });
  fsNode.mkdirSync(path.join(featureDir, 'dod'), { recursive: true });
  fsNode.writeFileSync(path.join(featureDir, 'playback', 'walkthrough.md'), '# Walkthrough\n');
  fsNode.writeFileSync(path.join(featureDir, 'discovery.md'), '## Problem statement\n\nReal engineers waste real time.\n\n## Who it affects\n\nEveryone.\n');
  fsNode.writeFileSync(path.join(featureDir, 'benefit-metric.md'), '### Metric 1: Real widget speed\n\n| Field | Value |\n|----|----|\n| **Target** | fast |\n');
  fsNode.writeFileSync(path.join(featureDir, 'dod', 's1-dod.md'),
    '## AC Coverage\n\n| AC | Satisfied? | Evidence | Verification method | Deviation |\n|----|----|----|----|----|\n| AC1 — real thing works | ✅ | real evidence text | Automated test | None |\n'
  );
  fsNode.writeFileSync(path.join(tmpRoot, '.github', 'pipeline-state.json'), JSON.stringify({
    features: [{
      slug: FEATURE_SLUG,
      name: 'Fixture Feature',
      epics: [{ slug: 'e1', name: 'Fixture Epic', stories: [{ slug: 's1', name: 'Fixture Story' }] }],
    }],
  }));

  const pool = { query: function () { return Promise.resolve({ rows: [] }); } };
  const req = { session: { accessToken: 'tok', login: 'user', tenantId: 't1' } };

  repoRootModule.setRepoRoot(tmpRoot);
  try {
    const listRes = makeRes();
    await routes.handleGetPlaybackList(req, listRes, pool);
    assert.ok(listRes._get().body.includes(`/playback/${encodeURIComponent(FEATURE_SLUG)}`), 'expected the list page to link to the fixture feature\'s own review page');

    const reviewRes = makeRes();
    await routes.handleGetPlaybackReview(req, reviewRes, FEATURE_SLUG, pool);
    const reviewBody = reviewRes._get().body;
    assert.ok(reviewBody.includes('Real engineers waste real time.'), 'expected the real discovery.md problem statement text in the rendered review page');
    assert.ok(reviewBody.includes('fast'), 'expected a real benefit-metric.md metric target in the rendered review page');
    assert.ok(reviewBody.includes('Fixture Story'), 'expected the real story section in the rendered review page');
    assert.ok(reviewBody.includes('real thing works'), 'expected the real DoD AC text in the rendered review page');
    pass('Route/handler (integration): real handlers render real files on disk end to end, no mocked fs');
  } catch (e) {
    fail('Route/handler (integration): real handlers render real files on disk end to end', e);
  } finally {
    repoRootModule.setRepoRoot(null);
    fsNode.rmSync(tmpRoot, { recursive: true, force: true });
  }
})();

console.log(`\n[fpd-s3-viewer-route-and-traceability-structure] Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);

})();
