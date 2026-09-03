# Story: Retry the GitHub Contents API fetch on transient/parse failure, with diagnostic error detail on exhaustion

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/live-reproduced bug below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer / product owner clicking "Refresh" on a product page for a large connected repo**,
I want **the server's own GitHub Contents API fetch to retry on a transient network failure or a truncated response, and to log real diagnostic detail if it still fails**,
So that **an intermittent network-layer blip doesn't silently fail my sync with no data change, and if it does still fail, the server log actually explains why instead of a bare, unhelpful parse error**.

## Benefit Linkage

**Metric moved:** Sync success rate for products with a large connected `pipeline-state.json` (operational reliability, not a formal benefit-metric artefact — short-track). Same underlying metric `pst-s1` targeted, now addressing a second, distinct failure mode along the same path.
**How:** Live-reproduced on `skills-framework.fly.dev` production, immediately after `pst-s1`'s own fix was promoted (2026-09-03): the operator clicked Refresh, saw no crash (confirming `pst-s1`'s own fix works — the client-facing timeout bug is resolved), but also saw no data change. Server logs (`flyctl logs --app skills-framework`) showed: `[product-sync] background sync failed for product dd3fbea3-8cb5-46dd-97e1-8bd7725185e4: Unexpected end of JSON input` — the exact same error signature as the original bug, now happening in the *outbound* GitHub Contents API fetch (`src/web-ui/adapters/pipeline-state-fetch-adapter.js`'s `realFetchPipelineState`) rather than the inbound client-to-server request `pst-s1` fixed. This repo's own connected `pipeline-state.json` is 1.34MB (237 features at last count) — GitHub's Contents API base64-encodes file content, inflating the actual response body to roughly 1.8MB, making this repo one of the largest (if not the largest) files this adapter has to fetch, which is consistent with an intermittent large-response truncation rather than a universal failure.

## Architecture Constraints

- Reuses `realFetchPipelineState`'s existing external contract unchanged: `Promise<{content: string, encoding: string}>`, the raw GitHub Contents API response shape — callers (`syncProductRollup` and its own base64-decode step) are untouched.
- Switches the response-reading step from `res.json()` to `res.text()` followed by `JSON.parse()` — functionally equivalent on success, but lets the failure path report the actual received byte count against the response's own `Content-Length` header for diagnosis (AC2). This requires updating the two pre-existing test mocks in `tests/check-pr-s2-pipeline-state-fetch-adapter.js` (T3, T6) that return a `.json()`-only fake `Response` object for an `ok:true` response — real `fetch()` Response objects always provide both `.json()` and `.text()`, so this is a realistic mock-fidelity fix, matching `pst-s1`'s own precedent (`pcr-s1`/`pst-s1` decisions.md pattern: update a pre-existing test whose mock shape no longer matches the code path it exercises, don't route around it).
- Only two failure classes are retried: a thrown network-level error from `fetch()` itself, and a `JSON.parse()` failure on an otherwise-`ok` response. A non-`ok` HTTP status (404/403/rate-limit/etc) is never retried — retrying an auth/permission failure wastes GitHub API rate-limit quota for no benefit and was already correctly a hard, immediate failure before this story; that behaviour is preserved unchanged (T4 in the existing test file continues to pass with no mock changes, since the non-ok branch never reaches the new `.text()` call).
- No new npm dependencies — the retry loop and backoff delay are plain `setTimeout`-based, matching this codebase's existing no-framework style (e.g. `annotation-writer.js`'s own inline 409-conflict retry).
- Downstream of `pst-s1`: this story does not touch `handlePostProductSync`'s own fire-and-forget response timing or background-failure-logging (`.catch(...)` → `console.error`) at all — that mechanism already works correctly (confirmed live: this exact failure was caught and logged, not left as an unhandled rejection or a client-visible crash). This story only makes the underlying fetch itself more resilient and its failure message more diagnosable.

## Dependencies

- **Upstream:** `pst-s1` (merged, PR #819) — this story's own failure was only discoverable because `pst-s1`'s background-failure logging surfaced it; before that fix, this exact same underlying truncation was indistinguishable from the reverse-proxy-timeout bug `pst-s1` fixed (both manifested identically to the end user as "Unexpected end of JSON input").
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given the GitHub Contents API fetch for `.github/pipeline-state.json` either throws a network-level error, or returns an `ok` response whose body fails to `JSON.parse`, When this happens, Then the adapter retries up to 2 additional times (3 total attempts) with a short linear backoff (500ms, then 1000ms) before giving up, rather than failing on the first transient blip.

**AC2:** Given all 3 attempts are exhausted on a JSON-parse failure specifically, When the final error is thrown, Then its message includes concrete diagnostic detail: the actual number of bytes received in the response body, and the response's own `Content-Length` header value (or "absent"/"unavailable" if not present) — so a recurrence is diagnosable from server logs alone, unlike the current bare `Unexpected end of JSON input`.

**AC3:** Given a non-`ok` HTTP response (404, 403, rate-limited, etc), When it occurs, Then it is never retried and fails immediately with the existing `Failed to fetch pipeline-state.json: HTTP [status]` message, unchanged from today — retries are reserved for genuinely transient network/parse failures only.

**AC4 (regression guard):** Given all retries are exhausted (any failure class), When the final error propagates up through `triggerProductSync` and `handlePostProductSync`, Then `pst-s1`'s own background-failure-logging behaviour is unaffected — the failure is still caught via `.catch(...)` and logged server-side with `console.error`, never surfacing as a client-visible crash and never becoming an unhandled promise rejection.

## Out of Scope

- Reducing `pipeline-state.json`'s own size — that is the separate, already-approved `2026-09-03-pipeline-state-archive-completed-features` initiative. A smaller file makes this less likely to recur, but does not address the underlying transient-failure resilience gap this story fixes, which would still be a latent risk for any sufficiently large connected repo regardless of this one file's own size.
- Switching to GitHub's Git Blobs/Trees API as an alternative to the Contents API for large files — a larger architectural change with its own tradeoffs (different response shape, different rate-limit accounting), not needed if retry-with-backoff resolves the observed intermittent failures; revisit only if this story's own fix is later found insufficient.
- Respecting GitHub's `Retry-After` header for rate-limit-specific backoff — out of scope since AC3 explicitly does not retry non-ok responses at all (rate-limit responses are non-ok and fail immediately, unchanged); a rate-limit-aware retry policy would be a separate, deliberate scope decision, not a default extension of this story's own transient-failure retry.
- Any change to the five rollup-computation functions (`computeDodStatusRollup`, `computeHealthCounts`, etc) or the `product_rollups` UPSERT — this story only touches the GitHub fetch step that precedes them.

## NFRs

- **Performance:** Worst case (all 3 attempts fail) adds up to ~1.5s of retry-backoff delay before the background sync ultimately fails — negligible against this story's own background/fire-and-forget execution model (`pst-s1`), since no HTTP response is waiting on this duration.
- **Security:** None identified — no new external input, no new attack surface; the same `Authorization: Bearer [token]` header and Contents API endpoint are used unchanged across retries.
- **Accessibility:** None identified — this story has no client-facing/rendered-UI component.
- **Audit:** The new diagnostic error detail (received byte count, Content-Length header) is written only to server-side logs via the existing `console.error` call in `handlePostProductSync`'s `.catch(...)` — never returned to the client, consistent with `pst-s1`'s own design (background failures are a developer-facing diagnostic, not a user-facing error).

## Complexity Rating

**Rating:** 2 — the retry-and-diagnose pattern itself is well understood and low-risk (a bounded, linear-backoff retry loop around an existing fetch call), but there is residual ambiguity about whether retry-with-backoff alone will actually resolve the underlying truncation in production (the true root cause — Fly egress networking, GitHub's own response behavior at this file size, or something else — is not yet confirmed with certainty, only strongly inferred from the symptom pattern). If this story's own fix is deployed and the failure recurs identically even after retries, that would be new evidence pointing toward a harder, more persistent cause (e.g. a GitHub API size-tier behavior) requiring further investigation as a follow-up, not a sign this story's own implementation was wrong.
**Scope stability:** Stable.

## Definition of Ready Pre-check

<!-- Filled in by /definition-of-ready -->

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
