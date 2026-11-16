## Story: Answer 404 for a commit preview or commit with nothing to commit, and say where the file really goes

**Epic reference:** None - short-track (bounded defect found by a production sweep and a staging write test, per CLAUDE.md's short-track path)
**Discovery reference:** None - short-track skips discovery. Evidence: sweep 3 on production (2026-11-16): `GET /skills/discovery/sessions/<unknown>/commit-preview` answered 200 and rendered the "Review & commit" page with a commit form for an empty artefact; staging write test (same day): the page also says "This will create <path> on a new branch" although `commitArtefact` (`scm-adapter.js`) sends no branch, so GitHub's Contents API writes the file straight to the repository's default branch. From the code: posting that form for an unknown session sends `commitArtefact('', '', ...)` to `PUT .../contents/` with the user's token, which answers an error and shows a 500 page (a production 5xx and a GitHub issue).
**Benefit-metric reference:** None - short-track skips benefit-metric; benefit linkage stated below
**Domain:** [web-ui]

## User Story

As **a person committing a skill session's artefact**,
I want **the commit page to refuse when there is nothing to commit, and to tell me truthfully where the file will go**,
So that **I never see a commit form for nothing, never trigger an outward GitHub call with an empty path, and know the file lands on the default branch**.

## Benefit Linkage

**Metric moved:** None formal. Removes a misleading page, an outward call with an empty path (which would end as a production 500 and an issue), and a false claim in the interface ("on a new branch").
**How:** a new checked preview function (`htmlGetCommitPreviewChecked`) wired into `server.js` answers 404 when the session is unknown, has no drafted artefact, or belongs to a different skill than the URL; `htmlCommitSession` uses the same check so the commit POST refuses before any GitHub call; the two lines of copy in `views/commit-view.js` are corrected.

## Architecture Constraints

- **`htmlGetPreview` stays exactly as it is.** Existing tests pin its behaviour for a fresh or unknown session (`tests/check-dsq4-section-artefact-assembly.js` T5.1 and T5.7: empty strings). The new function is separate and is what the server wires.
- **Same lookup as the other session routes:** the checked function reads the session with `_getSessionOrRestore` (memory, then Redis), so a session restored after a restart is found rather than shown as empty.
- **404 through the existing error path:** the handlers already render `err.status` with the message in an error page; the new function throws an error with `status: 404` and the fixed message `Nothing to commit for this session`. No handler changes.
- **The commit path refuses first:** `htmlCommitSession` runs the same check before `commitArtefact`; with nothing to commit, no request is made to GitHub.
- **Copy only in the view:** "This will create `<path>` on a new branch." becomes "This will add `<path>` to the repository's default branch." and "The artefact is on a new branch." becomes "The artefact has been committed." No test asserts the old text (searched).
- **Not changed:** the commit itself (it still writes to the default branch; adding a branch or pull request flow is a product decision, not this story), the result page, the CSRF guard, the viewer guard, the credits logic.
- **Architecture guardrails (`.github/architecture-guardrails.md`):** ADR-011 (artefact-first) satisfied by this chain; ADR-012 (adapter use stays in the adapter; the route only checks its own input) respected; ADR-025 (tenant isolation) not engaged beyond the existing session lookup. Zero new npm dependencies.

## Dependencies

- **Upstream:** wuce.25 (the preview and commit pages), scr-s1 (the result page and its wiring), tvl-s1 and sub-s1 (the same family of route checks). All merged.
- **Related:** `pws-s1` (its wiring smoke test lists this route as a known defect until this lands).

## Acceptance Criteria

**AC1:** Given the real server wiring and a signed-in request, When `GET /skills/<skill>/sessions/<unknown id>/commit-preview` is made, Then the response is 404 with a page saying `Nothing to commit for this session`, and the page contains no commit form.

**AC2:** Given a session that exists but has no drafted artefact (no path or no content), or whose skill differs from the skill in the URL, When its commit preview is requested, Then the same 404 is returned.

**AC3:** Given a session with a drafted artefact, When its commit preview is requested, Then it answers 200 with the file path and a form, the text says the file will be added to the repository's default branch, and "new branch" appears nowhere on the preview or the result page (the result page says "The artefact has been committed.").

**AC4:** Given an unknown or empty session, When a signed-in `POST /api/skills/<skill>/sessions/<id>/commit` with a valid CSRF token is made, Then the response is 404 and no request at all is made to GitHub.

**AC5:** Given a session with a drafted artefact, When the same POST is made with GitHub stubbed to succeed, Then exactly one `PUT` to the contents API for that session's path is made and the response is a 303 to the result page, exactly as before.

**AC6:** Given the existing tests, When run, Then `htmlGetPreview` still returns empty strings for an unknown session (dsq4 T5.1 and T5.7), and every existing preview, commit and result test passes unchanged.

**AC7 (live, after deploy):** Given a signed-in session on staging and then production, When `GET .../sessions/00000000-0000-0000-0000-000000000000/commit-preview` is requested, Then it answers 404 with the "Nothing to commit" page. Evidence class `production-observed`; read-only.

## Out of Scope

- Making the commit use a branch or open a pull request, or changing which repository it writes to.
- The result page and its wiring (scr-s1), the CSRF and viewer guards, credits.
- Checking that the committing user owns the session (the same gap exists on every skills route; a separate story).

## NFRs

- **Security:** with nothing to commit, no outward request is made; the error text is fixed and nothing from the URL is echoed.
- **Reliability:** the checked function throws only a 404 error for missing or mismatched sessions and never an unexpected error type for odd input.
- **Performance:** one session lookup, as before.

## Complexity Rating

**Rating:** 1 - one new function, one wiring change, one extra check, two copy lines. **Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified
- [ ] Human oversight level confirmed from parent epic - N/A, short-track, no parent epic
