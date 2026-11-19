#!/usr/bin/env node
// check-ctk-s1-cli-track.js -- AC verification for ctk-s1
// (skills init writes a valid `track`; skills advance rejects a `track` the schema does not allow).
// Every case runs against a throwaway repo root in the OS temp directory; the real state file is never touched.
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(__dirname, '..');
const BIN = path.join(root, 'bin', 'skills');
const init = require('../src/enforcement/cli-init').init;
const advance = require('../src/enforcement/cli-advance').advance;

const schema = JSON.parse(fs.readFileSync(path.join(root, '.github', 'pipeline-state.schema.json'), 'utf8'));
const featureSchema = schema.properties.features.items;
const ALLOWED = featureSchema.properties.track.enum;
const REQUIRED = featureSchema.required;

let passed = 0;
let failed = 0;
function ok(cond, label) {
  if (cond) { console.log('  ✓ ' + label); passed++; }
  else { console.log('  ✗ ' + label); failed++; }
}

const made = [];
function tmpRepo(features) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'ctk-s1-'));
  made.push(dir);
  fs.mkdirSync(path.join(dir, '.github'), { recursive: true });
  fs.writeFileSync(path.join(dir, '.github', 'pipeline-state.json'), JSON.stringify({ version: '1', features: features || [] }, null, 2) + '\n', 'utf8');
  return dir;
}
function readState(dir) { return fs.readFileSync(path.join(dir, '.github', 'pipeline-state.json'), 'utf8'); }
function featureOf(dir, slug) { return JSON.parse(readState(dir)).features.find(f => f.slug === slug); }

console.log('T0: the allowed values come from the schema');
ok(Array.isArray(ALLOWED) && ALLOWED.length === 4 && ALLOWED.indexOf('standard') !== -1 && ALLOWED.indexOf('short') !== -1, 'schema declares the four track values: ' + ALLOWED.join(', '));

console.log('T1 (AC1): init with no track writes standard');
{
  const dir = tmpRepo();
  const r = init('track-default', undefined, dir);
  ok(r.exitCode === 0, 'init succeeds');
  const f = featureOf(dir, 'track-default');
  ok(!!f && f.track === 'standard', "the feature has track 'standard'");
}

console.log('T2 (AC2): init with each allowed track writes that track');
for (const t of ALLOWED) {
  const dir = tmpRepo();
  const r = init('track-' + t, undefined, dir, t);
  const f = featureOf(dir, 'track-' + t);
  ok(r.exitCode === 0 && !!f && f.track === t, "track '" + t + "' is written");
}

console.log('T3 (AC3): init with an invalid track exits 1, names it, and changes nothing');
{
  const dir = tmpRepo();
  const before = readState(dir);
  const r = init('track-bogus', undefined, dir, 'bogus');
  ok(r.exitCode === 1, 'exit code is 1');
  ok(String(r.stderr).indexOf('bogus') !== -1, 'the error names bogus');
  ok(readState(dir) === before, 'the state file is unchanged');
  const viaCli = spawnSync(process.execPath, [BIN, 'init', 'track-bogus-cli', '--track', 'bogus'], { cwd: dir, encoding: 'utf8' });
  ok(viaCli.status === 1 && /bogus/.test(viaCli.stderr), 'bin/skills init --track bogus exits 1 and names it');
  ok(readState(dir) === before, 'the state file is still unchanged after the CLI call');
}

console.log('T4 (AC4): a feature written by the real CLI satisfies the schema');
{
  const dir = tmpRepo();
  const r = spawnSync(process.execPath, [BIN, 'init', 'schema-check', '--description', 'schema check', '--track', 'short'], { cwd: dir, encoding: 'utf8' });
  ok(r.status === 0, 'bin/skills init succeeds');
  const f = featureOf(dir, 'schema-check');
  ok(!!f && REQUIRED.every(k => f[k] !== undefined && f[k] !== null && f[k] !== ''), 'every required field is present: ' + REQUIRED.join(', '));
  ok(!!f && ALLOWED.indexOf(f.track) !== -1, 'its track is one the schema allows');
  const noFlag = spawnSync(process.execPath, [BIN, 'init', 'schema-default'], { cwd: dir, encoding: 'utf8' });
  const g = featureOf(dir, 'schema-default');
  ok(noFlag.status === 0 && !!g && REQUIRED.every(k => g[k] !== undefined && g[k] !== null && g[k] !== ''), 'a feature created without --track also has every required field');
}

console.log('T5 (AC5): advance rejects an invalid track, naming the field and the allowed values');
{
  const dir = tmpRepo([{ slug: 'f1', name: 'F1', track: 'standard', stage: 'discovery', health: 'green', stories: [{ id: 's1', slug: 's1', name: 'S1' }] }]);
  const before = readState(dir);
  const r = advance('f1', 's1', ['track=defect'], dir);
  ok(r.exitCode === 8, 'exit code is 8');
  ok(/track/.test(r.stderr) && ALLOWED.every(v => r.stderr.indexOf(v) !== -1), 'the error names track and lists the allowed values');
  ok(readState(dir) === before, 'the state file is unchanged');
}

console.log('T6 (AC6, baseline): advance accepts a valid track');
{
  const dir = tmpRepo([{ slug: 'f1', name: 'F1', track: 'standard', stage: 'discovery', health: 'green', stories: [{ id: 's1', slug: 's1', name: 'S1' }] }]);
  const r = advance('f1', 's1', ['track=short'], dir);
  ok(r.exitCode === 0, 'exit code is 0');
  const story = JSON.parse(readState(dir)).features[0].stories[0];
  ok(story.track === 'short', "the story now has track 'short'");
}

made.forEach(d => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (_) {} });
console.log('\n' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
