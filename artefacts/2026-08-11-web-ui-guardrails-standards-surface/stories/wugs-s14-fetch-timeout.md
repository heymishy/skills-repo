## Story: Add a fetch timeout to the shared GitHub Contents API adapter

**Epic reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/epics/epic-1-repo-backed-viewing.md
**Discovery reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/discovery.md
**Benefit-metric reference:** artefacts/2026-08-11-web-ui-guardrails-standards-surface/benefit-metric.md
**Domain:** [web-ui]
**Track:** Short-track (a known, already-fully-specified NFR gap — reuses this feature's existing discovery/benefit-metric/epic artefacts; starts at story+test-plan per CLAUDE.md's short-track process)

## User Story

As a **tech lead viewing a product's guardrails/standards page**,
I want **a hung GitHub API call to fail with a clear, bounded-time error instead of hanging the page render indefinitely**,
So that **a slow or unresponsive GitHub API degrades gracefully rather than making the whole view appear broken with no explanation** (per `nfr-profile.md`'s own already-recorded Gaps entry, found during `wugs-s2`'s final review on 2026-08-12 and still open as of `/trace`'s 2026-08-14 MEDIUM finding #1).

## Benefit Linkage

**Metric moved:** Guardrail/standard visibility in the web UI (indirectly — reliability of the view this metric measures, not a new capability)
**How:** `nfr-profile.md`'s own Performance NFR row states "a reasonable fetch timeout (e.g. 10s) with a clear timeout error state is expected" — this story closes the gap between that stated NFR and the actual shipped adapter, which currently has no timeout at all.

## Architecture Constraints

- **Fix in the shared helper, not each caller.** `fetchGithubContentsResponse` (`artefact-fetcher.js`) is the single, already-extracted GitHub Contents API request function both `fetchArtefact` and `realFetchRepoPath` call through — adding the timeout here fixes both call paths at once, consistent with this feature's own established pattern of extending the shared helper rather than duplicating logic per caller (see `standards/governance/delivery-patterns.md`, `wugs-s1`'s own extraction of this exact helper).
- **Reuse the existing `ArtefactFetchError` class, don't invent a new error type.** `_fetchGuardrailsSectionPiece` (products.js) already catches any non-`ArtefactNotFoundError` and surfaces `.message` directly to the end user — a timeout is exactly this class of error (a network-layer failure, not a 404), so it should throw the same `ArtefactFetchError` with a clear, specific message, requiring zero changes to any calling code.
- **Timeout value: 10 seconds default**, matching `nfr-profile.md`'s own stated example value. Implemented via `AbortController` (the standard Node/browser mechanism for this), not a manual `Promise.race` timer pattern.
- **Timeout must be overridable for tests** — a test suite cannot wait 10 real seconds per test case; the timeout duration must be a parameter (with the 10s default), not a hardcoded constant.

## Dependencies

- **Upstream:** `wugs-s1` (created `fetchGithubContentsResponse`, the function this story extends — already merged).
- **Downstream:** None — every caller of `fetchArtefact`/`realFetchRepoPath`/`fetchRepoPath` inherits the fix automatically, with no changes needed at any call site.

## Acceptance Criteria

**AC1:** Given a GitHub API request that does not respond within the timeout window, When the timeout elapses, Then the request is aborted and an `ArtefactFetchError` is thrown with a clear message stating the request timed out (not a generic network-error message).

**AC2:** Given a GitHub API request that responds normally within the timeout window, When the response arrives, Then behaviour is unchanged from today — the timeout mechanism introduces no observable difference for the normal, fast-response case.

**AC3:** Given the timeout fires, When the abort happens, Then no dangling timer is left running past the request's own completion (whichever finishes first — a normal response or the timeout — the other's own cleanup must not fire late or leak).

**AC4:** Given both existing callers (`fetchArtefact` and `realFetchRepoPath`), When either is exercised through the shared helper, Then both inherit the timeout behaviour identically, with no per-caller special-casing.

## Out of Scope

- **A configurable/environment-variable-driven timeout value** — a fixed 10s constant for MVP, matching `nfr-profile.md`'s own stated example; making it configurable is a future enhancement if 10s proves wrong in practice, not built here.
- **A retry-on-timeout mechanism** — a clean timeout error is the whole scope; automatic retry is a distinct, larger feature not requested by the NFR gap this story closes.
- **Any change to `fetchRepoPath`'s own D37 injectable-adapter wiring** (`setFetchRepoPath`/`getFetchRepoPath`) — untouched; this story only changes `realFetchRepoPath`'s and `fetchArtefact`'s shared underlying request helper.

## NFRs

- **Performance:** This story IS the NFR fix — closes `nfr-profile.md`'s own already-recorded Performance gap.
- **Security:** None new.
- **Accessibility:** None new — the resulting error message is already surfaced through `_fetchGuardrailsSectionPiece`'s existing error-state rendering, unchanged by this story.
- **Audit:** None new.

## Complexity Rating

**Rating:** 1 — a scoped addition to one already-extracted shared helper function, no new call sites, no new error-handling paths at the UI layer.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic (Medium, per epic-1-repo-backed-viewing.md)
