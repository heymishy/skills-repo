#!/usr/bin/env bash
# Post-deploy production smoke test — s4.1
# Each step maps to an AC in artefacts/2026-06-22-wuce-multi-tenancy/stories/s4.1.md
# Usage: APP=<fly-app-name> bash scripts/smoke-test-production.sh
# Requires: fly CLI authenticated, curl

set -euo pipefail

APP="${APP:-}"
if [ -z "$APP" ]; then
  echo "ERROR: APP env var must be set (e.g. APP=my-fly-app)"
  exit 1
fi

BASE_URL="https://${APP}.fly.dev"
PASS=0
FAIL=0
WARN=0

pass() { echo "  [PASS] $1"; PASS=$((PASS + 1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN + 1)); }
section() { echo; echo "=== $1 ==="; }

# ── AC1 — Required secrets present ──────────────────────────────────────────
section "AC1: Required Fly.io secrets"
REQUIRED_SECRETS=(DATABASE_URL UPSTASH_REDIS_REST_URL UPSTASH_REDIS_REST_TOKEN TENANT_ORG_ALLOWLIST MAX_JOURNEYS_PER_TENANT GITHUB_CLIENT_ID GITHUB_CLIENT_SECRET)
SECRET_LIST=$(fly secrets list --app "$APP" 2>/dev/null || echo "")
MISSING=0
for secret in "${REQUIRED_SECRETS[@]}"; do
  if echo "$SECRET_LIST" | grep -qE "(^| )$secret( |$|[[:space:]])"; then
    pass "$secret present"
  else
    fail "$secret MISSING"
    MISSING=$((MISSING + 1))
  fi
done
if [ "$MISSING" -gt 0 ]; then
  echo "  WARNING: $MISSING required secret(s) missing — run 'fly secrets set' before proceeding"
fi

# ── AC2 — Startup log check (last 60 lines) ─────────────────────────────────
section "AC2: Startup log — no error lines"
STARTUP_ERRORS=$(timeout 10 fly logs --app "$APP" 2>/dev/null | grep -E "PG write error|loadAllFromPg failed|Redis load error" || true)
if [ -z "$STARTUP_ERRORS" ]; then
  pass "No startup error log lines found"
else
  fail "Startup error lines detected:"
  echo "$STARTUP_ERRORS" | sed 's/^/    /'
fi

# ── AC3 — Health check ──────────────────────────────────────────────────────
section "AC3: GET /health → HTTP 200"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}/health" 2>/dev/null || echo "000")
if echo "$HTTP_STATUS" | grep -q "^200"; then
  pass "GET /health returned 200"
else
  fail "GET /health returned $HTTP_STATUS (expected 200)"
fi

# ── AC4 — Journey persistence (manual step; guided prompt) ──────────────────
section "AC4: Journey persistence to Neon (manual verification)"
warn "Manual step required: log in, create a journey via POST /journey, then verify in Neon SQL editor:"
echo "    SELECT journey_id, tenant_id FROM journeys ORDER BY created_at DESC LIMIT 1;"
echo "    Expected: a row with the correct journey_id and tenant_id."

# ── AC5 — Session survival (manual step; guided prompt) ─────────────────────
section "AC5: Session survival after restart (manual verification)"
warn "Manual step required:"
echo "    1. Confirm GET ${BASE_URL}/dashboard returns 200 (authenticated session)"
echo "    2. Run: fly machine restart --app $APP"
echo "    3. Confirm GET ${BASE_URL}/dashboard still returns 200 within 30 seconds"

# ── AC6 — Billing gate fires ─────────────────────────────────────────────────
section "AC6: Billing gate fires at cap (manual verification)"
warn "Manual step required:"
echo "    1. Temporarily set MAX_JOURNEYS_PER_TENANT=1 via: fly secrets set MAX_JOURNEYS_PER_TENANT=1 --app $APP"
echo "    2. Ensure the test tenant already has 1 journey."
echo "    3. Attempt POST /journey — expect HTTP 402 with 'Journey limit reached'."
echo "    4. Reset cap to intended beta value: fly secrets set MAX_JOURNEYS_PER_TENANT=<value> --app $APP"

# ── Summary ─────────────────────────────────────────────────────────────────
echo
echo "═══════════════════════════════"
echo " SMOKE TEST SUMMARY"
echo "═══════════════════════════════"
echo "  PASS: $PASS"
echo "  WARN: $WARN  (manual verification required)"
echo "  FAIL: $FAIL"
echo "═══════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo "Result: FAIL — $FAIL automated check(s) failed"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo "Result: WARN — automated checks passed; complete manual steps above"
  exit 0
else
  echo "Result: PASS"
  exit 0
fi
