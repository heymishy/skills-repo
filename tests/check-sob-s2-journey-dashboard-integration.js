'use strict';
// check-sob-s2-journey-dashboard-integration.js — sob-s2
//
// Integration tests for wiring sob-s1's deriveSessionOrigin (already merged,
// exported from src/web-ui/routes/features.js) into /journey's
// _renderJourneyHome card template. Covers AC1-AC5 from
// artefacts/2026-09-08-session-origin-badge/stories/sob-s2-journey-dashboard-indicator.md.
//
// deriveSessionOrigin's own internal tri-state logic is already unit-tested
// in sob-s1-test-plan.md -- this file only covers the new call site wiring
// it into /journey's rendering (per this story's own test plan, "Coverage
// gaps: None").

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { deriveSessionOrigin } = require('../src/web-ui/routes/features.js');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}
async function testAsync(name, fn) {
  try { await fn(); console.log('  ✓ ' + name); passed++; }
  catch (e) { console.log('  ✗ ' + name); console.log('      ' + e.message); failed++; }
}

// sob-s2: the exact mapping this story adds to _renderJourneyHome's card
// loop -- extracted here as a small pure helper so it can be unit-tested
// directly, matching sob-s1's own AC9-contract-testing precedent.
function journeyCardSessionOrigin(j) {
  return deriveSessionOrigin({
    hasJourney: Array.isArray(j.completedStages),
    completedStages: j.completedStages || []
  });
}

console.log('\n[sob-s2] Unit-level mapping helper (isolated from real journey.js wiring)');

console.log('\n[sob-s2] AC1 -- real journey, fully session-backed');
test('real journey with all completedStages carrying sessionId returns fully-session-backed', function() {
  const j = { completedStages: [{ sessionId: 's1' }, { sessionId: 's2' }] };
  assert.strictEqual(journeyCardSessionOrigin(j), 'fully-session-backed');
});

console.log('\n[sob-s2] AC2 -- real journey, mixed');
test('real journey with partial sessionId coverage returns mixed', function() {
  const j = { completedStages: [{ sessionId: 's1' }, { sessionId: null }] };
  assert.strictEqual(journeyCardSessionOrigin(j), 'mixed');
});

console.log('\n[sob-s2] AC3 -- synthesized entry (no completedStages property at all) returns no-session');
test('a synthesized _mergeStateFeaturesIntoJourneyList-shaped entry returns no-session, does not throw', function() {
  const synthesized = { featureSlug: 'some-cli-feature', currentStage: 'definition', productProfile: 'default', createdAt: '2026-09-01', stages: {} };
  // no .completedStages property at all -- this is the exact real shape
  assert.strictEqual(journeyCardSessionOrigin(synthesized), 'no-session');
});

console.log('\n[sob-s2] AC4 -- real journey, zero completed stages, returns null (no indicator)');
test('real journey with completedStages: [] returns null', function() {
  const j = { completedStages: [] };
  assert.strictEqual(journeyCardSessionOrigin(j), null);
});

console.log('\n--- sob-s2 unit-level mapping results (partial -- render-level tests follow) ---');
console.log('Passed so far:', passed, ' Failed so far:', failed);

// ---------------------------------------------------------------------------
// Render-level assertions (the real RED step) -- exercise the actual wiring
// inside _renderJourneyHome / handleGetJourney, not the isolated helper above.
// ---------------------------------------------------------------------------

const journeyRoutes = require('../src/web-ui/routes/journey.js');

function mockReq(overrides) {
  return Object.assign({
    session: { accessToken: 'tok-sob-s2', userId: '1', login: 'sob-s2-tester', tenantId: 't-sob-s2' },
    params: {},
    query: {},
    body: {},
    url: '/'
  }, overrides || {});
}

function mockRes() {
  let _statusCode = null;
  let _body = '';
  return {
    writeHead: function (code) { _statusCode = code; return this; },
    end: function (body) { if (body != null) _body = body; },
    _get: function () { return { statusCode: _statusCode, body: _body }; }
  };
}

(async () => {

console.log('\n[sob-s2] AC1 (render-level) -- fully session-backed journey card');
await testAsync('a fully session-backed real journey renders data-sob-session-origin="fully-session-backed"', async function() {
  const html = journeyRoutes._renderJourneyHome({
    journeys: [{
      featureSlug: 'sob-s2-ac1-fixture',
      currentStage: 'definition',
      productProfile: 'default',
      createdAt: '2026-09-08T00:00:00.000Z',
      completedStages: [{ skillName: 'discovery', sessionId: 's1' }, { skillName: 'benefit-metric', sessionId: 's2' }]
    }]
  });
  assert.ok(html.indexOf('data-sob-session-origin="fully-session-backed"') !== -1, 'expected fully-session-backed indicator in rendered HTML');
});

await testAsync('sob-s4: the badge carries the sw-pill--neutral tone modifier, not just sw-pill sw-pill--nodot', async function() {
  const html = journeyRoutes._renderJourneyHome({
    journeys: [{
      featureSlug: 'sob-s4-tone-fixture',
      currentStage: 'definition',
      productProfile: 'default',
      createdAt: '2026-09-08T00:00:00.000Z',
      completedStages: [{ skillName: 'discovery', sessionId: 's1' }]
    }]
  });
  assert.ok(html.indexOf('class="sw-pill sw-pill--nodot sw-pill--neutral"') !== -1,
    'expected the session-origin badge to carry sw-pill--neutral so it actually gets a background colour');
});

console.log('\n[sob-s2] AC2 (render-level) -- mixed journey card');
await testAsync('a mixed real journey renders data-sob-session-origin="mixed"', async function() {
  const html = journeyRoutes._renderJourneyHome({
    journeys: [{
      featureSlug: 'sob-s2-ac2-fixture',
      currentStage: 'definition',
      productProfile: 'default',
      createdAt: '2026-09-08T00:00:00.000Z',
      completedStages: [{ skillName: 'discovery', sessionId: 's1' }, { skillName: 'benefit-metric', sessionId: null }]
    }]
  });
  assert.ok(html.indexOf('data-sob-session-origin="mixed"') !== -1, 'expected mixed indicator in rendered HTML');
});

console.log('\n[sob-s2] AC3 (render-level) -- synthesized entry card');
await testAsync('a synthesized entry (no completedStages property) renders data-sob-session-origin="no-session" without throwing', async function() {
  const synthesized = {
    featureSlug: 'sob-s2-ac3-fixture',
    currentStage: 'definition',
    productProfile: 'default',
    createdAt: '2026-09-08',
    stages: {}
    // deliberately no .completedStages property -- matches
    // _mergeStateFeaturesIntoJourneyList's real synthesized shape
  };
  let html;
  assert.doesNotThrow(function() {
    html = journeyRoutes._renderJourneyHome({ journeys: [synthesized] });
  }, 'rendering a synthesized entry must not throw');
  assert.ok(html.indexOf('data-sob-session-origin="no-session"') !== -1, 'expected no-session indicator in rendered HTML');
});

console.log('\n[sob-s2] AC4 (render-level) -- real journey, zero completed stages, no indicator');
await testAsync('a real journey with completedStages: [] renders NO data-sob-session-origin element at all', async function() {
  const html = journeyRoutes._renderJourneyHome({
    journeys: [{
      featureSlug: 'sob-s2-ac4-fixture',
      currentStage: 'ideate',
      productProfile: 'default',
      createdAt: '2026-09-08T00:00:00.000Z',
      completedStages: []
    }]
  });
  assert.ok(html.indexOf('data-sob-session-origin') === -1, 'expected NO session-origin element for a zero-completed-stages journey, found one');
});

console.log('\n[sob-s2] AC5 -- no new query introduced (call-count check on listJourneys / _mergeStateFeaturesIntoJourneyList)');
await testAsync('listJourneys and _mergeStateFeaturesIntoJourneyList are each still called exactly once per /journey render', async function() {
  const realJourneyStore = require('../src/web-ui/modules/journey-store');
  const realMerge = journeyRoutes._mergeStateFeaturesIntoJourneyList;
  let listJourneysCallCount = 0;
  let mergeCallCount = 0;

  const scratchRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sob-s2-ac5-'));
  // No pipeline-state.json written -- _mergeStateFeaturesIntoJourneyList
  // still runs (and its call is still counted) even when the file is
  // absent; it just gracefully returns the input list unchanged (ep1-s1
  // precedent, "graceful degradation: missing pipeline-state.json does not
  // throw").

  const originalRepoRoot = scratchRoot; // captured for restoration below
  journeyRoutes.setRepoRoot(scratchRoot);
  journeyRoutes.setJourneyStoreModule({
    listJourneys: function() {
      listJourneysCallCount++;
      return [{
        featureSlug: 'sob-s2-ac5-fixture',
        currentStage: 'definition',
        productProfile: 'default',
        createdAt: '2026-09-08T00:00:00.000Z',
        completedStages: [{ skillName: 'discovery', sessionId: 's1' }],
        productId: null
      }];
    }
  });
  // Inject a counting spy through the injectable seam (setMergeStateFeaturesIntoJourneyList,
  // mirroring setJourneyStoreModule) that delegates to the real implementation
  // so the render stays genuine -- the actual merge still happens, this only
  // observes how many times it was invoked.
  journeyRoutes.setMergeStateFeaturesIntoJourneyList(function(journeys, repoRoot) {
    mergeCallCount++;
    return realMerge(journeys, repoRoot);
  });

  try {
    const req = mockReq({});
    const res = mockRes();
    await journeyRoutes.handleGetJourney(req, res, null, null);
    const result = res._get();

    assert.strictEqual(result.statusCode, 200, 'expected a 200 render, got: ' + result.statusCode);
    assert.strictEqual(listJourneysCallCount, 1, 'listJourneys should be called exactly once per render, was called ' + listJourneysCallCount + ' times');
    assert.strictEqual(mergeCallCount, 1, '_mergeStateFeaturesIntoJourneyList should be called exactly once per render, was called ' + mergeCallCount + ' times');
  } finally {
    // restore real adapters so this test file has no side effects on any
    // other check-*.js file run in the same process by scripts/run-all-tests.js
    journeyRoutes.setJourneyStoreModule(realJourneyStore);
    journeyRoutes.setMergeStateFeaturesIntoJourneyList(null);
    journeyRoutes.setRepoRoot(null);
  }
});

console.log('\n--- sob-s2 full results ---');
console.log('Passed:', passed, ' Failed:', failed);
process.exit(failed > 0 ? 1 : 0);

})();
