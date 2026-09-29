# AC Verification Script: Signals aggregator module — read all 12 sources and normalize to Signal shape

**Story reference:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/stories/ep1-s1.md
**Technical test plan:** artefacts/2026-09-28-weeb-ui-learnings-and-improvements/test-plans/ep1-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a real, populated repo checkout available — one that has actually gone through at least one delivery cycle, so `workspace/capture-log.md`, `workspace/learnings.md`, `workspace/proposals/`, etc. have real content.
2. No special configuration needed — the aggregator reads existing files on disk.

**Reset between scenarios:** Not needed — each scenario is a read-only inspection of the aggregator's output.

---

## Scenarios

---

### Scenario 1: The aggregator reads all 12 sources and returns a complete signal list

**Covers:** AC1

**Steps:**
1. Ask a developer to run the aggregator module against this repo's own real workspace (`node -e "console.log(JSON.stringify(require('./src/web-ui/modules/signals-aggregator').getSignals(process.cwd()), null, 2))"` or equivalent).
2. Look at the returned list of signals.

**Expected outcome:**
> The list includes at least one entry that traces back to each of the 12 real sources (capture-log, learnings, proposals, suite, results, traces, decisions, DoD, reference, estimation-norms, pipeline-state) — or, for any source that's genuinely empty in this repo right now, no crash and no missing-source error, just fewer entries from that source.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Every signal has the fields the dashboard needs

**Covers:** AC2

**Steps:**
1. From Scenario 1's output, pick any 3 signals at random.
2. Check each one has: an id, a source name, a type, some text, a timestamp, and a call-to-action with a label and a skill name.

**Expected outcome:**
> All 3 have every one of those fields filled in — none are missing or blank.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A broken source doesn't break everything else

**Covers:** AC3

**Steps:**
1. Ask a developer to temporarily rename or corrupt one source file (e.g. put invalid JSON into a copy of `suite.json`, pointed at by a throwaway test run — not the real file).
2. Run the aggregator again against that broken copy.

**Expected outcome:**
> The aggregator doesn't crash. You get back a signal that says something like "suite: <error message>" in place of the broken source's real entries, and everything from the other 11 sources still shows up normally.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Most recent signals come first

**Covers:** AC4

**Steps:**
1. From Scenario 1's output, look at the timestamps in order.

**Expected outcome:**
> Signals are sorted newest-first. Any signal with no real timestamp (a static reference document, for example) appears at the very end of the list, not scattered randomly through it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Nothing gets silently dropped

**Covers:** AC5

**Steps:**
1. Ask a developer to count the real entries in one source directly (e.g. `wc -l` on `capture-log.md`'s own entries, or count files in `proposals/`).
2. Compare that count to how many signals from that source appear in the aggregator's output.

**Expected outcome:**
> The counts match (accounting for any genuinely unparseable individual entries, which should show up as their own parse-error signal, not just vanish).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — All 12 sources parsed | | |
| Scenario 2 — Required fields present | | |
| Scenario 3 — Broken source doesn't break everything | | |
| Scenario 4 — Newest signals first | | |
| Edge case — Nothing silently dropped | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
