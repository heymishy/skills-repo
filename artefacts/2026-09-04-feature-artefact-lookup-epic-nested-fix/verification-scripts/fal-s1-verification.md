# AC Verification Script: Feature artefact page resolves epic-nested stories (object and bare-string shaped) to their real feature directory before looking up artefacts

**Story reference:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/stories/fal-s1-resolve-real-feature-slug-before-artefact-lookup.md
**Technical test plan:** artefacts/2026-09-04-feature-artefact-lookup-epic-nested-fix/test-plans/fal-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to `skills-framework` on `skills-framework.fly.dev` (production) — the exact tenant where this gap was live-verified.
2. Note two known real examples confirmed broken before this fix: `lphf-s2` (object-shaped epic-nested story, under feature `2026-08-08-landing-page-hero-features`) and `rb-s4` (under feature `2026-08-05-repo-bootstrap-no-fork`). Both are `dodStatus: complete` with real merged PRs and recorded artefact paths.
3. Optionally, identify a bare-string-shaped epic-nested story from `2026-04-14-skills-platform-phase3` (e.g. `p3.1a`) to confirm the second root cause's fix live, once that feature's own product page is browsable.

**Reset between scenarios:** Reload the artefact page fresh before each scenario.

---

## Scenarios

---

### Scenario 1: A previously-broken object-shaped epic-nested story now shows its real artefacts

**Covers:** AC1

**Steps:**
1. Navigate to the product page containing `lphf-s2` (or `rb-s4`).
2. Click into the story's artefact page.

**Expected outcome:**
> The artefact index shows the real, already-recorded artefacts (discovery, benefit-metric, story, test-plan, DoR, DoD, etc.) — not "No artefacts found for this feature".

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A bare-string-shaped epic-nested story also resolves correctly

**Covers:** AC2

**Steps:**
1. Navigate to a story under `2026-04-14-skills-platform-phase3` whose reference is stored as a bare string (e.g. `p3.1a`).
2. Click into the story's artefact page.

**Expected outcome:**
> The artefact index shows the real artefacts for the parent feature — not "No artefacts found for this feature", and not a broken/undefined-slug error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A genuine top-level feature is unaffected

**Covers:** AC3

**Steps:**
1. Navigate to any story that is itself a top-level feature (the common case — most stories in this repo).
2. Click into its artefact page.

**Expected outcome:**
> Behaves exactly as before this change — artefacts found, breadcrumb correct, no visible difference in load time.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A genuinely non-existent slug still shows the honest empty state

**Covers:** AC4

**Steps:**
1. Navigate directly to `/features/this-slug-genuinely-does-not-exist-anywhere`.

**Expected outcome:**
> "No artefacts found for this feature" still renders — no crash, no broken page.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: Breadcrumb content is unchanged for the epic-nested case

**Covers:** AC5

**Steps:**
1. On the `lphf-s2` (or `rb-s4`) artefact page from Scenario 1, check the breadcrumb.

**Expected outcome:**
> Shows Product name (linked) › Epic name › story ID, exactly as it did before this fix — only the artefact list below it changes from empty to populated.

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

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
