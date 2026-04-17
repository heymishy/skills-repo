'use strict';

// check-spc1-config-schema.js
// Governs spc.1: instrumentation block schema in contexts/personal.yml
// Tests T1–T6 from artefacts/2026-04-18-skill-performance-capture/test-plans/spc.1-test-plan.md
// Plain Node.js — no external dependencies.

const fs = require('fs');
const path = require('path');

const PERSONAL_YML = path.join(__dirname, '..', 'contexts', 'personal.yml');
const REQUIRED_FIELDS = ['enabled', 'experiment_id', 'model_label', 'cost_tier'];

let passed = 0;
let failed = 0;

function pass(label) {
  console.log(`  [PASS] ${label}`);
  passed++;
}

function fail(label, detail) {
  console.error(`  [FAIL] ${label}${detail ? ' — ' + detail : ''}`);
  failed++;
}

// ── Load file ───────────────────────────────────────────────────────────────

let raw;
try {
  raw = fs.readFileSync(PERSONAL_YML, 'utf8');
} catch (e) {
  console.error(`[spc1-config-schema] Cannot read ${PERSONAL_YML}: ${e.message}`);
  process.exit(1);
}

const lines = raw.split('\n');

// ── Extract the instrumentation block (lines indented after 'instrumentation:') ──

function extractInstrumentationBlock(lines) {
  let startIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (/^instrumentation\s*:/.test(lines[i])) {
      startIdx = i;
      break;
    }
  }
  if (startIdx === -1) return null;

  const block = {};
  for (let i = startIdx + 1; i < lines.length; i++) {
    const line = lines[i].replace(/\r$/, ''); // strip Windows CRLF
    // Stop at a non-indented non-empty non-comment line (next top-level key)
    if (line.length > 0 && !/^\s/.test(line) && !/^#/.test(line)) break;
    // Match indented key: value lines (2+ spaces, then key: value)
    const m = line.match(/^\s{2,}(\w+)\s*:\s*(.*?)(?:\s*#.*)?$/);
    if (m) {
      let val = m[2].trim();
      // Parse booleans and empty strings
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      else if (val === '' || val === '""' || val === "''") val = '';
      else val = val.replace(/^["']|["']$/g, ''); // strip surrounding quotes
      block[m[1]] = val;
    }
  }
  return block;
}

// ── T1: instrumentation block present ───────────────────────────────────────

const hasInstrumentationKey = lines.some(l => /^instrumentation\s*:/.test(l));
if (!hasInstrumentationKey) {
  fail('T1 instrumentation block present', 'instrumentation: key not found in file');
  console.log(`\n[spc1-config-schema] 0 passed, 1 failed`);
  process.exit(1);
}
pass('T1 instrumentation block present');

const block = extractInstrumentationBlock(lines);
if (!block || Object.keys(block).length === 0) {
  fail('T1 instrumentation block has fields', 'block parsed but no key: value pairs found');
}

// ── T2: All 4 required field names present ───────────────────────────────────

const missingFields = REQUIRED_FIELDS.filter(f => !(f in block));
if (missingFields.length === 0) {
  pass('T2 all required fields present (enabled, experiment_id, model_label, cost_tier)');
} else {
  fail('T2 all required fields present', `missing fields: ${missingFields.join(', ')}`);
}

// ── T3: Block parseable with all 4 fields (re-extract and verify) ────────────

const reBlock = extractInstrumentationBlock(raw.split('\n'));
if (reBlock && REQUIRED_FIELDS.every(f => f in reBlock)) {
  pass('T3 block parseable with all 4 fields');
} else {
  fail('T3 block parseable with all 4 fields', 'one or more required fields absent after re-extraction');
}

// ── T4: experiment_id is detectable (empty/undefined is fine, must not throw) ─

try {
  const expId = block['experiment_id'];
  // undefined, null, or empty string are all valid template defaults
  pass(`T4 experiment_id detectable without throw (value: ${JSON.stringify(expId !== undefined ? expId : null)})`);
} catch (e) {
  fail('T4 experiment_id detectable', `access threw: ${e.message}`);
}

// ── T5: enabled is false (template must ship disabled) ───────────────────────

const enabledValue = block['enabled'];
if (enabledValue === false || enabledValue === 'false') {
  pass('T5 enabled: false (template default is inactive)');
} else {
  fail('T5 enabled: false', `enabled is ${JSON.stringify(enabledValue)} — template must ship with enabled: false`);
}

// ── T6: Workflow documentation comment present near the block ────────────────

const hasWorkflowComment = raw.includes('workspace/experiments/') || raw.includes('To activate');
if (hasWorkflowComment) {
  pass('T6 workflow documentation comment present near instrumentation block');
} else {
  fail('T6 workflow documentation comment present', 'no reference to workspace/experiments/ or "To activate" found');
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n[spc1-config-schema] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);

