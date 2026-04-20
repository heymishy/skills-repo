# Definition of Done — p4-enf-schema

**Story:** p4-enf-schema — Structured output schema validation
**Epic:** E3 — Structural Enforcement
**Feature:** 2026-04-19-skills-platform-phase4
**Completed:** 2026-04-20
**Commit:** (this commit)

---

## AC Coverage

| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| AC1 | Schema violation → `{ error: 'OUTPUT_SHAPE_VIOLATION', field, expected, actual }` plain object; blocks `advanceState` | PASS | T2a–T2b, T3a–T3d, T-NFR1a–T-NFR1b — 8 assertions |
| AC2 | Error identifies failing field by JSON path, expected type/constraint, actual value | PASS | T4a–T4b (nested path `stories[0].ac_count`), T5a–T5b — 4 assertions |
| AC3 | Node without `expected-output-shape` (schema=null) → validation skipped, returns null | PASS | T6 — 1 assertion |
| AC4 | Deterministic — identical input/schema → identical result on two consecutive calls | PASS | T7 — 1 assertion |
| AC-valid | Valid output → null (no error) | PASS | T8 — 1 assertion |
| AC-NFR2 | No `console.log/error/warn` calls with output variable | PASS | T-NFR2a–T-NFR2b — 2 assertions |

All 6 ACs satisfied. All 20 test assertions passing (10 test IDs).

---

## Test Run Evidence

```
node tests/check-p4-enf-schema.js

[p4-enf-schema] Results: 20 passed, 0 failed
```

Full suite (`npm test`) — zero failures.

---

## Implementation Notes

**File created:** `src/enforcement/schema-validator.js`

**Single export:** `validateOutputShape({ schema, output })`

**Algorithm:** recursive `validateNode(schema, value, path)` — no external dependencies (Node.js built-ins only):
- `schema === null/undefined` → returns null (AC3 opt-in)
- Type check (`schema.type`) — distinguishes `integer` from `number` per JSON Schema draft-07
- Minimum constraint (`schema.minimum`) — numeric values only
- Property validation (`schema.properties`) — recursive descent with dot-notation path accumulation
- Required fields (`schema.required`) — missing field returns `actual: null`
- Array items (`schema.items`) — bracket-notation path (`[0]`, `[1]`, ...)

**Error object shape (MC-CORRECT-02):**
```json
{ "error": "OUTPUT_SHAPE_VIOLATION", "field": "stories[0].ac_count", "expected": "minimum:3", "actual": 1 }
```
Plain object (not an Error instance). Exactly four keys: `error`, `field`, `expected`, `actual`.

**Architecture constraints met:**
- C5: `expected-output-shape` injected by caller (from hash-verified skill declaration); validator is pure function with no schema source awareness
- MC-CORRECT-02: structured JSON error object; no plain text errors
- ADR-004: no hardcoded URLs, paths, or config — all injected
- MC-SEC-02: no `console.log`/`error`/`warn` with output content; T-NFR2 source-scanned

**Deviations:** None. Implementation at `src/enforcement/schema-validator.js` matches test expectation.

---

## Metric Signals

**M2 (Consumer confidence):** Structured output shape validation is now available to all E3 adapters. Workflow nodes can declare `expected-output-shape` schemas; violations produce machine-readable error objects that enforcement adapters can surface to operators without ambiguity.
