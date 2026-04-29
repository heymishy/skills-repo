## Test Plan: New `/reference-corpus-update` skill

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.4-corpus-update-skill.md`
**Epic reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/epics/rrc-epic-1.md`
**Test plan author:** Copilot
**Date:** 2026-04-30

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | SKILL.md file created; YAML frontmatter has all 4 contract markers; `check-skill-contracts.js` would report 41 skills | 2 tests | — | — | — | — | 🟢 |
| AC2 | SKILL.md asks operator for `corpus-state.md` path AND changed file list | 2 tests | — | — | — | — | 🟢 |
| AC3 | SKILL.md produces DEEPEN pass scope instruction with rule IDs matching changed files | 2 tests | — | — | — | — | 🟢 |
| AC4 | SKILL.md has "No corpus rules affected" (or equivalent) message for no-match case | 1 test | — | — | — | — | 🟢 |
| AC5 | SKILL.md instructs update of `corpus-state.md` with `lastRunAt` and `changeNote` fields | 2 tests | — | — | — | — | 🟢 |
| AC6 | YAML frontmatter triggers include "update corpus", "corpus refresh", "legacy rules" | 1 test | — | — | — | — | 🟢 |
| 4-L2 | AC1 (41 skills count) is branch-scoped — test asserts SKILL.md existence + all markers present | note | — | — | — | — | 🟡 |
| NFR | SKILL.md ≤ 100 lines | 1 test | — | — | — | — | 🟢 |

**Note on 4-L2 (branch-scoped AC):** Review finding 4-L2 flagged that the "41 skills" count is branch-scoped — the file does not exist on master yet. The test `rrc4-skill-file-exists` asserts the file exists and has all required markers. The `check-skill-contracts.js` 41-skill assertion should be verified in the implementation branch after the file is created (not in CI on master).

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Cannot invoke skill as agent to verify runtime behaviour | AC3, AC4 | Runtime only | SKILL.md is instructions, not executable code | Covered by manual verification script scenarios 3 and 4 |

---

## Test Data Strategy

**Source:** Synthetic — tests read `.github/skills/reference-corpus-update/SKILL.md` once created.
**PCI/sensitivity in scope:** No
**Availability:** File does not exist yet — ALL tests fail before implementation.
**Owner:** Self-contained.

---

## Unit Tests

**Test file:** `tests/check-rrc4-corpus-update-skill.js`
**Framework:** Node.js built-ins only (`fs`, `path`) — zero external dependencies.

All tests fail before implementation because the target file does not exist.

---

### T4.1 — SKILL.md file exists (AC1)
**Covers:** AC1
**Action:** Check that `.github/skills/reference-corpus-update/SKILL.md` exists.
**Expected:** File exists.
**Fails before implementation:** Yes.

---

### T4.2 — All four YAML frontmatter contract markers present (AC1)
**Covers:** AC1
**Action:** Check `name:`, `description:`, `triggers:`, and outputs section present in SKILL.md.
**Expected:** All four markers present — `check-skill-contracts.js` would then count this as the 41st skill.
**Fails before implementation:** Yes.

---

### T4.3 — SKILL.md asks for `corpus-state.md` path (AC2)
**Covers:** AC2
**Action:** Search SKILL.md for "corpus-state".
**Expected:** SKILL.md references `corpus-state.md` as an input — the operator is asked to provide (or confirm) its path.
**Fails before implementation:** Yes.

---

### T4.4 — SKILL.md asks for changed file list (AC2)
**Covers:** AC2
**Action:** Search SKILL.md for language asking for changed files (e.g. "changed files", "modified files", "diff", "changed source").
**Expected:** SKILL.md instructs the operator to provide the list of changed source files.
**Fails before implementation:** Yes.

---

### T4.5 — SKILL.md produces DEEPEN pass scope for matching rules (AC3)
**Covers:** AC3
**Action:** Search SKILL.md for "DEEPEN" in the context of changed rules.
**Expected:** SKILL.md instructs a DEEPEN pass with scope limited to rule IDs that correspond to changed files.
**Fails before implementation:** Yes.

---

### T4.6 — SKILL.md references rule IDs in DEEPEN scope instructions (AC3)
**Covers:** AC3
**Action:** Search SKILL.md for "rule" near "DEEPEN" or changed-files context.
**Expected:** SKILL.md references rule IDs as the scoping mechanism for the targeted DEEPEN pass.
**Fails before implementation:** Yes.

---

### T4.7 — SKILL.md has "No corpus rules affected" message for no-match case (AC4)
**Covers:** AC4
**Action:** Search SKILL.md for "no.*rules" or "no corpus" or equivalent no-match messaging.
**Expected:** SKILL.md includes a message for when changed files don't correspond to any known corpus rules — the operator is told no DEEPEN pass is needed.
**Fails before implementation:** Yes.

---

### T4.8 — SKILL.md instructs updating `lastRunAt` in corpus-state.md (AC5)
**Covers:** AC5
**Action:** Search SKILL.md for "lastRunAt" or "last.*run" near corpus-state context.
**Expected:** SKILL.md instructs updating `corpus-state.md` with a `lastRunAt` timestamp.
**Fails before implementation:** Yes.

---

### T4.9 — SKILL.md instructs updating `changeNote` in corpus-state.md (AC5)
**Covers:** AC5
**Action:** Search SKILL.md for "changeNote" or "change.*note" near corpus-state context.
**Expected:** SKILL.md instructs updating `corpus-state.md` with a `changeNote` describing what changed.
**Fails before implementation:** Yes.

---

### T4.10 — Triggers include "update corpus" (AC6)
**Covers:** AC6
**Action:** Search SKILL.md `triggers:` section for "update corpus".
**Expected:** "update corpus" (or "update the corpus") appears in the triggers list.
**Fails before implementation:** Yes.

---

### T4.11 — Triggers include "corpus refresh" (AC6)
**Covers:** AC6
**Action:** Search SKILL.md `triggers:` section for "corpus refresh".
**Expected:** "corpus refresh" appears in the triggers list.
**Fails before implementation:** Yes.

---

### T4.12 — Triggers include "legacy rules" (AC6)
**Covers:** AC6
**Action:** Search SKILL.md `triggers:` section for "legacy rules".
**Expected:** "legacy rules" appears in the triggers list.
**Fails before implementation:** Yes.

---

### T4.13 — SKILL.md name matches skill directory (contract requirement)
**Covers:** AC1
**Action:** Read SKILL.md `name:` frontmatter value; verify it matches "reference-corpus-update" or "Reference Corpus Update" (case-insensitive).
**Expected:** The `name:` value corresponds to the skill directory name.
**Fails before implementation:** Yes.

---

### T4.14 — SKILL.md ≤ 100 lines (NFR)
**Covers:** NFR
**Action:** Count lines in SKILL.md; assert ≤ 100.
**Expected:** Line count ≤ 100. The skill has focused scope and should not require more than ~100 lines.
**Fails before implementation:** No (file doesn't exist — test file-not-found falls in T4.1). Checked after creation.

---

## Integration Tests

None — new standalone SKILL.md file. No component seams to test.

---

## NFR Tests

| NFR | Test | Pass condition |
|-----|------|----------------|
| SKILL.md ≤ 100 lines | T4.14 | Line count ≤ 100 |

---

## Gap table

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| Runtime dispatch not testable | AC3, AC4 | Runtime only | SKILL.md is instructions | Covered by manual scenarios 3 and 4 |
| 41-skill count is branch-scoped | AC1 | Branch scope | File does not exist on master | Test asserts markers present; 41-count verified in implementation branch manually |

---

## Implementation notes for the coding agent

1. Create `.github/skills/reference-corpus-update/SKILL.md` with the following structure:
   - YAML frontmatter: `name:`, `description:`, `triggers:` (including "update corpus", "corpus refresh", "legacy rules"), and `outputs:` section
   - Session start: ask operator for `corpus-state.md` location and changed source file list
   - Matching step: cross-reference changed files against rule IDs in corpus-state.md
   - If matches found: produce targeted DEEPEN pass scope (rule IDs only for changed files)
   - If no matches: output "No corpus rules affected" message
   - Close: instruct update of `corpus-state.md` with `lastRunAt` (ISO 8601) and `changeNote` (one-line description of the change)
2. Keep file ≤ 100 lines.
3. After creating the file, verify that `node .github/scripts/check-skill-contracts.js` reports 41 skills.
