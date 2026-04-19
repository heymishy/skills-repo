#!/usr/bin/env node
// check-p4-enf-schema.js — test plan verification for p4-enf-schema
// Covers T1–T8 (AC1–AC4) and T-NFR1, T-NFR2
// Tests FAIL until src/enforcement/schema-validator.js is implemented — TDD baseline.
// No external dependencies — Node.js built-ins only.

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT            = path.join(__dirname, '..');
const SCHEMA_MODULE   = path.join(ROOT, 'src', 'enforcement', 'schema-validator.js');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { console.log(`  \u2713 ${label}`); passed++; }
  else           { console.log(`  \u2717 ${label}`); failed++; }
}

function loadModule() {
  if (!fs.existsSync(SCHEMA_MODULE)) return null;
  try {
    delete require.cache[require.resolve(SCHEMA_MODULE)];
    return require(SCHEMA_MODULE);
  } catch (_) { return null; }
}

// Simple JSON-path helper for nested access
function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// ── T1 — Module exists and exports validateOutputShape ───────────────────────
console.log('\n[p4-enf-schema] T1 — schema-validator module exists and exports validateOutputShape');
{
  const exists = fs.existsSync(SCHEMA_MODULE);
  assert(exists, 'T1a: src/enforcement/schema-validator.js exists');
  const mod = loadModule();
  assert(mod !== null, 'T1b: module loads without error');
  if (mod) {
    assert(typeof mod.validateOutputShape === 'function',
      'T1c: exports validateOutputShape as function');
  }
}

const mod = loadModule();

// Schema fixture: requires ac_count as integer >= 3
const FIXTURE_SCHEMA = {
  type: 'object',
  properties: {
    ac_count: { type: 'integer', minimum: 3 }
  },
  required: ['ac_count']
};

// ── T2 — Schema violation → OUTPUT_SHAPE_VIOLATION ───────────────────────────
console.log('\n[p4-enf-schema] T2 — schema violation returns OUTPUT_SHAPE_VIOLATION error');
{
  if (!mod || typeof mod.validateOutputShape !== 'function') {
    assert(false, 'T2: validateOutputShape (function missing)');
  } else {
    let result = null;
    try {
      result = mod.validateOutputShape({ schema: FIXTURE_SCHEMA, output: { ac_count: 'not-a-number' } });
    } catch (_) {}
    assert(result !== null, 'T2a: result is not null on violation');
    if (result) {
      assert(result.error === 'OUTPUT_SHAPE_VIOLATION',
        `T2b: result.error is "OUTPUT_SHAPE_VIOLATION" (got: ${JSON.stringify(result.error)})`);
    }
  }
}

// ── T3 — Error object has field, expected, actual keys ───────────────────────
console.log('\n[p4-enf-schema] T3 — error object has all four required keys');
{
  if (!mod || typeof mod.validateOutputShape !== 'function') {
    assert(false, 'T3: validateOutputShape (function missing)');
  } else {
    let result = null;
    try {
      result = mod.validateOutputShape({ schema: FIXTURE_SCHEMA, output: { ac_count: 'x' } });
    } catch (_) {}
    if (!result) {
      assert(false, 'T3: no error returned (cannot check keys)');
    } else {
      assert(result.error !== undefined,    'T3a: error key present');
      assert(result.field !== undefined,    'T3b: field key present');
      assert(result.expected !== undefined, 'T3c: expected key present');
      assert(result.actual !== undefined || result.actual === null,  'T3d: actual key present (may be null)');
    }
  }
}

// ── T4 — Error identifies failing field by JSON path ─────────────────────────
console.log('\n[p4-enf-schema] T4 — error.field uses JSON path notation');
{
  if (!mod || typeof mod.validateOutputShape !== 'function') {
    assert(false, 'T4: validateOutputShape (function missing)');
  } else {
    // Nested violation: stories[0].ac_count
    const nestedSchema = {
      type: 'object',
      properties: {
        stories: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              ac_count: { type: 'integer', minimum: 3 }
            },
            required: ['ac_count']
          }
        }
      }
    };
    let result = null;
    try {
      result = mod.validateOutputShape({
        schema: nestedSchema,
        output: { stories: [{ ac_count: 1 }] }
      });
    } catch (_) {}

    if (!result) {
      // Fall back to flat fixture
      try {
        result = mod.validateOutputShape({ schema: FIXTURE_SCHEMA, output: { ac_count: 1 } });
      } catch (_) {}
    }

    if (!result) {
      assert(false, 'T4: no error returned');
    } else {
      assert(typeof result.field === 'string', 'T4a: field is a string');
      // Field should use dot notation or bracket notation
      assert(/[.\[]/.test(result.field) || result.field === 'ac_count',
        `T4b: field has path notation or is field name (got: "${result.field}")`);
    }
  }
}

// ── T5 — Error identifies expected type or constraint ─────────────────────────
console.log('\n[p4-enf-schema] T5 — error.expected describes type or constraint');
{
  if (!mod || typeof mod.validateOutputShape !== 'function') {
    assert(false, 'T5: validateOutputShape (function missing)');
  } else {
    let result = null;
    try {
      result = mod.validateOutputShape({ schema: FIXTURE_SCHEMA, output: { ac_count: 'string-value' } });
    } catch (_) {}
    if (!result) {
      assert(false, 'T5: no error returned');
    } else {
      assert(typeof result.expected === 'string',
        `T5a: expected is a string (got: ${typeof result.expected})`);
      assert(/integer|number|type|minimum/i.test(result.expected),
        `T5b: expected describes type or constraint (got: "${result.expected}")`);
    }
  }
}

// ── T6 — No schema → validation skipped (null) ───────────────────────────────
console.log('\n[p4-enf-schema] T6 — node without expected-output-shape → skip (returns null)');
{
  if (!mod || typeof mod.validateOutputShape !== 'function') {
    assert(false, 'T6: validateOutputShape (function missing)');
  } else {
    let result;
    try {
      result = mod.validateOutputShape({ schema: null, output: { anything: 'goes' } });
    } catch (_) { result = 'THREW'; }
    assert(result === null || result === undefined,
      `T6: null schema returns null/undefined (got: ${JSON.stringify(result)})`);
  }
}

// ── T7 — Deterministic: same input twice → same result ───────────────────────
console.log('\n[p4-enf-schema] T7 — deterministic: same input produces same result twice');
{
  if (!mod || typeof mod.validateOutputShape !== 'function') {
    assert(false, 'T7: validateOutputShape (function missing)');
  } else {
    let r1 = null;
    let r2 = null;
    const input = { schema: FIXTURE_SCHEMA, output: { ac_count: 'x' } };
    try { r1 = mod.validateOutputShape(input); } catch (_) {}
    try { r2 = mod.validateOutputShape(input); } catch (_) {}
    assert(deepEqual(r1, r2),
      `T7: two identical calls return same result (r1: ${JSON.stringify(r1)}, r2: ${JSON.stringify(r2)})`);
  }
}

// ── T8 — Valid output → null ──────────────────────────────────────────────────
console.log('\n[p4-enf-schema] T8 — valid output returns null (no error)');
{
  if (!mod || typeof mod.validateOutputShape !== 'function') {
    assert(false, 'T8: validateOutputShape (function missing)');
  } else {
    let result;
    try {
      result = mod.validateOutputShape({ schema: FIXTURE_SCHEMA, output: { ac_count: 5 } });
    } catch (_) { result = 'THREW'; }
    assert(result === null || result === undefined,
      `T8: valid output returns null (got: ${JSON.stringify(result)})`);
  }
}

// ── T-NFR1 — Error object is plain object with exactly four keys ──────────────
console.log('\n[p4-enf-schema] T-NFR1 — error object follows platform error schema (plain object, 4 keys)');
{
  if (!mod || typeof mod.validateOutputShape !== 'function') {
    assert(false, 'T-NFR1: validateOutputShape (function missing)');
  } else {
    let result = null;
    try {
      result = mod.validateOutputShape({ schema: FIXTURE_SCHEMA, output: { ac_count: 'x' } });
    } catch (_) {}
    if (!result) {
      assert(false, 'T-NFR1: no error returned to check schema');
    } else {
      assert(!(result instanceof Error),
        'T-NFR1a: error is plain object (not an Error instance)');
      const keys = Object.keys(result);
      assert(keys.includes('error') && keys.includes('field') && keys.includes('expected') && keys.includes('actual'),
        `T-NFR1b: object has error, field, expected, actual keys (got: ${keys.join(',')})`);
    }
  }
}

// ── T-NFR2 — No operator output content logged externally ────────────────────
console.log('\n[p4-enf-schema] T-NFR2 — no operator output content in external log calls');
{
  if (!fs.existsSync(SCHEMA_MODULE)) {
    assert(false, 'T-NFR2: cannot scan source (file missing)');
  } else {
    const src = fs.readFileSync(SCHEMA_MODULE, 'utf8');
    assert(!/console\.(log|error|warn)\s*\([^)]*output/.test(src),
      'T-NFR2a: no console output with "output" variable');
    assert(!/console\.(log|error|warn)\s*\([^)]*JSON\.stringify\s*\(\s*output/.test(src),
      'T-NFR2b: no JSON.stringify(output) in console calls');
  }
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n[p4-enf-schema] Results: ${passed} passed, ${failed} failed\n`);
if (failed > 0) process.exit(1);
