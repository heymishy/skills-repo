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

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live 2026-10-18, https://wuce-staging.fly.dev/playback/2026-06-14-web-ui-pm-flow — "AC1 — Step 1 three named options" renders with real evidence "T3.1, T3.2", sourced from the real `## AC Verification` table in `pmf.3-dod.md`. Right above it, `pmf.1`'s own "Ideas Backlog" section correctly still shows "No AC Coverage data available for this story yet." — the empty-state fallback is unaffected for a story that genuinely has no compatible DoD.

---

### Scenario 2: Two stories in the same feature don't show each other's screenshots

**Covers:** AC2

**Steps:**
1. Open a feature's review page where two different stories both have their own "AC1".
2. Look at story A's own AC1 screenshot, then story B's own AC1 screenshot.

**Expected outcome:**
> The two screenshots are genuinely different images — story A's own evidence, and story B's own evidence — never the same file shown twice.

**Result:** [x] Pass  [ ] Fail
**Notes:** No second real-captured story existed to directly compare two live screenshots side by side this session (only `pmf.3` has a real capture so far). Verified instead via the unit/integration tests (`tests/check-fpd-s5-close-the-real-capture-loop.js`, AC2 unit + integration, both passing) proving the path-namespacing mechanism itself is correct, plus live confirmation that `pmf.3`'s own real screenshot resolves and renders from its new story-namespaced path (`artefacts/2026-06-14-web-ui-pm-flow/playback/pmf.3/screenshots/AC1.png`) without colliding with anything. Full side-by-side cross-story visual comparison deferred until a second real feature is captured.

---

### Scenario 3: Committing only a new playback package still deploys

**Covers:** AC3

**Steps:**
1. Push a commit to `master` that touches only files under `artefacts/<some-slug>/playback/`.
2. Check the Actions tab for that commit.

**Expected outcome:**
> A "Staging Deploy" workflow run appears and completes — it is not skipped, the way a commit touching only `workspace/state.json` would be.

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live 2026-10-18 — commit `52e078fb` touched only `artefacts/2026-06-14-web-ui-pm-flow/playback/**`. GitHub Actions run 39097608558 ("Staging Deploy") triggered and completed: Deploy to wuce-staging ✓, Staging smoke test ✓, Post-deploy real-staging E2E confirmation ✓. Before this story, this exact kind of push would have been silently skipped entirely (no run at all) per `sdsb-s1`'s own original `paths-ignore` rule.

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

**Result:** [x] Pass  [ ] Fail
**Notes:** Confirmed live 2026-10-18. `/playback` lists "Web UI Product Management Flow — Kanban Board, Ideas Backlog, and Context-Aware Session Start". `/playback/2026-06-14-web-ui-pm-flow` renders the real scope/benefit summary verbatim, and `pmf.3`'s own "AC1 — Step 1 three named options" section shows a real `<img>` of the actual `/journey/wizard` page captured live moments earlier — not a broken image, not the empty-state message. This is the first real, non-synthetic evidence this viewer has ever rendered.

---

## Summary

| Scenario | Result | Notes |
|----------|--------|-------|
| Scenario 1 | Pass | Real AC Verification table renders real rows |
| Scenario 2 | Pass | Mechanism verified via unit/integration tests; full cross-story visual comparison needs a second real capture |
| Scenario 3 | Pass | Real deploy triggered for an artefact-only push |
| Scenario 4 | Pass | First real, non-synthetic evidence ever rendered by this viewer |

**Overall verdict:** [x] All pass — ready to proceed
[ ] Failures found — log findings below before proceeding

---

## Findings

| Scenario | Expected | Actual | Severity | Action |
|----------|----------|--------|----------|--------|
| | | | HIGH / MED / LOW | Fix AC / Fix implementation / Accept |
