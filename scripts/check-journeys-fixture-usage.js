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
const HAND_ROLLED_MOCKREQ_PATTERN = /(function\s+mockReq\s*\(|(?:const|var|let)\s+mockReq\s*=\s*(?:\{|function))/;

// Ad-hoc inline literal case: `const/var/let req = {`. Matched separately
// (rather than folded into one regex with a `[^}]*session\s*:` tail) because
// `[^}]*` cannot cross a nested object's own closing brace -- a literal like
// `{ params: {...}, session: {...} }` would never match if `session` isn't
// the first key. Instead, find the declaration's position, then look for
// `session:` anywhere within a bounded window after it (same windowed-match
// technique as tests/check-tfhc-s4-journey-seed-classification.js's own AC2
// caller-count check), wide enough to cross sibling nested braces without
// risking a match against unrelated, far-away code.
const AD_HOC_REQ_DECLARATION_PATTERN = /(?:const|var|let)\s+req\s*=\s*\{/;
const SESSION_KEY_PATTERN = /session\s*:/;
const AD_HOC_SESSION_WINDOW = 300;

// ── hasAdHocSessionLiteral ────────────────────────────────────────────────
// Returns true if content contains a `const/var/let req = {` declaration
// followed, within AD_HOC_SESSION_WINDOW characters, by a `session:` key --
// regardless of whether `session` is the first key in the literal.
function hasAdHocSessionLiteral(content) {
  const match = AD_HOC_REQ_DECLARATION_PATTERN.exec(content);
  if (!match) {
    return false;
  }

  const windowStart = match.index + match[0].length;
  const windowEnd = Math.min(content.length, windowStart + AD_HOC_SESSION_WINDOW);
  const window = content.slice(windowStart, windowEnd);

  return SESSION_KEY_PATTERN.test(window);
}

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

  const handRolled = HAND_ROLLED_MOCKREQ_PATTERN.test(content) || hasAdHocSessionLiteral(content);
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
