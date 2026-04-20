'use strict';
// src/enforcement/schema-validator.js
// p4-enf-schema — Structured output schema validation
//
// Constraint: C5 — expected-output-shape comes from hash-verified skill declaration
// Constraint: MC-CORRECT-02 — validation errors are plain JSON objects {error, field, expected, actual}
// Constraint: MC-SEC-02 — no operator output content logged externally

/**
 * Returns the JSON Schema type name for a value.
 * Distinguishes integer from number per JSON Schema draft-07 convention.
 */
function getType(value) {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  return typeof value;
}

/**
 * Recursive validator.
 * Returns the first violation as a plain error object, or null when valid.
 *
 * @param {object} schema  - JSON Schema node (subset: type, minimum, properties, required, items)
 * @param {*}      value   - Value to validate
 * @param {string} path    - Current JSON path (used for error.field)
 * @returns {{ error: string, field: string, expected: string, actual: * } | null}
 */
function validateNode(schema, value, path) {
  if (!schema) return null;

  // ── Type check ──────────────────────────────────────────────────────────────
  if (schema.type !== undefined) {
    const actualType = getType(value);
    const expectedType = schema.type;
    // integer is a valid subtype of number
    const typeOk =
      actualType === expectedType ||
      (expectedType === 'number' && actualType === 'integer');
    if (!typeOk) {
      return {
        error: 'OUTPUT_SHAPE_VIOLATION',
        field: path || 'value',
        expected: expectedType,
        actual: value !== undefined ? value : null,
      };
    }
  }

  // ── Minimum constraint (numbers only) ──────────────────────────────────────
  if (schema.minimum !== undefined && typeof value === 'number') {
    if (value < schema.minimum) {
      return {
        error: 'OUTPUT_SHAPE_VIOLATION',
        field: path || 'value',
        expected: 'minimum:' + schema.minimum,
        actual: value,
      };
    }
  }

  // ── Properties (objects) ───────────────────────────────────────────────────
  if (
    schema.properties &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    for (const key of Object.keys(schema.properties)) {
      const propPath = path ? path + '.' + key : key;
      const result = validateNode(schema.properties[key], value[key], propPath);
      if (result) return result;
    }
  }

  // ── Required fields ────────────────────────────────────────────────────────
  if (
    schema.required &&
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value)
  ) {
    for (const key of schema.required) {
      if (value[key] === undefined) {
        const propPath = path ? path + '.' + key : key;
        return {
          error: 'OUTPUT_SHAPE_VIOLATION',
          field: propPath,
          expected: 'required',
          actual: null,
        };
      }
    }
  }

  // ── Items (arrays) ─────────────────────────────────────────────────────────
  if (schema.items && Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const itemPath = (path ? path : '') + '[' + i + ']';
      const result = validateNode(schema.items, value[i], itemPath);
      if (result) return result;
    }
  }

  return null;
}

/**
 * Validates agent output against a JSON Schema declared at a workflow node.
 *
 * When `schema` is null or undefined (node has no expected-output-shape),
 * validation is skipped — returns null (opt-in per node, AC3).
 *
 * Returns null when output is valid.
 * Returns a plain error object on violation (MC-CORRECT-02):
 *   { error: 'OUTPUT_SHAPE_VIOLATION', field: string, expected: string, actual: * }
 *
 * Deterministic: identical input produces identical output (AC4).
 *
 * @param {{ schema: object|null, output: * }} opts
 * @returns {{ error: string, field: string, expected: string, actual: * } | null}
 */
function validateOutputShape({ schema, output }) {
  if (!schema) return null;
  return validateNode(schema, output, '') || null;
}

module.exports = { validateOutputShape };
