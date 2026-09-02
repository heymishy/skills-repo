## Story: Fix the Silent Artefact-Commit Failure in Stage-Completion (AC2 Guard)

**Epic reference:** artefacts/2026-09-01-artefact-commit-durability-gap/epics/stage-completion-artefact-durability.md
**Discovery reference:** artefacts/2026-09-01-artefact-commit-durability-gap/discovery.md
**Benefit-metric reference:** artefacts/2026-09-01-artefact-commit-durability-gap/benefit-metric.md

## User Story

As a **Developer / engineer**,
I want a stage-completion artefact-commit failure — once a repo link genuinely resolves — to block `completeStage()` and show me a clear, actionable error,
So that I never end up with a stage that shows "completed" while its artefact silently has no durable backing.

## Benefit Linkage

**Metric moved:** AC2 Guard Correctness
**How:** Restoring `das-s1`'s own AC2 contract means a real commit failure can no longer pass through as a silent, indistinguishable "no connected repo" skip — verified by regression tests covering all 3 outcome paths, not by inference.

## Architecture Constraints

- Must preserve `das-s1`'s existing AC4 behaviour (a genuinely repo-less product — `journey.productId` unset — still skips the commit cleanly, with no error) exactly as-is.
- No new npm dependencies.
- **[Confirmed 2026-09-02]** Fix lives entirely in the existing stage-completion call site in `src/web-ui/routes/journey.js` (~lines 2424–2460) — a `journey.productId` truthy-check inside the existing `catch (_dasResolveErr)` block. Does NOT require any change to `export-data-source.js`, `artefact-commit-writer.js`, or `journey-store.js`/`journey-store-pg.js` — `journey.productId` is already a fully-wired, correctly-persisted-and-reloaded field (confirmed by reading `handlePostProductFeature` in `products.js`, `saveJourney`/`listJourneys` in `journey-store-pg.js`, and `dfr-s1`'s own prior reload fix).

## Dependencies

- **Upstream:** None.
- **Downstream:** Story acdg-s2 (durability signal) implements after this story — its "failed" event should log the real failure reason found and fixed here, so the signal accurately reflects the corrected guard's actual behaviour.

## Acceptance Criteria

**AC1:** Given a feature is linked to a repo-connected product and `ownerRepoForFeature` resolves successfully, When the subsequent `commitArtefact` call fails (e.g. a simulated API or network error), Then `completeStage()` is NOT called, the session's stage is NOT marked done, and the operator receives the existing `artefact-commit-failed` error response. **[Revised after /review 1-M1]:** implementation must first read `artefact-commit-writer.js`'s own internals (not yet read this session) to confirm `commitArtefact` genuinely throws on a real GitHub API failure rather than swallowing it internally — if the call site's existing try/catch already correctly handles a thrown error (as `journey.js`'s own code appears to show), this AC is a regression-protection test confirming that behaviour is preserved, not evidence of a new fix; if `commitArtefact` is found to swallow failures internally, the actual fix belongs in `artefact-commit-writer.js` and this AC's scope expands accordingly. State which case applies in the implementation plan before writing the test.

**[SUPERSEDED 2026-09-02 — see decisions.md]** The original AC2 and AC2a below were written before either `export-data-source.js` or `artefact-commit-writer.js` was read in full. Root-cause investigation during `/branch-setup` confirmed: (a) `ownerRepoForFeature` never returns falsy without throwing — AC2a describes an unreachable code path; (b) `ownerRepoForFeature` throws the identical `ExportNotFoundError` for 4 structurally different underlying reasons by design (a deliberate privacy choice from its original export-feature use case), so AC2 vs AC3 cannot be distinguished by error type alone, as originally assumed. Kept inline, struck through in spirit rather than deleted, per this repo's traceability standard. Replaced by AC2-revised and AC3-revised below.

~~**AC2:** Given a feature is linked to a repo-connected product but `ownerRepoForFeature` throws while resolving despite the link being valid (e.g. a simulated transient resolution error), When a stage is completed, Then the operator receives a clear, actionable error and `completeStage()` is NOT called — distinguishing this case from AC3's genuine no-repo skip.~~

~~**AC2a:** Given a feature is linked to a repo-connected product but `ownerRepoForFeature` returns a falsy value *without throwing*, When a stage is completed, Then the operator receives a clear, actionable error and `completeStage()` is NOT called.~~

**AC2-revised [2026-09-02]:** Given a stage completes for a journey whose in-memory record has `journey.productId` set (the system genuinely believes this feature is linked to a product — confirmed as a real, already-wired field: set at creation time by `handlePostProductFeature` in `products.js`, persisted to the `journeys.product_id` column by `saveJourney`, and correctly restored on reload by `listJourneys` per `dfr-s1`'s own fix), When `ownerRepoForFeature` throws for any reason, Then this is treated as a genuine anomaly — the operator receives a clear, actionable error and `completeStage()` is NOT called, rather than silently skipping. This directly targets the confirmed real incident: `new-feature-af17f555` was created via this exact path (its slug format, `new-feature-` + an 8-char journey-ID prefix, is an exact match), meaning `journey.productId` was almost certainly set — yet `ownerRepoForFeature`'s own separate Postgres query (against the `journeys` table, by `feature_slug`) failed to resolve a valid owner/repo, and the failure was silently swallowed as if the product had never been linked at all.

**AC3-revised [2026-09-02]:** Given a stage completes for a journey whose in-memory record has NO `productId` set (genuinely never linked to a product), When `ownerRepoForFeature` throws, Then the commit is skipped and `completeStage()` proceeds normally with no error shown to the operator — unchanged behaviour, regression-protected against this story's own change.

**AC4:** Given AC2-revised's mechanism is implemented, When the fix is applied, Then a dedicated regression test demonstrates that a journey with `productId` set but a failing `ownerRepoForFeature` call now blocks and errors — directly reproducing the shape of `new-feature-af17f555`'s own historical incident, referenced by name in this story's verification script and DoD. [Testability: accepted as a process-verification AC — confirms the specific historical bug is now regression-tested, not a pure behavioural assertion.]

## Out of Scope

- Retroactive backfill of `new-feature-af17f555`'s own 8 already-missing artefacts — a separate, one-off data-repair task, not part of this story.
- Building a generic retry/backoff mechanism for commit failures — this story restores the fail-loud contract; it does not add fail-and-automatically-retry behaviour.

## NFRs

- **Performance:** The fix must not add meaningful latency to the stage-completion path — the existing resolve-then-commit sequence already runs synchronously before `completeStage()`; root-causing and fixing should not introduce additional round-trips.
- **Security:** None identified beyond `das-s1`'s existing security posture (uses `req.session.accessToken`; no new credential handling introduced).
- **Accessibility:** Not applicable — server-side/API-only change, no UI surface.
- **Audit:** The existing error response is this story's own audit signal; the durable structured-log signal is added in Story acdg-s2.

## Complexity Rating

**Rating:** 1 [Revised 2026-09-02, was 2 — the root-cause ambiguity that justified a 2 rating is now fully resolved; the fix is a single, well-understood conditional check with no remaining unknowns]
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
