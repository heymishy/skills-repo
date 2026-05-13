# Implementation Plan: sfa.1 — Add workspace/state.schema.json and document state file authority model as ADR-016/ADR-017

**Story:** sfa.1
**Feature:** 2026-05-02-state-file-authority-model
**Produced by:** GitHub Copilot (Claude Sonnet 4.6)
**Date:** 2026-05-02
**Oversight level:** Low

---

## File map

| File | Operation | AC(s) |
|------|-----------|-------|
| `workspace/state.schema.json` | Create | AC1, AC2, AC6 |
| `tests/check-sfa1-state-schema.js` | Create | All ACs |
| `.github/architecture-guardrails.md` | Append | AC3, AC4 |
| `.github/skills/checkpoint/SKILL.md` | Modify (one-line add) | AC5 |
| `package.json` | Modify (script entries) | — |

---

## Task 1 — Create failing test file (RED)

**File:** `tests/check-sfa1-state-schema.js`
**ACs:** All (16 tests)
**TDD state:** DONE — all 17 tests fail before implementation

**Run command:**
```bash
node tests/check-sfa1-state-schema.js
```
**Expected output before implementation:** 17 failures, 0 passed

---

## Task 2 — Create workspace/state.schema.json (GREEN for AC1, AC2, AC6)

**File:** `workspace/state.schema.json`

**Code:**
```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["currentPhase", "lastUpdated", "checkpoint"],
  "properties": {
    "currentPhase": {
      "type": "string"
    },
    "lastUpdated": {
      "type": "string"
    },
    "checkpoint": {
      "type": "object"
    }
  }
}
```

**Run command:**
```bash
node tests/check-sfa1-state-schema.js
```
**Expected output:** 8 passed (schema tests), ADR tests still failing

**Commit message:** `feat(sfa.1): add workspace/state.schema.json — JSON Schema Draft 7 for session state`

---

## Task 3 — Append ADR-016 and ADR-017 to architecture-guardrails.md (GREEN for AC3, AC4)

**File:** `.github/architecture-guardrails.md`
**Operation:** Append after ADR-015 entry in both the YAML registry block and the prose ADR sections

**Content appended to YAML registry block** (after ADR-015 entry):
```yaml
- id: ADR-016
  category: adr
  label: "Two-file state authority model: pipeline-state.json is delivery evidence (viz source of truth); workspace/state.json is operator session state — skills must not conflate the two"
  section: Active ADRs

- id: ADR-017
  category: adr
  label: "Story nesting dual-structure: all new features use flat features[].stories[]; Phase 1/2 epics-nested shape is legacy and not migrated"
  section: Active ADRs
```

**Content appended as prose ADR sections** (at end of file): Full ADR-016 (two-file authority model) and ADR-017 (nesting dual-structure) prose blocks.

**Run command:**
```bash
node tests/check-sfa1-state-schema.js
```
**Expected output:** 16 passed, 1 failing (checkpoint-skill-references-schema-path)

**Commit message:** `feat(sfa.1): append ADR-016 (state authority) and ADR-017 (nesting dual-structure) to architecture guardrails`

---

## Task 4 — Update /checkpoint SKILL.md to reference schema path (GREEN for AC5)

**File:** `.github/skills/checkpoint/SKILL.md`
**Operation:** Add schema validation note to the State write safety section

**Change:** Add paragraph after "A partial write or append produces..." line:

> **Schema validation:** `workspace/state.json` is governed by `workspace/state.schema.json`. After writing, confirm the three required fields are present: `currentPhase` (string), `lastUpdated` (ISO 8601 string), `checkpoint` (object). No library needed — check structurally: `node -e "const s=JSON.parse(require('fs').readFileSync('workspace/state.json','utf8')); ['currentPhase','lastUpdated','checkpoint'].forEach(f=>{if(!s[f])throw new Error('missing '+f)}); console.log('state.json valid')"`.

**Run command:**
```bash
node tests/check-sfa1-state-schema.js
```
**Expected output:** 17 passed, 0 failed

---

## Task 5 — Update package.json script entries

**File:** `package.json`
**Operation:** Add `check:sfa1` entry; append to `test` chain

**Add to scripts:**
```json
"check:sfa1": "node tests/check-sfa1-state-schema.js",
```

**Append to `test` chain:**
```
&& node tests/check-sfa1-state-schema.js
```

**Run command:**
```bash
npm run check:sfa1
```
**Expected output:** 17 passed, 0 failed

**Commit message:** `feat(sfa.1): add check:sfa1 to package.json test chain`

---

## Final verification

```bash
node tests/check-sfa1-state-schema.js
```
Expected: 17 passed, 0 failed

```bash
npm test
```
Expected: same failures as baseline (pre-existing [workspace-state] 3 failures only)
