# AC Verification Script: Extend the Sonnet drift-guard to cover benefit-metric, decisions, and definition-of-done

**Story reference:** artefacts/2026-09-30-web-ui-artefact-routing-fixes/stories/wuar-s1.md
**Technical test plan:** artefacts/2026-09-30-web-ui-artefact-routing-fixes/test-plans/wuar-s1-test-plan.md
**Script version:** 2 (narrowed after AC1–AC3 of v1 were dropped — see decisions.md Decision 1)
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. No special setup — the fix is a pure-function config change, verifiable by running the test suite.

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: benefit-metric, decisions, and definition-of-done are now watched for silent Haiku drift

**Covers:** AC1, AC2

**Steps:**
1. Ask a developer to run `node tests/check-psrc-verify-s3-model-routing-drift.js` and look at the results.

**Expected outcome:**
> If none of the 3 new skills have their Sonnet override set, all 3 show up as "drifted" (8 total drifted skills when nothing is overridden, up from 5). If all 8 skills (the original 5 plus these 3) have their override correctly set, nothing shows up as drifted.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — 3 new skills watched for drift | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
