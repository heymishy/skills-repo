'use strict';
// ddft-s3 -- real telemetry signal feed tests.
// Every "the scan is enriched ..." assertion drives the REAL entry point
// (scripts/lib/deferred-item-scan.js --telemetry, run as a child process) against a
// local HTTP server standing in for PostHog's query API. The real HTTP client code in
// scripts/lib/telemetry-lookup.js therefore runs for real; only the remote service is
// faked. Response shape ({ results: [[event, n, cost, inTok, outTok]], columns }) and
// property names (featureSlug, costUsd, inputTokens, outputTokens) were verified against
// the live PostHog project and src/web-ui/routes/journey.js emitters.
const assert = require('assert');
const fs = require('fs');
const http = require('http');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');

const repoRoot = path.resolve(__dirname, '..');
const scanScript = path.join(repoRoot, 'scripts', 'lib', 'deferred-item-scan.js');
const realIncidents = path.join(repoRoot, 'workspace', 'incidents.json');
const lookup = require(path.join(repoRoot, 'scripts', 'lib', 'telemetry-lookup.js'));

const FAKE_KEY = 'phx_FAKEKEYSHAPED0123456789abcdef';
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log('  ✓ ' + name);
  } catch (err) {
    failed++;
    console.log('  ✗ ' + name + ': ' + err.message);
  }
}

function sha(file) {
  return crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
}

function tmpFile(label) {
  return path.join(os.tmpdir(), 'ddft-s3-' + label + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + '.json');
}

function rec(id, extra) {
  return Object.assign({
    id: id, type: 'deferred-item', trigger: 't-' + id, summary: 's-' + id, tags: [],
    priorIncidentLinks: [], status: 'open', triageSummary: null, confirmationStatus: null,
    createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z',
    source: 'risk-accept', revisitCondition: 'rc-' + id, linkedFeature: null, linkedStory: null,
  }, extra || {});
}

// Local stand-in for PostHog. eventsBySlug maps featureSlug -> rows [[event,n,cost,in,out]].
function startMock(eventsBySlug) {
  const calls = [];
  const server = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => { body += c; });
    req.on('end', () => {
      const parsed = body ? JSON.parse(body) : {};
      calls.push({ method: req.method, url: req.url, auth: req.headers.authorization, body: parsed });
      const slug = parsed.query && parsed.query.values && parsed.query.values.slug;
      const rows = (eventsBySlug && eventsBySlug[slug]) || [];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ results: rows, columns: ['event', 'n', 'cost', 'inTok', 'outTok'] }));
    });
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => {
    resolve({ server, calls, port: server.address().port });
  }));
}

function runScan(args, env) {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [scanScript].concat(args), {
      env: Object.assign({}, process.env, {
        POSTHOG_PERSONAL_API_KEY: '', POSTHOG_PROJECT_ID: '', POSTHOG_HOST: '',
      }, env || {}),
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    child.on('close', (code) => resolve({ code: code, stdout: stdout, stderr: stderr }));
  });
}

function mockEnv(port) {
  return { POSTHOG_PERSONAL_API_KEY: FAKE_KEY, POSTHOG_PROJECT_ID: '123', POSTHOG_HOST: 'http://127.0.0.1:' + port };
}

const REAL_ROWS = [
  ['artefact_commit_succeeded', 1, null, null, null],
  ['stage_completed', 1, 0.29863, 111, 1575],
  ['stage_started', 3, null, null, null],
];

async function main() {
  console.log('ddft-s3 real telemetry signal feed');

  // ---- Unit
  await test('buildsExactFeatureSlugQueryNeverFuzzyMatched', () => {
    const q = lookup.buildQuery('2026-11-08-incident-triage-and-respond');
    assert.strictEqual(q.kind, 'HogQLQuery');
    assert.strictEqual(q.values.slug, '2026-11-08-incident-triage-and-respond');
    assert.ok(/properties\.featureSlug\s*=\s*\{slug\}/.test(q.query), 'exact equality on placeholder');
    assert.ok(!/like|ilike|match|position|contains/i.test(q.query), 'no fuzzy matching');
    ['stage_completed', 'stage_started', 'artefact_commit_succeeded', 'artefact_commit_failed']
      .forEach((e) => assert.ok(q.query.indexOf("'" + e + "'") !== -1, 'queries ' + e));
    assert.ok(q.query.indexOf('2026-11-08') === -1, 'slug is a value, not interpolated');
  });

  await test('formatsRealEventsIntoFigures', () => {
    const out = lookup.formatTelemetry(lookup.summarizeRows(REAL_ROWS));
    assert.ok(out.indexOf('0.29863') !== -1, 'real cost');
    assert.ok(out.indexOf('111') !== -1 && out.indexOf('1575') !== -1, 'real tokens');
    assert.ok(/stage_completed: 1/.test(out) && /stage_started: 3/.test(out) && /artefact_commit_succeeded: 1/.test(out), 'event counts');
  });

  await test('reportsZeroEventsHonestlyWithoutOverclaiming', () => {
    const out = lookup.formatTelemetry(lookup.summarizeRows([]));
    assert.ok(/no telemetry signal found for this feature/i.test(out));
    assert.ok(!/nothing happened|inactive|no activity|not used|never/i.test(out), 'no overclaim: ' + out);
    assert.ok(/sparse|instrumentation/i.test(out), 'explains zero may be sparse instrumentation');
  });

  await test('skipsLookupWhenNoLinkedFeature', async () => {
    let calls = 0;
    const client = { queryFeature: async () => { calls++; return []; } };
    for (const lf of [undefined, null, '', '   ']) {
      const r = await lookup.enrichRecord(rec('x', { linkedFeature: lf }), client);
      assert.strictEqual(r.telemetry, undefined);
    }
    assert.strictEqual(calls, 0);
  });

  // ---- Integration (real entry point)
  await test('enrichesScanOutputWithRealFiguresWhenEventsExist', async () => {
    const mock = await startMock({ 'feat-with-events': REAL_ROWS });
    const file = tmpFile('ac1');
    fs.writeFileSync(file, JSON.stringify([
      rec('a', { linkedFeature: 'feat-with-events' }),
      rec('b', { linkedFeature: 'feat-without-events' }),
    ]));
    try {
      const r = await runScan(['--file', file, '--telemetry'], mockEnv(mock.port));
      assert.strictEqual(r.code, 0, r.stderr);
      const blockA = r.stdout.split('Deferred item ').find((s) => s.startsWith('a'));
      const blockB = r.stdout.split('Deferred item ').find((s) => s.startsWith('b'));
      assert.ok(blockA.indexOf('0.29863') !== -1 && blockA.indexOf('1575') !== -1, 'A has real figures: ' + blockA);
      assert.ok(/no telemetry signal found/i.test(blockB) && blockB.indexOf('0.29863') === -1, 'B unaffected');
      // wire-level proof of the real request
      const c = mock.calls[0];
      assert.strictEqual(c.method, 'POST');
      assert.strictEqual(c.url, '/api/projects/123/query/');
      assert.strictEqual(c.auth, 'Bearer ' + FAKE_KEY);
      assert.strictEqual(c.body.query.kind, 'HogQLQuery');
    } finally { mock.server.close(); fs.unlinkSync(file); }
  });

  await test('enrichesScanOutputWithHonestZeroSignalMessage', async () => {
    const mock = await startMock({});
    const file = tmpFile('ac2');
    fs.writeFileSync(file, JSON.stringify([rec('a', { linkedFeature: 'feat-x' })]));
    try {
      const r = await runScan(['--file', file, '--telemetry'], mockEnv(mock.port));
      assert.strictEqual(r.code, 0, r.stderr);
      assert.ok(/no telemetry signal found for this feature/i.test(r.stdout));
      assert.ok(!/nothing happened|inactive/i.test(r.stdout));
    } finally { mock.server.close(); fs.unlinkSync(file); }
  });

  await test('neverQueriesPostHogForRecordWithoutLinkedFeature', async () => {
    const mock = await startMock({ f1: REAL_ROWS });
    const file = tmpFile('ac3');
    fs.writeFileSync(file, JSON.stringify([
      rec('a', { linkedFeature: 'f1' }), rec('b'), rec('c', { linkedFeature: 'f2' }),
      rec('d', { source: 'backlog-thread', linkedFeature: null }),
    ]));
    try {
      const r = await runScan(['--file', file, '--telemetry'], mockEnv(mock.port));
      assert.strictEqual(r.code, 0, r.stderr);
      assert.strictEqual(mock.calls.length, 2, 'calls == records with linkedFeature');
      const slugs = mock.calls.map((c) => c.body.query.values.slug).sort();
      assert.deepStrictEqual(slugs, ['f1', 'f2']);
      const blockB = r.stdout.split('Deferred item ').find((s) => s.startsWith('b'));
      assert.ok(blockB && !/telemetry/i.test(blockB), 'no telemetry section on record without linkedFeature');
    } finally { mock.server.close(); fs.unlinkSync(file); }
  });

  await test('selfRegistersSparseTelemetryFindingAsNewDeferredItemRecord', async () => {
    const mock = await startMock({});
    const file = tmpFile('ac4');
    fs.writeFileSync(file, JSON.stringify([rec('a', { linkedFeature: 'f1' })]));
    try {
      const r1 = await runScan(['--file', file, '--telemetry'], mockEnv(mock.port));
      assert.strictEqual(r1.code, 0, r1.stderr);
      const records = JSON.parse(fs.readFileSync(file, 'utf8'));
      assert.strictEqual(records.length, 2, 'one new record');
      const added = records[1];
      assert.strictEqual(added.type, 'deferred-item');
      assert.strictEqual(added.source, 'capture-log');
      assert.ok(added.revisitCondition.indexOf('investigate whether tracking calls are wired into real skill execution') !== -1);
      assert.ok(!added.linkedFeature, 'no linkedFeature, so it never triggers its own lookup');
      // idempotent: a second run does not register a duplicate
      await runScan(['--file', file, '--telemetry'], mockEnv(mock.port));
      assert.strictEqual(JSON.parse(fs.readFileSync(file, 'utf8')).length, 2, 'no duplicate');
    } finally { mock.server.close(); fs.unlinkSync(file); }
  });

  await test('doesNotRegisterWhenEventsWereFound', async () => {
    const mock = await startMock({ f1: REAL_ROWS });
    const file = tmpFile('ac4b');
    fs.writeFileSync(file, JSON.stringify([rec('a', { linkedFeature: 'f1' })]));
    try {
      await runScan(['--file', file, '--telemetry'], mockEnv(mock.port));
      assert.strictEqual(JSON.parse(fs.readFileSync(file, 'utf8')).length, 1);
    } finally { mock.server.close(); fs.unlinkSync(file); }
  });

  await test('unconfiguredOrUnreachableDegradesHonestlyAndNeverRegisters', async () => {
    const file = tmpFile('degrade');
    fs.writeFileSync(file, JSON.stringify([rec('a', { linkedFeature: 'f1' })]));
    try {
      const r = await runScan(['--file', file, '--telemetry'], {});
      assert.strictEqual(r.code, 0, r.stderr);
      assert.ok(/telemetry not configured/i.test(r.stdout), r.stdout);
      assert.ok(/POSTHOG_PERSONAL_API_KEY/.test(r.stdout), 'names what to set');
      // unreachable host: query error is reported, not a crash, not a false "zero events" finding
      const r2 = await runScan(['--file', file, '--telemetry'], mockEnv(1));
      assert.strictEqual(r2.code, 0, r2.stderr);
      assert.ok(/telemetry lookup failed/i.test(r2.stdout), r2.stdout);
      assert.strictEqual(JSON.parse(fs.readFileSync(file, 'utf8')).length, 1, 'no registration on failure');
    } finally { fs.unlinkSync(file); }
  });

  await test('withoutTelemetryFlagScanIsUnchangedAndMakesNoCalls', async () => {
    const mock = await startMock({});
    const file = tmpFile('noflag');
    const body = JSON.stringify([rec('a', { linkedFeature: 'f1' })]);
    fs.writeFileSync(file, body);
    try {
      const r = await runScan(['--file', file], mockEnv(mock.port));
      assert.strictEqual(r.code, 0);
      assert.strictEqual(mock.calls.length, 0);
      assert.ok(!/telemetry/i.test(r.stdout));
      assert.strictEqual(fs.readFileSync(file, 'utf8'), body, 'file untouched');
    } finally { mock.server.close(); fs.unlinkSync(file); }
  });

  await test('realCommittedFileNeverWrittenAndKeyNeverInOutput', async () => {
    const before = sha(realIncidents);
    const mock = await startMock({});
    // Run against a temp COPY of the real data, never the real file itself.
    const copy = tmpFile('realcopy');
    fs.copyFileSync(realIncidents, copy);
    try {
      const r = await runScan(['--file', copy, '--telemetry'], mockEnv(mock.port));
      assert.strictEqual(r.code, 0, r.stderr);
      assert.ok(r.stdout.indexOf(FAKE_KEY) === -1 && r.stderr.indexOf(FAKE_KEY) === -1, 'key never printed');
      assert.ok(r.stdout.indexOf('tfhc-s1') !== -1, 'real seeded record still surfaced');
      assert.strictEqual(mock.calls.length, 1, 'only the one real record with a linkedFeature is looked up');
    } finally { mock.server.close(); fs.unlinkSync(copy); }
    assert.strictEqual(sha(realIncidents), before, 'real workspace/incidents.json untouched');
  });

  console.log('\n' + passed + ' passed, ' + failed + ' failed');
  process.exit(failed === 0 ? 0 : 1);
}

main();
