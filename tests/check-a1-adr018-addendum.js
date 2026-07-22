'use strict';

/**
 * check-a1-adr018-addendum.js — story a1-staging-safe-auth-stub, AC4
 *
 * Verifies AC4: .github/architecture-guardrails.md's ADR-018 section contains an
 * addendum documenting the staging-safe auth stub mechanism, its scope (staging
 * only), and the reasoning that it does not weaken production auth.
 *
 * Reference: artefacts/2026-07-23-e2e-core-journey-coverage/test-plans/a1-staging-safe-auth-stub-test-plan.md
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const ROOT = path.join(__dirname, '..');
const GUARDRAILS_PATH = path.join(ROOT, '.github', 'architecture-guardrails.md');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
    failed++;
  }
}

test('T1: .github/architecture-guardrails.md exists', () => {
  assert.strictEqual(fs.existsSync(GUARDRAILS_PATH), true, 'architecture-guardrails.md not found');
});

if (!fs.existsSync(GUARDRAILS_PATH)) {
  console.log(`\n[a1-adr018-addendum] Results: ${passed} passed, ${failed + 1} failed (blocked -- file missing)`);
  process.exit(1);
}

const content = fs.readFileSync(GUARDRAILS_PATH, 'utf8');

// ADR-018's body (Playwright E2E testing framework decision, wuce.17) has no
// numbered "### ADR-018: ..." heading in this file -- it sits, unheaded, between
// the ADR-024 and ADR-025 sections. Locate it by its distinguishing story marker
// instead of a heading string.
const adr018Marker = 'Story:** wuce.17 — Playwright E2E test infrastructure';
const adr018Index = content.indexOf(adr018Marker);

test('T2: ADR-018 section is present in the file', () => {
  assert.notStrictEqual(adr018Index, -1, 'Could not locate the ADR-018 (wuce.17) section');
});

if (adr018Index === -1) {
  console.log(`\n[a1-adr018-addendum] Results: ${passed} passed, ${failed + 1} failed (blocked -- ADR-018 section missing)`);
  process.exit(1);
}

// The addendum must appear after the ADR-018 marker, before the next ADR's heading.
const nextAdrHeadingMatch = content.slice(adr018Index).match(/\n### ADR-\d+/);
const sectionEnd = nextAdrHeadingMatch
  ? adr018Index + nextAdrHeadingMatch.index
  : content.length;
const adr018Section = content.slice(adr018Index, sectionEnd);

test('T3 (AC4): an addendum block exists within the ADR-018 section', () => {
  assert.match(
    adr018Section,
    /#### Addendum/i,
    'No "#### Addendum" heading found within the ADR-018 section'
  );
});

test('T4 (AC4): the addendum documents the mechanism as staging-only', () => {
  assert.match(adr018Section.toLowerCase(), /staging-only/, 'Addendum must describe the mechanism as staging-only');
});

test('T5 (AC4): the addendum explains why production auth is not weakened', () => {
  assert.match(
    adr018Section.toLowerCase(),
    /does not weaken production/,
    'Addendum must explain why the mechanism does not weaken production auth'
  );
});

test('T6 (AC4): the addendum is dated on or after the story date (2026-07-23)', () => {
  const addendumMatch = adr018Section.match(/#### Addendum — (\d{4}-\d{2}-\d{2})/);
  assert.notStrictEqual(addendumMatch, null, 'Addendum heading must include an ISO date');
  assert.ok(
    addendumMatch[1] >= '2026-07-23',
    `Addendum date ${addendumMatch[1]} should be on or after 2026-07-23`
  );
});

console.log(`\n[a1-adr018-addendum] Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
