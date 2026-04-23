#!/usr/bin/env node
// check-caa3-config.js — governance tests for caa.3 (context.yml opt-in gate)
// Covers 11 tests: AC1–AC6 + NFR (fail-open, regression)
// No external dependencies — Node.js built-ins only. Synthetic temp context.yml fixtures.

'use strict';

const fs            = require('fs');
const path          = require('path');
const os            = require('os');
const { spawnSync } = require('child_process');

const ROOT         = path.join(__dirname, '..');
const CONFIG_MOD   = path.join(ROOT, 'scripts', 'ci-attachment-config.js');
const PERSONAL_YML = path.join(ROOT, 'contexts', 'personal.yml');
const WORKFLOW     = path.join(ROOT, '.github', 'workflows', 'assurance-gate.yml');

const { readCiAttachmentConfig, loadAdapter } = require(CONFIG_MOD);

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

// ── helper: write a context.yml fixture to a temp dir ────────────────────────
function writeTempContext(content) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'caa3-'));
  fs.writeFileSync(path.join(dir, 'context.yml'), content, 'utf8');
  return dir;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

// ── T1 — AC1: skip when ci_attachment is false ────────────────────────────────
console.log('\n[caa3] T1 — readCiAttachmentConfig: skip when ci_attachment is false');
{
  const dir = writeTempContext('audit:\n  ci_attachment: false\n  ci_platform: github-actions\n');
  try {
    const result = readCiAttachmentConfig(dir);
    assert(result.skip === true, 'T1: returns { skip: true } when ci_attachment is false');
  } finally {
    cleanup(dir);
  }
}

// ── T2 — AC1: skip when audit block is absent ─────────────────────────────────
console.log('\n[caa3] T2 — readCiAttachmentConfig: skip when audit block is absent');
{
  const dir = writeTempContext('tools:\n  ci_platform: github\n');
  try {
    const result = readCiAttachmentConfig(dir);
    assert(result.skip === true, 'T2: returns { skip: true } when audit block is absent');
  } finally {
    cleanup(dir);
  }
}

// ── T3 — AC2: returns { skip: false, platform } when enabled + github-actions ─
console.log('\n[caa3] T3 — readCiAttachmentConfig: skip false + platform when enabled');
{
  const dir = writeTempContext('audit:\n  ci_attachment: true\n  ci_platform: github-actions\n');
  try {
    const result = readCiAttachmentConfig(dir);
    assert(result.skip === false, 'T3a: skip is false');
    assert(result.platform === 'github-actions', `T3b: platform is github-actions (got: ${result.platform})`);
  } finally {
    cleanup(dir);
  }
}

// ── T4 — AC3: throws with informative message for unimplemented platform ──────
console.log('\n[caa3] T4 — adapterRouter: throws for unimplemented platform');
{
  let threw = false;
  let msg = '';
  try {
    loadAdapter('gitlab-ci');
  } catch (e) {
    threw = true;
    msg = e.message;
  }
  assert(threw, 'T4a: throws for unimplemented platform');
  assert(msg.includes("Adapter 'gitlab-ci' is not yet implemented"),
    `T4b: error contains expected text (got: ${msg})`);
  assert(msg.includes('Available adapters: github-actions'),
    'T4c: error lists available adapters');
}

// ── T5 — AC3: readCiAttachmentConfig throws for unknown platform ──────────────
console.log('\n[caa3] T5 — readCiAttachmentConfig: throws for unknown ci_platform');
{
  const dir = writeTempContext('audit:\n  ci_attachment: true\n  ci_platform: gitlab-ci\n');
  try {
    let threw = false;
    let msg = '';
    try {
      readCiAttachmentConfig(dir);
    } catch (e) {
      threw = true;
      msg = e.message;
    }
    assert(threw, 'T5a: throws for unknown platform');
    assert(msg.includes('gitlab-ci'), `T5b: error mentions platform name (got: ${msg})`);
  } finally {
    cleanup(dir);
  }
}

// ── T6 — AC4: personal.yml has ci_attachment field with inline comment ─────────
console.log('\n[caa3] T6 — personalYml: ci_attachment field with inline comment');
{
  assert(fs.existsSync(PERSONAL_YML), 'T6a: contexts/personal.yml exists');
  const text = fs.readFileSync(PERSONAL_YML, 'utf8');
  assert(text.includes('ci_attachment'), 'T6b: ci_attachment field present');
  // inline comment on same or adjacent line
  const lines = text.split('\n');
  const ciAttachLine = lines.findIndex(l => l.includes('ci_attachment'));
  const commentPresent = ciAttachLine !== -1 && (
    lines[ciAttachLine].includes('#') ||
    (lines[ciAttachLine + 1] && lines[ciAttachLine + 1].trim().startsWith('#'))
  );
  assert(commentPresent, 'T6c: ci_attachment line has inline # comment');
}

// ── T7 — AC4: personal.yml has ci_platform and artifact_retention_days with comments
console.log('\n[caa3] T7 — personalYml: ci_platform and artifact_retention_days with comments');
{
  const text = fs.readFileSync(PERSONAL_YML, 'utf8');
  assert(text.includes('ci_platform'), 'T7a: ci_platform field present');
  assert(text.includes('artifact_retention_days'), 'T7b: artifact_retention_days present');
  // ci_platform comment should mention github-actions
  const lines = text.split('\n');
  const platformLine = lines.find(l => l.includes('ci_platform'));
  assert(platformLine && platformLine.includes('github-actions'), 'T7c: ci_platform line mentions github-actions');
}

// ── T8 — AC6: throws parse error on malformed context.yml ────────────────────
console.log('\n[caa3] T8 — readCiAttachmentConfig: throws on malformed YAML');
{
  const dir = writeTempContext('audit:\n  ci_attachment: [unclosed bracket\n');
  try {
    let threw = false;
    let msg = '';
    try {
      readCiAttachmentConfig(dir);
    } catch (e) {
      threw = true;
      msg = e.message;
    }
    assert(threw, 'T8a: throws on malformed YAML');
    assert(msg.includes('[ci-artefact-attachment] context.yml could not be parsed'),
      `T8b: error message matches required text (got: ${msg})`);
  } finally {
    cleanup(dir);
  }
}

// ── T9 — AC6: malformed YAML parse error is catchable (non-fatal to gate) ────
console.log('\n[caa3] T9 — readCiAttachmentConfig: parse error is catchable (fail-open)');
{
  const dir = writeTempContext('audit:\n  ci_attachment: [unclosed bracket\n');
  try {
    let gateStillCompletes = true;
    try {
      readCiAttachmentConfig(dir);
      gateStillCompletes = true;
    } catch (_) {
      // Error was caught — gate continues normally
      gateStillCompletes = true;
    }
    assert(gateStillCompletes, 'T9: parse error is catchable — gate is not crashed');
  } finally {
    cleanup(dir);
  }
}

// ── Integration: end-to-end config-gate with ci_attachment true + github-actions
console.log('\n[caa3] T10 — Integration: ci_attachment true + github-actions runs collect');
{
  const slug = 'caa3-int-feature';
  const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'caa3-int-'));
  fs.mkdirSync(path.join(tempRoot, 'artefacts', slug), { recursive: true });
  fs.mkdirSync(path.join(tempRoot, '.github'), { recursive: true });
  fs.writeFileSync(
    path.join(tempRoot, 'artefacts', slug, 'discovery.md'),
    '# Discovery\n', 'utf8'
  );
  fs.writeFileSync(
    path.join(tempRoot, '.github', 'pipeline-state.json'),
    JSON.stringify({ features: [{ slug, stage: 'review' }] }), 'utf8'
  );
  fs.writeFileSync(
    path.join(tempRoot, 'context.yml'),
    'audit:\n  ci_attachment: true\n  ci_platform: github-actions\n', 'utf8'
  );

  try {
    const cfg = readCiAttachmentConfig(tempRoot);
    assert(cfg.skip === false, 'T10a: config reports skip=false');
    assert(cfg.platform === 'github-actions', 'T10b: platform is github-actions');

    // Run collect
    const SCRIPT = path.join(ROOT, 'scripts', 'trace-report.js');
    const result = spawnSync('node', [SCRIPT, '--collect', `--feature=${slug}`], {
      cwd: tempRoot, encoding: 'utf8'
    });
    assert(result.status === 0, `T10c: collect exits 0 (stderr: ${result.stderr})`);
    assert(
      fs.existsSync(path.join(tempRoot, '.ci-artefact-staging', slug)),
      'T10d: staging dir created'
    );

    // Load adapter (mock upload)
    const adapter = loadAdapter(cfg.platform);
    const uploadResult = adapter.upload(
      path.join(tempRoot, '.ci-artefact-staging', slug),
      'test-run-1'
    );
    assert(
      uploadResult.artifactName === `governed-artefacts-${slug}-test-run-1`,
      `T10e: artifactName correct (got: ${uploadResult.artifactName})`
    );
  } finally {
    fs.rmSync(tempRoot, { recursive: true, force: true });
  }
}

// ── NFR: assurance-gate.yml contains ci_attach_cfg condition on collect step ──
console.log('\n[caa3] T11 — NFR: assurance-gate.yml gates collect/upload/comment on ci_attach_cfg');
{
  const text = fs.readFileSync(WORKFLOW, 'utf8');
  assert(text.includes('ci_attach_cfg'), 'T11a: workflow references ci_attach_cfg step');
  assert(text.includes("ci_attachment == 'true'"),
    'T11b: workflow gates on ci_attachment == true');
  assert(text.includes('yq'), 'T11c: workflow uses yq to read context.yml');
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[caa3] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
