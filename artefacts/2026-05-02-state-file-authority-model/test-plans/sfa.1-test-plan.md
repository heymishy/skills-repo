## Test Plan: sfa.1 — Add workspace/state.schema.json and document state file authority model as ADR-016/ADR-017

**Story reference:** `artefacts/2026-05-02-state-file-authority-model/stories/sfa.1-state-file-schema-and-adr.md`
**Epic reference:** Platform tooling — state file reliability (short-track, no formal epic)
**Test plan author:** Copilot
**Date:** 2026-05-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Schema file exists + validates current workspace/state.json | 2 tests | — | — | — | — | 🟢 |
| AC2 | Schema declares and enforces 3 required fields | 3 tests | — | — | — | — | 🟢 |
| AC3 | ADR-016 in guardrails with unambiguous two-file answer | 4 tests | — | — | — | — | 🟢 |
| AC4 | ADR-017 in guardrails with flat-structure rule + legacy note | 3 tests | — | — | — | — | 🟢 |
| AC5 | /checkpoint SKILL.md references schema path | 1 test | — | — | — | — | 🟢 |
| AC6 | Schema tolerates additional properties | 1 test | — | — | — | — | 🟢 |

**Total automated:** 14 tests. **Total manual:** 0.

---

## Coverage gaps

None.

---

## Test Data Strategy

**Source:** Synthetic — all test data generated inline within the test file. No external services, no production data, no fixtures beyond the repo's own files.
**PCI/sensitivity in scope:** No
**Availability:** Available now — tests read actual repo files (schema, state, guardrails, SKILL.md).
**Owner:** Self-contained

### Data requirements per AC

| AC | Data needed | Source | Sensitive fields | Notes |
|----|-------------|--------|-----------------|-------|
| AC1 | `workspace/state.schema.json` (to be created), `workspace/state.json` | Repo files | None | Both files must exist for test to pass |
| AC2 | `workspace/state.schema.json` required array | Schema file | None | Read `required` array from schema |
| AC3 | `.github/architecture-guardrails.md` text | Repo file | None | String presence checks |
| AC4 | `.github/architecture-guardrails.md` text | Repo file | None | String presence checks |
| AC5 | `.github/skills/checkpoint/SKILL.md` text | Repo file | None | String presence check |
| AC6 | `workspace/state.schema.json` additionalProperties field | Schema file | None | Key must not be `false` |

### PCI / sensitivity constraints

None.

### Gaps

None.

---

## Unit Tests

### workspace-state-schema-file-exists

- **Verifies:** AC1
- **Precondition:** Implementation has been run (schema file created)
- **Action:** `fs.existsSync('workspace/state.schema.json')`
- **Expected result:** Returns `true`
- **Edge case:** No

---

### workspace-state-schema-is-valid-json-schema

- **Verifies:** AC1, AC2
- **Precondition:** `workspace/state.schema.json` exists
- **Action:** `JSON.parse(fs.readFileSync('workspace/state.schema.json', 'utf8'))` — assert no throw; assert result has `type: 'object'`; assert result has `required` array
- **Expected result:** Parses without error; `schema.type === 'object'`; `Array.isArray(schema.required)` is `true`
- **Edge case:** No

---

### workspace-state-schema-requires-current-phase

- **Verifies:** AC2
- **Precondition:** `workspace/state.schema.json` exists with `required` array
- **Action:** Parse schema; check `schema.required.includes('currentPhase')`
- **Expected result:** `true`
- **Edge case:** No

---

### workspace-state-schema-requires-last-updated

- **Verifies:** AC2
- **Precondition:** `workspace/state.schema.json` exists with `required` array
- **Action:** Parse schema; check `schema.required.includes('lastUpdated')`
- **Expected result:** `true`
- **Edge case:** No

---

### workspace-state-schema-requires-checkpoint

- **Verifies:** AC2
- **Precondition:** `workspace/state.schema.json` exists with `required` array
- **Action:** Parse schema; check `schema.required.includes('checkpoint')`
- **Expected result:** `true`
- **Edge case:** No

---

### workspace-state-schema-rejects-missing-required-field

- **Verifies:** AC2
- **Precondition:** `workspace/state.schema.json` parsed; test constructs a minimal state missing `currentPhase`
- **Action:** Build `fakeState = { lastUpdated: '2026-05-02', checkpoint: { writtenAt: '2026-05-02', contextAtWrite: 'test', resumeInstruction: 'test', pendingActions: [] } }`; verify `fakeState.currentPhase === undefined`; assert schema's `required` includes `'currentPhase'`
- **Expected result:** The required array contains `'currentPhase'`, so any validator consuming this schema would reject the fakeState. Test confirms this structurally (the schema declares the constraint correctly), not by running a full validator.
- **Edge case:** No — lightweight check, no library needed

---

### workspace-state-schema-accepts-current-state-json

- **Verifies:** AC1 (COMPATIBILITY NFR)
- **Precondition:** `workspace/state.json` exists; `workspace/state.schema.json` exists
- **Action:** Parse both files; assert `state.currentPhase !== undefined`; assert `state.lastUpdated !== undefined`; assert `state.checkpoint !== undefined`; assert all three fields declared in `schema.required` are present in the current state file
- **Expected result:** All 3 required fields exist in the actual `workspace/state.json`
- **Edge case:** No

---

### workspace-state-schema-accepts-extra-properties

- **Verifies:** AC6 (COMPATIBILITY — schema must not set additionalProperties: false)
- **Precondition:** `workspace/state.schema.json` exists
- **Action:** Parse schema; assert `schema.additionalProperties !== false`
- **Expected result:** `schema.additionalProperties` is either absent or truthy — not `false`
- **Edge case:** No

---

### architecture-guardrails-contains-adr-016

- **Verifies:** AC3
- **Precondition:** `.github/architecture-guardrails.md` exists (pre-existing file)
- **Action:** Read file; assert `contents.includes('ADR-016')`
- **Expected result:** `true`
- **Edge case:** No

---

### adr-016-names-pipeline-state-as-delivery-evidence

- **Verifies:** AC3
- **Precondition:** `.github/architecture-guardrails.md` contains ADR-016 section
- **Action:** Read file; assert it includes `'pipeline-state.json'` and `'delivery evidence'` (or equivalent phrase) within the ADR-016 block — use `indexOf('ADR-016')` to anchor, check within 2000 chars of that anchor
- **Expected result:** Both strings appear within the ADR-016 section
- **Edge case:** No

---

### adr-016-names-workspace-state-as-session-state

- **Verifies:** AC3
- **Precondition:** `.github/architecture-guardrails.md` contains ADR-016 section
- **Action:** Read file; find `indexOf('ADR-016')`; check window contains `'workspace/state.json'` and `'session state'`
- **Expected result:** Both strings appear within the ADR-016 window
- **Edge case:** No

---

### adr-016-states-viz-reads-pipeline-state-only

- **Verifies:** AC3
- **Precondition:** `.github/architecture-guardrails.md` contains ADR-016 section
- **Action:** Read file; find `indexOf('ADR-016')`; check window contains `'viz'` and `'pipeline-state.json'` in proximity
- **Expected result:** Viz + pipeline-state.json co-appear in the ADR-016 window
- **Edge case:** No

---

### architecture-guardrails-contains-adr-017

- **Verifies:** AC4
- **Precondition:** `.github/architecture-guardrails.md` exists
- **Action:** Read file; assert `contents.includes('ADR-017')`
- **Expected result:** `true`
- **Edge case:** No

---

### adr-017-names-flat-structure-for-new-features

- **Verifies:** AC4
- **Precondition:** `.github/architecture-guardrails.md` contains ADR-017 section
- **Action:** Read file; find `indexOf('ADR-017')`; check window contains `'flat'` and `'stories'`
- **Expected result:** Both appear in ADR-017 window
- **Edge case:** No

---

### adr-017-names-nested-as-legacy-not-migrated

- **Verifies:** AC4
- **Precondition:** `.github/architecture-guardrails.md` contains ADR-017 section
- **Action:** Read file; find `indexOf('ADR-017')`; check window contains `'legacy'` (or `'Phase 1'` or `'nested'`) and `'not migrated'` (or `'no migration'`)
- **Expected result:** Both concepts appear in ADR-017 window
- **Edge case:** No

---

### checkpoint-skill-references-schema-path

- **Verifies:** AC5
- **Precondition:** `.github/skills/checkpoint/SKILL.md` exists
- **Action:** Read file; assert `contents.includes('workspace/state.schema.json')`
- **Expected result:** `true`
- **Edge case:** No

---

## Integration Tests

None required. All deliverables are file presence + text content checks that don't span system layers.

---

## NFR Tests

### NFR-SFA1-COMPATIBILITY — schema additionalProperties

Covered by `workspace-state-schema-accepts-extra-properties` (unit test above).

### NFR-SFA1-LIGHTWEIGHT — schema uses string type for currentPhase (not enum)

- **Verifies:** NFR-SFA1-LIGHTWEIGHT
- **Precondition:** `workspace/state.schema.json` parsed
- **Action:** Parse schema; if `schema.properties && schema.properties.currentPhase`, assert its type is `'string'`, not an enum (assert `!schema.properties.currentPhase.enum`)
- **Expected result:** `currentPhase` property type is `'string'` with no enum constraint

---

## Implementation notes for coding agent

**Test file:** `tests/check-sfa1-state-schema.js`

Use the repo's existing custom Node.js assert runner pattern:
```js
const assert = require('assert');
const fs = require('fs');
const path = require('path');

// anchor all file reads from repo root
const root = path.resolve(__dirname, '..');
```

All file reads use `path.join(root, 'workspace/state.schema.json')` etc. — never relative paths without root anchor.

The ADR window tests use this pattern:
```js
const guardrails = fs.readFileSync(path.join(root, '.github/architecture-guardrails.md'), 'utf8');
const adr016Start = guardrails.indexOf('ADR-016');
assert.ok(adr016Start !== -1, 'ADR-016 not found in guardrails');
const adr016Window = guardrails.slice(adr016Start, adr016Start + 2000);
assert.ok(adr016Window.includes('pipeline-state.json'), 'ADR-016 does not name pipeline-state.json');
```

**Deliverables the coding agent must create:**
1. `workspace/state.schema.json` — JSON Schema Draft 7, type object, required: `['currentPhase', 'lastUpdated', 'checkpoint']`, additionalProperties not set to false
2. `.github/architecture-guardrails.md` — append ADR-016 (authority model) and ADR-017 (nesting dual-structure) after ADR-015
3. `.github/skills/checkpoint/SKILL.md` — update the schema validation step to reference `workspace/state.schema.json` by path
4. `tests/check-sfa1-state-schema.js` — all 16 tests above (14 unit + 2 NFR)
5. `package.json` — add `"check:sfa1": "node tests/check-sfa1-state-schema.js"` to scripts AND add `&& node tests/check-sfa1-state-schema.js` to the `test` script
