'use strict';
// dsrf-s1: the two seeded deferred-item records ddft-s1 promised.
// Reads the REAL committed workspace/incidents.json and never writes to it
// (ddft-s1's own tests used temp files and so proved nothing about the real file).
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const FILE = path.join(__dirname, '..', 'workspace', 'incidents.json');
const REPO = path.join(__dirname, '..');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

function fingerprint() {
  if (!fs.existsSync(FILE)) return 'absent';
  return crypto.createHash('sha256').update(fs.readFileSync(FILE)).digest('hex') + ':' + fs.statSync(FILE).mtimeMs;
}

function readReal() {
  return JSON.parse(fs.readFileSync(FILE, 'utf8'));
}

// The shared assertion logic: exactly one tfhc-s1 record, exactly one
// backlog-thread record, nothing typed anything other than deferred-item.
function assertSeedRecords(records) {
  assert.ok(Array.isArray(records), 'records must be an array');
  const tfhc = records.filter(r => r.linkedStory === 'tfhc-s1');
  const contradiction = records.filter(r => r.source === 'backlog-thread');
  assert.strictEqual(tfhc.length, 1, 'expected exactly one tfhc-s1 record, found ' + tfhc.length);
  assert.strictEqual(contradiction.length, 1, 'expected exactly one backlog-thread record, found ' + contradiction.length);
  records.forEach(r => assert.strictEqual(r.type, 'deferred-item', 'record ' + r.id + ' has type ' + r.type));
}

const before = fingerprint();

console.log('[dsrf-s1] seeded deferred-item records');

// --- AC1 ---
test('UT1 file exists and parses as a JSON array with at least 2 records', () => {
  assert.ok(fs.existsSync(FILE), 'workspace/incidents.json does not exist');
  const records = readReal();
  assert.ok(Array.isArray(records), 'not an array');
  assert.ok(records.length >= 2, 'expected at least 2 records, found ' + records.length);
});

test('UT2 file is tracked in git', () => {
  try {
    execFileSync('git', ['ls-files', '--error-unmatch', 'workspace/incidents.json'], { cwd: REPO, stdio: 'pipe' });
  } catch (err) {
    if (err.code === 'ENOENT') {
      console.log('    (skipped: git not available in this environment)');
      return;
    }
    throw new Error('workspace/incidents.json is not tracked in git');
  }
});

// --- AC2 ---
test('UT3 exactly one tfhc-s1 deferred-item record, correctly shaped', () => {
  const matches = readReal().filter(r => r.linkedStory === 'tfhc-s1');
  assert.strictEqual(matches.length, 1, 'found ' + matches.length);
  const r = matches[0];
  assert.strictEqual(r.type, 'deferred-item');
  assert.strictEqual(r.source, 'risk-accept');
  assert.strictEqual(r.linkedFeature, '2026-10-30-test-fixture-hardening-continuation');
  assert.ok(/C3/.test(r.summary), 'summary must name check C3');
  assert.ok(/passing/.test(r.summary), 'summary must name testPlan.passing');
  assert.ok(r.revisitCondition && r.revisitCondition.trim().length > 0, 'revisitCondition must be non-empty');
});

// --- AC3 ---
test('UT4 exactly one C1-versus-Option-C deferred-item record, correctly shaped', () => {
  const matches = readReal().filter(r => r.source === 'backlog-thread');
  assert.strictEqual(matches.length, 1, 'found ' + matches.length);
  const r = matches[0];
  assert.strictEqual(r.type, 'deferred-item');
  assert.ok(/C1/.test(r.summary), 'summary must name constraint C1');
  assert.ok(/Option C/.test(r.summary), 'summary must name Option C');
  assert.ok(/product\/.*refresh/.test(r.revisitCondition), 'revisitCondition must name the product/ refresh');
});

// --- AC4 ---
test('UT5 negative control: the check rejects missing, duplicated and mistyped records', () => {
  const good = [
    { id: 'a', type: 'deferred-item', linkedStory: 'tfhc-s1', source: 'risk-accept' },
    { id: 'b', type: 'deferred-item', source: 'backlog-thread' }
  ];
  assert.doesNotThrow(() => assertSeedRecords(good));
  assert.throws(() => assertSeedRecords([good[0]]), /backlog-thread/, 'missing record must fail');
  assert.throws(() => assertSeedRecords(good.concat([good[0]])), /tfhc-s1/, 'duplicate must fail');
  assert.throws(() => assertSeedRecords([good[0], Object.assign({}, good[1], { type: 'incident' })]), /type/, 'mistyped must fail');
});

test('IT1 every record in the real file passes the shipped validateRecord', () => {
  const { validateRecord } = require('../scripts/lib/incident-store');
  const records = readReal();
  assertSeedRecords(records);
  records.forEach(r => assert.doesNotThrow(() => validateRecord(r)));
});

// --- AC5 ---
test('IT2 existing loaders read the real file and no incident-typed record exists', () => {
  const { loadRecords, loadIncidentRecords } = require('../scripts/lib/incident-store');
  const a = loadRecords(FILE);
  const b = loadIncidentRecords(FILE);
  assert.deepStrictEqual(a, b);
  assert.ok(a.length >= 2);
  assert.ok(!a.some(r => r.type === 'incident'), 'no type:incident record may be introduced');
});

// --- NFRs ---
test('NFR-SEC1 no secrets, tenant identifiers or personal data in the file', () => {
  const raw = fs.readFileSync(FILE, 'utf8');
  [/token/i, /secret/i, /password/i, /tenant_id/i, /[\w.+-]+@[\w-]+\.[\w.]+/].forEach(re => {
    assert.ok(!re.test(raw), 'file matches forbidden pattern ' + re);
  });
});

test('NFR-CORR1 this test run did not modify the real file', () => {
  assert.strictEqual(fingerprint(), before);
});

console.log('\n[dsrf-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
