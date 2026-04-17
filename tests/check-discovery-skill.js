#!/usr/bin/env node
/**
 * check-discovery-skill.js
 *
 * Automated tests for the EA registry live integration in the discovery skill (p3.10).
 *
 * Tests from the test plan:
 *   AC1 — Path A block present when ea_registry_authoritative: true:
 *   - discovery-skill-has-path-a-ea-registry-block
 *
 *   AC2 — Path A calls getBlastRadius / surfaces affected consumers:
 *   - discovery-skill-path-a-references-blast-radius
 *
 *   AC3 — Path B block present (no blast-radius, no error):
 *   - discovery-skill-has-path-b-no-registry-block
 *
 *   AC4 — Graceful "no EA registry entry found" message documented:
 *   - discovery-skill-has-graceful-missing-entry-message
 *
 *   AC5 — Path A is read-only (no write operations):
 *   - discovery-skill-path-a-read-only-constraint
 *
 * Run:  node tests/check-discovery-skill.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path) only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

let passed  = 0;
let failed  = 0;
const failures = [];

function pass(name) {
  console.log('  ✓ ' + name);
  passed++;
}
function fail(name, reason) {
  console.error('  ✗ ' + name);
  console.error('      ' + reason);
  failed++;
  failures.push(name + ': ' + reason);
}

const discoverySkill = path.join(root, '.github', 'skills', 'discovery', 'SKILL.md');

function getContent() {
  if (!fs.existsSync(discoverySkill)) {
    return null;
  }
  return fs.readFileSync(discoverySkill, 'utf8');
}

// ── Test: Path A EA registry block exists (AC1) ───────────────────────────────
(function test_path_a_block_present() {
  const name = 'discovery-skill-has-path-a-ea-registry-block';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/discovery/SKILL.md not found');
    return;
  }
  // Path A should reference ea_registry_authoritative: true
  if (/ea_registry_authoritative.*true/i.test(content) || /Path A/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not contain Path A / ea_registry_authoritative: true block');
  }
})();

// ── Test: Path A references blast-radius operation (AC2) ─────────────────────
(function test_path_a_blast_radius() {
  const name = 'discovery-skill-path-a-references-blast-radius';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/discovery/SKILL.md not found');
    return;
  }
  if (/blast.?radius|getBlastRadius/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not reference blast-radius or getBlastRadius in Path A block');
  }
})();

// ── Test: Path B block present (AC3) ─────────────────────────────────────────
(function test_path_b_block_present() {
  const name = 'discovery-skill-has-path-b-no-registry-block';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/discovery/SKILL.md not found');
    return;
  }
  if (/Path B/i.test(content) || /false.*existing behaviour|false.*no change/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not contain Path B block (no EA registry / existing behaviour unchanged)');
  }
})();

// ── Test: Graceful missing-entry message (AC4) ────────────────────────────────
(function test_graceful_missing_entry() {
  const name = 'discovery-skill-has-graceful-missing-entry-message';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/discovery/SKILL.md not found');
    return;
  }
  if (/no EA registry entry found/i.test(content) || /no.*entry found.*system/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not contain graceful "no EA registry entry found for [systemId]" message');
  }
})();

// ── Test: Path A is read-only (AC5) ──────────────────────────────────────────
(function test_path_a_read_only() {
  const name = 'discovery-skill-path-a-read-only-constraint';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/discovery/SKILL.md not found');
    return;
  }
  if (/read.?only|ADR.007|no write/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not state that Path A EA registry access is read-only (missing "read-only" / "ADR-007" / "no write")');
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('check-discovery-skill: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
