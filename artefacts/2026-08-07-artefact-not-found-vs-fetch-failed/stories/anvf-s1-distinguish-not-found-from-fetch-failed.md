## Story: Don't show "could not be retrieved" for an artefact that simply doesn't exist yet

**Epic reference:** None — short-track (bounded bug fix)
**Discovery reference:** None — short-track skips discovery; scope is the code-derived gap below
**Benefit-metric reference:** None — short-track skips benefit-metric; benefit linkage stated directly below
**Domain:** [web-ui] — this story's scope is entirely `src/web-ui/routes/journey.js`

## User Story

As an **operator resuming a newly-created feature that hasn't completed any stage yet**,
I want to **see the ordinary "No artefact content found" placeholder, not an alarming "could not be retrieved from local storage or the connected repository" message**,
So that **I can tell the difference between "nothing exists here yet, that's normal" and "something is actually broken" — and don't lose confidence in the connected-repo fallback feature over a false alarm**.

## Benefit Linkage

**Metric moved:** Direct usability/correctness defect fix (short-track, no formal benefit-metric artefact) — confirmed via live testing on 2026-08-07: resuming a brand-new feature (SSE stream working correctly) showed the artefact panel's failure message even though nothing had actually failed — the feature genuinely has no artefact yet.

**How:** Direct source inspection of `src/web-ui/adapters/artefact-fetcher.js`'s `fetchArtefact()` confirms it already throws two distinct, named error types: `ArtefactNotFoundError` (a real GitHub 404 — the artefact genuinely does not exist) and `ArtefactFetchError` (a network error or non-404 API failure — a real problem). `src/web-ui/routes/journey.js`'s `handleGetJourneyStageView` (das-s1's git-fallback, merged 2026-08-07 as part of PR #674) catches both identically and sets `_dasFetchFailed = true` for either, so a brand-new feature's expected 404 (nothing has ever been committed for this feature yet) is indistinguishable from a real fetch failure (auth expired, rate-limited, network down) — always showing the scarier message once a repo is connected, even in the completely normal "hasn't started yet" case.

## Architecture Constraints

- **Reuse existing named error classes:** `artefact-fetcher.js` already exports `ArtefactNotFoundError` and `ArtefactFetchError` for exactly this purpose — this story imports and checks `instanceof` against them, it does not invent new error types or string-matching on error messages.
- **No D37/adapter concern:** this is a call-site catch-block fix, not a new adapter.

## Dependencies

- **Upstream:** `das-s1` (`2026-08-06-durable-artefact-storage`) — this story fixes a gap in `das-s1`'s already-merged code (PR #674, commit `9312e335`). `[External: das-s1 merged and lives in a different feature folder — confirmed by operator on 2026-08-07]`
- **Downstream:** None.

## Acceptance Criteria

**AC1:** Given a brand-new feature with no stage ever completed (no local artefact file, no artefact ever committed to the connected repo), When an operator views or resumes that feature's stage page, Then the artefact panel shows "No artefact content found." — the same message shown when no repo is connected at all — not the "could not be retrieved" message.

**AC2:** Given a feature whose connected repo IS reachable but the actual GitHub Contents API call fails for a real reason (a simulated network error or a non-404 HTTP error response), When an operator views that feature's stage page, Then the artefact panel shows "Artefact content could not be retrieved from local storage or the connected repository." — this story does not remove that message, it only narrows when it fires.

**AC3:** Given the fix distinguishes `ArtefactNotFoundError` from `ArtefactFetchError`, When either error type is thrown by `fetchArtefact()`, Then the distinction is made via `instanceof` checks against the already-exported error classes — not by inspecting `error.message` text or any other string-matching approach.

## Out of Scope

- Any change to `fetchArtefact()`'s own error-throwing logic in `artefact-fetcher.js` — it already correctly distinguishes the two cases; this story only fixes the call site that collapses that distinction.
- The `handlePostGateConfirm` (dual-write/commit) code path — it uses `artefact-commit-writer.js`, a different function for a different direction (write, not read-fallback), and does not have this conflation issue.

## NFRs

- **Performance:** No change — same number of calls, just a different branch on the existing catch.
- **Security:** None identified — no new user input or credential handling.
- **Accessibility:** Not applicable — text-only message change.
- **Audit:** Not applicable.

## Complexity Rating

**Rating:** 1 — a single catch-block fix using already-exported error classes.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [ ] ACs are testable without ambiguity
- [ ] Out of scope is declared (not "N/A")
- [ ] Benefit linkage is written (not a technical dependency description)
- [ ] Complexity rated
- [ ] No dependency on an incomplete upstream story
- [ ] NFRs identified (or explicitly "None")
- [ ] Human oversight level confirmed from parent epic
