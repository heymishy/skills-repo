// check-i3.1-discovery-attribution.js
// Pre-committed failing tests for i3.1 — Attribution fields in /discovery SKILL.md
// Test plan: artefacts/2026-04-30-governed-distribution-and-onboarding/test-plans/i3.1-attribution-fields-in-discovery-test-plan.md
// 7 unit + 3 integration + 2 NFR = 12 total
// Tests will FAIL (RED) before i3.1 implementation; must all PASS (GREEN) after.

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '../.github/skills/discovery/SKILL.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    console.log(`  PASS  ${label}`);
    passed++;
  } else {
    console.log(`  FAIL  ${label}`);
    failed++;
  }
}

const skillContent = fs.existsSync(SKILL_PATH) ? fs.readFileSync(SKILL_PATH, 'utf8') : '';

console.log('\n--- i3.1 discovery attribution tests ---\n');
console.log('--- Unit Tests ---\n');

// U1 — SKILL.md contains ## Attribution heading
// AC1: attribution section present
assert(
  /^## Attribution/m.test(skillContent),
  'U1: discovery SKILL.md contains ## Attribution section heading'
);

// U2 — Attribution section contains Contributors field
// AC1: Contributors sub-field present
assert(
  /\bContributors\b/.test(skillContent),
  'U2: attribution section contains Contributors field label'
);

// U3 — Attribution section contains Reviewers field
// AC1: Reviewers sub-field present
assert(
  /\bReviewers\b/.test(skillContent),
  'U3: attribution section contains Reviewers field label'
);

// U4 — Attribution section contains Approved By field
// AC1: Approved By sub-field present
assert(
  /Approved By/.test(skillContent),
  'U4: attribution section contains Approved By field label'
);

// U5 — Completion message references Approved By and placeholder state
// AC2: reminder present when Approved By is empty/Pending
assert(
  /Approved By/.test(skillContent) && /[Pp]ending|empty|placeholder/.test(skillContent),
  'U5: SKILL.md completion/reminder section references Approved By and placeholder/Pending state'
);

// U6 — SKILL.md specifies Name — Role — Date format
// AC3: format specification present
assert(
  /Name\s*[—–-]\s*Role\s*[—–-]\s*Date/.test(skillContent),
  'U6: SKILL.md specifies Name — Role — Date attribution format'
);

// U7 — Step 1 contains contributor name/role prompt
// AC5: contributor prompt in Step 1 (before finalisation)
assert(
  /Step 1[\s\S]{0,800}[Cc]ontributor/m.test(skillContent) ||
  /## Step 1[\s\S]{0,800}[Cc]ontributor/m.test(skillContent),
  'U7: Step 1 section contains contributor name/role prompt'
);

console.log('\n--- Integration Tests ---\n');

// I1 — Attribution section appears inside the output artefact template block
// AC1: attribution is part of what the skill emits, not just surrounding prose
assert(
  /## Attribution/.test(skillContent) &&
  (/template|output|artefact|produce|emit|section/i.test(skillContent)),
  'I1: attribution section is part of the artefact output template (not only in narrative prose)'
);

// I2 — Reminder instruction is conditional on empty/placeholder Approved By
// AC2: reminder is not unconditional — tied to empty/Pending state
assert(
  /Approved By/.test(skillContent) &&
  (/[Ii]f.*[Pp]ending|[Pp]ending.*remind|empty.*warn|warn.*empty|placeholder.*remind|remind.*placeholder/i.test(skillContent) ||
   /[Aa]pproved By.*[Pp]ending|[Pp]ending.*[Aa]pproved By/i.test(skillContent)),
  'I2: Approved By reminder is conditional on empty/placeholder state (not unconditional)'
);

// I3 — Contributor prompt appears before artefact-finalisation instructions
// AC5: prompt offset < finalise offset
(function () {
  const promptMatch = skillContent.search(/[Cc]ontributor.*name|name.*[Cc]ontributor|[Cc]ontributor.*role/i);
  const finaliseMatch = skillContent.search(/finalise|finalize|output.*artefact|artefact.*output|save.*artefact|artefact.*complete/i);
  assert(
    promptMatch !== -1 && finaliseMatch !== -1 && promptMatch < finaliseMatch,
    'I3: contributor prompt instruction appears before artefact-finalisation in SKILL.md'
  );
})();

console.log('\n--- NFR Tests ---\n');

// N1 — Attribution section heading uses ## (matches existing section level)
// NFR: consistency — not ### for a top-level section
assert(
  /^## Attribution/m.test(skillContent),
  'N1: Attribution heading uses ## level (consistent with other top-level sections)'
);

// N2 — Attribution field labels include format hints
// NFR: readability — each sub-field has a parenthetical or inline hint
assert(
  /Contributors[\s\S]{0,200}Name|Approved By[\s\S]{0,200}Name.*Role.*Date|Name.*Role.*Date[\s\S]{0,200}Approved By/i.test(skillContent),
  'N2: attribution field labels include format hints (e.g. Name — Role — Date for Approved By)'
);

console.log(`\n${passed} passing, ${failed} failing\n`);
process.exit(failed > 0 ? 1 : 0);
