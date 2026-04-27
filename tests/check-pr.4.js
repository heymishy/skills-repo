'use strict';
// check-pr.4.js — AC assertions for pr.4: workshopping mode and facilitation prompts
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

console.log('\n[check-pr.4] /prioritise SKILL.md — workshopping mode and facilitation ACs\n');

// T4.1 — AC1: mode selection offer (solo + workshopping/group session)
assert(
  'T4.1 — AC1: mode selection offer (solo and workshopping)',
  content.includes('solo') &&
  /workshopping|group session/.test(content)
);

// T4.2 — AC2: facilitation prompt with ≥2 named roles (Tech lead + PM/Product Manager)
assert(
  'T4.2 — AC2: facilitation prompt with ≥2 named roles (tech lead + pm/product manager)',
  /tech lead/.test(content) &&
  /\bpm\b|product manager|business/.test(content)
);

// T4.3 — AC2: open question pattern in facilitation context
assert(
  "T4.3 — AC2: open question pattern (What's driving)",
  /what's driving your score|what's driving/.test(content)
);

// T4.4 — AC3: conflict-surfacing language (structural check)
assert(
  'T4.4 — AC3: conflict-surfacing language ("I heard" or range surfacing)',
  /i heard.*and|heard a range|surface the range|conflicting scores|heard \d/.test(content)
);

// T4.5 — AC4: conflict recording pattern (range + agreed + note)
assert(
  'T4.5 — AC4: conflict recording (range + agreed value + note)',
  /range.*agreed|agreed.*range/.test(content) &&
  /note|concern|pressure|reason/.test(content)
);

// T4.6 — AC5: dimension pause language
assert(
  'T4.6 — AC5: dimension pause language',
  /ready to proceed|pause|before we move|before moving/.test(content)
);

// T4.7 — AC6: mode switch acceptance language
assert(
  'T4.7 — AC6: mode switch acceptance (switch to solo)',
  /switch.*solo|solo.*switch|switch to solo|switch.*mode/.test(content)
);

// T4.8 — AC7: group-attribution closing pattern
assert(
  "T4.8 — AC7: group-attribution closing (Based on your group's agreed scores)",
  /based on your group's agreed|group's agreed|the group decided/.test(content)
);

// T4.9 — AC7: absence of "I recommend" as closing phrase in workshopping context
// The SKILL.md should NOT instruct the skill to say "I recommend" as its closing output
assert(
  'T4.9 — AC7: no "I recommend" framing in workshopping closing',
  !content.includes('i recommend') ||
  // if "i recommend" appears, it must not appear in the workshopping closing section
  (() => {
    // check that "i recommend" does not appear near "workshopping" or "group" closing markers
    const idx = content.indexOf('i recommend');
    if (idx === -1) return true;
    const surrounding = content.slice(Math.max(0, idx - 300), idx + 300);
    return !(/based on your group|workshopping mode|group's agreed/.test(surrounding));
  })()
);

// T4.10 — NFR: check-skill-contracts.js exits 0
assert(
  'T4.10 — NFR: check-skill-contracts.js exits 0',
  (() => {
    try {
      execSync('node .github/scripts/check-skill-contracts.js', { cwd: path.join(__dirname, '..'), stdio: 'pipe' });
      return true;
    } catch (e) {
      return false;
    }
  })()
);

console.log(`\n[check-pr.4] Results: ${passed} passed, ${failed} failed`);
if (failures.length) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

process.exit(failed > 0 ? 1 : 0);
