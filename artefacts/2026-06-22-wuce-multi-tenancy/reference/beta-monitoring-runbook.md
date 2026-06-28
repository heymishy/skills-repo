# Beta Monitoring Runbook

**Feature:** wuce-multi-tenancy
**Story:** s5.1 — Beta monitoring signals
**Audience:** Operator (single-person deployment)
**Deployment:** Fly.io — `fly logs --app <APP>`

---

## Overview

This runbook covers the three most likely failure modes during the 5–10 user beta. No full APM infrastructure is required. All signals are surfaced via Fly.io log streaming and a lightweight health-check script.

Automated check: `bash scripts/check-beta-health.sh` (set `APP=<fly-app-name>` first).

---

## Failure Mode 1 — Billing Gate Fire

**What it is:** A tenant has reached `MAX_JOURNEYS_PER_TENANT` and subsequent journey creation requests are blocked with HTTP 402.

**Why it matters:** Expected behaviour when the cap is working correctly; needs monitoring to confirm the gate is live and to detect any tenant hitting the cap unexpectedly.

**Log query:**

```bash
fly logs --app <APP> | grep "Journey limit reached"
```

**Expected log format:**

```
[journey-store] Journey limit reached for tenant <tenantId> (cap=<N>)
```

The log line is emitted by the `POST /journey` route handler in `src/web-ui/routes/skills.js` whenever `createJourney()` returns a `limitReached` result.

**Remediation:**

- If expected (tenant hit their cap): no action required.
- If unexpected (wrong tenant, wrong cap value): check `MAX_JOURNEYS_PER_TENANT` secret — `fly secrets list --app <APP>` — and update if needed: `fly secrets set MAX_JOURNEYS_PER_TENANT=<value> --app <APP>`.
- If the gate is NOT firing when it should: confirm the secret is set and run `bash scripts/check-beta-health.sh` to check health endpoint.

---

## Failure Mode 2 — Postgres Write Error

**What it is:** A journey mutation (create, stage completion, field update) failed to persist to Neon Postgres. The in-memory store still holds the current state, but the data will be lost on restart.

**Why it matters:** Fire-and-forget async writes do not block the HTTP response. An error here is silent from the user's perspective but causes data loss on the next server restart.

**Log query:**

```bash
fly logs --app <APP> | grep "PG write error"
```

**Expected log format:**

```
[journey-store] PG write error: <error message>
```

Emitted by the catch handler in `src/web-ui/modules/journey-store.js` `_pgWrite()`.

**Remediation:**

- Check Neon console at console.neon.tech — confirm the database is up and has remaining compute quota.
- Verify `DATABASE_URL` secret is still set: `fly secrets list --app <APP>`.
- If `DATABASE_URL` was accidentally unset: `fly secrets set DATABASE_URL=<neon-url> --app <APP>` then redeploy.
- After restoring connectivity, any journeys modified during the outage will have been written to the in-memory store only. Those journeys will be lost on the next restart. Manual reconciliation via the Neon SQL editor may be required if any users had active sessions during the outage.

---

## Failure Mode 3 — Redis Session Write Error

**What it is:** A session write to Upstash Redis failed after login or during a session mutation. The in-memory session store still has the session, but it will not survive a server restart.

**Why it matters:** Fire-and-forget Redis writes do not block the HTTP response. An error here is silent from the user's perspective but causes session loss on the next server restart (user is logged out).

**Log query:**

```bash
fly logs --app <APP> | grep "Redis write error"
```

**Expected log format:**

```
[session] Redis write error: <error message>
```

Emitted by the catch handler in `src/web-ui/middleware/session.js` `persistSession()`.

**Remediation:**

- Check Upstash console at console.upstash.com — confirm the database is up and within daily request quota (free tier: 10,000 commands/day).
- Verify Upstash secrets are still set: `fly secrets list --app <APP>` — check `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`.
- If credentials were rotated in Upstash dashboard: update secrets with new values and redeploy.
- After restoring connectivity, affected users will need to re-authenticate. This is a recoverable, non-data-loss event — journeys are still persisted in Postgres.

---

## Composite Health Check

Run `bash scripts/check-beta-health.sh` to execute all three checks in sequence:

1. `GET /health` — confirms the app is running (HTTP 200 expected)
2. Billing gate pattern scan — warns if `Journey limit reached` appears in recent logs
3. PG write error scan — fails if `[journey-store] PG write error` appears
4. Redis write error scan — fails if `[session] Redis write error` appears

Exit code: 0 = PASS or WARN, 1 = FAIL.

**Metric linkage:**

- **M1 (Authorization coverage rate):** `GET /health` returning 200 confirms the guarded app is live. Any unexpected 403/404 spike in logs indicates the guard is misfiring — check `TENANT_ORG_ALLOWLIST` configuration.
- **M2 (Cross-tenant leakage prevention):** Redis and PG errors during a multi-user session can indicate cross-tenant interference. If two tenants report errors simultaneously, review Neon query logs for any shared-key patterns.
