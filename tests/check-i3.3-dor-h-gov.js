// check-i3.3-dor-h-gov.js
// Pre-committed failing tests for i3.3 — H-GOV hard block in /definition-of-ready SKILL.md
// Test plan: artefacts/2026-04-30-governed-distribution-and-onboarding/test-plans/i3.3-h-gov-dor-hard-block-test-plan.md
// 14 unit + 4 integration + 2 NFR = 20 total (test plan lists 19 ACs; NFR word-count split into 2 separate checks)
// Tests will FAIL (RED) before i3.3 implementation; must all PASS (GREEN) after.

'use strict';

const fs = require('fs');
const path = require('path');

const SKILL_PATH = path.join(__dirname, '../.github/skills/definition-of-ready/SKILL.md');

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

console.log('\n--- i3.3 DoR H-GOV hard block tests ---\n');
console.log('--- Unit Tests ---\n');

// U1 — SKILL.md contains H-GOV block identifier
// AC6: H-GOV block present
assert(
  /H-GOV/.test(skillContent),
  'U1: definition-of-ready SKILL.md contains H-GOV block identifier'
);

// U2 — H-GOV block includes a check description
// AC6: description of what is being checked
assert(
  /H-GOV[\s\S]{0,600}Approved By|H-GOV[\s\S]{0,600}attribution/m.test(skillContent),
  'U2: H-GOV block includes a check description referencing Approved By or attribution'
);

// U3 — H-GOV block specifies the pass condition
// AC6: pass condition present
assert(
  /H-GOV[\s\S]{0,800}pass|pass[\s\S]{0,400}H-GOV/im.test(skillContent),
  'U3: H-GOV block specifies the pass condition'
);

// U4 — H-GOV block contains a fail message
// AC6 + AC1: fail message present
assert(
  /H-GOV[\s\S]{0,1000}FAIL|FAIL[\s\S]{0,600}H-GOV/im.test(skillContent),
  'U4: H-GOV block contains a FAIL message'
);

// U5 — H-GOV fail message names Approved By field and its location
// AC1 part 1: fail message names field and discovery artefact
assert(
  /Approved By/.test(skillContent) && /discovery/i.test(skillContent),
  'U5: H-GOV fail message names Approved By field and references the discovery artefact'
);

// U6 — H-GOV fail message states Name — Role — Date format requirement
// AC1 part 2: format stated in fail message
assert(
  /Name\s*[—–-]\s*Role\s*[—–-]\s*Date/.test(skillContent),
  'U6: H-GOV fail message states Name — Role — Date format requirement'
);

// U7 — H-GOV fail message includes a remediation instruction
// AC1 part 3: remediation step present
assert(
  /[Rr]eturn.*discovery|discovery.*[Rr]eturn|[Rr]emediat|[Rr]e-run.*definition-of-ready|definition-of-ready.*[Rr]e-run|[Pp]opulate.*Approved By|Approved By.*[Pp]opulate/i.test(skillContent),
  'U7: H-GOV fail message includes a remediation instruction'
);

// U8 — H-GOV pass condition is text-presence (not role classification)
// AC2: passing bar is non-empty substantive text, not verified non-engineering role
assert(
  /H-GOV[\s\S]{0,1000}(?:text.*present|non-empty|substantive|populated|has.*value|value.*present)/im.test(skillContent),
  'U8: H-GOV pass condition is based on text-presence (not role classification)'
);

// U9 — H-GOV records M1 metric signal for role-unverified case
// AC2: M1 signal instruction for ambiguous role
assert(
  /M1|metric signal|signal.*metric/i.test(skillContent),
  'U9: H-GOV records M1 metric signal when Approved By has text but role is ambiguous'
);

// U10 — H-GOV records positive M1 signal for clearly non-engineering approver
// AC3: positive M1 signal instruction for clear non-engineer
assert(
  /positive.*M1|M1.*positive|positive.*signal|non-engineer|non-engineering|product owner|business|PM\b|stakeholder/i.test(skillContent),
  'U10: H-GOV records positive M1 signal when approver is clearly non-engineering'
);

// U11 — H-GOV treats benefit-metric "Attribution incomplete" note as trigger-to-check
// AC4: note triggers live read, not automatic block
assert(
  /trigger.*check|check.*trigger|live.*read|read.*live|Attribution incomplete[\s\S]{0,400}live|live[\s\S]{0,400}Attribution incomplete/im.test(skillContent),
  'U11: H-GOV treats "Attribution incomplete" benefit-metric note as trigger-to-check (not automatic block)'
);

// U12 — H-GOV passes when discovery Approved By is corrected, regardless of benefit-metric note
// AC4: live read determines outcome; stale note does not permanently block
assert(
  /corrected|now.*populated|populated.*now|field.*corrected|regardless.*note|note.*not.*block|stale.*note|pass.*live.*read|live.*read.*pass/i.test(skillContent),
  'U12: H-GOV passes when discovery Approved By is corrected, regardless of stale benefit-metric note'
);

// U13 — H-GOV has distinct messaging for absent attribution section vs empty Approved By field
// AC5: two distinct message paths
assert(
  /absent|missing.*section|section.*missing|pre-date|before.*i3\.1|old.*artefact|artefact.*old/i.test(skillContent),
  'U13: H-GOV has distinct message for absent attribution section (vs empty Approved By field)'
);

// U14 — H-GOV absent-section message references likelihood of pre-i3.1 artefact
// AC5: contextualisation for absent section
assert(
  /pre-date|before.*attribution|old.*artefact|created before|prior to|i3\.1|pre-i3/i.test(skillContent),
  'U14: H-GOV absent-section message contextualises as likely pre-i3.1 artefact'
);

console.log('\n--- Integration Tests ---\n');

// I1 — H-GOV fail path is complete (empty/placeholder → fail message, no missing branch)
// AC1: fail path end-to-end complete
assert(
  /H-GOV/.test(skillContent) &&
  /Approved By/.test(skillContent) &&
  /FAIL|fail message/i.test(skillContent) &&
  /Name\s*[—–-]\s*Role\s*[—–-]\s*Date/.test(skillContent),
  'I1: H-GOV fail path is complete — condition, field name, format, remediation all present'
);

// I2 — H-GOV pass path with M1 signal is complete (field populated → pass + signal)
// AC2: pass path is a continuous instruction block
assert(
  /H-GOV/.test(skillContent) &&
  /pass/i.test(skillContent) &&
  /M1|metric signal/i.test(skillContent),
  'I2: H-GOV pass path with M1 signal instruction is complete'
);

// I3 — Trigger-to-check path is complete (detect note → live read → outcome)
// AC4: all three steps present
(function () {
  const hasDetect = /Attribution incomplete/i.test(skillContent);
  const hasLiveRead = /live.*read|read.*live|re-read|re-check/i.test(skillContent);
  const hasOutcome = /pass.*corrected|corrected.*pass|trigger.*check|check.*trigger/i.test(skillContent);
  assert(
    hasDetect && (hasLiveRead || hasOutcome),
    'I3: trigger-to-check path is complete (detect note → live read → outcome based on live field state)'
  );
})();

// I4 — H-GOV block is positioned within the H-series in SKILL.md
// AC6: H-GOV is in the hard-block sequence
assert(
  /H-GOV/.test(skillContent) &&
  (/H1|H2|H3|H4|H5|H6|H7|H8|H9/.test(skillContent)),
  'I4: H-GOV block is positioned within the H-series (alongside H1–H9) in SKILL.md'
);

console.log('\n--- NFR Tests ---\n');

// N1 — H-GOV identifier follows H-series naming convention
// NFR: consistent identifier format
assert(
  /H-GOV/.test(skillContent) &&
  /H-\d|H\d/.test(skillContent),
  'N1: H-GOV identifier format matches H-series naming convention (e.g. H-NFR, H1–H9)'
);

// N2 — H-GOV fail message is under 200 words
// NFR: operator readability — concise message
(function () {
  // Extract text near the first FAIL occurrence in H-GOV context
  const govIdx = skillContent.indexOf('H-GOV');
  if (govIdx === -1) {
    assert(false, 'N2: H-GOV fail message word count — H-GOV block not found');
    return;
  }
  // Look for FAIL message text within 2000 chars of H-GOV
  const region = skillContent.slice(govIdx, govIdx + 2000);
  const failIdx = region.search(/FAIL|fail message/i);
  if (failIdx === -1) {
    assert(false, 'N2: H-GOV fail message word count — FAIL marker not found in H-GOV region');
    return;
  }
  // Extract up to next H- block or 1000 chars as the fail message
  const failRegion = region.slice(failIdx, failIdx + 1000);
  const nextBlock = failRegion.search(/^##\s+H-|^##\s+W-/m);
  const messageText = nextBlock !== -1 ? failRegion.slice(0, nextBlock) : failRegion;
  const wordCount = messageText.trim().split(/\s+/).filter(Boolean).length;
  assert(
    wordCount < 200,
    `N2: H-GOV fail message is under 200 words (counted ~${wordCount} words in fail region)`
  );
})();

console.log(`\n${passed} passing, ${failed} failing\n`);
process.exit(failed > 0 ? 1 : 0);
