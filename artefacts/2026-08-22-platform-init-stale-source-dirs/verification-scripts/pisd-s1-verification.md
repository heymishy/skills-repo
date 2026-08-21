# AC Verification Script: Point platform-init.js at the real skills/ and templates/ source directories

**Story reference:** `artefacts/2026-08-22-platform-init-stale-source-dirs/stories/pisd-s1-fix-platform-init-source-directories.md`
**Technical test plan:** `artefacts/2026-08-22-platform-init-stale-source-dirs/test-plans/pisd-s1-test-plan.md`
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open a terminal in the root of the `skills-repo` checkout.
2. No server, database, or environment variables need to be running — everything in this script works from the command line against temporary folders.
3. You'll need Node.js installed (already required to work in this repo).

**Reset between scenarios:** Each scenario creates its own fresh temporary folder and cleans up after itself — no manual reset needed between scenarios.

---

## Scenarios

---

### Scenario 1: Running the installer gives you the real, full skill set

**Covers:** AC1, AC2

**Steps:**
1. In your terminal, run:
   ```
   node -e "const fs=require('fs'),os=require('os'),path=require('path');const t=fs.mkdtempSync(path.join(os.tmpdir(),'pisd-check-'));require('child_process').execFileSync(process.execPath,['scripts/platform-init.js',t],{stdio:'inherit'});console.log('INSTALLED SKILLS:', fs.readdirSync(path.join(t,'.github','skills')).length);console.log('orient present:', fs.existsSync(path.join(t,'.github','skills','orient')));"
   ```

**Expected outcome:**
> The output ends with two lines: `INSTALLED SKILLS: <a number that is 40 or higher>` and `orient present: true`. Before this fix, that first number would have read `5` and the second line would have read `orient present: false`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Running the installer gives you the real, full template set

**Covers:** AC1, AC3

**Steps:**
1. Run:
   ```
   node -e "const fs=require('fs'),os=require('os'),path=require('path');const t=fs.mkdtempSync(path.join(os.tmpdir(),'pisd-check2-'));require('child_process').execFileSync(process.execPath,['scripts/platform-init.js',t],{stdio:'inherit'});console.log('INSTALLED TEMPLATES:', fs.readdirSync(path.join(t,'.github','templates')).length);console.log('story.md present:', fs.existsSync(path.join(t,'.github','templates','story.md')));"
   ```

**Expected outcome:**
> The output ends with `INSTALLED TEMPLATES: <a number that is 35 or higher>` and `story.md present: true`. Before this fix, the count would have read `1` and `story.md present` would have read `false`.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The existing skip/force behaviour still works correctly

**Covers:** AC4

**Steps:**
1. Run:
   ```
   node tests/check-i1.2-platform-init-fetch.js
   ```

**Expected outcome:**
> The last line of output reads `[i1.2-platform-init-fetch] Results: 20 passed, 0 failed`. In particular, look for two lines earlier in the output: `✔ platform-init-reports-skipped-files` and `✔ platform-init-force-flag-overwrites-existing` — both should show a checkmark (✔), not a cross (✖).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: The full test suite has no new failures

**Covers:** AC6

**Steps:**
1. Run:
   ```
   node scripts/run-all-tests.js
   ```
2. Wait for it to finish (this takes a few minutes).

**Expected outcome:**
> The summary line near the end reads `[run-all-tests] <N> file(s) run, <F> failed`, and the "Failed files" list underneath it contains only `scripts/check-pipeline-state-integrity.js` (a separate, already-known, already-accepted issue unrelated to this story) — no other file should appear in that list.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Edge case: What is `.github/skills/`'s current content for, and is it safe to leave behind?

<!--
  This is AC5 — a research/documentation task, not a pass/fail behaviour check.
  It must still be worked through and answered before this story is considered done.
-->

**Covers:** AC5

**Steps:**
1. In your terminal, run:
   ```
   git log --follow --oneline -- .github/skills/infra-definition/SKILL.md
   ```
   and read the commit messages this returns, oldest to newest.
2. Run:
   ```
   node -e "console.log(require('fs').readdirSync('.github/skills'))"
   ```
   to see the current full list (`infra-definition`, `infra-plan`, `infra-review`, `schema-migration-plan`, `schema-migration-review` at time of writing).
3. Search the rest of the repository for anything that specifically expects these five names — for example:
   ```
   git grep -n "infra-definition\|infra-plan\|infra-review\|schema-migration-plan\|schema-migration-review" -- ':!.github/skills' ':!artefacts'
   ```
4. Decide, and write down in this story's `decisions.md` (create one if it doesn't exist yet) or directly in a closing comment on the story: are these five skills (a) dead leftovers safe to leave as-is or delete, (b) something this repo's own `.github/skills/`-reading behaviour (see F15/`csdg-s1`) still depends on, or (c) something that should also be copied when `platform-init.js` runs for a new consumer repo (in which case, does the fix need a second `COPY_DIRS` entry to merge them in, rather than fully replacing the source)?

**Expected outcome:**
> A short, written answer to the question above — recorded somewhere durable (this story's `decisions.md`, or a note added to this verification script's Notes field below) — before this story is marked done. There's no single "correct" pass/fail here; the requirement is that the question gets a deliberate, documented answer rather than being silently ignored.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — full skill set installed | | |
| Scenario 2 — full template set installed | | |
| Scenario 3 — existing skip/force tests pass | | |
| Scenario 4 — full suite has no new failures | | |
| Edge case — `.github/skills/` purpose documented | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
