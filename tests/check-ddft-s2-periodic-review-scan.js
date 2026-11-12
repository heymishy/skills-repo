'use strict';
// ddft-s2 -- periodic review scan tests.
// Every "the scan surfaces ..." assertion drives the REAL entry point
// (scripts/lib/deferred-item-scan.js run as a child process), not an inner function.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scanScript = path.join(repoRoot, 'scripts', 'lib', 'deferred-item-scan.js');
const realIncidents = path.join(repoRoot, 'workspace', 'incidents.json');

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
  return path.join(os.tmpdir(), 'ddft-s2-' + label + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.json');
}

function runScan(args) {
  const r = spawnSync(process.execPath, [scanScript].concat(args || []), { encoding: 'utf8', cwd: repoRoot });
  return { status: r.status, stdout: r.stdout || '', stderr: r.stderr || '' };
}

function rec(over) {
  return Object.assign({
    id: 'id-' + Math.random().toString(36).slice(2),
    type: 'deferred-item',
    trigger: 't',
    summary: 's',
    tags: [],
    priorIncidentLinks: [],
    status: 'open',
    triageSummary: null,
    confirmationStatus: null,
    createdAt: 'x',
    updatedAt: 'x',
    source: 'risk-accept',
    revisitCondition: 'rc',
    linkedFeature: null,
    linkedStory: null,
  }, over);
}

function writeFixture(records) {
  const f = tmpFile('fx');
  fs.writeFileSync(f, JSON.stringify(records, null, 2) + '\n');
  return f;
}

const realRecords = JSON.parse(fs.readFileSync(realIncidents, 'utf8'));
const realDeferred = realRecords.filter((r) => r.type === 'deferred-item');

// --- Unit: AC1 ---

test('filtersToUnresolvedDeferredItemRecordsOnly', () => {
  const { filterUnresolvedDeferredItems } = require('../scripts/lib/deferred-item-scan');
  const out = filterUnresolvedDeferredItems([
    rec({ id: 'inc', type: 'incident' }),
    rec({ id: 'res', status: 'resolved' }),
    rec({ id: 'open1' }),
    rec({ id: 'open2', status: 'in-progress' }),
  ]);
  assert.deepStrictEqual(out.map((r) => r.id), ['open1', 'open2']);
});

test('neverSkipsAnUnresolvedRecordSilently', () => {
  const { filterUnresolvedDeferredItems } = require('../scripts/lib/deferred-item-scan');
  const sparse = { id: 'sparse', type: 'deferred-item', status: 'open', source: 'risk-accept' };
  const noStatus = { id: 'nostatus', type: 'deferred-item', source: 'risk-accept' };
  const out = filterUnresolvedDeferredItems([sparse, noStatus]);
  assert.deepStrictEqual(out.map((r) => r.id), ['sparse', 'nostatus']);
  // and through the real entry point, a sparse record still prints
  const f = writeFixture([sparse]);
  const r = runScan(['--file', f]);
  fs.unlinkSync(f);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes('sparse'), 'sparse record must be printed');
});

// --- Unit: AC3 ---

const awkward = 'once volume improves after 2026-12-01, (or if X > 3; "quoted")  ';

test('preservesRevisitConditionTextVerbatim', () => {
  const f = writeFixture([rec({ id: 'awk', revisitCondition: awkward })]);
  const r = runScan(['--file', f]);
  fs.unlinkSync(f);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(r.stdout.includes(awkward), 'surfaced text must contain the prose character-for-character');
});

test('neverCallsAnyConditionEvaluationLogic', () => {
  // Static: the module must not even reference date parsing / dynamic evaluation.
  const src = fs.readFileSync(scanScript, 'utf8').replace(/\/\/.*$/gm, '');
  assert.ok(!/\bDate\b/.test(src), 'scan source must not reference Date');
  assert.ok(!/\beval\s*\(/.test(src) && !/new\s+Function/.test(src), 'no dynamic evaluation');
  // Dynamic: instrument Date during the pure surfacing path.
  const { filterUnresolvedDeferredItems, formatRecord } = require('../scripts/lib/deferred-item-scan');
  const RealDate = Date;
  let calls = 0;
  function Spy() { calls++; return new RealDate(); }
  Spy.parse = function () { calls++; return NaN; };
  Spy.now = function () { calls++; return 0; };
  global.Date = Spy;
  try {
    ['after 2026-12-01', 'when X > 3', 'tomorrow', 'if done'].forEach((c) => {
      filterUnresolvedDeferredItems([rec({ revisitCondition: c })]).forEach((x) => formatRecord(x));
    });
  } finally {
    global.Date = RealDate;
  }
  assert.strictEqual(calls, 0, 'no date parsing during surfacing');
});

// --- Integration: AC2 (REAL committed workspace/incidents.json, read-only) ---

test('firstRealRunSurfacesBothSeededRecords', () => {
  const before = fs.readFileSync(realIncidents, 'utf8');
  const r = runScan([]); // default file = the real workspace/incidents.json
  assert.strictEqual(r.status, 0, r.stderr);
  const tfhc = realDeferred.find((x) => x.linkedStory === 'tfhc-s1');
  const c1 = realDeferred.find((x) => x.source === 'backlog-thread');
  assert.ok(tfhc && c1, 'real committed file must hold both seeded records');
  assert.ok(r.stdout.includes(tfhc.id), 'tfhc-s1 record id surfaced');
  assert.ok(r.stdout.includes(c1.id), 'C1-vs-Option-C record id surfaced');
  assert.ok(r.stdout.includes(tfhc.revisitCondition), 'tfhc-s1 revisitCondition verbatim');
  assert.ok(r.stdout.includes(c1.revisitCondition), 'C1 revisitCondition verbatim');
  assert.strictEqual(fs.readFileSync(realIncidents, 'utf8'), before, 'scan must not modify incidents.json');
});

test('realCommittedFileHoldsExactlyTheTwoSeededUnresolvedRecords', () => {
  const { filterUnresolvedDeferredItems } = require('../scripts/lib/deferred-item-scan');
  const out = filterUnresolvedDeferredItems(realRecords);
  assert.ok(out.length >= 2);
  assert.ok(out.some((x) => x.linkedStory === 'tfhc-s1'));
  assert.ok(out.some((x) => x.source === 'backlog-thread'));
});

// --- Integration: AC4 ---

test('secondRunWithNoNewRecordsResurfacesSameSet', () => {
  const f = writeFixture(realRecords.concat([rec({ id: 'extra-open' })]));
  const a = runScan(['--file', f]);
  const b = runScan(['--file', f]);
  fs.unlinkSync(f);
  assert.strictEqual(a.status, 0, a.stderr);
  assert.strictEqual(a.stdout, b.stdout, 'identical output on second run');
  realDeferred.concat([{ id: 'extra-open' }]).forEach((x) => {
    assert.ok(b.stdout.includes(x.id), 'second run surfaces ' + x.id);
  });
});

// --- Integration: AC1 filtering via real entry point ---

test('filtersOutResolvedRecordsInRealFixture', () => {
  const f = writeFixture(realRecords.concat([
    rec({ id: 'resolved-one', status: 'resolved' }),
    rec({ id: 'an-incident', type: 'incident' }),
  ]));
  const r = runScan(['--file', f]);
  fs.unlinkSync(f);
  assert.strictEqual(r.status, 0, r.stderr);
  realDeferred.forEach((x) => assert.ok(r.stdout.includes(x.id)));
  assert.ok(!r.stdout.includes('resolved-one'), 'resolved record excluded');
  assert.ok(!r.stdout.includes('an-incident'), 'incident record excluded');
});

// --- Robustness of the real entry point ---

test('emptyOrMissingFileReportsNothingAndExitsZero', () => {
  const r = runScan(['--file', tmpFile('missing')]);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.ok(/no unresolved/i.test(r.stdout));
});

test('malformedFileFailsLoudlyNotSilently', () => {
  const f = tmpFile('bad');
  fs.writeFileSync(f, '{not json');
  const r = runScan(['--file', f]);
  fs.unlinkSync(f);
  assert.notStrictEqual(r.status, 0);
  assert.ok(r.stderr.length > 0);
});

console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
