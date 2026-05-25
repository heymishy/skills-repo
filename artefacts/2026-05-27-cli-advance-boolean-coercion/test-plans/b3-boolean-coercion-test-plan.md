# Test Plan — B3: cli-advance Boolean Coercion

**Story ID:** b3  
**Feature slug:** 2026-05-27-cli-advance-boolean-coercion  
**Type:** Short-track defect fix  
**Date:** 2026-05-27

---

## Summary

`src/enforcement/cli-advance.js` (the `advance()` function) parses `field=value` pairs from command-line arguments and writes them into `pipeline-state.json`. It already coerces all-digit strings to integers (delivered in cdg.6). It does **not** coerce the strings `"true"` or `"false"` to booleans for fields that the schema defines as `type: boolean`. As a result, writing `releaseReady=true` stores the JavaScript string `"true"` instead of the boolean `true`, causing `check-pipeline-state-integrity.js` schema validation to fail.

**Root cause in code:** `cli-advance.js` lines 134–148 (apply loop) — no boolean coercion before write.

**Fix design:** Add a static `BOOLEAN_FIELDS` registry (consistent with the existing `ENUM_FIELDS` pattern) listing the story-level fields the schema defines as `type: boolean`. In the apply loop, after the existing integer coercion:
- If the field is in `BOOLEAN_FIELDS`: accept `"true"` → `true`, `"false"` → `false`; reject any other value with exit code 8.
- All other fields continue to use the existing string / integer coercion logic.

**Boolean fields identified in `.github/pipeline-state.schema.json`** (story-level):

| Field | Schema type | Description |
|---|---|---|
| `releaseReady` | boolean | Set by /definition-of-done when all ACs covered |
| `layoutGapsAtMerge` | boolean | CSS layout gaps existed at merge |
| `layoutGapsRiskAccepted` | boolean | Layout gap risk explicitly accepted |
| `gateChecksumVerified` | boolean | Gate script SHA-256 matched at execution |
| `regulated` | boolean | Story requires regulated T3M1 audit fields |
| `stalenessFlag` | boolean | Evaluation detected stale baseline |

**Integer coercion status:** Already implemented in cdg.6 (`/^\d+$/.test(val)` → `Number(val)`). T3 below is a regression verification — confirms the new boolean coercion does not break existing integer coercion.

---

## Test file location

```
tests/check-b3-boolean-coercion.js
```

Follows the structure pattern of `tests/check-cdg3-advance-cli.js`:
- `assert(condition, label)` function, `passed`/`failed` counters
- `makeTmpDir`, `writeFixture`, `readFixture`, `makeFeature`, `makeStory` helpers
- `loadModule()` pattern for loading `src/enforcement/cli-advance.js`
- Console output: `[b3-boolean-coercion] T<n> — <description>`
- Exit code: non-zero if any assertion fails

---

## Acceptance criteria covered

All ACs for this test plan derive from the defect description and pipeline integration contract.

| AC | Statement |
|---|---|
| AC1 | `advance()` writes boolean `true` (not string `"true"`) when `releaseReady=true` is passed |
| AC2 | `advance()` writes boolean `false` (not string `"false"`) when `releaseReady=false` is passed |
| AC3 | `advance()` returns exit code 8 and writes nothing when a non-coercible value is passed for a boolean-typed field |
| AC4 | Non-boolean-schema string fields (e.g. `stage`, `health`) are written as strings and are not coerced |
| AC5 | Integer coercion from cdg.6 continues to work after the boolean coercion change |
| AC6 | After `advance()` writes a boolean field, `check-pipeline-state-integrity.js` validates the state without schema errors |

---

## Tests

### T1 — `"true"` string coerces to boolean `true` for a boolean schema field

**Covers:** AC1

**Setup:** Fixture pipeline-state.json with one feature/story. Story has `releaseReady: undefined` (not yet set).

**Action:** Call `advance(featureSlug, storyId, ['releaseReady=true'], tmpDir)`.

**Assertions:**
- T1a: `result.exitCode === 0`
- T1b: `story.releaseReady === true` (boolean, not string)
- T1c: `typeof story.releaseReady === 'boolean'`
- T1d: `result.stdout` contains feature slug and story id

---

### T2 — `"false"` string coerces to boolean `false` for a boolean schema field

**Covers:** AC2

**Setup:** Fixture pipeline-state.json with one feature/story. Story has `releaseReady: true` (already set to true).

**Action:** Call `advance(featureSlug, storyId, ['releaseReady=false'], tmpDir)`.

**Assertions:**
- T2a: `result.exitCode === 0`
- T2b: `story.releaseReady === false` (boolean, not string)
- T2c: `typeof story.releaseReady === 'boolean'`

---

### T3 — Integer coercion regression: digit strings still coerce to numbers (cdg.6 not broken)

**Covers:** AC5

**Setup:** Fixture pipeline-state.json with one feature/story.

**Action:** Call `advance(featureSlug, storyId, ['acVerified=4'], tmpDir)`.

**Assertions:**
- T3a: `result.exitCode === 0`
- T3b: `story.acVerified === 4` (number, not string `"4"`)
- T3c: `typeof story.acVerified === 'number'`

---

### T4 — Non-coercible value for a boolean field exits non-zero

**Covers:** AC3

**Setup:** Fixture pipeline-state.json with one feature/story.

**Action:** Call `advance(featureSlug, storyId, ['releaseReady=maybe'], tmpDir)`.

**Assertions:**
- T4a: `result.exitCode === 8`
- T4b: `result.stderr` contains `'releaseReady'` (field name surfaced in error)
- T4c: `result.stderr` contains `'boolean'` or `'true'` (indicates acceptable values)
- T4d: `story.releaseReady` is still `undefined` / unchanged (no partial write)

---

### T5 — Non-boolean-schema string fields are written as strings, not coerced

**Covers:** AC4

**Setup:** Fixture pipeline-state.json with one feature/story.

**Action:** Call `advance(featureSlug, storyId, ['stage=implementation', 'health=green'], tmpDir)`.

**Assertions:**
- T5a: `result.exitCode === 0`
- T5b: `story.stage === 'implementation'` (string, not coerced)
- T5c: `story.health === 'green'` (string, not coerced)
- T5d: `typeof story.stage === 'string'`

---

### T6 — `check-pipeline-state-integrity.js` passes after boolean field written via advance

**Covers:** AC6

**Setup:** Real (not fixture) `pipeline-state.json` in a temp directory containing a valid feature stub. Run `advance(featureSlug, storyId, ['releaseReady=true'], tmpDir)` to write a boolean value.

**Action:** Run `node scripts/check-pipeline-state-integrity.js` pointed at the temp state file (or pass `--state <path>`). If the script doesn't accept a path argument, copy the temp state over a test repo structure and invoke it.

**Assertions:**
- T6a: `check-pipeline-state-integrity.js` exits with code 0
- T6b: No output lines containing `schema_valid: FAILED` or `releaseReady`

**Implementation note:** If `check-pipeline-state-integrity.js` cannot be pointed at an arbitrary state file, T6 can be validated by verifying the written value passes a schema check inline: load `.github/pipeline-state.schema.json`, instantiate `jsonschema` or `ajv`, and assert no errors on the written story object. Document this approach in the test file if used.

---

## Test structure (pseudocode reference)

```js
// tests/check-b3-boolean-coercion.js
'use strict';
const fs   = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..');
const MODULE = path.join(ROOT, 'src', 'enforcement', 'cli-advance.js');

let passed = 0, failed = 0;
function assert(condition, label) {
  if (condition) { console.log(`  ✓ ${label}`); passed++; }
  else           { console.log(`  ✗ ${label}`); failed++; }
}
function loadModule() { /* same pattern as check-cdg3-advance-cli.js */ }
function makeTmpDir(suffix) { return fs.mkdtempSync(path.join(ROOT, `.tmp-test-b3-${suffix}-`)); }
function writeFixture(tmpDir, features) { /* write .github/pipeline-state.json */ }
function readFixture(tmpDir) { /* JSON.parse ... */ }
function makeFeature(slug, stories) { return { slug, id: slug, name: 'Test Feature', stories }; }
function makeStory(id, extra) { return Object.assign({ id, slug: id, name: 'Test Story' }, extra || {}); }

// T1 ... T6 blocks, each with try/finally cleanup of tmpDir

console.log(`\n[b3-boolean-coercion] ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
```

---

## Verification command

```bash
node tests/check-b3-boolean-coercion.js
```

All 6 tests must show `✓` and exit code 0.

---

## Out of scope

- Feature-level boolean fields (e.g. `regulated` at `features[].regulated`) — this plan covers story-level fields only. Feature-level fields can be addressed in a follow-up.
- Dot-notation boolean fields (e.g. `testPlan.allPassing` — not present in schema; `watermarkResult.pass` is nested) — if a future story requires dot-notation boolean coercion, it should be added as a separate AC and test.
- `"TRUE"` / `"FALSE"` (non-lowercase) — not coerced; document that the CLI contract requires lowercase `true`/`false`.
