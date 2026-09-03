# Story: Detect truncated Contents API content, fall back to Git Blobs API, and record diagnostics to logs + PostHog

**Epic reference:** None — short-track (bug fix, per CLAUDE.md's short-track path: `/test-plan → /definition-of-ready → coding agent`)
**Discovery reference:** None — short-track skips discovery; scope is the operator-reported/live-reproduced bug below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below

## User Story

As a **Platform maintainer / product owner clicking "Refresh" on a product page for a large connected repo**,
I want **the sync to actually succeed for files GitHub's Contents API can't fully return, and to leave a real, queryable diagnostic trail if it ever fails again**,
So that **the sync doesn't keep silently failing with no data change, and if a new failure mode ever appears, it's diagnosable from PostHog/logs immediately rather than requiring another live incident round-trip**.

## Benefit Linkage

**Metric moved:** Sync success rate for products with a large connected `pipeline-state.json` — the same metric `pst-s1` and `pgft-s1` both targeted, now addressing the actual, empirically-confirmed root cause.
**How:** Live-reproduced on `skills-framework.fly.dev` production, immediately after `pgft-s1`'s own fix was promoted (2026-09-03): the operator clicked Refresh, saw the button briefly show "Syncing…" then revert with no error and no data change ("Last synced 45 days ago" unchanged). Production logs showed the *same* bare `Unexpected end of JSON input` message `pgft-s1` was meant to add diagnostics to — proving the failure is NOT happening in `realFetchPipelineState` (which `pgft-s1` correctly fixed and tested) but in a second, separate, unprotected `JSON.parse(decoded)` call at `src/web-ui/modules/product-rollup.js:532`, one layer downstream in `syncProductRollup`. This is the base64-decoded *content* of GitHub's Contents API response — GitHub's own documented behaviour only reliably returns a complete `content` field for files at or under roughly 1MB; this repo's own connected `pipeline-state.json` is 1.34MB. The Contents API response always includes the blob's `sha` regardless of file size, and GitHub's separate Git Blobs API (`GET /repos/{owner}/{repo}/git/blobs/{sha}`) returns full content for files up to 100MB — a well-defined, documented fallback path for exactly this situation.

## Architecture Constraints

- Adds a second D37 injectable adapter function to `src/web-ui/adapters/pipeline-state-fetch-adapter.js`: `realFetchBlobBySha(owner, repo, sha, accessToken)`, with its own `setPipelineStateBlobFetchAdapter`/`getPipelineStateBlobFetchAdapter` pair, matching this file's existing pattern exactly (throw-on-unwired stub default).
- Extracts the retry-with-backoff loop `pgft-s1` built for `realFetchPipelineState` into a small shared helper (`_fetchTextWithRetry(url, headers)`) reused by both `realFetchPipelineState` and the new `realFetchBlobBySha` — avoids duplicating the exact same retry logic twice. Both functions keep their own distinct external contracts; only the internal retry mechanics are shared.
- `syncProductRollup` (`src/web-ui/modules/product-rollup.js`) gains truncation detection: after receiving `raw` from `realFetchPipelineState`, compare the base64-decoded byte length of `raw.content` against GitHub's own reported `raw.size` field (present on every Contents API response, regardless of file size). A mismatch — or the decode+parse throwing outright — triggers the Git Blobs API fallback using `raw.sha` (also always present).
- **Diagnostics are unconditional, not gated behind the failure path alone.** Whenever truncation is *detected* (decoded length ≠ reported size), log it and send a PostHog event, regardless of whether the Blobs API fallback then succeeds — this makes the true frequency of this condition observable across all products, not just ones that ultimately fail outright.
- Reuses `posthog-server.js`'s existing `capture`/`captureException` functions (already used elsewhere in this codebase, e.g. `products.js`'s `client_agency_comment_created` event) — no new PostHog integration code, just new call sites with story-specific event names and properties.
- Normal-sized files (decoded length matches reported size) are entirely unaffected — no Blobs API call, no added latency, behaviourally identical to today.
- No new npm dependencies.

## Dependencies

- **Upstream:** `pgft-s1` (merged, PR #820) — this story's own root cause was only discoverable because `pgft-s1`'s retry+diagnostics, once live in production, definitively proved the failure was NOT in the code path they protected, narrowing the search to the one remaining unprotected `JSON.parse` call.
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given `syncProductRollup` receives a Contents API response whose base64-decoded `content` length does not match the response's own `size` field, When this mismatch is detected, Then it is logged server-side (`console.error`) and sent to PostHog via `captureException`, with properties including the product/repo identifiers, the reported size, and the actual decoded length — before any fallback is attempted.

**AC2:** Given a truncation is detected (per AC1), When the fallback runs, Then `syncProductRollup` fetches the full content via the Git Blobs API (`realFetchBlobBySha`, using the Contents API response's own `sha` field) instead of the truncated `content`, decodes and parses *that* response, and proceeds with the rollup computation exactly as if the original fetch had returned complete content.

**AC3:** Given the Blobs API fallback itself also fails (network error, parse error, or non-ok HTTP response), When this happens, Then the failure is logged and sent to PostHog via `captureException` with a distinguishing property (e.g. `fallbackAttempted: true`) so it's clear from PostHog alone whether the *original* fetch or the *fallback* failed, and the error still propagates up to `handlePostProductSync`'s own existing `.catch(...)` (`pst-s1`), never crashing the client.

**AC4 (regression guard):** Given a normal Contents API response where the decoded `content` length matches the reported `size` (the common case for every other connected repo today), When `syncProductRollup` runs, Then it behaves exactly as before this story — no Blobs API call is made, no new log lines are emitted, and the rollup is written unchanged.

## Out of Scope

- Building a PostHog dashboard or alert for these new events — this story only adds the instrumentation; visualizing/alerting on it is a follow-up the operator can configure directly in PostHog once events start flowing.
- Retrying the Blobs API fetch with the same backoff pattern as the Contents API fetch beyond what the shared `_fetchTextWithRetry` helper already provides — the shared helper's existing 3-attempt/backoff behavior applies to both paths automatically; no additional Blobs-specific retry tuning is in scope.
- Handling files that exceed the Git Blobs API's own 100MB ceiling — no connected repo in this platform is anywhere close to that size; revisit only if a future repo's `pipeline-state.json` approaches that scale.
- Migrating away from the Contents API entirely for the common (small-file) case — the Contents API remains the primary path; the Blobs API is strictly a fallback for the truncation condition this story detects.

## NFRs

- **Performance:** The common case (small file, no truncation) is unaffected. The truncation-detected case adds one additional GitHub API round-trip (the Blobs API fetch) before the rollup can proceed — acceptable since this entire flow already runs in the background (`pst-s1`'s fire-and-forget design), not blocking any HTTP response.
- **Security:** None identified — the Blobs API call uses the same caller-supplied OAuth token (ADR-020) and the same tenant-scoped product/repo resolution already in place; no new external input surface.
- **Accessibility:** None identified — no client-facing/rendered-UI component.
- **Audit:** The new PostHog events (`product_sync_content_truncated`, and the `captureException` calls) are the audit trail this story exists to create — server-side/analytics-only, never returned to the client, consistent with `pst-s1`'s and `pgft-s1`'s own design (background failures are a developer-facing diagnostic).

## Complexity Rating

**Rating:** 2 — the retry-loop extraction is a straightforward refactor, and the Blobs API itself is a well-documented, directly analogous GitHub REST endpoint (same base64/encoding contract as the Contents API). The one residual unknown is empirical, not architectural: this story is built on strong circumstantial evidence (GitHub's own documented ~1MB Contents API threshold, this repo's own 1.34MB file, and the confirmed absence of `pgft-s1`'s diagnostic text in the actual failure log) rather than a captured raw GitHub API response showing the literal truncated byte count — AC1's own diagnostics are partly *how* this story provides the final, direct confirmation, not just a symptom of an already-fully-proven cause.
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
