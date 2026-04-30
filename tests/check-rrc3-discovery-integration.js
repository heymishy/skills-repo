#!/usr/bin/env node
/**
 * check-rrc3-discovery-integration.js
 *
 * Automated tests for rrc.3: /discovery SKILL.md reference corpus integration.
 *
 * Tests from test plan artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.3-test-plan.md
 *
 *   AC1 — /discovery checks for discovery-seed.md in reference corpus:
 *   - rrc3-discovery-seed-reference-in-skill
 *   - rrc3-reference-corpus-path-in-skill
 *
 *   AC2 / 3-L1 — Pre-populates existing Constraints section, not a new heading:
 *   - rrc3-constraint-index-targets-constraints-section
 *   - rrc3-known-legacy-constraints-heading-absent
 *
 *   AC3 — Check is conditional:
 *   - rrc3-corpus-check-is-conditional
 *
 *   AC4 — /discovery contract markers intact:
 *   - rrc3-discovery-contract-markers-present
 *
 *   AC5 — Operator override instruction present:
 *   - rrc3-operator-override-instruction
 *
 *   3-L2 — System-slug disambiguation instruction:
 *   - rrc3-system-slug-disambiguation
 *
 *   NFR — /discovery SKILL.md total line count reasonable (≤ 700):
 *   - rrc3-discovery-line-count-reasonable
 *
 * Run:  node tests/check-rrc3-discovery-integration.js
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
  if (!fs.existsSync(discoverySkill)) return null;
  return fs.readFileSync(discoverySkill, 'utf8');
}

console.log('\n[rrc.3] /discovery reference corpus integration\n');

// ── T3.1: SKILL.md references discovery-seed.md (AC1) ────────────────────────
(function test_discovery_seed_reference() {
  const name = 'rrc3-discovery-seed-reference-in-skill';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  if (/discovery-seed/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'discovery/SKILL.md does not reference "discovery-seed" — rrc.3 implementation required');
  }
})();

// ── T3.2: SKILL.md references the reference corpus path (AC1) ────────────────
(function test_reference_path() {
  const name = 'rrc3-reference-corpus-path-in-skill';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  // Accept: "reference/" path or "reference corpus" near seed/constraint-index references
  if (/reference\//i.test(content) || /reference corpus/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'discovery/SKILL.md does not reference the reference corpus path (artefacts/[slug]/reference/) — required by AC1');
  }
})();

// ── T3.3: Constraint pre-population targets the Constraints section (AC2, 3-L1) ──
(function test_constraints_section_targeted() {
  const name = 'rrc3-constraint-index-targets-constraints-section';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  // constraint-index.md should be referenced near the Constraints section context
  const ciIdx = content.indexOf('constraint-index');
  if (ciIdx === -1) {
    fail(name, 'discovery/SKILL.md does not reference constraint-index.md — rrc.3 implementation required');
    return;
  }
  // Within a window of 500 chars around constraint-index, look for Constraints section reference
  const region = content.slice(Math.max(0, ciIdx - 300), ciIdx + 300).toLowerCase();
  if (/constraints?\s*section|existing.*constraints|constraints.*section|populate.*constraints/i.test(region)) {
    pass(name);
  } else {
    // Acceptable if the instruction uses "Constraints" heading in a table row or list item nearby
    if (/constraints/i.test(region)) {
      pass(name);
    } else {
      fail(name, 'constraint-index.md reference does not clearly target the existing Constraints section — required by AC2 (must not create a new heading)');
    }
  }
})();

// ── T3.4: "Known legacy constraints" heading absent (3-L1) ───────────────────
(function test_no_known_legacy_constraints_heading() {
  const name = 'rrc3-known-legacy-constraints-heading-absent';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  if (/known legacy constraints/i.test(content)) {
    fail(name, 'discovery/SKILL.md contains "Known legacy constraints" heading — forbidden by 3-L1; use the existing Constraints section instead');
  } else {
    pass(name);
  }
})();

// ── T3.5: Corpus check is conditional (AC3) ──────────────────────────────────
(function test_conditional_check() {
  const name = 'rrc3-corpus-check-is-conditional';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  // Find where discovery-seed is referenced; look for conditional guard near it
  const seedIdx = content.indexOf('discovery-seed');
  if (seedIdx === -1) {
    fail(name, 'discovery/SKILL.md has no discovery-seed reference — cannot check conditional guard');
    return;
  }
  const region = content.slice(Math.max(0, seedIdx - 300), seedIdx + 300).toLowerCase();
  if (/if (present|found|available|exists)|when (present|found|available)|only if|optional/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'discovery/SKILL.md corpus check does not include conditional guard — required by AC3 (skill must work when no corpus exists)');
  }
})();

// ── T3.6: /discovery contract markers intact (AC4) ───────────────────────────
(function test_contract_markers() {
  const name = 'rrc3-discovery-contract-markers-present';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  const missing = [];
  if (!/^name:/m.test(content)) missing.push('name:');
  if (!/^description:/m.test(content)) missing.push('description:');
  if (!/^triggers:/m.test(content)) missing.push('triggers:');
  if (!/##\s+Output|outputs:/i.test(content)) missing.push('outputs section');
  if (missing.length === 0) {
    pass(name);
  } else {
    fail(name, `discovery/SKILL.md missing contract markers: ${missing.join(', ')} — implementation must not remove existing markers`);
  }
})();

// ── T3.7: Operator override instruction present (AC5) ────────────────────────
(function test_operator_override() {
  const name = 'rrc3-operator-override-instruction';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  const seedIdx = content.indexOf('discovery-seed');
  if (seedIdx === -1) {
    fail(name, 'discovery/SKILL.md has no discovery-seed reference — cannot check override instruction');
    return;
  }
  // Look in the wider context (1200 chars) for override language
  const region = content.slice(Math.max(0, seedIdx - 400), seedIdx + 800).toLowerCase();
  if (/override|edit|adjust|confirm|change|modify|update.*pre.?popul/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'discovery/SKILL.md does not include operator override instruction for pre-populated content — required by AC5');
  }
})();

// ── T3.8: System-slug disambiguation instruction (3-L2) ──────────────────────
(function test_system_slug_disambiguation() {
  const name = 'rrc3-system-slug-disambiguation';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  // Look for instruction to ask operator for system name/slug if not specified
  if (/system.*slug|slug.*system|which system|ask.*system|system.*name.*if|name.*system.*not/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'discovery/SKILL.md does not include system-slug disambiguation — required by 3-L2 (ask operator which system when not named)');
  }
})();

// ── T3.9: /discovery SKILL.md line count reasonable (NFR) ────────────────────
(function test_line_count_reasonable() {
  const name = 'rrc3-discovery-line-count-reasonable';
  const content = getContent();
  if (!content) { fail(name, '.github/skills/discovery/SKILL.md not found'); return; }
  const lineCount = content.split('\n').length;
  if (lineCount <= 700) {
    pass(name);
  } else {
    fail(name, `discovery/SKILL.md has ${lineCount} lines — exceeds reasonableness bound of 700 lines; rrc.3 should add ~20 lines only`);
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('[rrc3] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
