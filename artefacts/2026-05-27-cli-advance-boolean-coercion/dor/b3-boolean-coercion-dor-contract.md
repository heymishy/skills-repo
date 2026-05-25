# DoR Contract — B3: cli-advance Boolean Coercion

**Story ID:** b3
**Feature slug:** 2026-05-27-cli-advance-boolean-coercion
**Date:** 2026-05-27

---

## Required file touchpoints

| File | Change | Required by |
|---|---|---|
| `src/enforcement/cli-advance.js` | Add `BOOLEAN_FIELDS` array; add boolean coercion block in apply loop after integer coercion | AC1, AC2, AC3 |
| `tests/check-b3-boolean-coercion.js` | New test file — 6 test groups, 16 assertions | All ACs |
| `package.json` | Add `node tests/check-b3-boolean-coercion.js` to test chain | CI coverage |

---

## Out-of-scope file constraints

The following files MUST NOT be modified by this story:

- `bin/skills` — entry point is not changed; it already dispatches to `advance()`
- `src/enforcement/cli-gate-advance.js` — inherits boolean coercion automatically via `advance()`
- `src/web-ui/**` — no web UI changes required
- `.github/pipeline-state.json` — no direct state file edits (all writes via `advance()`)
- `artefacts/**` — no artefact files modified (read-only pipeline inputs)
- `.github/skills/**` — no skill files modified
- `.github/templates/**` — no templates modified
- `scripts/check-pipeline-state-integrity.js` — used as-is for T6 verification

---

## Schema dependency declaration

**schemaDepends:** None — this story does not introduce new schema fields. It reads the existing boolean field definitions from `.github/pipeline-state.schema.json` to populate the static `BOOLEAN_FIELDS` registry, but makes no schema changes.

---

## BOOLEAN_FIELDS registry (to be hard-coded in cli-advance.js)

Derived from `.github/pipeline-state.schema.json` story-level `type: boolean` fields:

```js
var BOOLEAN_FIELDS = [
  'releaseReady',
  'layoutGapsAtMerge',
  'layoutGapsRiskAccepted',
  'gateChecksumVerified',
  'regulated',
  'stalenessFlag',
];
```

---

## Coercion logic contract

In the `advance()` apply loop, after the existing integer coercion block:

```js
// Boolean coercion — must precede the BOOLEAN_FIELDS check
// (integer coercion only fires for all-digit strings; "true"/"false" are not all-digit)
if (BOOLEAN_FIELDS.indexOf(key) !== -1) {
  if (val === 'true')       { val = true; }
  else if (val === 'false') { val = false; }
  else {
    return {
      exitCode: 8, stdout: '',
      stderr: 'Invalid value \'' + val + '\' for boolean field \'' + key + '\'. Accepted values: true, false',
    };
  }
}
```

The rejection path (non-coercible value) must return BEFORE the write — no partial state mutation.

---

## Test file contract

`tests/check-b3-boolean-coercion.js` must:

- Use the same `assert(condition, label)` / `passed` / `failed` pattern as `tests/check-cdg3-advance-cli.js`
- Use `console.log('[b3-boolean-coercion] T<n> — <description>')` prefixes
- Clean up temp directories with `fs.rmSync(tmpDir, { recursive: true, force: true })`
- Exit with `process.exit(failed > 0 ? 1 : 0)`
- Print `[b3-boolean-coercion] <N> passed, <N> failed` as final line

Expected assertion count: **16** (T1: 4, T2: 3, T3: 3, T4: 4, T5: 4, T6: 2; adjusted by implementer based on T6 approach).

---

## package.json contract

Add to the existing test chain (append with ` && `):

```
node tests/check-b3-boolean-coercion.js
```

Use `node -e "..."` origin/master read pattern if concurrent PRs are in flight (see `concurrent-pr-rebase-conflicts.md`).
