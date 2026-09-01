# AC Verification Script: Journey Record Backfill from CLI

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s3.md
**Technical test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s3-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a test feature registered in `.github/pipeline-state.json` that has never been opened in the Web UI before (no existing session/journey for it).
2. Make sure this feature is at some stage past discovery — e.g. `stage: "definition"`.

**Reset between scenarios:** For Scenario 2, use a fresh test feature that has genuinely never been opened before — reusing one from Scenario 1 would not test the "first time" behaviour.

---

## Scenarios

---

### Scenario 1: Opening a Claude-Code-only feature for the first time in the Web UI just works

**Covers:** AC1

**Steps:**
1. In the Web UI, find your test feature in the in-progress list and click "Continue."
2. Watch the session start.

**Expected outcome:**
> The session starts normally, with no error and no confirmation prompt about "creating a history record." Somewhere in the session header you see a message like "Continuing from Claude Code — history before [a date] reflects CLI sessions."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Opening the same feature a second time doesn't duplicate anything

**Covers:** AC1

**Steps:**
1. Continuing from Scenario 1, leave the session and go back to the in-progress list.
2. Click "Continue" on the same feature again.

**Expected outcome:**
> The session starts again normally. The "Continuing from Claude Code" message still shows the same original date as the first time — it doesn't reset or change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A feature further along shows more history as already covered

**Covers:** AC1

**Steps:**
1. Use a second test feature that's at a later stage, e.g. `stage: "review"`.
2. Open it in the Web UI for the first time.
3. Check what the skill session says has already been completed (e.g. via the stage selector or session summary, once ep1-s4 lands — for now, check the underlying journey record directly if you have file/DB access).

**Expected outcome:**
> The feature is recognized as having already completed discovery, benefit-metric, and definition (everything up to and including its current stage) — not just discovery.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |

---

*Written 2026-09-01 alongside the technical test plan, as part of getting the whole `new-feature-af17f555` feature to DoR-ready level.*
