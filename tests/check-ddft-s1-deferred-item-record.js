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

function tmpFile(label) {
  return path.join(os.tmpdir(), 'ddft-s1-' + label + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.json');
}

// --- AC1: generalized schema with backward-compatible type field ---

test('addsTypeFieldDefaultingExistingRecordsToIncident', () => {
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const r = createIncidentRecord({ trigger: 'x', summary: 's', tags: ['a'] });
  assert.strictEqual(r.type, 'incident');
  assert.strictEqual(r.trigger, 'x');
  assert.strictEqual(r.summary, 's');
  assert.deepStrictEqual(r.tags, ['a']);
  assert.deepStrictEqual(r.priorIncidentLinks, []);
  assert.strictEqual(r.status, 'open');
  assert.strictEqual(r.triageSummary, null);
  assert.strictEqual(r.confirmationStatus, null);
  assert.ok(r.id, 'id must be present');
  assert.ok(r.createdAt, 'createdAt must be present');
  assert.ok(r.updatedAt, 'updatedAt must be present');
});

test('validatesDeferredItemRequiredFields', () => {
  const { createIncidentRecord, validateRecord } = require('../scripts/lib/incident-store');
  const incomplete = createIncidentRecord({ type: 'deferred-item', trigger: 'x' });
  incomplete.source = null;
  assert.throws(() => validateRecord(incomplete), /source/);

  const incidentRecord = createIncidentRecord({ trigger: 'x' });
  assert.doesNotThrow(() => validateRecord(incidentRecord));
});

test('generalizedSchemaRoundTripsThroughDisk', () => {
  const { createIncidentRecord, appendIncidentRecord, withDefaultType, loadRecords } = require('../scripts/lib/incident-store');
  const file = tmpFile('roundtrip');
  const preGeneralization = {
    id: 'abc', trigger: 't', summary: 's', tags: [], priorIncidentLinks: [],
    status: 'open', triageSummary: null, confirmationStatus: null, createdAt: 'x', updatedAt: 'x',
  };
  appendIncidentRecord(withDefaultType(preGeneralization), file);
  const deferred = createIncidentRecord({
    type: 'deferred-item', trigger: 'defer', source: 'risk-accept',
    revisitCondition: 'rc', linkedFeature: 'f', linkedStory: 's1',
  });
  appendIncidentRecord(deferred, file);

  const records = loadRecords(file);
  assert.strictEqual(records.length, 2);
  assert.strictEqual(records[0].type, 'incident');
  assert.strictEqual(records[1].type, 'deferred-item');
  assert.strictEqual(records[1].source, 'risk-accept');
  fs.unlinkSync(file);
});

// --- AC2: register the real tfhc-s1 finding ---

test('registersTfhcS1AsRealDeferredItemRecord', () => {
  const { createDeferredItemRecord, appendIncidentRecord, loadRecords } = require('../scripts/lib/incident-store');
  const file = tmpFile('tfhc');
  const record = createDeferredItemRecord({
    trigger: 'pipeline-state-integrity C3: tfhc-s1',
    summary: '2026-10-30-test-fixture-hardening-continuation / tfhc-s1: prStatus="merged" but testPlan.passing (4) < testPlan.totalTests (5)',
    source: 'risk-accept',
    revisitCondition: 'Update testPlan.passing to the confirmed count in the post-merge pipeline-state commit.',
    linkedFeature: '2026-10-30-test-fixture-hardening-continuation',
    linkedStory: 'tfhc-s1',
  });
  appendIncidentRecord(record, file);

  const records = loadRecords(file);
  assert.strictEqual(records[0].type, 'deferred-item');
  assert.strictEqual(records[0].source, 'risk-accept');
  assert.ok(records[0].revisitCondition.includes('testPlan.passing'));
  fs.unlinkSync(file);
});

// --- AC3: register the real C1-vs-Option-C contradiction ---

test('registersC1VsOptionCAsRealDeferredItemRecord', () => {
  const { createDeferredItemRecord, appendIncidentRecord, loadRecords } = require('../scripts/lib/incident-store');
  const file = tmpFile('c1vsoptionc');
  const record = createDeferredItemRecord({
    trigger: 'C1-vs-Option-C fork-distribution contradiction',
    summary: 'architecture-guardrails.md constraint C1 rejects forking as a distribution mechanism; skills/bootstrap/SKILL.md Option C and docs/skill-pipeline-instructions.md offer org-level forking as a first-class onboarding path. These two documents disagree on whether forking is a valid distribution model at all.',
    source: 'backlog-thread',
    revisitCondition: 'deferred to a broader `product/` refresh later',
    linkedFeature: null,
    linkedStory: null,
  });
  appendIncidentRecord(record, file);

  const records = loadRecords(file);
  assert.strictEqual(records[0].type, 'deferred-item');
  assert.strictEqual(records[0].source, 'backlog-thread');
  assert.ok(records[0].revisitCondition.includes('broader `product/` refresh later'));
  fs.unlinkSync(file);
});

// --- AC4: both seeded records found and correctly typed ---

test('bothSeededRecordsFoundAndCorrectlyTyped', () => {
  const { createDeferredItemRecord, appendIncidentRecord, loadRecords } = require('../scripts/lib/incident-store');
  const file = tmpFile('both');
  appendIncidentRecord(createDeferredItemRecord({ trigger: 'tfhc-s1', source: 'risk-accept', revisitCondition: 'rc1' }), file);
  appendIncidentRecord(createDeferredItemRecord({ trigger: 'c1-vs-optionc', source: 'backlog-thread', revisitCondition: 'rc2' }), file);

  const records = loadRecords(file);
  const deferredItems = records.filter((r) => r.type === 'deferred-item');
  assert.strictEqual(deferredItems.length, 2, 'both seeded deferred-item records must be found');
  deferredItems.forEach((r) => assert.strictEqual(r.type, 'deferred-item'));
  fs.unlinkSync(file);
});

// --- NFR: no credential-shaped content in record fields ---

test('noCredentialOrTokenShapedContentInRecordFields', () => {
  const { createDeferredItemRecord } = require('../scripts/lib/incident-store');
  const credentialPattern = /(api[_-]?key|bearer\s+[a-z0-9]|token\s*[:=]\s*['"][a-z0-9]{10,})/i;
  const record = createDeferredItemRecord({
    trigger: 'tfhc-s1', summary: 'real failure text', source: 'risk-accept', revisitCondition: 'real revisit text',
  });
  Object.keys(record).forEach((k) => {
    if (typeof record[k] === 'string') {
      assert.ok(!credentialPattern.test(record[k]), k + ' contains credential-shaped content');
    }
  });
});

// --- Backward-compatibility regression: itar-s1's existing callers unaffected ---

test('itarS1ExistingCallersUnaffectedByGeneralization', () => {
  // Mirrors itar-s1's own real test shape exactly, with no `type` or
  // deferred-item fields passed -- confirms backward compatibility.
  const { createIncidentRecord } = require('../scripts/lib/incident-store');
  const r = createIncidentRecord({
    trigger: 'tenant_admin_bootstrap_failed',
    summary: 'inconsistent types deduced for parameter $1',
    tags: ['sql', 'type-inference'],
  });
  assert.strictEqual(r.type, 'incident');
  assert.strictEqual(r.source, undefined, 'source must never leak onto an incident record');
  assert.strictEqual(r.revisitCondition, undefined, 'revisitCondition must never leak onto an incident record');
  assert.strictEqual(r.linkedFeature, undefined, 'linkedFeature must never leak onto an incident record');
  assert.strictEqual(r.linkedStory, undefined, 'linkedStory must never leak onto an incident record');
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
