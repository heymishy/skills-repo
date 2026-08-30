#!/usr/bin/env node
// check-rssp-s1-review-skill-no-selection-prompts.js -- rssp-s1: /review must
// never ask which stories or which categories to run -- always proceed
// straight into all 5 categories against all stories.
//
// Story:     artefacts/2026-08-31-review-skill-skip-selection-prompts/stories/rssp-s1-remove-review-selection-prompts.md
// Test plan: artefacts/2026-08-31-review-skill-skip-selection-prompts/test-plans/rssp-s1-test-plan.md

'use strict';

const assert = require('assert');
const fs     = require('fs');
const path   = require('path');

const SKILL_PATH = path.join(__dirname, '..', 'skills', 'review', 'SKILL.md');
const content = fs.readFileSync(SKILL_PATH, 'utf8');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  PASS: ' + name);
  } catch (err) {
    failed++;
    const msg = err && err.message ? err.message : String(err);
    failures.push({ name: name, msg: msg });
    console.log('  FAIL: ' + name + '\n       ' + msg);
  }
}

test('step1SelectionPromptRemovedAndDirectStatementPresent', function() {
  assert.ok(
    content.indexOf('Review all stories, or a specific one?') === -1,
    'expected the old "Review all stories, or a specific one?" prompt to be removed'
  );
  assert.ok(
    /Reviewing all .*stories, all 5 categories/i.test(content),
    'expected a direct statement naming "all stories" and "all 5 categories" together'
  );
});

test('step2CategoryPromptRemoved', function() {
  assert.ok(
    content.indexOf('Which review categories should I run?') === -1,
    'expected the old "Which review categories should I run?" prompt to be removed'
  );
  assert.ok(
    content.indexOf('C and D only (short-track stories)') === -1,
    'expected the old category reply-menu block to be removed'
  );
});

test('explicitInstructionExceptionStillDocumented', function() {
  assert.ok(
    /explicitly (named|name|instructed|told)/i.test(content) && /specific story/i.test(content),
    'expected language preserving the "if the operator already named a specific story, respect that" exception'
  );
});

test('sessionRecoveryExclusionLogicUnchanged', function() {
  assert.ok(
    content.indexOf('Session recovery check') !== -1,
    'expected the Session recovery check heading/language to still be present'
  );
  assert.ok(
    /exclude them from the scope/i.test(content),
    'expected the already-reviewed exclusion language to still be present'
  );
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  console.log('\nFailed tests:');
  failures.forEach(function(f) { console.log('  x ' + f.name + '\n    ' + f.msg); });
  process.exit(1);
}
