## Story: Answer 404 Not Found, not 500, when the URL contains a broken percent-escape

**Epic reference:** None - short-track (bounded defect found by a production sweep, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/error-sweep-2-findings.md`, finding 2. On production, `/journey/<x>/stage/%E0%A4%A` and `/products/<x>/playback-evidence/%E0%A4%A` returned 500 and opened GitHub issues #1109 and #1108 (closed by the operator).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **a person following a mistyped, truncated or hand-edited link**,
I want **a "not found" answer instead of a server error**,
So that **it is clear the link is wrong, and the operator's error chain does not open an issue for a request that is not a bug**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Removes a second class of false server errors (the first was a malformed id, uid-s1): with every 5xx now reported, each broken-escape request opens a GitHub issue and an incident pull request for something that is not a defect.
**How:** the router calls `decodeURIComponent` on path segments in about twenty places; a broken escape such as `%E0%A4%A` makes it throw `URIError: URI malformed`, which becomes a 500. Rather than wrapping each call, translate that one error centrally, in the router catch and `authGuard`'s error handler (the two places uid-s1 already handles), into the same 404 answer.

## Architecture Constraints

- **Narrow classifier, so real bugs stay visible.** The failure is treated as a client mistake only when (1) it is a `URIError` with message `URI malformed`, AND (2) the request's own path really cannot be decoded (decoding the path, or one of its segments, throws). A `URIError` raised from data that did not come from the URL stays a reported 500.
- **Extend the existing helper, do not add a new one.** `src/web-ui/utils/invalid-id-error.js` (uid-s1) gets a second recognised case; `isInvalidIdError(err, req)` and `respondNotFound(res)` keep their names and signatures so both call sites need no change. Everything else is exactly as today.
- **Same answer as uid-s1:** 404, `{"error":"not found"}`, `application/json`; no report; one log line; never writes twice; never throws.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-025 (tenant isolation) not engaged: a broken escape reveals nothing; no other Active ADR engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** uid-s1 (the helper and both call sites), ecg-s1. Both merged.
- **Related:** `anf-s1` (the artefact route also answers 503 for broken escapes; handled there).

## Acceptance Criteria

**AC1:** Given a logged-in route whose handler fails with `URIError: URI malformed` and the request path cannot be decoded, When the request is made, Then the response is 404 with `{"error":"not found"}` as JSON and no error report is sent.

**AC2:** Given the same failure raised in the router itself before any guard (as `decodeURIComponent` in the route table does), When the request is made, Then the response is the same 404 and no error report is sent.

**AC3:** Given a `URIError: URI malformed` raised while the request path decodes fine (so the cause is not the URL), When it happens, Then the response stays 500 and one error report is sent, exactly as before.

**AC4:** Given any other failure (a different `URIError` message, a `TypeError`, a database error, a rejected handler), When it happens, Then behaviour is exactly as before, including the uid-s1 behaviour for malformed ids.

**AC5:** Given a response that has already started, When a matching error arrives, Then nothing further is written and nothing throws.

**AC6:** Given the real server route table, When `/journey/<id>/stage/%E0%A4%A` and `/products/<id>/playback-evidence/%E0%A4%A` are requested (and one other route that decodes a segment, chosen by the audit), Then each answers 404, not 500; and a well-formed encoded segment (`%20`, `%2F`) still decodes and routes as before.

**AC7 (live, after deploy):** Given a signed-in production session, When those two URLs are requested with a well-formed first segment, Then both answer 404 and no new GitHub issue appears. Evidence class `production-observed`.

## Out of Scope

- Wrapping the individual `decodeURIComponent` calls.
- The artefact route's 503 and slow 404 (`anf-s1`).
- Other malformed input (bad JSON bodies, bad query values): different errors, left as they are until seen.
- Changing any existing 404 or 400 answer.

## NFRs

- **Security:** a broken escape and an unknown page are indistinguishable to the caller; no error text is returned; the value is never echoed.
- **Reliability:** the classifier never throws.
- **Performance:** none; runs only on the failure path.

## Complexity Rating

**Rating:** 1 - one added case in an existing helper, no new call sites.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
