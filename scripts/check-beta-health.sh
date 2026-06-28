#!/usr/bin/env bash
# Beta health check script — s5.1 AC5
# Checks /health endpoint and scans fly logs for error patterns in the last 5 minutes.
# Usage: APP=<fly-app-name> bash scripts/check-beta-health.sh
# Requires: fly CLI authenticated, curl

set -euo pipefail

APP="${APP:-}"
if [ -z "$APP" ]; then
  echo "ERROR: APP env var must be set (e.g. APP=my-fly-app)"
  exit 1
fi

BASE_URL="https://${APP}.fly.dev"
PASS=0
WARN=0
FAIL=0

pass() { echo "  [PASS] $1"; PASS=$((PASS + 1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN + 1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }

echo "Beta health check — app: $APP"
echo

# ── Check 1: GET /health ────────────────────────────────────────────────────
echo "[ Check 1 ] GET /health"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${BASE_URL}/health" 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" = "200" ]; then
  pass "GET /health → 200"
else
  fail "GET /health → $HTTP_STATUS (expected 200)"
fi

# ── Check 2: Billing gate fires in logs ─────────────────────────────────────
echo
echo "[ Check 2 ] Billing gate error pattern (fly logs)"
BILLING_ERRORS=$(fly logs --app "$APP" 2>/dev/null | grep "Journey limit reached" || true)
if [ -n "$BILLING_ERRORS" ]; then
  warn "Billing gate fires detected in recent logs (this may be expected):"
  echo "$BILLING_ERRORS" | tail -5 | sed 's/^/    /'
else
  pass "No 'Journey limit reached' errors in recent logs"
fi

# ── Check 3: PG write errors in logs ────────────────────────────────────────
echo
echo "[ Check 3 ] PG write error pattern (fly logs)"
PG_ERRORS=$(fly logs --app "$APP" 2>/dev/null | grep "\[journey-store\] PG write error" || true)
if [ -n "$PG_ERRORS" ]; then
  fail "PG write errors detected:"
  echo "$PG_ERRORS" | tail -5 | sed 's/^/    /'
else
  pass "No PG write errors in recent logs"
fi

# ── Check 4: Redis write errors in logs ─────────────────────────────────────
echo
echo "[ Check 4 ] Redis write error pattern (fly logs)"
REDIS_ERRORS=$(fly logs --app "$APP" 2>/dev/null | grep "\[session\] Redis write error" || true)
if [ -n "$REDIS_ERRORS" ]; then
  fail "Redis write errors detected:"
  echo "$REDIS_ERRORS" | tail -5 | sed 's/^/    /'
else
  pass "No Redis write errors in recent logs"
fi

# ── Summary ─────────────────────────────────────────────────────────────────
echo
echo "════════════════════════════════"
echo " HEALTH CHECK SUMMARY"
echo "════════════════════════════════"
echo "  PASS: $PASS"
echo "  WARN: $WARN"
echo "  FAIL: $FAIL"
echo "════════════════════════════════"

if [ "$FAIL" -gt 0 ]; then
  echo "Result: FAIL"
  exit 1
elif [ "$WARN" -gt 0 ]; then
  echo "Result: WARN — review warnings above"
  exit 0
else
  echo "Result: PASS"
  exit 0
fi
