// tests/e2e/fixtures/product-repo.js
// lpw-s1: shared fixture for the das-s2 "Connect a repo to get started" gate.
//
// A product with no connected repository cannot start its first feature: POST /products/:id/features answers
// 409. The real way to connect one needs a real GitHub token, which the synthetic withAuth session does not have,
// so the test server (NODE_ENV=test) exposes /test/seed-product-repo (src/web-ui/server.js), which writes the same
// end state (repo_provider/repo_owner/repo_name on the product row). Specs that create a product and then start a
// feature call this once after the product exists.

const { expect } = require('@playwright/test');

/**
 * Connect a (fake) repository to a product so the first-feature gate lets it through.
 * @param {import('@playwright/test').APIRequestContext} request - the authenticated request context (page.request)
 * @param {string} productId
 */
async function connectRepoToProduct(request, productId) {
  const res = await request.post('/test/seed-product-repo', {
    data: { productId: productId },
    headers: { 'Content-Type': 'application/json' }
  });
  expect(res.status(), 'repo seed fixture (das-s2 gate)').toBe(200);
}

module.exports = { connectRepoToProduct };
