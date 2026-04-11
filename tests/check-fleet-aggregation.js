#!/usr/bin/env node
/**
 * check-fleet-aggregation.js
 *
 * Automated tests for fleet registry and CI aggregation (story p2.7).
 *
 * Tests from the p2.7 test plan:
 *
 *   Unit tests (AC1 — squad file validation):
 *   - squad-valid-passes
 *   - squad-missing-field-rejected-names-field
 *   - squad-multi-missing-both-fields-listed
 *
 *   Unit tests (AC2 — CI aggregation reads + writes):
 *   - aggregation-reads-all-squad-files
 *   - aggregation-fetches-pipeline-state-url
 *   - aggregation-updatedAt-reflects-run-time
 *
 *   Unit tests (AC3 — fleet-state.json structure):
 *   - fleet-state-entry-has-all-five-fields
 *   - fleet-state-sourceUrl-matches-pipelineStateUrl
 *
 *   Unit tests (AC4 — registry_mode filtering):
 *   - registry-mode-publishing-included
 *   - registry-mode-none-excluded
 *   - registry-mode-absent-excluded
 *
 *   Unit tests (AC6 — graceful degradation):
 *   - unreachable-url-health-unknown-error-field
 *   - unreachable-url-job-continues-reachable-appear
 *
 *   Integration test (AC6):
 *   - partial-fleet-state-three-squads-one-unreachable
 *
 *   NFR test (Security — MC-SEC-02):
 *   - fleet-files-no-credential-fields
 *
 * Run:  node tests/check-fleet-aggregation.js
 * Used: npm test
 *
 * Zero external dependencies — plain Node.js (fs, path, os).
 */
'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const root = path.join(__dirname, '..');

const {
  validateSquadFile,
  aggregateFleet,
} = require(path.join(root, 'scripts', 'fleet-aggregator.js'));

// ── Helpers ───────────────────────────────────────────────────────────────────

let passed   = 0;
let failed   = 0;
const failures = [];

function pass(name) {
  passed++;
  process.stdout.write('  \u2713 ' + name + '\n');
}

function fail(name, reason) {
  failed++;
  failures.push({ name, reason });
  process.stdout.write('  \u2717 ' + name + '\n');
  process.stdout.write('    \u2192 ' + reason + '\n');
}

function mkTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'fleet-test-'));
}

function rmDir(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) rmDir(full);
    else fs.unlinkSync(full);
  }
  fs.rmdirSync(dir);
}

function writeJSON(filePath, obj) {
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n', 'utf8');
}

function readJSON(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function makeSquad(overrides) {
  return Object.assign({
    squadId:          'test-squad',
    repoUrl:          'https://github.com/example-org/test-squad',
    pipelineStateUrl: 'https://example.com/pipeline-state.json',
    registeredAt:     '2026-04-11T10:00:00.000Z',
    registry_mode:    'publishing',
  }, overrides);
}

function makePipelineState(stage, health) {
  return { version: '1', updated: new Date().toISOString(), stage: stage, health: health, features: [] };
}

// Collect all test promises so we can await them all before printing results.
const asyncTests = [];

// ─────────────────────────────────────────────────────────────────────────────
// AC1: Squad file validation (synchronous)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[fleet-aggregation] AC1: Squad file validation');

// squad-valid-passes
(function() {
  const result = validateSquadFile(makeSquad());
  result.valid
    ? pass('squad-valid-passes: valid squad file accepted')
    : fail('squad-valid-passes: valid squad file accepted', 'errors: ' + result.errors.join(', '));
}());

// squad-missing-field-rejected-names-field
(function() {
  const squad = makeSquad({ squadId: undefined });
  const result = validateSquadFile(squad);
  if (!result.valid && result.errors.some(function(e) { return e.includes('squadId'); })) {
    pass('squad-missing-field-rejected-names-field: missing squadId error names "squadId"');
  } else if (result.valid) {
    fail('squad-missing-field-rejected-names-field: missing squadId error names "squadId"', 'validation passed unexpectedly');
  } else {
    fail('squad-missing-field-rejected-names-field: missing squadId error names "squadId"', 'errors: ' + result.errors.join(', '));
  }
}());

// squad-multi-missing-both-fields-listed
(function() {
  const squad = makeSquad({ pipelineStateUrl: undefined, registeredAt: undefined });
  const result = validateSquadFile(squad);
  const namesPSU = result.errors.some(function(e) { return e.includes('pipelineStateUrl'); });
  const namesRA  = result.errors.some(function(e) { return e.includes('registeredAt'); });
  if (!result.valid && namesPSU && namesRA) {
    pass('squad-multi-missing-both-fields-listed: error lists both missing fields');
  } else if (result.valid) {
    fail('squad-multi-missing-both-fields-listed: error lists both missing fields', 'validation passed unexpectedly');
  } else {
    fail('squad-multi-missing-both-fields-listed: error lists both missing fields',
      'errors: [' + result.errors.join(', ') + '] pipelineStateUrl:' + namesPSU + ' registeredAt:' + namesRA);
  }
}());

// ─────────────────────────────────────────────────────────────────────────────
// AC2: CI aggregation (async)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[fleet-aggregation] AC2: CI aggregation');

asyncTests.push((async function testAggregationReadsAll() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  const psA = path.join(tmpDir, 'ps-a.json');
  const psB = path.join(tmpDir, 'ps-b.json');
  writeJSON(psA, makePipelineState('test-plan', 'green'));
  writeJSON(psB, makePipelineState('review', 'amber'));
  writeJSON(path.join(squadsDir, 'squad-a.json'), makeSquad({ squadId: 'squad-a', pipelineStateUrl: psA }));
  writeJSON(path.join(squadsDir, 'squad-b.json'), makeSquad({ squadId: 'squad-b', pipelineStateUrl: psB }));

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    state.squads.length === 2
      ? pass('aggregation-reads-all-squad-files: fleet-state.json has exactly 2 entries')
      : fail('aggregation-reads-all-squad-files: fleet-state.json has exactly 2 entries', 'got ' + state.squads.length);
    fs.existsSync(outFile)
      ? pass('aggregation-reads-all-squad-files: fleet-state.json written to disk')
      : fail('aggregation-reads-all-squad-files: fleet-state.json written to disk', 'file not found');
    const parsed = readJSON(outFile);
    Array.isArray(parsed.squads)
      ? pass('aggregation-reads-all-squad-files: fleet-state.json has squads array')
      : fail('aggregation-reads-all-squad-files: fleet-state.json has squads array', 'squads not an array');
  } catch (err) {
    fail('aggregation-reads-all-squad-files', err.message);
  } finally { rmDir(tmpDir); }
}()));

asyncTests.push((async function testAggregationFetches() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  const psPath = path.join(tmpDir, 'ps.json');
  writeJSON(psPath, makePipelineState('test-plan', 'green'));
  writeJSON(path.join(squadsDir, 'sq.json'), makeSquad({ squadId: 'sq', pipelineStateUrl: psPath }));

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    const e = state.squads[0];
    e && e.stage === 'test-plan'
      ? pass('aggregation-fetches-pipeline-state-url: stage from fetched pipeline-state.json')
      : fail('aggregation-fetches-pipeline-state-url: stage from fetched pipeline-state.json', 'stage: ' + (e && e.stage));
    e && e.health === 'green'
      ? pass('aggregation-fetches-pipeline-state-url: health from fetched pipeline-state.json')
      : fail('aggregation-fetches-pipeline-state-url: health from fetched pipeline-state.json', 'health: ' + (e && e.health));
  } catch (err) {
    fail('aggregation-fetches-pipeline-state-url', err.message);
  } finally { rmDir(tmpDir); }
}()));

asyncTests.push((async function testUpdatedAt() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  const psA = path.join(tmpDir, 'ps-a.json');
  const psB = path.join(tmpDir, 'ps-b.json');
  writeJSON(psA, makePipelineState('test-plan', 'green'));
  writeJSON(psB, makePipelineState('review', 'amber'));
  writeJSON(path.join(squadsDir, 'a.json'), makeSquad({ squadId: 'a', pipelineStateUrl: psA, registeredAt: '2026-01-01T00:00:00.000Z' }));
  writeJSON(path.join(squadsDir, 'b.json'), makeSquad({ squadId: 'b', pipelineStateUrl: psB, registeredAt: '2026-01-02T00:00:00.000Z' }));

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    const allHaveUpdatedAt = state.squads.every(function(e) { return typeof e.updatedAt === 'string' && e.updatedAt.length > 0; });
    allHaveUpdatedAt
      ? pass('aggregation-updatedAt-reflects-run-time: all entries have updatedAt field')
      : fail('aggregation-updatedAt-reflects-run-time: all entries have updatedAt field', 'some missing');
    const notRegisteredAt = state.squads.every(function(e) {
      return e.updatedAt !== '2026-01-01T00:00:00.000Z' && e.updatedAt !== '2026-01-02T00:00:00.000Z';
    });
    notRegisteredAt
      ? pass('aggregation-updatedAt-reflects-run-time: updatedAt is aggregation time, not registeredAt')
      : fail('aggregation-updatedAt-reflects-run-time: updatedAt is aggregation time, not registeredAt', 'matched registeredAt');
  } catch (err) {
    fail('aggregation-updatedAt-reflects-run-time', err.message);
  } finally { rmDir(tmpDir); }
}()));

// ─────────────────────────────────────────────────────────────────────────────
// AC3: fleet-state.json structure
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[fleet-aggregation] AC3: fleet-state.json structure');

asyncTests.push((async function testFiveFields() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  const psA = path.join(tmpDir, 'a.json');
  const psB = path.join(tmpDir, 'b.json');
  writeJSON(psA, makePipelineState('test-plan', 'green'));
  writeJSON(psB, makePipelineState('review', 'amber'));
  writeJSON(path.join(squadsDir, 'a.json'), makeSquad({ squadId: 'a', pipelineStateUrl: psA }));
  writeJSON(path.join(squadsDir, 'b.json'), makeSquad({ squadId: 'b', pipelineStateUrl: psB }));

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    const required = ['squadId', 'stage', 'health', 'updatedAt', 'sourceUrl'];
    const valid = ['green', 'amber', 'red', 'unknown'];
    let ok = true;
    state.squads.forEach(function(e) {
      required.forEach(function(k) { if (!Object.prototype.hasOwnProperty.call(e, k)) ok = false; });
      if (!valid.includes(e.health)) ok = false;
    });
    ok
      ? pass('fleet-state-entry-has-all-five-fields: each entry has squadId, stage, health, updatedAt, sourceUrl')
      : fail('fleet-state-entry-has-all-five-fields: each entry has squadId, stage, health, updatedAt, sourceUrl', 'missing field or invalid health');
  } catch (err) {
    fail('fleet-state-entry-has-all-five-fields', err.message);
  } finally { rmDir(tmpDir); }
}()));

asyncTests.push((async function testSourceUrl() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  const psPath = path.join(tmpDir, 'ps.json');
  writeJSON(psPath, makePipelineState('test-plan', 'green'));
  writeJSON(path.join(squadsDir, 'sq.json'), makeSquad({ squadId: 'sq', pipelineStateUrl: psPath }));

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    const e = state.squads[0];
    e && e.sourceUrl === psPath
      ? pass('fleet-state-sourceUrl-matches-pipelineStateUrl: sourceUrl verbatim matches pipelineStateUrl')
      : fail('fleet-state-sourceUrl-matches-pipelineStateUrl: sourceUrl verbatim matches pipelineStateUrl',
          'expected "' + psPath + '" got "' + (e && e.sourceUrl) + '"');
  } catch (err) {
    fail('fleet-state-sourceUrl-matches-pipelineStateUrl', err.message);
  } finally { rmDir(tmpDir); }
}()));

// ─────────────────────────────────────────────────────────────────────────────
// AC4: registry_mode filtering
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[fleet-aggregation] AC4: registry_mode filtering');

asyncTests.push((async function testPublishingIncluded() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  const psPath = path.join(tmpDir, 'ps.json');
  writeJSON(psPath, makePipelineState('test-plan', 'green'));
  writeJSON(path.join(squadsDir, 'sq.json'), makeSquad({ squadId: 'sq-pub', registry_mode: 'publishing', pipelineStateUrl: psPath }));

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    const e = state.squads.find(function(s) { return s.squadId === 'sq-pub'; });
    e
      ? pass('registry-mode-publishing-included: registry_mode:publishing squad in fleet-state.json')
      : fail('registry-mode-publishing-included: registry_mode:publishing squad in fleet-state.json', 'not found');
  } catch (err) {
    fail('registry-mode-publishing-included', err.message);
  } finally { rmDir(tmpDir); }
}()));

asyncTests.push((async function testNoneExcluded() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  writeJSON(path.join(squadsDir, 'sq.json'), makeSquad({ squadId: 'sq-none', registry_mode: 'none', pipelineStateUrl: 'https://example.com/none' }));

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    const e = state.squads.find(function(s) { return s.squadId === 'sq-none'; });
    !e
      ? pass('registry-mode-none-excluded: registry_mode:none squad absent from fleet-state.json')
      : fail('registry-mode-none-excluded: registry_mode:none squad absent from fleet-state.json', 'unexpectedly found');
  } catch (err) {
    fail('registry-mode-none-excluded', err.message);
  } finally { rmDir(tmpDir); }
}()));

asyncTests.push((async function testAbsentExcluded() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  const sq = makeSquad({ squadId: 'sq-no-mode', pipelineStateUrl: 'https://example.com/nomode' });
  delete sq.registry_mode;
  writeJSON(path.join(squadsDir, 'sq.json'), sq);

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    const e = state.squads.find(function(s) { return s.squadId === 'sq-no-mode'; });
    !e
      ? pass('registry-mode-absent-excluded: squad with no registry_mode absent from fleet-state.json')
      : fail('registry-mode-absent-excluded: squad with no registry_mode absent from fleet-state.json', 'unexpectedly found');
  } catch (err) {
    fail('registry-mode-absent-excluded', err.message);
  } finally { rmDir(tmpDir); }
}()));

// ─────────────────────────────────────────────────────────────────────────────
// AC6: Graceful degradation
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[fleet-aggregation] AC6: Graceful degradation');

asyncTests.push((async function testUnreachableHealthUnknown() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  writeJSON(path.join(squadsDir, 'sq.json'), makeSquad({ squadId: 'sq-bad', pipelineStateUrl: 'https://example.invalid/nope' }));

  const stubFetch = function() {
    return Promise.resolve({ stage: 'unknown', health: 'unknown', error: 'HTTP 404' });
  };

  try {
    const state = await aggregateFleet(squadsDir, outFile, { fetchFn: stubFetch });
    const e = state.squads.find(function(s) { return s.squadId === 'sq-bad'; });
    e && e.health === 'unknown'
      ? pass('unreachable-url-health-unknown-error-field: unreachable squad has health:"unknown"')
      : fail('unreachable-url-health-unknown-error-field: unreachable squad has health:"unknown"', 'health: ' + (e && e.health));
    e && typeof e.error === 'string' && e.error.length > 0
      ? pass('unreachable-url-health-unknown-error-field: unreachable squad has non-empty error field')
      : fail('unreachable-url-health-unknown-error-field: unreachable squad has non-empty error field', 'error: ' + (e && e.error));
  } catch (err) {
    fail('unreachable-url-health-unknown-error-field', err.message);
  } finally { rmDir(tmpDir); }
}()));

asyncTests.push((async function testJobContinues() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  writeJSON(path.join(squadsDir, 'ok1.json'), makeSquad({ squadId: 'ok1', pipelineStateUrl: 'https://example.com/ok1' }));
  writeJSON(path.join(squadsDir, 'ok2.json'), makeSquad({ squadId: 'ok2', pipelineStateUrl: 'https://example.com/ok2' }));
  writeJSON(path.join(squadsDir, 'bad.json'), makeSquad({ squadId: 'bad', pipelineStateUrl: 'https://example.invalid/nope' }));

  const stubFetch = function(url) {
    return url.includes('invalid')
      ? Promise.resolve({ stage: 'unknown', health: 'unknown', error: 'HTTP 404' })
      : Promise.resolve({ stage: 'test-plan', health: 'green' });
  };

  try {
    const state = await aggregateFleet(squadsDir, outFile, { fetchFn: stubFetch });
    state.squads.length === 3
      ? pass('unreachable-url-job-continues-reachable-appear: 3 entries (job did not abort)')
      : fail('unreachable-url-job-continues-reachable-appear: 3 entries (job did not abort)', 'got ' + state.squads.length);
    const ok1 = state.squads.find(function(s) { return s.squadId === 'ok1'; });
    const ok2 = state.squads.find(function(s) { return s.squadId === 'ok2'; });
    ok1 && ok1.health === 'green' && ok2 && ok2.health === 'green'
      ? pass('unreachable-url-job-continues-reachable-appear: reachable squads have live health')
      : fail('unreachable-url-job-continues-reachable-appear: reachable squads have live health', 'ok1:' + (ok1 && ok1.health) + ' ok2:' + (ok2 && ok2.health));
    const bad = state.squads.find(function(s) { return s.squadId === 'bad'; });
    bad && bad.health === 'unknown' && bad.error
      ? pass('unreachable-url-job-continues-reachable-appear: unreachable squad has health:"unknown" + error')
      : fail('unreachable-url-job-continues-reachable-appear: unreachable squad has health:"unknown" + error', 'bad:' + JSON.stringify(bad));
  } catch (err) {
    fail('unreachable-url-job-continues-reachable-appear', err.message);
  } finally { rmDir(tmpDir); }
}()));

// Integration: three squads, one unreachable local path
asyncTests.push((async function testPartialIntegration() {
  const tmpDir    = mkTmpDir();
  const outFile   = path.join(tmpDir, 'fleet-state.json');
  const squadsDir = path.join(tmpDir, 'squads');
  fs.mkdirSync(squadsDir);

  const ps1 = path.join(tmpDir, 'ps1.json');
  const ps2 = path.join(tmpDir, 'ps2.json');
  writeJSON(ps1, makePipelineState('review', 'amber'));
  writeJSON(ps2, makePipelineState('definition', 'green'));

  writeJSON(path.join(squadsDir, 'sq1.json'), makeSquad({ squadId: 'sq1', pipelineStateUrl: ps1 }));
  writeJSON(path.join(squadsDir, 'sq2.json'), makeSquad({ squadId: 'sq2', pipelineStateUrl: ps2 }));
  writeJSON(path.join(squadsDir, 'sq3.json'), makeSquad({ squadId: 'sq3', pipelineStateUrl: path.join(tmpDir, 'nonexistent.json') }));

  try {
    const state = await aggregateFleet(squadsDir, outFile);
    state.squads.length === 3
      ? pass('partial-fleet-state-three-squads-one-unreachable: 3 entries in fleet-state.json')
      : fail('partial-fleet-state-three-squads-one-unreachable: 3 entries in fleet-state.json', 'got ' + state.squads.length);
    const sq1 = state.squads.find(function(s) { return s.squadId === 'sq1'; });
    const sq2 = state.squads.find(function(s) { return s.squadId === 'sq2'; });
    sq1 && sq1.health === 'amber' && sq2 && sq2.health === 'green'
      ? pass('partial-fleet-state-three-squads-one-unreachable: reachable squads have live health values')
      : fail('partial-fleet-state-three-squads-one-unreachable: reachable squads have live health values', 'sq1:' + (sq1 && sq1.health) + ' sq2:' + (sq2 && sq2.health));
    const sq3 = state.squads.find(function(s) { return s.squadId === 'sq3'; });
    sq3 && sq3.health === 'unknown' && typeof sq3.error === 'string' && sq3.error.length > 0
      ? pass('partial-fleet-state-three-squads-one-unreachable: unreachable squad has health:"unknown" + error')
      : fail('partial-fleet-state-three-squads-one-unreachable: unreachable squad has health:"unknown" + error', 'sq3:' + JSON.stringify(sq3));
  } catch (err) {
    fail('partial-fleet-state-three-squads-one-unreachable', err.message);
  } finally { rmDir(tmpDir); }
}()));

// ─────────────────────────────────────────────────────────────────────────────
// NFR: Security — MC-SEC-02 (synchronous)
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[fleet-aggregation] NFR: Security (MC-SEC-02)');

(function() {
  const credPatterns = [
    /password/i, /secret/i, /\btoken\b/i, /api[_-]?key/i, /access[_-]?key/i,
    /private[_-]?key/i, /credentials/i, /\bbearer\b/i,
  ];

  const schemaPath = path.join(root, '.github', 'pipeline-state.schema.json');
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
    pass('fleet-files-no-credential-fields: schema file is valid JSON');
  } catch (err) {
    fail('fleet-files-no-credential-fields: schema file is valid JSON', err.message);
    return;
  }

  const defs = schema.$defs || {};
  const squadProps  = Object.keys((defs.fleetSquad       && defs.fleetSquad.properties)      || {});
  const entryProps  = Object.keys((defs.fleetStateEntry  && defs.fleetStateEntry.properties)  || {});
  const allProps    = squadProps.concat(entryProps);

  const credField = allProps.find(function(p) {
    return credPatterns.some(function(re) { return re.test(p); });
  });
  credField
    ? fail('fleet-files-no-credential-fields: no credential-like field in fleet schemas', 'found: ' + credField)
    : pass('fleet-files-no-credential-fields: no credential-like field in fleet schemas');

  const squadsDir = path.join(root, 'fleet', 'squads');
  if (fs.existsSync(squadsDir)) {
    let credFound = null;
    for (const file of fs.readdirSync(squadsDir).filter(function(f) { return f.endsWith('.json'); })) {
      const text = fs.readFileSync(path.join(squadsDir, file), 'utf8');
      for (const re of credPatterns) {
        if (re.test(text)) { credFound = file + ' matches /' + re.source + '/'; break; }
      }
      if (credFound) break;
    }
    credFound
      ? fail('fleet-files-no-credential-fields: no credential patterns in fleet/squads/ files', credFound)
      : pass('fleet-files-no-credential-fields: no credential patterns in fleet/squads/ files');
  }
}());

// ─────────────────────────────────────────────────────────────────────────────
// Schema registration (ADR-003) — synchronous
// ─────────────────────────────────────────────────────────────────────────────

console.log('\n[fleet-aggregation] Schema registration (ADR-003)');

(function() {
  const schemaPath = path.join(root, '.github', 'pipeline-state.schema.json');
  let schema;
  try {
    schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  } catch (err) {
    fail('schema-fleet-squad-registered', err.message);
    return;
  }

  const defs = schema.$defs || {};

  defs.fleetSquad
    ? pass('schema-fleet-squad-registered: $defs.fleetSquad in pipeline-state.schema.json')
    : fail('schema-fleet-squad-registered: $defs.fleetSquad in pipeline-state.schema.json', 'not found');

  const reqSquad = (defs.fleetSquad && defs.fleetSquad.required) || [];
  ['squadId', 'repoUrl', 'pipelineStateUrl', 'registeredAt'].every(function(f) { return reqSquad.includes(f); })
    ? pass('schema-fleet-squad-registered: fleetSquad required fields present')
    : fail('schema-fleet-squad-registered: fleetSquad required fields present', 'got: ' + reqSquad.join(', '));

  defs.fleetStateEntry
    ? pass('schema-fleet-state-entry-registered: $defs.fleetStateEntry in pipeline-state.schema.json')
    : fail('schema-fleet-state-entry-registered: $defs.fleetStateEntry in pipeline-state.schema.json', 'not found');

  const reqEntry = (defs.fleetStateEntry && defs.fleetStateEntry.required) || [];
  ['squadId', 'stage', 'health', 'updatedAt', 'sourceUrl'].every(function(f) { return reqEntry.includes(f); })
    ? pass('schema-fleet-state-entry-registered: fleetStateEntry required fields present')
    : fail('schema-fleet-state-entry-registered: fleetStateEntry required fields present', 'got: ' + reqEntry.join(', '));

  defs.fleetState
    ? pass('schema-fleet-state-registered: $defs.fleetState in pipeline-state.schema.json')
    : fail('schema-fleet-state-registered: $defs.fleetState in pipeline-state.schema.json', 'not found');
}());

// ─────────────────────────────────────────────────────────────────────────────
// Print results once all async tests complete
// ─────────────────────────────────────────────────────────────────────────────

Promise.all(asyncTests).then(function() {
  process.stdout.write('\n[fleet-aggregation] Results: ' + passed + ' passed, ' + failed + ' failed\n');
  if (failures.length > 0) {
    process.stdout.write('[fleet-aggregation] Failures:\n');
    failures.forEach(function(f) {
      process.stdout.write('  \u2717 ' + f.name + '\n');
      process.stdout.write('    \u2192 ' + f.reason + '\n');
    });
    process.exit(1);
  }
}).catch(function(err) {
  process.stderr.write('[fleet-aggregation] Unexpected error: ' + err.message + '\n');
  process.exit(1);
});
