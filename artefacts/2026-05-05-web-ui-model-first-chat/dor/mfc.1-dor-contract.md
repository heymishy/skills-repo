# DoR Contract: mfc.1 — Model-first chat session architecture

**Story:** artefacts/2026-05-05-web-ui-model-first-chat/stories/mfc.1-model-first-chat-session.md
**Date:** 2026-05-05

---

## What will be built

1. **`src/modules/skill-turn-executor.js`** — signature change: `(systemPrompt, history, currentInput, token)` where `history = [{role:'user'|'assistant', content:string}]`. Messages built as `[{role:'system',content:systemPrompt}, ...history, {role:'user',content:currentInput}]`. Breaking change — all callers updated atomically in this story.

2. **`src/web-ui/routes/skills.js`** — the following additions and replacements:
   - `buildSystemPrompt(skillName, sessionPath)` — loads copilot-instructions.md + SKILL.md + product context files + reference materials + web UI protocol instruction.
   - `registerHtmlSession(sessionId, sessionPath, skillName)` — NEW structure: `{skillName, sessionPath, systemPrompt, turns:[], artefactContent:null, artefactPath:null, done:false}`. Old `questions/sections/answers/modelResponses/dynamicQuestions/sectionDrafts/pendingConfirmation` fields removed.
   - `htmlSubmitTurn(skillName, sessionId, answer, token)` — single `_skillTurnExecutor` call per turn; parses `---ARTEFACT-START---`/`---ARTEFACT-END---` and `---SLUG---` markers; appends `{role:'user'}` and `{role:'assistant'}` to `session.turns`; returns `{done, response, artefactContent?}`.
   - `htmlGetChatPage(skillName, sessionId)` — renders single-page chat HTML with `#chat-messages`, `#chat-form`, `#chat-input`, and client-side JS that POSTs to `/turn`.
   - `handleGetChatHtml(req, res)` — route handler for `GET /skills/:name/sessions/:id/chat`.
   - `handlePostTurnHtml(req, res)` — route handler for `POST /api/skills/:name/sessions/:id/turn`; returns JSON `{done, response, artefactContent?}`.
   - `htmlGetPreview(skillName, sessionId)` — returns `{artefactContent: session.artefactContent, artefactPath: session.artefactPath}` (model-produced, not scrape-first).
   - `handlePostSkillSessionHtml` — redirect changed from `/next` to `/chat`.
   - `setNextQuestionExecutorAdapter(fn)` and `setSectionDraftExecutorAdapter(fn)` — retained as no-ops for backward compatibility (accept a fn, do not throw); the internal adapters they set are not called in any model-first code path.

3. **`src/web-ui/server.js`**:
   - Add import of `handleGetChatHtml`, `handlePostTurnHtml` from `routes/skills.js`.
   - Add route: `GET /skills/:name/sessions/:id/chat` → `handleGetChatHtml`.
   - Add route: `POST /api/skills/:name/sessions/:id/turn` → `handlePostTurnHtml`.
   - Keep `GET /skills/:name/sessions/:id/next` route as a 303 redirect to `/chat` (backward compat for any bookmarked URLs).
   - Remove `setNextQuestionExecutorAdapter` and `setSectionDraftExecutorAdapter` wiring calls (or comment them — they are no-ops).

4. **Seven test file rewrites** (all in `tests/`):
   - `check-wuce23-skill-launcher-landing.js` — update T10 assertion: redirect target changed to `/chat`.
   - `check-wuce24-guided-question-form.js` — rewrite all 18 tests to cover `handleGetChatHtml` + `handlePostTurnHtml`.
   - `check-wuce26-per-answer-model-response.js` — rewrite 14 tests: `htmlSubmitTurn` calls `_skillTurnExecutor` with correct `(systemPrompt, history, currentInput, token)` args.
   - `check-dsq1-dynamic-next-question.js` — rewrite 9 tests: model-driven turn flow, single call per turn.
   - `check-dsq2-section-confirmation-loop.js` — rewrite 10 tests: multi-turn conversation; `session.turns` grows per turn.
   - `check-dsq3-post-session-clarify-gate.js` — rewrite 7 tests: `session.done` set when artefact signal received; `htmlGetCompletePage` works with `done` flag.
   - `check-dsq4-section-artefact-assembly.js` — rewrite 7 tests: `htmlGetPreview` returns `session.artefactContent` (model-produced).
   - **Note:** `check-dsq1-5-section-aware-extraction.js` is NOT rewritten — it tests `extractSections` and `extractQuestions` in `skill-content-adapter.js` which are unchanged (used by the JSON API flow).

5. **New test file** `tests/check-mfc1-model-first-chat-session.js` — 24 tests covering T1–T9 from the test plan.

---

## What will NOT be built

- No changes to any JSON API route handlers (`handleGetSkills`, `handlePostSession`, `handlePostAnswer`, `handleGetSessionState`, `handleCommitArtefact`, `handleResumeSession`).
- No changes to `src/skill-content-adapter.js` — `extractQuestions` and `extractSections` remain (still used by JSON API flow).
- No changes to `handleGetCommitPreviewHtml`, `handlePostCommitHtml`, `handleGetResultHtml` beyond updating `htmlGetPreview` return shape (which those handlers already read from the adapter).
- No changes to auth, session middleware, or session cookie handling.
- No new npm packages.
- No changes to any file under `artefacts/`, `.github/skills/`, `.github/templates/`, `standards/`, or `scripts/`.
- No streaming responses.
- No disk persistence of `session.turns`.

---

## AC verification approach

| AC | Implementation approach | Test |
|----|------------------------|------|
| AC1 — redirect to /chat | handlePostSkillSessionHtml sets Location to /chat | T1.1, T1.2 |
| AC2 — chat page HTML structure | handleGetChatHtml renders #chat-messages, #chat-form, #chat-input, JS | T2.1–T2.3 |
| AC3 — initial model turn on load | handleGetChatHtml calls _skillTurnExecutor with history=[] | T3.1, T3.2 |
| AC4 — single model call per turn | htmlSubmitTurn stub call count === 1; turns appended | T4.1–T4.4 |
| AC5 — artefact signal parsed | session.done, session.artefactContent, session.artefactPath set | T5.1–T5.4 |
| AC6 — commit-preview reads model content | htmlGetPreview returns session.artefactContent/artefactPath | T6.1, T6.2 |
| AC7 — buildSystemPrompt structure | Contains copilot-instructions, SKILL.md, product context, protocol | T7.1–T7.3 |
| AC8 — executor message format | messages = [system, ...history, user] | T8.1–T8.3 |
| AC9 — removed adapters backward-compat | setNextQuestionExecutorAdapter/setSectionDraftExecutorAdapter exported, accept fn | T9.1, T9.2 |
| AC10 — npm test 0 failures | Manual: run npm test after implementation | Manual smoke |

---

## Estimated touch points

| Category | Items |
|----------|-------|
| Files modified | `src/modules/skill-turn-executor.js`, `src/web-ui/routes/skills.js`, `src/web-ui/server.js` |
| Files created | `tests/check-mfc1-model-first-chat-session.js` |
| Test files rewritten | `check-wuce23`, `check-wuce24`, `check-wuce26`, `check-dsq1`, `check-dsq2`, `check-dsq3`, `check-dsq4` |
| Files NOT touched | `src/skill-content-adapter.js`, `src/web-ui/adapters/skills.js`, all JSON API handlers, all dashboards, all artefacts, all governance files |

---

## schemaDepends

`schemaDepends: []` — all session state is in-memory `Map`; no pipeline-state.json schema fields affected.
