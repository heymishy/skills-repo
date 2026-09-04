# AC Verification Script: The feature artefact page groups files by story within one page per feature, instead of one flat list per story slug

**Story reference:** artefacts/2026-09-04-feature-artefact-page-story-grouping/stories/fapg-s1-group-artefacts-by-story-one-page-per-feature.md
**Technical test plan:** artefacts/2026-09-04-feature-artefact-page-story-grouping/test-plans/fapg-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `skills-framework` on `skills-framework.fly.dev` (production).
2. Know a real multi-story feature: `2026-04-14-skills-platform-phase3` (7 epics, 21 stories, e.g. `p3.3`/`p3.4` under "Platform Structural Integrity") — the exact one this story's own investigation used.
3. Know a real single-story feature for comparison: any story shipped this session (e.g. `pefl-s1`, `aada-s1`).

---

## Scenarios

---

### Scenario 1: A multi-story feature shows feature-level artefacts once, then a story accordion

**Covers:** AC1, AC5

**Steps:**
1. Navigate to `/features/2026-04-14-skills-platform-phase3` (once `aada-s1`'s archived-directory fix has this feature findable, and after a fresh sync populates any needed real data).
2. Locate the "Platform Structural Integrity" epic section, expand `p3.3`.

**Expected outcome:**
> Discovery/Benefit Metric appear once, at the top, not repeated per story. `p3.3`'s own story/test-plan/DoD files appear only inside its own expanded row, not `p3.4`'s.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A single-story feature is completely unaffected

**Covers:** AC2

**Steps:**
1. Navigate to any single-story feature's own artefact page.

**Expected outcome:**
> No accordion, no epic/story grouping UI — page looks exactly as it always has.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
