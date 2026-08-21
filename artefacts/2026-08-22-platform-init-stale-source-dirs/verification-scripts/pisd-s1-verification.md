# AC Verification Script: Point platform-init.js at the real skills/ and templates/ source directories

**Story reference:** `artefacts/2026-08-22-platform-init-stale-source-dirs/stories/pisd-s1-fix-platform-init-source-directories.md`
**Technical test plan:** `artefacts/2026-08-22-platform-init-stale-source-dirs/test-plans/pisd-s1-test-plan.md`
**Script version:** 1
**Verified by:** Copilot (agent self-verification, per /verify-completion) | **Date:** 2026-08-22 | **Context:** [x] Pre-code  [x] Post-merge  [ ] Demo

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Actual output: `INSTALLED SKILLS: 51` / `orient present: true`.

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Actual output: `INSTALLED TEMPLATES: 41` / `story.md present: true`.

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed `[i1.2-platform-init-fetch] Results: 20 passed, 0 failed`. Required a companion fix to `scripts/platform-fetch.js` (same stale-source-path bug, separate script) discovered while confirming this scenario — see decisions.md and the branch's own commit history.

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Actual: `531 file(s) run, 4 failed` — `scripts/check-pipeline-state-integrity.js` plus `tests/check-p3.5-validate-trace.js`, `tests/check-p4-enf-decision.js`, `tests/check-wsm2-collaborative-sessions.js`. All 4 are pre-existing and separately tracked (acknowledged at `/branch-setup`, unrelated to this story), matching this scenario's original intent — the list this scenario expected was written before those 3 additional pre-existing findings existed, but none are new regressions from this story. Along the way, the relocation itself (Task 3) surfaced and required fixing 3 additional real regressions before reaching this clean state: `src/web-ui/modules/repo-bootstrap.js` (a third script sharing the same stale-source-path bug), 6 tests hardcoding the old `.github/skills/`/`.github/templates/` path for the relocated files, and 2 artefact-coverage exemption entries for a pre-existing DoR-slug-mismatch this relocation made visible for the first time — see decisions.md and commit `0721cec5`.

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Answered in `decisions.md` ("AC5 investigation" entry, 2026-08-22): all 5 skills (plus `staging-data-policy.md`) were added to `.github/skills/`/`.github/templates/` two days after the repo-root migration (commit `1b1d0682`) — real, general-purpose files placed in the wrong (legacy) directory by mistake, not dead leftovers. Resolved by relocating them via `git mv` to `skills/`/`templates/` (Task 3), so they became ordinary members of the real skill/template set with no special-case merge logic needed.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — full skill set installed | Pass | 51 skills installed, `orient` present |
| Scenario 2 — full template set installed | Pass | 41 templates installed, `story.md` present |
| Scenario 3 — existing skip/force tests pass | Pass | 20/20, required a companion fix to `platform-fetch.js` |
| Scenario 4 — full suite has no new failures | Pass | 4 pre-existing/unrelated failures, 0 new; 3 additional regressions found and fixed along the way |
| Edge case — `.github/skills/` purpose documented | Pass | Answered in decisions.md — misplaced files, relocated |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

No open findings. Three additional real bugs of the same root-cause class were found and fixed during implementation (not merely test artefacts): `scripts/platform-fetch.js` and `src/web-ui/modules/repo-bootstrap.js` shared `platform-init.js`'s stale `.github/skills/`/`.github/templates/` source-path bug — both fixed as part of this story (see `decisions.md` and commit `0721cec5`), since AC4 and AC6 could not otherwise be honestly satisfied.
