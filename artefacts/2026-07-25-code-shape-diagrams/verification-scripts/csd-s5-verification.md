# AC Verification Script: As-built diagram generation via static migration-file parsing

**Story reference:** artefacts/2026-07-25-code-shape-diagrams/stories/csd-s5-as-built-diagram-generation.md
**Technical test plan:** artefacts/2026-07-25-code-shape-diagrams/test-plans/csd-s5-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Pick a small, already-merged feature from this repo (real code, real migration files).
2. Have a deliberately broken migration-file fixture ready for the negative-case scenario.

**Reset between scenarios:** No shared state — each scenario is independent.

---

## Scenarios

---

### Scenario 1: A real feature's data model gets diagrammed correctly

**Covers:** AC1

**Steps:**
1. Run `/verify-completion` (or the equivalent as-built generation step) against the chosen real, already-merged feature.
2. Look at the generated Data Model diagram.

**Expected outcome:**
> The diagram shows the actual tables and relationships that feature's real migration files created — matching what you can see by reading those files yourself.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The as-built diagram reflects what was really built, not a guess

**Covers:** AC2

**Steps:**
1. Look at the same feature's generated System Architecture and Program Design diagrams.
2. Compare them against the feature's real file structure and code.

**Expected outcome:**
> The diagrams match the real code's actual shape — you don't see something that looks like a rough approximation or something an AI might have "remembered" incorrectly; it reflects the real, current files.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: As-built diagrams are saved, not just shown once

**Covers:** AC3

**Steps:**
1. After Scenario 1/2, look in the feature's artefact folder on disk.

**Expected outcome:**
> You find saved diagram files there — you don't have to re-run the generation step to see them again later.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A broken migration file fails clearly, doesn't fake a result

**Covers:** AC4

**Steps:**
1. Run the as-built generation step against the deliberately broken migration-file fixture.

**Expected outcome:**
> You see a clear error message naming the problem file and what went wrong — you do NOT see an empty diagram or an incorrect one presented as if it succeeded.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
