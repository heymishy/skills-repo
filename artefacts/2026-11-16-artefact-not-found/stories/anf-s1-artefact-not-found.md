## Story: Answer "artefact not found" quickly, and never 503, for a link that cannot name an artefact

**Epic reference:** None - short-track (bounded defects found by a production sweep, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/error-sweep-2-findings.md`, finding 3 (and the earlier ~6 s artefact-not-found finding). On production `/artefact/%00/%00` and `/artefact/%E0%A4%A/...` returned 503 (GitHub issue #1110, closed by the operator), and a plain unknown artefact name took about 6 s to answer 404.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **a person following a mistyped, truncated or stale artefact link**,
I want **a fast "artefact not found" page instead of a 6 second wait or a "please try again" error**,
So that **it is clear the link is wrong, and the operator's error chain does not report a request that is not a bug**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Removes a false 503 (which tells the person to retry something that will never work) and cuts the wait for a missing artefact from about 6 s to about one GitHub round trip.
**How:** two changes in the artefact route. (1) Before any GitHub request, a slug or artefact type that cannot name an artefact (control characters, a `%` left over from a broken escape, `..` or empty path segments, over-long) is answered with the same "artefact not found" 404 page the route already shows. Today the raw value is put into the GitHub URL, the request fails, and the failure is shown as a 503. (2) The speculative subdirectory probes for a bare legacy name (up to 22 sequential requests, 3 s timeout each) run at the same time instead of one after another, with the same priority order for the result.

## Architecture Constraints

- **Same 404 page, same status as today's unknown artefact:** `renderShell` page titled "Artefact Not Found", body `<p>artefact not found</p>`, 404, `text/html`. No echo of the requested value; no new page.
- **Allow-list, not block-list.** Slug: `^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$`. Artefact type (after the route's existing decode): `^[A-Za-z0-9][A-Za-z0-9._/-]{0,191}$`, and no `..` and no empty segment (`//`). Every real slug in `artefacts/` and every link the app generates (`dor/psh-s1-dor`, `discovery`) must pass; the tests assert this against the real `artefacts/` directory listing.
- **Auth first, unchanged:** an unauthenticated request still gets the 302 to `/` before any check.
- **Probe semantics preserved.** Parallel probing keeps today's result: candidates are examined in the same order and the first candidate (in that order) that is found wins; a non-404 failure at an earlier candidate than any hit still raises `ArtefactFetchError` (503), as the sequential loop did. The two direct attempts and the trace-based resolution are unchanged. Call count stays at most 24.
- **Real upstream failures stay 503** (GitHub down, timeout, 5xx): only requests that cannot name an artefact are re-classified.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-012 (fetching stays in the adapter; the route only validates its own inputs) respected; ADR-025 (tenant isolation) not engaged. Path traversal guard (CLAUDE.md) is strengthened, not weakened: a traversal-shaped type never reaches GitHub.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** ure-s1 (the broken escape on the other routes), ecg-s1. Both merged.
- **Related:** `scr-s1` (held; unrelated route).

## Acceptance Criteria

**AC1:** Given a signed-in request to `/artefact/:slug/:type` where the slug or the decoded type contains a control character (`%00`), a leftover `%` (a broken escape such as `%E0%A4%A`), or is empty or over-long, When the request is made, Then the response is 404 with the "artefact not found" page, no GitHub request is made, and no error report is sent.

**AC2:** Given a type with a `..` segment, an empty segment (`a//b`), or a leading `/` or `.`, or a slug with `/` or `..`, When the request is made, Then the same 404 and no GitHub request.

**AC3:** Given a well-formed request (slug `2026-01-01-example-feature` with type `discovery`, `dor/psh-s1-dor`, or a name containing `.`), When the request is made, Then it fetches and renders exactly as before; and every directory name under the real `artefacts/` passes the slug check.

**AC4:** Given the real server route table and a signed-in test session, When `/artefact/%00/%00` and `/artefact/%E0%A4%A/discovery` are requested, Then each answers 404 and the GitHub fetch is never called; and an unauthenticated request still gets 302.

**AC5:** Given a bare artefact name that does not exist (every GitHub request answers 404 after 150 ms in the test), When `fetchArtefact` runs, Then it throws `ArtefactNotFoundError` in under 1.5 s (the sequential loop needs about 3.6 s with the same delays).

**AC6:** Given parallel probing, When candidates resolve in a different time order than the priority order, Then the first candidate in priority order that exists is returned; a non-404 failure at an earlier candidate than any hit still raises `ArtefactFetchError`; and the total number of requests is at most 24.

**AC7:** Given a real upstream failure (the fetcher raises `ArtefactFetchError`), When the request is made, Then the response is still 503 "Unable to load artefact", as before.

**AC8 (live, after deploy):** Given a signed-in production session, When `/artefact/%00/%00` and `/artefact/some-unknown-slug/not-a-real-artefact` are requested, Then the first answers 404 quickly with no new GitHub issue, and the second answers 404 in noticeably under the old ~6 s. Evidence class `production-observed`.

## Out of Scope

- Caching negative lookups, or changing the probe list (`ARTEFACT_SUBDIRS`).
- The `/api/` artefact routes and any other route that fetches from GitHub.
- Retrying or backing off on GitHub rate limits.
- Changing any existing 404 or 503 page text.

## NFRs

- **Security:** the requested value is never echoed or logged; a traversal-shaped value never reaches GitHub; the 404 for a rejected value is indistinguishable from the 404 for an unknown artefact.
- **Reliability:** validation never throws.
- **Performance:** an unknown bare name costs one GitHub round trip (bounded by the 3 s probe timeout) instead of up to 22 in sequence. Cost: a legacy bare-name hit now issues all probes at once (at most 24 requests, the same ceiling as today's worst case).

## Complexity Rating

**Rating:** 1 - one validation function in the route, one loop turned concurrent in the adapter.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
