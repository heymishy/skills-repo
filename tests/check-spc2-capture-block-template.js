'use strict';

// check-spc2-capture-block-template.js
// Governs spc.2: .github/templates/capture-block.md structure
// Tests T1–T12 from artefacts/2026-04-18-skill-performance-capture/test-plans/spc.2-test-plan.md
// Plain Node.js — no external dependencies.

const fs = require('fs');
const path = require('path');

const TEMPLATE_PATH = path.join(__dirname, '..', '.github', 'templates', 'capture-block.md');

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
  raw = fs.readFileSync(TEMPLATE_PATH, 'utf8');
} catch (e) {
  console.error(`[spc2-capture-block-template] Cannot read ${TEMPLATE_PATH}: ${e.message}`);
  process.exit(1);
}

// ── T1: ## Capture Block heading present ────────────────────────────────────

if (/^## Capture Block/m.test(raw)) {
  pass('T1 ## Capture Block heading present');
} else {
  fail('T1 ## Capture Block heading present', 'heading not found');
}

// ── T2–T7: Metadata table contains all 6 required fields ────────────────────

const METADATA_FIELDS = ['experiment_id', 'model_label', 'cost_tier', 'skill_name', 'artefact_path', 'run_timestamp'];
const missingMeta = METADATA_FIELDS.filter(f => !raw.includes(f));
if (missingMeta.length === 0) {
  pass('T2-T7 metadata table contains all 6 required fields');
} else {
  fail('T2-T7 metadata table contains all 6 required fields', `missing: ${missingMeta.join(', ')}`);
}

// ── T8: Structural metrics section contains turn_count ───────────────────────

if (raw.includes('turn_count')) {
  pass('T8 structural metrics: turn_count present');
} else {
  fail('T8 structural metrics: turn_count present');
}

// ── T9: Structural metrics section contains files_referenced ─────────────────

if (raw.includes('files_referenced')) {
  pass('T9 structural metrics: files_referenced present');
} else {
  fail('T9 structural metrics: files_referenced present');
}

// ── T10: Structural metrics contains constraints_inferred_count ───────────────

if (raw.includes('constraints_inferred_count')) {
  pass('T10 structural metrics: constraints_inferred_count present');
} else {
  fail('T10 structural metrics: constraints_inferred_count present');
}

// ── T11: intermediates_prescribed and intermediates_produced present ──────────

if (raw.includes('intermediates_prescribed') && raw.includes('intermediates_produced')) {
  pass('T11 structural metrics: intermediates_prescribed and intermediates_produced present');
} else {
  fail('T11 structural metrics: intermediates_prescribed/produced present', 'one or both missing');
}

// ── T12a: Fidelity self-report section present ────────────────────────────────

if (/fidelity self-report/i.test(raw)) {
  pass('T12a fidelity self-report section present');
} else {
  fail('T12a fidelity self-report section present');
}

// ── T12b: Security credential warning comment present ────────────────────────

if (raw.toLowerCase().includes('mc-sec-02') || raw.toLowerCase().includes('credential') || raw.toLowerCase().includes('api key')) {
  pass('T12b security credential warning comment present');
} else {
  fail('T12b security credential warning comment present', 'no MC-SEC-02 or credential warning found');
}

// ── T12c: backward_references section present ────────────────────────────────

if (/backward.references/i.test(raw) || /backward_references/i.test(raw)) {
  pass('T12c backward_references section present');
} else {
  fail('T12c backward_references section present');
}

// ── T12d: Operator review section present with required fields ────────────────

const REVIEW_FIELDS = ['context_score', 'linkage_score', 'reviewed_by'];
const missingReview = REVIEW_FIELDS.filter(f => !raw.includes(f));
if (missingReview.length === 0) {
  pass('T12d operator review section present (context_score, linkage_score, reviewed_by)');
} else {
  fail('T12d operator review section present', `missing: ${missingReview.join(', ')}`);
}

// ── Summary ──────────────────────────────────────────────────────────────────

console.log(`\n[spc2-capture-block-template] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
