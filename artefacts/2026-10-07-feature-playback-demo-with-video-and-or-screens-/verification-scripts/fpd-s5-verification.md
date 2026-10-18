# AC Verification Script: Close the real-capture loop

**Story reference:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/stories/fpd-s5-close-the-real-capture-loop.md
**Technical test plan:** artefacts/2026-10-07-feature-playback-demo-with-video-and-or-screens-/test-plans/fpd-s5-test-plan.md
**Script version:** 1
**Verified by:** _____ | **Date:** _____ | **Context:** [ ] Pre-code  [ ] Post-merge  [ ] Demo

---

## Setup

**Before you start:**
1. Have `2026-06-14-web-ui-pm-flow`'s own `pmf.3-dod.md` open — it's a real, already-shipped story using the `## AC Verification` table shape.
2. For Scenario 4, you'll need to be logged in to `https://wuce-staging.fly.dev` in Chrome.

**Reset between scenarios:** No reset needed.

---

## Scenarios

### Scenario 1: A story that only ever used the other table format shows real content, not an empty page

**Covers:** AC1

**Steps:**
1. Open `/playback/2026-06-14-web-ui-pm-flow` (once a real `walkthrough.md` exists for it — see Scenario 4).
2. Find the section for story `pmf.3`.

**Expected outcome:**
> `pmf.3`'s own real AC rows appear — "AC1 — Step 1 three named options", "AC2 — 'Start new' preserved", and so on — not the message "No AC Coverage data available for this story yet."

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 2: Two stories in the same feature don't show each other's screenshots

**Covers:** AC2

**Steps:**
1. Open a feature's review page where two different stories both have their own "AC1".
2. Look at story A's own AC1 screenshot, then story B's own AC1 screenshot.

**Expected outcome:**
> The two screenshots are genuinely different images — story A's own evidence, and story B's own evidence — never the same file shown twice.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 3: Committing only a new playback package still deploys

**Covers:** AC3

**Steps:**
1. Push a commit to `master` that touches only files under `artefacts/<some-slug>/playback/`.
2. Check the Actions tab for that commit.

**Expected outcome:**
> A "Staging Deploy" workflow run appears and completes — it is not skipped, the way a commit touching only `workspace/state.json` would be.

**Result:** [ ] Pass  [ ] Fail
**Notes:**

---

### Scenario 4: A real package, captured for real, actually shows up and renders

**Covers:** AC4

**Steps:**
1. Run the real capture mechanism (`scripts/playback-capture.js`'s own screenshot capture, not hand-written files) against `2026-06-14-web-ui-pm-flow` — a real feature whose `pmf.3` story now qualifies after Scenario 1's fix.
2. Commit and push the resulting package.
3. Wait for the deploy confirmed in Scenario 3.
4. In Chrome, logged in, open `/playback`.
5. Click into `2026-06-14-web-ui-pm-flow`.

**Expected outcome:**
> The feature now appears in the `/playback` list (it didn't before this story). Opening it shows `pmf.3`'s own AC section with a real screenshot rendered inline — an actual `<img>` showing the real captured page, not a broken image icon and not the "No evidence captured" message.

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
