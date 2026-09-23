# AC Verification Script: Wire pod-manager.html's member picker to the real roster

**Story reference:** artefacts/2026-09-23-team-roster-integration/stories/rtri-s2.md
**Technical test plan:** artefacts/2026-09-23-team-roster-integration/test-plans/rtri-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Sign in as an admin of a tenant ("Team A") with at least 2 real teammates already added (Team members page).
2. Have a second tenant ("Team B") available with zero teammates added, to test the empty case.
3. Go to Pod Manager (`/admin/pods/manager`).

**Reset between scenarios:** Close the "Create Pod" modal (Cancel) between scenarios. No data reset needed — pods created during this script can be left in place.

---

## Scenarios

---

### Scenario 1: The picker shows your real team, not demo names

**Covers:** AC1

**Steps:**
1. Click "Create Pod".
2. Look at the "Available" panel.

**Expected outcome:**
> You see your real teammates listed by their real identity (GitHub login, email, etc.) — not "Hamish", "Susan", or "Darren". No role label/tag is shown next to their names yet.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Adding a real member asks you to pick their role for this pod

**Covers:** AC7

**Steps:**
1. With the modal open, click "Add" next to one of your real teammates.
2. You should be asked to choose a role for them within this pod (conductor, engineer, architect, or product).
3. Choose "engineer" and confirm.

**Expected outcome:**
> A role choice is presented before the person is added. After confirming, they appear in "Your team" labelled "engineer" — this is a role you just picked for this pod, separate from whatever permission role they have on your team overall.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Saving the pod stores the real people and the roles you picked

**Covers:** AC2

**Steps:**
1. Continuing from Scenario 2, add a second real teammate the same way, picking a different role (e.g. "architect").
2. Type a pod name and click "Create Pod".

**Expected outcome:**
> The pod is created successfully. If you check the pod's membership (ask an admin/engineer to query the database, or check via any admin view available), both members are stored with their real identities and the exact roles you picked in Scenario 2 — not any role copied from their team profile.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A team with no real members shows an empty picker, not an error

**Covers:** AC3

**Steps:**
1. Sign out, sign in as Team B's admin (the tenant with zero teammates added).
2. Go to Pod Manager, click "Create Pod".

**Expected outcome:**
> The "Available" panel is empty — no names at all, no error message, and definitely not the old "Hamish/Susan/Darren" demo names.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: The pod you created shows up correctly when assigning it to a feature

**Covers:** AC4

**Steps:**
1. Sign back in as Team A's admin.
2. Go to any feature and use the existing "Assign pods" action to assign the pod you created in Scenario 3.
3. Check that feature's collaborators/presence list.

**Expected outcome:**
> Both real teammates from Scenario 3 now appear as collaborators on that feature, shown by their real identity — this already-existing "Assign pods" feature needed no changes to pick up the new real data.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 6: Search still works with real names

**Covers:** AC5

**Steps:**
1. Open "Create Pod" again.
2. Type part of one of your real teammates' identity into the "Search by name…" box.

**Expected outcome:**
> Only matching teammates remain visible in "Available". No error, no blank screen. Clicking the role-tab buttons above the list doesn't cause an error either (they may do nothing visible for "Available" now that real members don't have a pod role yet — that's expected, just confirm nothing breaks or shows a wrong role).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A malicious-looking identity never runs as code

**Covers:** AC6

**Steps:**
1. This scenario requires a developer to temporarily seed a test teammate whose identity string contains something like `<img src=x onerror=alert(1)>` (not expected to occur with real GitHub/Google/email identities, but must be handled safely regardless).
2. Open "Create Pod" and look at the "Available" panel.

**Expected outcome:**
> The odd-looking text is shown exactly as typed, as plain text. No pop-up/alert box appears. Nothing about the page's layout breaks.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — Real team shown | | |
| Scenario 2 — Pod-role choice on add | | |
| Scenario 3 — Real save with chosen roles | | |
| Scenario 4 — Empty team, no error | | |
| Scenario 5 — Flows into feature collaborators | | |
| Scenario 6 — Search still works | | |
| Edge case — No script injection | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
