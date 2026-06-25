#!/usr/bin/env node
// check-inf1-infra-definition-skill.js
// Tests for inf.1: .github/skills/infra-definition/SKILL.md content assertions
// 13 unit + 2 NFR = 15 tests
// Run: node tests/check-inf1-infra-definition-skill.js
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const SKILL_MD = path.join(ROOT, '.github', 'skills', 'infra-definition', 'SKILL.md');

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

// Load skill content once
const skillExists = fs.existsSync(SKILL_MD);
const content     = skillExists ? fs.readFileSync(SKILL_MD, 'utf8') : '';
const lower       = content.toLowerCase();

// ── Unit Tests ────────────────────────────────────────────────────────────────

process.stdout.write('\n[inf.1] Unit tests\n');

// infra-definition-skill-file-exists (AC1)
assert(skillExists, 'infra-definition-skill-file-exists: .github/skills/infra-definition/SKILL.md exists');

// skill-contains-change-description-section (AC1)
assert(lower.includes('change description') || lower.includes('change-description'),
  'skill-contains-change-description-section: SKILL.md contains change description section');

// skill-contains-blast-radius-section (AC1)
assert(lower.includes('blast-radius') || lower.includes('blast radius'),
  'skill-contains-blast-radius-section: SKILL.md contains blast-radius section');

// skill-contains-rollback-plan-section (AC1, AC3)
assert(lower.includes('rollback'),
  'skill-contains-rollback-plan-section: SKILL.md contains rollback section');

// skill-contains-tier-applicability-section (AC1, AC2)
assert((lower.includes('tier') && lower.includes('applicability')) || lower.includes('tier-applicability'),
  'skill-contains-tier-applicability-section: SKILL.md contains tier-applicability section');

// skill-contains-plan-preview-attachment-section (AC1)
assert(lower.includes('plan') && lower.includes('preview') && lower.includes('attachment'),
  'skill-contains-plan-preview-attachment-section: SKILL.md contains plan/preview attachment section');

// tier-table-references-local-ci-staging-production (AC2)
assert(
  lower.includes('local') && lower.includes('ci') && lower.includes('staging') && lower.includes('production'),
  'tier-table-references-local-ci-staging-production: all four tiers present (local, ci, staging, production)');

// tier-table-has-validation-status-column (AC2)
assert(lower.includes('validated') || lower.includes('validation status'),
  'tier-table-has-validation-status-column: validation status column present in tier table');

// rollback-plan-requires-discrete-steps-not-single-sentence (AC3)
// Check that rollback section prompts for step list (numbered steps or bullets in the template)
{
  const rollbackIdx = lower.indexOf('rollback');
  const afterRollback = rollbackIdx >= 0 ? lower.slice(rollbackIdx, rollbackIdx + 800) : '';
  const hasStepLanguage = afterRollback.includes('step') || /\n\s*\d+\./.test(content.slice(rollbackIdx, rollbackIdx + 800));
  assert(hasStepLanguage,
    'rollback-plan-requires-discrete-steps-not-single-sentence: rollback section prompts for discrete steps');
}

// rollback-plan-requires-time-to-execute (AC3)
assert(lower.includes('time-to-execute') || lower.includes('estimated time') || lower.includes('time to execute'),
  'rollback-plan-requires-time-to-execute: rollback section includes time-to-execute field');

// skill-accepts-ops-prefix-in-path-guidance (AC4)
// ops/ is either explicitly mentioned OR the path guidance uses [feature] placeholder without restricting format
assert(content.includes('ops/') || (lower.includes('[feature]') && !lower.includes('must not start with ops')),
  'skill-accepts-ops-prefix-in-path-guidance: ops/ prefix is accepted in path guidance');

// skill-no-terraform-in-required-context (AC5)
// "Terraform" may appear in a non-exhaustive example list; must NOT appear as a required tool instruction
{
  const tfIdx = content.indexOf('Terraform');
  // Pass if not present at all, OR if it's clearly in an example list context (preceded by e.g., or, for example)
  const tfOk = tfIdx === -1 ||
    /(?:e\.g\.|for example|such as|including|like)[\s\S]{0,120}Terraform/i.test(content) ||
    /Terraform[\s\S]{0,120}(?:e\.g\.|for example|such as|or|and)/i.test(content);
  assert(tfOk, 'skill-no-terraform-in-required-context: Terraform not used as required tool');
}

// skill-no-pulumi-cdk-ansible-in-required-context (AC5)
{
  const tools = ['Pulumi', 'Ansible', 'CloudFormation'];
  const allOk = tools.every(function(tool) {
    const idx = content.indexOf(tool);
    if (idx === -1) return true;
    // OK if in a clearly illustrative list
    return /(?:e\.g\.|for example|such as|including|like)[\s\S]{0,120}/.test(content.slice(Math.max(0, idx - 120), idx + tool.length));
  });
  // CDK also check
  const cdkOk = !(/\bCDK\b/.test(content)) || /(?:e\.g\.|for example|such as|including|like)[\s\S]{0,120}CDK/i.test(content);
  assert(allOk && cdkOk, 'skill-no-pulumi-cdk-ansible-in-required-context: Pulumi/CDK/Ansible/CloudFormation not as required tools');
}

// ── NFR Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\n[inf.1] NFR tests\n');

// skill-contains-credentials-warning (NFR-SEC)
assert(lower.includes('credential') || lower.includes('secret') || lower.includes('token'),
  'skill-contains-credentials-warning: SKILL.md warns against pasting credentials/secrets/tokens');

// skill-warns-against-credentials-in-attachment (NFR-SEC detail)
{
  const attachIdx = lower.indexOf('attachment');
  const nearAttach = attachIdx >= 0 ? lower.slice(Math.max(0, attachIdx - 300), attachIdx + 600) : '';
  const hasWarning = nearAttach.includes('credential') || nearAttach.includes('secret') || nearAttach.includes('token') || nearAttach.includes('sensitive');
  assert(hasWarning,
    'skill-warns-against-credentials-in-attachment: credentials warning appears near plan/preview attachment section');
}

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[inf.1] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
