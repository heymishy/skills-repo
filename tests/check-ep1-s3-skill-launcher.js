#!/usr/bin/env node
/**
 * check-ep1-s3-skill-launcher.js -- AC verification for ep1-s3
 * (skill launcher redesign: 5 primary CTAs, collapsible advanced section).
 *
 * Story: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s3.md
 * Test plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s3-test-plan.md
 * Implementation plan: artefacts/2026-09-28-weeb-ui-learnings-and-improvements/plans/ep1-s3-plan.md
 *
 * Run: node tests/check-ep1-s3-skill-launcher.js
 */
'use strict';

const assert = require('assert');
const { renderSkillLauncher, PRIMARY_SKILLS } = require('../src/web-ui/skill-launcher');

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log('  ✓ ' + name); passed++; }
  catch (err) { console.log('  ✗ ' + name + ' -- ' + (err && err.message || err)); failed++; }
}

const FULL_SKILLS = [
  { name: 'discovery', description: 'Discovery desc.' },
  { name: 'ideate', description: 'Ideate desc.' },
  { name: 'reverse-engineer', description: 'Reverse-engineer desc.' },
  { name: 'spike', description: 'Spike desc.' },
  { name: 'improve', description: 'Improve desc.' },
  { name: 'test-plan', description: 'Test-plan desc.' },
  { name: 'clarify', description: 'Clarify desc.' },
];

test('PRIMARY_SKILLS is exactly the 5 stable, hardcoded names in order (AC6)', function() {
  assert.deepStrictEqual(PRIMARY_SKILLS, ['discovery', 'ideate', 'reverse-engineer', 'spike', 'improve']);
});

test('AC2: primary section contains exactly the 5 primary skills, no chained skills', function() {
  const html = renderSkillLauncher(FULL_SKILLS, 'csrf-token-abc');
  const primaryMatch = html.match(/<div class="el-primary"[^]*?<\/div>\s*<details/);
  const primarySection = primaryMatch ? primaryMatch[0] : '';
  ['discovery', 'ideate', 'reverse-engineer', 'spike', 'improve'].forEach(function(name) {
    assert.ok(primarySection.includes(name), 'expected "' + name + '" in primary section');
  });
  ['test-plan', 'clarify'].forEach(function(name) {
    assert.ok(!primarySection.includes(name), 'expected "' + name + '" NOT in primary section');
  });
});

console.log('\n[ep1-s3] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
