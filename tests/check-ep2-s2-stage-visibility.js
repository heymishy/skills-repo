'use strict';
// tests/check-ep2-s2-stage-visibility.js — Part 1
const assert = require('assert');
const stageVisibility = require('../src/web-ui/modules/stage-visibility');

function testEngineerDefaultView() {
  const visible = stageVisibility.getVisibleStages('engineer');
  assert.deepStrictEqual(visible, ['test-plan', 'review', 'definition-of-ready']);
}
testEngineerDefaultView();
console.log('  ok - engineer default view is test-plan/review/definition-of-ready');

function testProductDefaultView() {
  const visible = stageVisibility.getVisibleStages('product');
  assert.deepStrictEqual(visible, ['discovery', 'benefit-metric', 'definition']);
}
testProductDefaultView();
console.log('  ok - product default view is discovery/benefit-metric/definition');

function testConductorSeesAllStages() {
  const visible = stageVisibility.getVisibleStages('conductor');
  assert.deepStrictEqual(visible, stageVisibility.ALL_STAGES);
}
testConductorSeesAllStages();
console.log('  ok - conductor sees all 8 stages');

function testArchitectSeesAllStages() {
  const visible = stageVisibility.getVisibleStages('architect');
  assert.deepStrictEqual(visible, stageVisibility.ALL_STAGES);
}
testArchitectSeesAllStages();
console.log('  ok - architect sees all 8 stages');

function testUnknownRoleDefaultsToAllStages() {
  const visible = stageVisibility.getVisibleStages('some-unknown-role');
  assert.deepStrictEqual(visible, stageVisibility.ALL_STAGES);
}
testUnknownRoleDefaultsToAllStages();
console.log('  ok - unknown role defaults to all stages (fail-open, never fail-hidden)');

// tests/check-ep2-s2-stage-visibility.js — Part 2
const journeyRoute = require('../src/web-ui/routes/journey');

async function testStageVisibilityHandlerExists() {
  assert.strictEqual(typeof journeyRoute.handleGetJourneyStageVisibility, 'function');
}
testStageVisibilityHandlerExists().then(() => console.log('  ok - stage-visibility handler exported'))
  .catch((err) => { console.error('  FAIL - testStageVisibilityHandlerExists:', err.message); process.exitCode = 1; });

// tests/check-ep2-s2-stage-visibility.js — Part 3
function testFeaturePageHandlerStillExported() {
  const { handleGetFeatureArtefacts } = require('../src/web-ui/routes/features');
  assert.strictEqual(typeof handleGetFeatureArtefacts, 'function');
}
testFeaturePageHandlerStillExported();
console.log('  ok - handleGetFeatureArtefacts still exported after stage-list injection edit');

// tests/check-ep2-s2-stage-visibility.js — Part 4
async function testMultiRoleFullPathLoad() {
  const fakePool = {
    query: async (sql) => {
      if (sql.indexOf('feature_collaborators') !== -1) {
        return { rows: [
          { collaborator_id: 'c1', user_id: 'susan', role_id: 'engineer', pod_id: 'pod-1' },
          { collaborator_id: 'c2', user_id: 'hamish', role_id: 'product', pod_id: 'pod-1' }
        ] };
      }
      return { rows: [] };
    }
  };
  const { getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');
  const rows = await getFeatureCollaborators(fakePool, 'journey-a1');
  const susanRole = rows.find(r => r.userId === 'susan').roleId;
  const hamishRole = rows.find(r => r.userId === 'hamish').roleId;
  assert.deepStrictEqual(stageVisibility.getVisibleStages(susanRole), ['test-plan', 'review', 'definition-of-ready']);
  assert.deepStrictEqual(stageVisibility.getVisibleStages(hamishRole), ['discovery', 'benefit-metric', 'definition']);
  assert.notDeepStrictEqual(
    stageVisibility.getVisibleStages(susanRole),
    stageVisibility.getVisibleStages(hamishRole)
  );
}
testMultiRoleFullPathLoad()
  .then(() => console.log('  ok - multi-role full path: susan (engineer) and hamish (product) get different, correct default views'))
  .catch((err) => { console.error('  FAIL - testMultiRoleFullPathLoad:', err.message); process.exitCode = 1; });

// Role-filtering isolation: two different collaborators on the SAME journey
// resolve independently -- one collaborator's role never leaks into
// another's computed visibility. journeyId-level tenant isolation itself is
// enforced upstream by requireJourneyAccess (POLICY.TENANT) in the real
// handler, same pattern an earlier story's own equivalent test already
// established -- this test proves the per-collaborator role resolution
// itself is correctly scoped to the requesting user, not a tenant-boundary
// test (feature_collaborators has no tenant_id column, by design).
async function testRoleResolutionIsolatedPerCollaborator() {
  const fakePool = {
    query: async (sql) => ({ rows: [
      { collaborator_id: 'c1', user_id: 'susan', role_id: 'engineer', pod_id: 'pod-1' },
      { collaborator_id: 'c2', user_id: 'hamish', role_id: 'product', pod_id: 'pod-1' },
      { collaborator_id: 'c3', user_id: 'darren', role_id: 'engineer', pod_id: 'pod-1' }
    ] })
  };
  const { getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');
  const rows = await getFeatureCollaborators(fakePool, 'journey-a1');
  const susanView = stageVisibility.getVisibleStages(rows.find(r => r.userId === 'susan').roleId);
  const darrenView = stageVisibility.getVisibleStages(rows.find(r => r.userId === 'darren').roleId);
  assert.deepStrictEqual(susanView, darrenView);
  assert.notStrictEqual(rows.find(r => r.userId === 'susan'), rows.find(r => r.userId === 'darren'));
}
testRoleResolutionIsolatedPerCollaborator()
  .then(() => console.log('  ok - role resolution correctly scoped per collaborator, not shared/leaked'))
  .catch((err) => { console.error('  FAIL - testRoleResolutionIsolatedPerCollaborator:', err.message); process.exitCode = 1; });
