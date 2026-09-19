'use strict';
// tests/check-dsa-s2-product-dashboard-wiring.js -- AC3, AC5, AC6, AC7, AC8
const assert = require('assert');
const { _renderProductDashboard, handleGetDashboard } = require('../src/web-ui/routes/products');
const { setValidateRepositoryAccess, setGetArtefactDescriptors, setFetchArtefact } = require('../src/web-ui/adapters/action-queue');
const repoRootAdapter = require('../src/web-ui/adapters/repo-root');
const journeyStore = require('../src/web-ui/modules/journey-store');

// dsa-s2 Task 2 -- getPendingActions() reads its repo list from this env var
// (config/repo-list.js), matching tests/check-wuce5-action-queue.js's own
// established fixture convention. Without at least one repo, getPendingActions
// short-circuits to an empty items list regardless of the injected fakes below.
process.env.WUCE_REPOSITORIES = 'testorg/dsa-s2-repo';

function testHasProductsRendersMockContentNotCardGrid() {
  const products = [{ product_id: 'p1', name: 'Product One', featureCount: 3, lastUpdated: '2026-09-01T00:00:00.000Z' }];
  const html = _renderProductDashboard(products, 'tester', products, null, 0, false, false, null);
  assert.ok(html.includes('Run a skill'), 'expected the real renderDashboard section header');
  assert.ok(html.includes('sw-skill-grid'), 'expected the real skill-card grid');
}

function testZeroProductsOnboardingPreserved() {
  const html = _renderProductDashboard([], 'tester', [], null, 0, false, false, null);
  assert.ok(html.includes('Create your first product'), 'the zero-products onboarding CTA must still render exactly as it does today (AC8)');
  assert.ok(!html.includes('Run a skill'), 'the new mock content must NOT appear on the zero-products onboarding path');
}

// ── Task 2 fixtures ──────────────────────────────────────────────────────

// Must return at least one product row -- handleGetDashboard's
// products.length === 0 branch (AC8's zero-products onboarding CTA) renders
// none of the mock content this test asserts against.
function makePool() {
  return {
    query: async function(sql) {
      if (/SELECT product_id, name, created_at FROM products/.test(sql)) {
        return { rows: [{ product_id: 'p1', name: 'Acme', created_at: '2026-09-01T00:00:00.000Z' }] };
      }
      return { rows: [] };
    }
  };
}

function makeRes() {
  var html = null;
  return { html: function() { return html; }, writeHead: function() {}, end: function(b) { html = b; } };
}

/**
 * dsa-s2 Task 2 (AC5, AC7): handleGetDashboard -- dispatched with a fake
 * getPendingActions() (via action-queue.js's own real injectable seams, no
 * new seam added in products.js) and a real in-memory journey -- must render
 * the REAL mapped pending-action text and REAL derived recent-session
 * content, not the Task 1 `0`/`[]` placeholders.
 */
async function testRealPendingActionsAndJourneyDataRenderOnDashboard() {
  setValidateRepositoryAccess(async function() { return true; });
  setGetArtefactDescriptors(async function() {
    return [{
      path: 'artefacts/2026-09-01-dsa-test-feature/dor/dtf.1-dor.md',
      featureName: 'DSA Test Feature',
      artefactType: 'Discovery',
      featureSlug: '2026-09-01-dsa-test-feature',
      createdAt: '2026-09-01T00:00:00Z',
      artefactUrl: '/features/2026-09-01-dsa-test-feature/discovery'
    }];
  });
  // No "## Approved by" section -- hasPendingSignOff() treats this as pending.
  setFetchArtefact(async function() { return '# Discovery\n\nNo sign-off section here.\n'; });

  var journeySlug = 'dsa-s2-test-journey-' + Date.now();
  var journey = journeyStore.createJourney(journeySlug, 'default');
  journeyStore.completeStage(journey.journeyId, 'discovery', 'artefacts/' + journeySlug + '/discovery.md');

  var req = { session: { userId: 42, login: 'pending-tester', tenantId: null, accessToken: 'tok' }, query: {} };
  var res = makeRes();
  var pool = makePool();
  await handleGetDashboard(req, res, null, pool);
  var html = res.html();

  // AC5 -- real pending item (_mapPendingActionsForDashboard's 'Sign off ' + artefactType, + real featureName), not the '0'/'[]' placeholder.
  assert.ok(html.includes('Sign off Discovery'), 'expected the real mapped pending-action text, not a placeholder');
  assert.ok(html.includes('DSA Test Feature'), 'expected the real pending-action feature name to render');
  assert.ok(!html.includes('Nothing waiting.'), 'the "Nothing waiting." empty state must not render when a real pending item exists');

  // AC7 -- real derived recent-session content from the real completed stage.
  assert.ok(html.includes('discovery'), 'expected the real completed-stage skill name to render in Recent sessions');
  assert.ok(html.includes(journeySlug), 'expected the real journey feature slug to render in Recent sessions');
  assert.ok(!html.includes('No recent sessions.'), 'the "No recent sessions." empty state must not render when a real completed stage exists');
}

async function main() {
  testHasProductsRendersMockContentNotCardGrid();
  console.log('  ok - has-products branch renders the real mock content, not the old card grid');
  testZeroProductsOnboardingPreserved();
  console.log('  ok - zero-products onboarding CTA is preserved and unaffected by the new content (AC8)');
  await testRealPendingActionsAndJourneyDataRenderOnDashboard();
  console.log('  ok - real pending-actions and journey-derived data render on the dashboard, not Task 1 placeholders (AC5, AC7)');
}

main().catch(function(err) {
  console.error('FAIL:', err.message);
  process.exitCode = 1;
});
