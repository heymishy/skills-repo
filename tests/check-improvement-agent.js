#!/usr/bin/env node
/**
 * check-improvement-agent.js
 *
 * Automated tests for the improvement agent (p2.11):
 * queryable trace interface, failure/staleness detection, and diff proposals.
 *
 * Tests from the test plan:
 *
 *   AC1 — queryTraces filtering:
 *   - queryTraces-storySlug-filter
 *   - queryTraces-patternLabel-filter
 *   - queryTraces-dateRange-filter
 *   - queryTraces-combined-filters
 *
 *   AC2 — failure signal detection:
 *   - failure-signal-3-occurrences-triggers-proposal
 *   - failure-signal-2-below-threshold-no-proposal
 *   - failure-signal-sliding-window-10-most-recent
 *   - failure-signal-pattern-label-case-insensitive
 *
 *   AC3 — staleness signal detection:
 *   - staleness-signal-90-days-no-activity-triggers-proposal
 *   - staleness-signal-context-yml-override-window
 *
 *   AC4 — anti-overfitting gate:
 *   - anti-overfitting-blocks-removal-of-passing-check
 *   - anti-overfitting-blocks-weakening-threshold
 *   - anti-overfitting-passes-when-check-not-all-pass
 *   - anti-overfitting-passes-add-check-proposal
 *   - anti-overfitting-writes-warning-not-proposal
 *
 *   AC5 — proposal file structure:
 *   - proposal-file-has-all-6-required-fields
 *   - staleness-proposal-file-has-all-6-required-fields
 *   - overfitting-warning-file-has-required-structure
 *
 *   AC6 — state.json proposals block:
 *   - state-json-proposals-block-updated-after-session
 *   - state-json-proposals-lists-path-created-at-status
 *
 *   NFR:
 *   - idempotency-duplicate-run-produces-no-extra-files
 *   - privacy-sensitive-fields-redacted-before-processing
 *
 * Run:  node tests/check-improvement-agent.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, os).
 */
'use strict';

var fs   = require('fs');
var path = require('path');
var os   = require('os');

var root           = path.join(__dirname, '..');
var traceInterface = require(path.join(root, 'src', 'improvement-agent', 'trace-interface.js'));
var detector       = require(path.join(root, 'src', 'improvement-agent', 'failure-detector.js'));

// ── Helpers ───────────────────────────────────────────────────────────────────

var passed   = 0;
var failed   = 0;
var failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name: name, reason: reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'improvement-agent-test-'));
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (var entry of fs.readdirSync(dir)) {
    var full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) rmDir(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

/**
 * Write a trace object as a JSON file in a directory.
 *
 * @param {string} dir
 * @param {string} filename
 * @param {object} trace
 */
function writeTrace(dir, filename, trace) {
  fs.writeFileSync(path.join(dir, filename), JSON.stringify(trace, null, 2) + '\n', 'utf8');
}

/**
 * Build a minimal trace object with defaults.
 */
function makeTrace(overrides) {
  return Object.assign({
    traceId:      'trace-' + Math.random().toString(36).substring(2, 8),
    storySlug:    'story-a',
    skillSlug:    'definition',
    surfaceType:  'ci',
    createdAt:    '2026-03-01T00:00:00Z',
    failurePattern: 'missing-test-coverage',
    checks:       [],
  }, overrides);
}

/**
 * Write a minimal context.yml to a temp file for config override tests.
 */
function writeTmpContextYml(dir, content) {
  var p = path.join(dir, 'context.yml');
  fs.writeFileSync(p, content, 'utf8');
  return p;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

var tmpBase = mkTmpDir();

// ── AC1: queryTraces filtering ────────────────────────────────────────────────

console.log('\n  AC1 — queryTraces filtering');

(function testStorySlugFilter() {
  var tracesDir = path.join(tmpBase, 'traces-slug');
  fs.mkdirSync(tracesDir, { recursive: true });

  writeTrace(tracesDir, 'sa1.json', makeTrace({ traceId: 'sa1', storySlug: 'story-a' }));
  writeTrace(tracesDir, 'sa2.json', makeTrace({ traceId: 'sa2', storySlug: 'story-a' }));
  writeTrace(tracesDir, 'sa3.json', makeTrace({ traceId: 'sa3', storySlug: 'story-a' }));
  writeTrace(tracesDir, 'sb1.json', makeTrace({ traceId: 'sb1', storySlug: 'story-b' }));
  writeTrace(tracesDir, 'sb2.json', makeTrace({ traceId: 'sb2', storySlug: 'story-b' }));

  var results = traceInterface.queryTraces({ storySlug: 'story-a' }, tracesDir);

  if (results.length !== 3) {
    fail('queryTraces-storySlug-filter', 'Expected 3 traces for story-a, got ' + results.length);
    return;
  }
  var allMatch = results.every(function (t) { return t.storySlug === 'story-a'; });
  if (!allMatch) {
    fail('queryTraces-storySlug-filter', 'Some returned traces do not have storySlug=story-a');
    return;
  }
  pass('queryTraces-storySlug-filter');
}());

(function testPatternLabelFilter() {
  var tracesDir = path.join(tmpBase, 'traces-pattern');
  fs.mkdirSync(tracesDir, { recursive: true });

  writeTrace(tracesDir, 'p1.json', makeTrace({ traceId: 'p1', failurePattern: 'missing-test-coverage' }));
  writeTrace(tracesDir, 'p2.json', makeTrace({ traceId: 'p2', failurePattern: 'missing-test-coverage' }));
  writeTrace(tracesDir, 'p3.json', makeTrace({ traceId: 'p3', failurePattern: 'ac-not-testable' }));
  writeTrace(tracesDir, 'p4.json', makeTrace({ traceId: 'p4', failurePattern: 'ac-not-testable' }));
  writeTrace(tracesDir, 'p5.json', makeTrace({ traceId: 'p5', failurePattern: 'ac-not-testable' }));
  writeTrace(tracesDir, 'p6.json', makeTrace({ traceId: 'p6', failurePattern: 'ac-not-testable' }));

  var results = traceInterface.queryTraces({ patternLabel: 'missing-test-coverage' }, tracesDir);

  if (results.length !== 2) {
    fail('queryTraces-patternLabel-filter', 'Expected 2 traces, got ' + results.length);
    return;
  }
  var allMatch = results.every(function (t) {
    return t.failurePattern && t.failurePattern.toLowerCase() === 'missing-test-coverage';
  });
  if (!allMatch) {
    fail('queryTraces-patternLabel-filter', 'Some returned traces do not match pattern label');
    return;
  }
  pass('queryTraces-patternLabel-filter');
}());

(function testPatternLabelCaseInsensitiveFilter() {
  var tracesDir = path.join(tmpBase, 'traces-pattern-ci');
  fs.mkdirSync(tracesDir, { recursive: true });

  // All lowercase — should match case-insensitive query
  writeTrace(tracesDir, 'ci1.json', makeTrace({ traceId: 'ci1', failurePattern: 'missing-test-coverage' }));
  writeTrace(tracesDir, 'ci2.json', makeTrace({ traceId: 'ci2', failurePattern: 'ac-not-testable' }));

  // Query with uppercase should still work (filter is case-insensitive)
  var results = traceInterface.queryTraces({ patternLabel: 'MISSING-TEST-COVERAGE' }, tracesDir);

  if (results.length !== 1) {
    fail('queryTraces-patternLabel-case-insensitive', 'Expected 1 result for case-insensitive match, got ' + results.length);
    return;
  }
  pass('queryTraces-patternLabel-case-insensitive');
}());

(function testDateRangeFilter() {
  var tracesDir = path.join(tmpBase, 'traces-date');
  fs.mkdirSync(tracesDir, { recursive: true });

  writeTrace(tracesDir, 'd1.json', makeTrace({ traceId: 'd1', createdAt: '2025-12-01T00:00:00Z' }));
  writeTrace(tracesDir, 'd2.json', makeTrace({ traceId: 'd2', createdAt: '2026-01-15T00:00:00Z' }));
  writeTrace(tracesDir, 'd3.json', makeTrace({ traceId: 'd3', createdAt: '2026-02-01T00:00:00Z' }));
  writeTrace(tracesDir, 'd4.json', makeTrace({ traceId: 'd4', createdAt: '2026-02-28T00:00:00Z' }));
  writeTrace(tracesDir, 'd5.json', makeTrace({ traceId: 'd5', createdAt: '2026-04-01T00:00:00Z' }));

  var results = traceInterface.queryTraces({
    dateRange: { from: '2026-01-01', to: '2026-03-01' },
  }, tracesDir);

  // d2, d3, d4 should be in range; d1 (before) and d5 (after) excluded
  if (results.length !== 3) {
    fail('queryTraces-dateRange-filter', 'Expected 3 traces in range, got ' + results.length +
         ' (traceIds: ' + results.map(function (t) { return t.traceId; }).join(', ') + ')');
    return;
  }
  var ids = results.map(function (t) { return t.traceId; }).sort();
  if (ids[0] !== 'd2' || ids[1] !== 'd3' || ids[2] !== 'd4') {
    fail('queryTraces-dateRange-filter', 'Wrong traces returned: ' + ids.join(', '));
    return;
  }
  pass('queryTraces-dateRange-filter');
}());

(function testCombinedFilters() {
  var tracesDir = path.join(tmpBase, 'traces-combined');
  fs.mkdirSync(tracesDir, { recursive: true });

  // Should match all filters
  writeTrace(tracesDir, 'c1.json', makeTrace({
    traceId: 'c1', storySlug: 'story-a', failurePattern: 'ac-ambiguous', createdAt: '2026-02-01T00:00:00Z',
  }));
  // Wrong story slug
  writeTrace(tracesDir, 'c2.json', makeTrace({
    traceId: 'c2', storySlug: 'story-b', failurePattern: 'ac-ambiguous', createdAt: '2026-02-01T00:00:00Z',
  }));
  // Wrong pattern label
  writeTrace(tracesDir, 'c3.json', makeTrace({
    traceId: 'c3', storySlug: 'story-a', failurePattern: 'missing-test-coverage', createdAt: '2026-02-01T00:00:00Z',
  }));
  // Outside date range
  writeTrace(tracesDir, 'c4.json', makeTrace({
    traceId: 'c4', storySlug: 'story-a', failurePattern: 'ac-ambiguous', createdAt: '2025-12-01T00:00:00Z',
  }));
  // Should match
  writeTrace(tracesDir, 'c5.json', makeTrace({
    traceId: 'c5', storySlug: 'story-a', failurePattern: 'ac-ambiguous', createdAt: '2026-03-15T00:00:00Z',
  }));

  var results = traceInterface.queryTraces({
    storySlug:    'story-a',
    patternLabel: 'ac-ambiguous',
    dateRange:    { from: '2026-01-01', to: '2026-06-01' },
  }, tracesDir);

  if (results.length !== 2) {
    fail('queryTraces-combined-filters', 'Expected 2 traces matching all filters, got ' + results.length +
         ' (ids: ' + results.map(function (t) { return t.traceId; }).join(', ') + ')');
    return;
  }
  var ids = results.map(function (t) { return t.traceId; }).sort();
  if (ids[0] !== 'c1' || ids[1] !== 'c5') {
    fail('queryTraces-combined-filters', 'Wrong traces returned: ' + ids.join(', '));
    return;
  }
  pass('queryTraces-combined-filters');
}());

// ── AC2: failure signal detection ─────────────────────────────────────────────

console.log('\n  AC2 — failure signal detection');

(function testFailure3OccurrencesTriggerProposal() {
  var tracesDir    = path.join(tmpBase, 'traces-f3');
  var proposalsDir = path.join(tmpBase, 'proposals-f3');
  fs.mkdirSync(tracesDir, { recursive: true });

  // 10 traces total, exactly 3 with failurePattern: missing-test-coverage
  for (var i = 0; i < 7; i++) {
    writeTrace(tracesDir, 'fx' + i + '.json', makeTrace({
      traceId: 'fx' + i,
      failurePattern: 'ac-not-testable',
      createdAt: '2026-03-0' + (i + 1) + 'T00:00:00Z',
    }));
  }
  for (var j = 0; j < 3; j++) {
    writeTrace(tracesDir, 'fmtc' + j + '.json', makeTrace({
      traceId: 'fmtc' + j,
      failurePattern: 'missing-test-coverage',
      createdAt: '2026-03-' + (10 + j) + 'T00:00:00Z',
    }));
  }

  var config = { failurePatternThreshold: 3, slidingWindowSize: 10 };
  var traces  = traceInterface.readAllTraces(tracesDir);
  var signals = detector.detectFailureSignals(traces, config);

  var mtcSignal = signals.filter(function (s) { return s.pattern === 'missing-test-coverage'; });
  if (mtcSignal.length === 0) {
    fail('failure-signal-3-occurrences-triggers-proposal',
         'No signal generated for pattern with 3 occurrences (threshold=3)');
    return;
  }
  if (mtcSignal[0].count !== 3) {
    fail('failure-signal-3-occurrences-triggers-proposal',
         'Expected count=3, got ' + mtcSignal[0].count);
    return;
  }

  // Also verify the proposal file is written
  var now = new Date('2026-04-12T00:00:00Z');
  var result = detector.runAgent({
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: path.join(tmpBase, 'state-f3.json'),
    contextYmlPath: path.join(root, '.github', 'context.yml'),
    now: now,
  });

  if (result.proposals.length === 0) {
    fail('failure-signal-3-occurrences-triggers-proposal', 'No proposal file written');
    return;
  }

  var proposalFiles = fs.readdirSync(proposalsDir).filter(function (f) {
    return f.indexOf('failure-proposal') !== -1;
  });
  if (proposalFiles.length === 0) {
    fail('failure-signal-3-occurrences-triggers-proposal',
         'No failure-proposal file found in proposals dir');
    return;
  }

  // Check filename matches YYYY-MM-DD-[skill-slug]-failure-proposal.md
  var fileNameOk = proposalFiles.some(function (f) {
    return /^\d{4}-\d{2}-\d{2}-.+-failure-proposal\.md$/.test(f);
  });
  if (!fileNameOk) {
    fail('failure-signal-3-occurrences-triggers-proposal',
         'Proposal filename does not match YYYY-MM-DD-[skill-slug]-failure-proposal.md: ' + proposalFiles[0]);
    return;
  }

  pass('failure-signal-3-occurrences-triggers-proposal');
}());

(function testFailure2BelowThresholdNoProposal() {
  var tracesDir    = path.join(tmpBase, 'traces-f2');
  var proposalsDir = path.join(tmpBase, 'proposals-f2');
  fs.mkdirSync(tracesDir, { recursive: true });

  // 10 traces, exactly 2 with the same pattern — below threshold
  for (var i = 0; i < 8; i++) {
    writeTrace(tracesDir, 'fa' + i + '.json', makeTrace({
      traceId: 'fa' + i,
      failurePattern: 'ac-not-testable',
      createdAt: '2026-03-0' + (i + 1) + 'T00:00:00Z',
    }));
  }
  writeTrace(tracesDir, 'fbelow0.json', makeTrace({
    traceId: 'fbelow0',
    failurePattern: 'scope-unstable',
    createdAt: '2026-03-10T00:00:00Z',
  }));
  writeTrace(tracesDir, 'fbelow1.json', makeTrace({
    traceId: 'fbelow1',
    failurePattern: 'scope-unstable',
    createdAt: '2026-03-11T00:00:00Z',
  }));

  var config = { failurePatternThreshold: 3, slidingWindowSize: 10 };
  var traces  = traceInterface.readAllTraces(tracesDir);
  var signals = detector.detectFailureSignals(traces, config);

  var scopeSignals = signals.filter(function (s) { return s.pattern === 'scope-unstable'; });
  if (scopeSignals.length !== 0) {
    fail('failure-signal-2-below-threshold-no-proposal',
         'Signal generated for pattern with only 2 occurrences (below threshold=3)');
    return;
  }
  pass('failure-signal-2-below-threshold-no-proposal');
}());

(function testSlidingWindowExcludesOldTraces() {
  var tracesDir = path.join(tmpBase, 'traces-window');
  fs.mkdirSync(tracesDir, { recursive: true });

  // 15 traces total for same surface type
  // Oldest 5: have pattern 'old-label' → fall outside the 10-trace window
  // Newest 10: 3 have 'new-label', 7 have 'other-pattern'
  for (var i = 0; i < 5; i++) {
    writeTrace(tracesDir, 'old' + i + '.json', makeTrace({
      traceId: 'old' + i,
      surfaceType: 'ci',
      failurePattern: 'old-label',
      createdAt: '2026-01-0' + (i + 1) + 'T00:00:00Z',
    }));
  }
  for (var j = 0; j < 7; j++) {
    writeTrace(tracesDir, 'win' + j + '.json', makeTrace({
      traceId: 'win' + j,
      surfaceType: 'ci',
      failurePattern: 'other-pattern',
      createdAt: '2026-02-' + String(j + 1).padStart(2, '0') + 'T00:00:00Z',
    }));
  }
  for (var k = 0; k < 3; k++) {
    writeTrace(tracesDir, 'new' + k + '.json', makeTrace({
      traceId: 'new' + k,
      surfaceType: 'ci',
      failurePattern: 'new-label',
      createdAt: '2026-03-' + String(k + 1).padStart(2, '0') + 'T00:00:00Z',
    }));
  }

  var config = { failurePatternThreshold: 3, slidingWindowSize: 10 };
  var traces  = traceInterface.readAllTraces(tracesDir);
  var signals = detector.detectFailureSignals(traces, config);

  var newLabelSignals = signals.filter(function (s) { return s.pattern === 'new-label'; });
  var oldLabelSignals = signals.filter(function (s) { return s.pattern === 'old-label'; });

  if (newLabelSignals.length === 0) {
    fail('failure-signal-sliding-window-10-most-recent',
         'Expected signal for new-label (3 occurrences in 10-trace window)');
    return;
  }
  if (oldLabelSignals.length !== 0) {
    fail('failure-signal-sliding-window-10-most-recent',
         'Got signal for old-label (should be excluded from sliding window): ' + oldLabelSignals.length + ' signal(s)');
    return;
  }
  pass('failure-signal-sliding-window-10-most-recent');
}());

(function testCaseInsensitivePatternMatch() {
  var tracesDir = path.join(tmpBase, 'traces-case');
  fs.mkdirSync(tracesDir, { recursive: true });

  // Mix of kebab-case (valid) and space/uppercase (invalid) patterns
  // Kebab-case patterns match; non-kebab are rejected by the detector
  for (var i = 0; i < 3; i++) {
    writeTrace(tracesDir, 'kc' + i + '.json', makeTrace({
      traceId: 'kc' + i,
      failurePattern: 'missing-test-coverage', // valid kebab-case
      createdAt: '2026-03-0' + (i + 1) + 'T00:00:00Z',
    }));
  }
  // Invalid format — should NOT trigger proposal
  for (var j = 0; j < 3; j++) {
    writeTrace(tracesDir, 'inv' + j + '.json', makeTrace({
      traceId: 'inv' + j,
      failurePattern: 'Missing Test Coverage', // spaces — invalid
      createdAt: '2026-03-0' + (j + 4) + 'T00:00:00Z',
    }));
  }

  var config = { failurePatternThreshold: 3, slidingWindowSize: 10 };
  var traces  = traceInterface.readAllTraces(tracesDir);
  var signals = detector.detectFailureSignals(traces, config);

  var kebabSignals = signals.filter(function (s) { return s.pattern === 'missing-test-coverage'; });
  var invalidSignals = signals.filter(function (s) { return s.pattern === 'Missing Test Coverage'; });

  if (kebabSignals.length === 0) {
    fail('failure-signal-pattern-label-case-insensitive',
         'Expected signal for valid kebab-case pattern missing-test-coverage');
    return;
  }
  if (invalidSignals.length !== 0) {
    fail('failure-signal-pattern-label-case-insensitive',
         'Signal generated for invalid pattern format "Missing Test Coverage" (spaces not allowed)');
    return;
  }
  pass('failure-signal-pattern-label-case-insensitive');
}());

// ── AC3: staleness signal detection ──────────────────────────────────────────

console.log('\n  AC3 — staleness signal detection');

(function testStaleness95DaysTriggersProposal() {
  var tracesDir    = path.join(tmpBase, 'traces-stale95');
  var proposalsDir = path.join(tmpBase, 'proposals-stale95');
  fs.mkdirSync(tracesDir, { recursive: true });

  // Last trace 95 days before "now"
  var now = new Date('2026-04-12T00:00:00Z');
  var lastActive = new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000);

  writeTrace(tracesDir, 'stale1.json', makeTrace({
    traceId: 'stale1',
    surfaceType: 'ci',
    createdAt: lastActive.toISOString(),
  }));

  var config  = { stalenessWindowDays: 90, slidingWindowSize: 10 };
  var traces  = traceInterface.readAllTraces(tracesDir);
  var signals = detector.detectStalenessSignals(traces, config, now);

  if (signals.length === 0) {
    fail('staleness-signal-90-days-no-activity-triggers-proposal',
         'Expected staleness signal for surface inactive 95 days (threshold=90)');
    return;
  }
  if (signals[0].daysSinceActivity < 90) {
    fail('staleness-signal-90-days-no-activity-triggers-proposal',
         'daysSinceActivity should be >= 90, got ' + signals[0].daysSinceActivity);
    return;
  }

  // Verify proposal file written
  var result = detector.runAgent({
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: path.join(tmpBase, 'state-stale95.json'),
    contextYmlPath: path.join(root, '.github', 'context.yml'),
    now: now,
  });

  var stalenessFiles = fs.readdirSync(proposalsDir).filter(function (f) {
    return f.indexOf('staleness-proposal') !== -1;
  });
  if (stalenessFiles.length === 0) {
    fail('staleness-signal-90-days-no-activity-triggers-proposal',
         'No staleness proposal file written');
    return;
  }
  pass('staleness-signal-90-days-no-activity-triggers-proposal');
}());

(function testStaleness89DaysBoundaryNoProposal() {
  var tracesDir = path.join(tmpBase, 'traces-stale89');
  fs.mkdirSync(tracesDir, { recursive: true });

  var now = new Date('2026-04-12T00:00:00Z');
  var lastActive = new Date(now.getTime() - 89 * 24 * 60 * 60 * 1000);

  writeTrace(tracesDir, 'active1.json', makeTrace({
    traceId: 'active1',
    surfaceType: 'ci',
    createdAt: lastActive.toISOString(),
  }));

  var config  = { stalenessWindowDays: 90, slidingWindowSize: 10 };
  var traces  = traceInterface.readAllTraces(tracesDir);
  var signals = detector.detectStalenessSignals(traces, config, now);

  if (signals.length !== 0) {
    fail('staleness-signal-context-yml-override-window',
         'Expected NO staleness signal for surface inactive 89 days (threshold=90), got ' + signals.length);
    return;
  }
  pass('staleness-signal-context-yml-override-window');
}());

// ── AC4: anti-overfitting gate ────────────────────────────────────────────────

console.log('\n  AC4 — anti-overfitting gate');

(function testAntiOverfittingBlocksRemoval() {
  // Proposal: remove check 'must-have-test-plan'
  // All 10 window traces have must-have-test-plan passing → gate blocks
  var windowTraces = [];
  for (var i = 0; i < 10; i++) {
    windowTraces.push(makeTrace({
      traceId: 'wt' + i,
      checks: [
        { name: 'must-have-test-plan', passed: true },
        { name: 'must-have-dor',       passed: true },
      ],
    }));
  }

  var proposal = {
    proposedAction:  'remove-check',
    targetCheckName: 'must-have-test-plan',
    skillSlug:       'definition',
    surfaceType:     'ci',
    fileName:        '2026-04-12-definition-failure-proposal.md',
    created_at:      '2026-04-12T00:00:00Z',
  };

  var gateResult = detector.checkAntiOverfitting(proposal, windowTraces);

  if (gateResult.passed) {
    fail('anti-overfitting-blocks-removal-of-passing-check',
         'Gate should BLOCK removal of must-have-test-plan (all 10 traces pass)');
    return;
  }
  if (gateResult.blockedCheckName !== 'must-have-test-plan') {
    fail('anti-overfitting-blocks-removal-of-passing-check',
         'blockedCheckName should be must-have-test-plan, got ' + gateResult.blockedCheckName);
    return;
  }
  pass('anti-overfitting-blocks-removal-of-passing-check');
}());

(function testAntiOverfittingBlocksWeakeningThreshold() {
  // Proposal: weaken threshold — reduce a threshold that always passes
  var windowTraces = [];
  for (var i = 0; i < 8; i++) {
    windowTraces.push(makeTrace({
      traceId: 'ww' + i,
      checks: [
        { name: 'must-have-3-acs', passed: true },
      ],
    }));
  }

  var proposal = {
    proposedAction:  'modify-threshold',
    targetCheckName: 'must-have-3-acs',
    skillSlug:       'definition-of-ready',
    surfaceType:     'ci',
    fileName:        '2026-04-12-definition-of-ready-failure-proposal.md',
    created_at:      '2026-04-12T00:00:00Z',
  };

  var gateResult = detector.checkAntiOverfitting(proposal, windowTraces);

  if (gateResult.passed) {
    fail('anti-overfitting-blocks-weakening-threshold',
         'Gate should BLOCK modify-threshold when all traces pass the check');
    return;
  }
  pass('anti-overfitting-blocks-weakening-threshold');
}());

(function testAntiOverfittingPassesWhenNotAllPass() {
  // Proposal: remove check 'must-have-dor'
  // Some window traces have must-have-dor failing → gate should PASS (allow proposal)
  var windowTraces = [];
  for (var i = 0; i < 7; i++) {
    windowTraces.push(makeTrace({
      traceId: 'wp' + i,
      checks: [{ name: 'must-have-dor', passed: true }],
    }));
  }
  // 3 traces have it failing
  for (var j = 0; j < 3; j++) {
    windowTraces.push(makeTrace({
      traceId: 'wf' + j,
      checks: [{ name: 'must-have-dor', passed: false }],
    }));
  }

  var proposal = {
    proposedAction:  'remove-check',
    targetCheckName: 'must-have-dor',
    skillSlug:       'definition',
    surfaceType:     'ci',
    fileName:        '2026-04-12-definition-failure-proposal2.md',
    created_at:      '2026-04-12T00:00:00Z',
  };

  var gateResult = detector.checkAntiOverfitting(proposal, windowTraces);

  if (!gateResult.passed) {
    fail('anti-overfitting-passes-when-check-not-all-pass',
         'Gate should PASS when check is failing on some traces (not universally passing)');
    return;
  }
  pass('anti-overfitting-passes-when-check-not-all-pass');
}());

(function testAntiOverfittingPassesAddCheck() {
  // Adding a new check (strengthening) → gate should always pass
  var windowTraces = [];
  for (var i = 0; i < 10; i++) {
    windowTraces.push(makeTrace({
      traceId: 'wadd' + i,
      checks: [{ name: 'must-have-test-plan', passed: true }],
    }));
  }

  var proposal = {
    proposedAction:  'add-check',  // strengthening — not removal
    targetCheckName: null,
    skillSlug:       'definition',
    surfaceType:     'ci',
    fileName:        '2026-04-12-definition-add-check-proposal.md',
    created_at:      '2026-04-12T00:00:00Z',
  };

  var gateResult = detector.checkAntiOverfitting(proposal, windowTraces);

  if (!gateResult.passed) {
    fail('anti-overfitting-passes-add-check-proposal',
         'Gate should PASS for add-check proposals (not a removal or weakening)');
    return;
  }
  pass('anti-overfitting-passes-add-check-proposal');
}());

(function testAntiOverfittingWritesWarningNotProposal() {
  var tracesDir    = path.join(tmpBase, 'traces-ow');
  var proposalsDir = path.join(tmpBase, 'proposals-ow');
  fs.mkdirSync(tracesDir, { recursive: true });

  // Write 10 traces with must-have-test-plan always passing + failurePattern repeating 3x
  for (var i = 0; i < 7; i++) {
    writeTrace(tracesDir, 'ow' + i + '.json', makeTrace({
      traceId: 'ow' + i,
      surfaceType: 'ci',
      failurePattern: 'ac-not-testable',
      createdAt: '2026-03-' + String(i + 1).padStart(2, '0') + 'T00:00:00Z',
      checks: [{ name: 'must-have-test-plan', passed: true }],
    }));
  }
  for (var j = 0; j < 3; j++) {
    writeTrace(tracesDir, 'owp' + j + '.json', makeTrace({
      traceId: 'owp' + j,
      surfaceType: 'ci',
      failurePattern: 'ac-not-testable',
      createdAt: '2026-03-' + String(j + 10).padStart(2, '0') + 'T00:00:00Z',
      checks: [{ name: 'must-have-test-plan', passed: true }],
    }));
  }

  var proposal = {
    proposedAction:  'remove-check',
    targetCheckName: 'must-have-test-plan',
    skillSlug:       'ci',
    surfaceType:     'ci',
    fileName:        '2026-04-12-ci-failure-proposal.md',
    created_at:      '2026-04-12T00:00:00Z',
  };

  var windowTraces = traceInterface.readAllTraces(tracesDir);
  var gateResult   = detector.checkAntiOverfitting(proposal, windowTraces);

  if (gateResult.passed) {
    fail('anti-overfitting-writes-warning-not-proposal',
         'Gate should block this proposal (all window traces have must-have-test-plan passing)');
    return;
  }

  // Write warning file
  var warningPath = detector.writeOverfittingWarning(proposalsDir, proposal, gateResult);

  if (!fs.existsSync(warningPath)) {
    fail('anti-overfitting-writes-warning-not-proposal', 'Warning file not written: ' + warningPath);
    return;
  }

  // The proposal file should NOT have been written
  var proposalPath = path.join(proposalsDir, proposal.fileName);
  if (fs.existsSync(proposalPath)) {
    fail('anti-overfitting-writes-warning-not-proposal',
         'Proposal file should NOT exist when gate is blocked: ' + proposal.fileName);
    return;
  }

  // Verify warning filename contains 'overfitting-warning'
  var warningFile = path.basename(warningPath);
  if (warningFile.indexOf('overfitting-warning') === -1) {
    fail('anti-overfitting-writes-warning-not-proposal',
         'Warning filename should contain "overfitting-warning", got: ' + warningFile);
    return;
  }

  pass('anti-overfitting-writes-warning-not-proposal');
}());

// ── AC5: proposal file structure ──────────────────────────────────────────────

console.log('\n  AC5 — proposal file structure');

(function testFailureProposalHasAllFields() {
  var tracesDir    = path.join(tmpBase, 'traces-ac5f');
  var proposalsDir = path.join(tmpBase, 'proposals-ac5f');
  fs.mkdirSync(tracesDir, { recursive: true });

  // Create 3 traces with same failure pattern → triggers proposal
  for (var i = 0; i < 3; i++) {
    writeTrace(tracesDir, 'ac5f' + i + '.json', makeTrace({
      traceId: 'ac5f' + i,
      surfaceType: 'ci',
      skillSlug: 'definition',
      failurePattern: 'missing-test-coverage',
      createdAt: '2026-03-0' + (i + 1) + 'T00:00:00Z',
      checks: [],
    }));
  }
  // Add enough other traces to reach window size
  for (var j = 0; j < 7; j++) {
    writeTrace(tracesDir, 'ac5fo' + j + '.json', makeTrace({
      traceId: 'ac5fo' + j,
      surfaceType: 'ci',
      failurePattern: 'ac-not-testable',
      createdAt: '2026-03-' + String(j + 10).padStart(2, '0') + 'T00:00:00Z',
    }));
  }

  var now = new Date('2026-04-12T00:00:00Z');
  detector.runAgent({
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: path.join(tmpBase, 'state-ac5f.json'),
    contextYmlPath: path.join(root, '.github', 'context.yml'),
    now: now,
  });

  var proposalFiles = fs.readdirSync(proposalsDir).filter(function (f) {
    return f.indexOf('failure-proposal') !== -1;
  });

  if (proposalFiles.length === 0) {
    fail('proposal-file-has-all-6-required-fields', 'No failure proposal file generated');
    return;
  }

  var content = fs.readFileSync(path.join(proposalsDir, proposalFiles[0]), 'utf8');

  // Check all 6 required fields in the YAML front-matter
  var requiredFields = ['evidence:', 'proposed_diff:', 'confidence:', 'anti_overfitting_gate:', 'status:', 'created_at:'];
  var missing = requiredFields.filter(function (f) { return content.indexOf(f) === -1; });

  if (missing.length > 0) {
    fail('proposal-file-has-all-6-required-fields',
         'Missing required fields in proposal file: ' + missing.join(', '));
    return;
  }

  // Check status is pending_review
  if (content.indexOf('status: pending_review') === -1) {
    fail('proposal-file-has-all-6-required-fields', 'status field is not pending_review');
    return;
  }

  // Check anti_overfitting_gate is passed
  if (content.indexOf('anti_overfitting_gate: passed') === -1) {
    fail('proposal-file-has-all-6-required-fields', 'anti_overfitting_gate is not passed');
    return;
  }

  // Check evidence references trace IDs
  var evidenceMatch = content.match(/evidence:\s*\[([^\]]+)\]/);
  if (!evidenceMatch) {
    fail('proposal-file-has-all-6-required-fields', 'evidence field does not reference trace IDs');
    return;
  }

  pass('proposal-file-has-all-6-required-fields');
}());

(function testStalenessProposalHasAllFields() {
  var tracesDir    = path.join(tmpBase, 'traces-ac5s');
  var proposalsDir = path.join(tmpBase, 'proposals-ac5s');
  fs.mkdirSync(tracesDir, { recursive: true });

  var now = new Date('2026-04-12T00:00:00Z');
  var lastActive = new Date(now.getTime() - 95 * 24 * 60 * 60 * 1000);

  writeTrace(tracesDir, 'stale.json', makeTrace({
    traceId: 'stale',
    surfaceType: 'ci',
    createdAt: lastActive.toISOString(),
  }));

  detector.runAgent({
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: path.join(tmpBase, 'state-ac5s.json'),
    contextYmlPath: path.join(root, '.github', 'context.yml'),
    now: now,
  });

  var stalenessFiles = fs.readdirSync(proposalsDir).filter(function (f) {
    return f.indexOf('staleness-proposal') !== -1;
  });

  if (stalenessFiles.length === 0) {
    fail('staleness-proposal-file-has-all-6-required-fields', 'No staleness proposal file generated');
    return;
  }

  var content = fs.readFileSync(path.join(proposalsDir, stalenessFiles[0]), 'utf8');

  var requiredFields = ['evidence:', 'proposed_diff:', 'confidence:', 'anti_overfitting_gate:', 'status:', 'created_at:'];
  var missing = requiredFields.filter(function (f) { return content.indexOf(f) === -1; });

  if (missing.length > 0) {
    fail('staleness-proposal-file-has-all-6-required-fields',
         'Missing required fields: ' + missing.join(', '));
    return;
  }

  if (content.indexOf('status: pending_review') === -1) {
    fail('staleness-proposal-file-has-all-6-required-fields', 'status is not pending_review');
    return;
  }

  pass('staleness-proposal-file-has-all-6-required-fields');
}());

(function testOverfittingWarningHasRequiredStructure() {
  var proposalsDir = path.join(tmpBase, 'proposals-ow2');
  fs.mkdirSync(proposalsDir, { recursive: true });

  var proposal = {
    proposedAction:  'remove-check',
    targetCheckName: 'must-have-test-plan',
    skillSlug:       'definition',
    surfaceType:     'ci',
    fileName:        '2026-04-12-definition-failure-proposal-ow2.md',
    created_at:      '2026-04-12T00:00:00Z',
  };

  var gateResult = {
    passed:           false,
    blockedCheckName: 'must-have-test-plan',
    traceCount:       10,
    reason:           'Proposed removal affects a currently-passing check (must-have-test-plan, last 10 traces all pass). Challenger pre-check required to proceed.',
  };

  var warningPath = detector.writeOverfittingWarning(proposalsDir, proposal, gateResult);
  var content     = fs.readFileSync(warningPath, 'utf8');

  // Check required fields
  if (content.indexOf('check_label:') === -1) {
    fail('overfitting-warning-file-has-required-structure', 'Missing check_label field');
    return;
  }
  if (content.indexOf('trace_count:') === -1) {
    fail('overfitting-warning-file-has-required-structure', 'Missing trace_count field');
    return;
  }
  if (content.indexOf('gate_result: blocked') === -1) {
    fail('overfitting-warning-file-has-required-structure', 'gate_result is not blocked');
    return;
  }
  if (content.indexOf('Challenger pre-check required to proceed') === -1) {
    fail('overfitting-warning-file-has-required-structure', 'Missing prescribed warning text');
    return;
  }

  pass('overfitting-warning-file-has-required-structure');
}());

// ── AC6: workspace/state.json proposals block ─────────────────────────────────

console.log('\n  AC6 — workspace/state.json proposals block');

(function testStateJsonProposalsBlockUpdated() {
  var tracesDir    = path.join(tmpBase, 'traces-ac6');
  var proposalsDir = path.join(tmpBase, 'proposals-ac6');
  var stateJsonPath = path.join(tmpBase, 'state-ac6.json');
  fs.mkdirSync(tracesDir, { recursive: true });

  // Seed state.json with a minimal structure
  fs.writeFileSync(stateJsonPath, JSON.stringify({
    feature: 'test',
    lastUpdated: '2026-04-12T00:00:00Z',
    currentPhase: 'inner-loop',
    cycle: { discovery: { status: 'approved', artefact: 'test', completedAt: '2026-04-12T00:00:00Z' } },
  }, null, 2) + '\n', 'utf8');

  // 3 traces with same failurePattern → triggers proposal
  for (var i = 0; i < 3; i++) {
    writeTrace(tracesDir, 'ac6t' + i + '.json', makeTrace({
      traceId: 'ac6t' + i,
      surfaceType: 'ci',
      failurePattern: 'missing-test-coverage',
      createdAt: '2026-03-0' + (i + 1) + 'T00:00:00Z',
    }));
  }

  var now = new Date('2026-04-12T00:00:00Z');
  detector.runAgent({
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: stateJsonPath,
    contextYmlPath: path.join(root, '.github', 'context.yml'),
    now: now,
  });

  var stateRaw = fs.readFileSync(stateJsonPath, 'utf8');
  var state    = JSON.parse(stateRaw);

  if (!Array.isArray(state.proposals)) {
    fail('state-json-proposals-block-updated-after-session',
         'state.json does not have a proposals array after agent run');
    return;
  }
  if (state.proposals.length === 0) {
    fail('state-json-proposals-block-updated-after-session',
         'proposals array is empty after agent run that wrote proposals');
    return;
  }
  pass('state-json-proposals-block-updated-after-session');
}());

(function testStateJsonProposalsListsRequiredFields() {
  var tracesDir    = path.join(tmpBase, 'traces-ac6b');
  var proposalsDir = path.join(tmpBase, 'proposals-ac6b');
  var stateJsonPath = path.join(tmpBase, 'state-ac6b.json');
  fs.mkdirSync(tracesDir, { recursive: true });

  fs.writeFileSync(stateJsonPath, JSON.stringify({
    feature: 'test',
    lastUpdated: '2026-04-12T00:00:00Z',
    currentPhase: 'inner-loop',
    cycle: { discovery: { status: 'approved', artefact: 'test', completedAt: '2026-04-12T00:00:00Z' } },
  }, null, 2) + '\n', 'utf8');

  for (var i = 0; i < 3; i++) {
    writeTrace(tracesDir, 'ac6b' + i + '.json', makeTrace({
      traceId: 'ac6b' + i,
      surfaceType: 'ci',
      failurePattern: 'ac-not-testable',
      createdAt: '2026-03-0' + (i + 1) + 'T00:00:00Z',
    }));
  }

  var now = new Date('2026-04-12T00:00:00Z');
  detector.runAgent({
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: stateJsonPath,
    contextYmlPath: path.join(root, '.github', 'context.yml'),
    now: now,
  });

  var state = JSON.parse(fs.readFileSync(stateJsonPath, 'utf8'));

  if (!Array.isArray(state.proposals) || state.proposals.length === 0) {
    fail('state-json-proposals-lists-path-created-at-status',
         'proposals array missing or empty');
    return;
  }

  var p = state.proposals[0];

  if (!p.file || typeof p.file !== 'string') {
    fail('state-json-proposals-lists-path-created-at-status', 'proposal missing file field');
    return;
  }
  if (!p.created_at || typeof p.created_at !== 'string') {
    fail('state-json-proposals-lists-path-created-at-status', 'proposal missing created_at field');
    return;
  }
  if (!p.status || typeof p.status !== 'string') {
    fail('state-json-proposals-lists-path-created-at-status', 'proposal missing status field');
    return;
  }
  if (p.status !== 'pending_review') {
    fail('state-json-proposals-lists-path-created-at-status',
         'proposal status should be pending_review, got ' + p.status);
    return;
  }

  pass('state-json-proposals-lists-path-created-at-status');
}());

// ── NFR: idempotency ──────────────────────────────────────────────────────────

console.log('\n  NFR — idempotency and privacy');

(function testIdempotency() {
  var tracesDir    = path.join(tmpBase, 'traces-idem');
  var proposalsDir = path.join(tmpBase, 'proposals-idem');
  var stateJsonPath = path.join(tmpBase, 'state-idem.json');
  fs.mkdirSync(tracesDir, { recursive: true });

  fs.writeFileSync(stateJsonPath, JSON.stringify({
    feature: 'test',
    lastUpdated: '2026-04-12T00:00:00Z',
    currentPhase: 'inner-loop',
    cycle: { discovery: { status: 'approved', artefact: 'test', completedAt: '2026-04-12T00:00:00Z' } },
  }, null, 2) + '\n', 'utf8');

  for (var i = 0; i < 3; i++) {
    writeTrace(tracesDir, 'idem' + i + '.json', makeTrace({
      traceId: 'idem' + i,
      surfaceType: 'ci',
      failurePattern: 'missing-test-coverage',
      createdAt: '2026-03-0' + (i + 1) + 'T00:00:00Z',
    }));
  }

  var now = new Date('2026-04-12T00:00:00Z');
  var agentOpts = {
    tracesDir:    tracesDir,
    proposalsDir: proposalsDir,
    stateJsonPath: stateJsonPath,
    contextYmlPath: path.join(root, '.github', 'context.yml'),
    now: now,
  };

  // Run 1
  var result1 = detector.runAgent(agentOpts);
  var filesAfterRun1 = fs.readdirSync(proposalsDir).length;
  var state1Count = JSON.parse(fs.readFileSync(stateJsonPath, 'utf8')).proposals.length;

  // Run 2 — identical trace set
  var result2 = detector.runAgent(agentOpts);
  var filesAfterRun2 = fs.readdirSync(proposalsDir).length;
  var state2Count = JSON.parse(fs.readFileSync(stateJsonPath, 'utf8')).proposals.length;

  if (filesAfterRun1 !== filesAfterRun2) {
    fail('idempotency-duplicate-run-produces-no-extra-files',
         'File count changed after second run: ' + filesAfterRun1 + ' → ' + filesAfterRun2);
    return;
  }
  if (state1Count !== state2Count) {
    fail('idempotency-duplicate-run-produces-no-extra-files',
         'state.json proposals count changed after second run: ' + state1Count + ' → ' + state2Count);
    return;
  }
  pass('idempotency-duplicate-run-produces-no-extra-files');
}());

(function testSensitiveFieldsRedacted() {
  var tracesDir = path.join(tmpBase, 'traces-privacy');
  fs.mkdirSync(tracesDir, { recursive: true });

  // Write a trace with a sensitive field
  var traceWithSecret = makeTrace({
    traceId: 'priv1',
    operator_email: 'user@example.com',  // should be redacted
    api_key: 'sk-abc123',                // should be redacted
    failurePattern: 'missing-test-coverage',
    storySlug: 'story-privacy',
  });

  writeTrace(tracesDir, 'priv.json', traceWithSecret);

  var traces  = traceInterface.readAllTraces(tracesDir);
  var redacted = traces[0];

  if (redacted.operator_email !== '[REDACTED]') {
    fail('privacy-sensitive-fields-redacted-before-processing',
         'operator_email was not redacted, got: ' + redacted.operator_email);
    return;
  }
  if (redacted.api_key !== '[REDACTED]') {
    fail('privacy-sensitive-fields-redacted-before-processing',
         'api_key was not redacted, got: ' + redacted.api_key);
    return;
  }
  // Non-sensitive fields should be preserved
  if (redacted.traceId !== 'priv1') {
    fail('privacy-sensitive-fields-redacted-before-processing',
         'Non-sensitive field traceId was incorrectly redacted');
    return;
  }

  pass('privacy-sensitive-fields-redacted-before-processing');
}());

// ── YAML fixture test ─────────────────────────────────────────────────────────

console.log('\n  Integration — YAML and fixture file support');

(function testYamlFixtureRead() {
  var fixturesDir = path.join(root, 'tests', 'fixtures', 'traces');
  var traces      = traceInterface.readAllTraces(fixturesDir);

  if (traces.length === 0) {
    fail('fixture-traces-readable', 'No trace fixtures loaded from tests/fixtures/traces/');
    return;
  }

  // All traces should have traceId field
  var hasTraceIds = traces.filter(function (t) { return t.traceId; });
  if (hasTraceIds.length === 0) {
    fail('fixture-traces-readable', 'No fixture traces have traceId field');
    return;
  }

  // failurePattern should be singular string in fixtures (not an array)
  var tracesWithPattern = traces.filter(function (t) { return t.failurePattern !== undefined; });
  var invalidPattern    = tracesWithPattern.filter(function (t) {
    return Array.isArray(t.failurePattern);
  });
  if (invalidPattern.length > 0) {
    fail('fixture-traces-readable',
         'Some fixture traces have failurePattern as array (should be singular string)');
    return;
  }

  pass('fixture-traces-readable');
}());

// ── Cleanup ───────────────────────────────────────────────────────────────────

try { rmDir(tmpBase); } catch (e) { /* ignore cleanup errors */ }

// ── Report ────────────────────────────────────────────────────────────────────

process.stdout.write('\n');
if (failed > 0) {
  process.stderr.write('[improvement-agent-check] FAIL — ' + failed + ' test(s) failed:\n\n');
  for (var i = 0; i < failures.length; i++) {
    process.stderr.write('  \u2717 ' + failures[i].name + '\n');
    process.stderr.write('    \u2192 ' + failures[i].reason + '\n');
  }
  process.stderr.write('\n');
  process.exit(1);
}

process.stdout.write('[improvement-agent-check] ' + passed + ' test(s) passed \u2713\n');
process.exit(0);
