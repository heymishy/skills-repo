# AC Verification Script: Stage-Based Skill Routing and Navigation

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s4.md
**Technical test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s4-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a test feature at `stage: "definition"` in `.github/pipeline-state.json`, with `completedStages` including discovery, spike, benefit-metric, and definition.

**Reset between scenarios:** Return to the in-progress list between scenarios; no other reset needed.

---

## Scenarios

---

### Scenario 1: You land on the right skill automatically

**Covers:** AC1 (routing)

**Steps:**
1. Click "Continue" on the test feature.

**Expected outcome:**
> You land directly on the /review skill session — you are not asked to pick a skill yourself, and you are not dropped back at discovery.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: You can see and use the stage selector to go back

**Covers:** AC1 (stage selector menu, backward navigation)

**Steps:**
1. In the session, look for a stage selector (sidebar or top nav) showing the current and prior stages.
2. Click on "discovery" in that selector.

**Expected outcome:**
> A message asks you to confirm moving back to discovery, mentioning that you'll see prior artefacts and any revisions since then. After confirming, you're now looking at the discovery skill's content for this feature.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: You can't jump ahead to a stage you haven't reached

**Covers:** AC1 (forward navigation restriction)

**Steps:**
1. In the same stage selector, look for a stage later than your current one (e.g. "dor-gate").
2. Try to click it.

**Expected outcome:**
> The later stage is shown as greyed out or otherwise clearly unavailable — clicking it does nothing, or it isn't clickable at all.

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
