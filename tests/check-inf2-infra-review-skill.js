#!/usr/bin/env node
// check-inf2-infra-review-skill.js
// Tests for inf.2: .github/skills/infra-review/SKILL.md content assertions
// 11 unit + 1 NFR = 12 tests
// Run: node tests/check-inf2-infra-review-skill.js
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const SKILL_MD = path.join(ROOT, '.github', 'skills', 'infra-review', 'SKILL.md');

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

process.stdout.write('\n[inf.2] Unit tests\n');

// infra-review-skill-file-exists (AC1)
assert(skillExists, 'infra-review-skill-file-exists: .github/skills/infra-review/SKILL.md exists');

// skill-defines-destructive-severity (AC1)
assert(content.includes('DESTRUCTIVE'),
  'skill-defines-destructive-severity: SKILL.md defines DESTRUCTIVE as a named severity level');

// skill-requires-explicit-acknowledgement-for-destructive (AC1, AC5)
assert(
  lower.includes('acknowledge') || lower.includes('proceed: yes') || content.includes('PROCEED: Yes') || lower.includes('explicit'),
  'skill-requires-explicit-acknowledgement-for-destructive: SKILL.md requires explicit acknowledgement for DESTRUCTIVE findings');

// skill-defines-tier-coherence-check (AC2)
assert(
  (lower.includes('coherence') || (lower.includes('tier') && (lower.includes('order') || lower.includes('sequence') || lower.includes('before')))),
  'skill-defines-tier-coherence-check: SKILL.md contains tier coherence/ordering check');

// skill-classifies-out-of-order-tiers-as-advisory (AC2)
assert(content.includes('ADVISORY'),
  'skill-classifies-out-of-order-tiers-as-advisory: SKILL.md defines ADVISORY as a severity level');

// skill-defines-reversible-high-severity (AC3)
assert(content.includes('REVERSIBLE-HIGH'),
  'skill-defines-reversible-high-severity: SKILL.md defines REVERSIBLE-HIGH as a named severity level');

// skill-checks-for-secret-patterns-in-attachment (AC3)
assert(
  lower.includes('password=') || lower.includes('token=') || lower.includes('secret=') || (lower.includes('secret') && lower.includes('pattern')),
  'skill-checks-for-secret-patterns-in-attachment: SKILL.md checks for secret patterns in plan/preview attachment');

// skill-specifies-pass-artefact-path (AC4)
assert(
  content.includes('infra-review.md') || (lower.includes('infra/') && lower.includes('-infra-review')),
  'skill-specifies-pass-artefact-path: SKILL.md specifies infra-review.md output path');

// skill-requires-status-pass-on-zero-findings (AC4)
assert(
  (content.includes('PASS') && (lower.includes('zero') || lower.includes('no destructive') || lower.includes('0 destructive') || lower.includes('no unacknowledged'))),
  'skill-requires-status-pass-on-zero-findings: SKILL.md states zero unacknowledged findings → PASS artefact');

// skill-blocks-sign-off-with-unacknowledged-destructive (AC5)
{
  // Must state that unacknowledged DESTRUCTIVE blocks sign-off or PASS artefact production
  const hasBlock = (content.includes('DESTRUCTIVE') && (lower.includes('block') || lower.includes('cannot proceed') || lower.includes('refuse') || lower.includes('must not proceed') || lower.includes('re-surface')));
  assert(hasBlock,
    'skill-blocks-sign-off-with-unacknowledged-destructive: SKILL.md blocks sign-off if DESTRUCTIVE finding unacknowledged');
}

// skill-no-tool-cli-references-in-checklist (ADR-004)
{
  const forbiddenCLIs = ['terraform ', 'pulumi ', 'kubectl ', 'ansible ', 'cdk deploy', 'cloudformation'];
  const hasRequired = forbiddenCLIs.some(function(cli) {
    // Allowed in example lists; forbidden as required steps (detect by checking it doesn't appear after "run" as a command)
    const idx = lower.indexOf(cli);
    if (idx === -1) return false;
    const before = lower.slice(Math.max(0, idx - 60), idx);
    // If preceded by "e.g.", "for example", "such as", "like", "or", it's illustrative
    return /(?:^|run\s+`?|execute\s+`?|invoke\s+`?)\s*$/.test(before);
  });
  assert(!hasRequired,
    'skill-no-tool-cli-references-in-checklist: no required tool CLI references (ADR-004)');
}

// ── NFR Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\n[inf.2] NFR tests\n');

// review-checklist-includes-mandatory-secrets-check (NFR-SEC)
{
  // Secrets check must be in a mandatory checklist context — not just a mention
  const hasSecretsInChecklist = (lower.includes('secret') || lower.includes('credential') || lower.includes('password')) &&
    (lower.includes('checklist') || lower.includes('mandatory') || lower.includes('- [') || lower.includes('check:'));
  assert(hasSecretsInChecklist,
    'review-checklist-includes-mandatory-secrets-check: mandatory secrets check in review checklist (NFR-SEC)');
}

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[inf.2] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
