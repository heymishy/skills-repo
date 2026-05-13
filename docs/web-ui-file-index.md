# Web UI — Source File Index (Raw GitHub URLs)

This index lists all source files for the skills pipeline web UI, with raw GitHub URLs for repositories that cannot perform `git clone` or `git fetch` operations.

**Base URL pattern:** `https://raw.githubusercontent.com/heymishy/skills-repo/master/<path>`

Any HTTP client (browser `fetch`, `curl`, `wget`, etc.) can read these files directly without Git access:

```js
const src = await fetch('https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/server.js').then(r => r.text());
```

---

## Entry point

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/server.js` | HTTP server entry point — wires all routes, middleware, adapters | [server.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/server.js) |

---

## Routes

All route handlers — each exports one or more `handle*` functions called by `server.js`.

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/routes/skills.js` | Chat session turns, skill execution, SSE streaming (`handlePostTurnStreamHtml`) | [skills.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/skills.js) |
| `src/web-ui/routes/auth.js` | OAuth sign-in, callback, logout, authGuard middleware | [auth.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/auth.js) |
| `src/web-ui/routes/artefact.js` | Artefact fetching and rendering | [artefact.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/artefact.js) |
| `src/web-ui/routes/dashboard.js` | Dashboard page | [dashboard.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/dashboard.js) |
| `src/web-ui/routes/features.js` | Feature list page | [features.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/features.js) |
| `src/web-ui/routes/execute.js` | Skill execution (non-streaming) | [execute.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/execute.js) |
| `src/web-ui/routes/journey.js` | Journey / session flow routes | [journey.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/journey.js) |
| `src/web-ui/routes/sign-off.js` | DoR sign-off write routes | [sign-off.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/sign-off.js) |
| `src/web-ui/routes/annotation.js` | PR annotation routes | [annotation.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/annotation.js) |
| `src/web-ui/routes/status.js` | Pipeline status routes | [status.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/status.js) |
| `src/web-ui/routes/health.js` | Health check endpoint | [health.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/routes/health.js) |

---

## Views

HTML page renderers — return full HTML strings with embedded CSS and client-side JS.

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/views/chat-view.js` | Chat interface — skill session turns, thinking dots, draft panel | [chat-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/chat-view.js) |
| `src/web-ui/views/dashboard-view.js` | Dashboard page HTML | [dashboard-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/dashboard-view.js) |
| `src/web-ui/views/features-view.js` | Feature list page HTML | [features-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/features-view.js) |
| `src/web-ui/views/artefact-view.js` | Artefact renderer page HTML | [artefact-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/artefact-view.js) |
| `src/web-ui/views/actions-view.js` | Actions panel HTML | [actions-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/actions-view.js) |
| `src/web-ui/views/commit-view.js` | Artefact commit confirmation page | [commit-view.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/commit-view.js) |
| `src/web-ui/views/components.js` | Shared HTML components (nav, layout, etc.) | [components.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/views/components.js) |

---

## Auth

OAuth App implementation.

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/auth/oauth-adapter.js` | GitHub OAuth flow — state generation, redirect URL, code exchange, user identity, token storage | [oauth-adapter.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/auth/oauth-adapter.js) |

---

## Middleware

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/middleware/session.js` | In-memory session store, HttpOnly cookie handling, authGuard | [session.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/middleware/session.js) |
| `src/web-ui/middleware/rate-limiter.js` | Request rate limiting middleware | [rate-limiter.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/middleware/rate-limiter.js) |

---

## Adapters

Injectable adapters — each wraps an external dependency; defaults throw to prevent silent misconfiguration.

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/adapters/skills.js` | Skill list, session creation, commit session adapters | [skills.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/skills.js) |
| `src/web-ui/adapters/artefact-fetcher.js` | GitHub Contents API artefact fetch adapter | [artefact-fetcher.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/artefact-fetcher.js) |
| `src/web-ui/adapters/artefact-list.js` | Artefact directory listing adapter | [artefact-list.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/artefact-list.js) |
| `src/web-ui/adapters/feature-list.js` | Feature list from pipeline-state.json adapter | [feature-list.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/feature-list.js) |
| `src/web-ui/adapters/pipeline-status.js` | Pipeline status fetch adapter | [pipeline-status.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/pipeline-status.js) |
| `src/web-ui/adapters/annotation-writer.js` | PR annotation write adapter (GitHub API) | [annotation-writer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/annotation-writer.js) |
| `src/web-ui/adapters/sign-off-writer.js` | DoR sign-off write adapter (GitHub API) | [sign-off-writer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/sign-off-writer.js) |
| `src/web-ui/adapters/action-queue.js` | Action queue (GitHub commit queue) adapter | [action-queue.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/action-queue.js) |
| `src/web-ui/adapters/pipeline-state-writer.js` | Pipeline-state.json write adapter (GitHub Contents API) | [pipeline-state-writer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/pipeline-state-writer.js) |
| `src/web-ui/adapters/session-store.js` | Session store adapter — injectable wrapper around session persistence | [session-store.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/adapters/session-store.js) |

---

## Artefacts

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/artefacts/artefact-adapter.js` | GitHub Contents API adapter with GHE support | [artefact-adapter.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/artefacts/artefact-adapter.js) |

---

## Configuration

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/config/validate-env.js` | Startup env var validation — throws listing all missing vars | [validate-env.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/config/validate-env.js) |
| `src/web-ui/config/repo-list.js` | Repository list configuration | [repo-list.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/config/repo-list.js) |

---

## Modules (web-ui scoped)

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/modules/journey-store.js` | In-memory journey/flow session store | [journey-store.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/modules/journey-store.js) |
| `src/web-ui/modules/tool-executor.js` | Tool call executor — processes model tool-call responses in skill sessions | [tool-executor.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/modules/tool-executor.js) |

---

## Utilities

| File | Purpose | Raw URL |
|---|---|---|
| `src/web-ui/utils/html-shell.js` | HTML page shell template | [html-shell.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/html-shell.js) |
| `src/web-ui/utils/markdown-renderer.js` | Markdown-to-HTML renderer (no external deps) | [markdown-renderer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/markdown-renderer.js) |
| `src/web-ui/utils/annotation-renderer.js` | PR annotation HTML rendering | [annotation-renderer.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/annotation-renderer.js) |
| `src/web-ui/utils/annotation-utils.js` | Annotation helper utilities | [annotation-utils.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/annotation-utils.js) |
| `src/web-ui/utils/artefact-labels.js` | Human-readable artefact type labels | [artefact-labels.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/artefact-labels.js) |
| `src/web-ui/utils/plain-language-labels.js` | Plain-language pipeline state labels | [plain-language-labels.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/plain-language-labels.js) |
| `src/web-ui/utils/status-board.js` | Pipeline status board rendering | [status-board.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/status-board.js) |
| `src/web-ui/utils/status-export.js` | Status export utilities | [status-export.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/web-ui/utils/status-export.js) |

---

## Shared modules (src/modules)

These modules are used by the web UI and potentially other consumers.

| File | Purpose | Raw URL |
|---|---|---|
| `src/modules/skill-turn-executor.js` | Copilot / Anthropic API caller — streaming and non-streaming; `SKILL_EXECUTOR_PROVIDER` routing | [skill-turn-executor.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/modules/skill-turn-executor.js) |
| `src/modules/skill-executor.js` | CLI-mode skill executor (non-web) | [skill-executor.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/modules/skill-executor.js) |
| `src/modules/session-manager.js` | Session management module | [session-manager.js](https://raw.githubusercontent.com/heymishy/skills-repo/master/src/modules/session-manager.js) |

---

## Environment reference file

| File | Purpose | Raw URL |
|---|---|---|
| `.env.example` | Environment variable template with comments | [.env.example](https://raw.githubusercontent.com/heymishy/skills-repo/master/.env.example) |

---

## Notes for consuming repos

- All URLs point to the `master` branch. Replace `master` with a specific commit SHA for a pinned version.
- Files are plain CommonJS modules (`require`/`module.exports`). They use Node.js built-in modules only (`https`, `http`, `crypto`, `url`, `fs`, `path`).
- The server entry point (`server.js`) requires all other files via relative paths — if you are assembling a local copy, preserve the directory structure exactly.
- See [docs/web-ui-copilot-api-guide.md](https://raw.githubusercontent.com/heymishy/skills-repo/master/docs/web-ui-copilot-api-guide.md) for full setup and configuration documentation.
