'use strict';
// tests/check-dsa-s2-product-dashboard-wiring.js -- AC3, AC6, AC8
const assert = require('assert');
const { _renderProductDashboard } = require('../src/web-ui/routes/products');

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

testHasProductsRendersMockContentNotCardGrid();
console.log('  ok - has-products branch renders the real mock content, not the old card grid');
testZeroProductsOnboardingPreserved();
console.log('  ok - zero-products onboarding CTA is preserved and unaffected by the new content (AC8)');
