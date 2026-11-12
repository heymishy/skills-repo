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

---

## Steps 5 to 7: documentation checks (2026-11-12, web search and page fetches only; no accounts, no production access)

Figures below come from vendor pages and search summaries, and the pages disagree in places. They are inputs to the comparison, to be re-checked on the live pricing pages before anything is built.

### Step 5: OpenTelemetry (OTel) route for pino logs

- **Packages** (PostHog's own pino guide, posthog.com/docs/logs/installation/pino): `@opentelemetry/sdk-node`, `@opentelemetry/exporter-logs-otlp-http`, `@opentelemetry/sdk-logs`, `@opentelemetry/resources`, `@opentelemetry/instrumentation-pino`; for ES modules also `@opentelemetry/instrumentation`. Five or six new packages. An alternative is the single package `pino-opentelemetry-transport`, which sends pino output to an OTLP collector without the instrumentation.
- **How it works:** the pino instrumentation hands each log event to the OTel Logs SDK while pino keeps writing JSON to stdout. So the existing Fly stdout logging stays as it is, and the OTLP export is added alongside it.
- **Setup shape:** one init file creating a `NodeSDK` with a `BatchLogRecordProcessor` wrapping an `OTLPLogExporter` and `PinoInstrumentation`, loaded before the app (`node --require ./instrumentation.js`, or `--import` with a `.mjs` file for ES modules). Endpoint and headers can come from environment variables (`OTEL_EXPORTER_OTLP_ENDPOINT`, `OTEL_EXPORTER_OTLP_HEADERS`).
- **Caveats:** the instrumentation must load before `pino` is imported, or nothing is sent; pino v7 to v10 only; batching can drop the last batch on shutdown unless `shutdown()` runs; the app already handles `SIGTERM`, so the shutdown call must go inside the existing handler. Package versions vary across guides, so check current versions before pinning.
- **Open for this app:** the app's `_logger` is injected in some places and `console.warn` is used in others (for example `auth-email.js:91`), so a caught error logged with `console.warn` would not be forwarded unless it is moved to pino.

### Step 6 (documentation part): PostHog Logs as an OTLP destination

- **Ingestion:** a plain OTLP receiver. URL `https://us.i.posthog.com/i/v1/logs` (EU: `eu.i.posthog.com`), header `Authorization: Bearer <project token>` (the `phc_` token, not a personal API key). The project token is the same kind of write-only key the app already uses for event capture, so no new read secret is needed for sending.
- **Free tier:** the first 50 GB per month is free; afterwards $0.25 per GB up to 300 GB, then $0.15 per GB. One older blog figure says 10 GB, which appears to refer to tracing.
- **Retention:** conflicting. The pricing docs say 14 days by default; the GA announcement says 7 days. Longer retention is a paid add-on at $0.05 per GB per month, with no free tier.
- **Alerting and querying:** the docs say alerts can be set up in the web app and that the API can "query logs and manage alerts, saved views, and sampling rules programmatically". They do not say what triggers an alert on log matches, how notifications are delivered, or whether queries can be scheduled. This session also has a `query-logs` tool and a `logs` table in the PostHog connection, which suggests the product is enabled for the account; that has NOT been checked (it is a production read, pending the operator's approval).
- **Privacy:** the page mentions PII scrubbing but gives no detail on how it works. Whether tenant data in log attributes would be scrubbed is unknown.

### Step 7: other hosted OTLP backends

- **Grafana Cloud free plan:** 50 GB of logs per month, 14 days of retention, 3 monthly active users. Over the limit, new log samples are dropped for that month rather than billed. Paid plans start at 30 days.
- **Honeycomb free plan:** up to 20 million events per month and 2 triggers; retention and users not stated on the page; the pricing page lists OpenTelemetry support but does not state logs over OTLP, so its fit for logs is unconfirmed.

### What steps 5 to 7 change in the comparison

- OTel to PostHog is feasible with documented packages and no new vendor. Its unknowns are alert delivery, retention (7 or 14 days, both enough for a 6-hour interval), PII scrubbing, and whether `console.warn` call sites need moving to pino.
- Grafana Cloud is comparable on volume and retention but adds a vendor, an account and a privacy review. Honeycomb is weaker for logs and unconfirmed.
- None of the hosted options removes the need for something to poll or alert and then record an incident; the app-side database table does not either, but it keeps everything inside systems we already run.
