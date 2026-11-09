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

// --- AC1: record shape ---

test('createIncidentRecord_generatesUniqueId_whenCalled', () => {
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const a = createIncidentRecord({ trigger: 'login attempt', tags: ['auth'] });
  const b = createIncidentRecord({ trigger: 'login attempt', tags: ['auth'] });
  assert.ok(a.id, 'id must be non-empty');
  assert.ok(b.id, 'id must be non-empty');
  assert.notStrictEqual(a.id, b.id, 'two created records must have different ids');
});

test('createIncidentRecord_setsStatusOpenAndEmptyPriorLinks_byDefault', () => {
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const r = createIncidentRecord({ trigger: 'login attempt', tags: ['auth'] });
  assert.strictEqual(r.status, 'open');
  assert.ok(Array.isArray(r.priorIncidentLinks));
  assert.strictEqual(r.priorIncidentLinks.length, 0);
});

test('createIncidentRecord_capturesTriggerFreeText_verbatim', () => {
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const triggerText = 'SQL type-inference error on tenant bootstrap';
  const r = createIncidentRecord({ trigger: triggerText, tags: ['auth'] });
  assert.strictEqual(r.trigger, triggerText);
});

test('createIncidentRecord_rejectsTagsOverBoundedLength_whenSummaryExceedsLimit', () => {
  const { createIncidentRecord, MAX_TAG_FIELD_LENGTH, IncidentTagFieldTooLongError } = require('../scripts/lib/incident-store');
  const overLong = 'a'.repeat(MAX_TAG_FIELD_LENGTH + 1);
  assert.throws(
    () => createIncidentRecord({ trigger: 'x', tags: [overLong] }),
    IncidentTagFieldTooLongError
  );
});

test('normalizeIncidentTags_trimsWhitespaceAndLowercases_beforeStorage', () => {
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const r = createIncidentRecord({ trigger: 'x', tags: [' Auth ', 'SQL-Error'] });
  assert.deepStrictEqual(r.tags, ['auth', 'sql-error']);
});

// --- AC2: append-only persistence ---

test('appendIncidentRecord_addsToFile_withoutTruncatingExistingRecords', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const tmpFile = path.join(os.tmpdir(), `itar-s1-incidents-${Date.now()}-a.json`);
  const existing = createIncidentRecord({ trigger: 'first', tags: ['one'] });
  fs.writeFileSync(tmpFile, JSON.stringify([existing], null, 2));

  const newRecord = createIncidentRecord({ trigger: 'second', tags: ['two'] });
  const result = appendIncidentRecord(newRecord, tmpFile);

  assert.strictEqual(result.length, 2);
  const onDisk = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
  assert.strictEqual(onDisk.length, 2);
  assert.deepStrictEqual(onDisk[0], existing, 'original record must be byte-for-byte unchanged');

  fs.unlinkSync(tmpFile);
});

test('appendIncidentRecord_createsFile_whenIncidentsJsonDoesNotExistYet', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  const tmpFile = path.join(os.tmpdir(), `itar-s1-incidents-${Date.now()}-b.json`);
  assert.ok(!fs.existsSync(tmpFile), 'fixture file must not exist before this test');

  const record = createIncidentRecord({ trigger: 'only', tags: ['first-ever'] });
  const result = appendIncidentRecord(record, tmpFile);

  assert.strictEqual(result.length, 1);
  assert.ok(fs.existsSync(tmpFile));
  const onDisk = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
  assert.strictEqual(onDisk.length, 1);

  fs.unlinkSync(tmpFile);
});

// --- AC4: real-fixture migration proof ---

test('migrateProductionErrorInvestigation_createsRealRecord_fromCaptureLogFinding', () => {
  const { createIncidentRecord, appendIncidentRecord } = require('../scripts/lib/incident-store');
  // Real fixture, transcribed from workspace/capture-log.md's 2026-10-07 productionErrorInvestigation entry.
  const realFixture = {
    trigger: "[auth] tenant_admin_bootstrap_failed -- reason: 'inconsistent types deduced for parameter $1' for tenantId heymishy",
    tags: ['auth', 'tenant-admin-bootstrap', 'sql-type-inference'],
  };

  const record = createIncidentRecord(realFixture);
  const tmpFile = path.join(os.tmpdir(), `itar-s1-incidents-${Date.now()}-ac4.json`);
  appendIncidentRecord(record, tmpFile);

  assert.strictEqual(record.status, 'open');
  assert.deepStrictEqual(record.tags, ['auth', 'tenant-admin-bootstrap', 'sql-type-inference']);
  assert.strictEqual(record.trigger, realFixture.trigger);

  const onDisk = JSON.parse(fs.readFileSync(tmpFile, 'utf8'));
  assert.strictEqual(onDisk.length, 1);
  assert.strictEqual(onDisk[0].trigger, realFixture.trigger);

  fs.unlinkSync(tmpFile);
});

// --- NFR-AUDIT-1 ---

test('NFR_AUDIT_1_createdAtAndUpdatedAt_setAndEqualAtCreation', () => {
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const r = createIncidentRecord({ trigger: 'x', tags: ['y'] });
  assert.ok(r.createdAt, 'createdAt must be present');
  assert.ok(r.updatedAt, 'updatedAt must be present');
  assert.strictEqual(r.createdAt, r.updatedAt, 'createdAt and updatedAt must be equal at creation time');
  assert.ok(!isNaN(Date.parse(r.createdAt)), 'createdAt must be ISO 8601 parseable');
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
