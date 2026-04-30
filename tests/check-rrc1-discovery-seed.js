#!/usr/bin/env node
/**
 * check-rrc1-discovery-seed.js
 *
 * Automated tests for rrc.1: Output 9 (discovery-seed.md) added to /reverse-engineer.
 *
 * Tests from test plan artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.1-test-plan.md
 *
 *   AC1 — Output 9 instruction with discovery-seed.md format (all 4 sections):
 *   - rrc1-output-9-instruction-present
 *   - rrc1-discovery-seed-filename-specified
 *   - rrc1-discovery-seed-problem-framing-section
 *   - rrc1-discovery-seed-parity-required-constraints
 *   - rrc1-discovery-seed-personas-section
 *
 *   AC2 — Governance check: SKILL.md contract markers intact:
 *   - rrc1-skill-contract-markers-present
 *
 *   AC3 — DEFER (Q0=C) outcome does NOT produce Output 9:
 *   - rrc1-output-9-gated-not-for-defer
 *
 *   AC4 — discovery-seed.md sections correspond to discovery.md template:
 *   - rrc1-discovery-seed-maps-to-discovery-template
 *
 *   AC5 — VERIFY pass includes Output 9 review instruction:
 *   - rrc1-verify-pass-updates-output-9
 *
 *   NFR — SKILL.md total line count <= 650:
 *   - rrc1-skill-line-count-within-nfr
 *
 * Run:  node tests/check-rrc1-discovery-seed.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, child_process) only.
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

const revEngSkill = path.join(root, '.github', 'skills', 'reverse-engineer', 'SKILL.md');

function getContent() {
  if (!fs.existsSync(revEngSkill)) {
    return null;
  }
  return fs.readFileSync(revEngSkill, 'utf8');
}

console.log('\n[rrc.1] /reverse-engineer Output 9 — discovery-seed.md\n');

// ── T1.1: Output 9 instruction is present (AC1) ───────────────────────────────
(function test_output_9_present() {
  const name = 'rrc1-output-9-instruction-present';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  if (/Output 9/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not contain "Output 9" — rrc.1 implementation required');
  }
})();

// ── T1.2: Output 9 names discovery-seed.md file (AC1) ────────────────────────
(function test_discovery_seed_filename() {
  const name = 'rrc1-discovery-seed-filename-specified';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  if (/discovery-seed\.md/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md does not reference "discovery-seed.md" — Output 9 filename not specified');
  }
})();

// ── T1.3: discovery-seed includes problem framing section (AC1) ──────────────
(function test_problem_framing_section() {
  const name = 'rrc1-discovery-seed-problem-framing-section';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  if (/problem.?framing/i.test(content)) {
    pass(name);
  } else {
    fail(name, 'SKILL.md Output 9 format does not include "problem framing" section — required by AC1');
  }
})();

// ── T1.4: discovery-seed includes PARITY REQUIRED constraints block (AC1) ─────
(function test_parity_required_in_seed() {
  const name = 'rrc1-discovery-seed-parity-required-constraints';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  // Must reference PARITY REQUIRED within the Output 9 / discovery-seed format context
  // Check that both "discovery-seed" and "PARITY REQUIRED" appear in the same region
  const seedIdx = content.indexOf('discovery-seed');
  if (seedIdx === -1) {
    fail(name, 'SKILL.md does not mention discovery-seed — cannot verify PARITY REQUIRED constraint');
    return;
  }
  // Look within a 1000-char window around the seed section for PARITY REQUIRED
  const region = content.slice(Math.max(0, seedIdx - 200), seedIdx + 800);
  if (/PARITY REQUIRED/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'discovery-seed.md format in SKILL.md does not include PARITY REQUIRED constraints block — required by AC1');
  }
})();

// ── T1.5: discovery-seed includes personas section (AC1) ─────────────────────
(function test_personas_section() {
  const name = 'rrc1-discovery-seed-personas-section';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  // Check personas appears in the context of discovery-seed / Output 9
  const seedIdx = content.indexOf('discovery-seed');
  if (seedIdx === -1) {
    fail(name, 'SKILL.md does not mention discovery-seed — cannot verify personas section');
    return;
  }
  const region = content.slice(Math.max(0, seedIdx - 200), seedIdx + 800);
  if (/personas/i.test(region)) {
    pass(name);
  } else {
    fail(name, 'discovery-seed.md format does not include personas section — required by AC1');
  }
})();

// ── T1.6: Output 9 gated — DEFER outcome does NOT instruct it (AC3) ──────────
(function test_output_9_not_for_defer() {
  const name = 'rrc1-output-9-gated-not-for-defer';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  // Find the DEFER section and check it does not reference Output 9
  const deferIdx = content.search(/DEFER|Q0.*C\b/i);
  if (deferIdx === -1) {
    fail(name, 'SKILL.md has no DEFER section — cannot verify Output 9 is excluded for DEFER');
    return;
  }
  // Extract the DEFER section (next ~500 chars after the DEFER mention)
  const deferRegion = content.slice(deferIdx, deferIdx + 500);
  if (/Output 9/i.test(deferRegion)) {
    fail(name, 'DEFER outcome section references Output 9 — it must not instruct discovery-seed.md production for DEFER');
  } else {
    pass(name);
  }
})();

// ── T1.7: discovery-seed sections map to discovery.md template (AC4) ─────────
(function test_maps_to_discovery_template() {
  const name = 'rrc1-discovery-seed-maps-to-discovery-template';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  // At minimum the problem framing section should correspond to the discovery template
  // The discovery template has "Problem framing" and "Constraints" sections
  // We already tested problem framing; here we check the SKILL.md explicitly
  // states the seed is structured to match the discovery template (or uses template section names)
  const discoveryTemplate = path.join(root, '.github', 'templates', 'discovery.md');
  let templateSections = [];
  if (fs.existsSync(discoveryTemplate)) {
    const tmpl = fs.readFileSync(discoveryTemplate, 'utf8');
    // Extract heading names from template
    const headings = tmpl.match(/^##+ .+/gm) || [];
    templateSections = headings.map(h => h.replace(/^#+\s*/, '').toLowerCase());
  }
  // Check that at least 2 section names from the discovery template appear in SKILL.md
  // near the discovery-seed / Output 9 context
  const seedIdx = content.indexOf('discovery-seed');
  if (seedIdx === -1) {
    fail(name, 'SKILL.md does not mention discovery-seed — cannot verify template mapping');
    return;
  }
  const region = content.slice(Math.max(0, seedIdx - 300), seedIdx + 1000).toLowerCase();
  const matched = templateSections.filter(s => s.length > 4 && region.includes(s));
  if (matched.length >= 2) {
    pass(name);
  } else {
    // Fallback: check that SKILL.md mentions the discovery artefact structure/template explicitly
    if (/discovery.*template|discovery.*artefact|discovery.*draft|mirrors.*discovery/i.test(region)) {
      pass(name);
    } else {
      fail(name, `SKILL.md discovery-seed format does not reference discovery template sections (matched: [${matched.join(', ')}]) — AC4 requires the seed to mirror the discovery template structure`);
    }
  }
})();

// ── T1.8: VERIFY pass includes Output 9 review instruction (AC5) ─────────────
(function test_verify_updates_output_9() {
  const name = 'rrc1-verify-pass-updates-output-9';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  // Find the VERIFY pass section
  const verifyIdx = content.search(/VERIFY pass|## VERIFY|### VERIFY/i);
  if (verifyIdx === -1) {
    fail(name, 'SKILL.md has no VERIFY pass section — cannot verify Output 9 update instruction');
    return;
  }
  const verifyRegion = content.slice(verifyIdx, verifyIdx + 1000);
  if (/Output 9|discovery-seed/i.test(verifyRegion)) {
    pass(name);
  } else {
    fail(name, 'VERIFY pass section does not reference Output 9 or discovery-seed.md — required by AC5 (update seed when PARITY REQUIRED rules change)');
  }
})();

// ── T1.9: SKILL.md contract markers intact (AC2 proxy) ───────────────────────
(function test_contract_markers() {
  const name = 'rrc1-skill-contract-markers-present';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  const missingMarkers = [];
  if (!/^name:/m.test(content)) missingMarkers.push('name:');
  if (!/^description:/m.test(content)) missingMarkers.push('description:');
  if (!/^triggers:/m.test(content)) missingMarkers.push('triggers:');
  // outputs section — check for "## Output" or "outputs:" in frontmatter
  if (!/##\s+Output|outputs:/i.test(content)) missingMarkers.push('outputs section');
  if (missingMarkers.length === 0) {
    pass(name);
  } else {
    fail(name, `SKILL.md is missing contract markers: ${missingMarkers.join(', ')} — implementation must not remove existing markers`);
  }
})();

// ── T1.10: SKILL.md line count ≤ 650 (NFR) ───────────────────────────────────
(function test_line_count_nfr() {
  const name = 'rrc1-skill-line-count-within-nfr';
  const content = getContent();
  if (!content) {
    fail(name, '.github/skills/reverse-engineer/SKILL.md not found');
    return;
  }
  const lineCount = content.split('\n').length;
  if (lineCount <= 650) {
    pass(name);
  } else {
    fail(name, `SKILL.md has ${lineCount} lines — exceeds NFR limit of 650 lines`);
  }
})();

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log('[rrc1] Results: ' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.error('FAILED:');
  failures.forEach(f => console.error('  - ' + f));
  process.exit(1);
}
