## Story: Production error capture to PostHog with tenant text scrubbed

**Status:** DRAFT run 3, awaiting re-review. Revised 2026-11-13 after `review/coha-s5-review-1.md` (2 HIGH, 4 MEDIUM, 3 LOW) and `review/coha-s5-review-2.md` (1 HIGH, 2 MEDIUM, 1 LOW). First half of a split; the bridge that opens GitHub issues is coha-s6. Replaces the detection half of coha-s4 (bounded production-log scan). Scope note: the 2026-11-13 entries in `decisions.md` ("spike outcome" and its amendment) are the approved scope change away from log scanning; the discovery assumption and epic goal that still say "Fly.io production logs" are superseded by them.
**Epic reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/epics/coha-e1-detect-and-alert.md
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Benefit-metric reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/benefit-metric.md
**Spike evidence:** artefacts/2026-11-08-cicd-observability-hardening-automation/spikes/production-error-source-outcome.md and production-error-source-working-notes.md
**Decision reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/decisions.md (entries dated 2026-11-13)

## User Story

As a **delivery engineer**,
I want to **production errors captured automatically, grouped into issues in PostHog, with tenant data and source lines removed before they leave the app**,
So that **a production defect like the still-unfixed `tenant_admin_bootstrap_failed` bug is recorded the moment it happens, without anyone having to notice it by luck and without sending tenant data to a third party**.

## Benefit Linkage

**Metric moved:** Production-defect detection latency (Metric 4)
**How:** today detection is manual and the earlier scan never worked. This story records each production error in PostHog at the moment it happens, which gives the "defect appeared" timestamp. It does not tell a person: the metric only starts moving when coha-s6 opens a GitHub issue from that record. Metric 4's measurement method and the Metric Coverage Matrix are revised to name coha-s5 and coha-s6 in place of the log scan (coha-s4).

## Architecture Constraints

- **A dedicated capture module, not a change to the feature-flag client.** New `src/web-ui/modules/error-capture.js` creates its own `posthog-node` client (constructor injectable for tests) with `enableExceptionAutocapture: true` and a `before_send` hook. The existing flag client in `posthog-config.js` is left unchanged, so feature-flag evaluation and its bri-s1.2 test are not touched. The key comes from `resolvePostHogApiKey(envName, process.env)` (staging key for staging, production key for production, never a fallback), the same rule the flag client follows.
- **Wiring follows the injectable adapter rule (D37):** the module exposes `initErrorCapture(envName, env, deps)` called once at startup in `server.js`, and `captureServerError(err, context)`. Before it is wired, `captureServerError` throws `Adapter not wired: error-capture. Call initErrorCapture() with a real implementation before use.` The caller in `createApp()` wraps the call so that a capture failure, including the not-wired throw, is logged loudly and never changes the 500 response or crashes the process. The plan names the startup wiring as its own task; the wiring test starts the real server startup path and asserts a differentiating outcome (an event reaches a local sink carrying the environment's key), not that a function reference was assigned.
- **The app has no Express.** The single catch point for failing requests is the `.catch` in `createApp()` in `src/web-ui/server.js` (around line 5228), and one `captureServerError` call there covers every thrown request error. To let tests drive the real catch block, `createApp(options)` accepts an optional `options.router` that defaults to the real router (found at implementation planning: no route in the real router can be made to throw from outside). The process already registers `unhandledRejection` and `uncaughtException` handlers that only log and swallow (around line 5238); SDK autocapture runs alongside them.
- **Scrubbing is an allow-list in `before_send`, not a deny-list.** For every `$exception` event: the outgoing message becomes the error class plus a fixed code (for example `Error: tenant_admin_bootstrap_failed`); free-text messages are dropped unless the message exactly matches a short code-maintained allow-list; every property other than these named keys is removed: the SDK's own `$exception_list`, `$exception_level`, `$exception_fingerprint` (if present), `$lib`, `$lib_version`, `$is_server`, `$geoip_disable` (the keys observed on a real SDK event in the 2026-11-13 proof of concept), plus `$process_person_profile` (always set to false), `environment`, `route` and `code`, which drops `tenantId` and `reason`; `route` is the matched route pattern (for example `/products/:id`) or a fixed label, never the raw URL or query string; the event's `distinct_id` is a fixed server label (`server-error-capture`), never a person, tenant or caller-supplied id, and person processing is off; `pre_context`, `context_line` and `post_context` are deleted from every stack frame (the SDK has no switch for source lines). The hook is `before_send` (snake case) in `posthog-node` 5.40.0, and a thrown error inside the hook drops the event rather than sending it unscrubbed.
- **Test and environment separation (paes-s1, paes-s2, bri-s1.2):** an `e2e-test-` identity or group never produces an event; staging and production use their own keys with no fallback; every event carries an `environment` property (`staging` or `production`) so that, if the two environments turn out to share one PostHog project, alerts and issues can still be filtered by environment. The operator recalls (2026-11-13) that staging and production use the same PostHog key, that is one shared project; this is unverified (the Fly secrets were not read). If true, the key gives no separation, the `environment` property is the only separation, staging errors appear in the same Error Tracking list as production errors, and coha-s6's alert must filter on `environment = production`.
- **Warn-level errors are not captured by the SDK.** `tenant_admin_bootstrap_failed` is logged at warn level (`auth.js:131` through `_logger.warn` with `reason: err.message`, `auth-email.js:91` through `console.warn`) and returns false. It needs an explicit `captureServerError` call at each place, sending only the fixed code.
- **Existing hand-built exception events** (`captureException` in `posthog-server.js`, called from `pipeline-state-github-writer.js` and `product-rollup.js`) are left as they are; moving them onto the new module is out of scope and recorded as a follow-up, because they use a different event shape and their own e2e guard.
- **Triggered and bounded, never a standing process:** capture happens inside the running app.
- **No new vendor.** OpenTelemetry (OTel) logs and traces stay out of this story.
- **Artefact-first (ADR-011):** this story is the artefact for the new `src/` module.

## Dependencies

- **Upstream:** none. coha-s1 (the Teams adapter) is no longer needed.
- **Operator prerequisites:** the per-environment PostHog keys already used by the flag client (`POSTHOG_KEY_PROD`, `POSTHOG_KEY_STAGING`) are set on the matching Fly apps; confirmation whether the two environments share one PostHog project (the operator recalls they do; a read of the secret names and a comparison that never prints the values would settle it).
- **Downstream:** coha-s6 (the bridge), and through it the incident-triage feature's first real recorded incident.

## Acceptance Criteria

**AC1:** Given a request whose handler throws, When it goes through the real `createApp()` server, Then exactly one `$exception` event with a populated `$exception_list` (type, message, stack frames) reaches a local capture sink, its properties are exactly the named kept keys plus `environment`, `route` and `code`, and the client receives a 500.

**AC2:** Given an unhandled promise rejection occurs while the server is running, When it is raised, Then an `$exception` event reaches the sink and the process keeps running.

**AC3:** Given errors whose messages, properties and request URLs contain tenant data (a tenant name, an email address, a database error string containing an identifier, and randomly generated identifiers created fresh on every test run), When the events are sent, Then none of those values appears in any field of any outgoing payload, including message, properties, `route`, `distinct_id` and stack frame source lines; a request to a URL containing a tenant slug reports only the route pattern; the event keeps its error class, fixed code and stack frames. A message that exactly matches the allow-list is sent unchanged. A thrown error inside `before_send` sends nothing.

**AC4:** Given the real tenant admin bootstrap path fails (through the real route in `auth.js` and the real route in `auth-email.js`), When the failure is logged, Then one `$exception` event with the code `tenant_admin_bootstrap_failed` is captured per failure with no `tenantId` or `reason` in it, and the existing return value (`false`) and log line are unchanged.

**AC5:** Given an error occurs for an `e2e-test-` identity, When the error is raised, Then no event is sent.

**AC6:** Given the PostHog key for the active environment is unset, When the server starts and a request then throws, Then capture is a no-op with a clear startup log line and the request still receives its 500.

**AC7:** Given the server is running as staging, When a request throws, Then the event carries `environment: "staging"` and is never labelled `production`, and the key resolved for staging is used, never the production key, when the two keys differ.

**AC8:** Given the capture endpoint is unreachable or slow, When a request throws, Then the client still receives its 500 within the same time bound as without capture plus 200 milliseconds, the failure is logged without the key, and the process does not crash.

**AC9:** Given the real server startup path runs with test keys and a local sink as host, When a request then throws, Then an event reaches the sink carrying the environment's key and `environment` property. Given `initErrorCapture` has not been called, When a request throws, Then the client still receives a 500 and a "not wired" error is logged loudly (the adapter's stub throws, the caller contains it).

## Out of Scope

- Any remediation or auto-fix; capture only.
- Opening GitHub issues and creating incident records (coha-s6).
- Moving the two existing hand-built `captureException` call sites onto the new module (follow-up).
- OTel logs, traces or metrics, and any second vendor (Grafana Cloud, Sentry). The recorded decision keeps OTel as a later portability layer.
- Teams notification (on hold until Teams is in use).
- Repairing or re-enabling the old Production Log Scan workflow, which is disabled.
- A pattern-definition UI; the fixed-code and allow-list are code-maintained.
- Alert rules and webhooks (coha-s6).

## NFRs

- **Performance:** capture is asynchronous and batched; a PostHog outage must not slow or fail a request (AC8). the app has no shutdown handler today (corrected at implementation planning, 2026-11-13), so the startup wiring registers one minimal `SIGTERM` and `SIGINT` handler that flushes capture for at most 2 seconds and then exits, so the last batch is not lost.
- **Security and privacy:** allow-list scrubbing (AC3); no key, tenant data or source lines in logs or events; the hook fails closed.
- **Isolation:** test and staging traffic cannot reach production issues (AC5, AC7).
- **Cost:** within PostHog's 100,000 free exceptions per month; the story records the number of events one error produces, observed in the AC1 test.
- **Accessibility:** not applicable.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable. The shared-project question changes how much weight the `environment` property carries, not the AC set.

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared
- [ ] Benefit linkage is written
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified
- [ ] Human oversight level confirmed from parent epic
- [ ] Shared-versus-separate PostHog project fact confirmed by the operator
