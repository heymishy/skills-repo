# Test Plan: p4-enf-schema

**Story:** Structured output schema validation — enforcement mechanism 4 of 5
**Epic:** E3 — Structural enforcement
**Complexity:** 2 | **Scope stability:** Unstable (depends on Spike A expected-output-shape syntax)
**Implementation path:** `src/enforcement/schema-validator.js`

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|-----|-------------|------|
| T1 | AC1 | Schema validator module exists and exports validateOutputShape | Unit |
| T2 | AC1 | Schema violation → OUTPUT_SHAPE_VIOLATION error object | Unit |
| T3 | AC1 | Error object has field, expected, actual keys | Unit |
| T4 | AC2 | Error identifies failing field by JSON path | Unit |
| T5 | AC2 | Error identifies expected type/constraint | Unit |
| T6 | AC3 | Node without expected-output-shape → skips validation | Unit |
| T7 | AC4 | Deterministic — same input twice → same result | Unit |
| T8 | AC1 | Valid output → null returned (no error) | Unit |
| T-NFR1 | NFR | Error object follows platform error schema (MC-CORRECT-02) | Unit |
| T-NFR2 | NFR | No operator output content logged externally | Security |

---

## Test Specifications

### T1 — Module exists and exports validateOutputShape

**Preconditions:** `src/enforcement/schema-validator.js` does not yet exist.
**Input:** `require('../src/enforcement/schema-validator.js')`.
**Expected:** Module exports `validateOutputShape` as a function.
**Failure state (before implementation):** Module does not exist.

---

### T2 — Schema violation → OUTPUT_SHAPE_VIOLATION error

**Preconditions:** T1 passes; fixture schema requiring `ac_count` as integer ≥ 3.
**Input:** `validateOutputShape({ schema: { properties: { ac_count: { type: 'integer', minimum: 3 } } }, output: { ac_count: 'not-a-number' } })`.
**Expected:** Returns error object with `error: "OUTPUT_SHAPE_VIOLATION"`.
**Failure state (before implementation):** Module missing.

---

### T3 — Error object has all required keys

**Preconditions:** T2 passes.
**Input:** Same as T2.
**Expected:** Error object has `error`, `field`, `expected`, `actual` keys (all present, not undefined).
**Failure state (before implementation):** Module missing.

---

### T4 — Error identifies failing field by JSON path

**Preconditions:** T2 passes; output has nested violation at `.stories[0].ac_count`.
**Input:** `validateOutputShape({ schema: { ... }, output: { stories: [{ ac_count: 1 }] } })`.
**Expected:** `error.field` contains `.stories[0].ac_count` or equivalent JSON path notation.
**Failure state (before implementation):** Module missing.

---

### T5 — Error identifies expected type or constraint

**Preconditions:** T2 passes.
**Input:** Schema with `ac_count: { type: 'integer', minimum: 3 }`; output `ac_count: 1`.
**Expected:** `error.expected` contains "integer" or "minimum: 3" or equivalent description.
**Failure state (before implementation):** Module missing.

---

### T6 — Node without expected-output-shape → skip validation

**Preconditions:** T1 passes.
**Input:** `validateOutputShape({ schema: null, output: { anything: 'goes' } })`.
**Expected:** Returns `null` or `undefined` — no error for missing schema.
**Failure state (before implementation):** Module missing.

---

### T7 — Deterministic — same input produces same output

**Preconditions:** T2 passes.
**Input:** Same schema + output called twice.
**Expected:** Both calls return identical error objects (deep equal).
**Failure state (before implementation):** Module missing.

---

### T8 — Valid output → null

**Preconditions:** T1 passes; fixture schema requiring `ac_count >= 3`.
**Input:** `validateOutputShape({ schema: { properties: { ac_count: { type: 'integer', minimum: 3 } }, required: ['ac_count'] }, output: { ac_count: 5 } })`.
**Expected:** Returns `null` or `undefined` — no error.
**Failure state (before implementation):** Module missing.

---

### T-NFR1 — Error object follows platform error schema

**Preconditions:** T2 passes.
**Input:** Error object from T2.
**Expected:** Error object is a plain JS object (not an Error instance) with exactly `error` (string), `field` (string), `expected` (string), `actual` (any) as keys. No additional required keys beyond these four.
**Failure state (before implementation):** Module missing.

---

### T-NFR2 — No operator output content in external logs

**Preconditions:** Module source exists.
**Input:** Read `src/enforcement/schema-validator.js`.
**Expected:** No `console.log`, `console.error`, or `process.stdout.write` that serialises or passes the `output` argument to an external call.
**Failure state (before implementation):** Module missing.

---

## Module under test

- `src/enforcement/schema-validator.js` — exports `validateOutputShape({ schema, output })`

---

## NFR Summary

- Security: no operator output content sent to external services (MC-SEC-02)
- Correctness: error object follows platform error schema (MC-CORRECT-02); schema validation is deterministic
- Performance: < 100ms for up to 10,000-character output (manual; not unit-tested)
