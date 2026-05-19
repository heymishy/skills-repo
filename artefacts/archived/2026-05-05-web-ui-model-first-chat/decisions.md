# Decisions — mfc.1: Web UI Model-First Chat Architecture

Feature slug: `2026-05-05-web-ui-model-first-chat`
Created: 2026-05-06 (retrospective — decisions made during delivery 2026-05-05/06)

---

## ADR-M1: Chat-over-form as the primary skill session interface

**Date:** 2026-05-05
**Context:** The existing web UI skill session flow used a scrape-first / question-extraction pattern: `skill-content-adapter.js` extracted questions from SKILL.md, rendered a static guided form, and submitted answers batch-at-a-time. This required per-skill extraction logic and produced rigid, form-shaped sessions that didn't match how the skills pipeline actually works (conversational, context-sensitive).
**Decision:** Replace the question-extraction form with a model-driven, open-ended chat interface. The model receives the full system prompt (copilot-instructions + SKILL.md + product context) and drives the session through natural conversation. The client renders a streaming chat-bubble UI.
**Rationale:** Eliminates per-skill extraction maintenance; matches the conversational nature of the pipeline skills; enables the model to adapt its questioning strategy based on operator answers; compatible with the system prompt architecture already used in the CLI/agent path. Backward compatibility preserved via exported no-op `setNextQuestionExecutorAdapter` / `setSectionDraftExecutorAdapter`.

---

## ADR-M2: System prompt assembly order and composition

**Date:** 2026-05-05
**Context:** The system prompt injected into each skill session needed to carry four categories of context: the platform-wide Copilot instructions (coding standards, pipeline conventions), the skill-specific SKILL.md content, the product-specific context files (`mission.md`, `roadmap.md`, `tech-stack.md`, `constraints.md`), and the web UI interaction protocol (how the model should behave in a browser-based session).
**Decision:** Assemble in this fixed order: (1) `copilot-instructions.md`, (2) skill SKILL.md, (3) product context files, (4) `--- WEB UI PROTOCOL ---` section. The `buildSystemPrompt(skillName, sessionPath, repoRoot)` function reads each file from the repo root at session creation time. Missing product files are silently skipped (graceful degradation — not all repos have all four).
**Rationale:** Ordering ensures the model sees platform-wide rules before skill-specific rules, with product context grounding both. The WEB UI PROTOCOL section last ensures it can override any conflicting interaction guidance from SKILL.md. Reading files at session creation time means a session always reflects the committed state of the repo at the point the session starts.

---

## ADR-M3: Artefact signal protocol — marker-based, skill-agnostic

**Date:** 2026-05-06
**Context:** The model needs to signal when a skill session has produced its primary artefact (e.g. a discovery.md, story.md, test-plan.md). The web UI needs to detect this, extract the artefact content, and present save/commit options. Alternative approaches considered: (a) structured JSON response envelope wrapping every turn; (b) a separate `/artefact` API endpoint the model calls; (c) end-of-session flag set by the frontend after N turns.
**Decision:** Use inline text markers in the model's response stream: `---SLUG---` (artefact file path), `---ARTEFACT-START---` (begin content), `---ARTEFACT-END---` (end content). The server-side parser in `htmlSubmitTurn` scans every model response for these markers. On detection: extract content, set `session.done = true`, return `{done: true}` to the client. Subsequent POST turns to a done session return HTTP 409.
**Rationale:** Skill-agnostic — no per-skill server code needed. The marker contract is documented in `web-ui-patterns.md` and injected into every session's system prompt via the WEB UI PROTOCOL section. Inline markers survive streaming without requiring a structured response envelope. The 409 guard prevents accidental multi-submission of the same artefact.
