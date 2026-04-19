# Test Plan: p4-enf-package

**Story:** Governance package — shared core implementation
**Epic:** E3 — Structural enforcement
**Complexity:** 3 | **Scope stability:** Unstable (depends on Spike A verdict — PROCEED path assumed)
**Implementation path:** `src/enforcement/governance-package.js`

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|-----|-------------|------|
| T1 | AC1 | Module exists and exports all five entry points | Unit |
| T2 | AC1 | resolveSkill locates skill by ID from sidecar | Unit |
| T3 | AC2 | verifyHash with mismatching hash returns HASH_MISMATCH object | Unit |
| T4 | AC2 | verifyHash returns no truthy result on mismatch | Unit |
| T5 | AC2 | verifyHash with matching hash returns null | Unit |
| T6 | AC1 | evaluateGate invoked with known gate name returns structured result | Unit |
| T7 | AC1 | advanceState changes current state to next state in declaration | Unit |
| T8 | AC3 | writeTrace produces entry that passes validate-trace.sh schema | Integration |
| T-NFR1 | NFR | verifyHash has no force/skip/bypass parameter | Security |
| T-NFR2 | NFR | No external network call in package source | Security |

---

## Test Specifications

### T1 — Module exists and exports all five entry points

**Preconditions:** `src/enforcement/governance-package.js` does not yet exist.
**Input:** `require('../src/enforcement/governance-package.js')`.
**Expected:** Module exports `resolveSkill`, `verifyHash`, `evaluateGate`, `advanceState`, `writeTrace` as functions.
**Failure state (before implementation):** Module does not exist → test fails.

---

### T2 — resolveSkill locates skill from sidecar config

**Preconditions:** T1 passes; a fixture sidecar dir with one SKILL.md.
**Input:** `resolveSkill({ skillId: 'discovery', sidecarRoot: fixtureDir })`.
**Expected:** Returns object with `skillId`, `content` (string), `contentHash` (64-char hex).
**Failure state (before implementation):** Module missing → returns null.

---

### T3 — verifyHash with mismatching hash returns HASH_MISMATCH

**Preconditions:** T1 passes.
**Input:** `verifyHash({ skillId: 'test', expected: 'a'.repeat(64), actual: 'b'.repeat(64) })`.
**Expected:** Returns `{ error: "HASH_MISMATCH", skillId: "test", expected: "aaa...", actual: "bbb..." }`.
**Failure state (before implementation):** Module missing → fails.

---

### T4 — verifyHash HASH_MISMATCH is not truthy

**Preconditions:** T3 passes.
**Input:** Same as T3; evaluate truthiness of return value.
**Expected:** Return value is NOT null/undefined but is a plain object `{ error: "HASH_MISMATCH", ... }` — verifyHash must not return a truthy non-error object.
**Notes:** The AC states "does not return a truthy result that would allow the adapter to proceed" — the result must be an error object (truthy) so the adapter can detect failure, but the adapter must check for `result.error` before proceeding.
**Failure state (before implementation):** Module missing.

---

### T5 — verifyHash with matching hash returns null

**Preconditions:** T1 passes.
**Input:** `verifyHash({ skillId: 'test', expected: 'c'.repeat(64), actual: 'c'.repeat(64) })`.
**Expected:** Returns `null` or `undefined` (no error).
**Failure state (before implementation):** Module missing.

---

### T6 — evaluateGate returns structured result

**Preconditions:** T1 passes; fixture gate config.
**Input:** `evaluateGate({ gate: 'dor', context: { review: 'passed' } })`.
**Expected:** Returns object with `passed` boolean and optional `findings` array.
**Failure state (before implementation):** Module missing.

---

### T7 — advanceState changes state in workflow declaration

**Preconditions:** T1 passes; fixture workflow declaration with two nodes.
**Input:** `advanceState({ current: 'discovery', next: 'definition', declaration: fixtureDecl })`.
**Expected:** Returns `{ current: 'definition', previous: 'discovery' }` or equivalent updated state object.
**Failure state (before implementation):** Module missing.

---

### T8 — writeTrace output passes trace schema validation

**Preconditions:** T1 passes; trace output written to temp file.
**Input:** `writeTrace({ skillId: 'test', skillHash: 'a'.repeat(64), inputHash: 'b'.repeat(64), outputRef: 'test-artefact.md', transitionTaken: 'discovery→definition', surfaceType: 'cli', timestamp: '2026-04-19T10:00:00Z' })`.
**Expected:** Written trace entry is valid JSON; when parsed, contains all required trace fields. No `validate-trace.sh` failure for this entry's structure.
**Failure state (before implementation):** Module missing.

---

### T-NFR1 — verifyHash has no force/skip/bypass parameter

**Preconditions:** `src/enforcement/governance-package.js` exists.
**Input:** Read module source.
**Expected:** Source does not contain `force`, `skip`, `bypass` as parameter names in the verifyHash function signature or body.
**Failure state (before implementation):** Module missing → scan fails.

---

### T-NFR2 — No external network call in package source

**Preconditions:** Module source exists.
**Input:** Read module source.
**Expected:** No `fetch(`, `http.get(`, `https.get(`, `require('dns')` in source.
**Failure state (before implementation):** Module missing.

---

## Module under test

- `src/enforcement/governance-package.js` — exports `resolveSkill`, `verifyHash`, `evaluateGate`, `advanceState`, `writeTrace`

---

## NFR Summary

- Security: no force/skip bypass in verifyHash (C5); no credential logging (MC-SEC-02)
- Correctness: all 5 entry points unit tested; trace output schema-valid
- Performance: verifyHash < 50ms for typical skill file (not unit-tested — verified by manual timing)
