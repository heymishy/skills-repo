# Test Plan — ougl.7: DoR per-story stage + journey complete screen

**Story:** ougl.7 — DoR per-story stage and journey complete screen
**Feature:** 2026-05-06-web-ui-guided-outer-loop
**Test file:** `tests/check-ougl7-dor-and-journey-complete.js`
**Date:** 2026-05-06
**Total ACs:** 9

---

## Test Data Strategy

**Type:** Synthetic — journey store state set up programmatically. Story list injected via `setStoryList`. Sessions created via `_setHtmlSession`. Disk writes use `os.tmpdir()`. `_clear()` in teardown. No external services.

---

## AC Coverage Table

| AC  | Description | Test IDs | Gap type | Risk |
|-----|-------------|----------|----------|------|
| AC1 | Review session done + gate-confirm → creates DoR session with priorArtefacts (test-plan + review + story context) | T7.1 | None | High |
| AC2 | DoR session created → 303 to DoR chat | T7.2 | None | High |
| AC3 | DoR gate-confirm + `advanceToNextStory` returns `true` → creates next story test-plan session, 303 to it | T7.3 | None | High |
| AC4 | DoR gate-confirm + `advanceToNextStory` returns `false` → 303 to `/journey/:id/complete` | T7.4 | None | High |
| AC5 | Auth `GET /journey/:id/complete` → 200 with all `completedStages` listed | T7.5 | None | Medium |
| AC6 | Unauth GET `/journey/:id/complete` → 302 `/auth/github` | T7.6 | None | Low |
| AC7 | 3 feature stages + 2 stories × 3 story stages → ≥9 artefact entries in HTML | T7.7 | None | Medium |
| AC8 | Unknown journeyId on complete → 404 | T7.8 | None | Low |
| AC9 | Full `npm test` with ougl.1–ougl.7 applied → 0 pre-existing failures | (full npm test chain) | N/A | Low |

**Coverage gaps:** AC9 is verified by `npm test` after full implementation, not by this script.

---

## Unit Tests

### T7.1 (AC1) — Review done → DoR session with all priorArtefacts
**Setup:** Journey in story mode. `completedStages` includes `discovery`, `benefit-metric`, `definition`. Current story `'wgol.1'` has `test-plan` and `review` stages completed in `completedStages`. Active session is the review session, `done: true`.
**Call:** `journey.handlePostGateConfirm(req, res)` for the review session's journeyId.
**Expected:** `registerHtmlSession` called for `definition-of-ready` skill. `priorArtefacts` includes at minimum: the test-plan artefact and review artefact for `wgol.1`. Assert count ≥ 2 and paths match expected artefact paths.

### T7.2 (AC2) — DoR session → 303 to DoR chat
**Setup:** Same as T7.1. Mock `registerHtmlSession` returns `'dor-sid-001'`.
**Expected:** status `303`, `Location: '/skills/definition-of-ready/sessions/dor-sid-001/chat'`.

### T7.3 (AC3) — DoR gate-confirm, next story exists → 303 to next story test-plan
**Setup:** Journey with `storyList = ['wgol.1', 'wgol.2']`. `wgol.1` DoR session is done. `advanceToNextStory` returns `'wgol.2'` (true → more stories). Mock `registerHtmlSession` for next test-plan session returns `'next-tp-sid'`.
**Expected:** status `303`, `Location: '/skills/test-plan/sessions/next-tp-sid/chat'`.

### T7.4 (AC4) — DoR gate-confirm, no next story → 303 to /journey/:id/complete
**Setup:** Journey with `storyList = ['wgol.1']`. `wgol.1` DoR session is done. `advanceToNextStory` returns false (no more stories).
**Expected:** status `303`, `Location: '/journey/:journeyId/complete'` (contains the journeyId).

### T7.5 (AC5) — Auth GET /journey/:id/complete → 200 with completedStages listed
**Setup:** Create journey, populate `completedStages` with 3 entries: `{ skillName: 'discovery', artefactPath: 'artefacts/test/discovery.md' }`, etc. Auth GET `/journey/:id/complete`.
**Call:** `journey.handleGetComplete(req, res)`
**Expected:** status `200`, body includes artefact paths from `completedStages`.

### T7.6 (AC6) — Unauth GET complete → 302
**Setup:** `req = { session: {} }`.
**Expected:** status `302`, `Location === '/auth/github'`.

### T7.7 (AC7) — 3 feature + 2 stories × 3 stages → ≥9 artefact entries in HTML
**Setup:** Journey with `completedStages` containing 9 entries: 3 feature stages + 2 stories × 3 story stages each. Auth GET complete.
**Expected:** HTML body contains at least 9 artefact path references (counted by occurrences of `artefacts/`).

### T7.8 (AC8) — Unknown journeyId on complete → 404
**Setup:** GET `/journey/nonexistent-id/complete`.
**Expected:** status `404`.

---

## Integration Tests

**T7.INT.1 — journey_completed log event:** Inject a logger mock into `journey.js`. After `handleGetComplete` returns 200, verify logger received `journey_completed` event (M1 instrumentation per NFR).

**T7.INT.2 — escHtml on artefact paths:** Set `completedStages[0].artefactPath = '<script>alert(1)</script>'`. After GET complete, verify the HTML does NOT contain the raw script tag. (Security NFR.)

---

## NFR Tests

**NFR-1 (escHtml on artefact paths):** T7.INT.2 covers this.

**NFR-2 (`journey_completed` info log event):** T7.INT.1 covers this.

---

## Pre-implementation Expectation

All T7.1–T7.8 will FAIL before implementation (`journey.js` does not exist). This is the correct TDD baseline.
