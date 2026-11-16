## Story: Show the "Committed" result page after a skill session commit, instead of a server error

**Epic reference:** None - short-track (bounded defect found by a production sweep, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: `artefacts/2026-11-15-production-error-sweep/reference/error-sweep-2-findings.md`, finding 1. On production `GET /skills/:name/sessions/:id/result` answered 500 for every request ("Adapter not wired: getCommitResult"), and `handlePostCommitHtml` redirects (303) to it after every successful commit, so the commit flow ended on an error page.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **a person who has just committed a skill session's artefact**,
I want **to land on the "Committed" page that shows the file, a link to view it and the next skill**,
So that **I can see the commit worked and carry on, instead of reading an error after a successful commit**.

## Benefit Linkage

**Metric moved:** None formal - short-track convention. Fixes the last step of the skill-session commit flow; today a successful commit looks like a failure and every such request opens a GitHub issue through the error chain.
**How:** the page handler `handleGetResultHtml` calls the injectable adapter `getCommitResult`, whose default stub throws by design (Injectable adapter rule D37) but which was never wired in `server.js`; only `setGetCommitPreview` and `setCommitSession` were. This story adds the missing production wiring (the D37 wiring task and its behavioural test) and a small function that reads the result from the session the commit already used.

## Architecture Constraints

- **Injectable adapter rule (D37), all four parts:** the stub default keeps throwing (unchanged); the wiring is its own named task in `server.js`, inside the same block that wires `setGetCommitPreview` and `setCommitSession`; the wiring test asserts behaviour (a committed session shows its own artefact path and link, two different sessions show two different results), not just that a function was assigned.
- **No new store.** The commit result is derived from `session.artefactPath` (set by the draft step and already used by the commit) plus a `committedAt` stamp that the commit handler sets after a successful `_commitSession`. The result is: `artefactPath`; `featureSlug` = the second path segment; `artefactType` = the rest of the path after the slug with `.md` removed (for example `dor/psh-s1-dor`, or `discovery`), which is exactly the shape `/artefact/:slug/:type` links use (adlr-s1).
- **Not committed means not found.** A session that is unknown, or has no `committedAt`, or has no `artefactPath`, answers 404 with the existing error page and message "Commit result not found"; it never shows "Committed."
- **No pull request URL and no next skill for now:** `prUrl` and `nextSkillName` stay `null` (the renderer already omits both); nothing in the commit path records them today, and inventing them is out of scope.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-012 respected; ADR-025 (tenant isolation): the lookup is by session id exactly as `getCommitPreview` already is, so no new exposure; recorded in decisions.
- **Zero new npm dependencies.**

## Dependencies

- **Upstream:** wuce.25 (the result page and the adapter), ecg-s1, ecf-s1. All merged.
- **Related:** the ecf-s1 live check uses this route as its test trigger; this story must not be deployed until that check is done (operator-held).

## Acceptance Criteria

**AC1:** Given the real `server.js` with skill adapters wired, When `skillsAdapter.getCommitResult` is called for a committed session, Then it returns that session's `artefactPath`, `featureSlug` and `artefactType` (not the "Adapter not wired" error).

**AC2:** Given a committed session whose path is `artefacts/2026-01-01-example/dor/ex-s1-dor.md`, When the result is derived, Then `featureSlug` is `2026-01-01-example` and `artefactType` is `dor/ex-s1-dor`; for `artefacts/2026-01-01-example/discovery.md` they are `2026-01-01-example` and `discovery`.

**AC3:** Given a signed-in request to `/skills/:name/sessions/:id/result` for a committed session, When the page is requested, Then it answers 200 with the "Committed." page containing the artefact path and a link `/artefact/<slug>/<type>`; and two different committed sessions show two different paths.

**AC4:** Given a session that is unknown, or drafted but not committed, or lacks an artefact path, When its result page is requested, Then it answers 404 with "Commit result not found" and never shows "Committed."; no error report is sent.

**AC5:** Given a successful commit through `POST /api/skills/:name/sessions/:id/commit` (with the commit adapter stubbed), When the 303 redirect is followed, Then the result page answers 200 for that session (the flow now ends on the success page).

**AC6:** Given the adapter is not wired (as in a test that does not wire it), When `getCommitResult` is called, Then it still throws "Adapter not wired: getCommitResult" (D37 stub unchanged).

**AC7 (live, after deploy and after the ecf-s1 live check):** Given a signed-in production session, When a skill session is committed (operator action) or an existing committed session's result URL is opened, Then the "Committed." page shows. Evidence class `production-observed`; operator-performed because it writes a real commit.

## Out of Scope

- Recording or showing a pull request URL; the "Next up" skill suggestion.
- Persisting `committedAt` beyond whatever the session store already persists (a result page opened after a restart that lost it shows the 404 above).
- Changing the commit preview or commit handlers other than stamping `committedAt`.
- The JSON API commit route (`handleCommitArtefact`).

## NFRs

- **Security:** no error text beyond the fixed message; the artefact path shown is the one the committer already saw on the preview page.
- **Reliability:** the derivation never throws on a malformed path; it answers 404 instead.
- **Performance:** in-memory read (or one Redis read for a restored session).

## Complexity Rating

**Rating:** 1 - one function, one wiring line, one stamp.
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
