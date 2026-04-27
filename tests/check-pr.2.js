'use strict';
// check-pr.2.js — AC assertions for pr.2: conversational scoring across WSJF, RICE, MoSCoW
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

const content = (() => {
  try {
    return fs.readFileSync(SKILL_PATH, 'utf8').toLowerCase();
  } catch (e) {
    console.error(`ERROR: cannot read ${SKILL_PATH}: ${e.message}`);
    process.exit(1);
  }
})();

// Also keep original case version for exact-string tests
const contentRaw = fs.readFileSync(SKILL_PATH, 'utf8');

console.log('\n[check-pr.2] /prioritise SKILL.md — conversational scoring ACs\n');

// T2.1 — AC1: WSJF dimension-by-dimension pattern (one at a time)
assert(
  'T2.1 — AC1: WSJF scoring presents dimensions one at a time',
  /one dimension at a time|one at a time|individually/.test(content)
);

// T2.2 — AC1: WSJF section present with dimension-by-dimension language
assert(
  'T2.2 — AC1: WSJF scoring section present',
  content.includes('wsjf') && /dimension[- ]by[- ]dimension|one dimension at a time|individually|each dimension/.test(content)
);

// T2.3 — AC1: WSJF sub-component names present (CoD components + Job Size)
assert(
  'T2.3 — AC1: WSJF dimension names — User/Business Value, Time Criticality, Risk Reduction, Job Size',
  content.includes('user') && content.includes('business value') &&
  content.includes('time criticality') && content.includes('risk reduction') &&
  content.includes('job size')
);

// T2.4 — AC2: RICE scoring section present
assert(
  'T2.4 — AC2: RICE scoring section present',
  content.includes('rice')
);

// T2.5 — AC2: RICE dimension names all present
assert(
  'T2.5 — AC2: RICE dimensions — Reach, Impact, Confidence, Effort',
  content.includes('reach') && content.includes('impact') &&
  content.includes('confidence') && content.includes('effort')
);

// T2.6 — AC3: MoSCoW one-item-at-a-time pattern
assert(
  'T2.6 — AC3: MoSCoW scoring — one item at a time pattern',
  /does not present all items simultaneously|one at a time|item by item/.test(content)
);

// T2.7 — AC3: MoSCoW bucket names present
assert(
  'T2.7 — AC3: MoSCoW bucket names — Must-have, Should-have, Could-have, Won\'t-have',
  content.includes('must-have') && content.includes('should-have') &&
  content.includes('could-have') && (content.includes("won't-have") || content.includes('wont-have') || content.includes("won't have"))
);

// T2.8 — AC4: override acceptance — uses corrected value in subsequent calculations
assert(
  'T2.8 — AC4: override acceptance — uses corrected value in subsequent calculations',
  /uses it in all subsequent|uses the corrected value|corrected value is used/.test(content)
);

// T2.9 — AC5: rationale elicitation question pattern
assert(
  'T2.9 — AC5: rationale elicitation instruction present',
  /rationale question|what.s driving|elicit|rationale elicitation/.test(content)
);

// T2.10 — AC5: does not skip rationale even when operator moves quickly
assert(
  'T2.10 — AC5: no-skip constraint on rationale elicitation',
  /does not skip rationale|even if the operator is moving quickly|not skip/.test(content)
);

// T2.11 — AC6: "[rationale not provided]" exact placeholder marker
assert(
  'T2.11 — AC6: "[rationale not provided]" placeholder marker present',
  contentRaw.includes('[rationale not provided]')
);

// T2.12 — AC7: descending order presentation
assert(
  'T2.12 — AC7: descending order presentation instruction',
  /descending score order|descending order|highest to lowest|ranked order/.test(content)
);

// T2.13 — AC7: rationale field in scored list description
assert(
  'T2.13 — AC7: rationale field present in scored list description',
  /score.*rationale|rationale.*score|score.*reason|reason.*score/.test(content)
);

// T2.14 — AC7: next-step offer after scored list
assert(
  'T2.14 — AC7: next-step offer after scored list',
  /proceed to output|run another framework|another pass|another framework pass|offers to proceed/.test(content)
);

// T2.15 — NFR: check-skill-contracts.js exits 0
assert(
  'T2.15 — NFR: check-skill-contracts.js exits 0',
  (() => {
    try {
      execSync('node .github/scripts/check-skill-contracts.js', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      return true;
    } catch (e) {
      return false;
    }
  })()
);

console.log(`\n[check-pr.2] Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

process.exit(failed > 0 ? 1 : 0);
