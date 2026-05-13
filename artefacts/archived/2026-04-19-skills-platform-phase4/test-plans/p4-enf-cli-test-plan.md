# Test Plan: p4-enf-cli

**Story:** CLI enforcement adapter implementing Craig's MVP command set
**Epic:** E3 — Structural enforcement
**Complexity:** 3 | **Scope stability:** Unstable (Assumption A2 — trace schema compatibility)
**Implementation path:** `src/enforcement/cli-adapter.js`

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|-----|-------------|------|
| T1 | AC1 | CLI adapter module exists and exports all 9 commands | Unit |
| T2 | AC1 | Each of the 9 commands is a function | Unit |
| T3 | AC2 | advance from non-permitted state → structured error with allowed list | Unit |
| T4 | AC2 | advance to permitted state succeeds | Unit |
| T5 | AC3 | advance with matching hash → envelope built | Unit |
| T6 | AC3 | advance with mismatching hash → HASH_MISMATCH error, no envelope | Unit |
| T7 | AC4 | emitTrace output passes validate-trace.sh schema | Integration |
| T8 | AC1 | ADR-004: no hardcoded URL in CLI adapter source | Governance |
| T-NFR1 | NFR | No --skip-verify flag or bypass in source (C5) | Security |
| T-NFR2 | NFR | No credentials in emitTrace output | Security |

---

## Test Specifications

### T1 — CLI adapter module exists and exports all 9 commands

**Preconditions:** `src/enforcement/cli-adapter.js` does not yet exist.
**Input:** `require('../src/enforcement/cli-adapter.js')`.
**Expected:** Module exports `init`, `fetch`, `pin`, `verify`, `workflow`, `advance`, `back`, `navigate`, `emitTrace` as functions.
**Failure state (before implementation):** Module does not exist.

---

### T2 — Each of the 9 commands is a function

**Preconditions:** T1 passes.
**Input:** Check `typeof` for each exported name.
**Expected:** All 9 are `typeof === 'function'`.
**Failure state (before implementation):** Module missing.

---

### T3 — advance from non-permitted state → structured error

**Preconditions:** T1 passes; fixture declaration with two nodes and no forward transition from node A to node C.
**Input:** `advance({ current: 'nodeA', next: 'nodeC', declaration: fixtureDecl })`.
**Expected:** Returns/throws error with message matching: `"Transition to nodeC not permitted from nodeA. Allowed: <list>"`.
**Failure state (before implementation):** Module missing.

---

### T4 — advance to permitted state succeeds

**Preconditions:** T1 passes; fixture declaration permits A → B.
**Input:** `advance({ current: 'nodeA', next: 'nodeB', declaration: fixtureDecl, govPackage: stub })`.
**Expected:** Returns success result; no error.
**Failure state (before implementation):** Module missing.

---

### T5 — advance with matching hash → envelope built

**Preconditions:** T1 passes; verifyHash stub returns null.
**Input:** `advance({ ..., govPackage: { verifyHash: () => null, ... } })`.
**Expected:** Returns object with `envelope` field (non-null, non-empty).
**Failure state (before implementation):** Module missing.

---

### T6 — advance with mismatching hash → HASH_MISMATCH, no envelope

**Preconditions:** T1 passes; verifyHash stub returns `{ error: "HASH_MISMATCH", skillId: "test", expected: "aaa...", actual: "bbb..." }`.
**Input:** `advance({ ..., govPackage: { verifyHash: () => hashMismatch } })`.
**Expected:** Returns error with message `"Hash mismatch for skill test: expected aaa..., got bbb..."` and no `envelope` field.
**Failure state (before implementation):** Module missing.

---

### T7 — emitTrace output passes validate-trace.sh schema

**Preconditions:** T1 passes; trace written to temp file.
**Input:** `emitTrace({ skillId: 'discovery', skillHash: 'a'.repeat(64), inputHash: 'b'.repeat(64), outputRef: 'artefact.md', transitionTaken: 'A→B', surfaceType: 'cli', timestamp: '2026-04-19T10:00:00Z' })`.
**Expected:** Emitted JSON trace entry is valid per validate-trace.sh schema. At minimum: required trace fields present, no extra required fields missing.
**Failure state (before implementation):** Module missing.

---

### T8 — ADR-004: no hardcoded URL in CLI adapter

**Preconditions:** `src/enforcement/cli-adapter.js` exists.
**Input:** Source scan for `github.com/heymishy` or hardcoded upstream URLs.
**Expected:** Zero occurrences outside comment lines or test fixtures.
**Failure state (before implementation):** Module missing.

---

### T-NFR1 — No skip-verify bypass (C5)

**Preconditions:** Module source exists.
**Input:** Read source.
**Expected:** No `skipVerify`, `skip-verify`, `--no-verify`, `force` parameter name in advance function signature or body.
**Failure state (before implementation):** Module missing.

---

### T-NFR2 — No credentials in emitTrace output

**Preconditions:** T7 passes; inspect emitTrace output.
**Input:** Serialised trace entry text.
**Expected:** No `token`, `Bearer`, `password`, `secret`, `tenantId` in trace output.
**Failure state (before implementation):** Module missing.

---

## Module under test

- `src/enforcement/cli-adapter.js` — exports `init`, `fetch`, `pin`, `verify`, `workflow`, `advance`, `back`, `navigate`, `emitTrace`; imports governance package

---

## NFR Summary

- Security: no --skip-verify flag (C5); no credentials in trace output (MC-SEC-02)
- Correctness: all 9 commands unit-tested; emitTrace schema-valid; ADR-004 compliance checked
- Performance: advance < 3s (manual; not unit-tested)
