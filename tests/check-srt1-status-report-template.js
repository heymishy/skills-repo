#!/usr/bin/env node
// tests/check-srt1-status-report-template.js
// Governance tests for sr.1: status report template extraction.
// Inline self-tests run before the main governance check.
'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const TEMPLATE_PATH = path.join(ROOT, '.github', 'templates', 'status-report.md');
const SCRIPT_PATH   = path.join(ROOT, 'scripts', 'generate-status-report.js');

let passed = 0;
let failed = 0;

function assert(id, label, cond) {
  if (cond) {
    console.log('  PASS T' + id + ': ' + label);
    passed++;
  } else {
    console.error('  FAIL T' + id + ': ' + label);
    failed++;
  }
}

// ── Inline self-tests ─────────────────────────────────────────────

console.log('\ncheck-srt1-status-report-template.js — self-tests');

// T1: template file exists
assert(1, 'template-file-exists', fs.existsSync(TEMPLATE_PATH));

// T2: template contains [daily] section with section1
{
  const content = fs.existsSync(TEMPLATE_PATH) ? fs.readFileSync(TEMPLATE_PATH, 'utf8') : '';
  assert(2, 'template-has-daily-section',
    content.includes('[daily]') && content.includes('section1=In-Flight Stories'));
}

// T3: template contains [weekly] section with section1
{
  const content = fs.existsSync(TEMPLATE_PATH) ? fs.readFileSync(TEMPLATE_PATH, 'utf8') : '';
  assert(3, 'template-has-weekly-section',
    content.includes('[weekly]') && content.includes('section1=This Week'));
}

// T4: generate-status-report.js references loadReportTemplate
{
  const scriptContent = fs.existsSync(SCRIPT_PATH) ? fs.readFileSync(SCRIPT_PATH, 'utf8') : '';
  assert(4, 'script-reads-template',
    scriptContent.includes('loadReportTemplate'));
}

// T5: fallback-on-missing-template — loadReportTemplate returns null for nonexistent path
{
  const { loadReportTemplate } = require(SCRIPT_PATH);
  const result = loadReportTemplate(path.join(ROOT, 'nonexistent-dir-' + Date.now()));
  assert(5, 'fallback-on-missing-template', result === null);
}

// ── Results ───────────────────────────────────────────────────────

console.log('\n  ' + passed + '/' + (passed + failed) + ' self-tests passed');

if (failed > 0) {
  process.exit(1);
}

// ── Main governance check ─────────────────────────────────────────

console.log('\ncheck-srt1-status-report-template.js — main check');

let errors = 0;

// 1. Template file exists
if (!fs.existsSync(TEMPLATE_PATH)) {
  console.error('  FAIL: .github/templates/status-report.md not found');
  errors++;
} else {
  const content = fs.readFileSync(TEMPLATE_PATH, 'utf8');

  // 2. All 5 daily sections present
  const dailySections = ['section1', 'section2', 'section3', 'section4', 'section5'];
  let dailyIdx = content.indexOf('[daily]');
  let weeklyIdx = content.indexOf('[weekly]');
  const dailyBlock = dailyIdx !== -1 && weeklyIdx !== -1
    ? content.slice(dailyIdx, weeklyIdx)
    : (dailyIdx !== -1 ? content.slice(dailyIdx) : '');
  let missingDaily = dailySections.filter(k => !dailyBlock.includes(k + '='));
  if (missingDaily.length > 0) {
    console.error('  FAIL: [daily] block missing: ' + missingDaily.join(', '));
    errors++;
  } else {
    console.log('  PASS: [daily] block has all 5 section headers');
  }

  // 3. All 5 weekly sections present
  const weeklySections = ['section1', 'section2', 'section3', 'section4', 'section5'];
  const weeklyBlock = weeklyIdx !== -1 ? content.slice(weeklyIdx) : '';
  let missingWeekly = weeklySections.filter(k => !weeklyBlock.includes(k + '='));
  if (missingWeekly.length > 0) {
    console.error('  FAIL: [weekly] block missing: ' + missingWeekly.join(', '));
    errors++;
  } else {
    console.log('  PASS: [weekly] block has all 5 section headers');
  }
}

// 4. Script exports loadReportTemplate
const scriptContent = fs.readFileSync(SCRIPT_PATH, 'utf8');
if (!scriptContent.includes('loadReportTemplate')) {
  console.error('  FAIL: generate-status-report.js does not include loadReportTemplate');
  errors++;
} else {
  console.log('  PASS: generate-status-report.js includes loadReportTemplate');
}

// 5. package.json includes this check
const pkgPath    = path.join(ROOT, 'package.json');
const pkgContent = fs.readFileSync(pkgPath, 'utf8');
if (!pkgContent.includes('check-srt1-status-report-template')) {
  console.error('  FAIL: package.json test chain does not include check-srt1-status-report-template');
  errors++;
} else {
  console.log('  PASS: package.json includes check-srt1-status-report-template');
}

if (errors > 0) {
  console.error('\n  ' + errors + ' governance check(s) failed.');
  process.exit(1);
}

console.log('\n  All checks passed.');
