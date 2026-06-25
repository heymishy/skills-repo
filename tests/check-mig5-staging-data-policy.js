#!/usr/bin/env node
// check-mig5-staging-data-policy.js
// Tests for mig.5: .github/templates/staging-data-policy.md content assertions
// 8 unit + 1 NFR = 9 tests
// Run: node tests/check-mig5-staging-data-policy.js
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT     = path.resolve(__dirname, '..');
const TEMPLATE = path.join(ROOT, '.github', 'templates', 'staging-data-policy.md');

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

const templateExists = fs.existsSync(TEMPLATE);
const content        = templateExists ? fs.readFileSync(TEMPLATE, 'utf8') : '';
const lower          = content.toLowerCase();

// ── Unit Tests ────────────────────────────────────────────────────────────────

process.stdout.write('\n[mig.5] Unit tests\n');

// staging-data-policy-template-file-exists (AC1)
assert(templateExists, 'staging-data-policy-template-file-exists: .github/templates/staging-data-policy.md exists');

// template-contains-synthetic-generated-data-option (AC1)
assert(lower.includes('synthetic') && lower.includes('generated'),
  'template-contains-synthetic-generated-data-option: template contains synthetic generated data option');

// template-contains-anonymised-snapshot-option (AC1)
assert(lower.includes('anonymised') || lower.includes('anonymized'),
  'template-contains-anonymised-snapshot-option: template contains anonymised snapshot option');

// template-contains-non-pii-production-subset-option (AC1)
assert(lower.includes('non-pii') || (lower.includes('non') && lower.includes('pii')),
  'template-contains-non-pii-production-subset-option: template contains non-PII production subset option');

// template-contains-declared-choice-field (AC2)
assert(lower.includes('declared choice') || lower.includes('declared-choice'),
  'template-contains-declared-choice-field: template contains Declared choice field');

// declared-choice-instructions-prohibit-tbd (AC2)
assert(
  lower.includes('tbd') || lower.includes('blank') || lower.includes('must select') || lower.includes('must not be left') || lower.includes('cannot be left'),
  'declared-choice-instructions-prohibit-tbd: template prohibits TBD or blank declared choice');

// template-references-migration-review-check (AC3)
assert(
  lower.includes('schema-migration-plan') || lower.includes('migration-plan') || lower.includes('migration plan'),
  'template-references-migration-review-check: template mentions schema-migration-plan integration');

// template-contains-tool-process-free-form-field (AC4)
assert(
  (lower.includes('tool') && lower.includes('process')) || lower.includes('tool or process') || lower.includes('tool/process'),
  'template-contains-tool-process-free-form-field: template contains tool or process free-form field');

// ── NFR Tests ─────────────────────────────────────────────────────────────────

process.stdout.write('\n[mig.5] NFR tests\n');

// template-warns-against-credentials-in-tool-field (NFR-SEC)
assert(
  lower.includes('credential') || lower.includes('connection string') || lower.includes('password') || lower.includes('secret'),
  'template-warns-against-credentials-in-tool-field: template warns against credentials/connection strings in tool field (NFR-SEC)');

// ── Summary ───────────────────────────────────────────────────────────────────

process.stdout.write('\n[mig.5] Results: ' + passed + ' passed, ' + failed + ' failed\n');
if (failed > 0) process.exit(1);
