'use strict';
// iwf-s1: wires triage drafting to incident creation.
// Every test uses a temp file; the real workspace/incidents.json is only
// ever hashed (NFR-CORR1), never written.
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const REAL_FILE = path.join(REPO, 'workspace', 'incidents.json');
const CLI = path.join(REPO, 'scripts', 'create-incident.js');

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

function tmpFile(label) {
  return path.join(os.tmpdir(), 'iwf-s1-' + label + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.json');
}

function realFingerprint() {
  if (!fs.existsSync(REAL_FILE)) return 'absent';
  return crypto.createHash('sha256').update(fs.readFileSync(REAL_FILE)).digest('hex') + ':' + fs.statSync(REAL_FILE).mtimeMs;
}

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function seed(file, records) {
  fs.writeFileSync(file, JSON.stringify(records, null, 2) + '\n');
}

function runCli(args) {
  return spawnSync(process.execPath, [CLI].concat(args), { cwd: REPO, encoding: 'utf8' });
}

const store = require('../scripts/lib/incident-store');
const before = realFingerprint();

console.log('[iwf-s1] incident recording wired to triage drafting');

function recorder() {
  return require('../src/modules/incident-recorder');
}

test('UT1 recordIncident stores the incident and drafts its summary', () => {
  const file = tmpFile('ut1');
  const earlier = store.createIncidentRecord({ trigger: 'earlier', summary: 'e', tags: ['db', 'timeout'] });
  seed(file, [earlier]);
  const result = recorder().recordIncident({ trigger: 'now', summary: 's', tags: ['db', 'timeout'] }, file);
  const onDisk = readJson(file);
  assert.strictEqual(onDisk.length, 2);
  const stored = onDisk[1];
  assert.strictEqual(stored.type, 'incident');
  assert.ok(stored.triageSummary, 'triageSummary must be persisted');
  assert.deepStrictEqual(stored.priorIncidentLinks, [earlier.id]);
  assert.strictEqual(result.id, stored.id);
  assert.strictEqual(result.triageSummary, stored.triageSummary);
  assert.deepStrictEqual(result.priorIncidentLinks, [earlier.id]);
});

test('UT2 existing records are untouched', () => {
  const file = tmpFile('ut2');
  const inc = store.createIncidentRecord({ trigger: 'a', tags: ['x'] });
  const def = store.createDeferredItemRecord({ trigger: 'b', tags: ['y'], source: 'risk-accept' });
  const legacy = { id: 'legacy-1', trigger: 'c', summary: '', tags: ['z'], priorIncidentLinks: [], status: 'open', triageSummary: null, confirmationStatus: null, createdAt: 'x', updatedAt: 'x' };
  const snapshot = JSON.parse(JSON.stringify([inc, def, legacy]));
  seed(file, [inc, def, legacy]);
  recorder().recordIncident({ trigger: 'new', summary: '', tags: ['q'] }, file);
  const onDisk = readJson(file);
  assert.strictEqual(onDisk.length, 4);
  assert.deepStrictEqual(onDisk.slice(0, 3), snapshot);
});

test('UT3 a deferred-item is never a prior incident', () => {
  const file = tmpFile('ut3');
  const def = store.createDeferredItemRecord({ trigger: 'DEFERRED-TEXT', tags: ['db', 'timeout'], source: 'risk-accept' });
  seed(file, [def]);
  const result = recorder().recordIncident({ trigger: 'now', summary: '', tags: ['db', 'timeout'] }, file);
  assert.deepStrictEqual(result.priorIncidentLinks, []);
  assert.ok(/No relevant prior incident/.test(result.triageSummary), result.triageSummary);
  assert.ok(result.triageSummary.indexOf(def.id) === -1);
  assert.ok(result.triageSummary.indexOf('DEFERRED-TEXT') === -1);
});

test('UT4 a record with no type still counts as an incident', () => {
  const file = tmpFile('ut4');
  const legacy = { id: 'legacy-2', trigger: 'old', summary: '', tags: ['db', 'timeout'], priorIncidentLinks: [], status: 'open', triageSummary: null, confirmationStatus: null, createdAt: 'x', updatedAt: 'x' };
  seed(file, [legacy]);
  const result = recorder().recordIncident({ trigger: 'now', summary: '', tags: ['db', 'timeout'] }, file);
  assert.deepStrictEqual(result.priorIncidentLinks, ['legacy-2']);
});

test('UT5 a draft failure keeps the incident and reports the error', () => {
  const file = tmpFile('ut5');
  seed(file, []);
  assert.throws(
    () => recorder().recordIncident({ trigger: 'keep me', summary: 'kept', tags: ['a'] }, file, { draft: () => { throw new Error('boom'); } }),
    /boom/
  );
  const onDisk = readJson(file);
  assert.strictEqual(onDisk.length, 1);
  assert.strictEqual(onDisk[0].trigger, 'keep me');
  assert.strictEqual(onDisk[0].summary, 'kept');
  assert.deepStrictEqual(onDisk[0].tags, ['a']);
  assert.strictEqual(onDisk[0].triageSummary, null);
});

test('UT6 the default target is the real data file', () => {
  assert.strictEqual(path.resolve(recorder().DEFAULT_INCIDENTS_FILE), path.resolve(REAL_FILE));
});

test('IT1 the command records an incident and prints id and summary', () => {
  const file = tmpFile('it1');
  seed(file, []);
  const r = runCli(['--trigger', 't', '--summary', 's', '--tags', 'db,timeout', '--file', file]);
  assert.strictEqual(r.status, 0, r.stderr);
  const rec = readJson(file)[0];
  assert.ok(r.stdout.indexOf(rec.id) !== -1, 'stdout must contain the new id');
  assert.ok(r.stdout.indexOf(rec.triageSummary) !== -1, 'stdout must contain the triage summary');
});

test('IT2 missing required input is rejected without writing', () => {
  const file = tmpFile('it2');
  const r = runCli(['--summary', 's', '--tags', 'a', '--file', file]);
  assert.notStrictEqual(r.status, 0);
  assert.ok(/trigger/.test(r.stderr), r.stderr);
  assert.ok(!fs.existsSync(file), 'no file may be created');
});

test('IT3 over-long tags are rejected without writing', () => {
  const file = tmpFile('it3');
  seed(file, []);
  const bytes = fs.readFileSync(file);
  const tooLong = new Array(60).fill('averyverylongtagname').join(',');
  const r = runCli(['--trigger', 't', '--summary', 's', '--tags', tooLong, '--file', file]);
  assert.notStrictEqual(r.status, 0);
  assert.ok(/tag/i.test(r.stderr) && /length|long|limit/i.test(r.stderr), r.stderr);
  assert.ok(bytes.equals(fs.readFileSync(file)), 'file bytes must be unchanged');
});

test('IT4 two real runs link the second incident to the first', () => {
  const file = tmpFile('it4');
  const a = runCli(['--trigger', 'first', '--summary', 's', '--tags', 'db,timeout', '--file', file]);
  assert.strictEqual(a.status, 0, a.stderr);
  const b = runCli(['--trigger', 'second', '--summary', 's', '--tags', 'db,timeout,retry', '--file', file]);
  assert.strictEqual(b.status, 0, b.stderr);
  const recs = readJson(file);
  assert.strictEqual(recs.length, 2);
  assert.deepStrictEqual(recs[1].priorIncidentLinks, [recs[0].id]);
  assert.ok(recs[1].triageSummary.indexOf(recs[0].id) !== -1);
});

test('NFR-CORR1 the real data file was not modified by this run', () => {
  assert.strictEqual(realFingerprint(), before);
});

console.log('\n[iwf-s1] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
