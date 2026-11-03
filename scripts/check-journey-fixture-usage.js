'use strict';

// tsir-s3: flags a test file that requires journey.js and defines its own
// local mockReq instead of importing the shared fixture module from tsir-s1
// (tests/helpers/journey-fixture.js). Same shape as scripts/check-design-tokens.js
// (export the detection function, plus a CLI wrapper) -- deliberately not a
// different convention.
//
// fhff-s3: thin wrapper over scripts/lib/make-fixture-usage-check.js. The
// exported function name and behavior are unchanged -- only the shared
// detection logic now lives in the factory.

const { makeFixtureUsageCheck } = require('./lib/make-fixture-usage-check');

const JOURNEY_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/journey['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/journey-fixture['"]\)/;

const { scanFileForHandRolledFixture, runCli } = makeFixtureUsageCheck({
  routeRequirePattern: JOURNEY_ROUTE_REQUIRE_PATTERN,
  fixtureRequirePattern: SHARED_FIXTURE_REQUIRE_PATTERN,
  findingMessage: 'Hand-rolled mockReq found in a journey.js-touching file. Use the shared fixture from tests/helpers/journey-fixture.js instead.',
  detectAdHocSessionLiteral: false,
  scriptLabel: 'check-journey-fixture-usage'
});

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  runCli(process.argv[2]);
}
