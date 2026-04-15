#!/usr/bin/env node
/**
 * check-p3.14-concepts-docs.js
 *
 * Automated tests for the framework concepts documentation suite (p3.14).
 * Validates the structure, content, and security of docs/concepts/.
 *
 * Implements 16 automated tests:
 *
 *   AC1 — Directory structure
 *   - AC1-U1: principles/ contains exactly 6 expected files
 *   - AC1-U2: primitives/ contains exactly 6 expected files
 *   - AC1-U3: building-blocks/ contains exactly 8 expected files
 *   - AC1-U4: docs/concepts/README.md exists
 *   - AC1-U5: docs/concepts/ root contains exactly 4 expected entries
 *
 *   AC2 — Heading structure (principles + primitives)
 *   - AC2-U1: all 12 principle+primitive files have 4-heading structure in correct order
 *   - AC2-U2: all 12 principle+primitive files start with ## What it is as first ## heading
 *
 *   AC3 — README content
 *   - AC3-U1: README targets first-time adopters with no prior session attendance
 *   - AC3-U2: README contains all 8 building-block names in correct reading order
 *   - AC3-U3: README contains reading order recommendation note
 *   - AC3-U4: README references all 3 reading sequence categories
 *
 *   AC4 — ONBOARDING.md link
 *   - AC4-U1: docs/ONBOARDING.md first 20 lines contain link to docs/concepts/README.md
 *
 *   AC5 — adapter-isolated-surface-concerns.md special requirements
 *   - AC5-U1: file contains phrase "Surface-agnostic by contract"
 *   - AC5-U2: file explains the name change (previously/formerly/renamed/changed)
 *
 *   AC6 — Heading structure (building blocks)
 *   - AC6-U1: all 8 building-block files have 4-heading structure in correct order
 *
 *   NFR — Security
 *   - NFR-Security-U1: no concept file contains credentials or secret patterns
 *
 * Run:  node tests/check-p3.14-concepts-docs.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path).
 */
'use strict';

const fs   = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, msg) {
  failed++;
  failures.push('  \u2717 ' + name + ': ' + msg);
  process.stdout.write('  \u2717 ' + name + ': ' + msg + '\n');
}

function report() {
  process.stdout.write('\n');
  if (failures.length > 0) {
    process.stdout.write('Failures:\n');
    failures.forEach(f => process.stdout.write(f + '\n'));
    process.stdout.write('\n');
  }
  process.stdout.write('  ' + passed + ' passed, ' + failed + ' failed.\n\n');
  if (failed > 0) process.exit(1);
}

// ── Expected file lists ───────────────────────────────────────────────────────

const EXPECTED_PRINCIPLES = [
  'adapter-isolated-surface-concerns.md',
  'governance-by-demonstration.md',
  'human-approval-at-every-gate.md',
  'self-improving-harness.md',
  'spec-immutability.md',
  'the-subset-is-the-on-ramp.md',
].sort();

const EXPECTED_PRIMITIVES = [
  'assurance-gate.md',
  'eval-suite.md',
  'learnings-log.md',
  'pipeline-state.md',
  'skill.md',
  'surface-adapter.md',
].sort();

const EXPECTED_BUILDING_BLOCKS = [
  'assurance-gate.md',
  'benefit-metrics.md',
  'definition-of-done.md',
  'definition-of-ready.md',
  'governance-traces.md',
  'outer-loop-inner-loop.md',
  'skills-pipeline.md',
  'watermark-gate.md',
].sort();

const EXPECTED_CONCEPTS_ROOT = ['README.md', 'building-blocks', 'primitives', 'principles'].sort();

// Four required headings in order
const REQUIRED_HEADINGS = [
  '## What it is',
  '## Why it exists',
  '## How it works',
  '## What you do with it',
];

// Secret/credential pattern
const SECRET_PATTERN = /[A-Za-z0-9+/]{40,}={0,2}|ghp_[A-Za-z0-9]+|sk-[A-Za-z0-9]+|password\s*[:=]\s*\S+/i;

// ── AC1: Directory structure ──────────────────────────────────────────────────

process.stdout.write('AC1 — Directory structure\n');

// AC1-U1: principles/
{
  const testName = 'AC1-U1-principles-dir-exact-files';
  try {
    const files = fs.readdirSync(path.join(root, 'docs/concepts/principles')).sort();
    const expected = EXPECTED_PRINCIPLES;
    if (JSON.stringify(files) === JSON.stringify(expected)) {
      pass(testName);
    } else {
      fail(testName,
        'Expected: ' + JSON.stringify(expected) + ' Got: ' + JSON.stringify(files));
    }
  } catch (e) {
    fail(testName, e.message);
  }
}

// AC1-U2: primitives/
{
  const testName = 'AC1-U2-primitives-dir-exact-files';
  try {
    const files = fs.readdirSync(path.join(root, 'docs/concepts/primitives')).sort();
    const expected = EXPECTED_PRIMITIVES;
    if (JSON.stringify(files) === JSON.stringify(expected)) {
      pass(testName);
    } else {
      fail(testName,
        'Expected: ' + JSON.stringify(expected) + ' Got: ' + JSON.stringify(files));
    }
  } catch (e) {
    fail(testName, e.message);
  }
}

// AC1-U3: building-blocks/
{
  const testName = 'AC1-U3-building-blocks-dir-exact-files';
  try {
    const files = fs.readdirSync(path.join(root, 'docs/concepts/building-blocks')).sort();
    const expected = EXPECTED_BUILDING_BLOCKS;
    if (JSON.stringify(files) === JSON.stringify(expected)) {
      pass(testName);
    } else {
      fail(testName,
        'Expected: ' + JSON.stringify(expected) + ' Got: ' + JSON.stringify(files));
    }
  } catch (e) {
    fail(testName, e.message);
  }
}

// AC1-U4: README.md exists
{
  const testName = 'AC1-U4-readme-exists';
  const readmePath = path.join(root, 'docs/concepts/README.md');
  if (fs.existsSync(readmePath)) {
    pass(testName);
  } else {
    fail(testName, 'docs/concepts/README.md does not exist');
  }
}

// AC1-U5: docs/concepts/ root entries
{
  const testName = 'AC1-U5-concepts-root-exact-entries';
  try {
    const entries = fs.readdirSync(path.join(root, 'docs/concepts')).sort();
    const expected = EXPECTED_CONCEPTS_ROOT;
    if (JSON.stringify(entries) === JSON.stringify(expected)) {
      pass(testName);
    } else {
      fail(testName,
        'Expected: ' + JSON.stringify(expected) + ' Got: ' + JSON.stringify(entries));
    }
  } catch (e) {
    fail(testName, e.message);
  }
}

// ── AC2: Heading structure (principles + primitives) ──────────────────────────

process.stdout.write('\nAC2 — Heading structure (principles + primitives)\n');

const principleFiles = EXPECTED_PRINCIPLES.map(f =>
  path.join(root, 'docs/concepts/principles', f));
const primitiveFiles = EXPECTED_PRIMITIVES.map(f =>
  path.join(root, 'docs/concepts/primitives', f));
const pp12Files = principleFiles.concat(primitiveFiles);

// AC2-U1: correct 4-heading order
{
  let allPassed = true;
  pp12Files.forEach(filePath => {
    const testName = 'AC2-U1-heading-order-' + path.basename(filePath, '.md');
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const indices = REQUIRED_HEADINGS.map(h => content.indexOf(h));
      const allPresent = indices.every(i => i > -1);
      if (!allPresent) {
        const missing = REQUIRED_HEADINGS.filter((h, i) => indices[i] === -1);
        fail(testName, 'Missing headings: ' + JSON.stringify(missing));
        allPassed = false;
        return;
      }
      // Check order
      for (let i = 1; i < indices.length; i++) {
        if (indices[i] <= indices[i - 1]) {
          fail(testName,
            REQUIRED_HEADINGS[i] + ' appears before ' + REQUIRED_HEADINGS[i - 1]);
          allPassed = false;
          return;
        }
      }
      pass(testName);
    } catch (e) {
      fail(testName, e.message);
      allPassed = false;
    }
  });
}

// AC2-U2: ## What it is is the first ## heading
{
  pp12Files.forEach(filePath => {
    const testName = 'AC2-U2-first-h2-is-what-it-is-' + path.basename(filePath, '.md');
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const firstH2 = lines.find(l => l.match(/^## /));
      if (!firstH2) {
        fail(testName, 'No ## heading found in file');
        return;
      }
      if (firstH2.trim() === '## What it is') {
        pass(testName);
      } else {
        fail(testName, 'First ## heading is "' + firstH2.trim() + '" — expected "## What it is"');
      }
    } catch (e) {
      fail(testName, e.message);
    }
  });
}

// ── AC3: README content ───────────────────────────────────────────────────────

process.stdout.write('\nAC3 — README content\n');

const readmePath = path.join(root, 'docs/concepts/README.md');
let readmeContent = '';
try {
  readmeContent = fs.readFileSync(readmePath, 'utf8');
} catch (e) {
  // Will fail individual tests
}

// AC3-U1: contains "first-time adopter" and "no prior session attendance"
{
  const testName = 'AC3-U1-readme-audience-statement';
  const hasFirstTime = /first.time adopter/i.test(readmeContent);
  const hasNoPrior   = /no prior session attendance/i.test(readmeContent);
  if (hasFirstTime && hasNoPrior) {
    pass(testName);
  } else {
    const missing = [];
    if (!hasFirstTime) missing.push('"first-time adopter"');
    if (!hasNoPrior)   missing.push('"no prior session attendance"');
    fail(testName, 'Missing required phrases: ' + missing.join(', '));
  }
}

// AC3-U2: all 8 building-block names in correct reading order
{
  const testName = 'AC3-U2-readme-building-block-reading-order';
  const orderedNames = [
    /outer.loop/i,
    /skills.pipeline/i,
    /governance.traces/i,
    /assurance.gate/i,
    /definition.of.ready|DoR/i,
    /definition.of.done|DoD/i,
    /watermark.gate/i,
    /benefit.metrics/i,
  ];
  const labels = [
    'Outer loop',
    'Skills pipeline',
    'Governance traces',
    'Assurance gate',
    'DoR (or Definition of Ready)',
    'DoD (or Definition of Done)',
    'Watermark gate',
    'Benefit metrics',
  ];
  let lastIdx = -1;
  let ok = true;
  for (let i = 0; i < orderedNames.length; i++) {
    const m = readmeContent.match(orderedNames[i]);
    if (!m) {
      fail(testName, 'Missing building-block name: ' + labels[i]);
      ok = false;
      break;
    }
    const idx = readmeContent.search(orderedNames[i]);
    if (idx <= lastIdx) {
      fail(testName, labels[i] + ' appears before ' + labels[i - 1] + ' (wrong order)');
      ok = false;
      break;
    }
    lastIdx = idx;
  }
  if (ok) pass(testName);
}

// AC3-U3: reading order recommendation note
{
  const testName = 'AC3-U3-readme-reading-order-note';
  const hasNote = /reading.order.recommendation|not the file naming order/i.test(readmeContent);
  if (hasNote) {
    pass(testName);
  } else {
    fail(testName,
      'README must contain a phrase like "reading order recommendation" or "not the file naming order"');
  }
}

// AC3-U4: references all 3 categories
{
  const testName = 'AC3-U4-readme-three-categories';
  const hasBuilding  = /building.blocks?/i.test(readmeContent);
  const hasPrinciples = /principles/i.test(readmeContent);
  const hasPrimitives = /primitives/i.test(readmeContent);
  if (hasBuilding && hasPrinciples && hasPrimitives) {
    pass(testName);
  } else {
    const missing = [];
    if (!hasBuilding)   missing.push('building blocks');
    if (!hasPrinciples) missing.push('principles');
    if (!hasPrimitives) missing.push('primitives');
    fail(testName, 'Missing categories: ' + missing.join(', '));
  }
}

// ── AC4: ONBOARDING.md link ───────────────────────────────────────────────────

process.stdout.write('\nAC4 — ONBOARDING.md link\n');

{
  const testName = 'AC4-U1-onboarding-concepts-link-in-first-20-lines';
  try {
    const onboardingContent = fs.readFileSync(
      path.join(root, 'docs/ONBOARDING.md'), 'utf8');
    const first20 = onboardingContent.split('\n').slice(0, 20).join('\n');
    if (first20.includes('docs/concepts/README.md')) {
      pass(testName);
    } else {
      fail(testName,
        'docs/ONBOARDING.md first 20 lines do not contain a relative link to docs/concepts/README.md');
    }
  } catch (e) {
    fail(testName, e.message);
  }
}

// ── AC5: adapter-isolated-surface-concerns.md ────────────────────────────────

process.stdout.write('\nAC5 — adapter-isolated-surface-concerns.md special requirements\n');

const adapterFile = path.join(
  root, 'docs/concepts/principles/adapter-isolated-surface-concerns.md');
let adapterContent = '';
try {
  adapterContent = fs.readFileSync(adapterFile, 'utf8');
} catch (e) {
  // Will fail individual tests
}

// AC5-U1: contains "Surface-agnostic by contract"
{
  const testName = 'AC5-U1-surface-agnostic-phrase';
  if (adapterContent.includes('Surface-agnostic by contract')) {
    pass(testName);
  } else {
    fail(testName,
      'adapter-isolated-surface-concerns.md must contain the phrase "Surface-agnostic by contract"');
  }
}

// AC5-U2: explains name change
{
  const testName = 'AC5-U2-name-change-explanation';
  const hasNameChange = /previously|formerly|renamed|changed/i.test(adapterContent);
  if (hasNameChange) {
    pass(testName);
  } else {
    fail(testName,
      'adapter-isolated-surface-concerns.md must explain the name change using words like ' +
      '"previously", "formerly", "renamed", or "changed"');
  }
}

// ── AC6: Heading structure (building blocks) ──────────────────────────────────

process.stdout.write('\nAC6 — Heading structure (building blocks)\n');

const buildingBlockFiles = EXPECTED_BUILDING_BLOCKS.map(f =>
  path.join(root, 'docs/concepts/building-blocks', f));

buildingBlockFiles.forEach(filePath => {
  const testName = 'AC6-U1-heading-order-' + path.basename(filePath, '.md');
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const indices = REQUIRED_HEADINGS.map(h => content.indexOf(h));
    const allPresent = indices.every(i => i > -1);
    if (!allPresent) {
      const missing = REQUIRED_HEADINGS.filter((h, i) => indices[i] === -1);
      fail(testName, 'Missing headings: ' + JSON.stringify(missing));
      return;
    }
    for (let i = 1; i < indices.length; i++) {
      if (indices[i] <= indices[i - 1]) {
        fail(testName,
          REQUIRED_HEADINGS[i] + ' appears before ' + REQUIRED_HEADINGS[i - 1]);
        return;
      }
    }
    pass(testName);
  } catch (e) {
    fail(testName, e.message);
  }
});

// ── NFR: Security ─────────────────────────────────────────────────────────────

process.stdout.write('\nNFR — Security\n');

{
  const testName = 'NFR-Security-U1-no-secrets-in-concept-files';
  const allConceptFiles = pp12Files.concat(buildingBlockFiles).concat([readmePath]);
  let ok = true;
  allConceptFiles.forEach(filePath => {
    if (!fs.existsSync(filePath)) return; // skip missing files (will fail in AC1/AC2/AC6)
    const lines = fs.readFileSync(filePath, 'utf8').split('\n');
    lines.forEach((line, lineNum) => {
      if (SECRET_PATTERN.test(line)) {
        fail(testName,
          path.relative(root, filePath) + ':' + (lineNum + 1) + ' matches secret pattern');
        ok = false;
      }
    });
  });
  if (ok) pass(testName);
}

// ── Summary ───────────────────────────────────────────────────────────────────

report();
