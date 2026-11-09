# AC Verification Script: Web UI rendering — first slice of initiative 1's visibility surface

**Story reference:** artefacts/2026-11-08-incident-triage-and-respond/stories/itar-s3-web-ui-rendering.md
**Technical test plan:** artefacts/2026-11-08-incident-triage-and-respond/test-plans/itar-s3-web-ui-rendering-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a product in the web UI with a connected repo whose `workspace/incidents.json` you can control (add/remove records, or temporarily rename the file).
2. Load that product's detail page (the page showing `_renderConsolidatedFeaturesSection` — the product's own full feature view).

**Reset between scenarios:** Restore `incidents.json` to its starting state and refresh the page between scenarios.

---

## Scenarios

---

### Scenario 1: Incidents show up on the product page

**Covers:** AC1

**Steps:**
1. Make sure the connected repo's `incidents.json` has at least one incident record in it.
2. Open the product's detail page.

**Expected outcome:**
> You see the incident listed as its own item, showing its status (e.g. "open") written out in words.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: The triage summary is right there, no extra clicking

**Covers:** AC2

**Steps:**
1. Using an incident that already has a triage summary attached, look at how it's displayed on the product page.

**Expected outcome:**
> You can read the triage summary's text directly on the page — you don't have to click a link or navigate to a separate page to see it.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A product with no incidents file still loads fine

**Covers:** AC3

**Steps:**
1. Temporarily rename or remove the connected repo's `incidents.json` file (or use a product whose repo never had one).
2. Open that product's detail page.

**Expected outcome:**
> The page loads normally. There's no error message, no broken section — it just shows zero incidents, the same way it would for any product that hasn't started using this feature yet.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A real past incident renders correctly end-to-end

**Covers:** AC4

**Steps:**
1. Using the real migrated `tenant_admin_bootstrap_failed` incident record (the one created from the actual production finding), open the product's detail page.

**Expected outcome:**
> The real incident shows up correctly — status and triage summary both visible — with no errors. This is a real example, not a made-up test case.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: Script-like text in an incident doesn't do anything unexpected on the page

**Covers:** NFR-SEC-1 (security)

**Steps:**
1. Create an incident record where the tags or summary field contains something that looks like an HTML tag or script, e.g. `<script>alert(1)</script>`.
2. Open the product's detail page.

**Expected outcome:**
> The page shows that text as plain, literal characters on the screen (you can see the `<script>` text itself) — nothing pops up, nothing executes, nothing breaks.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | | |
| Scenario 2 | | |
| Scenario 3 | | |
| Scenario 4 | | |
| Edge case | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
