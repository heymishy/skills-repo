# AC Verification Script: Golden trace demo — a real idea-to-shipped-code chain, walked in four frames

**Story reference:** artefacts/2026-08-08-landing-page-hero-features/stories/lphf-s1-golden-trace-demo.md
**Technical test plan:** artefacts/2026-08-08-landing-page-hero-features/test-plans/lphf-s1-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Load the landing page at `/` in a browser.
2. Scroll to the golden-trace hero section (should be the first or most prominent hero card).

**Reset between scenarios:** Reload the page between scenarios.

---

## Scenarios

---

### Scenario 1: The golden-trace section shows exactly four frames telling one real story

**Covers:** AC1

**Steps:**
1. Scroll to the golden-trace hero section.
2. Count the distinct frames/panels within it.

**Expected outcome:**
> Exactly four frames appear, in this order: (1) a plain-English prompt/problem statement, (2) a discovery document snippet, (3) a DoR (Definition of Ready) snippet, (4) a description or screenshot of the shipped, working feature. All four frames tell the story of the same one feature — not a mix of unrelated examples.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The demo content is real, not invented

**Covers:** AC4

**Steps:**
1. Read the text in each of the four frames.
2. Compare it against the real project files named in the test plan (the discovery, story, and DoR documents for whichever example feature is currently shown).

**Expected outcome:**
> The text in each frame matches the real document content (it may be shortened, but the words used are the actual words from the real file — not a paraphrase or a made-up example).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Only one example is shipped, not two

**Covers:** AC3

**Steps:**
1. Before this story is merged, check the final pull request's list of changed files.
2. Search the changed code for any leftover reference to the example that was NOT chosen (the losing candidate).

**Expected outcome:**
> No trace of the unused example remains in the code — no unused config option, no leftover content file, no dead toggle. Only the one chosen example ships.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The four frames are reachable using only the keyboard

**Covers:** NFR — Accessibility

**Steps:**
1. Click once at the top of the page, then press the Tab key repeatedly (do not use the mouse).
2. Watch which frame or element becomes highlighted as you press Tab.

**Expected outcome:**
> Each of the four frames becomes reachable in turn as you press Tab. Nothing gets "stuck" — you never see the exact same element highlighted more than a couple of times in a row.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Edge case (AC3) | | |
| Edge case (keyboard) | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
