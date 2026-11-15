## Story: Make the product page fast by caching per-feature decisions and running independent reads in parallel

**Epic reference:** None - short-track (bounded performance defect found by the operator in live use, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery; scope stated below. The operator reported the product page as very slow on 2026-11-15; a read-only production measurement (operator-approved) and a code read found the cause. Companion story `ppp-s2-nav-query-and-page-weight.md` covers the smaller items.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui]

## User Story

As **a signed-in person opening a product page**,
I want **the page to open in a couple of seconds instead of about sixteen**,
So that **I can use the product view without waiting, and without a few reloads exhausting the GitHub rate limit**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Measured on production v189 (signed-in tab, GET only): skills-framework product page 16.3 s and 15.7 s to first byte on two consecutive loads (so nothing is cached), against 0.5 s for `/products` and `/dashboard`.
**How:** the page makes one live GitHub request per feature slug (about 355 for skills-framework) to read `artefacts/<slug>/decisions.md`, six at a time, on every view, and about half of those files do not exist. This story caches those results and refreshes them in the background, and runs the handler's other independent reads in parallel.

## Architecture Constraints

- **Where the cost is.** `handleGetProductView` in `src/web-ui/routes/products.js` (urpv-s3 block) calls `_decisionsReactiveSource.fetchReactiveDecisionsForFeatures(owner, repo, slugs, token)` (`src/web-ui/modules/decisions-reactive-source.js`). That result feeds both the "Reactive decisions" section and the pod rollup tab (`computePodRollup`), so the data must still be complete and present on every render; deferring only the section to a later request is not enough and is out of scope.
- **Cache design (decided at test-plan).** In-memory, in `decisions-reactive-source.js`, keyed by `owner/repo/slug`. Stale-while-revalidate: a fresh entry (younger than the TTL constant, default 5 minutes) is served as is; a stale entry is served immediately and refreshed in the background (at most one refresh in flight per key); a missing entry is fetched and awaited (this is the only slow path: the first view after a server start). "File not found" is cached as an empty list. A failed fetch (network, rate limit, 5xx) is NOT cached and does not replace an existing entry (the stale value keeps being served). Entry count is capped (default 2000, oldest evicted) so memory is bounded.
- **Cold-path speed-up.** The fetch concurrency constant rises from 6 to 16 so the unavoidable first load is shorter. GitHub's secondary rate limits are the ceiling; the story does not exceed 16.
- **Access control (ADR-025).** The cache is only read from inside `handleGetProductView` after the existing tenant-ownership check of the product and with that product's own repo owner/name; it holds repository content the same signed-in tenant members can already see on that page. The cache function never receives or stores the token, and the token is not part of the key.
- **Parallel reads.** In `handleGetProductView`, reads that do not depend on one another are started together with `Promise.all`, with each read's existing error handling preserved (reads that currently swallow errors still swallow them to the same fallback value).
- **Adapter rule (D37).** No new injectable adapter is introduced; the existing `fetchRepoPath` adapter stays as the single read path. A test seam for the clock and the fetch function uses a setter with a stub that throws if unwired is NOT needed because the module defaults to the real fetcher and `Date.now`; the setters used by tests only replace those defaults.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-025 (tenant isolation) engaged as above; ADR-011 (artefact-first) satisfied by this story's own chain; no other Active ADR engaged.
- **Zero new npm dependencies.** Plain in-process Map.

## Dependencies

- **Upstream:** urpv-s3 (decisions.md as reactive source), merged. None other.
- **Related, not blocking:** `ppp-s2` (sidebar query and page weight).

## Acceptance Criteria

**AC1:** Given a product whose features' decisions have been fetched within the TTL, When the product page is viewed again, Then no GitHub request is made for any of those slugs and the same items are returned.

**AC2:** Given a cached entry older than the TTL, When the page is viewed, Then the stale items are returned immediately (without waiting for GitHub) and exactly one background refresh per slug is started; once it finishes, the next view returns the refreshed items.

**AC3:** Given a feature slug with no `decisions.md` (the fetch reports not found), When it is viewed twice within the TTL, Then the second view makes no request for it and returns no items for it.

**AC4:** Given a fetch that fails (network error, rate limit or server error), When it happens on a cold slug, Then that slug yields no items and nothing is cached for it (a later view retries); when it happens on a stale slug, Then the previous items are kept and keep being served.

**AC5:** Given the cache, When more distinct slugs than the cap are stored, Then the cache never holds more than the cap and the oldest entries are the ones dropped.

**AC6:** Given `handleGetProductView`, When it renders, Then the independent reads (journey rows, rollup, modules, module assignments, nav summary, default pod, incident store) are started together rather than one after another, and the rendered page is unchanged for the same data.

**AC7:** Given the cold path, When many slugs are fetched, Then at most 16 requests are in flight at once.

**AC8 (live, after deploy):** Given the operator's signed-in production session, When the skills-framework product page is timed read-only, Then time to first byte is under 3 s on the second and later loads (the first load after a deploy is not required to meet this and is reported). Evidence class `production-observed`.

## Out of Scope

- Changing what the page shows or its layout; deferring the section to a later request.
- The sidebar nav query, the HTML size and log noise (companion story ppp-s2).
- Replacing the GitHub reads with the already-synced rollup (possible later story).
- Sharing the cache across server machines (each Fly machine warms its own).
- Pre-warming the cache at startup (needs a user token; not available).

## NFRs

- **Security:** the token is neither stored nor part of the cache key; slug validation (`SAFE_SLUG_RE`) stays in front of every fetch and cache key; nothing from one product's repo is returned for another (key includes owner and repo).
- **Performance:** AC8; the cache lookup itself is O(1).
- **Reliability:** a failed refresh never empties a previously good entry; the module still never throws to its caller.
- **Memory:** bounded by the entry cap.

## Complexity Rating

**Rating:** 2 - one module gains a small cache; one handler is reordered; behaviour must stay identical for the same data.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
