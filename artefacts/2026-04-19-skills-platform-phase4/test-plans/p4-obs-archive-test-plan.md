# Test Plan: p4-obs-archive

**Story:** Story/epic archive toggle for viz and state file performance
**Epic:** E5 — Platform Observability & Measurement
**Complexity:** 2 | **Scope stability:** Stable
**Implementation paths:** `scripts/archive-completed-features.js` (extended), `dashboards/pipeline-viz.html` (toggle), `.github/pipeline-state.schema.json` (new field)

---

## Test Suite Overview

| Test ID | AC | Description | Type |
|---------|----|-------------|------|
| T1 | AC1 | `archiveStories` moves DoD-complete stories to archive state | Unit |
| T2 | AC1 | Active state gains `archivedStoryCount` after archiveStories | Unit |
| T3 | AC1 | Archive contains stories under parent feature key | Unit |
| T4 | AC2 | `mergeState` reconstitutes archived stories with `archived: true` | Unit |
| T5 | AC2 | Round-trip fidelity — merged state fields match pre-archive state | Unit |
| T6 | AC3 | Viz badge renders "N archived" for epic with archivedStoryCount | Unit |
| T7 | AC3 | Archived story rows hidden by default | Unit |
| T8 | AC4 | `?showArchived=true` makes archived stories visible | Unit |
| T9 | AC4 | Archived stories rendered with muted style class | Unit |
| T10 | AC5 | Viz handles 50+ story fixture without error | Performance |
| T-NFR1 | NFR | `archivedStoryCount` field present in pipeline-state.schema.json | Governance |
| T-NFR2 | NFR | No external JS file added to dashboards/ by this story | Governance |

---

## Test Specifications

### T1 — archiveStories moves DoD-complete stories to archive state

**Preconditions:** Fixture active state with feature `slug-a` containing 2 stories: one `dodStatus: "complete"`, one `dodStatus: null`.
**Input:** `archiveStories(activeState, archiveState, 'slug-a')`.
**Expected:** Returned archive state contains story under `slug-a`; returned active state no longer contains the DoD-complete story entry as a full object.
**Failure state (before implementation):** `archiveStories` export does not exist.

---

### T2 — Active state gains archivedStoryCount after archiveStories

**Preconditions:** Same fixture as T1.
**Input:** `archiveStories(activeState, archiveState, 'slug-a')`.
**Expected:** The active state for feature `slug-a` gains `archivedStoryCount: 1`.
**Failure state (before implementation):** Export missing or field not set.

---

### T3 — Archive contains stories under parent feature key

**Preconditions:** Empty archive state; active state with one DoD-complete story under `slug-a`.
**Input:** `archiveStories(activeState, {}, 'slug-a')`.
**Expected:** Returned archive state has `archive['slug-a'].stories[0].id === <story id>`.
**Failure state (before implementation):** Archive empty or story under wrong key.

---

### T4 — mergeState reconstitutes archived stories with archived: true

**Preconditions:** Post-archive active + archive states from T1.
**Input:** `mergeState(activeState, archiveState)`.
**Expected:** Returned merged state contains story with `archived: true` under feature `slug-a`.
**Failure state (before implementation):** `mergeState` does not add `archived` flag or does not include archived stories.

---

### T5 — Round-trip fidelity

**Preconditions:** Fixture active state with 3 stories (2 DoD-complete, 1 active).
**Input:** Archive then merge.
**Expected:** Merged state contains all 3 stories with all original fields intact.
**Failure state (before implementation):** Field loss on round-trip.

---

### T6 — Viz badge renders "N archived" for epic with archivedStoryCount

**Preconditions:** Fixture HTML from `pipeline-viz.html`; state with feature having `archivedStoryCount: 3`.
**Input:** Load pipeline-viz.html logic with fixture state (jsdom or inline parse).
**Expected:** HTML rendered contains text `3 archived`.
**Failure state (before implementation):** Badge not rendered.

---

### T7 — Archived story rows hidden by default

**Preconditions:** Same as T6.
**Input:** Default load (no query param).
**Expected:** Archived story rows have CSS class `story-row-archived` and are hidden (display:none or visibility:hidden or collapsed container).
**Failure state (before implementation):** Stories visible or class absent.

---

### T8 — ?showArchived=true makes archived stories visible

**Preconditions:** Same fixture; `?showArchived=true` query param parsed in viz logic.
**Input:** Render with showArchived flag true.
**Expected:** Archived story rows are not hidden.
**Failure state (before implementation):** Toggle logic absent.

---

### T9 — Archived stories rendered with muted style class

**Preconditions:** Same as T8.
**Input:** Render with showArchived true.
**Expected:** Archived story rows have a CSS class indicating muted style (e.g. `story-archived-visible` or `text-muted` or reduced opacity via class).
**Failure state (before implementation):** Style class absent.

---

### T10 — Viz handles 50+ story fixture without error

**Preconditions:** Generated fixture state with 55 stories across 5 features (10 DoD-complete archived per feature, 1 active).
**Input:** Render viz with fixture.
**Expected:** Render completes without throwing; all 5 features appear in output; `archivedStoryCount` badges present.
**Failure state (before implementation):** Error thrown or stories missing.

---

### T-NFR1 — archivedStoryCount field present in pipeline-state.schema.json

**Preconditions:** `.github/pipeline-state.schema.json` exists.
**Input:** Read schema file content.
**Expected:** File contains the string `archivedStoryCount`.
**Failure state (before implementation):** Field not added to schema.

---

### T-NFR2 — No new external JS file in dashboards/ (architecture governance)

**Preconditions:** List of files in `dashboards/` before and after.
**Input:** `fs.readdirSync('dashboards').filter(f => f.endsWith('.js'))`.
**Expected:** Only existing JS files present (`artefact-content.js`, `artefact-fetcher.js`, `extra-data.js`, `md-renderer.js`, `pipeline-adapter.js`); no new `.js` file added by this story.
**Failure state (before implementation):** N/A (test is a governance assertion, passes before implementation, must continue to pass after).
