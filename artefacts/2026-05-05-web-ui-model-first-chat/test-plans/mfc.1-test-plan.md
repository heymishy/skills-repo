## Test Plan: mfc.1 — Model-first chat session architecture

**Story reference:** artefacts/2026-05-05-web-ui-model-first-chat/stories/mfc.1-model-first-chat-session.md
**Epic reference:** artefacts/2026-05-05-web-ui-model-first-chat/epics/mfc-epic-1.md
**Test plan author:** Copilot
**Date:** 2026-05-05

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | Session creation redirects to /chat not /next | 2 tests | — | — | — | — | 🟢 |
| AC2 | Chat page renders with message area, fixed form, JS | 3 tests | — | — | — | — | 🟢 |
| AC3 | Initial model turn on page load (history=[], 'Begin the session.') | 2 tests | — | — | — | — | 🟢 |
| AC4 | Single model call per turn, turns appended to session | 4 tests | — | — | — | — | 🟢 |
| AC5 | Artefact signal parsed, session.done set, artefactPath derived | 4 tests | — | — | — | — | 🟢 |
| AC6 | commit-preview reads session.artefactContent + session.artefactPath | 2 tests | — | — | — | — | 🟢 |
| AC7 | buildSystemPrompt includes copilot-instructions + SKILL.md + product context + protocol | 3 tests | — | — | — | — | 🟢 |
| AC8 | skill-turn-executor builds [system, ...history, user] messages | 3 tests | — | — | — | — | 🟢 |
| AC9 | Removed adapters still exported, accept fn without throwing | 2 tests | — | — | — | — | 🟢 |
| AC10 | npm test: 0 failures after rewrite | — | — | — | npm test run | External-dependency | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason | Handling |
|-----|----|----------|--------|---------|
| npm test output | AC10 | External-dependency | Requires live server + real token for full smoke | Manual smoke test — see verification script 🟡 |

---

## Test Data Strategy

- All tests use dependency injection (stub `_skillTurnExecutor` via `setSkillTurnExecutorAdapter`).
- System prompt is verified structurally: presence of key substrings (copilot-instructions marker, SKILL.md header, product context headers, protocol section).
- Artefact signal tests use literal `---ARTEFACT-START---` / `---ARTEFACT-END---` strings in stub responses.
- No real GitHub API calls in unit tests. `commitArtefact` is not called in model-first tests.

---

## Test Entries

### T1 — Session creation redirects to /chat (AC1)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T1.1 — Redirect target is /chat**
Given `handlePostSkillSessionHtml` is called with a valid authenticated session and `_createSession` returns `{id: 'sess-123'}`.
When the handler runs.
Then `res.statusCode` is 303 and `res.headers.location` ends with `/chat` (not `/next`).

**T1.2 — /next redirect gone**
Given the same setup.
When the handler runs.
Then `res.headers.location` does NOT contain `/next`.

---

### T2 — Chat page HTML structure (AC2)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T2.1 — #chat-messages container present**
Given `handleGetChatHtml` is called with a valid session.
Then the response HTML contains `id="chat-messages"`.

**T2.2 — #chat-form and textarea at bottom**
Given `handleGetChatHtml` is called.
Then the response HTML contains `id="chat-form"` and `id="chat-input"`.

**T2.3 — Client JS POSTs to /turn endpoint**
Given the HTML response.
Then it contains the string `/turn` in a script block (confirming the fetch target).

---

### T3 — Initial model turn (AC3)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T3.1 — buildSystemPrompt called on session init**
Given `registerHtmlSession` is called for skillName='discovery', sessionPath='/tmp/s1'.
When the session is stored.
Then `session.systemPrompt` contains 'SKILL.md' content marker AND copilot-instructions marker AND product context marker AND the web UI protocol instruction.

**T3.2 — Initial turn fires _skillTurnExecutor with empty history**
Given a stub `_skillTurnExecutor` that records its call args.
When the chat page is first loaded (`handleGetChatHtml`) for a session with no prior turns.
Then the stub was called with `history=[]` and `currentInput='Begin the session.'`.

---

### T4 — Single model call per turn, turns appended (AC4)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T4.1 — POST /turn calls _skillTurnExecutor exactly once**
Given a stub `_skillTurnExecutor`.
When `htmlSubmitTurn` is called with a user answer.
Then the stub was called exactly once.

**T4.2 — User answer appended to session.turns as role:user**
Given `htmlSubmitTurn` is called with answer 'My answer'.
Then `session.turns` contains `{role:'user', content:'My answer'}`.

**T4.3 — Model response appended to session.turns as role:assistant**
Given the stub returns 'Model reply'.
Then `session.turns` contains `{role:'assistant', content:'Model reply'}`.

**T4.4 — No second or third model call made**
Given a stub that records all calls.
When `htmlSubmitTurn` runs.
Then the stub call count is exactly 1.

---

### T5 — Artefact signal parsing (AC5)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T5.1 — session.done set to true when artefact markers present**
Given `_skillTurnExecutor` returns a response containing `---ARTEFACT-START---\n# Discovery\n---ARTEFACT-END---\n---SLUG---\n2026-05-05-my-feature`.
When `htmlSubmitTurn` runs.
Then `session.done === true`.

**T5.2 — session.artefactContent set to extracted content**
Given the same stub response.
Then `session.artefactContent === '# Discovery'`.

**T5.3 — session.artefactPath derived from slug**
Given the same stub response.
Then `session.artefactPath === 'artefacts/2026-05-05-my-feature/discovery.md'`.

**T5.4 — session.done stays false when no artefact signal**
Given `_skillTurnExecutor` returns 'Just a question'.
Then `session.done === false` and `session.artefactContent` is null.

---

### T6 — commit-preview reads model-produced content (AC6)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T6.1 — htmlGetPreview returns session.artefactContent**
Given a session with `artefactContent: '## Problem Statement\n\nText'` and `artefactPath: 'artefacts/2026-05-05-x/discovery.md'`.
When `htmlGetPreview` is called.
Then `result.artefactContent === '## Problem Statement\n\nText'` and `result.artefactPath === 'artefacts/2026-05-05-x/discovery.md'`.

**T6.2 — commit-preview page shows model-produced content**
Given the same session.
When `handleGetCommitPreviewHtml` renders.
Then the response HTML contains '## Problem Statement'.

---

### T7 — buildSystemPrompt structure (AC7)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T7.1 — System prompt includes copilot-instructions.md content**
Given `buildSystemPrompt('discovery', '/tmp')` is called.
Then the result contains content from `.github/copilot-instructions.md` (e.g. the string 'Pipeline overview').

**T7.2 — System prompt includes SKILL.md content**
Given the same call.
Then the result contains content from `.github/skills/discovery/SKILL.md`.

**T7.3 — System prompt includes web UI protocol section**
Given the same call.
Then the result contains `---ARTEFACT-START---` in the protocol instruction (the instruction text referencing this marker).

---

### T8 — skill-turn-executor message format (AC8)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T8.1 — Messages array starts with system role**
Given `skillTurnExecutor` is invoked with `systemPrompt='SYS'`, `history=[]`, `currentInput='Hi'`, and an https mock.
Then the request body's `messages[0]` is `{role:'system', content:'SYS'}`.

**T8.2 — History turns are spread in order**
Given `history=[{role:'assistant',content:'A'},{role:'user',content:'B'}]`.
Then `messages[1]` is `{role:'assistant',content:'A'}` and `messages[2]` is `{role:'user',content:'B'}`.

**T8.3 — Current input appended as final user message**
Given `currentInput='MyQuestion'`.
Then the last message in the array is `{role:'user',content:'MyQuestion'}`.

---

### T9 — Removed adapters backward-compat (AC9)

**File:** `tests/check-mfc1-model-first-chat-session.js`

**T9.1 — setNextQuestionExecutorAdapter exported and accepts fn**
Given `const r = require('./src/web-ui/routes/skills')`.
Then `typeof r.setNextQuestionExecutorAdapter === 'function'` and calling it with `() => {}` does not throw.

**T9.2 — setSectionDraftExecutorAdapter exported and accepts fn**
Given the same require.
Then `typeof r.setSectionDraftExecutorAdapter === 'function'` and calling it with `() => {}` does not throw.

---

## Verification script

See: `artefacts/2026-05-05-web-ui-model-first-chat/verification-scripts/mfc.1-verification.md`
