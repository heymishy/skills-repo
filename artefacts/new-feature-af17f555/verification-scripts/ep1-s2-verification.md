# AC Verification Script: Artefact Resolution and HANDOFF CONTEXT Population

**Story reference:** artefacts/new-feature-af17f555/stories/ep1-s2.md
**Technical test plan:** artefacts/new-feature-af17f555/test-plans/ep1-s2-test-plan.md
**Script version:** 1
**Verified by:** [name] | **Date:** [date] | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have a test feature in `artefacts/[your-test-feature]/` with a `discovery.md` file and a `stories/` folder containing at least 2 story files.
2. Open the Web UI skill picker and make sure this test feature shows up in the "In Progress" list (built by ep1-s1).

**Reset between scenarios:** No reset needed — each scenario reads the same fixture feature.

---

## Scenarios

---

### Scenario 1: A single-file stage's prior work shows up when you continue

**Covers:** AC1

**Steps:**
1. Click "Continue" on the test feature from the in-progress list.
2. When the session starts, look at the prior context shown at the top of the conversation (or ask "what discovery notes do you have for this feature?").

**Expected outcome:**
> The content of `discovery.md` for this feature appears in the session's prior context — the exact text you put in that file, not summarized or missing.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Every file from a multi-file stage shows up, not just one

**Covers:** AC2

**Steps:**
1. In the same test feature, add a second story file to `stories/` if you only have one.
2. Continue the feature into a session (or resume the existing session).
3. Ask "what stories exist for this feature?" or look at the prior context.

**Expected outcome:**
> Both story files' content appear in the prior context — not just the first one found, and not merged into a single blob. Each is present as its own piece of prior work.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Edge case: A stage that hasn't happened yet doesn't break the session

**Covers:** AC1, AC2

**Steps:**
1. Use a test feature that has never had a `/review` run — no `review/` folder exists.
2. Continue that feature into a session.

**Expected outcome:**
> The session starts normally. There is no error message about a missing `review` folder. The prior context simply doesn't mention any review findings, because there aren't any yet.

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
