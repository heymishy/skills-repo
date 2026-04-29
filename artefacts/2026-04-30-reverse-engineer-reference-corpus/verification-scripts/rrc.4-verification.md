# AC Verification Script: New `/reference-corpus-update` skill

**Story reference:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/stories/rrc.4-corpus-update-skill.md`
**Technical test plan:** `artefacts/2026-04-30-reverse-engineer-reference-corpus/test-plans/rrc.4-test-plan.md`
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Confirm the implementation branch is checked out.
2. Open `.github/skills/reference-corpus-update/SKILL.md` once created.
3. Have a terminal open at the repository root.

**Reset between scenarios:** No reset needed.

---

## Scenarios

---

### Scenario 1 — SKILL.md file exists with all required contract markers

**Covers:** AC1

**Steps:**
1. Check that `.github/skills/reference-corpus-update/SKILL.md` exists in the repository.
2. Open the file and confirm the YAML frontmatter (top of file) contains all four of:
   - [ ] `name:`
   - [ ] `description:`
   - [ ] `triggers:`
   - [ ] An outputs section (`## Output` or `outputs:`)
3. Run: `node .github/scripts/check-skill-contracts.js`

**Expected outcome:**
- File exists.
- All four markers are present.
- `check-skill-contracts.js` reports **41 skill(s)** — up from the previous 40.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 2 — Skill asks for both inputs

**Covers:** AC2

**Steps:**
1. Read the SKILL.md session start or inputs section.
2. Check it instructs the operator (or asks) for:
   - [ ] The `corpus-state.md` file path (or confirms it is at the standard location)
   - [ ] The list of changed source files (e.g. paste `git diff --name-only`)

**Expected outcome:**
Both inputs are explicitly requested. The operator is not expected to infer them.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 3 — Targeted DEEPEN scope produced for matched rules

**Covers:** AC3

**Steps:**
1. In SKILL.md, read the matching step (cross-referencing changed files against corpus rule IDs).
2. Check whether, when matches are found, the skill produces a DEEPEN pass with a scope limited to the matching rule IDs.
3. Confirm the output references the specific rule IDs (e.g. `L1-003`, `L4-007`) rather than a full-corpus re-run.

**Expected outcome:**
SKILL.md instructs a targeted DEEPEN pass whose scope includes only the rule IDs that correspond to changed source files. This minimises unnecessary re-extraction.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 4 — "No corpus rules affected" message for no-match case

**Covers:** AC4

**Steps:**
1. In SKILL.md, read the section for when no changed files correspond to any known corpus rules.
2. Check that the operator receives a clear, unambiguous message (e.g. "No corpus rules affected — no DEEPEN pass required").

**Expected outcome:**
SKILL.md includes a distinct outcome for the no-match case, advising the operator that no re-extraction is needed. The operator is not left wondering what to do.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 5 — `corpus-state.md` update instructed with correct fields

**Covers:** AC5

**Steps:**
1. In SKILL.md, read the closing step (state update).
2. Check that the operator is instructed to update `corpus-state.md` with:
   - [ ] `lastRunAt` — ISO 8601 timestamp of this run
   - [ ] `changeNote` — one-line description of what changed

**Expected outcome:**
Both fields are explicitly named in the update instruction. This keeps the corpus state current so future runs can correctly identify stale rules.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 6 — Trigger phrases are correct

**Covers:** AC6

**Steps:**
1. In the YAML frontmatter `triggers:` section, check for each of:
   - [ ] "update corpus" (or "update the corpus")
   - [ ] "corpus refresh"
   - [ ] "legacy rules"

**Expected outcome:**
All three trigger phrases present. These are the expected natural-language invocations for this skill.

**Pass / Fail:** _______  **Notes:** _______________________

---

### Scenario 7 — SKILL.md is concise (≤ 100 lines)

**Covers:** NFR

**Steps:**
1. Run: `wc -l .github/skills/reference-corpus-update/SKILL.md`
   (Windows PowerShell: `(Get-Content .github/skills/reference-corpus-update/SKILL.md).Count`)
2. Note the line count.

**Expected outcome:**
Line count ≤ 100. The skill has focused scope and should not require more than ~100 lines.

**Pass / Fail:** _______  **Notes:** _______________________

---

## Summary

| Scenario | AC | Result |
|----------|----|--------|
| 1 — File exists + all 4 markers + 41 skills | AC1 | |
| 2 — Asks for both inputs | AC2 | |
| 3 — Targeted DEEPEN scope for matched rules | AC3 | |
| 4 — No-match message | AC4 | |
| 5 — corpus-state.md update with lastRunAt + changeNote | AC5 | |
| 6 — Triggers correct | AC6 | |
| 7 — Line count ≤ 100 | NFR | |

**Overall result:** [ ] Pass — all scenarios pass  [ ] Fail — see findings above
**Verified by:** _____________  **Date:** _____________
