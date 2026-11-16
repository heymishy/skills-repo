## Story: Observe JavaScript errors in the browser, safely and in observation-only mode

**Status:** DRAFT for operator review. Not yet through `/test-plan` or `/definition-of-ready`; do not build until the operator approves and the open questions below are answered.
**Epic reference:** None - short-track (bounded gap found by a production audit, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/browser-error-reporting-audit.md` (code reading plus a read-only PostHog check): nothing in the app reports browser JavaScript errors; PostHog exception autocapture is off; only 4 page families load the browser PostHog library.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **the operator of the platform**,
I want **JavaScript errors thrown by our own page scripts to be recorded, scrubbed, without creating work automatically**,
So that **I can see whether browser-side bugs exist and are worth fixing, before deciding to feed them into the GitHub issue pipeline**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Extends error visibility from server 5xx (ecg-s1) to the browser, the one area the production sweeps could not cover: a script that throws leaves a page that looks loaded but does nothing, and no 5xx is ever logged.
**How:** a tiny first-party script in the shared page shell listens for `error` and `unhandledrejection` and sends a fixed-shape report to a new endpoint, which records it through the existing server-side scrubber and PostHog client. Reports are capped, and for the first period they must not reach the GitHub issue pipeline.

## Architecture Constraints

- **First-party only, one scrubber.** The browser sends a small JSON object `{ kind, type, route, script }` and nothing else. The server validates every field against an allow-list (`kind` is `error` or `unhandledrejection`; `type` is one of the existing `ALLOWED_TYPES`, else `Error`; `route` is passed through `routeLabel`; `script` is a path starting `/public/` or the literal `inline`) and records via `captureServerError`-style code `browser_error`. No message text, stack, URL query, login or tenant id is accepted or stored. Anything that fails validation is dropped with a 204.
- **Only our own code is reported.** The script drops events whose filename is not same-origin, drops "Script error." with no filename, and drops errors raised from `chrome-extension:`, `moz-extension:` or `safari-extension:` URLs. (Inline script errors are reported as `inline`.)
- **Volume caps:** the browser sends at most one report per fingerprint (`type|route|script`) per page load and at most 5 per page load; the server keeps a per-fingerprint counter and records at most 20 per fingerprint per hour (in memory is enough; resets on deploy), and the endpoint rejects bodies over 1 KB and non-JSON.
- **Abuse resistance:** the endpoint accepts `POST` only, requires a same-origin `Origin` or `Sec-Fetch-Site: same-origin`, requires the signed-in session or the public-page cookie-less path to be rate limited per IP (decision in DoR), and never echoes the body. It writes nothing but the capped PostHog event.
- **Observation mode (no issue pipeline, no incident PR):** `browser_error` events must not trigger the "coha-s6: error alert to bridge" PostHog destination. How is an open question (see below); the acceptance criterion below fixes the outcome, not the mechanism.
- **Disabled by default behind a flag:** `BROWSER_ERROR_OBSERVATION=on` (env) renders the script and enables the endpoint; unset means no script and a 404 from the endpoint. Zero behaviour change until the operator turns it on.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain once it is complete; ADR-025 (tenant isolation) respected because no tenant data is sent or stored; no CSP exists today, so an inline listener needs none; if a CSP is added later this script must be a `/public/` file. Prefer a `/public/error-observer.js` file loaded from the shell, so a future CSP does not break it.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** coha-s5 (scrubber and client), ecg-s1, ecf-s1, eit-s1. All merged.
- **Related:** the session-replay privacy question in the audit addendum is separate and not a dependency.

## Open questions (answer before DoR)

1. **Keeping observation events out of the issue pipeline.** Options: (a) the PostHog destination "coha-s6: error alert to bridge" gets a filter excluding `code = browser_error` (an operator PostHog change); (b) browser events use a different `environment` value (for example `production-browser`) if the destination matches on `environment = production`, which must be verified read-only first; (c) the endpoint records a plain custom event (`browser_error_observed`) instead of an `$exception`, which never creates an error-tracking issue. Option (c) needs no PostHog change but loses error-tracking grouping. Agent leans (b) if the destination filter allows it, else (c).
2. **Public pages.** The landing page is unauthenticated: include it (rate limited per IP) or only signed-in pages?
3. **Window.** How long does observation run before the operator decides to promote repeatable errors into the issue pipeline (agent suggests two weeks)?

## Acceptance Criteria

**AC1:** Given the flag is unset, When any page and the endpoint are requested, Then no observer script is rendered and the endpoint answers 404.

**AC2:** Given the flag is on, When a page renders, Then the shell includes the observer script, once.

**AC3:** Given a same-origin script error or unhandled rejection in the browser, When it occurs, Then one report `{ kind, type, route, script }` is POSTed, no more than once per fingerprint and 5 per page load.

**AC4:** Given an error from an extension URL, a cross-origin script, or "Script error." with no filename, When it occurs, Then nothing is sent.

**AC5:** Given a valid report, When the endpoint receives it, Then exactly one PostHog event with code `browser_error` is recorded with only allow-listed fields (type, route label, script, kind, environment), and the response is 204.

**AC6:** Given a report with any extra field, an unknown `kind`, a script outside `/public/` or `inline`, a body over 1 KB, a non-JSON body, a cross-origin request, or a non-POST method, When it is received, Then nothing is recorded and the answer is 204 (invalid content) or 405/413 as appropriate, with nothing echoed.

**AC7:** Given a canary string placed in the error message, URL query, route segment, login and script name of a test report, When it is processed, Then the canary appears nowhere in the recorded event.

**AC8:** Given more than 20 identical reports in an hour, When they arrive, Then only the first 20 are recorded.

**AC9:** Given a recorded `browser_error` event, When the issue pipeline's destination evaluates it, Then it creates no GitHub issue and no incident PR (mechanism per the answer to open question 1; verified by a test on the filter or event shape, and live by a read-only PostHog check).

**AC10 (live, after deploy and flag on):** Given a signed-in production session, When a deliberate harmless script error is raised from the browser console, Then one scrubbed `browser_error` event appears in PostHog and no GitHub issue is opened. Evidence class `production-observed`; operator-performed or operator-approved.

## Out of Scope

- Promoting browser errors into GitHub issues and incident PRs (a later story, after the observation window).
- Stack traces, source maps, session replay, breadcrumbs, user identification.
- Failed `fetch` or XHR calls (server 5xx are already reported by ecg-s1; client-side network failures are noise).
- Changing the browser PostHog library setup, its `identify` call, or session replay settings.
- Adding a Content-Security-Policy.

## NFRs

- **Security and privacy:** no free text from the browser is stored; an allow-list on every field; same-origin only; body size limit; canary test (AC7).
- **Reliability:** the observer never throws, never blocks the page, and fails silently (`navigator.sendBeacon` or `fetch` with `keepalive`, errors swallowed); the endpoint never answers 5xx for bad input.
- **Performance:** under 1 KB of script; no work on the page until an error occurs.
- **Cost:** capped at 20 recorded events per fingerprint per hour.

## Complexity Rating

**Rating:** 2 - small code, but a new public-facing endpoint, a privacy allow-list and a PostHog-side routing question.
**Scope stability:** Unstable until the open questions are answered.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity (AC9 depends on open question 1)
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Open questions answered by the operator
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
