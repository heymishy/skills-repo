#!/usr/bin/env node
// check-p4-obs-benefit.js — governance tests for scripts/record-benefit-comparison.js
// 12 tests: T1–T10, T-NFR1, T-NFR2
// No external dependencies — Node.js built-ins only.
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const SUITE = '[p4-obs-benefit]';
let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadMod() {
  const p = path.join(__dirname, '..', 'scripts', 'record-benefit-comparison.js');
  if (!fs.existsSync(p)) return null;
  delete require.cache[require.resolve(p)];
  return require(p);
}

const mod = loadMod();

// ── T1 — module exports ───────────────────────────────────────────
console.log(`${SUITE} T1 \u2014 module exports`);
assert(mod !== null, 'T1a: module exists');
assert(mod && typeof mod.recordComparison === 'function',  'T1b: exports recordComparison');
assert(mod && typeof mod.generateSummary  === 'function', 'T1c: exports generateSummary');

if (!mod) {
  console.log(`${SUITE} Results: ${passed} passed, ${failed} failed`);
  process.exit(1);
}

// ── Shared fixtures ───────────────────────────────────────────────
const baseInputs = {
  featureSlug:               'slug-a',
  platformCycleDays:         10,
  traditionalCycleDays:      30,
  platformStoryCount:        5,
  platformTestCount:         40,
  traditionalOperatorHours:  80
};

const baseState = {
  version: '1',
  features: [
    {
      slug: 'slug-a',
      name: 'Feature A',
      stage: 'definition-of-done',
      stories: [
        { id: 's1', dodStatus: 'complete' },
        { id: 's2', dodStatus: 'complete' }
      ],
      epics: []
    }
  ]
};

// Helper: create temp workspace dir
function mkTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'obs-benefit-'));
}

// ── T1 ── already done above ──────────────────────────────────────

// ── T2 — file created at expected path ───────────────────────────
console.log(`${SUITE} T2 \u2014 file created at expected path`);
{
  const tmp = mkTmp();
  mod.recordComparison(baseInputs, baseState, { workspaceDir: tmp });
  const expected = path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md');
  assert(fs.existsSync(expected), 'T2: file created at workspace/experiments/benefit-comparison-<slug>.md');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T3 — front-matter has all 8 required fields ───────────────────
console.log(`${SUITE} T3 \u2014 front-matter has all 8 required fields`);
{
  const tmp      = mkTmp();
  const out      = mod.recordComparison(baseInputs, baseState, { workspaceDir: tmp });
  const content  = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  const REQUIRED = [
    'feature_slug',
    'report_date',
    'platform_cycle_days',
    'traditional_cycle_days',
    'platform_operator_hours',
    'traditional_operator_hours_estimate',
    'platform_story_count',
    'platform_test_count'
  ];
  for (const field of REQUIRED) {
    assert(content.includes(field), 'T3: front-matter has ' + field);
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T4 — body contains comparison table ──────────────────────────
console.log(`${SUITE} T4 \u2014 body contains comparison table`);
{
  const tmp     = mkTmp();
  mod.recordComparison(baseInputs, baseState, { workspaceDir: tmp });
  const content = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  assert(content.includes('Platform')    && content.includes('Traditional'), 'T4: table has Platform + Traditional columns');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T5 — delta calculation -67% ──────────────────────────────────
console.log(`${SUITE} T5 \u2014 delta calculation -67%`);
{
  const tmp      = mkTmp();
  const inputs   = Object.assign({}, baseInputs, { platformCycleDays: 10, traditionalCycleDays: 30 });
  mod.recordComparison(inputs, baseState, { workspaceDir: tmp });
  const content  = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  assert(content.includes('-67%'), 'T5: delta is -67%');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T6 — generateSummary 2 rows ───────────────────────────────────
console.log(`${SUITE} T6 \u2014 generateSummary produces 2 data rows`);
{
  const tmp   = mkTmp();
  const expDir = path.join(tmp, 'experiments');
  fs.mkdirSync(expDir, { recursive: true });
  // Write two fixture files
  const f1 = [
    '---',
    'feature_slug: feat-a',
    'report_date: 2025-01-01',
    'platform_cycle_days: 10',
    'traditional_cycle_days: 30',
    'platform_operator_hours: 8',
    'traditional_operator_hours_estimate: 40',
    'platform_story_count: 5',
    'platform_test_count: 30',
    'delta_percent: -67',
    '---',
    '',
    '## Summary'
  ].join('\n');
  const f2 = [
    '---',
    'feature_slug: feat-b',
    'report_date: 2025-01-08',
    'platform_cycle_days: 15',
    'traditional_cycle_days: 45',
    'platform_operator_hours: 12',
    'traditional_operator_hours_estimate: 60',
    'platform_story_count: 8',
    'platform_test_count: 50',
    'delta_percent: -67',
    '---',
    '',
    '## Summary'
  ].join('\n');
  fs.writeFileSync(path.join(expDir, 'benefit-comparison-feat-a.md'), f1);
  fs.writeFileSync(path.join(expDir, 'benefit-comparison-feat-b.md'), f2);
  const summary = mod.generateSummary(expDir);
  // Count data rows (lines with |feat-)
  const dataRows = summary.split('\n').filter(l => l.includes('feat-'));
  assert(dataRows.length >= 2, 'T6: summary has 2 data rows');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T7 — generateSummary table header has all 6 columns ──────────
console.log(`${SUITE} T7 \u2014 generateSummary header has 6 columns`);
{
  const tmp    = mkTmp();
  const expDir = path.join(tmp, 'experiments');
  fs.mkdirSync(expDir, { recursive: true });
  const fixture = [
    '---',
    'feature_slug: feat-x',
    'report_date: 2025-01-01',
    'platform_cycle_days: 5',
    'traditional_cycle_days: 20',
    'platform_operator_hours: 4',
    'traditional_operator_hours_estimate: 30',
    'platform_story_count: 3',
    'platform_test_count: 20',
    'delta_percent: -75',
    '---'
  ].join('\n');
  fs.writeFileSync(path.join(expDir, 'benefit-comparison-feat-x.md'), fixture);
  const summary = mod.generateSummary(expDir);
  const COLS = ['Feature', 'Platform cycle', 'Traditional', 'Delta', 'Platform tests', 'Operator hours'];
  for (const col of COLS) {
    assert(summary.includes(col), 'T7: header has ' + col);
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T8 — experiment_ref set when provided ─────────────────────────
console.log(`${SUITE} T8 \u2014 experiment_ref set when provided`);
{
  const tmp    = mkTmp();
  const inputs = Object.assign({}, baseInputs, { experimentRef: 'EXP-2025-01' });
  mod.recordComparison(inputs, baseState, { workspaceDir: tmp });
  const content = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  assert(content.includes('EXP-2025-01'), 'T8: experiment_ref value present');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T9 — experiment_ref null when absent ─────────────────────────
console.log(`${SUITE} T9 \u2014 experiment_ref null when absent`);
{
  const tmp = mkTmp();
  mod.recordComparison(baseInputs, baseState, { workspaceDir: tmp });
  const content = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  assert(content.includes('experiment_ref: null'), 'T9: experiment_ref: null when not provided');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T10 — platform_operator_hours null when normsPath absent ─────
console.log(`${SUITE} T10 \u2014 operator_hours null when norms absent`);
{
  const tmp = mkTmp();
  mod.recordComparison(baseInputs, baseState, { workspaceDir: tmp, normsPath: '/nonexistent-norms-file-xyz.md' });
  const content = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  assert(content.includes('platform_operator_hours: null'), 'T10: null when norms file absent');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T11 — reads hours from norms file ────────────────────────────
console.log(`${SUITE} T11 \u2014 reads hours from norms file`);
{
  const tmp = mkTmp();
  // Write fixture norms file with slug-a row
  const normsPath = path.join(tmp, 'estimation-norms.md');
  const normsContent = [
    '# Estimation Norms',
    '',
    '| Feature | E1 | E2 | E3 actuals |',
    '|---------|----|----|------------|',
    '| slug-a  | 8h | 10h | 12.5h     |',
    '| other   | 5h | 6h  | 7h        |'
  ].join('\n');
  fs.writeFileSync(normsPath, normsContent);
  mod.recordComparison(baseInputs, baseState, { workspaceDir: tmp, normsPath });
  const content = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  assert(content.includes('12.5'), 'T11: 12.5h read from norms file');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T-NFR1 — no credentials ───────────────────────────────────────
console.log(`${SUITE} T-NFR1 \u2014 no credentials in output`);
{
  const tmp = mkTmp();
  mod.recordComparison(baseInputs, baseState, { workspaceDir: tmp });
  const content = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  assert(!/Bearer\s/i.test(content) && !/password:/i.test(content) && !/secret:/i.test(content), 'T-NFR1: no credentials in file');
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── T-NFR2 — front-matter is simple scalars ───────────────────────
console.log(`${SUITE} T-NFR2 \u2014 front-matter no nested objects`);
{
  const tmp = mkTmp();
  mod.recordComparison(baseInputs, baseState, { workspaceDir: tmp });
  const content = fs.readFileSync(path.join(tmp, 'experiments', 'benefit-comparison-slug-a.md'), 'utf8');
  const parts   = content.split('---');
  if (parts.length >= 3) {
    const fm = parts[1];
    const lines = fm.split('\n').filter(l => l.trim());
    let noNestedObjects = true;
    for (const line of lines) {
      if (/^\s+-/.test(line)) noNestedObjects = false;
      if (/:\s*\{/.test(line))  noNestedObjects = false;
    }
    assert(noNestedObjects, 'T-NFR2: no nested objects or arrays in front-matter');
  } else {
    assert(false, 'T-NFR2: front-matter not properly delimited');
  }
  try { fs.rmSync(tmp, { recursive: true, force: true }); } catch (_) {}
}

// ── Results ───────────────────────────────────────────────────────
console.log(`${SUITE} Results: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
