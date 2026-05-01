# DoR Contract: sfa.1 — State File Authority Model

**Story:** sfa.1
**Feature:** 2026-05-02-state-file-authority-model
**Issued:** 2026-05-02

---

## Scope Contract

### Files the coding agent MUST touch

| File | Operation | Constraint |
|------|-----------|------------|
| `workspace/state.schema.json` | Create | JSON Schema Draft 7; required: [currentPhase, lastUpdated, checkpoint]; no additionalProperties: false |
| `tests/check-sfa1-state-schema.js` | Create | 16 tests using Node.js assert only; repo pattern (path.resolve(__dirname, '..')) |
| `.github/architecture-guardrails.md` | Append | ADR-016 and ADR-017 appended after ADR-015; no existing content modified |
| `.github/skills/checkpoint/SKILL.md` | Modify | Add reference to `workspace/state.schema.json`; minimal change only |
| `package.json` | Modify | Add `check:sfa1` to scripts; extend `test` chain |

### Files the coding agent MUST NOT touch

| File | Reason |
|------|--------|
| `pipeline-state.schema.json` | Out of scope — delivery evidence schema is separate |
| `.github/pipeline-state.json` | No state changes needed by the implementation |
| `workspace/state.json` | Read-only — existing checkpoint file; do not modify |
| Any file under `artefacts/` | Artefact-first rule — coding agent never modifies artefacts |
| Any file under `.github/skills/` except `checkpoint/SKILL.md` | Out of scope |
| Any file under `src/` | No source code changes |

---

## Acceptance Criteria Map

| AC | Verified by test(s) | Pass condition |
|----|---------------------|----------------|
| AC1 | `schema-file-exists`, `schema-validates-current-state` | Schema file exists and current state.json satisfies schema required fields |
| AC2 | `schema-requires-currentPhase`, `schema-requires-lastUpdated`, `schema-requires-checkpoint`, `schema-currentPhase-is-string` | schema.required array contains all 3; currentPhase is string type |
| AC3 | `adr-016-exists`, `adr-016-names-pipeline-state`, `adr-016-names-workspace-state`, `adr-016-viz-reads-pipeline-state` | ADR-016 section present in guardrails with authority model content |
| AC4 | `adr-017-exists`, `adr-017-names-flat-structure`, `adr-017-names-legacy-nesting` | ADR-017 section present with dual nesting documentation |
| AC5 | `checkpoint-skill-references-schema-path` | Checkpoint SKILL.md contains `workspace/state.schema.json` |
| AC6 | `workspace-state-schema-accepts-extra-properties` | schema.additionalProperties is not false |

---

## Implementation Notes for Coding Agent

### workspace/state.schema.json — shape

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["currentPhase", "lastUpdated", "checkpoint"],
  "properties": {
    "currentPhase": { "type": "string" },
    "lastUpdated": { "type": "string" },
    "checkpoint": { "type": "object" }
  }
}
```

`additionalProperties` must not be present or must be `true` — never `false`.

### tests/check-sfa1-state-schema.js — pattern

```js
const assert = require('assert');
const path = require('path');
const fs = require('fs');
const root = path.resolve(__dirname, '..');

// read schema
const schemaPath = path.join(root, 'workspace', 'state.schema.json');
const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));

// read current state
const statePath = path.join(root, 'workspace', 'state.json');
const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));

// read guardrails
const guardrailsPath = path.join(root, '.github', 'architecture-guardrails.md');
const guardrails = fs.readFileSync(guardrailsPath, 'utf8');

// read checkpoint SKILL.md
const checkpointSkillPath = path.join(root, '.github', 'skills', 'checkpoint', 'SKILL.md');
const checkpointSkill = fs.readFileSync(checkpointSkillPath, 'utf8');

// AC1
assert.ok(fs.existsSync(schemaPath), 'schema-file-exists');
// ... etc
```

### ADR-016 minimum content

Must contain all of these phrases (test anchors on `ADR-016` + window search):
- `pipeline-state.json`
- `delivery evidence`
- `workspace/state.json`
- `session state`

Must also include a statement that the viz / dashboard reads only `pipeline-state.json`.

### ADR-017 minimum content

Must contain all of these patterns (test anchors on `ADR-017` + window search):
- `flat` (flat story array for Phase 3+ features)
- `stories` (the array key used)
- Either `legacy` or `nested` (describing Phase 1/2 shape)
- Either `not migrated` or `no migration` (confirming old shape persists)
