'use strict';

// tfhc-s3: flags a test file that requires skills.js and defines its own
// local mockReq instead of importing the shared fixture module (tfhc-s3)
// from tests/helpers/skills-fixture.js. Same shape as
// scripts/check-journey-fixture-usage.js (export the detection function,
// plus a CLI wrapper) -- deliberately not a different convention.
//
// fhff-s3: thin wrapper over scripts/lib/make-fixture-usage-check.js. The
// exported function name and behavior are unchanged -- only the shared
// detection logic now lives in the factory.

const { makeFixtureUsageCheck } = require('./lib/make-fixture-usage-check');

const SKILLS_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/skills['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/skills-fixture['"]\)/;

const { scanFileForHandRolledFixture, runCli } = makeFixtureUsageCheck({
  routeRequirePattern: SKILLS_ROUTE_REQUIRE_PATTERN,
  fixtureRequirePattern: SHARED_FIXTURE_REQUIRE_PATTERN,
  findingMessage: 'Hand-rolled mockReq found in a skills.js-touching file. Use the shared fixture from tests/helpers/skills-fixture.js instead.',
  detectAdHocSessionLiteral: false,
  scriptLabel: 'check-skills-fixture-usage'
});

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  runCli(process.argv[2]);
}
