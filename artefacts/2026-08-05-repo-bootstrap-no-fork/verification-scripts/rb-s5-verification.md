# AC Verification Script: Optionally install the full outer loop during bootstrap

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s5-optional-outer-loop-install.md
**Technical test plan:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s5-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have two empty target folders ready.
2. Have access to at least one DoR-approved feature in the SaaS if you're testing Scenario 3.

**Reset between scenarios:** Use a fresh empty folder per scenario.

---

## Scenarios

---

### Scenario 1: The outer-loop flag adds outer-loop skills on a fresh repo

**Covers:** AC1

**Steps:**
1. Run: `npx @heymishy/skills-repo@latest init . --with-outer-loop`
2. Open `.github/skills/` and check the registry file from the earlier story.

**Expected outcome:**
> Every skill labeled "outer-loop" in the registry is present in the folder, in addition to the inner-loop and ancillary skills you'd get by default.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Without the flag, only inner-loop skills come along on a SaaS-connected bootstrap

**Covers:** AC2

**Steps:**
1. Run the SaaS-connected bootstrap command (from the previous story) without adding `--with-outer-loop`.
2. Check which skills are present.

**Expected outcome:**
> No outer-loop skills (discovery, benefit-metric, definition, etc.) are present — only inner-loop and ancillary ones.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: With the flag, the SaaS-connected bootstrap gets outer-loop skills too

**Covers:** AC3

**Steps:**
1. Run the SaaS-connected bootstrap command with `--with-outer-loop` added.
2. Check which skills are present, and compare against Scenario 1.

**Expected outcome:**
> Outer-loop skills are present, and the set matches exactly what Scenario 1 produced on the fresh-repo path — the flag behaves the same way regardless of which bootstrap path you used.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Adding the outer loop later, without starting over

**Covers:** AC4

**Steps:**
1. Bootstrap a folder without the flag (inner-loop only).
2. Re-run the init command against the same folder, this time adding `--with-outer-loop`.

**Expected outcome:**
> Outer-loop skills get added on top. Nothing that was already there gets deleted, overwritten, or duplicated — you don't have to start over from scratch.

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
