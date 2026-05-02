# Contract Proposal: Docker deployment and environment configuration

**Story:** wuce.4
**Feature:** 2026-05-02-web-ui-copilot-execution-layer
**Date:** 2026-05-02

---

## Components built by this story

- `Dockerfile` — multi-stage build; final stage is production-only (no devDependencies, no source maps, non-root user)
- `docker-compose.yml` — service definition with all required env vars declared as `${VAR_NAME}` references; no hardcoded secrets
- `GET /health` route — returns `{ status: "ok" }` with HTTP 200
- Startup environment validation: checks for required env vars (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, `SESSION_SECRET`) on startup; logs descriptive error and exits with non-zero code if any are missing
- `GITHUB_API_BASE_URL` env var support in all GitHub API adapter calls (defaults to `https://api.github.com`; overridable for GHE)
- `.dockerignore` to exclude `node_modules`, `.env`, secrets, test files from image

## Components NOT built by this story

- Kubernetes Helm charts — out of scope
- CI/CD pipeline configuration — out of scope
- High-availability or load-balanced configuration — out of scope
- GitHub App authentication mode — out of scope (OAuth App is Phase 1)
- Any new application features beyond health endpoint and startup validation

## AC → Test mapping

| AC | Description | Tests |
|----|-------------|-------|
| AC1 | docker compose up → /health 200 | `docker compose up → GET /health returns 200`, `container start time < 10 seconds` |
| AC2 | Missing env var → startup error + exit | `start without GITHUB_CLIENT_ID → non-zero exit with descriptive error`, `start without SESSION_SECRET → descriptive error message` |
| AC3 | GITHUB_API_BASE_URL → GHE redirect | `GITHUB_API_BASE_URL=https://ghe.example.com → adapter uses that base URL`, `default URL is https://api.github.com when env var absent` |
| AC4 | No secrets in image layers | `docker history shows no ENV or ARG with secret values`, `docker inspect shows no secret env vars baked in` |
| AC5 | Non-root user | `docker inspect USER field is non-root`, `whoami in running container is not root` |
| AC6 | Multi-stage build final image = prod-only | `final image contains no devDependencies`, `no test files in final image layer` |

## Assumptions

- Node.js is the runtime; the Dockerfile uses an official node alpine base image
- `docker` and `docker compose` are available in the test environment for Docker-specific tests
- Jest tests for env validation use `child_process.spawn` or module loading to exercise startup logic

## File touchpoints

| File | Action | Notes |
|------|--------|-------|
| `Dockerfile` | Create | Multi-stage, non-root, prod-only final stage |
| `docker-compose.yml` | Create | Service definition with env var references |
| `.dockerignore` | Create | Exclude secrets, test files, node_modules |
| `src/routes/health.js` | Create | GET /health route |
| `src/config/validate-env.js` | Create | Startup env validation |
| `src/app.js` | Extend | Mount health route; call validateEnv on startup |
| `tests/docker-deployment.test.js` | Create | Jest + Docker shell tests for wuce.4 |

## Contract review

**APPROVED** — all components are within story scope, AC → test mapping is complete, no scope boundary violations identified.
