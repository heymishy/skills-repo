# AC Verification Script: Production Docker image includes artefacts/ and .github/pipeline-state.json, so local-disk-based artefact features actually work

**Story reference:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/stories/daga-s1-include-artefacts-and-github-in-docker-image.md
**Technical test plan:** artefacts/2026-09-04-dockerignore-artefacts-and-github-exclusion-fix/test-plans/daga-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `skills-framework` on `skills-framework.fly.dev` (production).
2. Have access to the GitHub Actions run history for this repo (to confirm the promoted image actually contains the expected directories, if inspectable).

---

## Scenarios

---

### Scenario 1: `aada-s1`'s archived-directory fallback now actually works in production

**Covers:** AC1 (real-world effect)

**Steps:**
1. Navigate to `/features/2026-04-14-skills-platform-phase3` (or another real archived feature).

**Expected outcome:**
> The artefact index shows the feature's own real artefacts — not "No artefacts found for this feature", the exact gap `aada-s1` was supposed to fix but couldn't, pre-this-story.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: `fapg-s1`'s per-story accordion now actually renders in production

**Covers:** AC1 (real-world effect)

**Steps:**
1. On the same page, locate the "Platform Structural Integrity" epic section.

**Expected outcome:**
> A real `<details>`/`<summary>` epic/story accordion renders, with `p3.3`/`p3.4` as their own expandable rows — not the flat, ungrouped list this page showed before this story.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A gate-confirm action in the web UI still fails safely, not silently

**Covers:** AC4/AC5 (real-world effect — the regression this story exists to prevent)

**Steps:**
1. Complete a stage via the web UI's own guided skill-session flow (e.g. a `/discovery` session) and click gate-confirm.
2. Check the server's own logs (Fly logs) for the `pipeline_state_write_failed` or `pipeline_state_updated` event.

**Expected outcome:**
> If the deployed container genuinely has no `.git/` directory (expected, since `.git/` remains dockerignore-excluded), the log shows `pipeline_state_write_failed` with a message naming the missing `.git/` directory — not a silent "success" that actually wrote to a non-durable copy.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
