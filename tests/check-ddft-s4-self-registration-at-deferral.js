'use strict';
// ddft-s4: self-registration at the moment of deferral.
//
// Mechanical enforcement model: the three SKILL.md "State update" sections
// instruct the agent to run `node scripts/register-deferral.js --hook <name>`.
// A SKILL.md is prose an AI agent follows, so these tests prove the two
// mechanical halves: (1) each SKILL.md really references the script with the
// right hook name inside its State-update section, and (2) running that exact
// script (the real CLI, as a child process) writes a valid deferred-item record.
//
// Every write uses a temp file via --file; the real workspace/incidents.json
// is only ever fingerprinted, never written (NFR).
//
// AC5: each hook has its own independent test group below, no shared mutable
// fixtures; run a single group with: node tests/<this file> <discovery|decisions|dod>
const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const REPO = path.join(__dirname, '..');
const REAL_FILE = path.join(REPO, 'workspace', 'incidents.json');
const CLI = path.join(REPO, 'scripts', 'register-deferral.js');
const store = require('../scripts/lib/incident-store');

const only = process.argv[2] || null;
let passed = 0;
let failed = 0;

function test(group, name, fn) {
  if (only && only !== group) return;
  try {
    fn();
    passed++;
    console.log('  ✓ [' + group + '] ' + name);
  } catch (err) {
    failed++;
    console.log('  ✗ [' + group + '] ' + name + ': ' + err.message);
  }
}

function tmpName(label, ext) {
  return path.join(os.tmpdir(), 'ddft-s4-' + label + '-' + Date.now() + '-' + Math.random().toString(36).slice(2) + ext);
}

function fingerprint() {
  if (!fs.existsSync(REAL_FILE)) return 'absent';
  return crypto.createHash('sha256').update(fs.readFileSync(REAL_FILE)).digest('hex');
}

function runCli(args) {
  return spawnSync(process.execPath, [CLI].concat(args), { cwd: REPO, encoding: 'utf8' });
}

function skillText(name) {
  return fs.readFileSync(path.join(REPO, 'skills', name, 'SKILL.md'), 'utf8');
}

// The text of a skill's "## State update ... mandatory final step" section.
function stateUpdateSection(name) {
  const text = skillText(name);
  const m = /^## State update\s+[-—]\s+mandatory final step[\s\S]*$/m.exec(text);
  assert.ok(m, name + ' SKILL.md has no State update section');
  return m[0];
}

const before = fingerprint();
const hooks = require('../scripts/lib/deferral-hooks');

console.log('[ddft-s4] self-registration at the moment of deferral');

// ---- shared mapping (unit) -------------------------------------------------

test('unit', 'mapsEachHookContextToCorrectSourceValue', () => {
  const d = hooks.buildRecords('discovery-out-of-scope', { feature: 'f', outOfScopeItems: ['Auto-closing items'] });
  const r = hooks.buildRecords('risk-accept', { feature: 'f', decisionRef: '2026-11-09 | RISK-ACCEPT | review', summary: 's', revisitCondition: 'rc' });
  const u = hooks.buildRecords('unmeasured-benefit-metric', { feature: 'f', story: 'x-s1', metric: 'M1', evidence: 'No telemetry yet' });
  assert.deepStrictEqual(d.map((x) => x.source), ['discovery-out-of-scope']);
  assert.deepStrictEqual(r.map((x) => x.source), ['risk-accept']);
  assert.deepStrictEqual(u.map((x) => x.source), ['unmeasured-benefit-metric']);
  [d[0], r[0], u[0]].forEach((x) => assert.strictEqual(x.type, 'deferred-item'));
  assert.throws(() => hooks.buildRecords('benefit-metric', {}), /Unknown hook/);
});

test('unit', 'discoveryOutOfScopeParserReadsBulletsAndNumberedItems', () => {
  const md = '# D\n\n## Out of Scope\n\n- First thing - reason\n2. Second thing\n1. **Third** thing\n\n## Assumptions\n\n- not this\n';
  assert.deepStrictEqual(hooks.parseOutOfScope(md), ['First thing - reason', 'Second thing', '**Third** thing']);
  assert.deepStrictEqual(hooks.parseOutOfScope('# D\n\n## Assumptions\n- x\n'), []);
});

// ---- AC1: discovery ----------------------------------------------------------

test('discovery', 'skillStateUpdateSectionInvokesRegisterScriptWithDiscoveryHook', () => {
  const s = stateUpdateSection('discovery');
  assert.ok(s.indexOf('scripts/register-deferral.js') !== -1, 'script not referenced in State update section');
  assert.ok(s.indexOf('--hook discovery-out-of-scope') !== -1, 'hook name missing');
  assert.ok(s.indexOf('--artefact') !== -1, 'artefact flag missing');
});

test('discovery', 'discoveryHookAutoRegistersRecordOnOutOfScopeCompletion', () => {
  const art = tmpName('disc', '.md');
  const file = tmpName('disc', '.json');
  fs.writeFileSync(art, '# Discovery: X\n\n## Out of Scope\n\n- Item A - because reasons\n- Item B - because other reasons\n\n## Assumptions\n\n- unrelated\n');
  const res = runCli(['--hook', 'discovery-out-of-scope', '--artefact', art, '--feature', '2026-11-12-x', '--file', file]);
  assert.strictEqual(res.status, 0, res.stderr);
  const recs = store.loadRecords(file);
  assert.strictEqual(recs.length, 2);
  recs.forEach((r) => {
    assert.strictEqual(r.type, 'deferred-item');
    assert.strictEqual(r.source, 'discovery-out-of-scope');
    assert.strictEqual(r.linkedFeature, '2026-11-12-x');
    assert.doesNotThrow(() => store.validateRecord(r));
  });
  assert.ok(recs[0].summary.indexOf('Item A') !== -1);
  assert.ok(recs[1].summary.indexOf('Item B') !== -1);
  fs.unlinkSync(art);
  fs.unlinkSync(file);
});

test('discovery', 'discoveryHookWritesNothingWhenOutOfScopeAbsent', () => {
  const art = tmpName('disc-empty', '.md');
  const file = tmpName('disc-empty', '.json');
  fs.writeFileSync(art, '# Discovery: X\n\n## Assumptions\n\n- a\n');
  const res = runCli(['--hook', 'discovery-out-of-scope', '--artefact', art, '--feature', 'f', '--file', file]);
  assert.strictEqual(res.status, 0, res.stderr);
  assert.strictEqual(fs.existsSync(file), false);
  fs.unlinkSync(art);
});

// ---- AC2: decisions ------------------------------------------------------------

test('decisions', 'skillStateUpdateSectionInvokesRegisterScriptWithRiskAcceptHook', () => {
  const s = stateUpdateSection('decisions');
  assert.ok(s.indexOf('scripts/register-deferral.js') !== -1, 'script not referenced in State update section');
  assert.ok(s.indexOf('--hook risk-accept') !== -1, 'hook name missing');
  assert.ok(s.indexOf('--decision-ref') !== -1, 'decision-ref flag missing');
});

test('decisions', 'decisionsHookAutoRegistersRecordOnRiskAcceptCompletion', () => {
  const file = tmpName('dec', '.json');
  const ref = '2026-11-12 | RISK-ACCEPT | definition-of-ready';
  const res = runCli(['--hook', 'risk-accept', '--decision-ref', ref, '--summary', 'W4 verification script not independently reviewed',
    '--revisit', 'When a second reviewer joins the project', '--feature', '2026-11-12-x', '--story', 'x-s1', '--file', file]);
  assert.strictEqual(res.status, 0, res.stderr);
  const recs = store.loadRecords(file);
  assert.strictEqual(recs.length, 1);
  assert.strictEqual(recs[0].type, 'deferred-item');
  assert.strictEqual(recs[0].source, 'risk-accept');
  assert.ok(recs[0].trigger.indexOf(ref) !== -1, 'record must link to the decision entry');
  assert.strictEqual(recs[0].revisitCondition, 'When a second reviewer joins the project');
  assert.strictEqual(recs[0].linkedStory, 'x-s1');
  fs.unlinkSync(file);
});

test('decisions', 'riskAcceptHookRejectsMissingDecisionRefAndWritesNothing', () => {
  const file = tmpName('dec-bad', '.json');
  const res = runCli(['--hook', 'risk-accept', '--summary', 's', '--file', file]);
  assert.notStrictEqual(res.status, 0);
  assert.strictEqual(fs.existsSync(file), false);
});

// ---- AC3: definition-of-done ---------------------------------------------------

test('dod', 'skillStep6AndStateUpdateInvokeRegisterScriptWithUnmeasuredHook', () => {
  const s = stateUpdateSection('definition-of-done');
  assert.ok(s.indexOf('scripts/register-deferral.js') !== -1, 'script not referenced in State update section');
  assert.ok(s.indexOf('--hook unmeasured-benefit-metric') !== -1, 'hook name missing');
  assert.ok(s.indexOf('--metric') !== -1 && s.indexOf('--evidence') !== -1, 'metric/evidence flags missing');
  assert.ok(/Step 6/.test(s), 'State update section must tie the hook to Step 6 not-yet-measured signals');
});

test('dod', 'benefitMetricSkillIsNotHooked', () => {
  assert.ok(skillText('benefit-metric').indexOf('register-deferral') === -1);
});

test('dod', 'definitionOfDoneHookAutoRegistersRecordOnNotYetMeasuredSignal', () => {
  const file = tmpName('dod', '.json');
  const note = 'Telemetry too sparse to compute this metric as of 2026-11-09';
  const res = runCli(['--hook', 'unmeasured-benefit-metric', '--metric', 'Self-registration coverage', '--evidence', note,
    '--feature', '2026-11-08-deferred-decision-follow-through', '--story', 'ddft-s4', '--file', file]);
  assert.strictEqual(res.status, 0, res.stderr);
  const recs = store.loadRecords(file);
  assert.strictEqual(recs.length, 1);
  assert.strictEqual(recs[0].type, 'deferred-item');
  assert.strictEqual(recs[0].source, 'unmeasured-benefit-metric');
  assert.ok(recs[0].revisitCondition.indexOf('Self-registration coverage') !== -1);
  assert.ok(recs[0].revisitCondition.indexOf(note) !== -1);
  assert.strictEqual(recs[0].linkedStory, 'ddft-s4');
  fs.unlinkSync(file);
});

test('dod', 'unmeasuredHookRejectsBlankOrNAEvidence', () => {
  ['', 'N/A'].forEach((ev) => {
    const file = tmpName('dod-bad', '.json');
    const res = runCli(['--hook', 'unmeasured-benefit-metric', '--metric', 'M', '--evidence', ev, '--file', file]);
    assert.notStrictEqual(res.status, 0);
    assert.strictEqual(fs.existsSync(file), false);
  });
});

// ---- AC4: single shared mechanism ---------------------------------------------

test('shared', 'allThreeHooksWriteThroughSingleSharedMechanism', () => {
  const file = tmpName('all', '.json');
  const art = tmpName('all', '.md');
  fs.writeFileSync(art, '## Out of Scope\n\n- One deferral\n');
  assert.strictEqual(runCli(['--hook', 'discovery-out-of-scope', '--artefact', art, '--feature', 'f', '--file', file]).status, 0);
  assert.strictEqual(runCli(['--hook', 'risk-accept', '--decision-ref', 'ref', '--summary', 's', '--file', file]).status, 0);
  assert.strictEqual(runCli(['--hook', 'unmeasured-benefit-metric', '--metric', 'M', '--evidence', 'real note', '--file', file]).status, 0);
  const recs = store.loadRecords(file);
  assert.deepStrictEqual(recs.map((r) => r.source), ['discovery-out-of-scope', 'risk-accept', 'unmeasured-benefit-metric']);
  fs.unlinkSync(file);
  fs.unlinkSync(art);
});

test('shared', 'libWritesOnlyViaIncidentStoreAndInventsNoStoragePath', () => {
  const src = fs.readFileSync(path.join(REPO, 'scripts', 'lib', 'deferral-hooks.js'), 'utf8');
  assert.ok(src.indexOf("require('./incident-store')") !== -1);
  assert.ok(src.indexOf('appendIncidentRecord') !== -1);
  assert.ok(!/writeFileSync|appendFileSync/.test(src), 'hook lib must not write files itself');
  assert.ok(src.indexOf('incidents.json') !== -1, 'default path must be workspace/incidents.json');
});

test('shared', 'cliWithoutFileFlagTargetsRealWorkspaceFileByDefault', () => {
  // Proven without writing: the default resolves to workspace/incidents.json.
  assert.strictEqual(hooks.DEFAULT_FILE, path.join(REPO, 'workspace', 'incidents.json'));
});

test('shared', 'unknownHookRejected', () => {
  const file = tmpName('unk', '.json');
  const res = runCli(['--hook', 'benefit-metric', '--file', file]);
  assert.notStrictEqual(res.status, 0);
  assert.strictEqual(fs.existsSync(file), false);
});

test('shared', 'realIncidentsFileWasNotModifiedByThisRun', () => {
  assert.strictEqual(fingerprint(), before);
});

console.log('\n[ddft-s4] Results: ' + passed + ' passed, ' + failed + ' failed');
process.exit(failed > 0 ? 1 : 0);
