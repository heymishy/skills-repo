#!/usr/bin/env node
/**
 * check-assembly.js
 *
 * Automated tests for the assembled copilot-instructions.md output.
 * Validates the progressive disclosure structure, three-layer composition,
 * and M1 acceptance test record fields.
 *
 * Tests from p1.1 test plan:
 *   Unit:  progressive-disclosure-outer-loop-skills-only-at-discovery     (AC3)
 *          progressive-disclosure-inner-loop-absent-at-outer-phase        (AC3)
 *          assembled-file-has-three-layer-composition                     (AC5)
 *          assembled-file-composition-order-documented                    (AC5)
 *          m1-acceptance-test-record-contains-all-fields                  (AC6)
 *   NFR:   nfr-assembled-file-under-8000-tokens
 *          nfr-no-credential-values-in-distribution-config
 *          nfr-assembled-file-header-contains-version-info
 *
 * Run:  node .github/scripts/check-assembly.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs only.
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root         = path.join(__dirname, '..', '..');
const fixtureFile  = path.join(root, 'tests', 'fixtures', 'assembled-copilot-instructions.md');
const benefitFile  = path.join(root, 'artefacts', '2026-04-09-skills-platform-phase1', 'benefit-metric.md');
const assembleScript = path.join(root, 'scripts', 'assemble-copilot-instructions.sh');

let passed = 0;
let failed = 0;
const failures = [];

function pass(name) {
  passed++;
  console.log(`  ✓ ${name}`);
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  console.log(`  ✗ ${name}`);
  console.log(`    → ${reason}`);
}

// ── Read files ────────────────────────────────────────────────────────────────

if (!fs.existsSync(fixtureFile)) {
  console.error(`[assembly-check] ERROR: fixture not found: ${fixtureFile}`);
  console.error('  Run: bash scripts/assemble-copilot-instructions.sh --output tests/fixtures/assembled-copilot-instructions.md');
  process.exit(1);
}

if (!fs.existsSync(benefitFile)) {
  console.error(`[assembly-check] ERROR: benefit-metric.md not found: ${benefitFile}`);
  process.exit(1);
}

const assembled = fs.readFileSync(fixtureFile, 'utf8');
const benefitMetric = fs.readFileSync(benefitFile, 'utf8');

// ── Constants ─────────────────────────────────────────────────────────────────

const OUTER_LOOP_SKILLS = [
  'discovery',
  'benefit-metric',
  'definition',
  'review',
  'test-plan',
  'definition-of-ready',
];

// workflow and decisions are also outer loop but the test plan specifies these 6 for AC3
const OUTER_LOOP_AC3 = [
  'discovery',
  'benefit-metric',
  'definition',
  'review',
  'test-plan',
  'definition-of-ready',
];

const INNER_LOOP_SKILLS = [
  'tdd',
  'implementation-plan',
  'subagent-execution',
  'verify-completion',
  'branch-setup',
  'branch-complete',
];

const M1_REQUIRED_FIELDS = [
  'changeReference',
  'distributionMechanism',
  'elapsedTime',
  'changePresentInAssembledContext',
  'squadMergeActionRequired',
];

// Credential value patterns — must not appear in any distribution config file
const CREDENTIAL_PATTERNS = [
  /ghp_[A-Za-z0-9]{20,}/,                // GitHub PAT
  /Bearer [A-Za-z0-9]{20,}/,             // Bearer token value
  /\btoken: [^$][^\n]{10,}/,             // inline token value (not a variable reference)
  /\bpassword: [^$][^\n]{5,}/,           // inline password value
];

// Approximate token count: rough GPT tokenizer proxy (~4 chars per token for English)
function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

// Extract the composition header (HTML comment at top of file)
function getHeader(text) {
  const match = text.match(/<!--([\s\S]*?)-->/);
  return match ? match[1] : '';
}

// ── Test suite ────────────────────────────────────────────────────────────────

console.log('[assembly-check] Running p1.1 assembly tests…');
console.log('');

// ── AC3: Progressive disclosure — outer loop skills present at session start ──
console.log('  AC3: Progressive skill disclosure — outer loop');

const missingOuter = OUTER_LOOP_AC3.filter(skill => {
  // The skill name should appear in the assembled file (in the outer loop section)
  // Allow for /skill-name or just skill-name forms
  return !assembled.includes(`/${skill}`) && !assembled.includes(`**${skill}**`);
});

if (missingOuter.length === 0) {
  pass('progressive-disclosure-outer-loop-skills-only-at-discovery');
} else {
  fail('progressive-disclosure-outer-loop-skills-only-at-discovery',
    `Missing outer loop skills in assembled file: ${missingOuter.join(', ')}`);
}

// ── AC3: Inner loop skills absent from outer phase context ───────────────────

const innerPatternFound = INNER_LOOP_SKILLS.filter(skill => {
  // Check for patterns that would indicate the skill is loaded (not just listed as deferred)
  return assembled.includes(`/${skill}`) || assembled.includes(`${skill}/SKILL.md`);
});

if (innerPatternFound.length === 0) {
  pass('progressive-disclosure-inner-loop-absent-at-outer-phase');
} else {
  fail('progressive-disclosure-inner-loop-absent-at-outer-phase',
    `Inner loop skills found with path pattern (should be deferred only): ${innerPatternFound.map(s => `/${s}`).join(', ')}`);
}

// ── AC5: Three-layer composition header ──────────────────────────────────────
console.log('');
console.log('  AC5: Three-layer composition structure');

const header = getHeader(assembled);
const first50Lines = assembled.split('\n').slice(0, 50).join('\n');

const hasCoreLayer   = /core-platform/i.test(first50Lines);
const hasDomainLayer = /\bdomain\b/i.test(first50Lines);
const hasSquadLayer  = /\bsquad\b/i.test(first50Lines);
const hasAbsentMarker = /\[absent\]/i.test(assembled);

if (hasCoreLayer && hasDomainLayer && hasSquadLayer) {
  pass('assembled-file-has-three-layer-composition');
} else {
  const missing = [
    !hasCoreLayer   && 'core-platform',
    !hasDomainLayer && 'domain',
    !hasSquadLayer  && 'squad',
  ].filter(Boolean);
  fail('assembled-file-has-three-layer-composition',
    `Missing layer references in header: ${missing.join(', ')}`);
}

// Verify absent-marker is present when domain/squad layers are absent
if (hasAbsentMarker) {
  pass('assembled-file-absent-marker-present-when-layers-missing');
} else {
  fail('assembled-file-absent-marker-present-when-layers-missing',
    'No [absent] marker found in file — optional absent layers must be marked explicitly');
}

// ── AC5: Composition order documented ────────────────────────────────────────

const hasLayerOrder     = /Layer composition \(in order\)/i.test(header) ||
                           /layer.*order/i.test(header);
const hasPlatformVersion = /platform-version:/i.test(header) ||
                            /assembled.*@[0-9a-f]{6}/i.test(header) ||
                            /core-platform.*@/i.test(header);

if (hasLayerOrder && hasPlatformVersion) {
  pass('assembled-file-composition-order-documented');
} else {
  const missing = [
    !hasLayerOrder      && 'layer composition order',
    !hasPlatformVersion && 'platform version reference',
  ].filter(Boolean);
  fail('assembled-file-composition-order-documented',
    `Missing from composition header: ${missing.join(', ')}`);
}

// ── AC6: M1 acceptance test record fields ────────────────────────────────────
console.log('');
console.log('  AC6: M1 acceptance test record structure');

const missingM1Fields = M1_REQUIRED_FIELDS.filter(field => !benefitMetric.includes(field));

if (missingM1Fields.length === 0) {
  pass('m1-acceptance-test-record-contains-all-fields');
} else {
  fail('m1-acceptance-test-record-contains-all-fields',
    `Missing M1 fields in benefit-metric.md: ${missingM1Fields.join(', ')}`);
}

// ── NFR: Token count ≤ 8000 at session start ─────────────────────────────────
console.log('');
console.log('  NFR: Performance, security, audit');

const tokenCount = estimateTokens(assembled);
if (tokenCount <= 8000) {
  pass(`nfr-assembled-file-under-8000-tokens (estimated ~${tokenCount} tokens)`);
} else {
  fail('nfr-assembled-file-under-8000-tokens',
    `Estimated token count ${tokenCount} exceeds 8,000 token limit`);
}

// ── NFR: No credential values in distribution config ─────────────────────────

// Check the assembly script and the assembled file for credential value patterns
const filesToScan = [assembleScript, fixtureFile].filter(f => fs.existsSync(f));
let credentialFound = false;
const credentialMatches = [];

for (const file of filesToScan) {
  const content = fs.readFileSync(file, 'utf8');
  const relPath = path.relative(root, file);
  for (const pattern of CREDENTIAL_PATTERNS) {
    if (pattern.test(content)) {
      credentialFound = true;
      credentialMatches.push(`${relPath}: matches ${pattern}`);
    }
  }
}

if (!credentialFound) {
  pass('nfr-no-credential-values-in-distribution-config');
} else {
  fail('nfr-no-credential-values-in-distribution-config',
    `Credential value patterns found:\n    ${credentialMatches.join('\n    ')}`);
}

// ── NFR: Version info in assembled file header ────────────────────────────────

const hasVersionInHeader = /platform-version:\s+[^\s\[]/i.test(header);

if (hasVersionInHeader) {
  pass('nfr-assembled-file-header-contains-version-info');
} else {
  fail('nfr-assembled-file-header-contains-version-info',
    'No non-empty platform-version field found in assembly header');
}

// ── Assemble script exists ────────────────────────────────────────────────────
console.log('');
console.log('  Infrastructure: assembly script');

if (fs.existsSync(assembleScript)) {
  pass('assembly-script-exists (scripts/assemble-copilot-instructions.sh)');
} else {
  fail('assembly-script-exists', `Assembly script not found: ${assembleScript}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log(`[assembly-check] Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('');
  console.log('  Failures:');
  for (const f of failures) {
    console.log(`    ✗ ${f.name}: ${f.reason}`);
  }
  process.exit(1);
}
