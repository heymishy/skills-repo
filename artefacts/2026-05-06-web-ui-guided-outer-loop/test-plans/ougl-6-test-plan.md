# Test Plan — ougl.6: Per-story stage routing

**Story:** ougl.6 — Per-story stage routing (`/journey/:id/stories` routes + journey store additions)
**Feature:** 2026-05-06-web-ui-guided-outer-loop
**Test file:** `tests/check-ougl6-perstory-stage-routing.js`
**Date:** 2026-05-06
**Total ACs:** 9

---

## Test Data Strategy

**Type:** Synthetic — story slugs constructed inline. Journey store populated via `createJourney`/`setStoryList`. `_clear()` in teardown. Disk writes use `os.tmpdir()`. No external services.

**Slug validation:** AC8 requires slug regex `/^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/i`. Path-traversal test uses `'../etc'` or `'../../bad'`.

---

## AC Coverage Table

| AC  | Description | Test IDs | Gap type | Risk |
|-----|-------------|----------|----------|------|
| AC1 | Auth `GET /journey/:id/stories` → 200 with form `POST /api/journey/:id/stories` + textarea | T6.1 | None | Medium |
| AC2 | Unauth GET → 302 `/auth/github` | T6.2 | None | Low |
| AC3 | POST with slug list → `journey.storyList === ['wgol.1', 'wgol.2', 'wgol.3']`, `mode === 'story'` | T6.3 | None | High |
| AC4 | POST success → 303 `Location: /skills/test-plan/sessions/[sid]/chat` | T6.4 | None | High |
| AC5 | New test-plan session systemPrompt contains `--- HANDOFF CONTEXT ---` AND first story slug | T6.5 | None | High |
| AC6 | test-plan done + gate-confirm → writes artefact, creates review session with priorArtefacts | T6.6 | None | High |
| AC7 | Review session created → 303 to review chat | T6.7 | None | Medium |
| AC8 | Path-traversal slug → 400 | T6.8 | None | High |
| AC9 | Empty story list → 400 | T6.9 | None | Low |

**Coverage gaps:** None. All ACs testable via unit/integration tests.

---

## Unit Tests

### T6.1 (AC1) — Auth GET /journey/:id/stories → 200 with form and textarea
**Setup:** Create journey `jrn-stories`. Auth GET.
**Call:** `journey.handleGetStoriesList(req, res)` with `req.params = { journeyId: 'jrn-stories' }`.
**Expected:** status `200`, body includes `<form` with `action="/api/journey/jrn-stories/stories"` (or similar), and body includes `<textarea`.

### T6.2 (AC2) — Unauth GET → 302
**Setup:** `req = { session: {} }`.
**Expected:** status `302`, `Location === '/auth/github'`.

### T6.3 (AC3) — POST sets storyList and mode
**Setup:** Auth POST, body contains `stories = 'wgol.1\nwgol.2\nwgol.3'` (textarea newline-separated).
**Call:** `journey.handlePostStoriesList(req, res)`.
**Expected:** `store.getJourney('jrn-stories').storyList` equals `['wgol.1', 'wgol.2', 'wgol.3']` (trimmed, non-empty). `journey.mode === 'story'`.

### T6.4 (AC4) — POST → 303 to test-plan chat
**Setup:** Same as T6.3. Inject mock `registerHtmlSession` that captures `newSid = 'tp-sid-001'`.
**Expected:** status `303`, `Location: '/skills/test-plan/sessions/tp-sid-001/chat'`.

### T6.5 (AC5) — New test-plan session systemPrompt has HANDOFF CONTEXT and story slug
**Setup:** Same as T6.4 but use real `registerHtmlSession` with `os.tmpdir()` as repoRoot. Prior artefacts from feature stages exist in `completedStages`.
**Expected:** `session.systemPrompt` includes `--- HANDOFF CONTEXT ---` AND includes `'wgol.1'` (first story slug injected into the prompt context).

### T6.6 (AC6) — test-plan done + gate-confirm → creates review session with priorArtefacts
**Setup:** Set up journey in story mode with `storyList = ['wgol.1']`. Test-plan session for `wgol.1` is `done: true`. Trigger gate-confirm.
**Expected:** `registerHtmlSession` for review stage is called. `priorArtefacts` includes the test-plan artefact content.

### T6.7 (AC7) — Review session created → 303 to review chat
**Setup:** Same as T6.6 with mock `registerHtmlSession` returning `'rev-sid-001'`.
**Expected:** status `303`, `Location: '/skills/review/sessions/rev-sid-001/chat'`.

### T6.8 (AC8) — Path-traversal slug → 400
**Setup:** POST body `stories = '../etc\nwgol.1'`.
**Expected:** status `400`. Journey store NOT modified.

### T6.9 (AC9) — Empty story list → 400
**Setup:** POST body `stories = ''` (empty textarea) or whitespace-only.
**Expected:** status `400`.

---

## Integration Tests

**T6.INT.1 — setStoryList / getCurrentStory / advanceToNextStory:** Create journey, set `storyList = ['s1', 's2', 's3']`. Verify `getCurrentStory` returns `'s1'`. After `advanceToNextStory`, returns `'s2'`. After third advance, returns `false`/`null`.

---

## NFR Tests

**NFR-1 (Slug validation regex `/^[a-z0-9]([a-z0-9.\-]*[a-z0-9])?$/i`):** T6.8 covers `../etc`. Also test `'valid.slug-1'` passes (valid slug should not trigger 400).

**NFR-2 (Empty story list → 400):** T6.9 covers this.

---

## Pre-implementation Expectation

All T6.1–T6.9 will FAIL before implementation (`journey.js` does not exist). This is the correct TDD baseline.
