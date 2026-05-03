# Implementation Plan: wuce.4 — Docker deployment and environment configuration

**Story:** wuce.4
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Worktree:** c:\Users\Hamis\code\skills repo\.worktrees\wuce.4-docker-deployment
**Date:** 2026-05-03

---

## File map

| File | Action | Responsibility |
|------|--------|---------------|
| `src/web-ui/config/validate-env.js` | Create | `validateRequiredEnvVars()` — checks GITHUB_CLIENT_ID, GITHUB_CLIENT_SECRET, SESSION_SECRET; throws with all missing names |
| `src/web-ui/routes/health.js` | Create | `healthCheckHandler(req, res)` — returns 200 `{"status":"ok"}` |
| `src/web-ui/artefacts/artefact-adapter.js` | Create | `fetchArtefact(featureSlug, artefactType, token)` — Contents API call respecting GITHUB_API_BASE_URL |
| `src/web-ui/server.js` | Extend | Import health handler from routes/health.js; call validateRequiredEnvVars on startup |
| `Dockerfile` | Create | Multi-stage build (builder + production); non-root `node` user; no secrets in layers |
| `docker-compose.yml` | Create | Service `web` with all required env vars as `${VAR_NAME}` references; /health healthcheck |
| `.dockerignore` | Create | Exclude node_modules, .env, tests, .git, secrets |
| `tests/check-wuce4-docker-deployment.js` | Create | T1.1, T2.1, T2.2, T3.1, T3.2, IT1, NFR1, NFR2 |
| `package.json` | Extend | Append `&& node tests/check-wuce4-docker-deployment.js` to test script |
| `CHANGELOG.md` | Extend | Add entry under `### Added` |

---

## Task 1 — Create `src/web-ui/config/validate-env.js`

**RED test:** T2.1 — `validateRequiredEnvVars throws when GITHUB_CLIENT_SECRET is absent`

**Implementation:**

```js
'use strict';

const REQUIRED_ENV_VARS = [
  'GITHUB_CLIENT_ID',
  'GITHUB_CLIENT_SECRET',
  'SESSION_SECRET'
];

function validateRequiredEnvVars() {
  const missing = REQUIRED_ENV_VARS.filter(v => !process.env[v]);
  if (missing.length > 0) {
    throw new Error(
      'Missing required environment variable(s): ' + missing.join(', ')
    );
  }
}

module.exports = { validateRequiredEnvVars, REQUIRED_ENV_VARS };
```

**Commit:** `feat: wuce.4 — startup env validation (T2.1, T2.2, NFR2)`

---

## Task 2 — Create `src/web-ui/routes/health.js`

**RED test:** T1.1 — `healthCheckHandler returns {"status":"ok"} with HTTP 200`

**Implementation:**

```js
'use strict';

function healthCheckHandler(req, res) {
  res.writeHead(200, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ status: 'ok' }));
}

module.exports = { healthCheckHandler };
```

**Commit:** `feat: wuce.4 — health check handler (T1.1, IT1, NFR1)`

---

## Task 3 — Create `src/web-ui/artefacts/artefact-adapter.js`

**RED test:** T3.2 — `fetchArtefact uses GITHUB_API_BASE_URL for API base`

**Implementation:**

```js
'use strict';

function buildApiBase() {
  const apiBase = process.env.GITHUB_API_BASE_URL;
  if (apiBase) {
    const clean = apiBase.replace(/\/+$/, '');
    return clean.endsWith('/api/v3') ? clean : clean + '/api/v3';
  }
  return 'https://api.github.com';
}

async function fetchArtefact(featureSlug, artefactType, token) {
  const base = buildApiBase();
  const owner = process.env.GITHUB_REPO_OWNER || 'org';
  const repo  = process.env.GITHUB_REPO_NAME  || 'repo';
  const path  = `artefacts/${featureSlug}/${artefactType}.md`;
  const url   = `${base}/repos/${owner}/${repo}/contents/${path}`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `token ${token}`,
      'Accept':        'application/vnd.github.v3.raw',
      'User-Agent':    'skills-pipeline-web-ui'
    }
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${path}`);
  }

  return response.text();
}

module.exports = { fetchArtefact, buildApiBase };
```

**Commit:** `feat: wuce.4 — artefact Contents API adapter with GHE support (T3.2)`

---

## Task 4 — Extend `src/web-ui/server.js`

Import `healthCheckHandler` from routes/health.js; call `validateRequiredEnvVars` on startup.

**Commit:** `feat: wuce.4 — server uses health module; calls validateEnv on startup`

---

## Task 5 — Create `Dockerfile`

Multi-stage: `builder` stage installs all deps and copies source; `production` stage copies only
`node_modules` (production), source, and sets non-root `node` user. No ENV/ARG for secrets.

**Commit:** `feat: wuce.4 — Dockerfile multi-stage non-root (AC4, AC5, AC6)`

---

## Task 6 — Create `docker-compose.yml`

Service `web`; image from local Dockerfile; env vars via `${VAR_NAME}` references; healthcheck
on `GET /health`; port 3000; depends_on nothing (standalone walking skeleton).

**Commit:** `feat: wuce.4 — docker-compose.yml service definition (AC1)`

---

## Task 7 — Create `.dockerignore`

Excludes: `node_modules`, `.env*`, `tests/`, `.git`, `*.log`, `artefacts/`, `.worktrees/`.

**Commit:** `feat: wuce.4 — .dockerignore (AC6 image size)`

---

## Task 8 — Create test file and add to npm chain

Create `tests/check-wuce4-docker-deployment.js` covering all 8 tests.
Update `package.json` and add CHANGELOG entry.

**Commit:** `feat: wuce.4 — tests, package.json, CHANGELOG`
