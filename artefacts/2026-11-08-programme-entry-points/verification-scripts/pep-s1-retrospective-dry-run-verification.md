# AC Verification Script: Retrospective dry-run of /programme Steps 0-6 against skills-platform-phase4

**Story reference:** artefacts/2026-11-08-programme-entry-points/stories/pep-s1-retrospective-dry-run.md
**Technical test plan:** artefacts/2026-11-08-programme-entry-points/test-plans/pep-s1-retrospective-dry-run-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (coding agent, implementation session) | **Date:** 2026-11-10 | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo — none of the three cleanly fits: this is the coding agent's own completion-time walkthrough against real implementation output, pre-PR-merge. Per the already-logged W4 RISK-ACCEPT (no second contributor exists in this personal-scope project), no separate domain-expert pass is expected before or after this one.

---

## Setup

**Before you start:**
1. Open `skills/programme/SKILL.md` and `artefacts/archived/2026-04-19-skills-platform-phase4/` side by side — you'll be checking the dry-run's claims against this real folder.
2. Open the generated write-up at `artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md`.
3. No server or environment setup needed — this is a documentation review exercise.

**Reset between scenarios:** None needed — all scenarios read the same two files.

---

## Scenarios

---

### Scenario 1: The dry-run honestly scores phase4 against today's Step 0, with a real pass/fail and named signals

**Covers:** AC1

**Steps:**
1. Open the write-up findings document and find the "Step 0" section.
2. Check that it lists each of the four questions (how many teams, any hard cross-team dependencies, any formal phase gates, any consumer migration) plus the timeline signal, each with an actual answer drawn from phase4's real history — not a placeholder.
3. Check the final verdict stated for Step 0.

**Expected outcome:**
> The Step 0 section shows a verdict of "fail" against today's (pre-patch) scoring table, with each signal explicitly marked — team count: 1, cross-team hard dependencies: none, formal phase gates: none, consumer migration: none, timeline: 3 days. None of these should read "assumed" or "N/A" without an explanation of why.
>
> **[CORRECTED 2026-11-10 during implementation]** The figure was "2 days" in this script's original draft, carried forward from an earlier, narrower check (discovery/epic dates only) repeated across this tranche's artefacts. Implementation found the real full span, including the DoD completion artefacts dated 2026-04-21, is 3 days (2026-04-19 to 2026-04-21) — computed directly from the fixture's own internal `Date:` fields, not git log (which only reflects a single later archival commit). See `src/pep-s1-retrospective-dry-run/pep-s1-dry-run.js`'s header comment for the full methodology note.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed against the generated write-up: verdict "fail"; all 5 signals (multipleTeams, crossTeamHardDeps, formalPhaseGates, consumerMigration, timelineMultiPhaseOverOneQuarter) present, each `false` with a cited evidence string, none blank/assumed.

---

### Scenario 2: Steps 1 through 6 are each walked through against phase4's real files, with a clear verdict per step

**Covers:** AC2

**Steps:**
1. In the write-up document, find the sections for Steps 1 ("Basic identity") through 6 ("Programme artefact").
2. For each step, check it says one of: "satisfied by phase4's real data," "required real adaptation" (and what that adaptation was), or "genuine gap found" (and what the gap is).
3. Spot-check one claim against the real folder — open `artefacts/archived/2026-04-19-skills-platform-phase4/epics/` yourself and count the epics.

**Expected outcome:**
> Each of the 6 steps has one of the three labeled outcomes, with a short explanation — not a blank line or "see above." When you count the epics folder yourself, you should find 5 epics, matching what the write-up states for Step 1 or 2.

**Result:** [x] Pass  [ ] Fail
**Notes:** `artefacts/archived/2026-04-19-skills-platform-phase4/epics/` contains exactly 5 files (e1-e5), matching the write-up's "5 epics" citation. Steps use "satisfied"/"adapted"/"gap"/"scoping-mismatch" labels (same substance as the script's three-way framing, finer-grained to distinguish Step 5's mismatch from a true gap) — each with a substantive explanation, none blank.

---

### Scenario 3: A step that doesn't fit phase4's shape is recorded as a mismatch, not a false alarm

**Covers:** AC3

**Steps:**
1. Find the Step 5 ("Consumer registry") section in the write-up.
2. Check what it says about phase4 not being a "service/library rewrite" type.
3. Check that it names which of the four initiative types (named in `skills/programme/SKILL.md` Step 1) phase4 best matches instead.

**Expected outcome:**
> The Step 5 entry is explicitly labeled a "scoping mismatch" (not a "gap"), with a one-sentence explanation that phase4 isn't the right type of initiative for this step's assumptions, and a named best-fit initiative type from Step 1's list.

**Result:** [x] Pass  [ ] Fail
**Notes:** Step 5 verdict is literally "scoping-mismatch"; notes explain phase4's best-fit type is 3 (New platform build), not type 2 (service/library rewrite), and explicitly address the surface-level "consumer"/"migration" keyword overlap without being fooled by it.

---

### Scenario 4: The write-up is one real artefact with concrete, usable findings — not a vague summary

**Covers:** AC4

**Steps:**
1. Confirm the file exists at `artefacts/2026-11-08-programme-entry-points/reference/pep-s1-dry-run-findings.md` (or the exact equivalent path stated in the story).
2. Count the step entries — there should be 7 (Step 0 plus Steps 1-6).
3. For any entry marked as a real gap (not a mismatch), check it names a specific file, section, or mechanism — something a patch could act on, not just "this could be improved."

**Expected outcome:**
> One file exists with exactly 7 step entries. Every entry marked as a gap names something concrete and specific enough that you could point at exactly what needs to change.

**Result:** [x] Pass  [ ] Fail
**Notes:** File exists at the exact path; 7 step entries confirmed (1 Step-0 + 6 Steps 1-6, asserted by `tests/check-pep-s1-dry-run.js`). The one `gap`-classified entry (Step 3) names `templates/programme.md`'s workstream entry schema specifically — a concrete thing a patch could act on.

---

### Edge case: The dry-run doesn't invent a "yes" answer where phase4's real history has no evidence either way

**Covers:** AC1, AC2

**Steps:**
1. Pick any signal or step where phase4's history is silent (no explicit mention either way — for example, formal phase gates).
2. Check how the write-up handles that silence.

**Expected outcome:**
> The write-up says something like "no evidence of phase gates found in phase4's history" rather than assuming either "yes, it had phase gates" or treating silence as automatically "no" without saying so. The honest-absence case is called out, not silently defaulted.

**Result:** [x] Pass  [ ] Fail
**Notes:** `formalPhaseGates` evidence quotes discovery.md directly ("No hard timeline...") and explicitly states "No stakeholder, risk-forum, or regulatory checkpoint is named anywhere in the fixture" — an explicit absence statement, not a silent default to false.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | Timeline figure corrected 2 -> 3 days during implementation |
| Scenario 2 | Pass | 5 epics confirmed by direct count |
| Scenario 3 | Pass | Scoping-mismatch correctly distinguished from gap |
| Scenario 4 | Pass | 7 entries confirmed; gap names a specific file |
| Edge case | Pass | Absence stated explicitly, not silently defaulted |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
