'use strict';
// itar-s4: handoff to short-track pipeline + post-fix confirmation.
// Tests drive the REAL CLIs (scripts/handoff-incident.js, scripts/confirm-incident-fix.js)
// as child processes against temp files, plus the library functions they call.
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const ROOT = path.join(__dirname, '..');
const HANDOFF_CLI = path.join(ROOT, 'scripts', 'handoff-incident.js');
const CONFIRM_CLI = path.join(ROOT, 'scripts', 'confirm-incident-fix.js');
const REAL_INCIDENTS = path.join(ROOT, 'workspace', 'incidents.json');

let passed = 0;
let failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ✓ ' + name); }
  catch (err) { failed++; console.log('  ✗ ' + name + ': ' + err.message); }
}

const realHashBefore = crypto.createHash('sha256').update(fs.readFileSync(REAL_INCIDENTS)).digest('hex');

const tmpDirs = [];
function tmpDir() {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'itar-s4-'));
  tmpDirs.push(d);
  return d;
}

function incident(over) {
  return Object.assign({
    id: 'inc-1', type: 'incident', trigger: 'tenant_admin_bootstrap_failed',
    summary: 's', tags: ['bootstrap'], priorIncidentLinks: ['inc-0'], status: 'open',
    triageSummary: 'What\'s known: prior incident inc-0. Suggested next step: review inc-0 triage notes.',
    confirmationStatus: null, createdAt: '2026-11-01T00:00:00.000Z', updatedAt: '2026-11-01T00:00:00.000Z'
  }, over || {});
}

function setup(records, state) {
  const d = tmpDir();
  const file = path.join(d, 'incidents.json');
  fs.writeFileSync(file, JSON.stringify(records, null, 2) + '\n');
  const ps = path.join(d, 'pipeline-state.json');
  if (state) fs.writeFileSync(ps, JSON.stringify(state));
  return { d, file, ps, art: path.join(d, 'artefacts') };
}

function stateWith(story, nested) {
  return nested
    ? { features: [{ slug: 'f', epics: [{ slug: 'e', stories: [story] }], stories: [] }] }
    : { features: [{ slug: 'f', stories: [story] }] };
}

function run(cli, args) {
  return spawnSync(process.execPath, [cli].concat(args), { encoding: 'utf8' });
}
function read(file) { return JSON.parse(fs.readFileSync(file, 'utf8')); }

// ---------------- AC1: handoff ----------------

test('linkIncidentToStory_setsLinkedStorySlug_whenHandoffOccurs (real CLI)', () => {
  const s = setup([incident()]);
  const r = run(HANDOFF_CLI, ['--incident', 'inc-1', '--story', 'fix-bootstrap', '--file', s.file, '--artefacts-dir', s.art]);
  assert.strictEqual(r.status, 0, r.stderr);
  const rec = read(s.file)[0];
  assert.strictEqual(rec.linkedStory, 'fix-bootstrap');
  assert.ok(rec.handoffAt);
});

test('attachTriageContextToStoryHandoff_includesKnownAndNextStep (real CLI writes context file)', () => {
  const s = setup([incident()]);
  const r = run(HANDOFF_CLI, ['--incident', 'inc-1', '--story', 'fix-bootstrap', '--file', s.file, '--artefacts-dir', s.art]);
  assert.strictEqual(r.status, 0, r.stderr);
  const ctx = fs.readFileSync(path.join(s.art, 'fix-bootstrap', 'incident-handoff.md'), 'utf8');
  assert.ok(ctx.includes('What\'s known: prior incident inc-0'));
  assert.ok(ctx.includes('Suggested next step: review inc-0 triage notes'));
  assert.ok(ctx.includes('inc-1') && ctx.includes('inc-0'));
  assert.ok(r.stdout.includes('fix-bootstrap'));
});

test('handoff_rejectsUnsafeSlug_andWritesNothing', () => {
  const s = setup([incident()]);
  const before = fs.readFileSync(s.file, 'utf8');
  const r = run(HANDOFF_CLI, ['--incident', 'inc-1', '--story', '../evil', '--file', s.file, '--artefacts-dir', s.art]);
  assert.strictEqual(r.status, 1);
  assert.strictEqual(fs.readFileSync(s.file, 'utf8'), before);
  assert.ok(!fs.existsSync(path.join(s.d, 'evil')));
  assert.ok(!fs.existsSync(s.art));
});

test('handoff_rejectsMissingTriageSummary_unknownId_andAlreadyLinked', () => {
  const s = setup([incident({ triageSummary: null }), incident({ id: 'inc-2', linkedStory: 'x' })]);
  const before = fs.readFileSync(s.file, 'utf8');
  for (const id of ['inc-1', 'nope', 'inc-2']) {
    const r = run(HANDOFF_CLI, ['--incident', id, '--story', 'fix-a', '--file', s.file, '--artefacts-dir', s.art]);
    assert.strictEqual(r.status, 1, id);
  }
  assert.strictEqual(fs.readFileSync(s.file, 'utf8'), before);
});

test('handoff_neverTouchesDeferredItemRecord', () => {
  const def = { id: 'd-1', type: 'deferred-item', trigger: 't', summary: '', tags: ['bootstrap'], status: 'open', triageSummary: 'x', source: 'src' };
  const s = setup([def, incident()]);
  const r = run(HANDOFF_CLI, ['--incident', 'd-1', '--story', 'fix-a', '--file', s.file, '--artefacts-dir', s.art]);
  assert.strictEqual(r.status, 1);
  assert.deepStrictEqual(read(s.file)[0], def);
  const r2 = run(HANDOFF_CLI, ['--incident', 'inc-1', '--story', 'fix-a', '--file', s.file, '--artefacts-dir', s.art]);
  assert.strictEqual(r2.status, 0, r2.stderr);
  assert.deepStrictEqual(read(s.file)[0], def);
});

// ---------------- AC2: branch selection ----------------

const doneStory = { id: 'fix-bootstrap', slug: 'fix-bootstrap', dodStatus: 'complete' };

test('postFixCheck_selectsAutomatedPath_whenDetectionExistsForTriggeringCheck (library)', () => {
  const { postFixCheck } = require('../scripts/lib/incident-handoff');
  let called = 0;
  const res = postFixCheck(incident({ linkedStory: 'fix-bootstrap' }), {
    registry: { tenant_admin_bootstrap_failed: () => { called++; return true; } }
  });
  assert.strictEqual(res.confirmationMethod, 'automated');
  assert.strictEqual(res.result, 'pass');
  assert.strictEqual(called, 1);
});

test('postFixCheck_selectsManualPath_whenNoAutomatedDetectionExistsForTriggeringCheck (library)', () => {
  const { postFixCheck } = require('../scripts/lib/incident-handoff');
  const res = postFixCheck(incident({ linkedStory: 'fix-bootstrap' }), { registry: {} });
  assert.strictEqual(res.confirmationMethod, 'manual');
  assert.strictEqual(res.result, null);
  assert.ok(/confirm/i.test(res.prompt));
  const res2 = postFixCheck(incident(), { registry: {}, manualResult: 'fail' });
  assert.strictEqual(res2.confirmationMethod, 'manual');
  assert.strictEqual(res2.result, 'fail');
});

test('confirm CLI manual branch: no --result prompts, exits 2, changes nothing', () => {
  const s = setup([incident({ linkedStory: 'fix-bootstrap' })], stateWith(doneStory));
  const before = fs.readFileSync(s.file, 'utf8');
  const r = run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps]);
  assert.strictEqual(r.status, 2, r.stderr + r.stdout);
  assert.ok(/manual/i.test(r.stdout) && r.stdout.includes('--result'));
  assert.strictEqual(fs.readFileSync(s.file, 'utf8'), before);
});

test('confirm CLI refuses when linked story is not dodStatus complete', () => {
  const s = setup([incident({ linkedStory: 'fix-bootstrap' })], stateWith({ id: 'fix-bootstrap', dodStatus: 'not-started' }));
  const before = fs.readFileSync(s.file, 'utf8');
  const r = run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'pass']);
  assert.strictEqual(r.status, 1);
  assert.strictEqual(fs.readFileSync(s.file, 'utf8'), before);
});

test('confirm CLI refuses an incident with no linked story, an unknown id, and a bad --result', () => {
  const s = setup([incident(), incident({ id: 'inc-2', linkedStory: 'fix-bootstrap' })], stateWith(doneStory));
  assert.strictEqual(run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'pass']).status, 1);
  assert.strictEqual(run(CONFIRM_CLI, ['--incident', 'zzz', '--file', s.file, '--pipeline-state', s.ps, '--result', 'pass']).status, 1);
  assert.strictEqual(run(CONFIRM_CLI, ['--incident', 'inc-2', '--file', s.file, '--pipeline-state', s.ps, '--result', 'maybe']).status, 1);
  assert.strictEqual(read(s.file)[1].confirmationStatus, null);
});

// ---------------- AC3 ----------------

test('updateIncidentConfirmationStatus_setsConfirmed_whenCheckPasses (real CLI, manual)', () => {
  const s = setup([incident({ linkedStory: 'fix-bootstrap' })], stateWith(doneStory));
  const r = run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'pass']);
  assert.strictEqual(r.status, 0, r.stderr);
  const rec = read(s.file)[0];
  assert.strictEqual(rec.confirmationStatus, 'confirmed');
  assert.strictEqual(rec.confirmationMethod, 'manual');
  assert.strictEqual(rec.status, 'confirmed');
});

test('updateIncidentConfirmationStatus_setsNotConfirmed_whenCheckFails (real CLI, manual)', () => {
  const s = setup([incident({ linkedStory: 'fix-bootstrap' })], stateWith(doneStory));
  const r = run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'fail']);
  assert.strictEqual(r.status, 0, r.stderr);
  assert.strictEqual(read(s.file)[0].confirmationStatus, 'not-confirmed');
});

test('automated branch end to end via real CLI --registry (pass and fail), epic-nested story', () => {
  const s = setup([incident({ linkedStory: 'fix-bootstrap' }), incident({ id: 'inc-2', trigger: 'other', linkedStory: 'fix-bootstrap' })], stateWith(doneStory, true));
  const reg = path.join(s.d, 'registry.js');
  fs.writeFileSync(reg, 'module.exports = { tenant_admin_bootstrap_failed: () => true, other: () => false };\n');
  const a = run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--registry', reg]);
  assert.strictEqual(a.status, 0, a.stderr);
  const b = run(CONFIRM_CLI, ['--incident', 'inc-2', '--file', s.file, '--pipeline-state', s.ps, '--registry', reg]);
  assert.strictEqual(b.status, 0, b.stderr);
  const recs = read(s.file);
  assert.strictEqual(recs[0].confirmationMethod, 'automated');
  assert.strictEqual(recs[0].confirmationStatus, 'confirmed');
  assert.strictEqual(recs[1].confirmationMethod, 'automated');
  assert.strictEqual(recs[1].confirmationStatus, 'not-confirmed');
});

test('postFixConfirmation_triggersAndChangesIncidentStatus_whenLinkedStoryReachesDodComplete (full flow: handoff then confirm)', () => {
  const s = setup([incident()], stateWith(doneStory));
  assert.strictEqual(run(HANDOFF_CLI, ['--incident', 'inc-1', '--story', 'fix-bootstrap', '--file', s.file, '--artefacts-dir', s.art]).status, 0);
  const pre = read(s.file)[0].status;
  assert.strictEqual(run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'pass']).status, 0);
  const rec = read(s.file)[0];
  assert.notStrictEqual(rec.status, pre);
  assert.ok(['confirmed', 'flagged'].indexOf(rec.status) >= 0);
  assert.ok(['confirmed', 'not-confirmed'].indexOf(rec.confirmationStatus) >= 0);
});

// ---------------- AC4 ----------------

test('updateIncidentConfirmationStatus_keepsRecordOpenAndLogsAttempt_whenNotConfirmed', () => {
  const s = setup([incident({ linkedStory: 'fix-bootstrap' })], stateWith(doneStory));
  assert.strictEqual(run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'fail']).status, 0);
  const rec = read(s.file)[0];
  assert.notStrictEqual(rec.status, 'closed');
  assert.ok(['open', 'flagged'].indexOf(rec.status) >= 0);
  assert.strictEqual(rec.fixAttempts.length, 1);
  assert.strictEqual(rec.fixAttempts[0].story, 'fix-bootstrap');
  assert.strictEqual(rec.fixAttempts[0].outcome, 'tried-but-unsuccessful');
  // a later successful re-check does not drop the logged failed attempt
  assert.strictEqual(run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'pass']).status, 0);
  const rec2 = read(s.file)[0];
  assert.strictEqual(rec2.confirmationStatus, 'confirmed');
  assert.strictEqual(rec2.fixAttempts.length, 2);
});

test('confirm refuses to re-confirm an already confirmed incident', () => {
  const s = setup([incident({ linkedStory: 'fix-bootstrap', confirmationStatus: 'confirmed', status: 'confirmed' })], stateWith(doneStory));
  assert.strictEqual(run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'fail']).status, 1);
  assert.strictEqual(read(s.file)[0].confirmationStatus, 'confirmed');
});

test('confirm_neverTouchesDeferredItemRecord', () => {
  const def = { id: 'd-1', type: 'deferred-item', trigger: 't', tags: [], status: 'open', source: 's', linkedStory: 'fix-bootstrap', confirmationStatus: null };
  const s = setup([def], stateWith(doneStory));
  const r = run(CONFIRM_CLI, ['--incident', 'd-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'pass']);
  assert.strictEqual(r.status, 1);
  assert.deepStrictEqual(read(s.file)[0], def);
});

// ---------------- NFR audit ----------------

test('NFR-AUDIT-1: confirmedAt timestamp set when confirmationStatus changes', () => {
  const s = setup([incident({ linkedStory: 'fix-bootstrap' })], stateWith(doneStory));
  const t0 = Date.now();
  assert.strictEqual(run(CONFIRM_CLI, ['--incident', 'inc-1', '--file', s.file, '--pipeline-state', s.ps, '--result', 'pass']).status, 0);
  const rec = read(s.file)[0];
  assert.ok(Date.parse(rec.confirmedAt) >= t0 - 1000);
  assert.ok(Date.parse(rec.updatedAt) >= t0 - 1000);
});

// ---------------- wiring / real file ----------------

test('documented CLI flags exist in script source', () => {
  const h = fs.readFileSync(HANDOFF_CLI, 'utf8');
  const c = fs.readFileSync(CONFIRM_CLI, 'utf8');
  ['--incident', '--story', '--file', '--artefacts-dir'].forEach((f) => assert.ok(h.includes(f), 'handoff ' + f));
  ['--incident', '--file', '--pipeline-state', '--result', '--registry'].forEach((f) => assert.ok(c.includes(f), 'confirm ' + f));
});

test('real workspace/incidents.json untouched by this test file', () => {
  const after = crypto.createHash('sha256').update(fs.readFileSync(REAL_INCIDENTS)).digest('hex');
  assert.strictEqual(after, realHashBefore);
});

tmpDirs.forEach((d) => { try { fs.rmSync(d, { recursive: true, force: true }); } catch (e) { /* ignore */ } });
console.log('\n' + passed + ' passed, ' + failed + ' failed');
if (failed > 0) process.exit(1);
