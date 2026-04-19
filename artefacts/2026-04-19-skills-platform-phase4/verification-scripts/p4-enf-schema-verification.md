# Verification Script: p4-enf-schema

**Story:** Structured output schema validation
**Epic:** E3 — Structural enforcement

## Automated verification

```bash
node tests/check-p4-enf-schema.js
```

Expected output:
```
T1 pass: schema-validator exports validateOutputShape
T2 pass: schema violation → OUTPUT_SHAPE_VIOLATION error
T3 pass: error object has field, expected, actual keys
T4 pass: error identifies failing field by JSON path
T5 pass: error identifies expected type/constraint
T6 pass: no expected-output-shape → validation skipped (null)
T7 pass: deterministic — same input twice → same result
T8 pass: valid output → null
T-NFR1 pass: error object is plain object with exact four keys
T-NFR2 pass: no operator output content in external logs
```

## Manual verification

1. Run `node tests/check-p4-enf-schema.js` — all tests pass.
2. Manually call `validateOutputShape` twice with identical input; confirm return values are deep equal.
3. Inspect `src/enforcement/schema-validator.js`: confirm no `console.log` that serialises the `output` argument.
4. Confirm `validateOutputShape({ schema: null, output: {...} })` returns null — opt-in behaviour.

## AC coverage

| AC | Test | Covered by |
|----|------|-----------|
| AC1 | T2, T3 | Violation returns OUTPUT_SHAPE_VIOLATION error with field/expected/actual |
| AC2 | T4, T5 | JSON path for field; expected type/constraint in error |
| AC3 | T6 | Nodes without schema → skipped |
| AC4 | T7 | Deterministic for identical inputs |
| NFR-CORRECT | T-NFR1 | Plain object with exactly four keys |
| NFR-SEC | T-NFR2 | No operator output in external logs |
