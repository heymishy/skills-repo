'use strict';

// check-spc4-experiment-structure.js
// Governs spc.4: workspace/experiments/README.md structure
// Tests T1–T9 from artefacts/2026-04-18-skill-performance-capture/test-plans/spc.4-test-plan.md
// Plain Node.js — no external dependencies.

const fs = require('fs');
const path = require('path');

const README_PATH = path.join(__dirname, '..', 'workspace', 'experiments', 'README.md');

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
  raw = fs.readFileSync(README_PATH, 'utf8');
} catch (e) {
  console.error(`[spc4-experiment-structure] Cannot read ${README_PATH}: ${e.message}`);
  process.exit(1);
}

// ── T1: [experiment-id]/ directory naming convention documented ──────────────

if (raw.includes('[experiment-id]')) {
  pass('T1 [experiment-id]/ directory naming convention documented');
} else {
  fail('T1 [experiment-id]/ directory naming convention documented');
}

// ── T2: manifest.md reference present ───────────────────────────────────────

if (raw.includes('manifest.md')) {
  pass('T2 manifest.md referenced in README');
} else {
  fail('T2 manifest.md referenced in README');
}

// ── T3: Per-model-run subdirectory documented ────────────────────────────────

if (/per.model.run/i.test(raw) || raw.includes('[model-label]') || /one subdirectory per model run/i.test(raw)) {
  pass('T3 per-model-run subdirectory structure documented');
} else {
  fail('T3 per-model-run subdirectory structure documented', 'no mention of per-run subdirectory pattern');
}

// ── T4: artefacts/ subfolder documented ─────────────────────────────────────

if (raw.includes('artefacts/')) {
  pass('T4 artefacts/ subfolder documented');
} else {
  fail('T4 artefacts/ subfolder documented');
}

// ── T5: manifest template contains experiment_id ────────────────────────────

if (raw.includes('experiment_id')) {
  pass('T5 manifest template contains experiment_id');
} else {
  fail('T5 manifest template contains experiment_id');
}

// ── T6: manifest template contains scenario_description ─────────────────────

if (raw.includes('scenario_description')) {
  pass('T6 manifest template contains scenario_description');
} else {
  fail('T6 manifest template contains scenario_description');
}

// ── T7: manifest template contains runs[] array with model_label, run_date, artefact_paths, cost_tier ──

const MANIFEST_FIELDS = ['runs', 'model_label', 'run_date', 'artefact_paths', 'cost_tier'];
const missingManifest = MANIFEST_FIELDS.filter(f => !raw.includes(f));
if (missingManifest.length === 0) {
  pass('T7 manifest template contains runs[], model_label, run_date, artefact_paths, cost_tier');
} else {
  fail('T7 manifest template runs fields', `missing: ${missingManifest.join(', ')}`);
}

// ── T8: Credential warning comment in manifest template ─────────────────────

if (raw.toLowerCase().includes('mc-sec-02') || raw.toLowerCase().includes('no api key') || raw.toLowerCase().includes('no credentials')) {
  pass('T8 credential warning comment present in manifest template');
} else {
  fail('T8 credential warning comment present in manifest template', 'no MC-SEC-02 or credential warning found');
}

// ── T9: Three-way consistency note (experiment_id in dir, context.yml, capture blocks) ──

if (/three.way/i.test(raw) || (raw.includes('experiment_id') && raw.includes('context.yml') && raw.includes('Capture Block'))) {
  pass('T9 three-way consistency note (experiment_id must match dir, context.yml, capture blocks)');
} else {
  fail('T9 three-way consistency note', 'no reference to three-way sync of experiment_id');
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n[spc4-experiment-structure] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
