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

---

## Step 6 result (production read, approved by the operator, 2026-11-13)

- Two read-only calls against the production PostHog project, no log content involved: the list of service names in resource attributes returned nothing, and the count of all log entries over the last 7 days returned 0.
- So PostHog Logs holds no logs for this project today. Nothing in it can be used as a detection source until the app sends logs there. Whether the product is enabled for the project (or needs enabling in settings) is still unconfirmed; an empty result does not distinguish "not enabled" from "enabled but nothing sent".

## Step 8: skipped (operator agreed, 2026-11-13)

The Fly HTTP Logs API test was not run. The earlier steps point away from log polling (CLI buffer of about one second; the API is documented as unsupported for external use), and running it needs a deliberately prepared token. It stays recorded as untested, not as ruled out on evidence.

---

## Addendum 2026-11-13: purpose-built error trackers and full-stack observability (documentation and web search only; no accounts, no production access)

Requested by the operator after the outcome was confirmed: the aim is the best option for full-stack observability that feeds issue creation and fixing. The earlier candidate list tested logs and explicit capture only; it did not assess error-tracker products or exception autocapture. Figures below are from vendor pages and search summaries, several secondhand, and need re-checking on live pages before anything is built.

### PostHog Error Tracking (posthog.com/docs/error-tracking/installation/node, /alerts, /pricing)

- **Capture:** `posthog-node` v5 option `enableExceptionAutocapture: true` captures uncaught exceptions and unhandled rejections. Express swallows errors internally, so autocapture alone misses them; `setupExpressErrorHandler(posthog, app)` is also needed. `captureException` covers caught errors. Warnings are not covered by the page. Needs file system access to process stack traces. `shutdown()` must run before exit to flush the batch.
- **Alerts:** triggers are issue created or reopened (filterable by issue properties) and spike alerts when an issue's rate rises above its baseline. Destinations are Slack, Discord, Teams and an HTTP webhook; email only for trend alerts. GitHub issue or Linear creation is not mentioned on the alerts page. A webhook would need a small receiver that calls the GitHub API (inference, not documented).
- **Price:** 100,000 exceptions per month free, billed per `$exception` event, not per issue. Per-product retention not found; account-level free plan retention is stated as 1 year.
- **Fit:** already a dependency and already holds the project token; no new vendor or secret to send. Existing `captureException` calls would be superseded by autocapture.

### PostHog beyond errors

- **Logs:** OTLP ingestion confirmed earlier (50 GB per month free). Empty for this project today because nothing is sent.
- **Tracing:** PostHog supports distributed tracing over OpenTelemetry, with span query tools (secondhand: mirrors of PostHog's own skill file).
- **Metrics:** no evidence found of a metrics product. Host-level metrics remain with Fly.

### Sentry free Developer plan

- 5,000 errors per month, one user, email alerts; some sources also list 5M spans and 5 GB logs. Retention figures conflict (3, 14 or 30 days).
- GitHub issue management and sync: Sentry's docs say they are for Team and above; whether alert-driven issue creation works on the free plan is unconfirmed. A new vendor, account and privacy review.

### Grafana Cloud free plan (third-party aggregators only; grafana.com not read)

- 10K active metric series, 50 GB logs, 50 GB traces, 14-day retention, 3 users. The only candidate covering all four signals (errors via logs and traces, logs, traces, metrics) on one free plan. Whether webhook alert contact points are free was not confirmed. A new vendor and a privacy review.

### What this changes

- **PostHog autocapture plus Express handler replaces the hand-built recorder for thrown errors.** It supplies grouping, counts, spike and new-issue alerts, and a webhook, so the app need not build any of that.
- **Warn-level cases still need handling:** `tenant_admin_bootstrap_failed` is a warn line that returns false. It needs either an explicit capture call or a raise to error level.
- **The bridge from alert to GitHub issue and incident record is still needed** whichever product is chosen: a webhook receiver, or a scheduled job reading the product's API.
- **OTel stays the portability layer.** Logs and traces can go to PostHog now and to Grafana Cloud or another backend later without app changes. Metrics are the one signal PostHog does not appear to cover.
- Unverified and needed before deciding: alert webhook payload and custom headers, exception retention, whether scrubbing can strip tenant data from stack traces and messages, and whether Teams-style destinations matter (Teams is not in use).

### Addendum 2026-11-13, follow-up: the three unverified PostHog items (documentation and web search only)

- **Webhook payload and custom headers:** PostHog's webhook destination (posthog.com/docs/cdp/destinations/webhook) sends a POST with a templated JSON body, the body can be customised, and the test panel can log responses. The official page does not document headers or authentication. Search results indicate destinations are Hog functions whose request headers are an input (default `Content-Type`), so an `Authorization` header can be added as a header entry; an unofficial mirror shows this. A Hookdeck guide mentions encrypted "secret headers", unconfirmed. The firewall page lists PostHog's public IP addresses. Retry behaviour is undocumented. STATUS: probable but not confirmed; confirm in the destination UI with a throwaway endpoint before relying on it.
- **Exception retention:** the error-tracking pricing page states no exception-specific retention and says stored exceptions do not affect the bill. The closest documented figure is the free plan's 1-year events retention (data may move to cold storage and query slowly after that). A PostHog post dated 2026-11-05 says existing free organisations keep 1 year. STATUS: 1 year is the working figure, unconfirmed for exceptions specifically; ample for this use.
- **Scrubbing tenant data:** PostHog's pages say message text and exception details are NOT scrubbed automatically. A `beforeSend` hook that runs on each built payload, including the `$exception` event, can modify or drop it (secondhand, from PostHog's MCP privacy page; the Node library page documents `beforeSend` only for metrics and `beforeSpanSend` for traces, and does not list `beforeSend` for exceptions). So scrubbing is something the app must do itself, and whether `beforeSend` covers `$exception` in `posthog-node` is unconfirmed. Fallback that does not depend on it: wrap `captureException` and the Express handler so the message is replaced with a fixed code plus a fingerprint before sending. STATUS: scrubbing is the app's job; the mechanism needs a local test.
- **Other findings:** `posthog-node` also has traces (`beforeSpanSend`, `recordException`) and a `metrics` client option. This contradicts the earlier "no evidence of metrics" note: PostHog may support metrics ingestion. Unverified; check before saying PostHog lacks metrics. The documented exception option names (`enableExceptionAutocapture`, `setupExpressErrorHandler`) come from the error-tracking install page, not the library page.

Net effect: all three items are documented well enough to proceed, but none is confirmed end to end. Each should be a first test in the story (a throwaway webhook receiver, a seeded exception checked for tenant text, a check of `beforeSend` on `$exception`) rather than an assumption.

---

## POC results 2026-11-13: checks 1 and 2, local only (operator: no new PostHog project, do 1 and 2, 3 if possible on the current project)

Method: a scratchpad script ran the installed `posthog-node` 5.40.0 against a local HTTP sink with a fake key (no network egress, no PostHog project touched), behind a plain `http.createServer` whose handler mirrors `createApp()` in `src/web-ui/server.js` (`router(req, res).catch(...)`). Script lives in the session scratchpad, not in the repo.

- **The app does not use Express.** `express` is not installed; `setupExpressErrorHandler` does not apply. The app's single catch point for failing requests is the `.catch` in `createApp()` (server.js, around line 5229), so one `captureException` call there covers every thrown request error. The app also already registers `unhandledRejection` and `uncaughtException` handlers (around line 5238) that only log and swallow; SDK autocapture hooks in alongside them.
- **Check 1, capture (local):** a thrown request error, captured with `captureException` in that catch, produced an `$exception` event with `$exception_list` (type, message, stack frames). An unhandled rejection was captured by `enableExceptionAutocapture` even though the app's own handler swallows it. A `console.warn('tenant_admin_bootstrap_failed ...')` line produced NO event, as predicted: warn-level lines need an explicit capture call or a raise to error level.
- **Check 2, scrubbing (local):** `before_send` (snake_case in the SDK; the docs I found said `beforeSend`) runs on `$exception` events and the message in `$exception_list[0].value` could be rewritten, so the runtime message is scrubbable. BUT the stack frames also carry source context lines (the code around the throwing line, `context_line` plus pre and post context). In the test those lines contained the test string because the test's own source hard-coded it. In the real app they would hold source code, not runtime tenant data, but it means fragments of this repo's source are sent to PostHog with each error. Not yet checked: whether the SDK has an option to switch context lines off.
- **Existing manual captures likely do not group.** `captureException` in `src/web-ui/modules/posthog-server.js` posts hand-built `$exception` events with `$exception_type`, `$exception_message` and `$exception_stack_trace_raw` and no `$exception_list`, which is not the shape the SDK produces. Whether PostHog Error Tracking shows them as issues is unchecked (needs a production read of the 3 existing events' properties).
- **Existing client:** the app already creates a `posthog-node` client in `src/web-ui/modules/posthog-config.js` (feature flags), with no exception options. Autocapture and the exception captures could reuse that client.
- **Check 3, webhook: NOT run.** It needs a publicly reachable receiver URL and a destination created on the live PostHog project (an account configuration change), and real events in the project, which needs the production project key. The key is a Fly secret and `.env` has none locally. Options if wanted: a temporary public receiver (a third-party test-endpoint service, sample payload only), or confirm in the PostHog UI by hand.
