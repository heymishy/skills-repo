# Test Plan: p4-enf-decision

**Story:** Mechanism selection ADR — which enforcement mechanism applies to each surface class
**Epic:** E3 — Structural enforcement
**Complexity:** 2 | **Scope stability:** Stable
**Implementation path:** Artefact writes — `.github/architecture-guardrails.md` + `pipeline-state.json`

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|-----|-------------|------|
| T1 | AC2 | architecture-guardrails.md has ADR-phase4-enforcement entry | Artefact |
| T2 | AC2 | ADR entry has all five required sections | Artefact |
| T3 | AC1 | All four surface classes addressed in ADR | Artefact |
| T4 | AC1 | Each surface class names specific enforcement mechanism | Artefact |
| T5 | AC4 | Deferred surfaces have explicit reason and revisit trigger | Artefact |
| T6 | AC3 | pipeline-state.json guardrails[] has ADR-phase4-enforcement entry | Artefact |
| T7 | AC3 | guardrails entry has correct id, file, status fields | Artefact |
| T8 | AC2 | ADR ID does not conflict with existing ADR IDs | Artefact |
| T-NFR1 | NFR | No credentials in ADR text | Security |
| T-NFR2 | NFR | Spike verdict back-references present | Audit |

---

## Test Specifications

### T1 — architecture-guardrails.md has ADR-phase4-enforcement entry

**Preconditions:** `.github/architecture-guardrails.md` exists.
**Input:** Read file content.
**Expected:** File contains the string `ADR-phase4-enforcement`.
**Failure state (before implementation):** File does not contain this string.

---

### T2 — ADR entry has all five required sections

**Preconditions:** T1 passes.
**Input:** Read the ADR block for ADR-phase4-enforcement.
**Expected:** The block contains all five structural fields: `Context`, `Options considered`, `Decision`, `Consequences`, `Revisit triggers` (case-insensitive headings or bold labels).
**Failure state (before implementation):** ADR block missing one or more sections.

---

### T3 — All four surface classes addressed

**Preconditions:** T1 passes.
**Input:** Read the ADR block.
**Expected:** The text references all four surface classes: (1) VS Code or Claude Code or interactive, (2) CI or headless or regulated, (3) chat-native or Copilot Chat or progressive, (4) non-git-native or Teams or Confluence.
**Failure state (before implementation):** One or more surface classes absent.

---

### T4 — Each surface class names specific enforcement mechanism

**Preconditions:** T3 passes.
**Input:** Read the ADR decision section.
**Expected:** At minimum two of the four surface classes have a named mechanism (e.g. "MCP", "CLI", "schema validation", "deferred") with a rationale phrase.
**Failure state (before implementation):** No mechanism-surface pairings present.

---

### T5 — Deferred surfaces explicit

**Preconditions:** T1 passes.
**Input:** Scan ADR text.
**Expected:** Any surface class listed as deferred has: (a) the word "deferred" or "pending", (b) a reason phrase, (c) a revisit trigger reference (spike verdict or named condition).
**Failure state (before implementation):** Deferred entry without reason or revisit trigger.

---

### T6 — pipeline-state.json guardrails entry exists

**Preconditions:** `.github/pipeline-state.json` exists.
**Input:** Parse JSON; navigate to feature phase4 entry.
**Expected:** `guardrails` array exists and contains an object with `id: "ADR-phase4-enforcement"`.
**Failure state (before implementation):** Entry absent.

---

### T7 — guardrails entry fields correct

**Preconditions:** T6 passes.
**Input:** The matched guardrails entry object.
**Expected:** `id === "ADR-phase4-enforcement"`, `file === ".github/architecture-guardrails.md"`, `status === "active"`.
**Failure state (before implementation):** Any field missing or wrong value.

---

### T8 — ADR ID does not conflict

**Preconditions:** `.github/architecture-guardrails.md` exists.
**Input:** Read all ADR ID strings from the file.
**Expected:** `ADR-phase4-enforcement` appears exactly once; no other ADR with that ID exists.
**Failure state (before implementation):** ID absent (0 matches).

---

### T-NFR1 — No credentials in ADR

**Preconditions:** T1 passes.
**Input:** Full ADR block text.
**Expected:** No token, password, secret, tenantId, or Bearer string in ADR text.
**Failure state (before implementation):** File doesn't exist (test fails on file-missing).

---

### T-NFR2 — Spike verdict back-references

**Preconditions:** T1 passes.
**Input:** ADR text.
**Expected:** At least two of: "spike-a", "spike-b1", "spike-b2" appear in the ADR (evidence it synthesises spike findings).
**Failure state (before implementation):** File doesn't exist.

---

## Module under test

- **Artefact:** `.github/architecture-guardrails.md` (new ADR entry)
- **State:** `.github/pipeline-state.json` (guardrails[] entry)

---

## NFR Summary

- Security: no credentials in ADR text (MC-SEC-02)
- Correctness: unique ADR ID; all required sections present
- Audit: spike back-references present
