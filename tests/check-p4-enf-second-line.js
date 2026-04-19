#!/usr/bin/env node
// check-p4-enf-second-line.js — test plan verification for p4-enf-second-line
// Covers T1–T8 (AC1–AC3) and T-NFR1, T-NFR2
// Tests FAIL until theme-f-inputs.md is written and trace schema updated — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs            = require('fs');
const path          = require('path');
const child_process = require('child_process');
const os            = require('os');

const ROOT           = path.join(__dirname, '..');
const THEME_F_DOC    = path.join(ROOT, 'artefacts', '2026-04-19-skills-platform-phase4', 'theme-f-inputs.md');
const VALIDATE_TRACE = path.join(ROOT, 'scripts', 'validate-trace.sh');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function readDoc() {
  if (!fs.existsSync(THEME_F_DOC)) return null;
  return fs.readFileSync(THEME_F_DOC, 'utf8');
}

// ── T1 — theme-f-inputs.md exists ────────────────────────────────────────────
console.log('\n[p4-enf-second-line] T1 — theme-f-inputs.md exists at correct path');
{
  assert(fs.existsSync(THEME_F_DOC),
    'T1: artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md exists');
}

// ── T2 — CLI verification contract section with required fields ───────────────
console.log('\n[p4-enf-second-line] T2 — CLI verification contract section has all required fields');
{
  const text = readDoc();
  if (!text) {
    assert(false, 'T2: document missing');
  } else {
    const lower = text.toLowerCase();
    assert(lower.includes('cli'),
      'T2a: document contains "CLI" section');
    const REQUIRED_FIELDS = ['skillhash', 'inputhash', 'outputref', 'transitiontaken', 'surfacetype', 'timestamp'];
    for (const field of REQUIRED_FIELDS) {
      assert(lower.includes(field),
        `T2: required field "${field}" present in document`);
    }
  }
}

// ── T3 — Workflow declaration structure section present ───────────────────────
console.log('\n[p4-enf-second-line] T3 — workflow declaration structure section present');
{
  const text = readDoc();
  if (!text) {
    assert(false, 'T3: document missing');
  } else {
    const lower = text.toLowerCase();
    assert(lower.includes('workflow') && (lower.includes('declaration') || lower.includes('structure')),
      'T3: document contains "workflow declaration" or "workflow structure" section');
  }
}

// ── T4 — MCP trace contract section present ───────────────────────────────────
console.log('\n[p4-enf-second-line] T4 — MCP trace contract section present');
{
  const text = readDoc();
  if (!text) {
    assert(false, 'T4: document missing');
  } else {
    const lower = text.toLowerCase();
    assert(lower.includes('mcp'),
      'T4: document contains "MCP" section');
  }
}

// ── T5 — executorIdentity documented as optional ─────────────────────────────
console.log('\n[p4-enf-second-line] T5 — executorIdentity documented as optional');
{
  const text = readDoc();
  if (!text) {
    assert(false, 'T5: document missing');
  } else {
    const lower = text.toLowerCase();
    assert(lower.includes('executoridentity'),
      'T5a: "executorIdentity" appears in document');
    // Check that it is near "optional"
    const idx = lower.indexOf('executoridentity');
    const context = lower.slice(Math.max(0, idx - 100), idx + 200);
    assert(context.includes('optional') || context.includes('opt-in'),
      `T5b: executorIdentity is described as optional (context: "${context.substring(0, 150)}")`);
  }
}

// ── T6 — validate-trace.sh accepts trace without executorIdentity ─────────────
console.log('\n[p4-enf-second-line] T6 — validate-trace.sh accepts trace without executorIdentity');
{
  if (!fs.existsSync(VALIDATE_TRACE)) {
    assert(false, 'T6: scripts/validate-trace.sh not found');
  } else {
    // Write a minimal valid trace fixture WITHOUT executorIdentity
    const tmpDir  = fs.mkdtempSync(path.join(os.tmpdir(), 'p4-sl-trace-'));
    const tmpFile = path.join(tmpDir, 'trace.yml');
    const fixtureTrace = [
      '- skillId: test',
      '  skillHash: ' + 'a'.repeat(64),
      '  inputHash: ' + 'b'.repeat(64),
      '  outputRef: test-artefact.md',
      '  transitionTaken: discovery->definition',
      '  surfaceType: cli',
      '  timestamp: 2026-04-19T10:00:00Z',
    ].join('\n');
    fs.writeFileSync(tmpFile, fixtureTrace, 'utf8');

    let exitCode = -1;
    let stderr   = '';
    try {
      const result = child_process.spawnSync('bash', [VALIDATE_TRACE, '--ci', tmpFile], {
        encoding: 'utf8',
        timeout:  15000,
      });
      exitCode = result.status;
      stderr   = result.stderr || '';
    } catch (e) {
      stderr = e.message;
    }
    fs.rmSync(tmpDir, { recursive: true, force: true });

    if (exitCode === -1) {
      // bash not available (Windows without WSL) — skip gracefully
      console.log('  - T6: skipped (bash not available on this platform — validate manually)');
      passed++;
    } else {
      assert(exitCode === 0,
        `T6: validate-trace.sh exits 0 for trace without executorIdentity (exit: ${exitCode}, stderr: ${stderr.substring(0, 120)})`);
    }
  }
}

// ── T7 — Phase 4 / Theme F boundary section present ─────────────────────────
console.log('\n[p4-enf-second-line] T7 — Phase 4 / Theme F boundary section present');
{
  const text = readDoc();
  if (!text) {
    assert(false, 'T7: document missing');
  } else {
    const lower = text.toLowerCase();
    assert(
      lower.includes('boundary') ||
      (lower.includes('theme f') && lower.includes('scope')) ||
      lower.includes('phase 4') && lower.includes('theme f'),
      'T7: document contains Phase 4 / Theme F boundary section'
    );
  }
}

// ── T8 — Theme F items named out of scope with Q4 reference ──────────────────
console.log('\n[p4-enf-second-line] T8 — Theme F items named out of scope; Q4 decision cited');
{
  const text = readDoc();
  if (!text) {
    assert(false, 'T8: document missing');
  } else {
    const lower = text.toLowerCase();
    // At least one Theme F deliverable named as out of scope
    const themeF = ['dual-authority', 'rbnz', 'second-line governance', 'approval routing'];
    const foundThemeF = themeF.filter(t => lower.includes(t));
    assert(foundThemeF.length >= 1,
      `T8a: at least one Theme F deliverable named (found: ${foundThemeF.join(', ') || 'none'})`);
    // Craig's Q4 reference
    assert(lower.includes('q4') || lower.includes("craig's q4") || lower.includes("craig's clarification"),
      'T8b: Q4 or Craig\'s Q4 decision cited');
  }
}

// ── T-NFR1 — No credentials in document ──────────────────────────────────────
console.log('\n[p4-enf-second-line] T-NFR1 — no credentials in theme-f-inputs.md');
{
  const text = readDoc();
  if (!text) {
    assert(false, 'T-NFR1: document missing');
  } else {
    const lower = text.toLowerCase();
    assert(!lower.includes('bearer '),       'T-NFR1a: no Bearer token');
    assert(!/password\s*[:=]/.test(lower),   'T-NFR1b: no password assignment');
    assert(!/secret\s*[:=]/.test(lower),     'T-NFR1c: no secret assignment');
    assert(!lower.includes('api_key'),        'T-NFR1d: no api_key');
    assert(!lower.includes('tenantid'),       'T-NFR1e: no tenantId');
  }
}

// ── T-NFR2 — executorIdentity optional in trace JSON schema ──────────────────
console.log('\n[p4-enf-second-line] T-NFR2 — executorIdentity is NOT in the "required" array of trace schema');
{
  // Find the trace schema file — it may be in scripts/ or src/trace-registry/ etc.
  const SCHEMA_CANDIDATES = [
    path.join(ROOT, 'scripts', 'trace-schema.json'),
    path.join(ROOT, 'scripts', 'trace-schema.yml'),
    path.join(ROOT, 'src', 'trace-registry', 'schema.json'),
    path.join(ROOT, 'src', 'trace-registry', 'trace-schema.json'),
    path.join(ROOT, '.github', 'trace-schema.json'),
  ];

  let schemaFile = null;
  for (const candidate of SCHEMA_CANDIDATES) {
    if (fs.existsSync(candidate)) { schemaFile = candidate; break; }
  }

  // Also search for any JSON file containing "executorIdentity"
  if (!schemaFile) {
    // Quick scan of scripts/ directory
    const scriptsDir = path.join(ROOT, 'scripts');
    if (fs.existsSync(scriptsDir)) {
      for (const file of fs.readdirSync(scriptsDir)) {
        if (file.endsWith('.json') || file.endsWith('.yml') || file.endsWith('.yaml')) {
          const fp = path.join(scriptsDir, file);
          const content = fs.readFileSync(fp, 'utf8');
          if (content.includes('executorIdentity') || content.includes('skillHash')) {
            schemaFile = fp;
            break;
          }
        }
      }
    }
  }

  if (!schemaFile) {
    assert(false, 'T-NFR2: trace schema file not found — schema must be updated to make executorIdentity optional');
  } else {
    let schema = null;
    try { schema = JSON.parse(fs.readFileSync(schemaFile, 'utf8')); } catch (_) {}
    if (!schema) {
      // YAML or non-JSON — just do a text scan
      const text = fs.readFileSync(schemaFile, 'utf8');
      // If executorIdentity appears in a required block, that is a failure
      const inRequired = /required[^:]*:[^[]*\[([^\]]*)\]/.exec(text);
      if (inRequired && inRequired[1].includes('executorIdentity')) {
        assert(false, 'T-NFR2: executorIdentity found in "required" array in trace schema');
      } else {
        assert(true, 'T-NFR2: executorIdentity not in required array (text-based check)');
      }
    } else {
      const required = schema.required || (schema.properties && schema.properties.required) || [];
      assert(!required.includes('executorIdentity'),
        `T-NFR2: executorIdentity NOT in schema required array (required: ${JSON.stringify(required)})`);
    }
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-enf-second-line] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
