// check-i3.2-benefit-metric-attribution.js
// Pre-committed failing tests for i3.2 — Attribution acknowledgement in /benefit-metric SKILL.md
// Test plan: artefacts/2026-04-30-governed-distribution-and-onboarding/test-plans/i3.2-attribution-fields-in-benefit-metric-test-plan.md
// 8 unit + 4 integration + 1 NFR = 13 total
// Tests will FAIL (RED) before i3.2 implementation; must all PASS (GREEN) after.

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '../.github/skills/benefit-metric/SKILL.md');

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

console.log('\n--- i3.2 benefit-metric attribution tests ---\n');
console.log('--- Unit Tests ---\n');

// U1 — SKILL.md contains an attribution check instruction
// AC1: attribution check step is present
assert(
  /Approved By/.test(skillContent) && /attribution|Attribution/.test(skillContent),
  'U1: benefit-metric SKILL.md contains an attribution check instruction referencing Approved By'
);

// U2 — Attribution check instruction precedes first metric-definition question
// AC1: attribution check comes before metric questions
(function () {
  const attrOffset = skillContent.search(/Approved By.*attribution|attribution.*Approved By|[Cc]heck.*attribution|attribution.*[Cc]heck|read.*Approved By|Approved By.*read/i);
  const metricOffset = skillContent.search(/[Ww]hat.*metric|metric.*question|[Mm]1[^A-Za-z]|[Bb]enefit.*metric.*question|define.*metric|metric.*name/i);
  assert(
    attrOffset !== -1 && metricOffset !== -1 && attrOffset < metricOffset,
    'U2: attribution check instruction precedes first metric-definition question in SKILL.md'
  );
})();

// U3 — SKILL.md contains warning instruction for empty/placeholder Approved By
// AC2: warning present for empty state
assert(
  /[Ww]arn|warning|Warning/.test(skillContent) &&
  /Approved By/.test(skillContent) &&
  /empty|placeholder|[Pp]ending/.test(skillContent),
  'U3: SKILL.md contains warning instruction for empty or placeholder Approved By'
);

// U4 — Warning includes option (a) to pause
// AC2: pause option explicitly described
assert(
  /option.*a|a\).*pause|pause.*option|stop.*return|return.*discovery|[Pp]ause/i.test(skillContent),
  'U4: SKILL.md warning includes option (a) to pause and return to discovery artefact'
);

// U5 — Warning includes option (b) to proceed with acknowledgement
// AC2: proceed option explicitly described
assert(
  /option.*b|b\).*proceed|proceed.*option|proceed.*acknowledg|acknowledg.*proceed/i.test(skillContent),
  'U5: SKILL.md warning includes option (b) to proceed with acknowledgement'
);

// U6 — SKILL.md specifies clean-pass path when Approved By is populated
// AC3: non-empty field = no interruption
assert(
  /populated|non-empty|substantive|not empty|has.*value|value.*present/i.test(skillContent),
  'U6: SKILL.md specifies clean-pass path when Approved By is substantively populated'
);

// U7 — SKILL.md handles absent attribution section same as empty field
// AC4: absent section triggers warning, not silent pass
assert(
  /absent|missing.*section|section.*missing|no.*attribution|attribution.*section.*absent|absent.*attribution/i.test(skillContent),
  'U7: SKILL.md handles absent attribution section (treats as empty — triggers warning)'
);

// U8 — SKILL.md specifies "Attribution incomplete" note text for option (b)
// AC5: note text instruction present
assert(
  /Attribution incomplete/i.test(skillContent),
  'U8: SKILL.md specifies "Attribution incomplete" note text for option (b) path'
);

console.log('\n--- Integration Tests ---\n');

// I1 — Attribution check appears as Step 1 (first step in SKILL.md step sequence)
// AC1: attribution check is Step 1
assert(
  /Step 1[\s\S]{0,600}Approved By|Step 1[\s\S]{0,600}attribution/im.test(skillContent),
  'I1: attribution check appears in Step 1 (first step in the SKILL.md step sequence)'
);

// I2 — Warning is tied to BOTH empty-field and absent-section conditions
// AC2 + AC4: both conditions trigger the same warning
assert(
  (/empty|placeholder|[Pp]ending/.test(skillContent)) &&
  (/absent|missing.*section|section.*missing|no.*attribution/i.test(skillContent)),
  'I2: warning instruction covers both empty-field and absent-section conditions'
);

// I3 — "Attribution incomplete" note is tied to option (b) path (not unconditional)
// AC5: note only written when option (b) chosen
(function () {
  const optionBOffset = skillContent.search(/option.*b|b\).*proceed|proceed.*acknowledg/i);
  const noteOffset = skillContent.search(/Attribution incomplete/i);
  assert(
    optionBOffset !== -1 && noteOffset !== -1 &&
    Math.abs(noteOffset - optionBOffset) < 600,
    'I3: "Attribution incomplete" note instruction is positioned within/near option (b) path (not unconditional)'
  );
})();

// I4 — Absent section and empty field produce equivalent warning behaviour
// AC4: one warning template handles both; no silent divergence
assert(
  /equivalent|same.*warning|same.*message|treat.*same|as.*empty/i.test(skillContent) ||
  (/absent|missing.*section/i.test(skillContent) &&
   /empty|placeholder/i.test(skillContent) &&
   /warn|warning/i.test(skillContent)),
  'I4: absent attribution section and empty Approved By field produce equivalent warning behaviour'
);

console.log('\n--- NFR Tests ---\n');

// N1 — SKILL.md references field as "Approved By" (exact match — cross-story consistency with i3.1/i3.3)
// NFR: consistent field name
assert(
  /Approved By/.test(skillContent),
  'N1: SKILL.md references attribution field as "Approved By" (consistent with i3.1 naming contract)'
);

console.log(`\n${passed} passing, ${failed} failing\n`);
process.exit(failed > 0 ? 1 : 0);
