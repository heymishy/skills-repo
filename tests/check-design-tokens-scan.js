#!/usr/bin/env node
'use strict';

// check-design-tokens-scan.js
// Unit tests for scripts/check-design-tokens.js — the real, callable token-scanning
// module underpinning dsa-s5 AC2 (H-DESIGN's actual scan mechanism).
// Governed by dsa-s5 — artefacts/2026-09-18-design-system-adoption/

const assert = require('assert');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { extractDesignTokens, scanFileForNonTokenColors } = require('../scripts/check-design-tokens');

const DESIGN_MD_PATH = path.join(__dirname, '..', 'artefacts/2026-09-18-design-system-adoption/reference/DESIGN.md');
const NONCOMPLIANT_FIXTURE = path.join(__dirname, 'fixtures', 'dsa-s5-noncompliant-touched-file.js');
const COMPLIANT_FIXTURE = path.join(__dirname, 'fixtures', 'dsa-s5-compliant-touched-file.js');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  PASS: ${name}`);
  } catch (err) {
    failed++;
    console.log(`  FAIL: ${name}`);
    console.log(`        ${err.message}`);
  }
}

console.log('check-design-tokens-scan.js');

// T1 (AC2): extractDesignTokens returns every hex value from DESIGN.md's dark + light tables
test('T1: extractDesignTokens returns every hex value from DESIGN.md dark + light tables', () => {
  const tokens = extractDesignTokens(DESIGN_MD_PATH);
  assert.ok(tokens instanceof Set, 'extractDesignTokens must return a Set');

  // Dark table (## Color tokens (dark — default)) — includes the combined
  // success/warn/danger cells with two hex values each.
  const expectedDark = [
    '#0b0d10', '#0e1013', '#161a1f', '#23272e', '#1a1d22',
    '#f5f6f7', '#b4bac2', '#9aa1ab', '#6b7280', '#454b54',
    '#3b82f6', '#152238', '#93c5fd',
    '#34d399', '#0f2318',
    '#f59e0b', '#2a2011',
    '#f87171', '#2a1416',
  ];

  // Light table (## Light mode) — includes the six-hex combined final row.
  const expectedLight = [
    '#fafafa', '#ffffff', '#f2f3f5', '#e4e7eb',
    '#14171a', '#3f454c', '#6b7280', '#2563eb',
    '#eff4ff', '#1d4ed8',
    '#dcfce7', '#fef3c7', '#fee2e2',
    '#15803d', '#b45309', '#b91c1c',
  ];

  for (const hex of expectedDark) {
    assert.ok(tokens.has(hex), `expected dark token ${hex} to be present`);
  }
  for (const hex of expectedLight) {
    assert.ok(tokens.has(hex), `expected light token ${hex} to be present`);
  }
});

// T2 (AC2): scanFileForNonTokenColors flags the noncompliant fixture, naming file + specific offending value(s)
test('T2: scanFileForNonTokenColors flags the noncompliant fixture with file + value', () => {
  const tokens = extractDesignTokens(DESIGN_MD_PATH);
  const findings = scanFileForNonTokenColors(NONCOMPLIANT_FIXTURE, tokens);

  assert.ok(Array.isArray(findings), 'scanFileForNonTokenColors must return an array');
  assert.ok(findings.length >= 2, 'expected at least 2 findings (both non-token colors in the fixture)');

  const values = findings.map((f) => f.value.toLowerCase());
  assert.ok(values.includes('#123456'), 'expected finding for #123456');
  assert.ok(values.includes('#abcdef'), 'expected finding for #abcdef');

  for (const finding of findings) {
    assert.strictEqual(finding.file, NONCOMPLIANT_FIXTURE, 'each finding must name the scanned file');
  }
});

// T3 (AC2, negative control): scanFileForNonTokenColors does NOT flag the compliant fixture (no false positive)
test('T3: scanFileForNonTokenColors does not flag the compliant fixture (negative control)', () => {
  const tokens = extractDesignTokens(DESIGN_MD_PATH);
  const findings = scanFileForNonTokenColors(COMPLIANT_FIXTURE, tokens);

  assert.strictEqual(findings.length, 0, `expected no findings, got: ${JSON.stringify(findings)}`);
});

// T4: scanFileForNonTokenColors on a file with no color-like values at all returns no findings (not a crash)
test('T4: scanFileForNonTokenColors on a file with no color-like values returns no findings', () => {
  const tokens = extractDesignTokens(DESIGN_MD_PATH);
  const tmpFile = path.join(os.tmpdir(), `dsa-s5-no-colors-${process.pid}.js`);
  fs.writeFileSync(tmpFile, "module.exports = { style: 'no colors here at all' };\n");
  try {
    const findings = scanFileForNonTokenColors(tmpFile, tokens);
    assert.ok(Array.isArray(findings), 'scanFileForNonTokenColors must return an array even with no matches');
    assert.strictEqual(findings.length, 0, 'expected no findings for a file with no color-like values');
  } finally {
    fs.unlinkSync(tmpFile);
  }
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed === 0 ? 0 : 1);
