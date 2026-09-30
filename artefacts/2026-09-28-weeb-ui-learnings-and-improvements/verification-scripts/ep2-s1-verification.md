# AC Verification Script: Signals panel — render real signals in a web UI page

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the web UI, signed in.
2. Make sure at least a few real signals exist — run the pipeline a bit, or check that `workspace/capture-log.md` / `workspace/learnings.md` have some entries.

**Reset between scenarios:** Reload the page fresh between scenarios.

---

## Scenarios

---

### Scenario 1: You can see your real improvement signals without leaving the browser

**Covers:** AC1

**Steps:**
1. Open the signals panel page.

**Expected outcome:**
> You see a list of real signals — each one shows some descriptive text, where it came from, and what kind of signal it is. Nothing is blank or a placeholder.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Every signal has a clear button telling you what to do with it

**Covers:** AC2

**Steps:**
1. Look at one of the signal entries.

**Expected outcome:**
> You see a labeled button or link (e.g. "Review") on that signal. Different signals may have different button labels — it's not always the same word on every one.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A clear message when there's nothing to show

**Covers:** AC3

**Steps:**
1. If possible, view the panel in a state where no signals currently exist (or ask the coding agent to confirm this was tested with an empty list).

**Expected outcome:**
> You see a plain message like "No signals yet" — not a blank white page, not an error.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A broken/parse-error signal looks different from a normal one

**Covers:** AC4

**Steps:**
1. Look through the signal list for one that represents a parsing problem (it will usually mention "parse-error" or a file that failed to read).

**Expected outcome:**
> That entry is visually different from the others — e.g. a warning color or icon — so you can immediately tell it's a problem, not a genuine improvement idea.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: You have to be signed in to see this page

**Covers:** AC5

**Steps:**
1. Sign out (or open the page in a private/incognito window with no session).
2. Try to load the signals panel page directly by URL.

**Expected outcome:**
> You're redirected to the sign-in page, exactly like trying to visit any other page in this app while signed out.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Real signals visible | | |
| Scenario 2 — CTA button labeled per-signal | | |
| Scenario 3 — Empty state is clear | | |
| Scenario 4 — Parse-errors visually distinct | | |
| Scenario 5 — Requires sign-in | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
