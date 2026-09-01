## Story: Move das-s1's GitHub-commit dual-write to the point where a stage actually first completes

**Epic reference:** None — short-track (no epic; single bounded story)
**Discovery reference:** artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md
**Benefit-metric reference:** None — short-track
**Domain:** [web-ui]

## User Story

As a **real SaaS operator running a delivery pipeline through the hosted product's live web UI**,
I want to **have each completed stage's artefact actually committed to my product's connected GitHub repo, as `das-s1` already promises**,
So that **the durability guarantee I'm relying on ("Resume conversation" survives a redeploy) is real, not silently unreachable.**

## Bug found (confirmed root cause, this session's investigation)

`das-s1` (PR #674, 2026-08-07) added a dual-write: on stage completion, commit the artefact to the product's connected repo via `ownerRepoForFeature` + `artefact-commit-writer.js`'s GitHub Contents API, in addition to the existing local-disk write — specifically so a redeploy (which wipes the container's local disk) doesn't lose completed-stage content. Its own AC2 requires a commit failure to block completion and surface a clear error to the operator; its own AC4 requires a repo-less product to proceed unchanged, silently.

That block lives exclusively in `src/web-ui/routes/journey.js`'s `handlePostGateConfirm`, gated by `if (!session._stageDone) { ... }`.

For a real, live web-UI chat session, `session._stageDone` is already set to `true` **earlier** — inside `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml` (`skills.js:5259-5260`), the moment the assistant's turn produces an artefact block. That handler auto-saves the artefact to local disk, attempts a purely local `git add`/`git commit` (`_skillTurnGitCommit`, explicitly documented as expected to fail silently — "git is not installed in Fly.io containers" — and even on success never pushes to any remote), sets `session._stageDone = true`, and calls `_journeyStore.completeStage(...)` directly.

By the time the operator clicks "Continue" and `handlePostGateConfirm` runs, `session._stageDone` is already `true`, so `das-s1`'s entire GitHub-commit block is skipped — no commit attempted, no error, nothing. This is not specific to any one feature: it affects every stage of every journey completed through the live web UI chat flow, for every product, regardless of whether that product has a connected repo. `das-s1`'s own test suite (`tests/check-das-s1-commit-artefact-git-fallback.js`) calls `handlePostGateConfirm` directly against a hand-built session object that never sets `_stageDone` — so it has passed the whole time without ever exercising the real precondition.

Confirmed live: a real production feature (`new-feature-af17f555`, correctly linked to a product with a connected repo) has 8 completed stages, none of which exist in that repo on GitHub (`gh api repos/.../contents/artefacts/new-feature-af17f555` returns 404; no PR, no branch, confirmed after `git fetch --all`).

## Architecture Constraints

- Edit `src/web-ui/routes/skills.js`'s `handlePostTurnStreamHtml` only — insert the GitHub-commit dual-write at the point the stage genuinely first completes, using the exact same `ownerRepoForFeature`/`commitArtefact` calls `journey.js` already uses (no new mechanism, no duplicated logic — same functions, same contract, moved to where it's actually reachable).
- Preserve `das-s1`'s own AC1/AC2/AC4 contract exactly, translated to this streaming context:
  - **AC1** (dual-write): the commit happens in addition to, not instead of, the existing local-disk write already performed earlier in this same function.
  - **AC2** (commit failure blocks completion): on a commit failure, `session._stageDone` must stay unset (so a retry re-attempts), and the operator must see a clear, actionable SSE `error` event — the SSE-appropriate equivalent of `journey.js`'s HTTP 502, matching the same pattern already used earlier in this same function for the path-traversal and disk-save-failure guards (`res.write({error: ...}); res.end(); return;`).
  - **AC4** (repo-less product unchanged): any `ownerRepoForFeature` resolution failure (no linked product, no connected repo, no DB pool wired) is caught and treated identically to "no connected repo" — proceed unchanged, no error, no regression for repo-less products.
- Scope the new commit attempt to **first completion only** (`!_existingStageEntry`, the same check this function already computes) — matching `das-s1`'s own "Out of Scope: committing edited/re-saved content," which this story does not change.
- Do **not** remove or modify `journey.js`'s existing `handlePostGateConfirm` block — leave it in place as a harmless, now-genuinely-redundant safety net for any other completion path that reaches gate-confirm with `_stageDone` still unset. Do not touch `journey.js` at all in this story.
- Do **not** touch `_skillTurnGitCommit`/`stis-s1`'s local git-commit attempt — it stays as documented best-effort local behavior, unrelated to this story's GitHub-API fix.
- Do **not** attempt to retroactively commit any already-completed stage's artefacts (e.g. `af17f555`'s 8 existing artefacts) — that is a separate, already-flagged manual action item, out of scope for this code fix.

## Dependencies

- **Upstream:** `das-s1` (`artifacts/2026-08-06-durable-artefact-storage/`) — this story reuses its exact adapters (`ownerRepoForFeature`, `commitArtefact`) unchanged; does not modify either.
- **Downstream:** None. Does not overlap `lpmf-s1`, `wsap-s1`, or `srar-s1` (all merged/mergeable independently; touches a different, non-overlapping region of the same file as `wsap-s1`/`srar-s1`).

## Acceptance Criteria

**AC1:** Given a journey-linked SSE turn produces an artefact for a product with a connected repo, When the turn completes (the same point `session._stageDone` is set today), Then the artefact is committed via `commitArtefact` to that product's repo, in addition to the existing local-disk write — using the same `artefacts/<slug>/<stage>.md` path convention already used for the local write.

**AC2:** Given the same scenario as AC1, When the GitHub commit fails (adapter throws), Then `session._stageDone` remains unset (not `true`), `_journeyStore.completeStage` is never called, the client receives an SSE `error` event with an actionable message, and the stream ends — a retry of the same turn can re-attempt the commit.

**AC3:** Given a product with no connected repo (or `ownerRepoForFeature` resolution fails for any reason — no linked product, no DB pool wired), When the turn completes, Then behaviour is unchanged from today: local-disk write proceeds, `session._stageDone` is set, `completeStage` runs, no error is surfaced, no commit is attempted.

**AC4:** Given a stage that already has a `completedStages` entry (a revision, not a first completion), When the turn completes, Then no GitHub commit is attempted (matching `das-s1`'s own explicit out-of-scope exclusion for edited/re-saved content) — behaviour for this branch is unchanged from before this story.

**AC5:** Given `tests/check-das-s1-commit-artefact-git-fallback.js` (unmodified), When it runs against the changed code, Then all of its existing tests still pass — this story adds an equivalent commit at an earlier point without touching `journey.js`'s own mechanism at all.

**AC6:** Given `tests/check-sstr-s1-sse-retry-on-pre-first-chunk-failure.js`, `tests/check-ssdo-s1-sse-client-disconnect-logging.js`, `tests/check-wsap-s1-story-scoped-artefact-paths.js`, and `tests/check-srar-s1-idempotent-turn-reconnect.js` (all unmodified), When they run against the changed code, Then all still pass — this story adds a new guarded block to the same function those stories already touched this session, without altering any of their own logic.

## Out of Scope

- Retroactively committing `af17f555`'s (or any other feature's) already-completed-but-uncommitted artefacts — a separate manual action, not a code change.
- Adding a distinguishing log line for "repo-less by design" vs "resolution failed" (raised in the discovery artefact as a further observability improvement) — this story fixes the actual unreachability; a follow-on observability story can be considered separately if still wanted once this fix is live.
- Any change to `journey.js`, `_skillTurnGitCommit`/`stis-s1`, or the git-fallback read path (`handleGetJourneyStageView`) — all untouched.
- `htmlSubmitTurn` (the non-streaming handler) — confirmed via code search to have no equivalent `_stageDone`/journey-completion logic at all; the live browser UI only calls the streaming endpoint.

## NFRs

- **Performance:** Matches `das-s1`'s own NFR — the added GitHub API round-trip adds no more than ~2 seconds to turn-completion latency (same adapter, same expected latency profile as `journey.js`'s existing call).
- **Security:** Commit author is always the operator's own `req.session.accessToken`-derived identity, never a service account — matching `das-s1`'s own NFR and this same file's existing pattern for every other GitHub-API call.
- **Accessibility:** Not applicable.
- **Audit:** The GitHub commit itself is the audit trail, matching `das-s1`'s own NFR.

## Complexity Rating

**Rating:** 2 — root cause is fully confirmed and the fix is a well-scoped code move/reorder reusing existing, already-tested adapters; the main risk is precise placement within an already-large, heavily-touched function, mitigated by full regression coverage against every other story that touched this same function this session.
**Scope stability:** Stable

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description) — short-track, N/A; discovery reference provided instead
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — short-track, operator confirmed directly in-session, explicitly requesting the fix ("Yes please") after the root cause was traced and confirmed
