# Test Plan: p4-enf-second-line

**Story:** Theme F second-line evidence chain inputs document
**Epic:** E3 — Structural enforcement
**Complexity:** 2 | **Scope stability:** Stable
**Implementation path:** `artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md` (documentation)
**Also:** Trace schema update — `executorIdentity` optional field

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|-----|-------------|------|
| T1 | AC1 | theme-f-inputs.md exists at correct path | Artefact |
| T2 | AC1 | CLI verification contract section present with all required fields | Artefact |
| T3 | AC1 | Workflow declaration structure section present | Artefact |
| T4 | AC1 | MCP trace contract section present | Artefact |
| T5 | AC1 | executorIdentity field documented as optional | Artefact |
| T6 | AC2 | validate-trace.sh accepts trace without executorIdentity | Integration |
| T7 | AC3 | Phase 4 / Theme F boundary section present | Artefact |
| T8 | AC3 | Document names Theme F items as out of scope with Craig Q4 reference | Artefact |
| T-NFR1 | NFR | No credentials in document | Security |
| T-NFR2 | NFR | executorIdentity marked optional in trace JSON schema | Correctness |

---

## Test Specifications

### T1 — theme-f-inputs.md exists at correct path

**Preconditions:** Document does not yet exist.
**Input:** Check file existence at `artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md`.
**Expected:** File exists.
**Failure state (before implementation):** File missing.

---

### T2 — CLI verification contract section present with required fields

**Preconditions:** T1 passes.
**Input:** Read file content; look for CLI section.
**Expected:** A section heading containing "CLI" is present. Within or below it, all of these field names appear: `skillHash`, `inputHash`, `outputRef`, `transitionTaken`, `surfaceType`, `timestamp`.
**Failure state (before implementation):** File missing.

---

### T3 — Workflow declaration structure section present

**Preconditions:** T1 passes.
**Input:** Scan document text.
**Expected:** A section heading containing "workflow declaration" (case-insensitive) exists. The section describes required vs optional fields.
**Failure state (before implementation):** File missing.

---

### T4 — MCP trace contract section present

**Preconditions:** T1 passes.
**Input:** Scan document text.
**Expected:** A section heading containing "MCP" is present. The section references trace fields emitted by the MCP adapter.
**Failure state (before implementation):** File missing.

---

### T5 — executorIdentity documented as optional

**Preconditions:** T1 passes.
**Input:** Scan document for "executorIdentity".
**Expected:** String "executorIdentity" appears in document and the surrounding text or table marks it as "optional" or "opt-in" or "(optional)".
**Failure state (before implementation):** File missing.

---

### T6 — validate-trace.sh accepts trace without executorIdentity

**Preconditions:** `scripts/validate-trace.sh` exists; a fixture trace entry without `executorIdentity` field.
**Input:** Write fixture trace to temp YAML file; run `bash scripts/validate-trace.sh --ci` against it.
**Expected:** Exit code 0 — trace without executorIdentity is valid.
**Notes:** This test confirms the trace schema change: executorIdentity must be marked as optional (not required) in the JSON schema that validate-trace.sh references.
**Failure state (before implementation):** Script may currently require or not have the field at all; test fails if schema hasn't been updated.

---

### T7 — Phase 4 / Theme F boundary section present

**Preconditions:** T1 passes.
**Input:** Scan document headings.
**Expected:** A section exists with heading containing "boundary" or "scope" or "Theme F" that distinguishes Phase 4 deliverables from Theme F deliverables.
**Failure state (before implementation):** File missing.

---

### T8 — Theme F items named as out of scope with Q4 reference

**Preconditions:** T1 passes.
**Input:** Read boundary section.
**Expected:** The document names at least two of: "dual-authority approval", "RBNZ", "second-line governance model" as NOT included in Phase 4. The text contains a reference to "Q4" or "Craig's Q4" or "Q4 decision" or "Craig's clarification".
**Failure state (before implementation):** File missing.

---

### T-NFR1 — No credentials in document

**Preconditions:** T1 passes.
**Input:** Full document text.
**Expected:** No token, Bearer, password, API key, tenantId, or operator-identifiable value in text.
**Failure state (before implementation):** File missing.

---

### T-NFR2 — executorIdentity optional in trace JSON schema

**Preconditions:** Trace schema file exists (referenced by validate-trace.sh).
**Input:** Read trace schema file; navigate to trace entry schema.
**Expected:** `executorIdentity` is either absent from the `required` array, or the `required` array does not include it. The field may appear in `properties` as optional.
**Failure state (before implementation):** Schema file may not have the field at all.

---

## Module under test

- **Artefact:** `artefacts/2026-04-19-skills-platform-phase4/theme-f-inputs.md`
- **Schema change:** Trace JSON schema — `executorIdentity` marked optional

---

## NFR Summary

- Security: no credentials or operator-identifiable values in document (MC-SEC-02)
- Correctness: executorIdentity optional in schema; validate-trace.sh updated to accept traces without it
- Audit: document explicitly states Phase 4 / Theme F scope boundary; Q4 decision referenced
