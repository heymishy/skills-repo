'use strict';
// check-pr.3.js — AC assertions for pr.3: tie detection, multi-pass orchestration, divergence handling
// Tests read .github/skills/prioritise/SKILL.md and assert required text patterns.
// Exit 0 on pass, 1 on any failure.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_PATH = path.join(__dirname, '..', '.github', 'skills', 'prioritise', 'SKILL.md');

let passed = 0;
let failed = 0;
const failures = [];

function assert(name, condition) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failures.push(name);
    failed++;
  }
}

const contentRaw = (() => {
  try {
    return fs.readFileSync(SKILL_PATH, 'utf8');
  } catch (e) {
    console.error(`ERROR: cannot read ${SKILL_PATH}: ${e.message}`);
    process.exit(1);
  }
})();

const content = contentRaw.toLowerCase();

console.log('\n[check-pr.3] /prioritise SKILL.md — tie detection and divergence ACs\n');

// T3.1 — AC1: tie detection instruction present
assert(
  'T3.1 — AC1: tie detection instruction present',
  /tie|identical scores|tied items|same score/.test(content)
);

// T3.2 — AC1: three-option offer for ties (tiebreaker + reorder + deliberate draw/accept)
assert(
  'T3.2 — AC1: three-option tie offer — tiebreaker, reorder, deliberate draw',
  content.includes('tiebreaker') &&
  /manually reorder|reorder the tied/.test(content) &&
  /deliberate draw|accept the tie/.test(content)
);

// T3.3 — AC2: two-or-more-positions threshold language
assert(
  'T3.3 — AC2: rank-change threshold language (two or more positions)',
  /two or more positions|2 or more positions|rank changed by two|shifted by two|≥2 positions/.test(content)
);

// T3.4 — AC2: does not flag every minor reorder
assert(
  'T3.4 — AC2: minor reorder exclusion instruction',
  /does not flag every|not flag every|minor reorder|every minor/.test(content)
);

// T3.5 — AC3: WSJF model characteristic in divergence explanation
assert(
  'T3.5 — AC3: WSJF model characteristic in divergence explanation',
  /job-size efficiency|small high-value|wsjf prioritises|efficiency/.test(content)
);

// T3.6 — AC3: RICE confidence characteristic in divergence explanation
assert(
  'T3.6 — AC3: RICE confidence characteristic in divergence explanation',
  /rice weights confidence|low confidence scores|confidence.*drop|confidence.*rank/.test(content)
);

// T3.7 — AC4: three-option resolution offer after divergence
assert(
  'T3.7 — AC4: three-option resolution offer (accept primary + reorder + third framework)',
  /accept one framework|accept.*primary|one framework.*primary/.test(content) &&
  /manually reorder.*divergent|reorder.*divergent|reorder the divergent/.test(content) &&
  /third framework|run a third|third pass/.test(content)
);

// T3.8 — AC5: divergence record preservation marker
assert(
  'T3.8 — AC5: divergence record preserved in scoring record',
  /preserved|scoring record|included in output/.test(content)
);

// T3.9 — AC6: single-pass guard — no second-pass prompt when one framework, no tie
assert(
  'T3.9 — AC6: single-pass guard present',
  /only one framework|single pass|single framework|no second pass|one pass/.test(content)
);

// T3.10 — NFR: check-skill-contracts.js exits 0
assert(
  'T3.10 — NFR: check-skill-contracts.js exits 0',
  (() => {
    try {
      execSync('node .github/scripts/check-skill-contracts.js', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      return true;
    } catch (e) {
      return false;
    }
  })()
);

console.log(`\n[check-pr.3] Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

process.exit(failed > 0 ? 1 : 0);
