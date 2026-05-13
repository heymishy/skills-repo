# AC Verification Script: Archive completed features from pipeline-state.json

**Story reference:** artefacts/2026-04-18-pipeline-state-archive/stories/psa.1-archive-completed-features.md
**Date:** 2026-04-18

---

## Purpose

This is a plain-language verification script for human review before coding and smoke testing after merge. Each scenario corresponds to an AC and can be verified without running automated tests.

---

## Scenario 1 — AC1: DoD features moved to archive file

1. Open `.github/pipeline-state-archive.json`
2. Confirm Phase 1 (`2026-04-09-skills-platform-phase1`) and Phase 2 (`2026-04-11-skills-platform-phase2`) features are present with all their stories/epics intact
3. Open `.github/pipeline-state.json`
4. Confirm neither Phase 1 nor Phase 2 features appear in the active file

**Pass:** Archived features are in the archive file and absent from the active file.

---

## Scenario 2 — AC2: Active file contains only in-flight features

1. Open `.github/pipeline-state.json`
2. Count the features — expect only Phase 3 (with in-flight stories only), Dashboard v2, and the PSA feature itself (if applicable)
3. Check the file size — expect ~15–20 KB (down from ~105 KB)

**Pass:** Active file is significantly smaller and contains no completed features.

---

## Scenario 3 — AC3: Viz merges archive + active for full history

1. Open `dashboards/pipeline-viz.html` in a browser
2. Load the active `pipeline-state.json`
3. Confirm all features (including archived Phase 1 and Phase 2) appear in the dashboard

**Pass:** Dashboard displays the complete feature history, not just active features.

---

## Scenario 4 — AC4: Signal recording works against archive

1. Open `.github/pipeline-state-archive.json`
2. Manually edit a metric field on an archived feature (change `signal` value)
3. Save the file
4. Reload the viz — confirm the updated metric value appears

**Pass:** Metric updates in the archive file are reflected in the dashboard.

---

## Scenario 5 — AC5: npm test passes after archiving

1. Run `npm test`
2. Confirm all governance checks pass — no test assumes the presence of archived features in the active file

**Pass:** All tests green.

---

## Scenario 6 — AC6: Top-level archive field present

1. Open `.github/pipeline-state.json`
2. Look for a top-level `"archive"` field
3. Confirm it equals `.github/pipeline-state-archive.json`

**Pass:** Archive pointer field exists with correct path.

---

## Scenario 7 — AC7: Phase 3 partial archive

1. In `.github/pipeline-state.json`, open the Phase 3 feature block
2. Count stories — expect ~10 in-flight stories (not 26)
3. In `.github/pipeline-state-archive.json`, find the Phase 3 entry
4. Confirm it has a `completedStories` array with ~16 DoD-complete stories

**Pass:** In-flight Phase 3 stories remain active; DoD-complete stories are archived.
