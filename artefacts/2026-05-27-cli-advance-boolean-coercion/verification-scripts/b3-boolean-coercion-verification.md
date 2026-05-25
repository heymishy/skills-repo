# Verification Script — B3: cli-advance Boolean Coercion

**Story ID:** b3
**Feature slug:** 2026-05-27-cli-advance-boolean-coercion

---

## Verification command

```bash
node tests/check-b3-boolean-coercion.js
```

All assertions must show `✓` and the process must exit with code 0.

---

## Scenario coverage

| Scenario | Test | AC covered |
|---|---|---|
| `"true"` string → boolean `true` for `releaseReady` | T1a/T1b/T1c | AC1 |
| `"false"` string → boolean `false` for `releaseReady` | T2a/T2b/T2c | AC2 |
| Digit string `"4"` → number `4` (cdg.6 regression) | T3a/T3b/T3c | AC5 |
| Non-coercible `"maybe"` for boolean field → exit 8, no write | T4a/T4b/T4c/T4d | AC3 |
| String field `stage` and `health` written as strings | T5a/T5b/T5c/T5d | AC4 |
| `check-pipeline-state-integrity.js` passes after boolean write | T6a/T6b | AC6 |

---

## Expected output (passing)

```
[b3-boolean-coercion] T1 — "true" string coerces to boolean true
  ✓ T1a: exitCode === 0
  ✓ T1b: story.releaseReady === true (boolean)
  ✓ T1c: typeof story.releaseReady === 'boolean'
  ✓ T1d: stdout contains feature slug and story id

[b3-boolean-coercion] T2 — "false" string coerces to boolean false
  ✓ T2a: exitCode === 0
  ✓ T2b: story.releaseReady === false (boolean)
  ✓ T2c: typeof story.releaseReady === 'boolean'

[b3-boolean-coercion] T3 — integer coercion regression (cdg.6 not broken)
  ✓ T3a: exitCode === 0
  ✓ T3b: story.acVerified === 4 (number)
  ✓ T3c: typeof story.acVerified === 'number'

[b3-boolean-coercion] T4 — non-coercible value for boolean field exits non-zero
  ✓ T4a: exitCode === 8
  ✓ T4b: stderr contains 'releaseReady'
  ✓ T4c: stderr contains 'boolean' or 'true'
  ✓ T4d: story.releaseReady unchanged (not written)

[b3-boolean-coercion] T5 — non-boolean-schema string fields unchanged
  ✓ T5a: exitCode === 0
  ✓ T5b: story.stage === 'implementation' (string)
  ✓ T5c: story.health === 'green' (string)
  ✓ T5d: typeof story.stage === 'string'

[b3-boolean-coercion] T6 — schema validation passes after boolean field written
  ✓ T6a: integrity check exits 0
  ✓ T6b: no schema_valid: FAILED in output

[b3-boolean-coercion] 16 passed, 0 failed
```

---

## Manual smoke check (post-merge)

After merging to master, run the following in the repo root:

```powershell
# 1. Advance a boolean field on any existing story
node bin/skills advance 2026-05-27-cli-advance-boolean-coercion b3 releaseReady=true

# 2. Confirm the value in pipeline-state.json is boolean, not string
node -e "
const s = require('./.github/pipeline-state.json');
const f = s.features.find(x => x.slug === '2026-05-27-cli-advance-boolean-coercion');
const st = (f.stories||[]).find(s => s.id === 'b3');
console.log('releaseReady:', st.releaseReady, '| type:', typeof st.releaseReady);
console.log(typeof st.releaseReady === 'boolean' ? 'PASS' : 'FAIL');
"

# 3. Run integrity check — must pass
node scripts/check-pipeline-state-integrity.js
```

Expected: `releaseReady: true | type: boolean` and `PASS`.
