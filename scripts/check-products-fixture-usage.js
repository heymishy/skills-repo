'use strict';

// fhff-s3: flags a test file that requires products.js and either defines
// its own local mockReq/makeRes, OR hand-rolls an ad-hoc inline
// `const req = { session: {...} }` literal (products.js's real tests use
// this pattern -- confirmed via tests/check-dsa-s2-product-dashboard-wiring.js,
// same pattern as journeys.js), instead of importing the shared fixture
// module from tests/helpers/products-fixture.js. Thin wrapper over
// scripts/lib/make-fixture-usage-check.js -- same shape as
// scripts/check-journeys-fixture-usage.js / check-skills-fixture-usage.js,
// deliberately not a different convention.

const { makeFixtureUsageCheck } = require('./lib/make-fixture-usage-check');

const PRODUCTS_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/products['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/products-fixture['"]\)/;

const { scanFileForHandRolledFixture, runCli } = makeFixtureUsageCheck({
  routeRequirePattern: PRODUCTS_ROUTE_REQUIRE_PATTERN,
  fixtureRequirePattern: SHARED_FIXTURE_REQUIRE_PATTERN,
  findingMessage: 'Hand-rolled mockReq/makeRes or ad-hoc inline session literal found in a products.js-touching file. Use the shared fixture from tests/helpers/products-fixture.js instead.',
  detectAdHocSessionLiteral: true,
  scriptLabel: 'check-products-fixture-usage'
});

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  runCli(process.argv[2]);
}
