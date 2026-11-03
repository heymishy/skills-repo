'use strict';

// tfhc-s7: flags a test file that requires journeys.js and either defines
// its own local mockReq, OR (the real pattern found by tfhc-s5's spike --
// 0 of 30 real consumers use even a local factory) hand-rolls an ad-hoc
// inline `const req = { session: {...} }` literal, instead of importing the
// shared fixture module from tests/helpers/journeys-fixture.js. Same shape
// as scripts/check-journey-fixture-usage.js / check-skills-fixture-usage.js
// -- deliberately not a different convention -- with the detection regex
// broadened per tfhc-s5's own finding.
//
// fhff-s3: thin wrapper over scripts/lib/make-fixture-usage-check.js. The
// exported function name and behavior (including the ad-hoc session literal
// detection that this script alone has) are unchanged -- only the shared
// detection logic now lives in the factory.

const { makeFixtureUsageCheck } = require('./lib/make-fixture-usage-check');

const JOURNEYS_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/journeys['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/journeys-fixture['"]\)/;

const { scanFileForHandRolledFixture, runCli } = makeFixtureUsageCheck({
  routeRequirePattern: JOURNEYS_ROUTE_REQUIRE_PATTERN,
  fixtureRequirePattern: SHARED_FIXTURE_REQUIRE_PATTERN,
  fixtureModuleLabel: 'Hand-rolled mockReq or ad-hoc inline session literal found in a journeys.js-touching file. Use the shared fixture from tests/helpers/journeys-fixture.js instead.',
  detectAdHocSessionLiteral: true,
  scriptLabel: 'check-journeys-fixture-usage'
});

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  runCli(process.argv[2]);
}
