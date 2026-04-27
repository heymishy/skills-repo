'use strict';
// check-pr.5.js — AC assertions for pr.5: output format, rationale enforcement, artefact save, extension point
// Tests read .github/skills/prioritise/SKILL.md and .github/scripts/check-skill-contracts.js.
// Exit 0 on pass, 1 on any failure.

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const REPO_ROOT = path.join(__dirname, '..');
const SKILL_PATH = path.join(REPO_ROOT, '.github', 'skills', 'prioritise', 'SKILL.md');
const CONTRACTS_PATH = path.join(REPO_ROOT, '.github', 'scripts', 'check-skill-contracts.js');

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

const contractsRaw = (() => {
  try {
    return fs.readFileSync(CONTRACTS_PATH, 'utf8');
  } catch (e) {
    console.error(`ERROR: cannot read ${CONTRACTS_PATH}: ${e.message}`);
    process.exit(1);
  }
})();

console.log('\n[check-pr.5] /prioritise SKILL.md — output format, rationale enforcement, artefact save, extension point\n');

// T5.1 — AC1: output format contains rankings field
assert(
  'T5.1 — AC1: output format contains rankings/ranked field',
  /final rankings|ranked list|prioritised list|ranking/.test(content)
);

// T5.2 — AC1: output format contains scores per framework
assert(
  'T5.2 — AC1: output format contains scores per framework',
  /scores per|score per|scores for each|scores for/.test(content)
);

// T5.3 — AC1: output format contains rationale field
assert(
  'T5.3 — AC1: output format contains rationale field',
  /rationale field|rationale per|rationale for each/.test(content)
);

// T5.4 — AC1: output contains session metadata (date + framework)
assert(
  'T5.4 — AC1: session metadata block (date and framework)',
  /session metadata|metadata block/.test(content) ||
  (/date/.test(content) && /framework.*used|used.*framework/.test(content))
);

// T5.5 — AC2: missing rationale warning marker
assert(
  'T5.5 — AC2: missing rationale warning (⚠ or warning + missing rationale)',
  /⚠|warning/.test(contentRaw) &&
  /missing rationale|rationale not provided/.test(content)
);

// T5.6 — AC3: divergence section referenced in output format description
assert(
  'T5.6 — AC3: divergence section in output format',
  /divergence section|divergence record/.test(content)
);

// T5.7 — AC4: default save path pattern
assert(
  'T5.7 — AC4: default save path artefacts/prioritise-',
  content.includes('artefacts/prioritise-')
);

// T5.8 — AC4: confirm-before-save language
assert(
  'T5.8 — AC4: confirm-before-save language',
  /confirm.*path|path.*confirm|confirm the path|confirming.*path/.test(content) ||
  /do not save without|save without confirm/.test(content)
);

// T5.9 — AC5: clean exit language
assert(
  'T5.9 — AC5: clean exit ("session is complete" or equivalent)',
  /session is complete|the session is complete|session complete/.test(content) ||
  (/complete/.test(content) && /confirmed path|path.*confirmed/.test(content))
);

// T5.10 — AC6: integration — contracts script exits 0
assert(
  'T5.10 — AC6: check-skill-contracts.js exits 0',
  (() => {
    try {
      execSync('node .github/scripts/check-skill-contracts.js', { cwd: REPO_ROOT, stdio: 'pipe' });
      return true;
    } catch (e) {
      return false;
    }
  })()
);

// T5.11 — AC6: prioritise entry exists in CONTRACTS[]
assert(
  'T5.11 — AC6: prioritise entry in CONTRACTS[]',
  /prioritise/.test(contractsRaw) &&
  /CONTRACTS/.test(contractsRaw)
);

// T5.12 — AC7: WSJF expanded
assert(
  'T5.12 — AC7: WSJF expanded (Weighted Shortest Job First)',
  /weighted shortest job first/i.test(contentRaw)
);

// T5.13 — AC7: RICE expanded
assert(
  'T5.13 — AC7: RICE expanded (Reach, Impact, Confidence, Effort)',
  /reach.{0,10}impact.{0,10}confidence.{0,10}effort/i.test(contentRaw) ||
  /reach-impact-confidence-effort/i.test(contentRaw)
);

// T5.14 — AC7: MoSCoW expanded
assert(
  'T5.14 — AC7: MoSCoW expanded (Must-have/Should-have/Could-have/Won\'t-have)',
  /must.have.*should.have.*could.have/i.test(contentRaw)
);

// T5.15 — AC8: extension point section with required content
assert(
  'T5.15 — AC8: extension point section with how-to content',
  /adding a new framework|extension point|v2 extension/i.test(contentRaw) &&
  /sections to add|scoring dimension|output format field|how to add/i.test(contentRaw)
);

// T5.16 — NFR: same as T5.10 (confirm 0 violations)
assert(
  'T5.16 — NFR: check-skill-contracts.js 0 violations',
  (() => {
    try {
      const out = execSync('node .github/scripts/check-skill-contracts.js', { cwd: REPO_ROOT, encoding: 'utf8' });
      return /0 violation|all contracts passed|OK/i.test(out);
    } catch (e) {
      return false;
    }
  })()
);

console.log(`\n[check-pr.5] Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

process.exit(failed > 0 ? 1 : 0);
