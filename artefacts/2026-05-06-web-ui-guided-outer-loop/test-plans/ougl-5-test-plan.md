# Test Plan — ougl.5: Gate-confirm handler (feature stages)

**Story:** ougl.5 — Gate-confirm handler for feature stages
**Feature:** 2026-05-06-web-ui-guided-outer-loop
**Test file:** `tests/check-ougl5-gate-confirm-feature-stages.js`
**Date:** 2026-05-06
**Total ACs:** 12

---

## Test Data Strategy

**Type:** Synthetic — journey store state set up via `createJourney`/`setActiveSession`/`completeStage` before each test. Session data injected via `_setHtmlSession` in skills.js mock. Disk writes use `os.tmpdir()` as `repoRoot` so no real artefact directory is needed. `_clear()` called in teardown.

**Security:** AC11 tests path traversal prevention. `artefactPath` value `'../../etc/passwd'` must be rejected with 400, no file written.

---

## AC Coverage Table

| AC  | Description | Test IDs | Gap type | Risk |
|-----|-------------|----------|----------|------|
| AC1 | `done:true`, `artefactContent` non-null → writes to disk at `path.join(repoRoot, artefactPath)` | T5.1 | None | High |
| AC2 | Reads back from disk (not from `session.artefactContent`) for `priorArtefacts` | T5.2 | None | High |
| AC3 | Creates next-stage session with `registerHtmlSession(newSid, newPath, 'benefit-metric', priorArtefacts)` | T5.3 | None | High |
| AC4 | New session `journeyId === journeyId` | T5.4 | None | Medium |
| AC5 | New session `systemPrompt` contains `--- HANDOFF CONTEXT ---` | T5.5 | None | High |
| AC6 | `discovery → benefit-metric` → 303 `Location: /skills/benefit-metric/sessions/[sid]/chat` | T5.6 | None | High |
| AC7 | `done:false` → 400 | T5.7 | None | Low |
| AC8 | Unknown journeyId → 404 | T5.8 | None | Low |
| AC9 | Unauth → 302 `/auth/github` | T5.9 | None | Low |
| AC10 | `getNextStage` returns `'test-plan'` → 303 `Location: /journey/:id/stories` | T5.10 | None | Medium |
| AC11 | Path traversal in `artefactPath` → 400, no file written | T5.11 | None | High |
| AC12 | Multiple prior stages → `priorArtefacts` contains all prior artefacts | T5.12 | None | Medium |

**Coverage gaps:** None. All ACs testable via unit/integration with mock req/res and injected filesystem.

---

## Unit Tests

### T5.1 (AC1) — done:true → writes artefact to disk
**Setup:** Create journey, set active session with `done: true`, `artefactContent: '# Discovery content'`, `artefactPath: 'artefacts/test-slug/discovery.md'`. Use `os.tmpdir()` as repoRoot. Inject fs mock or use real `os.tmpdir()` path.
**Call:** `journey.handlePostGateConfirm(req, res)`
**Expected:** file at `path.join(tmpdir, 'artefacts/test-slug/discovery.md')` exists and contains `'# Discovery content'`.

### T5.2 (AC2) — Reads from disk, not from session.artefactContent
**Setup:** Same as T5.1 but mutate `session.artefactContent` after disk write to a different value. Verify that `priorArtefacts[0].content` equals the disk content, not the mutated session value.
**Expected:** `priorArtefacts[0].content === '# Discovery content'` (disk value).

### T5.3 (AC3) — Creates next-stage session with correct priorArtefacts
**Setup:** Inject `registerHtmlSession` mock that captures arguments. Auth POST to `/api/journey/:journeyId/gate-confirm`.
**Expected:** `registerHtmlSession` called with 4th arg `priorArtefacts[0].path === session.artefactPath`.

### T5.4 (AC4) — New session journeyId matches
**Setup:** Same. After gate-confirm, inspect new session via `_getHtmlSession(newSid)`.
**Expected:** `newSession.journeyId === journeyId`.

### T5.5 (AC5) — New session systemPrompt has HANDOFF CONTEXT
**Setup:** Use real `registerHtmlSession` (not mocked) with `os.tmpdir()` as repoRoot and real artefact written to disk first.
**Expected:** `newSession.systemPrompt` includes `--- HANDOFF CONTEXT ---`.

### T5.6 (AC6) — discovery → benefit-metric → 303 to benefit-metric chat
**Setup:** `skillName: 'discovery'`, `done: true`. Mock `registerHtmlSession` returns `newSid = 'new-sid-001'`.
**Expected:** status `303`, `Location: '/skills/benefit-metric/sessions/new-sid-001/chat'`.

### T5.7 (AC7) — done:false → 400
**Setup:** Active session has `done: false`. Auth POST.
**Expected:** status `400`.

### T5.8 (AC8) — Unknown journeyId → 404
**Setup:** POST with a journeyId not in the journey store.
**Expected:** status `404`.

### T5.9 (AC9) — Unauth → 302
**Setup:** `req = { session: {} }`.
**Expected:** status `302`, `Location === '/auth/github'`.

### T5.10 (AC10) — test-plan stage → 303 to /journey/:id/stories
**Setup:** `skillName: 'definition'`, `getNextStage('definition') === 'test-plan'`. Mock `registerHtmlSession` to track call. (Per AC10, when next stage is test-plan the route sends to stories screen instead of creating a session.)
**Expected:** status `303`, `Location` matches `/journey/:journeyId/stories`.

### T5.11 (AC11) — Path traversal → 400, no file written
**Setup:** Session `artefactPath: '../../etc/passwd'`. Auth POST.
**Expected:** status `400`. File NOT written at any location.

### T5.12 (AC12) — Multiple prior stages in priorArtefacts
**Setup:** Journey already has two `completedStages` (`discovery` and `benefit-metric`). Active session completes `definition`.
**Call:** gate-confirm for `definition`.
**Expected:** `registerHtmlSession` 4th arg `priorArtefacts` has 3 entries (all three prior artefacts).

---

## Integration Tests

**T5.INT.1 — completeStage called on success:** After gate-confirm, verify that `store.getJourney(journeyId).completedStages` contains the completed stage entry.

**T5.INT.2 — Directory creation:** Write to a nested path under `os.tmpdir()`. Verify parent directories are created (`mkdirSync({ recursive: true })`).

---

## NFR Tests

**NFR-1 (Path traversal prevention mandatory):** T5.11 directly covers this.

**NFR-2 (Disk write failure → HTTP 500, no completeStage):** Inject an fs mock that throws on write. Expected: status 500, `completeStage` NOT called (verified by checking `journey.completedStages.length === 0`).

**NFR-3 (Audit log on success):** Inject a logger mock. After success, verify logger received an event. (Or verify via journey module's exported audit logger setter if one exists.)

---

## Pre-implementation Expectation

All T5.1–T5.12 will FAIL before implementation (`journey.js` does not exist). This is the correct TDD baseline.
