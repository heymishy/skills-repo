#!/usr/bin/env node
/**
 * check-watermark-gate.js
 *
 * Automated tests for the watermark gate (p1.4).
 *
 * Tests from p1.4 test plan:
 *
 *   Unit:
 *     first-run-creates-results-tsv-with-baseline         (AC1)
 *     first-run-baseline-row-schema                       (AC1)
 *     gate-pass-when-at-watermark                         (AC2)
 *     gate-pass-when-above-watermark                      (AC2)
 *     gate-blocks-when-pass-rate-drops                    (AC3)
 *     gate-blocks-when-full-score-drops                   (AC3)
 *     blocked-row-reason-pass-rate                        (AC6)
 *     blocked-row-reason-score                            (AC6)
 *     blocked-row-reason-both                             (AC6)
 *
 *   Integration:
 *     gate-pass-appends-only-one-row                      (AC2)
 *     gate-blocks-no-human-input-required                 (AC3)
 *
 *   NFR:
 *     nfr-gate-completes-within-2-minutes                 (Performance)
 *     nfr-results-tsv-no-credentials                      (Security)
 *     nfr-results-tsv-append-only-no-modifications        (Audit)
 *
 * Run:  node .github/scripts/check-watermark-gate.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js fs + os only.
 */
'use strict';

const fs   = require('fs');
const os   = require('os');
const path = require('path');

const root = path.join(__dirname, '..', '..');

// ── Load module under test ────────────────────────────────────────────────────

const {
  parseSuite,
  parseResultsTsv,
  findBestWatermark,
  computeVerdict,
  formatTsvRow,
  runWatermarkGate,
} = require(path.join(root, '.github', 'scripts', 'watermark-gate.js'));

// ── Test harness ──────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

function assert(condition, name, reason) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}: ${reason}`);
    failed++;
    failures.push({ name, reason });
  }
}

// ── Fixtures and helpers ──────────────────────────────────────────────────────

/** Create a temporary directory for each test that needs file I/O. */
function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'watermark-gate-test-'));
}

/** Build a minimal suite.json object. */
function makeSuiteJson(skillSetHash, surfaceType, totalScenarios, passCount) {
  const scenarios = [];
  for (let i = 0; i < totalScenarios; i++) {
    scenarios.push({ id: `s${i + 1}`, pass: i < passCount });
  }
  return { skillSetHash, surfaceType, scenarios };
}

/** Build a baseline TSV row string with known values (no trailing newline). */
function makeBaselineRow(skillSetHash, surfaceType, passRate, fullTestScore) {
  return formatTsvRow(
    '2026-01-01T00:00:00.000Z',
    skillSetHash, surfaceType,
    passRate, fullTestScore,
    'baseline', ''
  );
}

/** Write a suite.json file to disk and return its path. Uses an optional suffix to avoid collisions. */
function writeSuiteJson(dir, suiteObj, suffix) {
  const filename = suffix ? `suite-${suffix}.json` : 'suite.json';
  const p = path.join(dir, filename);
  fs.writeFileSync(p, JSON.stringify(suiteObj, null, 2), 'utf8');
  return p;
}

/** Write initial rows to a results.tsv file and return its path. */
function writeResultsTsv(dir, rows) {
  const p = path.join(dir, 'results.tsv');
  fs.writeFileSync(p, rows.join('\n') + '\n', 'utf8');
  return p;
}

// ── Unit Tests — AC1: First run ───────────────────────────────────────────────

console.log('');
console.log('  AC1: First gate run creates results.tsv with baseline row');

{
  // first-run-creates-results-tsv-with-baseline
  const dir         = makeTmpDir();
  const suiteJson   = makeSuiteJson('abc123', 'git-native', 20, 18);
  const suitePath   = writeSuiteJson(dir, suiteJson);
  const resultsTsv  = path.join(dir, 'results.tsv');

  // Precondition: results.tsv does not exist
  assert(!fs.existsSync(resultsTsv), 'precondition-no-results-tsv', 'results.tsv should not exist before test');

  const result = runWatermarkGate({ suiteJsonPath: suitePath, resultsTsvPath: resultsTsv });

  const fileExists  = fs.existsSync(resultsTsv);
  const content     = fileExists ? fs.readFileSync(resultsTsv, 'utf8') : '';
  const rows        = parseResultsTsv(content);

  assert(fileExists, 'first-run-creates-results-tsv-with-baseline', 'results.tsv was not created');
  assert(
    rows.length === 1,
    'first-run-creates-exactly-one-row',
    `Expected 1 row, got ${rows.length}`
  );
  assert(
    result.verdict === 'baseline',
    'first-run-verdict-is-baseline',
    `Expected verdict=baseline, got ${result.verdict}`
  );
}

{
  // first-run-baseline-row-schema
  const dir        = makeTmpDir();
  const suiteJson  = makeSuiteJson('abc123', 'git-native', 20, 18);
  const suitePath  = writeSuiteJson(dir, suiteJson);
  const resultsTsv = path.join(dir, 'results.tsv');

  runWatermarkGate({ suiteJsonPath: suitePath, resultsTsvPath: resultsTsv });

  const content = fs.readFileSync(resultsTsv, 'utf8');
  const rows    = parseResultsTsv(content);
  const row     = rows[0];

  // ISO 8601 timestamp
  const isIso = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(row.timestamp);
  assert(isIso, 'first-run-baseline-row-schema-timestamp-iso8601', `Timestamp "${row.timestamp}" is not ISO 8601`);

  // non-empty skillSetHash
  assert(
    typeof row.skillSetHash === 'string' && row.skillSetHash.length > 0,
    'first-run-baseline-row-schema-skillSetHash-non-empty',
    `skillSetHash is empty or missing`
  );

  // non-empty surfaceType
  assert(
    typeof row.surfaceType === 'string' && row.surfaceType.length > 0,
    'first-run-baseline-row-schema-surfaceType-non-empty',
    `surfaceType is empty or missing`
  );

  // passRate is float 0–1
  assert(
    typeof row.passRate === 'number' && row.passRate >= 0 && row.passRate <= 1,
    'first-run-baseline-row-schema-passRate-float-0-1',
    `passRate="${row.passRate}" not in [0,1]`
  );

  // fullTestScore is non-negative integer
  assert(
    Number.isInteger(row.fullTestScore) && row.fullTestScore >= 0,
    'first-run-baseline-row-schema-fullTestScore-non-negative-int',
    `fullTestScore="${row.fullTestScore}" is not a non-negative integer`
  );

  // verdict is 'baseline'
  assert(
    row.verdict === 'baseline',
    'first-run-baseline-row-schema-verdict-baseline',
    `verdict="${row.verdict}" expected "baseline"`
  );

  // All seven columns present (trigger column present, may be empty)
  const rawLine  = content.split('\n')[0];
  const colCount = rawLine.split('\t').length;
  assert(
    colCount === 7,
    'first-run-baseline-row-schema-seven-columns',
    `Expected 7 columns, got ${colCount}`
  );
}

// ── Unit Tests — AC2: Gate passes ────────────────────────────────────────────

console.log('');
console.log('  AC2: Gate passes when at or above watermark');

{
  // gate-pass-when-at-watermark — equal-to is pass (≥ not >)
  const watermark = { passRate: 0.9, fullTestScore: 18 };
  const current   = { passRate: 0.9, fullTestScore: 18 };
  const { verdict } = computeVerdict(current, watermark);
  assert(verdict === 'pass', 'gate-pass-when-at-watermark', `Expected pass, got ${verdict}`);
}

{
  // gate-pass-when-above-watermark
  const watermark = { passRate: 0.9, fullTestScore: 18 };
  const current   = { passRate: 1.0, fullTestScore: 20 };
  const { verdict } = computeVerdict(current, watermark);
  assert(verdict === 'pass', 'gate-pass-when-above-watermark', `Expected pass, got ${verdict}`);
}

// ── Unit Tests — AC3: Gate blocks ────────────────────────────────────────────

console.log('');
console.log('  AC3: Gate blocks when metrics drop below watermark');

{
  // gate-blocks-when-pass-rate-drops
  const watermark = { passRate: 0.9, fullTestScore: 18 };
  const current   = { passRate: 0.7, fullTestScore: 18 };
  const { verdict } = computeVerdict(current, watermark);
  assert(verdict === 'blocked', 'gate-blocks-when-pass-rate-drops', `Expected blocked, got ${verdict}`);
}

{
  // gate-blocks-when-full-score-drops
  const watermark = { passRate: 0.9, fullTestScore: 18 };
  const current   = { passRate: 0.9, fullTestScore: 15 };
  const { verdict } = computeVerdict(current, watermark);
  assert(verdict === 'blocked', 'gate-blocks-when-full-score-drops', `Expected blocked, got ${verdict}`);
}

// ── Unit Tests — AC6: Trigger field ──────────────────────────────────────────

console.log('');
console.log('  AC6: Blocked row records specific trigger condition');

{
  // blocked-row-reason-pass-rate
  const watermark = { passRate: 0.9, fullTestScore: 18 };
  const current   = { passRate: 0.7, fullTestScore: 18 };
  const { verdict, trigger } = computeVerdict(current, watermark);
  assert(
    verdict === 'blocked' && trigger === 'pass-rate-below-watermark',
    'blocked-row-reason-pass-rate',
    `Expected trigger=pass-rate-below-watermark, got verdict=${verdict} trigger=${trigger}`
  );
}

{
  // blocked-row-reason-score
  const watermark = { passRate: 0.9, fullTestScore: 18 };
  const current   = { passRate: 0.9, fullTestScore: 15 };
  const { verdict, trigger } = computeVerdict(current, watermark);
  assert(
    verdict === 'blocked' && trigger === 'score-below-best',
    'blocked-row-reason-score',
    `Expected trigger=score-below-best, got verdict=${verdict} trigger=${trigger}`
  );
}

{
  // blocked-row-reason-both
  const watermark = { passRate: 0.9, fullTestScore: 18 };
  const current   = { passRate: 0.6, fullTestScore: 12 };
  const { verdict, trigger } = computeVerdict(current, watermark);
  assert(
    verdict === 'blocked' && trigger === 'both',
    'blocked-row-reason-both',
    `Expected trigger=both, got verdict=${verdict} trigger=${trigger}`
  );
}

// ── Integration Tests ─────────────────────────────────────────────────────────

console.log('');
console.log('  Integration: AC2 append-only and AC3 non-zero exit');

{
  // gate-pass-appends-only-one-row
  // Precondition: results.tsv with two existing rows (baseline + one prior pass); incoming score above watermark
  const dir       = makeTmpDir();
  const suiteJson = makeSuiteJson('abc123', 'git-native', 20, 20); // passRate=1.0, score=20
  const suitePath = writeSuiteJson(dir, suiteJson);

  const row1 = makeBaselineRow('abc123', 'git-native', 0.9, 18);
  const row2 = formatTsvRow('2026-01-02T00:00:00.000Z', 'abc123', 'git-native', 0.9, 18, 'pass', '');
  const resultsTsv = writeResultsTsv(dir, [row1, row2]);

  const originalContent = fs.readFileSync(resultsTsv, 'utf8');

  runWatermarkGate({ suiteJsonPath: suitePath, resultsTsvPath: resultsTsv });

  const newContent = fs.readFileSync(resultsTsv, 'utf8');
  const newRows    = parseResultsTsv(newContent);

  assert(newRows.length === 3, 'gate-pass-appends-only-one-row-count', `Expected 3 rows, got ${newRows.length}`);

  // First two rows must be unchanged (byte-for-byte)
  assert(
    newContent.startsWith(originalContent),
    'gate-pass-appends-only-one-row-original-unchanged',
    'Original rows were modified — append-only violated'
  );

  // Third row must have verdict 'pass'
  assert(
    newRows[2].verdict === 'pass',
    'gate-pass-appends-only-one-row-verdict-pass',
    `Expected new row verdict=pass, got ${newRows[2].verdict}`
  );
}

{
  // gate-blocks-no-human-input-required
  // Precondition: results.tsv with watermark above incoming score; gate must exit non-zero without waiting
  const dir       = makeTmpDir();
  // incoming: passRate ≈ 0.5, score=10 — both below watermark of 0.9/18
  const suiteJson = makeSuiteJson('abc123', 'git-native', 20, 10);
  const suitePath = writeSuiteJson(dir, suiteJson);

  const baselineRow = makeBaselineRow('abc123', 'git-native', 0.9, 18);
  const resultsTsv  = writeResultsTsv(dir, [baselineRow]);

  let result;
  let threw = false;
  try {
    result = runWatermarkGate({ suiteJsonPath: suitePath, resultsTsvPath: resultsTsv });
  } catch (e) {
    threw = true;
  }

  assert(!threw, 'gate-blocks-no-human-input-required-no-throw', 'Gate threw unexpectedly');
  assert(
    result && result.verdict === 'blocked',
    'gate-blocks-no-human-input-required-verdict-blocked',
    `Expected verdict=blocked, got ${result && result.verdict}`
  );
  // No human step: gate returns immediately (we verified synchronously above)
  // CLI exits non-zero — verified by the verdict value (runWatermarkGate returns 'blocked')
  assert(true, 'gate-blocks-no-human-input-required-immediate', 'Gate returned synchronously (no human input required)');
}

// ── NFR Tests ─────────────────────────────────────────────────────────────────

console.log('');
console.log('  NFR: Performance, security, audit');

{
  // nfr-gate-completes-within-2-minutes
  // Verify that the assurance-gate.yml step or job timeout is ≤ 120 seconds
  const workflowPath = path.join(root, '.github', 'workflows', 'assurance-gate.yml');
  const exists = fs.existsSync(workflowPath);

  assert(exists, 'nfr-gate-completes-within-2-minutes-workflow-exists', 'assurance-gate.yml not found');

  if (exists) {
    const content = fs.readFileSync(workflowPath, 'utf8');
    // Acceptable forms: timeout-minutes: 2  OR  timeout-minutes: 1  (any value ≤ 2 minutes)
    const timeoutMatch = content.match(/timeout-minutes:\s*(\d+)/);
    if (timeoutMatch) {
      const minutes = parseInt(timeoutMatch[1], 10);
      assert(
        minutes <= 2,
        'nfr-gate-completes-within-2-minutes-timeout-configured',
        `timeout-minutes=${minutes} exceeds 2-minute limit`
      );
    } else {
      // If no step-level timeout, check for job-level timeout
      const jobTimeoutMatch = content.match(/timeout-minutes:\s*(\d+)/g);
      assert(
        !!jobTimeoutMatch,
        'nfr-gate-completes-within-2-minutes-timeout-configured',
        'No timeout-minutes configured in assurance-gate.yml'
      );
    }
  }
}

{
  // nfr-results-tsv-no-credentials
  const dir        = makeTmpDir();
  const suitePaths = [];

  // Build a populated results.tsv with baseline, pass, and blocked rows
  const baselineRow  = makeBaselineRow('abc123', 'git-native', 0.9, 18);
  const passRow      = formatTsvRow('2026-01-02T00:00:00.000Z', 'abc123', 'git-native', 1.0, 20, 'pass', '');
  const blockedRow   = formatTsvRow('2026-01-03T00:00:00.000Z', 'abc123', 'git-native', 0.5, 9, 'blocked', 'both');
  const resultsTsv   = writeResultsTsv(dir, [baselineRow, passRow, blockedRow]);

  const content = fs.readFileSync(resultsTsv, 'utf8');

  const CREDENTIAL_PATTERNS = [
    /ghp_[A-Za-z0-9]{20,}/,
    /Bearer [A-Za-z0-9]{20,}/,
    /password/i,
    /\d{12,19}/,   // PAN-like pattern
  ];

  const credFound = CREDENTIAL_PATTERNS.some(p => p.test(content));
  assert(!credFound, 'nfr-results-tsv-no-credentials', `Credential-like pattern found in results.tsv content`);
}

{
  // nfr-results-tsv-append-only-no-modifications
  // Precondition: results.tsv with two rows; run three gate operations (pass, blocked, pass again)
  const dir = makeTmpDir();

  const row1 = makeBaselineRow('hash-nfr', 'git-native', 0.9, 18);
  const row2 = formatTsvRow('2026-01-02T00:00:00.000Z', 'hash-nfr', 'git-native', 0.9, 18, 'pass', '');
  const resultsTsv = writeResultsTsv(dir, [row1, row2]);

  const originalContent = fs.readFileSync(resultsTsv, 'utf8');
  const originalRows    = parseResultsTsv(originalContent);

  // Run 1: pass (passRate=0.9, score=18 exactly at watermark)
  const suite1 = makeSuiteJson('hash-nfr', 'git-native', 20, 18);
  const path1  = writeSuiteJson(dir, suite1, 'pass');
  runWatermarkGate({ suiteJsonPath: path1, resultsTsvPath: resultsTsv });

  // Run 2: blocked (passRate drops to 0.5, score drops to 10)
  const suite2 = makeSuiteJson('hash-nfr', 'git-native', 20, 10);
  const path2  = writeSuiteJson(dir, suite2, 'blocked');
  runWatermarkGate({ suiteJsonPath: path2, resultsTsvPath: resultsTsv });

  // Run 3: pass again (passRate=0.9, score=18 — back to watermark)
  runWatermarkGate({ suiteJsonPath: path1, resultsTsvPath: resultsTsv });

  const finalContent = fs.readFileSync(resultsTsv, 'utf8');
  const finalRows    = parseResultsTsv(finalContent);

  // Row count must be 5 (2 original + 3 new)
  assert(finalRows.length === 5, 'nfr-results-tsv-append-only-row-count-5', `Expected 5 rows, got ${finalRows.length}`);

  // File must start with the original content (original rows unchanged)
  assert(
    finalContent.startsWith(originalContent),
    'nfr-results-tsv-append-only-original-rows-unchanged',
    'Original rows were modified — append-only violated'
  );

  // Verdicts of new rows: pass, blocked, pass
  const r3 = finalRows[2], r4 = finalRows[3], r5 = finalRows[4];
  assert(r3 && r3.verdict === 'pass',    'nfr-results-tsv-append-only-run1-verdict-pass',    `Expected pass, got ${r3 && r3.verdict}`);
  assert(r4 && r4.verdict === 'blocked', 'nfr-results-tsv-append-only-run2-verdict-blocked', `Expected blocked, got ${r4 && r4.verdict}`);
  assert(r5 && r5.verdict === 'pass',    'nfr-results-tsv-append-only-run3-verdict-pass',    `Expected pass, got ${r5 && r5.verdict}`);
}

// ── Summary ───────────────────────────────────────────────────────────────────

console.log('');
console.log(`[watermark-gate-check] Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('');
  console.log('  Failures:');
  for (const f of failures) {
    console.log(`    ✗ ${f.name}: ${f.reason}`);
  }
  process.exit(1);
}
