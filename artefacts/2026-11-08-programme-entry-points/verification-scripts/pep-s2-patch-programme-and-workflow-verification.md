# AC Verification Script: Patch /programme and /workflow for the gaps story 1 (and the discovery-correction) found

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s2-patch-programme-and-workflow.md
**Technical test plan:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s2-patch-programme-and-workflow-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open `skills/programme/SKILL.md` and find Step 0's scoring table (around lines 37-98).
2. Open `skills/workflow/SKILL.md` and find the route-selector option 5 / "If 5 — Programme track" branch (around lines 164-189).
3. Open `skills/orient/SKILL.md`.
4. Have the two historical case folders handy: `artefacts/archived/2026-04-19-skills-platform-phase4/` and `artefacts/2026-07-09-team-identity-roles/`.

**Reset between scenarios:** None needed — all scenarios are read-only checks of the patched skill files.

---

## Scenarios

---

### Scenario 1: Step 0's scoring table now has a clear, numbered epic-count signal

**Covers:** AC1

**Steps:**
1. Open `skills/programme/SKILL.md`'s Step 0 scoring table.
2. Look for a row about epic count.

**Expected outcome:**
> The table has a row that says something like "epic count within a single feature ≥ 4," with a real number — not a phrase like "a defined threshold" or "TBD."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Scoring phase4 against the new Step 0 now says "programme track" — it used to say no

**Covers:** AC2

**Steps:**
1. Using `skills/programme/SKILL.md`'s patched Step 0, answer the questions as if you were phase4: 1 team, no hard cross-team dependencies, no formal phase gates, no consumer migration, 5 epics.
2. Check the final verdict.

**Expected outcome:**
> The verdict is "programme track" / "pass," and the reason given points specifically to the 5 epics meeting the new "≥4 epics" signal — not a vague "multiple factors" explanation.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Scoring team-identity-roles the same way still correctly says "standard pipeline"

**Covers:** AC3

**Steps:**
1. Using the same patched Step 0, answer the questions as if you were `team-identity-roles`: 1 team, 1 epic, 9 stories.
2. Check the final verdict.

**Expected outcome:**
> The verdict is "standard pipeline" / "fail" (for programme-track qualification) — 1 epic does not meet the ≥4 threshold, and nothing else about this case should push it over. The new signal should not have accidentally made this case look like a programme candidate.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: /workflow no longer asks its own separate version of the Step 0 questions

**Covers:** AC4

**Steps:**
1. Open `skills/workflow/SKILL.md`'s route-selector option 5 section.
2. Read what it tells you to do when a feature might be programme-scale.

**Expected outcome:**
> The text sends you directly into `/programme`'s own Step 0 (something like "run /programme's Step 0 now") instead of asking you team count, cross-team dependency, phase gate, and consumer migration questions again in its own words.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: /orient now mentions /programme at least once, in a sensible place

**Covers:** AC5

**Steps:**
1. Open `skills/orient/SKILL.md`.
2. Search the page for the word "programme."

**Expected outcome:**
> At least one mention of `/programme` appears, placed near language about large, multi-team, or multi-phase work — not buried in an unrelated section.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Any extra patch beyond the two known ones is clearly traced to a real finding

**Covers:** AC6

**Steps:**
1. Open the pep-s1 write-up findings document.
2. Compare it against whatever else, if anything, changed in `skills/programme/SKILL.md` or `skills/workflow/SKILL.md` beyond the epic-count signal and the /workflow deferral.
3. If something else changed, find the specific line in the write-up it's supposed to come from. If nothing else changed, this edge case is satisfied trivially.

**Expected outcome:**
> Either: (a) nothing beyond the two known patches was made, which is fine and expected, or (b) any additional change can be pointed to a specific sentence in pep-s1's write-up or a specific line in `decisions.md` — never a change that just "seemed like a good idea" with no paper trail.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| Scenario 5 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
