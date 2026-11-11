'use strict';
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

let passed = 0;
let failed = 0;
const failures = [];

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    failures.push({ name, err });
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

function tempLogPath() {
  return path.join(os.tmpdir(), 'ilce-s1-timings-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.jsonl');
}

test('appendTimingRecord writes a well-formed record with required fields', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'implementation-plan', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'implementation-plan' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  const record = JSON.parse(lines[lines.length - 1]);
  assert.strictEqual(record.skill, 'implementation-plan');
  assert.strictEqual(record.featureSlug, 'test-feat');
  assert.strictEqual(record.storySlug, 'test-s1');
  assert.strictEqual(record.stage, 'implementation-plan');
  assert.ok(typeof record.timestamp === 'string' && !isNaN(Date.parse(record.timestamp)), 'timestamp must be a valid ISO 8601 string');
  fs.unlinkSync(logPath);
});

test('appendTimingRecord creates the log file fresh when it does not exist', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  assert.ok(!fs.existsSync(logPath), 'precondition: file must not exist yet');
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, logPath);
  assert.ok(fs.existsSync(logPath));
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 1);
  assert.doesNotThrow(() => JSON.parse(lines[0]));
  fs.unlinkSync(logPath);
});

test('appendTimingRecord computes durationMs from startedAt and timestamp', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  const startedAt = '2026-11-11T10:00:00.000Z';
  const timestamp = '2026-11-11T10:05:30.000Z';
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup', startedAt, timestamp }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(lines[0].startedAt, startedAt, 'startedAt must be persisted as given');
  assert.strictEqual(lines[0].timestamp, timestamp, 'an explicitly passed timestamp must not be overwritten by the default');
  assert.strictEqual(lines[0].durationMs, 330000, 'durationMs must be the millisecond difference between timestamp and startedAt');
  fs.unlinkSync(logPath);
});

test('appendTimingRecord omits durationMs when startedAt is not provided', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.ok(!('startedAt' in lines[0]), 'no startedAt field when not provided');
  assert.ok(!('durationMs' in lines[0]), 'no durationMs when startedAt was never provided');
  fs.unlinkSync(logPath);
});

test('appendTimingRecord omits durationMs when startedAt is unparseable, without throwing', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  assert.doesNotThrow(() => {
    appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup', startedAt: 'not-a-real-timestamp' }, logPath);
  });
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(lines[0].startedAt, 'not-a-real-timestamp', 'the raw startedAt value is still persisted even if unparseable');
  assert.ok(!('durationMs' in lines[0]), 'an unparseable startedAt must not produce a durationMs value');
  fs.unlinkSync(logPath);
});

test('appendTimingRecord omits durationMs when startedAt is after timestamp (clock skew), without producing a negative value', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup', startedAt: future }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.ok(!('durationMs' in lines[0]), 'a startedAt later than timestamp must not produce a negative or nonsensical durationMs');
  fs.unlinkSync(logPath);
});

test('appendTimingRecord includes dispatchCount only when provided, for any stage', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'subagent-execution', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'subagent-execution', dispatchCount: 3 }, logPath);
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(lines[0].dispatchCount, 3);
  assert.ok(!('dispatchCount' in lines[1]), 'a record with no dispatchCount passed in must not contain the field');
  fs.unlinkSync(logPath);
});

test('appendTimingRecord includes fullSuite only when provided', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'verify-completion', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'verify-completion', fullSuite: true }, logPath);
  appendTimingRecord({ skill: 'verify-completion', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'verify-completion', fullSuite: false }, logPath);
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(lines[0].fullSuite, true);
  assert.strictEqual(lines[1].fullSuite, false);
  assert.ok(!('fullSuite' in lines[2]), 'a record with no fullSuite passed in must not contain the field');
  fs.unlinkSync(logPath);
});

test('appendTimingRecord includes skipped only when provided', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'branch-complete', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-complete', skipped: true }, logPath);
  appendTimingRecord({ skill: 'branch-complete', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-complete', skipped: false }, logPath);
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n').map(JSON.parse);
  assert.strictEqual(lines[0].skipped, true);
  assert.strictEqual(lines[1].skipped, false);
  assert.ok(!('skipped' in lines[2]), 'a record with no skipped passed in must not contain the field');
  fs.unlinkSync(logPath);
});

test('validateRecord rejects a record missing a required field', () => {
  const { validateRecord } = require('../scripts/lib/pipeline-timings');
  const result = validateRecord({ skill: 'branch-setup', featureSlug: 'test-feat', stage: 'branch-setup', timestamp: new Date().toISOString() });
  assert.strictEqual(result.valid, false);
  assert.ok(/storySlug/.test(result.reason), 'reason must name the missing field');
});

test('validateRecord accepts a well-formed record', () => {
  const { validateRecord } = require('../scripts/lib/pipeline-timings');
  const result = validateRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup', timestamp: new Date().toISOString() });
  assert.strictEqual(result.valid, true);
});

test('appendTimingRecord does not throw when the underlying write fails', () => {
  const pipelineTimings = require('../scripts/lib/pipeline-timings');
  const originalAppend = fs.appendFileSync;
  fs.appendFileSync = () => { throw new Error('simulated disk failure'); };
  let threw = false;
  let result;
  try {
    result = pipelineTimings.appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'test-s1', stage: 'branch-setup' }, tempLogPath());
  } catch (e) {
    threw = true;
  } finally {
    fs.appendFileSync = originalAppend;
  }
  assert.strictEqual(threw, false, 'appendTimingRecord must not throw on write failure');
  assert.strictEqual(result, false, 'appendTimingRecord must return false on write failure, not throw');
});

test('multiple sequential appendTimingRecord calls each produce a separate, valid JSON line', () => {
  const { appendTimingRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'test-feat', storySlug: 'existing', stage: 'branch-setup' }, logPath);
  appendTimingRecord({ skill: 'implementation-plan', featureSlug: 'test-feat', storySlug: 'concurrent-a', stage: 'implementation-plan' }, logPath);
  appendTimingRecord({ skill: 'implementation-plan', featureSlug: 'test-feat', storySlug: 'concurrent-b', stage: 'implementation-plan' }, logPath);
  const lines = fs.readFileSync(logPath, 'utf8').trim().split('\n');
  assert.strictEqual(lines.length, 3, 'all 3 appends must be present as 3 separate lines');
  lines.forEach(line => assert.doesNotThrow(() => JSON.parse(line), 'every line must parse as valid JSON, none interleaved or truncated'));
  fs.unlinkSync(logPath);
});

test('branch-setup, implementation-plan, verify-completion, and branch-complete SKILL.md files reference pipeline-timings', () => {
  const skillFiles = [
    'skills/branch-setup/SKILL.md',
    'skills/implementation-plan/SKILL.md',
    'skills/verify-completion/SKILL.md',
    'skills/branch-complete/SKILL.md',
  ];
  skillFiles.forEach(relPath => {
    const content = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
    const stateUpdateIndex = content.indexOf('## State update');
    const timingsRefIndex = content.indexOf('pipeline-timings.jsonl');
    assert.ok(stateUpdateIndex !== -1, relPath + ' must have a "## State update" heading');
    assert.ok(timingsRefIndex !== -1, relPath + ' must reference pipeline-timings.jsonl');
    assert.ok(timingsRefIndex > stateUpdateIndex, relPath + ' must reference pipeline-timings.jsonl after its "## State update" heading, not merely somewhere in the file');
  });
});

test('outer-loop SKILL.md files (discovery through trace, plus ideate) reference pipeline-timings after their State update heading', () => {
  // fsae-2 (2026-11-11): closes the gap found during the framework-scaling
  // ideation's stand-back re-assessment -- appendTimingRecord was documented
  // as mandatory in only 5 of ~50 skills, all inner-loop, so
  // .github/pipeline-timings.jsonl had never recorded a single line despite
  // dozens of qualifying invocations across this repo's history. This covers
  // the core outer-loop pipeline stages named in CLAUDE.md's pipeline table
  // (steps 1-6.5, 8, 9) plus /ideate, which precedes /discovery. /design is
  // deliberately excluded -- it has no "## State update" section at all, so
  // bolting on a timing write with no surrounding state-bookkeeping would be
  // inconsistent with every other instrumented skill.
  const skillFiles = [
    'skills/discovery/SKILL.md',
    'skills/benefit-metric/SKILL.md',
    'skills/definition/SKILL.md',
    'skills/review/SKILL.md',
    'skills/test-plan/SKILL.md',
    'skills/definition-of-ready/SKILL.md',
    'skills/decisions/SKILL.md',
    'skills/definition-of-done/SKILL.md',
    'skills/trace/SKILL.md',
    'skills/ideate/SKILL.md',
  ];
  skillFiles.forEach(relPath => {
    const content = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
    const stateUpdateIndex = content.indexOf('## State update');
    const timingsRefIndex = content.indexOf('pipeline-timings.jsonl');
    assert.ok(stateUpdateIndex !== -1, relPath + ' must have a "## State update" heading');
    assert.ok(timingsRefIndex !== -1, relPath + ' must reference pipeline-timings.jsonl');
    assert.ok(timingsRefIndex > stateUpdateIndex, relPath + ' must reference pipeline-timings.jsonl after its "## State update" heading, not merely somewhere in the file');
  });
});

test('all 15 timing-instrumented skills reference startedAt after their State update heading', () => {
  // fsae-3 (2026-11-11): companion to durationMs support in appendTimingRecord
  // -- a skill that never captures startedAt can never produce a duration,
  // so this is the other half of actually closing the duration gap, not
  // just making the library capable of it.
  const skillFiles = [
    'skills/branch-setup/SKILL.md',
    'skills/implementation-plan/SKILL.md',
    'skills/subagent-execution/SKILL.md',
    'skills/verify-completion/SKILL.md',
    'skills/branch-complete/SKILL.md',
    'skills/discovery/SKILL.md',
    'skills/benefit-metric/SKILL.md',
    'skills/definition/SKILL.md',
    'skills/review/SKILL.md',
    'skills/test-plan/SKILL.md',
    'skills/definition-of-ready/SKILL.md',
    'skills/decisions/SKILL.md',
    'skills/definition-of-done/SKILL.md',
    'skills/trace/SKILL.md',
    'skills/ideate/SKILL.md',
  ];
  skillFiles.forEach(relPath => {
    const content = fs.readFileSync(path.join(__dirname, '..', relPath), 'utf8');
    const stateUpdateIndex = content.indexOf('## State update');
    assert.ok(stateUpdateIndex !== -1, relPath + ' must have a "## State update" heading');
    const appendCallIndex = content.indexOf('appendTimingRecord', stateUpdateIndex);
    assert.ok(content.includes('startedAt'), relPath + ' must reference startedAt (either as an early per-run/per-task/per-story capture instruction, or in its appendTimingRecord call)');
    assert.ok(appendCallIndex !== -1 && content.slice(appendCallIndex, appendCallIndex + 200).includes('startedAt'), relPath + "'s appendTimingRecord call within its State update section must include startedAt in its argument object");
  });
});

test('getMostRecentRecord returns the most recent of several matching records by timestamp', () => {
  const { appendTimingRecord, getMostRecentRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  const fixedAppend = (record, ts, lp) => {
    fs.appendFileSync(lp, JSON.stringify(Object.assign({}, record, { timestamp: ts })) + '\n', 'utf8');
  };
  fixedAppend({ skill: 'verify-completion', featureSlug: 'ilce', storySlug: 'ilce-s2', stage: 'verify-completion' }, '2026-11-04T00:00:00.000Z', logPath);
  fixedAppend({ skill: 'verify-completion', featureSlug: 'ilce', storySlug: 'ilce-s2', stage: 'verify-completion' }, '2026-11-05T00:00:00.000Z', logPath);
  fixedAppend({ skill: 'verify-completion', featureSlug: 'ilce', storySlug: 'ilce-s2', stage: 'verify-completion' }, '2026-11-03T00:00:00.000Z', logPath);
  const record = getMostRecentRecord({ storySlug: 'ilce-s2', stage: 'verify-completion' }, logPath);
  assert.ok(record, 'expected a matching record');
  assert.strictEqual(record.timestamp, '2026-11-05T00:00:00.000Z');
  fs.unlinkSync(logPath);
});

test('getMostRecentRecord returns null when no record matches the filter', () => {
  const { appendTimingRecord, getMostRecentRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'branch-setup', featureSlug: 'ilce', storySlug: 'ilce-s2', stage: 'branch-setup' }, logPath);
  const record = getMostRecentRecord({ storySlug: 'ilce-s2', stage: 'verify-completion' }, logPath);
  assert.strictEqual(record, null);
  fs.unlinkSync(logPath);
});

test('getMostRecentRecord returns null when the log file does not exist at all', () => {
  const { getMostRecentRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  assert.ok(!fs.existsSync(logPath), 'precondition: file must not exist yet');
  const record = getMostRecentRecord({ storySlug: 'ilce-s2', stage: 'verify-completion' }, logPath);
  assert.strictEqual(record, null);
});

test('getMostRecentRecord skips a malformed/unparseable line without throwing and still finds the correct record', () => {
  const { appendTimingRecord, getMostRecentRecord } = require('../scripts/lib/pipeline-timings');
  const logPath = tempLogPath();
  appendTimingRecord({ skill: 'verify-completion', featureSlug: 'ilce', storySlug: 'ilce-s2', stage: 'verify-completion' }, logPath);
  fs.appendFileSync(logPath, 'this is not valid json {{{\n', 'utf8');
  let record;
  assert.doesNotThrow(() => {
    record = getMostRecentRecord({ storySlug: 'ilce-s2', stage: 'verify-completion' }, logPath);
  });
  assert.ok(record, 'expected the valid record to still be found');
  assert.strictEqual(record.storySlug, 'ilce-s2');
  fs.unlinkSync(logPath);
});

test('subagent-execution SKILL.md references pipeline-timings and dispatchCount', () => {
  const content = fs.readFileSync(path.join(__dirname, '..', 'skills/subagent-execution/SKILL.md'), 'utf8');
  const stateUpdateIndex = content.indexOf('## State update');
  const timingsRefIndex = content.indexOf('pipeline-timings.jsonl');
  const dispatchCountIndex = content.indexOf('dispatchCount');
  assert.ok(stateUpdateIndex !== -1, 'must have a "## State update" heading');
  assert.ok(timingsRefIndex !== -1, 'must reference pipeline-timings.jsonl');
  assert.ok(content.includes('dispatchCount'), 'must reference dispatchCount specifically');
  assert.ok(timingsRefIndex > stateUpdateIndex, 'must reference pipeline-timings.jsonl after its "## State update" heading, not merely somewhere in the file');
  assert.ok(dispatchCountIndex > stateUpdateIndex, 'must reference dispatchCount after its "## State update" heading, not merely somewhere in the file');
});

console.log('\n── Summary ──');
console.log(`  Passed: ${passed}`);
console.log(`  Failed: ${failed}`);
if (failures.length > 0) {
  console.log('\nFailures:');
  failures.forEach(({ name, err }) => {
    console.log(`  ✗ ${name}`);
    console.log(`      ${err.message}`);
  });
}
if (failed > 0) {
  process.exit(1);
}
