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

- Must preserve `das-s1`'s existing AC4 behaviour (a genuinely repo-less product still skips the commit cleanly, with no error) exactly as-is — only the AC2 path (a failure that should block and error) is being fixed.
- No new npm dependencies.
- Fix lives in the existing stage-completion call site in `src/web-ui/routes/journey.js` (~lines 2424–2460) and/or `src/web-ui/adapters/export-data-source.js` (`ownerRepoForFeature`) / `src/web-ui/adapters/artefact-commit-writer.js` (`commitArtefact`), whichever is confirmed as the actual root cause during implementation.

## Dependencies

- **Upstream:** None.
- **Downstream:** Story acdg-s2 (durability signal) implements after this story — its "failed" event should log the real failure reason found and fixed here, so the signal accurately reflects the corrected guard's actual behaviour.

## Acceptance Criteria

**AC1:** Given a feature is linked to a repo-connected product and `ownerRepoForFeature` resolves successfully, When the subsequent `commitArtefact` call fails (e.g. a simulated API or network error), Then `completeStage()` is NOT called, the session's stage is NOT marked done, and the operator receives the existing `artefact-commit-failed` error response. **[Revised after /review 1-M1]:** implementation must first read `artefact-commit-writer.js`'s own internals (not yet read this session) to confirm `commitArtefact` genuinely throws on a real GitHub API failure rather than swallowing it internally — if the call site's existing try/catch already correctly handles a thrown error (as `journey.js`'s own code appears to show), this AC is a regression-protection test confirming that behaviour is preserved, not evidence of a new fix; if `commitArtefact` is found to swallow failures internally, the actual fix belongs in `artefact-commit-writer.js` and this AC's scope expands accordingly. State which case applies in the implementation plan before writing the test.

**AC2:** Given a feature is linked to a repo-connected product but `ownerRepoForFeature` throws while resolving despite the link being valid (e.g. a simulated transient resolution error), When a stage is completed, Then the operator receives a clear, actionable error and `completeStage()` is NOT called — distinguishing this case from AC3's genuine no-repo skip. This is the fix if this path is confirmed as the root cause: today this failure is caught and silently treated identically to "no connected repo."

**AC2a [Added after /review 1-M2]:** Given a feature is linked to a repo-connected product but `ownerRepoForFeature` returns a falsy value *without throwing* (a resolution-logic bug, not a resolution exception — e.g. a query that runs successfully but returns no match for a genuinely-linked product), When a stage is completed, Then the operator receives a clear, actionable error and `completeStage()` is NOT called — this case is structurally distinct from AC2 (no exception is ever thrown, so no catch block is entered) and from AC3 (the product genuinely IS linked), and today's code (`if (_dasOwnerRepo)` evaluating false) takes AC3's skip-path silently in this case too. Equally consistent with the discovery's own open assumption about which failure sub-mode actually caused `new-feature-af17f555`'s gap.

**AC3:** Given a feature's product genuinely has no connected repo (`ownerRepoForFeature` legitimately returns no link), When a stage is completed, Then the commit is skipped and `completeStage()` proceeds normally with no error shown to the operator — identical behaviour to before this story (AC4's original design, regression-protected against this story's own change).

**AC4:** Given the specific failure mode that caused `new-feature-af17f555`'s 8 artefacts to go missing is confirmed during implementation, When the fix is applied, Then a dedicated regression test exists that would have caught that specific failure mode, referenced by name in this story's verification script and DoD. [Testability: accepted as a process-verification AC — confirms the specific historical bug is now regression-tested, not a pure behavioural assertion; kept because the discovery's own evidence trail depends on this being traceable, not just "a fix shipped."]

## Out of Scope

- Retroactive backfill of `new-feature-af17f555`'s own 8 already-missing artefacts — a separate, one-off data-repair task, not part of this story.
- Building a generic retry/backoff mechanism for commit failures — this story restores the fail-loud contract; it does not add fail-and-automatically-retry behaviour.

## NFRs

- **Performance:** The fix must not add meaningful latency to the stage-completion path — the existing resolve-then-commit sequence already runs synchronously before `completeStage()`; root-causing and fixing should not introduce additional round-trips.
- **Security:** None identified beyond `das-s1`'s existing security posture (uses `req.session.accessToken`; no new credential handling introduced).
- **Accessibility:** Not applicable — server-side/API-only change, no UI surface.
- **Audit:** The existing error response is this story's own audit signal; the durable structured-log signal is added in Story acdg-s2.

## Complexity Rating

**Rating:** 2
**Scope stability:** Stable

## Definition of Ready Pre-check

<!-- Populated at /definition-of-ready. -->
