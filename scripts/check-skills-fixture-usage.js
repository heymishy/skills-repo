'use strict';

// tfhc-s3: flags a test file that requires skills.js and defines its own
// local mockReq instead of importing the shared fixture module (tfhc-s3)
// from tests/helpers/skills-fixture.js. Same shape as
// scripts/check-journey-fixture-usage.js (export the detection function,
// plus a CLI wrapper) -- deliberately not a different convention.

const fs = require('fs');
const path = require('path');

const SKILLS_ROUTE_REQUIRE_PATTERN = /require\(['"][^'"]*routes\/skills['"]\)/;
const SHARED_FIXTURE_REQUIRE_PATTERN = /require\(['"][^'"]*helpers\/skills-fixture['"]\)/;
const HAND_ROLLED_MOCKREQ_PATTERN = /(function\s+mockReq\s*\(|(?:const|var|let)\s+mockReq\s*=\s*(?:\{|function))/;

// ── scanFileForHandRolledFixture ─────────────────────────────────────────────
// Reads the file at filePath. If it touches skills.js (requires the route
// module) AND defines its own local mockReq AND does not import the shared
// fixture module, returns a finding naming the file and the fix. Returns []
// if the file doesn't touch skills.js at all, or already uses the shared
// fixture, or has no hand-rolled mockReq pattern.
function scanFileForHandRolledFixture(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');

  const touchesSkills = SKILLS_ROUTE_REQUIRE_PATTERN.test(content);
  if (!touchesSkills) {
    return [];
  }

  const usesSharedFixture = SHARED_FIXTURE_REQUIRE_PATTERN.test(content);
  if (usesSharedFixture) {
    return [];
  }

  const handRolled = HAND_ROLLED_MOCKREQ_PATTERN.test(content);
  if (!handRolled) {
    return [];
  }

  return [{
    file: filePath,
    message: 'Hand-rolled mockReq found in a skills.js-touching file. Use the shared fixture from tests/helpers/skills-fixture.js instead.'
  }];
}

module.exports = { scanFileForHandRolledFixture: scanFileForHandRolledFixture };

// ── CLI wrapper ───────────────────────────────────────────────────────────────
if (require.main === module) {
  const targetFile = process.argv[2];

  if (!targetFile) {
    console.error('Usage: node scripts/check-skills-fixture-usage.js <file>');
    process.exit(1);
  }

  try {
    const findings = scanFileForHandRolledFixture(path.resolve(targetFile));

    if (findings.length === 0) {
      console.log(`check-skills-fixture-usage PASS: no hand-rolled fixture found in ${targetFile}`);
      process.exit(0);
    }

    console.error(`check-skills-fixture-usage FAIL: hand-rolled fixture found in ${targetFile}`);
    findings.forEach((finding) => console.error(`  ${finding.file}: ${finding.message}`));
    process.exit(1);
  } catch (err) {
    console.error(`check-skills-fixture-usage.js error: ${err.message}`);
    process.exit(1);
  }
}
