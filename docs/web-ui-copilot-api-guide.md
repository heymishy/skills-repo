# Web UI — Copilot API Integration Guide

**Last updated: 2026-05-07**

This document covers how the skills pipeline web UI integrates with the GitHub Copilot Chat Completions API, the licensing and authentication model used, full configuration and deployment steps, and guidance for deploying on GitHub Enterprise Server (GHE) where Claude Sonnet is unavailable.

---

## Table of contents

1. [What this implementation is (and is not)](#1-what-this-implementation-is-and-is-not)
2. [Licensing requirements](#2-licensing-requirements)
3. [Authentication model — OAuth App](#3-authentication-model--oauth-app)
4. [How the Copilot API integration works](#4-how-the-copilot-api-integration-works)
5. [Token resolution — why you need GITHUB_TOKEN](#5-token-resolution--why-you-need-github_token)
6. [Streaming architecture (SSE)](#6-streaming-architecture-sse)
7. [Two model providers — copilot vs anthropic](#7-two-model-providers--copilot-vs-anthropic)
8. [Full environment variable reference](#8-full-environment-variable-reference)
9. [Step-by-step setup (github.com)](#9-step-by-step-setup-githubcom)
10. [GitHub Enterprise Server setup](#10-github-enterprise-server-setup)
11. [Troubleshooting common errors](#11-troubleshooting-common-errors)
12. [What was NOT used in this implementation](#12-what-was-not-used-in-this-implementation)

---

## 1. What this implementation is (and is not)

This web UI calls the **GitHub Copilot Chat Completions API** — an OpenAI-compatible HTTP endpoint hosted and managed by GitHub at `api.githubcopilot.com`. It is **not** a direct integration with Anthropic's API. GitHub internally routes requests to the appropriate model (Claude Sonnet 4.6, GPT-4o, etc.) based on the model name in the request body.

The implementation is a plain Node.js `http` module server with zero framework dependencies. All API calls are made server-side using Node's built-in `https` module. No SDK, no npm AI library, no Copilot CLI binary — just HTTP.

---

## 2. Licensing requirements

### github.com

The GitHub user who signs in must hold an active **GitHub Copilot Pro Plus** (or Copilot Business / Copilot Enterprise) subscription. A Copilot Free or Copilot Pro (individual, non-Plus) subscription does **not** include API access to Claude models.

Specifically, access to `claude-sonnet-4.6` via the Copilot Chat Completions API requires the Copilot Pro Plus tier (as of May 2026).

The token used to authenticate API calls must carry the `copilot` scope — see [Section 5](#5-token-resolution--why-you-need-github_token) for why the OAuth session token alone is insufficient.

### GitHub Enterprise Server (GHE)

GHE instances with a GitHub Copilot Enterprise licence can access `gpt-4o` via the same API pattern, but **Claude Sonnet models are not available on GHE** (as of May 2026). This is a GitHub platform restriction, not a configuration issue. See [Section 10](#10-github-enterprise-server-setup) for the GHE-specific model setup.

---

## 3. Authentication model — OAuth App

This implementation uses a **GitHub OAuth App** (registered at `github.com/settings/developers` or the GHE equivalent). It does **not** use:

- **GitHub App** — not used; has different installation/permission model; requires approval from a GitHub org admin
- **Personal Access Token (PAT)** — not used; would be a static secret, not per-user auth
- **GitHub Copilot CLI** — not used; the `gh copilot` binary is not available in many enterprise environments and is not required here
- **Copilot CLI extension** — not used

### OAuth App flow

```
User browser                      Server                         GitHub OAuth
     │                               │                                │
     │  GET /auth/github             │                                │
     │──────────────────────────────>│                                │
     │                               │  302 → github.com/login/oauth/authorize
     │<──────────────────────────────│                                │
     │  Follow redirect              │                                │
     │──────────────────────────────────────────────────────────────>│
     │                               │                                │  User approves
     │<─────────────────────────────────────────────────────────────── code=xxx
     │  GET /auth/github/callback?code=xxx&state=yyy                  │
     │──────────────────────────────>│                                │
     │                               │  POST /login/oauth/access_token
     │                               │──────────────────────────────>│
     │                               │<────────────── access_token=gho_xxx
     │                               │  Store in server-side session  │
     │  302 → /dashboard             │                                │
     │<──────────────────────────────│                                │
```

Key implementation details:

- CSRF state parameter is generated via `crypto.randomBytes(16)` for every `/auth/github` request and validated on callback (`src/web-ui/auth/oauth-adapter.js`).
- The access token is stored in a **server-side in-memory session** only — never in a cookie value, never in the response body. Only the session ID (an opaque 32-byte hex string) is sent to the browser as an `HttpOnly; Secure; SameSite=Strict` cookie.
- The session token field is always `req.session.accessToken`. Never `req.session.token`.
- OAuth scopes requested: `repo,read:user`. Note: this scope combination does **not** include the `copilot` scope — see Section 5.

### OAuth App registration

1. Go to `https://github.com/settings/developers` → "OAuth Apps" → "New OAuth App"
2. Fill in:
   - **Application name**: anything descriptive (e.g. `skills-pipeline-dev`)
   - **Homepage URL**: `http://localhost:3000` (or your deployed URL)
   - **Authorization callback URL**: `http://localhost:3000/auth/github/callback`
3. Click "Register application"
4. Copy **Client ID** → `GITHUB_CLIENT_ID` in your `.env`
5. Click "Generate a new client secret" → copy → `GITHUB_CLIENT_SECRET` in your `.env`

---

## 4. How the Copilot API integration works

File: `src/modules/skill-turn-executor.js`

The core integration makes a standard OpenAI-compatible chat completions request to GitHub's Copilot proxy:

```
POST https://api.githubcopilot.com/chat/completions
Authorization: Bearer <github_token>
User-Agent: skills-repo-web-ui
Copilot-Integration-Id: vscode-chat
Content-Type: application/json

{
  "model": "claude-sonnet-4.6",
  "max_tokens": 4096,
  "messages": [
    { "role": "system", "content": "<SKILL.md content + product context>" },
    { "role": "user",   "content": "Begin the session." },
    { "role": "assistant", "content": "<prior turn response>" },
    { "role": "user",   "content": "<current user input>" }
  ],
  "stream": true
}
```

GitHub's `api.githubcopilot.com` endpoint:
- Validates the Bearer token against the user's Copilot subscription
- Routes the request to the appropriate model backend (Anthropic for Claude, OpenAI for GPT)
- Returns a standard OpenAI-compatible SSE streaming response

The response is parsed as OpenAI SSE format:
```
data: {"choices":[{"delta":{"content":"Hello"}}]}
data: {"choices":[{"delta":{"content":" world"}}]}
data: [DONE]
```

Each `delta.content` token is extracted and forwarded to the browser as a server-sent event.

### Request headers explained

- `Authorization: Bearer <token>` — the GitHub token (see Section 5 for which token)
- `User-Agent: skills-repo-web-ui` — identifies the integration; GitHub may require a user agent for copilot API calls
- `Copilot-Integration-Id: vscode-chat` — tells GitHub Copilot's proxy to treat this as a VS Code-style chat integration; required for the endpoint to accept non-VS-Code clients

---

## 5. Token resolution — why you need GITHUB_TOKEN

**Critical:** The OAuth App access token (stored in `req.session.accessToken`) only carries `repo` and `read:user` scopes. **It does not carry the `copilot` scope** required to call `api.githubcopilot.com`. If only the OAuth token is used, the Copilot API returns HTTP 401.

The code in `skill-turn-executor.js` resolves the token in this order:

```js
const authToken = process.env.GITHUB_TOKEN || token;
```

Where `token` is the OAuth session token passed from the route handler. `GITHUB_TOKEN` (if set) takes priority.

**The `GITHUB_TOKEN` you need is the GitHub CLI auth token**, obtained by:

```bash
# Authenticate gh CLI (once, on the server or locally)
gh auth login
# When prompted, select: GitHub.com, HTTPS, authenticate via browser
# Ensure you select the Copilot scope

# Get the token value
gh auth token
```

The output of `gh auth token` is a `ghu_...` or `gho_...` prefixed token. Set this in your `.env`:

```
GITHUB_TOKEN=ghu_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

This is a **CLI-issued OAuth token** (not a PAT). It is issued to the `GitHub CLI` OAuth App and carries the `copilot` scope when you authenticate a Copilot-enabled account.

**Why not use a PAT?** Personal Access Tokens (fine-grained or classic) cannot carry the `copilot` scope. Only OAuth tokens from apps that request it (or CLI tokens) can access the Copilot API.

---

## 6. Streaming architecture (SSE)

The web UI uses Server-Sent Events (SSE) end-to-end: from Copilot API → server → browser.

```
Copilot API (SSE stream)
        │
        ▼
server: POST /api/skills/:name/sessions/:id/turn-stream
  - src/web-ui/routes/skills.js → handlePostTurnStreamHtml
  - calls skillTurnExecutorStream() with onChunk callback
  - each onChunk invocation emits: data: {"chunk":"<text>"}\n\n
  - if text contains ---ARTEFACT-START--- marker:
      emits data: {"draftChunk":"<partial artefact text>"}\n\n
  - when done: data: {"done":true,"artefactContent":"<full>","turns":[...]}\n\n
        │
        ▼
browser: fetch(...).then(r => r.body.getReader()) pump loop
  - evt.chunk → appended to chat bubble immediately (wusl.1: thinking dots removed on first chunk)
  - evt.draftChunk → accumulated and rendered in draft panel progressively (wusl.2)
  - evt.done → final artefact content rendered, turn history updated
```

The server sends `Content-Type: text/event-stream` with `Transfer-Encoding: chunked`. Each event is a JSON object on a `data:` line followed by `\n\n`.

---

## 7. Two model providers — copilot vs anthropic

The executor is configured by the `SKILL_EXECUTOR_PROVIDER` environment variable:

| `SKILL_EXECUTOR_PROVIDER` | Endpoint | Auth | Streaming |
|---|---|---|---|
| `copilot` (default) | `api.githubcopilot.com/chat/completions` | `GITHUB_TOKEN` or OAuth session token | ✅ Full SSE streaming |
| `anthropic` | `api.anthropic.com/v1/messages` | `ANTHROPIC_API_KEY` | ⚠️ Simulated (single onChunk call at end) |

### copilot provider model selection

Set `WUCE_TURN_MODEL` to control which model is used:

```bash
WUCE_TURN_MODEL=claude-sonnet-4.6   # Default when not set (gpt-4o is the code default)
WUCE_TURN_MODEL=gpt-4o              # GPT-4o (available on GHE)
WUCE_TURN_MODEL=gpt-4.1             # GPT-4.1 if available on your Copilot plan
```

Note: the hardcoded `DEFAULT_MODEL` constant in `skill-turn-executor.js` is `gpt-4o`. To use Claude Sonnet, you must explicitly set `WUCE_TURN_MODEL=claude-sonnet-4.6` in your `.env`.

### anthropic provider (BYOK — bring your own key)

If you want to call Anthropic's API directly (bypassing GitHub Copilot entirely):

```bash
SKILL_EXECUTOR_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxx
WUCE_TURN_MODEL=claude-sonnet-4.6   # or claude-opus-4, etc.
```

This requires an Anthropic account and direct API key. Note: streaming is not fully implemented for the anthropic provider — the `onChunk` callback is called once with the complete response, so the thinking-dots animation and progressive draft panel will wait until the full response is received before updating.

---

## 8. Full environment variable reference

### Required (server will not start without these)

| Variable | Description | Example |
|---|---|---|
| `GITHUB_CLIENT_ID` | OAuth App client ID from GitHub | `Ov23li...` |
| `GITHUB_CLIENT_SECRET` | OAuth App client secret | `abc123...` |
| `SESSION_SECRET` | Cookie session signing secret (min 32 chars) | `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

### Required for Copilot API model calls

| Variable | Description | Example |
|---|---|---|
| `GITHUB_TOKEN` | GitHub CLI auth token with copilot scope (`gh auth token`) | `ghu_xxxx...` |

### Optional — model configuration

| Variable | Default | Description |
|---|---|---|
| `SKILL_EXECUTOR_PROVIDER` | `copilot` | Model provider: `copilot` or `anthropic` |
| `WUCE_TURN_MODEL` | `gpt-4o` (copilot) / `claude-sonnet-4.6` (anthropic) | Model name passed to the provider |
| `WUCE_TURN_MODEL_MAX_TOKENS` | `4096` | Maximum tokens in a single turn response |
| `WUCE_TURN_TIMEOUT_MS` | `30000` | HTTP request timeout in milliseconds |
| `ANTHROPIC_API_KEY` | — | Required only when `SKILL_EXECUTOR_PROVIDER=anthropic` |

### Optional — GitHub configuration

| Variable | Default | Description |
|---|---|---|
| `GITHUB_API_BASE_URL` | `https://api.github.com` | Override for GitHub Enterprise Server — set to `https://ghe.your-org.com` |
| `GITHUB_CALLBACK_URL` | — | OAuth callback URL; must match the URL registered in the OAuth App settings |
| `GITHUB_REPO_OWNER` | — | GitHub org or username owning the skills repo (for artefact fetching) |
| `GITHUB_REPO_NAME` | — | Repository name (for artefact fetching) |

### Optional — server configuration

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | HTTP port to listen on |
| `NODE_ENV` | — | Set to `production` for production; `development` disables the HTTPS-only Secure cookie flag; `test` enables test fixtures and disables adapter wiring |
| `COPILOT_REPO_PATH` | — | Absolute path to the pipeline repo root (for local file I/O operations) |

### Complete `.env` for github.com with Claude Sonnet

```bash
# Required
GITHUB_CLIENT_ID=Ov23liXXXXXXXX
GITHUB_CLIENT_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SESSION_SECRET=<64-char random hex>
GITHUB_TOKEN=ghu_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Model (Claude Sonnet 4.6)
SKILL_EXECUTOR_PROVIDER=copilot
WUCE_TURN_MODEL=claude-sonnet-4.6

# Callback URL
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

# Repo context
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=skills-repo

# Server
PORT=3000
NODE_ENV=development
```

---

## 9. Step-by-step setup (github.com)

### Prerequisites

- Node.js v18 or later (tested on v22.17.0)
- A GitHub account with **GitHub Copilot Pro Plus** subscription
- `gh` CLI installed (for obtaining the GITHUB_TOKEN)

### Steps

**1. Clone the repository**

```bash
git clone https://github.com/heymishy/skills-repo.git
cd skills-repo
```

**2. Install dependencies**

```bash
npm install
```

**3. Register an OAuth App on GitHub**

- Go to: `https://github.com/settings/developers` → OAuth Apps → New OAuth App
- Homepage URL: `http://localhost:3000`
- Callback URL: `http://localhost:3000/auth/github/callback`
- Save the **Client ID** and generate a **Client Secret**

**4. Authenticate the GitHub CLI and obtain the Copilot token**

```bash
# Authenticate (if not already done)
gh auth login

# Get the token
gh auth token
```

Copy the output — this is your `GITHUB_TOKEN`.

**5. Create your `.env` file**

```bash
cp .env.example .env
```

Edit `.env` and fill in all values:

```bash
GITHUB_CLIENT_ID=<from step 3>
GITHUB_CLIENT_SECRET=<from step 3>
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))">
GITHUB_TOKEN=<from step 4>
GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback
GITHUB_REPO_OWNER=your-username
GITHUB_REPO_NAME=skills-repo
WUCE_TURN_MODEL=claude-sonnet-4.6
PORT=3000
NODE_ENV=development
```

**6. Start the server**

```bash
node src/web-ui/server.js
```

Or use the npm script if one is configured. The server will print the listening port and GitHub hostname on startup.

**7. Sign in**

Navigate to `http://localhost:3000`. You will be redirected to the sign-in page. Click "Sign in with GitHub", authorise the OAuth App, and you will be redirected to the dashboard.

**8. Run a skill session**

Navigate to a feature → click a skill → click "Start session". The chat interface will connect, and the model will begin streaming a response. The thinking-dots animation appears until the first token arrives. If the response includes an artefact (delimited by `---ARTEFACT-START---` and `---ARTEFACT-END---`), the draft panel updates progressively as tokens stream in.

---

## 10. GitHub Enterprise Server setup

### What works on GHE

| Feature | Available on GHE |
|---|---|
| OAuth App authentication | ✅ (register on GHE instance) |
| GitHub API calls (artefacts, pipeline state) | ✅ (set `GITHUB_API_BASE_URL`) |
| GPT-4o model via Copilot | ✅ (if Copilot Enterprise licence active) |
| Claude Sonnet models via Copilot | ❌ Not available on GHE |
| Copilot CLI (`gh copilot`) | ❌ Not yet available/approved in many GHE environments |
| GitHub App installation | ❌ Requires org admin approval — not used by this implementation anyway |

### Configuration differences for GHE

**Set the GHE API base URL**

```bash
GITHUB_API_BASE_URL=https://ghe.your-organisation.com
```

Note: the `artefact-adapter.js` automatically appends `/api/v3` if it is not already in the URL. All other adapters use the value as-is as the API base. The standard GitHub Enterprise REST API base is `https://ghe.your-org.com/api/v3` — if you set `GITHUB_API_BASE_URL` to include `/api/v3`, that works for all adapters. If you omit it, `artefact-adapter.js` handles it but other adapters may not. **Recommended: include `/api/v3` in the URL:**

```bash
GITHUB_API_BASE_URL=https://ghe.your-organisation.com/api/v3
```

**Register an OAuth App on your GHE instance**

- Go to: `https://ghe.your-organisation.com/settings/developers` → OAuth Apps → New OAuth App
- Callback URL: `https://your-deployed-app.your-org.com/auth/github/callback` (or `http://localhost:3000/auth/github/callback` for local dev)

The `oauth-adapter.js` automatically derives the GHE OAuth authorize URL from `GITHUB_API_BASE_URL` by stripping `/api/v3` and appending `/login/oauth/authorize`.

**Use GPT-4o instead of Claude Sonnet**

```bash
WUCE_TURN_MODEL=gpt-4o
```

Claude Sonnet is not routed by `api.githubcopilot.com` for GHE-licensed tokens. Using `claude-sonnet-4.6` on a GHE token will result in a 404 or 400 error from the Copilot API. Set the model to `gpt-4o` (or another model confirmed available in your GHE Copilot deployment).

**Obtain GITHUB_TOKEN from GHE CLI auth**

```bash
# Authenticate gh CLI against your GHE instance
gh auth login --hostname ghe.your-organisation.com

# Get the GHE token
gh auth token --hostname ghe.your-organisation.com
```

Set the output as `GITHUB_TOKEN=` in your `.env`.

**Copilot API endpoint for GHE**

The Copilot Chat Completions API endpoint `api.githubcopilot.com/chat/completions` is a GitHub-managed global endpoint — it is **not** replaced by a GHE hostname. The `GITHUB_API_BASE_URL` only affects GitHub REST API calls (artefact fetching, pipeline state, annotations, sign-off writes). The Copilot model call always goes to `api.githubcopilot.com` regardless of GHE configuration.

**Complete `.env` for GHE with GPT-4o**

```bash
# Required
GITHUB_CLIENT_ID=<from GHE OAuth App>
GITHUB_CLIENT_SECRET=<from GHE OAuth App>
SESSION_SECRET=<64-char random hex>
GITHUB_TOKEN=<gh auth token --hostname ghe.your-organisation.com>

# GHE API base
GITHUB_API_BASE_URL=https://ghe.your-organisation.com/api/v3

# Callback URL (must match GHE OAuth App registration)
GITHUB_CALLBACK_URL=https://your-app.your-org.com/auth/github/callback

# Model — GPT-4o (Claude Sonnet not available on GHE)
SKILL_EXECUTOR_PROVIDER=copilot
WUCE_TURN_MODEL=gpt-4o

# Repo context
GITHUB_REPO_OWNER=your-org
GITHUB_REPO_NAME=skills-repo

PORT=3000
NODE_ENV=production
```

---

## 11. Troubleshooting common errors

### HTTP 401 from Copilot API

**Cause:** `GITHUB_TOKEN` is not set or has expired. The OAuth session token does not have the `copilot` scope.

**Fix:** Run `gh auth token` (or `gh auth token --hostname ghe.your-org.com` for GHE) and update `GITHUB_TOKEN` in `.env`. Restart the server.

### HTTP 404 from Copilot API

**Cause on GHE:** The model name (`WUCE_TURN_MODEL`) is set to `claude-sonnet-4.6` but Claude is not available on your GHE Copilot licence.

**Fix:** Set `WUCE_TURN_MODEL=gpt-4o`.

**Cause on github.com:** Model name may be incorrect or not available on your Copilot tier. Try `gpt-4o` as a fallback.

### HTTP 403 on OAuth callback

**Cause:** CSRF state mismatch. The `state` parameter in the callback URL does not match the value stored in the session.

**Fix:** Clear cookies and retry. If persistent, check that your load balancer / reverse proxy is using sticky sessions — the session state stored in-memory on one server instance will not be visible to another.

### "Missing required environment variable(s): GITHUB_CLIENT_ID, ..."

**Cause:** `.env` file not loaded or variables missing.

**Fix:** Ensure `.env` exists in the project root and all three required variables are set. If running in Docker or a CI environment, ensure the env vars are injected.

### OAuth callback URL mismatch

**Cause:** The `redirect_uri` in the OAuth request does not match the callback URL registered in the OAuth App settings.

**Fix:** Set `GITHUB_CALLBACK_URL` to exactly match the callback URL in the OAuth App registration (including protocol, host, port, and path).

### Artefact fetch returns 404

**Cause on GHE:** `GITHUB_API_BASE_URL` may not include `/api/v3`, or `GITHUB_REPO_OWNER` / `GITHUB_REPO_NAME` are not set.

**Fix:** Verify all three GHE-related variables are set correctly.

---

## 12. What was NOT used in this implementation

| Item | Status | Notes |
|---|---|---|
| **GitHub App** | Not used | Requires org admin installation approval. OAuth App is sufficient for per-user auth and API access. |
| **GitHub Copilot CLI** (`gh copilot`) | Not used | Not required. The implementation calls the Copilot HTTP API directly with no CLI dependency. Not yet available/approved in many enterprise environments. |
| **Personal Access Token (PAT)** | Not used | PATs cannot carry the `copilot` scope. Use `gh auth token` output instead. |
| **Anthropic API (direct)** | Not used by default | Available as optional `anthropic` provider (`SKILL_EXECUTOR_PROVIDER=anthropic`) if you have a direct Anthropic API key. |
| **Express / any web framework** | Not used | Server is plain Node.js `http` module. |
| **Any npm AI SDK** | Not used | All API calls use the built-in `https` module only. |
| **WebSockets** | Not used | Streaming uses SSE (Server-Sent Events) — simpler, one-way, and works through standard HTTP/1.1 proxies. |

---

## Implementation history

This integration was built incrementally through the skills pipeline:

- **wuce.1–wuce.5** — Initial web UI scaffolding and OAuth App authentication
- **wuce.14–wuce.18** — Skill session execution, artefact commit, chat interface
- **mfc.1** — Model-first chat: wired `skill-turn-executor.js` to route handler via injectable adapter pattern
- **ougl.1–ougl.7** — Gate/confirm/journey flows using the same executor
- **wusl.1** — Streaming thinking dots: removed on first real token chunk (not on HTTP headers)
- **wusl.2** — Progressive live draft: `---ARTEFACT-START---` / `---ARTEFACT-END---` delimiters detected server-side; `{draftChunk}` SSE events emitted for real-time draft panel updates

All implementation artefacts are under `artefacts/` in this repository.
