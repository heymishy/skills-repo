## Story: Put the error type and route in the issue title, and keep the real error code

**Epic reference:** None - short-track (bounded defect found by a production sweep, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/error-sweep-2-findings.md`, finding 4. GitHub issues #1108 and #1109 are both titled just `request_error` with a body of a time and a PostHog link, so they look identical and cannot be triaged without opening PostHog.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **the operator reading the GitHub issues the error chain opens**,
I want **each issue's title to say what failed and where**,
So that **I can tell issues apart and decide what to fix without opening PostHog for every one**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Makes every issue and incident-record pull request self-describing; today three different bugs produced issues titled only `request_error` or `unhandled_exception`.
**How:** the PostHog alert destination sends the exception's first value as the issue's `code`, and the bridge uses it as the title (checked in the destination's body template: `"code": "{event.properties.$exception_values[1]}"`). The scrubber currently sets that value to the bare code. It already knows the error type (from a fixed allow-list) and the route label (from a fixed vocabulary), both safe to send, so it can put them in the value. No PostHog or bridge change is needed.
**Second defect fixed here:** ecg-s1 introduced the codes `http_5xx` and `unhandled_rejection`, but the scrubber's allow-list does not include them, so both are rewritten to `unhandled_exception` and the distinction is lost. They are added to the allow-list so the real code survives.

## Architecture Constraints

- **Format:** for any exception that is not one of the fixed allow-listed messages, the exception value becomes `<code>: <Type> at <route>`, for example `request_error: URIError at /journey/:p/:p/:p`. `<code>` is from the allow-list of codes, `<Type>` from the allow-list of error types, `<route>` is the scrubbed route label. Nothing else from the error or the request is added.
- **Allow-listed fixed messages are unchanged** (today only `tenant_admin_bootstrap_failed`): the value stays exactly that message.
- **Codes:** `http_5xx` and `unhandled_rejection` are added to the allow-list of codes; any other unknown code is still rewritten to `unhandled_exception`.
- **Grouping is unchanged.** The PostHog fingerprint stays `<environment>|<code>|<route>` and is never derived from the value. Adding two codes means errors that were previously grouped under `unhandled_exception` for a route will open one new issue under their real code; that is intended.
- **Privacy rule unchanged:** the title contains only fixed-vocabulary pieces; no tenant text, message text, id or query value can appear (the existing canary tests are kept and extended).
- **Limits still satisfied:** the longest possible title (the longest allowed code, the longest type, a route label of the maximum eight segments) is under the bridge's and the incident script's 120-character limit and has no control characters.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; no other Active ADR engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** coha-s5, coha-s6, ecg-s1 (the scrubber, the bridge and the extra codes). Merged.
- **Related:** `ecf-s1` (frames carry a function name so events become issues at all).

## Acceptance Criteria

**AC1:** Given an error that is not an allow-listed fixed message, When it is scrubbed, Then the exception value is `<code>: <Type> at <route>` built only from the allow-listed code, the allow-listed type (or `Error`) and the scrubbed route label.

**AC2:** Given the allow-listed fixed message `tenant_admin_bootstrap_failed`, When it is scrubbed, Then the value is exactly that message, as before.

**AC3:** Given the codes `http_5xx` and `unhandled_rejection`, When an event carries one, Then the scrubbed `code` is preserved; and given an unknown code, Then it is still rewritten to `unhandled_exception`.

**AC4:** Given an event whose message, route, frames and properties contain canary strings (tenant names, ids, query values, an `@`-address), When it is scrubbed, Then no canary appears anywhere in the output, including the new value.

**AC5:** Given the longest possible value (the longest code, `AggregateError`, and a route label of eight segments plus `/...`), When it is validated by the error bridge (`handlePostErrorBridge`) and by the incident-record script (`codeProblem`), Then both accept it.

**AC6:** Given the same code and route, When events are scrubbed before and after this change, Then the PostHog fingerprint is identical (grouping unchanged).

**AC7 (live, after deploy):** Given the ecf-s1 live check is run (one request to `/skills/discovery/sessions/00000000-0000-0000-0000-000000000000/result`), When the issue opens, Then its GitHub title reads `http_5xx: Error at /skills/:p/:p/:p/:p`. Evidence class `production-observed`. (If the ecf-s1 check ran before this deploy, the title of that existing issue is the old form; repeat the request after this deploy only if the operator approves another issue.)

## Out of Scope

- Changing the issue body or labels, or adding more fields to the webhook.
- Fetching extra detail from PostHog or GitHub.
- Retitling existing issues.
- Any change to the PostHog alert destination.

## NFRs

- **Security/privacy:** only fixed-vocabulary pieces reach PostHog and GitHub (public issues); no new input-derived text.
- **Reliability:** a scrub error still drops the event (fail closed, as today); the value is built without throwing.
- **Performance:** none.

## Complexity Rating

**Rating:** 1 - one expression in the scrubber, two entries in an allow-list, a handful of edited assertions.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
