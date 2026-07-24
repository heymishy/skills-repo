# AC Verification Script: Default to all stories from /definition when starting the per-story review sequence

**Story reference:** artefacts/2026-07-24-definition-stories-default-all/stories/dsda-s1.md
**Technical test plan:** artefacts/2026-07-24-definition-stories-default-all/test-plans/dsda-s1-test-plan.md
**Script version:** 1
**Verified by:** Claude (agent), operator-directed | **Date:** 2026-07-24 | **Context:** [x] Post-merge (automated, see notes)

---

## Setup

**Before you start:**
1. Drive a journey through discovery, benefit-metric, and definition, so definition has written at least 2 stories.

**Reset between scenarios:** Use a fresh journey each time.

---

## Scenarios

### Scenario 1: The story list is already filled in when you reach this step

**Covers:** AC1

**Steps:**
1. Complete `/definition` for a journey.
2. Confirm the gate to move to the next stage.

**Expected outcome:** The story-list page already shows every story `/definition` wrote — you don't see a blank box asking you to type them.

**Pass / Fail:** PASS — verified via `tests/check-dsda-s1-default-all-stories.js` ("AC1 -- GET /journey/:id/stories auto-populates from the definition artefact"): a real journey with a completed definition stage pointing at a definition artefact in either currently-supported format (H1 epic/story headers, flat-story fallback) renders a `<textarea>` pre-filled with every extracted story ID, still editable (no readonly/disabled).

---

### Scenario 2: Submitting the pre-filled list moves everything forward correctly

**Covers:** AC2

**Steps:**
1. From Scenario 1, submit the list as-is (don't edit it).
2. Complete the review stage for the first story.

**Expected outcome:** Each story proceeds through review, then test-plan, then definition-of-ready, one at a time — same as it always has, just without you having typed the list yourself.

**Pass / Fail:** PASS — verified via `tests/check-dsda-s1-default-all-stories.js` ("AC2 -- unedited auto-populated list proceeds through the per-story sequence exactly as today"): the exact pre-filled textarea value from Scenario 1, submitted unmodified, sets the journey's `storyList` correctly and redirects into the first per-story stage (review), identical to the pre-existing manually-typed flow's own behaviour (`PER_STORY_SEQ` progression itself is untouched by this story).

---

### Scenario 3: You can still edit the list if you want to

**Covers:** AC3

**Steps:**
1. From Scenario 1's page, try to remove one story from the pre-filled list before submitting.

**Expected outcome:** You can edit it, and only your edited list gets used — you're not locked into the auto-filled version.

**Pass / Fail:** PASS — verified two ways: (1) `tests/check-dsda-s1-default-all-stories.js` ("AC3 -- an edited value overrides the auto-populated default") submits a list that removes one auto-populated story and adds a new one, confirming the edited list (not the original) is what's stored. (2) `tests/e2e/dsda-s1-default-all-stories.spec.js` drives a real mocked-LLM journey to `/journey/:id/stories` in an actual browser and confirms via Playwright that `textarea[name="stories"]` is visible and genuinely editable (`toBeEditable()`), types a new list into it, and confirms the submission proceeds using the typed value.

---

### Scenario 4: If the system can't read the story list, it doesn't get stuck

**Covers:** AC4

**Steps:**
1. (With engineering help) arrange for a definition artefact that the system can't automatically parse.
2. Reach the story-list page for that journey.

**Expected outcome:** You see the old, familiar blank text box to type story slugs yourself — not an error page.

**Pass / Fail:** PASS — verified via `tests/check-dsda-s1-default-all-stories.js`, two cases: (1) "AC4 -- unrecognised definition artefact falls back to the manual-entry textarea, not an error" — a definition artefact in neither supported format renders 200 with an empty textarea. (2) "AC4 -- no definition stage recorded at all falls back the same way" — a journey with no completed definition stage yet renders the same empty, editable textarea, never an error. Also incidentally exercised for real in `tests/e2e/dsda-s1-default-all-stories.spec.js`, since the shared `definition.success.json` mock fixture's own artefact format is not one of the two currently-recognised formats.

---

## Summary

Total scenarios: 4 | Manual gap scenarios: 0 | All 4 verified via automated test coverage (9 unit/integration tests in `tests/check-dsda-s1-default-all-stories.js` + 1 Playwright E2E test in `tests/e2e/dsda-s1-default-all-stories.spec.js`), cross-checked against the real client-side `parseDefinitionArtefact` parser for zero drift (AC5).
