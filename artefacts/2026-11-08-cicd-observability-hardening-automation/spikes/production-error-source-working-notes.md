# Working notes: Where can production errors be read reliably?

**Brief:** artefacts/2026-11-08-cicd-observability-hardening-automation/spikes/production-error-source-brief.md
**Date:** 2026-11-12
**Progress:** steps 2 and 4 done (documentation and local source only). Steps 1 and 3 (production reads) are waiting for the operator's approval. Steps 5 and 6 (comparison and outcome) are not started. These notes are inputs to the outcome, not the outcome.

---

## Step 2: Fly documentation (sources: docs.fly.io/monitoring/logs-api-options, fly.io/docs/monitoring/logging-overview, fly.io/blog/shipping-logs)

- **HTTP Logs API:** `GET /api/v1/apps/:app_name/logs`, authenticated with a token that has read access to the app. No query language; filters by region or instance; pages with `next_token` (a nanosecond Unix timestamp) so it can backfill. Default result is the most recent 100 logs from the last 24 hours. It is the only option with history: "the current retention window (about 7 days)". Rate limits and cost are not stated. The page says it is not officially supported for external use, though mostly stable because flyctl depends on it.
- **`fly logs` CLI:** uses the same internal API, so its limits are those defaults (100 most recent lines in the last 24 hours) plus the region and instance filters. No `--since` flag exists. This explains both the broken workflow and why only about 100 lines came back in the earlier smt-s1 check.
- **NATS stream** (`logs.<app>.<region>.<instance>`): live only, no retention, experimental, no delivery guarantees (a community post says the same). Not usable for a scheduled job.
- **Log shipper:** forwards logs onward from the moment it connects (no backfill) to Loki, Datadog, Elastic, Honeycomb or S3, where they are queried afterwards. Retention then depends on the chosen sink; no figure is given.
- **Retention figures disagree across Fly pages:** about 7 days (Logs API page), 30 days (one page on Grafana search), and an unspecified period (another page). The workflow comment's "7-day retention" matches the Logs API page, so the claim is partly supported, not confirmed for our app.

**What this changes:** the original `flyctl logs --since` is wrong, but the HTTP Logs API with `next_token` paging looks like it could cover a 6-hour interval. That is a candidate the brief did not list separately: "Fly HTTP Logs API, paged". It needs a Fly token with read access, which the existing `FLY_API_TOKEN` secret may already be (unverified), and it carries a stability caveat.

## Step 4: App source (local read only)

- **The known case is logged, not captured.** `tenant_admin_bootstrap_failed` is written with `_logger.warn(...)` in `src/web-ui/routes/auth.js:131` and `console.warn(...)` in `src/web-ui/routes/auth-email.js:91`, then the function returns `false`. Nothing sends it to PostHog. A PostHog-exception route would not have seen it.
- **PostHog exception capture exists but is rare.** `captureException` in `src/web-ui/modules/posthog-server.js:128` sends a `$exception` event; it is called from only two places (`pipeline-state-github-writer.js:251` and `product-rollup.js`, two calls). So PostHog would hold only errors the code already chooses to capture.
- **The app can write to its own database.** `server.js` creates tables at boot (`credit_audit_log`, `sync_log`, `impersonation_audit_log`, `github_first_login`). A table for production error events is consistent with existing practice, whereas the repo file `workspace/incidents.json` is not writable from the running app.
- **No existing error store.** No table or module records application errors today.

## Open for the operator-approved steps

1. Step 1 (production read): how far back the real app's logs go through the CLI, and whether the Logs API returns more than the CLI does. Needs a one-off, read-only call against the production app; asks first.
2. Step 3 (production read): whether PostHog holds any `$exception` events for production. Read-only query; asks first.
3. Whether `FLY_API_TOKEN` in the repo's secrets has read access to the app's logs (checked by the scan's own earlier runs? no: those failed before the request). Can be tested in step 1.

---

## Step 1 result (production read, approved by the operator, 2026-11-12)

- `fly logs -a skills-framework --no-tail` returned exactly 100 lines, with the first at 09:03:57Z and the last at 09:03:58Z: the whole buffer the CLI exposes spans about one second. There were no lines containing `tenant_admin_bootstrap_failed`, and no warn or error lines. So the CLI cannot be used to scan for errors on any interval, which confirms the fault in the scan script goes deeper than the missing `--since` flag.
- The HTTP Logs API (the candidate that pages with `next_token` and holds about 7 days) was NOT successfully tested. Two attempts with the token from `fly auth token` failed (a malformed-header error on the first, a status 0 on the second). Whether the existing `FLY_API_TOKEN` secret can read logs, and how far back the API goes, remain UNKNOWN. Needs a deliberately prepared token and a call that cannot echo it.
- **Incident during this step:** the first failed attempt printed an error message that contained the beginning of the operator's Fly auth token into the session transcript. The operator was told and should treat that token as exposed (revoke or rotate it). No token text is recorded in this file.

## Step 3 result (production read, approved by the operator, 2026-11-12)

- PostHog holds `$exception` events, but only 3 in the last 30 days: 1 on 2026-10-27 and 2 on 2026-10-25, all "Error: Contents API content truncated" (from `product-rollup.js`, one of the two places in the app that call `captureException`).
- So PostHog sees only errors the code chooses to capture. `tenant_admin_bootstrap_failed` and every other `warn`-level line are invisible to it. Using PostHog as the detection source means adding capture calls in the app, which is the "app-side recording" candidate by another route.
- `artefact_commit_failed` also exists as a PostHog event (a deliberate failure signal already emitted), a pattern the redesign could reuse.
