# Spike Brief: Which observability approach fits this app's production error detection?

**Feature:** 2026-11-08-cicd-observability-hardening-automation
**Discovery reference:** artefacts/2026-11-08-cicd-observability-hardening-automation/discovery.md
**Date:** 2026-11-12
**Status:** CONFIRMED by the operator (Hamish King) on 2026-11-12 ("Looks good"). REVISED the same day at the operator's request ("Yes") to widen the question from "where can errors be read" to "which observability approach fits" and to raise the scope to Thorough. Steps 1 to 4 already ran under the original scope; their results are in the working notes (`production-error-source-working-notes.md`). Any further production read needs the operator's approval at the time it runs.

---

## Parent discovery context

- **Problem statement:** Production errors are noticed by luck. The only scanner built for this, the scheduled Production Log Scan (coha-s4, PR #1069), has failed on every run since it shipped.
- **Why it fails today (verified 2026-11-12):** `scripts/production-log-scan.js` runs `flyctl logs --since 24h --no-tail`; `flyctl logs` has no `--since` flag (checked against `fly logs --help`), so it exits 1, and the script discards flyctl's error text. Its tests assert the argument list against a mock and never run the real CLI.
- **Facts already known that shape the question:** `fly logs --no-tail` exposes only the last 100 lines, and the real production buffer measured on 2026-11-12 spanned about one second; the earlier smt-s1 production check hit the same limit (11 of 14 migration log lines were gone). Fly's docs describe an HTTP Logs API with about 7 days of history, not officially supported for external use, and not yet tested. `TEAMS_WEBHOOK_URL` is empty, so a match would notify nobody. The incident record store is a file in the repo (`workspace/incidents.json`), which the running production app cannot write. PostHog holds only 3 `$exception` events in 30 days because the app captures exceptions explicitly in two places; caught, warn-level errors such as `tenant_admin_bootstrap_failed` never reach it. `pino` and `posthog-node` are already dependencies.
- **Assumption this spike tests:** that the right way to detect production errors is to poll the platform's logs. The evidence so far says no.
- **Open question flagged in the incident-triage discovery:** initiative 2 owns alert generation, including production-log scanning; initiative 1 consumes incidents once they exist. Neither has a working source of real production errors.

## Use case the options are judged against

- One production app on Fly (`skills-framework`) and one staging app, run by a small team with a solo operator.
- The goal is to detect known error patterns, record them as incident records and feed the triage drafter. It is not full application performance monitoring.
- Tenant data can appear in logs, so sending logs to a third party is a privacy question, not only a cost question.
- Cost has to be close to zero, and the result has to work without Teams (not in use).

---

## Spike question

Which observability approach best fits this app's need to detect known production errors and record them, judged against the criteria below, and should detection be a scheduled poll, a query of a log backend, or the app recording the error itself when it happens?

## Blocking

The redesign of coha-s4 (production-log scanning and notification). It also blocks pinning the triage drafter's provisional similarity threshold, because that needs a real recorded incident, and the first real incident should come from a working detection path.

## Type

3 — Design decision between approaches (with a type 4, real-data check, in the steps already run and in step 8).

## Scope

**Thorough** (up to 10 steps), widened from Standard (6) because there are more candidates and more criteria. If the done condition is met earlier, stop.

Steps 1 to 4 are done (see the working notes):
1. Measured the real Fly log buffer through the CLI (production read, approved): about one second.
2. Read Fly's documentation on retention, the Logs API, NATS and log shipping.
3. Queried PostHog for `$exception` events (production read, approved): 3 in 30 days.
4. Read the app source for how errors are logged and caught.

Remaining steps:
5. Documentation check of the OpenTelemetry (OTel) route: the packages needed to forward `pino` logs as OTLP (OpenTelemetry's wire format), how much setup they need, and what the app would emit for a caught error.
6. Documentation and settings check of PostHog Logs as an OTLP destination: whether it is enabled for this project, retention, price, whether it can be queried on a schedule or alerted on, and whether `query-logs` returns anything today. Querying the project is a production read: ask first.
7. Documentation check of two other hosted OTLP backends (Grafana Cloud and Honeycomb) for free-tier limits, retention and alerting. Documentation only, no accounts.
8. Test the Fly HTTP Logs API with a deliberately prepared read-only token supplied through an environment variable, with error output suppressed so the token cannot be echoed. Production read: ask first. Skip if the earlier steps already point away from log polling.
9. Compare all candidates against the criteria in the done condition.
10. Write the outcome and recommendation.

## Done condition

A comparison table covering at least these candidates: Fly CLI polled (already ruled out by step 1), Fly HTTP Logs API paged, a `pino` transport writing errors to the app's own database, explicit PostHog exception capture at known failure points, OTel logs to PostHog, OTel logs to another hosted backend, and a Fly log shipper to an external service. Each is assessed on:
1. Reliability: whether an error can be detected within one scan interval without being missed, using measured figures where steps 1 to 8 produced them.
2. Standards and portability: whether it uses OTel so the backend can change without changing the app.
3. Footprint: new dependencies and lines of code, and the setup an operator must do.
4. Cost per month and operator effort to keep it running.
5. Privacy: how tenant data is kept out of logs, or whether a third party receiving them is acceptable.
6. Delivery: how a detection reaches a person without Teams, and whether it can create an incident record.

The outcome ends with one recommended path and a note on whether the chosen standard leaves room for metrics and tracing later, or states that no candidate works within scope.

## Out of scope

Building any of the candidates; changing Fly, PostHog or GitHub account configuration; creating accounts with other vendors; Teams notification (on hold until Teams is in use); alert thresholds and the full list of error patterns; fixing the existing script (it is being disabled, not repaired); metrics, tracing and dashboards (only whether the chosen standard leaves room for them later); anything beyond read-only access to production.

## Constraints

- Read-only on production at every step. Each production read is approved by the operator first; a classifier denial is not worked around.
- No secrets are written to the artefact, and credentials are never printed. A command that handles a token must not be able to echo it, including in error messages: the 2026-11-12 attempt at step 1 exposed part of a Fly auth token in the session because a failed call printed its request header. Any further token use is prepared deliberately by the operator first.
- No edits to `.github/pipeline-state.json` or `workspace/incidents.json` by the investigator; state changes happen afterwards through the normal commands.

## Outcome options

- **PROCEED:** one approach is confirmed workable. Record the choice in the feature's `decisions.md`, and write the coha-s4 redesign story against it (real CLI or API call in the test, errors surfaced, a destination that works without Teams).
- **REDESIGN:** polling logs is ruled out, but app-side recording or an OTel route works. The coha-s4 story changes shape: for example the app emits a record or an OTLP log when a known error occurs, and a small job reads that.
- **DEFER:** no approach is workable without spend, credentials or privacy review the project does not have. Production error detection stays manual, and the disabled workflow stays disabled.
