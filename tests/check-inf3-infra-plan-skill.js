#!/usr/bin/env node
// check-inf3-infra-plan-skill.js
// Tests for inf.3: .github/skills/infra-plan/SKILL.md content assertions
// 9 unit + 1 NFR = 10 tests
// Run: node tests/check-inf3-infra-plan-skill.js
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const SKILL_MD = path.join(ROOT, '.github', 'skills', 'infra-plan', 'SKILL.md');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    process.stdout.write('  ✓ ' + label + '\n');
    passed++;
  } else {
    process.stdout.write('  ✗ FAIL: ' + label + '\n');
    failed++;
  }
}

const skillExists = fs.existsSync(SKILL_MD);
const content     = skillExists ? fs.readFileSync(SKILL_MD, 'utf8') : '';
const lower       = content.toLowerCase();

// ── Unit Tests ────────────────────────────────────────────────────────────────

process.stdout.write('\n[inf.3] Unit tests\n');

// infra-plan-skill-file-exists (AC1)
assert(skillExists, 'infra-plan-skill-file-exists: .github/skills/infra-plan/SKILL.md exists');

// skill-specifies-entry-condition-passing-review (AC1)
assert(
  lower.includes('infra-review') && (lower.includes('pass') || lower.includes('entry condition')),
  'skill-specifies-entry-condition-passing-review: SKILL.md states passing infra-review is required entry condition');

// skill-specifies-output-path-convention (AC1)
assert(
  content.includes('infra-plan.md') || (lower.includes('infra/') && lower.includes('-infra-plan')),
  'skill-specifies-output-path-convention: SKILL.md specifies infra-plan.md output path');

// skill-contains-tier-execution-sequence (AC2)
assert(
  (lower.includes('tier') && (lower.includes('execution sequence') || lower.includes('execution order') || lower.includes('apply') || lower.includes('execute'))),
  'skill-contains-tier-execution-sequence: SKILL.md contains tier execution sequence section');

// skill-contains-per-tier-validation-checkpoints (AC2)
assert(
  lower.includes('checkpoint') || (lower.includes('per-tier') && lower.includes('validat')) || (lower.includes('tier') && lower.includes('before proceeding')),
  'skill-contains-per-tier-validation-checkpoints: SKILL.md contains per-tier validation checkpoints');

// skill-contains-operator-execution-checklist (AC2)
assert(
  lower.includes('checklist') || (lower.includes('operator') && lower.includes('step')),
  'skill-contains-operator-execution-checklist: SKILL.md contains operator execution checklist');

// skill-blocks-sign-off-on-unacknowledged-destructive (AC3)
assert(
  content.includes('DESTRUCTIVE') && (lower.includes('block') || lower.includes('refuse') || lower.includes('cannot') || lower.includes('must not')),
  'skill-blocks-sign-off-on-unacknowledged-destructive: SKILL.md blocks sign-off if infra-review has unacknowledged DESTRUCTIVE finding');

// skill-surfaces-unacknowledged-finding-on-block (AC3)
assert(
  lower.includes('surface') || lower.includes('re-surface') || (lower.includes('unacknowledged') && lower.includes('finding')),
  'skill-surfaces-unacknowledged-finding-on-block: SKILL.md instructs surfacing unacknowledged finding when blocking');

// sign-off-artefact-has-status-pass (AC4)
assert(
  content.includes('status: PASS') || content.includes('Status: PASS') || content.includes('**Status:** PASS') || (lower.includes('status') && lower.includes('pass')),
  'sign-off-artefact-has-status-pass: SKILL.md specifies status PASS field in sign-off artefact');

// ── NFR Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\n[inf.3] NFR tests\n');

// infra-plan-artefact-path-follows-audit-convention (NFR-Audit)
assert(
  content.includes('infra-plan.md') && (content.includes('artefacts/') || lower.includes('[feature]')),
  'infra-plan-artefact-path-follows-audit-convention: artefact path documented for /trace reference (NFR-Audit)');

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[inf.3] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
