# AC Verification Script: Signal-to-session seeding bridge — CTA creates a seeded skill session

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep2-s2.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep2-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Open the web UI signals panel (from `ep2-s1`), signed in.
2. Have at least one signal visible with a CTA button.

**Reset between scenarios:** Reload the signals panel between scenarios.

---

## Scenarios

---

### Scenario 1: Clicking a signal's button drops you straight into a new session with that signal already loaded

**Covers:** AC1, AC2, AC6 (this scenario doubles as the human-facing confirmation that the production wiring genuinely passes signal content through, not just that a session gets created)

**Steps:**
1. Click a signal's CTA button (e.g. "Review").

**Expected outcome:**
> You land in a new chat session. The session already knows about the signal you clicked — you don't have to retype or paste it in yourself.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The right skill opens, not always the same one

**Covers:** AC3

**Steps:**
1. Find a signal whose button is labeled something other than "Review" (e.g. a pipeline-status signal, labeled "Open feature").
2. Click its button.

**Expected outcome:**
> The session that opens matches that specific signal's own labeled action — not always `/improve` regardless of which signal you clicked.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A broken seed request fails clearly, it doesn't half-work

**Covers:** AC4

**Steps:**
1. Ask the coding agent to confirm this was tested with a deliberately broken request (missing/invalid signal data) — this isn't practical to trigger by hand through the normal UI.

**Expected outcome:**
> A broken request shows a clear error and does not create a confusing half-started session you could stumble into.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Launching a skill the normal way (not from a signal) still works exactly as before

**Covers:** AC5

**Steps:**
1. Go to the regular skill launcher page (`/skills`).
2. Click any primary or advanced skill CTA, same as always.

**Expected outcome:**
> Nothing about the normal skill launcher changed — it behaves exactly as it did before this feature existed.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Signal CTA seeds and lands in a session | | |
| Scenario 2 — Correct skill launched per-signal | | |
| Scenario 3 — Broken seed fails clearly | | |
| Scenario 4 — Normal launcher unaffected | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
