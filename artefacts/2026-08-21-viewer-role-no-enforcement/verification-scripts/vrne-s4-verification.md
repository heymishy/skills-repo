# AC Verification Script: Wire the viewer-write-block gate to edge-case routes (agency client creation/invite, artefact annotations)

**Story reference:** `artefacts/2026-08-21-viewer-role-no-enforcement/stories/vrne-s4-edge-cases.md`
**Technical test plan:** `artefacts/2026-08-21-viewer-role-no-enforcement/test-plans/vrne-s4-test-plan.md`
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. You'll need an Agency-type test org with an `admin`, an `engineer`, and a `viewer`-role teammate.
2. You'll also need a second, non-Agency (standard) org with any teammate, to verify Scenario 4.
3. Have at least one artefact page open-able (for Scenario 3's annotation attempt).

**Reset between scenarios:** No shared state.

---

## Scenarios

---

### Scenario 1: A viewer-role teammate at an Agency org cannot create a Client org

**Covers:** AC1

**Steps:**
1. As the viewer-role teammate at the Agency-type org, open the "Create Client" flow.
2. Attempt to create a new Client org.

**Expected outcome:**
> The creation is rejected — you see an error/denied response, no new Client org appears in the org list.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A viewer-role teammate cannot invite a user into a Client org

**Covers:** AC2

**Steps:**
1. As the admin, create a Client org (if none exists) so there's a real one to invite into.
2. Switch to the viewer-role teammate.
3. Attempt to invite a user into that Client org.

**Expected outcome:**
> The invite is rejected — no invite email/link is generated.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: A viewer-role teammate cannot annotate an artefact

**Covers:** AC3

**Steps:**
1. As the viewer-role teammate, open any artefact page.
2. Attempt to add an annotation/comment.

**Expected outcome:**
> The annotation is rejected — it does not appear on the artefact after refreshing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: An engineer or admin at the Agency org can still create/invite Clients normally

**Covers:** AC4

**Steps:**
1. As the engineer (or admin) at the Agency-type org, repeat Scenario 1 and Scenario 2's steps.

**Expected outcome:**
> Both succeed exactly as before this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 5: A teammate at a non-Agency org still cannot create/invite Clients — for the original reason

**Covers:** AC5

**Steps:**
1. As any teammate (any role) at the non-Agency test org, attempt to create a Client org and invite a user into one.

**Expected outcome:**
> Both are still rejected — this must be unchanged from before this story's own change (a non-Agency org could never do this, regardless of role, and that must remain true).

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A denied edge-case attempt shows up in the audit log

**Covers:** AC6

**Steps:**
1. Repeat Scenario 1.
2. Ask a developer to check the application logs for the denial.

**Expected outcome:**
> The log contains an entry showing who attempted it, which organisation, when, and the route.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 — viewer denied creating Client org | | |
| Scenario 2 — viewer denied inviting into Client org | | |
| Scenario 3 — viewer denied annotating | | |
| Scenario 4 — engineer/admin unaffected | | |
| Scenario 5 — non-Agency org still denied (unchanged reason) | | |
| Edge case — denial logged | | |

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
