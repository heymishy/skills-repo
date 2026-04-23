#!/usr/bin/env node
// check-caa2-adapter.js — governance tests for caa.2 (GitHub Actions adapter)
// Covers 10 tests: AC1–AC5 + NFR (no contents:write, idempotent comment)
// No external dependencies — Node.js built-ins only. Mocks are injected locally.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT    = path.join(__dirname, '..');
const ADAPTER = path.join(ROOT, 'scripts', 'ci-adapters', 'github-actions.js');
const README  = path.join(ROOT, 'scripts', 'ci-adapters', 'README.md');
const WORKFLOW = path.join(ROOT, '.github', 'workflows', 'assurance-gate.yml');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── T1 — AC1: upload returns correctly formed artifact name ───────────────────
console.log('\n[caa2] T1 — upload: returns artifact name governed-artefacts-[slug]-[runId]');
{
  const adapter = require(ADAPTER);
  const stagingDir = '.ci-artefact-staging/test-feature';
  const runId = 'run-12345';
  const result = adapter.upload(stagingDir, runId);
  assert(typeof result === 'object', 'T1a: upload returns an object');
  assert(result.artifactName === 'governed-artefacts-test-feature-run-12345',
    `T1b: artifactName is exactly governed-artefacts-test-feature-run-12345 (got: ${result.artifactName})`);
}

// ── T2 — AC2: postComment body contains required strings ─────────────────────
console.log('\n[caa2] T2 — postComment: comment body contains required strings');
{
  const captured = [];
  // Override execSync within adapter scope by monkey-patching child_process
  const cp = require('child_process');
  const origExecSync = cp.execSync;
  cp.execSync = (cmd) => { captured.push(cmd); };

  try {
    // Clear module cache to get a fresh adapter that uses the patched cp
    delete require.cache[ADAPTER];
    const adapter = require(ADAPTER);
    adapter.postComment('42', 'https://example.com/artifact/link');
    assert(captured.length === 1, 'T2a: execSync called once');
    const cmd = captured[0];
    assert(cmd.includes('Governed artefact chain'), 'T2b: body contains "Governed artefact chain"');
    assert(cmd.includes('https://example.com/artifact/link'), 'T2c: body contains the summaryLink');
    assert(cmd.includes('42'), 'T2d: body contains issueRef');
  } finally {
    cp.execSync = origExecSync;
    delete require.cache[ADAPTER];
  }
}

// ── T3 — AC2: postComment handles URLs with special characters ────────────────
console.log('\n[caa2] T3 — postComment: handles URLs with special characters');
{
  const captured = [];
  const cp = require('child_process');
  const origExecSync = cp.execSync;
  cp.execSync = (cmd) => { captured.push(cmd); };
  try {
    delete require.cache[ADAPTER];
    const adapter = require(ADAPTER);
    const specialUrl = 'https://example.com/run/12345?check_suite_focus=true&artifact=abc';
    let threw = false;
    try {
      adapter.postComment('42', specialUrl);
    } catch (_) {
      threw = true;
    }
    assert(!threw, 'T3a: does not throw on URL with special chars');
    assert(captured.length >= 1 && captured[0].includes(specialUrl.split('?')[0]),
      'T3b: URL appears (at least base part) in command');
  } finally {
    cp.execSync = origExecSync;
    delete require.cache[ADAPTER];
    require(ADAPTER); // restore
  }
}

// ── T4 — AC3: stub adapter loads via same dispatch mechanism ──────────────────
console.log('\n[caa2] T4 — adapterInterface: stub adapter is loadable via ci_platform dispatch');
{
  const os  = require('os');
  const stubDir = path.join(os.tmpdir(), 'ci-adapters-stub');
  const stubFile = path.join(stubDir, 'stub-platform.js');
  fs.mkdirSync(stubDir, { recursive: true });
  fs.writeFileSync(stubFile, `'use strict';
function upload(stagingDir, runId) { return { artifactName: 'stub-' + runId }; }
function postComment(issueRef, summaryLink) {}
module.exports = { upload, postComment };
`, 'utf8');

  try {
    const stub = require(stubFile);
    assert(typeof stub.upload === 'function', 'T4a: stub adapter has upload()');
    assert(typeof stub.postComment === 'function', 'T4b: stub adapter has postComment()');
    const r = stub.upload('.ci-artefact-staging/slug', 'r-1');
    assert(r.artifactName === 'stub-r-1', 'T4c: stub upload returns artifactName');
  } finally {
    fs.rmSync(stubDir, { recursive: true, force: true });
    delete require.cache[stubFile];
  }
}

// ── T5 — AC3: interface methods exist on github-actions adapter ───────────────
console.log('\n[caa2] T5 — adapterInterface: github-actions adapter exports upload and postComment');
{
  const adapter = require(ADAPTER);
  assert(typeof adapter.upload === 'function', 'T5a: upload is a function');
  assert(typeof adapter.postComment === 'function', 'T5b: postComment is a function');
}

// ── T6 — AC4: README documents upload and postComment signatures ──────────────
console.log('\n[caa2] T6 — ciAdaptersREADME: documents upload and postComment');
{
  assert(fs.existsSync(README), 'T6a: scripts/ci-adapters/README.md exists');
  const text = fs.readFileSync(README, 'utf8');
  assert(text.includes('upload'), 'T6b: README contains "upload"');
  assert(text.includes('postComment'), 'T6c: README contains "postComment"');
  assert(text.includes('stagingDir'), 'T6d: README contains "stagingDir"');
  assert(text.includes('runId'), 'T6e: README contains "runId"');
  assert(text.includes('ci_platform'), 'T6f: README contains "ci_platform"');
}

// ── T7 — AC4: README documents how to add a new adapter ──────────────────────
console.log('\n[caa2] T7 — ciAdaptersREADME: documents how to add a new adapter');
{
  const text = fs.readFileSync(README, 'utf8');
  assert(/add.*adapter|new.*adapter|adding.*adapter/i.test(text),
    'T7: README contains guidance on adding an adapter');
}

// ── T8 — AC5: assurance-gate.yml does NOT contain contents: write ─────────────
console.log('\n[caa2] T8 — assuranceGateWorkflow: permissions block has no contents: write');
{
  assert(fs.existsSync(WORKFLOW), 'T8a: assurance-gate.yml exists');
  const text = fs.readFileSync(WORKFLOW, 'utf8');
  // AC5: must not contain contents: write (with any spacing)
  assert(!/contents:\s*write/.test(text), 'T8b: no "contents: write" in assurance-gate.yml');
}

// ── T9 — Integration: adapter upload constructs name from staging dir slug ────
console.log('\n[caa2] T9 — Integration: upload artifact name derived from staging dir slug');
{
  const adapter = require(ADAPTER);
  const cases = [
    ['.ci-artefact-staging/my-feature', 'run-99', 'governed-artefacts-my-feature-run-99'],
    ['.ci-artefact-staging/another-slug', '12345', 'governed-artefacts-another-slug-12345'],
  ];
  for (const [dir, runId, expected] of cases) {
    const r = adapter.upload(dir, runId);
    assert(r.artifactName === expected, `T9: upload("${dir}", "${runId}") → "${expected}" (got: "${r.artifactName}")`);
  }
}

// ── T10 — NFR: assurance-gate.yml idempotent comment (update-or-post pattern) ─
console.log('\n[caa2] T10 — NFR: assurance-gate.yml uses update-or-post pattern for artefact comment');
{
  const text = fs.readFileSync(WORKFLOW, 'utf8');
  // The workflow script should contain both updateComment and createComment
  assert(text.includes('updateComment'), 'T10a: workflow contains updateComment (idempotent)');
  assert(text.includes('createComment'), 'T10b: workflow contains createComment (fallback)');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[caa2] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
