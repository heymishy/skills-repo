## Story: Answer 404 Not Found, not 500, when a malformed id is in the URL

**Epic reference:** None - short-track (bounded defect found by a production sweep, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/error-sweep-findings.md`, finding 2. `/products/not-a-uuid`, `/products/%00`, `/products/%E0%A4%A`, `/products/<SQL-looking text>`, `/journeys/not-a-uuid` and `/journeys/%00` all returned 500 on production; a well-formed but unknown uuid correctly returned 404.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **a person following a mistyped, stale or hand-edited link**,
I want **a "not found" answer instead of a server error**,
So that **it is clear the link is wrong, and the operator's error chain does not fill with issues for requests that are not bugs**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Removes a class of false server errors: once ecg-s1 is live, every one of these requests would open a GitHub issue for something that is not a defect.
**How:** the cause is one database error. The id from the URL is passed straight into a query on a column of type uuid, and Postgres refuses a value that is not a uuid (SQLSTATE `22P02`, message `invalid input syntax for type uuid: "<value>"`). Rather than patching each of the many routes that take an id, translate that one error, at the two places that already turn failures into a 500 (`authGuard` and the router catch), into 404 Not Found.

## Audit result (done before writing this story)

- The uuid columns are `products.product_id`, `customer_journeys.id`, `customer_journey_stages.id`, `product_modules.id`, `pods.pod_id` and others; routes that take an id from the path or query include `/products/:id` and its sub-routes, `/journeys/:id` and its sub-routes, pods and modules, so a per-route fix would be many edits and would miss the next one.
- The server passes the raw path segment to the query (no decoding), so every malformed value in the sweep produced the same database error.
- The two places that answer a failed handler with 500: `authGuard`'s error handler (guarded routes) and the router catch in `createApp` (the rest).

## Architecture Constraints

- **Narrow classifier, so real bugs stay visible.** A failure is treated as "bad id in the URL" only when (1) it is a database error with `code === '22P02'` and a message of the form `invalid input syntax for type uuid: "<value>"`, and (2) the quoted `<value>` is non-empty and appears in the request url (raw or percent-encoded). A uuid error whose value did not come from the URL (for example an empty string from a server-side bug) stays a 500 and is reported.
- **One helper, two call sites.** A small module `src/web-ui/utils/invalid-id-error.js` exports `isInvalidIdError(err, req)`; `authGuard` and the router catch both call it first and, on a match, answer 404 and skip error reporting. Everything else is exactly as today.
- **The 404 body matches the existing unknown-id answer** (`{"error":"not found"}`, `application/json`, status 404) as already written by `handleGetProductView` for a well-formed but unknown id.
- **No reporting for client mistakes.** A matched request is not sent to error tracking (it is not a defect); it is logged with one line.
- **Never writes twice.** If the response has already started, nothing more is written and nothing throws.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-025 (tenant isolation) not engaged: a malformed id now looks the same as an unknown id, which leaks nothing; no other Active ADR engaged.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** ecg-s1 (every 5xx is now reported; this story removes the false ones). Not blocking: both can ship independently, but the live check for this story is stronger after ecg-s1 is live.
- **Related:** `anf-s1` (slow artefact 404).

## Acceptance Criteria

**AC1:** Given a logged-in route whose handler fails with a uuid-syntax database error and the offending value is in the request url, When the request is made, Then the response is 404 with `{"error":"not found"}` as JSON, and no error report is sent.

**AC2:** Given a route that is not behind the login guard and fails the same way, When the request is made, Then the response is the same 404 and no error report is sent.

**AC3:** Given a uuid-syntax database error whose offending value is not in the request url (or is empty), When it happens, Then the response stays 500 and one error report is sent, exactly as before.

**AC4:** Given any other failure (a different database error, a thrown error, a rejected handler), When it happens, Then behaviour is exactly as before: 500 and one report.

**AC5:** Given a response that has already started, When a matching error arrives, Then nothing further is written and nothing throws.

**AC6:** Given the real product page and journey page handlers, When requested with a malformed id (`not-a-uuid`, `%00`, a broken percent escape, SQL-looking text), Then each answers 404, not 500, and a well-formed unknown uuid still answers its existing 404.

**AC7:** Given a real Postgres, When a query compares a uuid column to a non-uuid value, Then the error carries `code` `22P02` and a message of the form the classifier parses (so the assumption is proven against the real database, not a mock). Runs only when a throwaway database URL is supplied; refuses non-local databases.

**AC8 (live, after deploy):** Given a signed-in production session, When `/products/not-a-uuid` and `/journeys/not-a-uuid` are requested, Then both answer 404 and no new GitHub issue appears. Evidence class `production-observed`. (If the ecg-s1 live check was run first, it will already have opened one issue for the old 500; that issue is closed with the operator.)

## Out of Scope

- Slow artefact 404s (`anf-s1`).
- Validating ids at each route before querying (the central translation covers them; per-route validation can follow if wanted).
- Changing any existing 404 or 400 answer; changing well-formed-id behaviour.
- Non-uuid malformed input (for example a bad integer or JSON): different database errors, left as they are until seen.

## NFRs

- **Security:** malformed and unknown ids are indistinguishable to the caller; no database text is returned; the value is never echoed.
- **Reliability:** the classifier never throws (a surprising error shape simply does not match).
- **Performance:** none; runs only on the failure path.

## Complexity Rating

**Rating:** 1 - one small helper, two call sites, well-understood behaviour.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
