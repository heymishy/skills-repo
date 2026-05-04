## Story: Per-answer model response in skill HTML flow

**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e6-skill-execution-html-flow.md
**Discovery reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/discovery.md
**Benefit-metric reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/benefit-metric.md

## User Story

As an **operator running a skill via the web UI**,
I want to receive a brief model response after each answer I submit,
So that the skill session feels like a guided conversation rather than a static form — the model acknowledges my input, surfaces relevant context, and frames the next question before I see it.

## Benefit Linkage

**Metric moved:** P3 — Skill session completion rate
**How:** Conversational feedback after each answer reduces operator confusion and abandonment mid-session. An operator who sees the model acknowledge their answer and contextualise what comes next is more likely to complete the full session and commit an artefact.

## Architecture Constraints

- A new module `src/modules/skill-turn-executor.js` is introduced with an injectable adapter following ADR-009. The default implementation calls `POST https://api.githubcopilot.com/chat/completions` using Node's built-in `https` module (no new npm dependency). The injectable setter `setSkillTurnExecutor(fn)` is wired in `server.js` in the production block (`NODE_ENV !== 'test'`).
- The SKILL.md content for the active skill is loaded once at session creation (`registerHtmlSession`) and stored on the session object as `skillContent`. The model response call receives `(skillContent, priorQA, currentQuestion, currentAnswer, token)` — this gives the model full skill instruction context without re-reading the file on every turn.
- `_sessionStore` (Map in `routes/skills.js`) gains a `modelResponses: []` field per session, indexed in lock-step with `answers`. Index `i` = model response after answer `i`. Written by `htmlRecordAnswer` after calling `_skillTurnExecutor`.
- `handleGetQuestionHtml` renders `modelResponses[idx - 1]` (the response to the previous answer) above the prior-Q&A transcript and above the new question form. On question 1 (no prior response), this section is omitted.
- The model response is rendered as HTML (markdown → HTML via a simple conversion, or pre-rendered markdown block) — not as raw text. Use the existing `marked`-style rendering pattern if already present, otherwise a fenced `<pre>` block with `white-space: pre-wrap` is acceptable for MVP.
- `handlePostAnswerHtml` becomes async (it already is) and awaits the `_skillTurnExecutor` call before issuing the 303 redirect. The 303 redirect URL is unchanged.
- If `_skillTurnExecutor` throws (network error, 4xx/5xx from API), the answer is still recorded, `modelResponses[i]` is set to `null`, and the redirect proceeds normally. The next question page renders without a model response for that turn — graceful degradation, not an error page.
- The stub default for `_skillTurnExecutor` MUST throw (`'Adapter not wired: skillTurnExecutor'`) per D37/ADR-009.
- The Copilot chat completions endpoint requires a `User-Agent` header and `Authorization: Bearer <token>`. The system prompt is the SKILL.md content. Each prior Q&A pair becomes an alternating `user`/`assistant` message pair in the messages array. The current answer is the final `user` message.
- `max_tokens` is capped at 300 for turn responses to keep latency and cost bounded. The model is `claude-sonnet-4-6` (or the value of `process.env.WUCE_TURN_MODEL || 'claude-sonnet-4-6'`).
- ADR-018: Playwright E2E tests are excluded from `npm test`. Per-answer API calls are NOT made in E2E tests — the Playwright spec stubs `_skillTurnExecutor` via `WIRE_SKILL_ADAPTERS=true` with an in-process fake.

## Dependencies

- **Upstream:** wuce.23 (skill launcher HTML), wuce.24 (guided question form — `handlePostAnswerHtml`, `_sessionStore`, `htmlRecordAnswer`), wuce.25 (session commit — the model responses are included in the artefact preview)
- **Downstream:** None at this time

## Acceptance Criteria

**AC1:** Given an operator submits an answer to a skill question, When `handlePostAnswerHtml` processes the answer, Then `_skillTurnExecutor` is called with `(skillContent, priorQA, currentAnswer, token)` and the returned model response string is appended to `session.modelResponses` before the 303 redirect is issued.

**AC2:** Given `_skillTurnExecutor` throws a network or API error, When `handlePostAnswerHtml` processes the answer, Then the answer is still recorded in `session.answers`, `session.modelResponses[i]` is set to `null`, and the 303 redirect is issued to the next URL — no error page is shown.

**AC3:** Given the operator is on question N (N > 1), When `handleGetQuestionHtml` renders the page, Then the model response from the previous answer (index N-2) is rendered as an HTML block above the prior Q&A transcript and above the current question form.

**AC4:** Given the operator is on question 1 (no prior model response exists), When `handleGetQuestionHtml` renders the page, Then no model-response block is rendered — the page shows only the question form, with no empty placeholder.

**AC5:** Given `_skillTurnExecutor` is not wired (default stub), When the server starts outside of test mode, Then calling the adapter throws `Error('Adapter not wired: skillTurnExecutor. Call setSkillTurnExecutor() with a real implementation before use.')` — the server must wire the real implementation in the production block of `server.js`.

**AC6:** Given the production wiring block runs (`NODE_ENV !== 'test' || WIRE_SKILL_ADAPTERS === 'true'`), When `setSkillTurnExecutor` is called, Then the real implementation calls `POST https://api.githubcopilot.com/chat/completions` with the correct `Authorization: Bearer <token>` header, `User-Agent` header, system prompt (SKILL.md content), conversation history as alternating user/assistant messages, and `max_tokens: 300` (or `WUCE_TURN_MODEL_MAX_TOKENS` env override).

**AC7:** Given the artefact preview is built (`htmlGetPreview`), When the preview content is assembled, Then each Q&A pair in the artefact includes the model response (if non-null) rendered under the answer, so the committed artefact captures the full guided conversation.

## Out of Scope

- Streaming responses (SSE/chunked transfer) — the 303 redirect issues after the full response is received; a loading state is not required for MVP
- Displaying a typing indicator or spinner on the answer submit — pure server-side redirect flow
- Storing model responses persistently (database, file) — in-memory `_sessionStore` only, consistent with wuce.24/25
- Modifying the batch `skill-executor` CLI path — this story only affects the HTML form flow
- Token cost tracking or reporting — out of scope
- Changing the `max_tokens` cap per-skill (dynamic configuration) — fixed at 300 or env var for MVP

## NFRs

- **Security:** The GitHub access token (`req.session.accessToken`) MUST NOT be logged, included in error messages surfaced to the browser, or written to any persistent store. The `_skillTurnExecutor` implementation must use it only as a Bearer token header value.
- **Security:** The model response content is treated as untrusted input and must be HTML-escaped or rendered via a safe markdown-to-HTML path before injection into the page.
- **Performance:** The Copilot API call must complete within 30 seconds; the implementation sets a request timeout of 30000ms. If the timeout fires, the error path (AC2) applies.
- **Resilience:** AC2 graceful degradation is the only acceptable failure mode — no unhandled promise rejections, no 500 responses caused by a failed model call.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
