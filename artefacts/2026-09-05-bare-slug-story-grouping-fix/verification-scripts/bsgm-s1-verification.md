# AC Verification Script: Group a story's own bare-slug definition file into its own accordion section

**Story reference:** artefacts/2026-09-05-bare-slug-story-grouping-fix/stories/bsgm-s1-fix-bare-slug-story-file-grouping.md
**Technical test plan:** artefacts/2026-09-05-bare-slug-story-grouping-fix/test-plans/bsgm-s1-test-plan.md
**Script version:** 1
**Verified by:** _____________ | **Date:** _____________ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in to the platform.
2. Have this exact URL ready: `https://skills-framework.fly.dev/features/2026-09-02-product-dashboard-triage` — a real, already-affected feature.

**Reset between scenarios:** None needed — read-only checks.

---

## Scenarios

---

### Scenario 1: A story's own definition file no longer appears as an orphaned entry at the top of the page

**Covers:** AC1, AC4

**Steps:**
1. Open `/features/2026-09-02-product-dashboard-triage`.
2. Look at the "Stories" section near the top of the page (the flat list, before the phase/story breakdown further down).

**Expected outcome:**
> The flat "Stories" list at the top no longer shows `pdt-s1`, `pdt-s2`, `pdt-s3`, or `pdt-s4` as bare entries — or the "Stories" heading disappears entirely if nothing else remains in it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Each story's own definition file now appears inside its own accordion, alongside its other artefacts

**Covers:** AC1, AC4

**Steps:**
1. On the same page, scroll to the phase/story breakdown further down.
2. Click to open the `pdt-s1` section.

**Expected outcome:**
> Inside `pdt-s1`'s own expanded section, you see a link to the story's own definition file (`pdt-s1.md`) listed alongside its Definition of Done, Ready Check, Plan, Review, and Test Plan links — not missing, and not shown a second time somewhere else on the page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A feature using the newer descriptive-filename convention still looks exactly as it did before

**Covers:** AC2 (regression guard)

**Steps:**
1. Open a feature from this session's own recent work, e.g. `/features/2026-09-05-feature-page-ux-redesign`.
2. Open the `fpux.1` or `fpux.2` section.

**Expected outcome:**
> No visible change — the story's own definition file already appeared correctly inside its accordion before this fix (it used the descriptive-suffix naming convention), and still does.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — No orphaned entry at top | | |
| Scenario 2 — Story file inside its own accordion | | |
| Edge case — Descriptive-filename feature unchanged | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
