# AC Verification Script: Signals panel — render real signals in a web UI page

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s1.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude Sonnet 5 (session_011G2Sb9VPpFgBu42csYMjS5) | **Date:** 2026-10-02/03 | **Context:** [x] Post-merge-equivalent (pre-PR, automated + real Claude-in-Chrome browser check against a real local dev server — see decisions.md "Live browser render check for ep2-s1" entry)

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `node tests/check-ep2-s1-signals-panel.js` (AC1 unit + Integration tests). Also real-browser verified: a real Claude-in-Chrome screenshot of the live, unmodified `/signals` page (real local dev server, real production data — not a fixture) shows real signal entries with genuine text/source/type (`parse-error`, `capture-log`, `pipeline-state`, etc.), nothing blank or placeholder.

---

### Scenario 2: Every signal has a clear button telling you what to do with it

**Covers:** AC2

**Steps:**
1. Look at one of the signal entries.

**Expected outcome:**
> You see a labeled button or link (e.g. "Review") on that signal. Different signals may have different button labels — it's not always the same word on every one.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `node tests/check-ep2-s1-signals-panel.js` (AC2 unit tests — both the default `cta.label` and a non-default one). Real-browser confirmed with live production data: a DOM query against the real rendered page found exactly 5 genuinely distinct CTA labels ("Review", "Open feature", "Review proposal", "View scenario", "View trace") across 5,294 real buttons — conclusively not a single hardcoded label.

---

### Scenario 3: A clear message when there's nothing to show

**Covers:** AC3

**Steps:**
1. If possible, view the panel in a state where no signals currently exist (or ask the coding agent to confirm this was tested with an empty list).

**Expected outcome:**
> You see a plain message like "No signals yet" — not a blank white page, not an error.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `node tests/check-ep2-s1-signals-panel.js` (AC3 unit test — empty array input renders "No signals yet", no `<form>`/list markup, no error). Not separately real-browser-checked (this repo's own real workspace never has zero signals, so a live empty-state screenshot isn't obtainable without artificially clearing real data) — the unit-level DOM check is adequate here since "empty state present or absent" is a presence check, not a CSS-layout/visual-rendering claim (confirmed at `/test-plan` Step 3a time: AC3 was not flagged as CSS-layout-dependent).

---

### Scenario 4: A broken/parse-error signal looks different from a normal one

**Covers:** AC4

**Steps:**
1. Look through the signal list for one that represents a parsing problem (it will usually mention "parse-error" or a file that failed to read).

**Expected outcome:**
> That entry is visually different from the others — e.g. a warning color or icon — so you can immediately tell it's a problem, not a genuine improvement idea.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `node tests/check-ep2-s1-signals-panel.js` (AC4 unit test — `data-signal-type="parse-error"` marker). Real-browser confirmed: a live Claude-in-Chrome screenshot of the real `/signals` page shows the one genuine `parse-error` signal (`reference/2026-09-18-design-system-adoption/uploads: EISDIR...`) with a clearly distinct orange left border and background tint, visually separated from the plain white cards around it — an actual rendered visual difference, not just a DOM attribute confirmed present in markup.

---

### Scenario 5: You have to be signed in to see this page

**Covers:** AC5

**Steps:**
1. Sign out (or open the page in a private/incognito window with no session).
2. Try to load the signals panel page directly by URL.

**Expected outcome:**
> You're redirected to the sign-in page, exactly like trying to visit any other page in this app while signed out.

**Result:** [x] Pass  [ ] Fail
**Notes:** Verified via `node tests/check-ep2-s1-signals-panel.js` (AC5 integration test — unauthenticated request returns 302 to `/auth/github`). Also confirmed as a byproduct of the live-browser check: `/signals` genuinely required the test-mode session cookie to render (unauthenticated requests to the real server redirect, matching every other authenticated page in this app).

Also verified beyond the 5 scenarios, as this story's own Accessibility NFR: real Playwright E2E (`tests/e2e/ep2-s1-signals-panel.spec.js`, 1/1 passing) confirms every signal CTA has a non-empty accessible name and is reachable via Tab in document order — real sequential focus-order testing a DOM-simulation environment cannot reliably perform (see test plan Step 3a note).

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Real signals visible | ✅ Pass | Unit test + real-browser screenshot |
| Scenario 2 — CTA button labeled per-signal | ✅ Pass | Unit test + real DOM query (5 distinct real labels, 5,294 buttons) |
| Scenario 3 — Empty state is clear | ✅ Pass | Unit test (not a CSS-layout concern) |
| Scenario 4 — Parse-errors visually distinct | ✅ Pass | Unit test + real-browser screenshot (visible orange border/tint) |
| Scenario 5 — Requires sign-in | ✅ Pass | Integration test + confirmed live |
| (NFR) Accessibility — keyboard Tab order | ✅ Pass | Real Playwright E2E, 1/1 |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

**Real production finding (not a failure of this story's own scope):** the live browser check also surfaced, incidentally, that the real unpaginated page (5,293 signals) stresses the browser renderer (one screenshot attempt briefly timed out before succeeding on retry) and that a real Tab-order walk across the full real list is impractically slow — exactly the finding already documented in `decisions.md` (2026-10-01/02) that produced the `ep2-s3` follow-up story. Not a defect in this story's own 5 ACs, which are all genuinely satisfied; recorded here for traceability since it surfaced again during this exact verification pass.

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| (none — all 5 scenarios + NFR pass) | | | | |
