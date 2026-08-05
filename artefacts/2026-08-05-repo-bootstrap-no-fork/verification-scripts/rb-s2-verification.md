# AC Verification Script: Install the full skill set with a lightweight outer/inner/ancillary registry

**Story reference:** artefacts/2026-08-05-repo-bootstrap-no-fork/stories/rb-s2-full-skill-set-and-registry.md
**Technical test plan:** artefacts/2026-08-05-repo-bootstrap-no-fork/test-plans/rb-s2-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Bootstrap a fresh repo using the init command from the previous story (rb-s1): `npx @heymishy/skills-repo@latest init .` in an empty folder.
2. Have a way to browse the resulting folder structure (Explorer, Finder, or a terminal).

**Reset between scenarios:** Not needed — all scenarios inspect the same bootstrapped folder without modifying it.

---

## Scenarios

---

### Scenario 1: The full skill set is present, not a cut-down version

**Covers:** AC1

**Steps:**
1. Open the `.github/skills/` folder in your bootstrapped repo.

**Expected outcome:**
> You see every skill the platform offers (discovery, definition, review, test-plan, definition-of-ready, and all the others) — not just one or two placeholder skills.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: A registry file tells you what's outer-loop, inner-loop, or ancillary

**Covers:** AC2

**Steps:**
1. Open the skills registry file (in the repo root or `.github/`, depending on where it's generated).

**Expected outcome:**
> Every skill is listed with a label of exactly one of: outer-loop, inner-loop, or ancillary. None are missing a label, and none have an unrecognized label.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: The registry matches the pipeline diagram in your instruction file

**Covers:** AC4

**Steps:**
1. Open your bootstrapped repo's main instruction file (`CLAUDE.md` or equivalent) and find the pipeline diagram.
2. Compare each step name in that diagram against the registry from Scenario 2.

**Expected outcome:**
> Every outer-loop and inner-loop skill in the registry matches a named step in the diagram — nothing in the registry is unaccounted for.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: Adding a brand-new category doesn't require a code change

**Covers:** AC3

**Steps:**
1. Open the registry file and add one new line for a made-up category name (e.g. `"programme-track"`) against any one skill, purely as a test.
2. Re-run the init/registry step against the same folder.

**Expected outcome:**
> The command still runs successfully and doesn't error out or ignore your new category — it copies that skill just like any other, with no code change needed to recognize the new label.

**Result:** [ ] Pass  [ ] Fail
**Notes:** This scenario demonstrates one instance of the extensibility claim, not a general proof — see the test plan's Coverage gaps section.

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
