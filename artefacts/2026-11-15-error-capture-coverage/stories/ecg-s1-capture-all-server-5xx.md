## Story: Report every server error to the error chain, not only the ones the router catches

**Epic reference:** None - short-track (bounded defect found by a production sweep, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/error-sweep-findings.md`. Six deliberate bad-id requests returned 500 on production, PostHog held no `$exception` events afterwards and no GitHub issue was opened.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **the operator of the platform**,
I want **every server error that returns a 5xx to a signed-in person to be reported to error tracking**,
So that **the alert, GitHub issue and incident-record chain I built actually sees the errors users hit, instead of only the few that call capture by hand**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Coverage of the error chain: today it sees an error only if it reaches the outer router catch (`server.js` around line 5264) or calls capture explicitly (3 call sites, all login bootstrap). The code has 48 explicit 500 responses in 15 route files, and `authGuard` (`src/web-ui/routes/auth.js` lines 610 to 616) answers a failed handler with a plain-text 500 itself, so errors in almost every logged-in route never reach the chain.
**How:** report the actual error in `authGuard`, add one safety net at the server entry so any other 5xx response is reported once, and report unhandled promise rejections.

## Audit result (done before writing this story)

- 48 `writeHead(500` or `status(500)` sites across 15 files (journey.js 14, products.js 8, server.js 5, sign-off.js 3, auth.js 3, and 10 other files with 1 or 2); a further 32 sites answer 502, 503 or 504.
- 3 capture call sites outside the capture module: two in login bootstrap, one in the router catch.
- Process-level: `uncaughtException` is covered by the capture client's autocapture (a listener exists at init); `unhandledRejection` is logged only.
- Patching each response site by hand would leave future sites uncovered, so the design is one chokepoint plus the one place that holds the real error (`authGuard`).

## Architecture Constraints

- **One report per request.** The capture module marks the request once it has reported it (a flag on the request object passed in the context), so the real-error report from `authGuard` or the router catch and the safety-net report for the same 5xx response never both fire.
- **Safety net at the single entry point.** In `createApp` (server.js), wrap `res.writeHead` for each request: when the status is 500 or above and the request has not been reported, call `captureServerError(new Error('http_<status>'), { code: 'http_5xx', url: req.url, req })`. The response itself is never changed or delayed.
- **`authGuard` reports the real error.** `handleGuardedError` calls `captureServerError(err, { url: req.url, req })` before it writes the 500, inside its own try/catch so a failing capture never changes the 500.
- **Unhandled rejections.** The `unhandledRejection` handler also reports, with code `unhandled_rejection`.
- **Privacy (existing scrub, unchanged).** All reports go through the existing `scrubEvent` allow-list; messages are replaced by the code and routes are reduced to `/<known root>/:p/...`. No new fields are sent.
- **Grouping (existing rule).** Fingerprint stays `environment|code|route`, so one group (one GitHub issue) per route and code; repeats of the same failure do not open more issues.
- **Never changes behaviour.** A capture that throws (including the not-wired case) is swallowed; status codes, bodies and headers are byte-identical to today.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-025 (tenant isolation) not engaged, no tenant data is added; no other Active ADR engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** coha-s5 (error capture module and wiring), coha-s6 and coha-s7 (alert, bridge, incident record), all merged and live.
- **Related, not blocking:** `uid-s1` (malformed ids should be 404, not 500) and `anf-s1` (slow artefact 404), from the same sweep. This story goes first so those fixes can be seen working through the chain.

## Acceptance Criteria

**AC1:** Given a logged-in route whose handler rejects, When the request is made, Then exactly one error report is sent with the thrown error and the route's label, and the response is still the same plain-text 500.

**AC2:** Given a logged-in route whose handler throws synchronously, When the request is made, Then exactly one error report is sent and the response is still the same 500.

**AC3:** Given any route that answers with a 5xx status without throwing (for example 500 or 503 written directly), When the request is made, Then exactly one report with code `http_5xx` and the route label is sent and the response is unchanged.

**AC4:** Given an error that is both caught by a handler path and ends in a 5xx response (the router catch, or `authGuard`), When the request is made, Then exactly one report is sent in total, not two.

**AC5:** Given responses with status below 500 (200, 302, 404), When requests are made, Then no report is sent.

**AC6:** Given error capture is not wired or its client throws, When any of the above happens, Then the response is unchanged and no exception escapes.

**AC7:** Given an unhandled promise rejection, When it occurs, Then it is logged as today and one report with code `unhandled_rejection` is sent; the process does not exit.

**AC8 (live, after deploy, operator approval needed because it opens a GitHub issue):** Given a signed-in production session, When the operator (or the agent with the operator's approval) requests one known-bad URL such as `/products/not-a-uuid`, Then within a few minutes one GitHub issue and one incident-record PR appear for that route, and a second identical request does not open another. Evidence class `production-observed`.

## Out of Scope

- Fixing the underlying bugs (malformed id 500s, slow artefact 404): stories `uid-s1` and `anf-s1`.
- Browser-side JavaScript errors (the sweep saw none; whether the client reports them is a separate question).
- Changing alert thresholds, the bridge or the incident record.
- Changing response bodies or status codes of any route.
- Rewriting the 48 response sites.

## NFRs

- **Security and privacy:** reports pass the existing scrubber; no new data leaves the server.
- **Performance:** one function wrap per request, no extra I/O on the request path; the client queues and flushes in the background as today.
- **Reliability:** capture failures never reach the caller; no duplicate reports for one request.

## Complexity Rating

**Rating:** 2 - small code, but the dedupe and "never change behaviour" rules need careful tests.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
