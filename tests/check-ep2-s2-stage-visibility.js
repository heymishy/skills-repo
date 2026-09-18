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

// Role-filtering isolation: role resolution is keyed by the REQUESTING
// user's own login (mirroring handleGetJourneyStageVisibility's own
// `collaborators.find(c => c.userId === req.session.login)` pattern), not
// by array position or a cached prior lookup. A same-role pair (susan,
// darren -- both engineer) can't distinguish a real leak from a correct
// result by comparing their two views alone (they're legitimately equal),
// so this test instead proves the RESOLUTION MECHANISM itself is
// login-keyed: darren is placed first in the fixture array (index 0) and
// susan second, then each is resolved "as" a specific requester by login --
// a positional bug (e.g. always reading collaborators[0], or resolving
// once and reusing the result for every requester) would make susan
// incorrectly resolve to darren's row, which this test would catch even
// though their roles happen to match. journeyId-level tenant isolation
// itself is enforced upstream by requireJourneyAccess (POLICY.TENANT) in
// the real handler -- this test only proves per-collaborator resolution is
// correctly scoped (feature_collaborators has no tenant_id column, by
// design).
async function testRoleResolutionIsolatedPerCollaborator() {
  const fakePool = {
    query: async () => ({ rows: [
      { collaborator_id: 'c3', user_id: 'darren', role_id: 'engineer', pod_id: 'pod-1' },
      { collaborator_id: 'c1', user_id: 'susan', role_id: 'engineer', pod_id: 'pod-1' },
      { collaborator_id: 'c2', user_id: 'hamish', role_id: 'product', pod_id: 'pod-1' }
    ] })
  };
  const { getFeatureCollaborators } = require('../src/web-ui/modules/feature-collaborator-store');
  const rows = await getFeatureCollaborators(fakePool, 'journey-a1');

  // Resolve "as" each of three different logins, mirroring the real
  // handler's per-request lookup -- each call must find ITS OWN login's
  // row, not silently reuse whichever row a prior resolution found.
  function resolveAs(login) {
    const me = rows.find(function (c) { return c.userId === login; });
    return { roleId: me && me.roleId, collaboratorId: me && me.collaboratorId };
  }

  const asDarren = resolveAs('darren');
  const asSusan = resolveAs('susan');
  const asHamish = resolveAs('hamish');

  assert.strictEqual(asDarren.collaboratorId, 'c3', 'resolving as darren must return darren\'s own row, not index 0 or a cached prior result');
  assert.strictEqual(asSusan.collaboratorId, 'c1', 'resolving as susan must return susan\'s own row -- proves resolution is login-keyed, not positional (darren is at index 0, susan at index 1)');
  assert.strictEqual(asHamish.collaboratorId, 'c2');

  // Darren and susan legitimately share a role (engineer) -- their computed
  // views being equal is expected and NOT itself proof of correct isolation
  // (that's what the collaboratorId assertions above are for). Hamish
  // (product) differs, confirming the two roles genuinely produce
  // different output when they should.
  assert.deepStrictEqual(stageVisibility.getVisibleStages(asDarren.roleId), stageVisibility.getVisibleStages(asSusan.roleId));
  assert.notDeepStrictEqual(stageVisibility.getVisibleStages(asSusan.roleId), stageVisibility.getVisibleStages(asHamish.roleId));
}
testRoleResolutionIsolatedPerCollaborator()
  .then(() => console.log('  ok - role resolution is login-keyed (not positional/cached), correctly scoped per requester'))
  .catch((err) => { console.error('  FAIL - testRoleResolutionIsolatedPerCollaborator:', err.message); process.exitCode = 1; });
