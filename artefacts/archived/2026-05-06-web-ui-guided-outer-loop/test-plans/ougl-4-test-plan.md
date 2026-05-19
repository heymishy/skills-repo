# Test Plan — ougl.4: Journey-aware chat button

**Story:** ougl.4 — Journey-aware chat button in `handleGetChatHtml`
**Feature:** 2026-05-06-web-ui-guided-outer-loop
**Test file:** `tests/check-ougl4-journey-aware-chat-button.js`
**Date:** 2026-05-06
**Total ACs:** 7

---

## Test Data Strategy

**Type:** Synthetic — sessions created via `routes._setHtmlSession(sid, {...})` to bypass `buildSystemPrompt` file I/O. `journeyId`, `skillName`, and `done` fields set inline. `freshRequire` clears module cache before each test group.

**Security note:** AC7 tests XSS prevention. `journeyId` value `'<script>alert(1)</script>'` must be encoded with `escHtml` before appearing in the HTML attribute.

---

## AC Coverage Table

| AC  | Description | Test IDs | Gap type | Risk |
|-----|-------------|----------|----------|------|
| AC1 | `journeyId: 'j-abc'` + `done: true` → HTML has gate-confirm form | T4.1 | None | High |
| AC2 | Same + `skillName: 'discovery'` → button text includes `benefit-metric` | T4.2 | None | Medium |
| AC3 | `journeyId: null` + `done: true` → HTML does NOT contain `/api/journey/` | T4.3 | None | Medium |
| AC4 | `journeyId: 'j-abc'` + `done: false` → gate-confirm form NOT rendered | T4.4 | None | Medium |
| AC5 | `journeyId: 'j-abc'` + `done: true` + `skillName: 'definition-of-ready'` → link to `/journey/j-abc/complete` | T4.5 | None | Medium |
| AC6 | Standalone (`journeyId: null`) + `done: true` → commit-preview link still present | T4.6 | None | Low |
| AC7 | `journeyId: '<script>'` → encoded with `escHtml` in HTML output | T4.7 | None | High |

**Coverage gaps:** None. All ACs testable via unit assertions on `handleGetChatHtml` HTML output.

---

## Unit Tests

All tests follow this pattern:
1. `freshRequire(ROUTES_PATH)` — get `routes`
2. `routes.setSkillTurnExecutorAdapter(async () => 'Hello!')` — avoid API call
3. `routes._setHtmlSession(sid, sessionData)` — inject test session
4. Call `routes.handleGetChatHtml(req, res)` with mock req/res
5. Assert on captured `body` string

### T4.1 (AC1) — journeyId + done:true → gate-confirm form present
**Session:** `{ skillName: 'discovery', ..., done: true, journeyId: 'journey-abc', turns: [{ role: 'assistant', content: 'Hi' }] }`
**Expected:** body includes `<form` and `action="/api/journey/journey-abc/gate-confirm"` (or similar path containing the journeyId).

### T4.2 (AC2) — button text includes next skill name (benefit-metric)
**Session:** same as T4.1, `skillName: 'discovery'`
**Expected:** body contains "benefit-metric" within the gate-confirm form area.

### T4.3 (AC3) — journeyId:null + done:true → no /api/journey/ link
**Session:** `{ skillName: 'discovery', ..., done: true, journeyId: null, turns: [{ role: 'assistant', content: 'Hi' }] }`
**Expected:** body does NOT contain `/api/journey/` anywhere.

### T4.4 (AC4) — journeyId + done:false → no gate-confirm form
**Session:** `{ skillName: 'discovery', ..., done: false, journeyId: 'journey-abc', turns: [{ role: 'assistant', content: 'Hi' }] }`
**Expected:** body does NOT contain `gate-confirm` or does not contain `action="/api/journey/journey-abc/gate-confirm"`.

### T4.5 (AC5) — last stage (definition-of-ready) → link to /journey/:id/complete
**Session:** `{ skillName: 'definition-of-ready', ..., done: true, journeyId: 'journey-abc', turns: [{ role: 'assistant', content: 'Done' }] }`
**Expected:** body contains `/journey/journey-abc/complete` (no next-skill button; instead link to complete screen).

### T4.6 (AC6) — standalone done:true → commit-preview link still present
**Session:** `{ skillName: 'discovery', ..., done: true, journeyId: null, artefactPath: 'artefacts/test/discovery.md', turns: [{ role: 'assistant', content: 'Done' }] }`
**Expected:** body contains `commit-preview` or the commit-preview URL (existing behavior preserved).

### T4.7 (AC7) — journeyId XSS encoding
**Session:** `{ skillName: 'discovery', ..., done: true, journeyId: '<script>alert(1)</script>', turns: [{ role: 'assistant', content: 'Hi' }] }`
**Expected:** body does NOT contain `<script>alert(1)</script>` as a raw script tag (i.e., the value is HTML-encoded). Body MAY contain `&lt;script&gt;`.

---

## Integration Tests

No additional integration tests. The interaction between `handleGetChatHtml` and journey-store is indirect (session data already set in `_sessionStore`). The gate-confirm form POSTs to `/api/journey/:id/gate-confirm` which is tested in ougl.5.

---

## NFR Tests

**NFR-1 (escHtml on journeyId and skillName):** T4.7 directly tests journeyId encoding. skillName encoding is implicitly tested (XSS via skillName is covered by existing mfc.1/mfc.2 tests).

**NFR-2 (button must be `<button type="submit">` in `<form>`):** T4.1 asserts `<form` with correct action, implying the HTML structure. Implementation must use a `<button type="submit">` inside the form.

---

## Pre-implementation Expectation

T4.1, T4.2, T4.5, T4.7 will FAIL before implementation (gate-confirm form not rendered, no journeyId encoding in current code). T4.3 and T4.4 may PASS before implementation (no /api/journey/ links exist yet, done:false produces no button). T4.6 will PASS before implementation (commit-preview link exists for done:true). This is acceptable — the failing tests drive the new behavior.
