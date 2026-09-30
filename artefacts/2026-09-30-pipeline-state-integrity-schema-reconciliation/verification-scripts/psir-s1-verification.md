# AC Verification Script: Reconcile check-pipeline-state-integrity.js's rules with the actual JSON schema

**Story reference:** artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/stories/psir-s1.md
**Technical test plan:** artefacts/2026-09-30-pipeline-state-integrity-schema-reconciliation/test-plans/psir-s1-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. No special setup — verifiable by running `node scripts/check-pipeline-state-integrity.js` directly; no server, no browser.
2. AC8's cross-check additionally needs a working `python` with `jsonschema` installed (already confirmed available this session).

**Reset between scenarios:** Not needed.

---

## Scenarios

---

### Scenario 1: A schema violation the old checker missed is now caught locally

**Covers:** AC1, AC2, AC3, AC4, AC5, AC6, AC7

**Steps:**
1. Ask a developer to run `node scripts/check-pipeline-state-integrity.js` and confirm the self-test count increased and all pass (look for "N self-tests passed" with N larger than before this story).
2. Take any one of the new failure modes (e.g. a feature entry missing `name`) and confirm by hand that the script now reports a `FAIL [C15]`-style line naming the exact missing field — not just a silent "0 fail" the way it did for the real `2026-09-29-test` incident this story exists to prevent a repeat of.

**Expected outcome:**
> Every schema `required`/`enum` violation on features, epic-nested stories, guardrails, tasks, and spikes that CI's real jsonschema check would catch is now also caught by the local script, in the same run developers already use before pushing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: No false positives against real, already-valid data

**Covers:** AC8

**Steps:**
1. Ask a developer to run `node scripts/check-pipeline-state-integrity.js` against the real `.github/pipeline-state.json` on `master` and confirm the reported fail count is still 0.
2. Separately run the real Python schema validator against the same file and confirm it also reports 0 violations.

**Expected outcome:**
> The extended script does not manufacture new findings against data that is already schema-valid today — both the extended local script and the real CI-equivalent Python validator agree: 0 violations.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — new violations caught locally | | |
| Scenario 2 — no false positives on real data | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
