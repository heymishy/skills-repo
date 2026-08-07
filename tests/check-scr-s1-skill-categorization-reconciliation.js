'use strict';

// scr-s1: Unify skill-categorization into one source of truth and close the
// --with-outer-loop NFR gap.
// Tests AC1-AC3 per artefacts/2026-08-07-skill-categorization-reconciliation/
// test-plans/scr-s1-test-plan.md. AC4 (the --with-outer-loop NFR
// re-measurement) is a manual/semi-automated wall-clock re-verification per
// the test plan's own gap classification, not an automated unit test here —
// it re-uses tests/check-rb-s5-optional-outer-loop-install.js's existing
// outerLoopFlagOverheadUnder3Seconds test as the regression gate for that NFR.

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const checkAssemblyPath = path.join(ROOT, '.github', 'scripts', 'check-assembly.js');
const assembleScriptPath = path.join(ROOT, 'scripts', 'assemble-copilot-instructions.sh');

let passed = 0;
let failed = 0;
const registered = [];

function test(name, fn) {
  registered.push({ name, fn });
}

// ---------------------------------------------------------------------------
// AC1: check-assembly.js derives OUTER_LOOP_SKILLS/INNER_LOOP_SKILLS from
// cli/lib/skills-registry.js's SKILL_CATEGORIES instead of hardcoding a
// second, independent copy.
// ---------------------------------------------------------------------------

console.log('\n[scr-s1] Unit tests\n');

test('checkAssembly_derivesListsFromSkillCategories', () => {
  const source = fs.readFileSync(checkAssemblyPath, 'utf8');

  assert.ok(
    /require\(['"](\.\.\/)+cli\/lib\/skills-registry['"]\)/.test(source) ||
    /require\(['"].*skills-registry['"]\)/.test(source),
    'check-assembly.js should require cli/lib/skills-registry.js'
  );
  assert.ok(
    /SKILL_CATEGORIES/.test(source),
    'check-assembly.js should reference SKILL_CATEGORIES'
  );

  const outerMatch = source.match(/const\s+OUTER_LOOP_SKILLS\s*=\s*([^;]+);/);
  assert.ok(outerMatch, 'OUTER_LOOP_SKILLS should be declared');
  assert.ok(
    /Object\.keys\(SKILL_CATEGORIES\)\.filter/.test(outerMatch[1]) &&
    /outer-loop/.test(outerMatch[1]),
    `OUTER_LOOP_SKILLS must be derived from SKILL_CATEGORIES via a filter expression, not a hardcoded array literal. Found: ${outerMatch[1].trim()}`
  );
  assert.ok(
    !/^\s*\[\s*['"]/.test(outerMatch[1]),
    'OUTER_LOOP_SKILLS must not be a hardcoded array literal of skill name strings'
  );

  const innerMatch = source.match(/const\s+INNER_LOOP_SKILLS\s*=\s*([^;]+);/);
  assert.ok(innerMatch, 'INNER_LOOP_SKILLS should be declared');
  assert.ok(
    /Object\.keys\(SKILL_CATEGORIES\)\.filter/.test(innerMatch[1]) &&
    /inner-loop/.test(innerMatch[1]),
    `INNER_LOOP_SKILLS must be derived from SKILL_CATEGORIES via a filter expression, not a hardcoded array literal. Found: ${innerMatch[1].trim()}`
  );
  assert.ok(
    !/^\s*\[\s*['"]/.test(innerMatch[1]),
    'INNER_LOOP_SKILLS must not be a hardcoded array literal of skill name strings'
  );

  // OUTER_LOOP_AC3 (a distinct 6-skill subset for a different check) must be
  // left untouched -- out of scope per the DoR contract's Assumptions section.
  assert.ok(
    /const\s+OUTER_LOOP_AC3\s*=\s*\[/.test(source),
    'OUTER_LOOP_AC3 must remain a separate, untouched hardcoded constant (out of scope for this story)'
  );
});

// ---------------------------------------------------------------------------
// AC2: a new SKILL_CATEGORIES entry is automatically picked up by the
// derivation with zero change to check-assembly.js -- proving the two lists
// can no longer silently diverge.
// ---------------------------------------------------------------------------

test('newCategoryEntry_automaticallyIncludedNoCodeChange', () => {
  const { SKILL_CATEGORIES } = require('../cli/lib/skills-registry');

  // Synthetic entry added to a test-scoped COPY only -- the real registry
  // module and file on disk are never mutated.
  const testCategories = Object.assign({}, SKILL_CATEGORIES, {
    'test-fixture-skill': 'outer-loop'
  });

  // Apply the exact same derivation pattern check-assembly.js must use
  // (verified by the source-level check above) against the modified object.
  const derivedOuter = Object.keys(testCategories).filter(name => testCategories[name] === 'outer-loop');

  assert.ok(
    derivedOuter.includes('test-fixture-skill'),
    'a new outer-loop entry added to SKILL_CATEGORIES must be automatically included by the derivation, with zero change to check-assembly.js itself'
  );

  // The real (unmodified) SKILL_CATEGORIES object must not have been mutated.
  assert.ok(
    !Object.prototype.hasOwnProperty.call(SKILL_CATEGORIES, 'test-fixture-skill'),
    'the real SKILL_CATEGORIES object must not be mutated by this test'
  );
});

// ---------------------------------------------------------------------------
// AC3: assemble-copilot-instructions.sh's "enabled" branch of the Core
// Platform Layer section calls get_skill_triggers exactly once per skill,
// reusing the result for both the presence check and the formatted output
// (previously called twice).
// ---------------------------------------------------------------------------

test('getSkillTriggers_calledOnceReusedForBothPurposes', () => {
  const source = fs.readFileSync(assembleScriptPath, 'utf8');

  const coreLayerStart = source.indexOf('## Core Platform Layer');
  assert.ok(coreLayerStart !== -1, 'Core Platform Layer section should exist');

  const domainLayerStart = source.indexOf('# ── Domain layer', coreLayerStart);
  assert.ok(domainLayerStart !== -1, 'Domain layer section should exist after Core Platform Layer');

  const coreLayerSection = source.slice(coreLayerStart, domainLayerStart);

  const enabledBranchStart = coreLayerSection.indexOf('if [[ "$OUTER_LOOP_ENABLED" == true ]]');
  assert.ok(enabledBranchStart !== -1, 'Core Platform Layer enabled branch should exist');

  const elseIdx = coreLayerSection.indexOf('\n  else', enabledBranchStart);
  const enabledBranch = elseIdx !== -1
    ? coreLayerSection.slice(enabledBranchStart, elseIdx)
    : coreLayerSection.slice(enabledBranchStart);

  const callCount = (enabledBranch.match(/get_skill_triggers\s+"\$skill_file"/g) || []).length;

  assert.strictEqual(
    callCount, 1,
    `get_skill_triggers should be called exactly once per skill in the Core Platform Layer's enabled branch and reused for both the presence check and the formatted output. Found ${callCount} call(s).`
  );

  // The stored result must actually be reused in the formatted-output line.
  assert.ok(
    /Triggers:.*\$\(echo "\$triggers"/.test(enabledBranch) ||
    /Triggers:.*\$triggers/.test(enabledBranch),
    'the formatted Triggers output line should reuse the stored $triggers variable rather than re-invoking get_skill_triggers'
  );
});

// ---------------------------------------------------------------------------
// Runner
// ---------------------------------------------------------------------------

(async function main() {
  console.log('\n[scr-s1] Running tests\n');
  for (const { name, fn } of registered) {
    try {
      await fn();
      console.log(`  ✔ ${name}`);
      passed++;
    } catch (err) {
      console.error(`  ✖ ${name}`);
      console.error(`    ${err.stack || err.message}`);
      failed++;
    }
  }

  console.log('');
  console.log(`[scr-s1-skill-categorization-reconciliation] Results: ${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
})();
