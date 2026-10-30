'use strict';

// tfhc-s7: flags a test file that requires journeys.js and either defines
// its own local mockReq, OR (the real pattern found by tfhc-s5's spike --
// 0 of 30 real consumers use even a local factory) hand-rolls an ad-hoc
// inline `const req = { session: {...} }` literal, instead of importing the
// shared fixture module from tests/helpers/journeys-fixture.js. Same shape
// as scripts/check-journey-fixture-usage.js / check-skills-fixture-usage.js
// -- deliberately not a different convention -- with the detection regex
// broadened per tfhc-s5's own finding.

const fs = require('fs');
const path = require('path');

const JOURNEYS_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/journeys['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/journeys-fixture['"]\)/;
const HAND_ROLLED_PATTERN = /(function\s+mockReq\s*\(|(?:const|var|let)\s+mockReq\s*=\s*(?:\{|function)|(?:const|var|let)\s+req\s*=\s*\{[^}]*session\s*:)/;

// ── scanFileForHandRolledFixture ─────────────────────────────────────────────
// Reads the file at filePath. If it touches journeys.js (requires the route
// module) AND has a hand-rolled mockReq function OR an ad-hoc inline session
// literal AND does not import the shared fixture module, returns a finding
// naming the file and the fix. Returns [] if the file doesn't touch
// journeys.js at all, or already uses the shared fixture, or has no
// hand-rolled pattern.
function scanFileForHandRolledFixture(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const touchesJourneys = JOURNEYS_ROUTE_REQUIRE_PATTERN.test(content);
  if (!touchesJourneys) {
    return [];
  }

  const usesSharedFixture = SHARED_FIXTURE_REQUIRE_PATTERN.test(content);
  if (usesSharedFixture) {
    return [];
  }

  const handRolled = HAND_ROLLED_PATTERN.test(content);
  if (!handRolled) {
    return [];
  }

  return [{
    file: filePath,
    message: 'Hand-rolled mockReq or ad-hoc inline session literal found in a journeys.js-touching file. Use the shared fixture from tests/helpers/journeys-fixture.js instead.'
  }];
}

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  const targetFile = process.argv[2];

  if (!targetFile) {
    console.error('Usage: node scripts/check-journeys-fixture-usage.js <file>');
    process.exit(1);
  }

  try {
    const findings = scanFileForHandRolledFixture(path.resolve(targetFile));

    if (findings.length === 0) {
      console.log(`check-journeys-fixture-usage PASS: no hand-rolled fixture found in ${targetFile}`);
      process.exit(0);
    }

    console.error(`check-journeys-fixture-usage FAIL: hand-rolled fixture found in ${targetFile}`);
    findings.forEach((finding) => console.error(`  ${finding.file}: ${finding.message}`));
    process.exit(1);
  } catch (err) {
    console.error(`check-journeys-fixture-usage.js error: ${err.message}`);
    process.exit(1);
  }
}
