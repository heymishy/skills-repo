# Web UI Skill Session — As-Built Reference

**Date:** 2026-05-06
**Reflects:** commits `77de594` (Copilot API token), `0aff1c8` (mfc.2 UX), `57c7f44` (model label), `50aaccc` (mfc.3 streaming)
**Purpose:** Enterprise port reference. The pipeline artefacts in `2026-05-02-web-ui-copilot-execution-layer` (wuce) and `2026-05-05-web-ui-dynamic-skill-questions` (dsq) describe an **earlier architecture** that has been superseded. Use this document, not those artefacts, when implementing the skill session feature in an enterprise deployment.

---

## What Changed and Why

The `wuce` artefacts described a form-based Q&A flow: questions were extracted mechanically from `SKILL.md` headings, the model was called separately after each answer to generate a "coaching insight", and the artefact was assembled from raw answers pasted under sections scraped from `##` headings. This produced three concrete failures: the model had no access to the actual skill instructions, the wrong headings were used for sections, and the resulting artefact did not match the output template.

The `dsq` artefacts extended this broken architecture with dynamic question generation (dsq.1), section confirmation loops (dsq.2), a post-session clarify gate (dsq.3), and section artefact assembly (dsq.4). These were implemented but verified incorrect behaviour.

The `mfc` artefacts (`2026-05-05-web-ui-model-first-chat`) replaced both with a model-first architecture: the model receives the full `SKILL.md` as its system prompt and drives the entire conversation, asking questions and producing the artefact itself. This is the implemented architecture. The wuce/dsq artefacts are pipeline history — they are not targets for implementation.

---

## Runtime Constraints

- **Node.js CommonJS only** — `require()`, no ES modules, no TypeScript
- **No Express** — `http.createServer()` routing only; URL matching is done with `pathname.match(/pattern/)` in the server's `router()` function
- **Zero new npm dependencies** — `https`, `fs`, `path`, `os`, `crypto` built-ins only
- **No persistence** — session state lives in a `Map` for the lifetime of the Node process; a server restart clears all active sessions
- **Injectable adapters (D37/ADR-009)** — every external dependency (model call, commit API, list skills) is wired via a setter function; default stubs throw (never return null/undefined)
- **`req.session.accessToken` is canonical** — the GitHub OAuth token is always at this key; never `req.session.token`

---

## System Overview

```
Browser
  │
  │  GET /skills
  │  POST /api/skills/:name/sessions          → 303 /skills/:name/sessions/:id/chat
  │  GET  /skills/:name/sessions/:id/chat     ← initial model turn fired server-side
  │  POST /api/skills/:name/sessions/:id/turn-stream  (SSE)
  │  GET  /skills/:name/sessions/:id/commit-preview
  │  POST /api/skills/:name/sessions/:id/commit
  │  GET  /skills/:name/sessions/:id/result
  │
  ▼
src/web-ui/server.js        — raw HTTP server, URL dispatch
  │
  ├── routes/skills.js      — all skill session handlers + session state (_sessionStore Map)
  │     │
  │     ├── buildSystemPrompt()   — assembles copilot-instructions.md + SKILL.md + product context + protocol
  │     ├── registerHtmlSession() — creates session entry in _sessionStore
  │     ├── htmlSubmitTurn()      — non-streaming turn processor (used by /turn endpoint)
  │     └── handlePostTurnStreamHtml() — SSE streaming turn processor
  │
  ├── modules/skill-turn-executor.js
  │     ├── skillTurnExecutor(systemPrompt, history, input, token) → Promise<string>
  │     ├── skillTurnExecutorStream(systemPrompt, history, input, token, onChunk) → Promise<string>
  │     └── getActiveModel() → string  (reads WUCE_TURN_MODEL or defaults)
  │
  └── GitHub Copilot Chat Completions API
        POST https://api.githubcopilot.com/chat/completions
        Authorization: Bearer <GITHUB_TOKEN>
        Copilot-Integration-Id: vscode-chat
        Model: claude-sonnet-4.6 (default) or WUCE_TURN_MODEL env var
```

---

## Session Lifecycle

### 1. Create session

`POST /api/skills/:name/sessions` (HTML form submission — `Content-Type: application/x-www-form-urlencoded`)

Handler: `handlePostSkillSessionHtml`

1. Authenticates via `req.session.accessToken` (redirects to `/auth/github` if absent)
2. Calls `_createSession(skillName, token)` — wired in production to `sessionManager.createSession()` which creates a directory at `<WUCE_SESSION_BASE_DIR>/<sha256(userId)>/<uuid>/`
3. Calls `registerHtmlSession(sessionId, sessionPath, skillName)`:
   - Calls `buildSystemPrompt(skillName, sessionPath)` (see below)
   - Stores in `_sessionStore` Map: `{ skillName, sessionPath, systemPrompt, turns: [], artefactContent: null, artefactPath: null, done: false }`
4. Returns `303 /skills/:name/sessions/:id/chat`

### 2. Render initial chat page

`GET /skills/:name/sessions/:id/chat`

Handler: `handleGetChatHtml`

1. Reads session from `_sessionStore`
2. If `session.turns` is empty (first load), fires an initial model turn synchronously:
   ```
   input: "Begin the session. Greet the operator with one short welcoming sentence
           and ask your single opening question only. Do not list multiple questions."
   history: []
   ```
3. Appends the model's response as `{ role: 'assistant', content: ... }` to `session.turns`
4. Renders full chat page with `_renderChatPage()` (server-rendered split pane)
5. The rendered page includes inline JavaScript for SSE streaming (no page reloads after this point)

### 3. User submits an answer (SSE streaming)

The client-side script intercepts form submission and POSTs to the streaming endpoint instead.

`POST /api/skills/:name/sessions/:id/turn-stream`

Handler: `handlePostTurnStreamHtml`

1. Reads `answer` from request JSON body
2. Sanitises answer via `sanitiseAnswer(rawAnswer)` (strips control chars, trims to 1000 chars)
3. Takes a snapshot of `session.turns` as history
4. Appends `{ role: 'user', content: sanitisedAnswer }` to `session.turns`
5. Sets response headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`
6. Calls `_skillTurnExecutorStream(systemPrompt, historySnapshot, answer, token, onChunk)`
   - `onChunk(text)` fires for each streaming token → server writes `data: {"chunk":"..."}\n\n`
7. After full response received: checks for `---ARTEFACT-START---` / `---ARTEFACT-END---` markers
8. If artefact found: extracts content, derives path from `---SLUG---` line, sets `session.done = true`
9. Appends `{ role: 'assistant', content: fullText }` to `session.turns`
10. Sends final SSE event: `data: {"done": bool, "artefactContent": "..." (if done)}\n\n`
11. Closes response

### 4. Client-side SSE pump

The inline script in the rendered page:

1. On form submit: appends user bubble to thread, clears textarea, POSTs to `STREAM_URL` (turn + `-stream`)
2. Shows animated thinking dots (`<span class="sw-thinking">`) while waiting
3. On first chunk: removes thinking dots, appends empty assistant bubble
4. Per chunk: updates bubble innerHTML using `lightMd()` (minimal `**bold**`, `*italic*`, `` `code` `` renderer)
5. Calls `scrollToBottom()` after each update (keeps latest text visible)
6. On `evt.artefactContent`: calls `updateDraftPanel(content)` — replaces right-pane content with artefact in monospace pre-wrap
7. On `evt.done === true`: calls `showCommitLink()` — injects "Review & save artefact →" button above the textarea
8. On `evt.done === false` and no `?` in the response: fires `sendTurn("continue")` after 800ms (auto-advance when model is narrating, not asking)
9. On error: shows error message in bubble, re-enables submit

### 5. Commit flow

`GET /skills/:name/sessions/:id/commit-preview`

Handler: `handleGetCommitPreviewHtml`

Calls `_getCommitPreview(skillName, sessionId, token)` (wired to `htmlGetPreview()`). Returns preview with `artefactPath` and `artefactContent` from the session. Renders `renderCommitPreview(data)` inside `renderShell()`.

`POST /api/skills/:name/sessions/:id/commit`

Handler: `handlePostCommitHtml`

Calls `_commitSession(skillName, sessionId, token)` (wired to `htmlCommitSession()`). On success: `303 /skills/:name/sessions/:id/result`. On 409 double-commit: renders `renderAlreadyCommitted()`.

`GET /skills/:name/sessions/:id/result`

Handler: `handleGetResultHtml`

Renders `renderCommitResult(data)` with artefact path, PR URL, and next skill suggestion.

---

## System Prompt Assembly (`buildSystemPrompt`)

File: `src/web-ui/routes/skills.js` → function `buildSystemPrompt(skillName, sessionPath, repoRoot?)`

Concatenates the following in order, separated by `\n\n`:

| Section | Source file | Prefix |
|---------|-------------|--------|
| 1. Pipeline instructions | `.github/copilot-instructions.md` | (none) |
| 2. Skill instructions | `.github/skills/:skillName/SKILL.md` | `--- SKILL: :skillName ---` |
| 3. Product mission | `product/mission.md` | `--- PRODUCT MISSION ---` |
| 4. Tech stack | `product/tech-stack.md` | `--- TECH STACK ---` |
| 5. Constraints | `product/constraints.md` | `--- CONSTRAINTS ---` |
| 6. Roadmap | `product/roadmap.md` | `--- PRODUCT ROADMAP ---` |
| 7. Reference materials | `artefacts/[feature-slug]/reference/*.md` | `--- REFERENCE: filename ---` |
| 8. Web UI protocol | hardcoded string (see below) | `--- WEB UI PROTOCOL ---` |

All sections are conditionally included — missing files are silently skipped. Section 7 is only appended if the session path resolves to a feature directory that has a `reference/` subdirectory.

**The Web UI Protocol** (hardcoded in `buildSystemPrompt`) gives the model:
- Instructions to ask one question at a time
- Rich input handling rules (scan all prior turns before choosing next question; never re-ask covered topics)
- Instruction to output the artefact using the signal markers when ready
- Instruction not to send a holding message — the artefact must appear in the same response as the decision to produce it

---

## Artefact Signal Protocol

The model signals artefact completion by including these exact markers in its response:

```
---ARTEFACT-START---
[full artefact content in markdown]
---ARTEFACT-END---
---SLUG---
YYYY-MM-DD-descriptive-feature-slug
```

The server uses these regexes:
```js
var artefactMatch = response.match(/---ARTEFACT-START---\s*([\s\S]+?)\s*---ARTEFACT-END---/);
var slugMatch     = response.match(/---SLUG---\s*\n?([\w-]+)/);
```

If both match: `session.artefactContent = artefactMatch[1].trim()`, `session.artefactPath = 'artefacts/' + slug + '/' + session.skillName + '.md'`, `session.done = true`.

If the slug is absent or fails to match: the path defaults to `artefacts/YYYY-MM-DD-:skillName/:skillName.md`.

---

## Model Provider (`src/modules/skill-turn-executor.js`)

### Provider selection

Controlled by `SKILL_EXECUTOR_PROVIDER` environment variable:
- `copilot` (default) — GitHub Copilot Chat Completions API
- `anthropic` — Anthropic Messages API (BYOK via `ANTHROPIC_API_KEY`)

### Copilot API call

```
POST https://api.githubcopilot.com/chat/completions
Headers:
  Authorization: Bearer <process.env.GITHUB_TOKEN || token>
  Copilot-Integration-Id: vscode-chat
  Content-Type: application/json
Body:
  {
    "model": "<WUCE_TURN_MODEL or 'gpt-4o'>",
    "max_tokens": 4096,
    "messages": [
      { "role": "system", "content": "<systemPrompt>" },
      ...history turns...,
      { "role": "user", "content": "<currentInput>" }
    ]
  }
```

Token priority: `process.env.GITHUB_TOKEN` takes precedence over the OAuth token passed at call time. This matters because the Copilot API requires a token with the `copilot` scope (a GitHub App installation token or a PAT with copilot scope), not a standard user OAuth token.

**For enterprise deployments**: the `GITHUB_TOKEN` environment variable must be a token with Copilot API access. A user's standard OAuth token may not have this scope. Consider a service account token or a GitHub App installation token wired through `GITHUB_TOKEN`.

### Streaming call

Same endpoint with `stream: true` added to the body. Response is an SSE stream (`text/event-stream`). Each data line is a standard OpenAI-format SSE chunk:

```json
data: {"choices":[{"delta":{"content":"chunk text"}}]}
```

The executor accumulates the full text and calls `onChunk(content)` per delta. Resolves with the full accumulated text.

### Model default

```js
const DEFAULT_MODEL           = 'gpt-4o';          // copilot provider
const DEFAULT_ANTHROPIC_MODEL = 'claude-sonnet-4.6'; // anthropic provider
```

The model ID for Claude via the Copilot API is `claude-sonnet-4.6` (period separator — not hyphen). This is not the same as the Anthropic API model ID.

Override with `WUCE_TURN_MODEL` environment variable.

### Exports

```js
module.exports = {
  skillTurnExecutor,        // (systemPrompt, history, currentInput, token) → Promise<string>
  skillTurnExecutorStream,  // (systemPrompt, history, currentInput, token, onChunk) → Promise<string>
  getActiveModel            // () → string
};
```

---

## Session State Schema

One entry per active session in `_sessionStore` (a `Map<string, object>`):

```js
{
  skillName:       string,          // e.g. 'discovery'
  sessionPath:     string,          // absolute path from sessionManager.createSession()
  systemPrompt:    string,          // assembled by buildSystemPrompt()
  turns:           Array<{role: 'user'|'assistant', content: string}>,
  artefactContent: string|null,     // set when model signals completion
  artefactPath:    string|null,     // e.g. 'artefacts/2026-05-06-my-feature/discovery.md'
  done:            boolean          // true when artefact extracted
}
```

Session entries are keyed by UUID. There is no disk persistence — a server restart loses all sessions.

---

## Route Map

| Method | Path | Handler | Auth required |
|--------|------|---------|---------------|
| GET | `/skills` | `handleGetSkillsHtml` | Yes → redirect `/auth/github` |
| POST | `/api/skills/:name/sessions` | `handlePostSkillSessionHtml` (HTML form) or `handlePostSession` (JSON) | Yes |
| GET | `/skills/:name/sessions/:id/chat` | `handleGetChatHtml` | Yes |
| POST | `/api/skills/:name/sessions/:id/turn` | `handlePostTurnHtml` | Yes |
| POST | `/api/skills/:name/sessions/:id/turn-stream` | `handlePostTurnStreamHtml` | Yes |
| GET | `/skills/:name/sessions/:id/commit-preview` | `handleGetCommitPreviewHtml` | Yes |
| POST | `/api/skills/:name/sessions/:id/commit` | `handlePostCommitHtml` (HTML form) or `handleCommitArtefact` (JSON) | Yes |
| GET | `/skills/:name/sessions/:id/result` | `handleGetResultHtml` | Yes |
| GET | `/skills/:name/sessions/:id/next` | inline redirect handler | Yes | (redirects → `/chat`) |
| GET | `/api/skills` | `handleGetSkills` | Yes (+ Copilot licence check) |
| GET | `/api/skills/:name/sessions/:id/state` | `handleGetSessionState` | Yes |

---

## Key File Map

| File | Role |
|------|------|
| `src/web-ui/server.js` | HTTP server, URL dispatch, adapter wiring |
| `src/web-ui/routes/skills.js` | All skill route handlers, session state, `buildSystemPrompt`, `registerHtmlSession`, `htmlSubmitTurn` |
| `src/web-ui/views/chat-view.js` | Server-rendered split-pane chat HTML (`renderChat(data)`) |
| `src/web-ui/views/commit-view.js` | Commit preview, commit result, already-committed pages |
| `src/web-ui/utils/html-shell.js` | `renderShell({title, bodyContent, user, active})`, `escHtml(str)`, sidebar nav |
| `src/web-ui/views/components.js` | `pill(colour, label)`, `btn(variant, label)` |
| `src/modules/skill-turn-executor.js` | Copilot/Anthropic API calls, streaming |
| `src/modules/session-manager.js` | `createSession(userId)` → creates temp dir, returns absolute path |
| `src/web-ui/adapters/skills.js` | Adapter registry (setter/getter pattern) — bridges server.js wiring to route handlers |
| `src/web-ui/middleware/session.js` | Cookie-based session middleware, `seedTestSession()` for E2E |
| `src/web-ui/routes/auth.js` | GitHub OAuth flow (authorize, callback, logout) |
| `src/adapters/skill-discovery.js` | `listAvailableSkills(repoRoot)` — reads `.github/skills/` directory |

---

## Injectable Adapter Pattern (D37 / ADR-009)

Every external dependency is injected through a setter. Production wiring happens in `server.js`. Default stubs throw — they never return null or empty.

Example pattern (all adapters follow this):

```js
// In routes/skills.js — default stub throws:
let _skillTurnExecutorStream = function defaultSkillTurnExecutorStream() {
  return Promise.reject(new Error(
    'Adapter not wired: skillTurnExecutorStream. Call setSkillTurnExecutorStreamAdapter() before use.'
  ));
};
function setSkillTurnExecutorStreamAdapter(fn) { _skillTurnExecutorStream = fn; }

// In server.js — production wiring:
const { skillTurnExecutorStream } = require('../modules/skill-turn-executor');
const { setSkillTurnExecutorStreamAdapter } = require('./routes/skills');
setSkillTurnExecutorStreamAdapter(skillTurnExecutorStream);

// In tests — mock wiring:
setSkillTurnExecutorStreamAdapter(async function(sys, hist, input, tok, onChunk) {
  onChunk('mock chunk');
  return 'mock chunk';
});
```

Adapters to wire in production:
- `setSkillTurnExecutorAdapter(fn)` — non-streaming model call
- `setSkillTurnExecutorStreamAdapter(fn)` — streaming model call
- `skillsAdapter.setListSkills(fn)` — list available skills
- `skillsAdapter.setCreateSession(fn)` — create session directory
- `skillsAdapter.setGetNextQuestion(fn)` — backward compat (maps to `htmlGetNextQuestion`)
- `skillsAdapter.setGetCommitPreview(fn)` — maps to `htmlGetPreview`
- `skillsAdapter.setCommitSession(fn)` — maps to `htmlCommitSession`

---

## Environment Variables

| Variable | Required | Default | Purpose |
|----------|----------|---------|---------|
| `GITHUB_TOKEN` | Yes (Copilot API) | — | Token with Copilot API scope. Takes priority over OAuth token for model calls. |
| `WUCE_TURN_MODEL` | No | `claude-sonnet-4.6` (anthropic) / `gpt-4o` (copilot) | Model ID override |
| `SKILL_EXECUTOR_PROVIDER` | No | `copilot` | `copilot` or `anthropic` |
| `ANTHROPIC_API_KEY` | Only if BYOK | — | Anthropic API key (anthropic provider) |
| `PORT` | No | `3000` | HTTP server port |
| `COPILOT_REPO_PATH` | No | two levels up from `server.js` | Repo root for skill/product file loading |
| `WUCE_SESSION_BASE_DIR` | No | `os.tmpdir()/copilot-sessions` | Session directory base |
| `GITHUB_CLIENT_ID` | Yes (OAuth) | — | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | Yes (OAuth) | — | GitHub OAuth app client secret |
| `SESSION_SECRET` | Yes (sessions) | — | Cookie signing secret (min 32 chars) |
| `NODE_ENV` | No | — | Set to `test` to skip adapter wiring and enable E2E test fixtures |

---

## What NOT to Implement (Legacy Code Still in Codebase)

The following code is present in `routes/skills.js` but is **not part of the active flow** and should not be ported to an enterprise implementation:

| Symbol | Origin | Status |
|--------|--------|--------|
| `htmlGetNextQuestion()` | wuce.24 / dsq.1 | Present, not called by primary flow. Session entries created by `registerHtmlSession` have no `questions` array — this function returns null immediately for them. |
| `htmlRecordAnswer()` | wuce.24 / dsq.1–4 | Present. Contains dsq.1–4 logic (dynamic questions, section drafts, section confirmation loop). Not called in primary flow — `handlePostAnswerHtml` only fires from the `/answer` route, which is only reached from the old form-based `/next` page. `/next` now redirects to `/chat`. |
| `handleGetQuestionHtml()` | wuce.24 | Present. Renders the old single-question form. Never reached in normal flow (redirected). |
| `handlePostAnswerHtml()` | wuce.24 | Present. Accepts form answers and calls `htmlRecordAnswer`. |
| `htmlGetCompletePage()` | dsq.3 | Present. Renders the post-session /clarify gate page at `/skills/:name/sessions/:id/complete`. |
| `_nextQuestionExecutor` | dsq.1 | Present as a no-op stub. Not called. |
| `_sectionDraftExecutor` | dsq.2 | Present as a no-op stub. Not called. |

**For a clean enterprise port, implement only the model-first chat flow (mfc.1/2/3) and omit the form-based wuce.24 / dsq.1–4 handlers.**

---

## UI Layout

The chat page is a server-rendered split-pane layout:

```
┌─────────────────────────────────┬─────────────────────────────────┐
│ Skill name        [model badge] │ Live draft · feature-slug       │
│                                 │ Updates as you answer           │
├─────────────────────────────────┼─────────────────────────────────┤
│                                 │                                 │
│  ✦  [Skill opening question]    │  Draft                          │
│                                 │  ─────────────────              │
│  M  [User answer]               │  Skill session — feature        │
│                                 │                                 │
│  ✦  [Next question or          │  [Artefact appears here when     │
│      streaming text with         │   model signals completion]     │
│      animated dots while         │                                 │
│      thinking]                  │                                 │
│                                 │                                 │
├─────────────────────────────────┤                                 │
│  [ textarea         ] [Send →]  │                                 │
│  Press ⌘↵ or Ctrl+↵ to send    │                                 │
└─────────────────────────────────┴─────────────────────────────────┘
```

CSS variables referenced (must be defined in `html-shell.js` design system):
- `--surface`, `--bg`, `--line`, `--line-2`, `--ink`, `--ink-2`, `--muted`, `--muted-2`
- `--accent-soft`, `--accent-ink`, `--amber-soft`, `--amber`
- `--sans`, `--serif`, `--mono`

Thinking dots: `.sw-thinking > .sw-dot` elements with `sw-dot-pulse` keyframe animation (stagger 0s/0.2s/0.4s).

Model label badge: `<span style="font-family:var(--mono);...">claude-sonnet-4.6</span>` in left pane header.

---

## Test Conventions

Test files for the model-first chat architecture:
- `tests/check-mfc1-model-first-chat-session.js` — 25 tests for mfc.1
- `tests/check-mfc2-chat-ux-improvements.js` — 8 tests for mfc.2 UX + model label

Test files for the legacy (wuce/dsq) architecture still exist and still pass — the legacy code is still present. They verify behaviour that is not part of the primary enterprise flow.

All tests import modules directly and call exported functions (no HTTP server needed). Adapters are replaced with synchronous stubs via setter functions before each assertion.

---

## Enterprise Deployment Checklist

- [ ] `GITHUB_TOKEN` — token with Copilot API scope (or valid Anthropic API key + `SKILL_EXECUTOR_PROVIDER=anthropic`)
- [ ] `GITHUB_CLIENT_ID` + `GITHUB_CLIENT_SECRET` — GitHub OAuth App registered with callback URL pointing at `/auth/github/callback`
- [ ] `SESSION_SECRET` — random 32+ char string; rotate on breach
- [ ] `COPILOT_REPO_PATH` — absolute path to the skills repository checkout (so `buildSystemPrompt` can read `.github/skills/`, `product/`, etc.)
- [ ] `product/` files populated — `mission.md`, `tech-stack.md`, `constraints.md`, `roadmap.md` are all read into the system prompt; empty files produce weak model output
- [ ] HTTPS termination upstream — the Node server itself does not do TLS; put it behind a reverse proxy or load balancer
- [ ] Session base directory (`WUCE_SESSION_BASE_DIR`) writable and not under the web root
- [ ] Copilot API token scope — verify the token can successfully call `https://api.githubcopilot.com/chat/completions`; test with `curl -H "Authorization: Bearer <token>" -H "Copilot-Integration-Id: vscode-chat" -d '{"model":"claude-sonnet-4.6","messages":[{"role":"user","content":"ping"}]}' https://api.githubcopilot.com/chat/completions`
