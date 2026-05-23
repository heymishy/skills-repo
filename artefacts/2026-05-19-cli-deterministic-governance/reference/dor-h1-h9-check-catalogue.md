# DoR H1-H9 Check Catalogue — Authoritative Reference

**Feature:** 2026-05-19-cli-deterministic-governance
**Created by:** /test-plan skill run for cdg.2
**Date:** 2026-05-23
**Addresses:** Review finding 2-M1 (MEDIUM) — the 33-item breakdown was not previously saved as an artefact

This file enumerates every H-priority deterministic item across the H1-H9 DoR gate, in the order the `skills validate definition-of-ready` CLI evaluates them. It also records the canonical exit code mapping.

---

## Exit Code Mapping

The `validate` function checks categories in the order H1 → H2 → H3 → H4 → H5 → H6 → H7 → H8 → H8-ext → H9. The first failing category determines the exit code and the CLI stops there.

| Exit code | Category | Description |
|-----------|----------|-------------|
| 0 | — | All 33 checks passed. No violations. |
| 1 | H1 | Story artefact existence check failed |
| 2 | H2 | AC count or Given/When/Then format check failed |
| 3 | H3 | Test plan existence or AC coverage check failed |
| 4 | H4 | Out-of-scope section missing or unpopulated |
| 5 | H5 | Benefit linkage missing, no metric referenced, or disqualifying phrase |
| 6 | H6 | Complexity rating missing or invalid value |
| 7 | H7, H8, H8-ext, or H9 | Process gate failure — review findings, test plan gaps, schema deps, or architecture constraints |
| 8 | System | Unsupported gate, insufficient arguments, or path traversal attempt |

**Rationale for H7–H9 sharing exit code 7:** H1–H6 correspond to story content checks with a 1:1 mapping. H7, H8, H8-ext, and H9 all represent "process gate" failures (review, test plan completeness, schema dependencies, architecture guardrails). Merging them into a single exit code avoids exhausting the 1–7 range on only 9 categories and aligns with the principle that exit codes communicate the *class* of violation rather than the exact check. The stderr message includes the H-identifier prefix (e.g. `H8 FAIL:`, `H9 FAIL:`) so the exact check is always identifiable.

**Addresses:** Review finding 2-M2 (MEDIUM) — exit code mapping from H-categories to 1–7 range not previously defined.

---

## Catalogue: 33 H-Priority Deterministic Items

### H1 — Story artefact existence (exit code 1)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 1 | H1.1 | DoR contains a story reference header line matching `**Story reference:** <path>` | DoR artefact |
| 2 | H1.2 | Declared story file path resolves within the repository root (path traversal guard) | DoR artefact |
| 3 | H1.3 | Story file exists at the declared repo-relative path | Filesystem |
| 4 | H1.4 | Story file is readable and non-empty | Filesystem |

**Stderr format on failure:** `H1 FAIL: <description>`

---

### H2 — AC count and format (exit code 2)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 5 | H2.1 | Story contains at least 3 AC sections (lines matching `**AC[n]:**` or `## Acceptance Criteria` block with ≥3 numbered items) | Story file |
| 6 | H2.2 | Every AC section contains "Given" (case-insensitive) | Story file |
| 7 | H2.3 | Every AC section contains "When" (case-insensitive) | Story file |
| 8 | H2.4 | Every AC section contains "Then" (case-insensitive) | Story file |

**Stderr format on failure:**
- Count: `H2 FAIL: minimum 3 ACs required, found N`
- Format: `H2 FAIL: ACN does not follow Given/When/Then format (missing: <clause>)`

---

### H3 — Test plan existence and AC coverage (exit code 3)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 9 | H3.1 | DoR contains a test plan reference header line matching `**Test plan reference:** <path>` | DoR artefact |
| 10 | H3.2 | Declared test plan file exists at the declared repo-relative path | Filesystem |
| 11 | H3.3 | Test plan covers every AC from the story (AC slug appears in test plan coverage table) | Test plan file |

**Stderr format on failure:** `H3 FAIL: <description>`

---

### H4 — Out-of-scope section (exit code 4)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 12 | H4.1 | Story contains an "## Out of Scope" or "## Out-of-scope" section heading (case-insensitive) | Story file |
| 13 | H4.2 | Out-of-scope section body is not blank (at least one non-whitespace character after the heading) | Story file |
| 14 | H4.3 | Out-of-scope section body is not solely "N/A", "None", or "n/a" | Story file |

**Stderr format on failure:** `H4 FAIL: <description>`

---

### H5 — Benefit linkage (exit code 5)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 15 | H5.1 | Story contains a "## Benefit Linkage" section heading (case-insensitive) | Story file |
| 16 | H5.2 | Benefit Linkage section references a named metric using the pattern `M[0-9]+` or the word "Metric" | Story file |
| 17 | H5.3 | Benefit Linkage section does not contain a disqualifying phrase ("technical dependency", "unblocks", or "needed for") as the sole justification | Story file |

**Stderr format on failure:** `H5 FAIL: <description>`

---

### H6 — Complexity rating (exit code 6)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 18 | H6.1 | Story contains a "## Complexity Rating" or "**Complexity" section/field | Story file |
| 19 | H6.2 | The rating value is one of: 1, 2, or 3 (no other values accepted) | Story file |
| 20 | H6.3 | Scope stability field is present (line containing "Scope stability" with a non-blank value) | Story file |

**Stderr format on failure:** `H6 FAIL: <description>`

---

### H7 — Review findings (exit code 7)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 21 | H7.1 | DoR contains a review artefact reference header line matching `**Review artefact:** <path>` | DoR artefact |
| 22 | H7.2 | Declared review artefact file exists at the declared repo-relative path | Filesystem |
| 23 | H7.3 | Review report contains no "| HIGH" entries (unresolved HIGH findings) — status field check | Review file |

**Stderr format on failure:** `H7 FAIL: <description>`

---

### H8 — Test plan completeness (exit code 7)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 24 | H8.1 | Test plan contains an AC coverage table (line containing AC coverage header) | Test plan file |
| 25 | H8.2 | Each story AC slug appears in the test plan coverage table | Test plan file |
| 26 | H8.3 | Any AC listed as having a gap includes explicit acknowledgment text (gap entry is not blank) | Test plan file |

**Stderr format on failure:** `H8 FAIL: <description>`

---

### H8-ext — Cross-story schema dependency check (exit code 7)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 27 | H8-ext.1 | If story Dependencies block declares upstream stories (not "None"), DoR includes a `schemaDepends:` declaration | DoR artefact + Story file |
| 28 | H8-ext.2 | Each field listed in `schemaDepends:` exists as a property in `pipeline-state.schema.json` | DoR artefact + schema file |
| 29 | H8-ext.3 | If story Dependencies block is "None" or absent, H8-ext passes automatically (no schemaDepends required) | Story file |

**Stderr format on failure:** `H8-ext FAIL: <field> declared in schemaDepends is not present in pipeline-state.schema.json`

---

### H9 — Architecture constraints (exit code 7)

| Item | ID | Check | Source artefact |
|------|----|-------|-----------------|
| 30 | H9.1 | Story contains an "## Architecture Constraints" section heading | Story file |
| 31 | H9.2 | Architecture Constraints section body is not blank | Story file |
| 32 | H9.3 | Architecture Constraints section references at least one ADR, guardrail, or named constraint (substantive content, not placeholder text) | Story file |
| 33 | H9.4 | Review report shows no Category E HIGH findings (Category E = Architecture) | Review file |

**Stderr format on failure:** `H9 FAIL: <description>`

---

## Summary

| Category | Exit code | Items | IDs |
|----------|-----------|-------|-----|
| H1 | 1 | 4 | 1–4 |
| H2 | 2 | 4 | 5–8 |
| H3 | 3 | 3 | 9–11 |
| H4 | 4 | 3 | 12–14 |
| H5 | 5 | 3 | 15–17 |
| H6 | 6 | 3 | 18–20 |
| H7 | 7 | 3 | 21–23 |
| H8 | 7 | 3 | 24–26 |
| H8-ext | 7 | 3 | 27–29 |
| H9 | 7 | 4 | 30–33 |
| **Total** | — | **33** | — |

---

## Derivation

This catalogue was derived from the DoR SKILL.md hard blocks table (H1–H9, H8-ext) and the exit code assignment rationale above. The per-category sub-check breakdown was designed to reach the target of ≥33 test fixtures (the Phase 1 exit condition for M3) while keeping each item independently testable with a single assertion.

Items not included (out of scope for cdg.2, per story Out of Scope section):
- H-E2E: CSS-layout-dependent and E2E tooling checks
- H-NFR, H-NFR2, H-NFR3: NFR profile and compliance sign-off checks
- H-GOV, H-ADAPTER: Approval chain and injectable adapter checks
- W1–W5: Warning checks (non-fatal; different output path)
