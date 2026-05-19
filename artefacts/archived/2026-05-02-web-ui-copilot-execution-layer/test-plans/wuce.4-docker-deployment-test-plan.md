# Test Plan: Docker deployment and environment configuration

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.4-docker-deployment.md
**Epic reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/epics/wuce-e1-walking-skeleton.md
**Test plan author:** Copilot
**Date:** 2026-05-02

---

## AC Coverage

| AC | Description | Unit | Integration | E2E | Manual | Gap type | Risk |
|----|-------------|------|-------------|-----|--------|----------|------|
| AC1 | `docker compose up` → app starts, `/health` returns 200 `{"status":"ok"}` | 1 | 1 | — | 1 | Infrastructure | 🟡 |
| AC2 | Missing required env var → startup error naming the variable + non-zero exit | 2 | — | — | 1 | Infrastructure | 🟡 |
| AC3 | `GITHUB_API_BASE_URL` set → OAuth and Contents API calls use configured URL | 2 | — | — | 1 | Infrastructure | 🟡 |
| AC4 | `docker inspect` → no secrets in image layers | — | — | — | 1 | Infrastructure | 🟡 |
| AC5 | `docker exec whoami` → not root | — | — | — | 1 | Infrastructure | 🟡 |
| AC6 | Multi-stage build → final image contains only production deps; image size documented | — | — | — | 1 | Infrastructure | 🟡 |

---

## Coverage gaps

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| `docker compose up` start and health check | AC1 | Infrastructure | Docker daemon not available in Jest; container orchestration is outside Node.js test scope | Unit test covers health handler; integration test covers HTTP endpoint; full container start is manual 🟡 |
| Missing env var causes non-zero process exit (actual process exit code) | AC2 | Infrastructure | `process.exit()` terminates the test process; Jest cannot observe a real process exit without subprocess spawning | Unit test covers startup validation logic; subprocess/Docker behaviour is manual 🟡 |
| OAuth/API calls routed to `GITHUB_API_BASE_URL` (runtime env var switching) | AC3 | Infrastructure | Setting env vars on a running Docker container and verifying network calls requires Docker; Jest unit test covers adapter logic only | Unit test confirms adapter reads `GITHUB_API_BASE_URL`; full routing confirmed manually 🟡 |
| No secrets in Docker image layers | AC4 | Infrastructure | Requires `docker inspect` on a built image — not available in Jest | Manual only 🟡 |
| Container runs as non-root user | AC5 | Infrastructure | Requires a running container — not available in Jest | Manual only 🟡 |
| Multi-stage build produces production-only image | AC6 | Infrastructure | Requires Docker build and image inspection | Manual only 🟡 |

---

## Test Data Strategy

**Source:** Environment variable configuration; no JSON fixtures required for this story
**Named shared fixtures from wuce.1:** `tests/fixtures/github/oauth-token-exchange-success.json` used to confirm health check does not require auth

---

## Unit Tests

### AC1 — Health check handler

**T1.1** `healthCheckHandler returns { status: "ok" } with HTTP 200`
- **AC:** AC1
- **Precondition:** Mock `req` and `res` objects
- **Action:** Call `healthCheckHandler(req, res)`
- **Expected:** `res.status(200).json({ status: 'ok' })` called; response body matches `{"status":"ok"}`
- **Fails before implementation:** Yes

### AC2 — Startup environment validation

**T2.1** `validateRequiredEnvVars throws when GITHUB_CLIENT_SECRET is absent`
- **AC:** AC2
- **Precondition:** `process.env.GITHUB_CLIENT_SECRET` unset; other required vars set
- **Action:** `validateRequiredEnvVars()`
- **Expected:** Throws error; error message contains the string `GITHUB_CLIENT_SECRET`
- **Fails before implementation:** Yes

**T2.2** `validateRequiredEnvVars throws when GITHUB_CLIENT_ID is absent`
- **AC:** AC2
- **Precondition:** `process.env.GITHUB_CLIENT_ID` unset; other required vars set
- **Action:** `validateRequiredEnvVars()`
- **Expected:** Throws error; error message contains the string `GITHUB_CLIENT_ID`
- **Fails before implementation:** Yes

### AC3 — GITHUB_API_BASE_URL routing

**T3.1** `buildOAuthRedirectURL uses GITHUB_API_BASE_URL when set`
- **AC:** AC3
- **Precondition:** `GITHUB_API_BASE_URL=https://ghe.example.com`; `GITHUB_CLIENT_ID=test-client-id`
- **Action:** `buildOAuthRedirectURL('test-state')`
- **Expected:** Returned URL starts with `https://ghe.example.com/login/oauth/authorize`; does not contain `github.com`
- **Fails before implementation:** Yes

**T3.2** `fetchArtefact (Contents API adapter) uses GITHUB_API_BASE_URL for API base`
- **AC:** AC3
- **Precondition:** `GITHUB_API_BASE_URL=https://ghe.example.com`; mock fetch to capture URL
- **Action:** Call `fetchArtefact('example-feature', 'discovery', 'token')`
- **Expected:** The fetch URL uses `https://ghe.example.com/api/v3/repos/...` or equivalent enterprise API base; does not contain `api.github.com`
- **Fails before implementation:** Yes

---

## Integration Tests

**IT1** `GET /health returns 200 {"status":"ok"}`
- **ACs:** AC1
- **Precondition:** App server started in test mode (no Docker required)
- **Action:** `GET /health`
- **Expected:** Status 200; body `{"status":"ok"}`; response does not require authentication
- **Fails before implementation:** Yes

---

## NFR Tests

**NFR1** `GET /health does not require an authenticated session`
- **NFR:** Accessibility for orchestration health probes
- **Precondition:** No session cookie in request
- **Action:** `GET /health`
- **Expected:** Status 200 (not 302 redirect to sign-in)
- **Fails before implementation:** Yes

**NFR2** `validateRequiredEnvVars lists all missing variables in one error (not just the first)`
- **NFR:** Operational — faster debugging when multiple env vars are missing
- **Precondition:** `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`, and `GITHUB_CALLBACK_URL` all unset
- **Action:** `validateRequiredEnvVars()`
- **Expected:** Thrown error message contains all three variable names
- **Fails before implementation:** Yes

---

## Manual verification scenarios

The following ACs are infrastructure-level and can only be fully verified with a running Docker environment. All Jest automation provides the unit-level confidence; manual steps provide the container-level confidence.

### Manual AC1 — Full docker compose startup and health check

```bash
# Set required env vars (test values)
export GITHUB_CLIENT_ID=test-client-id
export GITHUB_CLIENT_SECRET=test-client-secret
export GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

docker compose up -d
sleep 10  # allow cold start
curl -s http://localhost:3000/health
# Expected: {"status":"ok"} — HTTP 200

docker compose down
```

### Manual AC2 — Missing env var startup failure

```bash
# Start without GITHUB_CLIENT_SECRET
unset GITHUB_CLIENT_SECRET
docker compose up
# Expected: container logs show "Missing required environment variable: GITHUB_CLIENT_SECRET"
# Expected: container exits with non-zero code

echo "Exit code: $?"
# Expected: non-zero (e.g. 1)
```

### Manual AC3 — GITHUB_API_BASE_URL routes to GHE

```bash
export GITHUB_API_BASE_URL=https://ghe.example.com
export GITHUB_CLIENT_ID=test-client-id
export GITHUB_CLIENT_SECRET=test-client-secret
export GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

docker compose up -d
# Navigate to http://localhost:3000 and click "Sign in with GitHub"
# Expected: browser redirects to https://ghe.example.com/login/oauth/authorize (not github.com)

docker compose down
```

### Manual AC4 — No secrets in image layers

```bash
docker build -t wuce-web-ui:test .
docker inspect wuce-web-ui:test | grep -i "secret\|CLIENT_SECRET\|ACCESS_TOKEN\|PASSWORD"
# Expected: no matches — secrets must not appear in any layer metadata

# Also verify no secrets in build args committed to Dockerfile:
grep -i "SECRET\|PASSWORD\|TOKEN" Dockerfile
# Expected: no hardcoded values
```

### Manual AC5 — Container runs as non-root

```bash
docker compose up -d
docker compose exec web whoami
# Expected: output is NOT "root" — must be an unprivileged user (e.g. "node" or "appuser")

docker compose down
```

### Manual AC6 — Multi-stage build; final image production-only

```bash
docker build -t wuce-web-ui:test .
docker image inspect wuce-web-ui:test --format '{{.Size}}'
# Record size; confirm it is documented in the Dockerfile or README

# Confirm devDependencies are not present in final image
docker run --rm wuce-web-ui:test ls node_modules | grep jest
# Expected: "No such file or directory" or empty — jest is a devDependency and must not be in the final image

# Confirm build uses multi-stage (Dockerfile must have at least two FROM directives)
grep -c "^FROM" Dockerfile
# Expected: 2 or more
```

---

## Gap table

| Gap | AC | Gap type | Reason untestable in Jest | Handling |
|-----|----|----------|--------------------------|---------|
| `docker compose up` full container startup | AC1 | Infrastructure | Docker daemon not available in Jest test runner | Manual scenario: `docker compose up` + `curl /health` 🟡 |
| Non-zero process exit on missing env var | AC2 | Infrastructure | `process.exit()` terminates Jest process | Unit test covers validation logic; process exit confirmed manually 🟡 |
| Network routing to `GITHUB_API_BASE_URL` in running container | AC3 | Infrastructure | Docker env var and network routing requires live container | Unit test covers adapter URL construction; container routing confirmed manually 🟡 |
| No secrets in image layers (`docker inspect`) | AC4 | Infrastructure | Requires `docker inspect` on a built image | Manual only 🟡 |
| Non-root user in container (`docker exec whoami`) | AC5 | Infrastructure | Requires running container | Manual only 🟡 |
| Multi-stage build; production-only final image | AC6 | Infrastructure | Requires Docker build and image size inspection | Manual only 🟡 |
