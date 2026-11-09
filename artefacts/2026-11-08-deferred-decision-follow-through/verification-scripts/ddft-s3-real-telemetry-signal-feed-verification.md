# AC Verification Script: Real telemetry signal feed

**Story reference:** artefacts/2026-11-08-deferred-decision-follow-through/stories/ddft-s3-real-telemetry-signal-feed.md
**Technical test plan:** artefacts/2026-11-08-deferred-decision-follow-through/test-plans/ddft-s3-real-telemetry-signal-feed-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have access to a test/demo environment where PostHog responses can be faked (no real PostHog account needed)
2. Have the scan from `ddft-s2` ready to run with telemetry enrichment turned on

**Reset between scenarios:** Reset the fake PostHog responses between scenarios so one scenario's setup doesn't leak into the next.

---

## Scenarios

---

### Scenario 1: A feature with real activity shows real numbers

**Covers:** AC1

**Steps:**
1. Set up a fake PostHog response showing some real-looking activity (a cost figure, a token count) for one feature
2. Run the scan with telemetry turned on for the deferred item linked to that feature

**Expected outcome:**
> The scan's output for that item shows the actual cost and token numbers from the fake response — not a vague "has activity" message.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A feature with no activity gets an honest message, not a false "nothing happened"

**Covers:** AC2

**Steps:**
1. Set up a fake PostHog response with zero matching events for a feature
2. Run the scan with telemetry turned on for the deferred item linked to that feature

**Expected outcome:**
> The scan says something like "no telemetry signal found for this feature" — it does not say or imply "nothing happened with this feature," since the real explanation might just be that tracking is sparse, not that the feature is inactive. Nothing crashes.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: An item with no linked feature is skipped cleanly

**Covers:** AC3

**Steps:**
1. Find (or create) a deferred item that has no linked feature at all
2. Run the scan with telemetry turned on

**Expected outcome:**
> That item's entry in the scan output has no telemetry section at all — no error, no attempt to look anything up for it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: The feature's own sparse-data finding becomes a new deferred item

**Covers:** AC4

**Steps:**
1. Run the scan for real, with telemetry turned on, against the real feature volume
2. Check whether a new deferred-item record now exists describing the sparse-telemetry finding itself

**Expected outcome:**
> A new record appears with a note like "investigate whether tracking calls are wired into real skill execution" — proving this mechanism records its own findings, not just the two things it was originally seeded with.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
