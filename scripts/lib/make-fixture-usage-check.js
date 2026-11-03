'use strict';

// fhff-s3: shared factory for the fixture-usage-check scripts
// (check-journey-fixture-usage.js, check-journeys-fixture-usage.js,
// check-skills-fixture-usage.js). The 3 scripts were nearly identical --
// same route-require pattern shape, same shared-fixture-require pattern
// shape, same hand-rolled-mockReq pattern, same CLI wrapper shape -- this
// factory extracts that shared shape while keeping every script's exported
// function name, message wording, and detection behavior unchanged. This is
// a DRY extraction, not a redesign: no detection behavior changes.
//
// `config`:
//   - routeRequirePattern: RegExp matching the route-module require() call
//   - fixtureRequirePattern: RegExp matching the shared-fixture require() call
//   - fixtureModuleLabel: string used in the finding message (e.g.
//     'journey.js-touching file' / 'tests/helpers/journey-fixture.js')
//   - detectAdHocSessionLiteral: bool (default false) -- only true for
//     journeys.js's check, which additionally flags an ad-hoc inline
//     `const req = { session: {...} }` literal
//   - scriptLabel: string used in PASS/FAIL CLI output (e.g.
//     'check-journey-fixture-usage')

const fs = require('fs');
const path = require('path');

const HAND_ROLLED_MOCKREQ_PATTERN = /(function\s+mockReq\s*\(|(?:const|var|let)\s+mockReq\s*=\s*(?:\{|function))/;

// Ad-hoc inline literal case: `const/var/let req = {`. Matched separately
// (rather than folded into one regex with a `[^}]*session\s*:` tail) because
// `[^}]*` cannot cross a nested object's own closing brace -- a literal like
// `{ params: {...}, session: {...} }` would never match if `session` isn't
// the first key. Instead, find the declaration's position, then look for
// `session:` anywhere within a bounded window after it, wide enough to
// cross sibling nested braces without risking a match against unrelated,
// far-away code.
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

function makeFixtureUsageCheck(config) {
  const routeRequirePattern = config.routeRequirePattern;
  const fixtureRequirePattern = config.fixtureRequirePattern;
  const fixtureModuleLabel = config.fixtureModuleLabel;
  const detectAdHocSessionLiteral = config.detectAdHocSessionLiteral || false;
  const scriptLabel = config.scriptLabel;

  // ── scanFileForHandRolledFixture ───────────────────────────────────────
  // Reads the file at filePath. If it touches the route module AND has a
  // hand-rolled mockReq (or, when detectAdHocSessionLiteral is set, an
  // ad-hoc inline session literal) AND does not import the shared fixture
  // module, returns a finding naming the file and the fix. Returns [] if
  // the file doesn't touch the route module at all, or already uses the
  // shared fixture, or has no hand-rolled pattern.
  function scanFileForHandRolledFixture(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');

    const touchesRoute = routeRequirePattern.test(content);
    if (!touchesRoute) {
      return [];
    }

    const usesSharedFixture = fixtureRequirePattern.test(content);
    if (usesSharedFixture) {
      return [];
    }

    const handRolled = HAND_ROLLED_MOCKREQ_PATTERN.test(content) ||
      (detectAdHocSessionLiteral && hasAdHocSessionLiteral(content));
    if (!handRolled) {
      return [];
    }

    return [{
      file: filePath,
      message: fixtureModuleLabel
    }];
  }

  // ── runCli ──────────────────────────────────────────────────────────────
  function runCli(targetFile) {
    if (!targetFile) {
      console.error(`Usage: node scripts/${scriptLabel}.js <file>`);
      process.exit(1);
    }

    try {
      const findings = scanFileForHandRolledFixture(path.resolve(targetFile));

      if (findings.length === 0) {
        console.log(`${scriptLabel} PASS: no hand-rolled fixture found in ${targetFile}`);
        process.exit(0);
      }

      console.error(`${scriptLabel} FAIL: hand-rolled fixture found in ${targetFile}`);
      findings.forEach((finding) => console.error(`  ${finding.file}: ${finding.message}`));
      process.exit(1);
    } catch (err) {
      console.error(`${scriptLabel}.js error: ${err.message}`);
      process.exit(1);
    }
  }

  return { scanFileForHandRolledFixture: scanFileForHandRolledFixture, runCli: runCli };
}

module.exports = { makeFixtureUsageCheck: makeFixtureUsageCheck };
