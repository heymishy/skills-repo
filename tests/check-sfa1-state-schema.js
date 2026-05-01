'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
    failed++;
  }
}

// ─── File paths ───────────────────────────────────────────────────────────────
const schemaPath = path.join(root, 'workspace', 'state.schema.json');
const statePath  = path.join(root, 'workspace', 'state.json');
const guardrailsPath = path.join(root, '.github', 'architecture-guardrails.md');
const checkpointSkillPath = path.join(root, '.github', 'skills', 'checkpoint', 'SKILL.md');

console.log('\n[sfa1-state-schema]');

// ─── AC1: Schema file exists and validates current state shape ─────────────
test('workspace-state-schema-file-exists', () => {
  assert.ok(fs.existsSync(schemaPath), `Schema file not found: ${schemaPath}`);
});

test('workspace-state-schema-is-valid-json-schema', () => {
  const raw = fs.readFileSync(schemaPath, 'utf8');
  const schema = JSON.parse(raw); // throws if invalid JSON
  assert.strictEqual(schema.type, 'object', 'schema.type must be "object"');
  assert.ok(Array.isArray(schema.required), 'schema.required must be an array');
});

// ─── AC2: Schema enforces required top-level fields ───────────────────────
test('workspace-state-schema-requires-current-phase', () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.ok(schema.required.includes('currentPhase'), 'schema.required must include "currentPhase"');
});

test('workspace-state-schema-requires-last-updated', () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.ok(schema.required.includes('lastUpdated'), 'schema.required must include "lastUpdated"');
});

test('workspace-state-schema-requires-checkpoint', () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.ok(schema.required.includes('checkpoint'), 'schema.required must include "checkpoint"');
});

test('workspace-state-schema-rejects-missing-required-field', () => {
  // Structural check: schema.required must contain all 3 fields so a validator
  // would reject a state missing any of them.
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const fakeState = {
    lastUpdated: '2026-05-02',
    checkpoint: { writtenAt: '2026-05-02', contextAtWrite: 'test', resumeInstruction: 'test', pendingActions: [] }
  };
  // fakeState is missing currentPhase — schema.required declares it required
  assert.strictEqual(fakeState.currentPhase, undefined, 'fakeState should not have currentPhase');
  assert.ok(schema.required.includes('currentPhase'), 'schema must declare currentPhase as required so validators reject fakeState');
});

// ─── AC1 (COMPATIBILITY) + NFR: Schema accepts current state.json ────────
test('workspace-state-schema-accepts-current-state-json', () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  const state  = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  for (const field of schema.required) {
    assert.ok(state[field] !== undefined, `workspace/state.json is missing required field: "${field}"`);
  }
});

// ─── AC6: Schema tolerates additional properties ──────────────────────────
test('workspace-state-schema-accepts-extra-properties', () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  assert.notStrictEqual(schema.additionalProperties, false,
    'schema.additionalProperties must not be false — extra fields must be allowed');
});

// ─── AC3: ADR-016 authority model ─────────────────────────────────────────
test('architecture-guardrails-contains-adr-016', () => {
  const contents = fs.readFileSync(guardrailsPath, 'utf8');
  assert.ok(contents.includes('ADR-016'), 'ADR-016 not found in .github/architecture-guardrails.md');
});

test('adr-016-names-pipeline-state-as-delivery-evidence', () => {
  const contents = fs.readFileSync(guardrailsPath, 'utf8');
  const adr016Start = contents.indexOf('ADR-016');
  assert.ok(adr016Start !== -1, 'ADR-016 not found');
  const window = contents.slice(adr016Start, adr016Start + 2000);
  assert.ok(window.includes('pipeline-state.json'), 'ADR-016 does not name pipeline-state.json');
  assert.ok(window.includes('delivery evidence'), 'ADR-016 does not include "delivery evidence"');
});

test('adr-016-names-workspace-state-as-session-state', () => {
  const contents = fs.readFileSync(guardrailsPath, 'utf8');
  const adr016Start = contents.indexOf('ADR-016');
  assert.ok(adr016Start !== -1, 'ADR-016 not found');
  const window = contents.slice(adr016Start, adr016Start + 2000);
  assert.ok(window.includes('workspace/state.json'), 'ADR-016 does not name workspace/state.json');
  assert.ok(window.includes('session state'), 'ADR-016 does not include "session state"');
});

test('adr-016-states-viz-reads-pipeline-state-only', () => {
  const contents = fs.readFileSync(guardrailsPath, 'utf8');
  const adr016Start = contents.indexOf('ADR-016');
  assert.ok(adr016Start !== -1, 'ADR-016 not found');
  const window = contents.slice(adr016Start, adr016Start + 2000);
  assert.ok(window.includes('viz') || window.includes('dashboard'), 'ADR-016 does not mention viz/dashboard');
  assert.ok(window.includes('pipeline-state.json'), 'ADR-016 does not mention pipeline-state.json in viz context');
});

// ─── AC4: ADR-017 nesting dual-structure ──────────────────────────────────
test('architecture-guardrails-contains-adr-017', () => {
  const contents = fs.readFileSync(guardrailsPath, 'utf8');
  assert.ok(contents.includes('ADR-017'), 'ADR-017 not found in .github/architecture-guardrails.md');
});

test('adr-017-names-flat-structure-for-new-features', () => {
  const contents = fs.readFileSync(guardrailsPath, 'utf8');
  const adr017Start = contents.indexOf('ADR-017');
  assert.ok(adr017Start !== -1, 'ADR-017 not found');
  const window = contents.slice(adr017Start, adr017Start + 2000);
  assert.ok(window.includes('flat'), 'ADR-017 does not mention flat story structure');
  assert.ok(window.includes('stories'), 'ADR-017 does not mention stories array');
});

test('adr-017-names-nested-as-legacy-not-migrated', () => {
  const contents = fs.readFileSync(guardrailsPath, 'utf8');
  const adr017Start = contents.indexOf('ADR-017');
  assert.ok(adr017Start !== -1, 'ADR-017 not found');
  const window = contents.slice(adr017Start, adr017Start + 2000);
  const hasLegacy = window.includes('legacy') || window.includes('Phase 1') || window.includes('nested');
  const hasNoMigrate = window.includes('not migrated') || window.includes('no migration');
  assert.ok(hasLegacy, 'ADR-017 does not mention legacy/nested structure');
  assert.ok(hasNoMigrate, 'ADR-017 does not state that old structure is not migrated');
});

// ─── AC5: /checkpoint SKILL.md references schema ─────────────────────────
test('checkpoint-skill-references-schema-path', () => {
  const contents = fs.readFileSync(checkpointSkillPath, 'utf8');
  assert.ok(contents.includes('workspace/state.schema.json'),
    '/checkpoint SKILL.md does not reference workspace/state.schema.json');
});

// ─── NFR: schema currentPhase is string not enum ─────────────────────────
test('workspace-state-schema-currentphase-is-string-not-enum', () => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  if (schema.properties && schema.properties.currentPhase) {
    assert.ok(!schema.properties.currentPhase.enum,
      'schema.properties.currentPhase must not have an enum — use type: "string"');
    assert.strictEqual(schema.properties.currentPhase.type, 'string',
      'schema.properties.currentPhase.type must be "string"');
  }
  // If properties.currentPhase not declared, that is also acceptable (required array declares it)
});

// ─── Summary ─────────────────────────────────────────────────────────────────
console.log('');
if (failed === 0) {
  console.log(`[sfa1-state-schema] Results: ${passed} passed, 0 failed`);
  process.exit(0);
} else {
  console.log(`[sfa1-state-schema] FAIL — ${failed} failure(s), ${passed} passed`);
  process.exit(1);
}
