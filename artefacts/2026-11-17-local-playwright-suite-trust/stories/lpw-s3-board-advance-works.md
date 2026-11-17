## Story: The board's Advance button and drag-to-advance work, and a failed advance is never reported as success

**Epic reference:** None - short-track (a product defect found by the `lpw-s2` browser-test review, GitHub issue #1140, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: issue #1140 (reproduction output, code references, regression date), `artefacts/2026-11-17-local-playwright-suite-trust/decisions.md` ("CORRECTION (lpw-s2)"), `evidence/staging-capability-walk.md`.
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui] [kanban] [test]
**Source issues:** #1140 (Advance does nothing), #1141 (every card "not ready" after a restart or deploy)

## User Story

As **an operator moving features along the kanban board**,
I want **the Advance button and dragging a ready card to its next column to actually move the feature, and a clear message when it cannot**,
So that **the board is trustworthy: today both actions do nothing and the server says they worked**.

## Benefit Linkage

**Metric moved:** None formal. The board's two write actions have been silently broken since 2026-08-24 (the CSRF guard added to gate-confirm in rcfc-s1 rejects the board script's token-less POST; the advance handler turns that 403 into `{advanced: true}`), and no error is raised anywhere.
**How:** send the session's CSRF token with the advance request, map the gate-confirm response honestly, report failures to PostHog, give the test server what it needs to complete an advance, and bring the board's browser specs (which already encode the intended behaviour) into the core.

## Architecture Constraints

- **CSRF stays enforced.** The fix sends the token; it does not exempt the route or weaken `csrfGuard`. The token comes from the page the board is rendered on (a session-scoped token, as the other forms use); it is never read from a cookie by the script.
- **Honest status mapping.** `handlePostBoardAdvance` treats only a 2xx or 3xx gate-confirm response as success. 401 and 403 are returned as they are (with an error body the board can show); any other unexpected status is returned as 502 `advance-failed`. The existing 400, 404, 422 and 5xx handling and bodies are unchanged.
- **Failures are observable.** A failed advance calls the existing PostHog capture (event `board_advance_failed` with the status and a journey id prefix, never the token or full session). No new dependency.
- **Test server only for the commit stub.** In `NODE_ENV=test` the artefact commit that gate-confirm needs is satisfied by a test-mode adapter; production wiring and the real commit path are untouched. D37: a stub must throw if used outside test mode, the wiring is a separate task in `server.js`, and a test asserts the behaviour (the card ends in the next column), not that a function was assigned.
- **Design system.** The failure message reuses the board's existing `alert` and wording style; no new component, so no token change.
- **Architecture guardrails:** ADR-011 (artefact-first) satisfied by this chain; platform change policy followed (pull request).

## Dependencies

- **Upstream:** `lpw-s2` (matrix, core job), issue #1140.
- **Downstream:** `lpw-s4` (pods), `lpw-s5` (model sessions).

## Acceptance Criteria

**AC1:** Given the board page (product, org and tenant scope), When it renders, Then its script sends the page's CSRF token with every advance request, both from the Advance button and from drag-to-advance, and a test asserts the rendered script and the request body carry the token.

**AC2:** Given `POST /api/board/journey/:id/advance`, When the delegated gate-confirm response is 401 or 403, Then the endpoint answers the same status with an error body (not `advanced: true`); any other status outside 2xx and 3xx that is not already handled answers 502 `advance-failed`; a success still answers 200 `{advanced: true, stage: <the new stage>}`; tests cover 403, 302-to-sign-in, 303 and an unexpected status.

**AC3:** Given a failed advance, When the board receives the error, Then it shows the real reason through the board's existing failure message (an `alert`, as the board already does for a validation failure) and the card stays in place; and a `board_advance_failed` capture is recorded server-side with the status (a test with a fake PostHog asserts the event and that no token or full session id is in it).

**AC4:** Given the test server, When a seeded, ready card is advanced with a valid token, Then the artefact commit step succeeds through a test-mode adapter and the journey's stage moves to the next stage (`discovery` to `benefit-metric`); the adapter throws if called outside `NODE_ENV=test`; a test asserts the card is in the next column afterwards.

**AC5:** Given the board specs, When they run alone and in the whole suite, Then `s1.1` AC1, `s3.1` AC1 and `s3.2` AC3 pass (the card is in the next column), `psh-s6` is rewritten to sign in and use a real product (it currently uses the unauthenticated `test()` and a product that does not exist), and `s1.1`, `s1.2`, `s3.1`, `s3.2` and `psh-s6` either join lane `core` after passing twice in a row in the core job, or stay quarantined with a corrected reason (the order-dependence, if it remains, named).

**AC6:** Given the capability matrix, When this story ends, Then the `ep3-s1-regression` reason is corrected to the real cause (issue #1042: regress-back lands on the wrong stage's session; it is not a model-session timeout) and the matrix guard still passes.

**AC7 (live, after merge and deploy):** Given staging, When a ready feature's Advance is clicked on the board, Then the card moves to the next column and a not-ready card has no Advance control; recorded in the Definition of Done (the operator or the agent with the operator's go-ahead, since it changes a staging journey).

**AC8 (added after the operator's staging check, issue #1141):** Given a completed session that is persisted but not in memory (as after a restart or deploy), When the board renders or `handlePostBoardAdvance` runs, Then the session's completion is read the way the chat page reads it (restored from the database, in one batched read for the whole board, not one query per card), the card shows ready and Advance is enabled; a test clears the in-memory store with a persisted completed session and asserts both.

## Out of Scope

- The regress-back defect (#1042), feature creation (`frsr-s1`, `pnfc-s1`), `bmau-s1` and any order-dependence outside the board specs; pods (`lpw-s4`); model sessions (`lpw-s5`).
- Any change to gate-confirm's own CSRF guard or to what a gate-confirm does to a journey.
- Making the core a required check (the operator's ruleset change).

## NFRs

- **Security:** CSRF protection is unchanged in strength; the token is never logged or sent to PostHog.
- **Reliability:** an advance either moves the card or says why not; there is no path that answers success without a move.
- **Observability:** every failed advance is visible in PostHog with its status.

## Complexity Rating

**Rating:** 2 - the cause is shown and the fix is small, but the test-mode commit step and the order-dependence of the board specs in the whole suite are not yet understood.
**Scope stability:** Unstable - the whole-suite failures of `s1.2`, `s3.1` AC2 and AC3 and `s3.2` AC1 and AC2 (they pass alone) may need their own cause found.
