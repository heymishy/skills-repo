# AC Verification Script: Feature artefact lookup falls back to the archived directory when the primary path is gone

**Story reference:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/stories/aada-s1-check-archived-directory-fallback.md
**Technical test plan:** artefacts/2026-09-04-artefact-lookup-archived-directory-fix/test-plans/aada-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `skills-framework` on `skills-framework.fly.dev` (production).
2. Know a real archived feature slug — `2026-04-14-skills-platform-phase3` is the one that surfaced this gap (7 epics, 21 stories, real per-story artefacts under `artefacts/archived/2026-04-14-skills-platform-phase3/`).

---

## Scenarios

---

### Scenario 1: An archived feature's artefacts are now found

**Covers:** AC2

**Steps:**
1. Navigate to `/features/2026-04-14-skills-platform-phase3`.

**Expected outcome:**
> The artefact index shows the real artefacts (discovery, benefit-metric, decisions, nfr-profile, plus per-story files) — not "No artefacts found for this feature".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A non-archived feature is unaffected

**Covers:** AC1

**Steps:**
1. Navigate to any recently-shipped, non-archived feature's artefact page (e.g. `pefl-s1`, `fal-s1`, or `aada-s1` itself once merged).

**Expected outcome:**
> Behaves exactly as before this change — no visible difference, no extra load time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A genuinely nonexistent feature still shows the honest empty state

**Covers:** AC3

**Steps:**
1. Navigate directly to `/features/this-slug-genuinely-does-not-exist-anywhere`.

**Expected outcome:**
> "No artefacts found for this feature" still renders — no crash, no broken page.

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
