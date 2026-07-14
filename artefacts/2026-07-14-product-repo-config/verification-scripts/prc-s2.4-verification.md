# AC Verification Script: Resolve journey.js's local artefact writes to the product's own repo

**Story reference:** artefacts/2026-07-14-product-repo-config/stories/prc-s2.4.md
**Technical test plan:** artefacts/2026-07-14-product-repo-config/test-plans/prc-s2.4-test-plan.md
**Script version:** 1
**Verified by:** ___ | **Date:** ___ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a product connected to a real repo.
2. Be ready to run a full outer-loop skill (e.g. `/discovery`) against it.

**Reset between scenarios:** Use a fresh product/session per scenario where noted.

---

## Scenarios

---

### Scenario 1: Run a skill and check the artefact lands in the repo

**Covers:** AC1

**Steps:**
1. Run `/discovery` in the product's outer loop until it produces a `discovery.md`.
2. Check the product's connected GitHub repo.

**Expected outcome:**
> `discovery.md` appears as a real file in the repo, committed under your identity — not just saved somewhere on the server.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Confirm the database backup still happens too

**Covers:** AC2

**Steps:**
1. After Scenario 1, check the artefact is also retrievable through wuce's own UI (which reads from the database backup).

**Expected outcome:**
> The artefact shows up correctly in wuce's UI too — the database backup wasn't broken by this change.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Try to run a skill on a product with no repo

**Covers:** AC3

**Steps:**
1. Use a product with no repo connected.
2. Try to start `/discovery`.

**Expected outcome:**
> You're stopped immediately with a "no repo configured" message — the skill session doesn't start at all, not even partway.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Check commit history makes sense across a session

**Covers:** AC4

**Steps:**
1. Run a longer skill session that produces more than one artefact (e.g. discovery.md, then later a story file).
2. Look at the repo's commit history for that session.

**Expected outcome:**
> You see one commit per artefact file, in a readable order — not one giant commit for the whole session, and not dozens of tiny commits per keystroke.

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

**Overall verdict:** [ ] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
