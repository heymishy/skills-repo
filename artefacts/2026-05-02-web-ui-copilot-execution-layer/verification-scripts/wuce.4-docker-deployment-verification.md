# AC Verification Script: wuce.4 — Docker deployment and environment configuration

**Story reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/stories/wuce.4-docker-deployment.md
**Test plan reference:** artefacts/2026-05-02-web-ui-copilot-execution-layer/test-plans/wuce.4-docker-deployment-test-plan.md
**Verification script author:** Copilot
**Date:** 2026-05-02

---

## Pre-verification checks

```bash
# 1. Unit + integration tests pass
node tests/check-wuce4-docker-deployment.js
# Expected: 0 failures

# 2. Docker is available
docker --version
docker compose version
# Expected: both commands return version strings
```

---

## AC1 — docker compose up → app starts, /health returns 200

**Automated evidence:** T1.1, IT1, NFR1

```bash
node tests/check-wuce4-docker-deployment.js
```

**Expected:** All tests pass; `/health` returns 200 `{"status":"ok"}`.

**Manual container verification:**
```bash
# Set test env vars
export GITHUB_CLIENT_ID=test-client-id
export GITHUB_CLIENT_SECRET=test-client-secret
export GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

docker compose up -d

# Wait for startup (cold start must be < 10 seconds per NFR)
sleep 12
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/health
# Expected: 200

curl -s http://localhost:3000/health
# Expected: {"status":"ok"}

docker compose down
```

**Pass condition:** HTTP 200; body `{"status":"ok"}` within 10 seconds of container start. ✅ / ❌

---

## AC2 — Missing required env var → startup error naming variable + non-zero exit

**Automated evidence:** T2.1, T2.2, NFR2

```bash
node tests/check-wuce4-docker-deployment.js
```

**Expected:** Both validation tests pass; error message contains variable name.

**Manual container verification:**
```bash
# Start without GITHUB_CLIENT_SECRET
unset GITHUB_CLIENT_SECRET
docker compose up 2>&1 | head -20
# Expected: log line contains "GITHUB_CLIENT_SECRET" (naming the missing variable)
# Expected: container exits

docker compose ps
# Expected: container status is "Exited" (not "Up")

echo "Last exit code: $?"
# Expected: non-zero
```

**Pass condition:** Log names `GITHUB_CLIENT_SECRET`; container exits with non-zero code. ✅ / ❌

---

## AC3 — GITHUB_API_BASE_URL → OAuth and Contents API calls routed to configured URL

**Automated evidence:** T3.1, T3.2

```bash
node tests/check-wuce4-docker-deployment.js
```

**Expected:** Both adapter URL tests pass; no `github.com` in URLs when `GITHUB_API_BASE_URL` is set.

**Manual container verification:**
```bash
export GITHUB_API_BASE_URL=https://ghe.example.com
export GITHUB_CLIENT_ID=test-client-id
export GITHUB_CLIENT_SECRET=test-client-secret
export GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

docker compose up -d
sleep 5

# Navigate to http://localhost:3000 in a browser
# Click "Sign in with GitHub"
# Observe the browser address bar — must show https://ghe.example.com/login/oauth/authorize
# Must NOT show https://github.com/login/oauth/authorize

docker compose down
```

**Pass condition:** Browser redirects to `ghe.example.com`, not `github.com`. ✅ / ❌

---

## AC4 — No secrets in Docker image layers

**Automated evidence (Jest):** None — infrastructure only

**Manual verification:**
```bash
docker build -t wuce-web-ui:test .

# Check image layer metadata for secret strings
docker inspect wuce-web-ui:test | grep -iE "secret|client_secret|access_token|password"
# Expected: no matches

# Check Dockerfile for hardcoded values
grep -iE "SECRET|PASSWORD|TOKEN|CLIENT_SECRET" Dockerfile
# Expected: no hardcoded values; all sensitive config must reference ARG or ENV set at runtime

# Check build args that might capture secrets at build time
docker history --no-trunc wuce-web-ui:test | grep -iE "SECRET|TOKEN|PASSWORD"
# Expected: no matches
```

**Pass condition:** Zero matches on all three checks. ✅ / ❌

---

## AC5 — Container runs as non-root user

**Automated evidence (Jest):** None — infrastructure only

**Manual verification:**
```bash
export GITHUB_CLIENT_ID=test-client-id
export GITHUB_CLIENT_SECRET=test-client-secret
export GITHUB_CALLBACK_URL=http://localhost:3000/auth/github/callback

docker compose up -d
sleep 5

docker compose exec web whoami
# Expected: output is NOT "root"
# Acceptable values: "node", "appuser", or another unprivileged username

docker compose exec web id
# Confirm UID is non-zero (root UID = 0)

docker compose down
```

**Pass condition:** `whoami` output is not `root`; UID is non-zero. ✅ / ❌

---

## AC6 — Multi-stage build; final image contains only production runtime deps; size documented

**Automated evidence (Jest):** None — infrastructure only

**Manual verification:**
```bash
# Verify Dockerfile uses multi-stage build
grep -c "^FROM" Dockerfile
# Expected: 2 or more FROM lines

docker build -t wuce-web-ui:test .

# Check that devDependencies are absent from final image
docker run --rm wuce-web-ui:test ls node_modules | grep -E "jest|mocha|eslint|nodemon"
# Expected: empty output — none of these devDependencies should be in the final image

# Record image size (must be documented in Dockerfile comments or project README)
docker image inspect wuce-web-ui:test --format '{{.Size}}'
# Record value in MB; check that it is documented somewhere in the project

# Verify production node_modules are present (app must still run)
docker run --rm wuce-web-ui:test node -e "require('express'); console.log('OK')"
# Expected: "OK"
```

**Pass condition:** ≥ 2 FROM lines in Dockerfile; no devDependencies in final image; image size documented; production deps present. ✅ / ❌

---

## NFR verification

### Cold start < 10 seconds

```bash
# From AC1 manual verification — measure time from docker compose up to first 200 from /health
time (docker compose up -d && sleep 2 && until curl -s http://localhost:3000/health | grep -q ok; do sleep 1; done)
# Expected: total elapsed time < 10 seconds
```

### /health suitable for orchestration probes (no auth required)

```bash
node tests/check-wuce4-docker-deployment.js
```

**Expected:** Test passes confirming `/health` does not redirect unauthenticated requests.

### All missing env vars reported in one error

```bash
node tests/check-wuce4-docker-deployment.js
```

---

## Full suite run

```bash
node tests/check-wuce4-docker-deployment.js
```

**Expected:** 0 failures.

---

## Completion criteria

- [ ] All tests pass with 0 failures (`node tests/check-wuce4-docker-deployment.js`)
- [ ] AC1 manual: `docker compose up` → `/health` returns 200 within 10 seconds
- [ ] AC2 manual: missing env var → log names the variable; container exits non-zero
- [ ] AC3 manual: `GITHUB_API_BASE_URL` → OAuth redirect goes to configured host, not github.com
- [ ] AC4 manual: `docker inspect` + `docker history` show no secrets in image layers
- [ ] AC5 manual: `docker compose exec web whoami` returns a non-root user
- [ ] AC6 manual: ≥ 2 FROM in Dockerfile; devDeps absent from final image; size documented
