// check-p11-hgov.js
// Pre-committed failing stubs for p11.3 — H-GOV hard block in /definition-of-ready SKILL.md
// Test plan: artefacts/2026-04-24-platform-onboarding-distribution/test-plans/p11.3-test-plan.md
// 10 unit tests (T1–T10) + 1 integration test (I1) = 11 total
// ADR-017: H-GOV uses presence-only check — any named non-blank entry in ## Approved By passes.

'use strict';

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const SKILL_PATH = path.join(__dirname, '../.github/skills/definition-of-ready/SKILL.md');
const CONTRACT_SCRIPT = path.join(__dirname, '../.github/scripts/check-skill-contracts.js');

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

console.log('\n--- p11.3 H-GOV hard block tests ---\n');

// T1 — SKILL.md H-GOV block describes the passing condition (non-engineering approver)
// AC1: non-engineering entry → H-GOV passes
assert(
  /H-GOV/i.test(skillContent) && /pass/i.test(skillContent) && /Approved By/i.test(skillContent),
  'T1: SKILL.md contains H-GOV pass condition referencing Approved By'
);

// T2 — SKILL.md H-GOV text specifies DoR continues (not blocked) on pass
// AC1: DoR checklist continues after H-GOV pass
assert(
  /H-GOV/.test(skillContent) && /continu|proceed/i.test(skillContent),
  'T2: SKILL.md states DoR continues after H-GOV pass'
);

// T3 — SKILL.md H-GOV block names "H-GOV" in the fail message for empty section
// AC2 (part a): message names H-GOV explicitly
assert(
  (skillContent.match(/H-GOV/g) || []).length >= 2,
  'T3: H-GOV named at least twice in SKILL.md (heading + fail message)'
);

// T4 — SKILL.md H-GOV failure text describes what is missing (empty approved-by)
// AC2 (part b): states missing content
assert(
  /empty|no entries|no approver|Approved By.*empty|empty.*Approved By/i.test(skillContent),
  'T4: SKILL.md failure text describes empty Approved By section'
);

// T5 — SKILL.md H-GOV failure text provides a concrete resolution step
// AC2 (part c): gives resolution step
assert(
  /resolution|resolve|add.*approver|approver.*to.*discovery|Approved By.*section|fix:/i.test(skillContent),
  'T5: SKILL.md H-GOV failure text includes a resolution step'
);

// T6 — SKILL.md H-GOV text handles absent section (references updated template)
// AC3: section entirely missing → references template
assert(
  /absent|missing.*section|section.*missing|not.*present|does not.*exist|template/i.test(skillContent),
  'T6: SKILL.md H-GOV handles absent Approved By section and references template'
);

// T7 — SKILL.md H-GOV absent-section case is a hard block (not a warning)
// AC3: fires as hard block
assert(
  /H-GOV.*FAIL|FAIL.*H-GOV|hard block|H-GOV.*block|block.*H-GOV/i.test(skillContent),
  'T7: SKILL.md describes absent section as a hard block failure, not a warning'
);

// T8 — SKILL.md H-GOV text distinguishes engineer-only entries from absent/empty
// AC4: engineer-only case is specifically distinguished
assert(
  /engineer.only|only.*engineer|engineering.only|only.*engineering/i.test(skillContent),
  'T8: SKILL.md H-GOV distinguishes engineer-only entries case'
);

// T9 — SKILL.md H-GOV engineer-only is a distinct fail reason (not a catch-all)
// AC4: separate discrimination in instruction text
assert(
  /engineer.only|only.*engineer|engineering.only|only.*engineering/i.test(skillContent) &&
  /empty|absent|missing/i.test(skillContent),
  'T9: SKILL.md H-GOV has distinct fail text for engineer-only vs empty/absent cases'
);

// T10 — DoR SKILL.md contains the <!-- h-gov-block --> contract marker
// AC5: marker must be present verbatim
assert(
  skillContent.includes('h-gov-block'),
  'T10: SKILL.md contains h-gov-block contract marker'
);

// I1 — check-skill-contracts.js passes for definition-of-ready after change
// AC5: integration — contract script exits 0
console.log('\n--- Integration test ---\n');
try {
  execSync(`node "${CONTRACT_SCRIPT}"`, { stdio: 'pipe' });
  assert(true, 'I1: check-skill-contracts.js exits 0 (definition-of-ready h-gov-block contract passes)');
} catch (e) {
  const output = (e.stdout || '').toString() + (e.stderr || '').toString();
  assert(false, `I1: check-skill-contracts.js exits 0 — FAILED\n       ${output.split('\n')[0]}`);
}

console.log(`\n${passed} passing, ${failed} failing\n`);
process.exit(failed > 0 ? 1 : 0);
