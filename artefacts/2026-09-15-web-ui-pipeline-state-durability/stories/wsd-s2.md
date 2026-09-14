## Story: GitHub-API-backed pipeline-state writer for the production container, wired by environment, with failure visibility

**Epic reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/epics/web-ui-pipeline-state-durability.md
**Discovery reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/discovery.md
**Benefit-metric reference:** artefacts/2026-09-15-web-ui-pipeline-state-durability/benefit-metric.md
**Domain:** web-ui

## User Story

As **the operator moving a feature between the production web UI and Claude Code CLI on the same repo**,
I want **a stage completion in the web UI to durably update `.github/pipeline-state.json` on `origin/master`, and to know if that write genuinely failed**,
So that **`/workflow` and every other CLI-driven governance tool see the feature's real progress without any manual reconstruction**.

## Benefit Linkage

Pipeline-state accuracy for web-UI-originated features — this story delivers the actual fix: baseline 0% (confirmed absent for two independent features this session), target 100%. Also delivers Silent-failure elimination for governed state writes — baseline 0 (today's failure is 100% invisible), target: an exhausted-retry failure is captured somewhere queryable.

## Architecture Constraints

New module `src/web-ui/adapters/pipeline-state-github-writer.js`, implementing the SAME `pipelineStateWriter(featureSlug, storyId, stateUpdate)` signature `src/web-ui/routes/journey.js:2577` already calls — no call-site change. Mechanics:
1. GET `/repos/:owner/:repo/contents/.github/pipeline-state.json` via `fetch`, authenticated with `req.session.accessToken` (same credential, same auth-header shape as `artefact-commit-writer.js`'s `realCommitArtefact` — do not introduce a second auth mechanism). Capture the returned `sha` AND base64-decoded content together, from this ONE request — do not separately re-fetch sha later, since `artefact-commit-writer.js`'s own `realCommitArtefact` does its own internal GET-for-sha, and chaining two independent GETs (one for content, one from a reused `commitArtefact` call for sha) would let a concurrent write land between them, silently defeating the whole point of optimistic concurrency. This story's PUT must use the exact `sha` obtained from THIS module's own single GET — do not call `commitArtefact`/`realCommitArtefact` for the PUT step; write the PUT directly in this new module (small, ~15 lines, matching `realCommitArtefact`'s own PUT construction) rather than reusing a function whose sha-handling contract is wrong for this use case.
2. `JSON.parse` the decoded content.
3. Apply feature-level fields exactly as `pipeline-state-writer.js`'s existing local-fs implementation already does (lines 116-121 of that file: `featureLevelKeys.forEach(...)`, `feature[key] = stateUpdate[key]`) — reuse/mirror this logic, including `pipeline-state-writer.js`'s own `validateStateUpdate()` (prStatus/dorStatus/health enum checks) run first, unchanged.
4. Apply story-level fields via `wsd-s1`'s newly-extracted `applyAdvance(state, featureSlug, storyId, rawFields)` — `stateUpdate`'s story-level keys (`dorStatus`, `prStatus`, `prUrl`, `stage`, `updatedAt`, matching `pipeline-state-writer.js`'s own existing `storyLevelKeys` list) converted to the `field=value` string-array shape `applyAdvance` expects.
5. `JSON.stringify` the mutated state, base64-encode, PUT with the `sha` from step 1.
6. On a 409/422 response (sha mismatch — someone else wrote first): retry from step 1, up to 3 total attempts, with a short backoff between attempts (150ms, then 400ms) — mirrors the existing `sstr-s1` retry-on-pre-first-chunk-failure precedent's backoff shape rather than inventing a new one.
7. On final exhaustion (still conflicting after 3 attempts, or any other unrecoverable error e.g. network failure, non-2xx/409 response): capture a PostHog event (reuse the existing `posthog-server.js` capture mechanism, same pattern as `ltd-s1`'s `$ai_is_error`/`$ai_error` fields) identifying the feature/story and the failure reason — in ADDITION TO (not instead of) the existing `console.error({ event: 'pipeline_state_write_failed', ... })` log line in `journey.js`, which stays as-is.

`server.js` wiring: at startup, alongside the existing `setPipelineStateWriter(pipelineStateWriterFactory(repoRootForAdapter))` call (`server.js:1503`), select between the existing local-fs factory and this new GitHub-API factory based on the SAME `isRealCheckout` signal `pipeline-state-writer.js` already computes internally — expose that check (or an equivalent) so `server.js` can choose the right implementation without duplicating the `.git`-existence check in two places.

## Dependencies

- **Upstream:** wsd-s1 (`applyAdvance()` must exist before this story's story-level field handling can be implemented).
- **Downstream:** None known.

## Acceptance Criteria

**AC1:** Given a mocked Contents API (matching AC3/AC4's own mocking approach, and this repo's established `check-s6.1-*`/`check-pla-s2-*` convention of mocking `https.request`/`fetch` rather than making a live external call in the automated suite) returning a fixture state object and a `sha`, When `pipelineStateWriter(featureSlug, storyId, stateUpdate)` is called with a `stateUpdate` matching the shape `journey.js`'s existing construction at lines 2564-2577 produces, Then the captured PUT body's decoded content contains the correct feature-level and/or story-level field changes applied to the fixture state, and the captured `sha` matches the one the mocked GET returned.

**AC2:** Given a local dev / CLI worktree environment (`.git` present), When the same code path runs, Then the EXISTING local-fs writer is still selected and used — this story does not change behaviour for the case that already worked.

**AC3:** Given two concurrent calls to the GitHub-API writer for the same feature (simulated in a test via two sequential `stateUpdate` calls against a mocked Contents API where the second call's GET returns a `sha` that the first call's PUT has already superseded), When the second call's PUT receives a 409, Then it retries (re-GET, re-apply its own field update, re-PUT) and succeeds on the retry, with both writers' field changes present in the final state — not one silently overwriting the other.

**AC4:** Given all 3 retry attempts are exhausted (mocked to always return 409, or to fail with a network error), When the write ultimately fails, Then a PostHog capture event is emitted identifying the feature slug, story id, and failure reason, in addition to the existing `journey.js` console.error log line (unchanged).

**AC5:** Given `wsd-s1`'s `applyAdvance()` returns a validation error (e.g. an invalid enum value in `stateUpdate`), When this writer processes that result, Then no PUT is attempted at all, and the error is surfaced the same way an exhausted-retry failure is (AC4) — a validation failure must not be silently swallowed either.

## Out of Scope

- Real-time (push) alerting on a write failure — the PostHog capture is queryable after the fact, not real-time-alerted; see design.md's Open Questions.
- Reducing `pipeline-state.json`'s overall file size or splitting it into smaller files.
- Any change to `journey.js`'s existing `stateUpdate` construction logic (lines 2564-2577) — this story only changes which writer implementation receives that already-constructed object.
- Backfilling historical features.

## NFRs

- **Concurrency safety:** the primary correctness bar — verified by AC3.
- **Observability:** a failure must be findable — verified by AC4/AC5.
- **Performance:** the write stays off the user-visible response path (fire-and-forget, matching `journey.js`'s existing `try/catch` wrapping at lines 2563-2581, unchanged) — a slower network-bound write is not user-visible.
- **Security:** no new credential — reuses `req.session.accessToken`, the same identity already used for artefact commits. No server-level write token introduced.

## Complexity Rating

**Rating:** 2 — the individual mechanics (GitHub Contents API GET/PUT, retry-on-409, PostHog capture) are each already proven elsewhere in this codebase; the real complexity is composing them correctly (see the Architecture Constraints note on why chaining two independent GETs would be wrong).
**Scope stability:** Stable.

## Definition of Ready Pre-check

- [x] ACs are testable without ambiguity
- [x] Out of scope is declared (not "N/A")
- [x] Benefit linkage is written (not a technical dependency description)
- [x] Complexity rated
- [x] No dependency on an incomplete upstream story — depends on wsd-s1, sequenced correctly
- [x] NFRs identified (or explicitly "None")
- [x] Human oversight level confirmed from parent epic — Medium (epic-level)
