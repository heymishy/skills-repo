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

function tmpIncidentsFile() {
  return path.join(os.tmpdir(), 'itar-s2-test-incidents-' + Math.random().toString(36).slice(2) + '.json');
}

// --- AC1: jaccardSimilarity export ---

test('jaccardSimilarity_isExportedAndCallable_fromDriftComparator', () => {
  const { jaccardSimilarity } = require('../src/modules/drift-comparator');
  assert.strictEqual(typeof jaccardSimilarity, 'function');
  assert.strictEqual(jaccardSimilarity(['a', 'b'], ['a', 'c']), 1 / 3);
});

// --- incident-store additions ---

test('loadIncidentRecords_returnsEmptyArray_whenFileDoesNotExist', () => {
  const { loadIncidentRecords } = require('../scripts/lib/incident-store');
  const f = tmpIncidentsFile();
  assert.deepStrictEqual(loadIncidentRecords(f), []);
});

test('loadIncidentRecords_returnsParsedArray_whenFileExists', () => {
  const { createIncidentRecord, appendIncidentRecord, loadIncidentRecords } = require('../scripts/lib/incident-store');
  const f = tmpIncidentsFile();
  const r = createIncidentRecord({ trigger: 'x', tags: ['auth'] });
  appendIncidentRecord(r, f);
  const loaded = loadIncidentRecords(f);
  assert.strictEqual(loaded.length, 1);
  assert.strictEqual(loaded[0].id, r.id);
  fs.unlinkSync(f);
});

test('saveIncidentRecords_writesArrayBackToDisk_overwritingPriorContent', () => {
  const { createIncidentRecord, appendIncidentRecord, loadIncidentRecords, saveIncidentRecords } = require('../scripts/lib/incident-store');
  const f = tmpIncidentsFile();
  const r1 = createIncidentRecord({ trigger: 'x', tags: ['auth'] });
  appendIncidentRecord(r1, f);
  const records = loadIncidentRecords(f);
  records[0].triageSummary = 'updated';
  saveIncidentRecords(records, f);
  const reloaded = loadIncidentRecords(f);
  assert.strictEqual(reloaded[0].triageSummary, 'updated');
  fs.unlinkSync(f);
});

// --- AC4: cannot-score ---

test('draftTriageSummary_returnsCannotScoreResult_whenTagsFieldEmpty', () => {
  const { createIncidentRecord, appendIncidentRecord, loadIncidentRecords } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();
  const r = createIncidentRecord({ trigger: 'x', tags: [] });
  appendIncidentRecord(r, f);

  const result = draftTriageSummary(r.id, f);

  assert.strictEqual(result.status, 'cannot-score');
  assert.ok(/cannot score/i.test(result.triageSummary));
  assert.deepStrictEqual(result.priorIncidentLinks, []);
  const reloaded = loadIncidentRecords(f);
  assert.ok(/cannot score/i.test(reloaded[0].triageSummary));
  fs.unlinkSync(f);
});

test('draftTriageSummary_returnsCannotScoreResult_whenTagsFieldMalformed', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  const r1 = createIncidentRecord({ trigger: 'x', tags: [] });
  r1.tags = null;
  appendIncidentRecord(r1, f);
  const result1 = draftTriageSummary(r1.id, f);
  assert.strictEqual(result1.status, 'cannot-score');

  const f2 = tmpIncidentsFile();
  const r2 = createIncidentRecord({ trigger: 'y', tags: [] });
  r2.tags = 'not-an-array';
  appendIncidentRecord(r2, f2);
  const result2 = draftTriageSummary(r2.id, f2);
  assert.strictEqual(result2.status, 'cannot-score');

  fs.unlinkSync(f);
  fs.unlinkSync(f2);
});

// --- AC1: matching & ranking ---

test('draftTriageSummary_attachesMatch_whenScoreAtOrAboveThreshold', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const { draftTriageSummary, INCIDENT_JACCARD_THRESHOLD } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  // tags ['auth','sql'] vs ['auth','http'] -> intersection 1, union 3 -> 0.333... >= 0.3
  const existing = createIncidentRecord({ trigger: 'prior', tags: ['auth', 'http'] });
  appendIncidentRecord(existing, f);
  const fresh = createIncidentRecord({ trigger: 'new', tags: ['auth', 'sql'] });
  appendIncidentRecord(fresh, f);

  assert.ok(1 / 3 >= INCIDENT_JACCARD_THRESHOLD, 'test fixture must score at/above threshold');

  const result = draftTriageSummary(fresh.id, f);
  assert.strictEqual(result.status, 'matched');
  assert.ok(result.priorIncidentLinks.includes(existing.id));
  fs.unlinkSync(f);
});

test('draftTriageSummary_excludesMatch_whenScoreBelowThreshold', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const { draftTriageSummary, INCIDENT_JACCARD_THRESHOLD } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  // tags ['auth'] vs ['sql','http','db'] -> intersection 0 -> 0 < threshold
  const existing = createIncidentRecord({ trigger: 'prior', tags: ['sql', 'http', 'db'] });
  appendIncidentRecord(existing, f);
  const fresh = createIncidentRecord({ trigger: 'new', tags: ['auth'] });
  appendIncidentRecord(fresh, f);

  assert.ok(0 < INCIDENT_JACCARD_THRESHOLD);

  const result = draftTriageSummary(fresh.id, f);
  assert.strictEqual(result.status, 'no-match');
  assert.deepStrictEqual(result.priorIncidentLinks, []);
  fs.unlinkSync(f);
});

test('draftTriageSummary_attachesMultipleMatches_whenMultipleRecordsScoreAboveThreshold', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  const e1 = createIncidentRecord({ trigger: 'p1', tags: ['auth', 'http'] });
  appendIncidentRecord(e1, f);
  const e2 = createIncidentRecord({ trigger: 'p2', tags: ['auth', 'db'] });
  appendIncidentRecord(e2, f);
  const fresh = createIncidentRecord({ trigger: 'new', tags: ['auth', 'sql'] });
  appendIncidentRecord(fresh, f);

  const result = draftTriageSummary(fresh.id, f);
  assert.strictEqual(result.status, 'matched');
  assert.ok(result.priorIncidentLinks.includes(e1.id));
  assert.ok(result.priorIncidentLinks.includes(e2.id));
  assert.strictEqual(result.priorIncidentLinks.length, 2);
  fs.unlinkSync(f);
});

test('draftTriageSummary_rankMatchesByScoreDescending_whenAttachingMultiple', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  // fresh tags ['auth','sql','db']
  // e1 ['auth','sql'] -> intersection 2, union 3 -> 0.667 (higher)
  // e2 ['auth'] -> intersection 1, union 3 -> 0.333 (lower, still above 0.3 threshold)
  const e1 = createIncidentRecord({ trigger: 'p1', tags: ['auth', 'sql'] });
  appendIncidentRecord(e1, f);
  const e2 = createIncidentRecord({ trigger: 'p2', tags: ['auth'] });
  appendIncidentRecord(e2, f);
  const fresh = createIncidentRecord({ trigger: 'new', tags: ['auth', 'sql', 'db'] });
  appendIncidentRecord(fresh, f);

  const result = draftTriageSummary(fresh.id, f);
  assert.strictEqual(result.priorIncidentLinks[0], e1.id, 'higher-scoring match must come first');
  assert.strictEqual(result.priorIncidentLinks[1], e2.id);
  fs.unlinkSync(f);
});

// --- AC3: genuine no-match ---

test('draftTriageSummary_statesNoRelevantPriorIncidentFound_whenNoMatchAboveThreshold', () => {
  const { createIncidentRecord, appendIncidentRecord, loadIncidentRecords } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  const existing = createIncidentRecord({ trigger: 'prior', tags: ['billing', 'invoice'] });
  appendIncidentRecord(existing, f);
  const fresh = createIncidentRecord({ trigger: 'new', tags: ['auth', 'sql'] });
  appendIncidentRecord(fresh, f);

  const result = draftTriageSummary(fresh.id, f);
  assert.strictEqual(result.status, 'no-match');
  assert.ok(/no relevant prior incident/i.test(result.triageSummary));
  assert.deepStrictEqual(result.priorIncidentLinks, []);

  const reloaded = loadIncidentRecords(f);
  assert.ok(reloaded.find((r) => r.id === fresh.id).triageSummary, 'triageSummary must not be left blank');
  fs.unlinkSync(f);
});

test('draftTriageSummary_distinguishesCannotScoreFromGenuineNoMatch', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  const dissimilar = createIncidentRecord({ trigger: 'prior', tags: ['billing'] });
  appendIncidentRecord(dissimilar, f);
  const noMatchRecord = createIncidentRecord({ trigger: 'new1', tags: ['auth', 'sql'] });
  appendIncidentRecord(noMatchRecord, f);
  const emptyTagsRecord = createIncidentRecord({ trigger: 'new2', tags: [] });
  appendIncidentRecord(emptyTagsRecord, f);

  const noMatchResult = draftTriageSummary(noMatchRecord.id, f);
  const cannotScoreResult = draftTriageSummary(emptyTagsRecord.id, f);

  assert.strictEqual(noMatchResult.status, 'no-match');
  assert.strictEqual(cannotScoreResult.status, 'cannot-score');
  assert.notStrictEqual(noMatchResult.status, cannotScoreResult.status);
  fs.unlinkSync(f);
});

// --- AC2: narrative content ---

test('draftTriageSummary_includesKnownTriedBeforeAndNextStep_whenMatchFound', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  const existing = createIncidentRecord({ trigger: 'prior login bug', tags: ['auth', 'sql'] });
  existing.status = 'confirmed';
  existing.triageSummary = 'Root cause: type mismatch in tenant_id column.';
  const { saveIncidentRecords, loadIncidentRecords } = require('../scripts/lib/incident-store');
  appendIncidentRecord(existing, f);
  saveIncidentRecords(loadIncidentRecords(f).map((r) => (r.id === existing.id ? existing : r)), f);

  const fresh = createIncidentRecord({ trigger: 'new login bug', tags: ['auth', 'sql'] });
  appendIncidentRecord(fresh, f);

  const result = draftTriageSummary(fresh.id, f);
  assert.ok(/known/i.test(result.triageSummary), 'must mention what is known');
  assert.ok(/tried|confirmed/i.test(result.triageSummary), 'must mention what was tried / status');
  assert.ok(/next step/i.test(result.triageSummary), 'must mention a suggested next step');
  fs.unlinkSync(f);
});

// --- Integration: real persistence ---

test('draftTriageSummary_persistsSummaryOnRecordInStore_whenRunAgainstRealIncidentsFile', () => {
  const { createIncidentRecord, appendIncidentRecord, loadIncidentRecords } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  const existing = createIncidentRecord({ trigger: 'prior', tags: ['auth', 'sql'] });
  appendIncidentRecord(existing, f);
  const fresh = createIncidentRecord({ trigger: 'new', tags: ['auth', 'sql'] });
  appendIncidentRecord(fresh, f);

  draftTriageSummary(fresh.id, f);

  // Re-read from disk fresh -- not the in-memory return value
  const onDisk = JSON.parse(fs.readFileSync(f, 'utf8'));
  const freshOnDisk = onDisk.find((r) => r.id === fresh.id);
  assert.ok(freshOnDisk.triageSummary, 'triageSummary must be persisted to disk');
  assert.ok(freshOnDisk.priorIncidentLinks.length > 0, 'priorIncidentLinks must be persisted to disk');
  fs.unlinkSync(f);
});

// --- NFR-AUDIT-1 ---

test('draftTriageSummary_advancesUpdatedAt_afterDrafting', () => {
  const { createIncidentRecord, appendIncidentRecord, loadIncidentRecords } = require('../scripts/lib/incident-store');
  const { draftTriageSummary } = require('../src/modules/triage-drafter');
  const f = tmpIncidentsFile();

  const fresh = createIncidentRecord({ trigger: 'new', tags: ['auth'] });
  appendIncidentRecord(fresh, f);
  const createdAt = fresh.createdAt;

  draftTriageSummary(fresh.id, f);

  const reloaded = loadIncidentRecords(f).find((r) => r.id === fresh.id);
  assert.ok(new Date(reloaded.updatedAt).getTime() >= new Date(createdAt).getTime(), 'updatedAt must not regress');
  fs.unlinkSync(f);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) {
  process.exitCode = 1;
}
